#Requires -Version 5.1
<#
.SYNOPSIS
  Start the canonical web dashboard (production, port 3847).
#>
param(
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'lib/Resolve-ProjectPaths.ps1')

$paths = Resolve-ProjectPaths
Test-ProjectPreflight -Paths $paths -RequireBuild

$port = 3847
$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $listeners) {
    $procId = $conn.OwningProcess
    if ($procId -gt 0) {
        Write-Host "Stopping previous server on port $port (PID $procId)..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

$env:NORNIKEL_PROJECT_ROOT = $paths.WorkspaceRoot

Write-Host "Starting web server at $($paths.WebDir)" -ForegroundColor Green
Push-Location $paths.WebDir
try {
    if (-not $NoBrowser) {
        Start-Job -ScriptBlock {
            param($P)
            $deadline = (Get-Date).AddSeconds(45)
            while ((Get-Date) -lt $deadline) {
                try {
                    $r = Invoke-RestMethod -Uri "http://localhost:$P/api/health" -TimeoutSec 2
                    if ($r.status -eq 'ok') {
                        $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                        Start-Process "http://localhost:$P/?v=$ts"
                        return
                    }
                } catch {
                    Start-Sleep -Milliseconds 400
                }
            }
        } -ArgumentList $port | Out-Null
    }
    npm start
} finally {
    Pop-Location
}
