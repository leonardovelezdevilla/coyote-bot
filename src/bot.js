// Conversación del bot: menú con botones, sin inteligencia artificial.
// Pasos: edad → sede → información → clase de prueba o persona.
// Todos los textos y datos salen de la configuración que Katy edita en el panel.

import { cargarConfig, llenar, leerValor, guardarValor } from "./config.js";
import { wa } from "./whatsapp.js";
import { limaHoy, sumarDias, proximasFechas, fechaCorta, fechaLarga, ahoraISO } from "./fechas.js";

const SESION_HORAS = 24;
const PALABRAS_MENU = /^(hola|buenas|buenos|menu|menú|inicio|empezar|info|información|informacion)\b/i;
// Pedir una persona (sobre el texto ya sin tildes ni mayúsculas).
// «Fuerte»: siempre pasa con Katy. «Suave»: solo si no es una pregunta frecuente
// (así «¿cuánto cuesta por persona?» o «ayuda con el precio» reciben el precio).
const HUMANO_FUERTE = /\b(humano|humana|asesor|asesora|asesoria|asesores|operador|operadora|agente|encargado|encargada|administrador|administradora|secretaria|recepcion|atencion al cliente|persona real|una persona|alguna persona|otra persona)\b|\b(hablar|conversar|comunicarme|comunicarse|comunicar) con\b|\bque me atienda(n)?\b|\bme atienda(n)?\b|\bllam(ar|arme|ame|enme|eme|en|ada|adita|ado)\b|\bcontact(ar|arme|arse|o)\b|\bno (quiero|deseo) (hablar con )?(un |una )?(bot|robot|maquina)\b/;
const HUMANO_SUAVE = /\b(ayuda|ayudar|ayudame|ayudeme|alguien|persona|hablar|bot|robot|maquina)\b/;
const PALABRAS_PREGUNTAS = /^(preguntas( frecuentes)?|dudas|tengo (una |unas |algunas )?dudas?|faq|consultas?)\b/i;
const PALABRAS_BAJA = /^(baja|stop|darme de baja|no me escriban( más| mas)?|no (más|mas) mensajes|no quiero (más|mas) mensajes)\b/i;

// Si la persona toca un botón de una plantilla y Meta no manda el identificador,
// lo reconocemos por el texto del botón (deben coincidir con los de Meta).
const BOTONES_PLANTILLA = {
  "sí, voy": "CONFIRMA", "si, voy": "CONFIRMA", "cambiar día": "REPROGRAMA", "cambiar dia": "REPROGRAMA",
  "no pudimos ir": "REPROGRAMA", "quiero inscribirlo": "SEG_INSCRIBIR", "tengo una duda": "SEG_DUDA",
  "no me interesa": "CAMP_NO", "quiero continuar": "MARZO_SI", "sí, renovar": "RENOVAR_SI", "si, renovar": "RENOVAR_SI",
  "todo bien, volvemos": "FALTA_OK", "quiero conversar": "SEG_DUDA", "muy bien": "ENC_3", "bien": "ENC_2", "regular": "ENC_1", "sí, lo tomo": "CUPO_SI", "si, lo tomo": "CUPO_SI", "ya no": "CUPO_NO", "ya pagué": "PAGO_HECHO", "ya pague": "PAGO_HECHO",
};
const CANALES = { web: "Página web", fb: "Facebook", ig: "Instagram", google: "Google", volante: "Volante", cancha: "Pasó por la cancha" };

async function marcarNoContactar(env, waId, datos) {
  const r = await env.DB.prepare("UPDATE leads SET no_contactar = 1, actualizado = ? WHERE wa_id = ?").bind(ahoraISO(), waId).run();
  if (!r.meta.changes) await guardarLead(env, waId, { perfil: datos.perfil });
  await env.DB.prepare("UPDATE leads SET no_contactar = 1 WHERE wa_id = ?").bind(waId).run();
}

// ---------- Base de datos ----------

async function leerSesion(env, waId) {
  const s = await env.DB.prepare("SELECT paso, datos, actualizado FROM sesiones WHERE wa_id = ?").bind(waId).first();
  if (!s) return { paso: null, datos: {} };
  const vencida = Date.now() - Date.parse(s.actualizado) > SESION_HORAS * 3600 * 1000;
  return { paso: vencida ? null : s.paso, datos: JSON.parse(s.datos || "{}") };
}

async function guardarSesion(env, waId, paso, datos) {
  await env.DB.prepare(
    "INSERT INTO sesiones (wa_id, paso, datos, actualizado) VALUES (?1, ?2, ?3, ?4) " +
    "ON CONFLICT(wa_id) DO UPDATE SET paso = ?2, datos = ?3, actualizado = ?4",
  ).bind(waId, paso, JSON.stringify(datos), ahoraISO()).run();
}

async function guardarLead(env, waId, campos) {
  const ahora = ahoraISO();
  const existe = await env.DB.prepare("SELECT id, estado FROM leads WHERE wa_id = ?").bind(waId).first();
  if (!existe) {
    await env.DB.prepare(
      "INSERT INTO leads (wa_id, perfil, padre, edad, sede, origen, estado, clase_fecha, creado, actualizado) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      waId, campos.perfil ?? null, campos.padre ?? null, campos.edad ?? null, campos.sede ?? null,
      campos.origen ?? "WhatsApp", campos.estado ?? "consulta", campos.clase_fecha ?? null, ahora, ahora,
    ).run();
    return;
  }
  // No retroceder a un lead que ya avanzó (p. ej. inscrito) por volver a escribir
  const orden = ["consulta", "espera", "agendada", "quiere_inscribirse", "asistio", "inscrito"];
  if (campos.estado && orden.indexOf(campos.estado) < orden.indexOf(existe.estado)) delete campos.estado;
  if (campos.clase_fecha) campos.recordatorio_enviado = 0;
  const permitidos = ["perfil", "padre", "edad", "sede", "estado", "clase_fecha", "recordatorio_enviado", "archivado", "origen", "nota"];
  const claves = Object.keys(campos).filter((k) => permitidos.includes(k) && campos[k] !== undefined);
  if (!claves.length) return;
  const sql = `UPDATE leads SET ${claves.map((k) => `${k} = ?`).join(", ")}, actualizado = ? WHERE wa_id = ?`;
  await env.DB.prepare(sql).bind(...claves.map((k) => campos[k]), ahora, waId).run();
}

// ---------- Ayudas ----------

const sedesActivas = (cfg) => Object.entries(cfg.sedes).filter(([, s]) => s.activa);
const primerNombre = (t) => (t || "").trim().split(/\s+/)[0] || "";

export function variablesSede(cfg, sedeId) {
  const s = cfg.sedes[sedeId] || {};
  const preventa = limaHoy() <= cfg.finPreventa;
  const finTxt = fechaLarga(cfg.finPreventa).replace(/^\S+ /, "");
  return {
    sede: s.nombre || "",
    lugar: s.lugar || "",
    direccion: s.direccion ? ` — ${s.direccion}` : "",
    mapa: s.mapa ? `\n🗺️ ${s.mapa}` : "",
    horario: s.horario || "Te confirmamos el horario por este medio.",
    clases: cfg.clasesVerano,
    precio: cfg.precioVerano,
    precioCiclo: cfg.precioCiclo,
    uniforme: preventa && cfg.uniformePreventa < cfg.uniforme
      ? `Uniforme (camiseta, short y medias): ~S/ ${cfg.uniforme}~ *S/ ${cfg.uniformePreventa}* si te inscribes hasta el ${finTxt}`
      : `Uniforme (camiseta, short y medias): S/ ${cfg.uniforme}`,
  };
}

export function enlaceHumano(cfg, datos) {
  const sede = datos.sede ? cfg.sedes[datos.sede]?.nombre : "";
  const partes = [`Hola ${cfg.nombreHumano}, soy ${datos.padre || datos.perfil || "un papá/mamá"}.`];
  if (datos.edad || sede) partes.push(`Consulto por mi hijo(a)${datos.edad ? ` de ${datos.edad}` : ""}${sede ? `, sede ${sede}` : ""}.`);
  if (datos.clase_fecha) partes.push(`Tengo clase de prueba el ${fechaLarga(datos.clase_fecha)}.`);
  if (datos.quiereInscribir) partes.push("Quiero inscribirlo(a).");
  return `https://wa.me/${cfg.whatsappHumano}?text=${encodeURIComponent(partes.join(" "))}`;
}

const conEnlace = (texto, enlace) => (texto.includes(enlace) ? texto : `${texto}\n\n${enlace}`);

// ---------- Pasos ----------

async function pedirEdad(env, cfg, to, perfil) {
  const T = cfg.textos;
  await wa.lista(env, to, llenar(T.saludo, { nombre: primerNombre(perfil), escuela: cfg.escuela }), T.botonEdad,
    cfg.edades.map((e) => [e.id, e.titulo, e.desc]));
}

async function pedirSede(env, cfg, to) {
  const activas = sedesActivas(cfg);
  if (activas.length <= 3) {
    await wa.botones(env, to, cfg.textos.preguntaSede, activas.map(([id, s]) => [id, s.corto]));
  } else {
    await wa.lista(env, to, cfg.textos.preguntaSede, "Elegir sede", activas.map(([id, s]) => [id, s.corto, s.lugar]));
  }
}

async function mostrarInfo(env, cfg, to, datos) {
  const T = cfg.textos;
  let info = llenar(T.info, variablesSede(cfg, datos.sede));
  const edad = cfg.edades.find((e) => e.id === datos.edadId);
  if (edad?.mensaje) info += `\n\n${edad.mensaje}`;
  await wa.texto(env, to, info);
  await wa.botones(env, to, T.preguntaAccion, [
    ["CLASE", llenar(T.botonClase, {})],
    ["INSCRIBIR", llenar(T.botonInscribir, {})],
    ["HUMANO", llenar(T.botonHumano, { humano: cfg.nombreHumano })],
  ]);
}

async function ofrecerFechas(env, cfg, to) {
  const c = cfg.clasePrueba;
  const fechas = proximasFechas(c.diaSemana, c.opciones);
  await wa.lista(env, to, llenar(cfg.textos.preguntaFecha, { hora: c.hora || "" }), cfg.textos.botonFecha,
    fechas.map((f) => [`F_${f}`, fechaCorta(f)]));
}

const horaLima = () => Number(new Date(Date.now() - 5 * 3600e3).toISOString().slice(11, 13));
export const enHorario = (cfg) => { const h = horaLima(); return h >= cfg.atencion.desde && h < cfg.atencion.hasta; };
export const horaTxt = (h) => (h === 0 || h === 24 ? "12 de la noche" : h === 12 ? "12 del mediodía" : h < 12 ? `${h} a. m.` : `${h - 12} p. m.`);

// Katy (o el bot) pasa a atender ese chat
export async function cambiarAtencion(env, waId, modo, { sumarNoLeido = false } = {}) {
  await env.DB.prepare(
    `UPDATE leads SET atencion = ?, atencion_desde = ?${sumarNoLeido ? ", no_leidos = no_leidos + 1" : ""}${modo === "bot" ? ", no_leidos = 0" : ""} WHERE wa_id = ?`,
  ).bind(modo, ahoraISO(), waId).run();
}

async function derivar(env, cfg, to, datos, motivo) {
  const quien = datos.padre || datos.perfil || "Un papá o mamá";
  const detalle = [datos.edad, datos.sede ? cfg.sedes[datos.sede]?.nombre : null].filter(Boolean).join(", ");
  const que = motivo === "inscribir" ? "quiere inscribir a su hijo(a)" : "pidió hablar con una persona";

  // Katy responde desde el panel, con el mismo número del bot
  if (cfg.atencion?.modo === "panel") {
    const T = cfg.textos;
    let t = llenar(motivo === "inscribir" ? T.derivarInscribirPanel : T.derivarHumanoPanel, { humano: cfg.nombreHumano });
    if (!enHorario(cfg)) t += "\n\n" + llenar(T.fueraHorario, { humano: cfg.nombreHumano, desde: horaTxt(cfg.atencion.desde), hasta: horaTxt(cfg.atencion.hasta) });
    await wa.texto(env, to, t);
    if (motivo !== "inscribir") await enviarListaPreguntas(env, cfg, to, llenar(T.listaMientras, { humano: cfg.nombreHumano }));
    await cambiarAtencion(env, to, "humano", { sumarNoLeido: true });
    const url = await leerValor(env, "url_panel");
    await avisar(env, cfg, `${quien}${detalle ? ` (${detalle})` : ""} ${que}. Respóndele desde el panel${url ? `: ${url}#chat-${to}` : ""}`);
    return;
  }

  // Modo "whatsapp": el padre escribe al número personal de Katy
  const enlace = enlaceHumano(cfg, datos);
  const plantilla = motivo === "inscribir" ? cfg.textos.derivarInscribir : cfg.textos.derivarHumano;
  await wa.texto(env, to, conEnlace(llenar(plantilla, { humano: cfg.nombreHumano, enlace }), enlace));
  if (motivo !== "inscribir") await enviarListaPreguntas(env, cfg, to, llenar(cfg.textos.listaMientras, { humano: cfg.nombreHumano }));
  await avisar(env, cfg, `${quien}${detalle ? ` (${detalle})` : ""} ${que}. Escríbele aquí: https://wa.me/${to}`);
}

// ---------- Preguntas frecuentes ----------

const normal = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,;:]/g, " ");

export function buscarPregunta(cfg, texto) {
  const t = ` ${normal(texto).replace(/\s+/g, " ")} `;
  for (const p of cfg.preguntas || []) {
    const palabras = String(p.palabras || "").split(",").map((w) => normal(w).trim().replace(/\s+/g, " ")).filter(Boolean);
    if (palabras.some((w) => t.includes(` ${w} `))) return p;
  }
  return null;
}

export function variablesGenerales(cfg) {
  const activas = sedesActivas(cfg);
  const v = variablesSede(cfg, activas[0]?.[0]);
  return {
    sedes: activas.map(([, s]) => `• *${s.nombre}*: ${s.lugar}${s.direccion ? ` — ${s.direccion}` : ""}${s.mapa ? ` (${s.mapa})` : ""}`).join("\n"),
    horarios: activas.map(([, s]) => `• *${s.nombre}*: ${s.horario || "te lo confirmamos por este medio"}`).join("\n"),
    clases: cfg.clasesVerano, precio: cfg.precioVerano, precioCiclo: cfg.precioCiclo, uniforme: v.uniforme,
    humano: cfg.nombreHumano, escuela: cfg.escuela, hermanos: cfg.descuentoHermanos || "",
    pagoNumero: cfg.pago?.numero || "[número de Yape por confirmar]", pagoTitular: cfg.pago?.titular || "[titular por confirmar]", pagoNota: cfg.pago?.nota || "",
  };
}

// Cupos por sede: cuántos inscritos hay y si queda lugar
export async function sedeLlena(env, cfg, sedeId) {
  const cupos = Number(cfg.sedes[sedeId]?.cupos) || 0;
  if (!cupos) return false;
  const r = await env.DB.prepare("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND estado = 'inscrito' AND sede = ?").bind(sedeId).first();
  return (r?.n || 0) >= cupos;
}

function coordenadas(s) {
  const m = String(s?.coordenadas || "").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

async function enviarUbicacion(env, cfg, to, sedeId) {
  const s = cfg.sedes[sedeId]; const c = coordenadas(s);
  if (c) await wa.ubicacion(env, to, c[0], c[1], `${cfg.escuela} · ${s.nombre}`, [s.lugar, s.direccion].filter(Boolean).join(", "));
}

// ---------- Cuando el bot no entiende ----------

const NUMEROS = { uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18 };

export function leerEdad(texto) {
  const t = normal(texto);
  if (!t.trim() || t.length > 80) return null;
  const conAnos = t.match(/(\d{1,2})\s*(anos|ano|anitos|anito)\b/);
  if (conAnos) return Number(conAnos[1]);
  const nums = t.match(/\d{1,2}/g) || t.split(/\s+/).filter((x) => x in NUMEROS).map((x) => NUMEROS[x]);
  return nums.length === 1 ? Number(nums[0]) : null;
}

// «tengo 2 hijos de 7 y 9», «7 y 10 años» → edades de los hermanos (sin contar el «2 hijos»)
export function leerHermanos(texto) {
  const t = normal(texto);
  const sinCantidad = t.replace(/\b(\d|dos|tres|cuatro)\s+(hijos|hijas|ninos|ninas|chicos|hermanos|hermanas)\b/g, " ");
  const nums = (sinCantidad.match(/\d{1,2}/g) || []).map(Number).concat(sinCantidad.split(/\s+/).filter((x) => x in NUMEROS).map((x) => NUMEROS[x]));
  const edades = [...new Set(nums.filter((n) => n >= 2 && n <= 18))];
  return edades.length >= 2 ? edades.sort((a, b) => b - a) : null;
}

export function leerFecha(cfg, texto) {
  const c = cfg.clasePrueba;
  const opciones = proximasFechas(c.diaSemana, c.opciones);
  const t = ` ${normal(texto).replace(/\s+/g, " ")} `;
  const d = t.match(/(\d{1,2})/);
  if (d) return opciones.find((o) => Number(o.slice(8)) === Number(d[1])) || null;
  if (/ (siguiente|segundo|subsiguiente) /.test(t)) return opciones[1] || null;
  const dia = normal(["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][c.diaSemana]);
  if (/ (este|esta|primer|primero|proximo|mas cercano) /.test(t) || t.includes(` ${dia} `)) return opciones[0];
  return null;
}

export const esCortesia = (texto) => {
  const t = normal(texto).trim();
  return t.length < 40 && (/^(muchas |mil )?gracias\b|^(ok|okey|oki|okay|listo|perfecto|genial|dale|bueno|ya|entendido|de acuerdo|excelente|super|chevere|bacan)\b/.test(t) || /^[\p{Extended_Pictographic}\s]+$/u.test(t));
};

export async function registrarNoEntendido(env, waId, paso, texto) {
  try {
    await env.DB.prepare("INSERT INTO no_entendidos (wa_id, paso, texto, creado) VALUES (?, ?, ?, ?)")
      .bind(waId, paso || null, String(texto).slice(0, 300), ahoraISO()).run();
  } catch (e) { console.log("No se pudo anotar el mensaje no entendido", e?.message); }
}

// Dice que no entendió y vuelve a preguntar; a la segunda vez seguida ofrece a una persona
async function noEntendido(env, cfg, to, paso, datos, texto, fallosPrevios) {
  await registrarNoEntendido(env, to, paso, texto);
  const humano = cfg.nombreHumano;
  if (fallosPrevios >= 1) {
    await wa.botones(env, to, llenar(cfg.textos.noEntendiOtraVez, { humano }), botonesAyuda(cfg, ["HUMANO", "PREGUNTAS", "MENU"]));
    return guardarSesion(env, to, paso, datos);
  }
  await wa.texto(env, to, llenar(cfg.textos.noEntendi, { humano }));
  await repreguntar(env, cfg, to, paso);
  datos.fallos = 1;
  return guardarSesion(env, to, paso, datos);
}

// ¿Pide hablar con una persona? (con el nombre de Katy también cuenta)
export function pidePersona(cfg, texto, esPregunta = false) {
  const t = ` ${normal(texto).replace(/\s+/g, " ")} `;
  const nombre = normal(cfg.nombreHumano || "").trim();
  if (HUMANO_FUERTE.test(t) || (nombre && t.includes(` ${nombre} `))) return true;
  return !esPregunta && HUMANO_SUAVE.test(t);
}

// Lista desplegable con las preguntas frecuentes (máx. 10)
async function enviarListaPreguntas(env, cfg, to, cuerpo) {
  const filas = (cfg.preguntas || []).filter((p) => p.enLista && p.titulo).slice(0, 10).map((p) => [`P_${p.id}`, p.titulo]);
  if (!filas.length) return false;
  await wa.lista(env, to, cuerpo || cfg.textos.listaPreguntas, cfg.textos.botonVerPreguntas, filas);
  return true;
}

// Responde una pregunta elegida de la lista
async function responderDeLista(env, cfg, to, datos, p) {
  await wa.texto(env, to, llenar(p.respuesta, variablesGenerales(cfg)));
  if (p.respuesta.includes("{sedes}") && datos.sede) await enviarUbicacion(env, cfg, to, datos.sede);
}

const botonesAyuda = (cfg, orden = ["MENU", "PREGUNTAS", "HUMANO"]) => {
  const t = { MENU: cfg.textos.botonMenu, PREGUNTAS: cfg.textos.botonPreguntas, HUMANO: llenar(cfg.textos.botonHumano, { humano: cfg.nombreHumano }) };
  const hay = (cfg.preguntas || []).some((p) => p.enLista && p.titulo);
  return orden.filter((id) => id !== "PREGUNTAS" || hay).map((id) => [id, llenar(t[id], {})]);
};

// Vuelve a hacer la pregunta del paso en que iba la conversación
async function repreguntar(env, cfg, to, paso) {
  if (paso === "edad") return wa.lista(env, to, "Para darte la información exacta, ¿qué edad tiene tu hijo o hija?", cfg.textos.botonEdad, cfg.edades.map((e) => [e.id, e.titulo, e.desc]));
  if (paso === "sede") return pedirSede(env, cfg, to);
  if (paso === "accion") return wa.botones(env, to, cfg.textos.preguntaAccion, [
    ["CLASE", llenar(cfg.textos.botonClase, {})], ["INSCRIBIR", llenar(cfg.textos.botonInscribir, {})], ["HUMANO", llenar(cfg.textos.botonHumano, { humano: cfg.nombreHumano })]]);
  if (paso === "fecha") return ofrecerFechas(env, cfg, to);
}

// Envía un aviso al WhatsApp de Katy con la plantilla "aviso_panel".
// Una variable de plantilla no admite saltos de línea ni muchos espacios.
export async function avisar(env, cfg, texto) {
  const a = cfg.avisos || {};
  if (!a.activo || !a.numero) return false;
  const limpio = texto.replace(/\s+/g, " ").trim().slice(0, 900).replace(/[.\s]+$/, "");
  return wa.plantilla(env, a.numero, a.plantilla, a.idioma || "es", [limpio], [], { sinHistorial: true });
}

// ---------- Entrada principal ----------

export async function atenderMensaje(env, msg, perfil) {
  const cfg = await cargarConfig(env);
  const to = msg.from;
  const sesion = await leerSesion(env, to);
  const datos = { ...sesion.datos, perfil: perfil || sesion.datos.perfil };
  delete datos.rescatado; // respondió: si vuelve a dejarla a medias, se le puede volver a escribir
  const fallosPrevios = datos.fallos || 0; // veces seguidas que el bot no entendió
  delete datos.fallos;
  const paso = sesion.paso;

  const texto = (msg.text?.body || msg.button?.text || "").trim();
  const respuestaId = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || msg.button?.payload
    || (msg.button?.text ? BOTONES_PLANTILLA[msg.button.text.trim().toLowerCase()] : null) || null;

  // Completar con lo que ya sabemos de esta persona (útil si vuelve días después)
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE wa_id = ?").bind(to).first();
  if (lead) {
    for (const k of ["sede", "edad", "padre", "clase_fecha"]) if (!datos[k] && lead[k]) datos[k] = lead[k];
  }

  // Pedir que no le escribamos más promociones
  if (!respuestaId && PALABRAS_BAJA.test(texto)) {
    await marcarNoContactar(env, to, datos);
    await wa.texto(env, to, "Entendido. No te enviaremos más promociones. Si necesitas algo, escríbenos cuando quieras.");
    return guardarSesion(env, to, "fin", datos);
  }

  // Respuestas a los botones de los mensajes automáticos (recordatorio, seguimiento, campañas)
  if (respuestaId === "CONFIRMA") {
    await env.DB.prepare("UPDATE leads SET confirmado = 1, actualizado = ? WHERE wa_id = ?").bind(ahoraISO(), to).run();
    const s = cfg.sedes[datos.sede];
    await wa.texto(env, to, `¡Genial${datos.padre ? `, ${primerNombre(datos.padre)}` : ""}! Te esperamos${datos.clase_fecha ? ` el ${fechaLarga(datos.clase_fecha)}` : ""}${cfg.clasePrueba.hora ? ` a las ${cfg.clasePrueba.hora}` : ""}${s ? ` en ${s.lugar}${s.direccion ? `, ${s.direccion}` : ""}` : ""}. ⚽`);
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "REPROGRAMA") {
    if (!datos.sede) { await pedirSede(env, cfg, to); return guardarSesion(env, to, "sede", datos); }
    await ofrecerFechas(env, cfg, to);
    return guardarSesion(env, to, "fecha", datos);
  }
  if (["SEG_INSCRIBIR", "CAMP_SI", "MARZO_SI"].includes(respuestaId)) {
    datos.quiereInscribir = true;
    await guardarLead(env, to, { estado: "quiere_inscribirse" });
    await derivar(env, cfg, to, datos, "inscribir");
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "RENOVAR_SI") {
    await env.DB.prepare("UPDATE leads SET estado = 'quiere_inscribirse', actualizado = ? WHERE wa_id = ?").bind(ahoraISO(), to).run(); // sí retrocede desde inscrito: va a renovar
    await derivar(env, cfg, to, datos, "inscribir");
    return guardarSesion(env, to, "fin", datos);
  }
  if (/^ENC_[123]$/.test(respuestaId || "")) {
    const puntaje = Number(respuestaId.slice(4));
    if (lead) await env.DB.prepare("INSERT OR REPLACE INTO encuestas (lead_id, sede, puntaje, creado) VALUES (?, ?, ?, ?)").bind(lead.id, lead.sede, puntaje, ahoraISO()).run();
    if (puntaje === 1) {
      await wa.texto(env, to, `Gracias por decírnoslo. Queremos mejorar: ${cfg.nombreHumano} te escribe por aquí para conversar.`);
      await cambiarAtencion(env, to, "humano", { sumarNoLeido: true });
      await avisar(env, cfg, `${datos.padre || datos.perfil || "Una familia"} (${cfg.sedes[datos.sede]?.nombre || "sin sede"}) calificó la escuela como «Regular». Escríbele.`);
    } else await wa.texto(env, to, puntaje === 3 ? "¡Gracias! 🙌 Nos alegra mucho. Si conoces a otra familia, recomiéndanos: tu código está en el carnet." : "¡Gracias por responder! Si hay algo que podamos mejorar, cuéntanos por aquí.");
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "CUPO_SI") {
    await env.DB.prepare("UPDATE leads SET estado = 'quiere_inscribirse', actualizado = ? WHERE wa_id = ?").bind(ahoraISO(), to).run();
    await derivar(env, cfg, to, datos, "inscribir");
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "CUPO_NO") {
    await env.DB.prepare("UPDATE leads SET estado = 'perdido', actualizado = ? WHERE wa_id = ? AND estado = 'espera'").bind(ahoraISO(), to).run();
    await wa.texto(env, to, "Gracias por avisarnos. Si más adelante quieres volver, escríbenos por aquí 🙂");
    await avisarSiguienteEnEspera(env, cfg, datos.sede); // el cupo pasa al siguiente
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "PAGO_HECHO") {
    await wa.texto(env, to, `¡Gracias${datos.padre ? `, ${primerNombre(datos.padre)}` : ""}! Envíanos la captura por aquí y ${cfg.nombreHumano} lo confirma.`);
    await cambiarAtencion(env, to, "humano", { sumarNoLeido: true });
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "FALTA_OK") {
    const quien = primerNombre(datos.padre || datos.perfil);
    await wa.texto(env, to, `¡Qué bueno${quien ? `, ${quien}` : ""}! Los esperamos en la próxima clase ⚽`);
    return guardarSesion(env, to, "fin", datos);
  }
  if (["SEG_DUDA", "MARZO_DUDA"].includes(respuestaId)) {
    await derivar(env, cfg, to, datos);
    return guardarSesion(env, to, "fin", datos);
  }
  if (respuestaId === "CAMP_NO") {
    await marcarNoContactar(env, to, datos);
    await wa.texto(env, to, "Gracias por avisarnos. No te enviaremos más promociones. ¡Que tengas un buen día!");
    return guardarSesion(env, to, "fin", datos);
  }

  // Katy está atendiendo este chat: el bot no interrumpe
  if (lead?.atencion === "humano") {
    // Si Katy todavía no leyó lo pendiente, se espera más antes de que el bot retome
    const horas = Math.max(cfg.atencion?.devolverHoras || 12, lead.no_leidos > 0 ? 48 : 0);
    const vence = Date.parse(lead.atencion_desde || 0) + horas * 3600e3;
    if (Date.now() < vence) {
      // La lista de preguntas sigue funcionando mientras esperan a Katy
      if (respuestaId === "PREGUNTAS") { await enviarListaPreguntas(env, cfg, to); return guardarSesion(env, to, paso || "fin", datos); }
      const elegida = respuestaId?.startsWith("P_") ? (cfg.preguntas || []).find((x) => `P_${x.id}` === respuestaId) : null;
      if (elegida) { await responderDeLista(env, cfg, to, datos, elegida); return guardarSesion(env, to, paso || "fin", datos); }
      await env.DB.prepare("UPDATE leads SET no_leidos = no_leidos + 1 WHERE wa_id = ?").bind(to).run();
      return guardarSesion(env, to, paso || "fin", datos);
    }
    await cambiarAtencion(env, to, "bot"); // pasó el tiempo: el bot vuelve a atender
  }

  // Reacciones (👍) no necesitan respuesta
  if (msg.type === "reaction") return;

  // Bot en pausa: registrar la consulta y derivar a una persona
  if (!cfg.activo) {
    if (!paso) await guardarLead(env, to, { perfil: datos.perfil, origen: msg.referral ? "Anuncio" : "WhatsApp", archivado: 0 });
    const enlace = enlaceHumano(cfg, datos);
    await wa.texto(env, to, conEnlace(llenar(cfg.textos.pausado, { escuela: cfg.escuela, humano: cfg.nombreHumano, enlace }), enlace));
    return guardarSesion(env, to, "fin", datos);
  }

  // Código de referido (el código del carnet de otra familia) en cualquier momento
  if (cfg.referidos?.activo && texto && !respuestaId && !lead?.referido_por) {
    const cod = (texto.toUpperCase().match(/\b[A-Z2-9]{10}\b/g) || []).find((c) => /\d/.test(c) || /[A-Z]{10}/.test(c));
    if (cod) {
      const ref = await env.DB.prepare("SELECT id, padre, perfil, wa_id FROM leads WHERE token = ? AND archivado = 0").bind(cod).first();
      if (ref && ref.wa_id !== to) {
        if (!lead) await guardarLead(env, to, { perfil: datos.perfil, origen: "Referido", archivado: 0 });
        await env.DB.prepare("UPDATE leads SET referido_por = ?, origen = CASE WHEN origen IN ('WhatsApp', 'Página web') OR origen IS NULL THEN 'Referido' ELSE origen END WHERE wa_id = ?").bind(ref.id, to).run();
        await wa.texto(env, to, llenar(cfg.textos.referido, { nombre: primerNombre(ref.padre || ref.perfil) || "Una familia", beneficio: cfg.referidos.beneficio || "" }));
        if (!paso) { await pedirEdad(env, cfg, to, datos.perfil); return guardarSesion(env, to, "edad", datos); }
        await repreguntar(env, cfg, to, paso); return guardarSesion(env, to, paso, datos);
      }
    }
  }

  // Primer contacto (o sesión vencida): registrar y empezar
  if (!paso) {
    const canal = texto.match(/#(web|fb|ig|google|volante|cancha)\b/i);
    await guardarLead(env, to, { perfil: datos.perfil, origen: canal ? CANALES[canal[1].toLowerCase()] : msg.referral ? "Anuncio" : "WhatsApp", archivado: 0 });
    const p = texto && !respuestaId ? buscarPregunta(cfg, texto) : null;
    if (texto && !respuestaId && pidePersona(cfg, texto, true)) { // en el primer mensaje, solo si lo pide claramente
      await derivar(env, cfg, to, datos); // «Quiero hablar con un asesor» desde el primer mensaje
      return guardarSesion(env, to, "fin", datos);
    }
    if (p) await wa.texto(env, to, llenar(p.respuesta, variablesGenerales(cfg))); // primero responde lo que preguntó
    await pedirEdad(env, cfg, to, datos.perfil);
    return guardarSesion(env, to, "edad", datos);
  }

  // Audios, fotos, stickers, etc.: el bot solo lee texto
  if (!texto && !respuestaId) {
    await wa.botones(env, to, llenar(cfg.textos.soloTexto, { humano: cfg.nombreHumano }), botonesAyuda(cfg));
    return guardarSesion(env, to, paso, datos);
  }

  // Atajos que funcionan en cualquier momento (salvo cuando pedimos el nombre)
  // Pregunta frecuente escrita a su manera (se responde en cada paso, si lo escrito no era la respuesta esperada)
  const pregunta = paso !== "nombre" && !respuestaId ? buscarPregunta(cfg, texto) : null;
  const pideHumano = pidePersona(cfg, texto, !!pregunta);
  const responderPregunta = async (repetir = true) => {
    await wa.texto(env, to, llenar(pregunta.respuesta, variablesGenerales(cfg)));
    if (pregunta.respuesta.includes("{sedes}") && datos.sede) await enviarUbicacion(env, cfg, to, datos.sede);
    if (repetir) await repreguntar(env, cfg, to, paso); // y sigue donde iba
    return guardarSesion(env, to, paso, datos);
  };
  const noEntiende = () => noEntendido(env, cfg, to, paso, datos, texto, fallosPrevios);

  if (paso !== "nombre" && !respuestaId) {
    if (pideHumano) { await derivar(env, cfg, to, datos); return guardarSesion(env, to, "fin", datos); }
    if (!pregunta && PALABRAS_MENU.test(texto)) { await pedirEdad(env, cfg, to, datos.perfil); return guardarSesion(env, to, "edad", datos); }
    if (!pregunta && PALABRAS_PREGUNTAS.test(texto) && (await enviarListaPreguntas(env, cfg, to))) return guardarSesion(env, to, paso, datos);
    // «Gracias», «ok», 👍: no hace falta repetir nada
    if (!pregunta && esCortesia(texto)) { await wa.texto(env, to, llenar(cfg.textos.deNada, { humano: cfg.nombreHumano })); return guardarSesion(env, to, paso, datos); }
  }
  if (respuestaId === "HUMANO") { await derivar(env, cfg, to, datos); return guardarSesion(env, to, "fin", datos); }
  if (respuestaId === "MENU") { await pedirEdad(env, cfg, to, datos.perfil); return guardarSesion(env, to, "edad", datos); }
  if (respuestaId === "PREGUNTAS") { await enviarListaPreguntas(env, cfg, to); return guardarSesion(env, to, paso, datos); }
  if (respuestaId?.startsWith("P_")) {
    const p = (cfg.preguntas || []).find((x) => `P_${x.id}` === respuestaId);
    if (!p) { await enviarListaPreguntas(env, cfg, to); return guardarSesion(env, to, paso, datos); } // la lista cambió
    await responderDeLista(env, cfg, to, datos, p);
    if (["edad", "sede", "accion", "fecha"].includes(paso)) await repreguntar(env, cfg, to, paso); // y sigue donde iba
    else await wa.botones(env, to, cfg.textos.menuFin, botonesAyuda(cfg));
    return guardarSesion(env, to, ["edad", "sede", "accion", "fecha"].includes(paso) ? paso : "fin", datos);
  }

  switch (paso) {
    case "edad": {
      let edad = cfg.edades.find((e) => e.id === respuestaId);
      let titulo = edad?.titulo;
      const hermanos = !edad && !respuestaId ? leerHermanos(texto) : null;
      if (hermanos) { // «tengo 2 hijos de 7 y 9»: seguimos con el mayor y anotamos a los demás
        const mayor = hermanos[0];
        edad = cfg.edades.find((e) => mayor >= e.min && mayor <= e.max);
        if (edad) {
          titulo = `${mayor} años`;
          datos.hermanos = hermanos;
          await guardarLead(env, to, { nota: `Hermanos: ${hermanos.join(" y ")} años` });
          await wa.texto(env, to, llenar(cfg.textos.hermanos, { cantidad: `${hermanos.length} ${hermanos.length === 2 ? "hermanos" : "niños"}`, edad: titulo, hermanos: cfg.descuentoHermanos || "" }));
        }
      }
      const n = !edad ? leerEdad(texto) : null; // «8», «tiene 8 años», «ocho añitos»
      if (n != null) {
        edad = cfg.edades.find((e) => n >= e.min && n <= e.max);
        if (edad) titulo = `${n} ${n === 1 ? "año" : "años"}`;
        else {
          const min = Math.min(...cfg.edades.map((e) => e.min)), max = Math.max(...cfg.edades.map((e) => e.max));
          await wa.botones(env, to, `Entrenamos de ${min} a ${max} años. Si quieres consultar por otra edad, ${cfg.nombreHumano} te ayuda.`, [
            ["HUMANO", llenar(cfg.textos.botonHumano, { humano: cfg.nombreHumano })], ["MENU", llenar(cfg.textos.botonMenu, {})]]);
          return guardarSesion(env, to, "edad", datos);
        }
      }
      if (!edad) return pregunta ? responderPregunta() : noEntiende();
      datos.edad = titulo;
      datos.edadId = edad.id;
      await guardarLead(env, to, { edad: datos.edad });
      await pedirSede(env, cfg, to);
      return guardarSesion(env, to, "sede", datos);
    }

    case "sede": {
      if (respuestaId === "ESPERA" && datos.sedeLlena) {
        datos.sede = datos.sedeLlena;
        await guardarLead(env, to, { sede: datos.sede, estado: "espera" });
        await wa.texto(env, to, llenar(cfg.textos.listaEspera, { sede: cfg.sedes[datos.sede].nombre, humano: cfg.nombreHumano }));
        await avisar(env, cfg, `${datos.padre || datos.perfil || "Un papá o mamá"}${datos.edad ? ` (${datos.edad})` : ""} quedó en lista de espera de ${cfg.sedes[datos.sede].nombre}`);
        return guardarSesion(env, to, "fin", datos);
      }
      const activas = Object.fromEntries(sedesActivas(cfg));
      let sede = activas[respuestaId] ? respuestaId : null;
      if (!sede) {
        const t = texto.toLowerCase();
        sede = Object.keys(activas).find((id) => {
          const s = activas[id];
          return t === id.toLowerCase() || [s.nombre, s.corto].some((n) => n && t.includes(n.toLowerCase()));
        }) || null;
        if (!sede && activas.LO && /olivos/.test(t)) sede = "LO";
        if (!sede && activas.SMP && /smp|martin|martín|canta/.test(t)) sede = "SMP";
        if (!sede && activas.PP && /puente|piedra/.test(t)) sede = "PP";
      }
      if (!sede) return pregunta ? responderPregunta() : noEntiende();
      if (await sedeLlena(env, cfg, sede)) {
        datos.sedeLlena = sede;
        const otras = sedesActivas(cfg).filter(([id]) => id !== sede).slice(0, 2).map(([id, s]) => [id, s.corto]);
        await wa.botones(env, to, llenar(cfg.textoSedeLlena, { sede: cfg.sedes[sede].nombre, humano: cfg.nombreHumano }), [...otras, ["ESPERA", "Lista de espera"]]);
        return guardarSesion(env, to, "sede", datos);
      }
      datos.sede = sede;
      await guardarLead(env, to, { sede });
      await mostrarInfo(env, cfg, to, datos);
      return guardarSesion(env, to, "accion", datos);
    }

    case "accion": {
      if (pregunta) return responderPregunta();
      if (respuestaId === "CLASE" || /prueba|clase/i.test(texto)) {
        await ofrecerFechas(env, cfg, to);
        return guardarSesion(env, to, "fecha", datos);
      }
      if (respuestaId === "INSCRIBIR" || /inscrib/i.test(texto)) {
        datos.quiereInscribir = true;
        await guardarLead(env, to, { estado: "quiere_inscribirse" });
        await derivar(env, cfg, to, datos, "inscribir");
        return guardarSesion(env, to, "fin", datos);
      }
      return noEntiende();
    }

    case "fecha": {
      const f = respuestaId?.startsWith("F_") ? respuestaId.slice(2) : leerFecha(cfg, texto); // también «el 21», «este sábado»
      if (!f) return pregunta ? responderPregunta() : noEntiende();
      datos.clase_fecha = f;
      if (!datos.padre) {
        await wa.texto(env, to, cfg.textos.pedirNombre);
        return guardarSesion(env, to, "nombre", datos);
      }
      // Ya sabemos su nombre (p. ej. está cambiando de día): confirmamos directo
      return confirmarClase(env, cfg, to, datos, datos.padre);
    }

    case "nombre": {
      const nombre = texto.replace(/\s+/g, " ").slice(0, 40);
      if (!nombre) { await wa.texto(env, to, cfg.textos.pedirNombre); return; }
      return confirmarClase(env, cfg, to, datos, nombre);
    }

    default:
      if (pregunta) return responderPregunta(false);
      return pasoFinal(env, cfg, to, datos, texto);
  }
}

async function confirmarClase(env, cfg, to, datos, nombre) {
  datos.padre = nombre;
  await guardarLead(env, to, { padre: nombre, estado: "agendada", clase_fecha: datos.clase_fecha });
  await env.DB.prepare("UPDATE leads SET confirmado = 0, seguimiento_enviado = 0 WHERE wa_id = ?").bind(to).run();
  const v = variablesSede(cfg, datos.sede);
  await wa.texto(env, to, llenar(cfg.textos.confirmacion, {
    ...v, nombre: primerNombre(nombre), fecha: fechaLarga(datos.clase_fecha),
    hora: cfg.clasePrueba.hora || "hora por confirmar", queTraer: cfg.clasePrueba.queTraer,
  }));
  await enviarUbicacion(env, cfg, to, datos.sede);
  return guardarSesion(env, to, "fin", datos);
}

// "fin": la persona ya terminó un recorrido
async function pasoFinal(env, cfg, to, datos, texto) {
  if (/cambiar/i.test(texto) && datos.sede) {
    await ofrecerFechas(env, cfg, to);
    return guardarSesion(env, to, "fecha", datos);
  }
  if (/inscrib|matricul/i.test(texto)) {
    await guardarLead(env, to, { estado: "quiere_inscribirse" });
    await derivar(env, cfg, to, datos, "inscribir");
    return guardarSesion(env, to, "fin", datos);
  }
  if (/clase (de )?prueba|clase gratis/i.test(texto) && datos.sede) {
    await ofrecerFechas(env, cfg, to);
    return guardarSesion(env, to, "fecha", datos);
  }
  if (texto) await registrarNoEntendido(env, to, "fin", texto);
  await wa.botones(env, to, cfg.textos.menuFin, botonesAyuda(cfg));
  return guardarSesion(env, to, "fin", datos);
}

// =====================================================================
// AUTOMATIZACIONES (corren cada hora desde el cron)
// Cada tarea envía por tandas pequeñas para respetar los límites del plan
// gratuito de Cloudflare; lo que falte sale en la hora siguiente.
// =====================================================================

const TANDA = 15;

// Recordatorio el día anterior a la clase, con botones "Sí, voy" / "Cambiar día"
export async function enviarRecordatorios(env) {
  const cfg = await cargarConfig(env);
  const manana = sumarDias(limaHoy(), 1);
  const { results } = await env.DB.prepare(
    "SELECT id, wa_id, padre, sede, clase_fecha FROM leads WHERE archivado = 0 AND estado = 'agendada' AND clase_fecha = ? " +
    "AND recordatorio_enviado = 0 AND wa_id IS NOT NULL LIMIT ?",
  ).bind(manana, TANDA).all();
  const p = cfg.plantillaRecordatorio;
  const hora = cfg.clasePrueba.hora || "la hora acordada";
  const botones = cfg.automatizaciones?.confirmarAsistencia ? ["CONFIRMA", "REPROGRAMA"] : [];
  let enviados = 0;
  for (const l of results) {
    const ok = await wa.plantilla(env, l.wa_id, p.nombre, p.idioma, [
      primerNombre(l.padre) || "familia", cfg.sedes[l.sede]?.nombre || "la sede", fechaLarga(l.clase_fecha), hora,
    ], botones);
    // Se marca aunque falle, para no reintentar sin fin; el error queda en el registro
    await env.DB.prepare("UPDATE leads SET recordatorio_enviado = ? WHERE id = ?").bind(ok ? 1 : 2, l.id).run();
    if (ok) enviados++;
  }
  return { fecha: manana, revisados: results.length, enviados };
}

// Al día siguiente de la clase de prueba: "¿Qué tal estuvo?" con botones
export async function enviarSeguimientos(env) {
  const cfg = await cargarConfig(env);
  const s = cfg.automatizaciones?.seguimientoClase;
  if (!s?.activo) return { activo: false };
  const ayer = sumarDias(limaHoy(), -1);
  const { results } = await env.DB.prepare(
    "SELECT id, wa_id, padre, sede FROM leads WHERE archivado = 0 AND no_contactar = 0 AND clase_fecha = ? " +
    "AND estado IN ('agendada', 'asistio') AND seguimiento_enviado = 0 AND wa_id IS NOT NULL LIMIT ?",
  ).bind(ayer, TANDA).all();
  let enviados = 0;
  for (const l of results) {
    const ok = await wa.plantilla(env, l.wa_id, s.plantilla, "es",
      [primerNombre(l.padre) || "familia", cfg.sedes[l.sede]?.nombre || "la sede"], ["SEG_INSCRIBIR", "SEG_DUDA", "REPROGRAMA"]);
    await env.DB.prepare("UPDATE leads SET seguimiento_enviado = ? WHERE id = ?").bind(ok ? 1 : 2, l.id).run();
    if (ok) enviados++;
  }
  return { fecha: ayer, revisados: results.length, enviados };
}

// Se liberó un cupo en una sede: avisar al primero de la lista de espera (una vez por persona)
export async function avisarSiguienteEnEspera(env, cfg, sedeId) {
  if (!cfg.listaEspera?.avisarAutomatico || !sedeId) return null;
  if (await sedeLlena(env, cfg, sedeId)) return null;
  const l = await env.DB.prepare("SELECT id, wa_id, padre, perfil FROM leads WHERE archivado = 0 AND no_contactar = 0 AND estado = 'espera' AND sede = ? AND espera_avisado IS NULL AND wa_id IS NOT NULL ORDER BY creado LIMIT 1").bind(sedeId).first();
  if (!l) return null;
  const ok = await wa.plantilla(env, l.wa_id, cfg.listaEspera.plantilla, "es", [primerNombre(l.padre || l.perfil) || "familia", cfg.sedes[sedeId]?.nombre || sedeId], ["CUPO_SI", "CUPO_NO"]);
  await env.DB.prepare("UPDATE leads SET espera_avisado = ? WHERE id = ?").bind(ahoraISO(), l.id).run();
  if (ok) await avisar(env, cfg, `Se liberó un cupo en ${cfg.sedes[sedeId]?.nombre}: le avisamos a ${l.padre || l.perfil || "alguien"} de la lista de espera`);
  return ok;
}

// Cupos: si una sede pasa el porcentaje de alerta, aviso a Katy (una vez por nivel)
export async function revisarCupos(env, cfg, sedeId) {
  const cupos = Number(cfg.sedes[sedeId]?.cupos) || 0; if (!cupos) return;
  const n = (await env.DB.prepare("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND estado = 'inscrito' AND sede = ?").bind(sedeId).first())?.n || 0;
  const pct = Math.round((n / cupos) * 100), umbral = Number(cfg.alertaCupos) || 80;
  const nivel = pct >= 100 ? "100" : pct >= umbral ? String(umbral) : "";
  if (!nivel) return;
  const clave = `cupos_aviso_${sedeId}`, antes = await leerValor(env, clave);
  if (antes === nivel) return;
  await guardarValor(env, clave, nivel);
  await avisar(env, cfg, pct >= 100
    ? `${cfg.sedes[sedeId].nombre} llegó a sus ${cupos} cupos. El bot ya ofrece otra sede o lista de espera. Si puedes alquilar más cancha, sube los cupos en Ajustes.`
    : `${cfg.sedes[sedeId].nombre} va en ${n} de ${cupos} cupos (${pct} %). Ve pensando en más cancha o un turno más.`);
}

// Cuotas: recordatorio 2 días antes y el día del vencimiento
export async function recordarCuotas(env) {
  const cfg = await cargarConfig(env);
  const c = cfg.cuotas; if (!c?.permitir) return { activo: false };
  const hoy = limaHoy(), pronto = sumarDias(hoy, 2);
  const { results } = await env.DB.prepare(
    "SELECT id, wa_id, padre, perfil, saldo, cuota_vence, cuota_avisada FROM leads WHERE archivado = 0 AND no_contactar = 0 AND saldo > 0 AND cuota_vence IS NOT NULL AND wa_id IS NOT NULL " +
    "AND ((cuota_avisada = 0 AND cuota_vence <= ?) OR (cuota_avisada = 1 AND cuota_vence <= ?)) LIMIT ?").bind(pronto, hoy, TANDA).all();
  let enviados = 0;
  for (const l of results) {
    const nivel = l.cuota_vence <= hoy ? 2 : 1;
    const ok = await wa.plantilla(env, l.wa_id, c.plantilla, "es", [primerNombre(l.padre || l.perfil) || "familia", `S/ ${l.saldo}`, nivel === 2 ? "hoy" : `el ${fechaLarga(l.cuota_vence)}`], ["PAGO_HECHO", "SEG_DUDA"]);
    await env.DB.prepare("UPDATE leads SET cuota_avisada = ? WHERE id = ?").bind(nivel, l.id).run();
    if (ok) enviados++;
  }
  return { revisados: results.length, enviados };
}

// Encuesta de satisfacción a las N semanas de inscrito
export async function enviarEncuestas(env) {
  const cfg = await cargarConfig(env);
  const e = cfg.encuesta; if (!e?.activo) return { activo: false };
  const limite = sumarDias(limaHoy(), -7 * (e.semanas || 4));
  const { results } = await env.DB.prepare("SELECT id, wa_id, padre, perfil FROM leads WHERE archivado = 0 AND no_contactar = 0 AND estado = 'inscrito' AND encuesta_enviada = 0 AND inscrito_desde IS NOT NULL AND inscrito_desde <= ? AND wa_id IS NOT NULL LIMIT ?").bind(limite, TANDA).all();
  let enviados = 0;
  for (const l of results) {
    const ok = await wa.plantilla(env, l.wa_id, e.plantilla, "es", [primerNombre(l.padre || l.perfil) || "familia"], ["ENC_3", "ENC_2", "ENC_1"]);
    await env.DB.prepare("UPDATE leads SET encuesta_enviada = ? WHERE id = ?").bind(ok ? 1 : 2, l.id).run();
    if (ok) enviados++;
  }
  return { revisados: results.length, enviados };
}

// Copia de seguridad de todas las tablas (JSON). Si hay depósito R2, se guarda ahí cada semana.
export async function copiaSeguridad(env) {
  const tablas = ["leads", "sesiones", "gastos", "ajustes", "mensajes", "campana_envios", "asistencias", "movimientos", "personal", "jornadas", "encuestas", "uniformes", "no_entendidos", "bitacora"];
  const datos = { creado: ahoraISO(), tablas: {} };
  for (const t of tablas) { try { datos.tablas[t] = (await env.DB.prepare(`SELECT * FROM ${t}`).all()).results; } catch { datos.tablas[t] = []; } }
  if (datos.tablas.personal) datos.tablas.personal = datos.tablas.personal.map(({ pin_hash, ...p }) => p); // sin PIN
  return datos;
}
export async function guardarCopia(env) {
  if (!env.COPIAS) return { guardada: false, motivo: "sin depósito R2" };
  const datos = await copiaSeguridad(env);
  const nombre = `copia-${limaHoy()}.json`;
  await env.COPIAS.put(nombre, JSON.stringify(datos), { httpMetadata: { contentType: "application/json" } });
  // conservar las últimas 12
  const lista = await env.COPIAS.list({ prefix: "copia-" });
  const viejas = lista.objects.map((o) => o.key).sort().slice(0, -12);
  for (const k of viejas) await env.COPIAS.delete(k);
  return { guardada: true, nombre };
}

// Reporte del mes anterior, el día 1
export async function enviarReporteMensual(env, urlPanel) {
  const cfg = await cargarConfig(env);
  if (!cfg.reporteMensual?.activo || !cfg.avisos?.activo) return { enviado: false };
  const hoy = limaHoy(); if (hoy.slice(8) !== "01") return { enviado: false, motivo: "no es día 1" };
  const d = new Date(hoy + "T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() - 1);
  const mes = d.toISOString().slice(0, 7), nombreMes = fechaLarga(mes + "-15").split(" de ").slice(1).join(" de ");
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).first();
  const ins = (await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND inscrito_desde LIKE ?", mes + "%"))?.n || 0;
  const con = (await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND creado LIKE ?", mes + "%"))?.n || 0;
  const caja = await q("SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) i, SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) e FROM movimientos WHERE fecha LIKE ?", mes + "%");
  const ads = (await q("SELECT SUM(monto) s FROM gastos WHERE semana LIKE ?", mes + "%"))?.s || 0;
  const asis = await q("SELECT COUNT(*) t, SUM(presente) p FROM asistencias WHERE fecha LIKE ?", mes + "%");
  const canal = await q("SELECT origen, COUNT(*) n FROM leads WHERE archivado = 0 AND estado = 'inscrito' AND inscrito_desde LIKE ? GROUP BY origen ORDER BY n DESC LIMIT 1", mes + "%");
  const ing = caja?.i || 0, egr = (caja?.e || 0) + ads;
  const partes = [`${con} ${con === 1 ? "persona escribió" : "personas escribieron"}`, `${ins} ${ins === 1 ? "inscripción" : "inscripciones"}`, `entró S/ ${Math.round(ing)}, salió S/ ${Math.round(egr)}, quedó S/ ${Math.round(ing - egr)}`];
  if (asis?.t) partes.push(`asistencia ${Math.round((asis.p / asis.t) * 100)} %`);
  if (canal?.origen) partes.push(`el canal que más inscribió fue ${canal.origen}`);
  const texto = `Resumen de ${nombreMes}: ${partes.join("; ")}. Recuerda descargar la copia completa del mes en Números.${urlPanel ? ` Panel: ${urlPanel}` : ""}`;
  const ok = await avisar(env, cfg, texto);
  if (cfg.reporteMensual.numeroExtra) await wa.plantilla(env, cfg.reporteMensual.numeroExtra, cfg.avisos.plantilla, cfg.avisos.idioma || "es", [texto.replace(/\s+/g, " ").slice(0, 1000)], [], { sinHistorial: true });
  return { enviado: !!ok, mes };
}

// Inscritos cuyas clases pagadas están por terminar: invitación a renovar
export async function enviarRenovaciones(env) {
  const cfg = await cargarConfig(env);
  const r = cfg.automatizaciones?.renovacion;
  if (!r?.activo) return { activo: false };
  const limite = sumarDias(limaHoy(), r.diasAntes || 0);
  // Se invita cuando le quedan 2 clases o menos (según la lista de asistencia) o cuando se acerca la fecha límite
  const { results } = await env.DB.prepare(
    "SELECT id, wa_id, padre FROM leads l WHERE archivado = 0 AND no_contactar = 0 AND estado = 'inscrito' AND renovacion_enviada = 0 AND wa_id IS NOT NULL " +
    "AND ((fin_ciclo IS NOT NULL AND fin_ciclo <= ?) OR (clases_pagadas IS NOT NULL AND clases_pagadas - 2 <= " +
    "(SELECT COUNT(*) FROM asistencias a WHERE a.lead_id = l.id AND a.presente = 1 AND a.fecha >= COALESCE(l.inscrito_desde, '0000')))) LIMIT ?",
  ).bind(limite, TANDA).all();
  let enviados = 0;
  for (const l of results) {
    const oferta = llenar(r.oferta || "", { precioCiclo: cfg.precioCiclo, precio: cfg.precioVerano, clases: cfg.clasesVerano });
    const ok = await wa.plantilla(env, l.wa_id, r.plantilla, "es", [primerNombre(l.padre) || "familia", oferta], ["RENOVAR_SI", "SEG_DUDA"]);
    await env.DB.prepare("UPDATE leads SET renovacion_enviada = ? WHERE id = ?").bind(ok ? 1 : 2, l.id).run();
    if (ok) enviados++;
  }
  return { revisados: results.length, enviados };
}

// Inscritos con varias faltas seguidas: mensaje para saber qué pasó
export async function avisarFaltas(env) {
  const cfg = await cargarConfig(env);
  const f = cfg.automatizaciones?.faltas;
  if (!f?.activo) return { activo: false };
  const n = Math.max(1, Number(f.seguidas) || 2);
  const { results } = await env.DB.prepare(
    "SELECT l.id, l.wa_id, l.padre, l.faltas_avisado FROM leads l WHERE l.archivado = 0 AND l.no_contactar = 0 AND l.estado = 'inscrito' AND l.wa_id IS NOT NULL " +
    "AND (SELECT COUNT(*) FROM asistencias a WHERE a.lead_id = l.id) >= ? LIMIT 200",
  ).bind(n).all();
  let enviados = 0;
  for (const l of results) {
    if (enviados >= TANDA) break;
    const { results: ult } = await env.DB.prepare("SELECT fecha, presente FROM asistencias WHERE lead_id = ? ORDER BY fecha DESC LIMIT ?").bind(l.id, n).all();
    if (ult.length < n || ult.some((a) => a.presente)) continue;
    if (l.faltas_avisado && l.faltas_avisado >= ult[n - 1].fecha) continue; // ya se avisó por esta racha
    const ok = await wa.plantilla(env, l.wa_id, f.plantilla, "es", [primerNombre(l.padre) || "familia", String(n)], ["FALTA_OK", "SEG_DUDA"]);
    await env.DB.prepare("UPDATE leads SET faltas_avisado = ? WHERE id = ?").bind(ult[0].fecha, l.id).run();
    if (ok) enviados++;
  }
  return { revisados: results.length, enviados };
}

// Quien dejó la conversación a medias recibe un empujón amable, una sola vez.
// Va dentro de las 24 horas desde su último mensaje, así que no necesita plantilla.
export async function rescatarConversaciones(env) {
  const cfg = await cargarConfig(env);
  const r = cfg.automatizaciones?.rescate;
  if (!r?.activo || !cfg.activo) return { activo: false };
  const desde = new Date(Date.now() - 23 * 3600e3).toISOString();
  const hasta = new Date(Date.now() - r.horas * 3600e3).toISOString();
  const { results } = await env.DB.prepare(
    "SELECT wa_id, paso, datos FROM sesiones WHERE paso IN ('edad', 'sede', 'accion', 'fecha') AND actualizado >= ? AND actualizado <= ? LIMIT 60",
  ).bind(desde, hasta).all();
  let enviados = 0;
  for (const ses of results) {
    if (enviados >= TANDA) break;
    const datos = JSON.parse(ses.datos || "{}");
    if (datos.rescatado) continue;
    const bloqueado = await env.DB.prepare("SELECT no_contactar, estado, atencion FROM leads WHERE wa_id = ?").bind(ses.wa_id).first();
    if (bloqueado?.no_contactar || bloqueado?.atencion === "humano" || ["inscrito", "quiere_inscribirse"].includes(bloqueado?.estado)) continue;
    const nombre = primerNombre(datos.padre || datos.perfil);
    const ok = ["accion", "fecha"].includes(ses.paso)
      ? await wa.botones(env, ses.wa_id, `Hola${nombre ? ` ${nombre}` : ""} 👋 ¿Te separo un cupo para la clase de prueba gratis? Solo toma un minuto.`,
        [["CLASE", llenar(cfg.textos.botonClase, {})], ["HUMANO", llenar(cfg.textos.botonHumano, { humano: cfg.nombreHumano })]])
      : await wa.botones(env, ses.wa_id, `Hola${nombre ? ` ${nombre}` : ""} 👋 Quedó pendiente tu consulta. ¿Te muestro precios y horarios?`,
        [["MENU", llenar(cfg.textos.botonMenu, {})], ["HUMANO", llenar(cfg.textos.botonHumano, { humano: cfg.nombreHumano })]]);
    datos.rescatado = true;
    // Se guarda sin cambiar "actualizado", para no extender la ventana de 24 h
    await env.DB.prepare("UPDATE sesiones SET datos = ?, paso = ? WHERE wa_id = ?")
      .bind(JSON.stringify(datos), ses.paso, ses.wa_id).run();
    if (ok) enviados++;
  }
  return { revisados: results.length, enviados };
}

// Resumen de la mañana para Katy. Los lunes incluye los números de la semana.
export async function enviarResumen(env, urlPanel) {
  const cfg = await cargarConfig(env);
  if (!cfg.avisos?.activo || !cfg.avisos?.resumenDiario) return { enviado: false, motivo: "desactivado" };
  const hoy = limaHoy();
  const ayer = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).first().then((r) => r?.n || 0);
  const porAtender = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND estado = 'quiere_inscribirse'");
  const clasesHoy = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND estado = 'agendada' AND clase_fecha = ?", hoy);
  const { results: manana } = await env.DB.prepare(
    "SELECT padre, sede, confirmado FROM leads WHERE archivado = 0 AND estado = 'agendada' AND clase_fecha = ? ORDER BY sede",
  ).bind(sumarDias(hoy, 1)).all();
  const nuevas = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND creado >= ?", ayer);
  const chats = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND atencion = 'humano' AND no_leidos > 0");
  const comprobantes = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND comprobante IS NOT NULL");
  const tardes = await q("SELECT COUNT(*) n FROM jornadas WHERE fecha = ? AND tarde = 1", sumarDias(hoy, -1));
  if (tardes) partes.push(`ayer ${tardes === 1 ? "un profesor llegó" : tardes + " profesores llegaron"} tarde`);
  const cuotas = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND saldo > 0 AND cuota_vence <= ?", hoy);
  const partes = [];
  if (cuotas) partes.push(`${cuotas} ${cuotas === 1 ? "cuota vencida" : "cuotas vencidas"} por cobrar`);
  if (comprobantes) partes.push(`${comprobantes} ${comprobantes === 1 ? "comprobante de pago por revisar" : "comprobantes de pago por revisar"}`);
  if (chats) partes.push(`${chats} ${chats === 1 ? "chat espera" : "chats esperan"} tu respuesta`);
  if (porAtender) partes.push(`${porAtender} ${porAtender === 1 ? "persona quiere" : "personas quieren"} inscribirse`);
  if (clasesHoy) partes.push(`${clasesHoy} ${clasesHoy === 1 ? "clase" : "clases"} de prueba hoy`);
  if (manana.length) {
    const nombres = manana.slice(0, 8).map((l) => `${primerNombre(l.padre) || "sin nombre"} en ${cfg.sedes[l.sede]?.nombre || l.sede}`).join(", ");
    partes.push(`${manana.length} ${manana.length === 1 ? "clase" : "clases"} de prueba mañana: ${nombres}${manana.length > 8 ? " y más" : ""}`);
  }
  if (nuevas) partes.push(`${nuevas} ${nuevas === 1 ? "consulta nueva" : "consultas nuevas"} desde ayer`);
  // Lunes: la semana anterior en números
  if (new Date(hoy + "T12:00:00Z").getUTCDay() === 1) {
    const hace7 = new Date(Date.now() - 7 * 86400e3).toISOString();
    const sem = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND creado >= ?", hace7);
    const ins = await q("SELECT COUNT(*) n FROM leads WHERE archivado = 0 AND estado = 'inscrito' AND actualizado >= ?", hace7);
    partes.push(`la semana pasada escribieron ${sem} y se inscribieron ${ins}. Recuerda anotar el gasto en anuncios`);
  }
  if (!partes.length) return { enviado: false, motivo: "nada que avisar" };
  const ok = await avisar(env, cfg, `Buenos días. Hoy tienes: ${partes.join("; ")}.${urlPanel ? ` Panel: ${urlPanel}` : ""}`);
  return { enviado: ok, partes };
}

// Limpieza de datos técnicos viejos
export async function limpiar(env) {
  const hace30 = new Date(Date.now() - 30 * 86400e3).toISOString();
  const hace60 = new Date(Date.now() - 60 * 86400e3).toISOString();
  await env.DB.prepare("DELETE FROM mensajes_procesados WHERE creado < ?").bind(hace30).run();
  await env.DB.prepare("DELETE FROM sesiones WHERE actualizado < ?").bind(hace60).run();
  // Los chats se guardan un año; después se borran solos
  const haceUnAno = new Date(Date.now() - 365 * 86400e3).toISOString();
  await env.DB.prepare("DELETE FROM mensajes WHERE creado < ?").bind(haceUnAno).run();
  await env.DB.prepare("DELETE FROM no_entendidos WHERE creado < ?").bind(new Date(Date.now() - 90 * 86400e3).toISOString()).run();
  await env.DB.prepare("DELETE FROM intentos WHERE actualizado < ?").bind(new Date(Date.now() - 86400e3).toISOString()).run();
  await env.DB.prepare("DELETE FROM bitacora WHERE creado < ?").bind(new Date(Date.now() - 180 * 86400e3).toISOString()).run();
  return { ok: true };
}

// Tareas de cada hora según la hora de Lima
export async function tareasDeLaHora(env, urlPanel, horaLima = Number(new Date(Date.now() - 5 * 3600e3).toISOString().slice(11, 13))) {
  const hecho = { hora: horaLima };
  const correr = async (nombre, fn) => { try { hecho[nombre] = await fn(); } catch (e) { hecho[nombre] = { error: String(e?.message || e) }; } };
  if (horaLima >= 8 && horaLima <= 21) await correr("rescate", () => rescatarConversaciones(env));
  if (horaLima === 8) await correr("resumen", () => enviarResumen(env, urlPanel));
  if (horaLima >= 10 && horaLima <= 20) await correr("recordatorios", () => enviarRecordatorios(env));
  if (horaLima >= 11 && horaLima <= 19) await correr("seguimientos", () => enviarSeguimientos(env));
  if (horaLima === 10) await correr("renovaciones", () => enviarRenovaciones(env));
  if (horaLima === 10) await correr("cuotas", () => recordarCuotas(env));
  if (horaLima === 9) await correr("reporteMensual", () => enviarReporteMensual(env, urlPanel));
  if (horaLima === 11) await correr("encuestas", () => enviarEncuestas(env));
  if (horaLima === 4 && new Date(limaHoy() + "T12:00:00Z").getUTCDay() === 0) await correr("copia", () => guardarCopia(env));
  if (horaLima === 12) await correr("faltas", () => avisarFaltas(env));
  if (horaLima === 3) await correr("limpieza", () => limpiar(env));
  return hecho;
}
