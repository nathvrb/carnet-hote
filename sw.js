/* Service worker : garde les livrets consultables sans connexion.
   - pages, scripts, styles et données : réseau d'abord, copie enregistrée si hors ligne
   - photos et polices : copie enregistrée d'abord (elles changent rarement)
   - livrets des clients (base Supabase, adresse passée par « sw.js?api=… ») : réseau d'abord,
     dernière version enregistrée si hors ligne ; photos de la base : copie enregistrée d'abord
   Pour forcer la mise à jour de tous les téléphones, changez le numéro de VERSION. */
var VERSION = "cdh-v28";
var CORE = ["livret.html", "assets/css/livret.css", "assets/js/config.js", "assets/js/icons.js", "assets/js/store.js", "assets/js/cloud.js", "assets/js/livret.js", "data/livrets.js"];
var API = "";
try { API = new URL(new URL(self.location.href).searchParams.get("api") || "").origin; } catch (e) {}
var SCOPE = self.registration.scope;

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("cdh-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Le livret envoie la liste de ses photos pour qu'elles soient enregistrées tout de suite */
self.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "cdh:cache" || !Array.isArray(e.data.urls)) return;
  caches.open(VERSION).then(function (c) {
    e.data.urls.slice(0, 80).forEach(function (u) {
      c.match(u).then(function (hit) { if (!hit) c.add(u).catch(function () {}); });
    });
  });
});

function networkFirst(req, fallbackUrl) {
  /* « no-cache » : on redemande toujours au serveur si le fichier a changé (GitHub Pages garde sinon une copie 10 minutes) */
  return fetch(req, { cache: "no-cache" }).then(function (res) {
    if (res && res.ok && res.type === "basic") { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || (fallbackUrl ? caches.match(fallbackUrl) : undefined); });
  });
}
/* Base Supabase : chaque livret est rangé sous sa propre adresse (sans ignorer ?p_id=…) */
function cloudFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreVary: true }).then(function (hit) { if (hit) return hit; throw new TypeError("hors ligne"); });
  });
}
function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && (res.ok || res.type === "opaque")) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    /* Adresse courte /l/identifiant ouverte hors ligne : on sert le livret enregistré */
    var fixed = url.pathname.replace(/\/l\/(?:[\w-]+\/){0,2}(?=(assets|data|photos)\/)/, "/");
    if (fixed !== url.pathname) { e.respondWith(networkFirst(new Request(url.origin + fixed))); return; }
    if (req.mode === "navigate" && /\/l\/[\w-]+/.test(url.pathname)) { e.respondWith(networkFirst(req, SCOPE + "livret.html")); return; }
    if (/\/photos\//.test(url.pathname) || /\/assets\/vendor\//.test(url.pathname)) { e.respondWith(cacheFirst(req)); return; }
    e.respondWith(networkFirst(req));
    return;
  }
  if (API && url.origin === API) {
    if (url.pathname.indexOf("/storage/v1/object/public/") === 0) { e.respondWith(cacheFirst(req)); return; }
    if (url.pathname === "/rest/v1/rpc/cdh_livret") { e.respondWith(cloudFirst(req)); return; }
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(req)); }
});
