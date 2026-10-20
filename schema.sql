-- Tablas del bot. Se crean una sola vez con:
--   npx wrangler d1 execute coyote-bot --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT UNIQUE,              -- celular en formato 51XXXXXXXXX
  perfil TEXT,                    -- nombre que muestra su WhatsApp
  padre TEXT,                     -- nombre que nos dio
  edad TEXT,                      -- solo la edad del niño, nunca su nombre
  sede TEXT,                      -- LO, SMP o PP
  origen TEXT,                    -- Anuncio, WhatsApp, Llamada, Referido...
  estado TEXT NOT NULL DEFAULT 'consulta',
  clase_fecha TEXT,               -- fecha de la clase de prueba (AAAA-MM-DD)
  recordatorio_enviado INTEGER NOT NULL DEFAULT 0,
  monto REAL,
  nota TEXT,
  archivado INTEGER NOT NULL DEFAULT 0, -- 1 = borrado (se puede deshacer)
  confirmado INTEGER NOT NULL DEFAULT 0, -- respondió "Sí, voy" al recordatorio
  seguimiento_enviado INTEGER NOT NULL DEFAULT 0,
  no_contactar INTEGER NOT NULL DEFAULT 0, -- pidió no recibir promociones
  atencion TEXT NOT NULL DEFAULT 'bot',  -- 'bot' o 'humano' (Katy atiende ese chat)
  atencion_desde TEXT,                   -- última vez que Katy tomó o escribió en el chat
  ultimo_entrante TEXT,                  -- último mensaje del padre (ventana de 24 h)
  no_leidos INTEGER NOT NULL DEFAULT 0,
  comprobante TEXT,                      -- media_id de la captura de pago que envió (pendiente de revisar)
  comprobante_creado TEXT,
  inscrito_desde TEXT,                   -- fecha en que pagó (AAAA-MM-DD)
  clases_pagadas INTEGER,                -- cuántas clases incluye lo que pagó
  fin_ciclo TEXT,                        -- cuándo terminan sus clases pagadas (AAAA-MM-DD)
  renovacion_enviada INTEGER NOT NULL DEFAULT 0,
  faltas_avisado TEXT,                   -- última fecha en que se avisó por faltas seguidas
  token TEXT UNIQUE,                     -- código del carnet QR
  saldo REAL NOT NULL DEFAULT 0,         -- lo que falta pagar (cuotas)
  cuota_vence TEXT,                      -- fecha límite del saldo (AAAA-MM-DD)
  cuota_avisada INTEGER NOT NULL DEFAULT 0, -- 0 nada, 1 aviso previo, 2 aviso del día
  espera_avisado TEXT,                   -- cuándo se le avisó de un cupo libre
  encuesta_enviada INTEGER NOT NULL DEFAULT 0,
  referido_por INTEGER,                  -- id de la familia que lo recomendó
  uniforme_talla TEXT,
  uniforme_entregado TEXT,               -- fecha de entrega (AAAA-MM-DD)
  creado TEXT NOT NULL,
  actualizado TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sesiones (
  wa_id TEXT PRIMARY KEY,
  paso TEXT,
  datos TEXT,
  actualizado TEXT
);

CREATE TABLE IF NOT EXISTS gastos (
  semana TEXT NOT NULL,           -- lunes de la semana (AAAA-MM-DD)
  sede TEXT NOT NULL,
  monto REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (semana, sede)
);

-- Configuración que Katy edita desde el panel
CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado TEXT NOT NULL
);

-- Versiones anteriores de la configuración (para "volver a como estaba")
CREATE TABLE IF NOT EXISTS ajustes_historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valor TEXT NOT NULL,
  creado TEXT NOT NULL
);

-- Historial de cada chat (lo que escribe el padre, el bot y Katy)
CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT NOT NULL,
  autor TEXT NOT NULL,            -- 'padre', 'bot' o 'katy'
  tipo TEXT NOT NULL,             -- texto, botones, lista, plantilla, audio, imagen, video, documento, ubicacion, sticker, otro
  texto TEXT,
  media_id TEXT,
  wamid TEXT,                     -- identificador de WhatsApp (para marcar como leído)
  creado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat ON mensajes (wa_id, id);

-- Solo si el número también se usa en la app del celular (coexistencia):
-- personas que ya conversaban con Katy antes del bot. El bot no les responde.
CREATE TABLE IF NOT EXISTS contactos_conocidos (
  wa_id TEXT PRIMARY KEY,
  creado TEXT NOT NULL
);

-- Asistencia de los inscritos (Katy pasa lista desde el panel)
CREATE TABLE IF NOT EXISTS asistencias (
  lead_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,            -- AAAA-MM-DD
  presente INTEGER NOT NULL,      -- 1 vino, 0 faltó
  hora TEXT,                      -- hora de ingreso (HH:MM, Lima) si se escaneó el carnet
  modo TEXT,                      -- 'lista' (a mano) o 'qr' (escaneado)
  autor TEXT,                     -- quién la marcó
  PRIMARY KEY (lead_id, fecha)
);

-- Caja: ingresos y egresos (las inscripciones entran solas)
CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,            -- AAAA-MM-DD
  tipo TEXT NOT NULL,             -- 'ingreso' o 'egreso'
  categoria TEXT NOT NULL,        -- Inscripción, Uniforme, Alquiler de cancha, Profesores, Anuncios, Otros…
  sede TEXT,
  monto REAL NOT NULL,
  nota TEXT,
  lead_id INTEGER,                -- si viene de una inscripción
  autor TEXT,                     -- quién lo anotó (Katy o el nombre del personal)
  creado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos (fecha);

-- Personal de cada sede (profesores, asistentes). Entran al panel con su nombre y un PIN.
CREATE TABLE IF NOT EXISTS personal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'Profesor',
  sede TEXT,                      -- LO, SMP, PP o NULL (todas)
  pin_hash TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  tipo_pago TEXT NOT NULL DEFAULT 'clase', -- 'clase', 'hora' o 'mes'
  tarifa REAL NOT NULL DEFAULT 0,          -- soles por clase, por hora o al mes
  ultimo_ingreso TEXT,
  creado TEXT NOT NULL
);

-- Entradas y salidas del personal (escanean el QR de la sede)
CREATE TABLE IF NOT EXISTS jornadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personal_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,            -- AAAA-MM-DD
  sede TEXT NOT NULL,
  entrada TEXT NOT NULL,          -- HH:MM (Lima)
  salida TEXT,
  tarde INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jornadas ON jornadas (personal_id, fecha);

-- Encuesta de satisfacción (respuesta por botones)
CREATE TABLE IF NOT EXISTS encuestas (
  lead_id INTEGER PRIMARY KEY,
  sede TEXT,
  puntaje INTEGER NOT NULL,       -- 3 muy bien, 2 bien, 1 regular
  creado TEXT NOT NULL
);

-- Stock de uniformes por talla
CREATE TABLE IF NOT EXISTS uniformes (
  talla TEXT PRIMARY KEY,
  cantidad INTEGER NOT NULL DEFAULT 0
);

-- Qué hizo cada persona en el panel (para revisar si algo no cuadra)
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  autor TEXT NOT NULL,
  accion TEXT NOT NULL,
  detalle TEXT,
  creado TEXT NOT NULL
);

-- Mensajes que el bot no entendió (para enseñarle nuevas palabras desde el panel)
CREATE TABLE IF NOT EXISTS no_entendidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT,
  paso TEXT,
  texto TEXT NOT NULL,
  creado TEXT NOT NULL
);

-- Quién recibió cada mensaje a grupos (para no repetir)
CREATE TABLE IF NOT EXISTS campana_envios (
  campana TEXT NOT NULL,
  lead_id INTEGER NOT NULL,
  ok INTEGER NOT NULL,
  creado TEXT NOT NULL,
  PRIMARY KEY (campana, lead_id)
);

-- Intentos de entrar al panel (para frenar la fuerza bruta)
CREATE TABLE IF NOT EXISTS intentos (
  clave TEXT PRIMARY KEY,         -- ip o nombre
  fallos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TEXT,
  actualizado TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mensajes_procesados (
  id TEXT PRIMARY KEY,
  creado TEXT NOT NULL
);
