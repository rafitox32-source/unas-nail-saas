self.addEventListener("push", (evento) => {
  const datos = evento.data ? evento.data.json() : {};
  const titulo = datos.titulo || "Uñas";
  const opciones = {
    body: datos.cuerpo || "",
    icon: "/icono-app-192.png",
    badge: "/icono-app-192.png",
    data: { url: datos.url || "/panel" },
  };
  evento.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = evento.notification.data && evento.notification.data.url ? evento.notification.data.url : "/panel";
  evento.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((listaClientes) => {
      for (const cliente of listaClientes) {
        if (cliente.url.includes(url) && "focus" in cliente) return cliente.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    }),
  );
});
