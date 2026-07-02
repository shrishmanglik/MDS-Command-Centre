Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $AppRoot

node scripts/refresh-war-room-data.mjs

$port = 5178
$url = "http://127.0.0.1:$port/"
$logDir = Join-Path $AppRoot "output"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logPath = Join-Path $logDir "desktop-server.log"
$errorLogPath = Join-Path $logDir "desktop-server-error.log"

$server = Start-Process -FilePath "node" -ArgumentList @("scripts/serve.mjs", "--root", ".", "--port", "$port") -WorkingDirectory $AppRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $logPath -RedirectStandardError $errorLogPath

try {
  $ready = $false
  foreach ($attempt in 1..30) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $ready) {
    throw "Command Centre local server did not become ready at $url"
  }

  $browserCandidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  )
  $browser = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $browser) {
    Start-Process $url | Out-Null
  } else {
    Start-Process -FilePath $browser -ArgumentList @("--app=$url", "--new-window", "--user-data-dir=$logDir\browser-profile") | Out-Null
  }

  Write-Host "MDS Command Centre desktop shell opened at $url"
  Write-Host "Server process id: $($server.Id)"
  Write-Host "Log: $logPath"
} catch {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
  throw
}
