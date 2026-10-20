// Página pública de la escuela (https://.../). Se arma con la misma configuración
// que Katy edita en Ajustes: precios, sedes, horarios, edades y preguntas frecuentes.
// Todos los botones llevan al WhatsApp del bot.

import { llenar } from "./config.js";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fechaLarga = (iso) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return ""; const d = new Date(iso + "T12:00:00Z"); return `${d.getUTCDate()} de ${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][d.getUTCMonth()]}`; };
// *negrita* de WhatsApp → <b>, saltos de línea → <br>
const texto = (t) => esc(t).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/\n/g, "<br>");

// Líneas de tiza de media cancha, vistas desde arriba
const CANCHA = `<svg class="cancha" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<g fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".55">
<rect x="40" y="-300" width="1120" height="800" rx="2"/>
<line x1="40" y1="500" x2="1160" y2="500"/>
<rect x="300" y="300" width="600" height="200"/>
<rect x="470" y="420" width="260" height="80"/>
<path d="M455 300 A150 150 0 0 1 745 300"/>
<circle cx="600" cy="370" r="4" fill="#fff"/>
<path d="M40 60 A60 60 0 0 1 100 0" transform="translate(0,-60)"/>
</g></svg>`;

export function webHTML(cfg, canal = "web") {
  const w = cfg.web || {};
  const numero = (w.numero || "").replace(/\D/g, "");
  const etiqueta = /^(web|fb|ig|google|volante|cancha)$/.test(canal) ? ` #${canal}` : " #web"; // para saber de dónde llegó
  const wa = (msg) => numero ? `https://wa.me/${numero}?text=${encodeURIComponent(msg + etiqueta)}` : "#";
  const sedes = Object.entries(cfg.sedes).filter(([, s]) => s.activa);
  const edades = cfg.edades || [];
  const min = Math.min(...edades.map((e) => e.min)), max = Math.max(...edades.map((e) => e.max));
  const dia = DIAS[cfg.clasePrueba.diaSemana] || "sábado";
  const inicio = fechaLarga(w.inicio);
  const finPre = fechaLarga(cfg.finPreventa);
  const preventaVigente = cfg.finPreventa >= new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
  const vars = {
    sedes: sedes.map(([, s]) => `• ${s.nombre}: ${s.lugar}${s.direccion ? `, ${s.direccion}` : ""}`).join("\n"),
    horarios: sedes.map(([, s]) => `• ${s.nombre}: ${s.horario || "horario por confirmar"}`).join("\n"),
    clases: cfg.clasesVerano, precio: cfg.precioVerano, precioCiclo: cfg.precioCiclo,
    uniforme: preventaVigente ? `Uniforme a S/ ${cfg.uniformePreventa} en preventa (S/ ${cfg.uniforme} después)` : `Uniforme: S/ ${cfg.uniforme}`,
    humano: cfg.nombreHumano, escuela: cfg.escuela,
  };
  const preguntas = (cfg.preguntas || []).filter((p) => p.titulo && p.respuesta);

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(cfg.escuela)} — Verano ${esc(w.temporada || "")}</title>
<meta name="description" content="Escuela de fútbol para niños de ${min} a ${max} años en ${sedes.map(([, s]) => s.nombre).join(", ")}. Clase de prueba gratis. ${cfg.clasesVerano} clases de verano por S/ ${cfg.precioVerano}.">
<meta property="og:title" content="${esc(cfg.escuela)}"><meta property="og:description" content="Clase de prueba gratis. ${cfg.clasesVerano} clases de verano por S/ ${cfg.precioVerano}.">
<link rel="icon" href="/icono-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#1e7a46">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap">
<style>
:root{--rojo:#c8202a;--rojo-osc:#a3151e;--carbon:#1f1b19;--gris:#5b605a;--linea:#dcdfd9;--tiza:#f2f3f0;--blanco:#fff;--cancha:#1e7a46;--cancha-osc:#165c35;--cancha-suave:#e2f1e7;
--titulo:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--texto:"Barlow",system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--tiza);color:var(--carbon);font:400 17px/1.5 var(--texto)}
h1,h2,h3{font-family:var(--titulo);font-weight:700;line-height:1.02;margin:0;text-wrap:balance}
p{margin:0}a{color:var(--rojo)}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:12px 22px;border-radius:12px;font-weight:700;font-size:1.05rem;text-decoration:none;border:2px solid transparent}
.btn.wa{background:var(--rojo);color:#fff}.btn.wa:hover{background:var(--rojo-osc)}
.btn.claro{background:transparent;border-color:rgba(255,255,255,.7);color:#fff}
.btn.borde{background:var(--blanco);border-color:var(--carbon);color:var(--carbon)}
.btn svg{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.saltar{position:absolute;left:-999px;top:8px;background:var(--carbon);color:#fff;padding:10px 14px;border-radius:8px;z-index:50;text-decoration:none;font-weight:700}
.saltar:focus{left:8px}
@media (prefers-contrast:more){:root{--gris:#3e423d;--linea:#9a9e97}}
@media (forced-colors:active){.btn{border:2px solid ButtonText}.check{outline:1px solid CanvasText}}
.faq summary{list-style:none}.faq summary::marker{display:none}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--rojo);outline-offset:3px}
/* Cabecera */
.top{background:var(--blanco);border-bottom:1.5px solid var(--linea)}
.top .wrap{display:flex;align-items:center;gap:12px;min-height:66px}
.marca{font-family:var(--titulo);font-weight:700;font-size:1.5rem;line-height:1;color:var(--carbon);text-decoration:none;display:flex;align-items:center;gap:10px}
.marca small{display:block;font-family:var(--texto);font-weight:500;font-size:.78rem;color:var(--gris)}
.top .btn{margin-left:auto;min-height:44px;padding:8px 14px;font-size:.95rem}
/* Pizarra: la cancha */
.hero{position:relative;background:var(--cancha);color:#fff;overflow:hidden;isolation:isolate}
.hero .cancha{position:absolute;inset:0;width:100%;height:100%;z-index:-1;opacity:.7}
@media (min-width:900px){.hero .cancha{left:52%;width:48%;opacity:1}}
.hero .wrap{padding:56px 20px 44px;display:grid;gap:22px;max-width:1040px}
.hero h1,.hero p{max-width:620px}
.hero h1{font-size:clamp(2.9rem,9vw,5.4rem);font-weight:800;letter-spacing:-.01em;text-shadow:0 2px 0 rgba(0,0,0,.18);max-width:11ch}
.hero p{font-size:1.2rem;max-width:34ch;text-wrap:pretty}
.hero .acciones{display:flex;flex-wrap:wrap;gap:12px}
.hero .dato{font-family:var(--titulo);font-size:1.15rem;font-weight:600;opacity:.95}
/* Precio como ticket de inscripción */
.oferta{margin-top:-28px;position:relative}
.ticket{background:var(--blanco);border-radius:18px;box-shadow:0 14px 40px rgba(31,27,25,.12);display:grid;grid-template-columns:1fr;overflow:hidden;border:1.5px solid var(--linea)}
.ticket .precio{background:var(--carbon);color:var(--tiza);padding:22px 24px;display:flex;flex-direction:column;justify-content:center;gap:2px}
.ticket .precio b{font-family:var(--titulo);font-size:4rem;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
.ticket .precio b small{font-size:1.5rem;font-weight:600;margin-right:4px;vertical-align:.9em}
.ticket .precio span{font-size:1.05rem}
.ticket .detalle{padding:22px 24px;display:grid;gap:10px}
.ticket .detalle li{display:flex;gap:10px;align-items:flex-start}
.ticket ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ticket .detalle .tachado{text-decoration:line-through;color:var(--gris)}
.check{width:22px;height:22px;flex:none;border-radius:50%;background:var(--cancha-suave);color:var(--cancha);display:grid;place-items:center;margin-top:2px}
.check svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
@media (min-width:760px){.ticket{grid-template-columns:280px 1fr}}
/* Secciones */
section.s{padding:52px 0 8px}
section.s h2{font-size:clamp(2rem,5vw,2.8rem);margin-bottom:6px}
section.s>.wrap>p.intro{color:var(--gris);max-width:60ch;margin-bottom:22px}
.sedes{display:grid;gap:14px}
@media (min-width:760px){.sedes{grid-template-columns:repeat(3,1fr)}}
.sede{background:var(--blanco);border:1.5px solid var(--linea);border-left:6px solid var(--cancha);border-radius:14px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:8px}
.sede h3{font-size:1.65rem}.sede .lugar{font-weight:600}.sede .dir,.sede .hor{color:var(--gris)}
.sede .hor b{color:var(--carbon);font-weight:600}
.sede .acc{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.sede .acc .btn{min-height:46px;padding:8px 14px;font-size:.98rem;flex:1 1 auto}
/* Clase de prueba: sí es una secuencia */
.pasos{list-style:none;margin:0;padding:0;display:grid;gap:14px;counter-reset:p}
@media (min-width:760px){.pasos{grid-template-columns:repeat(3,1fr)}}
.pasos li{background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;padding:18px;display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:start}
.pasos li::before{counter-increment:p;content:counter(p);font-family:var(--titulo);font-weight:800;font-size:1.6rem;width:44px;height:44px;border-radius:50%;background:var(--rojo);color:#fff;display:grid;place-items:center}
.pasos b{display:block;font-family:var(--titulo);font-size:1.35rem;font-weight:700;margin-bottom:2px}
.pasos p{color:var(--gris)}
/* Edades */
.edades{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.edad{background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;padding:14px 16px}
.edad b{display:block;font-family:var(--titulo);font-size:1.6rem;font-weight:700;line-height:1.05}.edad span{color:var(--gris)}
/* Preguntas */
.faq{display:grid;gap:8px}
.faq details{background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;padding:0 18px}
.faq summary{cursor:pointer;font-weight:700;font-size:1.08rem;min-height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";font-family:var(--titulo);font-size:1.8rem;color:var(--rojo);line-height:1}
.faq details[open] summary::after{content:"–"}
.faq .r{padding:0 0 16px;color:var(--carbon);max-width:65ch}
/* Cierre y pie */
.cierre{margin:56px 0 0;background:var(--carbon);color:var(--tiza)}
.cierre .wrap{padding:44px 20px;display:grid;gap:16px;justify-items:start}
.cierre h2{font-size:clamp(2rem,5vw,2.8rem)}
.cierre p{max-width:46ch;color:#cfd3cc}
footer{padding:22px 0 calc(90px + env(safe-area-inset-bottom,0px));color:var(--gris);font-size:.9rem}
footer .wrap{display:flex;flex-wrap:wrap;gap:6px 18px}
@media (min-width:760px){footer{padding-bottom:28px}}
/* Botón fijo en el celular */
.fijo{position:fixed;left:0;right:0;bottom:0;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:rgba(242,243,240,.92);backdrop-filter:blur(8px);border-top:1.5px solid var(--linea);z-index:10}
.fijo .btn{width:100%}
@media (min-width:760px){.fijo{display:none}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style></head><body>
<a class="saltar" href="#contenido">Ir al contenido</a>
<header class="top"><div class="wrap">
<a class="marca" href="/"><svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2.5 42.6 13.25v21.5L24 45.5 5.4 34.75v-21.5z" fill="#c8202a"/><path d="M24 6.6 39 15.3v17.4L24 41.4 9 32.7V15.3z" fill="#fff"/><text x="24" y="31" text-anchor="middle" font-family="'Barlow Condensed',Arial Narrow,sans-serif" font-weight="700" font-size="20" fill="#c8202a">C</text></svg><span>Coyote<small>Escuela de fútbol</small></span></a>
<a class="btn wa" href="${wa("Hola, quiero información de la escuela")}">${ICONO_WA}WhatsApp</a>
</div></header>

<main id="contenido">
<section class="hero" aria-labelledby="titular">${CANCHA}<div class="wrap">
<p class="dato">Verano ${esc(w.temporada || "")}${inicio ? `, desde el ${esc(inicio)},` : ""} en ${sedes.map(([, s]) => s.nombre).map((n, i, a) => (i === a.length - 1 && a.length > 1 ? "y " + n : n)).join(sedes.length > 2 ? ", " : " ").replace(", y ", " y ")}</p>
<h1 id="titular">${texto(w.titulo || "Tu hijo juega. Nosotros lo formamos.")}</h1>
<p>${texto(w.subtitulo || `Entrenamientos 3 veces por semana para niños y niñas de ${min} a ${max} años, con profesores con experiencia. Ven a una clase de prueba gratis y decide después.`)}</p>
<div class="acciones"><a class="btn wa" href="${wa(`Hola, quiero una clase de prueba gratis`)}">${ICONO_WA}Pedir clase de prueba gratis</a><a class="btn claro" href="#sedes">Ver sedes y horarios</a></div>
</div></section>

<div class="wrap oferta"><div class="ticket" role="region" aria-label="Precio del verano">
<div class="precio"><b><small>S/</small>${cfg.precioVerano}</b><span>${cfg.clasesVerano} clases de verano</span><span style="color:#b9bdb6;font-size:.95rem">Enero y febrero, 3 veces por semana</span></div>
<div class="detalle"><ul>
<li><span class="check"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5 9.5-10"/></svg></span><span>Primera clase de prueba <b>gratis</b>, sin compromiso</span></li>
<li><span class="check"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5 9.5-10"/></svg></span><span>${preventaVigente ? `Uniforme completo a <b>S/ ${cfg.uniformePreventa}</b> <span class="tachado">S/ ${cfg.uniforme}</span> si te inscribes hasta el ${esc(finPre)}` : `Uniforme completo (camiseta, short y medias): S/ ${cfg.uniforme}`}</span></li>
<li><span class="check"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5 9.5-10"/></svg></span><span>Pago por Yape o Plin a la cuenta de la escuela${cfg.pago?.titular ? ` (a nombre de ${esc(cfg.pago.titular)})` : ""}, o en efectivo en la cancha</span></li>
<li><span class="check"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5 9.5-10"/></svg></span><span>Después del verano, ciclos de 12 clases a S/ ${cfg.precioCiclo}</span></li>
${cfg.referidos?.activo && cfg.referidos.beneficio ? `<li><span class="check"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5 9.5-10"/></svg></span><span>${esc(cfg.referidos.beneficio)}</span></li>` : ""}
${cfg.descuentoHermanos ? `<li><span class="check"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5 9.5-10"/></svg></span><span>${esc(cfg.descuentoHermanos)}</span></li>` : ""}
</ul></div>
</div></div>

<section class="s" id="sedes" aria-labelledby="t-sedes"><div class="wrap"><h2 id="t-sedes">Sedes y horarios</h2><p class="intro">Elige la cancha que te quede más cerca. Las tres tienen el mismo precio.</p>
<div class="sedes">${sedes.map(([id, s]) => `<article class="sede"><h3>${esc(s.nombre)}</h3><p class="lugar">${esc(s.lugar)}</p>${s.direccion ? `<p class="dir">${esc(s.direccion)}</p>` : ""}
<p class="hor">${s.horario ? `<b>${esc(s.horario)}</b>` : "Horario por confirmar: pregúntanos por WhatsApp"}</p>
<div class="acc"><a class="btn wa" href="${wa(`Hola, quiero información para la sede ${s.nombre}`)}" aria-label="Escribir por WhatsApp sobre la sede ${esc(s.nombre)}">${ICONO_WA}Escribir</a>${s.mapa ? `<a class="btn borde" href="${esc(s.mapa)}" target="_blank" rel="noopener" aria-label="Cómo llegar a ${esc(s.nombre)} (se abre en Google Maps)">Cómo llegar</a>` : ""}</div></article>`).join("")}</div>
</div></section>

<section class="s" id="prueba" aria-labelledby="t-prueba"><div class="wrap"><h2 id="t-prueba">Así funciona la clase de prueba gratis</h2><p class="intro">Es una clase normal, con el grupo de su edad. Tú miras desde afuera y decides después.</p>
<ol class="pasos">
<li><div><b>Escríbenos por WhatsApp</b><p>Nos dices la edad y la sede, y elegimos el ${esc(dia)} que te acomode. Te confirmamos en el momento.</p></div></li>
<li><div><b>Ven a la cancha</b><p>Que venga con ${esc(cfg.clasePrueba.queTraer)}. Te recordamos el día anterior.</p></div></li>
<li><div><b>Si le gusta, se inscribe</b><p>${esc(cfg.nombreHumano)} te da los datos de pago por el mismo chat y le reservamos el cupo.</p></div></li>
</ol></div></section>

<section class="s" id="edades" aria-labelledby="t-edades"><div class="wrap"><h2 id="t-edades">Grupos por edad</h2><p class="intro">Cada grupo entrena con ejercicios y un profesor para su edad.</p>
<div class="edades">${edades.map((e) => `<div class="edad"><b>${esc(e.titulo)}</b><span>${esc(e.desc)}</span></div>`).join("")}</div>
</div></section>

${preguntas.length ? `<section class="s" id="preguntas" aria-labelledby="t-preg"><div class="wrap"><h2 id="t-preg">Preguntas frecuentes</h2><p class="intro">Si tu duda no está aquí, escríbenos y te respondemos por WhatsApp.</p>
<div class="faq">${preguntas.map((p) => `<details><summary>${esc(p.titulo)}</summary><div class="r">${texto(llenar(p.respuesta, vars))}</div></details>`).join("")}</div>
</div></section>` : ""}

<section class="cierre" aria-labelledby="t-cierre"><div class="wrap"><h2 id="t-cierre">Reserva su clase de prueba</h2><p>Los cupos por sede son limitados${inicio ? ` y el verano empieza el ${esc(inicio)}` : ""}. Escríbenos y en un minuto tienes día y hora.</p>
<a class="btn wa" href="${wa("Hola, quiero una clase de prueba gratis")}">${ICONO_WA}Escribir por WhatsApp</a></div></section>

</main>
<footer><div class="wrap"><span>${esc(cfg.escuela)}</span>${w.facebook ? `<a href="${esc(w.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ""}${w.instagram ? `<a href="${esc(w.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ""}<span>Lima Norte, Perú</span></div></footer>
<div class="fijo" role="complementary" aria-label="Acceso rápido"><a class="btn wa" href="${wa("Hola, quiero una clase de prueba gratis")}">${ICONO_WA}Pedir clase de prueba gratis</a></div>
</body></html>`;
}

const ICONO_WA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 11.7a8.4 8.4 0 0 1-12.4 7.4L3.6 20.4l1.4-4.1a8.4 8.4 0 1 1 15.4-4.6z"/><path d="M9 8.8c.3 2.6 2.1 4.6 4.8 5.6l1.3-1.4 1.6.8-.4 1.7c-3.6.5-7.6-3.3-7.5-7.2l1.6-.4.8 1.6z"/></svg>`;
