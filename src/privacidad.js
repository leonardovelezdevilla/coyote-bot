// Página pública de privacidad (/privacidad). Los papás dejan su celular y la edad
// de su hijo(a); la Ley 29733 (Perú) pide decirles para qué y cómo pedir que se borre.

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function privacidadHTML(cfg) {
  const escuela = esc(cfg.escuela);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacidad — ${escuela}</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Barlow:wght@400;600&display=swap">
<style>
:root{--rojo:#c8202a;--carbon:#1f1b19;--tiza:#f2f3f0;--gris:#5b605a}
*{box-sizing:border-box}body{margin:0;background:var(--tiza);color:var(--carbon);font:400 18px/1.55 Barlow,system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:40px 20px 80px}
h1{font-family:"Barlow Condensed",sans-serif;font-size:2.6rem;line-height:1.05;margin:0 0 8px}h2{font-family:"Barlow Condensed",sans-serif;font-size:1.6rem;margin:32px 0 8px}
p,li{max-width:65ch}a{color:var(--rojo)}.volver{display:inline-block;margin-bottom:24px;font-weight:600}
a:focus-visible{outline:3px solid var(--rojo);outline-offset:3px}
</style></head><body><main>
<a class="volver" href="/">← Volver a la página de la escuela</a>
<h1>Cómo cuidamos tus datos</h1>
<p>Esta página explica qué datos guarda la ${escuela} cuando escribes a nuestro WhatsApp o te inscribes, y qué puedes pedirnos.</p>
<h2>Qué guardamos</h2>
<ul>
<li>Tu número de celular y el nombre con el que te presentas en WhatsApp.</li>
<li>El nombre del padre, madre o apoderado que nos das.</li>
<li>La edad del niño o niña y la sede donde entrena. <b>No pedimos ni guardamos el nombre del niño.</b></li>
<li>Los mensajes que intercambias con nosotros por WhatsApp, incluidas fotos como comprobantes de pago.</li>
<li>Si se inscribe: pagos, asistencia a clases y talla de uniforme.</li>
</ul>
<h2>Para qué</h2>
<ul>
<li>Responder tus consultas, agendar la clase de prueba y recordártela.</li>
<li>Gestionar la inscripción, los pagos, la asistencia y el carnet de tu hijo(a).</li>
<li>Avisarte de cambios de horario o de clases suspendidas en tu sede.</li>
<li>Enviarte, de vez en cuando, promociones de la escuela. Puedes dejar de recibirlas escribiendo <b>BAJA</b>.</li>
</ul>
<h2>Con quién se comparten</h2>
<p>Con nadie fuera de la escuela. Los mensajes viajan por WhatsApp (Meta) y los datos se guardan en servidores de Cloudflare, con copias de seguridad. Solo la administración y el personal de tu sede pueden ver tu información, y cada acceso queda registrado.</p>
<h2>Cuánto tiempo</h2>
<p>Los chats se borran automáticamente al cumplir un año. Los datos de inscripción se conservan mientras seas parte de la escuela y hasta dos años después, para atender renovaciones o consultas sobre pagos.</p>
<h2>Qué puedes pedir</h2>
<p>Puedes pedirnos ver, corregir o borrar tus datos, o dejar de recibir mensajes, escribiendo por el mismo WhatsApp de la escuela o a ${cfg.nombreHumano ? esc(cfg.nombreHumano) : "la administración"}. Lo atendemos en un plazo de 10 días.</p>
<p>Base legal: Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento.</p>
</main></body></html>`;
}
