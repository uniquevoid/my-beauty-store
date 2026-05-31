function Get-DotEnvValue {
  param(
    [string]$Path,
    [string]$Key
  )
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function Get-BackendDir {
  return Resolve-Path (Join-Path $PSScriptRoot "../..")
}

function Get-BackendEnvPath {
  return Join-Path (Get-BackendDir) ".env"
}

function Get-RenderApiUrl {
  param([string]$Default = "https://careers-api.onrender.com")
  $envPath = Get-BackendEnvPath
  $fromEnv = Get-DotEnvValue -Path $envPath -Key "RENDER_API_URL"
  if ($fromEnv) { return $fromEnv.Trim().TrimEnd('/') }
  return $Default.TrimEnd('/')
}

function Get-TenantProbeUrl {
  param(
    [string]$ApiUrl,
    [string]$TenantSlug = "noetic"
  )
  $base = $ApiUrl.Trim().TrimEnd('/')
  return "$base/tenants/current?tenant=$([uri]::EscapeDataString($TenantSlug))"
}
