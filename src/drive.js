// Copias en el Google Drive de la escuela.
// Usa una "cuenta de servicio" de Google (un robot con su propia clave) a la que Katy
// le comparte una carpeta de su Drive. El Worker firma un token con esa clave y sube
// los archivos a esa carpeta. Secretos: GOOGLE_CUENTA (el JSON de la cuenta de servicio)
// y la variable DRIVE_CARPETA (el id de la carpeta). Ver GUIA.md, «Copia en Google Drive».

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();

async function tokenDrive(env) {
  let cuenta;
  try { cuenta = JSON.parse(env.GOOGLE_CUENTA || ""); } catch { throw new Error("GOOGLE_CUENTA no es un JSON válido"); }
  if (!cuenta.client_email || !cuenta.private_key) throw new Error("GOOGLE_CUENTA no tiene client_email o private_key");
  const ahora = Math.floor(Date.now() / 1000);
  const cab = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const cuerpo = b64url(enc.encode(JSON.stringify({ iss: cuenta.client_email, scope: "https://www.googleapis.com/auth/drive.file", aud: "https://oauth2.googleapis.com/token", iat: ahora, exp: ahora + 3600 })));
  const pem = cuenta.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const clave = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const firma = b64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", clave, enc.encode(`${cab}.${cuerpo}`)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${cab}.${cuerpo}.${firma}` }),
  });
  if (!r.ok) throw new Error(`Google no aceptó la cuenta de servicio (${r.status})`);
  return (await r.json()).access_token;
}

export const driveConfigurado = (env) => !!(env.GOOGLE_CUENTA && env.DRIVE_CARPETA);

// Sube (o reemplaza) un archivo en la carpeta compartida
export async function subirADrive(env, nombre, contenido, tipo) {
  const token = await tokenDrive(env);
  const cab = { Authorization: `Bearer ${token}` };
  // ¿ya existe uno con ese nombre? Se reemplaza para no llenar la carpeta
  const q = encodeURIComponent(`name = '${nombre.replace(/'/g, "\\'")}' and '${env.DRIVE_CARPETA}' in parents and trashed = false`);
  const busca = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`, { headers: cab });
  const existente = busca.ok ? (await busca.json()).files?.[0]?.id : null;
  const meta = existente ? { name: nombre } : { name: nombre, parents: [env.DRIVE_CARPETA] };
  const limite = "coyote" + Date.now();
  const cuerpo = `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${limite}\r\nContent-Type: ${tipo}\r\n\r\n${contenido}\r\n--${limite}--`;
  const r = await fetch(`https://www.googleapis.com/upload/drive/v3/files${existente ? "/" + existente : ""}?uploadType=multipart&supportsAllDrives=true`, {
    method: existente ? "PATCH" : "POST", headers: { ...cab, "Content-Type": `multipart/related; boundary=${limite}` }, body: cuerpo,
  });
  if (!r.ok) throw new Error(`Drive rechazó el archivo ${nombre} (${r.status}: ${(await r.text()).slice(0, 200)})`);
  return (await r.json()).id;
}
