# Starts local API + Cloudflare quick tunnel and prints the outreach check URL.
# Use until Render careers-api is deployed (see docs/PRODUCTION_URL_CHECKLIST.md).
#
# Usage (from repo root):
#   .\backend\scripts\start-outreach-demo.ps1
#   .\backend\scripts\start-outreach-demo.ps1 -Slug ggtech

param(
  [string]$Slug = "ggtech"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$backendDir = Join-Path $repoRoot "backend"

function Get-DotEnvValue([string]$path, [string]$key) {
  if (-not (Test-Path $path)) { return $null }
  foreach ($line in Get-Content $path) {
    if ($line -match "^\s*$key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$appPublic = Get-DotEnvValue (Join-Path $backendDir ".env") "APP_PUBLIC_URL"
if (-not $appPublic) { $appPublic = "https://frontend-five-chi-66.vercel.app" }

Write-Host "Starting backend (port 3000) in a new window..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backendDir'; npm run start:dev"
) | Out-Null

Start-Sleep -Seconds 8

Write-Host "Starting Cloudflare tunnel to http://127.0.0.1:3000 ..."
$tunnelJob = Start-Job -ScriptBlock {
  npx --yes cloudflared@latest tunnel --url http://127.0.0.1:3000 2>&1
}

$tunnelUrl = $null
$deadline = (Get-Date).AddSeconds(45)
while ((Get-Date) -lt $deadline -and -not $tunnelUrl) {
  Start-Sleep -Seconds 2
  $out = Receive-Job $tunnelJob -ErrorAction SilentlyContinue | Out-String
  if ($out -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
    $tunnelUrl = $Matches[0]
  }
}

if (-not $tunnelUrl) {
  Write-Host "Could not detect tunnel URL. Check the cloudflared job output."
  Write-Host "Then run: npm run ensure-outreach-production -- --slug $Slug --skip-render"
  exit 1
}

Write-Host ""
$cacheFile = Join-Path $backendDir ".outreach-api-url"
Set-Content -Path $cacheFile -Value $tunnelUrl -Encoding utf8
Write-Host "Tunnel API: $tunnelUrl (saved to backend/.outreach-api-url)"
Write-Host ""
Write-Host "Check your demo (incognito):"
Write-Host "  $appPublic/?tenant=$Slug"
Write-Host ""
Write-Host "To bake this API into Vercel:"
Write-Host "  cd backend"
Write-Host "  npm run demo-from-website -- --slug $Slug --sync-only"
Write-Host ""
Write-Host "For 24/7 demos without this script, deploy careers-api on Render and run ensure-outreach-production without --skip-render."
