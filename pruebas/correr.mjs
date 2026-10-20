// Corre todas las pruebas de punta a punta contra el bot en local.
// Uso: npm test   (necesita .dev.vars con los valores de prueba de abajo)
//   WHATSAPP_TOKEN=token-de-prueba  APP_SECRET=secreto-de-prueba  VERIFY_TOKEN=verificar-prueba
//   ADMIN_PASSWORD=clave-panel  GRAPH_BASE=http://127.0.0.1:9999
import { spawn, execSync } from "node:child_process";
import { setTimeout as esperar } from "node:timers/promises";
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL(".", import.meta.url).pathname;
const ORDEN = ["prueba-completa", "prueba-chats", "prueba-entender", "prueba-lista", "prueba-persona", "prueba-mejoras", "prueba-modulos", "prueba-personal", "prueba-ronda3"];
execSync("rm -rf .wrangler && npx wrangler d1 execute coyote-bot --local --file=schema.sql", { stdio: "ignore" });
const mock = spawn("node", [dir + "mock.mjs"], { stdio: "ignore" });
const dev = spawn("npx", ["wrangler", "dev", "--local", "--test-scheduled", "--port", "8787"], { stdio: "ignore" });
let total = 0, fallas = 0;
try {
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:8787/entrar"); break; } catch { await esperar(1000); } }
  for (const p of ORDEN) {
    writeFileSync(dir + "enviados.jsonl", readFileSync(dir + "enviados.jsonl", "utf8"));
    const r = execSync(`node ${dir}${p}.mjs`, { encoding: "utf8", cwd: dir + ".." });
    const ok = (r.match(/^✔/gm) || []).length, mal = (r.match(/^✘/gm) || []).length;
    total += ok; fallas += mal;
    console.log(`${p}: ${ok} ✔${mal ? ` ${mal} ✘` : ""}`);
    if (mal) console.log(r.split("\n").filter((l) => l.startsWith("✘")).join("\n"));
  }
} finally { mock.kill(); dev.kill(); }
console.log(`\nTotal: ${total} pruebas pasaron${fallas ? `, ${fallas} fallaron` : ""}`);
process.exit(fallas ? 1 : 0);
