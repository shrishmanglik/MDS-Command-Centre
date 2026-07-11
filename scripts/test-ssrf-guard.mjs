import assert from "node:assert/strict";
import { isBlockedIp, validateOutboundUrl } from "./lib/ssrf-guard.mjs";
for (const ip of ["127.0.0.1","10.0.0.1","172.16.0.1","192.168.1.1","169.254.169.254","100.64.0.1","0.0.0.0","::1","fc00::1","fe80::1","::ffff:127.0.0.1","2001:db8::1"]) assert.equal(isBlockedIp(ip), true, ip);
for (const ip of ["1.1.1.1","8.8.8.8","2606:4700:4700::1111"]) assert.equal(isBlockedIp(ip), false, ip);
const publicResolver = async () => [{ address: "93.184.216.34", family: 4 }];
assert.equal((await validateOutboundUrl("https://example.com/path", publicResolver)).hostname, "example.com");
for (const url of ["http://127.0.0.1","http://2130706433","http://0x7f000001","http://[::1]","http://metadata.google.internal/latest","http://user:pass@example.com","file:///etc/passwd","http://example.com:8080"]) await assert.rejects(() => validateOutboundUrl(url, publicResolver));
await assert.rejects(() => validateOutboundUrl("https://rebind.example", async () => [{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]), /BLOCKED_PRIVATE/);
console.log("SSRF guard checks passed.");
