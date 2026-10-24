/* Lecture / enregistrement des livrets.
   - Les livrets publiés viennent de data/livrets.js
   - Les modifications faites dans la console sont gardées dans ce navigateur
     (localStorage) et remplacent la version publiée sur cet appareil.
   Pour une vraie mise en ligne multi-clients, remplacez ces fonctions par
   des appels à votre base de données (voir README). */
(function () {
  var KEY = "cdh:livrets:v2"; /* v2 : les anciennes modifications locales (v1) sont ignorées */

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function readAll() {
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) || {} : {}; }
    catch (e) { return {}; }
  }
  function writeAll(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  window.CDH_STORE = {
    get: function (id) {
      var local = readAll();
      if (local[id]) return clone(local[id]);
      var pub = (window.CDH_LIVRETS || {})[id];
      return pub ? clone(pub) : null;
    },
    published: function (id) {
      var pub = (window.CDH_LIVRETS || {})[id];
      return pub ? clone(pub) : null;
    },
    isLocal: function (id) { return !!readAll()[id]; },
    save: function (data) {
      var all = readAll();
      var copy = clone(data);
      copy.majLe = new Date().toISOString();
      all[copy.id] = copy;
      return writeAll(all) ? copy : null;
    },
    remove: function (id) {
      var all = readAll();
      delete all[id];
      return writeAll(all);
    },
    list: function () {
      var out = {}, pub = window.CDH_LIVRETS || {}, local = readAll(), k;
      for (k in pub) out[k] = { id: k, nom: pub[k].nom, local: false };
      for (k in local) out[k] = { id: k, nom: local[k].nom, local: true, nouveau: !pub[k] };
      return Object.keys(out).map(function (k) { return out[k]; });
    }
  };

  /* Adresse publique d'un livret (celle que l'on met dans le QR code) */
  window.cdhLivretUrl = function (id, vue) {
    var dom = (window.CDH_CONFIG && window.CDH_CONFIG.domaine) || "";
    if (dom) return dom.replace(/\/$/, "") + "/l/" + id + (vue ? "/" + vue : "");
    var rel = vue ? "livret.html?id=" + encodeURIComponent(id) + "&s=" + encodeURIComponent(vue) : "livret.html#" + id;
    try { return new URL(rel, location.href).href; }
    catch (e) { return rel; }
  };

  /* « 06 39 98 12 47 » -> « +33639981247 » */
  window.cdhTel = function (num) {
    var d = String(num || "").replace(/[^\d+]/g, "");
    if (/^0\d{9}$/.test(d)) return "+33" + d.slice(1);
    return d;
  };

  window.cdhEsc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  window.cdhMapsUrl = function (query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  };

  /* Copie dans le presse-papiers, avec repli sur la sélection du texte */
  window.cdhCopy = function (text, fallbackEl) {
    function selectFallback() {
      if (!fallbackEl) return false;
      try {
        var r = document.createRange(); r.selectNodeContents(fallbackEl);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      } catch (e) {}
      return false;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, selectFallback);
      }
    } catch (e) {}
    return Promise.resolve(selectFallback());
  };
})();
