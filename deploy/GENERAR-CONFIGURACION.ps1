[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Dominio,

  [Parameter(Mandatory = $true)]
  [string]$CorreoAdministrador,

  [string]$NombresAdministrador = 'Administrador',
  [string]$ApellidosAdministrador = 'Hospital'
)

$ErrorActionPreference = 'Stop'
$destino = Join-Path $PSScriptRoot '.env'

if (Test-Path -LiteralPath $destino) {
  throw "Ya existe $destino. Muévalo o elimínelo únicamente si desea generar secretos nuevos."
}

if ($Dominio -notmatch '^[A-Za-z0-9.-]+$' -or $Dominio -notmatch '\.') {
  throw 'Ingrese un dominio válido, por ejemplo hcu008.hospital.com.'
}

if ($CorreoAdministrador -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
  throw 'Ingrese un correo de administrador válido.'
}

function Nueva-Clave([string]$prefijo) {
  return "$prefijo$([Guid]::NewGuid().ToString('N'))$([Guid]::NewGuid().ToString('N'))"
}

$claveSql = Nueva-Clave 'Sql1!'
$claveJwt = Nueva-Clave 'Jwt1!'
$claveAdmin = Nueva-Clave 'Adm1!'

$contenido = @"
HCU_DOMAIN=$Dominio
HCU_SQL_PASSWORD=$claveSql
HCU_JWT_KEY=$claveJwt
HCU_JWT_ISSUER=Hcu008ApiProduccion
HCU_JWT_AUDIENCE=Hcu008WebProduccion
HCU_BOOTSTRAP_ENABLED=true
HCU_ADMIN_EMAIL=$CorreoAdministrador
HCU_ADMIN_PASSWORD=$claveAdmin
HCU_ADMIN_NOMBRES=$NombresAdministrador
HCU_ADMIN_APELLIDOS=$ApellidosAdministrador
"@

[System.IO.File]::WriteAllText($destino, $contenido, [System.Text.UTF8Encoding]::new($false))
Write-Host "Configuración creada en $destino" -ForegroundColor Green
Write-Host 'Guarde esta contraseña inicial del administrador en un gestor seguro:' -ForegroundColor Yellow
Write-Host $claveAdmin -ForegroundColor Yellow
Write-Host 'Después del primer ingreso, cambie HCU_BOOTSTRAP_ENABLED a false.' -ForegroundColor Cyan
