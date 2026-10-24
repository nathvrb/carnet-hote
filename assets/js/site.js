/* Vitrine : textes de configuration, exemples, offres, héros. */
(function () {
  var C = window.CDH_CONFIG, T = window.CDH_TARIFS, I = window.cdhIcon, esc = window.cdhEsc;
  function eur(n) {
    var two = Math.round(n * 100) % 100 !== 0;
    return n.toLocaleString("fr-FR", { minimumFractionDigits: two ? 2 : 0, maximumFractionDigits: 2 }).replace(/ /g, " ") + " €";
  }
  function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }

  /* ---------- réglages ---------- */
  each("[data-brand]", function (el) { el.textContent = C.marque; });
  each("[data-email]", function (el) { el.textContent = C.email; });
  each("[data-tel]", function (el) { el.textContent = C.telephone; });
  each("[data-zone]", function (el) { el.textContent = C.zone; });
  each("[data-siret]", function (el) { el.textContent = C.siret; });
  each("[data-tva]", function (el) { el.textContent = "Prix nets. " + C.mentionTVA + "."; });
  each("[data-modif]", function (el) { el.textContent = eur(T.modificationPonctuelle); });
  each("[data-mois-offerts]", function (el) { el.textContent = T.moisOffertsAnnuel; });
  var minPrix = Math.min.apply(null, Object.keys(T.formules).map(function (k) { return T.formules[k].prix; }));
  each("[data-prix-min]", function (el) { el.textContent = eur(minPrix); });
  var rem = T.remises.filter(function (r) { return r.taux; });
  each("[data-remises]", function (el) {
    el.textContent = rem.map(function (r) { return "-" + Math.round(r.taux * 100) + " % dès " + r.min; }).join(", ");
  });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- héros : téléphone + porte-clés ---------- */
  var frame = document.getElementById("hero-frame");
  var fobQr = document.getElementById("fob-qr");
  function setFob(id) {
    if (!fobQr) return;
    try { fobQr.innerHTML = window.cdhQrSvg(window.cdhLivretUrl(id), { fg: "#12302A", margin: 1, size: 88 }); } catch (e) {}
  }
  setFob("nid-des-tanneurs");
  each(".switch button", function (b) {
    b.addEventListener("click", function () {
      each(".switch button", function (o) { o.setAttribute("aria-selected", String(o === b)); });
      var id = b.dataset.demo, d = window.CDH_LIVRETS[id];
      frame.src = "livret.html#" + id;
      frame.title = "Aperçu d'un livret d'accueil : " + (d ? d.nom : "");
      setFob(id);
    });
  });

  /* ---------- exemples ---------- */
  var demos = document.getElementById("demo-cards");
  var TYPE = { location: "Location courte durée", hotel: "Hôtel ★★★", maison: "Maison d'hôtes" };
  var PITCH = {
    "nid-des-tanneurs": "Arrivée autonome avec boîte à clés, mode d'emploi du lave-linge, tri des déchets et winstubs du quartier.",
    "hotel-les-ondines": "Le classeur de chambre en version digitale : petit-déjeuner, spa, room service, parking et départ tardif.",
    "bastide-aux-amandiers": "Table d'hôtes, règles de la piscine, marchés provençaux et villages perchés du Luberon."
  };
  var FONT = { "Gloock": "Gloock, Georgia, serif", "Marcellus": "Marcellus, Georgia, serif", "Young Serif": "'Young Serif', Georgia, serif" };
  if (demos) {
    demos.innerHTML = Object.keys(window.CDH_LIVRETS).filter(function (k) { return window.CDH_LIVRETS[k].demo; }).map(function (k) {
      var d = window.CDH_LIVRETS[k];
      var url = window.cdhLivretUrl(k);
      var covUrl = d.theme.couverture ? new URL(d.theme.couverture, location.href).href : "";
      var cov = covUrl ? "--img:url('" + esc(covUrl) + "');" : "";
      return '<article class="demo" style="--c:' + esc(d.theme.accent) + ';' + cov + '"><div class="demo-head' + (cov ? " has-img" : "") + '"><span class="t">' + esc(TYPE[d.type] || "") + '</span><h3 style="font-family:' + esc(FONT[d.theme.police] || FONT.Gloock) + '">' + esc(d.nom) + '</h3><span class="city">' + esc(d.ville) + "</span></div>" +
        '<div class="demo-body"><p>' + esc(PITCH[k] || d.sousTitre) + '</p><div class="demo-foot"><div class="demo-qr">' + window.cdhQrSvg(url, { fg: "#12302A", margin: 1, label: "QR code du livret " + d.nom }) + "</div>" +
        '<div><small>Scannez avec l\'appareil photo de votre téléphone</small><a class="btn small" href="livret.html#' + esc(k) + '" target="_blank" rel="noopener">Ouvrir le livret ' + I("fleche", "ico-s") + "</a></div></div></div></article>";
    }).join("");
  }

  /* ---------- contenu d'un livret ---------- */
  var FEATS = [
    ["wifi", "Le Wi-Fi en un geste", "Nom du réseau et mot de passe en tête du livret, avec un bouton pour copier."],
    ["cle", "Avant votre arrivée", "Un lien à envoyer la veille : adresse, itinéraire, accès et boîte à clés. Le voyageur arrive sans vous appeler."],
    ["lavelinge", "Modes d'emploi en photos", "Lave-linge, plaques, chauffage, coffre-fort : chaque équipement expliqué en étapes numérotées, photos à l'appui."],
    ["carte", "Carte interactive", "Le logement, vos adresses et vos idées de sorties sur une seule carte, avec l'itinéraire en un clic."],
    ["montagne", "Idées de sorties", "Les visites et balades que vous recommandez vraiment, en images, avec la durée et la distance."],
    ["cadeau", "Services en plus", "Départ tardif, panier petit-déjeuner, ménage : le voyageur demande en un clic, par WhatsApp, SMS ou e-mail."],
    ["globe", "Français et anglais", "Le livret s'ouvre dans la langue du téléphone, avec un bouton FR / EN en haut de page."],
    ["soleilnuage", "Météo et hors connexion", "La météo sur 4 jours, et un livret qui reste lisible sans réseau une fois ouvert."],
    ["check", "Départ et avis", "Le voyageur coche sa check-list de départ, puis un bouton l'emmène sur votre page d'avis."],
    ["recherche", "Recherche intégrée", "Le voyageur tape « poubelles » ou « parking » et tombe directement sur la bonne réponse."],
    ["hopital", "Adresses et urgences", "Boulangerie, pharmacie, hôpital, 112 et centre antipoison : distance, horaires et appel en un clic."],
    ["alerte", "Message du moment", "Travaux dans la rue, marché de Noël, offre du spa : un bandeau en haut du livret, quand vous voulez."]
  ];
  var feats = document.getElementById("feats");
  if (feats) feats.innerHTML = FEATS.map(function (f) { return '<div class="feat">' + I(f[0]) + "<h3>" + esc(f[1]) + "</h3><p>" + esc(f[2]) + "</p></div>"; }).join("");

  /* ---------- offres ---------- */
  var plans = document.getElementById("plans");
  if (plans) plans.innerHTML = Object.keys(T.formules).map(function (k) {
    var f = T.formules[k];
    return '<article class="plan' + (f.populaire ? " feature" : "") + '">' + (f.populaire ? '<span class="badge">Le plus choisi</span>' : "") +
      "<h3>" + esc(f.nom) + '</h3><p class="acc">' + esc(f.accroche) + '</p><div class="price"><b>' + eur(f.prix) + "</b><span>par livret, payé une fois</span></div>" +
      "<ul>" + f.inclus.map(function (x) { return "<li>" + I("check", "ico-s") + "<span>" + esc(x) + "</span></li>"; }).join("") + "</ul>" +
      '<div style="display:grid;gap:12px"><span class="meta">' + I("horloge", "ico-s") + "Livré en " + esc(f.delai) + '</span><a class="btn' + (f.populaire ? "" : " ghost") + '" href="#devis" data-choose="' + k + '">Choisir ' + esc(f.nom) + "</a></div></article>";
  }).join("");

  var forf = document.getElementById("forfaits");
  if (forf) forf.innerHTML = Object.keys(T.forfaits).map(function (k) {
    var f = T.forfaits[k];
    return '<div class="forfait"><h4>' + esc(f.nom) + (f.populaire ? " <small>Recommandé</small>" : "") + '</h4><div class="pm">' + eur(f.mensuel) + " <span>/ mois / livret</span></div><p>" + esc(f.accroche) + "</p><ul>" +
      f.inclus.map(function (x) { return "<li>" + I("check", "ico-s") + "<span>" + esc(x) + "</span></li>"; }).join("") + "</ul></div>";
  }).join("");

  var extras = document.getElementById("extras");
  if (extras) {
    var o = T.options;
    var row = function (label, small, price) { return '<div class="row"><dt>' + esc(label) + (small ? "<small>" + esc(small) + "</small>" : "") + '</dt><span class="dots"></span><dd>' + price + "</dd></div>"; };
    extras.innerHTML = '<div><h4>Options</h4><dl>' +
      row(o.langue.label, "Allemand, espagnol, italien, néerlandais…", "+" + eur(o.langue.prix)) +
      row(o.express.label, o.express.detail + " (Confort et Premium)", "+" + eur(o.express.prix)) +
      row(o.visite.label, "Par logement", "+" + eur(o.visite.prix)) +
      row("Modification ponctuelle", "Avec le forfait Hébergement", eur(T.modificationPonctuelle)) +
      "</dl></div><div><h4>Supports QR</h4><dl>" +
      row("Affiche A5 à imprimer", "QR du livret et du Wi-Fi, en PDF · toutes formules", "incluse") +
      Object.keys(T.supports).map(function (k) { var s = T.supports[k]; return row(s.label, s.detail + " · en plus des supports inclus", eur(s.prix)); }).join("") +
      "</dl></div>";
  }

  /* ---------- supports : maquettes ---------- */
  each("[data-sup-prix]", function (el) { var k = T.supports[el.dataset.supPrix]; if (k) el.textContent = eur(k.prix); });
  var MOCK_ID = "nid-des-tanneurs", MD = window.CDH_LIVRETS[MOCK_ID] || {};
  var mockUrl = window.cdhLivretUrl(MOCK_ID);
  function qrAt(x, y, size, fg) {
    return '<g transform="translate(' + x + " " + y + ')">' + window.cdhQrSvg(mockUrl, { fg: fg || "#12302A", margin: 1, size: size }) + "</g>";
  }
  function wifiQrAt(x, y, size) {
    var w = MD.wifi || {};
    return '<g transform="translate(' + x + " " + y + ')">' + window.cdhQrSvg(window.cdhWifiString(w.reseau || "", w.motDePasse || ""), { fg: "#12302A", margin: 0, size: size }) + "</g>";
  }
  function txt(x, y, str, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || "middle") + '" fill="' + (o.fill || "#12302A") + '"' + (o.op ? ' fill-opacity="' + o.op + '"' : "") +
      ' font-family="' + (o.serif ? "Gloock, Georgia, serif" : "Schibsted Grotesk, system-ui, sans-serif") + '" font-size="' + (o.size || 8) + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : "") + (o.ls ? ' letter-spacing="' + o.ls + '"' : "") + ">" + esc(str) + "</text>";
  }
  var ACC = (MD.theme && MD.theme.accent) || "#A3402B", NOM = MD.nom || "Le Nid des Tanneurs", VILLE = MD.ville || "", WIFI = (MD.wifi || {});
  var plexi = document.getElementById("plexi-card");
  if (plexi) {
    plexi.innerHTML = '<rect x="50" y="32" width="140" height="70" rx="2" fill="' + ACC + '"/>' +
      txt(120, 51, "BIENVENUE", { fill: "#fff", op: .85, size: 6.5, weight: 700, ls: 1.6 }) +
      txt(120, 72, NOM, { fill: "#fff", size: 12.5, serif: 1 }) +
      txt(120, 89, VILLE, { fill: "#fff", op: .8, size: 6.6 }) +
      qrAt(82, 110, 76) +
      txt(120, 200, "Scannez pour ouvrir", { size: 8, weight: 700 }) +
      txt(120, 211, "le livret d'accueil", { size: 8, weight: 700 }) +
      '<path d="M60 222H180" stroke="#D5DDD6" stroke-width="1"/>' +
      wifiQrAt(60, 229, 26) +
      txt(94, 238, "WI-FI", { anchor: "start", size: 5.6, weight: 700, ls: 1.2, fill: "#4C6159" }) +
      txt(94, 247, WIFI.reseau || "", { anchor: "start", size: 7.2, weight: 600 }) +
      txt(94, 255.5, WIFI.motDePasse || "", { anchor: "start", size: 6.4, fill: "#4C6159" });
  }
  var poster = document.getElementById("poster-card");
  if (poster) {
    poster.innerHTML = '<rect x="36" y="30" width="168" height="72" fill="' + ACC + '"/>' +
      txt(120, 50, "BIENVENUE", { fill: "#fff", op: .85, size: 6.5, weight: 700, ls: 1.8 }) +
      txt(120, 73, NOM, { fill: "#fff", size: 14, serif: 1 }) +
      txt(120, 91, VILLE, { fill: "#fff", op: .8, size: 7 }) +
      qrAt(76, 112, 88) +
      txt(120, 214, "Scannez pour ouvrir le livret d'accueil", { size: 7.2, weight: 700 }) +
      txt(120, 225, "Wi-Fi, équipements, adresses et numéros utiles", { size: 5.8, fill: "#4C6159" }) +
      '<path d="M50 233H190" stroke="#D5DDD6" stroke-width="1"/>' +
      wifiQrAt(52, 238, 24) +
      txt(84, 246, "WI-FI : SCANNEZ POUR VOUS CONNECTER", { anchor: "start", size: 4.3, weight: 700, ls: .3, fill: "#4C6159" }) +
      txt(84, 256, WIFI.reseau || "", { anchor: "start", size: 7, weight: 600 });
  }
  var fobArt = document.getElementById("sup-fob");
  if (fobArt) {
    document.getElementById("fob-mock-qr").innerHTML = window.cdhQrSvg(mockUrl, { fg: "#12302A", margin: 1, size: 88 });
    var colEl = document.getElementById("fob-colors"), colName = document.getElementById("fob-color-name");
    colEl.innerHTML = (T.couleurs || []).map(function (c, i) {
      return '<label class="coul" style="--c:' + c.hex + '" title="' + esc(c.nom) + '"><input type="radio" name="fob-couleur" value="' + c.id + '"' + (i === 0 ? " checked" : "") + '><span class="dot" aria-hidden="true"></span><span class="sr">' + esc(c.nom) + "</span></label>";
    }).join("");
    var setCol = function (id, fromDevis) {
      var c = (T.couleurs || []).filter(function (x) { return x.id === id; })[0]; if (!c) return;
      fobArt.style.setProperty("--fobc", c.hex); colName.textContent = c.nom;
      var r = colEl.querySelector('input[value="' + id + '"]'); if (r) r.checked = true;
      if (!fromDevis && window.cdhDevis) window.cdhDevis.choose("couleur", id);
    };
    colEl.addEventListener("change", function (e) { if (e.target.name === "fob-couleur") setCol(e.target.value); });
    document.addEventListener("change", function (e) { if (e.target.name === "couleur") setCol(e.target.value, true); });
    var fobIn = document.getElementById("fob-text"), fobName = document.getElementById("fob-name");
    var fitName = function () {
      var v = (fobIn.value || "").trim().toUpperCase() || " ";
      fobName.textContent = v;
      fobName.setAttribute("font-size", "11"); fobName.setAttribute("letter-spacing", "2.2");
      try {
        var w = fobName.getComputedTextLength(), max = 94;
        if (w > max) { var k = max / w; fobName.setAttribute("font-size", (11 * k).toFixed(2)); fobName.setAttribute("letter-spacing", (2.2 * k).toFixed(2)); }
      } catch (e) {}
    };
    fobIn.addEventListener("input", fitName);
    fitName();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);
    var cur = document.querySelector('input[name="couleur"]:checked');
    if (cur) setCol(cur.value, true);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-choose]");
    if (a && window.cdhDevis) window.cdhDevis.choose("formule", a.dataset.choose);
  });

  /* ---------- copier ---------- */
  each("[data-copy]", function (b) {
    b.addEventListener("click", function () {
      var el = document.getElementById(b.dataset.copy);
      window.cdhCopy(el.textContent.trim(), el).then(function (ok) {
        b.textContent = ok ? "Copié" : "Sélectionné";
        setTimeout(function () { b.textContent = "Copier"; }, 1800);
      });
    });
  });
})();
