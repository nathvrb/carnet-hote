/* Devis automatique : calcul (fonction pure) + interface + envoi de la demande. */
(function () {
  var T = window.CDH_TARIFS, C = window.CDH_CONFIG;

  function r2(n) { return Math.round(n * 100) / 100; }
  function eur(n, dec) {
    var two = dec === true || (dec !== false && Math.round(n * 100) % 100 !== 0);
    return n.toLocaleString("fr-FR", { minimumFractionDigits: two ? 2 : 0, maximumFractionDigits: 2 }).replace(/ /g, " ") + " €";
  }
  function plural(n, s, p) { return n > 1 ? p : s; }

  /* ---------- calcul ---------- */
  /* Prix du n-ième livret (1 = premier) : prix de base, puis prixSuivants (le dernier vaut pour tous les suivants) */
  function prixLivret(F, n) {
    if (n <= 1 || !F.prixSuivants || !F.prixSuivants.length) return F.prix;
    var ps = F.prixSuivants;
    return ps[Math.min(n - 2, ps.length - 1)];
  }
  function ordinal(n) { return n === 1 ? "1er" : n + "e"; }
  function compute(s) {
    var F = T.formules[s.formule], FF = T.forfaits[s.forfait], TY = T.types[s.type];
    var isLoc = TY.mode !== "chambres";
    var livrets = isLoc ? s.qty : 1;
    var lines = [];

    lines.push({ sec: "Création · paiement unique" });
    var base = 0, detail = [];
    for (var n = 1; n <= livrets; n++) base += prixLivret(F, n);
    base = r2(base);
    if (isLoc && livrets > 1) {
      var paliers = [];
      for (var k = 1; k <= Math.min(livrets, (F.prixSuivants || []).length + 1); k++) paliers.push(ordinal(k) + (k === (F.prixSuivants || []).length + 1 && livrets > k ? " et suivants" : "") + " à " + eur(prixLivret(F, k)));
      detail = paliers.join(", ");
    }
    lines.push({ l: "Livret " + F.nom + (isLoc && livrets > 1 ? " × " + livrets : ""), small: isLoc ? (livrets > 1 ? livrets + " livrets différents : " + detail : "1 logement") : TY.label + " · un livret pour les " + s.qty + " " + plural(s.qty, "chambre", "chambres"), a: base });

    var variantes = isLoc ? 0 : (s.variantes || 0), varCost = 0;
    if (variantes) {
      varCost = variantes * T.variante.prix;
      lines.push({ l: variantes + " " + plural(variantes, "variante", "variantes") + " par type de chambre", small: "Consignes propres à un type de chambre · " + eur(T.variante.prix) + " l'unité", a: varCost });
    }

    var langSup = F.languesIllimitees ? 0 : Math.max(0, s.langues - F.langues);
    var langCost = langSup * T.options.langue.prix * livrets;
    if (langSup) lines.push({ l: langSup + " " + plural(langSup, "langue supplémentaire", "langues supplémentaires"), small: s.langues + " langues au total, " + F.langues + " " + plural(F.langues, "incluse", "incluses") + (livrets > 1 ? " · × " + livrets + " livrets" : ""), a: langCost });

    var incl = {}, inclTotal = 0;
    Object.keys(F.supportsInclus || {}).forEach(function (k) { incl[k] = F.supportsInclus[k] * livrets; inclTotal += incl[k]; });
    var sup = s.supports || {};
    var coul = couleur(s.couleur, s.couleurPerso);
    Object.keys(T.supports).forEach(function (k) {
      if (!incl[k]) return;
      var SI = T.supports[k];
      lines.push({ l: incl[k] + " " + plural(incl[k], SI.court[0], SI.court[1]) + " inclus", small: SI.label + (k === "porteCles" ? " · bandeau " + (coul.id === "perso" ? "couleur personnalisée " + coul.hex.toUpperCase() : coul.nom.toLowerCase()) : ""), a: 0 });
    });
    var supportsCost = 0;
    Object.keys(T.supports).forEach(function (k) {
      var n = sup[k] || 0;
      if (!n) return;
      var c = n * T.supports[k].prix;
      supportsCost += c;
      lines.push({ l: T.supports[k].label + " × " + n, small: incl[k] ? "En plus des " + T.supports[k].court[1] + " inclus" : "", a: c });
    });
    var creation = r2(base + varCost + langCost + supportsCost);
    var acompte = r2(creation * T.acompte), solde = r2(creation - acompte);

    var mensuel = r2(FF.mensuel * livrets);
    var moisPayesAn = 12 - T.moisOffertsAnnuel;
    var annuel = r2(mensuel * moisPayesAn);
    var forfaitAn1 = s.facturation === "annuel" ? annuel : r2(mensuel * 12);

    return {
      lines: lines, creation: creation, acompte: acompte, solde: solde, mensuel: mensuel, annuel: annuel,
      forfaitAn1: forfaitAn1, premiereAnnee: r2(creation + forfaitAn1),
      livrets: livrets, delai: F.delai,
      formule: F, forfait: FF, type: TY, inclus: incl, inclusTotal: inclTotal, couleur: coul
    };
  }
  function couleur(id, hex) {
    if (id === "perso" && /^#[0-9a-f]{6}$/i.test(hex || "")) return { id: "perso", nom: "Couleur personnalisée " + hex.toUpperCase(), hex: hex };
    var c = (T.couleurs || []).filter(function (x) { return x.id === id; })[0];
    return c || (T.couleurs || [{ id: "", nom: "", hex: "#1F3A5F" }])[0];
  }
  window.cdhComputeDevis = compute;

  /* ---------- interface ---------- */
  var form = document.getElementById("config");
  if (!form) return;
  var I = window.cdhIcon, esc = window.cdhEsc;
  var lastQty = { appartement: 1, maison: 1, gite: 1, chambres: 5, hotel: 24 };
  var KEY_DEVIS = "cdh:devis:v2";
  function modeLoc(type) { return ((T.types[type] || {}).mode || "logement") !== "chambres"; }
  var now0 = new Date();
  var numero = "CDH-" + String(now0.getFullYear()).slice(2) + String(now0.getMonth() + 1).padStart(2, "0") + String(now0.getDate()).padStart(2, "0") + "-" + String(Math.floor(100 + Math.random() * 900));

  function radioCard(name, value, title, small, price, checked) {
    return '<label class="opt"><input type="radio" name="' + name + '" value="' + value + '" id="' + name + "-" + value + '"' + (checked ? " checked" : "") + "><b>" + esc(title) + "</b>" +
      (price ? '<span class="p">' + price + "</span>" : "") + (small ? "<small>" + esc(small) + "</small>" : "") + "</label>";
  }

  document.getElementById("types").innerHTML = Object.keys(T.types).map(function (k, i) {
    return radioCard("type", k, T.types[k].label, T.types[k].detail, "", i === 0);
  }).join("");
  document.getElementById("formules").innerHTML = Object.keys(T.formules).map(function (k) {
    var f = T.formules[k];
    return radioCard("formule", k, f.nom, f.accroche + " Livré en " + f.delai + "*.", eur(f.prix), !!f.populaire);
  }).join("");
  document.getElementById("forfaits-choix").innerHTML = Object.keys(T.forfaits).map(function (k) {
    var f = T.forfaits[k];
    return radioCard("forfait", k, f.nom, f.accroche, eur(f.mensuel) + " / mois", !!f.populaire);
  }).join("");
  document.getElementById("couleurs").innerHTML = (T.couleurs || []).map(function (c, i) {
    return '<label class="coul" style="--c:' + c.hex + '" title="' + esc(c.nom) + '"><input type="radio" name="couleur" value="' + c.id + '" id="couleur-' + c.id + '"' + (i === 0 ? " checked" : "") + '><span class="dot" aria-hidden="true"></span><span>' + esc(c.nom) + "</span></label>";
  }).join("") +
    /* Premium : couleur personnalisée (spectre + code) */
    '<label class="coul perso" id="coul-perso" title="Couleur personnalisée (Premium)" hidden><input type="radio" name="couleur" value="perso" id="couleur-perso"><span class="dot" aria-hidden="true"></span><span>Couleur personnalisée</span></label>';
  document.getElementById("supports").innerHTML = Object.keys(T.supports).map(function (k) {
    var s = T.supports[k];
    return '<div class="qty-row"><label for="sup-' + k + '">' + esc(s.label) + ' <span class="en-plus">en plus</span><small>' + esc(s.detail) + '</small></label><span class="p">' + eur(s.prix) + " l'unité</span>" +
      '<div class="stepper"><button type="button" data-step="-1" data-for="sup-' + k + '" aria-label="Retirer un">−</button><input id="sup-' + k + '" name="sup-' + k + '" type="number" inputmode="numeric" min="0" max="500" value="0"><button type="button" data-step="1" data-for="sup-' + k + '" aria-label="Ajouter un">+</button></div></div>';
  }).join("");
  document.getElementById("langues-p").textContent = "+" + eur(T.options.langue.prix) + " / langue en plus";
  document.getElementById("variantes-p").textContent = eur(T.variante.prix) + " / variante";

  function state() {
    var fd = new FormData(form);
    var sup = {};
    Object.keys(T.supports).forEach(function (k) { sup[k] = clampInt(fd.get("sup-" + k), 0, 500); });
    var hexP = (document.getElementById("perso-hex").value || "").trim();
    return {
      type: T.types[fd.get("type")] ? fd.get("type") : Object.keys(T.types)[0],
      qty: clampInt(fd.get("qty"), 1, 200),
      variantes: clampInt(fd.get("variantes"), 0, 50),
      formule: fd.get("formule") || "confort",
      langues: clampInt(fd.get("langues"), 1, LANGUES_MAX),
      supports: sup,
      couleur: fd.get("couleur") || ((T.couleurs || [])[0] || {}).id,
      couleurPerso: /^#[0-9a-f]{6}$/i.test(hexP) ? hexP.toUpperCase() : "",
      nomMaquette: (document.getElementById("maq-nom").value || "").trim(),
      forfait: fd.get("forfait") || "autonomie",
      facturation: fd.get("facturation") || "mensuel"
    };
  }
  var LANGUES_MAX = 30; /* « illimité » : pas de plafond réel, seulement une borne de saisie */
  function clampInt(v, a, b) { v = parseInt(v, 10); if (isNaN(v)) v = a; return Math.min(b, Math.max(a, v)); }

  function lineHtml(x) {
    if (x.sec) return '<li class="fl sec">' + esc(x.sec) + "</li>";
    return '<li class="fl' + (x.minus ? " minus" : "") + '"><span class="l">' + esc(x.l) + (x.small ? "<small>" + esc(x.small) + "</small>" : "") + '</span><span class="d"></span><span class="a">' + (x.a ? (x.a < 0 ? "−" + eur(-x.a, true) : eur(x.a, true)) : "inclus") + "</span></li>";
  }

  var lastQuote = null, lastState = null;
  function update() {
    var s = state(), q = compute(s);
    lastQuote = q; lastState = s;
    var isLoc = modeLoc(s.type);
    var unit = isLoc ? "logement" : "chambre";
    document.getElementById("qty-legend").textContent = isLoc ? "Nombre de logements" : "Nombre de chambres";
    document.getElementById("qty-label").textContent = isLoc ? "Nombre de logements à équiper" : (s.type === "hotel" ? "Chambres de l'hôtel" : "Chambres de la maison");
    document.getElementById("qty-hint").textContent = isLoc ? "Un livret par logement, prix réduit dès le 2e" : "Un seul livret pour toutes les chambres, au prix d'un seul";
    document.getElementById("variantes-row").hidden = isLoc;
    document.getElementById("one-each-u").textContent = unit;
    var F = T.formules[s.formule];
    /* prix des forfaits : par mois, ou à l'année (12 mois barrés, puis le prix avec les mois offerts retirés) */
    Object.keys(T.forfaits).forEach(function (k) {
      var inp = document.getElementById("forfait-" + k), p = inp && inp.parentNode.querySelector(".p"); if (!p) return;
      var m = T.forfaits[k].mensuel;
      p.innerHTML = s.facturation === "annuel"
        ? '<s class="barre" title="' + esc(eur(m, true) + " × 12") + '">' + eur(r2(m * 12)) + "</s> " + eur(r2(m * (12 - T.moisOffertsAnnuel))) + " / an"
        : eur(m) + " / mois";
    });
    /* Langues : illimitées. Premium : toutes incluses (pas de compteur) ; Confort : 4 incluses, puis 29 € la langue, sans limite */
    var illim = !!F.languesIllimitees;
    document.getElementById("langues-stepper").hidden = illim;
    document.getElementById("langues-p").hidden = illim;
    document.getElementById("langues-illim").hidden = !illim;
    document.getElementById("langues-hint").textContent = illim
      ? "Langues illimitées, toutes incluses dans la formule " + F.nom
      : F.langues + " au choix incluses dans la formule " + F.nom + ", puis autant de langues que vous voulez";
    /* Couleur personnalisée : formule Premium seulement */
    var persoOk = !!F.couleurPerso, persoLab = document.getElementById("coul-perso");
    persoLab.hidden = !persoOk;
    if (!persoOk && s.couleur === "perso") { setRadio("couleur", ((T.couleurs || [])[0] || {}).id); s = state(); q = compute(s); lastQuote = q; lastState = s; }
    document.getElementById("perso-row").hidden = !(persoOk && s.couleur === "perso");
    var parts = Object.keys(q.inclus).map(function (k) { var n = q.inclus[k], SI = T.supports[k]; return n + " " + plural(n, SI.court[0], SI.court[1]); });
    document.getElementById("supports-inclus").textContent = parts.length ? "Inclus dans votre formule : " + parts.join(" et ") + (q.livrets > 1 ? " par livret" : "") + "." : "";
    document.getElementById("one-each-what").textContent = T.supports.porteCles.court[0];

    var today = new Date(), until = new Date(today.getTime() + (C.validiteDevisJours || 30) * 864e5);
    var fd = function (d) { return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); };
    var forfLine = s.facturation === "annuel"
      ? { l: "Forfait " + q.forfait.nom + " · annuel", small: (q.livrets > 1 ? q.livrets + " livrets · " : "") + T.moisOffertsAnnuel + " mois offerts", a: q.annuel, suffix: "/an" }
      : { l: "Forfait " + q.forfait.nom + " · mensuel", small: (q.livrets > 1 ? q.livrets + " livrets · " : "") + "Sans engagement", a: q.mensuel, suffix: "/mois" };
    var langLine = '<dt>Langues</dt><dd>' + (q.formule.languesIllimitees ? "Illimitées" : s.langues) + "</dd>";

    var h = '<div class="folio-head"><span class="brand">' + esc(C.marque) + "</span><small>Devis · livret d'accueil digital</small></div>" +
      '<dl class="folio-meta"><dt>N°</dt><dd>' + numero + "</dd><dt>Date</dt><dd>" + fd(today) + "</dd><dt>Valable jusqu'au</dt><dd>" + fd(until) + "</dd><dt>Établissement</dt><dd>" + esc(q.type.label) + "</dd>" + langLine + "</dl>" +
      '<ul class="folio-lines">' + q.lines.map(lineHtml).join("") +
      '<li class="fl sec">Forfait</li><li class="fl"><span class="l">' + esc(forfLine.l) + "<small>" + esc(forfLine.small) + '</small></span><span class="d"></span><span class="a">' + eur(forfLine.a, true) + forfLine.suffix + "</span></li>" +
      '<li class="fl"><span class="l">Console de modification incluse<small>Vous modifiez votre livret vous-même, quand vous voulez</small></span><span class="d"></span><span class="a">incluse</span></li>' +
      "</ul>" +
      '<div class="folio-tot"><div class="fl big"><span class="l">Création</span><span class="d"></span><span class="a">' + eur(q.creation, true) + '</span></div>' +
      '<div class="fl"><span class="l">Acompte à la commande (' + Math.round(T.acompte * 100) + ' %)</span><span class="d"></span><span class="a">' + eur(q.acompte, true) + "</span></div>" +
      '<div class="fl"><span class="l">Après ' + T.essaiJours + " jours d'essai : solde</span><span class=\"d\"></span><span class=\"a\">" + eur(q.solde, true) + "</span></div>" +
      '<div class="fl"><span class="l">Total 1re année</span><span class="d"></span><span class="a">' + eur(q.premiereAnnee, true) + "</span></div></div>" +
      '<p class="folio-note">Livraison : ' + esc(q.delai) + "*, à compter de la réception de vos informations. " + esc(C.conditions) + " " + esc(C.mentionTVA) + '.</p><p class="folio-note">' + esc(T.noteSupports) + "</p>";
    document.getElementById("folio").innerHTML = h;
    document.getElementById("bar-total").textContent = eur(q.creation);
    document.getElementById("bar-sub").textContent = "puis " + (s.facturation === "annuel" ? eur(q.annuel) + "/an" : eur(q.mensuel) + "/mois");
    document.getElementById("devis-texte").value = textSummary(s, q, numero);
    try { localStorage.setItem(KEY_DEVIS, JSON.stringify(s)); } catch (e) {}
    maquette(s, q);
  }

  function textSummary(s, q, num) {
    var loc = modeLoc(s.type);
    var out = ["Devis " + num + " (" + C.marque + ")", "Établissement : " + q.type.label + ", " + s.qty + " " + (loc ? plural(s.qty, "logement", "logements") : plural(s.qty, "chambre", "chambres")) + (!loc && s.variantes ? ", " + s.variantes + " " + plural(s.variantes, "variante", "variantes") : ""), "Langues : " + (q.formule.languesIllimitees ? "illimitées" : s.langues), "Maquette : nom imprimé « " + (s.nomMaquette || "—") + " », " + (q.couleur.id === "perso" ? "couleur personnalisée " + q.couleur.hex.toUpperCase() : "bandeau " + q.couleur.nom.toLowerCase()), ""];
    q.lines.forEach(function (x) {
      if (x.sec) { out.push("— " + x.sec); return; }
      out.push("  " + x.l + (x.small ? " (" + x.small + ")" : "") + " : " + (x.a ? (x.a < 0 ? "-" : "") + eur(Math.abs(x.a), true) : "inclus"));
    });
    out.push("— Forfait " + q.forfait.nom + " : " + (s.facturation === "annuel" ? eur(q.annuel, true) + "/an (" + T.moisOffertsAnnuel + " mois offerts)" : eur(q.mensuel, true) + "/mois") + ", console de modification incluse");
    out.push("", "Création : " + eur(q.creation, true), "Acompte à la commande : " + eur(q.acompte, true), "Solde après " + T.essaiJours + " jours d'essai : " + eur(q.solde, true), "Total 1re année : " + eur(q.premiereAnnee, true), "Livraison : " + q.delai + "*", T.noteSupports);
    return out.join("\n");
  }

  // Steppers
  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-step]");
    if (!b) return;
    var inp = document.getElementById(b.dataset.for);
    var v = (parseInt(inp.value, 10) || 0) + parseInt(b.dataset.step, 10);
    v = Math.min(+inp.max, Math.max(+inp.min, v));
    inp.value = v;
    if (inp.id === "qty") lastQty[state().type] = v;
    update();
  });
  form.addEventListener("input", function (e) {
    if (e.target.id === "qty") lastQty[state().type] = clampInt(e.target.value, 1, 200);
    update();
  });
  var prevFormule = null;
  function syncLangues() {
    var k = state().formule, F = T.formules[k], el = document.getElementById("langues");
    var v = parseInt(el.value, 10) || 1;
    // Si le visiteur n'avait pas touché aux langues, on suit la formule ; sinon on ne descend jamais sous le nombre inclus.
    if (prevFormule && T.formules[prevFormule] && v === T.formules[prevFormule].langues) el.value = F.langues;
    else if (v < F.langues) el.value = F.langues;
    prevFormule = k;
  }
  form.addEventListener("change", function (e) {
    if (e.target.name === "type") {
      document.getElementById("qty").value = lastQty[e.target.value];
    }
    if (e.target.name === "formule") syncLangues();
    if (e.target.type === "number") e.target.value = clampInt(e.target.value, +e.target.min, +e.target.max);
    update();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  document.getElementById("one-each").addEventListener("click", function () {
    var s = state(), F = T.formules[s.formule];
    var k = "porteCles";
    var inc = ((F.supportsInclus || {})[k] || 0) * (modeLoc(s.type) ? s.qty : 1);
    document.getElementById("sup-" + k).value = Math.max(0, s.qty - inc);
    update();
  });

  // Impression : seulement hors cadre (sur votre site en ligne)
  var printBtn = document.getElementById("print-devis");
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed) printBtn.hidden = true;
  else printBtn.addEventListener("click", function () { window.print(); });

  /* ---------- maquette : porte-clés + livret d'exemple, avec la photo et la couleur du visiteur ---------- */
  var MAQ_ID = "nid-des-tanneurs", maqFrame = document.getElementById("maq-frame"), maqReady = false, maqPhoto = "", maqTimer = 0, maqLast = null;
  try { document.getElementById("maq-qr").innerHTML = window.cdhQrSvg(window.cdhLivretUrl(MAQ_ID), { fg: "#182B40", margin: 1, size: 66 }); } catch (e) {}
  function maqFit(nom) {
    var t = document.getElementById("maq-name");
    t.textContent = (nom || "").toUpperCase() || " ";
    t.setAttribute("font-size", "8"); t.setAttribute("letter-spacing", "1.4");
    try { var w = t.getComputedTextLength(), max = 72; if (w > max) { var k = max / w; t.setAttribute("font-size", (8 * k).toFixed(2)); t.setAttribute("letter-spacing", (1.4 * k).toFixed(2)); } } catch (e) {}
  }
  function maqEnvoyer() {
    if (!maqReady || !maqLast || !maqFrame.contentWindow) return;
    var base = (window.CDH_LIVRETS || {})[MAQ_ID]; if (!base) return;
    var d = JSON.parse(JSON.stringify(base));
    d.theme = d.theme || {};
    d.theme.accent = maqLast.hex;
    if (maqLast.nom) d.nom = maqLast.nom;
    if (maqPhoto) d.theme.couverture = maqPhoto;
    try { maqFrame.contentWindow.postMessage({ type: "cdh:render", livret: d, lang: "fr" }, "*"); } catch (e) {}
  }
  function maquette(s, q) {
    document.getElementById("maq-band").setAttribute("fill", q.couleur.hex);
    maqFit(s.nomMaquette);
    maqLast = { hex: q.couleur.hex, nom: s.nomMaquette };
    clearTimeout(maqTimer); maqTimer = setTimeout(maqEnvoyer, 150);
  }
  window.addEventListener("message", function (e) {
    if (maqFrame && e.source === maqFrame.contentWindow && e.data && e.data.type === "cdh:ready") { maqReady = true; maqEnvoyer(); }
  });
  /* Le livret d'aperçu ne se charge que lorsque la maquette approche de l'écran */
  (function () {
    var box = document.getElementById("maquette"), go = function () { if (!maqFrame.getAttribute("src")) maqFrame.setAttribute("src", "livret.html"); };
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { go(); io.disconnect(); } }, { rootMargin: "400px 0px" }); io.observe(box); }
    else go();
  })();
  /* Photo : réduite sur l'appareil, jamais envoyée */
  function photoReduite(file) {
    return new Promise(function (ok, ko) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        try { ok(c.toDataURL("image/jpeg", .82)); } catch (e) { ko(e); }
      };
      im.onerror = function () { URL.revokeObjectURL(u); ko(); };
      im.src = u;
    });
  }
  document.getElementById("maq-photo").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    photoReduite(f).then(function (url) { maqPhoto = url; document.getElementById("maq-photo-rm").hidden = false; maqEnvoyer(); }, function () {});
  });
  document.getElementById("maq-photo-rm").addEventListener("click", function () { maqPhoto = ""; this.hidden = true; maqEnvoyer(); });
  /* Couleur personnalisée : le spectre et le code restent synchronisés, et la pastille se coche toute seule */
  function persoSync(src) {
    var col = document.getElementById("perso-color"), hex = document.getElementById("perso-hex");
    if (src === col) hex.value = col.value.toUpperCase();
    else { var v = hex.value.trim(); if (v && v[0] !== "#") v = "#" + v; if (/^#[0-9a-f]{6}$/i.test(v)) col.value = v.toLowerCase(); }
    document.getElementById("coul-perso").style.setProperty("--c", col.value);
    setRadio("couleur", "perso");
  }
  form.addEventListener("input", function (e) { if (e.target.id === "perso-color" || e.target.id === "perso-hex") persoSync(e.target); }, true);

  // Restaurer le dernier devis de ce visiteur
  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY_DEVIS) || "null");
    if (saved && T.types[saved.type]) {
      setRadio("type", saved.type); setRadio("formule", saved.formule); setRadio("forfait", saved.forfait); setRadio("facturation", saved.facturation);
      document.getElementById("qty").value = saved.qty; lastQty[saved.type] = saved.qty;
      document.getElementById("langues").value = saved.langues;
      if (saved.variantes != null) document.getElementById("variantes").value = saved.variantes;
      Object.keys(saved.supports || {}).forEach(function (k) { var el = document.getElementById("sup-" + k); if (el) el.value = saved.supports[k]; });
      if (saved.couleurPerso) { document.getElementById("perso-hex").value = saved.couleurPerso; document.getElementById("perso-color").value = saved.couleurPerso.toLowerCase(); }
      if (saved.nomMaquette) document.getElementById("maq-nom").value = saved.nomMaquette;
      if (saved.couleur) setRadio("couleur", saved.couleur);
    }
  } catch (e) {}

  function setRadio(name, val) {
    var el = form.querySelector('input[name="' + name + '"][value="' + val + '"]');
    if (el) el.checked = true;
  }
  window.cdhDevis = {
    choose: function (name, val) { setRadio(name, val); if (name === "formule") syncLangues(); update(); }
  };
  if (!saved) syncLangues(); else prevFormule = saved.formule;
  update();

  /* ---------- barre résumé (mobile) ---------- */
  var bar = document.getElementById("devis-bar");
  if ("IntersectionObserver" in window && bar) {
    var inDevis = false, folioVisible = false;
    var refresh = function () { bar.classList.toggle("on", inDevis && !folioVisible); };
    new IntersectionObserver(function (en) { inDevis = en[0].isIntersecting; refresh(); }, { rootMargin: "0px 0px -40% 0px" }).observe(document.getElementById("config"));
    new IntersectionObserver(function (en) { folioVisible = en[0].isIntersecting; refresh(); }).observe(document.getElementById("folio"));
  }

  /* ---------- demande de devis ---------- */
  var rf = document.getElementById("request-form");
  var status = document.getElementById("r-status");
  function setErr(input, msg) {
    var lab = input.closest("label");
    var old = lab.querySelector(".err"); if (old) old.remove();
    input.removeAttribute("aria-invalid");
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      var e = document.createElement("span"); e.className = "err"; e.textContent = msg; lab.appendChild(e);
    }
  }
  rf.addEventListener("submit", function (e) {
    e.preventDefault();
    var nom = document.getElementById("r-nom"), mail = document.getElementById("r-email");
    var ok = true;
    setErr(nom, nom.value.trim() ? "" : "Indiquez votre nom pour que l'on sache à qui répondre.");
    if (!nom.value.trim()) ok = false;
    var mv = mail.value.trim();
    var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mv);
    setErr(mail, mailOk ? "" : (mv ? "Cette adresse e-mail semble incomplète (exemple : prenom@domaine.fr)." : "Indiquez votre e-mail pour recevoir le devis."));
    if (!mailOk) ok = false;
    var exec = document.getElementById("r-exec"), statutOk = !!rf.querySelector('input[name="statut"]:checked');
    var statutBox = rf.querySelector(".statut"), oldS = statutBox.querySelector(".err"); if (oldS) oldS.remove();
    if (!statutOk) { var es = document.createElement("span"); es.className = "err"; es.textContent = "Indiquez si vous commandez en tant que particulier ou professionnel."; statutBox.appendChild(es); if (ok) rf.querySelector('input[name="statut"]').focus(); ok = false; }
    setErr(exec, exec.checked ? "" : "Cochez cette case pour que nous puissions démarrer votre livret.");
    if (!exec.checked) { if (ok) exec.focus(); ok = false; }
    if (!ok) { if (!nom.value.trim()) nom.focus(); else if (!mailOk) mail.focus(); return; }

    update();
    var btn = document.getElementById("r-submit");
    btn.disabled = true; btn.textContent = "Envoi…";
    /* Champs propres à Netlify : inutiles (et bruyants dans le mail) avec Formspree */
    var fd0 = new FormData(rf);
    if (C.formulaireDevis) { fd0.delete("form-name"); fd0.delete("_gotcha"); if (document.querySelector("#request-form [name=_gotcha]").value) { btn.disabled = false; btn.textContent = "Envoyer ma demande"; return; } }
    var body = new URLSearchParams(fd0).toString();
    var done = function (sent) {
      btn.disabled = false; btn.textContent = "Envoyer ma demande";
      status.hidden = false;
      if (sent) {
        status.className = "form-status ok";
        status.innerHTML = "<b>Demande envoyée.</b><span>Merci " + esc(nom.value.trim().split(" ")[0]) + " ! On vous répond sous 24 h à " + esc(mv) + ".</span>" +
          '<span class="suite">En attendant, vous pouvez déjà décrire votre logement : le questionnaire prend environ 30 minutes et vos réponses se sauvegardent.</span>' +
          '<a class="btn sapin small" href="questionnaire.html">Remplir mon questionnaire maintenant</a>';
        /* Les informations déjà données sont reprises dans le questionnaire (stockées sur l'appareil, pas dans l'adresse) */
        try { var st = state(); localStorage.setItem("cdh:questionnaire:prefill", JSON.stringify({ nom: nom.value.trim(), email: mv, tel: document.getElementById("r-tel").value.trim(), logement: document.getElementById("r-lieu").value.trim(), formule: st.formule, type: st.type, couleur: st.couleur, couleurPerso: st.couleurPerso, nomMaquette: st.nomMaquette })); } catch (e) {}
      } else {
        status.className = "form-status info";
        var recap = "Nom : " + nom.value.trim() + "\nE-mail : " + mv + "\nTéléphone : " + document.getElementById("r-tel").value + "\nÉtablissement : " + document.getElementById("r-lieu").value + "\nMessage : " + document.getElementById("r-msg").value + "\n\n" + document.getElementById("devis-texte").value;
        status.innerHTML = "<b>L'envoi automatique n'est pas disponible sur cette version du site.</b><span>Copiez le récapitulatif et envoyez-le à <b>" + esc(C.email) + "</b>.</span><pre id=\"recap\">" + esc(recap) + '</pre><div><button type="button" class="btn small" id="copy-recap">Copier le récapitulatif</button></div>';
        document.getElementById("copy-recap").addEventListener("click", function () {
          window.cdhCopy(recap, document.getElementById("recap")).then(function (c) {
            document.getElementById("copy-recap").textContent = c ? "Copié" : "Texte sélectionné : copiez-le";
          });
        });
      }
    };
    // Où envoyer : Formspree (ou autre service) si configuré, Netlify Forms sur Netlify, sinon récapitulatif à copier
    var endpoint = C.formulaireDevis || (/netlify\.app$/.test(location.hostname) || C.netlify ? (location.pathname.replace(/[^/]*$/, "") || "/") : "");
    if (!endpoint) { done(false); return; }
    try {
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" }, body: body })
        .then(function (r) { done(r.ok); }, function () { done(false); });
    } catch (err) { done(false); }
  });
})();
