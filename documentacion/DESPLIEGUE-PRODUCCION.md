# Despliegue permanente de HCU 008

## Qué está preparado

La carpeta `deploy` contiene una publicación reproducible con tres servicios:

- `app`: Angular y ASP.NET Core en un solo contenedor.
- `sql`: SQL Server con volumen persistente.
- `proxy`: Caddy, encargado del dominio y del certificado HTTPS automático.

Esta composición permite una instalación piloto en un servidor Linux. Para operación clínica sostenida conviene usar SQL Server o Azure SQL administrado, con copias externas y soporte contratado; SQL Server Express tiene límites de capacidad.

## Requisitos del servidor

- Servidor Linux actualizado con mínimo 2 vCPU, 4 GB de RAM y almacenamiento SSD. Para uso concurrente real, dimensionar mediante pruebas con la carga prevista.
- Docker Engine y el complemento Docker Compose.
- Dominio propio cuyo registro DNS apunte a la IP pública del servidor.
- Puertos TCP 80 y 443 permitidos en el firewall. No publicar directamente SQL Server ni el puerto interno 8080.
- Servicio de respaldo externo o almacenamiento fuera del mismo servidor.

## Primera publicación

Desde la raíz del proyecto en el servidor:

```powershell
cd deploy
.\GENERAR-CONFIGURACION.ps1 -Dominio hcu008.hospital.com -CorreoAdministrador administrador@hospital.com
.\PUBLICAR-SERVIDOR.ps1
```

Guarde la contraseña mostrada por el primer comando. Cuando confirme el primer ingreso, cambie `HCU_BOOTSTRAP_ENABLED=true` por `false` en `deploy/.env` y ejecute nuevamente `PUBLICAR-SERVIDOR.ps1`.

## Comprobaciones

```powershell
..\herramientas\COMPROBAR-SERVICIO.ps1 -Url https://hcu008.hospital.com
docker compose --env-file .env -f compose.production.yml ps
docker compose --env-file .env -f compose.production.yml logs --tail 100 app
```

Los secretos se guardan en `deploy/.env`, archivo excluido del repositorio. Debe protegerse con permisos del sistema y conservarse en un gestor de secretos.

## Copias y recuperación

En Windows local, `herramientas/RESPALDAR-BASE-DATOS.ps1` crea un respaldo completo con `CHECKSUM` y ejecuta `RESTORE VERIFYONLY`. La tarea `HCU008-Respaldo-Diario` lo ejecuta diariamente a las 02:00 y conserva 30 días.

La restauración real en una base temporal y su verificación de integridad se ejecutan con:

```powershell
powershell -ExecutionPolicy Bypass -File .\herramientas\VERIFICAR-RESTAURACION.ps1
```

En producción se requieren, además:

1. Copias automáticas diarias fuera del servidor.
2. Cifrado del almacenamiento del respaldo.
3. Una restauración de prueba mensual en un ambiente aislado.
4. Objetivos aprobados de pérdida máxima de datos y tiempo máximo de recuperación.
5. Registro de cada restauración, responsable y resultado.

## Actualización

1. Crear y verificar un respaldo.
2. Probar la versión en QA.
3. Ejecutar `PUBLICAR-SERVIDOR.ps1`.
4. Comprobar `/health/live`, `/health/ready`, inicio de sesión y un flujo clínico.
5. Conservar la imagen anterior hasta terminar la validación.

Cloudflare Quick Tunnel no forma parte de esta arquitectura. Solo se usa para demostraciones temporales.
