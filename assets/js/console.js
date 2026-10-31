/* Console d'édition des livrets.
   - Boutons FR / EN / DE / IT : en mode traduction, les textes saisis vont dans doc.en, doc.de ou doc.it.
     Un champ anglais vide reprend le texte français.
   - La structure (ajout, ordre, suppression, photos) se modifie en FR ;
     les traductions suivent automatiquement. */
(function () {
  var C = window.CDH_CONFIG, S = window.CDH_STORE, I = window.cdhIcon, esc = window.cdhEsc, K = window.CDH_CLOUD;
  /* Mode connecté (espace client) : console.html?compte#identifiant
     Les livrets viennent de la base Supabase, « Publier » les met en ligne pour tous.
     Sans « ?compte » : démonstration, tout reste dans ce navigateur. */
  var COMPTE = /[?&]compte(?:[=&]|$)/.test(location.search);
  var DRAFT = COMPTE ? "cdh:compte:brouillon:" : "cdh:brouillon2:";
  var LISTS = ["rubriques", "blocs", "services", "adresses", "activites"];
  var doc = null, tab = "general", edLang = "fr", openItem = {};
  var acct = null;                          /* { email, admin, livrets } */
  var remote = { existe: false };           /* état du livret dans la base */
  var baseEdit = null;                      /* version en ligne sur laquelle portent les modifications */
  var frame = document.getElementById("frame"), frameReady = false;
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }

  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.marque; });

  /* ---------- outils ---------- */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split("."), last = ks.pop();
    var t = ks.reduce(function (a, k) { if (a[k] == null || typeof a[k] !== "object") a[k] = {}; return a[k]; }, o);
    if (v === undefined) delete t[last]; else t[last] = v;
  }
  function toast(msg, ms) {
    document.querySelectorAll(".toast").forEach(function (x) { x.remove(); });
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 2600);
    return t;
  }
  /* Brouillon : en mode connecté, on garde aussi la version en ligne de départ (base) */
  function readRaw(id) { try { var r = localStorage.getItem(DRAFT + id); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function readDraft(id) { var r = readRaw(id); return r && COMPTE ? r.doc || null : r; }
  function readDraftBase(id) { var r = readRaw(id); return r && COMPTE ? r.base || null : null; }
  var warnedFull = false;
  function writeDraft() {
    try { localStorage.setItem(DRAFT + doc.id, JSON.stringify(COMPTE ? { doc: doc, base: baseEdit } : doc)); return true; }
    catch (e) {
      if (!warnedFull) { warnedFull = true; toast("Mémoire du navigateur pleine : trop de photos importées. Utilisez plutôt des adresses de photos (dossier photos/)."); }
      return false;
    }
  }
  function dropDraft(id) { try { localStorage.removeItem(DRAFT + id); } catch (e) {} }
  function draftIds() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(DRAFT) === 0) out.push(k.slice(DRAFT.length)); } } catch (e) {}
    return out;
  }
  function slug(s) { return String(s || "livret").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "livret"; }
  function geoStr(g) { return Array.isArray(g) && g.length === 2 ? g[0] + ", " + g[1] : ""; }
  function parseGeo(s) {
    s = String(s || "").trim();
    if (!s) return null;
    var m = s.match(/(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)/);
    if (!m) return false;
    var lat = parseFloat(m[1].replace(",", ".")), lng = parseFloat(m[2].replace(",", "."));
    if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return false;
    return [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
  }

  /* ---------- accès aux listes (FR et EN) ---------- */
  function arr(list) { return list === "blocs" ? doc.arrivee.blocs : doc[list]; }
  var TRL = ["en", "de", "it"];   /* langues de traduction : la saisie va dans doc.en, doc.de ou doc.it */
  var LANG_LABEL = { en: "anglaise", de: "allemande", it: "italienne" };
  function trArr(lang, list, create) {
    if (!doc[lang]) { if (!create) return null; doc[lang] = {}; }
    var host = doc[lang], key = list;
    if (list === "blocs") {
      if (!doc[lang].arrivee) { if (!create) return null; doc[lang].arrivee = {}; }
      host = doc[lang].arrivee;
    }
    if (!Array.isArray(host[key])) { if (!create) return null; host[key] = []; }
    return host[key];
  }
  function enArr(list, create) { return trArr(edLang, list, create); }
  function enItem(list, i, create) {
    var e = enArr(list, create); if (!e) return null;
    if (!e[i] || typeof e[i] !== "object") { if (!create) return null; while (e.length <= i) e.push({}); if (!e[i] || typeof e[i] !== "object") e[i] = {}; }
    return e[i];
  }
  function padTo(a, n) { for (var k = 0; k < n; k++) if (!a[k] || typeof a[k] !== "object") a[k] = {}; }

  function blank() {
    var id = "nouveau-livret-" + Math.random().toString(36).slice(2, 6);
    return {
      id: id, type: "location", nom: "Nouveau logement", sousTitre: "Appartement · 2 personnes", ville: "Ma ville", carte: "",
      adresse: "",
      theme: { accent: "#1F5B4C", police: "Lora", motif: "collines" },
      titreAccueil: "Bienvenue !",
      hote: { nom: "Votre prénom", role: "Votre hôte", tel: "", whatsapp: "", email: "", reponse: "", canal: "" },
      bienvenue: "Bienvenue ! Vous trouverez ici tout ce qu'il faut pour un séjour agréable.",
      annonce: { actif: false, style: "info", texte: "", fin: "" },
      wifi: { reseau: "", motDePasse: "" },
      horaires: { arrivee: "À partir de 16 h", depart: "Avant 11 h" },
      arrivee: {
        texte: "Tout ce qu'il faut pour arriver sans stress.",
        blocs: [{ icone: "cle", titre: "Récupérer les clés", texte: "Expliquez ici comment récupérer les clés.", etapes: [], astuce: "" }]
      },
      rubriques: [
        { id: "regles", titre: "Règles de la maison", icone: "regles", resume: "", texte: "", etapes: [], liste: ["Logement non-fumeur.", "Calme après 22 h."], astuce: "" }
      ],
      services: [], adresses: [], activites: [],
      depart: ["Fermer les fenêtres", "Laisser les clés sur la table"],
      urgences: { hopital: { nom: "", detail: "", requete: "" }, antipoison: "" },
      avis: "", avisLien: ""
    };
  }
  function normalize(d) {
    d.theme = d.theme || {}; d.hote = d.hote || {}; d.annonce = d.annonce || { actif: false, style: "info", texte: "", fin: "" };
    d.wifi = d.wifi || {}; d.horaires = d.horaires || {}; d.urgences = d.urgences || {}; d.urgences.hopital = d.urgences.hopital || {};
    d.arrivee = d.arrivee || { texte: "", blocs: [] };
    if (!Array.isArray(d.arrivee.blocs)) d.arrivee.blocs = [];
    ["rubriques", "services", "adresses", "activites", "depart"].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    d.rubriques.forEach(function (r, i) { if (!r.id) r.id = "r" + i + "-" + Math.random().toString(36).slice(2, 5); r.etapes = r.etapes || []; r.liste = r.liste || []; });
    TRL.forEach(function (l) { if (d[l] && typeof d[l] !== "object") d[l] = {}; });
    return d;
  }
  function lines(a) { return (a || []).map(function (x) { return String(x).trim(); }).filter(Boolean); }
  function isEmptyObj(o) { return o && typeof o === "object" && !Array.isArray(o) && !Object.keys(o).length; }
  /* Nettoie la traduction : enlève les textes vides, garde l'alignement des listes */
  function prune(x) {
    if (Array.isArray(x)) {
      var a = x.map(prune);
      if (a.every(function (v) { return v == null || typeof v !== "object"; })) {
        a = a.map(function (v) { return v == null ? "" : String(v).trim(); }).filter(Boolean);
        return a.length ? a : undefined;
      }
      a = a.map(function (v) { return v == null ? {} : v; });
      while (a.length && isEmptyObj(a[a.length - 1])) a.pop();
      return a.length ? a : undefined;
    }
    if (x && typeof x === "object") {
      var o = {};
      Object.keys(x).forEach(function (k) { var v = prune(x[k]); if (v !== undefined) o[k] = v; });
      return Object.keys(o).length ? o : undefined;
    }
    if (typeof x === "string") return x.trim() ? x : undefined;
    return x == null ? undefined : x;
  }
  function cleaned() {
    var d = clone(doc);
    d.depart = lines(d.depart);
    d.rubriques.forEach(function (r) { r.etapes = lines(r.etapes); r.liste = lines(r.liste); });
    d.arrivee.blocs.forEach(function (b) { b.etapes = lines(b.etapes); });
    if (!d.geo) delete d.geo;
    TRL.forEach(function (l) { if (d[l]) { var tr = prune(d[l]); if (tr) d[l] = tr; else delete d[l]; } });
    delete d.majLe;
    return d;
  }

  /* ---------- onglets ---------- */
  var TABS = {
    general: ["info", "Général"], annonce: ["alerte", "Message du moment"], arrivee: ["cle", "Avant l'arrivée"],
    rubriques: ["livre", "Rubriques"], services: ["cadeau", "Services en plus"], adresses: ["pin", "Adresses"],
    activites: ["montagne", "À faire"], depart: ["valise", "Départ et avis"],
    qr: ["qr", "QR code et affiche"], sauvegarde: ["telecharger", "Sauvegarde"]
  };
  var tabsEl = document.getElementById("tabs");
  tabsEl.querySelectorAll("button").forEach(function (b) {
    var t = TABS[b.dataset.tab];
    b.innerHTML = I(t[0], "ico") + "<span>" + esc(t[1]) + '</span><span class="count" data-count="' + b.dataset.tab + '"></span>';
    b.addEventListener("click", function () { showTab(b.dataset.tab); });
  });
  function setTabLabel(k, label) { var s = document.querySelector("#tab-" + k + " span"); if (s) s.textContent = label; }
  tabsEl.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var keys = Object.keys(TABS), i = keys.indexOf(tab);
    i = (i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + keys.length) % keys.length;
    showTab(keys[i]); document.getElementById("tab-" + keys[i]).focus(); e.preventDefault();
  });
  function showTab(t) {
    tab = t;
    tabsEl.querySelectorAll("button").forEach(function (b) { var on = b.dataset.tab === t; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    document.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.dataset.panel !== t; });
    if (t === "qr") renderQr();
    if (t === "arrivee") renderArrLink();
    if (t === "sauvegarde") { renderExport(); renderCompteTab(); }
    sendPreview();
    if (window.innerWidth <= 760) window.scrollTo({ top: 0 });
  }
  function counts() {
    ["rubriques", "services", "adresses", "activites"].forEach(function (k) {
      var el = tabsEl.querySelector('[data-count="' + k + '"]'); if (el) el.textContent = doc[k].length || "";
    });
    var ea = tabsEl.querySelector('[data-count="arrivee"]'); if (ea) ea.textContent = doc.arrivee.blocs.length || "";
  }

  /* ---------- langue de saisie ---------- */
  var langBtns = document.querySelectorAll("[data-ed]");
  langBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      if (edLang === b.dataset.ed) return;
      edLang = b.dataset.ed;
      applyLang(); fillForm(); renderLists(); sendPreview();
      if (tab === "arrivee") renderArrLink();
      toast(edLang === "fr" ? "Saisie de la version française" : "Saisie de la version " + LANG_LABEL[edLang]);
    });
  });
  function applyLang() {
    langBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.ed === edLang)); });
    document.body.classList.toggle("en-mode", edLang !== "fr");
    var note = document.getElementById("en-note");
    note.hidden = edLang === "fr";
    if (edLang !== "fr") note.textContent = "Vous modifiez la version " + LANG_LABEL[edLang] + ". Un champ vide reprend le texte français (affiché en gris). Les champs grisés sont communs à toutes les langues.";
    document.documentElement.style.setProperty("--bar-h", document.getElementById("cbar").offsetHeight + "px");
  }
  function short(s) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > 90 ? s.slice(0, 88) + "…" : s; }

  /* ---------- formulaire simple ---------- */
  function fillForm() {
    if (doc.theme && (!doc.theme.police || doc.theme.police === "Gloock")) doc.theme.police = "Lora"; /* Gloock remplacée par Lora, plus lisible */
    var en = edLang !== "fr";
    document.querySelectorAll("[data-path]").forEach(function (el) {
      var p = el.dataset.path, tr = !!el.dataset.tr;
      var fr = getPath(doc, p), v = fr;
      if (!el.dataset.ph0) el.dataset.ph0 = el.getAttribute("placeholder") || " ";
      if (en && tr) {
        v = getPath(doc[edLang] || {}, p);
        var phv = el.dataset.lines ? (fr || []).join("\n") : short(fr);
        el.placeholder = phv || (el.dataset.ph0 === " " ? "" : el.dataset.ph0);
      } else if (el.dataset.ph0 !== " ") el.placeholder = el.dataset.ph0;
      else el.removeAttribute("placeholder");
      el.disabled = en && !tr;
      if (el.type === "checkbox") el.checked = !!v;
      else if (el.type === "radio") el.checked = el.value === (v || "info");
      else if (el.dataset.lines) el.value = (v || []).join("\n");
      else if (el.dataset.geo) { el.value = geoStr(v); el.removeAttribute("aria-invalid"); }
      else if (el.dataset.photo && /^data:/.test(v || "")) { el.value = ""; el.placeholder = "Photo importée depuis l'ordinateur"; }
      else el.value = v == null ? "" : v;
    });
    document.querySelectorAll('#panel input[type="file"]').forEach(function (f) { f.disabled = en; });
    refreshThumbs(document);
    renderSwatches();
    countAnnonce();
  }
  document.getElementById("panel").addEventListener("input", onField);
  document.getElementById("panel").addEventListener("change", onField);
  function onField(e) {
    var el = e.target;
    if (el.type === "file") return;
    var en = edLang !== "fr";
    if (el.dataset.path) {
      if (el.type === "radio" && !el.checked) return;
      var v = el.type === "checkbox" ? el.checked : el.dataset.lines ? el.value.split("\n") : el.value;
      if (el.dataset.geo) {
        var g = parseGeo(el.value);
        if (g === false) { el.setAttribute("aria-invalid", "true"); return; }
        el.removeAttribute("aria-invalid"); v = g || undefined;
      }
      if (en && el.dataset.tr) { if (!doc[edLang]) doc[edLang] = {}; setPath(doc[edLang], el.dataset.path, v); }
      else setPath(doc, el.dataset.path, v);
      if (el.dataset.path === "nom") refreshPick();
      if (el.dataset.path === "annonce.texte") countAnnonce();
      if (el.dataset.photo) refreshThumbs(el.closest(".photo-row"));
      changed();
      return;
    }
    if (!el.dataset.list) return;
    var list = el.dataset.list, i = +el.dataset.i, item = arr(list)[i];
    if (!item) return;
    var target = en && el.dataset.tr ? enItem(list, i, true) : item;
    if (el.dataset.pk) {
      if (target === item) { item.photos = item.photos || []; item.photos[+el.dataset.pj][el.dataset.pk] = el.value; }
      else { target.photos = target.photos || []; padTo(target.photos, +el.dataset.pj + 1); target.photos[+el.dataset.pj][el.dataset.pk] = el.value; }
      refreshThumbs(el.closest(".photo-row"));
      changed();
      return;
    }
    var val = el.dataset.lines ? el.value.split("\n") : el.value;
    if (el.dataset.geo) {
      var g2 = parseGeo(el.value);
      if (g2 === false) { el.setAttribute("aria-invalid", "true"); return; }
      el.removeAttribute("aria-invalid");
      if (g2) item.geo = g2; else delete item.geo;
      updateHead(el, list, i);
      changed();
      return;
    }
    target[el.dataset.k] = val;
    if (el.dataset.photo) refreshThumbs(el.closest(".photo-row"));
    updateHead(el, list, i);
    if (el.dataset.k === "categorie") { var ic = el.closest(".item").querySelector(".item-ico"); if (ic) ic.innerHTML = I(itemIcon(list, item)); }
    changed();
  }
  function updateHead(el, list, i) {
    var head = el.closest(".item").querySelector(".item-title");
    if (head) head.innerHTML = itemTitle(list, i);
  }
  function countAnnonce() {
    var t = document.getElementById("a-texte");
    document.getElementById("a-count").textContent = t.value.length + " / 220";
  }
  document.getElementById("a-ideas").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || edLang !== "fr") return;
    doc.annonce.texte = b.dataset.text; doc.annonce.style = b.dataset.style; doc.annonce.actif = true;
    fillForm(); changed();
  });

  var SW = ["#1F5B4C", "#A3402B", "#1D5C7A", "#56632A", "#6A4C93", "#B5651D", "#2E3A59", "#8C2F4B"];
  function renderSwatches() {
    var cur = (doc.theme.accent || "").toLowerCase(), off = edLang !== "fr" ? " disabled" : "";
    document.getElementById("swatches").innerHTML = SW.map(function (c) {
      return '<button type="button" class="swatch" style="--c:' + c + '" data-c="' + c + '" aria-label="Couleur ' + c + '" aria-pressed="' + (cur === c.toLowerCase()) + '"' + off + "></button>";
    }).join("") + '<label class="sr" for="g-color">Autre couleur</label><input type="color" id="g-color" value="' + esc(doc.theme.accent || "#1F5B4C") + '"' + off + ">";
  }
  document.getElementById("swatches").addEventListener("click", function (e) {
    var b = e.target.closest(".swatch"); if (!b || b.disabled) return;
    doc.theme.accent = b.dataset.c; renderSwatches(); changed();
  });
  document.getElementById("swatches").addEventListener("input", function (e) {
    if (e.target.id !== "g-color") return;
    e.stopPropagation();
    doc.theme.accent = e.target.value;
    document.querySelectorAll(".swatch").forEach(function (s) { s.setAttribute("aria-pressed", "false"); });
    changed();
  });

  /* ---------- listes ---------- */
  var CA = window.CDH_CAT_ADRESSES, CT = window.CDH_CAT_ACTIVITES;
  var LABEL = { rubriques: "rubrique", blocs: "bloc", services: "service", adresses: "adresse", activites: "activité" };
  function itemIcon(list, it) {
    if (list === "adresses") return (CA[it.categorie] || CA.services).icone;
    if (list === "activites") return (CT[it.categorie] || CT.culture).icone;
    return it.icone || (list === "services" ? "cadeau" : "info");
  }
  function tv(list, i, k) {
    var fr = (arr(list)[i] || {})[k];
    if (edLang === "fr") return fr;
    var e = enItem(list, i, false);
    return e && e[k] && String(e[k]).trim() ? e[k] : fr;
  }
  function itemTitle(list, i) {
    var it = arr(list)[i] || {};
    var t = list === "adresses" ? it.nom : tv(list, i, "titre");
    var sub;
    if (list === "rubriques") sub = tv(list, i, "resume");
    else if (list === "blocs") sub = short(tv(list, i, "texte"));
    else if (list === "services") sub = tv(list, i, "prix");
    else {
      var cat = list === "adresses" ? CA[it.categorie] : CT[it.categorie];
      sub = [(cat || {}).label, tv(list, i, "distance")].filter(Boolean).join(" · ");
    }
    var flags = "";
    if ((list === "adresses" || list === "activites") && it.geo) flags += '<span class="flag" title="Sur la carte">' + I("pin", "ico-s") + "</span>";
    if (edLang !== "fr" && !translated(list, i)) flags += '<span class="flag todo">À traduire</span>';
    return "<b>" + esc(t || "Sans titre") + flags + "</b><small>" + esc(sub || " ") + "</small>";
  }
  var TRK = {
    rubriques: ["titre", "resume", "texte", "astuce"], blocs: ["titre", "texte", "astuce"], services: ["titre", "description"],
    adresses: ["note"], activites: ["titre", "description"]
  };
  function translated(list, i) {
    var e = enItem(list, i, false), it = arr(list)[i] || {};
    if (!e) return false;
    return TRK[list].every(function (k) { return !String(it[k] || "").trim() || String(e[k] || "").trim(); });
  }
  function fld(list, i, k, label, opts) {
    opts = opts || {};
    var en = edLang !== "fr", it = arr(list)[i] || {};
    var fr = it[k], val = fr;
    var id = list + "-" + i + "-" + k;
    var ph = opts.ph || "";
    if (en && opts.tr) {
      var e = enItem(list, i, false);
      val = e ? e[k] : undefined;
      ph = opts.lines ? (fr || []).join("\n") : short(fr) || ph;
    }
    var dis = en && !opts.tr && !opts.geo;
    if (opts.geo) { dis = en; val = geoStr(it.geo); }
    var attrs = ' id="' + id + '" data-list="' + list + '" data-i="' + i + '" data-k="' + k + '"' + (opts.tr ? ' data-tr="1"' : "") + (opts.lines ? ' data-lines="1"' : "") + (opts.geo ? ' data-geo="1" inputmode="decimal"' : "") +
      (ph ? ' placeholder="' + esc(ph) + '"' : "") + (dis ? " disabled" : "");
    var v = opts.lines ? (val || []).join("\n") : (val == null ? "" : val);
    var input;
    if (opts.options) input = "<select" + attrs + ">" + Object.keys(opts.options).map(function (o) { return '<option value="' + o + '"' + (o === val ? " selected" : "") + ">" + esc(opts.options[o].label) + "</option>"; }).join("") + "</select>";
    else if (opts.area) input = "<textarea" + attrs + ">" + esc(v) + "</textarea>";
    else input = "<input" + attrs + ' value="' + esc(v) + '">';
    return '<label class="fld' + (opts.full ? " full" : "") + '" for="' + id + '"><span>' + label + "</span>" + input + "</label>";
  }
  function iconGrid(list, it, i) {
    return '<div class="fld lock-en"><span>Icône</span><div class="icon-grid">' + Object.keys(window.CDH_ICON_LABELS).map(function (n) {
      return '<button type="button" data-icon="' + n + '" data-i="' + i + '" title="' + esc(window.CDH_ICON_LABELS[n]) + '" aria-label="' + esc(window.CDH_ICON_LABELS[n]) + '" aria-pressed="' + (itemIcon(list, it) === n) + '">' + I(n, "ico") + "</button>";
    }).join("") + "</div></div>";
  }
  function onePhoto(list, it, i, ph) {
    var av = /^data:/.test(it.photo || "") ? "" : (it.photo || "");
    return '<div class="fld lock-en"><span>Photo <small>(facultatif)</small></span><div class="photo-row"><img class="thumb" data-thumb-src="' + esc(it.photo || "") + '" alt=""><input id="' + list + "-ph-" + i + '" aria-label="Adresse de la photo" data-list="' + list + '" data-i="' + i + '" data-k="photo" data-photo="1" value="' + esc(av) + '" placeholder="' + (av || !it.photo ? ph : "Photo importée depuis l'ordinateur") + '"' + (edLang === "en" ? " disabled" : "") + '><label class="btn tiny fr-only" for="' + list + "-phf-" + i + '">Importer</label><input type="file" accept="image/*" class="sr" id="' + list + "-phf-" + i + '" data-tlist="' + list + '" data-i="' + i + '" data-k="photo"></div></div>';
  }
  function bodyFor(list, it, i) {
    var en = edLang !== "fr";
    if (list === "rubriques") {
      var enIt = enItem(list, i, false) || {};
      var ph = (it.photos || []).map(function (p, j) {
        var v = /^data:/.test(p.src || "") ? "" : (p.src || "");
        var leg = en ? (((enIt.photos || [])[j] || {}).legende || "") : (p.legende || "");
        var legPh = en ? (p.legende || "Légende") : "Légende";
        return '<div class="photo-row cap"><img class="thumb" data-thumb-src="' + esc(p.src || "") + '" alt=""><input id="rp-' + i + "-" + j + '" aria-label="Adresse de la photo ' + (j + 1) + '" data-list="rubriques" data-i="' + i + '" data-pj="' + j + '" data-pk="src" data-photo="1" value="' + esc(v) + '" placeholder="' + (v || !p.src ? "photos/mon-livret/lave-linge.jpg" : "Photo importée depuis l'ordinateur") + '"' + (en ? " disabled" : "") + ">" +
          '<input class="cap-in" id="rpl-' + i + "-" + j + '" aria-label="Légende de la photo ' + (j + 1) + '" data-list="rubriques" data-i="' + i + '" data-pj="' + j + '" data-pk="legende" data-tr="1" value="' + esc(leg) + '" placeholder="' + esc(legPh) + '">' +
          '<label class="btn tiny fr-only" for="rpf-' + i + "-" + j + '">Importer</label><input type="file" accept="image/*" class="sr" id="rpf-' + i + "-" + j + '" data-tlist="rubriques" data-i="' + i + '" data-pj="' + j + '">' +
          '<button type="button" class="iconbtn danger fr-only" data-act="rphoto-del" data-pj="' + j + '" aria-label="Retirer la photo">' + I("croix", "ico-s") + "</button></div>";
      }).join("");
      return '<div class="grid2">' + fld(list, i, "titre", "Titre", { tr: 1 }) + fld(list, i, "resume", "Résumé <small>(sous le titre)</small>", { tr: 1 }) + "</div>" +
        '<div class="fld"><span>Photos <small>(appareil, boutons, accès…)</small></span><div class="rphotos">' + ph + '</div><div class="row fr-only"><button type="button" class="btn tiny" data-act="rphoto-add">+ Ajouter une photo</button></div></div>' +
        iconGrid(list, it, i) +
        fld(list, i, "texte", "Texte", { area: 1, tr: 1 }) +
        '<div class="grid2">' + fld(list, i, "etapes", "Étapes numérotées <small>(une par ligne)</small>", { area: 1, lines: 1, tr: 1 }) +
        fld(list, i, "liste", "Liste à puces <small>(une par ligne)</small>", { area: 1, lines: 1, tr: 1 }) + "</div>" +
        fld(list, i, "astuce", "Astuce <small>(encadré)</small>", { tr: 1 });
    }
    if (list === "blocs") {
      return fld(list, i, "titre", "Titre", { tr: 1, ph: "Ex. : En train, En voiture, Récupérer les clés" }) +
        onePhoto(list, it, i, "photos/mon-livret/boite-a-cles.jpg") +
        iconGrid(list, it, i) +
        fld(list, i, "texte", "Texte", { area: 1, tr: 1 }) +
        fld(list, i, "etapes", "Étapes numérotées <small>(une par ligne, facultatif)</small>", { area: 1, lines: 1, tr: 1 }) +
        fld(list, i, "astuce", "Astuce <small>(encadré, facultatif)</small>", { tr: 1 });
    }
    if (list === "services") {
      return '<div class="grid2">' + fld(list, i, "titre", "Service", { tr: 1, ph: "Ex. : Départ tardif jusqu'à 14 h" }) + fld(list, i, "prix", "Prix", { tr: 1, ph: "Ex. : 20 € · Offert" }) + "</div>" +
        fld(list, i, "description", "Description", { area: 1, tr: 1, ph: "Ex. : Selon disponibilité, à demander la veille." }) +
        iconGrid(list, it, i);
    }
    if (list === "adresses") {
      return '<div class="grid2">' + fld(list, i, "nom", "Nom") + fld(list, i, "categorie", "Catégorie", { options: CA }) +
        fld(list, i, "distance", "Distance", { tr: 1, ph: "Ex. : 5 min à pied" }) + fld(list, i, "horaires", "Horaires", { tr: 1, ph: "Ex. : Lun.–sam. 8 h–19 h" }) + "</div>" +
        fld(list, i, "note", "Votre conseil", { area: 1, tr: 1 }) +
        '<div class="grid2">' + fld(list, i, "requete", "Recherche carte <small>(facultatif)</small>", { ph: "Nom + ville par défaut" }) +
        fld(list, i, "geo", "Coordonnées GPS <small>(pour la carte)</small>", { geo: 1, ph: "Ex. : 48.5812, 7.7445" }) + "</div>";
    }
    return onePhoto(list, it, i, "photos/mon-livret/balade.jpg") +
      '<div class="grid2">' + fld(list, i, "titre", "Titre", { tr: 1 }) + fld(list, i, "categorie", "Catégorie", { options: CT }) +
      fld(list, i, "distance", "Distance", { tr: 1, ph: "Ex. : 20 min en voiture" }) + fld(list, i, "duree", "Durée", { tr: 1, ph: "Ex. : 2 h" }) + "</div>" +
      fld(list, i, "description", "Description", { area: 1, tr: 1 }) +
      '<div class="grid2">' + fld(list, i, "requete", "Recherche carte <small>(facultatif)</small>") +
      fld(list, i, "geo", "Coordonnées GPS <small>(pour la carte)</small>", { geo: 1, ph: "Ex. : 48.5812, 7.7445" }) + "</div>";
  }
  function renderList(list) {
    var box = document.getElementById("list-" + list);
    var a = arr(list);
    box.innerHTML = a.length ? a.map(function (it, i) {
      var open = openItem[list] === i;
      return '<div class="item' + (open ? " open" : "") + '" data-i="' + i + '"><div class="item-head"><span class="item-ico">' + I(itemIcon(list, it)) + "</span>" +
        '<button type="button" class="item-title" data-act="toggle" aria-expanded="' + open + '">' + itemTitle(list, i) + "</button>" +
        '<span class="item-tools fr-only"><button type="button" class="iconbtn" data-act="up" aria-label="Monter"' + (i === 0 ? " disabled" : "") + ">" + I("haut", "ico-s") + "</button>" +
        '<button type="button" class="iconbtn" data-act="down" aria-label="Descendre"' + (i === a.length - 1 ? " disabled" : "") + ">" + I("bas", "ico-s") + "</button>" +
        '<button type="button" class="iconbtn danger" data-act="del" aria-label="Supprimer">' + I("croix", "ico-s") + "</button></span></div>" +
        (open ? '<div class="item-body">' + bodyFor(list, it, i) + "</div>" : "") + "</div>";
    }).join("") : '<p class="hint">Rien pour l\'instant.</p>';
    if (edLang !== "fr") box.querySelectorAll('input[type="file"]').forEach(function (f) { f.disabled = true; });
    refreshThumbs(box);
    counts();
  }
  function renderLists() { LISTS.forEach(renderList); }

  /* déplace / supprime aussi la traduction pour garder le même ordre */
  function mirror(list, fn) {
    TRL.forEach(function (l) {
      var e = trArr(l, list, false); if (!e) return;
      padTo(e, arr(list).length); fn(e);
    });
  }
  LISTS.forEach(function (list) {
    var box = document.getElementById("list-" + list);
    box.addEventListener("click", function (e) {
      var ib = e.target.closest("[data-icon]");
      if (ib) {
        if (edLang !== "fr") return;
        arr(list)[+ib.dataset.i].icone = ib.dataset.icon;
        box.querySelectorAll("[data-icon]").forEach(function (x) { if (x.dataset.i === ib.dataset.i) x.setAttribute("aria-pressed", String(x === ib)); });
        var head = ib.closest(".item").querySelector(".item-ico"); head.innerHTML = I(ib.dataset.icon);
        changed(); return;
      }
      var b = e.target.closest("[data-act]"); if (!b) return;
      var i = +b.closest(".item").dataset.i, a = arr(list);
      var act = b.dataset.act;
      if (act === "toggle") { openItem[list] = openItem[list] === i ? -1 : i; renderList(list); sendPreview(); return; }
      if (edLang !== "fr") return;
      if (act === "rphoto-add") { a[i].photos = a[i].photos || []; a[i].photos.push({ src: "", legende: "" }); renderList(list); changed(); return; }
      if (act === "rphoto-del") {
        var pj = +b.dataset.pj;
        a[i].photos.splice(pj, 1);
        TRL.forEach(function (l) { var tl = trArr(l, list, false), ei = tl && tl[i]; if (ei && Array.isArray(ei.photos) && ei.photos.length > pj) ei.photos.splice(pj, 1); });
        renderList(list); changed(); return;
      }
      if (act === "up" && i > 0) {
        a.splice(i - 1, 0, a.splice(i, 1)[0]);
        mirror(list, function (x) { x.splice(i - 1, 0, x.splice(i, 1)[0]); });
        if (openItem[list] === i) openItem[list] = i - 1;
      }
      if (act === "down" && i < a.length - 1) {
        a.splice(i + 1, 0, a.splice(i, 1)[0]);
        mirror(list, function (x) { x.splice(i + 1, 0, x.splice(i, 1)[0]); });
        if (openItem[list] === i) openItem[list] = i + 1;
      }
      if (act === "del") {
        if (!b.classList.contains("armed")) {
          b.classList.add("armed"); b.setAttribute("aria-label", "Confirmer la suppression"); b.title = "Cliquez encore pour supprimer";
          setTimeout(function () { if (b.isConnected) { b.classList.remove("armed"); b.setAttribute("aria-label", "Supprimer"); b.title = ""; } }, 3000);
          return;
        }
        TRL.forEach(function (l) { var en0 = trArr(l, list, false); if (en0 && en0.length > i) en0.splice(i, 1); });
        a.splice(i, 1); openItem[list] = -1; toast("Élément supprimé");
      }
      renderList(list); changed();
    });
  });
  document.querySelectorAll("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (edLang !== "fr") return;
      var list = b.dataset.add, a = arr(list);
      if (list === "rubriques") a.push({ id: "r-" + Date.now().toString(36), titre: "Nouvelle rubrique", icone: "info", resume: "", texte: "", etapes: [], liste: [], astuce: "" });
      if (list === "blocs") a.push({ icone: "info", titre: "Nouveau bloc", texte: "", etapes: [], astuce: "" });
      if (list === "services") a.push({ icone: "cadeau", titre: "Nouveau service", prix: "", description: "" });
      if (list === "adresses") a.push({ categorie: "restaurant", nom: "Nouvelle adresse", distance: "", horaires: "", note: "" });
      if (list === "activites") a.push({ categorie: "culture", titre: "Nouvelle activité", distance: "", duree: "", description: "" });
      openItem[list] = a.length - 1;
      renderList(list); changed();
      var inp = document.getElementById(list + "-" + (a.length - 1) + "-" + (list === "adresses" ? "nom" : "titre"));
      if (inp) { inp.focus(); inp.select(); }
    });
  });

  /* ---------- photos ---------- */
  function refreshThumbs(scope) {
    if (!scope) return;
    scope.querySelectorAll(".thumb").forEach(function (t) {
      var src = t.dataset.thumbSrc;
      if (t.dataset.thumbFor) src = getPath(doc, document.getElementById(t.dataset.thumbFor).dataset.path) || "";
      var row = t.closest(".photo-row");
      var inp = row && row.querySelector("input[data-photo]");
      if (inp && inp.value) src = inp.value;
      else if (inp && inp.dataset.list) {
        var it = arr(inp.dataset.list)[+inp.dataset.i] || {};
        src = inp.dataset.pk ? ((it.photos || [])[+inp.dataset.pj] || {}).src : it[inp.dataset.k];
      }
      t.classList.toggle("empty", !src);
      t.onerror = function () { t.classList.add("empty"); };
      if (src) { if (t.getAttribute("src") !== src) t.src = src; } else t.removeAttribute("src");
    });
  }
  /* Réduit la photo à 1600 px. Démo : image intégrée (data:). Connecté : fichier JPG envoyé dans la base. */
  function readPhoto(file, cb, asBlob) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        if (asBlob) c.toBlob(function (b) { cb(b); }, "image/jpeg", 0.82);
        else cb(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  }
  function importPhoto(file, cb) {
    if (!COMPTE) { readPhoto(file, cb); return; }
    readPhoto(file, function (blob) {
      if (!blob) { cb(null); return; }
      var t = toast("Envoi de la photo…", 60000);
      var id0 = doc.id;
      K.envoyerPhoto(id0, blob, file.name).then(function (url) {
        t.remove();
        if (!doc || doc.id !== id0) { toast("Photo envoyée, mais vous avez changé de livret entre-temps : ajoutez-la à nouveau."); cb(false); return; }
        cb(url);
      }, function (er) { t.remove(); cloudError(er); cb(false); });
    }, true);
  }
  document.getElementById("panel").addEventListener("change", function (e) {
    var f = e.target;
    if (f.type !== "file" || !f.files || !f.files[0]) return;
    importPhoto(f.files[0], function (url) {
      f.value = "";
      if (url === false) return;
      if (!url) { toast("Ce fichier n'est pas une image lisible. Essayez un JPG ou un PNG."); return; }
      if (f.dataset.tpath) {
        setPath(doc, f.dataset.tpath, url);
        var inp = document.querySelector('[data-path="' + f.dataset.tpath + '"]');
        if (inp) { inp.value = ""; inp.placeholder = "Photo importée depuis l'ordinateur"; }
        refreshThumbs(f.closest(".photo-row"));
      } else if (f.dataset.tlist) {
        var it = arr(f.dataset.tlist)[+f.dataset.i];
        if (f.dataset.pj != null) { it.photos[+f.dataset.pj].src = url; } else { it[f.dataset.k] = url; }
        renderList(f.dataset.tlist);
      }
      changed();
      toast("Photo ajoutée");
    });
  });

  /* ---------- aperçu ---------- */
  var timer = null;
  var SECTION = { arrivee: "arrivee", services: "services", adresses: "adresses", activites: "activites", depart: "depart", rubriques: "logement" };
  function sendPreview() {
    if (!frameReady || !doc) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var msg = { type: "cdh:render", livret: cleaned(), lang: edLang };
      if (tab === "rubriques" && openItem.rubriques > -1 && doc.rubriques[openItem.rubriques]) msg.open = doc.rubriques[openItem.rubriques].id;
      else if (SECTION[tab]) msg.section = SECTION[tab];
      try { frame.contentWindow.postMessage(msg, "*"); } catch (e) {}
    }, 120);
  }
  window.addEventListener("message", function (e) {
    if (e.source === frame.contentWindow && e.data && e.data.type === "cdh:ready") { frameReady = true; sendPreview(); }
  });
  var pv = document.getElementById("preview");
  document.getElementById("show-preview").addEventListener("click", function () { pv.classList.add("show"); document.getElementById("close-preview").focus(); });
  document.getElementById("close-preview").addEventListener("click", function () { pv.classList.remove("show"); document.getElementById("show-preview").focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pv.classList.contains("show")) pv.classList.remove("show"); });

  /* ---------- état / publication ---------- */
  var statusEl = document.getElementById("status"), dirty = false;
  function setStatus(draft) {
    dirty = !!draft;
    var off = COMPTE && remote.existe && remote.actif === false;
    var txt = draft ? "Modifications non publiées" : !COMPTE ? "À jour" : !remote.existe ? "Pas encore en ligne" : off ? "Hors ligne" : "En ligne";
    statusEl.className = "status " + (draft || (COMPTE && !remote.existe) ? "draft" : off ? "off" : "ok");
    statusEl.textContent = txt;
  }
  function changed() {
    writeDraft(); setStatus(true); sendPreview();
    if (tab === "qr") renderQr();
    if (tab === "arrivee") renderArrLink();
  }
  var pubBtn = document.getElementById("publish");
  pubBtn.textContent = COMPTE ? "Publier" : "Enregistrer mon essai"; /* démonstration : rien n'est mis en ligne */
  pubBtn.addEventListener("click", function () {
    if (COMPTE) { publierCompte(false); return; }
    var saved = S.save(cleaned());
    if (!saved) { toast("Enregistrement impossible : le stockage de ce navigateur est bloqué."); return; }
    doc.majLe = saved.majLe;
    dropDraft(doc.id); setStatus(false); refreshPick();
    toast("Essai enregistré sur cet appareil. Pour mettre un vrai livret en ligne, il faut un compte client.", 4500);
  });

  /* ---------- mode connecté : publication dans la base ---------- */
  /* « 2026-10-24T20:56:01.123456+00:00 » : on garde 3 décimales (Safari n'aime pas les microsecondes) */
  function toDate(iso) { return new Date(String(iso || "").replace(/(\.\d{3})\d+/, "$1")); }
  function quand(iso) {
    var d = toDate(iso); if (isNaN(d)) return "";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " à " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  }
  function sameTime(a, b) { return a === b || Math.abs(toDate(a) - toDate(b)) < 1; }
  function setHash() { try { history.replaceState(null, "", location.pathname + location.search + "#" + doc.id); } catch (e) {} }
  function toLogin() {
    location.replace("espace.html?retour=" + encodeURIComponent("console.html?compte" + (doc ? "#" + doc.id : location.hash || "")));
  }
  function cloudError(er) {
    if (er && er.code === "session") { toast(er.message + " Vos modifications restent gardées sur cet appareil.", 4000); setTimeout(toLogin, 1800); return; }
    toast((er && er.message) || "Une erreur est survenue. Réessayez.", 5000);
  }
  function updateAcct(id, patch) {
    if (!acct) return;
    var l = acct.livrets.filter(function (x) { return x.id === id; })[0];
    if (l) Object.keys(patch).forEach(function (k) { l[k] = patch[k]; });
  }
  function busyPub(on) { pubBtn.disabled = on; pubBtn.textContent = on ? "Publication…" : "Publier"; }
  var conflictEl = document.getElementById("conflict");
  function showConflict(when) {
    document.getElementById("conflict-when").textContent = when ? " le " + quand(when) : "";
    conflictEl.hidden = false; barH();
  }
  function hideConflict() { if (!conflictEl.hidden) { conflictEl.hidden = true; barH(); } }
  document.getElementById("conflict-force").addEventListener("click", function () { hideConflict(); publierCompte(true); });
  document.getElementById("conflict-load").addEventListener("click", function () { hideConflict(); dropDraft(doc.id); loadCompte(doc.id); toast("Version en ligne chargée"); });

  /* Photos à envoyer dans la base avant publication :
     - importées en mode démo (intégrées au livret, « data: ») ;
     - déposées par le client avec le questionnaire, référencées « depot:<dossier>/<fichier>.jpg » dans le livret importé.
     Chaque emplacement : [objet, clé, vider()] ; vider() retire une photo introuvable sans laisser de cadre vide. */
  function isDepot(s) { return /^depot:/i.test(String(s || "").trim()); }
  function depotPath(s) {
    var p = String(s || "").trim().replace(/^depot:/i, "").replace(/^\/+/, "").replace(/^depots\//, "");
    if (p.indexOf("/") < 0 && doc && doc.depot) p = String(doc.depot).replace(/^depots\//, "").replace(/\/+$/, "") + "/" + p;
    return p;
  }
  function photoSlots(d, onlyDepot) {
    var out = [], want = function (s) { return onlyDepot ? isDepot(s) : (isDepot(s) || /^data:image\//.test(s || "")); };
    if (d.theme && want(d.theme.couverture)) out.push([d.theme, "couverture", function () { d.theme.couverture = ""; }]);
    (d.rubriques || []).forEach(function (r) { (r.photos || []).forEach(function (p) { if (want(p.src)) out.push([p, "src", function () { var i = r.photos.indexOf(p); if (i > -1) r.photos.splice(i, 1); }]); }); });
    ((d.arrivee || {}).blocs || []).forEach(function (b) { if (want(b.photo)) out.push([b, "photo", function () { b.photo = ""; }]); });
    (d.activites || []).forEach(function (a) { if (want(a.photo)) out.push([a, "photo", function () { a.photo = ""; }]); });
    return out;
  }
  function uploadInlinePhotos(id, onlyDepot) {
    var slots = photoSlots(doc, onlyDepot), res = { ok: 0, ko: 0 };
    if (!slots.length) return Promise.resolve(res);
    var t = toast("Envoi de " + slots.length + " photo" + (slots.length > 1 ? "s" : "") + "…", 120000);
    return slots.reduce(function (p, s) {
      return p.then(function () {
        var v = s[0][s[1]], dep = isDepot(v), path = dep ? depotPath(v) : "";
        var get = dep ? K.photoDepot(path) : fetch(v).then(function (r) { return r.blob(); });
        return get.then(function (b) { return K.envoyerPhoto(id, b, dep ? path.split("/").pop().replace(/\.[a-z0-9]+$/i, "") : s[1]); })
          .then(function (url) { s[0][s[1]] = url; res.ok++; writeDraft(); }, function (e) {
            /* Photo du client introuvable dans le dossier : on retire l'emplacement plutôt que de bloquer */
            if (dep && e && (e.status === 400 || e.status === 404)) { s[2](); res.ko++; writeDraft(); return; }
            throw e;
          });
      });
    }, Promise.resolve()).then(function () { t.remove(); return res; }, function (e) { t.remove(); throw e; });
  }
  /* Photos libres des sorties (champ « wiki ») : récupérées une fois sur Wikimedia Commons (licences libres
     seulement), copiées dans la banque commune photos/_lieux/ puis servies par la base comme les autres photos.
     Le livret ne dépend plus de Wikipédia à l'affichage ; le crédit (auteur, licence) reste écrit sur la photo. */
  var FREE_LIC = /^(cc0|cc[ -]by|public domain|pd\b|gfdl|licence ouverte|attribution)/i;
  function txt(h) { var d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80); }
  function jget(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }, function () { return null; }); }
  function commonsFile(file) {
    return jget("https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|mime|size&iiurlwidth=960&format=json&origin=*&titles=" + encodeURIComponent("File:" + file)).then(function (q) {
      var pg = q && q.query && q.query.pages, k = pg && Object.keys(pg)[0], ii = k && pg[k].imageinfo && pg[k].imageinfo[0], md = ii && ii.extmetadata;
      var lic = md && md.LicenseShortName && md.LicenseShortName.value;
      if (!ii || !ii.thumburl || !lic || !FREE_LIC.test(lic) || !/^image\/(jpeg|png)$/.test(ii.mime || "")) return null;
      return { file: file, src: ii.thumburl, by: txt(md.Artist && md.Artist.value), lic: lic };
    });
  }
  function wikiPhoto(wiki) {
    var tries = [];
    String(wiki || "").split("|").forEach(function (t) { t = t.trim(); if (t) { tries.push(["fr", t]); tries.push(["en", t]); } });
    function search() {
      if (!tries.length) return Promise.resolve(null);
      return jget("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=10&format=json&origin=*&prop=imageinfo&iiprop=extmetadata|mime|size&iiurlwidth=960&gsrsearch=" + encodeURIComponent(tries[0][1] + " filetype:bitmap")).then(function (q) {
        var pg = q && q.query && q.query.pages, L = pg ? Object.keys(pg).map(function (k) { return pg[k]; }).sort(function (a, b) { return a.index - b.index; }) : [];
        for (var i = 0; i < L.length; i++) {
          var ii = L[i].imageinfo && L[i].imageinfo[0], md = ii && ii.extmetadata, lic = md && md.LicenseShortName && md.LicenseShortName.value;
          if (ii && ii.thumburl && /^image\/jpeg$/.test(ii.mime) && ii.width >= 1000 && ii.width > ii.height && lic && FREE_LIC.test(lic))
            return { file: String(L[i].title || "").replace(/^File:/, ""), src: ii.thumburl, by: txt(md.Artist && md.Artist.value), lic: lic };
        }
        return null;
      });
    }
    function one(i) {
      if (i >= tries.length) return search();
      return jget("https://" + tries[i][0] + ".wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(tries[i][1])).then(function (j) {
        var th = j && j.thumbnail && j.thumbnail.source, m = th && /\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^\/]+)\//.exec(th);
        if (!m || /\.svg$/i.test(decodeURIComponent(m[1]))) return one(i + 1);
        return commonsFile(decodeURIComponent(m[1])).then(function (c) { return c || one(i + 1); });
      });
    }
    return one(0).catch(function () { return null; });
  }
  function resolveWikiPhotos() {
    if (!COMPTE || !acct || !acct.admin || !doc) return Promise.resolve(0);
    var list = (doc.activites || []).filter(function (a) { return a.wiki && !String(a.photo || "").trim(); }), n = 0;
    if (!list.length) return Promise.resolve(0);
    var t = toast("Photos des sorties : copie dans la banque…", 120000);
    return list.reduce(function (p, a) {
      return p.then(function () {
        return wikiPhoto(a.wiki).then(function (info) {
          if (!info) return;
          var h = 5381; for (var i = 0; i < info.file.length; i++) h = ((h * 33) ^ info.file.charCodeAt(i)) >>> 0;
          var key = slug(info.file.replace(/\.[a-z0-9]+$/i, "")) + "-" + h.toString(36);
          return fetch(K.urlLieu(key), { method: "HEAD", cache: "no-store" }).then(function (r) { return r.ok; }, function () { return false; }).then(function (deja) {
            if (deja) return K.urlLieu(key);
            return fetch(info.src).then(function (r) { if (!r.ok) throw new Error("image"); return r.blob(); }).then(function (b) { return K.envoyerPhotoLieu(key, b); });
          }).then(function (url) {
            a.photo = url; a.photoCredit = "© " + (info.by || "Wikimedia Commons") + " · " + info.lic; n++; writeDraft();
          });
        }).catch(function () {});
      });
    }, Promise.resolve()).then(function () { t.remove(); return n; });
  }
  function publierCompte(force) {
    if (!doc || pubBtn.disabled) return;
    if (!remote.existe) { if (acct && acct.admin) openCreate(); return; }
    var id = doc.id;
    busyPub(true);
    uploadInlinePhotos(id).then(resolveWikiPhotos).then(function () {
      return K.publier(id, cleaned(), force ? null : baseEdit);
    }).then(function (r) {
      busyPub(false);
      if (!doc || doc.id !== id) return;
      remote.base = baseEdit = r.publieLe;
      dropDraft(id); setStatus(false); hideConflict();
      updateAcct(id, { nom: doc.nom, ville: doc.ville, publieLe: r.publieLe });
      refreshPick();
      if (tab === "sauvegarde") renderCompteTab();
      toast("Publié : vos voyageurs voient cette version.", 3200);
    }, function (er) {
      busyPub(false);
      if (er.code === "conflit") { showConflict(er.raw && er.raw.details); return; }
      cloudError(er);
    });
  }

  /* Administrateur : première mise en ligne (choix de l'adresse définitive) */
  var dlg = document.getElementById("dlg-creer"), cId = document.getElementById("c-id"), cMsg = document.getElementById("c-msg");
  function idFrom(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").slice(0, 60); }
  function openCreate() {
    cId.value = /^nouveau-livret-/.test(doc.id) ? slug(doc.nom) : doc.id;
    var u = window.cdhLivretUrl("zzidzz"), pre = u.slice(0, u.indexOf("zzidzz")).replace(/^https?:\/\//, "");
    document.getElementById("c-prefix").textContent = pre.length > 28 ? "…" + pre.slice(pre.lastIndexOf("/", pre.length - 2)) : pre;
    document.getElementById("c-prefix").title = u.replace("zzidzz", "…");
    cMsg.hidden = true;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    cId.focus(); cId.select();
  }
  cId.addEventListener("input", function () { var v = idFrom(cId.value); if (v !== cId.value) cId.value = v; });
  document.getElementById("c-cancel").addEventListener("click", function () { dlg.close(); });
  document.getElementById("f-creer").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = idFrom(cId.value).replace(/-+$/, ""), go = document.getElementById("c-go");
    cId.value = id;
    if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(id)) { cMsg.hidden = false; cMsg.textContent = K.messages.identifiant_invalide; cId.focus(); return; }
    go.disabled = true; go.textContent = "Mise en ligne…";
    var oldId = doc.id;
    uploadInlinePhotos(oldId).then(resolveWikiPhotos).then(function () {
      var c = cleaned(); c.id = id;
      return K.creer(id, c);
    }).then(function (r) {
      go.disabled = false; go.textContent = "Mettre en ligne";
      dropDraft(oldId);
      doc.id = id;
      remote = { existe: true, base: r.publieLe, actif: true, acces: [] }; baseEdit = r.publieLe;
      acct.livrets.push({ id: id, nom: doc.nom, ville: doc.ville, actif: true, publieLe: r.publieLe, vues30: 0 });
      acct.livrets.sort(function (a, b) { return String(a.nom || "").localeCompare(String(b.nom || ""), "fr"); });
      dlg.close();
      afterLoad(false); setHash();
      try { localStorage.setItem("cdh:console:dernier", id); } catch (e2) {}
      toast("« " + doc.nom + " » est en ligne. Donnez l'accès à l'hôte dans l'onglet « Accès et versions ».", 5000);
    }, function (er) {
      go.disabled = false; go.textContent = "Mettre en ligne";
      if (er.code === "session") { dlg.close(); cloudError(er); return; }
      cMsg.hidden = false; cMsg.textContent = er.message;
    });
  });

  /* ---------- choix du livret ---------- */
  var pick = document.getElementById("pick");
  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (sel ? " selected" : "") + ">" + esc(label || v) + "</option>"; }
  function refreshPick() {
    if (COMPTE) {
      var inDb = {}, h = "", cur = doc ? doc.id : "";
      (acct ? acct.livrets : []).forEach(function (l) { inDb[l.id] = 1; h += opt(l.id, remote.existe && cur === l.id ? doc.nom : l.nom, remote.existe && cur === l.id); });
      if (acct && acct.admin) {
        var loc = "", seen = {}, local = !remote.existe;
        S.list().forEach(function (l) { if (inDb[l.id]) return; seen[l.id] = 1; loc += opt("local:" + l.id, local && cur === l.id ? doc.nom : l.nom, local && cur === l.id); });
        draftIds().forEach(function (id) { if (inDb[id] || seen[id]) return; seen[id] = 1; var d = readDraft(id); loc += opt("local:" + id, local && cur === id ? doc.nom : (d && d.nom) || id, local && cur === id); });
        if (doc && local && !seen[cur]) loc += opt("local:" + cur, doc.nom, true);
        if (loc) h += '<optgroup label="Pas encore en ligne">' + loc + "</optgroup>";
        h += '<option value="__new">+ Créer un nouveau livret</option>';
      }
      pick.innerHTML = h;
      return;
    }
    var seen2 = {}, opts = [];
    S.list().forEach(function (l) { seen2[l.id] = 1; opts.push([l.id, l.nom]); });
    draftIds().forEach(function (id) { if (!seen2[id]) { var d = readDraft(id); opts.push([id, (d && d.nom) || id]); } });
    opts.forEach(function (o) { if (doc && o[0] === doc.id) o[1] = doc.nom; });
    pick.innerHTML = opts.map(function (o) { return opt(o[0], o[1] || o[0], doc && o[0] === doc.id); }).join("") +
      '<option value="__new">+ Créer un nouveau livret</option>';
  }
  pick.addEventListener("change", function () {
    if (pick.value === "__new") {
      if (COMPTE) { remote = { existe: false }; baseEdit = null; hideConflict(); }
      doc = blank(); writeDraft();
      openItem = {};
      if (edLang !== "fr") { edLang = "fr"; applyLang(); }
      afterLoad(true); showTab("general"); document.getElementById("g-nom").focus(); document.getElementById("g-nom").select();
      toast("Nouveau livret créé. Donnez-lui un nom.");
      return;
    }
    if (COMPTE) {
      if (pick.value.indexOf("local:") === 0) loadLocal(pick.value.slice(6)); else loadCompte(pick.value);
      return;
    }
    load(pick.value);
  });
  function load(id) {
    var draft = readDraft(id);
    doc = normalize(draft || S.get(id) || blank());
    openItem = {};
    afterLoad(!!draft);
    try { localStorage.setItem("cdh:console:dernier", doc.id); } catch (e) {}
  }
  /* Administrateur : livret de cet appareil (exemple, essai) pas encore dans la base */
  function loadLocal(id) {
    remote = { existe: false }; baseEdit = null; hideConflict();
    var dr = readDraft(id);
    doc = normalize(dr || S.get(id) || blank());
    openItem = {};
    afterLoad(!!dr); setHash();
  }
  var loadSeq = 0;
  function loadCompte(id) {
    var seq = ++loadSeq;
    document.body.classList.add("loading");
    return K.lire(id).then(function (r) {
      if (seq !== loadSeq) return;
      document.body.classList.remove("loading");
      remote = { existe: true, base: r.publieLe, actif: r.actif, acces: r.acces || [] };
      var dr = readDraft(id), db = readDraftBase(id);
      baseEdit = dr && db ? db : r.publieLe;
      doc = normalize(dr || r.contenu);
      doc.id = id;
      openItem = {}; hideConflict();
      afterLoad(!!dr); setHash();
      if (dr && db && !sameTime(db, r.publieLe)) showConflict(r.publieLe);
      try { localStorage.setItem("cdh:console:dernier", id); } catch (e) {}
    }, function (er) {
      if (seq !== loadSeq) return;
      document.body.classList.remove("loading");
      if (doc) refreshPick();
      cloudError(er);
    });
  }
  function afterLoad(isDraft) {
    normalize(doc);
    fillForm(); renderLists(); refreshPick(); setStatus(isDraft);
    document.getElementById("open-livret").href = "livret.html#" + doc.id;
    if (tab === "qr") renderQr();
    if (tab === "arrivee") renderArrLink();
    if (tab === "sauvegarde") { renderExport(); renderCompteTab(); }
    if (COMPTE) {
      document.getElementById("reset").textContent = remote.existe ? "Abandonner mes modifications" : "Supprimer ce brouillon";
      document.getElementById("reset-hint").textContent = remote.existe ? "Efface les modifications non publiées de cet appareil et recharge la version en ligne." : "Ce livret n'est pas encore en ligne : il n'existe que sur cet appareil.";
    } else {
      var pub = S.published(doc.id);
      document.getElementById("reset").textContent = pub ? "Restaurer la version d'origine" : "Supprimer ce livret";
      document.getElementById("reset-hint").textContent = pub ? "Supprime vos modifications sur cet appareil et recharge la version d'origine." : "Ce livret n'existe que sur cet appareil. Exportez-le avant de le supprimer si vous voulez le garder.";
    }
    if (!frame.getAttribute("src")) frame.src = "livret.html#" + doc.id;
    sendPreview();
  }

  /* ---------- lien « avant votre arrivée » ---------- */
  function arrMessage() {
    var url = window.cdhLivretUrl(doc.id, "arrivee"), h = doc.hote || {};
    var tr = edLang !== "fr" ? doc[edLang] : null;
    var who = edLang !== "fr" ? ((tr && tr.hote && tr.hote.signature) || h.signature || h.nom || "") : (h.signature || h.nom || "");
    var sig = who ? "\n" + who : "";
    if (edLang === "en") return "Hello! Your stay at " + doc.nom + " is coming up. Here's how to get here and pick up the keys: " + url + "\nSee you tomorrow!" + sig;
    if (edLang === "de") return "Guten Tag! Ihr Aufenthalt in „" + doc.nom + "“ steht bevor. So kommen Sie an und erhalten die Schlüssel: " + url + "\nBis morgen!" + sig;
    if (edLang === "it") return "Buongiorno! Il vostro soggiorno a " + doc.nom + " si avvicina. Ecco come arrivare e ritirare le chiavi: " + url + "\nA domani!" + sig;
    return "Bonjour ! Votre séjour au " + doc.nom + " approche. Voici comment venir et récupérer les clés : " + url + "\nÀ demain !" + (who ? "\n" + who : "");
  }
  function renderArrLink() {
    var url = window.cdhLivretUrl(doc.id, "arrivee");
    ["arr-url", "qr-arr-url"].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = url; });
    var m = document.getElementById("arr-msg"); if (m) m.value = arrMessage();
  }
  function bindCopy(btnId, srcId, okMsg) {
    var b = document.getElementById(btnId); if (!b) return;
    b.addEventListener("click", function () {
      var el = document.getElementById(srcId), text = "value" in el && el.tagName !== "CODE" ? el.value : el.textContent;
      window.cdhCopy(text, el.tagName === "TEXTAREA" ? null : el).then(function (ok) {
        if (!ok && el.tagName === "TEXTAREA") { el.focus(); el.select(); }
        toast(ok ? okMsg : "Texte sélectionné : copiez-le");
      });
    });
  }
  bindCopy("copy-arr", "arr-url", "Lien copié");
  bindCopy("copy-arr-msg", "arr-msg", "Message copié");
  bindCopy("copy-qr-arr", "qr-arr-url", "Lien copié");

  /* ---------- QR code et affiche ---------- */
  function qrColor() { return document.getElementById("qr-c-noir").checked ? "#111111" : (doc.theme.accent || "#12302A"); }
  function renderQr() {
    var url = window.cdhLivretUrl(doc.id);
    document.getElementById("qr-url").textContent = url;
    document.getElementById("qr-big").innerHTML = window.cdhQrSvg(url, { fg: qrColor(), margin: 2, label: "QR code du livret " + doc.nom });
    renderArrLink();
    drawPoster();
  }
  document.querySelectorAll('input[name="qr-color"]').forEach(function (r) { r.addEventListener("change", renderQr); });
  document.getElementById("poster-wifi").addEventListener("change", drawPoster);
  bindCopy("copy-url", "qr-url", "Adresse copiée");

  var FONT_CSS = { "Lora": '"Lora", Georgia, serif', "Gloock": '"Lora", Georgia, serif', "Marcellus": '"Marcellus", Georgia, serif', "Young Serif": '"Young Serif", Georgia, serif', "Newsreader": '"Newsreader", Georgia, serif', "Schibsted Grotesk": '"Schibsted Grotesk", system-ui, sans-serif' };
  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/), out = [], cur = "";
    words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; });
    if (cur) out.push(cur);
    return out;
  }
  var posterCanvas = document.createElement("canvas");
  function drawPoster() {
    var W = 1240, H = 1748, c = posterCanvas; c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    var accent = doc.theme.accent || "#1F5B4C";
    var disp = FONT_CSS[doc.theme.police] || FONT_CSS.Gloock;
    var body = '"Schibsted Grotesk", system-ui, sans-serif';
    var trs = TRL.filter(function (l) { return doc[l] && Object.keys(doc[l]).length; }), bi = trs.length > 0;
    var WEL = { en: "WELCOME", de: "WILLKOMMEN", it: "BENVENUTI" };
    var go = function () {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 470);
      ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = "600 34px " + body; ctx.textAlign = "center";
      ctx.fillText(["BIENVENUE"].concat(trs.map(function (l) { return WEL[l]; })).join(" · "), W / 2, 130);
      ctx.fillStyle = "#ffffff"; ctx.font = "92px " + disp;
      var nl = wrap(ctx, doc.nom || "", W - 160).slice(0, 2);
      nl.forEach(function (l, i) { ctx.fillText(l, W / 2, 250 + i * 104 - (nl.length - 1) * 40); });
      ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = "36px " + body;
      ctx.fillText(doc.ville || "", W / 2, 420);
      var withWifi = document.getElementById("poster-wifi").checked && doc.wifi && doc.wifi.reseau;
      var qs = withWifi ? 620 : 780, qy = withWifi ? 540 : 600;
      window.cdhQrDraw(ctx, window.cdhLivretUrl(doc.id), (W - qs) / 2, qy, qs, "#12302A", "#ffffff");
      ctx.fillStyle = "#12302A"; ctx.font = "700 44px " + body;
      ctx.fillText("Scannez pour ouvrir le livret d'accueil", W / 2, qy + qs + 70);
      ctx.fillStyle = "#4C6159"; ctx.font = "34px " + body;
      ctx.fillText(bi ? "Scan for the welcome guide · Wi-Fi, tips, contacts" : "Wi-Fi, équipements, adresses et numéros utiles", W / 2, qy + qs + 122);
      if (withWifi) {
        var by = 1400;
        ctx.strokeStyle = "#D5DDD6"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(120, by - 40); ctx.lineTo(W - 120, by - 40); ctx.stroke();
        window.cdhQrDraw(ctx, window.cdhWifiString(doc.wifi.reseau, doc.wifi.motDePasse), 120, by, 250, "#12302A", "#ffffff");
        ctx.textAlign = "left"; ctx.fillStyle = "#4C6159"; ctx.font = "600 30px " + body;
        ctx.fillText("WI-FI : SCANNEZ POUR VOUS CONNECTER", 410, by + 50);
        ctx.fillStyle = "#12302A"; ctx.font = "600 44px " + body;
        ctx.fillText(doc.wifi.reseau, 410, by + 120);
        if (doc.wifi.motDePasse) { ctx.font = "40px ui-monospace, Menlo, Consolas, monospace"; ctx.fillText(doc.wifi.motDePasse, 410, by + 180); }
        ctx.textAlign = "center";
      }
      ctx.fillStyle = "#8A9A93"; ctx.font = "26px " + body;
      ctx.fillText((C.marque || "") + " · livret d'accueil digital", W / 2, H - 50);
      try { document.getElementById("poster-img").src = c.toDataURL("image/png"); } catch (e) {}
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load("92px " + disp), document.fonts.load("600 44px " + body)]).then(go, go);
    } else go();
  }

  function download(canvas, name) {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  }
  if (framed) {
    document.querySelectorAll("[data-download]").forEach(function (b) { b.hidden = true; });
    document.getElementById("dl-hint").hidden = false;
  } else {
    document.getElementById("dl-qr").addEventListener("click", function () {
      var c = document.createElement("canvas"); c.width = c.height = 1200;
      window.cdhQrDraw(c.getContext("2d"), window.cdhLivretUrl(doc.id), 0, 0, 1200, qrColor(), "#ffffff");
      download(c, "qr-" + doc.id + ".png");
    });
    document.getElementById("dl-poster").addEventListener("click", function () { download(posterCanvas, "affiche-" + doc.id + ".png"); });
  }

  /* ---------- export / import / restauration ---------- */
  function renderExport() {
    document.getElementById("export").value = 'window.CDH_LIVRETS["' + doc.id + '"] = ' + JSON.stringify(cleaned(), null, 2) + ";\n";
  }
  bindCopy("copy-export", "export", "Livret copié");
  function importText(raw) {
    var msg = document.getElementById("import-msg");
    msg.hidden = false;
    try {
      var a = raw.indexOf("{"), b = raw.lastIndexOf("}");
      if (a < 0 || b < a) throw new Error("vide");
      var d = JSON.parse(raw.slice(a, b + 1));
      if (!d.nom) throw new Error("nom");
      if (!d.id) d.id = slug(d.nom);
      d.id = slug(d.id);
      if (COMPTE && !(remote.existe && doc && doc.id === d.id)) { remote = { existe: false }; baseEdit = null; hideConflict(); }
      doc = normalize(d); writeDraft(); openItem = {}; afterLoad(true);
      msg.className = "msg ok"; msg.textContent = "« " + d.nom + " » importé. Vérifiez puis publiez.";
    } catch (e) {
      msg.className = "msg err"; msg.textContent = "Ce texte n'est pas un livret exporté. Copiez tout le contenu de la zone Exporter, accolades comprises.";
      return;
    }
    placerPhotosClient(msg);
  }
  /* Après import : photos du client (« depot:… ») puis photos libres des sorties, copiées tout de suite dans la base */
  function placerPhotosClient(msg) {
    var n = photoSlots(doc, true).length, w = (doc.activites || []).filter(function (a) { return a.wiki && !String(a.photo || "").trim(); }).length, nom = doc.nom, id0 = doc.id;
    if (!n && !w) return;
    if (!COMPTE || !acct || !acct.admin) {
      msg.textContent = "« " + nom + " » importé. Connectez-vous avec le compte administrateur pour que les photos se placent toutes seules.";
      return;
    }
    msg.textContent = "« " + nom + " » importé. Placement des photos…";
    var r1 = { ok: 0, ko: 0 };
    (n ? uploadInlinePhotos(id0, true) : Promise.resolve(r1)).then(function (r) { r1 = r; return resolveWikiPhotos(); }).then(function (nw) {
      if (!doc || doc.id !== id0) return;
      afterLoad(true);
      var parts = [];
      if (n) parts.push(r1.ok + " photo" + (r1.ok > 1 ? "s" : "") + " du client en place" + (r1.ko ? " (" + r1.ko + " introuvable" + (r1.ko > 1 ? "s" : "") + ", emplacement retiré)" : ""));
      if (w) parts.push(nw + " photo" + (nw > 1 ? "s" : "") + " de sorties sur " + w + " copiée" + (nw > 1 ? "s" : "") + " dans la banque");
      msg.className = "msg ok";
      msg.textContent = "« " + nom + " » importé : " + parts.join(", ") + ". Vérifiez puis publiez.";
    }, function (er) {
      msg.className = "msg err";
      msg.textContent = "Livret importé, mais les photos n'ont pas pu être copiées (" + (er && er.message || "erreur") + "). Elles le seront à la publication.";
    });
  }
  document.getElementById("do-import").addEventListener("click", function () { importText(document.getElementById("import").value); });
  document.getElementById("import-file").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { document.getElementById("import").value = String(r.result || ""); e.target.value = ""; importText(String(r.result || "")); };
    r.readAsText(f);
  });
  function arm(btn, label, ms) {
    if (btn.classList.contains("armed")) { btn.classList.remove("armed"); if (btn.dataset.old) btn.textContent = btn.dataset.old; return true; }
    btn.classList.add("armed"); btn.dataset.old = btn.textContent; btn.textContent = label || "Cliquez encore pour confirmer";
    setTimeout(function () { if (btn.isConnected && btn.classList.contains("armed")) { btn.classList.remove("armed"); btn.textContent = btn.dataset.old; } }, ms || 3500);
    return false;
  }
  var resetBtn = document.getElementById("reset");
  resetBtn.addEventListener("click", function () {
    if (!arm(resetBtn)) return;
    var id = doc.id;
    if (COMPTE) {
      dropDraft(id);
      if (remote.existe) { loadCompte(id); toast("Modifications abandonnées"); return; }
      var first = acct && acct.livrets[0];
      if (first) loadCompte(first.id); else loadLocal((S.list()[0] || {}).id || "nid-des-tanneurs");
      toast("Brouillon supprimé");
      return;
    }
    var pub = S.published(id);
    dropDraft(id); S.remove(id);
    if (pub) { load(id); toast("Version d'origine restaurée"); }
    else { var f = S.list()[0]; load(f ? f.id : "nid-des-tanneurs"); toast("Livret supprimé de cet appareil"); }
    if (tab === "sauvegarde") renderExport();
  });

  /* ---------- mode connecté : versions, accès, mise hors ligne ---------- */
  function renderCompteTab() {
    if (!COMPTE || !doc) return;
    var admin = !!(acct && acct.admin);
    document.getElementById("versions-grp").hidden = !remote.existe;
    document.getElementById("acces-grp").hidden = !(admin && remote.existe);
    document.getElementById("local-hint").hidden = remote.existe;
    if (remote.existe) loadVersions();
    if (admin && remote.existe) renderAcces();
  }
  function loadVersions() {
    var box = document.getElementById("versions"), id = doc.id;
    box.innerHTML = '<p class="hint">Chargement des versions…</p>';
    K.versions(id).then(function (vs) {
      if (!doc || doc.id !== id) return;
      vs = Array.isArray(vs) ? vs : [];
      box.innerHTML = vs.length ? '<ul class="vlist">' + vs.map(function (v) {
        return '<li><div><b>' + esc(quand(v.publieLe)) + "</b><small>" + esc([v.nom, v.par ? "par " + v.par : ""].filter(Boolean).join(" · ")) + "</small></div>" +
          '<button type="button" class="btn tiny" data-version="' + (+v.id) + '" data-when="' + esc(v.publieLe) + '">Reprendre</button></li>';
      }).join("") + "</ul>" : '<p class="hint">Aucune version précédente pour l\'instant : elles apparaîtront ici après chaque publication.</p>';
    }, function (er) {
      if (er.code === "session") { cloudError(er); return; }
      box.innerHTML = '<p class="msg err">' + esc(er.message) + "</p>";
    });
  }
  document.getElementById("versions").addEventListener("click", function (e) {
    var b = e.target.closest("[data-version]"); if (!b) return;
    if (dirty && !arm(b, "Remplacer mes modifications ?")) return;
    var id = doc.id, when = b.dataset.when;
    b.disabled = true;
    K.version(+b.dataset.version).then(function (c) {
      if (!doc || doc.id !== id) return;
      doc = normalize(c); doc.id = id;
      writeDraft(); openItem = {}; afterLoad(true);
      toast("Version du " + quand(when) + " chargée. Vérifiez-la, puis « Publier » pour la remettre en ligne.", 5000);
    }, function (er) { b.disabled = false; cloudError(er); });
  });

  function espaceUrl() {
    var dom = (C.domaine || "").replace(/\/$/, "");
    return dom ? dom + "/espace.html" : new URL("espace.html", location.href).href.split("?")[0].split("#")[0];
  }
  function renderAcces() {
    var a = remote.acces || [];
    document.getElementById("acces-list").innerHTML = a.length ? a.map(function (m) {
      return '<li><span>' + esc(m) + '</span><button type="button" class="btn tiny danger" data-retirer="' + esc(m) + '">Retirer</button></li>';
    }).join("") : '<li class="hint">Aucun hôte n\'a encore accès à ce livret.</li>';
    document.getElementById("actif").checked = remote.actif !== false;
    var mail = a[0] || "e-mail du compte";
    document.getElementById("invite").value = "Bonjour,\n\nVotre espace pour modifier votre livret d'accueil « " + (doc.nom || "") + " » est prêt :\n" + espaceUrl() +
      "\n\nIdentifiant : " + mail + "\nMot de passe : celui que nous vous transmettons à part (vous pourrez le changer dans « Mon compte »).\n\nÀ chaque modification, cliquez sur « Publier » : vos voyageurs voient aussitôt la nouvelle version, le QR code ne change pas.\n\n" + (C.marque || "");
  }
  bindCopy("copy-invite", "invite", "Message copié");
  document.getElementById("acces-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var inp = document.getElementById("acces-mail"), out = document.getElementById("acces-msg"), email = inp.value.trim(), id = doc.id;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { out.hidden = false; out.className = "msg err"; out.textContent = "Indiquez l'e-mail du compte de l'hôte."; return; }
    K.accesAjouter(id, email).then(function (list) {
      if (doc.id !== id) return;
      remote.acces = list; inp.value = ""; renderAcces();
      out.hidden = false; out.className = "msg ok"; out.textContent = "Accès donné. Envoyez-lui le message ci-dessous, avec son mot de passe à part.";
    }, function (er) {
      if (er.code === "session") { cloudError(er); return; }
      out.hidden = false; out.className = "msg err"; out.textContent = er.message;
    });
  });
  document.getElementById("acces-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-retirer]"); if (!b || !arm(b, "Confirmer")) return;
    var id = doc.id;
    K.accesRetirer(id, b.dataset.retirer).then(function (list) { if (doc.id !== id) return; remote.acces = list; renderAcces(); toast("Accès retiré"); }, cloudError);
  });
  document.getElementById("actif").addEventListener("change", function (e) {
    var on = e.target.checked, id = doc.id;
    K.activer(id, on).then(function (r) {
      remote.actif = r.actif; updateAcct(id, { actif: r.actif }); setStatus(dirty);
      toast(r.actif ? "Livret en ligne" : "Livret hors ligne : les voyageurs voient « Livret introuvable ».", 4000);
    }, function (er) { e.target.checked = !on; cloudError(er); });
  });

  /* ---------- démarrage ---------- */
  // hauteur de la barre (onglets collants sur mobile)
  function barH() { document.documentElement.style.setProperty("--bar-h", document.getElementById("cbar").offsetHeight + "px"); }

  function compteMessage(html, retry) {
    document.body.classList.remove("loading");
    var box = document.getElementById("compte-msg");
    box.querySelector("p").innerHTML = html;
    box.querySelector("[data-retry]").hidden = !retry;
    box.hidden = false;
    document.querySelector(".shell").hidden = true;
    document.getElementById("show-preview").hidden = true;
  }
  document.querySelector("#compte-msg [data-retry]").addEventListener("click", function () { location.reload(); });

  function bootCompte() {
    document.body.classList.add("compte", "loading");
    applyLang();
    if (!K || !K.actif) { location.replace("espace.html"); return; }
    var want = decodeURIComponent((location.hash || "").replace("#", ""));
    K.session().then(function (s) {
      if (!s) { toLogin(); return; }
      return K.moi().then(function (m) {
        acct = m; acct.livrets = acct.livrets || [];
        document.body.classList.toggle("is-admin", !!m.admin);
        setTabLabel("sauvegarde", m.admin ? "Accès et versions" : "Versions");
        var note = document.getElementById("demo-note");
        note.innerHTML = "Connecté : <b>" + esc(m.email || K.email()) + "</b> · Rien ne change pour vos voyageurs avant « Publier ». " +
          '<a href="espace.html">Mes livrets</a> · <button type="button" class="linkish" id="logout">Se déconnecter</button>';
        document.getElementById("logout").addEventListener("click", function () { K.deconnexion().then(function () { location.replace("espace.html"); }); });
        barH();
        var ids = acct.livrets.map(function (l) { return l.id; }), last = "";
        try { last = localStorage.getItem("cdh:console:dernier") || ""; } catch (e) {}
        var id = ids.indexOf(want) > -1 ? want : ids.indexOf(last) > -1 ? last : ids[0];
        if (want && ids.indexOf(want) < 0 && !m.admin) toast("Ce compte n'a pas accès à ce livret.", 4000);
        if (id) return loadCompte(id);
        if (m.admin) {
          document.body.classList.remove("loading");
          var w = want && (S.get(want) || readDraft(want)) ? want : ((S.list()[0] || {}).id || "nid-des-tanneurs");
          loadLocal(w);
          return;
        }
        compteMessage("<b>Aucun livret n'est encore relié à votre compte.</b> Écrivez-nous : nous l'associons à votre compte. <a href=\"espace.html\">Retour à l'espace client</a>", false);
      });
    }).catch(function (er) {
      if (er && er.code === "session") { toLogin(); return; }
      compteMessage(esc((er && er.message) || "Une erreur est survenue.") + ' <a href="espace.html">Retour à l\'espace client</a>', true);
    });
  }

  if (COMPTE) bootCompte();
  else {
    var startId = decodeURIComponent((location.hash || "").replace("#", ""));
    if (!startId) { try { startId = localStorage.getItem("cdh:console:dernier") || ""; } catch (e) {} }
    if (!startId || (!S.get(startId) && !readDraft(startId))) startId = "nid-des-tanneurs";
    applyLang();
    load(startId);
    if (K && K.actif) document.getElementById("demo-note").insertAdjacentHTML("beforeend", ' Vous êtes client&nbsp;? <a href="espace.html">Espace client</a>');
  }
  barH(); window.addEventListener("resize", barH);

  /* Adresse modifiée à la main (console.html?compte#autre-livret) */
  window.addEventListener("hashchange", function () {
    var id = decodeURIComponent((location.hash || "").replace("#", ""));
    if (!id || (doc && id === doc.id)) return;
    if (!COMPTE) { if (S.get(id) || readDraft(id)) load(id); return; }
    if (!acct) return;
    var ids = acct.livrets.map(function (l) { return l.id; });
    if (ids.indexOf(id) > -1) { loadCompte(id); return; }
    if (acct.admin && (S.get(id) || readDraft(id))) { loadLocal(id); return; }
    toast("Ce compte n'a pas accès à ce livret.", 4000);
    if (doc) setHash();
  });
})();
