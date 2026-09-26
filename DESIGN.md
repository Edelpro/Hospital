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
- Las plantillas clínicas se crean con un campo de nombre visible; no se usan diálogos nativos del navegador.
- Los datos ya guardados viven en SQL Server. Los datos todavía no guardados se mantienen mientras el usuario navega entre módulos abiertos.

## Accesibilidad y adaptación

- Objetivo WCAG 2.2 AA: etiquetas visibles, foco claro, contraste suficiente y controles nativos de teclado.
- Vista móvil con menú adaptable y formularios de una columna.
- Se respeta `prefers-reduced-motion` y se mantiene una barra de desplazamiento visible.
- La interfaz y los mensajes usan español de Ecuador; fechas visibles usan `es-EC`.

## Límites

- Las plantillas personalizadas se guardan en el navegador del equipo actual y no contienen datos del paciente.
- Los borradores no sustituyen el botón Guardar ni la confirmación del servidor.
- El reporte final se genera únicamente desde información confirmada por la API.
