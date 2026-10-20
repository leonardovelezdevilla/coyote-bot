// Prueba de punta a punta: entrar, conversar, configurar, automatizaciones y campañas
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

for (let i = 0; i < 60; i++) { try { await fetch(BOT + "/entrar"); break; } catch { await sleep(1000); } }

// ---------- Entrar ----------
let r = await fetch(BOT + "/panel", { redirect: "manual" });
ok(r.status === 303 && r.headers.get("location") === "/entrar", "Sin sesión, /panel lleva a /entrar");
r = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ clave: "mala" }), redirect: "manual" });
ok(r.status === 401, "Clave incorrecta → 401 con mensaje");
r = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ clave: "clave-panel" }), redirect: "manual" });
const cookie = (r.headers.get("set-cookie") || "").split(";")[0];
ok(r.status === 303 && cookie.startsWith("coyote_sesion="), "Clave correcta → cookie de sesión de 90 días");
const api = async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };
ok((await api("GET", "/api/leads")).status === 200, "Con la cookie, la API responde");
ok((await fetch(BOT + "/api/leads")).status === 401, "Sin cookie, la API rechaza");

// ---------- Conversación ----------
async function msg(from, mensaje, nombre = "Rosa Pérez") {
  const before = leer().length;
  const m = { from, id: "wamid.t" + ++n + Date.now(), timestamp: "1", ...mensaje };
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: nombre } }], messages: [m] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex") }, body });
  await sleep(600);
  return leer().slice(before).map((e) => e.body);
}
const txt = (b) => b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : JSON.stringify(b.template);
const lista = (id, title) => ({ type: "interactive", interactive: { type: "list_reply", list_reply: { id, title } } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const tpl = (payload, text) => ({ type: "button", button: { payload, text } });

const P = "51911111111";
let o = await msg(P, { type: "text", text: { body: "hola" }, referral: { source_type: "ad" } });
ok(o[0]?.type === "interactive" && /qué edad/i.test(txt(o[0])), "Saludo con lista de edades");
await msg(P, lista("E6", "6 a 9 años"));
o = await msg(P, btn("SMP"));
ok(/S\/ 250/.test(txt(o[0])) && o[1]?.interactive?.action?.buttons?.[0]?.reply?.title === "Clase gratis", "Info con precio y botón «Clase gratis»");
o = await msg(P, btn("CLASE"));
const f1 = o[0].interactive.action.sections[0].rows[0].id;
await msg(P, lista(f1, "x"));
o = await msg(P, { type: "text", text: { body: "Rosa María" } });
ok(/Listo, Rosa/.test(txt(o[0])), "Clase agendada con nombre");

// Botones de plantilla
o = await msg(P, tpl("CONFIRMA", "Sí, voy"));
ok(/Te esperamos/.test(txt(o[0])) && filas(`SELECT confirmado FROM leads WHERE wa_id='${P}'`)[0].confirmado === 1, "Botón «Sí, voy» marca confirmado");
o = await msg(P, { type: "button", button: { text: "Cambiar día" } });
ok(o[0]?.interactive?.type === "list", "Botón «Cambiar día» (solo texto) ofrece fechas");
const f2 = o[0].interactive.action.sections[0].rows[1].id;
o = await msg(P, lista(f2, "x"));
ok(/Listo, Rosa/.test(txt(o[0])) && filas(`SELECT clase_fecha, confirmado FROM leads WHERE wa_id='${P}'`)[0].clase_fecha === f2.slice(2), "Nueva fecha confirmada sin volver a pedir el nombre");

// Inscribir → aviso a Katy
const Q = "51922222222";
await msg(Q, { type: "text", text: { body: "buenas" } }, "Luis");
await msg(Q, { type: "text", text: { body: "4" } }, "Luis");
o = await msg(Q, btn("PP"), "Luis");
ok(/Baby Fútbol/.test(txt(o[0])), "Mensaje extra para 3 a 5 años (Baby Fútbol)");
o = await msg(Q, btn("INSCRIBIR"), "Luis");
const aviso = o.find((b) => b.type === "template");
ok(aviso && aviso.to === "51985648093" && aviso.template.name === "aviso_panel" && /Luis \(4 años, Puente Piedra\) quiere inscribir/.test(aviso.template.components[0].parameters[0].text), "Aviso inmediato a Katy por plantilla");

// BAJA
const B = "51955555555";
await msg(B, { type: "text", text: { body: "hola" } }, "Pedro");
o = await msg(B, { type: "text", text: { body: "BAJA" } }, "Pedro");
ok(/No te enviaremos más promociones/.test(txt(o[0])) && filas(`SELECT no_contactar FROM leads WHERE wa_id='${B}'`)[0].no_contactar === 1, "«BAJA» marca no contactar");

// ---------- Configuración ----------
let c = (await api("GET", "/api/config")).data.config;
c.precioVerano = 260; c.textos.preguntaSede = "¿En qué sede quieres entrenar?";
ok((await api("PUT", "/api/config", c)).status === 200, "Guardar configuración nueva");
const R = "51933333333";
await msg(R, { type: "text", text: { body: "hola" } }, "Ana");
o = await msg(R, lista("E10", "10 a 13 años"), "Ana");
ok(txt(o[0]) === "¿En qué sede quieres entrenar?", "El bot usa el texto nuevo al instante");
o = await msg(R, btn("LO"), "Ana");
ok(/S\/ 260/.test(txt(o[0])), "El bot usa el precio nuevo");
c.textos.botonClase = "Quiero una clase de prueba gratis ya";
const mal = await api("PUT", "/api/config", c);
ok(mal.status === 400 && mal.data.errores.some((e) => /20 caracteres/.test(e)), "Botón demasiado largo → error claro: " + (mal.data.errores || [])[0]);
r = await api("POST", "/api/config/deshacer");
ok((await api("GET", "/api/config")).data.config.precioVerano === 250, "«Volver a como estaba» devuelve el precio a 250");
r = await api("PUT", "/api/config", { activo: false });
o = await msg("51966666666", { type: "text", text: { body: "hola" } }, "Eva");
ok(/te atiende Katy directamente/.test(txt(o[0])), "Bot en pausa: deriva a Katy");
await api("PUT", "/api/config", { activo: true });

// ---------- Automatizaciones ----------
const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
const dia = (n) => { const d = new Date(hoy + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
sql(`UPDATE leads SET clase_fecha='${dia(1)}', recordatorio_enviado=0 WHERE wa_id='${P}'`);
sql(`UPDATE leads SET estado='agendada', clase_fecha='${dia(-1)}', padre='Ana' WHERE wa_id='${R}'`);
sql(`UPDATE sesiones SET paso='sede', actualizado='${new Date(Date.now() - 21 * 3600e3).toISOString()}' WHERE wa_id='${R}'`);
let before = leer().length;
r = await api("POST", "/api/ejecutar-tareas?hora=10");
let nuevos = leer().slice(before).map((e) => e.body);
const rec = nuevos.find((b) => b.template?.name === "recordatorio_clase");
ok(rec && rec.template.components[1]?.parameters[0]?.payload === "CONFIRMA", "Recordatorio con botones Sí voy / Cambiar día");
ok(nuevos.some((b) => b.to === R && b.type === "interactive" && /Quedó pendiente/.test(b.interactive.body.text)), "Rescate de conversación a medias");
before = leer().length;
await api("POST", "/api/ejecutar-tareas?hora=10");
ok(leer().length === before, "La hora siguiente no repite recordatorios ni rescates");
before = leer().length;
await api("POST", "/api/ejecutar-tareas?hora=11");
nuevos = leer().slice(before).map((e) => e.body);
ok(nuevos.some((b) => b.to === R && b.template?.name === "seguimiento_clase"), "Seguimiento al día siguiente de la clase");
before = leer().length;
await api("POST", "/api/ejecutar-tareas?hora=8");
nuevos = leer().slice(before).map((e) => e.body);
const res = nuevos.find((b) => b.template?.name === "aviso_panel");
ok(res && /Buenos días/.test(res.template.components[0].parameters[0].text), "Resumen de la mañana: " + (res ? res.template.components[0].parameters[0].text : ""));
o = await msg(R, tpl("SEG_INSCRIBIR", "Quiero inscribirlo"), "Ana");
ok(filas(`SELECT estado FROM leads WHERE wa_id='${R}'`)[0].estado === "quiere_inscribirse", "Botón del seguimiento pasa a «Quiere inscribirse»");

// ---------- Campañas ----------
let cs = (await api("GET", "/api/campanas")).data;
const pre = cs.find((x) => x.id === "preventa");
ok(pre && pre.quedan >= 1, `Campaña preventa: ${pre?.quedan} por recibir (excluye BAJA e inscritos)`);
const bloqueado = filas(`SELECT id FROM leads WHERE wa_id='${B}'`)[0].id;
before = leer().length;
r = await api("POST", "/api/campanas/preventa/enviar");
nuevos = leer().slice(before).map((e) => e.body);
ok(r.data.quedan === 0 && nuevos.every((b) => b.to !== B), `Envío por tandas: ${r.data.enviados} enviados, ninguno a quien pidió BAJA`);
r = await api("POST", "/api/campanas/preventa/enviar");
ok(r.data.enviados === 0, "Nadie recibe la campaña dos veces");

// ---------- Archivar ----------
const idQ = filas(`SELECT id FROM leads WHERE wa_id='${Q}'`)[0].id;
await api("PATCH", "/api/leads/" + idQ, { archivado: 1 });
ok(!(await api("GET", "/api/leads")).data.some((l) => l.id === idQ), "Quitar de la lista la oculta");
await api("PATCH", "/api/leads/" + idQ, { archivado: 0 });
ok((await api("GET", "/api/leads")).data.some((l) => l.id === idQ), "Deshacer la devuelve");

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas pasaron");
fs.writeFileSync(new URL("./cookie.txt", import.meta.url), cookie);
