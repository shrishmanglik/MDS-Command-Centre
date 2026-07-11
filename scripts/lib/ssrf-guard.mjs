import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const BLOCKED_HOST = /(^|\.)(localhost|local|internal|home|lan|corp|intranet)$/i;
const METADATA_HOSTS = new Set(["metadata", "metadata.google.internal", "instance-data", "metadata.azure.internal"]);
const IPV4_RANGES = [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",4],["240.0.0.0",4]];

function ipv4Number(address) { return address.split(".").reduce((value, octet) => ((value << 8) | Number(octet)) >>> 0, 0); }
function inCidr(address, network, prefix) { const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; return (ipv4Number(address) & mask) === (ipv4Number(network) & mask); }
export function isBlockedIp(address) {
  const value = String(address || "").toLowerCase().split("%")[0];
  const family = net.isIP(value);
  if (!family) return true;
  if (family === 4) return IPV4_RANGES.some(([network, prefix]) => inCidr(value, network, prefix));
  if (value.startsWith("::ffff:")) { const mapped = value.slice(7); return net.isIP(mapped) !== 4 || isBlockedIp(mapped); }
  return value === "::" || value === "::1" || /^f[cd]/.test(value) || /^fe[89ab]/.test(value) || value.startsWith("ff") || value.startsWith("2001:db8:");
}

export async function validateOutboundUrl(rawUrl, resolver = (hostname) => dns.lookup(hostname, { all: true, verbatim: true })) {
  let url;
  try { url = new URL(String(rawUrl || "")); } catch { throw new Error("BLOCKED_INVALID_URL"); }
  if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error("BLOCKED_SCHEME");
  if (url.username || url.password) throw new Error("BLOCKED_USERINFO");
  if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) throw new Error("BLOCKED_PORT");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || METADATA_HOSTS.has(hostname) || BLOCKED_HOST.test(hostname) || (!hostname.includes(".") && !net.isIP(hostname))) throw new Error("BLOCKED_HOSTNAME");
  const literalFamily = net.isIP(hostname);
  const addresses = literalFamily ? [{ address: hostname, family: literalFamily }] : await resolver(hostname);
  if (!Array.isArray(addresses) || !addresses.length) throw new Error("BLOCKED_DNS_EMPTY");
  if (addresses.some((record) => isBlockedIp(record.address))) throw new Error("BLOCKED_PRIVATE_OR_RESERVED_ADDRESS");
  return { url, hostname, addresses: addresses.map((record) => ({ address: record.address, family: Number(record.family) })) };
}

function pinnedLookup(records) { return (_hostname, options, callback) => { const record = records[0]; if (options?.all) callback(null, records); else callback(null, record.address, record.family); }; }
export async function guardedRequest(rawUrl, { method = "GET", redirects = 0, resolver } = {}) {
  if (!new Set(["GET", "HEAD"]).has(method)) throw new Error("BLOCKED_METHOD");
  if (redirects > MAX_REDIRECTS) throw new Error("BLOCKED_REDIRECT_LIMIT");
  const validated = await validateOutboundUrl(rawUrl, resolver);
  const transport = validated.url.protocol === "https:" ? https : http;
  const result = await new Promise((resolve, reject) => {
    const request = transport.request(validated.url, { method, lookup: pinnedLookup(validated.addresses), timeout: TIMEOUT_MS, headers: { "Accept": "application/json,text/plain,text/html;q=0.8", "Accept-Encoding": "identity", "User-Agent": "MDS-Command-Centre-Guard/1.0", "Connection": "close" }, agent: false }, (response) => {
      const location = response.headers.location;
      if (location && response.statusCode >= 300 && response.statusCode < 400) { response.resume(); resolve({ redirect: new URL(location, validated.url).toString() }); return; }
      const chunks = []; let size = 0;
      response.on("data", (chunk) => { size += chunk.length; if (size > MAX_BYTES) { request.destroy(new Error("BLOCKED_RESPONSE_SIZE")); return; } chunks.push(chunk); });
      response.on("end", () => resolve({ statusCode: response.statusCode, contentType: String(response.headers["content-type"] || "UNKNOWN").slice(0, 120), body: Buffer.concat(chunks).toString("utf8"), finalUrl: validated.url.toString(), resolvedAddress: validated.addresses[0].address }));
    });
    request.on("timeout", () => request.destroy(new Error("BLOCKED_TIMEOUT")));
    request.on("error", reject);
    request.end();
  });
  if (result.redirect) return guardedRequest(result.redirect, { method, redirects: redirects + 1, resolver });
  return { ...result, bytes: Buffer.byteLength(result.body || ""), redirects, credentialsForwarded: false, proxyEnvironmentUsed: false, policy: "PUBLIC_HTTP_GET_HEAD_ONLY" };
}
