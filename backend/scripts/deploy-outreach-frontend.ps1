# Deploy the outreach frontend to Vercel production (requires VERCEL_TOKEN in backend/.env).
# Usage (from repo root):
#   .\backend\scripts\deploy-outreach-frontend.ps1
# Optional env:
#   $env:OUTREACH_API_URL = "https://careers-api.onrender.com"   # or a Cloudflare tunnel URL

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$backendEnv = Join-Path $repoRoot "backend/.env"
$frontendDir = Join-Path $repoRoot "frontend"

function Get-DotEnvValue([string]$path, [string]$key) {
  if (-not (Test-Path $path)) { return $null }
  foreach ($line in Get-Content $path) {
    if ($line -match "^\s*$key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$token = $env:VERCEL_TOKEN
if (-not $token) { $token = Get-DotEnvValue $backendEnv "VERCEL_TOKEN" }
if (-not $token) {
  Write-Host "Missing VERCEL_TOKEN. Add to backend/.env or run: npx vercel login" -ForegroundColor Red
  Write-Host "Create a token: https://vercel.com/account/settings/tokens"
  exit 1
}

$apiUrl = $env:OUTREACH_API_URL
if (-not $apiUrl) { $apiUrl = Get-DotEnvValue $backendEnv "OUTREACH_API_URL" }
if (-not $apiUrl) { $apiUrl = Get-DotEnvValue $backendEnv "RENDER_API_URL" }
if (-not $apiUrl) { $apiUrl = "https://careers-api.onrender.com" }

$envFile = Join-Path $frontendDir ".env.production"
@"
# Written by deploy-outreach-frontend.ps1
VITE_API_URL=$($apiUrl.TrimEnd('/'))
"@ | Set-Content -Path $envFile -Encoding utf8
Write-Host "VITE_API_URL -> $apiUrl"

Push-Location $frontendDir
try {
  npm run build
  npx --yes vercel@latest deploy --prod --yes --token $token
  Write-Host ""
  Write-Host "Outreach URL: https://frontend-five-chi-66.vercel.app/?tenant=ggtech"
} finally {
  Pop-Location
}
