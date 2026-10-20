// Escuela Coyote — bot de WhatsApp y panel de consultas
// Rutas:
//   GET  /webhook          verificación de Meta
//   POST /webhook          mensajes entrantes (firma verificada)
//   GET  /entrar, POST     pantalla de clave (recuerda la sesión 90 días)
//   GET  /salir            cerrar sesión
//   GET  /panel            panel de Katy
//   /api/*                 datos del panel
// Cron cada hora: automatizaciones (ver tareasDeLaHora en bot.js).

import { ESTADOS, SEDE_IDS, cargarConfig, guardarConfig, restaurarConfig, deshacerConfig, cambiosGuardados, validarConfig, leerValor, guardarValor, listaNumeros, DEFAULTS } from "./config.js";
import { verificarFirma, igualSeguro, describirEntrante, registrar, wa } from "./whatsapp.js";
import { atenderMensaje, tareasDeLaHora, cambiarAtencion, avisar, avisarSiguienteEnEspera, revisarCupos, copiaSeguridad } from "./bot.js";
import { sumarDias, limaHoy } from "./fechas.js";
import { resumenCampanas, enviarTanda, avisoSede, cuantosEnSede } from "./campanas.js";
import { panelHTML, entrarHTML } from "./panel.js";
import { webHTML } from "./web.js";
import { carnetHTML, nuevoToken, qrSVG } from "./carnet.js";
import { privacidadHTML } from "./privacidad.js";
import { ICONO_192, ICONO_512 } from "./iconos.js";
import { ahoraISO } from "./fechas.js";

const DIAS_SESION = 90;
const enc = new TextEncoder();

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
// Cabeceras de seguridad para todas las páginas: nadie puede meter el panel en un iframe,
// solo se cargan scripts propios y fuentes de Google, y la cámara/micrófono solo en el panel.
const SEGURIDAD = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'",
};
const html = (cuerpo, status = 200, extra = {}) =>
  new Response(cuerpo, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...SEGURIDAD, ...extra } });

// Fuerza bruta en /entrar: 8 fallos seguidos por IP o por nombre → 15 minutos de espera
async function intentoPermitido(env, clave) {
  const r = await env.DB.prepare("SELECT fallos, bloqueado_hasta FROM intentos WHERE clave = ?").bind(clave).first();
  return !(r?.bloqueado_hasta && r.bloqueado_hasta > ahoraISO());
}
async function anotarFallo(env, clave) {
  const r = await env.DB.prepare("SELECT fallos FROM intentos WHERE clave = ?").bind(clave).first();
  const fallos = (r?.fallos || 0) + 1;
  const bloqueo = fallos >= 8 ? new Date(Date.now() + 15 * 60e3).toISOString() : null;
  await env.DB.prepare("INSERT INTO intentos (clave, fallos, bloqueado_hasta, actualizado) VALUES (?, ?, ?, ?) ON CONFLICT(clave) DO UPDATE SET fallos = excluded.fallos, bloqueado_hasta = excluded.bloqueado_hasta, actualizado = excluded.actualizado")
    .bind(clave, bloqueo ? 0 : fallos, bloqueo, ahoraISO()).run();
  return !!bloqueo;
}
const limpiarFallos = (env, clave) => env.DB.prepare("DELETE FROM intentos WHERE clave = ?").bind(clave).run().catch(() => {});

// ---------- Sesión ----------

async function firmar(env, texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode("sesion:" + env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, enc.encode(texto));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// La cookie guarda: vencimiento . rol . id . firma. Rol "admin" es Katy; "personal" es un profesor o asistente.
async function sesionValida(req, env) {
  if (!env.ADMIN_PASSWORD) return null;
  const m = (req.headers.get("Cookie") || "").match(/(?:^|;\s*)coyote_sesion=(\d+)\.(admin|personal)\.(\d+)\.([a-f0-9]{64})/);
  if (!m || Number(m[1]) < Date.now()) return null;
  if (!igualSeguro(await firmar(env, `${m[1]}.${m[2]}.${m[3]}`), m[4])) return null;
  if (m[2] === "admin") return { rol: "admin", nombre: null, sede: null };
  const p = await env.DB.prepare("SELECT id, nombre, rol, sede FROM personal WHERE id = ? AND activo = 1").bind(Number(m[3])).first();
  return p ? { rol: "personal", id: p.id, nombre: p.nombre, cargo: p.rol, sede: p.sede || null } : null;
}

async function cookieSesion(env, url, rol = "admin", id = 0) {
  const dias = rol === "admin" ? DIAS_SESION : 30; // el personal vuelve a entrar cada mes
  const exp = Date.now() + dias * 86400000;
  const seguro = url.protocol === "https:" ? "; Secure" : "";
  const cuerpo = `${exp}.${rol}.${id}`;
  return `coyote_sesion=${cuerpo}.${await firmar(env, cuerpo)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${dias * 86400}${seguro}`;
}

async function hashPin(env, pin) {
  const k = await crypto.subtle.digest("SHA-256", enc.encode(`pin:${env.ADMIN_PASSWORD}:${pin}`));
  return [...new Uint8Array(k)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const anotar = (env, autor, accion, detalle) =>
  env.DB.prepare("INSERT INTO bitacora (autor, accion, detalle, creado) VALUES (?, ?, ?, ?)").bind(autor, accion, detalle ? String(detalle).slice(0, 200) : null, ahoraISO()).run().catch(() => {});

// ---------- Webhook ----------

const VENTANA_MS = 24 * 3600e3;
const ventanaAbierta = (lead) => !!lead?.ultimo_entrante && Date.now() - Date.parse(lead.ultimo_entrante) < VENTANA_MS;

async function primeraVez(env, id) {
  const r = await env.DB.prepare("INSERT OR IGNORE INTO mensajes_procesados (id, creado) VALUES (?, ?)").bind(id, ahoraISO()).run();
  return !!r.meta.changes;
}

const marcarConocido = (env, waId) =>
  env.DB.prepare("INSERT OR IGNORE INTO contactos_conocidos (wa_id, creado) VALUES (?, ?)").bind(waId, ahoraISO()).run();

async function procesarWebhook(env, cuerpo) {
  const cfg = await cargarConfig(env);
  const excluidos = new Set(listaNumeros(cfg.atencion?.excluidos));

  for (const entrada of cuerpo.entry || []) {
    for (const cambio of entrada.changes || []) {
      const v = cambio.value || {};

      // Número compartido con la app del celular (coexistencia) ----------
      // 1) Historial importado: quienes ya conversaban con Katy
      for (const h of v.history || []) {
        for (const t of h.threads || []) if (t.id && !excluidos.has(t.id)) await marcarConocido(env, t.id);
      }
      // 2) Lo que Katy escribe desde la app del celular: se ve en el panel y el bot se calla en ese chat
      for (const eco of v.message_echoes || []) {
        const para = eco.to;
        if (!para || excluidos.has(para) || !(await primeraVez(env, eco.id))) continue;
        const lead = await env.DB.prepare("SELECT id FROM leads WHERE wa_id = ?").bind(para).first();
        if (!lead) { await marcarConocido(env, para); continue; } // conversación personal: no se guarda
        const d = describirEntrante(eco);
        await registrar(env, para, "katy", d.tipo, d.texto, d.media, eco.id);
        await cambiarAtencion(env, para, "humano");
        await env.DB.prepare("UPDATE leads SET no_leidos = 0 WHERE wa_id = ?").bind(para).run();
      }

      // Mensajes de los padres ----------
      const perfiles = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name]));
      for (const msg of v.messages || []) {
        if (!msg.from || excluidos.has(msg.from)) continue; // números que el bot no atiende: ni se guardan
        if (!(await primeraVez(env, msg.id))) continue; // Meta puede reenviar el mismo aviso
        try {
          let lead = await env.DB.prepare("SELECT atencion FROM leads WHERE wa_id = ?").bind(msg.from).first();
          if (!lead && cfg.atencion?.soloNuevos) {
            const conocido = await env.DB.prepare("SELECT 1 FROM contactos_conocidos WHERE wa_id = ?").bind(msg.from).first();
            if (conocido) continue; // ya conversaba con Katy en su celular: lo sigue atendiendo ella
          }
          const d = describirEntrante(msg);
          await registrar(env, msg.from, "padre", d.tipo, d.texto, d.media, msg.id);
          // Foto o documento de alguien que está inscribiéndose: casi seguro es el comprobante de pago
          if (["imagen", "documento"].includes(d.tipo) && d.media) {
            const l = await env.DB.prepare("SELECT estado, atencion, padre, perfil FROM leads WHERE wa_id = ?").bind(msg.from).first();
            if (l && (l.estado === "quiere_inscribirse" || l.atencion === "humano" || l.estado === "inscrito")) {
              await env.DB.prepare("UPDATE leads SET comprobante = ?, comprobante_creado = ?, atencion = 'humano', atencion_desde = ?, no_leidos = no_leidos + 1, actualizado = ? WHERE wa_id = ?")
                .bind(d.media, ahoraISO(), ahoraISO(), ahoraISO(), msg.from).run();
              await wa.texto(env, msg.from, cfg.textos.comprobante.replace(/\{humano\}/g, cfg.nombreHumano));
              const url = await leerValor(env, "url_panel");
              await avisar(env, cfg, `${l.padre || l.perfil || "Un papá o mamá"} envió un comprobante de pago. Revísalo y marca «Se inscribió»${url ? `: ${url}#chat-${msg.from}` : ""}`);
              await env.DB.prepare("UPDATE leads SET ultimo_entrante = ? WHERE wa_id = ?").bind(ahoraISO(), msg.from).run();
              continue;
            }
          }
          await atenderMensaje(env, msg, perfiles[msg.from]);
          await env.DB.prepare("UPDATE leads SET ultimo_entrante = ? WHERE wa_id = ?").bind(ahoraISO(), msg.from).run();
          // Doble check azul solo si respondió el bot; si atiende Katy, se marca cuando ella abre el chat
          lead = await env.DB.prepare("SELECT atencion FROM leads WHERE wa_id = ?").bind(msg.from).first();
          if (lead?.atencion !== "humano") await wa.leido(env, msg.id);
        } catch (e) {
          console.log("Error atendiendo mensaje", msg.id, e?.stack || e);
        }
      }
    }
  }
}

// ---------- Bandeja de chats ----------

async function apiChats(req, env, url, cfg) {
  const ruta = url.pathname;
  const m = req.method;

  if (ruta === "/api/chats" && m === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT l.id, l.wa_id, l.padre, l.perfil, l.sede, l.edad, l.estado, l.atencion, l.atencion_desde, l.ultimo_entrante, l.no_leidos,
              u.texto AS ultimo_texto, u.autor AS ultimo_autor, u.tipo AS ultimo_tipo, u.creado AS ultimo_creado
         FROM leads l JOIN mensajes u ON u.id = (SELECT MAX(id) FROM mensajes WHERE wa_id = l.wa_id)
        WHERE l.archivado = 0
        ORDER BY u.id DESC LIMIT 300`,
    ).all();
    const esperando = results.filter((c) => c.atencion === "humano" && c.no_leidos > 0).length;
    return json({ chats: results.map((c) => ({ ...c, ventana: ventanaAbierta(c) })), esperando });
  }

  const mc = ruta.match(/^\/api\/chats\/(\d{8,15})(?:\/(\w+))?$/);
  if (!mc) return null;
  const waId = mc[1];
  const accion = mc[2] || "";
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE wa_id = ?").bind(waId).first();
  if (!lead) return json({ error: "No encontramos ese chat" }, 404);

  if (!accion && m === "GET") {
    const antes = Number(url.searchParams.get("antes")) || 1e15;
    const { results } = await env.DB.prepare("SELECT id, autor, tipo, texto, media_id, creado FROM mensajes WHERE wa_id = ? AND id < ? ORDER BY id DESC LIMIT 150")
      .bind(waId, antes).all();
    const hasta = lead.ultimo_entrante ? new Date(Date.parse(lead.ultimo_entrante) + VENTANA_MS).toISOString() : null;
    return json({ lead, mensajes: results.reverse(), ventana: ventanaAbierta(lead), ventanaHasta: hasta });
  }

  if (accion === "leido" && m === "POST") {
    await env.DB.prepare("UPDATE leads SET no_leidos = 0 WHERE wa_id = ?").bind(waId).run();
    const ultimo = await env.DB.prepare("SELECT wamid FROM mensajes WHERE wa_id = ? AND autor = 'padre' AND wamid IS NOT NULL ORDER BY id DESC LIMIT 1").bind(waId).first();
    if (ultimo?.wamid) await wa.leido(env, ultimo.wamid);
    return json({ ok: true });
  }

  if (accion === "enviar" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    const texto = String(b.texto || "").trim().slice(0, 4000);
    if (!texto) return json({ error: "Escribe un mensaje" }, 400);
    if (!ventanaAbierta(lead)) {
      return json({ error: "Pasaron más de 24 horas desde su último mensaje. WhatsApp solo deja enviar el mensaje para retomar la conversación.", ventana: false }, 409);
    }
    const ok = await wa.texto(env, waId, texto, "katy");
    if (!ok) return json({ error: "WhatsApp no aceptó el mensaje. Intenta de nuevo en un momento." }, 502);
    await cambiarAtencion(env, waId, "humano");
    await env.DB.prepare("UPDATE leads SET no_leidos = 0, actualizado = ? WHERE wa_id = ?").bind(ahoraISO(), waId).run();
    return json({ ok: true });
  }

  if (accion === "audio" && m === "POST") {
    if (!ventanaAbierta(lead)) return json({ error: "Pasaron más de 24 horas desde su último mensaje. Envía primero el mensaje para retomar.", ventana: false }, 409);
    const mime = (req.headers.get("Content-Type") || "").split(";")[0].trim();
    if (!["audio/mp4", "audio/aac", "audio/mpeg", "audio/ogg", "audio/amr"].includes(mime)) return json({ error: "Este navegador graba en un formato que WhatsApp no acepta. Prueba desde Chrome actualizado o Safari." }, 415);
    const cuerpo = await req.arrayBuffer();
    if (cuerpo.byteLength < 1000) return json({ error: "El audio quedó vacío. Mantén presionado el botón mientras hablas." }, 400);
    if (cuerpo.byteLength > 15e6) return json({ error: "El audio es muy largo (máximo unos 10 minutos)." }, 413);
    const id = await wa.audio(env, waId, cuerpo, mime);
    if (!id) return json({ error: "WhatsApp no aceptó el audio. Intenta de nuevo." }, 502);
    await cambiarAtencion(env, waId, "humano");
    await env.DB.prepare("UPDATE leads SET no_leidos = 0, actualizado = ? WHERE wa_id = ?").bind(ahoraISO(), waId).run();
    return json({ ok: true });
  }

  if (accion === "retomar" && m === "POST") {
    const nombre = String(lead.padre || lead.perfil || "").trim().split(/\s+/)[0] || "¿cómo estás?";
    const ok = await wa.plantilla(env, waId, cfg.atencion.plantillaRetomar, cfg.plantillaRecordatorio?.idioma || "es", [nombre, cfg.nombreHumano], [], { autor: "katy" });
    if (!ok) return json({ error: "WhatsApp no aceptó el mensaje. Revisa que la plantilla «" + cfg.atencion.plantillaRetomar + "» esté aprobada en Meta." }, 502);
    await cambiarAtencion(env, waId, "humano");
    await env.DB.prepare("UPDATE leads SET no_leidos = 0 WHERE wa_id = ?").bind(waId).run();
    return json({ ok: true });
  }

  if (accion === "atencion" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!["humano", "bot"].includes(b.modo)) return json({ error: "Modo no válido" }, 400);
    await cambiarAtencion(env, waId, b.modo);
    if (b.modo === "bot") await env.DB.prepare("UPDATE sesiones SET paso = 'fin' WHERE wa_id = ?").bind(waId).run();
    return json({ ok: true });
  }

  return json({ error: "No encontrado" }, 404);
}

// ---------- API del panel ----------

const ESTADOS_VALIDOS = Object.keys(ESTADOS);

// Cuando Katy marca «Se inscribió»: ingreso en Caja y carnet QR por WhatsApp
async function alInscribir(env, idLead, { monto, clases, cfg, metodo, saldo }, origen, autor = "Katy") {
  const l = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(idLead).first();
  if (!l) return;
  if (monto > 0) {
    await env.DB.prepare("INSERT INTO movimientos (fecha, tipo, categoria, sede, monto, nota, lead_id, autor, creado) VALUES (?, 'ingreso', 'Inscripción', ?, ?, ?, ?, ?, ?)")
      .bind(limaHoy(), l.sede, monto, `${l.padre || l.perfil || ""} · ${clases} clases${metodo ? ` · ${metodo}` : ""}${saldo ? ` · debe S/ ${saldo}` : ""}`.trim(), idLead, autor, ahoraISO()).run();
  }
  await revisarCupos(env, cfg, l.sede).catch(() => {});
  if (!cfg.carnetQR?.activo) return;
  let token = l.token;
  if (!token) { token = nuevoToken(); await env.DB.prepare("UPDATE leads SET token = ? WHERE id = ?").bind(token, idLead).run(); }
  if (!l.wa_id) return; // sin celular: el carnet se muestra o imprime desde el panel
  const base = (await leerValor(env, "url_panel") || `${origen}/panel`).replace(/\/panel$/, "");
  const enlace = `${base}/carnet/${token}`;
  if (ventanaAbierta(l)) await wa.texto(env, l.wa_id, cfg.textos.carnet.replace(/\{enlace\}/g, enlace), "bot");
  else await env.DB.prepare("UPDATE leads SET nota = COALESCE(nota, '') || ? WHERE id = ?").bind(" · Carnet pendiente de enviar (ventana cerrada)", idLead).run();
}

const horaLimaTxt = () => { const d = new Date(Date.now() - 5 * 3600e3); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };

// Lo que puede hacer el personal de una sede.
// Profesor o asistente: ver personas, pasar lista, escanear carnets, marcar su entrada y salida.
// Administrativo de sede: además registra ventas (paquetes publicados), cobra y anota en caja.
const vende = (sesion) => sesion.rol === "admin" || sesion.cargo === "Administrativo de sede";
function permitidoPersonal(m, p, sesion) {
  if (m === "GET" && ["/api/leads", "/api/config", "/api/asistencia", "/api/jornada", "/api/uniformes", "/api/estado"].includes(p)) return true;
  if (m === "POST" && /^\/api\/leads\/\d+\/uniforme$/.test(p)) return true;
  if (m === "POST" && ["/api/leads", "/api/asistencia/escanear", "/api/jornada"].includes(p)) return true;
  if (m === "PUT" && p === "/api/asistencia") return true;
  if (m === "PATCH" && /^\/api\/leads\/\d+$/.test(p)) return true;
  if (m === "POST" && /^\/api\/leads\/\d+\/carnet$/.test(p)) return true;
  if (vende(sesion)) {
    if (m === "GET" && p === "/api/caja") return true;
    if (m === "POST" && ["/api/ventas", "/api/caja"].includes(p)) return true;
  }
  return false;
}

async function api(req, env, url, ctx, sesion = { rol: "admin" }) {
  const ruta = url.pathname;
  const m = req.method;
  const autor = sesion.rol === "admin" ? "Katy" : sesion.nombre;
  const soloSede = sesion.rol === "personal" ? sesion.sede : null; // el personal ve solo su sede

  if (ruta === "/api/leads" && m === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT l.*, (SELECT COUNT(*) FROM asistencias a WHERE a.lead_id = l.id AND a.presente = 1 AND a.fecha >= COALESCE(l.inscrito_desde, '0000')) AS clases_usadas " +
      `FROM leads l WHERE archivado = 0${soloSede ? " AND sede = ?" : ""} ORDER BY actualizado DESC LIMIT 3000`).bind(...(soloSede ? [soloSede] : [])).all();
    // El personal no ve los celulares completos
    return json(sesion.rol === "personal" ? results.map((l) => ({ ...l, wa_id: l.wa_id ? l.wa_id.slice(0, 5) + "•••" + l.wa_id.slice(-2) : null })) : results);
  }
  if (ruta === "/api/leads" && m === "POST") {
    const b = await req.json();
    if (soloSede) b.sede = soloSede;
    if (!b.padre || !SEDE_IDS.includes(b.sede)) return json({ error: "Falta el nombre o la sede" }, 400);
    const ahora = ahoraISO();
    ctx.waitUntil(anotar(env, autor, "anotó persona", b.padre));
    try {
      await env.DB.prepare(
        "INSERT INTO leads (wa_id, padre, edad, sede, origen, estado, creado, actualizado) VALUES (?, ?, ?, ?, ?, 'consulta', ?, ?)",
      ).bind(b.wa_id || null, String(b.padre).slice(0, 40), b.edad ? String(b.edad).slice(0, 20) : null, b.sede, String(b.origen || "Manual").slice(0, 40), ahora, ahora).run();
    } catch (e) {
      return json({ error: "Ese celular ya está en la lista" }, 409);
    }
    return json({ ok: true }, 201);
  }
  // Venta en la cancha: crea la persona ya inscrita, con su pago en Caja y su carnet
  if (ruta === "/api/ventas" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    const sede = soloSede || b.sede;
    if (!b.padre || !SEDE_IDS.includes(sede)) return json({ error: "Falta el nombre o la sede" }, 400);
    const cfg = await cargarConfig(env), r = cfg.automatizaciones.renovacion || {};
    if (sesion.rol === "personal" && !cfg.personalPlanesLibres) {
      if (b.plan === "otro") return json({ error: "Los planes a medida los registra la administradora. Vende el paquete de verano o el ciclo de 12 clases." }, 403);
      const precio = b.plan === "ciclo" ? cfg.precioCiclo : cfg.precioVerano;
      if (Number(b.monto) !== precio) return json({ error: `El ${b.plan === "ciclo" ? "ciclo" : "paquete de verano"} cuesta S/ ${precio}. Si cobraste otro monto, avísale a la administradora para que lo registre.` }, 403);
    }
    let clases = b.plan === "ciclo" ? 12 : cfg.clasesVerano, semanas = b.plan === "ciclo" ? r.semanasCiclo || 4 : r.semanasVerano || 8;
    if (b.plan === "otro") { clases = Number(b.clases); if (!Number.isInteger(clases) || clases < 1 || clases > 200) return json({ error: "Escribe cuántas clases pagó" }, 400); semanas = Math.ceil(clases / 3) + 1; }
    const monto = Number(b.monto); if (!(monto >= 0)) return json({ error: "Escribe cuánto pagó" }, 400);
    const saldo = Math.max(0, Number(b.saldo) || 0);
    if (saldo > 0 && (!cfg.cuotas?.permitir || (sesion.rol === "personal" && !cfg.personalPlanesLibres))) return json({ error: "Las ventas en cuotas las registra la administradora" }, 403);
    const cuotaVence = saldo > 0 ? (/^\d{4}-\d{2}-\d{2}$/.test(b.cuota_vence || "") ? b.cuota_vence : sumarDias(limaHoy(), cfg.cuotas?.diasPorDefecto || 15)) : null;
    let tel = String(b.wa_id || "").replace(/\D/g, ""); if (/^9\d{8}$/.test(tel)) tel = "51" + tel;
    if (tel && !/^\d{9,15}$/.test(tel)) return json({ error: "El celular no parece válido" }, 400);
    const ahora = ahoraISO(), hoy = limaHoy();
    let id;
    const existe = tel ? await env.DB.prepare("SELECT id FROM leads WHERE wa_id = ?").bind(tel).first() : null;
    if (existe) {
      id = existe.id;
      await env.DB.prepare("UPDATE leads SET padre = ?, edad = COALESCE(?, edad), sede = ?, estado = 'inscrito', monto = ?, clases_pagadas = ?, inscrito_desde = ?, fin_ciclo = ?, renovacion_enviada = 0, archivado = 0, comprobante = NULL, saldo = ?, cuota_vence = ?, cuota_avisada = 0, actualizado = ? WHERE id = ?")
        .bind(String(b.padre).slice(0, 40), b.edad ? String(b.edad).slice(0, 20) : null, sede, monto, clases, hoy, sumarDias(hoy, semanas * 7), saldo, cuotaVence, ahora, id).run();
    } else {
      const ins = await env.DB.prepare("INSERT INTO leads (wa_id, padre, edad, sede, origen, estado, monto, clases_pagadas, inscrito_desde, fin_ciclo, nota, saldo, cuota_vence, creado, actualizado) VALUES (?, ?, ?, ?, ?, 'inscrito', ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(tel || null, String(b.padre).slice(0, 40), b.edad ? String(b.edad).slice(0, 20) : null, sede, "Venta en la cancha", monto, clases, hoy, sumarDias(hoy, semanas * 7), b.nota ? String(b.nota).slice(0, 200) : null, saldo, cuotaVence, ahora, ahora).run();
      id = ins.meta.last_row_id;
    }
    await alInscribir(env, id, { monto, clases, cfg, metodo: b.metodo, saldo }, url.origin, autor);
    ctx.waitUntil(anotar(env, autor, "venta en la cancha", `#${id} ${b.padre} S/ ${monto} (${clases} clases, ${b.metodo || "sin método"})`));
    const l = await env.DB.prepare("SELECT token FROM leads WHERE id = ?").bind(id).first();
    return json({ ok: true, id, carnet: l?.token ? `${url.origin}/carnet/${l.token}` : null }, 201);
  }

  const mLead = ruta.match(/^\/api\/leads\/(\d+)$/);
  if (mLead && m === "PATCH") {
    const b = await req.json();
    const antesLead = await env.DB.prepare("SELECT estado, sede FROM leads WHERE id = ?").bind(Number(mLead[1])).first();
    if (sesion.rol === "personal") {
      const l = await env.DB.prepare("SELECT sede FROM leads WHERE id = ?").bind(Number(mLead[1])).first();
      if (!l || (soloSede && l.sede !== soloSede)) return json({ error: "Esa persona no es de tu sede" }, 403);
      for (const k of Object.keys(b)) if (!["estado", "monto", "plan", "clases", "nota", "padre", "desde", "pago_cuota", "saldo", "cuota_vence"].includes(k)) return json({ error: "Esa acción es solo para la administradora" }, 403);
      if (b.estado && !["inscrito", "asistio", "perdido"].includes(b.estado)) return json({ error: "Esa acción es solo para la administradora" }, 403);
      if ((b.estado === "inscrito" || b.pago_cuota !== undefined) && !vende(sesion)) return json({ error: "Los cobros los registra la administradora o el administrativo de tu sede." }, 403);
      if (b.estado === "inscrito") {
        const cfg = await cargarConfig(env);
        if (!cfg.personalPlanesLibres) {
          if (b.plan === "otro") return json({ error: "Los planes a medida los registra la administradora." }, 403);
          const precio = b.plan === "ciclo" ? cfg.precioCiclo : cfg.precioVerano;
          if (Number(b.monto) !== precio) return json({ error: `El ${b.plan === "ciclo" ? "ciclo" : "paquete de verano"} cuesta S/ ${precio}. Otro monto lo registra la administradora.` }, 403);
        }
      }
    }
    const campos = {};
    if (b.estado !== undefined) { if (!ESTADOS_VALIDOS.includes(b.estado)) return json({ error: "Estado no válido" }, 400); campos.estado = b.estado; }
    if (b.monto !== undefined) campos.monto = Number(b.monto) || 0;
    if (b.nota !== undefined) campos.nota = String(b.nota).slice(0, 200);
    if (b.padre !== undefined) campos.padre = String(b.padre).slice(0, 40);
    if (b.archivado !== undefined) campos.archivado = b.archivado ? 1 : 0;
    if (b.origen !== undefined) campos.origen = String(b.origen).slice(0, 40);
    if (b.sede !== undefined) { if (!SEDE_IDS.includes(b.sede)) return json({ error: "Sede no válida" }, 400); campos.sede = b.sede; }
    if (b.comprobante === null) { campos.comprobante = null; campos.comprobante_creado = null; }
    if (b.estado === "inscrito") {
      const cfg = await cargarConfig(env), r = cfg.automatizaciones.renovacion || {};
      let semanas = b.plan === "ciclo" ? r.semanasCiclo || 4 : r.semanasVerano || 8;
      let clases = b.plan === "ciclo" ? 12 : cfg.clasesVerano;
      if (b.plan === "otro") { // plan a medida: N clases, fecha límite generosa (3 clases por semana + 1 semana)
        clases = Number(b.clases);
        if (!Number.isInteger(clases) || clases < 1 || clases > 200) return json({ error: "Escribe cuántas clases pagó (entre 1 y 200)" }, 400);
        semanas = Math.ceil(clases / 3) + 1;
      }
      campos.clases_pagadas = clases;
      campos.inscrito_desde = /^\d{4}-\d{2}-\d{2}$/.test(b.desde || "") ? b.desde : limaHoy();
      campos.fin_ciclo = sumarDias(campos.inscrito_desde, semanas * 7);
      campos.renovacion_enviada = 0; campos.comprobante = null; campos.comprobante_creado = null;
      const saldo = Math.max(0, Number(b.saldo) || 0);
      if (saldo > 0 && !cfg.cuotas?.permitir) return json({ error: "Las cuotas están desactivadas en Ajustes" }, 400);
      campos.saldo = saldo; campos.cuota_avisada = 0;
      campos.cuota_vence = saldo > 0 ? (/^\d{4}-\d{2}-\d{2}$/.test(b.cuota_vence || "") ? b.cuota_vence : sumarDias(limaHoy(), cfg.cuotas?.diasPorDefecto || 15)) : null;
      campos.__inscripcion = { monto: Number(b.monto) || 0, clases, cfg, saldo };
    }
    if (b.pago_cuota !== undefined) { // Katy registra que pagó (parte o todo) el saldo
      const l = await env.DB.prepare("SELECT saldo, sede, padre, perfil FROM leads WHERE id = ?").bind(Number(mLead[1])).first();
      const pago = Math.min(Number(b.pago_cuota) || 0, l?.saldo || 0);
      if (!(pago > 0)) return json({ error: "Escribe cuánto pagó" }, 400);
      campos.saldo = (l.saldo || 0) - pago; campos.cuota_avisada = 0; if (campos.saldo <= 0) { campos.saldo = 0; campos.cuota_vence = null; }
      await env.DB.prepare("INSERT INTO movimientos (fecha, tipo, categoria, sede, monto, nota, lead_id, autor, creado) VALUES (?, 'ingreso', 'Cuota', ?, ?, ?, ?, ?, ?)")
        .bind(limaHoy(), l.sede, pago, `${l.padre || l.perfil || ""} · cuota`, Number(mLead[1]), autor, ahoraISO()).run();
      ctx.waitUntil(anotar(env, autor, "cobró cuota", `#${mLead[1]} S/ ${pago}`));
    }
    if (b.fin_ciclo !== undefined) { if (b.fin_ciclo && !/^\d{4}-\d{2}-\d{2}$/.test(b.fin_ciclo)) return json({ error: "Fecha no válida" }, 400); campos.fin_ciclo = b.fin_ciclo || null; campos.renovacion_enviada = 0; }
    const inscripcion = campos.__inscripcion; delete campos.__inscripcion;
    const k = Object.keys(campos);
    if (!k.length) return json({ error: "Nada que cambiar" }, 400);
    const idLead = Number(mLead[1]);
    await env.DB.prepare(`UPDATE leads SET ${k.map((x) => `${x} = ?`).join(", ")}, actualizado = ? WHERE id = ?`)
      .bind(...k.map((x) => campos[x]), ahoraISO(), idLead).run();
    if (inscripcion) { ctx.waitUntil(alInscribir(env, idLead, inscripcion, url.origin, autor)); ctx.waitUntil(anotar(env, autor, "inscribió", `#${idLead} S/ ${inscripcion.monto} (${inscripcion.clases} clases)`)); }
    else ctx.waitUntil(anotar(env, autor, "cambió ficha", `#${idLead} ${k.join(", ")}`));
    if (antesLead?.estado === "inscrito" && (campos.estado === "perdido" || campos.archivado === 1)) {
      ctx.waitUntil(cargarConfig(env).then((cfg) => avisarSiguienteEnEspera(env, cfg, antesLead.sede))); // se liberó un cupo
    }
    return json({ ok: true });
  }
  // Asistencia: lista del día por sede
  if (ruta === "/api/asistencia" && m === "GET") {
    const fecha = url.searchParams.get("fecha") || limaHoy();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return json({ error: "Fecha no válida" }, 400);
    const { results } = await env.DB.prepare(
      "SELECT l.id, l.padre, l.perfil, l.edad, l.sede, l.fin_ciclo, l.clases_pagadas, l.token, a.presente, a.hora FROM leads l LEFT JOIN asistencias a ON a.lead_id = l.id AND a.fecha = ? " +
      `WHERE l.archivado = 0 AND l.estado = 'inscrito'${soloSede ? " AND l.sede = ?" : ""} ORDER BY l.sede, l.padre`,
    ).bind(fecha, ...(soloSede ? [soloSede] : [])).all();
    const { results: res } = await env.DB.prepare(
      "SELECT l.sede, COUNT(*) total, SUM(a.presente) presentes FROM asistencias a JOIN leads l ON l.id = a.lead_id WHERE a.fecha >= ? GROUP BY l.sede",
    ).bind(sumarDias(limaHoy(), -30)).all();
    return json({ fecha, alumnos: results, mes: res });
  }
  if (ruta === "/api/asistencia" && m === "PUT") {
    const b = await req.json().catch(() => ({}));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || "") || !Number.isInteger(b.lead_id)) return json({ error: "Datos no válidos" }, 400);
    if (b.presente === null) await env.DB.prepare("DELETE FROM asistencias WHERE lead_id = ? AND fecha = ?").bind(b.lead_id, b.fecha).run();
    else await env.DB.prepare("INSERT INTO asistencias (lead_id, fecha, presente, modo, autor) VALUES (?, ?, ?, 'lista', ?) ON CONFLICT(lead_id, fecha) DO UPDATE SET presente = excluded.presente, autor = excluded.autor").bind(b.lead_id, b.fecha, b.presente ? 1 : 0, autor).run();
    return json({ ok: true });
  }
  // Escanear carnet QR: marca presente hoy con la hora
  if (ruta === "/api/asistencia/escanear" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    const token = String(b.token || "").trim().toUpperCase().replace(/^.*\/CARNET\//i, "").slice(0, 20);
    if (!token) return json({ error: "No se leyó ningún código" }, 400);
    const l = await env.DB.prepare("SELECT l.*, (SELECT COUNT(*) FROM asistencias a WHERE a.lead_id = l.id AND a.presente = 1 AND a.fecha >= COALESCE(l.inscrito_desde, '0000')) AS clases_usadas FROM leads l WHERE token = ? AND archivado = 0").bind(token).first();
    if (!l) return json({ error: "Este carnet no está registrado. Revisa en Personas o anótalo a mano." }, 404);
    const fecha = limaHoy(), hora = horaLimaTxt();
    const ya = await env.DB.prepare("SELECT hora FROM asistencias WHERE lead_id = ? AND fecha = ? AND presente = 1").bind(l.id, fecha).first();
    if (!ya) {
      await env.DB.prepare("INSERT INTO asistencias (lead_id, fecha, presente, hora, modo, autor) VALUES (?, ?, 1, ?, 'qr', ?) ON CONFLICT(lead_id, fecha) DO UPDATE SET presente = 1, hora = excluded.hora, modo = 'qr', autor = excluded.autor").bind(l.id, fecha, hora, autor).run();
      const cfg = await cargarConfig(env);
      if (cfg.carnetQR?.avisarIngreso && l.wa_id && ventanaAbierta(l)) {
        const sede = cfg.sedes[l.sede]?.nombre || "";
        ctx.waitUntil(wa.texto(env, l.wa_id, cfg.textos.ingreso.replace(/\{sede\}/g, sede).replace(/\{hora\}/g, hora), "bot"));
      }
    }
    const quedan = l.clases_pagadas ? Math.max(0, l.clases_pagadas - (l.clases_usadas || 0) - (ya ? 0 : 1)) : null;
    return json({ ok: true, repetido: !!ya, hora: ya?.hora || hora, nombre: l.padre || l.perfil || "Sin nombre", edad: l.edad, sede: l.sede, estado: l.estado, quedan, vencido: l.fin_ciclo && l.fin_ciclo < fecha });
  }
  // Entrada y salida del personal: escanea el QR fijo de la sede
  if (ruta === "/api/jornada" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    const mm = String(b.codigo || "").toUpperCase().match(/SEDE:([A-Z]+):([A-F0-9]{16})/);
    if (!mm) return json({ error: "Ese código no es el QR de una sede" }, 400);
    if (!SEDE_IDS.includes(mm[1]) || !igualSeguro(mm[2], (await firmar(env, `sede:${mm[1]}`)).slice(0, 16).toUpperCase())) return json({ error: "El QR de la sede no es válido. Pídele a Katy que lo imprima de nuevo." }, 400);
    if (sesion.rol !== "personal") return json({ error: "Este QR es para que el personal marque su entrada y salida." }, 400);
    if (sesion.sede && sesion.sede !== mm[1]) return json({ error: `Este QR es de otra sede (${mm[1]}). Tu sede es ${sesion.sede}.` }, 400);
    const fecha = limaHoy(), hora = horaLimaTxt();
    const abierta = await env.DB.prepare("SELECT id, entrada FROM jornadas WHERE personal_id = ? AND fecha = ? AND salida IS NULL ORDER BY id DESC LIMIT 1").bind(sesion.id, fecha).first();
    if (abierta) {
      await env.DB.prepare("UPDATE jornadas SET salida = ? WHERE id = ?").bind(hora, abierta.id).run();
      ctx.waitUntil(anotar(env, sesion.nombre, "marcó salida", `${mm[1]} ${hora}`));
      return json({ ok: true, tipo: "salida", entrada: abierta.entrada, salida: hora, sede: mm[1] });
    }
    const cfg = await cargarConfig(env);
    const inicio = cfg.personalControl?.horaInicio?.[mm[1]] || "";
    const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
    const tarde = inicio && aMin(hora) > aMin(inicio) + (Number(cfg.personalControl?.toleranciaMin) || 0) ? 1 : 0;
    await env.DB.prepare("INSERT INTO jornadas (personal_id, fecha, sede, entrada, tarde, creado) VALUES (?, ?, ?, ?, ?, ?)").bind(sesion.id, fecha, mm[1], hora, tarde, ahoraISO()).run();
    ctx.waitUntil(anotar(env, sesion.nombre, tarde ? "marcó entrada (tarde)" : "marcó entrada", `${mm[1]} ${hora}`));
    return json({ ok: true, tipo: "entrada", entrada: hora, tarde: !!tarde, inicio, sede: mm[1] });
  }
  if (ruta === "/api/jornada" && m === "GET") { // mis jornadas de hoy y del mes (personal) o de todos (Katy)
    const mes = url.searchParams.get("mes") || limaHoy().slice(0, 7);
    const { results } = await env.DB.prepare(
      `SELECT j.*, p.nombre, p.tipo_pago, p.tarifa FROM jornadas j JOIN personal p ON p.id = j.personal_id WHERE j.fecha LIKE ?${sesion.rol === "personal" ? " AND j.personal_id = ?" : ""} ORDER BY j.fecha DESC, j.id DESC LIMIT 2000`,
    ).bind(mes + "%", ...(sesion.rol === "personal" ? [sesion.id] : [])).all();
    return json({ mes, jornadas: results });
  }
  if (ruta === "/api/personal/pago" && m === "POST") { // Katy registra el pago del mes a un profesor
    const b = await req.json().catch(() => ({}));
    const p = await env.DB.prepare("SELECT nombre, sede FROM personal WHERE id = ?").bind(Number(b.id)).first();
    if (!p || !(Number(b.monto) > 0)) return json({ error: "Faltan datos" }, 400);
    await env.DB.prepare("INSERT INTO movimientos (fecha, tipo, categoria, sede, monto, nota, autor, creado) VALUES (?, 'egreso', 'Profesores', ?, ?, ?, ?, ?)")
      .bind(limaHoy(), p.sede, Number(b.monto), `Pago a ${p.nombre}${b.mes ? ` · ${b.mes}` : ""}`, autor, ahoraISO()).run();
    ctx.waitUntil(anotar(env, autor, "pagó al personal", `${p.nombre} S/ ${b.monto}`));
    return json({ ok: true });
  }

  // Carnet de una persona (para enviarlo o imprimirlo desde el panel)
  const mCarnet = ruta.match(/^\/api\/leads\/(\d+)\/carnet$/);
  if (mCarnet && m === "POST") {
    const l = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(Number(mCarnet[1])).first();
    if (!l) return json({ error: "No encontrado" }, 404);
    let token = l.token;
    if (!token) { token = nuevoToken(); await env.DB.prepare("UPDATE leads SET token = ? WHERE id = ?").bind(token, l.id).run(); }
    const enlace = `${url.origin}/carnet/${token}`;
    let enviado = false;
    if (l.wa_id && ventanaAbierta(l)) { const cfg = await cargarConfig(env); enviado = await wa.texto(env, l.wa_id, cfg.textos.carnet.replace(/\{enlace\}/g, enlace), "katy"); }
    return json({ ok: true, enlace, enviado });
  }

  // Estado del sistema: errores de WhatsApp y qué falta configurar (lista de «primer día»)
  if (ruta === "/api/estado" && m === "GET") {
    const cfg = await cargarConfig(env);
    const err = await leerValor(env, "error_whatsapp");
    let errorWA = null; try { errorWA = err ? JSON.parse(err) : null; } catch { errorWA = null; }
    const faltan = [];
    if (sesion.rol === "admin") {
      if (!cfg.pago?.numero) faltan.push({ que: "El Yape o Plin de la escuela", donde: "Ajustes → Cuenta de la escuela para pagos" });
      if (!cfg.web?.numero) faltan.push({ que: "El número de WhatsApp del bot para la página web", donde: "Ajustes → Página web" });
      for (const id of SEDE_IDS) if (cfg.sedes[id]?.activa && !cfg.sedes[id].horario) faltan.push({ que: `El horario de ${cfg.sedes[id].nombre}`, donde: "Ajustes → Horarios y direcciones" });
      if (!cfg.clasePrueba?.hora) faltan.push({ que: "La hora de la clase de prueba", donde: "Ajustes → Clase de prueba gratis" });
      for (const id of SEDE_IDS) if (cfg.sedes[id]?.activa && !cfg.sedes[id].coordenadas) faltan.push({ que: `El punto en el mapa de ${cfg.sedes[id].nombre}`, donde: "Ajustes → Opciones avanzadas → Sedes" });
      if (!cfg.web?.inicio) faltan.push({ que: "El primer día del verano", donde: "Ajustes → Página web" });
      if (!cfg.avisos?.numero) faltan.push({ que: "Tu WhatsApp para los avisos", donde: "Ajustes → Avisos a tu WhatsApp" });
      const np = (await env.DB.prepare("SELECT COUNT(*) n FROM personal WHERE activo = 1").first())?.n || 0;
      if (!np) faltan.push({ que: "Los profesores de cada sede, con su PIN", donde: "Ajustes → Personal de las sedes" });
      if (!cfg.soporte?.whatsapp) faltan.push({ que: "El WhatsApp de quien te ayuda con el panel", donde: "Ajustes → Opciones avanzadas → Ayuda técnica" });
    }
    return json({ errorWA, faltan });
  }

  // Uniformes: stock por talla y entregas
  if (ruta === "/api/uniformes" && m === "GET") {
    const cfg = await cargarConfig(env);
    const tallas = String(cfg.tallas || "").split(",").map((t) => t.trim()).filter(Boolean);
    const { results } = await env.DB.prepare("SELECT * FROM uniformes").all();
    const stock = Object.fromEntries(results.map((r) => [r.talla, r.cantidad]));
    const { results: pend } = await env.DB.prepare(`SELECT id, padre, perfil, sede, uniforme_talla FROM leads WHERE archivado = 0 AND estado = 'inscrito' AND uniforme_entregado IS NULL${soloSede ? " AND sede = ?" : ""} ORDER BY sede, padre`).bind(...(soloSede ? [soloSede] : [])).all();
    return json({ tallas, stock: tallas.map((t) => ({ talla: t, cantidad: stock[t] || 0 })), pendientes: pend });
  }
  if (ruta === "/api/uniformes" && m === "PUT" && sesion.rol === "admin") {
    const b = await req.json().catch(() => ({}));
    if (!b.talla || !Number.isInteger(b.cantidad) || b.cantidad < 0) return json({ error: "Talla o cantidad no válida" }, 400);
    await env.DB.prepare("INSERT INTO uniformes (talla, cantidad) VALUES (?, ?) ON CONFLICT(talla) DO UPDATE SET cantidad = excluded.cantidad").bind(String(b.talla).slice(0, 10), b.cantidad).run();
    return json({ ok: true });
  }
  const mUni = ruta.match(/^\/api\/leads\/(\d+)\/uniforme$/);
  if (mUni && m === "POST") { // entrega de uniforme (y cobro opcional)
    const b = await req.json().catch(() => ({}));
    const l = await env.DB.prepare("SELECT id, sede, padre, perfil FROM leads WHERE id = ?").bind(Number(mUni[1])).first();
    if (!l || (soloSede && l.sede !== soloSede)) return json({ error: "Esa persona no es de tu sede" }, 403);
    if (!b.talla) return json({ error: "Elige la talla" }, 400);
    const st = await env.DB.prepare("SELECT cantidad FROM uniformes WHERE talla = ?").bind(b.talla).first();
    await env.DB.prepare("UPDATE leads SET uniforme_talla = ?, uniforme_entregado = ?, actualizado = ? WHERE id = ?").bind(String(b.talla).slice(0, 10), limaHoy(), ahoraISO(), l.id).run();
    if (st) await env.DB.prepare("UPDATE uniformes SET cantidad = MAX(0, cantidad - 1) WHERE talla = ?").bind(b.talla).run();
    const monto = Number(b.monto) || 0;
    if (monto > 0) {
      if (!vende(sesion)) return json({ error: "El cobro del uniforme lo registra la administradora o el administrativo de sede" }, 403);
      await env.DB.prepare("INSERT INTO movimientos (fecha, tipo, categoria, sede, monto, nota, lead_id, autor, creado) VALUES (?, 'ingreso', 'Uniforme', ?, ?, ?, ?, ?, ?)").bind(limaHoy(), l.sede, monto, `${l.padre || l.perfil || ""} · talla ${b.talla}`, l.id, autor, ahoraISO()).run();
    }
    ctx.waitUntil(anotar(env, autor, "entregó uniforme", `#${l.id} talla ${b.talla}${monto ? ` S/ ${monto}` : ""}`));
    return json({ ok: true, quedan: st ? Math.max(0, st.cantidad - 1) : null });
  }
  // Encuestas y referidos (Números)
  if (ruta === "/api/encuestas" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT sede, COUNT(*) n, AVG(puntaje) prom, SUM(puntaje = 1) regular FROM encuestas GROUP BY sede").all();
    const total = await env.DB.prepare("SELECT COUNT(*) n, AVG(puntaje) prom FROM encuestas").first();
    return json({ porSede: results, total });
  }
  if (ruta === "/api/referidos" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT r.id, r.padre, r.perfil, r.sede, COUNT(l.id) traidos, SUM(l.estado = 'inscrito') inscritos FROM leads l JOIN leads r ON r.id = l.referido_por WHERE l.archivado = 0 GROUP BY r.id ORDER BY inscritos DESC, traidos DESC LIMIT 50").all();
    return json(results);
  }
  if (ruta === "/api/copia.json" && m === "GET" && sesion.rol === "admin") {
    const datos = await copiaSeguridad(env);
    return new Response(JSON.stringify(datos), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="copia-coyote-${limaHoy()}.json"` } });
  }

  // Personal de las sedes (solo Katy)
  if (ruta === "/api/personal" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT id, nombre, rol, sede, activo, ultimo_ingreso, tipo_pago, tarifa FROM personal ORDER BY activo DESC, nombre").all();
    return json(results);
  }
  if (ruta === "/api/personal" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    const nombre = String(b.nombre || "").trim().slice(0, 40), pin = String(b.pin || "").trim();
    if (nombre.length < 2) return json({ error: "Escribe el nombre" }, 400);
    if (!/^\d{4,8}$/.test(pin)) return json({ error: "El PIN debe tener de 4 a 8 números" }, 400);
    if (b.sede && !SEDE_IDS.includes(b.sede)) return json({ error: "Sede no válida" }, 400);
    if (await env.DB.prepare("SELECT 1 FROM personal WHERE lower(nombre) = lower(?) AND activo = 1").bind(nombre).first()) return json({ error: "Ya hay alguien con ese nombre. Usa nombre y apellido." }, 409);
    await env.DB.prepare("INSERT INTO personal (nombre, rol, sede, pin_hash, tipo_pago, tarifa, creado) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(nombre, String(b.rol || "Profesor").slice(0, 30), b.sede || null, await hashPin(env, pin), ["clase", "hora", "mes"].includes(b.tipo_pago) ? b.tipo_pago : "clase", Number(b.tarifa) || 0, ahoraISO()).run();
    ctx.waitUntil(anotar(env, autor, "agregó personal", nombre));
    return json({ ok: true }, 201);
  }
  const mPers = ruta.match(/^\/api\/personal\/(\d+)$/);
  if (mPers && m === "PATCH") {
    const b = await req.json().catch(() => ({}));
    const campos = {};
    if (b.activo !== undefined) campos.activo = b.activo ? 1 : 0;
    if (b.sede !== undefined) { if (b.sede && !SEDE_IDS.includes(b.sede)) return json({ error: "Sede no válida" }, 400); campos.sede = b.sede || null; }
    if (b.rol !== undefined) campos.rol = String(b.rol).slice(0, 30);
    if (b.tipo_pago !== undefined) { if (!["clase", "hora", "mes"].includes(b.tipo_pago)) return json({ error: "Forma de pago no válida" }, 400); campos.tipo_pago = b.tipo_pago; }
    if (b.tarifa !== undefined) { if (!(Number(b.tarifa) >= 0)) return json({ error: "Tarifa no válida" }, 400); campos.tarifa = Number(b.tarifa); }
    if (b.pin !== undefined) { if (!/^\d{4,8}$/.test(String(b.pin))) return json({ error: "El PIN debe tener de 4 a 8 números" }, 400); campos.pin_hash = await hashPin(env, String(b.pin)); }
    const k = Object.keys(campos); if (!k.length) return json({ error: "Nada que cambiar" }, 400);
    await env.DB.prepare(`UPDATE personal SET ${k.map((x) => `${x} = ?`).join(", ")} WHERE id = ?`).bind(...k.map((x) => campos[x]), Number(mPers[1])).run();
    return json({ ok: true });
  }
  if (ruta === "/api/bitacora" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT autor, accion, detalle, creado FROM bitacora ORDER BY id DESC LIMIT 200").all();
    return json(results);
  }

  // Caja
  if (ruta === "/api/caja" && m === "GET") {
    const mes = url.searchParams.get("mes") || limaHoy().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(mes)) return json({ error: "Mes no válido" }, 400);
    const { results } = await env.DB.prepare(`SELECT * FROM movimientos WHERE fecha LIKE ?${soloSede ? " AND sede = ?" : ""} ORDER BY fecha DESC, id DESC LIMIT 1000`).bind(mes + "%", ...(soloSede ? [soloSede] : [])).all();
    const { results: ads } = await env.DB.prepare("SELECT * FROM gastos WHERE semana LIKE ?").bind(mes + "%").all();
    const { results: meses } = await env.DB.prepare("SELECT DISTINCT substr(fecha, 1, 7) mes FROM movimientos ORDER BY mes DESC LIMIT 24").all();
    return json({ mes, movimientos: results, anuncios: ads, meses: meses.map((x) => x.mes) });
  }
  if (ruta === "/api/caja" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || "") || !["ingreso", "egreso"].includes(b.tipo) || !(Number(b.monto) > 0) || !String(b.categoria || "").trim()) return json({ error: "Completa fecha, tipo, categoría y monto" }, 400);
    if (b.sede && !SEDE_IDS.includes(b.sede)) return json({ error: "Sede no válida" }, 400);
    if (soloSede) b.sede = soloSede;
    const r = await env.DB.prepare("INSERT INTO movimientos (fecha, tipo, categoria, sede, monto, nota, autor, creado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(b.fecha, b.tipo, String(b.categoria).slice(0, 40), b.sede || null, Number(b.monto), String(b.nota || "").slice(0, 120) || null, autor, ahoraISO()).run();
    ctx.waitUntil(anotar(env, autor, b.tipo === "ingreso" ? "ingreso en caja" : "gasto en caja", `${b.categoria} S/ ${b.monto}`));
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  }
  const mMov = ruta.match(/^\/api\/caja\/(\d+)$/);
  if (mMov && m === "DELETE") { await env.DB.prepare("DELETE FROM movimientos WHERE id = ?").bind(Number(mMov[1])).run(); return json({ ok: true }); }
  if (ruta === "/api/caja.csv" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT fecha, tipo, categoria, sede, monto, nota FROM movimientos ORDER BY fecha, id").all();
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "\ufeff" + ["Fecha,Tipo,Categoría,Sede,Monto (S/),Nota", ...results.map((r) => [r.fecha, r.tipo, r.categoria, r.sede, r.monto, r.nota].map(esc).join(","))].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="caja-coyote.csv"' } });
  }

  if (ruta === "/api/asistencia.csv" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT COALESCE(l.padre, l.perfil) padre, l.sede, a.fecha, a.presente, a.hora FROM asistencias a JOIN leads l ON l.id = a.lead_id ORDER BY l.sede, l.padre, a.fecha").all();
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "\ufeff" + ["Nombre,Sede,Fecha,Vino,Hora", ...results.map((r) => [r.padre, r.sede, r.fecha, r.presente ? "Sí" : "No", r.hora].map(esc).join(","))].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="asistencia-coyote.csv"' } });
  }
  // Cómo llegaron los que se inscribieron
  if (ruta === "/api/canales" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT origen, COUNT(*) total, SUM(estado = 'inscrito') inscritos FROM leads WHERE archivado = 0 GROUP BY origen ORDER BY inscritos DESC, total DESC").all();
    return json(results);
  }

  if (ruta === "/api/gastos" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM gastos").all();
    return json(results);
  }
  if (ruta === "/api/gastos" && m === "PUT") {
    const b = await req.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.semana || "") || !SEDE_IDS.includes(b.sede)) return json({ error: "Datos no válidos" }, 400);
    await env.DB.prepare("INSERT INTO gastos (semana, sede, monto) VALUES (?, ?, ?) ON CONFLICT(semana, sede) DO UPDATE SET monto = excluded.monto")
      .bind(b.semana, b.sede, Number(b.monto) || 0).run();
    return json({ ok: true });
  }
  if (ruta === "/api/export.csv" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM leads WHERE archivado = 0 ORDER BY creado").all();
    const cols = ["id", "creado", "padre", "perfil", "wa_id", "edad", "sede", "origen", "estado", "clase_fecha", "monto", "nota"];
    const nombres = ["N.º", "Llegó", "Nombre", "Nombre en WhatsApp", "Celular", "Edad", "Sede", "Cómo llegó", "Estado", "Clase de prueba", "Pagó (S/)", "Nota"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const fila = (r) => cols.map((c) => esc(c === "estado" ? ESTADOS[r[c]] || r[c] : r[c])).join(",");
    const csv = "﻿" + [nombres.join(","), ...results.map(fila)].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="consultas-coyote.csv"' } });
  }

  // Configuración del bot
  if (ruta === "/api/config" && m === "GET") {
    return json({ config: await cargarConfig(env), cambios: await cambiosGuardados(env) });
  }
  if (ruta === "/api/config" && m === "PUT") {
    const b = await req.json();
    // Solo se aceptan las claves conocidas; lo demás se ignora
    const limpio = {};
    for (const k of Object.keys(DEFAULTS)) if (k in b) limpio[k] = b[k];
    limpio.plantillaRecordatorio = DEFAULTS.plantillaRecordatorio;
    const cfg = { ...(await cargarConfig(env)), ...limpio };
    const errores = validarConfig(cfg);
    if (errores.length) return json({ error: "Hay datos por corregir", errores }, 400);
    await guardarConfig(env, cfg);
    return json({ ok: true, cambios: await cambiosGuardados(env) });
  }
  if (ruta === "/api/config/restaurar" && m === "POST") {
    await restaurarConfig(env);
    return json({ ok: true });
  }
  if (ruta === "/api/config/deshacer" && m === "POST") {
    const ok = await deshacerConfig(env);
    return ok ? json({ ok: true, cambios: await cambiosGuardados(env) }) : json({ error: "No hay cambios anteriores para deshacer" }, 400);
  }
  // Bandeja de chats
  if (ruta.startsWith("/api/chats")) {
    const r = await apiChats(req, env, url, await cargarConfig(env));
    if (r) return r;
  }
  // Audios, fotos y documentos que mandó un padre (solo los que están en algún chat)
  const mMedia = ruta.match(/^\/api\/media\/(\d{5,30})$/);
  if (mMedia && m === "GET") {
    const existe = await env.DB.prepare("SELECT 1 FROM mensajes WHERE media_id = ? LIMIT 1").bind(mMedia[1]).first();
    if (!existe) return json({ error: "No encontrado" }, 404);
    return (await wa.medio(env, mMedia[1])) || json({ error: "WhatsApp ya no tiene este archivo (se guardan unos 30 días)." }, 410);
  }

  // Lo que el bot no entendió, agrupado (para enseñarle palabras nuevas)
  if (ruta === "/api/no-entendidos" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT id, texto, creado FROM no_entendidos ORDER BY id DESC LIMIT 500").all();
    const clave = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\p{Extended_Pictographic} ]/gu, " ").replace(/\s+/g, " ").trim();
    const grupos = new Map();
    for (const r of results) {
      const k = clave(r.texto); if (!k) continue;
      const g = grupos.get(k) || { texto: r.texto, veces: 0, ultimo: r.creado, ids: [] };
      g.veces++; g.ids.push(r.id); grupos.set(k, g);
    }
    return json([...grupos.values()].sort((a, b) => b.veces - a.veces || b.ultimo.localeCompare(a.ultimo)).slice(0, 30));
  }
  if (ruta === "/api/no-entendidos/quitar" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isInteger).slice(0, 500);
    for (let i = 0; i < ids.length; i += 90) {
      const parte = ids.slice(i, i + 90);
      await env.DB.prepare(`DELETE FROM no_entendidos WHERE id IN (${parte.map(() => "?").join(",")})`).bind(...parte).run();
    }
    return json({ ok: true });
  }

  // Mensajes a grupos
  if (ruta === "/api/campanas" && m === "GET") return json(await resumenCampanas(env));
  if (ruta === "/api/aviso-sede" && m === "GET") {
    const sede = url.searchParams.get("sede"); if (!SEDE_IDS.includes(sede)) return json({ error: "Sede no válida" }, 400);
    return json({ personas: await cuantosEnSede(env, sede) });
  }
  if (ruta === "/api/aviso-sede" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!SEDE_IDS.includes(b.sede)) return json({ error: "Sede no válida" }, 400);
    if (!/^[a-z0-9]{6,24}$/.test(b.id || "")) return json({ error: "Falta el identificador del aviso" }, 400);
    const r = await avisoSede(env, b);
    return r.error ? json(r, 400) : json(r);
  }
  const mCamp = ruta.match(/^\/api\/campanas\/(\w+)\/enviar$/);
  if (mCamp && m === "POST") return json(await enviarTanda(env, mCamp[1]));

  // Para pruebas: correr las tareas automáticas como si fuera cierta hora de Lima
  if (ruta === "/api/ejecutar-tareas" && m === "POST") {
    const hora = Number(url.searchParams.get("hora"));
    return json(await tareasDeLaHora(env, await leerValor(env, "url_panel"), Number.isInteger(hora) ? hora : undefined));
  }
  return json({ error: "No encontrado" }, 404);
}

function png(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Response(bin, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" } });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;

    if (p === "/webhook" && req.method === "GET") {
      const ok = url.searchParams.get("hub.mode") === "subscribe" &&
        igualSeguro(url.searchParams.get("hub.verify_token") || "", env.VERIFY_TOKEN || "");
      return ok ? new Response(url.searchParams.get("hub.challenge")) : new Response("Token no válido", { status: 403 });
    }
    if (p === "/webhook" && req.method === "POST") {
      const cuerpo = await req.text();
      if (!(await verificarFirma(env, cuerpo, req.headers.get("X-Hub-Signature-256")))) {
        return new Response("Firma no válida", { status: 401 });
      }
      let datos;
      try { datos = JSON.parse(cuerpo); } catch { return new Response("JSON no válido", { status: 400 }); }
      ctx.waitUntil(procesarWebhook(env, datos));
      return new Response("OK");
    }

    // Archivos para instalar el panel como app
    if (p === "/manifest.webmanifest") {
      return new Response(JSON.stringify({
        name: "Panel Coyote", short_name: "Coyote", start_url: "/panel", display: "standalone",
        background_color: "#f6f5f3", theme_color: "#c8202a", lang: "es",
        icons: [{ src: "/icono-192.png", sizes: "192x192", type: "image/png" }, { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
      }), { headers: { "Content-Type": "application/manifest+json" } });
    }
    if (p === "/icono-192.png" || p === "/apple-touch-icon.png") return png(ICONO_192);
    if (p === "/icono-512.png") return png(ICONO_512);

    // Entrar y salir
    if (p === "/entrar" && req.method === "GET") return html(entrarHTML(""));
    if (p === "/entrar" && req.method === "POST") {
      const form = await req.formData();
      const clave = String(form.get("clave") || "").trim().slice(0, 100);
      const nombre = String(form.get("nombre") || "").trim().slice(0, 60);
      const ip = req.headers.get("CF-Connecting-IP") || "desconocida";
      const claveIntento = nombre ? `n:${nombre.toLowerCase()}` : `ip:${ip}`;
      if (!(await intentoPermitido(env, `ip:${ip}`)) || !(await intentoPermitido(env, claveIntento))) {
        return html(entrarHTML("Demasiados intentos. Espera 15 minutos y vuelve a probar.", nombre ? "personal" : "admin"), 429);
      }
      if (nombre) { // personal: nombre + PIN
        const h = env.ADMIN_PASSWORD ? await hashPin(env, clave) : "";
        const p = await env.DB.prepare("SELECT id, nombre FROM personal WHERE lower(nombre) = lower(?) AND pin_hash = ? AND activo = 1").bind(nombre, h).first();
        if (!p) { await anotarFallo(env, `ip:${ip}`); await anotarFallo(env, claveIntento); await new Promise((r) => setTimeout(r, 800)); return html(entrarHTML("El nombre o el PIN no coinciden. Pídele a Katy que revise tu acceso.", "personal"), 401); }
        ctx.waitUntil(limpiarFallos(env, claveIntento));
        ctx.waitUntil(env.DB.prepare("UPDATE personal SET ultimo_ingreso = ? WHERE id = ?").bind(ahoraISO(), p.id).run());
        ctx.waitUntil(anotar(env, p.nombre, "entró al panel"));
        return new Response(null, { status: 303, headers: { Location: "/panel", "Set-Cookie": await cookieSesion(env, url, "personal", p.id) } });
      }
      if (!env.ADMIN_PASSWORD || !igualSeguro(clave, env.ADMIN_PASSWORD)) {
        await anotarFallo(env, `ip:${ip}`);
        await new Promise((r) => setTimeout(r, 800));
        return html(entrarHTML("La clave no es correcta. Revisa mayúsculas y vuelve a intentar."), 401);
      }
      ctx.waitUntil(limpiarFallos(env, `ip:${ip}`));
      ctx.waitUntil(guardarValor(env, "url_panel", `${url.origin}/panel`));
      return new Response(null, { status: 303, headers: { Location: "/panel", "Set-Cookie": await cookieSesion(env, url) } });
    }
    if (p === "/salir") {
      return new Response(null, { status: 303, headers: { Location: "/entrar", "Set-Cookie": "coyote_sesion=; Path=/; Max-Age=0" } });
    }

    // QR fijo de una sede para que el personal marque entrada y salida (solo Katy lo imprime)
    const mS = p.match(/^\/sede-qr\/([A-Z]+)$/);
    if (mS) {
      const ses = await sesionValida(req, env);
      if (!ses || ses.rol !== "admin") return new Response(null, { status: 303, headers: { Location: "/entrar" } });
      const cfg = await cargarConfig(env), sede = cfg.sedes[mS[1]];
      if (!sede) return new Response("No encontrado", { status: 404 });
      const codigo = `SEDE:${mS[1]}:${(await firmar(env, `sede:${mS[1]}`)).slice(0, 16).toUpperCase()}`;
      return html(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QR de ${sede.nombre}</title>
<style>body{margin:0;font:17px/1.4 Barlow,system-ui,sans-serif;color:#1f1b19;display:grid;place-items:center;min-height:100vh;background:#f2f3f0}.h{background:#fff;border-radius:22px;padding:28px;text-align:center;width:min(100%,420px);box-shadow:0 10px 30px rgba(0,0,0,.12)}.h svg{width:300px;height:300px}h1{font-family:"Barlow Condensed",Arial Narrow,sans-serif;font-size:2.2rem;margin:10px 0 0}p{margin:6px 0 0;color:#5b605a}.b{background:#c8202a;color:#fff;font-weight:700;border-radius:12px;padding:10px 16px;display:inline-block;margin-top:16px;text-decoration:none}@media print{body{background:#fff}.h{box-shadow:none}.b{display:none}}</style></head>
<body><div class="h">${qrSVG(codigo, 300)}<h1>Escuela Coyote · ${sede.nombre}</h1><p>Personal: escanea este código desde tu panel al llegar y al salir.</p><a class="b" href="javascript:print()">Imprimir</a></div></body></html>`);
    }

    // Carnet digital (enlace que recibe el papá; no requiere clave)
    const mC = p.match(/^\/carnet\/([A-Z0-9]{6,20})$/i);
    if (mC) {
      const l = await env.DB.prepare("SELECT l.*, (SELECT COUNT(*) FROM asistencias a WHERE a.lead_id = l.id AND a.presente = 1 AND a.fecha >= COALESCE(l.inscrito_desde, '0000')) AS clases_usadas FROM leads l WHERE token = ? AND archivado = 0").bind(mC[1].toUpperCase()).first();
      if (!l) return html("<!doctype html><meta charset=utf-8><title>Carnet</title><p style='font:17px system-ui;padding:24px'>Este carnet ya no está activo. Escríbenos por WhatsApp y te enviamos uno nuevo.</p>", 404);
      const cfg = await cargarConfig(env);
      const quedan = l.clases_pagadas ? Math.max(0, l.clases_pagadas - (l.clases_usadas || 0)) : null;
      return html(carnetHTML(cfg, l, `${url.origin}/carnet/${l.token}`, { quedan, usadas: l.clases_usadas }), 200, { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" });
    }

    if (p === "/privacidad") return new Response(privacidadHTML(await cargarConfig(env)), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300", ...SEGURIDAD } });

    // Página pública de la escuela
    if (p === "/" || p === "/web") {
      const cfg = await cargarConfig(env);
      if (!cfg.web?.activa) return new Response(null, { status: 303, headers: { Location: "/entrar" } });
      return new Response(webHTML(cfg, url.searchParams.get("de") || "web"), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60", ...SEGURIDAD, "X-Frame-Options": "SAMEORIGIN" } });
    }

    if (p === "/panel" || p.startsWith("/api/")) {
      const sesion = await sesionValida(req, env);
      if (!sesion) {
        return p.startsWith("/api/") ? json({ error: "Tu sesión terminó. Vuelve a entrar con la clave." }, 401)
          : new Response(null, { status: 303, headers: { Location: "/entrar" } });
      }
      if (p.startsWith("/api/")) {
        if (sesion.rol === "personal" && !permitidoPersonal(req.method, p, sesion)) return json({ error: sesion.cargo === "Administrativo de sede" ? "Esta parte del panel es solo para la administradora." : "Las ventas y la caja las maneja la administradora o el administrativo de tu sede." }, 403);
        return api(req, env, url, ctx, sesion);
      }
      return html(panelHTML(await cargarConfig(env), sesion));
    }

    return new Response("No encontrado", { status: 404 });
  },

  // Cada hora: rescate de conversaciones, resumen (8 a. m.), recordatorios,
  // seguimientos después de la clase y limpieza (ver tareasDeLaHora en bot.js)
  async scheduled(_evento, env, ctx) {
    ctx.waitUntil((async () => console.log("Tareas", JSON.stringify(await tareasDeLaHora(env, await leerValor(env, "url_panel")))))());
  },
};
