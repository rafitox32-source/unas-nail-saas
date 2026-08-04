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
- [x] Calendario visual en la reserva + bloqueos manuales de agenda:
      evolución del punto anterior — el input de fecha nativo se reemplazó
      por `calendario-disponibilidad.tsx`, un mes navegable donde los días
      sin ningún horario libre aparecen tachados y deshabilitados (la
      clienta ni puede tocarlos, no se entera recién al elegir). Usa la
      RPC nueva `horarios_ocupados_mes` (mismo shape que `horarios_ocupados`
      pero para un mes completo, una sola consulta en vez de una por día) y
      reutiliza la lógica de slots ya existente, ahora movida a
      `src/lib/disponibilidad.ts` para que la comparta el calendario y el
      selector de horario del mismo modal. Del lado de la manicurista:
      tabla `bloqueos_agenda` (día completo o rango de horas, con motivo
      opcional) editable desde `/panel/agenda` (`gestion-bloqueos.tsx`,
      debajo de `gestion-agenda.tsx`, sin ruta ni ítem de nav nuevo —
      trampa #8). `horarios_ocupados`, `horarios_ocupados_mes` y
      `crear_apartado` ahora consideran citas reales **y** bloqueos
      manuales por igual — ni la clienta ve un día bloqueado como
      disponible, ni puede reservar ahí aunque intente forzarlo por API
      directa. Probado de punta a punta: bloqueo de un día completo →
      confirmado que aparece tachado en el calendario público → reserva
      exitosa en un día distinto que sigue libre.
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
- [x] Personalización de marca: nombre del negocio, teléfono, biografía,
      color de marca y logo, todo editable desde `/panel` (Inicio) — la
      base ya tenía las columnas (`color_marca`, `url_avatar`) desde el
      esquema inicial, solo faltaba la pantalla. `src/components/interno/
      configuracion-negocio.tsx`, reemplaza la tarjeta estática de
      "Negocio" que había antes. El logo se sube al mismo bucket público
      `fotos-galeria` (carpeta `{id}/logo-...`, no una tabla nueva — no
      hace falta reordenar/borrar como las fotos de trabajos, un solo
      campo `url_avatar` alcanza). Dirección de página (`slug_publico`)
      también editable con el mismo chequeo de disponibilidad en vivo que
      el registro, salvo que no se vuelve a pedir si no cambió (si no,
      `slug_disponible` la marca como "ocupada" por chocar contra sí
      misma) y con aviso de que cambiar la URL rompe links viejos.
      El color de marca se aplica en la carta pública sobreescribiendo la
      variable CSS `--color-rosado` en un `<div style={...}>` que envuelve
      todo `[slug]/page.tsx` — Tailwind v4 ya generaba las clases
      (`bg-rosado`, `text-rosado`, etc.) como `var(--color-rosado)`, así
      que sobreescribir la variable en un ancestro alcanza sin tocar cada
      componente público uno por uno. Solo se pisa `--color-rosado` (el
      acento principal); los tonos `-suave` derivados quedan sin tocar por
      ahora (no hay cálculo de tinte automático desde un hex arbitrario,
      quedó fuera de alcance). El logo reemplaza el ícono de Sparkles en
      el header público si está cargado. Probado de punta a punta:
      cambiar nombre + color + subir logo, verificado en la carta pública
      real (color del botón, nombre, logo en el header).
- [x] PWA instalable para las manicuristas (no una app nativa — sin cuenta
      de Apple Developer ni Google Play, ver trampa #25 para el porqué):
      `/panel` se puede "Agregar a inicio" desde Safari (iPhone) o Chrome
      (Android) y queda con ícono propio, pantalla completa, sin la barra
      del navegador. El manifest (`/panel/manifest.webmanifest`) **no** usa
      la convención especial `manifest.ts` de Next.js — esa solo genera un
      único manifest fijo en la raíz de la app, no uno distinto por sesión
      (confirmado con un 404 real al probarlo, no leyendo la doc). Es un
      Route Handler común (`app/(interno)/panel/manifest.webmanifest/
      route.ts`) que lee la sesión activa y devuelve el nombre/logo DE ESA
      manicurista — si subió un logo propio en "Mi negocio" (ver arriba),
      se usa ese; si no, el ícono genérico de la app
      (`public/icono-app-{192,512}.png`, generado con Pillow ya que no hay
      `gh`/ImageMagick en esta máquina pero sí Python+PIL). El nombre de la
      pestaña/título y los meta tags de iOS (`apple-mobile-web-app-*`,
      `apple-touch-icon`) también son dinámicos por sesión vía
      `generateMetadata` en `(interno)/layout.tsx`. Alcance a propósito:
      solo `/panel` (lo que usa la manicurista a diario) — el portal
      público (`/[slug]`) no tiene manifest, las clientas no necesitan
      instalar nada, solo entran al link de vez en cuando.
- [x] Agregar clienta a mano: hasta ahora las clientas solo se creaban
      automáticamente al reservar por el link público (`crear_apartado`
      las crea/reusa por teléfono) — no había forma de cargar una clienta
      existente que no reserva online. Botón "Agregar" en
      `/panel/clientas` (mismo patrón que servicios/inventario), directo
      en `lista-clientas.tsx` sin componente nuevo por lo chico que es.
      Nombre + teléfono, inserta en `clientas` vía RLS normal (la política
      `manicurista_administra_sus_clientas` ya es `for all`, no hizo falta
      tocar la base). Si más tarde esa misma persona reserva online con el
      mismo teléfono, `crear_apartado` la va a reconocer y reusar la fila
      en vez de duplicarla — pero solo si el teléfono coincide texto a
      texto (sin normalización de formato todavía, ni acá ni en el flujo
      de reserva).
- [x] Generador de estados para WhatsApp/redes con QR: sección nueva en
      `/panel/promociones` (`generador-estados.tsx`) — dibuja en un
      `<canvas>` de 1080×1920 (formato historia) el logo o un ícono de
      respaldo, el nombre del negocio, un llamado a la acción, un QR
      (librería `qrcode`, nueva dependencia) que apunta a
      `{origin}/{slug_publico}` y la URL en texto plano abajo del QR para
      quien no pueda escanear. Botones de **Descargar** (`canvas.toBlob` +
      link temporal) y **Compartir** (Web Share API con archivo adjunto,
      solo se muestra si el navegador lo soporta — en el celular abre
      directo el selector nativo de "compartir a WhatsApp Status/
      Instagram"). El logo se carga con `crossOrigin="anonymous"` porque
      viene de Supabase Storage (otro origen) — sin eso el canvas queda
      "tainted" y `toBlob`/`toDataURL` tiran un error de seguridad en vez
      de exportar la imagen; probado de punta a punta con un logo real
      subido (no solo sin logo) para confirmar que el CORS de Supabase
      Storage lo permite. El texto usa las mismas fuentes que el resto de
      la app (Playfair Display + Poppins) — hay que esperar
      `document.fonts.ready` antes de dibujar o el canvas cae a una
      fuente genérica del sistema.
- [x] **Fase 1 de auditoría premium** — 5 mejoras chicas sin bloqueos,
      todas probadas de punta a punta:
      - **Recuperar contraseña**: no hay flujo self-service (no hay email
        real, ver trampa #23) — en vez de eso, un link "¿Olvidaste tu
        contraseña?" en `/ingresar` que abre WhatsApp al número de soporte
        (`src/lib/soporte.ts`, `WHATSAPP_SOPORTE`) con el usuario ya
        completado en el mensaje. El dueño resetea la contraseña a mano
        desde el dashboard de Supabase mientras el volumen sea bajo — el
        propio dueño pidió esta versión simple en vez de un flujo con
        clave `service_role`, que hubiera requerido manejar un secreto
        nuevo sin necesidad real todavía.
      - **Anti-spam en reservas**: `crear_apartado` rechaza el 4to intento
        de un mismo teléfono en 10 minutos ("Estás haciendo muchas
        reservas seguidas..."). Probado con 4 llamadas directas al RPC:
        las primeras 3 pasan, la 4ta se bloquea.
      - **Páginas legales**: `/terminos` y `/privacidad`, contenido real
        (no lorem ipsum) escrito para esta plataforma específica —
        aclaran que no se procesan pagos online y que cada negocio es
        responsable de su propio contenido. Linkeadas en el footer de
        cada carta pública y en el registro ("al crear tu cuenta
        aceptás..."). **No reemplazan una revisión legal real** — son un
        punto de partida razonable, no diseñadas por un abogado.
      - **Política de cancelación**: campo de texto libre opcional
        (`usuarios_manicuristas.politica_cancelacion`), editable en "Mi
        negocio", se muestra en el modal de reserva antes de confirmar.
      - **Exportar datos**: botón de descarga CSV en `/panel/clientas` y
        `/panel/agenda` (`src/lib/csv.ts`, sin librería nueva — separador
        `;` porque Excel en español lo autodetecta mejor que `,`, y BOM
        UTF-8 para que no rompan tildes/ñ al abrir el archivo).
- [x] **Fase 2, ítem 1 — Modo oscuro**: toggle sol/luna en la nav interna
      (`src/components/interno/toggle-tema.tsx`) que guarda la preferencia
      en `localStorage` (clave `tema`) y la aplica como `data-theme="dark"`/
      `"light"` en `<html>`. Un script bloqueante inline en el `<head>` de
      `layout.tsx` lee `localStorage` y fija el atributo ANTES del primer
      paint (sin esto, hay un flash del tema equivocado al cargar). Sin
      preferencia guardada, cae a `prefers-color-scheme` del sistema
      operativo. Paleta oscura completa en `globals.css` (fondo/superficie/
      borde/texto/acentos), aplicada también a la carta pública (hereda el
      tema del navegador de la clienta, no solo del panel de la
      manicurista). Ver trampas #26, #27 y #28 — esta feature encontró tres
      problemas reales (dos de accesibilidad, uno de datos) que no se veían
      con una sola pasada de axe-core "a ojo".
- [x] **Fase 2, ítem 2 — Reportes e ingresos**: tarjeta nueva en `/panel`
      (Inicio), debajo de los 3 tiles de estadística y antes de "Mi
      negocio" (sin ruta ni ítem de nav nuevo, trampa #8). Gráfico de
      barras de los últimos 6 meses de ingresos (`citas_apartados` con
      `estado_cita = 'completada'`) + top 5 servicios más rentables con
      barra de progreso, todo hecho a mano con CSS/flexbox — sin librería
      de gráficos nueva, dado el volumen de datos chico de un salón
      individual. Agregación (`ingresosPorMes`, `topServiciosPorIngreso`)
      en `src/lib/reportes.ts`, separada del componente de presentación
      `src/components/interno/reportes-ingresos.tsx` para poder probarla
      sin renderizar nada. Bug real encontrado al probar con Playwright
      (no leyendo el código): las barras no se veían — `items-end` en el
      contenedor `flex` hacía que cada columna de mes se encogiera a su
      contenido en vez de estirarse a la altura del gráfico, así que el
      `height: X%` de la barra se calculaba contra una altura de 0.
      Arreglado sacando `items-end` del contenedor (stretch por defecto)
      y usando `flex-1` en el envoltorio de la barra en vez de `h-full`.
      Estado vacío (ícono + mensaje) si todavía no hay ninguna cita
      completada, mismo patrón que el resto del proyecto.
- [x] **Fase 2, ítem 3 — Reseñas en la página pública**: tabla nueva
      `resenas` (nombre_clienta, calificación 1-5, comentario, `visible`)
      — la manicurista las carga a mano (por ejemplo, copiando lo que le
      mandan por WhatsApp), no hay formulario público de la clienta
      todavía. CRUD en `/panel/promociones`
      (`gestion-resenas.tsx`, debajo de "Programa de lealtad", sin ruta ni
      ítem de nav nuevo — trampa #8), con selector de estrellas y
      "Ocultar"/"Mostrar" en vez de borrar (igual patrón que
      activar/desactivar de promociones). En la carta pública
      (`seccion-resenas.tsx`) solo se muestran las que están `visible =
      true`, ordenadas por más nuevas primero; **si no hay ninguna
      reseña visible, la sección entera no se renderiza** (no se muestra
      un estado vacío ahí — a diferencia del panel, mostrarle a una
      clienta potencial "todavía no hay reseñas" en una página de
      reservas no ayuda). RLS calcada del patrón de `servicios`/
      `promociones`: `manicurista_administra_sus_resenas` (for all,
      dueña) + `publico_ve_resenas_visibles` (select, `visible = true`,
      sin chequear `estado_cuenta` porque `[slug]/page.tsx` ya filtra
      eso antes de llegar a pedir reseñas). De paso, probando esta
      feature en modo oscuro se encontró un bug real y **pre-existente**
      (no de esta feature): la insignia "Seña S/X" de `tarjeta-
      servicio.tsx` usaba `bg-white/90` fijo en vez de un token de tema,
      así que con `text-texto-primario` (casi blanco en oscuro) el
      texto quedaba casi invisible sobre un fondo casi blanco. Corregido
      a `bg-superficie/90` (sí es tema-consciente). axe-core no lo había
      marcado como violación porque el elemento es semi-transparente
      sobre un degradé — axe lo clasifica como "incompleto" en vez de
      "violación" cuando no puede resolver el color de fondo efectivo
      con certeza, así que quedó invisible a las auditorías anteriores
      hasta que se vio a simple vista en una captura.
- [x] **Fase 2, ítem 4 — Tour guiado**: modal de bienvenida de 5 pasos
      (`tour-bienvenida.tsx`) que aparece en `/panel` la primera vez que
      una manicurista entra — bienvenida, personalizar marca, cargar
      servicios, compartir el link (muestra el slug real si ya lo tiene),
      gestionar la agenda. Botones Anterior/Siguiente + "Omitir" +
      "Empezar" en el último paso, con puntitos de progreso. Columna
      nueva `usuarios_manicuristas.tour_completado` (default `false`) en
      vez de `localStorage`: a diferencia del modo oscuro (que sí es una
      preferencia de dispositivo), completar el tour es estado de
      cuenta — no tendría sentido que lo vuelva a ver si entra desde el
      celular en vez de la compu. Todas las cuentas existentes al
      momento de esta migración se marcaron `tour_completado = true` a
      mano por SQL (no tiene sentido mostrarle el tour a alguien que ya
      usa la app hace meses) — solo las cuentas nuevas lo ven. Probado
      de punta a punta: los 5 pasos, Anterior/Siguiente, "Empezar" cierra
      y persiste en la base, recargar la página no lo vuelve a mostrar.
- [x] **Fase 3 — Notificaciones push reales**: campanita en la nav
      interna (`toggle-notificaciones.tsx`, junto al toggle de tema) para
      activar/desactivar notificaciones del sistema operativo — dos
      eventos avisan: cuenta nueva por aprobar (a los admins) y reserva
      nueva (a la manicurista dueña de esa reserva). Arquitectura, de
      punta a punta:
      - **Service worker** `public/sw.js` (nuevo — antes la PWA
        instalaba sin service worker, solo con el manifest). Escucha
        `push` (muestra la notificación) y `notificationclick` (enfoca o
        abre la pestaña en la URL relevante).
      - **VAPID**: par de claves generado una sola vez con `web-push`
        (nueva dependencia npm) y cargado como secreto — `VAPID_PRIVATE_KEY`
        y `VAPID_SUBJECT` server-only, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
        pública (así tiene que ser, la usa el navegador para suscribirse) —
        en `.env.local` y en Vercel (Production/Preview/Development).
      - **Tabla `suscripciones_push`** (`endpoint`, `p256dh`, `auth`,
        `id_manicurista`): RLS normal, la dueña administra las suyas.
      - **Sin clave `service_role` nueva** (decisión deliberada, mismo
        espíritu que la de recuperar contraseña por WhatsApp en Fase 1):
        en vez de eso, tres RPC `security definer` — mismo patrón que
        `crear_apartado`/`horarios_ocupados` — `suscripciones_para_admins()`,
        `suscripciones_para_manicurista(id)` y
        `eliminar_suscripcion_push(endpoint)`, expuestas a `anon` porque
        se llaman justo después de un registro o de una reserva pública,
        antes de que exista sesión. El compromiso de seguridad es el
        mismo que ya acepta el resto del proyecto para RPCs públicas
        (`get_advisors` ya las marca WARN "anon puede ejecutar" por
        diseño): exponen endpoint/claves de suscripción push, no datos
        de clientas ni nada más sensible.
      - **Dos Route Handlers** (`/api/notificaciones/cuenta-pendiente`,
        `/api/notificaciones/nueva-reserva`) mandan la notificación real
        vía `web-push` desde el servidor (la clave privada nunca sale de
        ahí) y limpian de la base las suscripciones que devuelven
        404/410 (el navegador las dio de baja — ej. desinstaló la app).
        Se llaman con `fetch(...).catch(() => {})` (sin bloquear ni
        romper el flujo principal) justo después de un registro exitoso
        (`registro/page.tsx`) y justo después de `crear_apartado`
        (`modal-reserva.tsx`).
      - **Verificado de punta a punta lo que se puede verificar acá**:
        build y typecheck limpios, axe-core en 0 violaciones con la
        campanita en la nav (claro y oscuro), las dos rutas responden
        bien a payload inválido (400) y a "todavía nadie suscripto"
        (200, sin romper), las 3 RPC probadas directo por SQL (devuelven
        filas, borran filas), y una suscripción de prueba insertada a
        mano confirmó que la ruta intenta mandar el push y NO borra la
        fila si la falla no es un 404/410 real (solo limpia suscripciones
        genuinamente vencidas). **Lo que NO se pudo verificar acá, y
        queda para probar en un dispositivo real**: que la notificación
        realmente aparezca en el celular — ver trampa #31, Chromium sin
        cabeza no soporta la Push API real, ni con perfil persistente ni
        con permisos concedidos por Playwright.
- [x] **Tres botones sueltos, a pedido puntual del dueño**:
      - **"Instalar app"** (`boton-instalar-app.tsx`): tarjeta que aparece
        en `/panel` (Inicio), debajo de "Hola, X", solo si el navegador
        dispara `beforeinstallprompt` (Chrome/Android — en iOS Safari no
        existe esa API, ahí sigue siendo el paso manual del manual). Se
        pidió que apareciera "al terminar de registrarse" — técnicamente
        no se puede: el evento depende de que la página actual tenga un
        manifest enlazado, y `/registro` no lo tiene (el manifest es
        deliberadamente exclusivo de `/panel`, ver trampa #25). Como el
        registro redirige a `/panel` al instante, mostrarlo ahí cumple lo
        mismo en la práctica. Mismo problema de verificación que las
        notificaciones push (trampa #31): Chromium headless no dispara
        `beforeinstallprompt`, así que se confirmó que el componente
        compila, no rompe nada y se auto-oculta correctamente sin el
        evento — no que el navegador realmente lo ofrezca en un
        dispositivo real.
      - **Link público visible + botón "Copiar"** (`enlace-publico.tsx`):
        reemplaza el link de solo texto "Ver mi página pública" — ahora
        muestra la URL completa y tiene un botón que la copia al
        portapapeles con confirmación "¡Copiado!" (2 segundos). Arranca
        mostrando `/slug` (igual en servidor y cliente, evita parpadeo de
        hidratación) y recién en un `useEffect` se completa con
        `window.location.origin` — igual que ya hacía `generador-
        estados.tsx` con el mismo problema.
      - **Botón de ayuda** (`boton-ayuda.tsx`): ícono de "?" en la nav
        interna (primero de los cuatro, junto a campanita/luna/salir),
        abre WhatsApp al mismo número de soporte que ya usaba "¿Olvidaste
        tu contraseña?" (`src/lib/soporte.ts`), con el nombre del negocio
        en el mensaje. También se agregó como link de texto en la
        pantalla de cuenta pendiente/rechazada (`(interno)/layout.tsx`),
        que no tiene nav — es la pantalla donde más falta puede hacer un
        "algo no anda, escribime".
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
- [x] **Spa multi-servicio, Fase 1 — modelo de datos + personal** (primer
      paso de convertir el producto en un spa con pelo/pestañas/uñas, no
      solo uñas — ver el plan completo, con las fases futuras y las
      decisiones de alcance, en `C:\Users\BLACK HOUSE\.claude\plans\
      snug-dazzling-thompson.md`). Decisión de arquitectura clave: **una
      sola cuenta de login por negocio** (la dueña del spa) — las
      empleadas son perfiles internos sin login propio, no rehace RLS en
      ninguna de las 10 tablas existentes. Se puede sumar login propio
      por empleada más adelante sin tirar este diseño.
      - Tabla nueva `personal` (`nombre`, `categoria` — cabello/pestañas/
        uñas/otro —, `url_foto`, `activo`), RLS calcada del resto
        (`auth.uid() = id_negocio`).
      - `servicios` ganó `categoria` (default `'uñas'`, no rompe datos
        viejos) y `id_empleado` (nullable) — qué empleada ofrece ese
        servicio, opcional.
      - `citas_apartados` y `bloqueos_agenda` ganaron `id_empleado`
        (nullable). Un bloqueo sin empleada bloquea todo el negocio
        (como antes); con empleada, solo bloquea a esa persona.
      - `crear_apartado` **no cambió de firma** — en vez de agregar un
        parámetro nuevo, lee `servicios.id_empleado` (ya lo consulta) y
        arma la colisión de horario con eso. Evita la trampa #12 del
        todo para esta función.
      - `horarios_ocupados`/`horarios_ocupados_mes` sí cambiaron de firma
        (`p_id_empleado uuid default null` nuevo) — se hizo `drop
        function` explícito antes de recrearlas (trampa #12), confirmado
        con `pg_get_function_identity_arguments` que no quedó ningún
        overload viejo.
      - Regla de colisión, en las tres funciones: si el servicio/consulta
        no tiene empleada asignada, se comporta **exactamente igual que
        antes** (toda la cuenta es una sola agenda compartida) — así una
        cuenta que nunca carga personal no nota ningún cambio. Con
        empleada asignada, la colisión se acota a esa persona (más los
        bloqueos de cuenta entera, que siguen aplicando a todas).
      - UI: pantalla "Personal" nueva en `/panel/servicios` (arriba de
        Servicios, sin ruta ni ítem de nav nuevo — trampa #8), CRUD con
        activar/desactivar. `gestion-servicios.tsx` suma selector de
        categoría + profesional asignada (el selector de profesional
        solo aparece si ya hay personal cargado). `gestion-agenda.tsx`
        suma tabs de filtro por empleada (solo si hay personal).
        `gestion-bloqueos.tsx` suma selector opcional de empleada.
      - Probado de punta a punta vía RPC directo (más preciso que
        clickear el calendario a ciegas): cuenta sin personal sigue
        chocando horarios exactamente igual que antes; con 2 empleadas
        de prueba y servicios distintos asignados, reservar el mismo
        horario para las dos NO choca, pero reservar dos veces para la
        misma empleada SÍ choca. `get_advisors` sin novedades más allá
        del mismo patrón ya aceptado.
      - **Fuera de esta fase, confirmado con el dueño, cada una su propia
        sesión**: Fase 2 (flujo público — agrupar por categoría, elegir
        empleada al reservar) y Fase 3 (rebrand — nuevo nombre/paleta,
        arranca en claude.ai/design, reemplazo de las strings
        "manicurista"/"Nail Artist" que quedan).

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
25. **La convención especial `manifest.ts` de Next.js (como `sitemap.ts` o
    `robots.ts`) solo genera un manifest único y estático para toda la
    app, en la raíz** — ponerla en una subcarpeta tipo `app/(interno)/
    panel/manifest.ts` esperando un manifest distinto ahí no funciona: la
    ruta ni se registra, `/panel/manifest.webmanifest` devuelve 404 posta
    (confirmado con `curl`, no asumido leyendo la doc). Como el manifest
    de este proyecto necesita ser distinto por sesión (nombre/logo de cada
    manicurista), la solución fue un Route Handler común en
    `app/(interno)/panel/manifest.webmanifest/route.ts` (carpeta con
    punto en el nombre, Next.js la soporta) devolviendo el JSON a mano con
    `Content-Type: application/manifest+json`. Un Route Handler bajo una
    carpeta con `layout.tsx` **no** pasa por ese layout (los layouts solo
    envuelven páginas React, no rutas HTTP crudas) — por eso el gate de
    aprobación de cuentas en `(interno)/layout.tsx` no bloquea ni redirige
    el manifest, que se sigue pudiendo pedir igual (con fallback genérico
    si no hay sesión). Lección: para cualquier archivo "especial" de
    metadata que necesite variar por request (no solo por build estático),
    usar un Route Handler normal, no la convención de archivo especial.
26. **Un `Edit` con `replace_all: true` no garantiza tocar dos bloques
    "idénticos" si su indentación difiere** — al armar el modo oscuro, el
    bloque `@media (prefers-color-scheme: dark) { :root:not(...) { ... } }`
    y el bloque `:root[data-theme="dark"] { ... }` tenían originalmente los
    mismos valores de color, pero uno estaba anidado (más indentación) y
    el otro no. Un `replace_all` con el `old_string` copiado de un bloque
    solo emparejó ese bloque; el otro quedó con los valores viejos sin
    ningún error ni aviso. Se malinterpretó primero como el bug ya conocido
    de "CSS viejo servido por el dev server" (trampa #18) — se mató el
    proceso, se borró `.next`, se reinició limpio, y el valor incorrecto
    siguió igual, lo cual en realidad **descartó** la teoría del caché en
    vez de confirmarla. Recién leyendo el archivo en disco con `Read` se
    vio que el segundo bloque nunca se había tocado. **Lección**: si un
    valor no cambia después de un `replace_all` que debería haber tocado
    varios lugares "iguales", releer el archivo entero antes de asumir
    caché — pueden no ser tan iguales como parecen (indentación,
    espacios, un carácter distinto rompen el match silenciosamente).
27. **Una variable CSS que se pisa por tenant (`--color-rosado` vía
    `style={{ "--color-rosado": manicurista.color_marca }}`, ver
    Personalización de marca) puede quedar seteada sin que la manicurista
    lo haya pedido**, si el formulario que la guarda manda el campo
    siempre, incluso con su valor por defecto. Pasó en `configuracion-
    negocio.tsx`: `colorMarca` arrancaba en `COLOR_POR_DEFECTO` cuando
    `manicurista.color_marca` era `null`, y `guardar()` mandaba
    `color_marca: colorMarca` sin condición — cualquier guardado del
    formulario (aunque solo se tocara "Política de cancelación", por
    ejemplo) dejaba a la cuenta "pegada" a ese color para siempre, incluso
    sin que la manicurista supiera que lo había elegido. Se encontró
    recién al auditar el modo oscuro: la carta pública de la cuenta demo
    mostraba el rosado claro fijo en vez del rosado oscuro adaptado al
    tema, porque `color_marca` tenía el valor por defecto guardado de una
    prueba anterior de Fase 1. **Fix**: un booleano `colorTocado`
    (arranca en `manicurista.color_marca !== null`, pasa a `true` solo en
    el `onChange` del selector de color) — el `update` solo manda
    `color_marca` si `colorTocado` es `true`, si no manda `null` explícito.
    **Lección**: cualquier campo de formulario con un valor por defecto
    visual (no vacío) necesita distinguir "el usuario nunca tocó esto" de
    "el usuario lo dejó en el valor por defecto a propósito" antes de
    persistirlo — si no, un guardado no relacionado pisa silenciosamente
    ese campo.
28. **Un solo token de color no puede cumplir 4.5:1 a la vez como texto
    sobre un fondo casi negro Y como fondo de botón sólido con texto
    blanco encima** — son requisitos matemáticamente opuestos (texto sobre
    fondo oscuro necesita ser CLARO; fondo de botón con texto blanco
    necesita ser OSCURO), confirmado con un script de luminancia relativa
    WCAG, no a ojo. `--color-rosado` en modo oscuro se probó una vez
    "verificado" (ver comentario viejo en `globals.css`) pero en realidad
    fallaba los dos usos a la vez (4.06 y 4.30, ninguno llega a 4.5).
    **Fix real**: separar en dos tokens en vez de buscar un compromiso —
    `--color-rosado` se dejó afinado para fondo de botón (usado en ~19
    archivos, la mayoría), y se agregó `--color-rosado-texto` más claro
    para texto/íconos/links sueltos (usado en ~20 archivos, con un script
    de reemplazo mecánico en vez de editar uno por uno). `--color-dorado`
    y `--color-alerta` tenían el problema al revés (buenos como texto,
    malos como botón con texto blanco) pero solo se usan así en un lugar
    cada uno (botón "Canjear premio" y la insignia "Reponer") — ahí se
    agregó `--color-dorado-boton`/`--color-alerta-boton` en vez de tocar
    el token principal, mucho más barato que duplicar todo el patrón de
    "-texto". En modo claro los tokens nuevos son iguales al original
    (no hay conflicto en esa dirección — texto y botón necesitan la misma
    oscuridad contra un fondo claro), así que no cambia nada visualmente
    ahí. **Lección**: antes de dar por buena una paleta de modo oscuro
    "porque el texto blanco se ve bien arriba", medir el contraste real de
    cada combinación fondo/primer-plano por separado — texto suelto y
    botón sólido son dos problemas de contraste distintos, no el mismo.
29. **Un contenedor `flex` con `items-end` NO le da altura completa a sus
    hijos** — los encoge a su contenido antes de alinearlos al final, así
    que un `height: X%` adentro de un hijo así se calcula contra una
    altura de 0 (o `auto`), no contra la altura del contenedor. Pasó en el
    gráfico de barras de `reportes-ingresos.tsx`: cada columna de mes
    (`flex-col`) estaba dentro de un contenedor con `items-end`, y la
    barra interna (`height: {porcentaje}%`) simplemente no se veía —
    0 errores en consola, el bug era 100% visual. Se encontró recién con
    una captura de Playwright, no leyendo el código (el JSX "se veía bien"
    a simple vista). **Fix**: sacar `items-end` del contenedor (dejar el
    `stretch` por defecto de flexbox, que sí da altura completa a los
    hijos) y usar `flex-1` en el envoltorio directo de la barra en vez de
    `h-full` — `h-full` necesita que el padre tenga una altura explícita
    resuelta, cosa que un hijo de `flex-col` sin `flex-1`/`flex-grow` no
    tiene aunque el abuelo sí mida `7rem`. **Lección**: para cualquier
    barra/gráfico hecho a mano con `height: %` dentro de flexbox, la
    cadena completa de contenedores desde la altura fija hasta la barra
    tiene que propagar altura real (`stretch` o `flex-1`/`h-full`
    encadenados) — un `items-end`/`items-center` en el medio la corta
    silenciosamente. Verificar con una captura, no solo leyendo las
    clases.
30. **axe-core no marca como "violación" un contraste que no puede
    calcular con certeza** — si el texto está sobre un fondo
    semi-transparente encima de un degradé/imagen (`bg-white/90` sobre
    `bg-gradient-to-br`, por ejemplo), axe no sabe qué color efectivo
    hay detrás y lo clasifica como "incompleto", no como violación. El
    resultado: `resultado.violations.length` puede dar 0 aunque haya
    texto realmente invisible a simple vista (pasó con la insignia
    "Seña S/X" de `tarjeta-servicio.tsx`, que usaba `bg-white/90` fijo
    en vez de un token de tema — en modo oscuro el texto quedaba casi
    blanco sobre un fondo casi blanco, y ninguna auditoría anterior lo
    había marcado). Se encontró recién mirando una captura de pantalla a
    simple vista, no corriendo axe. **Lección**: `violations.length ===
    0` no es sinónimo de "sin problemas de contraste" cuando hay
    elementos semi-transparentes sobre fondos dinámicos (degradés,
    imágenes, otro color de tema) — conviene revisar también
    `resultado.incomplete` y, sobre todo, mirar capturas reales en
    ambos temas, no confiar solo en el conteo de violaciones.
31. **Chromium sin cabeza (headless) no soporta la Push API real, bajo
    ninguna configuración probada** — ni un contexto normal (ahí Chrome
    directamente tira "Push API no soportada en modo incógnito", porque
    un contexto efímero de Playwright cuenta como incógnito), ni un
    perfil persistente (`launchPersistentContext`) con
    `context.grantPermissions(['notifications'], {origin})` llamado
    antes de la primera navegación: `Notification.permission` seguía
    devolviendo `"denied"` incluso con perfil nuevo. Es una limitación
    de la plataforma (falta la integración real con el servicio de
    notificaciones del sistema operativo en modo headless), no un bug
    de la app ni de la suscripción. **Cómo se verificó la feature de
    notificaciones push sin poder hacer el flujo 100% real**: se probó
    cada capa por separado — las RPC `security definer` directo por
    SQL (devuelven/borran filas bien), los Route Handlers con `curl`
    (400 en payload inválido, 200 sin romper cuando no hay
    suscriptores, y con una suscripción de prueba insertada a mano por
    SQL confirmar que intenta mandar el push vía `web-push` y solo
    borra la fila si la respuesta es un 404/410 real, no ante
    cualquier error de red) — y la UI del botón (aria-label, ambos
    temas, axe-core). Lo único que quedó sin poder probarse acá es el
    paso final: que el toast realmente aparezca en un navegador de
    verdad. **Lección**: para cualquier feature que dependa de permisos
    del navegador ligados al sistema operativo real (push, geolocation
    con GPS real, cámara/micrófono con hardware real), diseñar la
    verificación en capas desde el principio — probar cada pieza
    server-side/RPC por separado con datos de prueba en vez de asumir
    que un solo test end-to-end con Playwright va a poder cubrir todo,
    porque puede que estructuralmente no pueda.

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

**`Manual para Manicuristas.pdf`** (raíz del proyecto, `*.pdf` en
`.gitignore` — es contenido generado, no código fuente): 20 páginas,
HTML + Playwright `page.pdf()`, no una librería de PDF. **No se
regenera solo** cuando se agrega una feature — hay que acordarse de
actualizarlo a mano. El script y la plantilla NO viven en el repo (son
scratch, se recrean fácil si hace falta): plantilla HTML/CSS +
`generar-manual.js` arma las páginas a partir de capturas de pantalla
reales (viewport 390×844, ocultando el overlay de dev tools de Next.js
con `nextjs-portal { display: none }` antes de cada captura). Para
agregar una sección nueva: tomar la captura, sumar una página al
array `paginas`, actualizar el índice (página 2) y el `TOTAL_PAGINAS`.

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
- **`bloqueos_agenda`**: `fecha_hora_inicio`/`fecha_hora_fin` (un día
  completo o un rango de horas) + `motivo` opcional. RLS igual que el
  resto (`manicurista_administra_sus_bloqueos`, `for all`). No es pública
  — la clienta nunca la consulta directo, solo indirectamente a través de
  `horarios_ocupados`/`horarios_ocupados_mes`, que ya mezclan bloqueos con
  citas reales.
- **`usuarios_manicuristas.estado_cuenta`** (`pendiente`/`aprobada`/
  `rechazada`) y **`.es_admin`**: ver la entrada de Progreso sobre
  aprobación de cuentas y trampa #24. Función `es_admin_actual()`
  (security definer) es la única forma correcta de chequear el admin
  desde una política RLS sobre esta misma tabla — nunca una subconsulta
  directa (recursión infinita, trampa #24).
- **`resenas`**: `nombre_clienta`, `calificacion` (1-5), `comentario`,
  `visible`. Sin formulario público todavía — la manicurista las carga a
  mano en `/panel/promociones`. RLS calcada de `servicios`/`promociones`:
  dueña administra todo, público solo ve `visible = true` (sin re-chequear
  `estado_cuenta`, ver Progreso y trampa #30 sobre el bug de contraste que
  se encontró de paso construyendo esto).
- **`personal`**: `id_negocio` (FK a `usuarios_manicuristas`), `nombre`,
  `categoria` (`cabello`/`pestañas`/`uñas`/`otro`), `url_foto`, `activo`.
  RLS igual que el resto (`auth.uid() = id_negocio`). `servicios.
  id_empleado`, `citas_apartados.id_empleado` y `bloqueos_agenda.
  id_empleado` (los tres nullable) referencian esta tabla — ver Progreso
  "Spa multi-servicio, Fase 1" y el plan completo en
  `C:\Users\BLACK HOUSE\.claude\plans\snug-dazzling-thompson.md`.
- **`suscripciones_push`**: `endpoint` (único), `p256dh`, `auth`,
  `id_manicurista`. RLS normal (dueña administra las suyas). Leídas desde
  el servidor sin clave `service_role` vía 3 RPC `security definer`
  expuestas a `anon`: `suscripciones_para_admins()`,
  `suscripciones_para_manicurista(uuid)`, `eliminar_suscripcion_push(text)`
  — ver Progreso "Fase 3" y trampa #31.
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
  migraciones aplicadas directo): `horarios_ocupados`, `horarios_ocupados_mes`
  (mismo shape, un mes entero en una sola consulta — pinta el calendario sin
  pedir día por día; ambas aceptan `p_id_empleado` opcional desde la Fase 1
  de spa multi-servicio, sin usar todavía desde el front — eso es Fase 2),
  `crear_apartado` (reserva sin exponer INSERT directo a
  `anon`; acepta `p_codigo_promocional` opcional; valida contra citas reales
  **y** `bloqueos_agenda`; la colisión de horario se acota a
  `servicios.id_empleado` cuando el servicio tiene una empleada asignada),
  `slug_disponible`, `validar_codigo_promocional`,
  `usuario_disponible` (chequeo en vivo del nombre de usuario de login,
  mismo patrón que `slug_disponible`).
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
  - `src/components/interno/configuracion-negocio.tsx` — nombre, teléfono,
    biografía, color de marca y logo, se renderiza en `/panel` (Inicio) en
    vez de la vieja tarjeta estática de "Negocio". El color se aplica en
    la carta pública pisando `--color-rosado` en un wrapper de
    `[slug]/page.tsx` (Tailwind v4 ya usa esa variable en sus clases, no
    hace falta tocar componente por componente). Solo se persiste
    `color_marca` si la manicurista tocó el selector de color en esta
    sesión o ya tenía uno guardado (`colorTocado`, ver trampa #27) — si
    no, guardar cualquier otro campo del formulario dejaría un color por
    defecto fijo sin que lo haya elegido, pisando el acento adaptado al
    tema (claro/oscuro) de quien visite su página.
  - `app/(interno)/panel/manifest.webmanifest/route.ts` — manifest de PWA
    dinámico por sesión, ver Progreso y trampa #25. `public/icono-app.svg`
    + `icono-app-{180,192,512}.png` son el ícono genérico de respaldo
    cuando la manicurista no subió logo propio.
  - `src/lib/disponibilidad.ts` — `generarHorariosDisponibles()` y
    constantes de horario de atención, compartido entre
    `calendario-disponibilidad.tsx` (calendario del mes) y el selector de
    horario dentro de `modal-reserva.tsx` (mismo modal, dos vistas).
  - `src/components/publico/calendario-disponibilidad.tsx` — calendario
    navegable por mes en la reserva pública, días sin horarios libres
    tachados y deshabilitados.
  - `src/components/interno/gestion-bloqueos.tsx` — bloqueos manuales de
    agenda (día completo o rango de horas), se renderiza debajo de
    `gestion-agenda.tsx` en `/panel/agenda` (sin ruta ni ítem de nav
    nuevo, trampa #8).
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
  - Modo oscuro: `src/components/interno/toggle-tema.tsx` (toggle sol/luna
    en la nav), script bloqueante inline en `layout.tsx` (fija `data-theme`
    antes del primer paint), y en `globals.css` un `@media
    (prefers-color-scheme: dark)` + `:root[data-theme="dark"]` con los
    mismos valores en los dos (ver trampa #26 sobre por qué mantenerlos
    sincronizados a mano es frágil). `--color-rosado`/`--color-dorado`/
    `--color-alerta` están afinados para uso de BOTÓN sólido con texto
    blanco; `--color-rosado-texto` (más claro) es el que hay que usar para
    texto/íconos/links sueltos, y `--color-dorado-boton`/`--color-alerta-
    boton` (más oscuros) para los pocos botones sólidos de esos dos
    colores — ver trampa #28 antes de agregar un uso nuevo de cualquiera
    de estos tres colores como fondo sólido o como texto suelto.
  - Íconos: `lucide-react` (instalado en `web/`).
  - `src/components/interno/generador-estados.tsx` — canvas + QR para
    estados de WhatsApp/redes, ver Progreso. Dependencia `qrcode` (+
    `@types/qrcode`) nueva en `package.json`.
  - `src/lib/soporte.ts` — número de WhatsApp de soporte de la
    plataforma (`WHATSAPP_SOPORTE`, hoy `+51912382709`) y
    `urlWhatsappSoporte()`. No confundir con el teléfono de cada
    manicurista, que es de su propio negocio.
  - `src/lib/csv.ts` — `descargarCSV()`, exportación genérica usada por
    Clientas y Agenda (ver Progreso, "Fase 1 de auditoría premium").
  - `(publico)/terminos`, `(publico)/privacidad` — páginas legales
    estáticas, contenido real específico de esta plataforma (ver
    Progreso).
  - `src/components/interno/boton-instalar-app.tsx`,
    `src/components/interno/enlace-publico.tsx`,
    `src/components/interno/boton-ayuda.tsx` — los tres botones sueltos
    de la entrada de Progreso "Tres botones sueltos".
  - `src/lib/reportes.ts` — `ingresosPorMes()`/`topServiciosPorIngreso()`,
    agregación pura (sin datos, sin JSX) para la tarjeta de "Ingresos" en
    `/panel`. `src/components/interno/reportes-ingresos.tsx` es la parte
    de presentación, ver trampa #29 sobre el bug de altura en el gráfico
    de barras hecho con flexbox.
  - `src/components/interno/gestion-resenas.tsx` — CRUD de reseñas en
    `/panel/promociones`. `src/components/publico/seccion-resenas.tsx` —
    la muestra en la carta pública, se auto-oculta si no hay ninguna
    reseña visible (ver Progreso, Fase 2 ítem 3).
  - `src/components/interno/gestion-personal.tsx` — CRUD de personal en
    `/panel/servicios`, arriba de `gestion-servicios.tsx` (que ahora
    recibe `personal` como prop para el selector de profesional
    asignada). `gestion-agenda.tsx` y `gestion-bloqueos.tsx` también
    reciben `personal` para el filtro/selector — todos ocultan la UI de
    personal por completo si la cuenta no cargó a nadie (trampa #8, y
    ver Progreso "Spa multi-servicio, Fase 1").
  - `src/components/interno/tour-bienvenida.tsx` — modal de bienvenida de
    5 pasos en `/panel`, ver Progreso Fase 2 ítem 4. Se muestra solo si
    `usuarios_manicuristas.tour_completado` es `false` (estado de cuenta
    en la base, no `localStorage` — a propósito, ver esa misma entrada de
    Progreso).
  - Notificaciones push (Fase 3): `public/sw.js` (service worker, nuevo),
    `src/lib/notificaciones-push.ts` (suscribir/desuscribir desde el
    navegador), `src/components/interno/toggle-notificaciones.tsx`
    (campanita en la nav), `src/lib/enviar-push.ts` (envío server-side
    con `web-push`, nueva dependencia), `src/app/api/notificaciones/
    {cuenta-pendiente,nueva-reserva}/route.ts` (Route Handlers que
    mandan el push real y limpian suscripciones vencidas). Variables de
    entorno `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` /
    `VAPID_SUBJECT` en `.env.local` y Vercel (las tres). Ver Progreso
    "Fase 3" y trampa #31 (limitación de Playwright/Chromium headless
    para probar el flujo 100% real).
- **.env.local** de `web/` ya apunta al proyecto real (`NEXT_PUBLIC_SUPABASE_URL`
  + clave pública `sb_publishable_...`, no es secreta).
