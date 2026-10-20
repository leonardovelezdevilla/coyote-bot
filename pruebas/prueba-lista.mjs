// Lista desplegable de preguntas frecuentes
import crypto from "node:crypto";
import fs from "node:fs";
const BOT = "http://127.0.0.1:8787";
const enviados = new URL("./enviados.jsonl", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const leer = () => fs.readFileSync(enviados, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
let fallas = 0, n = 0;
const ok = (c, t) => { console.log((c ? "✔ " : "✘ ") + t); if (!c) fallas++; };
const cookie = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: await x.json() }; };
async function msg(from, mensaje) {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: "Nora" } }], messages: [{ from, id: "wamid.l" + ++n + Date.now(), timestamp: "1", ...mensaje }] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", "secreto-de-prueba").update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body).filter((b) => !b.status);
}
const t = (s) => ({ type: "text", text: { body: s } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const fila = (id, title) => ({ type: "interactive", interactive: { type: "list_reply", list_reply: { id, title } } });
const txt = (b) => (b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : b.type);
const ids = (b) => b?.interactive?.action?.buttons?.map((x) => x.reply.id) || b?.interactive?.action?.sections?.[0]?.rows?.map((r) => r.id) || [];
const titulos = (b) => b?.interactive?.action?.sections?.[0]?.rows?.map((r) => r.title) || [];

const X = "51977700001";
await msg(X, t("hola"));
await msg(X, t("7"));
let o = await msg(X, t("tengo dudas"));
ok(o[0]?.interactive?.type === "list" && titulos(o[0]).includes("¿Cuánto cuesta?") && titulos(o[0]).length === 8, "«tengo dudas» abre la lista de preguntas frecuentes: " + titulos(o[0]).join(" · "));
ok(o[0].interactive.action.button === "Ver preguntas", "El botón de la lista dice «Ver preguntas»");
o = await msg(X, fila("P_P3", "¿Qué horarios hay?"));
ok(/horarios/i.test(txt(o[0])) && ids(o[1]).includes("SMP"), "Elige «¿Qué horarios hay?»: responde y vuelve a preguntar la sede");
await msg(X, btn("SMP"));
o = await msg(X, btn("CLASE"));
const f = ids(o[0])[0];
await msg(X, fila(f, "x"));
o = await msg(X, t("Nora Díaz"));
o = await msg(X, t("ok"));
o = await msg(X, t("zzz"));
ok(ids(o[0]).join() === "MENU,PREGUNTAS,HUMANO", "Menú final con 3 botones: Ver información · Preguntas frecuentes · Hablar con Katy");
o = await msg(X, btn("PREGUNTAS"));
ok(o[0]?.interactive?.type === "list", "Botón «Preguntas frecuentes» abre la lista");
o = await msg(X, fila("P_P1", "¿Cuánto cuesta?"));
ok(/S\/ 250/.test(txt(o[0])) && ids(o[1]).join() === "MENU,PREGUNTAS,HUMANO", "Al final: responde y ofrece seguir con los 3 botones");
o = await msg(X, { type: "audio", audio: { id: "1234567" } });
ok(ids(o[0]).join() === "MENU,PREGUNTAS,HUMANO", "Respuesta a audios incluye «Preguntas frecuentes»");
o = await msg(X, fila("P_borrada", "Una pregunta vieja"));
ok(o[0]?.interactive?.type === "list", "Si tocan una pregunta que ya no existe, vuelve a mostrar la lista");

// Ajustes
let c = (await api("GET", "/api/config")).data.config;
c.preguntas[0].titulo = "¿Cuánto cuesta el verano completo?";
let r = await api("PUT", "/api/config", c);
ok(r.status === 400 && r.data.errores.some((e) => /cómo se ve en la lista: máximo 24/.test(e)), "Título de más de 24 letras → error claro");
c = (await api("GET", "/api/config")).data.config;
for (let i = 0; i < 4; i++) c.preguntas.push({ id: "N" + i, titulo: "Pregunta " + i, enLista: true, palabras: "palabra" + i, respuesta: "Respuesta " + i });
r = await api("PUT", "/api/config", c);
ok(r.status === 400 && r.data.errores.some((e) => /máximo 10 en la lista/.test(e)), "Más de 10 en la lista → error claro");
c.preguntas[8].enLista = false;
c.preguntas[1].enLista = false;
r = await api("PUT", "/api/config", c);
ok(r.status === 200, "Apagando «Mostrar en la lista» en algunas, se guarda");
o = await msg(X, btn("PREGUNTAS"));
ok(titulos(o[0]).length === 10 && !titulos(o[0]).includes("¿Dónde quedan las sedes?"), "La lista muestra solo las que tienen «Mostrar en la lista»");
await api("POST", "/api/config/deshacer");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de la lista pasaron");

// ---------- Página web ----------
{
  let w = await fetch(BOT + "/");
  let h = await w.text();
  ok(w.status === 200 && /Sedes y horarios/.test(h) && /S\/<\/small>250/.test(h) && /¿Cuánto cuesta\?/.test(h), "La página web pública carga con precio, sedes y preguntas de los Ajustes");
  ok(!/coyote_sesion/.test(w.headers.get("set-cookie") || "") && !/Salir/.test(h), "La web no pide clave ni muestra el panel");
  const c2 = (await api("GET", "/api/config")).data.config;
  c2.web.numero = "51911112222"; c2.web.inicio = "2027-01-04"; c2.precioVerano = 270;
  ok((await api("PUT", "/api/config", c2)).status === 200, "Guardar número del bot, fecha de inicio y nuevo precio");
  await sleep(16000); // la configuración se guarda en caché 15 s
  h = await (await fetch(BOT + "/")).text();
  ok(/wa\.me\/51911112222/.test(h) && /4 de enero/.test(h) && /S\/<\/small>270/.test(h), "La web usa el número, la fecha y el precio nuevos");
  c2.web.activa = false; await api("PUT", "/api/config", c2); await sleep(16000);
  w = await fetch(BOT + "/", { redirect: "manual" });
  ok(w.status === 303, "Con la web apagada, la dirección lleva a la pantalla de clave");
  c2.web.activa = true; c2.web.facebook = "facebook.com/coyote";
  const mal2 = await api("PUT", "/api/config", c2);
  ok(mal2.status === 400 && /https:\/\//.test(mal2.data.errores[0]), "Enlace de Facebook sin https → error claro");
  await api("POST", "/api/config/deshacer"); await api("POST", "/api/config/deshacer");
}
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de la lista y la web pasaron");
