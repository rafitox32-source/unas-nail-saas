import { crearClienteNavegador } from "@/lib/supabase/cliente";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function soportaNotificaciones() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function notificacionesActivas() {
  if (!soportaNotificaciones()) return false;
  const registro = await navigator.serviceWorker.getRegistration();
  const suscripcion = await registro?.pushManager.getSubscription();
  return !!suscripcion;
}

export async function suscribirNotificaciones(idManicurista: string) {
  const registro = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") {
    throw new Error("Permiso de notificaciones denegado");
  }

  const suscripcion = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });

  const json = suscripcion.toJSON();
  const supabase = crearClienteNavegador();
  const { error } = await supabase.from("suscripciones_push").upsert(
    {
      id_manicurista: idManicurista,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function desuscribirNotificaciones() {
  const registro = await navigator.serviceWorker.getRegistration();
  const suscripcion = await registro?.pushManager.getSubscription();
  if (!suscripcion) return;

  const supabase = crearClienteNavegador();
  await supabase.from("suscripciones_push").delete().eq("endpoint", suscripcion.endpoint);
  await suscripcion.unsubscribe();
}
