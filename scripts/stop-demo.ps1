$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$processFile = Join-Path $projectRoot '.demo/processes.json'
if (!(Test-Path $processFile)) { Write-Host 'Keine gestartete Demo gefunden.'; exit }
foreach ($entry in (Get-Content -Raw $processFile | ConvertFrom-Json)) {
    $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
    # A recycled process ID must never stop an unrelated application.
    if ($process -and $process.ProcessName -eq 'node' -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.startedAt) {
        Stop-Process -Id $process.Id
    }
}
Remove-Item -LiteralPath $processFile
Write-Host 'Demo beendet. Beispieldaten bleiben fuer den naechsten Start erhalten.'
