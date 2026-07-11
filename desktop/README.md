# Desktop Shell

Sprint 001 uses a conservative desktop wrapper:

Run `npm run tray` for the Windows system-tray controller. Run `npm run tray:diagnostics` for a headless readiness record suitable for local checks. The tray owns only daemon processes it starts during the same tray session.

1. Refresh the local War Room snapshot.
2. Start the Vite dev server on localhost.
3. Open Microsoft Edge or Chrome in `--app=` mode.

This avoids packaging, installers, code signing, auto-update, and OS integration until the Command Centre product spine proves useful locally.
