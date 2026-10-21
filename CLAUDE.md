# Coyote Bot — notas para quien trabaje en este código

Sistema de la Escuela de Fútbol Coyote (Lima Norte): bot de WhatsApp, panel de administración, página web y módulos de gestión, en un solo Worker de Cloudflare con base D1. Lo usa Katy (administradora, poca práctica con tecnología) y el personal de cada sede desde el celular.

## Cómo trabajar aquí
- El código vive en github.com/leonardovelezdevilla/coyote-bot (privado, rama `main`); la versión del repositorio manda sobre cualquier copia de estos archivos. Antes de tocar nada, lee este archivo y `GUIA.md`.
- Propón mejoras y revisa la seguridad por iniciativa propia, pero pregunta antes de cualquier decisión difícil de revertir (el número de WhatsApp, borrar datos, gastar dinero, cambiar plantillas aprobadas).
- No construir la respuesta con IA a los mensajes que el bot no entiende: está pendiente de analizar su costo, no de implementar.
- Documentos vivos en artefactos de Claude: «Guía de uso del Sistema Coyote» (para Katy y el personal) y «Sistema Coyote — Presentación». Si cambia lo que ve Katy, actualizar la guía de uso.
- Los commits van en español, con un mensaje que explique el porqué; cada entrega termina con `git push`.

## Reglas del proyecto
- Todo lo que ve un usuario va en español sencillo, con letra grande, botones de un toque y siempre una forma de deshacer. Nada técnico en pantalla.
- El bot nunca pide el nombre del niño; solo la edad y el nombre del padre o madre.
- Las claves van solo en secretos de Wrangler (`wrangler secret put`), nunca en archivos.
- La identidad visual es fija: rojo #c8202a, carbón #1f1b19, verde cancha #1e7a46, tiza #f2f3f0; tipografías Barlow Condensed y Barlow; escudo hexagonal; modo oscuro. Todo pasa WCAG 2.2 AA (se audita con axe).
- Solo Katy (rol admin) y el cargo «Administrativo de sede» pueden vender o cobrar; los profesores no ven dinero. Los planes a medida y las cuotas, solo Katy.
- Katy edita todo desde Ajustes (`src/config.js` → DEFAULTS); si agregas algo configurable, agrégalo ahí, en `validarConfig` y en la pantalla de Ajustes.
- Lista de espera automática: construida pero apagada por decisión de Leonardo; no encenderla sin que lo pida.

## Dónde está cada cosa
- `src/bot.js` conversación, preguntas frecuentes, automatizaciones por hora (`tareasDeLaHora`).
- `src/index.js` rutas, API del panel, permisos por rol (`permitidoPersonal`, `vende`), webhook.
- `src/panel.js` panel (HTML + funciones `app*` que se insertan con `.toString()`; por eso no uses sintaxis que esbuild transforme con `__name`).
- `src/web.js` página pública; `src/carnet.js` carnet QR; `src/campanas.js` mensajes a grupos; `src/whatsapp.js` API de Meta; `src/drive.js` copias en Google Drive; `src/privacidad.js` página de privacidad.
- `schema.sql` tablas; `GUIA.md` instalación y operación técnica; `pruebas/` pruebas de punta a punta (`correr.mjs` levanta un WhatsApp simulado en :9999 y `wrangler dev` en :8787).
- Entornos: producción y `prueba` (`npm run deploy:prueba`), cada uno con su D1 y su R2. Secretos: WHATSAPP_TOKEN, APP_SECRET, VERIFY_TOKEN, ADMIN_PASSWORD, SESSION_SECRET y, opcional, GOOGLE_CUENTA.

## Antes de entregar
- `npm test` debe quedar en verde (hoy 259 pruebas). No edites archivos mientras corre: `wrangler dev` recarga y las pruebas fallan a medias. Si una corrida se corta, asegúrate de que no quede un `wrangler dev` en el puerto 8787.
- Si agregas una función del panel, agrega su prueba en `pruebas/` y explícala en la guía de uso si Katy la va a ver.
- Si tocaste el panel o la web, revísalos en celular (390 px) y escritorio, en claro y oscuro.
- Si agregas una plantilla de Meta, documenta su texto exacto, variables y botones en `GUIA.md` (paso 6).
