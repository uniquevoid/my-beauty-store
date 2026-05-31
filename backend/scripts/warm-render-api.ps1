# Warms the Render careers-api before sharing demo links.
# Usage (from repo root):
#   .\backend\scripts\warm-render-api.ps1
#   .\backend\scripts\warm-render-api.ps1 -TenantSlug noetic

param(
  [string]$TenantSlug = "noetic",
  [int]$IntervalSeconds = 10,
  [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib/outreach-env.ps1")

$apiUrl = Get-RenderApiUrl
$probeUrl = Get-TenantProbeUrl -ApiUrl $apiUrl -TenantSlug $TenantSlug
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

Write-Host "Warming Render API: $probeUrl"

while ((Get-Date) -lt $deadline) {
  try {
    $response = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 60
    if ($response.StatusCode -eq 200) {
      $body = $response.Content
      if ($body -match '"slug"\s*:\s*"') {
        Write-Host "Render API ready for tenant '$TenantSlug'."
        exit 0
      }
      Write-Host "  HTTP 200 but unexpected body; retrying…"
    } else {
      Write-Host "  HTTP $($response.StatusCode); retrying in ${IntervalSeconds}s…"
    }
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match '503|502|504|timeout|timed out|no disponible|unavailable') {
      Write-Host "  Cold start / unavailable; retrying in ${IntervalSeconds}s…"
    } else {
      Write-Host "  $msg; retrying in ${IntervalSeconds}s…"
    }
  }
  Start-Sleep -Seconds $IntervalSeconds
}

Write-Host "Render API did not become ready within ${TimeoutSeconds}s."
Write-Host "If the service is suspended, resume it in the Render dashboard or run setup-render-production.ps1"
exit 1
