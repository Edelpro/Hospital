[CmdletBinding()]
param(
  [string]$Url = 'http://localhost:8080',
  [int]$TiempoMaximoSegundos = 15
)

$ErrorActionPreference = 'Stop'
$base = $Url.TrimEnd('/')
$inicio = Get-Date
$vivo = Invoke-RestMethod -Uri "$base/health/live" -TimeoutSec $TiempoMaximoSegundos
$listo = Invoke-RestMethod -Uri "$base/health/ready" -TimeoutSec $TiempoMaximoSegundos
$duracion = [Math]::Round(((Get-Date) - $inicio).TotalMilliseconds)

[pscustomobject]@{
  Fecha = Get-Date
  Url = $base
  Aplicacion = $vivo.estado
  BaseDatos = $listo.baseDatos
  DuracionMs = $duracion
} | Format-List
