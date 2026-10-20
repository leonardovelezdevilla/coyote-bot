// Fechas en hora de Lima (UTC-5, sin horario de verano)

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function limaHoy(ahora = Date.now()) {
  const d = new Date(ahora - 5 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export function sumarDias(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diaSemana(iso) {
  return new Date(iso + "T12:00:00Z").getUTCDay();
}

// Próximas `n` fechas que caen en `dia` (0-6), empezando mañana
export function proximasFechas(dia, n, ahora = Date.now()) {
  const out = [];
  let f = sumarDias(limaHoy(ahora), 1);
  while (out.length < n) {
    if (diaSemana(f) === dia) out.push(f);
    f = sumarDias(f, 1);
  }
  return out;
}

export function fechaCorta(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${DIAS[diaSemana(iso)]} ${d} ${MESES[m - 1]}`;
}

export function fechaLarga(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${DIAS_LARGOS[diaSemana(iso)]} ${d} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][m - 1]}`;
}

export function lunesDe(iso) {
  const w = (diaSemana(iso) + 6) % 7;
  return sumarDias(iso, -w);
}

export const ahoraISO = () => new Date().toISOString();
