$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $raiz
try {
  npm ci
  npm run build
  dotnet build 'api\Hcu008.Api\Hcu008.Api\Hcu008.Api.csproj' -c Release
  Write-Host 'Proyecto preparado correctamente para la presentación.' -ForegroundColor Green
} finally {
  Pop-Location
}
