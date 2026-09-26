$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$api = Join-Path $raiz 'api\Hcu008.Api\Hcu008.Api'
$web = Join-Path $raiz 'dist\hcu008-emergencia\browser'
$wwwroot = Join-Path $api 'wwwroot'
$salida = Join-Path $raiz 'APP-WEB-LISTA'

if (-not $wwwroot.StartsWith($raiz, [System.StringComparison]::OrdinalIgnoreCase) -or
    -not $salida.StartsWith($raiz, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Las carpetas de publicación deben permanecer dentro del proyecto.'
}

Push-Location $raiz
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar Angular.' }

  if (Test-Path -LiteralPath $wwwroot) {
    Get-ChildItem -LiteralPath $wwwroot -Force | Remove-Item -Recurse -Force
  } else {
    New-Item -ItemType Directory -Path $wwwroot | Out-Null
  }

  Copy-Item -Path (Join-Path $web '*') -Destination $wwwroot -Recurse -Force

  if (Test-Path -LiteralPath $salida) {
    $procesosPublicados = Get-Process -Name 'Hcu008.Api' -ErrorAction SilentlyContinue |
      Where-Object { $_.Path -and $_.Path.StartsWith($salida, [System.StringComparison]::OrdinalIgnoreCase) }

    if ($procesosPublicados) {
      Write-Host 'Cerrando la versión 8080 anterior para actualizar sus archivos...' -ForegroundColor Yellow
      $procesosPublicados | Stop-Process -Force
      Start-Sleep -Seconds 2
    }

    Get-ChildItem -LiteralPath $salida -Force | Remove-Item -Recurse -Force
  } else {
    New-Item -ItemType Directory -Path $salida | Out-Null
  }

  dotnet publish (Join-Path $api 'Hcu008.Api.csproj') -c Release -o $salida --no-restore
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo publicar la API C#.' }
  Copy-Item -LiteralPath (Join-Path $raiz 'ABRIR-APP-WEB.cmd') -Destination $salida -Force
  Write-Host "Aplicación preparada en: $salida" -ForegroundColor Green
} finally {
  Pop-Location
}
