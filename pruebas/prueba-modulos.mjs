// Carnet QR y escaneo, Caja, Aviso a una sede
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
const api = async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };
async function msg(from, mensaje, nombre = "Prueba") {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: nombre } }], messages: [{ from, id: "wamid.q" + ++n + Date.now(), timestamp: "1", ...mensaje }] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", "secreto-de-prueba").update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body).filter((b) => b && !b.status);
}
const t = (s) => ({ type: "text", text: { body: s } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);

// ---------- Carnet QR ----------
const K = "51955511111";
await msg(K, t("hola"), "Karina"); await msg(K, t("8"), "Karina"); await msg(K, btn("LO"), "Karina"); await msg(K, btn("INSCRIBIR"), "Karina");
let leads = (await api("GET", "/api/leads")).data; let k = leads.find((l) => l.wa_id === K);
let before = leer().length;
let r = await api("PATCH", "/api/leads/" + k.id, { estado: "inscrito", monto: 250, plan: "verano" });
await sleep(1200);
let L = sql(`SELECT token FROM leads WHERE wa_id='${K}'`)[0];
const carnetMsg = leer().slice(before).map((e) => e.body).find((b) => b.to === K && b.type === "text");
ok(r.status === 200 && L.token && /^[A-Z2-9]{10}$/.test(L.token), `Al inscribirse se crea el código del carnet (${L.token})`);
ok(carnetMsg && carnetMsg.text.body.includes("/carnet/" + L.token), "El bot envía el carnet digital por WhatsApp");
const mov = sql(`SELECT tipo, categoria, monto, sede FROM movimientos WHERE lead_id=${k.id}`)[0];
ok(mov && mov.tipo === "ingreso" && mov.monto === 250 && mov.sede === "LO", "La inscripción entra sola en Caja como ingreso de S/ 250 en Los Olivos");
let w = await fetch(BOT + "/carnet/" + L.token);
let h = await w.text();
ok(w.status === 200 && /<svg/.test(h) && /Karina/.test(h) && /Le quedan 24 clases/.test(h) && /noindex/.test(h), "La página del carnet muestra el QR, el nombre y las clases que le quedan (sin clave)");
ok((await fetch(BOT + "/carnet/ZZZZZZZZZZ")).status === 404, "Un código inventado no muestra nada");
// Escanear
r = await api("POST", "/api/asistencia/escanear", { token: `${BOT}/carnet/${L.token}` });
ok(r.status === 200 && r.data.nombre === "Karina" && /^\d\d:\d\d$/.test(r.data.hora) && r.data.quedan === 23 && !r.data.repetido, `Escanear el QR marca presente con hora (${r.data.hora}) y dice que le quedan 23`);
r = await api("POST", "/api/asistencia/escanear", { token: L.token });
ok(r.data.repetido === true, "Escanearlo otra vez el mismo día avisa que ya estaba marcado");
r = await api("POST", "/api/asistencia/escanear", { token: "NOEXISTE12" });
ok(r.status === 404 && /no está registrado/.test(r.data.error), "Carnet desconocido → mensaje claro");
const a = sql(`SELECT presente, hora, modo FROM asistencias WHERE lead_id=${k.id} AND fecha='${hoy}'`)[0];
ok(a.presente === 1 && a.modo === "qr" && a.hora, "Queda guardado como asistencia por QR con hora");
r = await api("GET", "/api/asistencia?fecha=" + hoy);
ok(r.data.alumnos.find((x) => x.id === k.id).hora === a.hora, "Pasar lista muestra la hora de llegada");
// Aviso de ingreso al papá (opción apagada por defecto)
before = leer().length;
let c = (await api("GET", "/api/config")).data.config; c.carnetQR.avisarIngreso = true; await api("PUT", "/api/config", c); await sleep(16000);
sql(`DELETE FROM asistencias WHERE lead_id=${k.id}`);
r = await api("POST", "/api/asistencia/escanear", { token: L.token }); await sleep(800);
ok(leer().slice(before).some((e) => e.body.to === K && /Ingresó a la cancha de Los Olivos/.test(e.body.text?.body || "")), "Con la opción encendida, el papá recibe «Ingresó a la cancha a las …»");
c.carnetQR.avisarIngreso = false; await api("PUT", "/api/config", c);
// Carnet desde la ficha
r = await api("POST", `/api/leads/${k.id}/carnet`);
ok(r.status === 200 && r.data.enlace.endsWith(L.token) && r.data.enviado === true, "Botón «Carnet QR» de la ficha: abre el carnet y lo reenvía por WhatsApp");

// ---------- Caja ----------
r = await api("POST", "/api/caja", { tipo: "egreso", categoria: "Alquiler de cancha", monto: 120, fecha: hoy, sede: "LO", nota: "Sábado" });
ok(r.status === 201, "Anotar un gasto de cancha");
r = await api("POST", "/api/caja", { tipo: "egreso", categoria: "", monto: 0, fecha: hoy });
ok(r.status === 400, "Gasto incompleto → error claro");
r = await api("GET", "/api/caja?mes=" + hoy.slice(0, 7));
const ing = r.data.movimientos.filter((x) => x.tipo === "ingreso").reduce((s, x) => s + x.monto, 0), egr = r.data.movimientos.filter((x) => x.tipo === "egreso").reduce((s, x) => s + x.monto, 0);
ok(r.status === 200 && ing >= 250 && egr === 120, `Caja del mes: entró S/ ${ing}, salió S/ ${egr}`);
const idMov = r.data.movimientos.find((x) => x.categoria === "Alquiler de cancha").id;
ok((await api("DELETE", "/api/caja/" + idMov)).status === 200, "Borrar un gasto anotado a mano");
const csv = await api("GET", "/api/caja.csv");
ok(csv.status === 200 && /Inscripción/.test(csv.data), "Descarga de caja en CSV");

// ---------- Aviso a una sede ----------
r = await api("GET", "/api/aviso-sede?sede=LO");
ok(r.data.personas >= 1, `Cuenta a quiénes llegaría el aviso en Los Olivos (${r.data.personas})`);
before = leer().length;
r = await api("POST", "/api/aviso-sede", { sede: "LO", texto: "Hoy no hay entrenamiento por lluvia. Nos vemos el miércoles.", id: "prueba0001" });
const av = leer().slice(before).map((e) => e.body).find((b) => b.template?.name === "aviso_sede");
ok(r.status === 200 && r.data.enviados >= 1 && av && av.template.components[0].parameters[0].text === "Los Olivos" && /lluvia/.test(av.template.components[0].parameters[1].text), "El aviso sale con la plantilla aviso_sede (sede + mensaje) a los de esa sede");
ok(!leer().slice(before).some((e) => e.body.template?.name === "aviso_sede" && e.body.to === "51933300001"), "No le llega a inscritos de otra sede");
r = await api("POST", "/api/aviso-sede", { sede: "LO", texto: "Hoy no hay entrenamiento por lluvia. Nos vemos el miércoles.", id: "prueba0001" });
ok(r.data.enviados === 0 && r.data.quedan === 0, "El mismo aviso no se repite a nadie");
r = await api("POST", "/api/aviso-sede", { sede: "LO", texto: "ok", id: "prueba0002" });
ok(r.status === 400, "Aviso demasiado corto → error claro");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de módulos pasaron");
