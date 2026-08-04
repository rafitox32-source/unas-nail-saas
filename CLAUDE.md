# Uñas — SaaS para Nail Artists

SaaS multi-inquilino: carta pública + reservas con seña para clientas, back-office
para manicuristas. Todo el código (tablas, componentes, variables) en español,
sin spanglish. Mobile-first.

Este archivo es el checkpoint del proyecto. Antes de tocar algo, leer la sección
"Progreso" y "Decisiones y trampas" — ahorra tener que releer todo el código.

## Progreso

- [x] Esquema SQL + RLS (`supabase/esquema_inicial.sql`)
- [x] Sistema de diseño (paleta, tipografía, botones, tarjetas) → sincronizado a
      claude.ai/design, proyecto "Nail Artist SaaS — Sistema de Diseño"
      (`diseno-sistema/`)
- [x] Andamiaje Next.js 16 + Tailwind v4 + Supabase conectado (`web/`)
- [x] Landing pública multi-tenant `/[slug]` (hero, servicios, galería
      placeholder, footer con WhatsApp)
- [x] Reserva y seña: modal + RPC `crear_apartado` (valida disponibilidad,
      crea/reusa clienta, crea cita en `pendiente_seña`)
- [x] Login/registro de manicuristas con **usuario + contraseña, sin email
      real** (a pedido del dueño — no quería depender de correos). Por
      dentro Supabase Auth sigue exigiendo un "email", así que se genera uno
      sintético e invisible (`{usuario}@usuarios.uas-login.com`, ver
      `src/lib/autenticacion.ts`); nunca se manda nada ahí. Columna
      `usuario` única en `usuarios_manicuristas`, RPC `usuario_disponible`
      con chequeo en vivo (mismo patrón que `slug_disponible`). Esto además
      resuelve de raíz el problema de SMTP/Resend pendiente — sin emails
      reales no hace falta proveedor de envío para el login. El paso manual
      en el dashboard de Supabase (Authentication → Sign In / Up → Email:
      "Enable Email provider" prendido + "Confirm email" apagado) ya se
      hizo y quedó probado de punta a punta — login y registro nuevo ambos
      caen directo al panel sin pedir confirmación. Ver trampa #23 para el
      detalle de por qué hacía falta.
- [x] Back-office: nav protegida por sesión (`(interno)/layout.tsx`)
- [x] Back-office → Servicios: CRUD completo (crear/editar/activar/borrar)
- [x] Back-office → Agenda: cambiar estado de citas (confirmar seña / completar /
      no asistió / cancelar), link directo a WhatsApp de la clienta
- [x] Back-office → Clientas (CRM): lista + buscador, ficha con alergias/notas
      editables, historial de citas, **LTV automático** (trigger suma
      `monto_total` cuando una cita pasa a `completada`)
- [x] Back-office → Inventario: CRUD, ajuste rápido de stock (±), alerta
      automática de reposición cuando `cantidad_actual <= cantidad_minima_alerta`
- [x] Historial fotográfico / fórmulas de color por visita: tabla
      `notas_visita` + bucket privado de Storage `fotos-clientas` (path
      `{id_manicurista}/{id_cita}/...`), expandible desde el historial de la
      ficha de clienta. Subir, ver (URL firmada) y borrar fotos, todo probado
- [x] Facturación / recibos digitales: botón "Cobrar resto y completar" en
      Agenda (liquida `monto_seña_pagado = monto_total` + marca `completada`
      en una sola acción) → recibo elegante e imprimible en
      `/panel/recibo/[id]` (usa `window.print()`, sin librería de PDF), con
      link de WhatsApp a la clienta. No es compartible sin login todavía —
      ver nota en Decisiones y trampas
- [x] Promociones/cupones: CRUD en `/panel/promociones` (mismo patrón que
      servicios/inventario) + conectado de verdad al flujo de reserva —
      `crear_apartado` valida el código, calcula el descuento
      (`porcentaje`/`monto_fijo`, tope al precio del servicio) y descuenta un
      uso. Nueva RPC pública `validar_codigo_promocional` para la vista
      previa en vivo antes de confirmar.
- [x] **Pulido 1 (a11y/mobile/contraste)**: auditoría real con axe-core sobre
      las 13 pantallas/estados del proyecto en mobile y desktop — 0
      violaciones. Ver "Pulido 1" más abajo.
- [x] **Pulido 2 (detalle visual)**: íconos (lucide-react) en nav, botones de
      acción, formularios y estados vacíos; micro-interacciones (modal con
      animación de entrada, hover con elevación en tarjetas, spinners de
      carga); mini-dashboard con estadísticas reales en `/panel`; fix de zoom
      automático de iOS en inputs; bug real de overflow en Android
      encontrado recién al probar con perfil de dispositivo real (no solo
      ancho de viewport). Ver "Pulido 2" más abajo.
- [x] Programas de lealtad: config por manicurista (activo/visitas por
      premio/descripción del premio) en `/panel/promociones`, debajo del CRUD
      de cupones (no se sumó una 7ma sección a la nav, ver trampa #8).
      Contador `clientas.visitas_completadas` se incrementa en el mismo
      trigger que ya sumaba el LTV (ver trampa #20). Premios disponibles se
      calculan al vuelo (`floor(visitas/objetivo) - premios_canjeados`), sin
      guardar un flag aparte. Barra de progreso + botón "Canjear premio" en
      la ficha de clienta. Probado de punta a punta con citas reales
      completadas vía el botón de Agenda (no solo update directo en la base).
- [x] Fotos reales de la galería: cada manicurista sube/reordena/borra sus
      propias fotos desde `/panel/servicios` (tabla `fotos_galeria` + bucket
      público `fotos-galeria`, patrón calcado de `fotos-clientas` pero
      público en vez de privado). La landing pública (`/[slug]`) muestra
      esas fotos reales cuando existen; si la manicurista no subió ninguna,
      sigue mostrando los gradientes placeholder con el mensaje "Pronto vas
      a poder ver fotos reales…" (fallback automático por longitud de
      `urlsGaleria`, no por flag manual). Reemplaza la entrada anterior que
      esperaba fotos reales *mías* para la cuenta demo — la solución
      correcta para un SaaS multi-tenant es que cada manicurista cargue las
      suyas, no fotos fijas de una sola cuenta.
- [x] Reserva pública con horarios reales en vez de un input de hora libre:
      `modal-reserva.tsx` genera los turnos de inicio que entran completos
      en el horario de atención (09:00–20:00, pasos de 30 min) y no se
      superponen con ningún turno ya ocupado ese día — la clienta elige de
      una lista de botones, no adivina una hora a mano y se entera de si
      está libre recién al confirmar. Estrategia elegida a pedido del
      dueño en vez de automatizar WhatsApp (que necesitaría WhatsApp
      Business API — misma complejidad/costo que las campañas masivas, sin
      justificarse todavía): la clienta interactúa solo con el link
      público, sin necesitar el celular de la manicurista para nada previo
      a la reserva. Probado de punta a punta: reservar un turno de 45 min
      sacó correctamente los dos slots de 30 min que se superponían
      (09:00 y 09:30), no solo el exacto que se eligió.
- [x] Aprobación de cuentas por admin: toda manicurista nueva queda
      `pendiente` al registrarse (columna `estado_cuenta` en
      `usuarios_manicuristas`) — no entra al panel ni su carta pública es
      visible hasta que el dueño de la plataforma la aprueba desde `/admin`
      (protegido por `usuarios_manicuristas.es_admin`, no es un rol de
      manicurista). El gate vive en `(interno)/layout.tsx` (muestra
      pantalla de "en revisión"/"rechazada" en vez del panel) y en la RLS
      pública de `usuarios_manicuristas` (`estado_cuenta = 'aprobada'`
      además de tener slug). `crear_apartado` también valida el estado
      como defensa en profundidad. Tarjeta de acceso a `/admin` en
      `/panel` (con contador de pendientes) solo si `es_admin`, en vez de
      sumar un 7mo ítem a la nav (trap #8). Ver trampa #24 — encontré un
      bug real de recursión infinita en RLS al construir esto, no al leer
      el código.
- [ ] Campañas de marketing masivo — decisión pendiente: se evaluó
      email (Resend) vs. WhatsApp Business API, quedó pausado a pedido
      del dueño para más adelante
- [~] Proveedor SMTP propio (Resend): **ya no hace falta para el login** —
      al pasar a usuario + contraseña sin email real (ver arriba), no hay
      ningún correo que mandar en el flujo de auth. Sigue pendiente
      únicamente si en el futuro se agrega algo que sí necesite mandar
      email de verdad (recuperar contraseña, recibos por correo, etc. — hoy
      nada de eso existe). Si aparece esa necesidad: cuenta en resend.com +
      dominio propio verificado, no delegable

## Decisiones y trampas (leer antes de tocar auth o RPCs)

1. **GoTrue (Supabase Auth) rechaza dominios `example.com`/`.test`** con
   `email_address_invalid`. Para pruebas usar un dominio no reservado
   (ej. `@correo-demo-uas.com`).
2. **Usuarios creados a mano por SQL necesitan `confirmation_token`,
   `recovery_token`, `email_change_token_new`, `email_change` en `''`, nunca
   `NULL`** — si no, el login tira 500. También conviene insertarles una fila
   en `auth.identities` (provider `email`). Un registro real por el formulario
   no tiene este problema.
3. **Toda función nueva en Postgres recibe `EXECUTE` de `PUBLIC` por
   default.** Las funciones que son solo triggers internos (ej.
   `manejar_nuevo_usuario`, `actualizar_ltv_clienta`) necesitan
   `revoke all ... from public, anon, authenticated` explícito, si no quedan
   expuestas como endpoint RPC público sin querer. Correr
   `get_advisors(type: security)` después de cada migración lo detecta.
4. **En una función `plpgsql` con `returns table (id uuid, estado_cita text, ...)`,
   esos nombres de columna de salida hacen sombra a columnas reales de las
   tablas.** Toda referencia a `id`, `estado_cita`, etc. dentro del cuerpo debe
   ir calificada con el nombre de tabla (`servicios.id`, no `id` a secas), o
   Postgres tira "column reference is ambiguous".
5. **Next.js 16 renombró `middleware.ts` → `proxy.ts`** (función `proxy`, no
   `middleware`). Ya migrado en `web/src/proxy.ts`.
6. **`supabase-js` en `.rpc(...)` devuelve un thenable sin `.finally()`** —
   usar `.then()` con una bandera de cancelación, no encadenar `.finally`.
7. Todas las políticas RLS de "la manicurista administra lo suyo" usan
   `to authenticated` + `(select auth.uid())` (no `auth.uid()` pelado) — evita
   evaluación por fila y que se evalúen de más contra el rol `anon`. Advisor
   de performance en 0 con esto.
8. **La nav de `(interno)` (`nav-interno.tsx`) tiene 6 secciones y ya no
   entra en 390px** (Inicio/Servicios/Agenda/Clientas/Inventario/Promociones
   + "Salir"). Tiene `overflow-x-auto` + auto-scroll al link activo
   (`scrollIntoView` en un `useEffect` sobre `usePathname()`) para que la
   sección activa siempre quede visible, y gradientes en los bordes como
   pista de que se puede scrollear. Si se suma una 7ma sección, esto ya no
   va a alcanzar — ahí sí conviene un rediseño real (tabs de ícono o menú).
9. **Al probar carga de imágenes con Playwright, esperar el evento `load` real
   del `<img>`** (o `naturalWidth > 0`), no leerlo apenas el elemento aparece
   en el DOM — una imagen cross-origin (Supabase Storage) tarda más que el
   check inmediato y da falsos negativos ("no cargó") que no son bugs reales.
10. **`DELETE` directo sobre `storage.objects` por SQL está bloqueado**
    (`storage.protect_delete()`). Para borrar un archivo hay que usar la
    Storage API (`supabase.storage.from(bucket).remove([ruta])`) autenticado
    como el dueño, no una migración.
11. **`flex justify-between` sin `gap-*` no garantiza separación** — si el
    contenido de ambos lados es lo bastante largo, terminan pegados con 0px
    entre sí (pasó en el recibo con un nombre de servicio largo). Regla del
    proyecto: todo `justify-between` con texto dinámico de ambos lados lleva
    `gap-3` + `shrink-0` en el lado corto (precio, badge, botón) + `min-w-0
    truncate` en el lado que puede ser largo.
12. **`create or replace function` con un parámetro nuevo NO reemplaza la
    función vieja si cambia la lista de tipos** — Postgres la trata como un
    overload distinto y quedan las dos coexistiendo (pasó al agregarle
    `p_codigo_promocional` a `crear_apartado`, terminó habiendo dos
    versiones y ambigüedad potencial en el RPC). Si cambiás la firma de una
    función existente, hacer `drop function` explícito de la versión vieja
    en la misma migración.
13. **Usar `.maybeSingle()`, no `.single()`, para cualquier RPC/query que
    pueda devolver 0 filas** (ej. validar un código que no existe) —
    `.single()` tira un 406 (ruidoso en consola, aunque el error se maneja
    bien en JS) cuando no hay filas; `.maybeSingle()` devuelve `data: null`
    sin error.
14. **Un `record` de PL/pgSQL sin asignar rompe apenas se lee un campo suyo**,
    aunque sea solo para comparar contra `null` (`record "x" is not assigned
    yet`). Pasó en `crear_apartado`: `v_promocion` solo se asignaba adentro
    del `if` del código promocional, y **toda reserva sin código rompía con
    500** — bug real que llegó a producción (la base) porque solo probé los
    caminos "con código válido" y "con código inválido", nunca "sin código".
    Corregido declarando el record adentro de un bloque `declare/begin/end`
    propio del `if`, y usando una variable `uuid` simple (`v_id_promocion`)
    para lo que se necesita fuera de ese bloque. **Lección**: al agregar un
    parámetro opcional a una función que ya andaba, probar explícitamente el
    camino sin ese parámetro, no solo los casos nuevos.
15. **`opacity-50` en todo un contenedor destruye el contraste de todo el
    texto de adentro**, incluso texto que ya tenía contraste alto (bajaba de
    ~10:1 a ~3:1). Se usaba para marcar servicios/promociones inactivos —
    axe-core lo detectó. Reemplazado por: fondo apenas distinto y opaco
    (`bg-borde/30`, sin tocar la opacidad del texto) + una insignia explícita
    "Inactivo"/"Inactiva" (además ayuda a no depender solo del color/opacidad
    para transmitir el estado).
16. **Los inputs nativos `type="date"`/`type="time"` no se achican con
    `flex-1` tanto como los demás campos** (tienen un ancho mínimo de
    contenido que ignora flex-shrink) y ya traen su propio ícono de selector
    del sistema operativo. Sumarles el patrón `CampoConIcono` (ícono propio +
    padding izquierdo) los hizo desbordar el viewport en Chrome de Android
    —**medido con Playwright + perfil de dispositivo real (`devices['Pixel 7']`),
    no se veía probando por ancho de viewport en Chromium normal**: el campo
    terminaba 19px afuera de la pantalla, inalcanzable. Fix: esos dos campos
    van con `<input>` simple (sin `CampoConIcono`) y `min-w-0` en el label
    contenedor. Lección: probar con perfiles de dispositivo reales
    (`playwright.devices`, WebKit para iOS) además de anchos de viewport —
    hay bugs que uno no ve de otra forma.
17. **axe-core puede dar falsos positivos de contraste si se lo corre
    mientras una animación de entrada (`opacity: 0→1`) todavía está a mitad
    de camino** — el color efectivo renderizado está mezclado con el fondo
    en ese instante, aunque el color en reposo cumpla de sobra. Antes de
    auditar tras un click que revele contenido animado, esperar a que
    termine la transición (los `animar-*` de este proyecto duran ≤0.3s).
18. **El servidor de desarrollo a veces sirve CSS viejo tras varias ediciones
    seguidas de `globals.css`** (ya pasó dos veces en el proyecto). Si un
    resultado de contraste/estilo no coincide con lo que dice el código
    fuente, reiniciar `npm run dev` antes de asumir que hay un bug real —
    confirmar con `getComputedStyle` directo en vez de confiar en una sola
    lectura.
19. **Los contadores incrementados a mano (`promociones.usos_actuales`) no
    se ajustan solos si se borra la cita/clienta que los generó** — quedan
    inflados. Pasó al limpiar clientas de prueba que habían usado un código.
    No es un bug del flujo normal (nadie borra clientas que ya usaron un
    cupón en el día a día), pero si hay que limpiar datos a mano, recalcular
    el contador contra `citas_apartados` real de paso.
20. **Al agregar una métrica nueva que se dispara con el mismo evento que una
    ya existente (visitas de lealtad + LTV, ambas en "cita → completada"),
    extender el trigger existente en vez de crear uno nuevo sobre la misma
    fila/evento.** `actualizar_ltv_clienta` se renombró a
    `actualizar_metricas_clienta` y ahora hace las dos sumas en el mismo
    `UPDATE`. Evita un segundo trigger redundante y una segunda pasada de
    escritura sobre `clientas` por cada cita completada.
21. **Un link de Next roto en un test de Playwright no siempre es un bug de
    la app** — durante la prueba de lealtad, `enlaceCamila.click()` no
    navegaba (URL no cambiaba, sin error de consola ni de página) mientras
    el dev server seguía recompilando por Fast Refresh a causa de ediciones
    en curso en otros archivos del proyecto. Un `page.goto()` directo a la
    misma URL cargó todo perfecto. Antes de reportar un bug de navegación
    encontrado por Playwright, confirmar que no haya Fast Refresh corriendo
    en simultáneo (dejar de editar archivos mientras corre la prueba, o
    esperar a que el log del dev server esté en silencio).
22. **`storage.objects.remove()` de supabase-js resuelve los archivos a
    borrar con un SELECT interno sujeto a RLS antes de borrarlos** — si el
    rol no tiene ninguna política de SELECT sobre esa fila, `remove()`
    devuelve `data: []` y `error: null` (éxito silencioso, cero archivos
    borrados de verdad). Pasó en el bucket `fotos-galeria`: saqué la única
    política de SELECT porque el advisor de seguridad marcaba que era
    "amplia" y permitía listar el bucket entero (`public_bucket_allows_listing`)
    — pero un bucket público no necesita política de SELECT para *servir*
    archivos por URL pública, así que pareció seguro sacarla del todo. El
    bug (3 archivos huérfanos en Storage sin fila en `fotos_galeria`, nunca
    aparecieron en la UI de errores) solo se vio corriendo el flujo de borrado
    real y comparando contra `storage.objects` por SQL, no leyendo el código.
    Fix: agregar una política de SELECT acotada a la propia carpeta
    (`to authenticated using (bucket_id = '...' and foldername[1] =
    auth.uid())`), ni pública ni ausente — necesaria para que la dueña
    encuentre sus propios archivos al listar/borrar, sin exponer el listado
    completo del bucket a terceros. **Lección**: en buckets públicos, "sacar
    la política de SELECT" para resolver un advisor de "listado público"
    rompe el borrado/listado de la propia dueña — la política correcta es
    acotarla al dueño, no eliminarla.
23. **Con "Confirm email" activo en Supabase Auth, GoTrue valida la
    entregabilidad real del email al mandar la confirmación** — no es solo
    un chequeo de formato. Al mover el login a usuario + contraseña con un
    email interno inventado (`{usuario}@usuarios.uas-login.com`, ningún
    dominio real), todo `signUp` real fallaba con `email_address_invalid`
    ("Email address ... is invalid") o, tras varios intentos seguidos,
    `email rate limit exceeded` (el mailer gratuito de Supabase se quedó sin
    cupo de envíos). Confirmado leyendo los logs reales de Auth
    (`get_logs(service: "auth")`) en vez de solo el mensaje que llega al
    cliente: el evento `user_confirmation_requested` se dispara ANTES del
    error, o sea que GoTrue ya creó el usuario y recién falla al intentar
    mandarle el correo de confirmación — con `.internal`, con un dominio
    inventado sin MX, y hasta con `gmail.com` en pruebas directas contra la
    API si el rate limit ya estaba gastado. La transacción se revierte
    entera en ambos casos (no quedan usuarios fantasma en `auth.users`).
    Ningún dominio "arregla" esto — la única solución real es apagar
    "Confirm email" (Authentication → Sign In / Up → Email en el dashboard
    de Supabase), y ahí GoTrue nunca intenta mandar nada. El login de una
    cuenta ya confirmada de antes (la demo) sigue funcionando sin este paso,
    porque no depende del mailer — solo los `signUp` nuevos lo necesitan.
    **Ojo con el toggle equivocado**: esa misma pantalla tiene un switch
    separado "Enable Email provider" (arriba de "Confirm email") — apagarlo
    por error rompe login Y registro por igual, con un error distinto
    (`email_provider_disabled`, "Email logins/signups are disabled") que
    tampoco se arregla con ningún dominio. Pasó una vez en este proyecto
    (se apagó el provider entero en vez de solo "Confirm email") y se
    detectó de nuevo leyendo `get_logs(service: "auth")` — los dos errores
    se ven distintos en los logs, así que si algo similar vuelve a fallar,
    revisar el `error_code` exacto ahí antes de asumir cuál toggle es.
24. **Una política RLS de SELECT que vuelve a consultar su propia tabla
    (`exists (select 1 from usuarios_manicuristas where ...)`) causa
    recursión infinita real en Postgres** (`42P17: infinite recursion
    detected in policy`), no solo lentitud — pasó al armar el gate de
    admin: la política `admin_ve_todas_las_cuentas` necesitaba saber si
    `auth.uid()` es admin consultando la misma tabla. El bug fue invisible
    en el navegador: la cuenta pendiente veía el panel normal en vez de la
    pantalla de "en revisión", porque el código hacía
    `const { data: cuenta } = await supabase.from(...).maybeSingle()` sin
    mirar `error` — la query fallaba con 42P17, `data` quedaba `null`, y el
    `if (cuenta && ...)` simplemente no entraba, fallback silencioso al
    panel normal. Se encontró recién armando un script aparte que sí
    imprimía `error`, no leyendo el código ni mirando la UI. **Fix
    estándar**: una función `security definer` (`es_admin_actual()`) que
    hace la consulta — como corre con los privilegios del dueño de la
    función (`postgres`, que tiene `BYPASSRLS` en Supabase, mismo motivo
    por el que `crear_apartado` puede escribir en tablas con RLS), no
    dispara la re-evaluación de políticas y no recursiona. Las políticas
    llaman a la función en vez de repetir la subconsulta inline.
    **Lección**: cualquier política "¿este usuario es admin/tiene rol X?"
    que necesite mirar la propia tabla que protege tiene que pasar por una
    función `security definer`, nunca una subconsulta directa a esa misma
    tabla — y todo `.maybeSingle()`/`.single()` de una query que alimenta
    un `if` de control de acceso tiene que revisar `error`, no solo `data`,
    porque un fallo silencioso ahí se disfraza de "fila no encontrada" en
    vez de "la base tiró un error".

## Pulido 1 — accesibilidad, mobile, contraste

Pasada de accesibilidad + mobile + textos sobre todo el proyecto, con
axe-core (no solo revisión visual). Antes de esto, **casi toda la paleta
fallaba WCAG AA** (contraste < 4.5:1 en texto secundario, rosado, dorado,
éxito y alerta) — se detectó recién acá porque nunca se había corrido un
auditor automático, solo capturas de pantalla.

- **Paleta oscurecida** en `globals.css` (los `-suave` NO cambiaron, siguen
  livianos, son solo decorativos):
  - `texto-secundario` `#8c7871` → `#7a6a63`
  - `rosado` `#d9a6a6` → `#935060` (el cambio más grande — pasa de rosa
    pastel a un tono vino/berenjena; se ve más premium, no más "roto")
  - `dorado` `#b8935a` → `#735426`
  - `exito` `#7c9473` → `#4f6b49`
  - `alerta` `#c97b5a` → `#9b4a2a`
  - Los valores nuevos tienen margen (≥4.5:1) contra blanco, `fondo` **y**
    contra sus propios `-suave` (para las insignias tipo `bg-X-suave
    text-X`), no solo el mínimo justo.
  - Sombras de botones (`shadow-[...rgba(...)]`) actualizadas para que
    combinen con el nuevo rosado.
- **Bug crítico encontrado en la regresión, no en la auditoría de a11y**:
  toda reserva pública sin código promocional estaba rota (500). Ver trampa
  #14. Esto es la prueba de por qué correr los flujos reales importa más que
  confiar en que "el código compila".
- Nav con auto-scroll al link activo (trampa #8).
- `<h1>` faltante en `/panel/recibo/[id]`.
- Patrón `opacity-50` para ítems inactivos reemplazado (trampa #15).
- Botones +/− de inventario de 28px → 40px (mejor blanco de toque en mobile)
  + `aria-label` descriptivo.
- Textos: singular/plural en "1 uso" vs "N usos", fecha de vencimiento de
  promoción formateada en vez de mostrar el ISO crudo.
- Verificado en 375px, 390px, 768px y 1280px sin overflow ni layout roto.

## Pulido 2 — íconos, micro-interacciones, mobile real

El pedido: "se ve el contenido/colores/letras bien pero le falta detalle", más
la preocupación de que la mayoría va a comprar desde el celular (iOS o
Android). Se atacó en dos frentes.

**Mobile real, no solo viewport:**
- Fix de zoom automático de iOS: Safari agranda la pantalla solo al enfocar
  un input con `font-size` menor a 16px. Los inputs heredaban `text-sm`
  (14px) del label. Ahora hay una regla global en `globals.css`
  (`input, select, textarea { font-size: 16px }`). Verificado con el motor
  real de Safari (WebKit de Playwright, `devices['iPhone 13']`).
- Bug real de overflow en Android encontrado recién con
  `devices['Pixel 7']` (Chromium normal por ancho de viewport NO lo mostraba)
  — ver trampa #16.
- Instalado `webkit` de Playwright en el scratchpad para poder probar con el
  motor de Safari cuando haga falta (`npx playwright install webkit`).

**Detalle visual** (lucide-react, instalado en `web/`):
- Íconos en toda la nav interna, botones de acción (Editar/Borrar/Agregar/
  Activar-Desactivar/WhatsApp/Ver recibo/Imprimir), estados vacíos (antes
  eran una línea de texto gris, ahora tienen ícono + mensaje), y en todos los
  inputs de los formularios públicos y de auth (`CampoConIcono`, componente
  compartido en `src/components/campo-con-icono.tsx` — **no usarlo en
  inputs `date`/`time`**, ver trampa #16).
- Micro-interacciones: el modal de reserva entra con una animación
  (`animar-fondo-modal` + `animar-hoja-modal`/`animar-tarjeta-modal`,
  keyframes en `globals.css`), tarjetas con `hover:-translate-y-*` +
  sombra creciente, spinners (`Loader2` + `animate-spin`) en vez de texto
  seco tipo "Guardando…" a secas.
- `/panel` (antes casi vacío) ahora tiene 3 tiles de estadística reales
  (clientas, próximas citas, insumos para reponer) que linkean a su sección.
- Galería pública: sigue siendo gradiente placeholder (no hay fotos reales
  todavía), pero ahora con un ícono decorativo + mensaje honesto
  ("Pronto vas a poder ver fotos reales…") en vez de bloques de color vacíos
  sin explicación.
- Landing con alternancia de fondo por sección (fondo → superficie en
  Galería → fondo en el footer) para dar ritmo, algo que antes era un único
  tono liso de arriba a abajo.

**Verificación real, no solo mirar el código:**
- Auditoría axe-core re-corrida completa después de todos los cambios: 26/26
  combinaciones en 0 violaciones (con espera de 400ms para que asienten las
  animaciones antes de medir — ver trampa #17).
- Regresión funcional completa (toggle de servicios, stepper de inventario,
  editar promoción, reserva pública con y sin código) — sin errores de
  consola.
- Se encontró y corrigió el bug de Android (trampa #16) que no aparecía en
  ninguna prueba anterior por ancho de viewport.
- Datos de prueba acumulados durante toda la sesión (clientas
  "Regresion Final", "Verificacion Promo Final", etc.) limpiados de la base
  al terminar, dejando solo Camila Rodríguez y Valentina Suárez como demo.

## Cómo probar

Cuenta demo real (con datos ya cargados, incluida una cita completada para
probar el LTV):

```
usuario: aurora
password: DemoPass123!
slug público: aurora-nails
local: http://localhost:3000/aurora-nails · http://localhost:3000/panel
producción: https://unas-nail-saas.vercel.app/aurora-nails · /panel
```

(Antes se ingresaba con `demo.aurora@nailartist.test` — se migró a login por
usuario, ver trampa #23. El email interno real de esta cuenta ahora es
`aurora@usuarios.uas-login.com`, pero eso ya no hace falta escribirlo en
ningún lado.)

**No existe ninguna cuenta admin todavía, ni en local ni en producción.**
Para crear la primera: registrarse normal por `/registro` (cualquier
usuario/negocio sirve, es una cuenta del dueño de la plataforma, no de una
manicurista real) y despues correr
`update usuarios_manicuristas set es_admin = true, estado_cuenta = 'aprobada' where usuario = '<lo que eligió>';`
por SQL una sola vez. De ahí en más esa cuenta ve la tarjeta de
"Administración" en `/panel` y puede aprobar el resto desde `/admin`.

Levantar todo:
```bash
cd "web" && npm run dev
```
Build de verificación antes de dar algo por terminado:
```bash
cd "web" && npm run build
```

Deploy a producción (CLI de Vercel ya logueado en esta máquina como
`rafitox32-source`, equipo `black-house-os`):
```bash
cd "web" && vercel --prod
```

## Referencia técnica

- **Vercel**: proyecto `unas-nail-saas`, equipo `black-house-os` (mismo
  equipo que los otros proyectos del dueño, no es nada especial de este
  SaaS). Directorio raíz del proyecto en Vercel: `web/` (el repo tiene
  `supabase/` y `diseno-sistema/` como hermanos, no todo vive en la raíz).
  Variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) cargadas en Production/Preview/
  Development vía `vercel env add`. URL de producción:
  `https://unas-nail-saas.vercel.app` — este es el link real para pasarle
  a manicuristas nuevas (`/registro`) y a sus clientas (`/<slug>`).
- **GitHub**: `https://github.com/rafitox32-source/unas-nail-saas`, rama
  `main`. El repo se creó recién en esta sesión — antes el proyecto no
  tenía control de versiones. `web/` tenía su propio `.git` suelto (residuo
  de `create-next-app`) que se eliminó para que todo viva en un solo repo.
- **Supabase**: proyecto `nail-artist-saas`, id `iaqubsplqtlhzalodnlk`, región
  `sa-east-1`, org `rafitox32-source's Org`. Plan free ($0/mes).
  URL: `https://iaqubsplqtlhzalodnlk.supabase.co`
- **Tablas** (`supabase/esquema_inicial.sql`): `usuarios_manicuristas`,
  `clientas`, `servicios`, `promociones`, `citas_apartados`, `inventario`.
  Todas con RLS: la manicurista solo ve/edita lo suyo
  (`auth.uid() = id_manicurista`); hay políticas públicas de solo lectura para
  el portal (`usuarios_manicuristas` por slug **y** `estado_cuenta =
  'aprobada'`, `servicios` activos, `promociones` vigentes).
- **`usuarios_manicuristas.estado_cuenta`** (`pendiente`/`aprobada`/
  `rechazada`) y **`.es_admin`**: ver la entrada de Progreso sobre
  aprobación de cuentas y trampa #24. Función `es_admin_actual()`
  (security definer) es la única forma correcta de chequear el admin
  desde una política RLS sobre esta misma tabla — nunca una subconsulta
  directa (recursión infinita, trampa #24).
- **`notas_visita`** (`supabase/historial_fotografico.sql`): una fila por
  cita (`id_cita` unique), `formula_color` + `notas` + `rutas_fotos text[]`.
  Bucket privado `fotos-clientas` en Storage, políticas por carpeta
  (`{id_manicurista}/{id_cita}/...`).
- **`fotos_galeria`**: una fila por foto de la galería pública, `ruta_archivo`
  + `orden` (reordenable desde el panel). Bucket **público** `fotos-galeria`
  en Storage (a diferencia de `fotos-clientas`, que es privado), ruta
  `{id_manicurista}/{archivo}`. Tres políticas de Storage: insert/delete
  acotadas a la propia carpeta (`to authenticated`), **y una de select
  también acotada a la propia carpeta** — necesaria para que `remove()`
  encuentre el archivo a borrar, ver trampa #22 (no confundir con una
  política de select pública/amplia, que el advisor marca como
  `public_bucket_allows_listing` y además no hace falta: las URLs públicas
  se sirven sin RLS en un bucket público).
- **Funciones RPC públicas** (`supabase/funciones_reserva.sql` +
  migraciones aplicadas directo): `horarios_ocupados`, `crear_apartado`
  (reserva sin exponer INSERT directo a `anon`; acepta
  `p_codigo_promocional` opcional), `slug_disponible`,
  `validar_codigo_promocional`, `usuario_disponible` (chequeo en vivo del
  nombre de usuario de login, mismo patrón que `slug_disponible`).
- **`usuarios_manicuristas.usuario`**: columna única, es el nombre de
  usuario de login (no confundir con `slug_publico`, que es la URL pública
  — pueden ser distintos). Ver trampa #23 y la entrada de Progreso sobre
  login sin email.
- **Triggers**: `actualizar_marca_de_tiempo` (todas las tablas con
  `actualizado_en`), `manejar_nuevo_usuario` (crea perfil al registrarse),
  `actualizar_metricas_clienta` (antes `actualizar_ltv_clienta`; al completar
  una cita suma LTV **y** incrementa `clientas.visitas_completadas` en el
  mismo `UPDATE`, ver trampa #20).
- **Columnas de lealtad**: `usuarios_manicuristas.lealtad_activo` /
  `lealtad_visitas_objetivo` / `lealtad_premio_descripcion` (config, una fila
  por manicurista); `clientas.visitas_completadas` / `premios_canjeados`
  (contadores). Premios disponibles = `floor(visitas_completadas /
  lealtad_visitas_objetivo) - premios_canjeados`, calculado en el frontend,
  no guardado.
- **Frontend** (`web/`, Next.js 16 App Router + Tailwind v4):
  - `(publico)/[slug]` — carta pública por manicurista
  - `(auth)/registro`, `(auth)/ingresar` — alta y login
  - `(interno)/panel`, `/panel/servicios`, `/panel/agenda`, `/panel/clientas`,
    `/panel/clientas/[id]`, `/panel/inventario`, `/panel/recibo/[id]`,
    `/panel/promociones` — back-office, protegido en `(interno)/layout.tsx`
    (que también bloquea el acceso si `estado_cuenta != 'aprobada'`)
  - `/admin` (fuera de `(interno)`, sin la nav de manicurista) —
    aprobar/rechazar cuentas nuevas, protegido por `es_admin` en el propio
    `page.tsx`. `src/components/admin/gestion-cuentas.tsx` es la única
    pieza de UI ahí.
  - `src/lib/supabase/{cliente,servidor}.ts` — clientes browser/server
  - `src/lib/tipos.ts` — tipos TS de las entidades
  - `src/lib/autenticacion.ts` — `emailInternoDesdeUsuario()`, construye el
    email sintético que Supabase Auth exige por dentro a partir del
    "usuario" que la manicurista escribe (ver trampa #23)
  - `src/components/interno/nota-visita.tsx` — fórmula/notas/fotos por cita,
    se integra dentro de `ficha-clienta.tsx` (historial expandible)
  - `src/components/interno/configuracion-lealtad.tsx` — toggle + config del
    programa de lealtad, se renderiza debajo de `gestion-promociones.tsx` en
    `/panel/promociones` (mismo componente de página, no ruta nueva)
  - `src/components/interno/gestion-galeria.tsx` — subir/reordenar/borrar
    fotos de la galería pública, se renderiza debajo de
    `gestion-servicios.tsx` en `/panel/servicios` (mismo patrón: sin ruta ni
    ítem de nav nuevo, ver trampa #8)
  - `src/components/campo-con-icono.tsx` — input con ícono a la izquierda,
    compartido entre `modal-reserva.tsx`, `registro/page.tsx` e
    `ingresar/page.tsx`. **No usar en `type="date"`/`type="time"`** (trampa #16).
  - `src/lib/formato.ts` — `formateadorPrecio` compartido (`Intl.NumberFormat`
    es-PE / soles, símbolo `S/`). Estaba duplicado igual en 9 archivos; se
    extrajo acá al cambiar de ARS a PEN para no tener que tocar los 9 de
    nuevo la próxima vez. Los formateadores de *fecha* siguen en `es-AR` en
    cada archivo (formato de fecha idéntico entre países, no hacía falta
    tocarlos ni vale la pena unificarlos todavía).
  - Paleta y tipografía como tokens de Tailwind en `src/app/globals.css`
    (`bg-fondo`, `text-texto-primario`, `font-titulo`, `font-cuerpo`, etc.) —
    mismos nombres que `diseno-sistema/`. Ahí mismo viven las animaciones
    compartidas (`animar-aparecer`, `animar-hoja-modal`, etc.) y la regla de
    `font-size: 16px` en inputs (fix de zoom de iOS).
  - Íconos: `lucide-react` (instalado en `web/`).
- **.env.local** de `web/` ya apunta al proyecto real (`NEXT_PUBLIC_SUPABASE_URL`
  + clave pública `sb_publishable_...`, no es secreta).
