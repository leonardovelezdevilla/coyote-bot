// Personal por sede (nombre + PIN), permisos, venta en la cancha, bitácora
import fs from "node:fs";
import { execSync } from "node:child_process";
const BOT = "http://127.0.0.1:8787";
let fallas = 0;
const ok = (c, t) => { console.log((c ? "✔ " : "✘ ") + t); if (!c) fallas++; };
const sql = (q) => JSON.parse(execSync(`npx wrangler d1 execute coyote-bot --local --json --command "${q.replace(/"/g, '\\"')}" 2>/dev/null`).toString())[0].results;
const cookieK = fs.readFileSync(new URL("./cookie.txt", import.meta.url), "utf8");
const api = (cookie) => async (m, u, b) => { const x = await fetch(BOT + u, { method: m, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return { status: x.status, data: x.headers.get("content-type")?.includes("json") ? await x.json() : await x.text() }; };
const katy = api(cookieK);
const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);

// Katy agrega personal
let r = await katy("POST", "/api/personal", { nombre: "Carlos Quispe", rol: "Administrativo de sede", sede: "LO", pin: "482139" });
ok(r.status === 201, "Katy agrega a Carlos Quispe (Administrativo de sede, Los Olivos) con PIN");
ok((await katy("POST", "/api/personal", { nombre: "Ana", pin: "1234" })).status === 400, "PIN corto → error claro");
ok((await katy("POST", "/api/personal", { nombre: "carlos quispe", pin: "999999" })).status === 409, "Nombre repetido → error claro");
ok(!sql("SELECT pin_hash FROM personal")[0].pin_hash.includes("482139") && sql("SELECT pin_sal FROM personal")[0].pin_sal, "El PIN no se guarda en texto plano (con sal propia)");

// Carlos entra
let w = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre: "Carlos Quispe", clave: "000000" }), redirect: "manual" });
ok(w.status === 401 && /no coinciden/.test(await w.text()), "PIN equivocado → no entra, mensaje claro");
w = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre: "carlos quispe", clave: "482139" }), redirect: "manual" });
const cookieC = (w.headers.get("set-cookie") || "").split(";")[0];
ok(w.status === 303 && /^coyote_sesion=[a-f0-9]{32}\./.test(cookieC), "Carlos entra con nombre y PIN (sin importar mayúsculas)");
const carlos = api(cookieC);
const h = await (await fetch(BOT + "/panel", { headers: { Cookie: cookieC } })).text();
ok(/Carlos Quispe · Los Olivos/.test(h) && !/data-v="chats"/.test(h) && !/data-v="ajustes"/.test(h) && /data-v="caja"/.test(h), "Su panel muestra su nombre y sede, sin Chats ni Ajustes, con Caja");

// Permisos
ok((await carlos("GET", "/api/chats")).status === 403, "No puede ver los chats");
ok((await carlos("GET", "/api/config")).status === 200, "Sí puede leer la configuración (para que el panel funcione)");
ok((await carlos("PUT", "/api/config", {})).status === 403, "No puede cambiar la configuración");
ok((await carlos("GET", "/api/personal")).status === 403, "No puede ver ni crear personal");
ok((await carlos("GET", "/api/export.csv")).status === 403, "No puede descargar la lista completa");
r = await carlos("GET", "/api/leads");
ok(r.status === 200 && r.data.every((l) => l.sede === "LO") && r.data.every((l) => !l.wa_id || /•••/.test(l.wa_id)), `Ve solo personas de Los Olivos (${r.data.length}) y los celulares salen ocultos`);
const otraSede = sql("SELECT id FROM leads WHERE sede='SMP' LIMIT 1")[0];
ok((await carlos("PATCH", "/api/leads/" + otraSede.id, { nota: "x" })).status === 403, "No puede tocar fichas de otra sede");
const miSede = sql("SELECT id FROM leads WHERE sede='LO' AND estado!='inscrito' LIMIT 1")[0];
ok((await carlos("PATCH", "/api/leads/" + miSede.id, { archivado: 1 })).status === 403, "No puede quitar personas de la lista");
ok((await carlos("PATCH", "/api/leads/" + miSede.id, { nota: "Prefiere turno tarde" })).status === 200, "Sí puede agregar una nota en su sede");
ok((await carlos("PATCH", "/api/leads/" + miSede.id, { monto: 1 })).status === 403, "No puede cambiar un monto suelto");

// Venta en la cancha (Carlos)
r = await carlos("POST", "/api/ventas", { padre: "Marisol Huamán", wa_id: "987 111 222", edad: "9 años", sede: "SMP", plan: "ciclo", monto: 140, metodo: "Efectivo" });
ok(r.status === 201 && r.data.carnet && /\/carnet\/[A-Z2-9]{10}$/.test(r.data.carnet), "Registra una venta en efectivo y recibe el enlace del carnet");
let L = sql("SELECT sede, estado, origen, clases_pagadas, monto, wa_id FROM leads WHERE wa_id='51987111222'")[0];
ok(L.sede === "LO" && L.estado === "inscrito" && L.origen === "Venta en la cancha" && L.clases_pagadas === 12 && L.monto === 140, "Queda inscrita en SU sede (ignora la sede que mandó), con 12 clases y S/ 140");
const mov = sql("SELECT autor, categoria, monto, nota FROM movimientos ORDER BY id DESC LIMIT 1")[0];
ok(mov.autor === "Carlos Quispe" && mov.monto === 140 && /Efectivo/.test(mov.nota), "El pago entra en Caja a nombre de Carlos, con el método");
// Venta sin celular
r = await carlos("POST", "/api/ventas", { padre: "Papá sin celular", plan: "ciclo", monto: 140, metodo: "Yape" });
ok(r.status === 201 && r.data.carnet, "Venta sin celular: igual se crea el carnet para mostrarlo o imprimirlo");
ok((await katy("POST", "/api/ventas", { padre: "X", sede: "LO", plan: "otro", monto: 50 })).status === 400, "Otro plan sin clases → error claro");
// Caja y asistencia limitadas a su sede
r = await carlos("GET", "/api/caja?mes=" + hoy.slice(0, 7));
ok(r.status === 200 && r.data.movimientos.every((m) => m.sede === "LO"), "En Caja ve solo movimientos de Los Olivos");
r = await carlos("POST", "/api/caja", { tipo: "egreso", categoria: "Alquiler de cancha", monto: 100, fecha: hoy, sede: "SMP" });
ok(r.status === 201 && sql("SELECT sede, autor FROM movimientos ORDER BY id DESC LIMIT 1")[0].sede === "LO", "Sus gastos quedan en su sede aunque elija otra");
r = await carlos("GET", "/api/asistencia?fecha=" + hoy);
ok(r.status === 200 && r.data.alumnos.every((a) => a.sede === "LO") && r.data.alumnos.length >= 2, "Pasar lista le muestra solo los inscritos de su sede");
const al = r.data.alumnos[0];
await carlos("PUT", "/api/asistencia", { lead_id: al.id, fecha: hoy, presente: 1 });
ok(sql(`SELECT autor, modo FROM asistencias WHERE lead_id=${al.id} AND fecha='${hoy}'`)[0].autor === "Carlos Quispe", "La asistencia que marca queda a su nombre");

// Bitácora y quitar acceso
r = await katy("GET", "/api/bitacora");
ok(r.data.some((b) => b.autor === "Carlos Quispe" && b.accion === "venta en la cancha") && r.data.some((b) => b.accion === "entró al panel"), "Katy ve en la bitácora lo que hizo Carlos");
const idC = sql("SELECT id FROM personal WHERE nombre='Carlos Quispe'")[0].id;
await katy("PATCH", "/api/personal/" + idC, { activo: false });
ok((await carlos("GET", "/api/leads")).status === 401, "Al quitarle el acceso, su sesión deja de funcionar al instante");
await katy("PATCH", "/api/personal/" + idC, { activo: true, pin: "555555" });
w = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre: "Carlos Quispe", clave: "555555" }), redirect: "manual" });
ok(w.status === 303, "Con acceso devuelto y PIN nuevo, vuelve a entrar");
// Katy también puede vender en la cancha eligiendo sede
r = await katy("POST", "/api/ventas", { padre: "Venta Katy", sede: "PP", plan: "verano", monto: 250, metodo: "Plin" });
ok(r.status === 201 && sql("SELECT sede FROM leads WHERE padre='Venta Katy'")[0].sede === "PP", "Katy registra una venta eligiendo la sede");
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de personal pasaron");

// ---------- Solo paquetes publicados para el personal; cuenta de pago de la escuela ----------
{
  const w2 = await fetch(BOT + "/entrar", { method: "POST", body: new URLSearchParams({ nombre: "Carlos Quispe", clave: "555555" }), redirect: "manual" });
  const carlos2 = api((w2.headers.get("set-cookie") || "").split(";")[0]);
  let r2 = await carlos2("POST", "/api/ventas", { padre: "Plan raro", plan: "otro", clases: 5, monto: 50, metodo: "Efectivo" });
  ok(r2.status === 403 && /administradora/.test(r2.data.error), "El personal no puede registrar planes a medida");
  r2 = await carlos2("POST", "/api/ventas", { padre: "Precio raro", plan: "ciclo", monto: 100, metodo: "Efectivo" });
  ok(r2.status === 403 && /cuesta S\/ 140/.test(r2.data.error), "Ni cobrar un monto distinto al publicado");
  r2 = await carlos2("POST", "/api/ventas", { padre: "Venta correcta", plan: "ciclo", monto: 140, metodo: "Yape" });
  ok(r2.status === 201, "Sí puede vender el ciclo al precio publicado");
  let c = (await katy("GET", "/api/config")).data.config;
  c.pago.numero = "987654321"; c.pago.titular = "Katy Rivera";
  ok((await katy("PUT", "/api/config", c)).status === 200, "Katy guarda el Yape de la escuela");
  const hw = await (await fetch(BOT + "/")).text();
  await new Promise((r) => setTimeout(r, 16000));
  const h2 = await (await fetch(BOT + "/")).text();
  ok(/a nombre de Katy Rivera/.test(h2), "La web muestra que el pago va a la cuenta de la escuela");
  c.pago.numero = "12"; 
  ok((await katy("PUT", "/api/config", c)).status === 400, "Número de Yape inválido → error claro");
}
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas de personal y pagos pasaron");
