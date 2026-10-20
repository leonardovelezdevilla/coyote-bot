// Carnet digital del alumno: una página con código QR que el papá o mamá
// abre desde WhatsApp (o Katy imprime). En la cancha se escanea desde el panel.

import QRCode from "qrcode-svg";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Token aleatorio, legible, sin caracteres confusos
export function nuevoToken() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = crypto.getRandomValues(new Uint8Array(10));
  return [...b].map((x) => abc[x % abc.length]).join("");
}

export function qrSVG(texto, tamano = 240) {
  return new QRCode({ content: texto, padding: 0, width: tamano, height: tamano, ecl: "M", join: true, container: "svg-viewbox" }).svg();
}

export function carnetHTML(cfg, lead, url, { quedan, usadas } = {}) {
  const sede = cfg.sedes[lead.sede] || {};
  const nombre = lead.padre || lead.perfil || "Familia Coyote";
  const qr = qrSVG(url, 260);
  const estado = lead.estado === "inscrito" ? (quedan === 0 ? "Clases agotadas" : quedan === 1 ? "Le queda 1 clase" : `Le quedan ${quedan} clases`) : "Clase de prueba";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Carnet Coyote</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Barlow:wght@400;600&display=swap">
<style>
:root{--rojo:#c8202a;--carbon:#1f1b19;--tiza:#f2f3f0;--gris:#5b605a;--cancha:#1e7a46}
*{box-sizing:border-box}body{margin:0;background:var(--carbon);color:var(--carbon);font:400 17px/1.45 Barlow,system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}
.carnet{background:#fff;border-radius:22px;width:min(100%,380px);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.cab{background:var(--rojo);color:#fff;padding:18px 22px;display:flex;align-items:center;gap:12px}
.cab b{font-family:"Barlow Condensed",sans-serif;font-size:1.6rem;line-height:1}.cab small{display:block;font-size:.8rem;opacity:.9}
.cuerpo{padding:22px;display:grid;gap:14px;justify-items:center;text-align:center}
.qr{width:260px;height:260px}.qr svg{width:100%;height:100%;display:block}
h1{font-family:"Barlow Condensed",sans-serif;font-size:2rem;margin:0;line-height:1.05}
.dato{color:var(--gris);margin:0}.estado{font-weight:600;color:${lead.estado === "inscrito" && quedan > 2 ? "var(--cancha)" : "var(--rojo)"};margin:0}
.codigo{font-family:"Barlow Condensed",sans-serif;letter-spacing:.2em;font-size:1.2rem;color:var(--gris)}
.pie{background:var(--tiza);padding:14px 22px;font-size:.9rem;color:var(--gris);text-align:center}
.btn{display:inline-block;margin-top:16px;color:#fff;border:1.5px solid rgba(255,255,255,.6);border-radius:10px;padding:10px 16px;text-decoration:none;font-weight:600}
@media print{body{background:#fff;padding:0}.carnet{box-shadow:none;border:1px solid #ccc}.btn{display:none}}
</style></head><body><div>
<article class="carnet" aria-label="Carnet del alumno">
<div class="cab"><svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2.5 42.6 13.25v21.5L24 45.5 5.4 34.75v-21.5z" fill="#fff"/><path d="M24 6.6 39 15.3v17.4L24 41.4 9 32.7V15.3z" fill="#c8202a"/><text x="24" y="31" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="20" fill="#fff">C</text></svg><div><b>Carnet Coyote</b><small>${esc(cfg.escuela)}</small></div></div>
<div class="cuerpo">
<div class="qr" role="img" aria-label="Código QR del carnet">${qr}</div>
<h1>${esc(nombre)}</h1>
<p class="dato">${esc(lead.edad || "")}${lead.edad && sede.nombre ? " · " : ""}${esc(sede.nombre || "")}</p>
<p class="estado">${estado}${usadas ? ` · ${usadas} asistencias` : ""}</p>
<span class="codigo">${esc(lead.token)}</span>
${cfg.referidos?.activo ? `<p class="dato" style="font-size:.92rem;max-width:30ch">¿Conoces a otra familia? Que escriba al WhatsApp de la escuela con este código. ${esc(cfg.referidos.beneficio || "")}</p>` : ""}
${lead.saldo > 0 ? `<p class="estado" style="color:var(--rojo)">Cuota pendiente: S/ ${lead.saldo}</p>` : ""}
</div>
<div class="pie">Muestra este código al llegar a la cancha. Si lo imprimes, también funciona.</div>
</article>
<p style="text-align:center"><a class="btn" href="javascript:print()">Imprimir o guardar como PDF</a></p>
</div></body></html>`;
}
