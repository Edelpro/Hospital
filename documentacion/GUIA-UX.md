# Contrato de interacción

## Canonical UI Map
| Capacidad | Propietario | Contrato |
|---|---|---|
| Form | Angular Forms en componentes existentes | Validación frontend y API; preservar campos ante error |
| Select/Listbox | Select nativo | Popup del sistema aceptado |
| Date | Inputs nativos existentes | Fechas clínicas existentes; expiración de sesión UTC |
| Scrollbar | src/styles.css | Visible; variante oscura en sidebar |
| Toast | UiMessageService y UiModal | Mensajes y confirmaciones compartidos; migración de foco pendiente |
| CRUD | Servicios y controladores | API autoriza; no insertar objetos anidados desde pacientes/atenciones |

## Permisos
Admin y Doctor son roles canónicos. Mantener permisos clínicos existentes hasta confirmar matriz. Solo Admin gestiona usuarios y modifica catálogos. Login y solicitud de acceso públicos; el resto exige sesión. API verifica usuario activo y rol vigente.

## Navegación
App usa estado local, sin rutas. No poner pacientes ni búsquedas en URL. Un módulo sin atención muestra explicación y conserva vista. Un 401 de la API cierra sesión. Diferenciar credenciales incorrectas y red caída.

El tablero abre en “Todas” y distingue “Activas” de “Historial”. Las atenciones con egreso o cerradas permanecen visibles y su acción abre el reporte. Al fallar una actualización se conserva la última información cargada y se ofrece reintentar.

## Verificación pendiente
CRUD con base de datos de pruebas, concurrencia y reglas de cierre clínico. Límite CSS de producción ajustado al tamaño existente con avisos conservados; no es optimización.
