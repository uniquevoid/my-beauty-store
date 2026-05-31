# Registers Windows Task Scheduler jobs for Render warm-up during outreach hours.
# Run once (PowerShell as Administrator recommended):
#   .\backend\scripts\register-outreach-scheduler.ps1
#
# Tasks:
#   CareersDemo-WarmRender      daily 7:55 AM
#   CareersDemo-KeepRenderWarm  daily 8:00 AM

param(
  [string]$TenantSlug = "noetic"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$warmScript = Join-Path $PSScriptRoot "warm-render-api.ps1"
$keepScript = Join-Path $PSScriptRoot "keep-render-warm.ps1"
$bootstrapScript = Join-Path $PSScriptRoot "bootstrap-outreach-day.ps1"

if (-not (Test-Path $warmScript)) { throw "Missing $warmScript" }
if (-not (Test-Path $keepScript)) { throw "Missing $keepScript" }
if (-not (Test-Path $bootstrapScript)) { throw "Missing $bootstrapScript" }

$warmArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$warmScript`" -TenantSlug $TenantSlug"
$keepArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$keepScript`" -TenantSlug $TenantSlug"
$bootstrapArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$bootstrapScript`" -TenantSlug $TenantSlug"

function Register-CareersDemoTask {
  param(
    [string]$Name,
    [string]$Arguments,
    [string]$AtTime
  )

  $existing = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
  if ($existing) {
    Unregister-ScheduledTask -TaskName $Name -Confirm:$false
  }

  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Arguments -WorkingDirectory $repoRoot
  $trigger = New-ScheduledTaskTrigger -Daily -At $AtTime
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

  Register-ScheduledTask `
    -TaskName $Name `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Careers prospect demo outreach automation" | Out-Null

  Write-Host "Registered scheduled task: $Name ($AtTime daily)"
}

Register-CareersDemoTask -Name "CareersDemo-BootstrapOutreach" -Arguments $bootstrapArgs -AtTime "7:50AM"
Register-CareersDemoTask -Name "CareersDemo-WarmRender" -Arguments $warmArgs -AtTime "7:55AM"
Register-CareersDemoTask -Name "CareersDemo-KeepRenderWarm" -Arguments $keepArgs -AtTime "8:00AM"

Write-Host ""
Write-Host "Scheduler setup complete."
Write-Host "  Bootstrap task:  7:50 AM daily (Render or interim tunnel + Vercel sync)"
Write-Host "  Warm task:       7:55 AM daily"
Write-Host "  Keep-alive task: 8:00 AM daily (runs until 10:00 PM)"
Write-Host ""
Write-Host "Verify in Task Scheduler (taskschd.msc) or run:"
Write-Host "  Get-ScheduledTask -TaskName 'CareersDemo-*'"
