/* Console d'édition des livrets.
   - Bouton FR / EN : en mode EN, les textes saisis vont dans doc.en.
     Un champ anglais vide reprend le texte français.
   - La structure (ajout, ordre, suppression, photos) se modifie en FR ;
     les traductions suivent automatiquement. */
(function () {
  var C = window.CDH_CONFIG, S = window.CDH_STORE, I = window.cdhIcon, esc = window.cdhEsc;
  var DRAFT = "cdh:brouillon2:";
  var LISTS = ["rubriques", "blocs", "services", "adresses", "activites"];
  var doc = null, tab = "general", edLang = "fr", openItem = {};
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
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function readDraft(id) { try { var r = localStorage.getItem(DRAFT + id); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  var warnedFull = false;
  function writeDraft() {
    try { localStorage.setItem(DRAFT + doc.id, JSON.stringify(doc)); return true; }
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
  function enArr(list, create) {
    if (!doc.en) { if (!create) return null; doc.en = {}; }
    var host = doc.en, key = list;
    if (list === "blocs") {
      if (!doc.en.arrivee) { if (!create) return null; doc.en.arrivee = {}; }
      host = doc.en.arrivee;
    }
    if (!Array.isArray(host[key])) { if (!create) return null; host[key] = []; }
    return host[key];
  }
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
      theme: { accent: "#1F5B4C", police: "Gloock", motif: "collines" },
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
    if (d.en && typeof d.en !== "object") d.en = {};
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
    if (d.en) { var en = prune(d.en); if (en) d.en = en; else delete d.en; }
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
    if (t === "sauvegarde") renderExport();
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
      toast(edLang === "en" ? "Saisie de la version anglaise" : "Saisie de la version française");
    });
  });
  function applyLang() {
    langBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.ed === edLang)); });
    document.body.classList.toggle("en-mode", edLang === "en");
    document.getElementById("en-note").hidden = edLang !== "en";
    document.documentElement.style.setProperty("--bar-h", document.getElementById("cbar").offsetHeight + "px");
  }
  function short(s) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > 90 ? s.slice(0, 88) + "…" : s; }

  /* ---------- formulaire simple ---------- */
  function fillForm() {
    var en = edLang === "en";
    document.querySelectorAll("[data-path]").forEach(function (el) {
      var p = el.dataset.path, tr = !!el.dataset.tr;
      var fr = getPath(doc, p), v = fr;
      if (!el.dataset.ph0) el.dataset.ph0 = el.getAttribute("placeholder") || " ";
      if (en && tr) {
        v = getPath(doc.en || {}, p);
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
    var en = edLang === "en";
    if (el.dataset.path) {
      if (el.type === "radio" && !el.checked) return;
      var v = el.type === "checkbox" ? el.checked : el.dataset.lines ? el.value.split("\n") : el.value;
      if (el.dataset.geo) {
        var g = parseGeo(el.value);
        if (g === false) { el.setAttribute("aria-invalid", "true"); return; }
        el.removeAttribute("aria-invalid"); v = g || undefined;
      }
      if (en && el.dataset.tr) { if (!doc.en) doc.en = {}; setPath(doc.en, el.dataset.path, v); }
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
    var b = e.target.closest("button"); if (!b || edLang === "en") return;
    doc.annonce.texte = b.dataset.text; doc.annonce.style = b.dataset.style; doc.annonce.actif = true;
    fillForm(); changed();
  });

  var SW = ["#1F5B4C", "#A3402B", "#1D5C7A", "#56632A", "#6A4C93", "#B5651D", "#2E3A59", "#8C2F4B"];
  function renderSwatches() {
    var cur = (doc.theme.accent || "").toLowerCase(), off = edLang === "en" ? " disabled" : "";
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
    if (edLang !== "en") return fr;
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
    if (edLang === "en" && !translated(list, i)) flags += '<span class="flag todo">À traduire</span>';
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
    var en = edLang === "en", it = arr(list)[i] || {};
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
    var en = edLang === "en";
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
    if (edLang === "en") box.querySelectorAll('input[type="file"]').forEach(function (f) { f.disabled = true; });
    refreshThumbs(box);
    counts();
  }
  function renderLists() { LISTS.forEach(renderList); }

  /* déplace / supprime aussi la traduction pour garder le même ordre */
  function mirror(list, fn) {
    var e = enArr(list, false); if (!e) return;
    padTo(e, arr(list).length); fn(e);
  }
  LISTS.forEach(function (list) {
    var box = document.getElementById("list-" + list);
    box.addEventListener("click", function (e) {
      var ib = e.target.closest("[data-icon]");
      if (ib) {
        if (edLang === "en") return;
        arr(list)[+ib.dataset.i].icone = ib.dataset.icon;
        box.querySelectorAll("[data-icon]").forEach(function (x) { if (x.dataset.i === ib.dataset.i) x.setAttribute("aria-pressed", String(x === ib)); });
        var head = ib.closest(".item").querySelector(".item-ico"); head.innerHTML = I(ib.dataset.icon);
        changed(); return;
      }
      var b = e.target.closest("[data-act]"); if (!b) return;
      var i = +b.closest(".item").dataset.i, a = arr(list);
      var act = b.dataset.act;
      if (act === "toggle") { openItem[list] = openItem[list] === i ? -1 : i; renderList(list); sendPreview(); return; }
      if (edLang === "en") return;
      if (act === "rphoto-add") { a[i].photos = a[i].photos || []; a[i].photos.push({ src: "", legende: "" }); renderList(list); changed(); return; }
      if (act === "rphoto-del") {
        var pj = +b.dataset.pj;
        a[i].photos.splice(pj, 1);
        var ei = enItem(list, i, false); if (ei && Array.isArray(ei.photos) && ei.photos.length > pj) ei.photos.splice(pj, 1);
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
        var en0 = enArr(list, false); if (en0 && en0.length > i) en0.splice(i, 1);
        a.splice(i, 1); openItem[list] = -1; toast("Élément supprimé");
      }
      renderList(list); changed();
    });
  });
  document.querySelectorAll("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (edLang === "en") return;
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
  function readPhoto(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  }
  document.getElementById("panel").addEventListener("change", function (e) {
    var f = e.target;
    if (f.type !== "file" || !f.files || !f.files[0]) return;
    readPhoto(f.files[0], function (url) {
      f.value = "";
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
  var statusEl = document.getElementById("status");
  function setStatus(draft) {
    statusEl.className = "status " + (draft ? "draft" : "ok");
    statusEl.textContent = draft ? "Modifications non publiées" : "À jour";
  }
  function changed() {
    writeDraft(); setStatus(true); sendPreview();
    if (tab === "qr") renderQr();
    if (tab === "arrivee") renderArrLink();
  }
  document.getElementById("publish").addEventListener("click", function () {
    var saved = S.save(cleaned());
    if (!saved) { toast("Publication impossible : le stockage de ce navigateur est bloqué."); return; }
    doc.majLe = saved.majLe;
    dropDraft(doc.id); setStatus(false); refreshPick();
    toast("Publié. Le livret affiche cette version sur cet appareil.");
  });

  /* ---------- choix du livret ---------- */
  var pick = document.getElementById("pick");
  function refreshPick() {
    var seen = {}, opts = [];
    S.list().forEach(function (l) { seen[l.id] = 1; opts.push([l.id, l.nom]); });
    draftIds().forEach(function (id) { if (!seen[id]) { var d = readDraft(id); opts.push([id, (d && d.nom) || id]); } });
    opts.forEach(function (o) { if (doc && o[0] === doc.id) o[1] = doc.nom; });
    pick.innerHTML = opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (doc && o[0] === doc.id ? " selected" : "") + ">" + esc(o[1] || o[0]) + "</option>"; }).join("") +
      '<option value="__new">+ Créer un nouveau livret</option>';
  }
  pick.addEventListener("change", function () {
    if (pick.value === "__new") {
      doc = blank(); writeDraft();
      openItem = {};
      if (edLang === "en") { edLang = "fr"; applyLang(); }
      afterLoad(true); showTab("general"); document.getElementById("g-nom").focus(); document.getElementById("g-nom").select();
      toast("Nouveau livret créé. Donnez-lui un nom.");
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
  function afterLoad(isDraft) {
    normalize(doc);
    fillForm(); renderLists(); refreshPick(); setStatus(isDraft);
    document.getElementById("open-livret").href = "livret.html#" + doc.id;
    if (tab === "qr") renderQr();
    if (tab === "arrivee") renderArrLink();
    if (tab === "sauvegarde") renderExport();
    var pub = S.published(doc.id);
    document.getElementById("reset").textContent = pub ? "Restaurer la version d'origine" : "Supprimer ce livret";
    document.getElementById("reset-hint").textContent = pub ? "Supprime vos modifications sur cet appareil et recharge la version d'origine." : "Ce livret n'existe que sur cet appareil. Exportez-le avant de le supprimer si vous voulez le garder.";
    if (!frame.getAttribute("src")) frame.src = "livret.html#" + doc.id;
    sendPreview();
  }

  /* ---------- lien « avant votre arrivée » ---------- */
  function arrMessage() {
    var url = window.cdhLivretUrl(doc.id, "arrivee"), h = doc.hote || {};
    var who = edLang === "en" ? ((doc.en && doc.en.hote && doc.en.hote.signature) || h.signature || h.nom || "") : (h.signature || h.nom || "");
    if (edLang === "en") return "Hello! Your stay at " + doc.nom + " is coming up. Here's how to get here and pick up the keys: " + url + "\nSee you tomorrow!" + (who ? "\n" + who : "");
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

  var FONT_CSS = { "Gloock": '"Gloock", Georgia, serif', "Marcellus": '"Marcellus", Georgia, serif', "Young Serif": '"Young Serif", Georgia, serif', "Schibsted Grotesk": '"Schibsted Grotesk", system-ui, sans-serif' };
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
    var bi = !!(doc.en && Object.keys(doc.en).length);
    var go = function () {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 470);
      ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = "600 34px " + body; ctx.textAlign = "center";
      ctx.fillText(bi ? "BIENVENUE · WELCOME" : "BIENVENUE", W / 2, 130);
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
  document.getElementById("do-import").addEventListener("click", function () {
    var raw = document.getElementById("import").value, msg = document.getElementById("import-msg");
    msg.hidden = false;
    try {
      var a = raw.indexOf("{"), b = raw.lastIndexOf("}");
      if (a < 0 || b < a) throw new Error("vide");
      var d = JSON.parse(raw.slice(a, b + 1));
      if (!d.nom) throw new Error("nom");
      if (!d.id) d.id = slug(d.nom);
      d.id = slug(d.id);
      doc = normalize(d); writeDraft(); openItem = {}; afterLoad(true);
      msg.className = "msg ok"; msg.textContent = "« " + d.nom + " » importé. Vérifiez puis publiez.";
    } catch (e) {
      msg.className = "msg err"; msg.textContent = "Ce texte n'est pas un livret exporté. Copiez tout le contenu de la zone Exporter, accolades comprises.";
    }
  });
  var resetBtn = document.getElementById("reset");
  resetBtn.addEventListener("click", function () {
    if (!resetBtn.classList.contains("armed")) {
      resetBtn.classList.add("armed"); var old = resetBtn.textContent; resetBtn.textContent = "Cliquez encore pour confirmer";
      setTimeout(function () { if (resetBtn.classList.contains("armed")) { resetBtn.classList.remove("armed"); resetBtn.textContent = old; } }, 3500);
      return;
    }
    resetBtn.classList.remove("armed");
    var id = doc.id, pub = S.published(id);
    dropDraft(id); S.remove(id);
    if (pub) { load(id); toast("Version d'origine restaurée"); }
    else { var first = S.list()[0]; load(first ? first.id : "nid-des-tanneurs"); toast("Livret supprimé de cet appareil"); }
    if (tab === "sauvegarde") renderExport();
  });

  /* ---------- démarrage ---------- */
  var startId = decodeURIComponent((location.hash || "").replace("#", ""));
  if (!startId) { try { startId = localStorage.getItem("cdh:console:dernier") || ""; } catch (e) {} }
  if (!startId || (!S.get(startId) && !readDraft(startId))) startId = "nid-des-tanneurs";
  applyLang();
  load(startId);

  // hauteur de la barre (onglets collants sur mobile)
  function barH() { document.documentElement.style.setProperty("--bar-h", document.getElementById("cbar").offsetHeight + "px"); }
  barH(); window.addEventListener("resize", barH);
})();
