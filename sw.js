const C = "booth-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.add("./index.html")));
  self.skipWaiting();
});
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(C).then(c => c.put("./index.html", copy));
        return r;
      }).catch(() => caches.match("./index.html"))
    );
  }
});
