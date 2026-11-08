[CmdletBinding()]
param(
  [string]$Servidor = 'localhost',
  [string]$BaseDatos = 'Hcu008Db',
  [string]$ArchivoRespaldo = ''
)

$ErrorActionPreference = 'Stop'

if ($BaseDatos -notmatch '^[A-Za-z0-9_]+$') {
  throw 'El nombre de la base contiene caracteres no permitidos.'
}

$sqlcmd = (Get-Command sqlcmd.exe -ErrorAction Stop).Source

if ([string]::IsNullOrWhiteSpace($ArchivoRespaldo)) {
  $baseConsulta = $BaseDatos.Replace("'", "''")
  $ArchivoRespaldo = (& $sqlcmd -S $Servidor -E -C -h -1 -W -Q "SET NOCOUNT ON; SELECT TOP (1) bmf.physical_device_name FROM msdb.dbo.backupset bs INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id WHERE bs.database_name = N'$baseConsulta' AND bs.type = 'D' ORDER BY bs.backup_finish_date DESC;" |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -First 1).Trim()
}

if ([string]::IsNullOrWhiteSpace($ArchivoRespaldo)) {
  throw "SQL Server no informó un respaldo completo de $BaseDatos."
}

$prueba = "${BaseDatos}_RestoreTest"
$archivoSql = $ArchivoRespaldo.Replace("'", "''")
$baseSql = $BaseDatos.Replace("'", "''")
$pruebaSql = $prueba.Replace("'", "''")

$consulta = @"
SET NOCOUNT ON;
DECLARE @dataPath nvarchar(4000) = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(4000));
DECLARE @logPath nvarchar(4000) = CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS nvarchar(4000));
BEGIN TRY
  IF DB_ID(N'$pruebaSql') IS NOT NULL
  BEGIN
    ALTER DATABASE [$prueba] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$prueba];
  END;

  DECLARE @restaurar nvarchar(max) =
    N'RESTORE DATABASE [$prueba] FROM DISK = N''$archivoSql'' WITH ' +
    N'MOVE N''$baseSql'' TO N''' + REPLACE(@dataPath + N'${prueba}.mdf', N'''', N'''''') + N''', ' +
    N'MOVE N''${baseSql}_log'' TO N''' + REPLACE(@logPath + N'${prueba}_log.ldf', N'''', N'''''') + N''', ' +
    N'RECOVERY, REPLACE;';
  EXEC sys.sp_executesql @restaurar;

  DBCC CHECKDB (N'$pruebaSql') WITH NO_INFOMSGS, ALL_ERRORMSGS;
  ALTER DATABASE [$prueba] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE [$prueba];
  SELECT N'RESTAURACION_Y_CHECKDB_CORRECTOS' AS Resultado;
END TRY
BEGIN CATCH
  IF DB_ID(N'$pruebaSql') IS NOT NULL
  BEGIN
    ALTER DATABASE [$prueba] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$prueba];
  END;
  THROW;
END CATCH;
"@

& $sqlcmd -S $Servidor -E -C -b -Q $consulta
if ($LASTEXITCODE -ne 0) { throw 'La restauración de prueba o DBCC CHECKDB falló.' }

Write-Host "Restauración aislada y DBCC CHECKDB correctos para $ArchivoRespaldo" -ForegroundColor Green
