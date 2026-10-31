/* Connexion à la base Supabase : espace client, publication, photos, lecture des livrets.
   Réglages dans config.js : supabaseUrl et supabaseCle (clé « publishable », publique par nature).
   Sans ces réglages, CDH_CLOUD.actif vaut false et le site reste en mode démonstration.
   Aucune bibliothèque externe : appels directs aux API Supabase (Auth, REST, Storage). */
(function () {
  var C = window.CDH_CONFIG || {};
  var BASE = String(C.supabaseUrl || "").trim().replace(/\/+$/, "");
  var KEY = String(C.supabaseCle || "").trim();
  var ON = /^https?:\/\/[^/]+/.test(BASE) && KEY.length > 20;
  var SKEY = "cdh:session";
  var BUCKET = "photos";

  var MSG = {
    reseau: "Pas de connexion internet. Vérifiez le réseau puis réessayez.",
    delai: "Le serveur met trop de temps à répondre. Réessayez dans un instant.",
    identifiants: "E-mail ou mot de passe incorrect.",
    session: "Votre session a expiré. Reconnectez-vous.",
    non_connecte: "Votre session a expiré. Reconnectez-vous.",
    acces_refuse: "Ce compte n'a pas accès à ce livret.",
    introuvable: "Ce livret n'existe pas (ou plus) dans la base.",
    conflit: "Ce livret a été publié depuis un autre appareil entre-temps.",
    existe_deja: "Cette adresse de livret est déjà prise. Choisissez-en une autre.",
    identifiant_invalide: "Adresse invalide : lettres minuscules, chiffres et tirets uniquement.",
    compte_inconnu: "Aucun compte avec cet e-mail. Créez-le d'abord dans Supabase (Authentication → Users → Add user).",
    contenu_invalide: "Le contenu du livret est illisible.",
    trop_lourd: "Livret trop lourd : retirez les photos importées en double.",
    trop_de_demandes: "Trop de demandes en peu de temps. Patientez quelques minutes.",
    envoi_mail: "L'e-mail n'a pas pu être envoyé.",
    meme_mdp: "Le nouveau mot de passe doit être différent de l'ancien.",
    mdp_faible: "Mot de passe trop court : 8 caractères minimum.",
    photo_lourde: "Photo trop lourde (3 Mo maximum).",
    photo_format: "Format non accepté : JPG, PNG ou WebP.",
    installation: "La base n'est pas encore installée (script supabase/installation.sql).",
    serveur: "Le serveur rencontre un problème. Réessayez dans quelques minutes.",
    lien_expire: "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.",
    inactif: "L'espace client n'est pas encore activé sur ce site.",
    inconnu: "Une erreur est survenue. Réessayez."
  };
  var KNOWN = ["non_connecte", "acces_refuse", "introuvable", "conflit", "existe_deja", "identifiant_invalide", "compte_inconnu", "contenu_invalide", "trop_lourd"];

  function err(code, status, raw) {
    var e = new Error(MSG[code] || MSG.inconnu);
    e.code = code; e.status = status || 0; e.raw = raw || null;
    return e;
  }
  function codeFor(status, j) {
    j = j && typeof j === "object" ? j : {};
    var msg = String(j.message || j.msg || j.error_description || j.error || "");
    var c = [j.code, j.error_code].filter(Boolean).join(" ");
    if (KNOWN.indexOf(msg) > -1) return msg;
    if (/invalid.login.credentials|invalid_credentials|invalid_grant/i.test(msg + " " + c)) return "identifiants";
    if (/same_password|should be different/i.test(msg + " " + c)) return "meme_mdp";
    if (/weak_password|password should be|at least \d+ char/i.test(msg + " " + c)) return "mdp_faible";
    if (/not.authorized|email_address_not_authorized|smtp|sending .*email|email_send/i.test(msg + " " + c) && status !== 403) return "envoi_mail";
    if (status === 429 || /rate.limit/i.test(msg + " " + c)) return "trop_de_demandes";
    if (/jwt|PGRST30\d|session_not_found|refresh.token|token.*(expired|invalid)|bad_jwt/i.test(msg + " " + c)) return "session";
    if (status === 413 || /too large|maximum allowed size|exceeded the maximum|entitytoolarge/i.test(msg + " " + c)) return "photo_lourde";
    if (status === 415 || /mime|invalid_mime_type/i.test(msg + " " + c)) return "photo_format";
    if (c === "PGRST202" || /could not find the function/i.test(msg)) return "installation";
    if (c === "42501" || /permission denied|row-level security|unauthorized/i.test(msg)) return status === 401 ? "session" : "acces_refuse";
    if (status === 401) return "session";
    if (status >= 500) return "serveur";
    return "inconnu";
  }

  function request(method, path, o) {
    o = o || {};
    if (!ON) return Promise.reject(err("inactif"));
    var h = { apikey: KEY, Accept: "application/json" };
    if (o.token) h.Authorization = "Bearer " + o.token;
    var body;
    if (o.blob) { body = o.blob; h["Content-Type"] = o.blob.type || "application/octet-stream"; }
    else if (o.body !== undefined) { body = JSON.stringify(o.body); h["Content-Type"] = "application/json"; }
    if (o.headers) Object.keys(o.headers).forEach(function (k) { h[k] = o.headers[k]; });
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timedOut = false;
    var timer = ctrl ? setTimeout(function () { timedOut = true; ctrl.abort(); }, o.timeout || 15000) : null;
    var init = { method: method, headers: h, body: body, signal: ctrl ? ctrl.signal : undefined, credentials: "omit", cache: "no-store" };
    if (o.keepalive) init.keepalive = true;
    return fetch(BASE + path, init).then(function (res) {
      if (timer) clearTimeout(timer);
      if (o.raw && res.ok) return res.blob();
      return res.text().then(function (txt) {
        var j = null;
        if (txt) { try { j = JSON.parse(txt); } catch (e) { j = { message: txt.slice(0, 200) }; } }
        if (!res.ok) throw err(codeFor(res.status, j), res.status, j);
        return j;
      });
    }, function () {
      if (timer) clearTimeout(timer);
      throw err(timedOut ? "delai" : "reseau");
    });
  }

  /* ---------- session ---------- */
  function readSession() {
    try { var s = JSON.parse(localStorage.getItem(SKEY) || "null"); return s && s.access_token && s.refresh_token ? s : null; }
    catch (e) { return null; }
  }
  function writeSession(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} return s; }
  function clearSession() { try { localStorage.removeItem(SKEY); } catch (e) {} }
  function now() { return Math.floor(Date.now() / 1000); }
  function storeTokens(j, user) {
    var u = (j && j.user) || user || {};
    return writeSession({
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: +j.expires_at || now() + (+j.expires_in || 3600),
      user: { id: u.id || "", email: u.email || "" }
    });
  }

  var refreshing = null;
  function refresh(s) {
    if (refreshing) return refreshing;
    refreshing = request("POST", "/auth/v1/token?grant_type=refresh_token", { body: { refresh_token: s.refresh_token } })
      .then(function (j) { refreshing = null; return storeTokens(j, s.user); }, function (e) {
        refreshing = null;
        /* Un autre onglet a peut-être déjà renouvelé la session : on la relit avant d'abandonner */
        var cur = readSession();
        if (cur && cur.refresh_token !== s.refresh_token) return cur;
        if (e.code === "session" || e.code === "identifiants" || e.status === 400) { clearSession(); throw err("session", e.status); }
        throw e;
      });
    return refreshing;
  }
  function session(force) {
    var s = readSession();
    if (!s) return Promise.resolve(null);
    if (!force && s.expires_at - now() > 90) return Promise.resolve(s);
    return refresh(s).catch(function (e) {
      if (e.code === "reseau" || e.code === "delai") return s; /* hors ligne : on garde la session en l'état */
      return null;
    });
  }
  function authed(method, path, o, retried) {
    return session().then(function (s) {
      if (!s) throw err("session");
      o = o || {}; o.token = s.access_token;
      return request(method, path, o).catch(function (e) {
        if (e.code === "session" && !retried) {
          return refresh(s).then(function () { return authed(method, path, o, true); });
        }
        throw e;
      });
    });
  }
  function rpc(name, args) { return authed("POST", "/rest/v1/rpc/" + name, { body: args || {} }); }

  /* Lien reçu par e-mail (mot de passe oublié) : …/espace.html#access_token=…&type=recovery */
  function fromUrl() {
    var h = String(location.hash || "").replace(/^#/, "");
    if (!/(^|&)(access_token|error|error_code)=/.test(h)) return Promise.resolve(null);
    var p = new URLSearchParams(h);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (p.get("error") || p.get("error_code")) return Promise.resolve({ type: p.get("type") || "recovery", error: err("lien_expire") });
    var j = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_in: p.get("expires_in"), expires_at: p.get("expires_at") };
    if (!j.access_token || !j.refresh_token) return Promise.resolve({ type: p.get("type"), error: err("lien_expire") });
    return request("GET", "/auth/v1/user", { token: j.access_token }).then(function (u) {
      storeTokens(j, u);
      return { type: p.get("type") || "", email: (u && u.email) || "" };
    }, function (e) { return { type: p.get("type"), error: e.code === "reseau" ? e : err("lien_expire") }; });
  }

  function slug(s) {
    return String(s || "photo").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";
  }
  function encPath(p) { return p.split("/").map(encodeURIComponent).join("/"); }

  window.CDH_CLOUD = {
    actif: ON,
    base: BASE,
    messages: MSG,
    erreur: err,

    /* Comptes */
    connecte: function () { return !!readSession(); },
    session: session,
    email: function () { var s = readSession(); return (s && s.user && s.user.email) || ""; },
    connexion: function (email, mdp) {
      return request("POST", "/auth/v1/token?grant_type=password", { body: { email: String(email || "").trim(), password: String(mdp || "") } })
        .then(function (j) { return storeTokens(j); });
    },
    deconnexion: function () {
      var s = readSession(); clearSession();
      if (!s) return Promise.resolve();
      return request("POST", "/auth/v1/logout", { token: s.access_token, timeout: 5000 }).catch(function () {});
    },
    motDePasseOublie: function (email, retour) {
      return request("POST", "/auth/v1/recover" + (retour ? "?redirect_to=" + encodeURIComponent(retour) : ""), { body: { email: String(email || "").trim() } });
    },
    changerMotDePasse: function (mdp) {
      return authed("PUT", "/auth/v1/user", { body: { password: String(mdp || "") } }).then(function (u) {
        var s = readSession(); if (s && u && u.email) { s.user.email = u.email; writeSession(s); }
        return u;
      });
    },
    lienRecu: fromUrl,

    /* Livrets (compte connecté) */
    moi: function () { return rpc("cdh_moi"); },
    lire: function (id) { return rpc("cdh_lire", { p_id: id }); },
    publier: function (id, contenu, base) { return rpc("cdh_publier", { p_id: id, p_contenu: contenu, p_base: base || null }); },
    creer: function (id, contenu) { return rpc("cdh_creer", { p_id: id, p_contenu: contenu }); },
    accesAjouter: function (id, email) { return rpc("cdh_acces_ajouter", { p_id: id, p_email: email }); },
    accesRetirer: function (id, email) { return rpc("cdh_acces_retirer", { p_id: id, p_email: email }); },
    activer: function (id, actif) { return rpc("cdh_activer", { p_id: id, p_actif: !!actif }); },
    versions: function (id) { return rpc("cdh_versions", { p_id: id }); },
    version: function (vid) { return rpc("cdh_version", { p_version: vid }); },
    stats: function (id) { return rpc("cdh_stats", { p_id: id }); },

    /* Photos : envoie l'image (déjà réduite) dans photos/<livret>/… et renvoie son adresse publique */
    envoyerPhoto: function (livretId, blob, nom) {
      var path = livretId + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + "-" + slug(nom) + ".jpg";
      return authed("POST", "/storage/v1/object/" + BUCKET + "/" + encPath(path), {
        blob: blob, timeout: 60000, headers: { "x-upsert": "false", "cache-control": "max-age=31536000" }
      }).then(function () { return BASE + "/storage/v1/object/public/" + BUCKET + "/" + encPath(path); });
    },
    /* Photo déposée par le client avec le questionnaire (dossier privé « depots », lecture réservée à l'administrateur) */
    photoDepot: function (path) {
      return authed("GET", "/storage/v1/object/authenticated/depots/" + encPath(String(path || "").replace(/^\/+/, "")), { raw: true, timeout: 60000 })
        .then(function (b) { return b && b.type && /^image\//.test(b.type) ? b : new Blob([b], { type: "image/jpeg" }); });
    },
    estPhotoCloud: function (src) { return !!src && ON && String(src).indexOf(BASE + "/storage/v1/object/public/") === 0; },

    /* Voyageurs (sans compte) */
    livret: function (id) { return request("GET", "/rest/v1/rpc/cdh_livret?p_id=" + encodeURIComponent(id), { timeout: 10000 }); },
    compter: function (id) { return request("POST", "/rest/v1/rpc/cdh_compter", { body: { p_id: id }, keepalive: true, timeout: 8000 }).catch(function () {}); }
  };
})();
