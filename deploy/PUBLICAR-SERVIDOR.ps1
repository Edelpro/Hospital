[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$compose = Join-Path $PSScriptRoot 'compose.production.yml'
$variables = Join-Path $PSScriptRoot '.env'

if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) {
  throw 'Docker no está instalado. Instale Docker Engine en el servidor antes de publicar.'
}

if (-not (Test-Path -LiteralPath $variables)) {
  throw 'Falta deploy\.env. Ejecute primero GENERAR-CONFIGURACION.ps1.'
}

docker compose --env-file $variables -f $compose config --quiet
if ($LASTEXITCODE -ne 0) { throw 'La configuración del servidor no es válida.' }

docker compose --env-file $variables -f $compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Docker no pudo publicar HCU 008.' }

docker compose --env-file $variables -f $compose ps
