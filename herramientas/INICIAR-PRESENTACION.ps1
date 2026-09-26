$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
  throw 'Falta instalar .NET 10 Runtime o SDK.'
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'Falta instalar Node.js y npm.'
}

$apiActiva = Get-NetTCPConnection -LocalPort 5219 -State Listen -ErrorAction SilentlyContinue
if (-not $apiActiva) {
  Start-Process -FilePath 'dotnet' -ArgumentList @('run','--no-build','--project','api\Hcu008.Api\Hcu008.Api\Hcu008.Api.csproj') -WorkingDirectory $raiz -WindowStyle Hidden
}

$webActiva = Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue
if (-not $webActiva) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList @('start','--','--host','127.0.0.1','--port','4200') -WorkingDirectory $raiz -WindowStyle Hidden
}

Write-Host 'Iniciando HCU 008...' -ForegroundColor Green
Start-Sleep -Seconds 8
Start-Process 'http://localhost:4200'
