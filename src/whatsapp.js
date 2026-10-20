// Envío de mensajes por la API de WhatsApp (Cloud API de Meta),
// registro de cada mensaje en el historial del chat y verificación de firmas.

const enc = new TextEncoder();

export async function verificarFirma(env, cuerpo, cabecera) {
  if (!cabecera || !env.APP_SECRET) return false;
  const clave = await crypto.subtle.importKey(
    "raw", enc.encode(env.APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, enc.encode(cuerpo));
  const hex = [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return igualSeguro(`sha256=${hex}`, cabecera);
}

export function igualSeguro(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const graph = (env, ruta) => `${env.GRAPH_BASE || "https://graph.facebook.com"}/${env.GRAPH_VERSION || "v23.0"}/${ruta}`;

// Texto legible de lo que escribió el padre (o Katy desde la app del celular)
export function describirEntrante(msg) {
  const conPie = (tipo, m, extra = "") => ({ tipo, texto: m?.caption || extra, media: m?.id || null });
  switch (msg.type) {
    case "text": return { tipo: "texto", texto: msg.text?.body || "" };
    case "interactive": return { tipo: "respuesta", texto: msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "" };
    case "button": return { tipo: "respuesta", texto: msg.button?.text || "" };
    case "image": return conPie("imagen", msg.image);
    case "video": return conPie("video", msg.video);
    case "audio": return conPie("audio", msg.audio);
    case "sticker": return conPie("sticker", msg.sticker);
    case "document": return conPie("documento", msg.document, msg.document?.filename || "");
    case "location": {
      const l = msg.location || {};
      return { tipo: "ubicacion", texto: [l.name, l.address].filter(Boolean).join(" · ") || `${l.latitude}, ${l.longitude}` };
    }
    case "contacts": return { tipo: "contacto", texto: (msg.contacts || []).map((c) => c.name?.formatted_name).filter(Boolean).join(", ") };
    case "reaction": return { tipo: "reaccion", texto: msg.reaction?.emoji || "" };
    default: return { tipo: "otro", texto: "" };
  }
}

// Texto legible de lo que se envió, para el historial del chat
function resumen(carga) {
  switch (carga.type) {
    case "text": return { tipo: "texto", texto: carga.text.body };
    case "interactive": {
      const i = carga.interactive;
      const opciones = i.type === "button" ? i.action.buttons.map((b) => b.reply.title) : i.action.sections.flatMap((s) => s.rows.map((r) => r.title));
      return { tipo: i.type === "button" ? "botones" : "lista", texto: `${i.body.text}\n[${opciones.join(" · ")}]` };
    }
    case "template": {
      const p = (carga.template.components || []).find((c) => c.type === "body")?.parameters?.map((x) => x.text) || [];
      return { tipo: "plantilla", texto: `Mensaje automático «${carga.template.name}»${p.length ? `: ${p.join(" · ")}` : ""}` };
    }
    case "location": return { tipo: "ubicacion", texto: `📍 ${carga.location.name || ""} ${carga.location.address || ""}`.trim() };
    case "audio": return { tipo: "audio", texto: "" };
    default: return { tipo: "otro", texto: "" };
  }
}

// Si Meta rechaza envíos (token vencido, número bloqueado, plantilla pausada), el panel muestra un aviso
async function anotarError(env, status, detalle) {
  try {
    let motivo = `WhatsApp respondió ${status}.`;
    if (status === 401 || /190|access token/i.test(detalle)) motivo = "El token de WhatsApp venció o no es válido. Hay que generar uno nuevo en Meta y guardarlo con «wrangler secret put WHATSAPP_TOKEN».";
    else if (/131026|131047|not.*template|132001/i.test(detalle)) motivo = "Una plantilla no está aprobada o su nombre no coincide con el de Meta. Revisa Ajustes → Plantillas de Meta.";
    else if (/131031|account.*restrict|blocked/i.test(detalle)) motivo = "Meta restringió la cuenta o el número. Revisa el estado en WhatsApp Manager.";
    else if (/131030|not in allowed list/i.test(detalle)) motivo = "El número de destino no está en la lista de prueba de Meta (solo pasa con el número de prueba).";
    else if (/130429|throughput|rate/i.test(detalle)) return; // temporal, no vale la pena avisar
    await env.DB.prepare("INSERT INTO ajustes (clave, valor, actualizado) VALUES ('error_whatsapp', ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado")
      .bind(JSON.stringify({ motivo, status, cuando: new Date().toISOString(), detalle: String(detalle).slice(0, 300) }), new Date().toISOString()).run();
  } catch { /* nada */ }
}
async function limpiarError(env) {
  try { await env.DB.prepare("DELETE FROM ajustes WHERE clave = 'error_whatsapp'").run(); } catch { /* nada */ }
}

export async function registrar(env, waId, autor, tipo, texto, mediaId = null, wamid = null) {
  try {
    await env.DB.prepare("INSERT INTO mensajes (wa_id, autor, tipo, texto, media_id, wamid, creado) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(waId, autor, tipo, texto ?? null, mediaId ?? null, wamid, new Date().toISOString()).run();
  } catch (e) {
    console.log("No se pudo guardar el mensaje en el historial", e?.message);
  }
}

async function enviar(env, para, cargaCompleta, autor = "bot") {
  const { __sinHistorial, __media, ...carga } = cargaCompleta;
  const r = await fetch(graph(env, `${env.PHONE_NUMBER_ID}/messages`), {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: para, ...carga }),
  });
  if (!r.ok) {
    const detalle = await r.text();
    console.log("WhatsApp rechazó el envío", r.status, detalle);
    await anotarError(env, r.status, detalle);
    return false;
  }
  await limpiarError(env);
  // Los avisos a Katy no se guardan en el chat de nadie
  if (!__sinHistorial) {
    const { tipo, texto } = resumen(carga);
    await registrar(env, para, autor, tipo, texto, __media || null);
  }
  return true;
}

const corta = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

export const wa = {
  texto: (env, para, cuerpo, autor = "bot") =>
    enviar(env, para, { type: "text", text: { body: cuerpo, preview_url: true } }, autor),

  // botones: [[id, título]] — máx. 3 botones de 20 caracteres
  botones: (env, para, cuerpo, botones) =>
    enviar(env, para, {
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: cuerpo },
        action: { buttons: botones.slice(0, 3).map(([id, t]) => ({ type: "reply", reply: { id, title: corta(t, 20) } })) },
      },
    }),

  // filas: [[id, título, descripción?]] — máx. 10 filas, título de 24 caracteres
  lista: (env, para, cuerpo, textoBoton, filas) =>
    enviar(env, para, {
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: cuerpo },
        action: {
          button: corta(textoBoton, 20),
          sections: [{
            title: "Opciones",
            rows: filas.slice(0, 10).map(([id, t, d]) => ({ id, title: corta(t, 24), ...(d ? { description: corta(d, 72) } : {}) })),
          }],
        },
      },
    }),

  // Pin de ubicación de WhatsApp
  ubicacion: (env, para, lat, lng, nombre, direccion) =>
    enviar(env, para, { type: "location", location: { latitude: lat, longitude: lng, name: nombre, address: direccion || "" } }),

  // botones: identificadores que vuelven cuando la persona toca cada botón
  // de respuesta rápida de la plantilla (en el mismo orden que en Meta)
  plantilla: (env, para, nombre, idioma, parametros, botones = [], { autor = "bot", sinHistorial = false } = {}) =>
    enviar(env, para, {
      type: "template",
      template: {
        name: nombre,
        language: { code: idioma },
        components: [
          { type: "body", parameters: parametros.map((t) => ({ type: "text", text: String(t).replace(/\s+/g, " ").trim() })) },
          ...botones.map((payload, i) => ({ type: "button", sub_type: "quick_reply", index: String(i), parameters: [{ type: "payload", payload }] })),
        ],
      },
      ...(sinHistorial ? { __sinHistorial: true } : {}),
    }, autor),

  // Doble check azul: el mensaje del padre se marca como leído
  leido: async (env, idMensaje) => {
    try {
      await fetch(graph(env, `${env.PHONE_NUMBER_ID}/messages`), {
        method: "POST",
        headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: idMensaje }),
      });
    } catch { /* no es grave */ }
  },

  // Sube un audio grabado en el panel y lo envía como mensaje de voz
  audio: async (env, para, archivo, mime, autor = "katy") => {
    const fd = new FormData();
    fd.append("messaging_product", "whatsapp");
    fd.append("type", mime);
    fd.append("file", new Blob([archivo], { type: mime }), "audio");
    const up = await fetch(graph(env, `${env.PHONE_NUMBER_ID}/media`), { method: "POST", headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` }, body: fd });
    if (!up.ok) { console.log("WhatsApp rechazó el audio", up.status, await up.text()); return null; }
    const { id } = await up.json();
    const ok = await enviar(env, para, { type: "audio", audio: { id }, __media: id }, autor);
    return ok ? id : null;
  },

  // Descarga de audios, fotos y documentos que manda el padre (para verlos en el panel)
  medio: async (env, mediaId) => {
    const info = await fetch(graph(env, mediaId), { headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` } });
    if (!info.ok) return null;
    const { url, mime_type } = await info.json();
    const archivo = await fetch(url, { headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` } });
    if (!archivo.ok) return null;
    return new Response(archivo.body, { headers: { "Content-Type": mime_type || archivo.headers.get("Content-Type") || "application/octet-stream", "Cache-Control": "private, max-age=86400" } });
  },
};
