// Bandeja de chats, preguntas frecuentes, ubicación, audios, números excluidos y coexistencia
import crypto from "node:crypto";
import fs from "node:fs";
import { execSync } from "node:child_process";
const BOT = "http://127.0.0.1:8787";
const SECRET = "secreto-de-prueba";
const enviados = new URL("./enviados.jsonl", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const leer = () => fs.readFileSync(enviados, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
let fallas = 0, n = 0;
const ok = (cond, txt) => { console.log((cond ? "✔ " : "✘ ") + txt); if (!cond) fallas++; };
const sql = (q) => execSync(`npx wrangler d1 execute coyote-bot --local --json --command "${q.replace(/"/g, '\\"')}" 2>/dev/null`).toString();
const filas = (q) => JSON.parse(sql(q))[0].results;
const cookie = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, tipo: x.headers.get("content-type"), data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };
async function webhook(value) {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ field: "messages", value }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body);
}
const msg = (from, mensaje, nombre = "Rosa Pérez") => webhook({ contacts: [{ wa_id: from, profile: { name: nombre } }], messages: [{ from, id: "wamid.c" + ++n + Date.now(), timestamp: "1", ...mensaje }] });
const txt = (b) => b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : b.type === "location" ? "📍" + b.location.name : JSON.stringify(b.template);
const respuestas = (o) => o.filter((b) => b.type !== undefined && !b.status);
const leidos = (o) => o.filter((b) => b.status === "read");
const lista = (id, title) => ({ type: "interactive", interactive: { type: "list_reply", list_reply: { id, title } } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const texto = (t) => ({ type: "text", text: { body: t } });

// ---------- Historial y doble check ----------
const P = "51911111111";
let r = await api("GET", "/api/chats");
const cP = r.data.chats.find((c) => c.wa_id === P);
ok(r.status === 200 && cP && cP.ultimo_texto, `Lista de chats con último mensaje (${r.data.chats.length} chats, ${r.data.esperando} esperan)`);
r = await api("GET", "/api/chats/" + P);
ok(r.data.mensajes.some((m) => m.autor === "padre" && m.texto === "Rosa María") && r.data.mensajes.some((m) => m.autor === "bot" && m.tipo === "lista"), "El chat guarda lo que escribe el padre y lo que responde el bot");
let o = await msg(P, texto("menu"));
ok(leidos(o).length === 1, "Mensaje atendido por el bot → doble check azul");

// ---------- Pasar con Katy (modo panel) ----------
const Q = "51944444444";
await msg(Q, texto("hola"), "Carla");
await msg(Q, lista("E6", "6 a 9 años"), "Carla");
await msg(Q, btn("SMP"), "Carla");
o = await msg(Q, btn("INSCRIBIR"), "Carla");
const alPadre = respuestas(o).find((b) => b.to === Q);
const aviso = respuestas(o).find((b) => b.type === "template" && b.template.name === "aviso_panel");
ok(alPadre && /te escribe por aquí/.test(txt(alPadre)) && !/wa\.me/.test(txt(alPadre)), "Al inscribir: «Katy te escribe por aquí» (sin mandarlo a otro número)");
ok(aviso && aviso.template.components[0].parameters[0].text.includes(`/panel#chat-${Q}`), "El aviso a Katy abre ese chat en el panel");
let L = filas(`SELECT atencion, no_leidos FROM leads WHERE wa_id='${Q}'`)[0];
ok(L.atencion === "humano" && L.no_leidos === 1, "El chat queda «Atiendes tú» con 1 sin leer");
ok(!filas(`SELECT texto FROM mensajes WHERE wa_id='51985648093'`).length, "Los avisos a Katy no se mezclan con los chats");
o = await msg(Q, texto("hola? a qué hora me escriben"), "Carla");
L = filas(`SELECT no_leidos FROM leads WHERE wa_id='${Q}'`)[0];
ok(!respuestas(o).length && !leidos(o).length && L.no_leidos === 2, "Mientras atiende Katy, el bot no responde ni marca leído");
r = await api("GET", "/api/chats");
ok(r.data.esperando >= 1 && r.data.chats.find((c) => c.wa_id === Q).no_leidos === 2, "La insignia de Chats cuenta lo que espera respuesta");

// Abrir, leer y responder
r = await api("GET", "/api/chats/" + Q);
ok(r.data.ventana === true && r.data.ventanaHasta, "Ventana de 24 horas abierta");
let antes = leer().length;
await api("POST", `/api/chats/${Q}/leido`);
let nuevos = leer().slice(antes).map((e) => e.body);
ok(nuevos.some((b) => b.status === "read") && filas(`SELECT no_leidos FROM leads WHERE wa_id='${Q}'`)[0].no_leidos === 0, "Al abrir el chat: doble check azul y 0 sin leer");
antes = leer().length;
r = await api("POST", `/api/chats/${Q}/enviar`, { texto: "Hola Carla, soy Katy. Te paso los datos de pago." });
nuevos = leer().slice(antes).map((e) => e.body);
ok(r.status === 200 && nuevos.some((b) => b.to === Q && b.type === "text" && /soy Katy/.test(b.text.body)), "Katy responde desde el panel con el número del bot");
ok(filas(`SELECT autor FROM mensajes WHERE wa_id='${Q}' ORDER BY id DESC LIMIT 1`)[0].autor === "katy", "Su mensaje queda en el chat como «Tú»");
r = await api("POST", `/api/chats/${Q}/enviar`, { texto: "  " });
ok(r.status === 400, "No envía mensajes vacíos");

// Ventana cerrada → mensaje para retomar
sql(`UPDATE leads SET ultimo_entrante='${new Date(Date.now() - 25 * 3600e3).toISOString()}' WHERE wa_id='${Q}'`);
r = await api("POST", `/api/chats/${Q}/enviar`, { texto: "¿Sigues interesada?" });
ok(r.status === 409 && r.data.ventana === false, "Pasadas 24 h, no deja enviar texto libre: " + r.data.error);
antes = leer().length;
r = await api("POST", `/api/chats/${Q}/retomar`);
nuevos = leer().slice(antes).map((e) => e.body);
const ret = nuevos.find((b) => b.template?.name === "retomar_conversacion");
ok(r.status === 200 && ret && ret.template.components[0].parameters.map((p) => p.text).join("|") === "Carla|Katy", "Envía la plantilla «retomar_conversacion» con nombre y quién atiende");

// Devolver al bot
await api("POST", `/api/chats/${Q}/atencion`, { modo: "bot" });
o = await msg(Q, texto("hola"), "Carla");
ok(respuestas(o).length > 0 && filas(`SELECT atencion FROM leads WHERE wa_id='${Q}'`)[0].atencion === "bot", "«Devolver al bot»: el bot vuelve a responder");
// Tomar el chat sin que lo pidan
await api("POST", `/api/chats/${Q}/atencion`, { modo: "humano" });
o = await msg(Q, texto("gracias"), "Carla");
ok(!respuestas(o).length, "«Atender yo»: el bot se calla en ese chat");
// Pasado el tiempo, el bot retoma solo
sql(`UPDATE leads SET atencion_desde='${new Date(Date.now() - 13 * 3600e3).toISOString()}', no_leidos=0 WHERE wa_id='${Q}'`);
o = await msg(Q, texto("hola de nuevo"), "Carla");
ok(respuestas(o).length > 0, "Si Katy no escribe en 12 horas, el bot vuelve a atender");

// ---------- Preguntas frecuentes ----------
const F = "51955500001";
o = respuestas(await msg(F, texto("Buenas tardes, cuánto cuesta?"), "Mario"));
ok(/S\/ 250/.test(txt(o[0])) && /qué edad/i.test(txt(o[1])), "Pregunta de precio en el primer mensaje: responde y sigue con la edad");
await msg(F, lista("E10", "10 a 13 años"), "Mario");
o = respuestas(await msg(F, texto("y dónde queda?"), "Mario"));
ok(/Estadio Guadalupano/.test(txt(o[0])) && o[1]?.interactive?.action?.buttons?.length >= 2, "«¿Dónde queda?» a mitad de camino: da las sedes y vuelve a preguntar la sede");
o = respuestas(await msg(F, texto("entrenan niñas tambien"), "Mario"));
ok(/niñas y niños/.test(txt(o[0])), "Entiende sin tildes: «niñas tambien»");

// ---------- Audios y fotos ----------
o = respuestas(await msg(F, { type: "audio", audio: { id: "123456789", mime_type: "audio/ogg" } }, "Mario"));
ok(/solo puedo leer mensajes escritos/.test(txt(o[0])) && o[0].interactive.action.buttons.length === 3, "Audio: responde amable con botones (información / preguntas / hablar con Katy)");
const ma = filas(`SELECT tipo, media_id FROM mensajes WHERE wa_id='${F}' AND tipo='audio'`)[0];
ok(ma && ma.media_id === "123456789", "El audio queda en el chat para escucharlo en el panel");
r = await fetch(BOT + "/api/media/123456789", { headers: { Cookie: cookie } });
ok(r.status === 200 && r.headers.get("content-type") === "audio/ogg" && (await r.text()) === "OggS-prueba", "El panel reproduce el audio (se trae desde WhatsApp)");
ok((await fetch(BOT + "/api/media/999999999", { headers: { Cookie: cookie } })).status === 404, "Solo se pueden abrir archivos que están en algún chat");
ok((await fetch(BOT + "/api/media/123456789")).status === 401, "Sin sesión no se pueden ver los archivos");
await msg(F, { type: "image", image: { id: "7000001", caption: "mi hijo en su último partido" } }, "Mario");
r = await api("GET", "/api/chats/" + F);
ok(r.data.mensajes.some((m) => m.tipo === "imagen" && m.texto === "mi hijo en su último partido"), "Foto con su texto queda en el chat");

// ---------- Ubicación como pin ----------
let c = (await api("GET", "/api/config")).data.config;
c.sedes.SMP.coordenadas = "-11.9861, -77.0835";
ok((await api("PUT", "/api/config", c)).status === 200, "Guardar coordenadas de la sede");
c.sedes.LO.coordenadas = "en la esquina";
let mal = await api("PUT", "/api/config", c);
ok(mal.status === 400 && mal.data.errores.some((e) => /coordenadas/.test(e)), "Coordenadas mal escritas → error claro");
const U = "51955500002";
await msg(U, texto("hola"), "Lucía");
await msg(U, lista("E6", "6 a 9 años"), "Lucía");
await msg(U, btn("SMP"), "Lucía");
o = respuestas(await msg(U, btn("CLASE"), "Lucía"));
const fecha = o[0].interactive.action.sections[0].rows[0].id;
await msg(U, lista(fecha, "x"), "Lucía");
o = respuestas(await msg(U, texto("Lucía Ramos"), "Lucía"));
const pin = o.find((b) => b.type === "location");
ok(/Listo, Lucía/.test(txt(o[0])) && pin && pin.location.latitude === -11.9861 && /San Martín/.test(pin.location.name), "Al confirmar la clase envía el pin de la cancha");

// ---------- Fuera de horario ----------
c = (await api("GET", "/api/config")).data.config;
const horaLima = new Date(Date.now() - 5 * 3600e3).getUTCHours();
c.atencion.desde = horaLima >= 12 ? 5 : 13; c.atencion.hasta = horaLima >= 12 ? 6 : 14; // horario que no incluye la hora actual
await api("PUT", "/api/config", c);
o = respuestas(await msg(U, btn("HUMANO"), "Lucía"));
ok(/atiende de/.test(txt(o[0])), "Fuera de horario, el bot dice a qué hora responde Katy: " + txt(o[0]).split("\n").pop());

// ---------- Números excluidos ----------
c.atencion.excluidos = "977 777 777";
await api("PUT", "/api/config", c);
o = await msg("51977777777", texto("hola amor, ¿a qué hora llegas?"), "Esposo");
ok(!o.length && !filas(`SELECT 1 FROM mensajes WHERE wa_id='51977777777'`).length, "Número excluido: el bot no responde ni guarda nada");
c.atencion.excluidos = "51977777777, hola";
mal = await api("PUT", "/api/config", c);
ok(mal.status === 400 && mal.data.errores.some((e) => /"hola" no parece un celular/.test(e)), "Lista de excluidos con error → mensaje claro");

// ---------- Coexistencia: número compartido con la app del celular ----------
// Katy escribe desde su celular a un padre que atiende el bot
o = await webhook({ message_echoes: [{ from: "51900000000", to: P, id: "wamid.eco1", timestamp: "1", type: "text", text: { body: "Hola Rosa, te escribo desde mi celular" } }] });
const eco = filas(`SELECT autor, texto FROM mensajes WHERE wa_id='${P}' ORDER BY id DESC LIMIT 1`)[0];
ok(eco.autor === "katy" && /desde mi celular/.test(eco.texto) && filas(`SELECT atencion FROM leads WHERE wa_id='${P}'`)[0].atencion === "humano", "Lo que Katy escribe en la app del celular aparece en el panel y el bot se calla");
o = await msg(P, texto("ok gracias Katy"));
ok(!respuestas(o).length, "…y el bot no interrumpe esa conversación");
// Contactos personales de Katy
await webhook({ message_echoes: [{ from: "51900000000", to: "51988888888", id: "wamid.eco2", timestamp: "1", type: "text", text: { body: "Mamá, llego tarde" } }] });
o = await msg("51988888888", texto("ok hijita"), "Mamá");
ok(!o.length && !filas(`SELECT 1 FROM mensajes WHERE wa_id='51988888888'`).length && !filas(`SELECT 1 FROM leads WHERE wa_id='51988888888'`).length, "Chat personal de Katy en su celular: el bot no responde ni guarda nada");
await webhook({ history: [{ metadata: { phase: 0 }, threads: [{ id: "51999990000", messages: [] }] }] });
o = await msg("51999990000", texto("Katy, ¿hay clases el sábado?"), "Mamá de Diego");
ok(!o.length, "Contactos que ya le escribían a Katy (historial importado): los sigue atendiendo ella");
c.atencion.soloNuevos = false; c.atencion.excluidos = "";
await api("PUT", "/api/config", c);
o = respuestas(await msg("51999990000", texto("hola"), "Mamá de Diego"));
ok(o.length > 0, "Si se apaga esa opción, el bot también les responde");

// ---------- Panel ----------
r = await fetch(BOT + "/panel", { headers: { Cookie: cookie } });
const h = await r.text();
ok(/data-v="chats"/.test(h) && /Respuestas guardadas/.test(h) && /irAChat/.test(h), "El panel trae la pestaña Chats");

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de chats pasaron");
