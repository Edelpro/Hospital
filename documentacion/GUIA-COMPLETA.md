# Guía completa de HCU 008 Emergencia

## 1. Partes del proyecto

- `src/app/components`: módulos clínicos que usa el personal del hospital.
- `src/app/pages`: páginas completas. Aquí están la presentación del proyecto y las pantallas administrativas.
- `src/app/services`: comunicación de Angular con la API.
- `src/app/models`: forma de los datos usados por la interfaz.
- `api/Hcu008.Api/Hcu008.Api`: API ASP.NET Core, reglas del servidor, seguridad y acceso a datos.
- `public/assets`: imágenes, logotipo y recursos públicos.
- `documentacion`: explicación funcional y decisiones de diseño.
- `herramientas`: scripts para preparar, iniciar y publicar.
- `APP-WEB-LISTA`: resultado generado y listo para ejecutar localmente.

`node_modules`, `dist`, `bin`, `obj` y `wwwroot` contienen dependencias o archivos generados. No son módulos funcionales y normalmente no se editan a mano.

## 2. Cómo funciona

1. El navegador muestra Angular.
2. El usuario inicia sesión y la API valida sus credenciales.
3. La API devuelve un token con el rol Administrador o Doctor.
4. Angular adjunta el token a las peticiones protegidas.
5. La API comprueba el permiso, valida los datos y consulta o modifica SQL Server.
6. La respuesta actualiza el tablero, el formulario o el reporte en pantalla.

## 3. Flujo clínico

1. **Paciente:** buscar por identificación para evitar duplicados o registrar uno nuevo.
2. **Atención:** abrir el episodio de emergencia y registrar motivo e ingreso.
3. **Triaje:** guardar signos vitales y prioridad roja, naranja, amarilla, verde o azul.
4. **Evaluación médica:** registrar enfermedad actual, estado clínico, alertas y examen físico.
5. **Diagnóstico:** documentar el criterio clínico del caso.
6. **Prescripción:** indicar medicamentos y tratamiento.
7. **Exámenes:** solicitar o registrar estudios complementarios.
8. **Evolución:** guardar el seguimiento del paciente.
9. **Egreso:** cerrar la atención con su condición y destino.
10. **Reporte:** reunir toda la atención en el Formulario HCU 008.

El tablero cuenta las atenciones activas, los casos críticos rojos o naranjas y los pendientes de triaje. Las atenciones cerradas permanecen en Historial.

## 4. Roles

- **Doctor:** pacientes, atenciones y todo el flujo clínico hasta el reporte.
- **Administrador:** funciones clínicas más usuarios, solicitudes, catálogos, auditoría y correcciones administrativas autorizadas.

La interfaz oculta las opciones no permitidas y la API vuelve a comprobar el rol. Esto evita que alguien obtenga acceso únicamente modificando la pantalla.

## 5. Página de presentación

La ruta `/` muestra una página informativa del proyecto con problemática, solución, alcance, roles, flujo y botones de acceso. Fue creada con Angular, HTML, CSS y TypeScript, usando los mismos colores y recursos visuales de HCU 008. El botón **Abrir sistema** lleva a `/app`.

## 6. Instalación PWA

La aplicación usa un `manifest.webmanifest` y un service worker de Angular. En un navegador compatible, el evento `beforeinstallprompt` habilita **Instalar HCU 008**. Al aceptar, Windows o el teléfono crea un acceso de aplicación. El `start_url` es `/app`, por eso la versión instalada abre el inicio de sesión.

La instalación no copia la base de datos dentro del navegador. La API y SQL Server deben seguir activos para iniciar sesión, consultar y guardar información clínica.

## 7. Formas de ejecutar

### Desarrollo

Ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\herramientas\INICIAR-PRESENTACION.ps1
```

Angular abre en `http://localhost:4200` y envía `/api` a la API de desarrollo en `http://localhost:5219`.

### Aplicación integrada

Primero genere la entrega:

```powershell
powershell -ExecutionPolicy Bypass -File .\herramientas\PUBLICAR-APP-WEB.ps1
```

El script compila Angular, copia su resultado a `wwwroot`, publica la API y genera `APP-WEB-LISTA`. Después ejecute `APP-WEB-LISTA/ABRIR-APP-WEB.cmd`. La API sirve la página y los endpoints desde `http://localhost:8080`.

## 8. Qué significa cada dirección

- `http://localhost:8080/`: presentación del proyecto.
- `http://localhost:8080/app`: sistema hospitalario integrado.
- `http://localhost:4200/`: interfaz en desarrollo.
- `http://localhost:5219/api`: API en desarrollo.

`localhost` solo es visible en el equipo que ejecuta el servidor. Para usarlo desde Internet se necesita alojamiento con HTTPS y una base de datos accesible desde el servidor.
