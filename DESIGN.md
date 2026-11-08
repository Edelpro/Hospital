# HCU 008 — contexto de diseño

## Producto y objetivo

Sistema clínico de emergencia para personal administrativo y médico. Su tarea principal es registrar una atención completa del Formulario 008 con rapidez, conservar la continuidad entre módulos y mostrar el estado clínico sin ambigüedad.

## Dirección visual

- **Carácter:** clínico, sereno y operativo; la interfaz debe sentirse institucional y confiable.
- **Color principal:** verde hospital `#176b50`; verde profundo `#103f32`; fondo `#f3f6f5`; superficie `#ffffff`; borde `#dce5e0`.
- **Tonos semánticos:** éxito `#2a9d8f`; advertencia `#e9c46a`; peligro `#e76f51`; información `#2563eb`; naranja clínico `#f97316`.
- **Tipografía:** Segoe UI como fuente de interfaz y datos. La jerarquía depende de tamaño y peso, sin familias decorativas.
- **Geometría:** radios de 8–16 px, bordes suaves y sombras discretas. Los colores de triaje tienen significado clínico y siempre deben acompañarse de texto.

## Estructura y navegación

- Barra lateral verde con módulos ordenados según el flujo clínico.
- Encabezado superior con título de la vista y acciones globales.
- Resumen persistente de paciente y atención seleccionada.
- Los formularios clínicos conservan su estado al cambiar de módulo durante la misma atención.
- Los módulos con múltiples registros permiten guardar varios elementos y ofrecen una acción separada para continuar.

## Controles y comportamiento

- Acción primaria: botón verde sólido. Acción secundaria: contorno neutro. Eliminación: rojo con confirmación propia de la aplicación.
- Todo guardado espera confirmación de la API, bloquea envíos duplicados y muestra resultado mediante el sistema común de mensajes.
- Las listas deben incluir estados de carga, vacío y error.
- Las plantillas clínicas se crean únicamente desde el módulo administrativo Plantillas. El administrador elige Diagnósticos, Prescripciones, Exámenes o Evoluciones y completa un formulario específico.
- Los módulos clínicos muestran las plantillas activas como tarjetas rápidas y no mezclan la creación administrativa con el registro del paciente.
- Los campos de opción única usan el `select` nativo del navegador. Todo estado vacío muestra “Seleccione una opción” y nunca un cuadro sin texto.
- El visor corporal conserva la ilustración anatómica frontal validada y usa recursos laterales específicos para los perfiles izquierdo y derecho. Las vistas laterales son avatares clínicos cubiertos con regiones corporales delimitadas; no se muestran detalles anatómicos sensibles ni se inventa una vista posterior.
- Los datos ya guardados viven en SQL Server. Los datos todavía no guardados se mantienen mientras el usuario navega entre módulos abiertos.

## Accesibilidad y adaptación

- Objetivo WCAG 2.2 AA: etiquetas visibles, foco claro, contraste suficiente y controles nativos de teclado.
- Vista móvil con menú adaptable y formularios de una columna.
- Se respeta `prefers-reduced-motion` y se mantiene una barra de desplazamiento visible.
- La interfaz y los mensajes usan español de Ecuador; fechas visibles usan `es-EC`.

## Límites

- Las plantillas compartidas se guardan en la base de datos mediante la API y no contienen datos del paciente.
- Los borradores no sustituyen el botón Guardar ni la confirmación del servidor.
- El reporte final se genera únicamente desde información confirmada por la API.
- El reporte clínico se genera como PDF real de una sola hoja A4: prioriza identificación, triaje, hallazgos, diagnósticos, tratamiento, resultados, egreso y validación profesional. El detalle completo permanece en el sistema.
- En dispositivos compatibles se comparte el archivo mediante el menú nativo del sistema. En WhatsApp Web, el sistema descarga el PDF, abre la conversación y pide al usuario adjuntarlo antes del envío final.
- La aplicación nunca debe indicar que un reporte fue enviado hasta que el sistema operativo confirme que la acción de compartir terminó.
