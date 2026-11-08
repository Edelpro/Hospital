[CmdletBinding()]
param(
  [string]$Servidor = 'localhost',
  [string]$BaseDatos = 'Hcu008Db',
  [int]$DiasRetencion = 30,
  [string]$DirectorioRespaldo = ''
)

$ErrorActionPreference = 'Stop'

if ($BaseDatos -notmatch '^[A-Za-z0-9_]+$') {
  throw 'El nombre de la base de datos contiene caracteres no permitidos.'
}

$sqlcmd = (Get-Command sqlcmd.exe -ErrorAction Stop).Source

if ([string]::IsNullOrWhiteSpace($DirectorioRespaldo)) {
  $DirectorioRespaldo = (& $sqlcmd -S $Servidor -E -C -h -1 -W -Q "SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000));" |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -First 1).Trim()
}

if ([string]::IsNullOrWhiteSpace($DirectorioRespaldo)) {
  throw 'SQL Server no informó un directorio de respaldos.'
}

New-Item -ItemType Directory -Path $DirectorioRespaldo -Force | Out-Null
$marca = Get-Date -Format 'yyyyMMdd_HHmmss'
$archivo = Join-Path $DirectorioRespaldo "${BaseDatos}_${marca}.bak"
$archivoSql = $archivo.Replace("'", "''")

$consulta = @"
BACKUP DATABASE [$BaseDatos]
TO DISK = N'$archivoSql'
WITH COPY_ONLY, COMPRESSION, CHECKSUM, INIT, STATS = 10;
RESTORE VERIFYONLY FROM DISK = N'$archivoSql' WITH CHECKSUM;
"@

& $sqlcmd -S $Servidor -E -C -b -Q $consulta
if ($LASTEXITCODE -ne 0) { throw 'SQL Server no pudo crear o verificar el respaldo.' }

$limite = (Get-Date).AddDays(-[Math]::Max(1, $DiasRetencion))
Get-ChildItem -LiteralPath $DirectorioRespaldo -Filter "${BaseDatos}_*.bak" -File -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt $limite } |
  Remove-Item -Force

Write-Host "Respaldo creado y verificado: $archivo" -ForegroundColor Green
Write-Output $archivo
