import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface SuscripcionPush {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NotificacionPayload {
  titulo: string;
  cuerpo: string;
  url?: string;
}

// Manda a cada suscripción y devuelve los endpoints que ya no sirven
// (404/410 — el navegador la dio de baja, ej. desinstaló la app) para que
// el que llama las borre de la base.
export async function enviarNotificaciones(
  suscripciones: SuscripcionPush[],
  payload: NotificacionPayload,
) {
  const endpointsExpirados: string[] = [];

  await Promise.all(
    suscripciones.map(async (suscripcion) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: suscripcion.endpoint,
            keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const codigo = (error as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) endpointsExpirados.push(suscripcion.endpoint);
      }
    }),
  );

  return { endpointsExpirados };
}
