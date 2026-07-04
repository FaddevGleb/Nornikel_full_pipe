#Requires -Version 5.1
<#
.SYNOPSIS
  Full workspace setup: config, Python venv, npm builds, smoke tests.
.DESCRIPTION
  Uses project.toml as the single source of truth. Canonical web lives under
  paths.nornikel_kg/web (not top-level nornikel_KG/web).
#>
param(
    [ValidateSet('full', 'minimal')]
    [string]$Profile = 'full',
    [switch]$SkipNpm,
    [switch]$SkipSmoke
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'lib/Resolve-ProjectPaths.ps1')

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$Name, [string]$Hint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name not found. $Hint"
    }
}

function Get-VersionMajor([string]$Text) {
    if ($Text -match '(\d+)\.(\d+)') {
        return [int]$Matches[1]
    }
    return 0
}

Write-Step 'Preflight: Node, Python'
Assert-Command 'node' 'Install Node.js >= 22 (https://nodejs.org/)'

$nodeVer = (node -v) -replace '^v', ''
if ((Get-VersionMajor $nodeVer) -lt 22) {
    throw "Node $nodeVer found; Feynman requires Node >= 22."
}

$pythonLauncher = Resolve-Python311Plus
Write-Host "Using Python $($pythonLauncher.Version): $($pythonLauncher.Exe)" -ForegroundColor DarkGray

$paths = Resolve-ProjectPaths

Write-Step 'Config bootstrap'
$exampleToml = Join-Path $paths.WorkspaceRoot 'project.example.toml'
if (-not $paths.HasProjectToml) {
    if (-not (Test-Path $exampleToml)) {
        throw "Neither project.toml nor project.example.toml found in $($paths.WorkspaceRoot)"
    }
    Copy-Item $exampleToml $paths.ProjectToml
    Write-Host 'Created project.toml from project.example.toml - add LLM keys before ACCELMAT runs.'
} else {
    $legacySettings = Join-Path $paths.NornikelKgRoot 'web/settings.json'
    $legacyEnv = Join-Path $paths.HypothesisRepo '.env'
    if ((Test-Path $legacySettings) -or (Test-Path $legacyEnv)) {
        Write-Warning 'Legacy settings.json or .env still present. If project.toml needs migration, run: python scripts/consolidate_config.py'
    }
}

Write-Step "Python venv: $($paths.PythonVenv)"
$venvNeedsRecreate = $false
if (Test-Path $paths.PythonExe) {
    $venvPython = Test-PythonExecutable $paths.PythonExe
    if ($venvPython -and ($venvPython.Major -lt 3 -or ($venvPython.Major -eq 3 -and $venvPython.Minor -lt 11))) {
        Write-Warning "Existing venv uses Python $($venvPython.Version); recreating with Python $($pythonLauncher.Version)."
        $venvNeedsRecreate = $true
        Remove-Item -Recurse -Force $paths.PythonVenv
    }
}
if (-not (Test-Path $paths.PythonExe)) {
    & $pythonLauncher.Exe -m venv $paths.PythonVenv
    
    # После создания venv путь к интерпретатору меняется.
    # Обновляем его явно, чтобы последующие вызовы pip работали корректно.
    $paths.PythonExe = Join-Path $paths.PythonVenv 'Scripts\python.exe'
    if (-not (Test-Path $paths.PythonExe)) {
        $paths.PythonExe = Join-Path $paths.PythonVenv 'bin\python'
    }
}
& $paths.PythonExe -m pip install --upgrade pip wheel

if ($Profile -eq 'full') {
    Write-Step 'pip: KG requirements (torch, faiss, etc.)'
    & $paths.PythonExe -m pip install -r (Join-Path $paths.NornikelKgRoot 'requirements.txt')

    Write-Step 'pip: doc_converter[docx,pdf]'
    $docConverter = Join-Path $paths.NornikelKgRoot 'doc_converter'
    & $paths.PythonExe -m pip install -e ($docConverter + '[docx,pdf]')

    Write-Step 'pip: ACCELMAT requirements'
    & $paths.PythonExe -m pip install -r (Join-Path $paths.HypothesisRepo 'requirements.txt')
} else {
    Write-Step 'pip: minimal (openpyxl, config loaders)'
    & $paths.PythonExe -m pip install openpyxl pandas tomli tomli-w
}

Write-Step 'pip: tomli / tomli-w (consolidate_config)'
& $paths.PythonExe -m pip install tomli tomli-w

if (-not $SkipNpm) {
    Write-Step "Feynman npm ci + build: $($paths.FeynmanRoot)"
    Push-Location $paths.FeynmanRoot
    try {
        if (Test-Path 'package-lock.json') { npm ci } else { npm install }
        npm run build
    } finally {
        Pop-Location
    }

    Write-Step "Web npm ci + build: $($paths.WebDir)"
    Push-Location $paths.WebDir
    try {
        if (Test-Path 'package-lock.json') { npm ci } else { npm install }
        npm run build
    } finally {
        Pop-Location
    }
}

Write-Step 'Patch project.toml [web.accelmat].pythonExecutable'
$patchScript = Join-Path $ScriptDir 'lib/patch-accelmat-python.mjs'
& node $patchScript $paths.PythonExe
$paths = Resolve-ProjectPaths

if (-not $SkipSmoke) {
    Write-Step 'Smoke tests'
    Push-Location $paths.WebDir
    try {
        if (Test-Path 'tests/config_loader.test.js') {
            npm test -- --testPathPattern=config_loader 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning 'config_loader tests failed or npm test unavailable; continuing.'
            }
        }
    } finally {
        Pop-Location
    }

    & $paths.PythonExe -c 'import openpyxl; from config.loader import load_project_config; load_project_config(); print(''Python config OK'')'
    & node $paths.FeynmanCli --help | Out-Null
    if (-not (Test-Path $paths.WebDist)) {
        throw "Web dist missing after build: $($paths.WebDist)"
    }
}

Write-Step 'Setup complete'
Write-Host "Workspace : $($paths.WorkspaceRoot)"
Write-Host "Web       : $($paths.WebDir)"
Write-Host "Python    : $($paths.PythonExe)"
Write-Host ""
Write-Host "Start dashboard: .\scripts\start.ps1"
Write-Host "Dev mode      : .\scripts\dev.ps1"

if (-not (Test-AccelmatLlmConfigured $paths.ProjectToml)) {
    Write-Warning 'ACCELMAT LLM keys not configured in project.toml [accelmat.llm]. Add routerai_api_key or yandex_api_key before running ACCELMAT.'
}
