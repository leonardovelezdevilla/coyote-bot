# Coyote Bot — sistema de la Escuela de Fútbol Coyote

Bot de WhatsApp, panel de administración, página web pública y módulos de gestión (asistencia con carnet QR, caja, personal por sede, cuotas, uniformes, encuestas, referidos), todo en un solo Worker de Cloudflare con base de datos D1.

- **Instalación paso a paso:** [GUIA.md](GUIA.md)
- **Código:** `src/` (bot.js conversación y automatizaciones · index.js rutas y API · panel.js panel · web.js página pública · carnet.js QR · campanas.js mensajes a grupos · config.js ajustes editables · whatsapp.js API de Meta)
- **Base de datos:** `schema.sql`
- **Pruebas de punta a punta:** `npm test` (levanta un WhatsApp simulado y corre 240+ comprobaciones)

## Comandos

```bash
npm install
npm run dev               # bot en local (necesita .dev.vars; ver .dev.vars.ejemplo)
npm test                  # todas las pruebas
npm run deploy:prueba     # entorno de prueba
npm run deploy            # producción
npm run db:copia          # descarga una copia .sql de la base de producción
```

Las claves (token de WhatsApp, clave del panel, etc.) nunca van en el código: se guardan con `npx wrangler secret put`.
