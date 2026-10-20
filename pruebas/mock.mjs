// Imita la API de WhatsApp: guarda cada mensaje enviado en enviados.jsonl
// y sirve archivos de prueba (audios/fotos) como lo hace Meta.
import http from "node:http";
import fs from "node:fs";
const out = new URL("./enviados.jsonl", import.meta.url);
fs.writeFileSync(out, "");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
http.createServer((req, res) => {
  if (req.method === "GET") {
    const m = req.url.match(/^\/v[\d.]+\/(\d+)$/);
    if (m) {
      if (req.headers.authorization !== "Bearer token-de-prueba") { res.writeHead(401); return res.end(); }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ url: `http://127.0.0.1:9999/archivo/${m[1]}`, mime_type: m[1].startsWith("7") ? "image/png" : "audio/ogg" }));
    }
    if (req.url.startsWith("/archivo/")) {
      const img = req.url.includes("/7");
      res.writeHead(200, { "Content-Type": img ? "image/png" : "audio/ogg" });
      return res.end(img ? PNG : Buffer.from("OggS-prueba"));
    }
    res.writeHead(404); return res.end();
  }
  if (req.url.endsWith("/media")) { // subida de archivos (audio desde el panel)
    let n = 0; req.on("data", (c) => (n += c.length));
    req.on("end", () => { fs.appendFileSync(out, JSON.stringify({ url: req.url, subida: n }) + "\n"); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id: "9900001" })); });
    return;
  }
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => {
    fs.appendFileSync(out, JSON.stringify({ url: req.url, auth: req.headers.authorization, body: JSON.parse(b || "{}") }) + "\n");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ messages: [{ id: "wamid.x" }] }));
  });
}).listen(9999, "127.0.0.1", () => console.log("mock listo"));
