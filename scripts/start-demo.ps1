param([int]$BackendPort = 4012, [int]$FrontendPort = 5175)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$demoPath = Join-Path $projectRoot '.demo'
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source

foreach ($port in @($BackendPort, $FrontendPort)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $port ist bereits belegt. Eine laufende Demo zuerst mit scripts/stop-demo.ps1 beenden."
    }
}

New-Item -ItemType Directory -Path $demoPath -Force | Out-Null
$env:NODE_ENV = 'development'
$env:DEMO_MODE = 'true'
$env:MAIL_TRANSPORT = 'file'
$env:EMAIL_ALLOWED_DOMAINS = 'igz.com'
$env:DATABASE_URL = 'file:./demo.db'
$env:JWT_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$env:PORT = "$BackendPort"
$env:PUBLIC_APP_URL = "http://127.0.0.1:$FrontendPort"
$env:CORS_ORIGIN = $env:PUBLIC_APP_URL
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:$BackendPort"
$env:AI_PROVIDER = 'mock'
$env:TRUST_PROXY = ''
$env:UPLOAD_DIR = '../.demo/uploads'

function Invoke-NpmChecked([string[]]$NpmArguments) {
    & npm.cmd @NpmArguments
    if ($LASTEXITCODE -ne 0) { throw "npm $($NpmArguments -join ' ') fehlgeschlagen." }
}

Push-Location $backendPath
try {
    if (!(Test-Path 'node_modules')) { Invoke-NpmChecked -NpmArguments @('ci') }
    if (!(Test-Path 'node_modules/.prisma/client/index.js')) { Invoke-NpmChecked -NpmArguments @('run', 'prisma:generate') }
    if (!(Test-Path 'prisma/demo.db')) { New-Item -ItemType File -Path 'prisma/demo.db' | Out-Null }
    Invoke-NpmChecked -NpmArguments @('run', 'prisma:deploy')
    Invoke-NpmChecked -NpmArguments @('run', 'prisma:seed')
    Invoke-NpmChecked -NpmArguments @('run', 'build')
} finally { Pop-Location }
Push-Location $frontendPath
try {
    if (!(Test-Path 'node_modules')) { Invoke-NpmChecked -NpmArguments @('ci') }
} finally { Pop-Location }

$started = @()
try {
    $backendScript = Join-Path $backendPath 'dist/server.js'
    $frontendScript = Join-Path $frontendPath 'node_modules/vite/bin/vite.js'
    $started += Start-Process -FilePath $nodeExe -ArgumentList @(('"' + $backendScript + '"')) -WorkingDirectory $backendPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $demoPath 'backend.log') -RedirectStandardError (Join-Path $demoPath 'backend-error.log') -PassThru
    $started += Start-Process -FilePath $nodeExe -ArgumentList @(('"' + $frontendScript + '"'), '--host', '127.0.0.1', '--port', "$FrontendPort", '--strictPort') -WorkingDirectory $frontendPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $demoPath 'frontend.log') -RedirectStandardError (Join-Path $demoPath 'frontend-error.log') -PassThru
    $started | ForEach-Object { @{ id = $_.Id; startedAt = $_.StartTime.ToUniversalTime().ToString('o') } } | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $demoPath 'processes.json')
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            $config = Invoke-RestMethod -Uri ($env:PUBLIC_APP_URL + '/api/v1/auth/access-config') -TimeoutSec 2
            if ($config.demoMode -eq $true) { $ready = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    if (!$ready) { throw 'Demo konnte nicht starten. Details stehen in .demo/*.log.' }
    Write-Host "Demo bereit: $($env:PUBLIC_APP_URL)"
    Write-Host 'Mitarbeiter: Idee melden, danach Demo-Bestaetigungslink oeffnen.'
    Write-Host 'Verwaltung: champion@igz.example / Passwort123!'
    Write-Host 'AI Core Team: coreteam@igz.example / Passwort123!'
    Write-Host 'Beenden: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-demo.ps1'
} catch {
    foreach ($process in $started) { if (!$process.HasExited) { Stop-Process -Id $process.Id } }
    throw
}
