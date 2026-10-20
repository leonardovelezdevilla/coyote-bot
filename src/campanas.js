// Mensajes a grupos que Katy envía desde el panel.
// Cada campaña usa una plantilla aprobada en Meta, se envía por tandas y
// nunca repite a la misma persona. Quien pidió "no más mensajes" no recibe.

import { cargarConfig } from "./config.js";
import { wa } from "./whatsapp.js";
import { fechaLarga, ahoraISO } from "./fechas.js";

const TANDA = 15;
const primerNombre = (t) => (t || "").trim().split(/\s+/)[0] || "";

export const CAMPANAS = {
  preventa: {
    nombre: "Últimos días de la preventa",
    para: "Quienes consultaron o vinieron a la clase de prueba y aún no se inscriben",
    filtro: "estado IN ('consulta', 'agendada', 'asistio', 'perdido')",
    parametros: (cfg, l) => [primerNombre(l.padre || l.perfil) || "familia", cfg.clasesVerano, cfg.precioVerano, cfg.uniformePreventa, fechaLarga(cfg.finPreventa).replace(/^\S+ /, "")],
    botones: ["CAMP_SI", "CAMP_NO"],
    ejemplo: (cfg) => `Hola Rosa, quedan pocos días de la preventa de la Escuela Coyote: ${cfg.clasesVerano} clases por S/ ${cfg.precioVerano} y el uniforme a S/ ${cfg.uniformePreventa} hasta el ${fechaLarga(cfg.finPreventa).replace(/^\S+ /, "")}.`,
  },
  marzo: {
    nombre: "Seguir entrenando en marzo",
    para: "Quienes se inscribieron en el verano",
    filtro: "estado = 'inscrito'",
    parametros: (cfg, l) => [primerNombre(l.padre || l.perfil) || "familia", cfg.campanas.marzo.oferta],
    botones: ["MARZO_SI", "MARZO_DUDA"],
    ejemplo: (cfg) => `Hola Rosa, ¡gracias por este verano con la Escuela Coyote! Desde marzo seguimos entrenando 3 veces por semana. Para quienes continúan: ${cfg.campanas.marzo.oferta}.`,
  },
};

const BASE = "FROM leads l WHERE l.archivado = 0 AND l.no_contactar = 0 AND l.wa_id IS NOT NULL";
const NO_ENVIADO = "AND NOT EXISTS (SELECT 1 FROM campana_envios e WHERE e.campana = ? AND e.lead_id = l.id)";

export async function resumenCampanas(env) {
  const cfg = await cargarConfig(env);
  const out = [];
  for (const [id, c] of Object.entries(CAMPANAS)) {
    const quedan = (await env.DB.prepare(`SELECT COUNT(*) n ${BASE} AND ${c.filtro} ${NO_ENVIADO}`).bind(id).first()).n;
    const enviados = (await env.DB.prepare("SELECT COUNT(*) n FROM campana_envios WHERE campana = ? AND ok = 1").bind(id).first()).n;
    out.push({ id, nombre: c.nombre, para: c.para, plantilla: cfg.campanas[id].plantilla, quedan, enviados, ejemplo: c.ejemplo(cfg) });
  }
  return out;
}

// Aviso a una sede: «Hoy no hay clase por lluvia». Va a los inscritos (y agendados) de esa sede,
// con la plantilla aviso_sede ({{1}} sede, {{2}} mensaje). Cada aviso tiene su propio id para no repetir.
export async function avisoSede(env, { sede, texto, id }) {
  const cfg = await cargarConfig(env);
  if (!cfg.sedes[sede]) return { error: "Sede no válida" };
  const limpio = String(texto || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (limpio.length < 5) return { error: "Escribe el aviso (al menos 5 letras)" };
  const campana = `aviso_${id}`;
  const filtro = "l.sede = ? AND l.estado IN ('inscrito', 'agendada', 'asistio')";
  const { results } = await env.DB.prepare(`SELECT l.* ${BASE} AND ${filtro} ${NO_ENVIADO} LIMIT ?`).bind(sede, campana, TANDA).all();
  let enviados = 0, fallidos = 0;
  for (const l of results) {
    const ok = await wa.plantilla(env, l.wa_id, cfg.campanas.avisoSede?.plantilla || "aviso_sede", "es", [cfg.sedes[sede].nombre, limpio]);
    await env.DB.prepare("INSERT OR REPLACE INTO campana_envios (campana, lead_id, ok, creado) VALUES (?, ?, ?, ?)").bind(campana, l.id, ok ? 1 : 0, ahoraISO()).run();
    ok ? enviados++ : fallidos++;
  }
  const quedan = (await env.DB.prepare(`SELECT COUNT(*) n ${BASE} AND ${filtro} ${NO_ENVIADO}`).bind(sede, campana).first()).n;
  return { enviados, fallidos, quedan };
}

export async function cuantosEnSede(env, sede) {
  return (await env.DB.prepare(`SELECT COUNT(*) n ${BASE} AND l.sede = ? AND l.estado IN ('inscrito', 'agendada', 'asistio')`).bind(sede).first()).n;
}

export async function enviarTanda(env, id) {
  const c = CAMPANAS[id];
  if (!c) return { error: "Campaña no encontrada" };
  const cfg = await cargarConfig(env);
  const { results } = await env.DB.prepare(`SELECT l.* ${BASE} AND ${c.filtro} ${NO_ENVIADO} LIMIT ?`).bind(id, TANDA).all();
  let enviados = 0, fallidos = 0;
  for (const l of results) {
    const ok = await wa.plantilla(env, l.wa_id, cfg.campanas[id].plantilla, "es", c.parametros(cfg, l), c.botones);
    await env.DB.prepare("INSERT OR REPLACE INTO campana_envios (campana, lead_id, ok, creado) VALUES (?, ?, ?, ?)")
      .bind(id, l.id, ok ? 1 : 0, ahoraISO()).run();
    ok ? enviados++ : fallidos++;
  }
  const quedan = (await env.DB.prepare(`SELECT COUNT(*) n ${BASE} AND ${c.filtro} ${NO_ENVIADO}`).bind(id).first()).n;
  return { enviados, fallidos, quedan };
}
