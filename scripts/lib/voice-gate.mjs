const WAKE_WORD = "midas";
const VIEW_COMMANDS = new Map([
  ["open today", "today"],
  ["open inbox", "inbox"],
  ["open workspaces", "workspaces"],
  ["open health", "health"],
  ["open runs", "runs"],
]);
const FORBIDDEN_PATTERN = /\b(run code|execute|shell|powershell|terminal|deploy|push|payment|charge|refund|send message|email|token|secret|credential|approve pairing)\b/i;

export function parseVoiceTranscript(transcript) {
  const raw = String(transcript || "").trim().slice(0, 2000);
  const normalized = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const wakeIndex = normalized.indexOf(WAKE_WORD);
  if (wakeIndex < 0) return { wakeDetected: false, status: "IGNORED_NO_WAKE_WORD", transcript: raw, command: "", action: "NONE", executionAllowed: false };
  const command = normalized.slice(wakeIndex + WAKE_WORD.length).trim();
  if (!command) return { wakeDetected: true, status: "WAKE_ONLY", transcript: raw, command, action: "NONE", executionAllowed: false };
  if (FORBIDDEN_PATTERN.test(command)) return { wakeDetected: true, status: "BLOCKED_FORBIDDEN_VOICE_ACTION", transcript: raw, command, action: "BLOCKED", executionAllowed: false };
  if (VIEW_COMMANDS.has(command)) return { wakeDetected: true, status: "DRAFT_READY", transcript: raw, command, action: "OPEN_VIEW", targetView: VIEW_COMMANDS.get(command), executionAllowed: false };
  if (/^(note|draft)\s+/.test(command)) return { wakeDetected: true, status: "DRAFT_READY", transcript: raw, command, action: "WORKSPACE_NOTE_DRAFT", note: command.replace(/^(note|draft)\s+/, "").slice(0, 1000), executionAllowed: false };
  return { wakeDetected: true, status: "NEEDS_OPERATOR_REVIEW", transcript: raw, command, action: "UNRECOGNIZED", executionAllowed: false };
}

export { WAKE_WORD };
