---
schemaVersion: mds.checklist-workflow.v1
id: local-proof-handoff
title: Local proof handoff
authority: LOCAL_PLAN_ONLY
---
Read fully and follow:
1. [ ] Confirm the governed scope
   - Action: Read the named work order and list its allowed files.
   - Verify: Every proposed target is present in the work order allowlist.
   - Stop if: The work order, target repository, or authority boundary is ambiguous.
2. [ ] Inspect the local implementation
   - Action: Compare each requested symbol and behavior with the local source.
   - Verify: Each acceptance condition has a file and symbol evidence reference.
   - Stop if: Evidence would require reading secret-shaped files or provider credentials.
3. [ ] Record the proof handoff
   - Action: Report passed checks, failed checks, and unresolved unknowns separately.
   - Verify: Local, committed, and provider-owned claims remain distinct.
   - Stop if: Any live-state claim lacks evidence from its owning authority.
