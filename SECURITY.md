# Seguridad

## Uso previsto

HCU 008 se publica como prototipo académico y demostración técnica. No debe procesar datos clínicos reales ni exponerse directamente a Internet sin una revisión profesional de seguridad, privacidad y cumplimiento sanitario.

## Información que nunca debe incluirse en Git

- Contraseñas o credenciales de usuarios.
- Claves JWT, tokens o secretos de servicios externos.
- Archivos `.env` de entornos reales.
- Respaldos de SQL Server (`.bak`).
- Reportes PDF, fotografías o información identificable de pacientes.
- Certificados y claves privadas de HTTPS.

Los valores de producción deben proporcionarse mediante variables de entorno o un gestor de secretos. El archivo `deploy/.env.production.example` contiene únicamente la estructura esperada y no credenciales reales.

## Requisitos mínimos antes de producción

1. Rotar todas las claves utilizadas durante el desarrollo.
2. Habilitar HTTPS y restringir CORS al dominio definitivo.
3. Desactivar usuarios y datos de demostración.
4. Aplicar el principio de mínimo privilegio en SQL Server y en los roles del sistema.
5. Ejecutar pruebas de autenticación, autorización, carga, respaldo y restauración.
6. Configurar monitoreo, auditoría y alertas de acceso.
7. Obtener aprobación clínica, legal y de protección de datos de la institución.

## Reporte de vulnerabilidades

No publique contraseñas, datos clínicos ni detalles explotables en un issue público. Reporte el problema de manera privada al responsable del repositorio, indicando el componente afectado, pasos de reproducción y efecto observado.
