// Pedir hablar con una persona: más formas de decirlo y la lista mientras esperan a Katy
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
async function msg(from, mensaje) {
  const before = leer().length;
  const body = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: "Pilar" } }], messages: [{ from, id: "wamid.h" + ++n + Date.now(), timestamp: "1", ...mensaje }] } }] }] });
  await fetch(BOT + "/webhook", { method: "POST", headers: { "X-Hub-Signature-256": "sha256=" + crypto.createHmac("sha256", "secreto-de-prueba").update(body).digest("hex") }, body });
  await sleep(700);
  return leer().slice(before).map((e) => e.body).filter((b) => !b.status);
}
const t = (s) => ({ type: "text", text: { body: s } });
const fila = (id) => ({ type: "interactive", interactive: { type: "list_reply", list_reply: { id, title: id } } });
const btn = (id) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title: id } } });
const txt = (b) => (b.type === "text" ? b.text.body : b.type === "interactive" ? b.interactive.body.text : b.type === "template" ? "plantilla" : b.type);
const alPadre = (o, to) => o.filter((b) => b.to === to);

// Primer mensaje pidiendo un asesor
const A = "51988800001";
let o = alPadre(await msg(A, t("Buenas tardes, quiero hablar con un asesor")), A);
ok(/te responde por aquí/.test(txt(o[0])) && o[1]?.interactive?.type === "list" && /Mientras Katy te responde/.test(txt(o[1])), "Primer mensaje «quiero hablar con un asesor»: pasa con Katy y le muestra la lista mientras espera");
ok(sql(`SELECT atencion FROM leads WHERE wa_id='${A}'`)[0].atencion === "humano", "El chat queda para Katy");
o = alPadre(await msg(A, fila("P_P1")), A);
ok(o.length === 1 && /S\/ 250/.test(txt(o[0])), "Mientras espera a Katy, si toca una pregunta de la lista el bot la responde (sin más botones)");
ok(sql(`SELECT atencion FROM leads WHERE wa_id='${A}'`)[0].atencion === "humano", "…y el chat sigue siendo de Katy");
o = alPadre(await msg(A, t("ok gracias, espero")), A);
ok(o.length === 0, "Lo que escribe mientras espera no lo responde el bot (lo ve Katy)");

// Varias formas de pedir una persona a mitad de la conversación
const frases = ["quiero hablar con un humano", "que me atienda alguien por favor", "llámenme", "¿eres un robot?", "con una persona real", "necesito ayuda"];
for (const [i, f] of frases.entries()) {
  const X = "5198880010" + i;
  await msg(X, t("hola")); await msg(X, t("9"));
  o = alPadre(await msg(X, t(f)), X);
  ok(/te responde por aquí/.test(txt(o[0])) && o[1]?.interactive?.type === "list", `«${f}» → pasa con Katy + lista`);
}
// Lo que no debe confundirse
const Y = "51988800200";
await msg(Y, t("hola")); await msg(Y, t("9"));
o = alPadre(await msg(Y, t("¿cuánto cuesta por persona?")), Y);
ok(/S\/ 250/.test(txt(o[0])), "«¿cuánto cuesta por persona?» → da el precio (no lo pasa con Katy)");
o = alPadre(await msg(Y, t("necesito ayuda con el horario")), Y);
ok(/horarios/i.test(txt(o[0])), "«necesito ayuda con el horario» → da los horarios");
// Inscribir no muestra la lista
await msg(Y, btn("SMP"));
o = alPadre(await msg(Y, btn("INSCRIBIR")), Y);
ok(o.length === 1 && /inscripción/.test(txt(o[0])), "Al pedir inscribirse no se manda la lista (solo «Katy te escribe»)");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de «hablar con una persona» pasaron");
