// Panel web para Katy. Pensado para alguien con poca práctica en tecnología:
// letra grande, botones de un toque, palabras simples y "Deshacer" siempre.
// Identidad Coyote: rojo de la camiseta, escudo hexagonal, tipografía
// condensada de marcador deportivo.
// El código del navegador está en las funciones app*; se insertan en la
// página tal cual con .toString().

import { ESTADOS, VARIABLES } from "./config.js";

const FUENTES = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700&display=swap">`;

// Escudo hexagonal de la marca, dibujado
export const ESCUDO = (t = 40) => `<svg width="${t}" height="${t}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2.5 42.6 13.25v21.5L24 45.5 5.4 34.75v-21.5z" fill="#fff"/><path d="M24 6.6 39 15.3v17.4L24 41.4 9 32.7V15.3z" fill="#c8202a"/><text x="24" y="31" text-anchor="middle" font-family="'Barlow Condensed',Arial Narrow,sans-serif" font-weight="700" font-size="20" fill="#fff">C</text></svg>`;

const ESTILOS = `
/* Coyote: banda roja de camiseta arriba, fondo tiza, tarjetas blancas; una sola pieza llamativa (el marcador de Hoy) */
:root{
  --rojo:#c8202a;--rojo-osc:#a3151e;--rojo-suave:#fbe8e9;
  --carbon:#1f1b19;--gris:#5b605a;--linea:#d8dbd5;
  --tiza:#f2f3f0;--blanco:#ffffff;
  --cancha:#1e7a46;--cancha-suave:#e2f1e7;--ambar:#8f5a00;--ambar-suave:#fbf0d9;
  --wa:#1e7a46;--burbuja:#fff;--chat:#e6efe7;--sale:#d9fdd3;--salebot:#edf2eb;
  --titulo:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--texto:"Barlow",system-ui,-apple-system,"Segoe UI",sans-serif;
  color-scheme:light}
@media (prefers-color-scheme:dark){:root{
  --rojo:#e8424b;--rojo-osc:#c8202a;--rojo-suave:#3a1b1d;
  --carbon:#f1efec;--gris:#b2b6b0;--linea:#3a3d39;
  --tiza:#141614;--blanco:#1f2220;
  --cancha:#5fc48a;--cancha-suave:#15301f;--ambar:#efb54e;--ambar-suave:#33290f;--wa:#5fc48a;
  --burbuja:#262a27;--chat:#0f1f15;--sale:#1f4a32;--salebot:#2a332d;color-scheme:dark}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}[hidden]{display:none!important}
body{margin:0;background:var(--tiza);color:var(--carbon);font:400 17px/1.5 var(--texto)}
a{color:var(--rojo)}
h1,h2,h3{font-family:var(--titulo);font-weight:700;letter-spacing:.005em;line-height:1.1;text-wrap:balance;margin:0}
input,select,button,textarea{font:inherit;color:var(--carbon);background:var(--blanco);border:1.5px solid var(--linea);border-radius:10px;padding:10px 12px;min-width:0;min-height:48px}
textarea{width:100%;min-height:112px;resize:vertical;line-height:1.45}
input:focus,select:focus,textarea:focus,button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid var(--rojo);outline-offset:2px}
button{cursor:pointer;font-weight:600}
.ico{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;font-weight:700;border-radius:10px;padding:10px 16px;min-height:48px;border:1.5px solid var(--linea);background:var(--blanco);color:var(--carbon)}
.btn.principal{background:var(--rojo);border-color:var(--rojo);color:#fff}
.btn.exito{background:#1e7a46;border-color:#1e7a46;color:#fff}
.btn.wa{background:var(--blanco);border-color:var(--wa);color:var(--wa)}
.btn.claro{background:transparent}
label{display:flex;flex-direction:column;gap:5px;font-weight:600;font-size:.95rem}
label small{font-weight:400;color:var(--gris)}
.gris{color:var(--gris)}
.banda{background:var(--rojo);color:#fff;padding-top:env(safe-area-inset-top,0px)}
@media (prefers-color-scheme:dark){.banda{background:var(--rojo-osc)}}
.banda .dentro{max-width:980px;margin:0 auto;padding:12px max(16px,env(safe-area-inset-right,0px)) 12px max(16px,env(safe-area-inset-left,0px));display:flex;align-items:center;gap:12px}
.banda .marca{font-family:var(--titulo);font-weight:700;font-size:1.55rem;letter-spacing:.01em;line-height:1}
.banda .marca small{display:block;font-family:var(--texto);font-weight:500;font-size:.8rem;opacity:.9;letter-spacing:0}
.banda a,.banda button{color:#fff;background:transparent;text-decoration:none;font-weight:600;border:1.5px solid rgba(255,255,255,.6);border-radius:10px;padding:8px 14px;min-height:44px;display:inline-flex;align-items:center}
.banda .der{margin-left:auto;display:flex;gap:8px}
.banda button[aria-current=page]{background:#fff;color:var(--rojo-osc)}
`;

export function entrarHTML(error, modo = "admin") {
  const personal = modo === "personal";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Entrar al Panel Coyote</title>${FUENTES}<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#c8202a">
<style>${ESTILOS}
.portada{background:var(--rojo);color:#fff;padding:calc(env(safe-area-inset-top,0px) + 40px) 20px 56px;text-align:center}
.portada h1{font-size:2.6rem;margin-top:12px}.portada p{margin:6px 0 0;opacity:.92}
main{max-width:420px;margin:-32px auto 0;padding:0 16px 40px}
.caja{background:var(--blanco);border:1.5px solid var(--linea);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px;box-shadow:0 10px 30px rgba(31,27,25,.08)}
.err{background:var(--rojo-suave);border-radius:10px;padding:12px;margin:0;font-weight:600}
.ver{display:flex;gap:8px}.ver input{flex:1}
.filtros{display:flex;gap:8px}.filtros button{flex:1;border-radius:99px;min-height:46px;font-size:.95rem;padding:6px 10px}
.filtros button[aria-pressed=true]{background:var(--carbon);color:var(--tiza);border-color:var(--carbon)}
</style></head><body>
<div class="portada">${ESCUDO(84)}<h1>Panel Coyote</h1><p>Consultas del bot de WhatsApp</p></div>
<main><form class="caja" method="post" action="/entrar">
<div class="filtros" role="group" aria-label="Quién entra"><button type="button" id="tabAdmin" aria-pressed="${!personal}">Administradora</button><button type="button" id="tabPersonal" aria-pressed="${personal}">Profesor o personal</button></div>
<p style="margin:0" id="ayudaEntrar">${personal ? "Escribe tu nombre tal como te registró Katy y tu PIN." : "Escribe la clave del panel. Este dispositivo la recordará por 3 meses."}</p>
${error ? `<p class="err" role="alert">${error}</p>` : ""}
<label for="nombre" id="lNombre" ${personal ? "" : "hidden"}>Tu nombre<input id="nombre" name="nombre" autocomplete="username" ${personal ? "autofocus" : ""}></label>
<label for="clave" id="lClave">${personal ? "PIN" : "Clave"}<span class="ver"><input id="clave" name="clave" type="password" autocomplete="current-password" required ${personal ? 'inputmode="numeric"' : "autofocus"}>
<button type="button" class="btn" onclick="var c=document.getElementById('clave');c.type=c.type==='password'?'text':'password';this.textContent=c.type==='password'?'Ver':'Ocultar'">Ver</button></span></label>
<button class="btn principal" style="font-size:1.1rem">Entrar</button>
<p class="gris" style="margin:0" id="pieEntrar">${personal ? "¿No tienes acceso? Pídele a Katy que te agregue en Ajustes → Personal." : "¿Olvidaste la clave? Pídesela a quien instaló el bot."}</p>
</form></main>
<script>
(function(){var a=document.getElementById('tabAdmin'),p=document.getElementById('tabPersonal'),n=document.getElementById('lNombre'),c=document.getElementById('lClave'),h=document.getElementById('ayudaEntrar'),f=document.getElementById('pieEntrar');
function modo(per){n.hidden=!per;document.getElementById('nombre').required=per;if(!per)document.getElementById('nombre').value='';c.firstChild.textContent=per?'PIN':'Clave';h.textContent=per?'Escribe tu nombre tal como te registró Katy y tu PIN.':'Escribe la clave del panel. Este dispositivo la recordará por 3 meses.';f.textContent=per?'¿No tienes acceso? Pídele a Katy que te agregue en Ajustes → Personal.':'¿Olvidaste la clave? Pídesela a quien instaló el bot.';[a,p].forEach(function(b,i){var on=(i===1)===per;b.setAttribute('aria-pressed',on)});(per?document.getElementById('nombre'):document.getElementById('clave')).focus();try{localStorage.setItem('coyote_modo',per?'personal':'admin')}catch(e){}}
a.onclick=function(){modo(false)};p.onclick=function(){modo(true)};try{if(!${personal ? "true" : "false"}&&localStorage.getItem('coyote_modo')==='personal')modo(true)}catch(e){}})();
</script></body></html>`;
}

const escS = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function panelHTML(cfg, sesion = { rol: "admin" }) {
  const personal = sesion.rol === "personal";
  const vende = sesion.rol === "admin" || sesion.cargo === "Administrativo de sede";
  const datos = { estados: ESTADOS, variables: VARIABLES, escudo: ESCUDO(44), sesion: { rol: sesion.rol, nombre: sesion.nombre || null, sede: sesion.sede || null, cargo: sesion.cargo || null, vende } };
  const seguro = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Panel Coyote</title>${FUENTES}<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#c8202a">
<style>${ESTILOS}
.wrap{max-width:980px;margin:0 auto;padding:20px max(16px,env(safe-area-inset-right,0px)) 120px max(16px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:24px}
nav{position:fixed;left:0;right:0;bottom:0;background:var(--blanco);border-top:1.5px solid var(--linea);display:grid;grid-template-columns:repeat(5,1fr);}
nav.personal{grid-template-columns:repeat(3,1fr)}nav.personal.sin-caja{grid-template-columns:repeat(2,1fr)}
nav{padding-bottom:env(safe-area-inset-bottom,0px);z-index:20}
nav button{border:0;border-radius:0;background:none;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:.8rem;font-weight:600;padding:8px 2px;min-height:64px;color:var(--gris)}
nav button .ico{width:24px;height:24px}
nav button[aria-current=page]{color:var(--rojo);box-shadow:inset 0 3px 0 var(--rojo)}
@media (min-width:900px){nav{position:static;max-width:980px;margin:16px auto 0;border:1.5px solid var(--linea);border-radius:14px;overflow:hidden}nav button{flex-direction:row;justify-content:center;gap:8px;font-size:.95rem;min-height:52px}.wrap{padding-bottom:40px}}
#vista{display:flex;flex-direction:column;gap:24px}
.titulo-vista h2{font-size:2rem}.titulo-vista p{margin:4px 0 0;color:var(--gris)}
section.bloque{display:flex;flex-direction:column;gap:12px}
.bloque>header h2{font-size:1.45rem}.bloque>header p{margin:2px 0 0;color:var(--gris)}
.marcador{display:grid;grid-template-columns:repeat(3,1fr);background:var(--carbon);color:var(--tiza);border-radius:16px;overflow:hidden}
.marcador a{color:inherit;text-decoration:none;padding:14px 10px 12px;text-align:center;border-left:1px solid rgba(255,255,255,.12)}
.marcador a:first-child{border-left:0}
.marcador b{display:block;font-family:var(--titulo);font-size:2.9rem;line-height:1;font-variant-numeric:tabular-nums}
.marcador a.alerta b{color:#ff8a8f}
.marcador span{font-size:.88rem;font-weight:500;opacity:.85}
@media (prefers-color-scheme:dark){.marcador{background:#000;color:#f1efec}}
.aviso{border-radius:14px;padding:14px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;background:var(--ambar-suave)}
.persona{background:var(--blanco);border:1.5px solid var(--linea);border-left:6px solid var(--linea);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:12px}
.persona[data-e=quiere_inscribirse]{border-left-color:var(--rojo)}.persona[data-e=agendada],.persona[data-e=asistio]{border-left-color:var(--ambar)}.persona[data-e=inscrito]{border-left-color:var(--cancha)}
.persona .nom{font-family:var(--titulo);font-size:1.45rem;font-weight:700;line-height:1.1}
.persona .det{color:var(--gris)}
.persona .info{display:flex;flex-direction:column;gap:4px}
.dato{display:flex;align-items:center;gap:6px;font-weight:600}.dato .ico{width:18px;height:18px}
.dato.ok{color:var(--cancha)}.dato.alerta{color:var(--rojo)}
.acc{display:flex;flex-wrap:wrap;gap:8px}.acc .btn{flex:1 1 150px}
.chip{display:inline-block;font-size:.85rem;font-weight:700;border-radius:99px;padding:2px 10px;background:var(--linea);width:max-content}
.chip.inscrito{background:var(--cancha-suave);color:var(--cancha)}.chip.quiere_inscribirse{background:var(--rojo-suave);color:var(--rojo)}.chip.agendada,.chip.asistio{background:var(--ambar-suave);color:var(--ambar)}
.vacio{background:transparent;border:1.5px dashed var(--linea);border-radius:14px;padding:16px;color:var(--gris);margin:0}
.pago{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;background:var(--cancha-suave);border-radius:12px;padding:12px}
.filtros{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.filtros button{white-space:nowrap;border-radius:99px;min-height:44px;flex:none}
.filtros button[aria-pressed=true]{background:var(--carbon);color:var(--tiza);border-color:var(--carbon)}
.cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.cifra{background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;padding:12px 14px}
.cifra b{display:block;font-family:var(--titulo);font-size:2rem;line-height:1.1;font-variant-numeric:tabular-nums}.cifra span{color:var(--gris);font-size:.92rem}
.scroll{overflow-x:auto;background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{padding:11px 12px;border-bottom:1px solid var(--linea);text-align:left;white-space:nowrap}th{font-size:.88rem;color:var(--gris);font-weight:600}td.n,th.n{text-align:right}tr:last-child td{border-bottom:0}
.tarjeta{background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:14px}
.tarjeta h3{font-size:1.35rem}.tarjeta p{margin:0}
.f2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.switch{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:14px;font-weight:600;font-size:1rem}
.switch input{appearance:none;width:62px;height:36px;min-height:36px;border-radius:99px;background:var(--linea);position:relative;border:0;padding:0;flex:none;cursor:pointer}
.switch input::after{content:"";position:absolute;top:4px;left:4px;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .15s}
.switch input:checked{background:#1e7a46}.switch input:checked::after{left:30px}
details.mas{background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;padding:4px 16px}
details.mas>summary{cursor:pointer;font-weight:700;min-height:52px;display:flex;align-items:center}
details.mas[open]{padding-bottom:16px}
.sede{border-top:1px solid var(--linea);padding-top:12px;display:flex;flex-direction:column;gap:10px}
.edad{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;border-top:1px solid var(--linea);padding-top:12px}.edad .ancho{grid-column:1/-1}
.vars{display:flex;flex-wrap:wrap;gap:6px;margin-top:-6px}.vars button{min-height:36px;padding:4px 12px;font-size:.88rem;font-weight:600;border-radius:99px}
.cnt{font-weight:400;color:var(--gris)}.cnt.mal{color:var(--rojo);font-weight:700}
.preview{background:var(--chat);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;max-height:640px;overflow:auto}
.bub{background:var(--burbuja);border-radius:10px;padding:8px 10px;white-space:pre-wrap;font-size:.94rem;max-width:92%;box-shadow:0 1px 0 rgba(0,0,0,.06)}.bub.yo{align-self:flex-end;background:#d9fdd3;color:#1f1b19}
.btns{display:flex;flex-direction:column;gap:4px;margin-top:6px}.btns span{text-align:center;border-top:1px solid var(--linea);padding-top:5px;color:#1f8fff;font-weight:600;font-size:.9rem}
.barra{position:sticky;bottom:calc(66px + env(safe-area-inset-bottom,0px));background:var(--tiza);padding:12px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center;border-top:1.5px solid var(--linea);z-index:5}
@media (min-width:900px){.barra{bottom:0}}
.errs{color:var(--rojo);margin:0;padding-left:20px;font-weight:600}
.pasos{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:12px}
.progreso{height:10px;border-radius:99px;background:var(--linea);overflow:hidden}.progreso i{display:block;height:100%;background:#1e7a46;width:0}
.ejemplo{background:var(--chat);border-radius:12px;padding:12px;font-size:.95rem}
nav button{position:relative}
.insignia{position:absolute;top:5px;left:calc(50% + 4px);min-width:22px;height:22px;border-radius:99px;background:var(--rojo);color:#fff;font-size:.78rem;font-weight:700;display:grid;place-items:center;padding:0 6px;box-shadow:0 0 0 2px var(--blanco)}
@media (min-width:900px){.insignia{position:static;box-shadow:none}}
.chats{display:flex;flex-direction:column;background:var(--blanco);border:1.5px solid var(--linea);border-radius:14px;overflow:hidden}
.fila-chat{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px;border:0;border-bottom:1px solid var(--linea);border-radius:0;background:none;text-align:left;min-height:76px;width:100%;font-weight:400}
.fila-chat:last-child{border-bottom:0}
.fila-chat:hover{background:var(--tiza)}
.avatar{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-family:var(--titulo);font-weight:700;font-size:1.25rem;background:var(--rojo-suave);color:var(--rojo)}
.avatar.tu{background:var(--cancha-suave);color:var(--cancha)}.avatar.bot{background:var(--tiza);color:var(--gris)}
.fila-chat .quien{font-weight:700;font-size:1.06rem;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fila-chat .ult{color:var(--gris);font-size:.95rem;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fila-chat.espera .ult{color:var(--carbon);font-weight:600}
.fila-chat .lado{display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-size:.82rem;color:var(--gris);font-weight:500}
.fila-chat.espera .lado{color:var(--rojo);font-weight:700}
.cuenta{min-width:24px;height:24px;border-radius:99px;background:var(--rojo);color:#fff;font-weight:700;font-size:.85rem;display:grid;place-items:center;padding:0 7px}
.tag{font-size:.75rem;font-weight:700;border-radius:99px;padding:1px 8px;white-space:nowrap}
.tag.tu{color:var(--cancha);background:var(--cancha-suave)}
.en-chat .wrap{padding-top:12px;gap:12px;padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}
.chat{display:flex;flex-direction:column;background:var(--blanco);border:1.5px solid var(--linea);border-radius:16px;overflow:hidden;height:calc(100dvh - 166px - env(safe-area-inset-bottom,0px) - env(safe-area-inset-top,0px));min-height:440px}
@media (min-width:900px){.en-chat .wrap{padding-bottom:24px}.chat{height:calc(100dvh - 190px)}}
.chat-cab{display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1.5px solid var(--linea)}
.chat-cab .volver{flex:none;min-height:44px;padding:6px 8px 6px 2px;border:0;background:none;color:var(--rojo);display:inline-flex;align-items:center;gap:2px}
.chat-cab .persona-cab{flex:1;min-width:0}
.chat-cab .quien{font-family:var(--titulo);font-size:1.4rem;font-weight:700;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-cab .det{color:var(--gris);font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-cab .ficha{flex:none;min-height:44px;padding:6px 12px;font-size:.92rem}
.modo{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:8px 10px 8px 12px;font-size:.9rem;line-height:1.35;border-bottom:1px solid var(--linea)}
.modo.bot{background:var(--ambar-suave)}.modo.humano{background:var(--cancha-suave)}
.modo .btn{min-height:40px;padding:6px 12px;font-size:.92rem}
.hilo{flex:1;overflow-y:auto;background:var(--chat);padding:12px 10px 16px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
.msg{max-width:min(84%,560px);padding:7px 10px 5px;border-radius:12px;background:var(--burbuja);box-shadow:0 1px 0 rgba(0,0,0,.08);white-space:pre-wrap;overflow-wrap:anywhere;font-size:.98rem;align-self:flex-start}
.msg.sale{align-self:flex-end;background:var(--sale)}
.msg.bot{background:var(--salebot)}
.msg .autor{display:block;font-size:.76rem;font-weight:700;color:var(--cancha);margin-bottom:1px}
.msg.bot .autor{color:var(--gris)}
.msg .hora{display:block;text-align:right;font-size:.72rem;color:var(--gris);margin-top:1px}
.msg .btns span{color:var(--gris)}
.msg .auto{font-style:italic;color:var(--gris)}
.msg img,.msg video{max-width:min(260px,100%);border-radius:8px;display:block}
.msg img.sticker{width:120px;background:none}
.msg audio{width:250px;max-width:100%;display:block}
.msg.reac{background:none;box-shadow:none;font-size:1.4rem;padding:0 4px}
.dia{align-self:center;background:var(--blanco);color:var(--gris);font-size:.8rem;font-weight:600;border-radius:8px;padding:3px 10px;margin:6px 0}
.escribir{border-top:1.5px solid var(--linea);padding:8px 10px 10px;display:flex;flex-direction:column;gap:8px;background:var(--blanco)}
.rapidas{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.rapidas button{white-space:nowrap;min-height:38px;padding:4px 12px;border-radius:99px;font-size:.9rem}
.caja-env{display:flex;gap:8px;align-items:flex-end}.caja-env textarea{min-height:52px;max-height:150px;flex:1;resize:none}
.caja-env .btn{min-width:56px;min-height:52px;padding:10px 12px}
.caja-env .btn.grabando{background:var(--rojo);color:#fff;border-color:var(--rojo);flex:1;font-size:.92rem;touch-action:none}
.caja-env .btn[disabled]{opacity:.45}
.ventana{font-size:.84rem;color:var(--gris);margin:0}
.cerrada{background:var(--ambar-suave);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px}
.cerrada p{margin:0}
.ficha-box{border-bottom:1.5px solid var(--linea);padding:10px;max-height:45%;overflow:auto;background:var(--tiza)}
.lista-ed{display:flex;flex-direction:column;gap:12px}
.item-ed{border-top:1px solid var(--linea);padding-top:12px;display:flex;flex-direction:column;gap:10px}
dialog.escaner{border:0;border-radius:18px;padding:0;width:min(100%,480px);background:var(--blanco);color:var(--carbon)}
dialog.escaner::backdrop{background:rgba(0,0,0,.6)}
.esc-cab{display:flex;align-items:center;justify-content:space-between;padding:10px 10px 10px 16px;border-bottom:1.5px solid var(--linea)}.esc-cab b{font-family:var(--titulo);font-size:1.3rem}
.esc-video{position:relative;background:#000;aspect-ratio:1/1;max-height:60vh}.esc-video video{width:100%;height:100%;object-fit:cover;display:block}
.esc-marco{position:absolute;inset:14%;border:3px solid rgba(255,255,255,.85);border-radius:16px;box-shadow:0 0 0 999px rgba(0,0,0,.25)}
.esc-res{padding:12px 16px;min-height:72px}
.esc-ok{display:flex;gap:12px;align-items:center;background:var(--cancha-suave);color:var(--cancha);border-radius:12px;padding:12px}
.esc-ok .ico{width:34px;height:34px}.esc-ok b{display:block;font-family:var(--titulo);font-size:1.5rem;line-height:1.05;color:var(--carbon)}.esc-ok span{display:block;color:var(--carbon);font-size:.95rem}
.esc-ok.rep{background:var(--ambar-suave);color:var(--ambar)}.esc-ok.alerta{background:var(--rojo-suave);color:var(--rojo)}
.esc-manual{display:flex;gap:8px;align-items:flex-end;padding:0 16px 16px}.esc-manual label{flex:1}
#toast[hidden]{display:none}
#toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(80px + env(safe-area-inset-bottom,0px));background:var(--carbon);color:var(--tiza);border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center;z-index:30;width:max-content;max-width:calc(100% - 24px);box-shadow:0 8px 24px rgba(0,0,0,.25);font-weight:500}
#toast button{background:transparent;color:inherit;border-color:currentColor;min-height:40px}
@media (min-width:900px){#toast{bottom:24px}}
@media (max-width:560px){.f2{grid-template-columns:minmax(0,1fr)}.titulo-vista h2{font-size:1.75rem}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style></head><body>
<div class="banda"><div class="dentro">${ESCUDO(44)}<div class="marca">Coyote<small>${personal ? `${escS(sesion.nombre)} · ${escS(cfg.sedes[sesion.sede]?.nombre || "todas las sedes")}` : "Escuela de fútbol"}</small></div><div class="der"><button type="button" data-v="ayuda">Ayuda</button><form method="post" action="/salir" style="margin:0"><button type="submit">Salir</button></form></div></div></div>
<nav aria-label="Secciones"${personal ? ` class="personal${vende ? "" : " sin-caja"}"` : ""}>
<button data-v="hoy" aria-current="page" data-i="casa">Hoy</button>
${personal ? "" : '<button data-v="chats" data-i="chat">Chats</button>'}
<button data-v="todos" data-i="gente">Personas</button>
${personal ? (vende ? '<button data-v="caja" data-i="barras">Caja</button>' : "") : '<button data-v="numeros" data-i="barras">Números</button>'}
${personal ? "" : '<button data-v="ajustes" data-i="ajustes">Ajustes</button>'}
</nav>
<div class="wrap"><main id="vista"><p class="gris">Cargando…</p></main></div>
<div id="toast" hidden role="status"></div>
<script>/* el empaquetador de Cloudflare agrega __name() al código; en el navegador no hace nada */
var __name=function(f){return f};
window.DATOS=${seguro(datos)};
(${appBase.toString()})();
(${appPersonas.toString()})();
${personal ? "" : `(${appChats.toString()})();`}
(${appNumeros.toString()})();
${personal ? "" : `(${appAjustes.toString()})();`}
(${appAyuda.toString()})();
window.iniciar();
</script></body></html>`;
}

// ===================== Código del navegador =====================

function appBase() {
  const A = (window.APP = { leads: [], gastos: [], cfg: null, cambios: { n: 0 }, vista: "hoy", sinGuardar: false });
  window.$ = (s) => document.querySelector(s);
  window.el = (t, attrs, txt) => { const x = document.createElement(t); Object.assign(x, attrs || {}); if (txt != null) x.textContent = txt; return x; };
  window.esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const P = {
    casa: '<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
    gente: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.6 5.2"/>',
    barras: '<path d="M5 20v-8M11 20V5M17 20v-5M3 20.5h18"/>',
    ajustes: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"/>',
    ayuda: '<circle cx="12" cy="12" r="9.2"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.7M12 17.2v.3"/>',
    wa: '<path d="M20.4 11.7a8.4 8.4 0 0 1-12.4 7.4L3.6 20.4l1.4-4.1a8.4 8.4 0 1 1 15.4-4.6z"/><path d="M9 8.8c.3 2.6 2.1 4.6 4.8 5.6l1.3-1.4 1.6.8-.4 1.7c-3.6.5-7.6-3.3-7.5-7.2l1.6-.4.8 1.6z"/>',
    ok: '<path d="m4.5 12.5 4.5 4.5 10.5-10.5"/>',
    no: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    nota: '<path d="M5 4h14v16H5z"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/>',
    chat: '<path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    enviar: '<path d="M4 12 20 4l-4.5 16-3.5-6.5z"/><path d="m12 13.5 8-9.5"/>',
    atras: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
    camara: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/>',
    mano: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7.5-6.5 7.5S5 17.5 5 14v-2a1.5 1.5 0 0 1 3 0"/>',
  };
  window.ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;
  document.querySelectorAll("nav button").forEach((b) => b.insertAdjacentHTML("afterbegin", window.ico(b.dataset.i)));
  window.boton = (txt, clase, icono) => { const b = el("button", { type: "button", className: "btn " + (clase || "") }); b.innerHTML = (icono ? ico(icono) : "") + esc(txt); return b; };
  // Sin señal en la cancha: las marcas de asistencia se guardan y se envían cuando vuelve internet
  const PEND = "coyote_pendientes";
  const leerPend = () => { try { return JSON.parse(localStorage.getItem(PEND) || "[]"); } catch { return []; } };
  const guardarPend = (l) => { try { localStorage.setItem(PEND, JSON.stringify(l)); } catch {} };
  window.encolar = (m, u, b) => { const l = leerPend(); l.push({ m, u, b, t: Date.now() }); guardarPend(l); window.pintarPendientes(); };
  window.pintarPendientes = () => { const n = leerPend().length; let p = document.getElementById("pendientes"); if (!n) { if (p) p.remove(); return; } if (!p) { p = el("div", { id: "pendientes", className: "aviso", role: "status" }); document.querySelector(".wrap").prepend(p); } p.textContent = `${n} ${n === 1 ? "marca guardada" : "marcas guardadas"} sin señal. Se enviarán solas cuando vuelva internet.`; };
  window.enviarPendientes = async () => {
    let l = leerPend(); if (!l.length || !navigator.onLine) return;
    const quedan = [];
    for (const x of l) { try { await fetch(x.u, { method: x.m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(x.b) }); } catch { quedan.push(x); } }
    guardarPend(quedan); window.pintarPendientes(); if (quedan.length < l.length) avisoRapido("Se enviaron las marcas guardadas");
  };
  window.addEventListener("online", () => window.enviarPendientes());
  setInterval(() => window.enviarPendientes(), 30000);
  window.api = async (m, u, b) => {
    const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    if (r.status === 401) { location.href = "/entrar"; throw new Error("Tu sesión terminó"); }
    const tipo = r.headers.get("Content-Type") || "";
    const cuerpo = r.status === 204 ? null : tipo.includes("json") ? await r.json() : await r.text();
    if (!r.ok) { const e = new Error((cuerpo && cuerpo.error) || "No se pudo completar. Revisa tu conexión a internet."); e.datos = cuerpo; throw e; }
    return cuerpo;
  };
  window.limaHoy = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
  window.limaISO = (t) => new Date(Date.parse(t) - 5 * 3600e3).toISOString().slice(0, 10);
  window.sumarDias = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  window.fechaBonita = (iso) => { const d = new Date(iso + "T12:00:00Z"); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`; };
  window.mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  window.cuandoClase = (iso) => { const h = limaHoy(); if (iso === h) return "hoy"; if (iso === sumarDias(h, 1)) return "mañana"; if (iso < h) return "fue el " + fechaBonita(iso); return "el " + fechaBonita(iso); };
  window.soles = (n) => "S/ " + Math.round(n).toLocaleString("es-PE");
  window.sedeNombre = (id) => (A.cfg && A.cfg.sedes[id] ? A.cfg.sedes[id].nombre : id || "sin sede");

  let tt = null;
  window.avisoRapido = (texto, deshacer) => {
    const t = $("#toast"); t.innerHTML = ""; t.append(el("span", {}, texto));
    if (deshacer) { const b = el("button", { type: "button", className: "btn" }, "Deshacer"); b.onclick = async () => { t.hidden = true; await deshacer(); }; t.append(b); }
    t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 9000);
  };
  window.cambiar = async (lead, cambios, mensaje) => {
    const antes = {}; for (const k of Object.keys(cambios)) antes[k] = lead[k] ?? (k === "archivado" ? 0 : null);
    try {
      await api("PATCH", "/api/leads/" + lead.id, cambios);
      await window.recargar();
      avisoRapido(mensaje || "Guardado", async () => { await api("PATCH", "/api/leads/" + lead.id, antes); await window.recargar(); avisoRapido("Se deshizo el cambio"); });
    } catch (e) { avisoRapido("No se guardó. " + e.message); }
  };
  window.recargar = async () => {
    const esPersonal = window.DATOS.sesion.rol === "personal";
    const [leads, gastos] = await Promise.all([api("GET", "/api/leads"), esPersonal ? Promise.resolve([]) : api("GET", "/api/gastos")]);
    A.leads = leads; A.gastos = gastos; window.pintar();
  };
  const VISTAS = {};
  window.registrarVista = (nombre, fn) => (VISTAS[nombre] = fn);
  window.pintar = () => {
    if (!VISTAS[A.vista]) return;
    if (A.vista === "ajustes" && A.sinGuardar) return;
    if (A.vista === "chats" && A.chatAbierto) return window.refrescarChat && window.refrescarChat(); // no borrar lo que está escribiendo
    VISTAS[A.vista]();
  };
  const BOTONES_NAV = "nav button, .banda button[data-v]";
  window.irA = (v) => { const b = document.querySelector(`nav button[data-v="${v}"], .banda button[data-v="${v}"]`); if (b) b.click(); };
  document.querySelectorAll(BOTONES_NAV).forEach((b) => (b.onclick = () => {
    if (A.vista === "ajustes" && A.sinGuardar && b.dataset.v !== "ajustes" && !b.dataset.confirmar) {
      b.dataset.confirmar = "1"; avisoRapido("Tienes cambios sin guardar en Ajustes. Toca otra vez para salir sin guardarlos."); return;
    }
    document.querySelectorAll(BOTONES_NAV).forEach((x) => { x.removeAttribute("aria-current"); delete x.dataset.confirmar; });
    b.setAttribute("aria-current", "page");
    if (A.vista !== b.dataset.v || b.dataset.v === "chats") A.chatAbierto = null; // tocar «Chats» vuelve a la lista
    if (location.hash) history.replaceState(null, "", location.pathname);
    document.body.classList.remove("en-chat");
    A.vista = b.dataset.v; A.sinGuardar = false; VISTAS[A.vista](); window.scrollTo(0, 0);
  }));
  window.iniciar = async () => {
    try {
      const [c] = await Promise.all([api("GET", "/api/config"), window.recargar().catch(() => {})]);
      A.cfg = c.config; A.cambios = c.cambios;
      if (!(window.abrirDesdeEnlace && window.abrirDesdeEnlace())) window.pintar();
    } catch (e) { $("#vista").innerHTML = `<p class="vacio">No se pudo cargar el panel: ${esc(e.message)}. Revisa tu conexión y vuelve a abrirlo.</p>`; }
    setInterval(() => { if (!document.hidden) window.recargar().catch(() => {}); }, 60000);
  };
}

function appPersonas() {
  const A = window.APP;
  const E = window.DATOS.estados;

  function enlaceWA(l) {
    const nombre = (l.padre || l.perfil || "").split(" ")[0];
    return "https://wa.me/" + l.wa_id + "?text=" + encodeURIComponent(`Hola${nombre ? " " + nombre : ""}, te escribe ${A.cfg.nombreHumano} de la Escuela Coyote. `);
  }

  window.tarjeta = (l, modo) => {
    const c = el("article", { className: "persona" }); c.dataset.e = l.estado;
    const info = el("div", { className: "info" });
    info.append(el("div", { className: "nom" }, l.padre || l.perfil || "Sin nombre"));
    info.append(el("div", { className: "det" }, [l.edad, sedeNombre(l.sede), l.origen === "Anuncio" ? "llegó por un anuncio" : null].filter(Boolean).join(", ")));
    const dato = (icono, txt, clase) => { const d = el("div", { className: "dato " + (clase || "") }); d.innerHTML = ico(icono) + esc(txt); info.append(d); };
    if (l.clase_fecha && ["agendada", "asistio"].includes(l.estado)) dato("cal", "Clase de prueba " + cuandoClase(l.clase_fecha), "");
    if (l.estado === "agendada" && l.confirmado) dato("ok", "Confirmó que viene", "ok");
    if (l.comprobante) dato("nota", "Envió comprobante de pago: revísalo en su chat", "alerta");
    if (l.estado === "inscrito" && !l.uniforme_entregado) dato("nota", "Uniforme por entregar", "");
    if (l.uniforme_entregado) dato("ok", `Uniforme talla ${l.uniforme_talla} entregado`, "ok");
    if (l.referido_por) { const r = A.leads.find((x) => x.id === l.referido_por); if (r) dato("gente", `Recomendado por ${r.padre || r.perfil || "otra familia"}`, ""); }
    if (l.saldo > 0) dato("nota", `Debe S/ ${l.saldo}${l.cuota_vence ? (l.cuota_vence < limaHoy() ? `, venció el ${fechaBonita(l.cuota_vence)}` : `, paga hasta el ${fechaBonita(l.cuota_vence)}`) : ""}`, "alerta");
    if (l.estado === "inscrito" && l.clases_pagadas) { const q = Math.max(0, l.clases_pagadas - (l.clases_usadas || 0)); dato("ok", `Pagó ${l.clases_pagadas} clases: ${q === 0 ? "ya las usó todas" : q === 1 ? "le queda 1" : `le quedan ${q}`}`, q <= 2 ? "alerta" : "ok"); }
    if (l.estado === "inscrito" && l.fin_ciclo) dato("cal", l.fin_ciclo < limaHoy() ? `Sus clases terminaron el ${fechaBonita(l.fin_ciclo)}` : `Clases pagadas hasta el ${fechaBonita(l.fin_ciclo)}`, l.fin_ciclo < limaHoy() ? "alerta" : "");
    if (l.estado === "espera") dato("mano", `En lista de espera de ${sedeNombre(l.sede)}`, "alerta");
    if (l.no_contactar) dato("no", "Pidió no recibir promociones", "alerta");
    if (l.nota) dato("nota", l.nota, "");
    if (modo === "todos") info.append(el("span", { className: "chip " + l.estado }, E[l.estado] || l.estado));
    c.append(info);
    const acc = el("div", { className: "acc" });
    if (l.wa_id && modo !== "chat" && window.DATOS.sesion.rol !== "personal") {
      if (A.cfg.atencion && A.cfg.atencion.modo === "panel") { const b = boton("Escribirle", "wa", "chat"); b.onclick = () => window.irAChat(l.wa_id); acc.append(b); }
      else { const a = el("a", { className: "btn wa", href: enlaceWA(l), target: "_blank", rel: "noopener" }); a.innerHTML = ico("wa") + "Escribirle"; acc.append(a); }
    }
    const add = (txt, clase, icono, fn) => { const b = boton(txt, clase, icono); b.onclick = fn; acc.append(b); };
    if (modo === "clase") {
      add("Sí vino", "", "mano", () => cambiar(l, { estado: "asistio" }, `Anotado: ${l.padre || "la persona"} vino a la clase`));
      add("No vino", "", "no", () => cambiar(l, { estado: "perdido", nota: "No vino a la clase de prueba" }, "Anotado: no vino"));
    }
    if (l.estado !== "inscrito" && window.DATOS.sesion.vende !== false) add("Se inscribió", "exito", "ok", () => pedirPago(c, l));
    else if (l.fin_ciclo && l.fin_ciclo <= sumarDias(limaHoy(), 7)) add("Renovó", "exito", "ok", () => pedirPago(c, l));
    if (l.comprobante) add("No era comprobante", "claro", "no", () => cambiar(l, { comprobante: null }, "Listo, quitado el aviso de comprobante"));
    if (l.estado === "inscrito" && !l.uniforme_entregado) add("Entregó uniforme", "claro", "ok", () => {
      if (c.querySelector(".pago")) return;
      const p = el("div", { className: "pago" });
      const tallas = String(A.cfg.tallas || "").split(",").map((t) => t.trim()).filter(Boolean);
      const sel = el("select"); sel.innerHTML = tallas.map((t) => `<option>${esc(t)}</option>`).join(""); const lt = el("label", {}, "Talla"); lt.append(sel);
      const cobro = el("input", { type: "number", min: "0", step: "0.01", value: window.DATOS.sesion.vende !== false ? A.cfg.uniforme : 0, inputMode: "decimal" }); cobro.style.width = "120px";
      const lc = el("label", {}, "Cobró (S/)"); lc.append(cobro); lc.hidden = window.DATOS.sesion.vende === false;
      const ok = boton("Registrar entrega", "exito", "ok"); ok.onclick = async () => { try { const r = await api("POST", `/api/leads/${l.id}/uniforme`, { talla: sel.value, monto: lc.hidden ? 0 : Number(cobro.value) || 0 }); avisoRapido(`Uniforme entregado${r.quedan != null ? `. Quedan ${r.quedan} de talla ${sel.value}` : ""}`); await window.recargar(); } catch (e) { avisoRapido(e.message); } };
      const no = boton("Cancelar", "claro"); no.onclick = () => p.remove(); p.append(lt, lc, ok, no); c.append(p);
    });
    if (l.saldo > 0 && window.DATOS.sesion.vende !== false) add("Cobró la cuota", "exito", "ok", () => {
      if (c.querySelector(".pago")) return;
      const p = el("div", { className: "pago" }); const inp = el("input", { type: "number", min: "0", step: "0.01", value: l.saldo, inputMode: "decimal" }); inp.style.width = "140px";
      const lab = el("label", {}, "¿Cuánto pagó ahora? (S/)"); lab.append(inp);
      const ok = boton("Registrar", "exito", "ok"); ok.onclick = () => cambiar(l, { pago_cuota: Number(inp.value) || 0 }, "Cuota registrada en Caja");
      const no = boton("Cancelar", "claro"); no.onclick = () => p.remove(); p.append(lab, ok, no); c.append(p); inp.focus();
    });
    if (l.estado === "inscrito") add("Carnet QR", "claro", "qr", async () => {
      try { const r = await api("POST", `/api/leads/${l.id}/carnet`); window.open(r.enlace, "_blank", "noopener"); avisoRapido(r.enviado ? "Carnet enviado por WhatsApp y abierto para imprimir" : "Carnet abierto. No se pudo enviar por WhatsApp (pasaron 24 h desde su último mensaje); compártele el enlace cuando te escriba."); }
      catch (e) { avisoRapido(e.message); }
    });
    if (modo !== "clase" && !["perdido", "inscrito"].includes(l.estado)) add("No se inscribió", "", "no", () => cambiar(l, { estado: "perdido" }, "Anotado: no se inscribió"));
    c.append(acc);
    if (modo === "todos") {
      const mas = el("details"); mas.append(el("summary", { className: "gris" }, "Más opciones"));
      const box = el("div", { className: "f2" }); box.style.marginTop = "12px";
      const se = el("select", { id: "estado-" + l.id }); se.innerHTML = Object.entries(E).map(([k, v]) => `<option value="${k}"${k === l.estado ? " selected" : ""}>${v}</option>`).join("");
      const lse = el("label", {}, "Cambiar estado"); lse.append(se); se.onchange = () => cambiar(l, { estado: se.value }, "Estado cambiado");
      const no = el("input", { id: "nota-" + l.id, value: l.nota || "", placeholder: "Por ejemplo: prefiere turno tarde" });
      const lno = el("label", {}, "Nota"); lno.append(no); no.onchange = () => cambiar(l, { nota: no.value }, "Nota guardada");
      if (window.DATOS.sesion.rol === "personal") { box.append(lno); }
      else { const bor = boton("Quitar de la lista", "claro", "no"); bor.onclick = () => cambiar(l, { archivado: 1 }, `${l.padre || "La persona"} salió de la lista`); box.append(lse, lno, bor); }
      mas.append(box); c.append(mas);
    }
    return c;
  };

  function pedirPago(card, l) {
    if (card.querySelector(".pago")) return;
    const p = el("div", { className: "pago" });
    const inp = el("input", { type: "number", min: "0", value: l.monto ?? A.cfg.precioVerano, id: "pago-" + l.id, inputMode: "decimal" }); inp.style.width = "140px";
    const lab = el("label", {}, "¿Cuánto pagó? (S/)"); lab.append(inp);
    const esPersonal = window.DATOS.sesion.rol === "personal" && !A.cfg.personalPlanesLibres;
    const plan = el("select", { id: "plan-" + l.id }); plan.innerHTML = `<option value="verano">Verano (${A.cfg.clasesVerano} clases)</option><option value="ciclo">Ciclo de 12 clases</option>${esPersonal ? "" : '<option value="otro">Otro plan (a medida)</option>'}`;
    if (esPersonal) { inp.readOnly = true; inp.title = "El precio del paquete lo fija la administradora"; }
    const lplan = el("label", {}, "¿Qué pagó?"); lplan.append(plan);
    const nCl = el("input", { type: "number", min: "1", max: "200", id: "clases-" + l.id, inputMode: "numeric", placeholder: "8" }); nCl.style.width = "110px";
    const lcl = el("label", {}, "¿Cuántas clases?"); lcl.append(nCl); lcl.hidden = true;
    const aviso = el("p", { className: "gris" }); aviso.style.flexBasis = "100%"; aviso.style.margin = "0";
    const porClase = () => {
      const clases = plan.value === "verano" ? A.cfg.clasesVerano : plan.value === "ciclo" ? 12 : Number(nCl.value);
      const monto = Number(inp.value); if (!clases || !monto) { aviso.textContent = ""; return; }
      const pc = monto / clases, piso = plan.value === "otro" ? Number(A.cfg.pisoPorClase) || 0 : 0;
      aviso.textContent = `Sale a S/ ${pc.toFixed(2)} por clase${piso && pc < piso ? `, por debajo del mínimo acordado de S/ ${piso}. Puedes guardarlo igual.` : "."}`;
      aviso.style.color = piso && pc < piso ? "var(--ambar)" : "var(--gris)"; aviso.style.fontWeight = piso && pc < piso ? "600" : "400";
    };
    plan.onchange = () => { lcl.hidden = plan.value !== "otro"; if (plan.value !== "otro") inp.value = plan.value === "ciclo" ? A.cfg.precioCiclo : A.cfg.precioVerano; else nCl.focus(); porClase(); };
    inp.oninput = nCl.oninput = porClase;
    const puedeCuotas = A.cfg.cuotas && A.cfg.cuotas.permitir && !esPersonal;
    const sal = el("input", { type: "number", min: "0", step: "0.01", id: "saldo-" + l.id, inputMode: "decimal", value: "" }); sal.style.width = "120px";
    const lsal = el("label", {}, "¿Queda debiendo? (S/)"); lsal.append(sal); lsal.hidden = !puedeCuotas;
    const ven = el("input", { type: "date", id: "vence-" + l.id, value: sumarDias(limaHoy(), (A.cfg.cuotas && A.cfg.cuotas.diasPorDefecto) || 15) });
    const lven = el("label", {}, "Paga el saldo hasta"); lven.append(ven); lven.hidden = true;
    sal.oninput = () => { lven.hidden = !(Number(sal.value) > 0); };
    const ok = boton("Guardar pago", "exito", "ok"); ok.onclick = () => {
      if (plan.value === "otro" && !(Number(nCl.value) >= 1)) { avisoRapido("Escribe cuántas clases pagó"); nCl.focus(); return; }
      const saldo = Number(sal.value) || 0;
      cambiar(l, { estado: "inscrito", monto: Number(inp.value) || 0, plan: plan.value, clases: Number(nCl.value) || undefined, saldo, cuota_vence: saldo > 0 ? ven.value : undefined }, `${l.padre || "La persona"} quedó inscrita${saldo ? ` y debe S/ ${saldo}; el bot le recordará pagar` : ". El bot le recordará renovar cuando se le acaben las clases"}.`);
    };
    const no = boton("Cancelar", "claro"); no.onclick = () => p.remove();
    p.append(lplan, lcl, lab, lsal, lven, ok, no, aviso); card.append(p); inp.focus(); inp.select(); porClase();
  }

  function bloque(id, titulo, sub, items, vacio, modo) {
    const s = el("section", { className: "bloque", id });
    const h = el("header"); h.append(el("h2", {}, titulo), el("p", {}, sub)); s.append(h);
    if (!items.length) s.append(el("p", { className: "vacio" }, vacio));
    items.forEach((l) => s.append(window.tarjeta(l, modo)));
    return s;
  }

  function formAnotar() {
    const s = el("details", { className: "mas" });
    const sum = el("summary"); sum.innerHTML = ico("mas") + "&nbsp;Anotar a alguien que llamó o escribió a tu número"; s.append(sum);
    const f = el("form", { className: "f2" });
    f.innerHTML = `<label>Nombre<input id="aNom" maxlength="40" required></label>
      <label>Celular <small>(opcional)</small><input id="aTel" inputmode="tel" placeholder="987 654 321"></label>
      <label>Edad del niño o niña<input id="aEdad" placeholder="8 años"></label>
      <label>Sede<select id="aSede">${Object.entries(A.cfg.sedes).filter(([, s]) => s.activa).map(([k, s]) => `<option value="${k}">${esc(s.nombre)}</option>`).join("")}</select></label>
      <label>¿Cómo se enteró?<select id="aOri"><option>Llamada</option><option>Escribió a mi WhatsApp</option><option>Facebook</option><option>Le recomendaron</option><option>Pasó por la cancha</option></select></label>
      <button class="btn principal">Anotar</button>`;
    f.onsubmit = async (e) => {
      e.preventDefault();
      let tel = $("#aTel").value.replace(/\D/g, ""); if (tel.length === 9) tel = "51" + tel;
      try { await api("POST", "/api/leads", { padre: $("#aNom").value, wa_id: tel || null, edad: $("#aEdad").value, sede: $("#aSede").value, origen: $("#aOri").value }); avisoRapido("Anotado"); await window.recargar(); }
      catch (err) { avisoRapido("No se anotó. " + err.message); }
    };
    s.append(f); return s;
  }

  window.registrarVista("hoy", () => {
    const v = $("#vista"); v.innerHTML = "";
    const hoy = limaHoy(), en7 = sumarDias(hoy, 7);
    const L = A.leads;
    const atender = L.filter((l) => l.estado === "quiere_inscribirse" && !l.comprobante);
    const comprobantes = L.filter((l) => l.comprobante);
    const espera = L.filter((l) => l.estado === "espera");
    const renovar = L.filter((l) => l.estado === "inscrito" && l.fin_ciclo && l.fin_ciclo <= sumarDias(hoy, 7)).sort((a, b) => a.fin_ciclo.localeCompare(b.fin_ciclo));
    const clases = L.filter((l) => l.estado === "agendada" && l.clase_fecha && l.clase_fecha <= en7).sort((a, b) => a.clase_fecha.localeCompare(b.clase_fecha));
    const hace7 = new Date(Date.now() - 7 * 86400e3).toISOString();
    const nuevas = L.filter((l) => l.estado === "consulta" && l.creado >= hace7).sort((a, b) => b.creado.localeCompare(a.creado));
    const personal = window.DATOS.sesion.rol === "personal";
    const t = el("div", { className: "titulo-vista" }); t.append(el("h2", {}, `Hola, ${personal ? (window.DATOS.sesion.nombre || "").split(" ")[0] : A.cfg.nombreHumano}`), el("p", {}, mayus(fechaBonita(hoy))));
    v.append(t);
    const m = el("div", { className: "marcador", role: "group", ariaLabel: "Resumen de hoy" });
    const inscritos = L.filter((l) => l.estado === "inscrito").length;
    m.innerHTML = personal
      ? `<a href="#clases"><b>${clases.length}</b><span>clases de prueba</span></a><a href="#lista"><b>${inscritos}</b><span>inscritos</span></a>${window.DATOS.sesion.vende ? '<a href="#venta"><b>+</b><span>venta en la cancha</span></a>' : '<a href="#jornada"><b>⏱</b><span>mi entrada y salida</span></a>'}`
      : `<a href="#atender" class="${atender.length + comprobantes.length ? "alerta" : ""}"><b>${atender.length + comprobantes.length}</b><span>por atender</span></a><a href="#clases"><b>${clases.length}</b><span>clases de prueba</span></a><a href="#nuevas"><b>${nuevas.length}</b><span>consultas nuevas</span></a>`;
    v.append(m);
    if (personal) {
      const t2 = el("p", { className: "gris" }, `Ves solo ${window.DATOS.sesion.sede ? "la sede " + sedeNombre(window.DATOS.sesion.sede) : "todas las sedes"}. Lo que anotes queda registrado a tu nombre.`); t2.style.marginTop = "-16px"; v.append(t2);
    }
    window.pintarPendientes();
    api("GET", "/api/estado").then((e) => {
      if (e.errorWA) { const a = el("div", { className: "aviso", role: "alert" }); a.style.background = "var(--rojo-suave)"; a.innerHTML = `<span><b>El bot no puede enviar mensajes.</b> ${esc(e.errorWA.motivo)}</span>`; const b = boton("Pedir ayuda", "principal"); b.onclick = () => window.irA("ayuda"); a.append(b); t.after(a); }
      if (e.faltan && e.faltan.length) {
        const s = el("details", { className: "mas", id: "primerDia" }); s.open = e.faltan.length >= 3;
        const sum = el("summary"); sum.innerHTML = ico("ajustes") + `&nbsp;Para que todo funcione faltan ${e.faltan.length} ${e.faltan.length === 1 ? "dato" : "datos"}`; s.append(sum);
        const ul = el("ul", { className: "pasos" }); ul.style.marginTop = "12px"; e.faltan.forEach((f) => { const li = el("li"); li.innerHTML = `<b>${esc(f.que)}</b><br><span class="gris">${esc(f.donde)}</span>`; ul.append(li); }); s.append(ul);
        const b = boton("Ir a Ajustes", "principal", "ajustes"); b.onclick = () => window.irA("ajustes"); s.append(b);
        const m2 = v.querySelector(".marcador"); if (m2) m2.after(s);
      }
    }).catch(() => {});
    if (A.esperando && !personal) {
      const a = el("div", { className: "aviso" }); a.style.background = "var(--rojo-suave)";
      a.append(el("span", {}, A.esperando === 1 ? "1 chat espera tu respuesta." : `${A.esperando} chats esperan tu respuesta.`));
      const b = boton("Ver chats", "principal", "chat"); b.onclick = () => window.irA("chats"); a.append(b); v.append(a);
    }
    if (!A.cfg.activo) {
      const a = el("div", { className: "aviso" }); a.append(el("span", {}, "El bot está en pausa. Los padres reciben tu número para escribirte directo."));
      const b = boton("Encender el bot", "exito");
      b.onclick = async () => { try { await api("PUT", "/api/config", { activo: true }); A.cfg.activo = true; avisoRapido("El bot está encendido"); window.pintar(); } catch (e) { avisoRapido(e.message); } };
      a.append(b); v.append(a);
    }
    if (personal) {
      v.append(bloque("clases", "Clases de prueba", "Las de esta semana. Después de la clase, marca si vino.", clases, "No hay clases de prueba agendadas esta semana en tu sede.", "clase"));
      v.append(miJornada()); v.append(pasarLista()); if (window.DATOS.sesion.vende) v.append(formVenta()); v.append(formAnotar());
      return;
    }
    if (comprobantes.length) v.append(bloque("comprobantes", "Comprobantes de pago por revisar", "Enviaron su captura de Yape o Plin. Ábrela en su chat y, si está bien, toca «Se inscribió».", comprobantes, "", "atender"));
    v.append(bloque("atender", "Por atender", "Quieren inscribirse. Escríbeles primero.", atender, "Nadie está esperando. Todo al día.", "atender"));
    const cuotas = L.filter((l) => l.saldo > 0).sort((a, b) => (a.cuota_vence || "9").localeCompare(b.cuota_vence || "9"));
    if (cuotas.length) v.append(bloque("cuotas", "Cuotas por cobrar", "Deben parte del pago. El bot les recuerda 2 días antes y el día del vencimiento.", cuotas, "", "cuota"));
    if (renovar.length) v.append(bloque("renovar", "Por renovar", "Sus clases pagadas terminan esta semana. El bot ya les escribió (o les escribirá) para renovar.", renovar, "", "renovar"));
    if (espera.length) v.append(bloque("espera", "Lista de espera", "Quisieron una sede que ya estaba llena. Si se libera un cupo, escríbeles.", espera, "", "espera"));
    v.append(bloque("clases", "Clases de prueba", "Las de esta semana. Después de la clase, marca si vino.", clases, "No hay clases de prueba agendadas esta semana.", "clase"));
    v.append(bloque("nuevas", "Consultas nuevas", "Escribieron al bot en los últimos 7 días y aún no agendan clase.", nuevas, "No hay consultas nuevas.", "nueva"));
    v.append(pasarLista());
    v.append(formVenta());
    v.append(formAnotar());
  });

  // Entrada y salida del personal: escanear el QR fijo de la sede
  function miJornada() {
    const s = el("section", { className: "tarjeta", id: "jornada" });
    s.innerHTML = `<h3>Mi entrada y salida</h3><p class="gris" id="jHoy">Cargando…</p>`;
    const b = boton("Escanear QR de la sede", "principal", "camara");
    b.onclick = () => window.abrirEscaner(async (dato) => {
      const r = await api("POST", "/api/jornada", { codigo: dato });
      pintarJ();
      return { nombre: r.tipo === "entrada" ? `Entrada marcada${r.tarde ? " (tarde)" : ""}` : "Salida marcada", edad: "", sede: r.sede, hora: r.tipo === "entrada" ? r.entrada : r.salida, repetido: false, quedan: null, vencido: r.tarde };
    });
    s.append(b);
    const pintarJ = async () => {
      try {
        const r = await api("GET", "/api/jornada"); const hoy = limaHoy(); const deHoy = r.jornadas.filter((j) => j.fecha === hoy);
        const abierta = deHoy.find((j) => !j.salida);
        const dias = new Set(r.jornadas.map((j) => j.fecha)).size;
        $("#jHoy").textContent = (abierta ? `Hoy entraste a las ${abierta.entrada}. Al irte, vuelve a escanear el QR.` : deHoy.length ? `Hoy: ${deHoy.map((j) => `${j.entrada}–${j.salida}`).join(", ")}.` : "Hoy aún no marcas tu entrada.") + ` Este mes: ${dias} ${dias === 1 ? "día" : "días"}.`;
        b.innerHTML = ico("camara") + (abierta ? "Marcar mi salida" : "Marcar mi entrada");
      } catch (e) { $("#jHoy").textContent = e.message; }
    };
    pintarJ(); return s;
  }

  // Venta en la cancha: alguien paga en efectivo o Yape ahí mismo y queda inscrito al instante
  function formVenta() {
    const s = el("details", { className: "mas", id: "venta" });
    const sum = el("summary"); sum.innerHTML = ico("ok") + "&nbsp;Registrar una venta en la cancha"; s.append(sum);
    const sedeFija = window.DATOS.sesion.sede;
    const f = el("form", { className: "f2" }); f.style.marginTop = "12px";
    f.innerHTML = `<label>Nombre del papá o mamá<input id="vNom" maxlength="40" required></label>
      <label>Celular <small>(para enviarle el carnet)</small><input id="vTel" inputmode="tel" placeholder="987 654 321"></label>
      <label>Edad del niño o niña<input id="vEdad" placeholder="8 años"></label>
      ${sedeFija ? "" : `<label>Sede<select id="vSede">${Object.entries(A.cfg.sedes).filter(([, x]) => x.activa).map(([k, x]) => `<option value="${k}">${esc(x.nombre)}</option>`).join("")}</select></label>`}
      <label>¿Qué pagó?<select id="vPlan"><option value="verano">Verano (${A.cfg.clasesVerano} clases)</option><option value="ciclo">Ciclo de 12 clases</option>${window.DATOS.sesion.rol === "personal" && !A.cfg.personalPlanesLibres ? "" : '<option value="otro">Otro plan (a medida)</option>'}</select></label>
      <label id="vLcl" hidden>¿Cuántas clases?<input id="vCl" type="number" min="1" max="200" inputmode="numeric"></label>
      <label>Monto (S/)<input id="vMonto" type="number" min="0" step="0.01" inputmode="decimal" value="${A.cfg.precioVerano}" required ${window.DATOS.sesion.rol === "personal" && !A.cfg.personalPlanesLibres ? 'readonly title="El precio lo fija la administradora"' : ""}></label>
      <label>¿Cómo pagó?<select id="vMet"><option>Efectivo</option><option>Yape</option><option>Plin</option><option>Transferencia</option></select></label>
      ${window.DATOS.sesion.rol === "admin" && A.cfg.cuotas && A.cfg.cuotas.permitir ? `<label>¿Queda debiendo? (S/) <small>0 si pagó todo</small><input id="vSaldo" type="number" min="0" step="0.01" inputmode="decimal" value="0"></label><label>Paga el saldo hasta<input id="vVence" type="date" value="${sumarDias(limaHoy(), A.cfg.cuotas.diasPorDefecto || 15)}"></label>` : ""}
      <p class="gris" id="vAviso" style="grid-column:1/-1;margin:0"></p>
      <button class="btn exito" style="grid-column:1/-1">Guardar venta e inscribir</button>`;
    const plan = f.querySelector("#vPlan"), monto = f.querySelector("#vMonto"), cl = f.querySelector("#vCl"), aviso = f.querySelector("#vAviso");
    const porClase = () => { const n = plan.value === "verano" ? A.cfg.clasesVerano : plan.value === "ciclo" ? 12 : Number(cl.value); const m2 = Number(monto.value); if (!n || !m2) { aviso.textContent = ""; return; } const pc = m2 / n, piso = plan.value === "otro" ? Number(A.cfg.pisoPorClase) || 0 : 0; aviso.textContent = `Sale a S/ ${pc.toFixed(2)} por clase${piso && pc < piso ? `, por debajo del mínimo acordado de S/ ${piso}.` : "."}`; aviso.style.color = piso && pc < piso ? "var(--ambar)" : "var(--gris)"; };
    plan.onchange = () => { f.querySelector("#vLcl").hidden = plan.value !== "otro"; if (plan.value !== "otro") monto.value = plan.value === "ciclo" ? A.cfg.precioCiclo : A.cfg.precioVerano; porClase(); };
    monto.oninput = cl.oninput = porClase; porClase();
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (plan.value === "otro" && !(Number(cl.value) >= 1)) { avisoRapido("Escribe cuántas clases pagó"); cl.focus(); return; }
      try {
        const vs = f.querySelector("#vSaldo");
        const r = await api("POST", "/api/ventas", { padre: f.querySelector("#vNom").value, wa_id: f.querySelector("#vTel").value, edad: f.querySelector("#vEdad").value, sede: sedeFija || f.querySelector("#vSede").value, plan: plan.value, clases: Number(cl.value) || undefined, monto: +monto.value, metodo: f.querySelector("#vMet").value, saldo: vs ? +vs.value : 0, cuota_vence: vs && +vs.value > 0 ? f.querySelector("#vVence").value : undefined });
        avisoRapido("Venta guardada: queda inscrito y anotado en caja");
        if (r.carnet) { const ok2 = el("div", { className: "cerrada", style: "background:var(--cancha-suave);margin-top:12px" }); ok2.innerHTML = `<p><b>Listo.</b> Su carnet QR está creado. ${f.querySelector("#vTel").value ? "Se le envía por WhatsApp cuando nos escriba; mientras tanto puedes mostrárselo o imprimirlo." : "Como no dejó celular, muéstraselo o imprímelo."}</p>`; const a = el("a", { className: "btn", href: r.carnet, target: "_blank", rel: "noopener" }, "Abrir carnet"); ok2.append(a); s.append(ok2); }
        f.reset(); plan.onchange(); await window.recargar();
      } catch (err) { avisoRapido("No se guardó. " + err.message); }
    };
    s.append(f); return s;
  }

  // Escáner de carnets QR con la cámara del celular
  window.abrirEscaner = (alLeer) => {
    const d = el("dialog", { className: "escaner" });
    d.innerHTML = `<div class="esc-cab"><b>Escanear carnet</b><button type="button" class="btn claro" id="escCerrar">Cerrar</button></div>
      <div class="esc-video"><video playsinline muted autoplay></video><div class="esc-marco" aria-hidden="true"></div></div>
      <div class="esc-res" id="escRes" aria-live="assertive"><p class="gris">Apunta la cámara al código QR del carnet.</p></div>
      <form class="esc-manual" id="escManual"><label>O escribe el código<input id="escCodigo" maxlength="20" autocomplete="off" style="text-transform:uppercase"></label><button class="btn">Marcar</button></form>`;
    document.body.append(d); d.showModal();
    const video = d.querySelector("video"), res = d.querySelector("#escRes");
    let stream = null, activo = true, ultimo = "", ultimoT = 0, timer = null;
    const cerrar = () => { activo = false; clearTimeout(timer); if (stream) stream.getTracks().forEach((t) => t.stop()); d.close(); d.remove(); };
    d.querySelector("#escCerrar").onclick = cerrar; d.oncancel = cerrar;
    const mostrar = (r) => {
      const quedan = r.quedan == null ? "" : r.quedan === 0 ? "Ya usó todas sus clases" : r.quedan === 1 ? "Le queda 1 clase" : `Le quedan ${r.quedan} clases`;
      res.innerHTML = `<div class="esc-ok ${r.repetido ? "rep" : ""} ${r.vencido || r.quedan === 0 ? "alerta" : ""}">${ico(r.repetido ? "nota" : "ok")}<div><b>${esc(r.nombre)}</b><span>${esc(r.edad || "")}${r.edad ? " · " : ""}${esc(sedeNombre(r.sede))}</span><span>${r.repetido ? `Ya estaba marcado a las ${esc(r.hora)}` : `Ingresó a las ${esc(r.hora)}`}${quedan ? " · " + quedan : ""}${r.vencido ? " · Sus clases pagadas ya vencieron" : ""}</span></div></div>`;
      if (navigator.vibrate) navigator.vibrate(r.repetido ? [60, 60, 60] : 120);
    };
    const procesar = async (dato) => {
      const ahora = Date.now(); if (!dato || (dato === ultimo && ahora - ultimoT < 4000)) return; ultimo = dato; ultimoT = ahora;
      try { mostrar(await alLeer(dato)); } catch (e) { res.innerHTML = `<div class="esc-ok alerta">${ico("no")}<div><b>No se pudo marcar</b><span>${esc(e.message)}</span></div></div>`; if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 80]); }
    };
    d.querySelector("#escManual").onsubmit = (e) => { e.preventDefault(); const c = d.querySelector("#escCodigo"); procesar(c.value.trim().toUpperCase()); c.value = ""; };
    (async () => {
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); video.srcObject = stream; }
      catch { res.innerHTML = '<p class="gris">No se pudo abrir la cámara. Revisa el permiso del navegador, o escribe el código del carnet abajo.</p>'; return; }
      let detector = null;
      if ("BarcodeDetector" in window) { try { detector = new BarcodeDetector({ formats: ["qr_code"] }); } catch {} }
      let jsQR = window.jsQR;
      if (!detector && !jsQR) {
        await new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js"; sc.onload = ok; sc.onerror = mal; document.head.append(sc); }).catch(() => {});
        jsQR = window.jsQR;
      }
      const canvas = document.createElement("canvas"), ctx2 = canvas.getContext("2d", { willReadFrequently: true });
      const leer = async () => {
        if (!activo) return;
        if (video.readyState >= 2) {
          try {
            if (detector) { const codes = await detector.detect(video); if (codes.length) await procesar(codes[0].rawValue); }
            else if (jsQR) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; ctx2.drawImage(video, 0, 0); const img = ctx2.getImageData(0, 0, canvas.width, canvas.height); const c = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" }); if (c) await procesar(c.data); }
          } catch {}
        }
        timer = setTimeout(leer, 250);
      };
      leer();
    })();
  };

  // Pasar lista: inscritos por sede, un toque por alumno
  function pasarLista() {
    const s = el("details", { className: "mas", id: "lista" });
    const sum = el("summary"); sum.innerHTML = ico("ok") + "&nbsp;Pasar lista de hoy"; s.append(sum);
    if (window.DATOS.sesion.rol === "personal") setTimeout(() => (s.open = true), 0);
    const box = el("div", { className: "bloque" }); box.style.marginTop = "12px"; s.append(box);
    let cargado = false;
    s.ontoggle = async () => {
      if (!s.open || cargado) return; cargado = true;
      box.innerHTML = '<p class="gris">Cargando…</p>';
      const fecha = limaHoy();
      let r; try { r = await api("GET", "/api/asistencia?fecha=" + fecha); } catch (e) { box.innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
      box.innerHTML = "";
      if (!r.alumnos.length) { box.append(el("p", { className: "vacio" }, "Aún no hay inscritos. Cuando alguien pague, toca «Se inscribió» y aparecerá aquí.")); return; }
      const sedes = [...new Set(r.alumnos.map((a) => a.sede))];
      const sel = el("select", { id: "listaSede" }); sel.innerHTML = sedes.map((k) => `<option value="${k}">${esc(sedeNombre(k))}</option>`).join("");
      const lsel = el("label", {}, "Sede"); lsel.append(sel);
      const fila0 = el("div", { className: "acc" }); fila0.style.alignItems = "flex-end"; lsel.style.flex = "1 1 180px";
      const bEsc = boton("Escanear carnet", "principal", "camara"); bEsc.style.flex = "1 1 180px";
      bEsc.onclick = () => window.abrirEscaner(async (dato) => {
        if (/^SEDE:/i.test(dato)) { const r2 = await api("POST", "/api/jornada", { codigo: dato }); return { nombre: r2.tipo === "entrada" ? "Entrada marcada" : "Salida marcada", edad: "", sede: r2.sede, hora: r2.tipo === "entrada" ? r2.entrada : r2.salida, repetido: false, quedan: null }; }
        const res = await api("POST", "/api/asistencia/escanear", { token: dato });
        const al = r.alumnos.find((x) => x.token && dato.toUpperCase().endsWith(x.token)); if (al) { al.presente = 1; al.hora = res.hora; pintarL(); }
        return res;
      });
      fila0.append(lsel, bEsc); box.append(fila0);
      const resumen = el("p", { className: "gris" }); box.append(resumen);
      const lista = el("div", { className: "chats" }); box.append(lista);
      const pintarL = () => {
        lista.innerHTML = ""; const items = r.alumnos.filter((a) => a.sede === sel.value);
        const m = r.mes.find((x) => x.sede === sel.value);
        resumen.textContent = `${items.length} inscritos${m && m.total ? `. Últimos 30 días: vinieron ${Math.round((m.presentes / m.total) * 100)} de cada 100 marcados` : ""}.`;
        items.forEach((a) => {
          const f = el("div", { className: "fila-chat" }); f.style.gridTemplateColumns = "1fr"; f.style.gap = "8px"; // nombre arriba, botones grandes abajo
          const quien = el("span"); quien.innerHTML = `<span class="quien" style="white-space:normal;overflow:visible;line-height:1.15">${esc(a.padre || a.perfil || "Sin nombre")}</span><span class="ult" style="white-space:normal;overflow:visible">${esc(a.edad || "")}${a.hora ? ` · llegó ${esc(a.hora)}` : ""}${a.fin_ciclo && a.fin_ciclo < fecha ? " · clases vencidas" : ""}</span>`;
          const acc = el("span", { className: "acc" }); acc.style.flexWrap = "nowrap";
          const bV = boton("Vino", a.presente === 1 ? "exito" : "", "ok"), bF = boton("Faltó", a.presente === 0 ? "principal" : "", "no");
          bV.style.minHeight = bF.style.minHeight = "48px"; bV.style.flex = bF.style.flex = "1";
          const marcar = async (p) => { const nuevo = a.presente === p ? null : p; try { await api("PUT", "/api/asistencia", { lead_id: a.id, fecha, presente: nuevo }); } catch (e) { if (e.message && /conexión/.test(e.message) || !navigator.onLine) { window.encolar("PUT", "/api/asistencia", { lead_id: a.id, fecha, presente: nuevo }); avisoRapido("Sin señal: la marca se guardó y se enviará sola"); } else { avisoRapido(e.message); return; } } a.presente = nuevo; pintarL(); };
          bV.onclick = () => marcar(1); bF.onclick = () => marcar(0);
          acc.append(bV, bF); f.append(quien, acc); lista.append(f);
        });
      };
      sel.onchange = pintarL; pintarL();
      const d = el("a", { className: "btn claro", href: "/api/asistencia.csv" }, "Descargar asistencia"); box.append(d);
    };
    return s;
  }

  let filtro = "todos", busca = "";
  window.registrarVista("todos", () => {
    const v = $("#vista"); v.innerHTML = "";
    const t = el("div", { className: "titulo-vista" }); t.append(el("h2", {}, "Personas"), el("p", {}, "Busca por nombre o celular, o filtra por cómo van.")); v.append(t);
    const b = el("input", { type: "search", placeholder: "Buscar nombre o celular", value: busca, id: "buscar", ariaLabel: "Buscar" }); v.append(b);
    const fs = el("div", { className: "filtros", role: "group", ariaLabel: "Filtrar" });
    const F = { todos: "Todas", quiere_inscribirse: "Por atender", agendada: "Con clase", asistio: "Vinieron", inscrito: "Inscritas", espera: "En espera", consulta: "Solo consultaron", perdido: "No se inscribieron" };
    for (const [k, txt] of Object.entries(F)) { const x = el("button", { type: "button" }, txt); x.setAttribute("aria-pressed", k === filtro); x.onclick = () => { filtro = k; window.pintar(); }; fs.append(x); }
    v.append(fs);
    const lista = el("div", { className: "bloque" }); v.append(lista);
    const pintarLista = () => {
      lista.innerHTML = "";
      const q = busca.toLowerCase().replace(/\s/g, "");
      const items = A.leads.filter((l) => (filtro === "todos" || l.estado === filtro) && (!q || ((l.padre || "") + (l.perfil || "")).toLowerCase().replace(/\s/g, "").includes(q) || (l.wa_id || "").includes(q)));
      if (!items.length) lista.append(el("p", { className: "vacio" }, A.leads.length ? "No hay personas con ese filtro." : "Aún no hay personas. Aparecerán aquí apenas alguien escriba al bot."));
      items.slice(0, 200).forEach((l) => lista.append(window.tarjeta(l, "todos")));
    };
    b.oninput = () => { busca = b.value; pintarLista(); };
    pintarLista();
  });
}

function appChats() {
  const A = window.APP;
  A.chatAbierto = null; A.esperando = 0;
  let filtro = "espera", lista = null, datos = null, enviando = false;
  const borradores = {};
  const NOMBRE_PLANTILLA = () => {
    const c = A.cfg;
    return {
      [c.plantillaRecordatorio && c.plantillaRecordatorio.nombre]: "Recordatorio de la clase de prueba",
      [c.automatizaciones.seguimientoClase.plantilla]: "Seguimiento después de la clase",
      [c.campanas.preventa.plantilla]: "Promoción de preventa",
      [c.campanas.marzo.plantilla]: "Invitación a seguir en marzo",
      [c.atencion.plantillaRetomar]: "Mensaje para retomar la conversación",
    };
  };
  const horaLima = (t) => { const d = new Date(Date.parse(t) - 5 * 3600e3); const h = d.getUTCHours(); return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`; };
  const cuando = (t) => { const d = limaISO(t), h = limaHoy(); if (d === h) return horaLima(t); if (d === sumarDias(h, -1)) return "ayer"; const [, m, dd] = d.split("-"); return dd + "/" + m; };
  const etiquetaDia = (d) => { const h = limaHoy(); return d === h ? "Hoy" : d === sumarDias(h, -1) ? "Ayer" : mayus(fechaBonita(d)); };
  const nombre = (c) => c.padre || c.perfil || "+" + c.wa_id;
  const iniciales = (c) => (nombre(c).replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("") || "#").toUpperCase();
  const ICONO_TIPO = { audio: "🎤 Audio", imagen: "📷 Foto", video: "🎬 Video", sticker: "Sticker", documento: "📄 Documento", ubicacion: "📍 Ubicación", contacto: "👤 Contacto" };
  const previa = (c) => {
    const quien = c.ultimo_autor === "bot" ? "Bot: " : c.ultimo_autor === "katy" ? "Tú: " : "";
    if (c.ultimo_tipo === "plantilla") return quien + "Mensaje automático";
    if (c.ultimo_tipo === "reaccion") return "Reaccionó " + (c.ultimo_texto || "");
    const t = (c.ultimo_texto || "").split("\n[")[0];
    return quien + (ICONO_TIPO[c.ultimo_tipo] ? ICONO_TIPO[c.ultimo_tipo] + (t ? ": " + t : "") : t);
  };
  const espera = (c) => c.atencion === "humano" && c.no_leidos > 0;
  const formato = (t) => esc(t).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/(^|\s)_([^_\n]+)_/g, "$1<i>$2</i>").replace(/~([^~\n]+)~/g, "<s>$1</s>");
  const conFormato = (t) => { const x = el("span"); x.innerHTML = formato(t); return x; };

  window.actualizarInsignia = (n) => {
    A.esperando = n;
    const b = document.querySelector('nav button[data-v="chats"]'); let i = b.querySelector(".insignia");
    if (!n) { if (i) i.remove(); return; }
    if (!i) { i = el("span", { className: "insignia" }); b.append(i); }
    i.textContent = n > 99 ? "99+" : n; b.setAttribute("aria-label", `Chats, ${n} esperan respuesta`);
  };
  async function cargarLista() {
    const r = await api("GET", "/api/chats"); lista = r.chats; window.actualizarInsignia(r.esperando); return r;
  }

  // ---------- Lista de chats ----------
  function pintarLista() {
    document.body.classList.remove("en-chat");
    const v = $("#vista"); v.innerHTML = "";
    const t = el("div", { className: "titulo-vista" });
    t.append(el("h2", {}, "Chats"), el("p", {}, "Responde aquí con el mismo número del bot. Los padres ven tus mensajes en su chat de siempre."));
    v.append(t);
    if (!lista) { v.append(el("p", { className: "gris" }, "Cargando…")); cargarLista().then(() => { if (A.vista === "chats" && !A.chatAbierto) pintarLista(); }).catch((e) => avisoRapido("No se pudieron cargar los chats. " + e.message)); return; }
    const n = lista.filter(espera).length;
    const fs = el("div", { className: "filtros", role: "group", ariaLabel: "Filtrar chats" });
    [["espera", `Esperan respuesta (${n})`], ["tuyos", "Atiendes tú"], ["todos", "Todos"]].forEach(([k, txt]) => {
      const x = el("button", { type: "button" }, txt); x.setAttribute("aria-pressed", k === filtro); x.onclick = () => { filtro = k; pintarLista(); }; fs.append(x);
    });
    v.append(fs);
    const items = lista.filter((c) => filtro === "todos" || (filtro === "espera" ? espera(c) : c.atencion === "humano"));
    if (!items.length) {
      v.append(el("p", { className: "vacio" }, filtro === "espera" ? "Nadie espera respuesta. El bot está atendiendo los chats." : filtro === "tuyos" ? "No estás atendiendo ningún chat ahora." : "Aún no hay chats. Aparecerán aquí apenas alguien escriba al bot."));
      return;
    }
    const box = el("div", { className: "chats" });
    items.forEach((c) => {
      const f = el("button", { type: "button", className: "fila-chat" + (espera(c) ? " espera" : "") });
      f.innerHTML = `<span class="avatar${espera(c) ? "" : c.atencion === "humano" ? " tu" : " bot"}" aria-hidden="true">${esc(iniciales(c))}</span>
        <span style="min-width:0"><span class="quien">${esc(nombre(c))}</span><span class="ult">${esc(previa(c))}</span></span>
        <span class="lado"><span>${esc(cuando(c.ultimo_creado))}</span>${espera(c) ? `<span class="cuenta" aria-label="${c.no_leidos} sin leer">${c.no_leidos}</span>` : c.atencion === "humano" ? '<span class="tag tu">Atiendes tú</span>' : ""}</span>`;
      f.onclick = () => window.irAChat(c.wa_id);
      box.append(f);
    });
    v.append(box);
  }

  // ---------- Un chat ----------
  window.irAChat = (waId) => {
    if (A.vista !== "chats") { A.chatAbierto = null; window.irA("chats"); }
    A.chatAbierto = waId; datos = null;
    if (location.hash !== "#chat-" + waId) history.pushState({ chat: waId }, "", "#chat-" + waId);
    pintarChat();
  };
  window.abrirDesdeEnlace = () => {
    const m = location.hash.match(/^#chat-(\d{8,15})$/); if (!m) return false;
    window.irA("chats"); window.irAChat(m[1]); return true;
  };
  window.addEventListener("popstate", () => {
    if (A.vista !== "chats") return;
    const m = location.hash.match(/^#chat-(\d{8,15})$/);
    if (m) { A.chatAbierto = m[1]; datos = null; pintarChat(); } else { A.chatAbierto = null; pintarLista(); }
  });
  function cerrarChat() {
    A.chatAbierto = null;
    if (history.state && history.state.chat) history.back(); else { history.replaceState(null, "", location.pathname); pintarLista(); }
  }

  function pintarChat() {
    document.body.classList.add("en-chat");
    const v = $("#vista"); v.innerHTML = "";
    const c = el("section", { className: "chat", ariaLabel: "Conversación" });
    c.innerHTML = `<div class="chat-cab"><button type="button" class="volver" id="volver">${ico("atras")}Chats</button>
      <div class="persona-cab"><div class="quien" id="cQuien">…</div><div class="det" id="cDet"></div></div>
      <button type="button" class="btn ficha" id="verFicha" aria-expanded="false">Ficha</button></div>
      <div class="ficha-box" id="ficha" hidden></div>
      <div class="modo" id="modo"></div>
      <div class="hilo" id="hilo" aria-live="polite"><p class="gris" style="align-self:center">Cargando…</p></div>
      <div class="escribir" id="escribir"></div>`;
    v.append(c);
    $("#volver").onclick = cerrarChat;
    $("#verFicha").onclick = () => { const f = $("#ficha"); f.hidden = !f.hidden; $("#verFicha").setAttribute("aria-expanded", !f.hidden); if (!f.hidden) pintarFicha(); };
    window.refrescarChat(true);
  }

  window.refrescarChat = async (primera) => {
    const waId = A.chatAbierto; if (!waId || !$("#hilo")) return;
    let r;
    try { r = await api("GET", "/api/chats/" + waId); } catch (e) { $("#hilo").innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
    if (A.chatAbierto !== waId) return;
    const antes = datos; datos = r;
    const l = r.lead;
    $("#cQuien").textContent = nombre(l);
    $("#cDet").textContent = [l.edad, l.sede ? sedeNombre(l.sede) : null, window.DATOS.estados[l.estado]].filter(Boolean).join(" · ");
    pintarModo(); const bajar = pintarHilo(antes);
    if (!$("#ficha").hidden && antes && JSON.stringify(antes.lead) !== JSON.stringify(l)) pintarFicha();
    if (primera || !antes || antes.ventana !== r.ventana) pintarEscribir();
    else { const vt = $("#ventanaTxt"); if (vt) vt.textContent = textoVentana(); }
    if (bajar) { const h = $("#hilo"); h.scrollTop = h.scrollHeight; requestAnimationFrame(() => (h.scrollTop = h.scrollHeight)); }
    if (l.no_leidos > 0) { api("POST", `/api/chats/${waId}/leido`).then(() => cargarLista()).catch(() => {}); }
  };

  function pintarFicha() {
    const f = $("#ficha"); f.innerHTML = "";
    if (!datos) return;
    f.append(window.tarjeta(datos.lead, "chat"));
  }

  function pintarModo() {
    const m = $("#modo"), l = datos.lead, H = A.cfg.atencion.devolverHoras;
    m.innerHTML = "";
    if (l.atencion === "humano") {
      m.className = "modo humano";
      const t = el("span"); t.innerHTML = `<b>Atiendes tú.</b> El bot vuelve solo si no escribes en ${H} horas.`; m.append(t);
      const b = boton("Devolver al bot", "", "bot");
      b.onclick = async () => { try { await api("POST", `/api/chats/${l.wa_id}/atencion`, { modo: "bot" }); avisoRapido("El bot vuelve a atender este chat"); await window.refrescarChat(); cargarLista(); } catch (e) { avisoRapido(e.message); } };
      m.append(b);
    } else {
      m.className = "modo bot";
      const t = el("span"); t.innerHTML = "<b>El bot atiende este chat.</b> Si quieres responder tú, tócalo."; m.append(t);
      const b = boton("Atender yo", "", "mano");
      b.onclick = async () => { try { await api("POST", `/api/chats/${l.wa_id}/atencion`, { modo: "humano" }); avisoRapido("Listo, el bot ya no responde en este chat"); await window.refrescarChat(); cargarLista(); } catch (e) { avisoRapido(e.message); } };
      m.append(b);
    }
  }

  function burbuja(msg) {
    const sale = msg.autor !== "padre";
    if (msg.tipo === "reaccion") return Object.assign(el("div", { className: "msg reac" + (sale ? " sale" : "") }), { textContent: msg.texto || "" });
    const b = el("div", { className: "msg" + (sale ? " sale" : "") + (msg.autor === "bot" ? " bot" : "") });
    if (msg.autor === "bot") b.append(el("span", { className: "autor" }, "Bot"));
    if (msg.autor === "katy") b.append(el("span", { className: "autor" }, "Tú"));
    const src = msg.media_id ? "/api/media/" + msg.media_id : null;
    const texto = msg.texto || "";
    if (msg.tipo === "plantilla") {
      const n = (texto.match(/«([\w]+)»/) || [])[1];
      b.append(el("span", { className: "auto" }, "Mensaje automático: " + (NOMBRE_PLANTILLA()[n] || n || "")));
    } else if (msg.tipo === "botones" || msg.tipo === "lista") {
      const i = texto.lastIndexOf("\n["); const cuerpo = i > -1 ? texto.slice(0, i) : texto; const ops = i > -1 ? texto.slice(i + 2, -1).split(" · ") : [];
      b.append(conFormato(cuerpo));
      if (ops.length) { const bs = el("div", { className: "btns" }); ops.forEach((o) => bs.append(el("span", {}, o))); b.append(bs); }
    } else if (msg.tipo === "imagen" && src) {
      const a = el("a", { href: src, target: "_blank", rel: "noopener" }); a.append(el("img", { src, alt: "Foto que envió", onload: bajarSiEstaAbajo })); b.append(a);
      if (texto) b.append(document.createTextNode(texto));
    } else if (msg.tipo === "sticker" && src) {
      b.append(el("img", { src, alt: "Sticker", className: "sticker", onload: bajarSiEstaAbajo }));
    } else if (msg.tipo === "audio" && src) {
      b.append(el("audio", { src, controls: true, preload: "none" }));
    } else if (msg.tipo === "video" && src) {
      b.append(el("video", { src, controls: true, preload: "none" }));
    } else if (msg.tipo === "documento" && src) {
      const a = el("a", { href: src, target: "_blank", rel: "noopener" }, "📄 " + (texto || "Abrir documento")); b.append(a);
    } else if (ICONO_TIPO[msg.tipo]) {
      b.append(document.createTextNode(ICONO_TIPO[msg.tipo] + (texto ? ": " + texto : "")));
    } else {
      if (texto) b.append(conFormato(texto)); else b.append(el("span", { className: "auto" }, "(mensaje que el panel no puede mostrar)"));
    }
    b.append(el("span", { className: "hora" }, horaLima(msg.creado)));
    return b;
  }

  function pintarHilo(antes) {
    const h = $("#hilo"), M = datos.mensajes;
    const ultimoAntes = antes && antes.mensajes.length ? antes.mensajes[antes.mensajes.length - 1].id : null;
    const ultimo = M.length ? M[M.length - 1].id : null;
    if (antes && ultimoAntes === ultimo && h.childElementCount) return false; // nada nuevo
    const abajo = !antes || h.scrollHeight - h.scrollTop - h.clientHeight < 120;
    h.innerHTML = "";
    if (!M.length) h.append(el("p", { className: "vacio", style: "align-self:center" }, "Todavía no hay mensajes en este chat."));
    let dia = "";
    M.forEach((m) => { const d = limaISO(m.creado); if (d !== dia) { dia = d; h.append(el("div", { className: "dia" }, etiquetaDia(d))); } h.append(burbuja(m)); });
    return abajo;
  }
  function bajarSiEstaAbajo() { const h = $("#hilo"); if (h && h.scrollHeight - h.scrollTop - h.clientHeight < 400) h.scrollTop = h.scrollHeight; }

  function textoVentana() {
    if (!datos.ventanaHasta) return "";
    const fin = datos.ventanaHasta, d = limaISO(fin), hoy = limaHoy();
    const dia = d === hoy ? "hoy" : d === sumarDias(hoy, 1) ? "mañana" : "el " + fechaBonita(d);
    return `Puedes escribirle libremente hasta ${dia} a las ${horaLima(fin)}`;
  }

  function pintarEscribir() {
    const w = $("#escribir"), l = datos.lead, waId = l.wa_id;
    w.innerHTML = "";
    if (!datos.ventana) {
      const nom = (l.padre || l.perfil || "").split(" ")[0] || "¿cómo estás?";
      const box = el("div", { className: "cerrada" });
      box.append(el("p", {}, datos.ventanaHasta
        ? "Pasaron más de 24 horas desde su último mensaje. WhatsApp solo deja enviar un mensaje aprobado para retomar la conversación. Cuando responda, podrás escribirle libremente."
        : "Esta persona todavía no ha escrito al número del bot. Puedes enviarle un mensaje aprobado para empezar la conversación."));
      box.append(el("p", { className: "gris" }, `Se enviará: «Hola ${nom}, soy ${A.cfg.nombreHumano} de la Escuela Coyote. Te escribo para continuar con tu consulta. ¿Seguimos conversando por aquí?»`));
      const b = boton("Enviar mensaje para retomar", "principal", "enviar");
      let ok2 = false;
      b.onclick = async () => {
        if (!ok2) { ok2 = true; b.lastChild.textContent = "Toca otra vez para enviarlo"; return; }
        b.disabled = true;
        try { await api("POST", `/api/chats/${waId}/retomar`); avisoRapido("Mensaje enviado. Cuando responda, podrás escribirle."); await window.refrescarChat(); }
        catch (e) { avisoRapido(e.message); b.disabled = false; ok2 = false; b.lastChild.textContent = "Enviar mensaje para retomar"; }
      };
      box.append(b); w.append(box); return;
    }
    const R = A.cfg.respuestasGuardadas || [];
    const llenarPago = (txt) => txt.replace(/\{pagoNumero\}/g, A.cfg.pago?.numero || "[número de Yape por completar en Ajustes]").replace(/\{pagoTitular\}/g, A.cfg.pago?.titular || "[titular por completar en Ajustes]").replace(/\{pagoNota\}/g, A.cfg.pago?.nota || "").replace(/\{humano\}/g, A.cfg.nombreHumano);
    if (R.length) {
      const rs = el("div", { className: "rapidas", role: "group", ariaLabel: "Respuestas guardadas" });
      R.forEach((r) => { const x = el("button", { type: "button", className: "btn" }, r.titulo); x.onclick = () => { const t = $("#txtChat"); const texto = llenarPago(r.texto); t.value = t.value.trim() ? t.value.trim() + "\n" + texto : texto; t.dispatchEvent(new Event("input")); t.focus(); }; rs.append(x); });
      w.append(rs);
    }
    const caja = el("div", { className: "caja-env" });
    const t = el("textarea", { id: "txtChat", rows: 1, placeholder: "Escribe tu respuesta", ariaLabel: "Escribe tu respuesta", value: borradores[waId] || "" });
    const env = boton("", "principal", "enviar"); env.setAttribute("aria-label", "Enviar"); env.title = "Enviar";
    const mic = botonAudio(waId);
    let avisoCorchetes = false;
    t.oninput = () => { borradores[waId] = t.value; t.style.height = "auto"; t.style.height = Math.min(150, t.scrollHeight + 3) + "px"; avisoCorchetes = false; };
    env.onclick = async () => {
      const texto = t.value.trim(); if (!texto || enviando) return;
      if (/\[[^\]]+\]/.test(texto) && !avisoCorchetes) { avisoCorchetes = true; avisoRapido("Revisa: el mensaje tiene algo entre [corchetes] por completar. Toca enviar otra vez si está bien así."); return; }
      enviando = true; env.disabled = true;
      try { await api("POST", `/api/chats/${waId}/enviar`, { texto }); t.value = ""; borradores[waId] = ""; t.style.height = ""; await window.refrescarChat(); cargarLista().catch(() => {}); }
      catch (e) { avisoRapido("No se envió. " + e.message); if (e.datos && e.datos.ventana === false) await window.refrescarChat(true); }
      enviando = false; env.disabled = false; t.focus();
    };
    caja.append(t, mic, env); w.append(caja);
    if (l.comprobante) {
      const cp = el("div", { className: "cerrada" }); cp.style.background = "var(--cancha-suave)";
      cp.append(el("p", {}, "Esta persona envió un comprobante de pago. Revísalo arriba y, si está bien, confírmalo."));
      const b1 = boton("Se inscribió", "exito", "ok"); b1.onclick = () => { $("#verFicha").click(); setTimeout(() => { const x = $("#ficha .btn.exito"); if (x) x.click(); }, 50); };
      const b2 = boton("No era comprobante", "claro", "no"); b2.onclick = () => cambiar(l, { comprobante: null }, "Listo");
      const acc = el("div", { className: "acc" }); acc.append(b1, b2); cp.append(acc); w.prepend(cp);
    }
    w.append(el("p", { className: "ventana", id: "ventanaTxt" }, textoVentana()));
  }

  // Mensaje de voz: mantener presionado para grabar, soltar para enviar
  function botonAudio(waId) {
    const b = boton("", "", "mic"); b.setAttribute("aria-label", "Mantén presionado para grabar un audio"); b.title = "Mantén presionado para grabar";
    const tipo = ["audio/mp4", "audio/aac", "audio/mpeg", "audio/ogg;codecs=opus"].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!tipo || !navigator.mediaDevices) { b.disabled = true; b.title = "Este navegador no puede grabar audios para WhatsApp"; return b; }
    let rec = null, partes = [], inicio = 0, cancelado = false;
    const empezar = async (e) => {
      e.preventDefault(); if (rec) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        rec = new MediaRecorder(stream, { mimeType: tipo }); partes = []; cancelado = false; inicio = Date.now();
        rec.ondataavailable = (ev) => partes.push(ev.data);
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const dur = Date.now() - inicio; rec = null; b.classList.remove("grabando"); b.textContent = ""; b.innerHTML = ico("mic");
          if (cancelado || dur < 700) { if (!cancelado) avisoRapido("Mantén presionado el botón mientras hablas y suelta para enviar."); return; }
          const blob = new Blob(partes, { type: tipo.split(";")[0] });
          avisoRapido("Enviando audio…");
          try {
            const r = await fetch(`/api/chats/${waId}/audio`, { method: "POST", headers: { "Content-Type": tipo.split(";")[0] }, body: blob });
            const d = await r.json(); if (!r.ok) throw new Error(d.error || "No se envió");
            avisoRapido("Audio enviado"); await window.refrescarChat();
          } catch (err) { avisoRapido("No se envió el audio. " + err.message); }
        };
        rec.start(); b.classList.add("grabando"); b.innerHTML = ico("mic") + "Grabando… suelta para enviar";
      } catch { avisoRapido("No se pudo usar el micrófono. Revisa el permiso del navegador."); rec = null; }
    };
    const parar = (e) => { if (e) e.preventDefault(); if (rec && rec.state === "recording") rec.stop(); };
    b.onpointerdown = empezar; b.onpointerup = parar; b.onpointerleave = parar; b.onpointercancel = () => { cancelado = true; parar(); };
    b.onkeydown = (e) => { if (e.key === " " || e.key === "Enter") { if (!rec) empezar(e); else parar(e); } };
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  }

  window.registrarVista("chats", () => (A.chatAbierto ? pintarChat() : pintarLista()));

  // Mantener al día: la lista cada 20 s y el chat abierto cada 8 s
  setInterval(() => {
    if (document.hidden) return;
    const antes = A.esperando;
    cargarLista().then(() => { if (A.vista === "chats" && !A.chatAbierto) pintarLista(); if (A.vista === "hoy" && antes !== A.esperando) window.pintar(); }).catch(() => {});
  }, 20000);
  setInterval(() => { if (!document.hidden && A.vista === "chats" && A.chatAbierto && !enviando) window.refrescarChat(); }, 8000);
  cargarLista().catch(() => {});
}

function appNumeros() {
  const A = window.APP;
  const CATS = { ingreso: ["Inscripción", "Uniforme", "Otro ingreso"], egreso: ["Alquiler de cancha", "Profesores", "Uniformes", "Anuncios", "Materiales", "Otro gasto"] };
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const mesBonito = (m) => { const [a, mm] = m.split("-"); return `${mayus(MESES_L[+mm - 1])} ${a}`; };
  let mesCaja = limaHoy().slice(0, 7);
  async function pintarCaja() {
    const box = $("#cajaBox"); if (!box) return;
    let r; try { r = await api("GET", "/api/caja?mes=" + mesCaja); } catch (e) { box.innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
    const meses = [...new Set([limaHoy().slice(0, 7), ...r.meses, mesCaja])].sort().reverse();
    const movs = r.movimientos, ads = r.anuncios.reduce((s, g) => s + (+g.monto || 0), 0);
    const ing = movs.filter((x) => x.tipo === "ingreso").reduce((s, x) => s + x.monto, 0), egr = movs.filter((x) => x.tipo === "egreso").reduce((s, x) => s + x.monto, 0) + ads;
    const sedes = Object.keys(A.cfg.sedes);
    const porSede = sedes.map((k) => { const i = movs.filter((x) => x.sede === k && x.tipo === "ingreso").reduce((s, x) => s + x.monto, 0); const e = movs.filter((x) => x.sede === k && x.tipo === "egreso").reduce((s, x) => s + x.monto, 0) + r.anuncios.filter((g) => g.sede === k).reduce((s, g) => s + (+g.monto || 0), 0); return `<tr><td>${esc(sedeNombre(k))}</td><td class="n">${soles(i)}</td><td class="n">${soles(e)}</td><td class="n"><b>${soles(i - e)}</b></td></tr>`; }).join("");
    box.innerHTML = `<label>Mes<select id="cajaMes">${meses.map((m) => `<option value="${m}"${m === mesCaja ? " selected" : ""}>${mesBonito(m)}</option>`).join("")}</select></label>
      <div class="cifras" style="margin-top:12px"><div class="cifra"><b>${soles(ing)}</b><span>entró</span></div><div class="cifra"><b>${soles(egr)}</b><span>salió (incluye anuncios)</span></div><div class="cifra" style="border-color:${ing - egr >= 0 ? "var(--cancha)" : "var(--rojo)"}"><b>${soles(ing - egr)}</b><span>queda</span></div></div>
      <div class="scroll" style="margin-top:12px"><table><thead><tr><th>Sede</th><th class="n">Entró</th><th class="n">Salió</th><th class="n">Queda</th></tr></thead><tbody>${porSede}</tbody></table></div>
      <details class="mas" style="margin-top:12px"><summary>${ico("mas")}&nbsp;Anotar un ingreso o gasto</summary><form class="f2" id="cajaForm" style="margin-top:10px">
        <label>Tipo<select id="cTipo"><option value="egreso">Gasto</option><option value="ingreso">Ingreso</option></select></label>
        <label>Categoría<select id="cCat"></select></label>
        <label>Monto (S/)<input id="cMonto" type="number" min="0.1" step="0.01" inputmode="decimal" required></label>
        <label>Fecha<input id="cFecha" type="date" value="${limaHoy()}" required></label>
        <label>Sede <small>(opcional)</small><select id="cSede"><option value="">Toda la escuela</option>${sedes.map((k) => `<option value="${k}">${esc(sedeNombre(k))}</option>`).join("")}</select></label>
        <label>Nota <small>(opcional)</small><input id="cNota" maxlength="120" placeholder="Alquiler sábado 24"></label>
        <button class="btn principal">Guardar</button></form></details>
      <div class="scroll" style="margin-top:12px"><table><thead><tr><th>Fecha</th><th>Qué</th><th>Sede</th><th class="n">Monto</th><th></th></tr></thead><tbody id="cajaLista">${movs.length ? movs.map((x) => `<tr><td>${x.fecha.slice(8)}/${x.fecha.slice(5, 7)}</td><td>${esc(x.categoria)}${x.nota ? `<br><small class="gris">${esc(x.nota)}</small>` : ""}</td><td>${x.sede ? esc(sedeNombre(x.sede)) : "—"}${x.autor && x.autor !== "Katy" ? `<br><small class="gris">${esc(x.autor)}</small>` : ""}</td><td class="n" style="color:${x.tipo === "ingreso" ? "var(--cancha)" : "var(--carbon)"}">${x.tipo === "ingreso" ? "+" : "−"}${soles(x.monto)}</td><td>${x.lead_id || window.DATOS.sesion.rol !== "admin" ? "" : `<button type="button" class="btn claro" data-borrar="${x.id}" aria-label="Borrar movimiento" style="min-height:40px;padding:4px 10px">${ico("no")}</button>`}</td></tr>`).join("") : '<tr><td colspan="5" class="gris">Sin movimientos este mes.</td></tr>'}</tbody></table></div>
      ${window.DATOS.sesion.rol === "admin" ? '<a class="btn claro" style="margin-top:12px" href="/api/caja.csv">Descargar caja</a>' : ""}`;
    const tipo = $("#cTipo"), cat = $("#cCat");
    const cats = () => { cat.innerHTML = CATS[tipo.value].map((c) => `<option>${c}</option>`).join(""); }; tipo.onchange = cats; cats();
    $("#cajaMes").onchange = (e) => { mesCaja = e.target.value; pintarCaja(); };
    $("#cajaForm").onsubmit = async (e) => {
      e.preventDefault();
      try { await api("POST", "/api/caja", { tipo: tipo.value, categoria: cat.value, monto: +$("#cMonto").value, fecha: $("#cFecha").value, sede: $("#cSede").value || null, nota: $("#cNota").value }); avisoRapido("Anotado en caja"); mesCaja = $("#cFecha").value.slice(0, 7); pintarCaja(); }
      catch (err) { avisoRapido("No se anotó. " + err.message); }
    };
    box.querySelectorAll("[data-borrar]").forEach((b) => (b.onclick = async () => { if (!b.dataset.ok) { b.dataset.ok = "1"; avisoRapido("Toca otra vez para borrar este movimiento"); return; } try { await api("DELETE", "/api/caja/" + b.dataset.borrar); pintarCaja(); avisoRapido("Borrado"); } catch (err) { avisoRapido(err.message); } }));
  }
  window.registrarVista("caja", () => {
    const v = $("#vista"); v.innerHTML = `<div class="titulo-vista"><h2>Caja de ${esc(window.DATOS.sesion.sede ? sedeNombre(window.DATOS.sesion.sede) : "la escuela")}</h2><p>Anota los gastos del día y revisa lo que entró.</p></div><section class="tarjeta" id="caja"><div id="cajaBox"><p class="gris">Cargando…</p></div></section>`;
    pintarCaja();
  });
  window.registrarVista("numeros", () => {
    const v = $("#vista"); v.innerHTML = "";
    const lunes = (iso) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
    const fmt = (iso) => { const [, m, d] = iso.split("-"); return d + "/" + m; };
    const semanas = []; { const d = new Date(Date.UTC(2026, 10, 16)); while (d <= Date.UTC(2027, 2, 1)) { semanas.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 7); } }
    const sedes = Object.keys(A.cfg.sedes);
    const llego = { con: ["consulta", "agendada", "asistio", "quiere_inscribirse", "inscrito", "perdido"], ag: ["agendada", "asistio", "inscrito"], as: ["asistio", "inscrito"] };
    const st = (rows, gs) => { const c = (k) => rows.filter((r) => llego[k].includes(r.estado)).length; const ins = rows.filter((r) => r.estado === "inscrito"); const conCl = ins.filter((r) => r.clases_pagadas && r.monto); return { con: c("con"), ag: c("ag"), as: c("as"), ins: ins.length, ing: ins.reduce((s, r) => s + (+r.monto || 0), 0), ads: gs.reduce((s, g) => s + (+g.monto || 0), 0), pc: conCl.length ? conCl.reduce((s, r) => s + +r.monto, 0) / conCl.reduce((s, r) => s + r.clases_pagadas, 0) : 0 }; };
    const de100 = (a, b) => (b ? Math.round((a / b) * 100) : "—");
    const t = el("div", { className: "titulo-vista" }); t.append(el("h2", {}, "Números de la campaña"), el("p", {}, "Cuántos escribieron, cuántos vinieron y cuántos se inscribieron.")); v.append(t);
    const sel = el("select", { id: "nSem" }); sel.innerHTML = `<option value="">Toda la campaña</option>` + semanas.map((s) => `<option value="${s}">Semana del ${fmt(s)}</option>`).join("");
    const lsel = el("label", {}, "Ver"); lsel.append(sel); v.append(lsel);
    const cont = el("div", { className: "bloque" }); v.append(cont);
    const pintarN = () => {
      const w = sel.value; const rows = A.leads.filter((r) => !w || lunes(limaISO(r.creado)) === w), gs = A.gastos.filter((g) => !w || g.semana === w);
      const x = st(rows, gs);
      cont.innerHTML = `<div class="cifras">${[[x.con, "escribieron"], [x.ag, "agendaron clase"], [x.as, "vinieron a la clase"], [x.ins, "se inscribieron"], [de100(x.ins, x.con), "de cada 100 que escriben, se inscriben"], [soles(x.ing), "en inscripciones"], [x.ads ? soles(x.ads) : "—", "gastado en anuncios"], [x.ads && x.ins ? soles(x.ads / x.ins) : "—", "de anuncios por cada inscrito (meta: S/ 80 o menos)"], [x.pc ? "S/ " + x.pc.toFixed(2) : "—", `cobrado por clase en promedio (mínimo acordado: S/ ${A.cfg.pisoPorClase || 0})`]].map(([n, k]) => `<div class="cifra"><b>${n}</b><span>${k}</span></div>`).join("")}</div>
      <h3 style="font-size:1.35rem">Por sede</h3><div class="scroll"><table><thead><tr><th>Sede</th><th class="n">Escribieron</th><th class="n">Clase</th><th class="n">Vinieron</th><th class="n">Inscritos</th><th class="n">Dinero</th><th class="n">Anuncios</th></tr></thead><tbody>${sedes.map((k) => { const y = st(rows.filter((r) => r.sede === k), gs.filter((g) => g.sede === k)); return `<tr><td>${esc(sedeNombre(k))}</td><td class="n">${y.con}</td><td class="n">${y.ag}</td><td class="n">${y.as}</td><td class="n">${y.ins}</td><td class="n">${soles(y.ing)}</td><td class="n">${y.ads ? soles(y.ads) : "—"}</td></tr>`; }).join("")}</tbody></table></div>`;
    };
    sel.onchange = pintarN; pintarN();

    // Aviso a una sede
    const av = el("section", { className: "tarjeta" });
    av.innerHTML = `<h3>Aviso a una sede</h3><p class="gris">Para avisos del día: «Hoy no hay clase por lluvia», «El sábado empezamos 9:30». Llega a los inscritos y a quienes tienen clase de prueba en esa sede. Cada mensaje tiene un costo pequeño en Meta.</p>
      <div class="f2"><label>Sede<select id="avSede">${sedes.map((k) => `<option value="${k}">${esc(sedeNombre(k))}</option>`).join("")}</select></label><label>Aviso <span class="cnt" id="avCnt"></span><textarea id="avTexto" maxlength="300" placeholder="Hoy no hay entrenamiento por lluvia. Nos vemos el miércoles a la hora de siempre."></textarea></label></div>
      <div class="ejemplo" id="avPrev"></div><p class="gris" id="avCuantos"></p><div class="progreso" hidden><i></i></div><p class="estado gris" aria-live="polite"></p>`;
    const avB = boton("Enviar aviso", "principal", "enviar"); av.append(avB); v.append(av);
    const avSede = av.querySelector("#avSede"), avTxt = av.querySelector("#avTexto"), avPrev = av.querySelector("#avPrev"), avCnt = av.querySelector("#avCnt"), avCuantos = av.querySelector("#avCuantos");
    let avPersonas = 0, avConfirmar = false;
    const avActualizar = () => { avPrev.textContent = `Aviso de la Escuela Coyote, sede ${sedeNombre(avSede.value)}: ${avTxt.value.trim() || "…"}`; avCnt.textContent = `(${avTxt.value.length} de 300)`; avConfirmar = false; avB.innerHTML = ico("enviar") + (avPersonas ? `Enviar aviso a ${avPersonas} ${avPersonas === 1 ? "persona" : "personas"}` : "Enviar aviso"); avB.disabled = !avPersonas; };
    const avContar = async () => { try { avPersonas = (await api("GET", "/api/aviso-sede?sede=" + avSede.value)).personas; } catch { avPersonas = 0; } avCuantos.textContent = avPersonas ? `Llegará a ${avPersonas} ${avPersonas === 1 ? "persona" : "personas"} de ${sedeNombre(avSede.value)}.` : `No hay inscritos ni clases de prueba en ${sedeNombre(avSede.value)}.`; avActualizar(); };
    avSede.onchange = avContar; avTxt.oninput = avActualizar; avContar();
    avB.onclick = async () => {
      if (avTxt.value.trim().length < 5) { avisoRapido("Escribe el aviso"); avTxt.focus(); return; }
      if (!avConfirmar) { avConfirmar = true; avB.textContent = "Toca otra vez para confirmar el envío"; return; }
      avB.disabled = true; const prog = av.querySelector(".progreso"), barra = prog.querySelector("i"), estado = av.querySelector(".estado"); prog.hidden = false;
      const id = Math.random().toString(36).slice(2, 12); let enviados = 0, fallidos = 0; const total = avPersonas;
      try {
        for (let i = 0; i < 100; i++) {
          const r = await api("POST", "/api/aviso-sede", { sede: avSede.value, texto: avTxt.value, id });
          enviados += r.enviados; fallidos += r.fallidos; barra.style.width = Math.min(100, Math.round(((total - r.quedan) / Math.max(total, 1)) * 100)) + "%"; estado.textContent = `Enviando… ${enviados} listos`;
          if (!r.quedan || (!r.enviados && !r.fallidos)) break;
        }
        estado.textContent = `Listo: el aviso llegó a ${enviados}.${fallidos ? ` ${fallidos} no se pudieron enviar (revisa que la plantilla «aviso_sede» esté aprobada).` : ""}`; avTxt.value = ""; avActualizar(); avB.disabled = true;
      } catch (e) { estado.textContent = "Se detuvo el envío. " + e.message; avB.disabled = false; avConfirmar = false; }
    };

    // Cómo llegaron
    const can = el("section", { className: "tarjeta" });
    can.innerHTML = `<h3>Cómo llegaron</h3><p class="gris">De dónde vienen las personas que escriben y cuántas de cada canal se inscriben. Para medirlo, usa estos enlaces en cada lugar.</p><div id="canales" class="scroll"><p class="gris" style="padding:12px">Cargando…</p></div>
      <div class="ejemplo" style="font-size:.9rem;overflow-wrap:anywhere">Facebook: <b>${location.origin}/?de=fb</b><br>Instagram: <b>${location.origin}/?de=ig</b><br>Google: <b>${location.origin}/?de=google</b><br>Volantes (como código QR): <b>${location.origin}/?de=volante</b></div>`;
    v.append(can);
    api("GET", "/api/canales").then((cs) => {
      $("#canales").innerHTML = cs.length ? `<table><thead><tr><th>Canal</th><th class="n">Escribieron</th><th class="n">Inscritos</th><th class="n">De cada 100</th></tr></thead><tbody>${cs.map((c) => `<tr><td>${esc(c.origen || "Sin dato")}</td><td class="n">${c.total}</td><td class="n">${c.inscritos || 0}</td><td class="n">${c.total ? Math.round(((c.inscritos || 0) / c.total) * 100) : "—"}</td></tr>`).join("")}</tbody></table>` : '<p class="gris" style="padding:12px">Todavía no hay datos.</p>';
    }).catch(() => ($("#canales").textContent = "No se pudo cargar."));

    // Mensajes a grupos
    const camp = el("section", { className: "tarjeta" });
    camp.innerHTML = `<h3>Mensajes a grupos</h3><p class="gris">Envía un mismo mensaje a varias personas a la vez. Nadie lo recibe dos veces, y quien pidió no recibir promociones queda fuera. Cada mensaje tiene un costo pequeño en Meta.</p><div id="camps" class="bloque"><p class="gris">Cargando…</p></div>`;
    v.append(camp);
    api("GET", "/api/campanas").then((cs) => {
      const box = $("#camps"); box.innerHTML = "";
      cs.forEach((c) => {
        const d = el("div", { className: "sede" });
        d.innerHTML = `<h3 style="font-size:1.2rem">${esc(c.nombre)}</h3><p class="gris">Para: ${esc(c.para)}.</p><div class="ejemplo">${esc(c.ejemplo)}</div>
          <p><b>${c.quedan}</b> ${c.quedan === 1 ? "persona por recibir" : "personas por recibir"}${c.enviados ? `, ya se envió a ${c.enviados}` : ""}.</p>
          <div class="progreso" hidden><i></i></div><p class="estado gris" aria-live="polite"></p>`;
        const b = boton(c.quedan ? `Enviar a ${c.quedan} ${c.quedan === 1 ? "persona" : "personas"}` : "No hay a quién enviar", "principal");
        b.disabled = !c.quedan;
        let confirmar = false;
        b.onclick = async () => {
          if (!confirmar) { confirmar = true; b.textContent = "Toca otra vez para confirmar el envío"; return; }
          b.disabled = true; const prog = d.querySelector(".progreso"), barra = prog.querySelector("i"), estado = d.querySelector(".estado");
          prog.hidden = false; let total = c.quedan, enviados = 0, fallidos = 0;
          try {
            for (let i = 0; i < 100; i++) {
              const r = await api("POST", `/api/campanas/${c.id}/enviar`);
              enviados += r.enviados; fallidos += r.fallidos;
              barra.style.width = Math.min(100, Math.round(((total - r.quedan) / Math.max(total, 1)) * 100)) + "%";
              estado.textContent = `Enviando… ${enviados} listos`;
              if (!r.quedan || (!r.enviados && !r.fallidos)) break;
            }
            estado.textContent = `Listo: se envió a ${enviados}.${fallidos ? ` ${fallidos} no se pudieron enviar (revisa que la plantilla esté aprobada).` : ""}`;
            b.textContent = "Enviado";
          } catch (e) { estado.textContent = "Se detuvo el envío. " + e.message + " Puedes tocar el botón otra vez para continuar."; b.disabled = false; confirmar = false; b.textContent = "Continuar envío"; }
        };
        d.append(b); box.append(d);
      });
    }).catch((e) => ($("#camps").textContent = "No se pudo cargar. " + e.message));

    const g = el("section", { className: "tarjeta" });
    g.innerHTML = `<h3>Gasto en anuncios</h3><p class="gris">Cada lunes, copia lo que Facebook dice que se gastó la semana anterior en cada sede.</p>
      <div class="f2"><label>Semana<select id="gSem">${semanas.map((s) => `<option value="${s}">Semana del ${fmt(s)}</option>`).join("")}</select></label>
      <label>Sede<select id="gSede">${sedes.map((k) => `<option value="${k}">${esc(sedeNombre(k))}</option>`).join("")}</select></label>
      <label>Soles gastados<input id="gMon" type="number" min="0" step="0.01" inputmode="decimal"></label></div>`;
    const gb = boton("Guardar gasto", "principal"); g.append(gb); v.append(g);
    const hoyL = lunes(limaHoy()), prev = sumarDias(hoyL, -7); $("#gSem").value = semanas.includes(prev) ? prev : semanas.includes(hoyL) ? hoyL : semanas[0];
    gb.onclick = async () => { if ($("#gMon").value === "") { avisoRapido("Escribe cuántos soles se gastaron"); return; } try { await api("PUT", "/api/gastos", { semana: $("#gSem").value, sede: $("#gSede").value, monto: +$("#gMon").value }); avisoRapido("Gasto guardado"); await window.recargar(); } catch (e) { avisoRapido("No se guardó. " + e.message); } };
    // Uniformes
    const uni = el("section", { className: "tarjeta" });
    uni.innerHTML = `<h3>Uniformes</h3><p class="gris">Stock por talla y a quiénes falta entregarles. La entrega se registra desde la ficha de cada persona («Entregó uniforme»).</p><div id="uniBox"><p class="gris">Cargando…</p></div>`;
    v.append(uni);
    api("GET", "/api/uniformes").then((u) => {
      const box = $("#uniBox"); box.innerHTML = `<div class="scroll"><table><thead><tr><th>Talla</th><th class="n">En stock</th><th></th></tr></thead><tbody>${u.stock.map((s2) => `<tr><td>${esc(s2.talla)}</td><td class="n"><input type="number" min="0" value="${s2.cantidad}" data-talla="${esc(s2.talla)}" style="width:90px;min-height:40px;text-align:right" aria-label="Stock talla ${esc(s2.talla)}"></td><td></td></tr>`).join("")}</tbody></table></div>
        <p style="margin-top:10px"><b>${u.pendientes.length}</b> ${u.pendientes.length === 1 ? "inscrito sin uniforme entregado" : "inscritos sin uniforme entregado"}${u.pendientes.length ? ": " + esc(u.pendientes.slice(0, 12).map((p) => p.padre || p.perfil || "sin nombre").join(", ")) + (u.pendientes.length > 12 ? "…" : "") : "."}</p>`;
      box.querySelectorAll("[data-talla]").forEach((i) => (i.onchange = async () => { try { await api("PUT", "/api/uniformes", { talla: i.dataset.talla, cantidad: Number(i.value) }); avisoRapido(`Stock de talla ${i.dataset.talla}: ${i.value}`); } catch (e) { avisoRapido(e.message); } }));
    }).catch((e) => ($("#uniBox").textContent = e.message));

    // Encuestas y referidos
    const sat = el("section", { className: "tarjeta" });
    sat.innerHTML = `<h3>Satisfacción y referidos</h3><p class="gris">La encuesta llega sola a las ${A.cfg.encuesta ? A.cfg.encuesta.semanas : 4} semanas de inscrito (Muy bien · Bien · Regular). Quien marca «Regular» pasa a tus chats. Los referidos son familias que llegaron con el código del carnet de otra.</p><div id="satBox"><p class="gris">Cargando…</p></div>`;
    v.append(sat);
    Promise.all([api("GET", "/api/encuestas"), api("GET", "/api/referidos")]).then(([e, rf]) => {
      const cara = (p) => (p >= 2.6 ? "😀" : p >= 1.8 ? "🙂" : "😕");
      $("#satBox").innerHTML = (e.total && e.total.n ? `<p><b>${cara(e.total.prom)} ${e.total.prom.toFixed(1)} de 3</b> con ${e.total.n} ${e.total.n === 1 ? "respuesta" : "respuestas"}.</p><div class="scroll"><table><thead><tr><th>Sede</th><th class="n">Respuestas</th><th class="n">Promedio</th><th class="n">Regular</th></tr></thead><tbody>${e.porSede.map((x) => `<tr><td>${esc(sedeNombre(x.sede))}</td><td class="n">${x.n}</td><td class="n">${cara(x.prom)} ${x.prom.toFixed(1)}</td><td class="n">${x.regular || 0}</td></tr>`).join("")}</tbody></table></div>` : '<p class="gris">Todavía no hay respuestas de la encuesta.</p>')
        + (rf.length ? `<h3 style="font-size:1.2rem;margin-top:14px">Quién trae familias</h3><div class="scroll"><table><thead><tr><th>Familia</th><th class="n">Trajo</th><th class="n">Se inscribieron</th></tr></thead><tbody>${rf.map((x) => `<tr><td>${esc(x.padre || x.perfil || "sin nombre")} <small class="gris">${esc(sedeNombre(x.sede))}</small></td><td class="n">${x.traidos}</td><td class="n">${x.inscritos || 0}</td></tr>`).join("")}</tbody></table></div>` : '<p class="gris" style="margin-top:10px">Aún nadie ha llegado con un código de referido.</p>');
    }).catch((e) => ($("#satBox").textContent = e.message));

    // Caja
    const caja = el("section", { className: "tarjeta", id: "caja" });
    caja.innerHTML = `<h3>Caja</h3><p class="gris">Las inscripciones entran solas como ingresos. Agrega los gastos (cancha, profesores, uniformes) y ve cuánto queda cada mes.</p><div id="cajaBox"><p class="gris">Cargando…</p></div>`;
    v.append(caja);
    pintarCaja();

    const d = el("section", { className: "tarjeta" }); d.innerHTML = `<h3>Lista completa y copias de seguridad</h3><p class="gris">Descarga a todas las personas en un archivo que se abre con Excel o Google Sheets. La copia completa guarda todo el sistema (personas, chats, caja, asistencia); además se guarda sola cada domingo en Cloudflare y, si está configurado, en el Google Drive de la escuela.</p><div class="acc"><a class="btn" href="/api/export.csv">Descargar lista</a><a class="btn claro" href="/api/copia.json">Descargar copia completa</a></div><p class="gris" id="driveEstado" style="margin-top:10px"></p>`;
    const bDrive = boton("Guardar copia en Google Drive ahora", "exito", "ok"); bDrive.hidden = true; d.append(bDrive);
    api("GET", "/api/copia/estado").then((e) => {
      const p2 = d.querySelector("#driveEstado");
      if (!e.drive) { p2.textContent = "Copia en Google Drive: no configurada (ver la guía, «Copia en Google Drive»)."; return; }
      bDrive.hidden = false;
      p2.textContent = e.error ? `La última copia en Drive falló: ${e.error}` : e.ultima ? `Última copia en Google Drive: ${fechaBonita(limaISO(e.ultima))}.` : "Aún no se ha guardado ninguna copia en Drive.";
      if (e.error) p2.style.color = "var(--rojo)";
    }).catch(() => {});
    bDrive.onclick = async () => { bDrive.disabled = true; bDrive.lastChild.textContent = "Guardando…"; try { await api("POST", "/api/copia/drive"); avisoRapido("Copia guardada en Google Drive"); d.querySelector("#driveEstado").textContent = `Última copia en Google Drive: ${fechaBonita(limaHoy())}.`; } catch (e) { avisoRapido(e.message); } bDrive.disabled = false; bDrive.lastChild.textContent = "Guardar copia en Google Drive ahora"; };
    v.append(d);
  });
}

function appAjustes() {
  const A = window.APP;
  const V = window.DATOS.variables;
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const NOMBRES_VAR = { pagoNumero: "Número de Yape/Plin", pagoTitular: "Titular de la cuenta", pagoNota: "Indicación de pago", cantidad: "Cuántos hermanos", edad: "Edad", hermanos: "Beneficio por hermanos", nombre: "Nombre", escuela: "Nombre de la escuela", sede: "Sede", lugar: "Lugar", direccion: "Dirección", mapa: "Mapa", horario: "Horario", clases: "Número de clases", precio: "Precio del paquete", precioCiclo: "Precio del ciclo", uniforme: "Línea del uniforme", humano: "Quién atiende", hora: "Hora", fecha: "Fecha", queTraer: "Qué traer", enlace: "Enlace a tu WhatsApp", sedes: "Lista de sedes", horarios: "Lista de horarios", desde: "Hora en que empiezas", hasta: "Hora en que terminas" };
  const ETIQ = { saludo: "Saludo y pregunta de edad", botonEdad: "Botón que abre la lista de edades", preguntaSede: "Pregunta de sede", info: "Información de precio, sede y horario", preguntaAccion: "Pregunta después de la información", botonClase: "Botón 1, clase de prueba", botonInscribir: "Botón 2, inscribir", botonHumano: "Botón 3, hablar con una persona", preguntaFecha: "Pregunta de fecha de la clase", botonFecha: "Botón que abre la lista de fechas", pedirNombre: "Pedir el nombre", confirmacion: "Confirmación de la clase agendada", derivarInscribir: "Pasar contigo para inscribir (te escriben a tu WhatsApp)", derivarHumano: "Pasar contigo para conversar (te escriben a tu WhatsApp)", derivarInscribirPanel: "Pasar contigo para inscribir (respondes en Chats)", derivarHumanoPanel: "Pasar contigo para conversar (respondes en Chats)", fueraHorario: "Aviso cuando escriben fuera de tu horario", soloTexto: "Respuesta a audios, fotos y stickers", comprobante: "Cuando mandan el comprobante de pago", hermanos: "Cuando dicen que tienen más de un hijo", listaEspera: "Cuando quedan en lista de espera", noEntendi: "Cuando no entiende lo que escribieron", noEntendiOtraVez: "Cuando no entiende por segunda vez seguida", deNada: "Respuesta a «gracias», «ok» o 👍", botonPreguntas: "Botón de preguntas frecuentes", listaPreguntas: "Texto que acompaña la lista de preguntas", listaMientras: "Lista de preguntas mientras esperan que respondas", botonVerPreguntas: "Botón que abre la lista de preguntas", menuFin: "Pregunta cuando ya terminó", botonMenu: "Botón para volver a ver la información", pausado: "Mensaje cuando el bot está en pausa" };
  const ORDEN = ["saludo", "botonEdad", "preguntaSede", "info", "preguntaAccion", "botonClase", "botonInscribir", "botonHumano", "preguntaFecha", "botonFecha", "pedirNombre", "confirmacion", "derivarInscribirPanel", "derivarHumanoPanel", "fueraHorario", "derivarInscribir", "derivarHumano", "soloTexto", "comprobante", "hermanos", "listaEspera", "noEntendi", "noEntendiOtraVez", "deNada", "menuFin", "botonMenu", "botonPreguntas", "listaPreguntas", "listaMientras", "botonVerPreguntas", "pausado"];
  const CORTOS = ["botonClase", "botonInscribir", "botonHumano", "botonMenu", "botonPreguntas", "botonEdad", "botonFecha", "botonVerPreguntas"];
  const SEDE_IDS = ["LO", "SMP", "PP"];
  const horaTxt = (h) => (h === 0 || h === 24 ? "12 de la noche" : h === 12 ? "12 del mediodía" : h < 12 ? `${h} a. m.` : `${h - 12} p. m.`);
  const opcionesHora = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i).map((h) => `<option value="${h}">${horaTxt(h)}</option>`).join("");
  let cfg = null;
  let pendientesQuitar = []; // mensajes «no entendidos» que se quitan al guardar
  const llenar = (p, vars) => String(p || "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k] ?? "") : m)).replace(/[ \t]+([!?.,:)])/g, "$1").replace(/\(\s*\)/g, "").trim();
  const get = (o, r) => r.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, r, v) => { const ks = r.split("."); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  const campo = (ruta, etiqueta, tipo = "text", extra = "") => `<label>${etiqueta}<input data-r="${ruta}" type="${tipo}" ${extra}></label>`;
  const sw = (ruta, etiqueta) => `<label class="switch"><span>${etiqueta}</span><input type="checkbox" role="switch" data-r="${ruta}"></label>`;
  const chips = (k) => (V[k] || []).length ? `<div class="vars" data-para="${k}">${V[k].map((x) => `<button type="button" data-v="${x}">+ ${NOMBRES_VAR[x] || x}</button>`).join("")}</div>` : "";

  window.registrarVista("ajustes", () => {
    cfg = JSON.parse(JSON.stringify(A.cfg)); pendientesQuitar = [];
    const v = $("#vista");
    const activas = SEDE_IDS.filter((id) => cfg.sedes[id].activa);
    v.innerHTML = `<div class="titulo-vista"><h2>Ajustes del bot</h2><p>Cambia aquí lo que el bot responde. Al terminar, toca «Guardar cambios».</p></div>
    <section class="tarjeta">${sw("activo", "Bot encendido")}<p class="gris">Si lo apagas, el bot solo da tu número para que te escriban directo.</p></section>
    <section class="tarjeta"><h3>Precios del verano</h3><div class="f2">
      ${campo("precioVerano", "Precio del paquete (S/)", "number", 'min="0" inputmode="decimal"')}${campo("clasesVerano", "Clases que incluye", "number", 'min="1"')}
      ${campo("uniforme", "Uniforme (S/)", "number", 'min="0"')}${campo("uniformePreventa", "Uniforme en preventa (S/)", "number", 'min="0"')}
      ${campo("finPreventa", "Último día de la preventa", "date")}${campo("precioCiclo", "Ciclo regular de 12 clases (S/)", "number", 'min="0"')}
      ${campo("pisoPorClase", 'Mínimo por clase en planes a medida (S/) <small>Si vendes más barato, el panel te avisa pero te deja guardar</small>', "number", 'min="0"')}
    </div></section>
    <section class="tarjeta"><h3>Cuenta de la escuela para pagos</h3><p class="gris">Es lo que el bot y la web dicen cuando preguntan cómo pagar. Debe ser la cuenta de la escuela, nunca la de un profesor.</p><div class="f2">
      ${campo("pago.numero", "Número de Yape / Plin", "text", 'inputmode="numeric" placeholder="987654321"')}${campo("pago.titular", "A nombre de", "text", 'placeholder="Katy Rivera"')}
      <label style="grid-column:1/-1">Indicación después de pagar<input data-r="pago.nota" maxlength="200"></label></div>
      ${sw("personalPlanesLibres", "Permitir que el administrativo de sede registre planes a medida y otros montos")}
      ${sw("cuotas.permitir", "Permitir pagos en cuotas (el bot recuerda el saldo)")}${campo("cuotas.diasPorDefecto", "Días para pagar el saldo, si no se indica otra fecha", "number", 'min="1" max="90"')}
    </div></section>
    <section class="tarjeta"><h3>Horarios y direcciones</h3>${activas.map((id) => `<div class="sede"><b>${esc(cfg.sedes[id].nombre)}</b>
      ${campo(`sedes.${id}.horario`, 'Horario <small>Si lo dejas vacío, el bot dice que lo confirmas por chat</small>', "text", 'placeholder="Lunes, miércoles y viernes de 5 a 6 p. m."')}
      ${campo(`sedes.${id}.direccion`, "Dirección")}${campo(`personalControl.horaInicio.${id}`, 'Hora en que empieza el personal <small>Para marcar tardanzas (vacío = sin control)</small>', "text", 'placeholder="17:00" inputmode="numeric"')}${campo(`sedes.${id}.cupos`, 'Cupos del verano <small>0 = sin límite. Al llenarse, el bot ofrece otra sede o lista de espera</small>', "number", 'min="0"')}</div>`).join("")}</section>
    <section class="tarjeta"><h3>Clase de prueba gratis</h3><div class="f2">
      <label>Día<select data-r="clasePrueba.diaSemana">${DIAS.map((d, i) => `<option value="${i}">${d}</option>`).join("")}</select></label>
      ${campo("clasePrueba.hora", "Hora", "text", 'placeholder="9:00 a. m."')}</div></section>
    <section class="tarjeta"><h3>Avisos a tu WhatsApp</h3>
      ${sw("avisos.activo", "Avisarme cuando alguien quiere inscribirse")}${sw("avisos.resumenDiario", "Mandarme un resumen cada mañana a las 8")}
      ${campo("avisos.numero", "Mi WhatsApp para los avisos", "text", 'inputmode="numeric" placeholder="51985648093"')}</section>
    <section class="tarjeta"><h3>Chats y atención</h3>
      <label>Cuando un papá o mamá pide hablar contigo<select data-r="atencion.modo"><option value="panel">Le respondo en «Chats» (mismo número)</option><option value="whatsapp">Le pido que me escriba a mi WhatsApp</option></select></label>
      <div class="f2"><label>Atiendo desde<select data-r="atencion.desde">${opcionesHora(5, 15)}</select></label><label>Hasta<select data-r="atencion.hasta">${opcionesHora(12, 24)}</select></label></div>
      <p class="gris">Si escriben fuera de ese horario, el bot les dice a qué hora respondes.</p>
      ${campo("atencion.devolverHoras", "Si dejas de escribir en un chat, el bot vuelve a atenderlo después de (horas)", "number", 'min="1" max="72"')}</section>
    <section class="tarjeta"><h3>Página web</h3><p class="gris">La página que ven los padres en <a href="/" target="_blank" rel="noopener">la dirección del bot</a>. Usa los mismos precios, sedes, horarios y preguntas frecuentes de estos Ajustes.</p>
      ${sw("web.activa", "Página web encendida")}
      <div class="f2">${campo("web.numero", "WhatsApp del bot (el número de los botones)", "text", 'inputmode="numeric" placeholder="51987654321"')}${campo("web.temporada", "Temporada", "text", 'placeholder="2027"')}
      ${campo("web.inicio", "Primer día del verano", "date")}</div>
      ${campo("web.titulo", "Titular grande", "text", 'maxlength="80"')}
      <label>Texto de bienvenida<textarea data-r="web.subtitulo" maxlength="300"></textarea></label>
      <div class="f2">${campo("web.facebook", "Enlace de Facebook", "url", 'placeholder="https://www.facebook.com/..."')}${campo("web.instagram", "Enlace de Instagram", "url", 'placeholder="https://www.instagram.com/..."')}</div></section>
    <section class="tarjeta"><h3>Personal de las sedes</h3><p class="gris">Profesores o asistentes que entran al panel con su nombre y un PIN. Ven solo su sede: pasan lista, escanean carnets, registran ventas en la cancha y anotan gastos. No ven los chats ni estos Ajustes. Todo lo que hacen queda a su nombre.</p>
      <div id="personalLista"><p class="gris">Cargando…</p></div>
      <details class="mas"><summary>${ico("mas")}&nbsp;Agregar a alguien</summary><form class="f2" id="personalForm" style="margin-top:10px">
        <label>Nombre y apellido<input id="pNom" maxlength="40" required placeholder="Carlos Quispe"></label>
        <label>Cargo <small>Solo «Administrativo de sede» puede vender y anotar en caja</small><select id="pRol"><option>Profesor</option><option>Asistente</option><option>Administrativo de sede</option></select></label>
        <label>Sede<select id="pSede"><option value="">Todas las sedes</option>${SEDE_IDS.map((id) => `<option value="${id}">${esc(cfg.sedes[id].nombre)}</option>`).join("")}</select></label>
        <label>PIN <small>(6 a 8 números; díselo en persona)</small><input id="pPin" inputmode="numeric" pattern="[0-9]{6,8}" maxlength="8" required></label>
        <button class="btn principal" style="grid-column:1/-1">Agregar</button></form></details>
      <div><button type="button" class="btn claro" id="cerrarSesiones">Cerrar sesión en todos los otros celulares</button></div>
      <details class="mas"><summary>${ico("nota")}&nbsp;Quién hizo qué (últimos movimientos)</summary><div id="bitacora" style="margin-top:10px"><p class="gris">Cargando…</p></div></details></section>
    <section class="tarjeta"><h3>Respuestas guardadas</h3><p class="gris">Aparecen como botones en cada chat: tócalas y el texto se escribe solo. Antes de enviar puedes cambiarlo.</p>
      <div class="lista-ed" id="resp"></div><div><button type="button" class="btn" id="respAdd">${"Agregar respuesta"}</button></div></section>
    <section class="tarjeta"><h3>Lo que el bot no entendió</h3><p class="gris">Mensajes de los últimos 90 días que el bot no supo responder. Enséñale: elige qué debe contestar y toca «Enseñarle». Así el bot mejora con el uso.</p>
      <div class="lista-ed" id="noEnt"><p class="gris">Cargando…</p></div></section>
    <section class="tarjeta"><h3>Lo que el bot hace solo</h3>
      ${sw("automatizaciones.confirmarAsistencia", "Pedir confirmación de asistencia el día antes de la clase")}
      ${sw("automatizaciones.seguimientoClase.activo", "Escribir al día siguiente de la clase para invitar a inscribirse")}
      ${sw("automatizaciones.rescate.activo", "Retomar las conversaciones que quedaron a medias")}
      ${sw("automatizaciones.renovacion.activo", "Invitar a renovar cuando se acaban las clases pagadas")}
      ${campo("automatizaciones.renovacion.oferta", 'Oferta para renovar <small>Puedes usar {precioCiclo}</small>', "text", 'maxlength="150"')}
      ${sw("automatizaciones.faltas.activo", "Escribir si un inscrito falta varias clases seguidas")}
      ${campo("automatizaciones.faltas.seguidas", "Después de cuántas faltas seguidas", "number", 'min="1" max="10"')}
      ${campo("alertaCupos", "Avisarme cuando una sede llegue a este porcentaje de sus cupos", "number", 'min="10" max="100"')}
      ${sw("listaEspera.avisarAutomatico", "Avisar solo al primero de la lista de espera cuando se libere un cupo (apagado por ahora)")}
      ${sw("reporteMensual.activo", "Mandarme el resumen del mes cada día 1")}${campo("reporteMensual.numeroExtra", "Enviar el resumen del mes también a este WhatsApp (opcional)", "text", 'inputmode="numeric" placeholder="51987654321"')}
      ${sw("encuesta.activo", "Enviar encuesta de satisfacción a las semanas de inscribirse")}${campo("encuesta.semanas", "Semanas después de inscribirse", "number", 'min="1" max="52"')}
      ${sw("referidos.activo", "Programa de referidos (el código del carnet sirve para recomendar)")}${campo("referidos.beneficio", "Beneficio por traer a una familia", "text", 'maxlength="200"')}
      ${campo("tallas", "Tallas de uniforme que manejan", "text", 'placeholder="4, 6, 8, 10, 12, 14, S, M, L"')}
      ${campo("descuentoHermanos", 'Beneficio por hermanos <small>Lo dice el bot y la web. Vacío = no se menciona</small>', "text", 'maxlength="200"')}
      ${campo("campanas.marzo.oferta", 'Oferta para seguir en marzo <small>La usa el mensaje a grupos «Seguir entrenando en marzo»</small>', "text", 'maxlength="120"')}</section>
    <details class="mas"><summary>Opciones avanzadas: textos del bot, edades y sedes</summary><div class="bloque" style="margin-top:8px">
      <section class="tarjeta"><h3>Quién atiende</h3><div class="f2">${campo("nombreHumano", "Nombre")}${campo("whatsappHumano", "WhatsApp donde los padres te escriben", "text", 'inputmode="numeric"')}${campo("escuela", "Nombre de la escuela")}</div></section>
      <section class="tarjeta"><h3>Sedes</h3>${SEDE_IDS.map((id) => `<div class="sede">${sw(`sedes.${id}.activa`, `Sede ${esc(cfg.sedes[id].nombre)} activa`)}<div class="f2">
        ${campo(`sedes.${id}.nombre`, "Nombre")}${campo(`sedes.${id}.corto`, `Texto del botón <span class="cnt" data-c="sedes.${id}.corto"></span>`, "text", 'maxlength="20"')}
        ${campo(`sedes.${id}.lugar`, "Lugar")}${campo(`sedes.${id}.mapa`, "Enlace de Google Maps", "url", 'placeholder="https://maps.app.goo.gl/..."')}</div>
        ${campo(`sedes.${id}.coordenadas`, 'Punto en el mapa <small>En Google Maps, mantén presionado el lugar y copia los números que aparecen. El bot los envía como ubicación al confirmar la clase.</small>', "text", 'placeholder="-11.9876, -77.0712" inputmode="decimal"')}</div>`).join("")}</section>
      <section class="tarjeta"><h3>Preguntas frecuentes</h3><p class="gris">Si un papá o mamá escribe alguna de estas palabras, el bot responde y sigue la conversación donde iba. Separa las palabras con comas; no importan las tildes ni las mayúsculas.</p>
        <p class="gris">Las que tengan «Mostrar en la lista» aparecen cuando tocan el botón «Preguntas frecuentes». WhatsApp permite hasta 10.</p>
        <div class="lista-ed" id="preg"></div><div><button type="button" class="btn" id="pregAdd">Agregar pregunta</button></div></section>
      <section class="tarjeta"><h3>Números que el bot no atiende</h3>
        <label>Celulares <small>Separados por comas. El bot no les responde ni guarda sus mensajes: familia, proveedores, profesores…</small><textarea data-r="atencion.excluidos" placeholder="987 654 321, 912 345 678"></textarea></label>
        ${sw("atencion.soloNuevos", "Si el número del bot también está en la app de tu celular: no responder a quienes ya te escribían antes")}</section>
      <section class="tarjeta"><h3>Edades</h3><div id="edades"></div><div><button type="button" class="btn" id="addEdad">Agregar rango de edad</button></div></section>
      <section class="tarjeta"><h3>Más de la clase de prueba</h3><div class="f2">${campo("clasePrueba.opciones", "Cuántas fechas ofrecer, de 1 a 5", "number", 'min="1" max="5"')}${campo("clasePrueba.queTraer", "Qué debe traer")}</div></section>
      <section class="tarjeta"><h3>Textos del bot</h3><p class="gris">Los botones con + agregan datos que el bot llena solo. Para negrita en WhatsApp, escribe entre *asteriscos*.</p>
        ${ORDEN.map((k) => CORTOS.includes(k)
          ? `<label>${ETIQ[k]} <span class="cnt" data-c="textos.${k}"></span><input data-r="textos.${k}" maxlength="40"></label>${chips(k)}`
          : `<label>${ETIQ[k]}<textarea data-r="textos.${k}"></textarea></label>${chips(k)}`).join("")}</section>
      <section class="tarjeta"><h3>Así se verá el chat</h3><div class="preview" id="prev"></div></section>
      <section class="tarjeta"><h3>Plantillas de Meta</h3><p class="gris">Nombres de las plantillas aprobadas en Meta. Cámbialos solo si así te lo indican.</p><div class="f2">
        ${campo("avisos.plantilla", "Avisos para ti")}${campo("automatizaciones.seguimientoClase.plantilla", "Seguimiento después de la clase")}
        ${campo("campanas.preventa.plantilla", "Mensaje de preventa")}${campo("campanas.marzo.plantilla", "Mensaje de marzo")}${campo("campanas.avisoSede.plantilla", "Aviso a una sede")}
        ${campo("atencion.plantillaRetomar", "Retomar un chat después de 24 horas")}${campo("cuotas.plantilla", "Recordatorio de cuota")}${campo("encuesta.plantilla", "Encuesta de satisfacción")}${campo("listaEspera.plantilla", "Cupo liberado (lista de espera)")}${campo("personalControl.toleranciaMin", "Minutos de tolerancia del personal", "number", 'min="0" max="120"')}${campo("automatizaciones.renovacion.plantilla", "Invitación a renovar")}${campo("automatizaciones.faltas.plantilla", "Aviso por faltas seguidas")}
        ${campo("automatizaciones.renovacion.diasAntes", "Días antes del fin de clases para invitar a renovar", "number", 'min="0" max="30"')}${campo("automatizaciones.renovacion.semanasVerano", "Semanas que dura el verano", "number", 'min="1" max="20"')}${campo("automatizaciones.renovacion.semanasCiclo", "Semanas que dura un ciclo", "number", 'min="1" max="20"')}
        ${campo("automatizaciones.rescate.horas", "Horas antes de retomar una conversación", "number", 'min="1" max="23"')}</div></section>
      <section class="tarjeta"><h3>Ayuda técnica</h3><div class="f2">${campo("soporte.nombre", "Nombre de quien ayuda")}${campo("soporte.whatsapp", "Su WhatsApp", "text", 'inputmode="numeric"')}</div></section>
      <section class="tarjeta"><h3>Volver al inicio</h3><p class="gris">Deja todo como estaba cuando se instaló el bot. Se puede deshacer.</p><div><button type="button" class="btn" id="restaurar">Restaurar valores iniciales</button></div></section>
    </div></details>
    <ul class="errs" id="errs"></ul>
    <div class="barra"><button class="btn principal" id="guardarCfg" type="button">Guardar cambios</button><span id="msgCfg" class="gris"></span>
      <button type="button" class="btn claro" id="deshacerCfg" ${A.cambios.n ? "" : "hidden"}>Volver a como estaba</button></div>`;
    document.querySelectorAll("#vista [data-r]").forEach((i) => { const val = get(cfg, i.dataset.r); if (i.type === "checkbox") i.checked = !!val; else i.value = val ?? ""; });
    pintarEdades(); contadores(); preview(); bindings();
    editorLista("resp", cfg.respuestasGuardadas, [{ k: "titulo", etiqueta: "Nombre del botón", max: 30, ph: "Datos de pago" }, { k: "texto", etiqueta: "Texto que se escribe", max: 1000, area: true }], 20, () => ({ titulo: "", texto: "" }));
    pintarNoEntendidos(); pintarPersonal();
    editorLista("preg", cfg.preguntas, PREG_CAMPOS, 30, () => nuevaPregunta());
  });

  // Personal de las sedes
  const MESES_P = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const mesBonitoP = (m) => { const [a, mm] = m.split("-"); return `${mayus(MESES_P[+mm - 1])} ${a}`; };
  let mesP = limaHoy().slice(0, 7);
  async function pintarPersonal() {
    const box = $("#personalLista"); if (!box) return;
    let lista, jornadas; try { [lista, { jornadas }] = await Promise.all([api("GET", "/api/personal"), api("GET", "/api/jornada?mes=" + mesP)]); } catch (e) { box.innerHTML = `<p class="gris">${esc(e.message)}</p>`; return; }
    box.innerHTML = "";
    const cab = el("div", { className: "f2", style: "align-items:end" });
    const selM = el("select"); const ms = [...new Set([limaHoy().slice(0, 7), sumarDias(limaHoy(), -30).slice(0, 7), mesP])].sort().reverse(); selM.innerHTML = ms.map((m) => `<option value="${m}"${m === mesP ? " selected" : ""}>${mesBonitoP(m)}</option>`).join("");
    const lm = el("label", {}, "Mes"); lm.append(selM); selM.onchange = () => { mesP = selM.value; pintarPersonal(); };
    const qrs = el("div", { className: "acc" }); SEDE_IDS.filter((id) => cfg.sedes[id].activa).forEach((id) => { const a = el("a", { className: "btn claro", href: "/sede-qr/" + id, target: "_blank", rel: "noopener" }); a.innerHTML = ico("qr") + "QR " + esc(cfg.sedes[id].corto); qrs.append(a); });
    cab.append(lm, qrs); box.append(cab);
    box.append(el("p", { className: "gris" }, "Imprime el QR de cada sede y pégalo en la cancha: el personal lo escanea al llegar y al salir, y con su tarifa el pago del mes sale solo."));
    if (!lista.length) box.append(el("p", { className: "vacio" }, "Todavía no hay personal registrado."));
    lista.forEach((p) => {
      const d = el("div", { className: "item-ed" });
      const js = (jornadas || []).filter((j) => j.personal_id === p.id);
      const dias = new Set(js.map((j) => j.fecha)).size, tardes = js.filter((j) => j.tarde).length;
      const horas = js.reduce((s2, j) => { if (!j.salida) return s2; const a = (h) => +h.slice(0, 2) * 60 + +h.slice(3, 5); return s2 + Math.max(0, a(j.salida) - a(j.entrada)) / 60; }, 0);
      const pago = p.tipo_pago === "mes" ? p.tarifa : p.tipo_pago === "hora" ? horas * p.tarifa : dias * p.tarifa;
      d.innerHTML = `<div class="f2" style="align-items:center"><div><b style="font-size:1.1rem">${esc(p.nombre)}</b>${p.activo ? "" : ' <span class="chip">Sin acceso</span>'}<br><span class="gris">${esc(p.rol)} · ${p.sede ? esc(sedeNombre(p.sede)) : "todas las sedes"}${p.ultimo_ingreso ? ` · entró por última vez el ${fechaBonita(limaISO(p.ultimo_ingreso))}` : " · nunca ha entrado"}</span>
        <br><span>Este mes: <b>${dias}</b> ${dias === 1 ? "día" : "días"}, <b>${horas.toFixed(1)}</b> h${tardes ? `, <span style="color:var(--rojo)">${tardes} ${tardes === 1 ? "tardanza" : "tardanzas"}</span>` : ""}. Pago: <b>${p.tarifa ? soles(pago) : "sin tarifa"}</b> <small class="gris">(S/ ${p.tarifa} por ${p.tipo_pago === "mes" ? "mes" : p.tipo_pago})</small></span></div>
        <div class="acc"></div></div>`;
      const acc = d.querySelector(".acc");
      const bTar = boton("Tarifa", "claro"); bTar.onclick = async () => { const t = prompt(`Tarifa de ${p.nombre}: escribe el monto y cómo se paga, por ejemplo «25 clase», «15 hora» o «900 mes»:`, `${p.tarifa} ${p.tipo_pago}`); if (t == null) return; const mm = t.trim().match(/^(\d+(?:[.,]\d+)?)\s*(clase|hora|mes)$/i); if (!mm) { avisoRapido("Escríbelo como «25 clase», «15 hora» o «900 mes»"); return; } try { await api("PATCH", "/api/personal/" + p.id, { tarifa: Number(mm[1].replace(",", ".")), tipo_pago: mm[2].toLowerCase() }); avisoRapido("Tarifa guardada"); pintarPersonal(); } catch (e) { avisoRapido(e.message); } };
      const bPag = boton("Registrar pago", "exito", "ok"); bPag.disabled = !(pago > 0); bPag.onclick = async () => { if (!bPag.dataset.ok) { bPag.dataset.ok = "1"; bPag.lastChild.textContent = `Toca otra vez: ${soles(pago)}`; return; } try { await api("POST", "/api/personal/pago", { id: p.id, monto: Math.round(pago * 100) / 100, mes: mesBonitoP(mesP) }); avisoRapido(`Pago a ${p.nombre} anotado en Caja`); delete bPag.dataset.ok; bPag.lastChild.textContent = "Registrar pago"; } catch (e) { avisoRapido(e.message); } };
      acc.append(bTar, bPag);
      const bPin = boton("Cambiar PIN", "claro"); bPin.onclick = async () => { const pin = prompt(`Nuevo PIN para ${p.nombre} (6 a 8 números):`); if (pin == null) return; try { await api("PATCH", "/api/personal/" + p.id, { pin }); avisoRapido("PIN cambiado"); } catch (e) { avisoRapido(e.message); } };
      const bAct = boton(p.activo ? "Quitar acceso" : "Dar acceso", p.activo ? "claro" : "exito", p.activo ? "no" : "ok"); bAct.onclick = async () => { try { await api("PATCH", "/api/personal/" + p.id, { activo: !p.activo }); avisoRapido(p.activo ? `${p.nombre} ya no puede entrar` : `${p.nombre} ya puede entrar`); pintarPersonal(); } catch (e) { avisoRapido(e.message); } };
      acc.append(bPin, bAct); box.append(d);
    });
    const f = $("#personalForm");
    if (f) f.onsubmit = async (e) => { e.preventDefault(); try { await api("POST", "/api/personal", { nombre: $("#pNom").value, rol: $("#pRol").value, sede: $("#pSede").value, pin: $("#pPin").value }); avisoRapido(`Listo. ${$("#pNom").value} entra con su nombre y su PIN en la pantalla de clave.`); f.reset(); pintarPersonal(); } catch (err) { avisoRapido(err.message); } };
    const cs = $("#cerrarSesiones");
    if (cs) cs.onclick = async () => { if (!cs.dataset.ok) { cs.dataset.ok = "1"; cs.textContent = "Toca otra vez para confirmar"; return; } try { await api("POST", "/api/sesiones/cerrar"); avisoRapido("Listo: todos los demás tendrán que volver a entrar"); cs.textContent = "Cerrar sesión en todos los otros celulares"; delete cs.dataset.ok; } catch (e) { avisoRapido(e.message); } };
    const bit = $("#bitacora");
    if (bit) bit.parentElement.ontoggle = async () => { if (!bit.parentElement.open) return; try { const b = await api("GET", "/api/bitacora"); bit.innerHTML = b.length ? `<div class="scroll"><table><tbody>${b.map((x) => `<tr><td>${esc(limaISO(x.creado).slice(5).split("-").reverse().join("/"))} ${esc(new Date(Date.parse(x.creado) - 5 * 3600e3).toISOString().slice(11, 16))}</td><td><b>${esc(x.autor)}</b> ${esc(x.accion)}</td><td class="gris">${esc(x.detalle || "")}</td></tr>`).join("")}</tbody></table></div>` : '<p class="gris">Aún no hay movimientos.</p>'; } catch (e) { bit.textContent = e.message; } };
  }

  // Lo que el bot no entendió → enseñarle palabras
  const PREG_CAMPOS = [
    { k: "enLista", etiqueta: "Mostrar en la lista «Preguntas frecuentes»", check: true },
    { k: "titulo", etiqueta: "Cómo se ve en la lista (hasta 24 letras)", max: 24, ph: "¿Cuánto cuesta?" },
    { k: "palabras", etiqueta: "Palabras que la activan si la escriben", max: 300, ph: "precio, cuánto cuesta, costo", area: true },
    { k: "respuesta", etiqueta: "Respuesta del bot", max: 1000, area: true, vars: V.preguntas }];
  const nuevaPregunta = (palabras = "") => ({ id: "P" + Math.random().toString(36).slice(2, 8), titulo: "", enLista: false, palabras, respuesta: "" });
  const nombrePregunta = (p) => { if (p.titulo) return p.titulo; const w = String(p.palabras || "").split(",")[0].trim(); return w ? w.charAt(0).toUpperCase() + w.slice(1) : "(pregunta sin palabras)"; };
  async function pintarNoEntendidos() {
    const box = $("#noEnt"); if (!box) return;
    let lista;
    try { lista = await api("GET", "/api/no-entendidos"); } catch (e) { box.innerHTML = `<p class="gris">No se pudo cargar. ${esc(e.message)}</p>`; return; }
    lista = lista.filter((g) => !g.ids.every((id) => pendientesQuitar.includes(id)));
    box.innerHTML = "";
    if (!lista.length) { box.append(el("p", { className: "vacio" }, "No hay mensajes pendientes. El bot entendió todo lo que le escribieron.")); return; }
    lista.forEach((g, n) => {
      const d = el("div", { className: "item-ed" });
      const cuando = limaISO(g.ultimo) === limaHoy() ? "hoy" : limaISO(g.ultimo) === sumarDias(limaHoy(), -1) ? "ayer" : "el " + fechaBonita(limaISO(g.ultimo));
      d.innerHTML = `<p style="margin:0"><b>«${esc(g.texto)}»</b><br><span class="gris">${g.veces === 1 ? "1 vez" : g.veces + " veces"}, la última ${esc(cuando)}</span></p>
        <label>Palabras que debe reconocer <small>Deja solo lo importante, por ejemplo «qué hora son»</small><input data-ne="pal" maxlength="80"></label>
        <label>¿Qué debe responder?<select data-ne="sel"><option value="">Elige una respuesta</option>${cfg.preguntas.map((p, i) => `<option value="${i}">${esc(nombrePregunta(p))}</option>`).join("")}<option value="nueva">Una respuesta nueva</option></select></label>
        <div class="acc"></div>`;
      const pal = d.querySelector('[data-ne="pal"]'), sel = d.querySelector('[data-ne="sel"]');
      pal.value = g.texto.toLowerCase().replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
      const ens = boton("Enseñarle", "principal", "ok"), qui = boton("Quitar", "claro", "no");
      ens.onclick = () => {
        const frase = pal.value.replace(/,/g, " ").replace(/\s+/g, " ").trim();
        if (!frase) { avisoRapido("Escribe las palabras que debe reconocer"); pal.focus(); return; }
        if (!sel.value) { avisoRapido("Elige qué debe responder"); sel.focus(); return; }
        if (sel.value === "nueva") {
          if (cfg.preguntas.length >= 30) { avisoRapido("Ya hay 30 preguntas. Quita alguna en Opciones avanzadas."); return; }
          cfg.preguntas.push(nuevaPregunta(frase));
          const det = document.querySelector("#vista details.mas"); det.open = true;
          editorLista("preg", cfg.preguntas, PREG_CAMPOS, 30, () => nuevaPregunta());
          const ult = $("#preg").lastElementChild; ult.scrollIntoView({ behavior: "smooth", block: "center" }); ult.querySelector("textarea").focus();
          avisoRapido("Escribe la respuesta y toca «Guardar cambios».");
        } else {
          const p = cfg.preguntas[+sel.value];
          const ya = String(p.palabras).split(",").map((x) => x.trim().toLowerCase());
          if (!ya.includes(frase.toLowerCase())) p.palabras = [p.palabras, frase].filter(Boolean).join(", ");
          editorLista("preg", cfg.preguntas, PREG_CAMPOS, 30, () => nuevaPregunta());
          avisoRapido(`Listo. Toca «Guardar cambios» para que el bot lo aprenda.`);
        }
        pendientesQuitar.push(...g.ids); marcar(); d.remove();
        if (!box.childElementCount) box.append(el("p", { className: "vacio" }, "Listo por ahora. Recuerda guardar los cambios."));
      };
      qui.onclick = async () => {
        try { await api("POST", "/api/no-entendidos/quitar", { ids: g.ids }); d.remove(); avisoRapido("Quitado de la lista"); if (!box.childElementCount) pintarNoEntendidos(); }
        catch (e) { avisoRapido(e.message); }
      };
      d.querySelector(".acc").append(ens, qui);
      box.append(d);
    });
  }

  // Lista editable (respuestas guardadas, preguntas frecuentes)
  function editorLista(id, arr, campos, max, nuevo) {
    const box = $("#" + id); if (!box) return; box.innerHTML = "";
    arr.forEach((it, i) => {
      const d = el("div", { className: "item-ed" });
      campos.forEach((c) => {
        if (c.check) {
          const lab = el("label", { className: "switch" }); const sp = el("span", {}, c.etiqueta);
          const ch = el("input", { type: "checkbox", role: "switch", checked: !!it[c.k] }); ch.onchange = () => { it[c.k] = ch.checked; marcar(); };
          lab.append(sp, ch); d.append(lab); return;
        }
        const lab = el("label"); lab.textContent = c.etiqueta;
        const inp = c.area ? el("textarea", { maxLength: c.max }) : el("input", { maxLength: c.max, placeholder: c.ph || "" });
        inp.value = it[c.k] || ""; inp.oninput = () => { it[c.k] = inp.value; marcar(); };
        lab.append(inp); d.append(lab);
        if (c.vars) {
          const vs = el("div", { className: "vars" });
          c.vars.forEach((x) => { const b = el("button", { type: "button" }, "+ " + (NOMBRES_VAR[x] || x)); b.onclick = () => { const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + `{${x}}` + inp.value.slice(inp.selectionEnd ?? p); inp.dispatchEvent(new Event("input")); inp.focus(); }; vs.append(b); });
          d.append(vs);
        }
      });
      const q = boton("Quitar", "claro", "no"); q.onclick = () => { arr.splice(i, 1); editorLista(id, arr, campos, max, nuevo); marcar(); };
      const w = el("div"); w.append(q); d.append(w); box.append(d);
    });
    const add = $("#" + id + "Add"); add.disabled = arr.length >= max;
    add.onclick = () => { arr.push(nuevo()); editorLista(id, arr, campos, max, nuevo); marcar(); const u = box.lastElementChild; if (u) u.querySelector("input,textarea").focus(); };
  }

  function contadores() {
    document.querySelectorAll("#vista [data-c]").forEach((c) => { const val = llenar(get(cfg, c.dataset.c) || "", { humano: cfg.nombreHumano }); c.textContent = `(${val.length} de 20 letras)`; c.classList.toggle("mal", val.length > 20); });
  }
  function marcar() { A.sinGuardar = true; $("#msgCfg").textContent = "Tienes cambios sin guardar"; }
  function pintarEdades() {
    const box = $("#edades"); box.innerHTML = "";
    cfg.edades.forEach((e, i) => {
      const d = el("div", { className: "edad" });
      d.innerHTML = `<label>Título <small>(hasta 24 letras)</small><input maxlength="24" data-e="${i}.titulo"></label><label>Descripción<input maxlength="72" data-e="${i}.desc"></label>
        <label>Desde (años)<input type="number" min="0" max="99" data-e="${i}.min"></label><label>Hasta (años)<input type="number" min="0" max="99" data-e="${i}.max"></label>
        <label class="ancho">Mensaje extra para esta edad <small>(opcional)</small><input maxlength="300" data-e="${i}.mensaje"></label>
        <div><button type="button" class="btn claro" data-quitar="${i}" ${cfg.edades.length < 2 ? "disabled" : ""}>Quitar este rango</button></div>`;
      box.append(d);
    });
    box.querySelectorAll("[data-e]").forEach((inp) => { const [i, k] = inp.dataset.e.split("."); inp.value = cfg.edades[+i][k] ?? ""; inp.oninput = () => { cfg.edades[+i][k] = inp.type === "number" ? Number(inp.value) : inp.value; marcar(); preview(); }; });
    box.querySelectorAll("[data-quitar]").forEach((b) => (b.onclick = () => { cfg.edades.splice(+b.dataset.quitar, 1); pintarEdades(); marcar(); preview(); }));
    $("#addEdad").disabled = cfg.edades.length >= 10;
  }
  function bindings() {
    document.querySelectorAll("#vista [data-r]").forEach((i) => {
      i.oninput = i.onchange = () => {
        let val = i.type === "checkbox" ? i.checked : i.value;
        if (i.type === "number" || ["clasePrueba.diaSemana", "atencion.desde", "atencion.hasta"].includes(i.dataset.r)) val = Number(val);
        set(cfg, i.dataset.r, val); contadores(); preview(); marcar();
      };
    });
    document.querySelectorAll("#vista .vars[data-para] button").forEach((c) => (c.onclick = () => {
      const t = document.querySelector(`#vista [data-r="textos.${c.parentElement.dataset.para}"]`); if (!t) return;
      const s = t.selectionStart ?? t.value.length; t.value = t.value.slice(0, s) + `{${c.dataset.v}}` + t.value.slice(t.selectionEnd ?? s); t.dispatchEvent(new Event("input")); t.focus();
    }));
    $("#addEdad").onclick = () => { cfg.edades.push({ id: "E" + Math.random().toString(36).slice(2, 8), titulo: "", desc: "", min: 0, max: 0, mensaje: "" }); pintarEdades(); marcar(); };
    $("#guardarCfg").onclick = async () => {
      $("#errs").innerHTML = ""; $("#msgCfg").textContent = "Guardando…";
      try {
        const r = await api("PUT", "/api/config", cfg); A.cfg = JSON.parse(JSON.stringify(cfg)); A.cambios = r.cambios; A.sinGuardar = false; $("#msgCfg").textContent = "Guardado. El bot ya responde así."; $("#deshacerCfg").hidden = false; avisoRapido("Cambios guardados");
        if (pendientesQuitar.length) { const ids = pendientesQuitar; pendientesQuitar = []; api("POST", "/api/no-entendidos/quitar", { ids }).catch(() => {}); }
      }
      catch (e) { $("#msgCfg").textContent = "No se guardó. Corrige lo que aparece en rojo:"; (e.datos && e.datos.errores ? e.datos.errores : [e.message]).forEach((t) => $("#errs").append(el("li", {}, t))); $("#errs").scrollIntoView({ behavior: "smooth", block: "center" }); }
    };
    let c1 = false, c2 = false;
    $("#deshacerCfg").onclick = async () => {
      if (!c1) { c1 = true; $("#deshacerCfg").textContent = "Toca otra vez para volver a como estaba"; return; }
      try { await api("POST", "/api/config/deshacer"); const c = await api("GET", "/api/config"); A.cfg = c.config; A.cambios = c.cambios; A.sinGuardar = false; window.pintar(); avisoRapido("Listo, se volvió a la versión anterior"); }
      catch (e) { avisoRapido(e.message); }
    };
    $("#restaurar").onclick = async () => {
      if (!c2) { c2 = true; $("#restaurar").textContent = "Toca otra vez para restaurar"; return; }
      await api("POST", "/api/config/restaurar"); const c = await api("GET", "/api/config"); A.cfg = c.config; A.cambios = c.cambios; A.sinGuardar = false; window.pintar(); avisoRapido("Se restauraron los valores iniciales. Puedes deshacerlo con «Volver a como estaba».");
    };
  }
  function preview() {
    const p = $("#prev"); if (!p) return;
    const T = cfg.textos, sedeId = SEDE_IDS.find((id) => cfg.sedes[id].activa) || "LO", s = cfg.sedes[sedeId], e = cfg.edades[0] || {};
    const vs = { sede: s.nombre, lugar: s.lugar, direccion: s.direccion ? " — " + s.direccion : "", mapa: s.mapa ? "\n" + s.mapa : "", horario: s.horario || "Te confirmamos el horario por este medio.", clases: cfg.clasesVerano, precio: cfg.precioVerano, precioCiclo: cfg.precioCiclo, uniforme: `Uniforme (camiseta, short y medias): ~S/ ${cfg.uniforme}~ *S/ ${cfg.uniformePreventa}* si te inscribes hasta el ${cfg.finPreventa}` };
    const H = cfg.nombreHumano, enlace = "https://wa.me/" + cfg.whatsappHumano + "?text=…";
    const bub = (t, b, yo) => `<div class="bub${yo ? " yo" : ""}">${esc(t)}${b ? `<div class="btns">${b.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}</div>`;
    const dia = DIAS[cfg.clasePrueba.diaSemana];
    p.innerHTML = (cfg.activo ? [
      bub("Hola, quiero información", null, true), bub(llenar(T.saludo, { nombre: "Rosa", escuela: cfg.escuela }), [T.botonEdad]),
      bub(e.titulo || "", null, true), bub(T.preguntaSede, SEDE_IDS.filter((id) => cfg.sedes[id].activa).map((id) => cfg.sedes[id].corto)),
      bub(s.corto, null, true), bub(llenar(T.info, vs) + (e.mensaje ? "\n\n" + e.mensaje : "")),
      bub(T.preguntaAccion, [llenar(T.botonClase, {}), llenar(T.botonInscribir, {}), llenar(T.botonHumano, { humano: H })]),
      bub(llenar(T.botonClase, {}), null, true), bub(llenar(T.preguntaFecha, { hora: cfg.clasePrueba.hora || "" }), [T.botonFecha]),
      bub(dia + " 21 nov", null, true), bub(T.pedirNombre), bub("Rosa María", null, true),
      bub(llenar(T.confirmacion, { ...vs, nombre: "Rosa", fecha: dia.toLowerCase() + " 21 de noviembre", hora: cfg.clasePrueba.hora || "hora por confirmar", queTraer: cfg.clasePrueba.queTraer })),
      bub("Quiero inscribirlo", null, true), bub(llenar(cfg.atencion.modo === "panel" ? T.derivarInscribirPanel : T.derivarInscribir, { humano: H, enlace })),
    ] : [bub("Hola, quiero información", null, true), bub(llenar(T.pausado, { escuela: cfg.escuela, humano: H, enlace }))]).join("");
  }
}

function appAyuda() {
  const A = window.APP;
  window.registrarVista("ayuda", () => {
    const v = $("#vista"); const s = A.cfg.soporte || {};
    const ayuda = s.whatsapp
      ? `<div><a class="btn wa" href="https://wa.me/${esc(s.whatsapp)}?text=${encodeURIComponent("Hola, necesito ayuda con el panel Coyote.")}" target="_blank" rel="noopener">${ico("wa")}Pedir ayuda a ${esc(s.nombre || "soporte")}</a></div>`
      : `<p>Si algo no funciona, escríbele a ${esc(s.nombre || "quien instaló el bot")}.</p>`;
    v.innerHTML = `<div class="titulo-vista"><h2>Cómo se usa</h2><p>Lo más importante, paso a paso.</p></div>
    <section class="tarjeta"><ol class="pasos">
      <li><b>Cada mañana</b> te llega a tu WhatsApp un resumen: quién quiere inscribirse y qué clases de prueba hay.</li>
      <li><b>Cuando alguien quiere inscribirse o hablar contigo</b>, te llega un aviso. Toca el enlace del aviso: se abre su chat aquí mismo.</li>
      <li>En <b>Chats</b> respondes con el mismo número del bot. Mientras tú atiendes un chat, el bot no se mete. Cuando termines, toca <b>Devolver al bot</b>.</li>
      <li>Usa las <b>respuestas guardadas</b> (los botones encima de donde escribes) para no teclear lo mismo cada vez.</li>
      <li>Si pasaron <b>más de 24 horas</b> desde el último mensaje del papá o mamá, WhatsApp solo deja enviar el mensaje para retomar. Cuando te respondan, ya puedes escribir normal.</li>
      <li>Cuando alguien manda la captura del Yape, te llega un aviso y aparece en <b>Hoy → Comprobantes</b>. Revísala en su chat y toca <b>Se inscribió</b>: eliges si pagó el verano, un ciclo u <b>otro plan</b> (escribes cuántas clases). El panel te dice a cuánto sale cada clase, y el bot invita a renovar cuando le queden 2 clases.</li>
      <li><b>Después de cada entrenamiento</b>, en <b>Hoy → Pasar lista</b>, marca quién vino. Si alguien falta 2 veces seguidas, el bot le escribe a sus papás.</li>
      <li>En un chat puedes <b>mantener presionado el micrófono</b> para mandar un audio.</li>
      <li><b>Carnet QR:</b> al inscribirse, el bot le manda al papá el carnet digital. En la cancha, en <b>Hoy → Pasar lista → Escanear carnet</b>, apunta la cámara al código y queda marcada la asistencia con la hora. Si el papá no lo tiene, escribe el código o marca a mano.</li>
      <li><b>Caja</b> (en Números): las inscripciones entran solas; anota los gastos de cancha, profesores y uniformes, y ve cuánto queda cada mes por sede.</li>
      <li><b>Después de cada clase de prueba</b>, marca <b>Sí vino</b> o <b>No vino</b>.</li>
      <li><b>Cada lunes</b>, en <b>Números</b>, anota cuánto se gastó en anuncios.</li>
      <li><b>Una vez por semana</b>, en <b>Ajustes → Lo que el bot no entendió</b>, enséñale las preguntas nuevas: elige qué debía responder y toca <b>Enseñarle</b>.</li>
      <li>Si te equivocas, toca <b>Deshacer</b> en el mensaje negro que aparece abajo.</li>
      <li><b>Venta en la cancha:</b> en Hoy → «Registrar una venta en la cancha» anotas nombre, celular, plan y monto; la persona queda inscrita, el pago entra en Caja y se crea su carnet QR.</li>
      <li><b>Personal:</b> en Ajustes → Personal agregas a tus profesores con un PIN. Entran al panel desde su celular eligiendo «Profesor o personal» y ven solo su sede.</li>
      <li>El panel funciona igual en <b>laptop o computadora</b>: entra a la misma dirección desde el navegador; las pestañas aparecen arriba.</li>
    </ol></section>
    <section class="tarjeta"><h3>Lo que el bot hace solo</h3><ul class="pasos">
      <li>Responde a los padres a cualquier hora con precios, horarios y sedes, aunque escriban la pregunta a su manera. También les muestra una lista de preguntas frecuentes para tocar.</li>
      <li>Al confirmar la clase, envía la ubicación de la cancha como punto en el mapa.</li>
      <li>Agenda la clase de prueba gratis y les recuerda el día antes. Ellos confirman con un botón.</li>
      <li>Al día siguiente de la clase, les pregunta qué tal les fue y los invita a inscribirse.</li>
      <li>Si alguien deja la conversación a medias, le vuelve a escribir una sola vez.</li>
      <li>Si alguien escribe «BAJA», deja de recibir promociones.</li>
    </ul></section>
    <section class="tarjeta"><h3>Tenerlo como app en tu celular</h3>
      <p><b>Android (Chrome):</b> toca los tres puntitos de arriba a la derecha, luego «Agregar a la pantalla principal» y «Agregar».</p>
      <p><b>iPhone (Safari):</b> toca el botón de compartir de abajo, luego «Agregar a inicio» y «Agregar».</p>
      <p class="gris">Aparecerá el escudo rojo de Coyote como cualquier app. Tu clave queda guardada por 3 meses.</p></section>
    <section class="tarjeta"><h3>Qué significa cada estado</h3><ul class="pasos" style="list-style:none;padding:0">
      <li><span class="chip">Consulta</span><br>Escribió al bot, pero aún no agenda clase.</li>
      <li><span class="chip agendada">Clase agendada</span><br>Tiene día para su clase de prueba gratis.</li>
      <li><span class="chip asistio">Asistió a la clase</span><br>Vino a la clase de prueba.</li>
      <li><span class="chip quiere_inscribirse">Quiere inscribirse</span><br>Pidió inscribirse: escríbele pronto.</li>
      <li><span class="chip inscrito">Inscrito</span><br>Ya pagó.</li>
      <li><span class="chip">No se inscribió</span><br>No le interesó o no vino.</li>
    </ul></section>
    <section class="tarjeta"><h3>¿Algo no funciona?</h3>${ayuda}</section>`;
  });
}
