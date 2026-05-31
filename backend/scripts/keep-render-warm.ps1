# Keeps Render careers-api awake during outreach hours (default 8:00–22:00).
# Usage (from repo root):
#   .\backend\scripts\keep-render-warm.ps1
#   .\backend\scripts\keep-render-warm.ps1 -TenantSlug noetic -StartHour 8 -EndHour 22

param(
  [string]$TenantSlug = "noetic",
  [int]$StartHour = 8,
  [int]$EndHour = 22,
  [int]$IntervalMinutes = 10
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib/outreach-env.ps1")

$backendDir = Get-BackendDir
$logFile = Join-Path $backendDir ".render-keepalive.log"
$apiUrl = Get-RenderApiUrl
$probeUrl = Get-TenantProbeUrl -ApiUrl $apiUrl -TenantSlug $TenantSlug

function Write-KeepaliveLog {
  param([string]$Message)
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
  Add-Content -Path $logFile -Value $line -Encoding utf8
  Write-Host $line
}

Write-KeepaliveLog "Keep-alive started (tenant=$TenantSlug, window=${StartHour}:00-${EndHour}:00, interval=${IntervalMinutes}m)"

while ($true) {
  $now = Get-Date
  $hour = $now.Hour

  if ($hour -ge $EndHour) {
    Write-KeepaliveLog "Past end hour ($EndHour:00); stopping keep-alive."
    exit 0
  }

  if ($hour -lt $StartHour) {
    $wakeAt = $now.Date.AddHours($StartHour)
    $sleepSeconds = [Math]::Max(30, [int]($wakeAt - $now).TotalSeconds)
    Write-KeepaliveLog "Before start hour ($StartHour:00); sleeping ${sleepSeconds}s…"
    Start-Sleep -Seconds $sleepSeconds
    continue
  }

  try {
    $response = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 60
    if ($response.StatusCode -eq 200) {
      Write-KeepaliveLog "Ping OK"
    } else {
      Write-KeepaliveLog "Ping HTTP $($response.StatusCode)"
    }
  } catch {
    Write-KeepaliveLog "Ping failed: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds ($IntervalMinutes * 60)
}
