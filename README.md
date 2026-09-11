# ECO.EXPERIENCES — V2 funcional

Esta versión conserva la identidad visual aprobada y recupera la arquitectura funcional: entrada/registro, ECO.TRONIC, ECO.LAB, estilos y creación de comanda.

## Archivos
- `index.html` — estructura visual + modales de entrada y laboratorio.
- `style.css` — identidad visual responsive.
- `app.js` — Supabase Auth + ECO.TRONIC guiado + ECO.LAB + comanda.
- `config.js` — URL de Supabase + Publishable Key.
- `supabase_migration.sql` — conexión Auth → clientes + RLS/grants.

## Paso 1 — Supabase
1. Abrir SQL Editor.
2. Ejecutar `supabase_migration.sql` completo.
3. Revisar que no haya errores.

## Paso 2 — API
En `config.js` reemplazar:
- `https://TU-PROYECTO.supabase.co`
- `sb_publishable_TU_CLAVE_PUBLICA`

Usar únicamente la **Publishable Key**. Nunca `sb_secret_...` ni `service_role`.

## Paso 3 — GitHub Pages
Subir `index.html`, `style.css`, `app.js`, `config.js`, `supabase_migration.sql` y la carpeta `images/` a la raíz del repositorio.

## Flujo V2
ENTRADA → REGISTRO/LOGIN → ECO.TRONIC → IDEA → ESTILOS → DATOS → COMANDA → SUPABASE.

ECO.TRONIC en esta V2 es un flujo guiado estructurado; todavía no llama a un modelo de IA externo. La integración de IA generativa y el motor de cotización se pueden conectar después sin rehacer la interfaz.
