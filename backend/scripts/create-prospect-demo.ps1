param(
  [Parameter(Mandatory = $true)]
  [string]$Slug,
  [Parameter(Mandatory = $true)]
  [string]$Name,
  [string]$BrandingFile
)

$backendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $backendRoot

$npmArgs = @("run", "create-prospect", "--", "--slug", $Slug, "--name", $Name)
if ($BrandingFile) {
  $npmArgs += @("--branding-file", $BrandingFile)
}

Write-Host "Provisioning prospect demo: $Slug (includes 10 demo jobs)"
npm @npmArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$platform = $env:PLATFORM_DOMAIN
$appPublic = $env:APP_PUBLIC_URL
$demoUrl = $null

if ($platform) {
  $demoUrl = "https://$Slug.$platform"
} elseif ($appPublic) {
  $base = $appPublic.TrimEnd('/')
  $demoUrl = "$base/?tenant=$Slug"
}

Write-Host ""
if ($demoUrl) {
  Write-Host "Demo URL: $demoUrl"
  Write-Host "Admin:    $demoUrl/admin  (admin / user)"
  Write-Host "Candidate: $demoUrl/login  (candidate@demo.local / demo123!)"
} else {
  Write-Host "Set APP_PUBLIC_URL or PLATFORM_DOMAIN in backend .env to print the demo URL automatically."
  Write-Host "Or use: https://your-frontend.vercel.app/?tenant=$Slug"
  Write-Host "Admin:    /admin?tenant=$Slug  (admin / user)"
  Write-Host "Candidate: /login?tenant=$Slug  (candidate@demo.local / demo123!)"
}
