# Version-Control Baseline

Created: 2026-07-02 (WO-GH-01, irreversible-loss prevention per F5-01 P0-1)

- Why this repo exists: the Command Centre app and its snapshot generator feed CEO decisions and had no version control; the root repo ignores Products/ so a nested repo is the only workable model.
- Authority status: local git history only. NO REMOTE exists; GitHub authority does not apply until approved remote + push.
- No live/provider claim: warRoomSnapshot.json and boards render D-local evidence only.
- Intentionally excluded: node_modules, dist, output/ (runtime logs), test-results, env-value files.
- Later hygiene decision (not this WO): src/data/warRoomSnapshot.json is generated data committed in this baseline for loss protection; F5-01 recommends eventually ignoring it with a committed generator + sample fixture.
