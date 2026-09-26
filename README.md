# HCU 008 — Emergencia hospitalaria

Aplicación clínica para gestionar pacientes, atenciones, triaje, evaluación médica, diagnósticos, prescripciones, exámenes, evoluciones, egreso y reportes. Incluye permisos diferenciados para Administrador y Doctor.

## Qué significa preparar la presentación

La aplicación tiene tres partes que deben estar disponibles al mismo tiempo:

1. SQL Server LocalDB con la base `Hcu008Db`.
2. La API ASP.NET Core en `http://localhost:5219`.
3. La interfaz Angular en `http://localhost:4200`.

Los archivos de apoyo están agrupados en `herramientas`. `INICIAR-PRESENTACION.ps1` inicia el entorno de desarrollo. `PUBLICAR-APP-WEB.ps1` une Angular y la API en una sola aplicación web para que no sea necesario ejecutar `ng serve`. La explicación completa está en `documentacion/GUIA-COMPLETA.md`.

## Crear la aplicación web integrada

```powershell
powershell -ExecutionPolicy Bypass -File .\herramientas\PUBLICAR-APP-WEB.ps1
```

El resultado queda en `APP-WEB-LISTA`. Dentro de esa carpeta, ejecute `ABRIR-APP-WEB.cmd`; abrirá `http://localhost:8080` y la interfaz y la API funcionarán desde la misma dirección.

La interfaz también está preparada como PWA instalable. Cuando se publique con HTTPS, Chrome o Edge mostrará **Instalar HCU 008**. Al aceptarlo, se crea un acceso como aplicación en Windows, Android o el dispositivo compatible. La interfaz puede abrir su estructura básica desde caché, pero consultar o guardar datos clínicos siempre requiere conexión con la API y la base de datos.

## Preparación inicial

Requisitos: Node.js 24, npm 11, .NET 10 y SQL Server LocalDB.

Desde PowerShell, dentro de la carpeta del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\herramientas\PREPARAR-PRESENTACION.ps1
```

## Iniciar la demostración

```powershell
powershell -ExecutionPolicy Bypass -File .\herramientas\INICIAR-PRESENTACION.ps1
```

Espere unos segundos y abra `http://localhost:4200` si el navegador no se abre automáticamente.

## Verificación antes de exponer

- Iniciar sesión como Administrador y confirmar que aparecen Usuarios y Catálogos.
- Iniciar sesión como Doctor y confirmar que no aparecen esas opciones administrativas.
- Registrar un paciente de prueba y abrir una atención.
- Guardar triaje, evaluación, diagnóstico, prescripción, examen y evolución.
- Registrar el egreso y comprobar que la atención desaparece de Activas y aparece en Historial.
- Abrir el reporte clínico final.

## Respaldo de la base

Antes de mover o reinstalar el sistema, cree una copia `.bak` de `Hcu008Db` desde SQL Server Management Studio: clic derecho en la base, **Tasks**, **Back Up**, tipo **Full**, seleccione una ubicación privada y ejecute el respaldo. Los respaldos contienen información clínica y deben permanecer fuera de carpetas públicas o repositorios.

## Publicación en Internet

No es necesaria para una presentación local. Si se desea publicar, primero se debe elegir el servidor. Después se reemplazan las direcciones `localhost`, se limita CORS al dominio definitivo, se guarda la clave JWT como secreto del servidor, se usa SQL Server de producción y se habilita HTTPS.
