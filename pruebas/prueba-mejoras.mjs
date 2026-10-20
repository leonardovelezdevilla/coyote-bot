// Comprobantes, renovación, cupos y lista de espera, hermanos, asistencia, canales, audio
import crypto from "node:crypto";
import fs from "node:fs";
import { execSync } from "node:child_process";
const BOT = "http://127.0.0.1:8787";
const enviados = new URL("./enviados.jsonl", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const leer = () => fs.readFileSync(enviados, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
let fallas = 0, n = 0;
const ok = (c, t) => { console.log((c ? "✔ " : "✘ ") + t); if (!c) fallas++; };
const sql = (q) => JSON.parse(execSync(`npx wrangler d1 execute coyote-bot --local --json --command "${q.replace(/"/g, '\\"')}" 2>/dev/null`).toString())[0].results;
const cookie = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = async (m, u, b, raw) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, ...(raw ? raw.headers : { "Content-Type": "application/json" }) }, body: raw ? raw.body : b ? JSON.stringify(b) : undefined }); return { status: x.status, data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };
async function msg(from, mensaje, nombre = "Prueba") {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: nombre } }], messages: [{ from, id: "wamid.m" + ++n + Date.now(), timestamp: "1", ...mensaje }] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", "secreto-de-prueba").update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body).filter((b) => b && !b.status);
}
const t = (s) => ({ type: "text", text: { body: s } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const lista = (id) => ({ type: "interactive", interactive: { type: "list_reply", list_reply: { id, title: id } } });
const tpl = (payload, text) => ({ type: "button", button: { payload, text } });
const txt = (b) => (b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : b.type === "template" ? "plantilla:" + b.template.name : b.type);
const ids = (b) => b?.interactive?.action?.buttons?.map((x) => x.reply.id) || [];
const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
const dia = (k) => { const d = new Date(hoy + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };

// ---------- Canal de origen ----------
const C = "51933300001";
await msg(C, t("Hola, quiero una clase de prueba gratis #fb"), "Diana");
ok(sql(`SELECT origen FROM leads WHERE wa_id='${C}'`)[0].origen === "Facebook", "Quien llega desde el enlace de Facebook queda con origen «Facebook»");
let cs = (await api("GET", "/api/canales")).data;
ok(cs.some((c) => c.origen === "Facebook" && c.total >= 1), "Números → Cómo llegaron cuenta el canal");

// ---------- Hermanos ----------
let o = await msg(C, t("tengo 2 hijos de 7 y 9"), "Diana");
ok(/son 2 hermanos/.test(txt(o[0])) && /9 años/.test(txt(o[0])) && ids(o[1]).includes("SMP"), "«tengo 2 hijos de 7 y 9»: explica, menciona el beneficio y sigue con el mayor");
ok(/Hermanos: 9 y 7/.test(sql(`SELECT nota FROM leads WHERE wa_id='${C}'`)[0].nota), "Queda anotado «Hermanos: 9 y 7 años» en su ficha");
o = await msg(C, t("tienen descuento los hermanos?"), "Diana");
ok(/Pueden entrenar juntos/.test(txt(o[0])) && /segundo hermano/.test(txt(o[0])), "Pregunta frecuente de hermanos con el beneficio");

// ---------- Comprobante de pago ----------
await msg(C, btn("SMP"), "Diana");
await msg(C, btn("INSCRIBIR"), "Diana");
o = await msg(C, { type: "image", image: { id: "7000777", caption: "" } }, "Diana");
const alPadre = o.find((b) => b.to === C), avisoK = o.find((b) => b.type === "template");
ok(alPadre && /Recibimos tu comprobante/.test(txt(alPadre)), "Manda la captura del Yape → «Recibimos tu comprobante, Katy lo revisa»");
ok(avisoK && /envió un comprobante de pago/.test(avisoK.template.components[0].parameters[0].text), "Aviso a Katy con enlace al chat");
let L = sql(`SELECT comprobante, atencion FROM leads WHERE wa_id='${C}'`)[0];
ok(L.comprobante === "7000777" && L.atencion === "humano", "El comprobante queda pendiente de revisar y el chat pasa a Katy");
let leads = (await api("GET", "/api/leads")).data; let d = leads.find((l) => l.wa_id === C);
let r = await api("PATCH", "/api/leads/" + d.id, { estado: "inscrito", monto: 250, plan: "verano" });
L = sql(`SELECT estado, comprobante, inscrito_desde, fin_ciclo FROM leads WHERE wa_id='${C}'`)[0];
ok(r.status === 200 && L.estado === "inscrito" && !L.comprobante && L.inscrito_desde === hoy && L.fin_ciclo === dia(56), `«Se inscribió» (verano): fin de clases en 8 semanas (${L.fin_ciclo}) y el comprobante deja de estar pendiente`);

// ---------- Renovación ----------
sql(`UPDATE leads SET fin_ciclo='${dia(3)}' WHERE wa_id='${C}'`);
let before = leer().length;
await api("POST", "/api/ejecutar-tareas?hora=10");
let nuevos = leer().slice(before).map((e) => e.body);
const ren = nuevos.find((b) => b.template?.name === "renovar_clases" && b.to === C);
ok(ren && ren.template.components[0].parameters[1].text === "el siguiente ciclo de 12 clases a S/ 140" && ren.template.components[1].parameters[0].payload === "RENOVAR_SI", "5 días antes de que acaben sus clases: invitación a renovar con la oferta");
before = leer().length; await api("POST", "/api/ejecutar-tareas?hora=10");
ok(!leer().slice(before).some((e) => e.body.template?.name === "renovar_clases"), "No se repite la invitación");
o = await msg(C, tpl("RENOVAR_SI", "Sí, renovar"), "Diana");
ok(/te escribe por aquí/.test(txt(o.find((b) => b.to === C))) && sql(`SELECT estado FROM leads WHERE wa_id='${C}'`)[0].estado === "quiere_inscribirse", "«Sí, renovar» → pasa con Katy y vuelve a «Quiere inscribirse»");
leads = (await api("GET", "/api/leads")).data; d = leads.find((l) => l.wa_id === C);
await api("PATCH", "/api/leads/" + d.id, { estado: "inscrito", monto: 140, plan: "ciclo" });
L = sql(`SELECT fin_ciclo, renovacion_enviada FROM leads WHERE wa_id='${C}'`)[0];
ok(L.fin_ciclo === dia(28) && L.renovacion_enviada === 0, "«Renovó» un ciclo: 4 semanas más y el recordatorio se vuelve a armar");

// ---------- Cupos y lista de espera ----------
let c = (await api("GET", "/api/config")).data.config;
c.sedes.SMP.cupos = 1; // Diana ya está inscrita en SMP
ok((await api("PUT", "/api/config", c)).status === 200, "Katy pone 1 cupo en SMP");
await sleep(16000);
const E = "51933300002";
await msg(E, t("hola"), "Omar"); await msg(E, t("8"), "Omar");
o = await msg(E, btn("SMP"), "Omar");
ok(/completó sus cupos/.test(txt(o[0])) && ids(o[0]).includes("LO") && ids(o[0]).includes("ESPERA"), "Sede llena: ofrece las otras sedes o lista de espera");
o = await msg(E, btn("ESPERA"), "Omar");
ok(/lista de espera de San Martín/.test(txt(o.find((b) => b.to === E))) && sql(`SELECT estado, sede FROM leads WHERE wa_id='${E}'`)[0].estado === "espera", "«Lista de espera»: queda en estado «En lista de espera» en esa sede");
ok(o.some((b) => b.type === "template" && /lista de espera/.test(b.template.components[0].parameters[0].text)), "Katy recibe aviso de la lista de espera");
const F = "51933300003";
await msg(F, t("hola"), "Lía"); await msg(F, t("8"), "Lía");
o = await msg(F, btn("SMP"), "Lía");
o = await msg(F, btn("LO"), "Lía");
ok(/S\/ 250/.test(txt(o[0])) && sql(`SELECT sede FROM leads WHERE wa_id='${F}'`)[0].sede === "LO", "Si elige otra sede, sigue normal");
c.sedes.SMP.cupos = 0; await api("PUT", "/api/config", c);

// ---------- Asistencia ----------
r = await api("GET", "/api/asistencia?fecha=" + hoy);
ok(r.status === 200 && r.data.alumnos.some((a) => a.id === d.id && a.presente === null), "Pasar lista muestra a los inscritos sin marcar");
await api("PUT", "/api/asistencia", { lead_id: d.id, fecha: dia(-4), presente: 0 });
await api("PUT", "/api/asistencia", { lead_id: d.id, fecha: dia(-2), presente: 0 });
before = leer().length;
await api("POST", "/api/ejecutar-tareas?hora=12");
nuevos = leer().slice(before).map((e) => e.body);
const fal = nuevos.find((b) => b.template?.name === "te_extranamos" && b.to === C);
ok(fal && fal.template.components[0].parameters[1].text === "2" && fal.template.components[1].parameters[0].payload === "FALTA_OK", "2 faltas seguidas → mensaje «te extrañamos» a los papás");
before = leer().length; await api("POST", "/api/ejecutar-tareas?hora=12");
ok(!leer().slice(before).some((e) => e.body.template?.name === "te_extranamos"), "No se repite por la misma racha");
await api("PUT", "/api/asistencia", { lead_id: d.id, fecha: hoy, presente: 1 });
r = await api("GET", "/api/asistencia?fecha=" + hoy);
ok(r.data.alumnos.find((a) => a.id === d.id).presente === 1 && r.data.mes.find((m) => m.sede === "SMP").total === 3, "Marcar «Vino» hoy y resumen del mes (3 marcas en SMP)");
await api("POST", `/api/chats/${C}/atencion`, { modo: "bot" });
o = await msg(C, tpl("FALTA_OK", "Todo bien, volvemos"), "Diana");
ok(/Qué bueno, Diana/.test(txt(o[0])), "Botón «Todo bien, volvemos» responde amable");
const csv = await api("GET", "/api/asistencia.csv");
ok(csv.status === 200 && /Diana/.test(csv.data) && /Sí/.test(csv.data), "Descarga de asistencia en CSV");

// ---------- Audio desde el panel ----------
sql(`UPDATE leads SET ultimo_entrante='${new Date().toISOString()}' WHERE wa_id='${C}'`);
before = leer().length;
r = await api("POST", `/api/chats/${C}/audio`, null, { headers: { "Content-Type": "audio/mp4" }, body: Buffer.alloc(5000, 1) });
nuevos = leer().slice(before).map((e) => e);
ok(r.status === 200 && nuevos.some((e) => e.url.endsWith("/media") && e.subida > 4000) && nuevos.some((e) => e.body?.type === "audio" && e.body.audio.id === "9900001"), "Audio grabado en el panel: se sube a WhatsApp y se envía como nota de voz");
ok(sql(`SELECT autor, tipo, media_id FROM mensajes WHERE wa_id='${C}' ORDER BY id DESC LIMIT 1`)[0].tipo === "audio", "El audio queda en el historial del chat");
r = await api("POST", `/api/chats/${C}/audio`, null, { headers: { "Content-Type": "audio/webm" }, body: Buffer.alloc(5000, 1) });
ok(r.status === 415, "Formato que WhatsApp no acepta → mensaje claro");

// ---------- Web ----------
c = (await api("GET", "/api/config")).data.config; c.web.numero = "51900000001"; await api("PUT", "/api/config", c); await sleep(16000);
const h = await (await fetch(BOT + "/?de=ig")).text();
ok(/%23ig/.test(h) && /segundo hermano/.test(h), "La web con ?de=ig etiqueta los botones con #ig y muestra el beneficio por hermanos");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de mejoras pasaron");

// ---------- Planes a medida ----------
{
  const P = "51933300009";
  await msg(P, t("hola"), "Rocío"); await msg(P, t("10"), "Rocío"); await msg(P, btn("LO"), "Rocío");
  let ls = (await api("GET", "/api/leads")).data; let p = ls.find((l) => l.wa_id === P);
  let r = await api("PATCH", "/api/leads/" + p.id, { estado: "inscrito", monto: 80, plan: "otro" });
  ok(r.status === 400, "Otro plan sin número de clases → error claro");
  r = await api("PATCH", "/api/leads/" + p.id, { estado: "inscrito", monto: 80, plan: "otro", clases: 8, desde: dia(-10) });
  let L = sql(`SELECT clases_pagadas, fin_ciclo FROM leads WHERE wa_id='${P}'`)[0];
  ok(r.status === 200 && L.clases_pagadas === 8 && L.fin_ciclo === dia(18), "Otro plan: 8 clases por S/ 80 desde hace 10 días, fecha límite en 4 semanas desde entonces");
  for (let i = 1; i <= 6; i++) await api("PUT", "/api/asistencia", { lead_id: p.id, fecha: dia(-i), presente: 1 });
  ls = (await api("GET", "/api/leads")).data; p = ls.find((l) => l.wa_id === P);
  ok(p.clases_usadas === 6, "La ficha cuenta 6 clases usadas (le quedan 2)");
  let before = leer().length; await api("POST", "/api/ejecutar-tareas?hora=10");
  ok(leer().slice(before).some((e) => e.body.template?.name === "renovar_clases" && e.body.to === P), "Cuando le quedan 2 clases, llega la invitación a renovar aunque falte para la fecha límite");
}
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de mejoras y planes pasaron");
