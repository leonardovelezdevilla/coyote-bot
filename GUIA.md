# Bot de WhatsApp de la Escuela Coyote — guía de instalación

Al terminar esta guía queda funcionando:

1. **El bot**, en un número de WhatsApp (nuevo o uno que ya tengan; ver «¿Qué número usar?»). Pregunta la edad y la sede, da precio y horario, responde preguntas frecuentes escritas a su manera, agenda la clase de prueba gratis, envía la ubicación de la cancha y pasa el chat a Katy cuando hace falta una persona.
2. **Las automatizaciones**, que corren solas cada hora:
   - recordatorio el día antes de la clase, con botones «Sí, voy» y «Cambiar día»;
   - seguimiento al día siguiente de la clase, invitando a inscribirse;
   - un mensaje para retomar las conversaciones que quedaron a medias;
   - avisos a Katy cuando alguien quiere inscribirse;
   - un resumen cada mañana a las 8;
   - la palabra **BAJA**, que saca a esa persona de las promociones.
3. **El panel de Katy**, una página con clave que funciona como app en el celular. Tiene la pantalla Hoy, los **Chats** (Katy responde desde ahí con el mismo número del bot), la lista de personas, los números, los mensajes a grupos y los ajustes del bot, sin tocar código. Reemplaza al «Registro Verano Coyote».

Tiempo estimado: 2 a 3 horas la primera vez, más la espera de aprobación de las plantillas en Meta (de horas a un par de días). Las plantillas son 12 en total (paso 6); la 12 solo hace falta si se enciende la lista de espera automática.

---

## Costos

| Concepto | Costo |
| --- | --- |
| Cloudflare (servidor, base de datos, tareas cada hora) | Gratis. El plan gratuito permite 100 000 solicitudes al día. |
| Respuestas del bot y de Katy desde el panel (mensajes de atención, dentro de las 24 horas) | 1 000 gratis al mes por número; desde el 1 001 se cobran por mensaje. |
| Mensaje para retomar un chat después de 24 horas (plantilla) | Se cobra por mensaje, como las demás plantillas. |
| Recordatorios y avisos a Katy (plantillas de «utilidad») | Se cobran por mensaje según la tarifa de Perú. |
| Seguimiento y mensajes a grupos (plantillas de «marketing») | Se cobran por mensaje; son las más caras. Se pueden apagar. |
| Personas que llegan desde un anuncio con botón de WhatsApp | Mensajes gratis hasta por 7 días. |
| Número | Un chip prepago, o uno que ya tengan (ver abajo). |
| Mensajes que Katy envía desde la app del celular (solo con la opción C) | Gratis. |

Las tarifas de Perú están en soles en la página de precios de Meta para WhatsApp. Revísalas antes de lanzar.

---

## ¿Qué número usar?

| Opción | Cuándo conviene | Qué implica |
| --- | --- | --- |
| **A. Chip nuevo** o un número sin WhatsApp | Lo más simple. | Se sigue esta guía tal cual. El número solo funciona en el bot y en el panel. |
| **B. Un número que ya tiene WhatsApp**, que pueden dejar de usar en el celular | Si ya es conocido por los padres y no lo necesitan en la app. | Antes del paso 3, en ese celular: WhatsApp → Ajustes → Cuenta → **Eliminar cuenta**. Los chats de la app se pierden (haz copia antes). Después, la guía es igual. |
| **C. Un número con WhatsApp Business que quieren seguir usando en el celular** («coexistencia») | Si es el número que todos conocen y Katy quiere seguir usando la app. | El mismo número funciona en la app del celular y en el bot. Ver detalles abajo. |

**Opción C, en detalle**

- **Qué se gana:** los padres siguen escribiendo al número de siempre. Katy puede responder desde la app del celular o desde el panel; lo que escribe en el celular también aparece en el panel y el bot se calla en ese chat. Los mensajes que envía desde la app son gratis.
- **Qué cambia en la app:** las listas de difusión quedan solo de lectura; se desactivan los mensajes temporales, «ver una vez» y la ubicación en tiempo real; los grupos no pasan al panel; los dispositivos vinculados se desconectan y hay que volver a vincularlos.
- **Requisitos:** WhatsApp Business actualizado (2.24.17 o más nueva), un número con algo de antigüedad y buen historial (uno recién creado puede no calificar), el negocio verificado en Meta y abrir la app al menos cada dos semanas. No sirve un WhatsApp personal: primero hay que pasarlo a WhatsApp Business.
- **Cómo se conecta:** Meta solo lo permite con su **registro integrado** (Embedded Signup). Para usarlo, la app de Meta del paso 3 debe estar registrada como **Tech Provider**, o se hace a través de un proveedor oficial (BSP), que cobra mensualidad. Al conectar, se escanea un código QR desde la app y se acepta compartir el historial (hasta 6 meses) dentro de las primeras 24 horas.
- **En el bot:** ya está preparado. En el paso 5, suscríbete también a los campos **smb_message_echoes** e **history**. Con el historial importado, el bot no responde a quienes ya conversaban con Katy (se puede cambiar en Ajustes → Opciones avanzadas → Números que el bot no atiende). Agrega ahí también los números de familia y amigos.

---

## Antes de empezar

- [ ] El **número** elegido en «¿Qué número usar?».
- [ ] Acceso de **administrador** al portfolio comercial de la página Coyote en business.facebook.com.
- [ ] Una **tarjeta** para el método de pago de WhatsApp en Meta.
- [ ] Una computadora con **Node.js 20 o más nuevo** (nodejs.org, versión LTS).
- [ ] Esta carpeta `coyote-bot` descomprimida.

---

## Paso 1. Preparar el proyecto

Abre una terminal dentro de la carpeta `coyote-bot` y ejecuta:

```bash
npm install
```

## Paso 2. Cloudflare: servidor y base de datos

1. Crea una cuenta gratuita en dash.cloudflare.com.
2. Conecta la terminal con tu cuenta (se abre el navegador para autorizar):
   ```bash
   npx wrangler login
   ```
3. Crea la base de datos y copia el `database_id` que aparece en `wrangler.toml`, en la línea `database_id = "COMPLETAR"`:
   ```bash
   npx wrangler d1 create coyote-bot
   ```
4. Crea las tablas y publica:
   ```bash
   npm run db:crear-tablas
   npx wrangler deploy
   ```
   Al final aparece la dirección del bot, algo como `https://coyote-bot.TU-NOMBRE.workers.dev`. Guárdala.

## Paso 3. Meta: app de WhatsApp y número nuevo

1. Entra a developers.facebook.com → **Mis apps** → **Crear app**. Elige el caso de uso de WhatsApp para empresas y asóciala al portfolio comercial de la escuela.
2. En **WhatsApp → Configuración de la API** hay un número de prueba. Sirve para probar enviando a tu propio celular.
3. Agrega el número con **Agregar número de teléfono** (opciones A y B; para la C, ver «¿Qué número usar?»). Nombre visible: `Escuela Coyote Rivera`, que Meta revisa. Verifícalo con el código por SMS o llamada.
4. Copia el **Identificador del número de teléfono** (Phone number ID) en `wrangler.toml`, en `PHONE_NUMBER_ID = "COMPLETAR"`.
5. En **WhatsApp Manager → Métodos de pago**, agrega la tarjeta.

**Token permanente.** El token de la pantalla de prueba vence en 24 horas. Para crear uno que no vence:

1. En business.facebook.com → **Configuración** → **Usuarios del sistema** → **Agregar**, con rol administrador.
2. **Asignar activos**: la app y la cuenta de WhatsApp, con control total.
3. **Generar token**: elige la app, la caducidad **Nunca** y los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
4. Cópialo. Solo se muestra una vez.

**Clave secreta de la app:** developers.facebook.com → tu app → **Configuración de la app → Básica** → **Clave secreta de la app**.

## Paso 4. Guardar las claves en Cloudflare

Cada comando pide pegar el valor. Nunca lo escribas en los archivos del proyecto.

```bash
npx wrangler secret put WHATSAPP_TOKEN     # el token permanente
npx wrangler secret put APP_SECRET         # la clave secreta de la app
npx wrangler secret put VERIFY_TOKEN       # invéntala: una frase larga sin espacios
npx wrangler secret put ADMIN_PASSWORD     # la clave del panel de Katy (12 caracteres o más, fácil de escribir en el celular)
npx wrangler deploy
```

## Paso 5. Conectar Meta con el bot (webhook)

1. developers.facebook.com → tu app → **WhatsApp → Configuración** → **Webhook** → **Editar**.
2. URL: `https://coyote-bot.TU-NOMBRE.workers.dev/webhook`.
3. Token de verificación: el mismo de `VERIFY_TOKEN`.
4. **Verificar y guardar**. Luego, en **Campos del webhook**, suscríbete a **messages**. Solo con la opción C, suscríbete también a **smb_message_echoes** e **history**.

## Paso 6. Plantillas de mensajes en Meta

Las plantillas son los mensajes que el bot envía por iniciativa propia. Créalas en **WhatsApp Manager → Plantillas de mensajes → Crear plantilla**, con idioma **Español** (`es`).

Respeta cuatro cosas: el **nombre exacto**, las **variables** `{{1}}`, `{{2}}`, etc. en el mismo orden, los **botones de respuesta rápida** con estos textos y en este orden, y la **categoría**. Meta pide un ejemplo para cada variable; usa los que van entre paréntesis.

**1. `recordatorio_clase`** · Utilidad
> Hola {{1}}, te recordamos tu clase de prueba gratis en la sede {{2}} de la Escuela Coyote: {{3}}, {{4}}. Trae ropa deportiva, zapatillas o chimpunes y agua. ¿Nos confirmas tu asistencia?

Ejemplos: Rosa · San Martín de Porres · sábado 21 de noviembre · 9:00 a. m.
Botones de respuesta rápida: **Sí, voy** · **Cambiar día**

**2. `aviso_panel`** · Utilidad. Es el aviso que le llega a Katy.
> Aviso del bot de la Escuela Coyote: {{1}}. Revisa el panel para más detalles.

Ejemplo: Rosa (6 a 9 años, San Martín de Porres) quiere inscribir a su hijo(a)

**3. `seguimiento_clase`** · Marketing
> Hola {{1}}, ¿qué tal estuvo la clase de prueba en {{2}}? Si quieres asegurar su cupo para el verano, te ayudamos ahora mismo.

Pie de página: `Responde BAJA si no quieres recibir más mensajes.`
Ejemplos: Rosa · San Martín de Porres
Botones: **Quiero inscribirlo** · **Tengo una duda** · **No pudimos ir**

**4. `ultimos_dias_preventa`** · Marketing
> Hola {{1}}, quedan pocos días de la preventa de la Escuela Coyote: {{2}} clases por S/ {{3}} y el uniforme a S/ {{4}} hasta el {{5}}. ¿Te reservamos el cupo?

Pie de página: `Responde BAJA si no quieres recibir más mensajes.`
Ejemplos: Rosa · 24 · 250 · 60 · 20 de diciembre
Botones: **Quiero inscribirlo** · **No me interesa**

**5. `seguir_en_marzo`** · Marketing
> Hola {{1}}, ¡gracias por este verano con la Escuela Coyote! Desde marzo seguimos entrenando 3 veces por semana. Para quienes continúan: {{2}}.

Pie de página: `Responde BAJA si no quieres recibir más mensajes.`
Ejemplos: Rosa · el primer ciclo de marzo a S/ 100
Botones: **Quiero continuar** · **Tengo una duda**

**6. `retomar_conversacion`** · Utilidad. La usa Katy en **Chats** cuando pasaron más de 24 horas desde el último mensaje del padre o madre.
> Hola {{1}}, soy {{2}} de la Escuela Coyote. Te escribo para continuar con tu consulta. ¿Seguimos conversando por aquí?

Ejemplos: Rosa · Katy
Sin botones. Meta puede pasarla a la categoría Marketing; si lo hace, funciona igual, con la tarifa de marketing.

**7. `renovar_clases`** · Marketing. Cuando a un inscrito se le acaban las clases pagadas.
> Hola {{1}}, ¡qué buen ciclo con la Escuela Coyote! Sus clases pagadas están por terminar. Para seguir entrenando: {{2}}. ¿Renovamos?

Pie de página: `Responde BAJA si no quieres recibir más mensajes.`
Ejemplos: Rosa · el siguiente ciclo de 12 clases a S/ 140
Botones: **Sí, renovar** · **Tengo una duda**

**8. `te_extranamos`** · Utilidad. Cuando un inscrito falta varias clases seguidas.
> Hola {{1}}, en la Escuela Coyote notamos {{2}} faltas seguidas y queremos saber si todo está bien. ¿Los esperamos en la próxima clase?

Ejemplos: Rosa · 2
Botones: **Todo bien, volvemos** · **Quiero conversar**

**10. `recordatorio_pago`** · Utilidad. Recordatorio del saldo de una cuota.
> Hola {{1}}, te recordamos que el saldo de {{2}} de la inscripción en la Escuela Coyote vence {{3}}. Puedes pagarlo por Yape o Plin y enviarnos la captura por aquí.

Ejemplos: Rosa · S/ 100 · el 15 de enero
Botones: **Ya pagué** · **Tengo una duda**

**11. `encuesta_satisfaccion`** · Marketing. A las 4 semanas de inscrito.
> Hola {{1}}, ¿cómo le está yendo a tu hijo(a) en la Escuela Coyote? Tu opinión nos ayuda a mejorar.

Ejemplos: Rosa
Botones: **Muy bien** · **Bien** · **Regular**

**12. `cupo_liberado`** · Utilidad. Solo si se enciende la lista de espera automática (apagada por ahora).
> Hola {{1}}, se liberó un cupo en la sede {{2}} de la Escuela Coyote. ¿Lo tomas?

Ejemplos: Rosa · San Martín de Porres
Botones: **Sí, lo tomo** · **Ya no**

**9. `aviso_sede`** · Utilidad. Avisos del día a toda una sede («no hay clase por lluvia»).
> Aviso de la Escuela Coyote, sede {{1}}: {{2}}

Ejemplos: Los Olivos · Hoy no hay entrenamiento por lluvia. Nos vemos el miércoles a la hora de siempre.
Sin botones.

Mientras una plantilla no esté aprobada, ese mensaje no sale. El resto del bot funciona igual.

## Paso 7. Primer ingreso al panel

1. Abre `https://coyote-bot.TU-NOMBRE.workers.dev/panel` y escribe la clave de `ADMIN_PASSWORD`.
2. En **Ajustes**, completa:
   - los horarios y direcciones de cada sede;
   - la hora de la clase de prueba;
   - el WhatsApp de Katy para los avisos;
   - en **Chats y atención**, el horario en que Katy responde;
   - en **Respuestas guardadas**, los datos de pago reales (reemplaza `[NÚMERO]` y `[NOMBRE]`).
   En **Opciones avanzadas**, pega en cada sede el **punto en el mapa** (en Google Maps, mantén presionada la cancha y copia los números, por ejemplo `-11.9861, -77.0835`) y revisa las **preguntas frecuentes**.
3. En **Ajustes → Opciones avanzadas → Ayuda técnica**, pon tu nombre y tu WhatsApp, para que Katy tenga el botón «Pedir ayuda».
4. Toca **Guardar cambios**. La vista previa del chat muestra cómo responderá el bot.

## Paso 8. Probar

1. Desde tu celular, escribe **Hola** al número nuevo y recorre el flujo: edad, sede, clase gratis, fecha y nombre.
2. Al confirmar la clase debe llegar el pin de la cancha.
3. Escribe «¿cuánto cuesta?» y «¿dónde queda?»: el bot responde y sigue donde iba.
4. Toca «Quiero inscribirlo»: al WhatsApp de avisos debe llegar el aviso con un enlace. Ábrelo: se abre ese chat en el panel. Responde desde ahí; el mensaje te llega con el número del bot.
5. En el panel, la persona debe aparecer en **Hoy** y en **Chats**.
6. Para ver lo que pasa en vivo:
   ```bash
   npx wrangler tail
   ```

## Paso 9. Ponerlo en marcha

- Si es un número distinto al de siempre: cámbialo en el botón de WhatsApp de la página de Facebook, en el post fijado y en las publicaciones de la preventa.
- En los anuncios de Meta, usa el objetivo **Mensajes → WhatsApp** con el número del bot.
- Instala el panel en el celular de Katy: ábrelo en Chrome, toca ⋮ y luego «Agregar a la pantalla principal». En iPhone, desde Safari, Compartir → «Agregar a inicio». La pestaña **Ayuda** del panel lo explica paso a paso.

---

## Qué hace cada automatización y cuándo

| Hora (Lima) | Qué pasa |
| --- | --- |
| Cada hora, de 8 a. m. a 9 p. m. | Retoma conversaciones que quedaron a medias hace unas 20 horas, una sola vez por persona. Va dentro de las 24 horas de WhatsApp, así que no usa plantilla. |
| 8 a. m. | Resumen para Katy: chats por responder, comprobantes por revisar, clases de prueba, consultas nuevas. Los lunes incluye la semana anterior en números. |
| 10 a. m. | Invitación a renovar a los inscritos cuyas clases pagadas terminan en 5 días o menos (una sola vez por ciclo). |
| 10 a. m. | Recordatorio de cuota: 2 días antes del vencimiento y el mismo día. |
| 11 a. m. | Encuesta de satisfacción a quienes cumplen 4 semanas de inscritos. |
| Día 1, 9 a. m. | Resumen del mes anterior a Katy (y a un número extra si se configura). |
| Domingos, 4 a. m. | Copia de seguridad de toda la base en el depósito de Cloudflare. |
| 12 m. | Mensaje «te extrañamos» a los papás de inscritos con 2 faltas seguidas en la lista de asistencia (una vez por racha). |
| De 10 a. m. a 8 p. m. | Recordatorios para quienes tienen clase al día siguiente, por tandas. |
| De 11 a. m. a 7 p. m. | Seguimiento para quienes tuvieron clase ayer. |
| 3 a. m. | Limpieza de datos técnicos viejos. |

Cada automatización se enciende o apaga en **Ajustes → Lo que el bot hace solo**.

## Página web de la escuela

La dirección del bot sin `/panel` (por ejemplo `https://coyote-bot.TU-NOMBRE.workers.dev/`) es una página pública para los padres: precios, sedes, horarios, cómo funciona la clase de prueba, edades y preguntas frecuentes. Todos los botones abren el WhatsApp del bot.

- Se arma sola con los mismos Ajustes del bot: si Katy cambia el precio o un horario, la web cambia en un minuto.
- Lo propio de la web está en **Ajustes → Página web**: el WhatsApp del bot (obligatorio para que funcionen los botones), la temporada, el primer día del verano, el titular, el texto de bienvenida y los enlaces de Facebook e Instagram. También se puede apagar.
- Cumple las pautas de accesibilidad WCAG 2.2 nivel AA (contraste, teclado, lectores de pantalla, tamaño de botones); se verificó con la herramienta axe sin errores.
- Para usar un dominio propio (por ejemplo `escuelacoyote.pe`): en Cloudflare → Workers → coyote-bot → **Configuración → Dominios y rutas**, agrega el dominio (hay que comprarlo o tenerlo en Cloudflare). Es opcional.
- Úsala en los anuncios y en la página de Facebook como enlace, y en el perfil de Google de cada sede.

## Inscripciones, pagos y renovaciones

- **Comprobante de pago.** Si alguien que está inscribiéndose (o un inscrito) manda una foto o un PDF, el bot la toma como comprobante: le agradece, avisa a Katy con el enlace al chat y la persona aparece en **Hoy → Comprobantes de pago por revisar**. Katy abre el chat, mira la captura y toca **Se inscribió**; si no era un comprobante, toca **No era comprobante**.
- **Se inscribió.** Al tocarlo, Katy elige qué pagó: **Verano** (24 clases), **Ciclo de 12 clases** u **Otro plan** (escribe cuántas clases; sirve para las ventas a medida). El panel muestra a cuánto sale cada clase y avisa en ámbar si queda por debajo del mínimo acordado (Ajustes → Precios → Mínimo por clase, S/ 12 de inicio), pero deja guardar. La ficha va mostrando cuántas clases le quedan según la lista de asistencia, y el bot invita a renovar cuando le quedan 2 o cuando se acerca la fecha límite (8 semanas el verano, 4 el ciclo, y para otros planes una semana por cada 3 clases más una de margen). En Números aparece el promedio cobrado por clase.
- **Cupos.** En **Ajustes → Horarios y direcciones**, cada sede tiene un número de cupos (0 = sin límite). Cuando los inscritos llegan a ese número, el bot ofrece otra sede o **Lista de espera**; esas personas aparecen en **Hoy → Lista de espera** y en Personas con el filtro «En espera».
- **Hermanos.** Si escriben «tengo 2 hijos de 7 y 9», el bot sigue con el mayor, menciona el beneficio por hermanos (Ajustes → Lo que el bot hace solo) y deja la nota en la ficha.
- **Asistencia.** En **Hoy → Pasar lista de hoy**, Katy marca por sede quién vino y quién faltó. Con 2 faltas seguidas el bot escribe a los papás. En Números se descarga la asistencia completa.
- **Cómo llegaron.** La web etiqueta los mensajes según el enlace que se use (`/?de=fb`, `/?de=ig`, `/?de=google`, `/?de=volante`), y en **Números → Cómo llegaron** se ve cuántos escribieron y cuántos se inscribieron por canal. Usa cada enlace en su sitio (el de volante, como código QR).

## Personal de las sedes y ventas en la cancha

- **Desde una laptop.** El panel es la misma dirección en cualquier navegador; en pantalla grande las pestañas aparecen arriba. La clave se recuerda 3 meses en cada dispositivo.
- **Personal.** En **Ajustes → Personal de las sedes**, Katy agrega a cada profesor o asistente con su nombre, cargo, sede y un PIN de 4 a 8 números (se lo dice en persona; el sistema no lo guarda en texto legible). Ellos entran en la pantalla de clave eligiendo **Profesor o personal**, con su nombre y PIN; la sesión les dura 30 días.
- **Cuenta de pagos.** En **Ajustes → Cuenta de la escuela para pagos** va el Yape/Plin de la escuela y el titular; el bot, la web y la respuesta guardada «Datos de pago» lo usan. Nunca la cuenta de un profesor.
- **Qué puede vender el personal:** solo el paquete de verano y el ciclo de 12 clases, al precio publicado. Los planes a medida y otros montos los registra Katy (se puede permitir al personal con un interruptor en esa misma sección).
- **Qué puede hacer el personal:** ver las personas de su sede (con los celulares ocultos), pasar lista y escanear carnets, registrar ventas en la cancha, anotar gastos de su sede y agregar notas. **No puede:** ver chats, cambiar Ajustes, ver Números ni otras sedes, borrar personas ni descargar listas. Todo lo que hace queda a su nombre en **Ajustes → Personal → Quién hizo qué**. «Quitar acceso» lo saca al instante.
- **Venta en la cancha.** En **Hoy → Registrar una venta en la cancha**: nombre, celular (opcional), edad, plan (verano, ciclo u otro), monto y cómo pagó. La persona queda inscrita, el pago entra en Caja con quién lo registró y se crea su carnet QR. Si dejó celular, el bot le envía el carnet cuando escriba (WhatsApp no deja iniciar la conversación sin plantilla); mientras tanto se puede abrir, mostrar o imprimir desde el panel.

## Personal: entrada y salida, y pago del mes

- Cada sede tiene un **QR fijo** (Ajustes → Personal → «QR Los Olivos», etc.). Katy lo imprime y lo pega en la cancha. El profesor lo escanea desde su panel («Marcar mi entrada» / «Marcar mi salida»); si hay hora de inicio configurada para la sede, se marca la tardanza.
- En la ficha de cada persona del personal, Katy pone la **tarifa** («25 clase», «15 hora» o «900 mes»). Con las jornadas del mes, el panel calcula el pago y «Registrar pago» lo anota en Caja como gasto de Profesores.
- Hay dos cargos: **Profesor/Asistente** (pasa lista, escanea, marca su jornada; no ve dinero) y **Administrativo de sede** (además vende los paquetes publicados, cobra cuotas y uniformes y anota gastos de su sede).

## Cuotas, encuesta, referidos y uniformes

- **Cuotas.** Al inscribir, Katy indica cuánto pagó y cuánto queda debiendo y hasta cuándo. El bot recuerda 2 días antes y el día del vencimiento; la ficha, el carnet y Hoy → «Cuotas por cobrar» lo muestran. «Cobró la cuota» registra el pago en Caja. Solo Katy vende en cuotas.
- **Encuesta.** A las 4 semanas de inscrito, tres botones. «Regular» pasa el chat a Katy con aviso. Resultados por sede en Números.
- **Referidos.** El código del carnet es el código para recomendar. Quien escribe al bot con un código queda vinculado a esa familia (origen «Referido») y recibe el texto del beneficio. Números muestra quién trae familias; el beneficio lo aplica Katy a mano.
- **Uniformes.** En Números: stock por talla (las tallas se definen en Ajustes). Desde la ficha, «Entregó uniforme» registra talla, descuenta stock y, si corresponde, cobra.
- **Alerta de cupos.** Cuando una sede llega al porcentaje configurado (80 %) y cuando se llena, Katy recibe un aviso, una sola vez por nivel.

## Carnet QR, Caja y avisos a una sede

- **Carnet QR.** Al tocar «Se inscribió», el bot le envía al papá o mamá un enlace con el carnet digital (QR, nombre, sede y clases que le quedan; se puede imprimir). En la cancha: **Hoy → Pasar lista → Escanear carnet**; el panel abre la cámara, lee el código y marca la asistencia con la hora. Si lo escanean dos veces, avisa que ya estaba. Si el papá no tiene el carnet, Katy escribe el código de 10 letras o marca a mano. Desde la ficha, «Carnet QR» lo vuelve a abrir y enviar. En **Ajustes → Opciones avanzadas** se puede encender «avisar al papá cuando ingresa» (solo se envía si escribió en las últimas 24 horas; no usa plantilla).
- **Caja** (en Números). Cada inscripción entra sola como ingreso en la sede de la persona. Katy anota los gastos (alquiler de cancha, profesores, uniformes, materiales) y los ingresos extra; los gastos de anuncios de la tabla semanal también se suman. Se ve el mes por sede (entró, salió, queda) y se descarga en CSV. Los ingresos por inscripción no se borran desde Caja: se corrigen en la ficha de la persona.
- **Aviso a una sede** (en Números). Para avisos del día. Llega a los inscritos y a quienes tienen clase de prueba en esa sede, con la plantilla `aviso_sede`. Pide confirmar con un segundo toque y nunca repite el mismo aviso.

## Responder desde el panel (Chats)

- Cuando un padre o madre quiere inscribirse o pide hablar con Katy, el bot le dice que Katy le escribe **por ese mismo chat**, le avisa a Katy con un enlace y deja de responder en ese chat. Si escriben fuera del horario de Katy, el bot les dice a qué hora responde.
- El bot reconoce muchas formas de pedir una persona: «hablar con un humano», «con un asesor», «que me atienda alguien», «llámenme», «¿eres un robot?», el nombre de Katy… Si la frase también es una pregunta frecuente («¿cuánto cuesta por persona?», «ayuda con el horario»), responde la pregunta en vez de pasar el chat.
- Cuando piden una persona (no cuando piden inscribirse), además envía la lista de preguntas frecuentes: «Mientras Katy te responde, quizás tu duda ya está aquí». Si tocan una, el bot la responde aunque el chat ya sea de Katy; lo demás que escriban lo atiende ella.
- En **Chats**, la insignia roja cuenta los chats que esperan respuesta. Las respuestas guardadas escriben los textos de siempre con un toque; si queda algo entre [corchetes], el panel avisa antes de enviar.
- **Atender yo** detiene al bot en un chat; **Devolver al bot** lo reactiva. Si Katy no escribe en 12 horas (se cambia en Ajustes), el bot vuelve a atender ese chat; si hay mensajes que Katy aún no leyó, espera hasta 48 horas.
- WhatsApp solo permite mensajes libres **dentro de las 24 horas** desde el último mensaje del padre o madre. Pasado ese tiempo, el panel ofrece enviar la plantilla `retomar_conversacion`; cuando respondan, se puede escribir normal.
- El panel muestra fotos, audios, videos y documentos que envían los padres. WhatsApp los guarda unos 30 días.
- **Audios.** En el chat, Katy mantiene presionado el micrófono para grabar y suelta para enviar. Funciona en Chrome actualizado (celular y computadora) y en Safari; el navegador pide permiso para usar el micrófono la primera vez.
- Si prefieren el sistema anterior (que los padres escriban al WhatsApp personal de Katy), en **Ajustes → Chats y atención** elige «Le pido que me escriba a mi WhatsApp».

## Mensajes a grupos

En **Números → Mensajes a grupos** Katy puede enviar dos mensajes:

- **Últimos días de la preventa**, a quienes consultaron o vinieron y aún no se inscriben.
- **Seguir entrenando en marzo**, a los inscritos del verano.

Antes de enviar, el panel muestra el mensaje de ejemplo y a cuántas personas llegará, y pide confirmar con un segundo toque. Nadie lo recibe dos veces, y quien escribió BAJA queda fuera. Los envíos salen de 15 en 15 hasta terminar.

## Cambiar precios, textos o lo que hace el bot

Todo se cambia desde el panel, en **Ajustes**. **Volver a como estaba** deshace el último cambio guardado; se guardan los últimos 10. Solo hay que tocar código para agregar funciones nuevas.

**Cómo entiende el bot lo que escriben.** No es inteligencia artificial: cada pregunta frecuente tiene una lista de palabras (Ajustes → Opciones avanzadas → Preguntas frecuentes). Si el mensaje contiene alguna palabra o frase completa de la lista, responde eso. No importan las tildes, las mayúsculas ni los signos. También entiende edades escritas («tiene 8 años», «ocho añitos») y fechas («el 21», «este sábado», «el siguiente»).

Además, el botón **Preguntas frecuentes** abre una lista desplegable con hasta 10 preguntas para tocar (¿Cuánto cuesta?, ¿Qué horarios hay?…). Aparece al final de la conversación, cuando el bot no entiende dos veces seguidas, en la respuesta a audios y fotos, y si escriben «dudas» o «preguntas». No aparece después del precio, porque ahí los 3 botones que permite WhatsApp son «Clase gratis», «Inscribir» y «Hablar con Katy». En Ajustes se elige qué preguntas salen en la lista y cómo se ven (hasta 24 letras).

Cuando no entiende, dice «No te entendí bien» y repite las opciones; si vuelve a pasar, ofrece hablar con Katy o ver las preguntas frecuentes. Cada mensaje que no entendió queda en **Ajustes → Lo que el bot no entendió**. Una vez por semana conviene revisarlo: se elige qué debía responder, se toca **Enseñarle** y luego **Guardar cambios**. Esa lista se borra sola a los 90 días.

## Dos entornos: prueba y producción

Para probar cambios sin tocar a los papás hay un segundo Worker, `coyote-bot-prueba`, con su propia base. Se crea una vez:

```bash
npx wrangler d1 create coyote-bot-prueba        # pega el id en wrangler.toml, sección [env.prueba]
npx wrangler r2 bucket create coyote-copias-prueba
npm run db:crear-tablas:prueba
npx wrangler secret put ADMIN_PASSWORD --env prueba   # y los otros tres secretos, con el número de prueba de Meta
npm run deploy:prueba
```

Flujo de trabajo: cambio → `npm test` en la computadora → `npm run deploy:prueba` y se prueba con el número de prueba de Meta → `npm run deploy` a producción.

## Copias de seguridad y recuperación

- **Time Travel de D1:** Cloudflare guarda el historial de la base por 30 días. Si alguien borra algo por error, se puede volver a cualquier minuto: `npx wrangler d1 time-travel restore coyote-bot --timestamp=2027-01-15T14:00:00Z` (antes: `npx wrangler d1 time-travel info coyote-bot`).
- **Copia semanal:** cada domingo a las 4 a. m. el bot guarda un JSON con todas las tablas en el depósito `coyote-copias` (se conservan las últimas 12). Se crea una vez con `npx wrangler r2 bucket create coyote-copias`; si no se crea, el bot simplemente no guarda la copia.
- **Copia mensual de Katy:** el resumen del día 1 le recuerda descargar la **copia completa** desde Números y guardarla en su Google Drive. También `npm run db:copia` descarga un `.sql` desde la computadora.
- Las copias no incluyen los PIN del personal (se vuelven a asignar si hace falta).

## Avisos del propio sistema

- **Primer día.** En Hoy, el panel muestra una lista con los datos que faltan para que todo funcione (Yape, horarios, hora de la clase de prueba, puntos en el mapa, personal, etc.) y a qué parte de Ajustes ir. Desaparece sola cuando está completo.
- **Si Meta rechaza envíos** (token vencido, plantilla sin aprobar, cuenta restringida), en Hoy aparece un aviso rojo con la causa en palabras simples y el botón «Pedir ayuda». Se quita solo cuando vuelve a enviar.
- **Sin señal en la cancha.** Las marcas de asistencia se guardan en el celular y se envían solas cuando vuelve internet; el panel muestra cuántas están pendientes.
- **Privacidad.** La web tiene una página `/privacidad` que explica qué datos se guardan y cómo pedir que se borren (Ley 29733). Conviene enlazarla desde la página de Facebook.

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| El bot no responde | El webhook no está suscrito a «messages» | Revisa el paso 5 |
| `wrangler tail` muestra «WhatsApp rechazó el envío» con 401 | Token vencido o mal copiado | Genera otro token permanente y repite `wrangler secret put WHATSAPP_TOKEN` |
| El webhook no se verifica | El token de verificación no coincide | Usa exactamente el valor de `VERIFY_TOKEN` |
| No salen recordatorios, avisos o seguimientos | Plantilla no aprobada o con otro nombre | Revisa el nombre exacto en Meta y en Ajustes → Plantillas de Meta |
| Los botones de una plantilla no hacen nada | Textos de botón distintos | Deben ser exactamente los del paso 6 |
| En Chats dice que pasaron 24 horas | Regla de WhatsApp | Usa «Enviar mensaje para retomar» (plantilla `retomar_conversacion` aprobada) |
| Un audio o foto ya no se abre | WhatsApp borra los archivos después de unos 30 días | Pide que lo reenvíen |
| El bot le responde a un familiar | El número no está en la lista de excluidos | Agrégalo en Ajustes → Opciones avanzadas → Números que el bot no atiende |
| Katy no puede entrar | Clave distinta | Vuelve a definirla con `wrangler secret put ADMIN_PASSWORD`; eso cierra todas las sesiones abiertas |

## Privacidad

- El bot solo pide la **edad** del niño y el **nombre del padre o madre**. Nunca pide el nombre del niño.
- El panel guarda celulares de padres: la clave no se comparte ni se deja en grupos.
- Quien escribe BAJA o toca «No me interesa» deja de recibir promociones. El bot le sigue respondiendo si escribe.
- «Quitar de la lista» en el panel oculta a la persona de inmediato y se puede deshacer.
- Los chats se guardan en la base de datos del bot para que Katy vea la conversación completa, y se borran solos al cumplir un año. Los números de «Números que el bot no atiende» no se guardan.
