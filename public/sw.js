// Service worker mínimo: garante instalabilidade do PWA.
// Sem cache offline — o sistema depende do servidor (dados sempre atuais).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
