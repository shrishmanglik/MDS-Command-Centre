import { parseVoiceTranscript } from "./lib/voice-gate.mjs";

const cases = [
  ["hello operator", "IGNORED_NO_WAKE_WORD"],
  ["Midas", "WAKE_ONLY"],
  ["Midas open inbox", "DRAFT_READY"],
  ["Midas note Review the paired client workspace", "DRAFT_READY"],
  ["Midas execute powershell", "BLOCKED_FORBIDDEN_VOICE_ACTION"],
  ["Midas approve pairing", "BLOCKED_FORBIDDEN_VOICE_ACTION"],
  ["Midas order lunch", "NEEDS_OPERATOR_REVIEW"],
];
for (const [transcript, expected] of cases) {
  const result = parseVoiceTranscript(transcript);
  if (result.status !== expected || result.executionAllowed !== false) throw new Error(`Voice gate failed for ${transcript}: ${result.status}`);
}
console.log("Voice gate checks passed.");
