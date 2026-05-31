# One-time Render production setup for prospect demo URLs.
# - Probes careers-api on Render
# - Optionally resumes a suspended service (requires RENDER_API_KEY in backend/.env)
# - Prints env vars to configure on Render if needed
#
# Usage (from repo root):
#   .\backend\scripts\setup-render-production.ps1
#   .\backend\scripts\setup-render-production.ps1 -TenantSlug noetic

param(
  [string]$TenantSlug = "noetic"
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib/outreach-env.ps1")

$backendDir = Get-BackendDir
$envPath = Get-BackendEnvPath
$apiUrl = Get-RenderApiUrl
$probeUrl = Get-TenantProbeUrl -ApiUrl $apiUrl -TenantSlug $TenantSlug

function Test-RenderProbe {
  try {
    $response = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 30
    return @{
      Ok = ($response.StatusCode -eq 200 -and $response.Content -match '"slug"\s*:')
      StatusCode = $response.StatusCode
      Body = $response.Content
    }
  } catch {
    $body = $null
    if ($_.Exception.Response) {
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
      } catch { }
    }
    return @{
      Ok = $false
      StatusCode = $null
      Body = $body
      Error = $_.Exception.Message
    }
  }
}

function Resume-RenderService {
  param([string]$ServiceId, [string]$ApiKey)
  $headers = @{
    Accept = "application/json"
    Authorization = "Bearer $ApiKey"
  }
  $url = "https://api.render.com/v1/services/$ServiceId/resume"
  Write-Host "Resuming Render service $ServiceId…"
  $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers
  return $response
}

function Find-RenderServiceId {
  param([string]$ApiKey, [string]$ServiceName = "careers-api")
  $headers = @{
    Accept = "application/json"
    Authorization = "Bearer $ApiKey"
  }
  $url = "https://api.render.com/v1/services?limit=100&name=$([uri]::EscapeDataString($ServiceName))"
  $result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
  foreach ($item in @($result)) {
    if ($item.service.name -eq $ServiceName) {
      return $item.service.id
    }
  }
  return $null
}

Write-Host "Render production setup"
Write-Host "  API URL:  $apiUrl"
Write-Host "  Probe:    $probeUrl"
Write-Host ""

$probe = Test-RenderProbe
if ($probe.Ok) {
  Write-Host "Render API is already reachable for tenant '$TenantSlug'."
  exit 0
}

$suspended = $probe.Body -match 'suspended by its owner'
if ($suspended) {
  Write-Host "Render service is SUSPENDED."
  $renderApiKey = Get-DotEnvValue -Path $envPath -Key "RENDER_API_KEY"
  if ($renderApiKey) {
    $serviceId = Find-RenderServiceId -ApiKey $renderApiKey
    if ($serviceId) {
      Resume-RenderService -ServiceId $serviceId -ApiKey $renderApiKey | Out-Null
      Write-Host "Resume request sent. Warming API…"
      & (Join-Path $PSScriptRoot "warm-render-api.ps1") -TenantSlug $TenantSlug
      exit $LASTEXITCODE
    }
    Write-Host "Could not find careers-api service id via Render API."
  } else {
    Write-Host "Add RENDER_API_KEY to backend/.env to auto-resume, or resume manually:"
    Write-Host "  https://dashboard.render.com → careers-api → Resume"
  }
  exit 1
}

Write-Host "Render API is not ready yet."
if ($probe.Error) { Write-Host "  Error: $($probe.Error)" }
if ($probe.StatusCode) { Write-Host "  HTTP: $($probe.StatusCode)" }

Write-Host ""
Write-Host "Required env vars on the Render careers-api service:"
$requiredKeys = @(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "JWT_SECRET",
  "PROVISION_API_KEY",
  "APP_PUBLIC_URL"
)
foreach ($key in $requiredKeys) {
  $value = Get-DotEnvValue -Path $envPath -Key $key
  if ($value) {
    Write-Host "  $key = (set in backend/.env - copy to Render)"
  } else {
    Write-Host "  $key = MISSING in backend/.env"
  }
}

Write-Host ""
Write-Host "After Render is live, sync Vercel:"
Write-Host "  cd backend"
Write-Host "  npm run ensure-outreach-production -- --slug $TenantSlug"
exit 1
