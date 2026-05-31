# Wrapper for demo-from-website (company URL → live check link).
# Usage:
#   .\backend\scripts\demo-from-website.ps1 -Url https://ggtech.gg
#   .\backend\scripts\demo-from-website.ps1 -Slug ggtech -Update

param(
  [string]$Url,
  [string]$Slug,
  [string]$Name,
  [string]$Color,
  [string]$BrandingFile,
  [switch]$Update,
  [switch]$SyncOnly,
  [switch]$DryRun,
  [switch]$Force,
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$backendDir = Join-Path $PSScriptRoot ".."
Set-Location $backendDir

$npmArgs = @("run", "demo-from-website", "--")
if ($Url) { $npmArgs += "--url", $Url }
if ($Slug) { $npmArgs += "--slug", $Slug }
if ($Name) { $npmArgs += "--name", $Name }
if ($Color) { $npmArgs += "--color", $Color }
if ($BrandingFile) { $npmArgs += "--branding-file", $BrandingFile }
if ($Update) { $npmArgs += "--update" }
if ($SyncOnly) { $npmArgs += "--sync-only" }
if ($DryRun) { $npmArgs += "--dry-run" }
if ($Force) { $npmArgs += "--force" }
if ($SkipDeploy) { $npmArgs += "--skip-deploy" }

if ($npmArgs.Count -eq 3) {
  Write-Host "Usage: .\demo-from-website.ps1 -Url https://company.com"
  exit 1
}

npm @npmArgs
