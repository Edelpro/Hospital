# Operación, monitoreo y soporte de HCU 008

## Monitoreo mínimo

- `/health/live`: confirma que el proceso está activo.
- `/health/ready`: confirma que la aplicación puede conectarse a SQL Server.
- Docker reinicia automáticamente los servicios detenidos y reporta la salud del contenedor.
- Revisar disponibilidad, latencia, espacio en disco, uso de CPU/RAM, errores HTTP 5xx, intentos fallidos de acceso y antigüedad del último respaldo.
- Configurar alertas externas; un sistema que se supervisa a sí mismo no puede avisar cuando todo el servidor está apagado.

## Frecuencia

- Cada 1–5 minutos: disponibilidad externa y HTTPS.
- Diario: resultado de respaldos, errores y espacio libre.
- Semanal: accesos anómalos, usuarios activos y actualizaciones críticas.
- Mensual: restauración real de una copia en QA y prueba funcional.
- Trimestral: prueba de carga, revisión de permisos y simulacro de incidente.

## Soporte

Definir un responsable técnico, horario, canal de contacto, prioridades y tiempos de atención. Una caída que impida registrar la emergencia es crítica; un defecto visual sin pérdida de funciones es de prioridad baja.

## Actualizaciones

Toda versión debe tener número, fecha, cambios, respaldo previo, prueba QA, plan de reversión y aprobación. No se modifica directamente el servidor durante atención clínica sin una ventana coordinada.

## Mensajería institucional

La interfaz actual comparte el PDF mediante el menú seguro del dispositivo o ayuda a adjuntarlo manualmente. El envío automático requiere contratar y configurar un proveedor oficial de correo y WhatsApp Business/Cloud API, verificar el número, aprobar plantillas, obtener consentimiento institucional y guardar credenciales como secretos. Nunca se colocarán tokens de mensajería en Angular ni en el repositorio.
