// Corre todas las pruebas de punta a punta contra el bot en local.
// Uso: npm test   (necesita .dev.vars con los valores de prueba de abajo)
//   WHATSAPP_TOKEN=token-de-prueba  APP_SECRET=secreto-de-prueba  VERIFY_TOKEN=verificar-prueba
//   ADMIN_PASSWORD=clave-panel  SESSION_SECRET=secreto-sesion-prueba  PRUEBAS=1  GRAPH_BASE=http://127.0.0.1:9999
import { spawn, execSync } from "node:child_process";
import { setTimeout as esperar } from "node:timers/promises";
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL(".", import.meta.url).pathname;
const ORDEN = ["prueba-completa", "prueba-chats", "prueba-entender", "prueba-lista", "prueba-persona", "prueba-mejoras", "prueba-modulos", "prueba-personal", "prueba-ronda3", "prueba-ronda4"];
execSync("rm -rf .wrangler && npx wrangler d1 execute coyote-bot --local --file=schema.sql", { stdio: "ignore" });
// Si quedó un servidor de una corrida anterior, avisar en vez de esperar para siempre
for (const puerto of [8787, 9999]) {
  try { await fetch(`http://127.0.0.1:${puerto}/`); console.error(`El puerto ${puerto} ya está ocupado (¿quedó un wrangler o mock de otra corrida?). Ciérralo y vuelve a correr npm test.`); process.exit(2); } catch {}
}
// detached + process group: así al terminar se cierra wrangler y no solo npx
const mock = spawn("node", [dir + "mock.mjs"], { stdio: "ignore", detached: true });
const dev = spawn("npx", ["wrangler", "dev", "--local", "--test-scheduled", "--port", "8787"], { stdio: "ignore", detached: true });
const apagar = (p) => { try { process.kill(-p.pid, "SIGTERM"); } catch {} try { p.kill(); } catch {} };
let total = 0, fallas = 0, listo = false;
try {
  for (let i = 0; i < 90; i++) { try { await fetch("http://127.0.0.1:8787/entrar"); listo = true; break; } catch { await esperar(1000); } }
  if (!listo) throw new Error("wrangler dev no arrancó en 90 s");
  for (const p of ORDEN) {
    writeFileSync(dir + "enviados.jsonl", readFileSync(dir + "enviados.jsonl", "utf8"));
    let r;
    try { r = execSync(`node ${dir}${p}.mjs`, { encoding: "utf8", cwd: dir + "..", stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { r = (e.stdout || "") + "\n✘ " + p + " se detuvo: " + String(e.stderr || e.message).split("\n").find((l) => /Error/.test(l)); }
    const ok = (r.match(/^✔/gm) || []).length, mal = (r.match(/^✘/gm) || []).length;
    total += ok; fallas += mal;
    console.log(`${p}: ${ok} ✔${mal ? ` ${mal} ✘` : ""}`);
    if (mal) console.log(r.split("\n").filter((l) => l.startsWith("✘")).join("\n"));
  }
} finally { apagar(mock); apagar(dev); }
console.log(`\nTotal: ${total} pruebas pasaron${fallas ? `, ${fallas} fallaron` : ""}`);
process.exit(fallas ? 1 : 0);
