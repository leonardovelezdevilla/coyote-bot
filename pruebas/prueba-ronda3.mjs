// Jornadas con QR de sede, pago del personal, cuotas, alerta de cupos, reporte mensual, encuesta, referidos, uniformes, copia
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
const cookieK = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = (cookie) => async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };
const katy = api(cookieK);
async function msg(from, mensaje, nombre = "Prueba") {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: nombre } }], messages: [{ from, id: "wamid.r" + ++n + Date.now(), timestamp: "1", ...mensaje }] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", "secreto-de-prueba").update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body).filter((b) => b && !b.status);
}
const t = (s) => ({ type: "text", text: { body: s } });
const tpl = (payload, text) => ({ type: "button", button: { payload, text } });
const txt = (b) => (b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : b.type === "template" ? "plantilla:" + b.template.name : b.type);
const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
const dia = (k) => { const d = new Date(hoy + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };

// ---------- Personal: profesor vs administrativo ----------
await katy("POST", "/api/personal", { nombre: "Pedro Profesor", rol: "Profesor", sede: "SMP", pin: "111111", tipo_pago: "clase", tarifa: 25 });
await katy("POST", "/api/personal", { nombre: "Rosa Admin", rol: "Administrativo de sede", sede: "SMP", pin: "222222" });
const entrar = async (nombre, pin) => { const w = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre, clave: pin }), redirect: "manual" }); return api((w.headers.get("set-cookie") || "").split(";")[0]); };
const pedro = await entrar("Pedro Profesor", "111111"), rosa = await entrar("Rosa Admin", "222222");
ok((await pedro("POST", "/api/ventas", { padre: "X", plan: "ciclo", monto: 140 })).status === 403, "Un profesor no puede vender");
ok((await pedro("GET", "/api/caja?mes=" + hoy.slice(0, 7))).status === 403, "Ni ver la caja");
{ const lp = (await pedro("GET", "/api/leads")).data; ok(lp.every((l) => l.monto === undefined && l.saldo === undefined), "Ni ver montos ni deudas en las fichas"); const cp = (await pedro("GET", "/api/config")).data.config; ok(!cp.avisos && !cp.pago && !cp.atencion?.excluidos, "Ni la configuración privada (números de Katy, excluidos)"); }
ok((await rosa("POST", "/api/ventas", { padre: "Venta Rosa", plan: "ciclo", monto: 140, metodo: "Yape" })).status === 201, "El administrativo de sede sí vende el paquete publicado");
ok((await rosa("POST", "/api/ventas", { padre: "Cuota Rosa", plan: "ciclo", monto: 100, saldo: 40 })).status === 403, "Pero no en cuotas ni con otro monto");
const hp = await (await fetch(BOT + "/panel", { headers: { Cookie: (await (async () => { const w = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre: "Pedro Profesor", clave: "111111" }), redirect: "manual" }); return (w.headers.get("set-cookie") || "").split(";")[0]; })()) } })).text();
ok(!/data-v="caja"/.test(hp) && /sin-caja/.test(hp), "El panel del profesor no tiene pestaña Caja");

// ---------- QR de sede: entrada y salida ----------
let w = await fetch(BOT + "/sede-qr/SMP", { headers: { Cookie: cookieK } });
const hq = await w.text();
const codigo = (hq.match(/SEDE:SMP:[A-F0-9]{16}/) || [])[0] || (await (async () => { return null; })());
ok(w.status === 200 && /<svg/.test(hq), "Katy puede abrir e imprimir el QR de la sede");
// el QR no imprime el código en texto; lo reconstruimos desde la firma: lo obtenemos probando el endpoint con un código inválido primero
ok((await pedro("POST", "/api/jornada", { codigo: "SEDE:SMP:0000000000000000" })).status === 400, "Un QR falsificado no sirve");
// obtener el código real: el servidor lo firma con la clave; lo sacamos del SVG no es posible, así que lo calculamos igual que el servidor
const firma = crypto.createHmac("sha256", "qr:secreto-sesion-prueba").update("sede:SMP").digest("hex").slice(0, 16).toUpperCase();
const cod = "SEDE:SMP:" + firma;
let c = (await katy("GET", "/api/config")).data.config; c.personalControl.horaInicio.SMP = "00:01"; c.personalControl.toleranciaMin = 0; await katy("PUT", "/api/config", c); await sleep(16000);
let r = await pedro("POST", "/api/jornada", { codigo: cod });
ok(r.status === 200 && r.data.tipo === "entrada" && r.data.tarde === true, `Pedro escanea el QR: entrada ${r.data.entrada}, marcada como tarde (empieza 00:01)`);
r = await pedro("POST", "/api/jornada", { codigo: cod });
ok(r.data.tipo === "salida" && r.data.salida, "Vuelve a escanear: salida");
ok((await pedro("POST", "/api/jornada", { codigo: "SEDE:LO:" + crypto.createHmac("sha256", "qr:secreto-sesion-prueba").update("sede:LO").digest("hex").slice(0, 16).toUpperCase() })).status === 400, "El QR de otra sede no le sirve");
ok((await katy("POST", "/api/jornada", { codigo: cod })).status === 400, "Katy no marca jornada (es para el personal)");
r = await katy("GET", "/api/jornada?mes=" + hoy.slice(0, 7));
ok(r.data.jornadas.some((j) => j.nombre === "Pedro Profesor" && j.tarde === 1 && j.salida), "Katy ve las jornadas del mes con tardanzas");
const idP = sql("SELECT id FROM personal WHERE nombre='Pedro Profesor'")[0].id;
r = await katy("POST", "/api/personal/pago", { id: idP, monto: 25, mes: "Octubre" });
ok(r.status === 200 && sql("SELECT categoria, monto, nota FROM movimientos ORDER BY id DESC LIMIT 1")[0].categoria === "Profesores", "El pago del mes al profesor queda como gasto en Caja");

// ---------- Cuotas ----------
const Q = "51977700101";
await msg(Q, t("hola"), "Carmen"); await msg(Q, t("7"), "Carmen");
let L = (await katy("GET", "/api/leads")).data.find((l) => l.wa_id === Q);
r = await katy("PATCH", "/api/leads/" + L.id, { estado: "inscrito", monto: 150, plan: "verano", saldo: 100, cuota_vence: dia(1) });
let row = sql(`SELECT saldo, cuota_vence FROM leads WHERE wa_id='${Q}'`)[0];
ok(r.status === 200 && row.saldo === 100 && row.cuota_vence === dia(1), "Inscripción con cuota: pagó 150, debe 100 hasta mañana");
let before = leer().length; await katy("POST", "/api/ejecutar-tareas?hora=10");
let cu = leer().slice(before).map((e) => e.body).find((b) => b.template?.name === "recordatorio_pago" && b.to === Q);
ok(cu && cu.template.components[0].parameters[1].text === "S/ 100" && cu.template.components[1].parameters[0].payload === "PAGO_HECHO", "Recordatorio de cuota 2 días antes, con el monto");
sql(`UPDATE leads SET cuota_vence='${hoy}' WHERE wa_id='${Q}'`);
before = leer().length; await katy("POST", "/api/ejecutar-tareas?hora=10");
cu = leer().slice(before).map((e) => e.body).find((b) => b.template?.name === "recordatorio_pago" && b.to === Q);
ok(cu && cu.template.components[0].parameters[2].text === "hoy", "Y otra vez el día del vencimiento («hoy»)");
before = leer().length; await katy("POST", "/api/ejecutar-tareas?hora=10");
ok(!leer().slice(before).some((e) => e.body.template?.name === "recordatorio_pago"), "No insiste más");
let o = await msg(Q, tpl("PAGO_HECHO", "Ya pagué"), "Carmen");
ok(/captura/.test(txt(o[0])) && sql(`SELECT atencion FROM leads WHERE wa_id='${Q}'`)[0].atencion === "humano", "«Ya pagué» pide la captura y pasa con Katy");
r = await katy("PATCH", "/api/leads/" + L.id, { pago_cuota: 100 });
row = sql(`SELECT saldo, cuota_vence FROM leads WHERE wa_id='${Q}'`)[0];
ok(r.status === 200 && row.saldo === 0 && !row.cuota_vence && sql("SELECT categoria, monto FROM movimientos ORDER BY id DESC LIMIT 1")[0].categoria === "Cuota", "Katy registra el cobro: saldo 0 y la cuota entra en Caja");
const hc = await (await fetch(BOT + "/carnet/" + sql(`SELECT token FROM leads WHERE wa_id='${Q}'`)[0].token)).text();
ok(!/Cuota pendiente/.test(hc) && /código/.test(hc), "El carnet ya no muestra cuota pendiente y muestra el código de referido");

// ---------- Alerta de cupos ----------
c = (await katy("GET", "/api/config")).data.config; c.sedes.PP.cupos = 5; await katy("PUT", "/api/config", c); await sleep(16000);
before = leer().length;
for (let i = 0; i < 4; i++) await katy("POST", "/api/ventas", { padre: "Cupo " + i, sede: "PP", plan: "ciclo", monto: 140 });
await sleep(1500);
const avisos = leer().slice(before).map((e) => e.body).filter((b) => b && b.template?.name === "aviso_panel").map((b) => b.template.components[0].parameters[0].text);
ok(avisos.some((a) => /80 %/.test(a)) && avisos.filter((a) => /80 %/.test(a)).length === 1, "Al llegar al 80 % de cupos, un solo aviso a Katy");
await katy("POST", "/api/ventas", { padre: "Cupo 5", sede: "PP", plan: "ciclo", monto: 140 }); await sleep(1200);
const llenos = leer().filter((e) => e.body && /llegó a sus 5 cupos/.test(e.body.template?.components?.[0]?.parameters?.[0]?.text || ""));
ok(llenos.length === 1, "Al llenarse, un solo aviso de sede llena");
c.sedes.PP.cupos = 0; await katy("PUT", "/api/config", c);

// ---------- Encuesta ----------
sql(`UPDATE leads SET inscrito_desde='${dia(-29)}' WHERE wa_id='${Q}'`);
before = leer().length; await katy("POST", "/api/ejecutar-tareas?hora=11");
const enc = leer().slice(before).map((e) => e.body).find((b) => b.template?.name === "encuesta_satisfaccion" && b.to === Q);
ok(enc && enc.template.components.slice(1).map((x) => x.parameters[0].payload).join() === "ENC_3,ENC_2,ENC_1", "A las 4 semanas llega la encuesta con 3 botones");
o = await msg(Q, tpl("ENC_1", "Regular"), "Carmen");
ok(/Queremos mejorar/.test(txt(o.find((b) => b.to === Q))) && o.some((b) => b.template?.name === "aviso_panel" && /Regular/.test(b.template.components[0].parameters[0].text)), "«Regular»: agradece, pasa con Katy y le avisa");
r = await katy("GET", "/api/encuestas");
ok(r.data.total.n >= 1 && r.data.porSede.some((x) => x.regular === 1), "Números muestra los resultados por sede");

// ---------- Referidos ----------
const tok = sql(`SELECT token FROM leads WHERE wa_id='${Q}'`)[0].token;
const R = "51977700102";
o = await msg(R, t(`Hola, vengo por el código ${tok}`), "Nuevo Ref");
ok(/te recomendó/.test(txt(o[0])) && /clase extra gratis/.test(txt(o[0])) && /qué edad/i.test(txt(o[1])), "Escribe con el código de otra familia: agradece, explica el beneficio y sigue el flujo");
row = sql(`SELECT referido_por, origen FROM leads WHERE wa_id='${R}'`)[0];
ok(row.referido_por === L.id && row.origen === "Referido", "Queda vinculado a quien lo recomendó, con origen «Referido»");
r = await katy("GET", "/api/referidos");
ok(r.data.some((x) => x.id === L.id && x.traidos === 1), "Números lista quién trae familias");

// ---------- Uniformes ----------
c = (await katy("GET", "/api/config")).data.config; c.tallas = "8, 10, 12"; await katy("PUT", "/api/config", c); await sleep(16000);
await katy("PUT", "/api/uniformes", { talla: "10", cantidad: 3 });
r = await katy("GET", "/api/uniformes");
ok(r.data.stock.find((s) => s.talla === "10").cantidad === 3 && r.data.pendientes.some((p) => p.id === L.id), "Stock por talla y lista de inscritos sin uniforme");
r = await katy("POST", `/api/leads/${L.id}/uniforme`, { talla: "10", monto: 85 });
ok(r.status === 200 && r.data.quedan === 2 && sql("SELECT categoria, monto FROM movimientos ORDER BY id DESC LIMIT 1")[0].categoria === "Uniforme", "Entrega: baja el stock y el cobro entra en Caja");
ok((await pedro("POST", `/api/leads/${L.id}/uniforme`, { talla: "10", monto: 85 })).status === 403, "Un profesor no puede cobrar el uniforme (ni es de su sede)");

// ---------- Reporte mensual y copia ----------
r = await katy("POST", "/api/ejecutar-tareas?hora=9");
ok(r.data.reporteMensual && (r.data.reporteMensual.enviado === true || /día 1/.test(r.data.reporteMensual.motivo)), "La tarea del reporte mensual corre (solo envía el día 1)");
const cp = await fetch(BOT + "/api/copia.json", { headers: { Cookie: cookieK } });
const cj = await cp.json();
ok(cp.status === 200 && cj.tablas.leads.length > 5 && cj.tablas.personal.every((p) => !p.pin_hash), "Copia completa en JSON, sin los PIN");
r = await katy("POST", "/api/ejecutar-tareas?hora=4");
const esDomingo = new Date(hoy + "T12:00:00Z").getUTCDay() === 0;
ok(esDomingo ? r.data.copia && (r.data.copia.guardada === true || /R2/.test(r.data.copia.motivo)) : r.data.copia === undefined, esDomingo ? "La copia semanal se guardó" : "La copia semanal solo corre los domingos (hoy no toca)");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de la ronda 3 pasaron");
