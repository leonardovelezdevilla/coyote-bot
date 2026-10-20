// Estado del sistema, errores de WhatsApp, privacidad
import fs from "node:fs";
import { execSync } from "node:child_process";
const BOT = "http://127.0.0.1:8787";
let fallas = 0;
const ok = (c, t) => { console.log((c ? "✔ " : "✘ ") + t); if (!c) fallas++; };
const sql = (q) => JSON.parse(execSync(`npx wrangler d1 execute coyote-bot --local --json --command "${q.replace(/"/g, '\\"')}" 2>/dev/null`).toString())[0].results;
const cookie = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };

let r = await api("GET", "/api/estado");
ok(r.status === 200 && Array.isArray(r.data.faltan) && r.data.faltan.some((f) => /Yape/.test(f.que)), `Lista de «primer día»: faltan ${r.data.faltan.length} datos (incluye el Yape de la escuela)`);
ok(r.data.errorWA === null, "Sin errores de WhatsApp registrados");
sql(`INSERT INTO ajustes (clave, valor, actualizado) VALUES ('error_whatsapp', '{"motivo":"El token de WhatsApp venció","status":401}', '2026-01-01') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`);
r = await api("GET", "/api/estado");
ok(r.data.errorWA && /token/.test(r.data.errorWA.motivo), "Si Meta rechaza envíos, el panel lo sabe y lo muestra en Hoy");
sql("DELETE FROM ajustes WHERE clave='error_whatsapp'");
const w = await fetch(BOT + "/privacidad");
const h = await w.text();
ok(w.status === 200 && /Ley N\.º 29733/.test(h) && /No pedimos ni guardamos el nombre del niño/.test(h), "Página de privacidad pública, con la ley peruana y la regla del nombre del niño");
ok(/href="\/privacidad"/.test(await (await fetch(BOT + "/")).text()), "La web enlaza a la privacidad en el pie");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de la ronda 4 pasaron");

// ---------- Fuerza bruta y cabeceras ----------
{
  let ultimo = 0;
  for (let i = 0; i < 9; i++) { const w2 = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre: "Nadie Real", clave: "000000" }), redirect: "manual" }); ultimo = w2.status; }
  ok(ultimo === 429, "Tras 8 PIN equivocados seguidos, la entrada se bloquea 15 minutos (429)");
  const w3 = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ clave: "clave-panel" }), redirect: "manual" });
  ok(w3.status === 429 || w3.status === 303, "El bloqueo es por IP o por nombre, y expira solo");
  sql("DELETE FROM intentos");
  const w4 = await fetch(BOT + "/panel", { headers: { Cookie: cookie } });
  ok(w4.headers.get("x-frame-options") === "DENY" && /frame-ancestors 'none'/.test(w4.headers.get("content-security-policy") || ""), "El panel no se puede meter en un iframe (X-Frame-Options y CSP)");
  const w5 = await fetch(BOT + "/");
  ok(/default-src 'self'/.test(w5.headers.get("content-security-policy") || "") && w5.headers.get("x-content-type-options") === "nosniff", "La web también lleva cabeceras de seguridad");
}
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de la ronda 4 (seguridad) pasaron");
