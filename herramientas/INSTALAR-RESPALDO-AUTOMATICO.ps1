[CmdletBinding()]
param(
  [string]$Hora = '02:00',
  [int]$DiasRetencion = 30,
  [string]$BaseDatos = 'Hcu008Db'
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$scriptRespaldo = Join-Path $raiz 'herramientas\RESPALDAR-BASE-DATOS.ps1'

if (-not (Test-Path -LiteralPath $scriptRespaldo)) {
  throw "No se encontró $scriptRespaldo"
}

$horaProgramada = [DateTime]::ParseExact($Hora, 'HH:mm', $null)
$argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptRespaldo`" -BaseDatos `"$BaseDatos`" -DiasRetencion $DiasRetencion"
$accion = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argumentos
$disparador = New-ScheduledTaskTrigger -Daily -At $horaProgramada
$configuracion = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
$usuario = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited

$parametros = @{
  TaskName = 'HCU008-Respaldo-Diario'
  Description = 'Respaldo diario verificado de la base clínica HCU 008.'
  Action = $accion
  Trigger = $disparador
  Settings = $configuracion
  Principal = $principal
  Force = $true
}

Register-ScheduledTask @parametros | Out-Null

Write-Host "Respaldo automático instalado para las $Hora. Se ejecutará cuando este usuario tenga una sesión abierta." -ForegroundColor Green
