Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $AppRoot
& node "scripts/daemon.mjs" "--root" "." "--port" "5178"
exit $LASTEXITCODE
