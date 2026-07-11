param([switch]$DiagnosticsOnly, [int]$Port = 5178)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$HealthUrl = "http://127.0.0.1:$Port/api/health"
$RuntimeDir = Join-Path $AppRoot "output/daemon"
$TrayLog = Join-Path $RuntimeDir "tray-controller.log"
$script:DaemonProcess = $null
if ($Port -lt 1024 -or $Port -gt 65535) { throw "Port must be between 1024 and 65535." }
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Write-TrayLog([string]$Message) {
  $bounded = $Message.Substring(0, [Math]::Min($Message.Length, 500))
  Add-Content -LiteralPath $TrayLog -Value "$(Get-Date -Format o) $bounded" -Encoding UTF8
}

function Test-ServerHealth {
  try {
    $response = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 2
    if ($response.api -eq $true) { return "HEALTHY" }
    return "DEGRADED"
  } catch { return "STOPPED" }
}

function Get-Diagnostics {
  $node = Get-Command node -ErrorAction SilentlyContinue
  [ordered]@{
    schemaVersion = "mds.command-centre.tray-diagnostics.v1"
    status = Test-ServerHealth
    healthUrl = $HealthUrl
    nodePresent = [bool]$node
    daemonScriptPresent = Test-Path -LiteralPath (Join-Path $AppRoot "scripts/daemon.mjs") -PathType Leaf
    serverScriptPresent = Test-Path -LiteralPath (Join-Path $AppRoot "scripts/serve.mjs") -PathType Leaf
    sessionOwnsDaemon = [bool]($script:DaemonProcess -and -not $script:DaemonProcess.HasExited)
    providerState = "UNKNOWN"
    authority = "D-local loopback process diagnostics only. No provider, deploy, payment, auth, or external-channel state is proved."
    checkedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

if ($DiagnosticsOnly) { Get-Diagnostics | ConvertTo-Json -Depth 4; exit 0 }

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Text = "MDS Command Centre - UNKNOWN"
$tray.Visible = $true
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$statusItem = New-Object System.Windows.Forms.ToolStripMenuItem("Status: UNKNOWN")
$statusItem.Enabled = $false
$startItem = New-Object System.Windows.Forms.ToolStripMenuItem("Start daemon")
$stopItem = New-Object System.Windows.Forms.ToolStripMenuItem("Stop daemon")
$restartItem = New-Object System.Windows.Forms.ToolStripMenuItem("Restart daemon")
$openItem = New-Object System.Windows.Forms.ToolStripMenuItem("Open Command Centre")
$diagnosticsItem = New-Object System.Windows.Forms.ToolStripMenuItem("Run diagnostics")
$logsItem = New-Object System.Windows.Forms.ToolStripMenuItem("Open local logs")
$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem("Exit tray")
[void]$menu.Items.AddRange(@($statusItem, (New-Object System.Windows.Forms.ToolStripSeparator), $startItem, $stopItem, $restartItem, $openItem, $diagnosticsItem, $logsItem, (New-Object System.Windows.Forms.ToolStripSeparator), $exitItem))
$tray.ContextMenuStrip = $menu

function Update-TrayStatus {
  $health = Test-ServerHealth
  $owned = [bool]($script:DaemonProcess -and -not $script:DaemonProcess.HasExited)
  $statusItem.Text = "Status: $health"
  $tray.Text = "MDS Command Centre - $health"
  $startItem.Enabled = $health -eq "STOPPED"
  $stopItem.Enabled = $owned
  $restartItem.Enabled = $owned
  $tray.Icon = if ($health -eq "HEALTHY") { [System.Drawing.SystemIcons]::Information } elseif ($health -eq "DEGRADED") { [System.Drawing.SystemIcons]::Warning } else { [System.Drawing.SystemIcons]::Application }
}

function Start-Daemon {
  if ((Test-ServerHealth) -ne "STOPPED") {
    $tray.ShowBalloonTip(2500, "MDS Command Centre", "A loopback server already owns port $Port. This tray will monitor it but not claim process ownership.", [System.Windows.Forms.ToolTipIcon]::Info)
    return
  }
  $script:DaemonProcess = Start-Process -FilePath "node" -ArgumentList @("scripts/daemon.mjs", "--root", ".", "--port", "$Port") -WorkingDirectory $AppRoot -WindowStyle Hidden -PassThru
  Write-TrayLog "Started session-owned daemon pid=$($script:DaemonProcess.Id) port=$Port"
  Start-Sleep -Milliseconds 750
  Update-TrayStatus
}

function Stop-Daemon {
  if (-not $script:DaemonProcess -or $script:DaemonProcess.HasExited) {
    $tray.ShowBalloonTip(2000, "MDS Command Centre", "Stop blocked: this tray does not own the running daemon process.", [System.Windows.Forms.ToolTipIcon]::Warning)
    return
  }
  $pidToStop = $script:DaemonProcess.Id
  Stop-Process -Id $pidToStop
  [void]$script:DaemonProcess.WaitForExit(6000)
  if (-not $script:DaemonProcess.HasExited) { Stop-Process -Id $pidToStop -Force }
  Write-TrayLog "Stopped session-owned daemon pid=$pidToStop"
  $script:DaemonProcess = $null
  Update-TrayStatus
}

$startItem.Add_Click({ Start-Daemon })
$stopItem.Add_Click({ Stop-Daemon })
$restartItem.Add_Click({ Stop-Daemon; Start-Sleep -Milliseconds 500; Start-Daemon })
$openItem.Add_Click({ Start-Process "http://127.0.0.1:$Port/?view=today" | Out-Null })
$diagnosticsItem.Add_Click({
  $diagnostics = Get-Diagnostics
  Write-TrayLog ("Diagnostics: " + ($diagnostics | ConvertTo-Json -Compress))
  $tray.ShowBalloonTip(3500, "MDS diagnostics", "Status $($diagnostics.status). Node=$($diagnostics.nodePresent). Provider state UNKNOWN.", [System.Windows.Forms.ToolTipIcon]::Info)
})
$logsItem.Add_Click({ Start-Process explorer.exe -ArgumentList @($RuntimeDir) | Out-Null })
$tray.Add_DoubleClick({ Start-Process "http://127.0.0.1:$Port/?view=today" | Out-Null })
$context = New-Object System.Windows.Forms.ApplicationContext
$exitItem.Add_Click({
  if ($script:DaemonProcess -and -not $script:DaemonProcess.HasExited) { Stop-Daemon }
  $tray.Visible = $false
  $tray.Dispose()
  $context.ExitThread()
})
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000
$timer.Add_Tick({ Update-TrayStatus })
$timer.Start()
Update-TrayStatus
Write-TrayLog "Tray controller started port=$Port"
[System.Windows.Forms.Application]::Run($context)
$timer.Dispose()
