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
  each("[data-tva-court]", function (el) { el.textContent = C.mentionTVA; });
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
    try { fobQr.innerHTML = window.cdhQrSvg(window.cdhLivretUrl(id), { fg: "#182B40", margin: 1, size: 88 }); } catch (e) {}
  }
  setFob("nid-des-tanneurs");
  /* tableau des clés (nouvelle vitrine) : un QR code sur chaque porte-clés */
  each("[data-fob-qr]", function (g) {
    try { g.innerHTML = window.cdhQrSvg(window.cdhLivretUrl(g.dataset.fobQr), { fg: "#182B40", margin: 1, size: +(g.dataset.size || 88) }); } catch (e) {}
  });
  each("[data-livret-qr]", function (el) {
    try { el.innerHTML = window.cdhQrSvg(window.cdhLivretUrl(el.dataset.livretQr), { fg: "#182B40", margin: 0, label: el.dataset.label || "" }); } catch (e) {}
  });
  each("[data-email-lien]", function (a) { a.href = "mailto:" + C.email; });
  each(".switch button", function (b) {
    b.addEventListener("click", function () {
      each(".switch button", function (o) { o.setAttribute("aria-selected", String(o === b)); });
      b.classList.remove("swing"); void b.offsetWidth; b.classList.add("swing");
      var id = b.dataset.demo, d = window.CDH_LIVRETS[id];
      frame.src = "livret.html#" + id;
      frame.title = "Aperçu d'un livret d'accueil : " + (d ? d.nom : "");
      setFob(id);
      var open = document.getElementById("hero-open");
      if (open) open.href = "livret.html#" + id;
      /* filet de sécurité : si le téléphone n'a pas changé de livret, on le recharge */
      setTimeout(function () {
        try {
          var doc = frame.contentWindow.document;
          if (d && doc.title.indexOf(d.nom) < 0) frame.src = "livret.html?v=" + Date.now() + "#" + id;
        } catch (e) {}
      }, 900);
      /* sur petit écran, le téléphone est sous les clés : on l'amène à l'écran */
      var ph = frame.closest(".phone"), r = ph && ph.getBoundingClientRect();
      if (r && (r.top < 0 || r.bottom > window.innerHeight)) {
        var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        ph.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
      }
    });
  });

  /* ---------- exemples : le salon (onglets + vrai livret dans le téléphone) ---------- */
  var demos = document.getElementById("demo-cards");
  var TYPE = { location: "Location courte durée", hotel: "Hôtel ★★★", maison: "Maison d'hôtes" };
  var PITCH = {
    "nid-des-tanneurs": "Arrivée autonome avec boîte à clés, mode d'emploi du lave-linge, tri des déchets et winstubs du quartier.",
    "hotel-les-ondines": "Le classeur de chambre en version digitale : petit-déjeuner, spa, room service, parking et départ tardif.",
    "bastide-aux-amandiers": "Table d'hôtes, règles de la piscine, marchés provençaux et villages perchés du Luberon."
  };
  if (demos) {
    var ids = Object.keys(window.CDH_LIVRETS).filter(function (k) { return window.CDH_LIVRETS[k].demo; });
    var cover = function (d) { return d.theme && d.theme.couverture ? new URL(d.theme.couverture, location.href).href : ""; };
    demos.innerHTML =
      '<div class="salon-choix" role="tablist" aria-label="Choisir un livret d\'exemple">' + ids.map(function (k, i) {
        var d = window.CDH_LIVRETS[k], c = cover(d);
        return '<button type="button" role="tab" id="tab-' + esc(k) + '" aria-controls="salon-panel" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-salon="' + esc(k) + '">' +
          '<span class="vign" style="--c:' + esc(d.theme.accent) + ';' + (c ? "background-image:url('" + esc(c) + "')" : "") + '" aria-hidden="true"></span>' +
          '<span><span class="t">' + esc(TYPE[d.type] || "") + '</span><span class="nom">' + esc(d.nom) + '</span><span class="ville">' + esc(d.ville) + "</span></span></button>";
      }).join("") + "</div>" +
      '<div class="salon-detail" id="salon-panel" role="tabpanel" aria-labelledby="tab-' + esc(ids[0]) + '"><p id="salon-pitch"></p>' +
      '<div class="salon-qr"><div class="qr" id="salon-qr"></div><div><small>Scannez avec l\'appareil photo de votre téléphone, ou ouvrez-le ici.</small>' +
      '<a class="btn ivoire small" id="salon-open" href="#" target="_blank" rel="noopener">Ouvrir le livret</a></div></div></div>' +
      '<div class="salon-scene" id="salon-scene"><div class="salon-photo"><img id="salon-img" alt="" loading="lazy"></div>' +
      '<div class="phone salon-phone"><div class="screen"><iframe id="demo-frame" name="cdh-vitrine" loading="lazy" title="Livret d\'exemple"></iframe></div></div></div>';

    var dframe = document.getElementById("demo-frame"), scene = document.getElementById("salon-scene");
    var tabs = demos.querySelectorAll("[data-salon]");
    var current = null;
    var selectDemo = function (k, first) {
      if (k === current) return;
      current = k;
      var d = window.CDH_LIVRETS[k];
      tabs.forEach(function (t) { var on = t.dataset.salon === k; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
      document.getElementById("salon-panel").setAttribute("aria-labelledby", "tab-" + k);
      document.getElementById("salon-pitch").textContent = PITCH[k] || d.sousTitre || "";
      document.getElementById("salon-qr").innerHTML = window.cdhQrSvg(window.cdhLivretUrl(k), { fg: "#182B40", margin: 1, label: "QR code du livret " + d.nom });
      document.getElementById("salon-open").href = "livret.html#" + k;
      document.getElementById("salon-open").setAttribute("aria-label", "Ouvrir le livret " + d.nom + " dans un nouvel onglet");
      var img = document.getElementById("salon-img");
      var swap = function () {
        img.src = cover(d); img.alt = "Photo de couverture du livret " + d.nom;
        dframe.src = "livret.html#" + k; dframe.title = "Livret d'exemple : " + d.nom;
        setTimeout(function () { scene.classList.remove("change"); }, 120);
        setTimeout(function () { /* filet de sécurité si le livret n'a pas suivi */
          try { if (dframe.contentWindow.document.title.indexOf(d.nom) < 0) dframe.src = "livret.html?v=" + Date.now() + "#" + k; } catch (e) {}
        }, 1200);
      };
      if (first) { swap(); return; }
      scene.classList.add("change");
      setTimeout(swap, 260);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectDemo(t.dataset.salon); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") n = -i; if (e.key === "End") n = tabs.length - 1 - i;
        if (!n) return;
        e.preventDefault();
        var nx = tabs[(i + n + tabs.length) % tabs.length]; nx.focus(); selectDemo(nx.dataset.salon);
      });
    });
    selectDemo(ids[0], true);
  }

  /* ---------- contenu d'un livret, rangé par moment du séjour ---------- */
  var MOMENTS = [
    ["En arrivant", [
      ["Avant votre arrivée", "Un lien à envoyer la veille : adresse, itinéraire, accès et boîte à clés. Le voyageur arrive sans vous appeler."],
      ["Le Wi-Fi en un geste", "Nom du réseau et mot de passe en tête du livret, avec un bouton pour copier."],
      ["Français et anglais", "Le livret s'ouvre dans la langue du téléphone, avec un bouton FR / EN en haut de page."],
      ["Recherche intégrée", "Le voyageur tape « poubelles » ou « parking » et tombe directement sur la bonne réponse."]
    ]],
    ["Dans le logement", [
      ["Modes d'emploi en photos", "Lave-linge, plaques, chauffage, coffre-fort : chaque équipement expliqué en étapes numérotées, photos à l'appui."],
      ["Services en plus", "Départ tardif, panier petit-déjeuner, ménage : le voyageur demande en un clic, par WhatsApp, SMS ou e-mail."],
      ["Message du moment", "Travaux dans la rue, marché de Noël, offre du spa : un bandeau en haut du livret, quand vous voulez."],
      ["Météo et hors connexion", "La météo sur 4 jours, et un livret qui reste lisible sans réseau une fois ouvert."]
    ]],
    ["Dehors, puis au départ", [
      ["Carte interactive", "Le logement, vos adresses et vos idées de sorties sur une seule carte, avec l'itinéraire en un clic."],
      ["Idées de sorties", "Les visites et balades que vous recommandez vraiment, en images, avec la durée et la distance."],
      ["Adresses et urgences", "Boulangerie, pharmacie, hôpital, 112 et centre antipoison : distance, horaires et appel en un clic."],
      ["Départ et avis", "Le voyageur coche sa check-list de départ, puis un bouton l'emmène sur votre page d'avis."]
    ]]
  ];
  var feats = document.getElementById("feats");
  if (feats) feats.innerHTML = MOMENTS.map(function (m) {
    return '<div class="som-groupe"><h4>' + esc(m[0]) + "</h4><dl>" + m[1].map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("") + "</dl></div>";
  }).join("");

  /* ---------- offres ---------- */
  var plans = document.getElementById("plans");
  if (plans) plans.innerHTML = Object.keys(T.formules).map(function (k) {
    var f = T.formules[k];
    return '<article class="plan"><div class="plan-nom"><h3>' + esc(f.nom) + "</h3>" + (f.populaire ? '<span class="choisi">le plus choisi</span>' : "") + "</div>" +
      '<p class="acc">' + esc(f.accroche) + '</p><div class="price"><b>' + eur(f.prix) + "</b><span>par livret, payé une fois</span></div>" +
      "<ul>" + f.inclus.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<div style="display:grid;gap:14px"><span class="meta">Livré en ' + esc(f.delai) + '</span><a class="btn trait" href="#devis" data-choose="' + k + '">Choisir ' + esc(f.nom) + "</a></div></article>";
  }).join("");

  var forf = document.getElementById("forfaits");
  if (forf) forf.innerHTML = Object.keys(T.forfaits).map(function (k) {
    var f = T.forfaits[k];
    return '<div class="forfait"><h4>' + esc(f.nom) + (f.populaire ? " <small>celui que nous conseillons</small>" : "") + '</h4><div class="pm">' + eur(f.mensuel) + " <span>par mois et par livret</span></div><p>" + esc(f.accroche) + "</p><ul>" +
      f.inclus.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
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
    return '<g transform="translate(' + x + " " + y + ')">' + window.cdhQrSvg(mockUrl, { fg: fg || "#182B40", margin: 1, size: size }) + "</g>";
  }
  function wifiQrAt(x, y, size) {
    var w = MD.wifi || {};
    return '<g transform="translate(' + x + " " + y + ')">' + window.cdhQrSvg(window.cdhWifiString(w.reseau || "", w.motDePasse || ""), { fg: "#182B40", margin: 0, size: size }) + "</g>";
  }
  function txt(x, y, str, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || "middle") + '" fill="' + (o.fill || "#182B40") + '"' + (o.op ? ' fill-opacity="' + o.op + '"' : "") +
      ' font-family="' + (o.serif ? "'Brygada 1918', Georgia, serif" : "'Schibsted Grotesk', system-ui, sans-serif") + '" font-size="' + (o.size || 8) + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : "") + (o.ls ? ' letter-spacing="' + o.ls + '"' : "") + ">" + esc(str) + "</text>";
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
      '<path d="M60 222H180" stroke="#D9D2C6" stroke-width="1"/>' +
      wifiQrAt(60, 229, 26) +
      txt(94, 238, "WI-FI", { anchor: "start", size: 5.6, weight: 700, ls: 1.2, fill: "#5A6472" }) +
      txt(94, 247, WIFI.reseau || "", { anchor: "start", size: 7.2, weight: 600 }) +
      txt(94, 255.5, WIFI.motDePasse || "", { anchor: "start", size: 6.4, fill: "#5A6472" });
  }
  var poster = document.getElementById("poster-card");
  if (poster) {
    poster.innerHTML = '<rect x="36" y="30" width="168" height="72" fill="' + ACC + '"/>' +
      txt(120, 50, "BIENVENUE", { fill: "#fff", op: .85, size: 6.5, weight: 700, ls: 1.8 }) +
      txt(120, 73, NOM, { fill: "#fff", size: 14, serif: 1 }) +
      txt(120, 91, VILLE, { fill: "#fff", op: .8, size: 7 }) +
      qrAt(76, 112, 88) +
      txt(120, 214, "Scannez pour ouvrir le livret d'accueil", { size: 7.2, weight: 700 }) +
      txt(120, 225, "Wi-Fi, équipements, adresses et numéros utiles", { size: 5.8, fill: "#5A6472" }) +
      '<path d="M50 233H190" stroke="#D9D2C6" stroke-width="1"/>' +
      wifiQrAt(52, 238, 24) +
      txt(84, 246, "WI-FI : SCANNEZ POUR VOUS CONNECTER", { anchor: "start", size: 4.3, weight: 700, ls: .3, fill: "#5A6472" }) +
      txt(84, 256, WIFI.reseau || "", { anchor: "start", size: 7, weight: 600 });
  }
  var fobArt = document.getElementById("sup-fob");
  if (fobArt) {
    document.getElementById("fob-mock-qr").innerHTML = window.cdhQrSvg(mockUrl, { fg: "#182B40", margin: 1, size: 88 });
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
  /* ---------- finitions : en-tête, apparitions, rail du devis, total ---------- */
  var top = document.getElementById("top");
  if (top) {
    var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  /* Menu des parties (téléphone et tablette) : <details> s'ouvre tout seul ;
     le script le referme après un choix, un tap à côté ou Échap, et surligne la partie en cours */
  var menu = document.getElementById("menu");
  if (menu) {
    var ferme = function () { menu.open = false; };
    menu.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".menu-pan a")) ferme(); });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) ferme(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { ferme(); menu.querySelector("summary").focus(); } });
    if ("IntersectionObserver" in window) {
      var liens = {};
      Array.prototype.forEach.call(menu.querySelectorAll(".menu-pan a[href^='#']"), function (l) { liens[l.getAttribute("href").slice(1)] = l; });
      var suivi = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting || !liens[x.target.id]) return;
          Array.prototype.forEach.call(menu.querySelectorAll("[aria-current]"), function (l) { l.removeAttribute("aria-current"); });
          liens[x.target.id].setAttribute("aria-current", "true");
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      Object.keys(liens).forEach(function (id) { var el = document.getElementById(id); if (el) suivi.observe(el); });
    }
  }
  var railLinks = document.querySelectorAll(".rail a");
  if (railLinks.length && "IntersectionObserver" in window) {
    var visible = {};
    var mark = function () {
      var first = null;
      railLinks.forEach(function (a) { if (!first && visible[a.getAttribute("href").slice(1)]) first = a; });
      if (first) railLinks.forEach(function (a) { a.classList.toggle("actif", a === first); });
    };
    var so = new IntersectionObserver(function (en) {
      en.forEach(function (x) { visible[x.target.id] = x.isIntersecting; }); mark();
    }, { rootMargin: "-30% 0px -50% 0px" });
    railLinks.forEach(function (a) { var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) so.observe(t); });
  }

  var folio = document.getElementById("folio");
  if (folio && "MutationObserver" in window) {
    var tot = function () { var t = folio.querySelector(".folio-tot .big .a"); return t ? t.textContent : ""; };
    var lastTot = tot(), tm = null;
    new MutationObserver(function () {
      var v = tot();
      if (v === lastTot) return;
      lastTot = v;
      folio.classList.remove("maj"); void folio.offsetWidth; folio.classList.add("maj");
      clearTimeout(tm); tm = setTimeout(function () { folio.classList.remove("maj"); }, 700);
    }).observe(folio, { childList: true });
  }
})();
