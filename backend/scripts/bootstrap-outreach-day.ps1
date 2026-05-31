# Morning bootstrap for prospect demo URLs.
# 1. Try Render API (preferred stable URL)
# 2. If Render is unavailable, start local backend + Cloudflare tunnel and sync Vercel
#
# Usage (from repo root):
#   .\backend\scripts\bootstrap-outreach-day.ps1
#   .\backend\scripts\bootstrap-outreach-day.ps1 -TenantSlug noetic

param(
  [string]$TenantSlug = "noetic"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$backendDir = Join-Path $repoRoot "backend"
$logFile = Join-Path $backendDir ".outreach-bootstrap.log"

function Write-BootstrapLog {
  param([string]$Message)
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
  Add-Content -Path $logFile -Value $line -Encoding utf8
  Write-Host $line
}

function Test-LocalBackend {
  try {
    $url = "http://127.0.0.1:3000/tenants/current?tenant=$([uri]::EscapeDataString($TenantSlug))"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

Write-BootstrapLog "Bootstrap started for tenant '$TenantSlug'"

& (Join-Path $PSScriptRoot "warm-render-api.ps1") -TenantSlug $TenantSlug -TimeoutSeconds 120
if ($LASTEXITCODE -eq 0) {
  Write-BootstrapLog "Render API ready; syncing Vercel to Render"
  Push-Location $backendDir
  try {
    npm run ensure-outreach-production -- --slug $TenantSlug
    Write-BootstrapLog "Vercel synced to Render"
    exit 0
  } finally {
    Pop-Location
  }
}

Write-BootstrapLog "Render unavailable; starting interim local API + tunnel"

if (-not (Test-LocalBackend)) {
  Write-BootstrapLog "Starting backend on port 3000"
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendDir'; npm run start:dev"
  ) | Out-Null

  $deadline = (Get-Date).AddSeconds(45)
  while ((Get-Date) -lt $deadline -and -not (Test-LocalBackend)) {
    Start-Sleep -Seconds 3
  }

  if (-not (Test-LocalBackend)) {
    Write-BootstrapLog "Backend did not become ready on port 3000"
    exit 1
  }
}

Write-BootstrapLog "Starting Cloudflare tunnel"
$tunnelJob = Start-Job -ScriptBlock {
  npx --yes cloudflared@latest tunnel --url http://127.0.0.1:3000 2>&1
}

$tunnelUrl = $null
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline -and -not $tunnelUrl) {
  Start-Sleep -Seconds 2
  $out = Receive-Job $tunnelJob -ErrorAction SilentlyContinue | Out-String
  if ($out -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
    $tunnelUrl = $Matches[0]
  }
}

if (-not $tunnelUrl) {
  Write-BootstrapLog "Could not detect Cloudflare tunnel URL"
  exit 1
}

$cacheFile = Join-Path $backendDir ".outreach-api-url"
Set-Content -Path $cacheFile -Value $tunnelUrl -Encoding utf8
Write-BootstrapLog "Tunnel URL: $tunnelUrl"

Push-Location $backendDir
try {
  $env:OUTREACH_API_URL = $tunnelUrl
  npm run ensure-outreach-production -- --slug $TenantSlug --skip-render
  if ($LASTEXITCODE -ne 0) {
    Write-BootstrapLog "Vercel sync failed"
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}

Write-BootstrapLog "Interim tunnel synced to Vercel. Resume Render in dashboard for a stable URL."
exit 0
