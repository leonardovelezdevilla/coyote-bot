// =====================================================================
// CONFIGURACIÓN DEL BOT
// Katy cambia todo esto desde el panel → pestaña "Configuración".
// Lo que está aquí son solo los valores iniciales (y los que se usan al
// presionar "Restaurar valores iniciales"). No hace falta editar código.
// =====================================================================

export const DEFAULTS = {
  activo: true,
  escuela: "Escuela de Fútbol Coyote Rivera",
  whatsappHumano: "51985648093",
  nombreHumano: "Katy",

  clasesVerano: 24,
  precioVerano: 250,
  precioCiclo: 140,
  uniforme: 85,
  uniformePreventa: 60,
  pisoPorClase: 12,
  // Cuenta de la escuela para Yape y Plin (nunca la de un profesor)
  pago: { numero: "", titular: "", nota: "Envíanos la captura por este chat y te confirmamos la inscripción." },
  // Solo Katy registra planes a medida; el personal vende los paquetes publicados
  personalPlanesLibres: false,
  // Cuotas: pago en partes
  cuotas: { permitir: true, diasPorDefecto: 15, plantilla: "recordatorio_pago" },
  // Lista de espera: cuando se libera un cupo, el bot avisa al primero de la lista
  listaEspera: { avisarAutomatico: false, plantilla: "cupo_liberado" }, // apagado por decisión de la escuela; se puede encender en Ajustes
  // Aviso a Katy cuando una sede llega a este porcentaje de sus cupos
  alertaCupos: 80,
  // Hora de inicio de cada sede para marcar tardanzas del personal (HH:MM, vacío = sin control)
  personalControl: { horaInicio: { LO: "", SMP: "17:00", PP: "" }, toleranciaMin: 10 }, // mínimo recomendado por clase en planes a medida; el panel avisa si se vende más barato
  finPreventa: "2026-12-20",

  sedes: {
    LO: { activa: true, nombre: "Los Olivos", corto: "Los Olivos", lugar: "Estadio Guadalupano", direccion: "Av. Angélica Gamarra cdra. 2–3, Los Olivos", horario: "", mapa: "", coordenadas: "", cupos: 0 },
    SMP: { activa: true, nombre: "San Martín de Porres", corto: "San Martín (SMP)", lugar: "Complejo FullGol 7, campo techado", direccion: "Canta Callao, San Martín de Porres", horario: "Lunes, miércoles y viernes de 5:00 a 6:00 p. m.", mapa: "", coordenadas: "", cupos: 0 },
    PP: { activa: true, nombre: "Puente Piedra", corto: "Puente Piedra", lugar: "Complejo FullGol 7, campo techado", direccion: "", horario: "", mapa: "", coordenadas: "", cupos: 0 },
  },

  edades: [
    { id: "E3", titulo: "3 a 5 años", desc: "Baby Fútbol", min: 3, max: 5, mensaje: "⚽ Para esta edad tenemos Baby Fútbol." },
    { id: "E6", titulo: "6 a 9 años", desc: "Formativo", min: 6, max: 9, mensaje: "" },
    { id: "E10", titulo: "10 a 13 años", desc: "Formativo y competitivo", min: 10, max: 13, mensaje: "" },
    { id: "E14", titulo: "14 a 17 años", desc: "Juveniles", min: 14, max: 17, mensaje: "" },
  ],

  clasePrueba: {
    diaSemana: 6,
    hora: "",
    opciones: 3,
    queTraer: "ropa deportiva, zapatillas o chimpunes y una botella de agua",
  },

  plantillaRecordatorio: { nombre: "recordatorio_clase", idioma: "es" },

  // Avisos al WhatsApp de Katy (usan la plantilla "aviso_panel" aprobada en Meta)
  avisos: {
    activo: true,
    numero: "51985648093",
    resumenDiario: true,
    plantilla: "aviso_panel",
    idioma: "es",
  },

  // Cómo atiende una persona cuando el bot deriva:
  //  "panel"    → Katy responde desde el panel con el mismo número del bot
  //  "whatsapp" → el bot manda al padre a escribir al WhatsApp de Katy
  atencion: {
    modo: "panel",
    desde: 9, // horario de atención (hora de Lima)
    hasta: 19,
    devolverHoras: 12, // si Katy no escribe en este tiempo, el bot vuelve a atender ese chat
    plantillaRetomar: "retomar_conversacion",
    // Números que el bot nunca atiende ni guarda (familia, proveedores...), separados por comas
    excluidos: "",
    // Solo con el número compartido con la app del celular: el bot no responde a
    // quienes ya conversaban con Katy antes de conectar el bot
    soloNuevos: true,
  },

  // Respuestas guardadas: Katy las envía con un toque desde el chat del panel
  respuestasGuardadas: [
    { titulo: "Datos de pago", texto: "Puedes pagar por Yape o Plin al *{pagoNumero}* a nombre de {pagoTitular}. {pagoNota} ¡Gracias!" },
    { titulo: "Qué traer", texto: "Para entrenar trae ropa deportiva, zapatillas o chimpunes, canilleras si tiene, y una botella de agua." },
    { titulo: "Gracias", texto: "¡Gracias por confiar en la Escuela Coyote! Cualquier duda, escríbenos por aquí." },
  ],

  // Preguntas frecuentes: si el padre escribe alguna de estas palabras, el bot
  // responde y sigue con la conversación. Se pueden usar {variables}.
  // Las que tienen enLista aparecen en la lista «Preguntas frecuentes» (máx. 10;
  // el título es lo que se ve en la lista, hasta 24 caracteres).
  preguntas: [
    { id: "P1", titulo: "¿Cuánto cuesta?", enLista: true, palabras: "precio, precios, cuanto cuesta, cuánto cuesta, cuanto sale, cuánto sale, cuanto vale, cuánto vale, cuanto es, cuánto es, cuanto cobran, cuánto cobran, costo, costos, mensualidad, tarifa, cuota", respuesta: "El verano son {clases} clases (enero y febrero, 3 veces por semana) por *S/ {precio}*. {uniforme}." },
    { id: "P2", titulo: "¿Dónde quedan las sedes?", enLista: true, palabras: "donde queda, dónde queda, donde quedan, dónde quedan, donde es, dónde es, donde están, donde estan, direccion, dirección, ubicacion, ubicación, ubicados, como llego, cómo llego", respuesta: "Estas son nuestras sedes:\n{sedes}" },
    { id: "P3", titulo: "¿Qué horarios hay?", enLista: true, palabras: "horario, horarios, hora, horas, turno, turnos, que dias, qué días, dias de entrenamiento, días de entrenamiento, que dia, qué día", respuesta: "Estos son los horarios:\n{horarios}" },
    { id: "P4", titulo: "¿Cómo se paga?", enLista: true, palabras: "yape, plin, transferencia, deposito, depósito, efectivo, tarjeta, como pago, cómo pago, como se paga, cómo se paga, formas de pago, medios de pago", respuesta: "Puedes pagar por Yape o Plin a la cuenta de la escuela: *{pagoNumero}* a nombre de {pagoTitular}. {pagoNota}" },
    { id: "P5", titulo: "¿Entrenan niñas?", enLista: true, palabras: "niña, niñas, mi hija, hija, mujer, mujeres, femenino, chicas", respuesta: "¡Sí! Entrenan niñas y niños. Todos son bienvenidos en la manada Coyote ⚽" },
    { id: "P6", titulo: "¿Tienen arqueros?", enLista: true, palabras: "arquero, arqueros, arquera, portero, porteros, guardameta", respuesta: "Sí, tenemos entrenamiento especial para arqueros." },
    { id: "P8", titulo: "¿Tengo dos hijos?", enLista: true, palabras: "hermanos, hermanas, hermanito, hermanita, dos hijos, tres hijos, mis hijos, mis hijas, los dos, las dos, descuento", respuesta: "¡Claro! Pueden entrenar juntos aunque tengan edades distintas: cada uno va en su grupo. {hermanos} Dime la edad de uno y luego anotamos al otro por este mismo chat." },
    { id: "P7", titulo: "¿Participan en torneos?", enLista: true, palabras: "torneo, torneos, campeonato, campeonatos, competencia, competir", respuesta: "Nuestros alumnos participan en campeonatos durante el año, y los mayores pueden seguir compitiendo en el Club Atlético Vélez S." },
  ],

  // Carnet QR y asistencia
  carnetQR: {
    activo: true, // al inscribirse, el bot envía el carnet digital
    avisarIngreso: true, // avisar al papá cuando se escanea el carnet (solo si su ventana de 24 h está abierta)
    toleranciaMin: 15, // minutos de tolerancia antes de marcar «tarde» (si la sede tiene hora de inicio)
  },
  // Beneficio por hermanos (se muestra en la pregunta frecuente y en la web). Vacío = no hay.
  descuentoHermanos: "Por el segundo hermano, el uniforme va con descuento.",
  // Mensaje cuando la sede elegida ya no tiene cupo
  textoSedeLlena: "Uy, la sede {sede} ya completó sus cupos para este verano 😔. Puedes elegir otra sede o anotarte en la lista de espera: si se libera un cupo, {humano} te avisa.",

  // Encuesta de satisfacción a las 4 semanas de inscrito (3 botones)
  encuesta: { activo: true, semanas: 4, plantilla: "encuesta_satisfaccion" },
  // Referidos: el código del carnet sirve para recomendar
  referidos: { activo: true, beneficio: "Por cada familia que traigas y se inscriba, tu hijo(a) recibe una clase extra gratis." },
  // Tallas de uniforme que se manejan
  tallas: "4, 6, 8, 10, 12, 14, S, M, L",
  // Reporte del mes: el día 1 a las 9 a. m., resumen a Katy y, si se indica, a otro número (dueño)
  reporteMensual: { activo: true, numeroExtra: "" },

  // Página web pública (la dirección del bot sin /panel). Usa los mismos precios,
  // sedes y preguntas de arriba; aquí solo va lo que es propio de la web.
  web: {
    activa: true,
    numero: "", // WhatsApp del bot (el que aparece en los botones), ej. 51987654321
    temporada: "2027",
    inicio: "", // primer día del verano (AAAA-MM-DD); si está vacío no se muestra
    titulo: "Tu hijo juega. Nosotros lo formamos.",
    subtitulo: "Entrenamientos 3 veces por semana para niños y niñas, con profesores con experiencia. Ven a una clase de prueba gratis y decide después.",
    facebook: "",
    instagram: "",
  },

  // A quién escribe Katy si necesita ayuda con el panel (botón en "Ayuda")
  soporte: { nombre: "Leonardo", whatsapp: "" },

  // Automatizaciones que corren solas cada hora
  automatizaciones: {
    confirmarAsistencia: true, // el recordatorio trae botones "Sí, voy" / "Cambiar día"
    seguimientoClase: { activo: true, plantilla: "seguimiento_clase" }, // al día siguiente de la clase
    rescate: { activo: true, horas: 20 }, // si alguien deja la conversación a medias
    // Cuando se acaban las clases pagadas: invitación a renovar (plantilla de marketing)
    renovacion: { activo: true, plantilla: "renovar_clases", diasAntes: 5, semanasVerano: 8, semanasCiclo: 4, oferta: "el siguiente ciclo de 12 clases a S/ {precioCiclo}" },
    // Si un inscrito falta varias clases seguidas, mensaje para saber qué pasó (plantilla de utilidad)
    faltas: { activo: true, plantilla: "te_extranamos", seguidas: 2 },
  },

  // Mensajes a grupos que Katy envía desde el panel (cada uno usa su plantilla aprobada)
  campanas: {
    preventa: { plantilla: "ultimos_dias_preventa" },
    marzo: { plantilla: "seguir_en_marzo", oferta: "el primer ciclo de marzo a S/ 100" },
    avisoSede: { plantilla: "aviso_sede" }, // «Hoy no hay clase por lluvia» a toda una sede
  },

  // Textos del bot. Las palabras entre llaves {así} se reemplazan solas.
  textos: {
    saludo: "¡Hola {nombre}! 👋 Gracias por escribir a la *{escuela}* ⚽\n\nTe doy la información en 3 pasos. ¿Qué edad tiene tu hijo o hija?",
    botonEdad: "Elegir edad",
    preguntaSede: "¿Qué sede te queda mejor?",
    info: "*Verano 2027 en {sede}*\n📍 {lugar}{direccion}{mapa}\n🗓️ {horario}\n✅ {clases} clases en enero y febrero, 3 veces por semana: *S/ {precio}*\n👕 {uniforme}\n\n🆓 Antes de inscribirte, puedes venir a una *clase de prueba gratis*.",
    preguntaAccion: "¿Qué te gustaría hacer?",
    botonClase: "Clase gratis",
    botonInscribir: "Quiero inscribirlo",
    botonHumano: "Hablar con {humano}",
    preguntaFecha: "Elige el día de tu clase de prueba gratis ({hora}):",
    botonFecha: "Elegir día",
    pedirNombre: "¡Perfecto! ¿Cuál es tu nombre? (el del papá, mamá o apoderado)",
    confirmacion: "¡Listo, {nombre}! ✅ Clase de prueba gratis agendada:\n🗓️ {fecha}, {hora}\n📍 {sede}: {lugar}{direccion}{mapa}\n🎒 Que venga con {queTraer}.\n\nTe enviaremos un recordatorio el día anterior. Si necesitas cambiar el día, escribe *CAMBIAR*.",
    derivarInscribir: "¡Excelente! 🙌 Para completar la inscripción y darte los datos de pago, escríbele a {humano} aquí (el mensaje ya va con tus datos):\n\n{enlace}",
    derivarHumano: "Claro. Escríbele a {humano} aquí y te atiende personalmente (el mensaje ya va con tus datos):\n\n{enlace}",
    menuFin: "¿En qué más te ayudo?",
    botonMenu: "Ver información",
    botonPreguntas: "Preguntas frecuentes",
    listaPreguntas: "Estas son las preguntas más comunes. Toca la tuya 👇",
    botonVerPreguntas: "Ver preguntas",
    listaMientras: "Mientras {humano} te responde, quizás tu duda ya está aquí 👇",
    pausado: "Gracias por escribir a la {escuela}. En este momento te atiende {humano} directamente aquí:\n\n{enlace}",
    derivarInscribirPanel: "¡Excelente! 🙌 {humano} te escribe por aquí en breve para completar la inscripción y darte los datos de pago.",
    derivarHumanoPanel: "Claro. {humano} te responde por aquí en breve.",
    fueraHorario: "{humano} atiende de {desde} a {hasta} y te responderá apenas esté disponible 🙂",
    soloTexto: "Por ahora solo puedo leer mensajes escritos 🙂 Elige una opción o escribe tu pregunta. Si prefieres, {humano} te atiende.",
    comprobante: "¡Gracias! 🙌 Recibimos tu comprobante. {humano} lo revisa y te confirma la inscripción por aquí.",
    hermanos: "Veo que son {cantidad} 👧👦 Te muestro la información para el de {edad}; luego anotamos a los demás por este mismo chat. {hermanos}",
    carnet: "🎫 Aquí está el carnet digital de tu hijo(a). Muéstralo al llegar a la cancha para marcar su asistencia:\n{enlace}\n\nTambién puedes imprimirlo. Si pagaste y no recibiste este carnet, avísanos por aquí: significa que tu pago no quedó registrado.",
    ingreso: "✅ Ingresó a la cancha de {sede} a las {hora}. ¡Buen entrenamiento!",
    referido: "¡Gracias! {nombre} te recomendó 🙌 {beneficio}",
    listaEspera: "Listo, quedaste en la lista de espera de {sede} ✅ Si se libera un cupo, {humano} te escribe por aquí.",
    noEntendi: "No te entendí bien 🙈 Elige una de las opciones, o escribe *{humano}* si prefieres hablar con una persona.",
    noEntendiOtraVez: "Disculpa, sigo sin entenderte 🙈 ¿Prefieres que te atienda {humano}?",
    deNada: "¡De nada! 😊 Si necesitas algo más, escríbenos por aquí.",
  },
};

export const ESTADOS = {
  consulta: "Consulta",
  agendada: "Clase agendada",
  asistio: "Asistió a la clase",
  quiere_inscribirse: "Quiere inscribirse",
  inscrito: "Inscrito",
  espera: "En lista de espera",
  perdido: "No se inscribió",
};

export const SEDE_IDS = ["LO", "SMP", "PP"];

// Qué variables admite cada texto (se muestra en el panel)
export const VARIABLES = {
  saludo: ["nombre", "escuela"],
  info: ["sede", "lugar", "direccion", "mapa", "horario", "clases", "precio", "precioCiclo", "uniforme"],
  botonHumano: ["humano"],
  preguntaFecha: ["hora"],
  confirmacion: ["nombre", "fecha", "hora", "sede", "lugar", "direccion", "mapa", "queTraer"],
  derivarInscribir: ["humano", "enlace"],
  derivarHumano: ["humano", "enlace"],
  pausado: ["escuela", "humano", "enlace"],
  derivarInscribirPanel: ["humano"],
  derivarHumanoPanel: ["humano"],
  fueraHorario: ["humano", "desde", "hasta"],
  soloTexto: ["humano"],
  noEntendi: ["humano"],
  noEntendiOtraVez: ["humano"],
  deNada: ["humano"],
  listaPreguntas: [],
  listaMientras: ["humano"],
  preguntas: ["sedes", "horarios", "clases", "precio", "precioCiclo", "uniforme", "humano", "escuela", "hermanos", "pagoNumero", "pagoTitular", "pagoNota"],
  comprobante: ["humano"],
  hermanos: ["cantidad", "edad", "hermanos"],
  listaEspera: ["sede", "humano"],
  carnet: ["enlace"],
  referido: ["nombre", "beneficio"],
  ingreso: ["sede", "hora"],
};

// ---------- Lectura desde la base de datos ----------

let cache = null;

function mezclar(base, extra) {
  if (Array.isArray(base) || typeof base !== "object" || base === null) return extra === undefined ? base : extra;
  const out = { ...base };
  for (const k of Object.keys(extra || {})) out[k] = k in base ? mezclar(base[k], extra[k]) : extra[k];
  return out;
}

export async function cargarConfig(env) {
  if (cache && Date.now() - cache.t < 15000) return cache.cfg;
  let guardada = null;
  try {
    const fila = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'config'").first();
    if (fila) guardada = JSON.parse(fila.valor);
  } catch (e) {
    console.log("No se pudo leer la configuración; uso la inicial", e?.message);
  }
  const cfg = mezclar(DEFAULTS, guardada || {});
  cache = { cfg, t: Date.now() };
  return cfg;
}

// Antes de cada cambio se guarda la versión anterior (las últimas 10),
// para que Katy pueda "volver a como estaba".
async function respaldar(env) {
  const actual = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'config'").first();
  await env.DB.prepare("INSERT INTO ajustes_historial (valor, creado) VALUES (?, ?)")
    .bind(actual ? actual.valor : "", new Date().toISOString()).run();
  await env.DB.prepare("DELETE FROM ajustes_historial WHERE id NOT IN (SELECT id FROM ajustes_historial ORDER BY id DESC LIMIT 10)").run();
}

export async function guardarConfig(env, cfg) {
  await respaldar(env);
  await env.DB.prepare(
    "INSERT INTO ajustes (clave, valor, actualizado) VALUES ('config', ?1, ?2) ON CONFLICT(clave) DO UPDATE SET valor = ?1, actualizado = ?2",
  ).bind(JSON.stringify(cfg), new Date().toISOString()).run();
  cache = null;
}

export async function restaurarConfig(env) {
  await respaldar(env);
  await env.DB.prepare("DELETE FROM ajustes WHERE clave = 'config'").run();
  cache = null;
}

// Vuelve a la versión anterior al último cambio. Devuelve false si no hay.
export async function deshacerConfig(env) {
  const prev = await env.DB.prepare("SELECT id, valor FROM ajustes_historial ORDER BY id DESC LIMIT 1").first();
  if (!prev) return false;
  if (prev.valor) {
    await env.DB.prepare(
      "INSERT INTO ajustes (clave, valor, actualizado) VALUES ('config', ?1, ?2) ON CONFLICT(clave) DO UPDATE SET valor = ?1, actualizado = ?2",
    ).bind(prev.valor, new Date().toISOString()).run();
  } else {
    await env.DB.prepare("DELETE FROM ajustes WHERE clave = 'config'").run();
  }
  await env.DB.prepare("DELETE FROM ajustes_historial WHERE id = ?").bind(prev.id).run();
  cache = null;
  return true;
}

export async function cambiosGuardados(env) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n, MAX(creado) AS ultimo FROM ajustes_historial").first();
  return { n: r?.n || 0, ultimo: r?.ultimo || null };
}

// Pequeños valores sueltos (p. ej. la dirección del panel para el resumen)
export async function leerValor(env, clave) {
  const f = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = ?").bind(clave).first();
  return f ? f.valor : null;
}
export async function guardarValor(env, clave, valor) {
  await env.DB.prepare(
    "INSERT INTO ajustes (clave, valor, actualizado) VALUES (?1, ?2, ?3) ON CONFLICT(clave) DO UPDATE SET valor = ?2, actualizado = ?3",
  ).bind(clave, valor, new Date().toISOString()).run();
}

// ---------- Plantillas de texto ----------

export function llenar(plantilla, vars) {
  return String(plantilla || "")
    .replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k] ?? "") : m))
    .replace(/[ \t]+([!?.,:)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
}

// ---------- Validación de lo que envía el panel ----------

// "987 654 321, 51912345678" → ["51987654321", "51912345678"] (agrega el 51 de Perú si falta)
export function listaNumeros(texto) {
  return String(texto || "").split(/[,;\n]+/).map((x) => x.replace(/[\s()+-]/g, "")).filter(Boolean)
    .map((x) => (/^9\d{8}$/.test(x) ? "51" + x : x));
}

export function validarConfig(c) {
  const err = [];
  const txt = (v, nombre, max, requerido = true) => {
    if (typeof v !== "string") { err.push(`${nombre}: falta`); return; }
    if (requerido && !v.trim()) err.push(`${nombre}: no puede estar vacío`);
    if (v.length > max) err.push(`${nombre}: máximo ${max} caracteres (tiene ${v.length})`);
  };
  const num = (v, nombre, min, max) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) err.push(`${nombre}: debe ser un número entre ${min} y ${max}`);
  };

  txt(c.escuela, "Nombre de la escuela", 60);
  txt(c.nombreHumano, "Nombre de quien atiende", 20);
  if (!/^\d{9,15}$/.test(c.whatsappHumano || "")) err.push("WhatsApp de atención: solo números con código de país, por ejemplo 51985648093");
  num(c.clasesVerano, "Clases de verano", 1, 200);
  num(c.precioVerano, "Precio de verano", 0, 100000);
  num(c.precioCiclo, "Precio del ciclo", 0, 100000);
  num(c.uniforme, "Precio del uniforme", 0, 100000);
  num(c.uniformePreventa, "Uniforme en preventa", 0, 100000);
  num(c.pisoPorClase, "Mínimo por clase", 0, 1000);
  const pg = c.pago || {};
  if (pg.numero && !/^\d{9}$/.test(String(pg.numero).replace(/\D/g, ""))) err.push("Pago · número de Yape/Plin: deben ser 9 dígitos");
  txt(pg.titular ?? "", "Pago · titular", 60, false); txt(pg.nota ?? "", "Pago · indicación", 200, false);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.finPreventa || "")) err.push("Fin de la preventa: fecha no válida");

  let activas = 0;
  for (const id of SEDE_IDS) {
    const s = c.sedes?.[id];
    if (!s) { err.push(`Sede ${id}: falta`); continue; }
    if (s.activa) activas++;
    txt(s.nombre, `Sede ${id} · nombre`, 40);
    txt(s.corto, `Sede ${id} · texto del botón`, 20);
    txt(s.lugar, `Sede ${id} · lugar`, 80);
    txt(s.direccion, `Sede ${id} · dirección`, 120, false);
    txt(s.horario, `Sede ${id} · horario`, 150, false);
    txt(s.mapa, `Sede ${id} · mapa`, 300, false);
    if (s.mapa && !/^https:\/\//.test(s.mapa)) err.push(`Sede ${id} · mapa: debe empezar con https://`);
  }
  if (!activas) err.push("Debe haber al menos una sede activa");

  if (!Array.isArray(c.edades) || c.edades.length < 1 || c.edades.length > 10) err.push("Edades: entre 1 y 10 opciones");
  else c.edades.forEach((e, i) => {
    txt(e.titulo, `Edad ${i + 1} · título`, 24);
    txt(e.desc, `Edad ${i + 1} · descripción`, 72, false);
    txt(e.mensaje, `Edad ${i + 1} · mensaje extra`, 300, false);
    num(e.min, `Edad ${i + 1} · desde`, 0, 99);
    num(e.max, `Edad ${i + 1} · hasta`, 0, 99);
    if (!/^[A-Za-z0-9_]{1,20}$/.test(e.id || "")) err.push(`Edad ${i + 1}: identificador no válido`);
  });

  const cp = c.clasePrueba || {};
  num(cp.diaSemana, "Día de la clase de prueba", 0, 6);
  num(cp.opciones, "Fechas a ofrecer", 1, 5);
  txt(cp.hora, "Hora de la clase de prueba", 40, false);
  txt(cp.queTraer, "Qué traer", 200);

  const T = c.textos || {};
  const largos = { saludo: 1000, preguntaSede: 1000, info: 3000, preguntaAccion: 1000, preguntaFecha: 1000, pedirNombre: 1000, confirmacion: 3000, derivarInscribir: 2000, derivarHumano: 2000, menuFin: 1000, pausado: 2000 };
  for (const [k, max] of Object.entries(largos)) txt(T[k], `Texto "${k}"`, max);
  const humano = c.nombreHumano || "";
  for (const k of ["botonClase", "botonInscribir", "botonHumano", "botonMenu", "botonPreguntas"]) {
    txt(T[k], `Botón "${k}"`, 40);
    const lleno = llenar(T[k], { humano });
    if (lleno.length > 20) err.push(`Botón "${lleno}": WhatsApp permite máximo 20 caracteres (tiene ${lleno.length})`);
  }
  for (const k of ["botonEdad", "botonFecha", "botonVerPreguntas"]) {
    txt(T[k], `Botón "${k}"`, 20);
  }

  const av = c.avisos || {};
  if (av.activo && !/^\d{9,15}$/.test(av.numero || "")) err.push("Avisos: el número debe tener solo números con código de país, por ejemplo 51985648093");
  if (!/^[a-z0-9_]{1,60}$/.test(av.plantilla || "")) err.push("Avisos: nombre de plantilla no válido");
  const au = c.automatizaciones || {};
  if (!/^[a-z0-9_]{1,60}$/.test(au.seguimientoClase?.plantilla || "")) err.push("Seguimiento: nombre de plantilla no válido");
  num(au.rescate?.horas, "Rescate: horas de espera", 1, 23);
  const rn = au.renovacion || {};
  if (!/^[a-z0-9_]{1,60}$/.test(rn.plantilla || "")) err.push("Renovación: nombre de plantilla no válido");
  num(rn.diasAntes, "Renovación: días de anticipación", 0, 30); num(rn.semanasVerano, "Renovación: semanas que dura el verano", 1, 20); num(rn.semanasCiclo, "Renovación: semanas que dura un ciclo", 1, 20);
  txt(rn.oferta, "Renovación: oferta", 150);
  const fa = au.faltas || {};
  if (!/^[a-z0-9_]{1,60}$/.test(fa.plantilla || "")) err.push("Faltas: nombre de plantilla no válido");
  num(fa.seguidas, "Faltas seguidas antes de escribir", 1, 10);
  for (const id of SEDE_IDS) num(c.sedes?.[id]?.cupos ?? 0, `Sede ${id} · cupos`, 0, 5000);
  txt(c.descuentoHermanos ?? "", "Beneficio por hermanos", 200, false);
  txt(c.textoSedeLlena, "Texto de sede llena", 500);
  const ca = c.campanas || {};
  for (const k of ["preventa", "marzo", "avisoSede"]) if (!/^[a-z0-9_]{1,60}$/.test(ca[k]?.plantilla || "")) err.push(`Campaña ${k}: nombre de plantilla no válido`);
  txt(ca.marzo?.oferta, "Oferta de marzo", 120);
  const at = c.atencion || {};
  if (!["panel", "whatsapp"].includes(at.modo)) err.push("Atención: modo no válido");
  num(at.desde, "Atención: hora de inicio", 0, 23);
  num(at.hasta, "Atención: hora de fin", 1, 24);
  num(at.devolverHoras, "Atención: horas para devolver el chat al bot", 1, 72);
  if (!/^[a-z0-9_]{1,60}$/.test(at.plantillaRetomar || "")) err.push("Atención: nombre de plantilla para retomar no válido");
  if (typeof at.excluidos !== "string" || at.excluidos.length > 3000) err.push("Atención: la lista de números que el bot no atiende es muy larga");
  else for (const n of listaNumeros(at.excluidos)) if (!/^\d{9,15}$/.test(n)) err.push(`Atención: "${n}" no parece un celular (solo números con código de país, por ejemplo 51987654321)`);
  for (const id of SEDE_IDS) {
    const co = c.sedes?.[id]?.coordenadas || "";
    if (co && !/^\s*-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+\s*$/.test(co)) err.push(`Sede ${id} · coordenadas: escríbelas como -11.9876, -77.0712`);
  }
  if (!Array.isArray(c.respuestasGuardadas) || c.respuestasGuardadas.length > 20) err.push("Respuestas guardadas: máximo 20");
  else c.respuestasGuardadas.forEach((r, i) => { txt(r.titulo, `Respuesta guardada ${i + 1} · título`, 30); txt(r.texto, `Respuesta guardada ${i + 1} · texto`, 1000); });
  if (!Array.isArray(c.preguntas) || c.preguntas.length > 30) err.push("Preguntas frecuentes: máximo 30");
  else {
    const ids = new Set();
    c.preguntas.forEach((p, i) => {
      txt(p.palabras, `Pregunta ${i + 1} · palabras`, 300); txt(p.respuesta, `Pregunta ${i + 1} · respuesta`, 1000);
      if (!/^[\w-]{1,20}$/.test(p.id || "") || ids.has(p.id)) err.push(`Pregunta ${i + 1}: identificador no válido`); ids.add(p.id);
      txt(p.titulo ?? "", `Pregunta ${i + 1} · cómo se ve en la lista`, 24, !!p.enLista);
    });
    if (c.preguntas.filter((p) => p.enLista).length > 10) err.push("Preguntas frecuentes: WhatsApp permite máximo 10 en la lista. Apaga «Mostrar en la lista» en alguna.");
  }
  for (const k of ["derivarInscribirPanel", "derivarHumanoPanel", "fueraHorario", "soloTexto", "noEntendi", "noEntendiOtraVez", "deNada", "listaPreguntas", "listaMientras", "comprobante", "hermanos", "listaEspera", "carnet", "ingreso", "referido"]) txt(T[k], `Texto "${k}"`, 1000);
  num(c.carnetQR?.toleranciaMin ?? 15, "Carnet: minutos de tolerancia", 0, 120);
  const cu = c.cuotas || {};
  num(cu.diasPorDefecto, "Cuotas: días para pagar el saldo", 1, 90);
  if (!/^[a-z0-9_]{1,60}$/.test(cu.plantilla || "")) err.push("Cuotas: nombre de plantilla no válido");
  if (!/^[a-z0-9_]{1,60}$/.test(c.listaEspera?.plantilla || "")) err.push("Lista de espera: nombre de plantilla no válido");
  num(c.alertaCupos, "Alerta de cupos (porcentaje)", 10, 100);
  const pc = c.personalControl || {};
  for (const id of SEDE_IDS) { const h = pc.horaInicio?.[id] || ""; if (h && !/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) err.push(`Sede ${id} · hora de inicio: escríbela como 17:00`); }
  num(pc.toleranciaMin ?? 10, "Personal: minutos de tolerancia", 0, 120);
  const en = c.encuesta || {};
  num(en.semanas, "Encuesta: semanas después de inscribirse", 1, 52);
  if (!/^[a-z0-9_]{1,60}$/.test(en.plantilla || "")) err.push("Encuesta: nombre de plantilla no válido");
  txt(c.referidos?.beneficio ?? "", "Referidos: beneficio", 200, false);
  txt(c.tallas ?? "", "Tallas de uniforme", 120, false);
  const rm = c.reporteMensual || {};
  if (rm.numeroExtra && !/^\d{9,15}$/.test(rm.numeroExtra)) err.push("Reporte mensual: el número extra debe tener solo números con código de país");
  const wb = c.web || {};
  if (wb.numero && !/^\d{9,15}$/.test(wb.numero)) err.push("Página web · WhatsApp del bot: solo números con código de país, por ejemplo 51987654321");
  txt(wb.temporada ?? "", "Página web · temporada", 20, false);
  if (wb.inicio && !/^\d{4}-\d{2}-\d{2}$/.test(wb.inicio)) err.push("Página web · fecha de inicio: fecha no válida");
  txt(wb.titulo, "Página web · titular", 80);
  txt(wb.subtitulo, "Página web · texto de bienvenida", 300);
  for (const k of ["facebook", "instagram"]) if (wb[k] && !/^https:\/\//.test(wb[k])) err.push(`Página web · ${k}: el enlace debe empezar con https://`);
  const so = c.soporte || {};
  txt(so.nombre, "Ayuda · nombre", 30, false);
  if (so.whatsapp && !/^\d{9,15}$/.test(so.whatsapp)) err.push("Ayuda · WhatsApp: solo números con código de país");
  return err;
}
