[CmdletBinding()]
param(
  [int]$Solicitudes = 600,
  [int]$Concurrencia = 20,
  [int]$Puerto = 8091
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$proyectoApi = Join-Path $raiz 'api\Hcu008.Api\Hcu008.Api\Hcu008.Api.csproj'
$dllApi = Join-Path $raiz 'api\Hcu008.Api\Hcu008.Api\bin\Release\net10.0\Hcu008.Api.dll'
$proyectoCarga = Join-Path $raiz 'tests\Hcu008.LoadTests\Hcu008.LoadTests.csproj'
$datosQa = Join-Path $raiz 'herramientas\DATOS-CARGA-QA.sql'
$sqlcmd = (Get-Command sqlcmd.exe -ErrorAction Stop).Source
$url = "http://127.0.0.1:$Puerto"
$procesoApi = $null
$variables = @(
  'ASPNETCORE_ENVIRONMENT',
  'ConnectionStrings__DefaultConnection',
  'Database__ApplyMigrationsOnStartup',
  'Seed__Enabled',
  'Seed__AdminPassword',
  'Seed__DoctorPassword',
  'Jwt__Key'
)
$anteriores = @{}
foreach ($nombre in $variables) { $anteriores[$nombre] = [Environment]::GetEnvironmentVariable($nombre, 'Process') }

try {
  dotnet build $proyectoApi -c Release --no-restore
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar la API.' }

  $env:ASPNETCORE_ENVIRONMENT = 'Development'
  $env:ConnectionStrings__DefaultConnection = 'Server=localhost;Database=Hcu008Db_QA;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;'
  $env:Database__ApplyMigrationsOnStartup = 'true'
  $env:Seed__Enabled = 'true'
  $env:Seed__AdminPassword = 'Admin123'
  $env:Seed__DoctorPassword = 'Doctor123'
  $env:Jwt__Key = 'HCU008_QA_KEY_SOLO_PARA_PRUEBAS_AUTOMATIZADAS_2026_64_CARACTERES'

  $salida = Join-Path $env:TEMP 'hcu008-qa-api.out.log'
  $errorApi = Join-Path $env:TEMP 'hcu008-qa-api.err.log'
  Remove-Item -LiteralPath $salida,$errorApi -Force -ErrorAction SilentlyContinue

  $inicioApi = @{
    FilePath = 'dotnet.exe'
    ArgumentList = @($dllApi, '--urls', $url)
    WorkingDirectory = (Split-Path -Parent $dllApi)
    RedirectStandardOutput = $salida
    RedirectStandardError = $errorApi
    WindowStyle = 'Hidden'
    PassThru = $true
  }
  $procesoApi = Start-Process @inicioApi

  $limite = (Get-Date).AddSeconds(45)
  do {
    Start-Sleep -Milliseconds 750
    try { $estado = Invoke-RestMethod -Uri "$url/health/ready" -TimeoutSec 3 } catch { $estado = $null }
  } while (-not $estado -and (Get-Date) -lt $limite -and -not $procesoApi.HasExited)

  if (-not $estado) {
    $detalle = if (Test-Path $errorApi) { Get-Content $errorApi -Tail 40 | Out-String } else { '' }
    throw "La API QA no inició correctamente. $detalle"
  }

  & $sqlcmd -S localhost -E -C -b -d Hcu008Db_QA -i $datosQa
  if ($LASTEXITCODE -ne 0) { throw 'No se pudieron cargar los datos ficticios QA.' }

  dotnet run --project $proyectoCarga -c Release -- --url $url --solicitudes $Solicitudes --concurrencia $Concurrencia --clave-doctor Doctor123
  if ($LASTEXITCODE -ne 0) { throw "La prueba de carga terminó con código $LASTEXITCODE." }
}
finally {
  if ($procesoApi -and -not $procesoApi.HasExited) {
    Stop-Process -Id $procesoApi.Id -Force -ErrorAction SilentlyContinue
  }
  foreach ($nombre in $variables) {
    [Environment]::SetEnvironmentVariable($nombre, $anteriores[$nombre], 'Process')
  }
}
