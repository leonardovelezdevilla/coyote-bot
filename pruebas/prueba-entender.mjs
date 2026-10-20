// Cuando el bot no entiende: palabras nuevas, edades y fechas escritas, «no te entendí» y la lista para enseñarle
import crypto from "node:crypto";
import fs from "node:fs";
const BOT = "http://127.0.0.1:8787";
const enviados = new URL("./enviados.jsonl", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const leer = () => fs.readFileSync(enviados, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
let fallas = 0, n = 0;
const ok = (cond, txt) => { console.log((cond ? "✔ " : "✘ ") + txt); if (!cond) fallas++; };
const cookie = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: await x.json() }; };
async function msg(from, mensaje, nombre = "Prueba") {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: nombre } }], messages: [{ from, id: "wamid.e" + ++n + Date.now(), timestamp: "1", ...mensaje }] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", "secreto-de-prueba").update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body).filter((b) => !b.status);
}
const t = (s) => ({ type: "text", text: { body: s } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const txt = (b) => (b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : b.type);
const botones = (b) => b?.interactive?.action?.buttons?.map((x) => x.reply.id) || [];

const A = "51966600001";
await msg(A, t("hola"), "Sofía");
let o = await msg(A, t("tiene 8 años"), "Sofía");
ok(o[0] && botones(o[0]).includes("SMP"), "«tiene 8 años» se entiende como la edad y pasa a la sede");
o = await msg(A, t("¿qué hora son?"), "Sofía");
ok(/horarios/i.test(txt(o[0])) && botones(o[1]).includes("LO"), "«¿qué hora son?» da los horarios y vuelve a preguntar la sede");
o = await msg(A, t("los olivos por favor"), "Sofía");
ok(/S\/ 250/.test(txt(o[0])), "«los olivos por favor» elige la sede");
o = await msg(A, t("asdf qwer"), "Sofía");
ok(/No te entendí bien/.test(txt(o[0])) && botones(o[1]).includes("CLASE"), "Algo que no entiende: «No te entendí bien» y repite las opciones (sin mandar toda la información otra vez)");
o = await msg(A, t("zzz yyy"), "Sofía");
ok(/sigo sin entenderte/.test(txt(o[0])) && botones(o[0]).join() === "HUMANO,PREGUNTAS,MENU", "Segunda vez seguida: ofrece hablar con Katy o ver las preguntas");
o = await msg(A, t("gracias"), "Sofía");
ok(o.length === 1 && /De nada/.test(txt(o[0])), "«gracias» → «¡De nada!» sin repetir nada");
o = await msg(A, btn("CLASE"), "Sofía");
o = await msg(A, t("el siguiente"), "Sofía");
ok(/nombre/i.test(txt(o[0])), "«el siguiente» elige la segunda fecha y pide el nombre");
o = await msg(A, t("Sofía Torres"), "Sofía");
ok(/Listo, Sofía/.test(txt(o[0])), "Clase agendada");
o = await msg(A, t("quiero inscribirlo de una vez"), "Sofía");
ok(/te escribe por aquí/.test(txt(o[0])), "Al final, «quiero inscribirlo» también pasa con Katy");

const B = "51966600002";
await msg(B, t("buenas"), "Raúl");
o = await msg(B, t("ocho añitos"), "Raúl");
ok(botones(o[0]).includes("SMP"), "«ocho añitos» se entiende");
const C = "51966600003";
await msg(C, t("hola"), "Elena");
o = await msg(C, t("tiene 25"), "Elena");
ok(/Entrenamos de \d+ a \d+ años/.test(txt(o[0])) && botones(o[0]).includes("HUMANO"), "Edad fuera de rango: dice el rango y ofrece hablar con Katy");
o = await msg(C, t("tengo 2 hijos de 7 y 9"), "Elena");
ok(/son 2 hermanos/.test(txt(o[0])), "Varias edades a la vez: entiende que son hermanos y sigue con el mayor");

// Lista de lo que no entendió y enseñarle
let r = await api("GET", "/api/no-entendidos");
const g = r.data.find((x) => x.texto === "asdf qwer");
ok(r.status === 200 && g && g.veces === 1, `El panel lista lo que no entendió (${r.data.length} mensajes distintos)`);
await msg("51966600004", t("hola"), "Iván");
await msg("51966600004", t("6"), "Iván");
await msg("51966600004", t("asdf qwer"), "Iván");
r = await api("GET", "/api/no-entendidos");
ok(r.data.find((x) => x.texto === "asdf qwer").veces === 2, "Agrupa los mensajes iguales y cuenta cuántas veces se repiten");
const c = (await api("GET", "/api/config")).data.config;
c.preguntas.find((p) => p.palabras.startsWith("precio")).palabras += ", asdf qwer";
ok((await api("PUT", "/api/config", c)).status === 200, "Enseñarle: agregar la frase a una respuesta y guardar");
o = await msg("51966600004", t("asdf qwer?"), "Iván");
ok(/S\/ 250/.test(txt(o[0])), "Ahora el bot sí entiende esa frase");
await api("POST", "/api/no-entendidos/quitar", { ids: r.data.find((x) => x.texto === "asdf qwer").ids });
r = await api("GET", "/api/no-entendidos");
ok(!r.data.some((x) => x.texto === "asdf qwer"), "Lo enseñado sale de la lista");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de «no entendí» pasaron");
{ // la respuesta de «cómo pago» usa la cuenta de la escuela
  const c3 = (await api("GET", "/api/config")).data.config; c3.pago.numero = "987654321"; c3.pago.titular = "Katy Rivera"; await api("PUT", "/api/config", c3);
  await new Promise((r) => setTimeout(r, 16000));
  const o3 = await msg("51966600008", t("hola, aceptan yape?"), "Nuevo");
  ok(/987654321/.test(txt(o3[0])) && /Katy Rivera/.test(txt(o3[0])), "«¿Aceptan Yape?» responde con el número y titular de la escuela");
  c3.pago.numero = ""; c3.pago.titular = ""; await api("PUT", "/api/config", c3);
}
