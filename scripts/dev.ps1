#Requires -Version 5.1
<#
.SYNOPSIS
  Start Vite dev server (:5173) + API (:3847) for the canonical web.
#>
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'lib/Resolve-ProjectPaths.ps1')

$paths = Resolve-ProjectPaths
Test-ProjectPreflight -Paths $paths

$env:NORNIKEL_PROJECT_ROOT = $paths.WorkspaceRoot

Write-Host "Starting dev mode at $($paths.WebDir)" -ForegroundColor Green
Push-Location $paths.WebDir
try {
    npm run dev
} finally {
    Pop-Location
}
