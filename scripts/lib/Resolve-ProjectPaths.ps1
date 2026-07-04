# Resolve workspace paths from project.toml (PowerShell-native, no Node JSON roundtrip).
# Sets $env:NORNIKEL_PROJECT_ROOT and returns a PSCustomObject with canonical paths.

$script:ResolveProjectLib = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-ProjectTomlPaths {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$WorkspaceRoot
    )

    $tomlPath = Join-Path $WorkspaceRoot 'project.toml'
    if (-not (Test-Path -LiteralPath $tomlPath)) {
        throw "project.toml not found at $tomlPath"
    }

    $content = Get-Content -LiteralPath $tomlPath -Raw -Encoding UTF8

    function Get-TomlPathValue([string]$Key) {
        if ($content -match "(?m)^$([regex]::Escape($Key))\s*=\s*`"([^`"]+)`"") {
            return $Matches[1].Replace('/', [IO.Path]::DirectorySeparatorChar)
        }
        return $null
    }

    $relative = @{
        nornikel_kg     = Get-TomlPathValue 'nornikel_kg'
        hypothesis_repo = Get-TomlPathValue 'hypothesis_repo'
        feynman         = Get-TomlPathValue 'feynman'
        python_venv     = Get-TomlPathValue 'python_venv'
    }

    foreach ($key in @($relative.Keys)) {
        if (-not $relative[$key]) {
            throw "Missing paths.$key in project.toml"
        }
        if (-not [IO.Path]::IsPathRooted($relative[$key])) {
            $relative[$key] = Join-Path $WorkspaceRoot $relative[$key]
        }
    }

    return $relative
}

function Resolve-ProjectPaths {
    [CmdletBinding()]
    param(
        [string]$WorkspaceRoot
    )

    if (-not $WorkspaceRoot) {
        $WorkspaceRoot = (Resolve-Path (Join-Path $script:ResolveProjectLib '..\..')).Path
    }

    $env:NORNIKEL_PROJECT_ROOT = $WorkspaceRoot
    $projectToml = Join-Path $WorkspaceRoot 'project.toml'
    $hasProjectToml = Test-Path -LiteralPath $projectToml

    if (-not $hasProjectToml) {
        return [PSCustomObject]@{
            WorkspaceRoot  = $WorkspaceRoot
            NornikelKgRoot = $null
            HypothesisRepo = $null
            FeynmanRoot    = $null
            PythonVenv     = $null
            PythonExe      = $null
            WebDir         = $null
            ProjectToml    = $projectToml
            WebDist        = $null
            FeynmanCli     = $null
            HasProjectToml = $false
        }
    }

    $tomlPaths = Read-ProjectTomlPaths -WorkspaceRoot $WorkspaceRoot
    $nkg = $tomlPaths['nornikel_kg']
    $webDir = Join-Path $nkg 'web'
    $venv = $tomlPaths['python_venv']
    $pythonExe = Join-Path $venv 'Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        $pythonExe = Join-Path $venv 'bin\python'
    }

    [PSCustomObject]@{
        WorkspaceRoot  = $WorkspaceRoot
        NornikelKgRoot = $nkg
        HypothesisRepo = $tomlPaths['hypothesis_repo']
        FeynmanRoot    = $tomlPaths['feynman']
        PythonVenv     = $venv
        PythonExe      = $pythonExe
        WebDir         = $webDir
        ProjectToml    = $projectToml
        WebDist        = Join-Path $webDir 'dist\index.html'
        FeynmanCli     = Join-Path $tomlPaths['feynman'] 'bin\feynman.js'
        HasProjectToml = $true
    }
}

function Test-ProjectPreflight {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Paths,
        [switch]$RequireBuild
    )

    $errors = @()

    if (-not $Paths.HasProjectToml) {
        $errors += "project.toml not found at $($Paths.ProjectToml). Copy project.example.toml and fill secrets."
    }

    if (-not (Test-Path -LiteralPath $Paths.PythonExe)) {
        $errors += "Python venv not found: $($Paths.PythonExe). Run scripts/setup.ps1 first."
    }

    if ($RequireBuild) {
        if (-not (Test-Path -LiteralPath $Paths.WebDist)) {
            $errors += "Web build missing: $($Paths.WebDist). Run scripts/setup.ps1 or npm run build in web."
        }
        if (-not (Test-Path -LiteralPath $Paths.FeynmanCli)) {
            $errors += "Feynman build missing: $($Paths.FeynmanCli). Run scripts/setup.ps1 or npm run build in feynman."
        }
    }

    if ($errors.Count -gt 0) {
        throw ($errors -join [Environment]::NewLine)
    }
}

function Test-AccelmatLlmConfigured {
    param([string]$ProjectToml)

    if (-not (Test-Path -LiteralPath $ProjectToml)) { return $false }
    $content = Get-Content -LiteralPath $ProjectToml -Raw -Encoding UTF8
    if ($content -match 'routerai_api_key\s*=\s*"(?!YOUR_SECRET_HERE)[^"]{8,}"') { return $true }
    if ($content -match 'yandex_api_key\s*=\s*"(?!YOUR_SECRET_HERE)[^"]{8,}"') { return $true }
    return $false
}

function Get-PythonVersionParts([string]$VersionText) {
    if ($VersionText -match 'Python\s+(\d+)\.(\d+)') {
        return @([int]$Matches[1], [int]$Matches[2])
    }
    return $null
}

function Test-PythonExecutable([string]$Exe) {
    try {
        $verText = (& $Exe --version 2>&1 | Out-String).Trim()
        $parts = Get-PythonVersionParts $verText
        if (-not $parts) { return $null }
        return [PSCustomObject]@{
            Exe     = $Exe
            Major   = $parts[0]
            Minor   = $parts[1]
            Version = "$($parts[0]).$($parts[1])"
        }
    } catch {
        return $null
    }
}

function Resolve-Python311Plus {
    [CmdletBinding()]
    param(
        [int]$MinimumMinor = 11
    )

    $candidates = @()

    if (Get-Command python -ErrorAction SilentlyContinue) {
        $info = Test-PythonExecutable 'python'
        if ($info) { $candidates += $info }
    }

    if (Get-Command py -ErrorAction SilentlyContinue) {
        $listing = & py -0p 2>&1 | Out-String
        foreach ($line in ($listing -split "`n")) {
            if ($line -match '-V:(\d+)\.(\d+)\s+\*?\s*(.+\.exe)\s*$') {
                $info = Test-PythonExecutable $Matches[3].Trim()
                if ($info) { $candidates += $info }
            }
        }
    }

    $stable = $candidates |
        Where-Object { $_.Major -eq 3 -and $_.Minor -ge $MinimumMinor -and $_.Minor -le 12 } |
        Sort-Object Minor -Descending |
        Select-Object -First 1

    if ($stable) {
        return $stable
    }

    $best = $candidates |
        Where-Object { $_.Major -gt 3 -or ($_.Major -eq 3 -and $_.Minor -ge $MinimumMinor) } |
        Sort-Object Major, Minor -Descending |
        Select-Object -First 1

    if (-not $best) {
        throw @(
            "Python >= 3.$MinimumMinor not found."
            "Default 'python' is too old; install Python 3.11+ or use: py -3.12 -m venv .venv"
        ) -join ' '
    }

    return $best
}
