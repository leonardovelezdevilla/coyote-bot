# Coyote Bot — notas para quien trabaje en este código

Sistema de la Escuela de Fútbol Coyote (Lima Norte): bot de WhatsApp, panel de administración, página web y módulos de gestión, en un solo Worker de Cloudflare con base D1. Lo usa Katy (administradora, poca práctica con tecnología) y el personal de cada sede desde el celular.

## Reglas del proyecto
- Todo lo que ve un usuario va en español sencillo, con letra grande, botones de un toque y siempre una forma de deshacer. Nada técnico en pantalla.
- El bot nunca pide el nombre del niño; solo la edad y el nombre del padre o madre.
- Las claves van solo en secretos de Wrangler (`wrangler secret put`), nunca en archivos.
- La identidad visual es fija: rojo #c8202a, carbón #1f1b19, verde cancha #1e7a46, tiza #f2f3f0; tipografías Barlow Condensed y Barlow; escudo hexagonal; modo oscuro. Todo pasa WCAG 2.2 AA (se audita con axe).
- Solo Katy (rol admin) y el cargo «Administrativo de sede» pueden vender o cobrar; los profesores no ven dinero. Los planes a medida y las cuotas, solo Katy.
- Katy edita todo desde Ajustes (`src/config.js` → DEFAULTS); si agregas algo configurable, agrégalo ahí, en `validarConfig` y en la pantalla de Ajustes.

## Dónde está cada cosa
- `src/bot.js` conversación, preguntas frecuentes, automatizaciones por hora (`tareasDeLaHora`).
- `src/index.js` rutas, API del panel, permisos por rol (`permitidoPersonal`, `vende`), webhook.
- `src/panel.js` panel (HTML + funciones `app*` que se insertan con `.toString()`; por eso no uses sintaxis que esbuild transforme con `__name`).
- `src/web.js` página pública; `src/carnet.js` carnet QR; `src/campanas.js` mensajes a grupos; `src/whatsapp.js` API de Meta.
- `schema.sql` tablas; `GUIA.md` instalación y uso; `pruebas/` pruebas de punta a punta.

## Antes de entregar
- `npm test` debe quedar en verde (levanta un WhatsApp simulado y corre todas las pruebas).
- Si tocaste el panel o la web, revísalos en celular (390 px) y escritorio, en claro y oscuro.
- Si agregas una plantilla de Meta, documenta su texto exacto, variables y botones en `GUIA.md` (paso 6).
