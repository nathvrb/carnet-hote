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
  function compute(s) {
    var F = T.formules[s.formule], FF = T.forfaits[s.forfait], TY = T.types[s.type];
    var isLoc = s.type === "location";
    var livrets = isLoc ? s.qty : 1;
    var lines = [];
    var remise = 0;
    if (isLoc) T.remises.forEach(function (r) { if (livrets >= r.min) remise = r.taux; });

    lines.push({ sec: "Création · paiement unique" });
    var base = F.prix * livrets;
    lines.push({ l: "Livret " + F.nom + (isLoc && livrets > 1 ? " × " + livrets : ""), small: isLoc ? livrets + " " + plural(livrets, "logement", "logements") + " × " + eur(F.prix) : TY.label + " · " + s.qty + " " + plural(s.qty, "chambre", "chambres"), a: base });

    var maj = 0;
    if (s.type === "hotel") {
      for (var i = 0; i < T.majorationHotel.length; i++) {
        if (s.qty <= T.majorationHotel[i].jusqua) { maj = T.majorationHotel[i].prix; if (maj) lines.push({ l: "Hôtel " + T.majorationHotel[i].label, small: "Contenu plus dense : services, restaurant, spa", a: maj }); break; }
      }
    }
    var langSup = Math.max(0, s.langues - F.langues);
    var langCost = langSup * T.options.langue.prix * livrets;
    if (langSup) lines.push({ l: langSup + " " + plural(langSup, "langue supplémentaire", "langues supplémentaires"), small: s.langues + " langues au total, " + F.langues + " " + plural(F.langues, "incluse", "incluses") + (livrets > 1 ? " · × " + livrets + " livrets" : ""), a: langCost });

    var remiseMt = r2((base + maj + langCost) * remise);
    if (remiseMt) lines.push({ l: "Remise multi-logements −" + Math.round(remise * 100) + " %", a: -remiseMt, minus: true });

    var incl = {}, inclTotal = 0;
    Object.keys(F.supportsInclus || {}).forEach(function (k) { incl[k] = F.supportsInclus[k] * livrets; inclTotal += incl[k]; });
    var sup = s.supports || {};
    var coul = couleur(s.couleur);
    Object.keys(T.supports).forEach(function (k) {
      if (!incl[k]) return;
      var SI = T.supports[k];
      lines.push({ l: incl[k] + " " + plural(incl[k], SI.court[0], SI.court[1]) + " inclus", small: SI.label + (k === "porteCles" ? " · bandeau " + coul.nom.toLowerCase() : ""), a: 0 });
    });
    var supportsCost = 0;
    Object.keys(T.supports).forEach(function (k) {
      var n = sup[k] || 0;
      if (!n) return;
      var c = n * T.supports[k].prix;
      supportsCost += c;
      lines.push({ l: T.supports[k].label + " × " + n, small: incl[k] ? "En plus des " + T.supports[k].court[1] + " inclus" : "", a: c });
    });
    var express = s.options.express ? T.options.express.prix : 0;
    if (express) lines.push({ l: T.options.express.label, a: express });

    var creation = r2(base + maj + langCost - remiseMt + supportsCost + express);

    var mensuel = r2(FF.mensuel * livrets * (1 - remise));
    var moisPayesAn = 12 - T.moisOffertsAnnuel;
    var annuel = r2(mensuel * moisPayesAn);
    var offerts = F.moisOfferts || 0;
    var forfaitAn1 = s.facturation === "annuel" ? r2(mensuel * Math.max(0, moisPayesAn - offerts)) : r2(mensuel * (12 - offerts));

    return {
      lines: lines, creation: creation, mensuel: mensuel, annuel: annuel, offerts: offerts,
      forfaitAn1: forfaitAn1, premiereAnnee: r2(creation + forfaitAn1),
      livrets: livrets, remise: remise, delai: express ? T.options.express.delai : F.delai,
      formule: F, forfait: FF, type: TY, inclus: incl, inclusTotal: inclTotal, couleur: coul
    };
  }
  function couleur(id) {
    var c = (T.couleurs || []).filter(function (x) { return x.id === id; })[0];
    return c || (T.couleurs || [{ id: "", nom: "", hex: "#1F3A5F" }])[0];
  }
  window.cdhComputeDevis = compute;

  /* ---------- interface ---------- */
  var form = document.getElementById("config");
  if (!form) return;
  var I = window.cdhIcon, esc = window.cdhEsc;
  var lastQty = { location: 1, maison: 5, hotel: 24 };
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
    return radioCard("formule", k, f.nom, f.accroche + " Livré en " + f.delai + ".", eur(f.prix), !!f.populaire);
  }).join("");
  document.getElementById("forfaits-choix").innerHTML = Object.keys(T.forfaits).map(function (k) {
    var f = T.forfaits[k];
    return radioCard("forfait", k, f.nom, f.accroche, eur(f.mensuel) + " / mois", !!f.populaire);
  }).join("");
  document.getElementById("couleurs").innerHTML = (T.couleurs || []).map(function (c, i) {
    return '<label class="coul" style="--c:' + c.hex + '" title="' + esc(c.nom) + '"><input type="radio" name="couleur" value="' + c.id + '" id="couleur-' + c.id + '"' + (i === 0 ? " checked" : "") + '><span class="dot" aria-hidden="true"></span><span>' + esc(c.nom) + "</span></label>";
  }).join("");
  document.getElementById("supports").innerHTML = Object.keys(T.supports).map(function (k) {
    var s = T.supports[k];
    return '<div class="qty-row"><label for="sup-' + k + '">' + esc(s.label) + ' <span class="en-plus">en plus</span><small>' + esc(s.detail) + '</small></label><span class="p">' + eur(s.prix) + " l'unité</span>" +
      '<div class="stepper"><button type="button" data-step="-1" data-for="sup-' + k + '" aria-label="Retirer un">−</button><input id="sup-' + k + '" name="sup-' + k + '" type="number" inputmode="numeric" min="0" max="500" value="0"><button type="button" data-step="1" data-for="sup-' + k + '" aria-label="Ajouter un">+</button></div></div>';
  }).join("");
  document.getElementById("options").innerHTML = ["express"].map(function (k) {
    var o = T.options[k];
    return '<label class="opt check" id="opt-' + k + '-card"><input type="checkbox" name="opt-' + k + '" id="opt-' + k + '"><span class="tick">' + I("check", "ico-s") + "</span><b>" + esc(o.label) + '</b><span class="p">+' + eur(o.prix) + '</span><small id="opt-' + k + '-small">' + esc(o.detail ? o.detail + " · " : "") + (o.par === "livret" ? "Par logement" : "Par commande") + "</small></label>";
  }).join("");
  document.getElementById("langues-p").textContent = "+" + eur(T.options.langue.prix) + " / langue en plus";

  function state() {
    var fd = new FormData(form);
    var sup = {};
    Object.keys(T.supports).forEach(function (k) { sup[k] = clampInt(fd.get("sup-" + k), 0, 500); });
    return {
      type: fd.get("type") || "location",
      qty: clampInt(fd.get("qty"), 1, 200),
      formule: fd.get("formule") || "confort",
      langues: clampInt(fd.get("langues"), 1, 8),
      supports: sup,
      couleur: fd.get("couleur") || ((T.couleurs || [])[0] || {}).id,
      options: { express: !!fd.get("opt-express") },
      forfait: fd.get("forfait") || "autonomie",
      facturation: fd.get("facturation") || "mensuel"
    };
  }
  function clampInt(v, a, b) { v = parseInt(v, 10); if (isNaN(v)) v = a; return Math.min(b, Math.max(a, v)); }

  function lineHtml(x) {
    if (x.sec) return '<li class="fl sec">' + esc(x.sec) + "</li>";
    return '<li class="fl' + (x.minus ? " minus" : "") + '"><span class="l">' + esc(x.l) + (x.small ? "<small>" + esc(x.small) + "</small>" : "") + '</span><span class="d"></span><span class="a">' + (x.a ? (x.a < 0 ? "−" + eur(-x.a, true) : eur(x.a, true)) : "inclus") + "</span></li>";
  }

  var lastQuote = null, lastState = null;
  function update() {
    var s = state(), q = compute(s);
    lastQuote = q; lastState = s;
    var isLoc = s.type === "location";
    var unit = isLoc ? "logement" : "chambre";
    document.getElementById("qty-legend").textContent = isLoc ? "Nombre de logements" : "Nombre de chambres";
    document.getElementById("qty-label").textContent = isLoc ? "Logements équipés d'un livret" : (s.type === "hotel" ? "Chambres de l'hôtel" : "Chambres de la maison");
    document.getElementById("qty-hint").textContent = isLoc ? "Un livret par logement, remise dès le 2e" : (s.type === "hotel" ? "Un seul livret ; tarif selon la taille de l'hôtel" : "Un seul livret, un QR code par chambre");
    document.getElementById("one-each-u").textContent = unit;
    var F = T.formules[s.formule];
    document.getElementById("langues-hint").textContent = F.langues + " " + plural(F.langues, "incluse", "incluses") + " dans la formule " + F.nom;
    var parts = Object.keys(q.inclus).map(function (k) { var n = q.inclus[k], SI = T.supports[k]; return n + " " + plural(n, SI.court[0], SI.court[1]); });
    document.getElementById("supports-inclus").textContent = parts.length ? "Inclus dans votre formule : " + parts.join(" et ") + (q.livrets > 1 ? " par livret" : "") + "." : "";
    var oneK = s.type === "location" ? "porteCles" : "chevalet";
    document.getElementById("one-each-what").textContent = T.supports[oneK].court[0];

    var today = new Date(), until = new Date(today.getTime() + (C.validiteDevisJours || 30) * 864e5);
    var fd = function (d) { return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); };
    var forfLine = s.facturation === "annuel"
      ? { l: "Forfait " + q.forfait.nom + " · annuel", small: (q.livrets > 1 ? q.livrets + " livrets · " : "") + T.moisOffertsAnnuel + " mois offerts", a: q.annuel, suffix: "/an" }
      : { l: "Forfait " + q.forfait.nom + " · mensuel", small: q.livrets > 1 ? q.livrets + " livrets" + (q.remise ? ", remise incluse" : "") : "Sans engagement", a: q.mensuel, suffix: "/mois" };

    var h = '<div class="folio-head"><span class="brand">' + esc(C.marque) + "</span><small>Devis · livret d'accueil digital</small></div>" +
      '<dl class="folio-meta"><dt>N°</dt><dd>' + numero + "</dd><dt>Date</dt><dd>" + fd(today) + "</dd><dt>Valable jusqu'au</dt><dd>" + fd(until) + "</dd><dt>Établissement</dt><dd>" + esc(q.type.label) + "</dd></dl>" +
      '<ul class="folio-lines">' + q.lines.map(lineHtml).join("") +
      '<li class="fl sec">Forfait</li><li class="fl"><span class="l">' + esc(forfLine.l) + "<small>" + esc(forfLine.small) + '</small></span><span class="d"></span><span class="a">' + eur(forfLine.a, true) + forfLine.suffix + "</span></li>" +
      (q.offerts ? '<li class="fl minus"><span class="l">' + q.offerts + ' mois de forfait offerts<small>Inclus dans la formule Premium</small></span><span class="d"></span><span class="a">offerts</span></li>' : "") +
      "</ul>" +
      '<div class="folio-tot"><div class="fl big"><span class="l">Création</span><span class="d"></span><span class="a">' + eur(q.creation, true) + '</span></div>' +
      '<div class="fl"><span class="l">Puis</span><span class="d"></span><span class="a">' + (s.facturation === "annuel" ? eur(q.annuel, true) + "/an" : eur(q.mensuel, true) + "/mois") + "</span></div>" +
      '<div class="fl"><span class="l">Total 1re année</span><span class="d"></span><span class="a">' + eur(q.premiereAnnee, true) + "</span></div></div>" +
      '<p class="folio-note">Livraison : ' + esc(q.delai) + ", à compter de la réception de vos informations. " + esc(C.conditions) + " " + esc(C.mentionTVA) + ".</p>";
    document.getElementById("folio").innerHTML = h;
    document.getElementById("bar-total").textContent = eur(q.creation);
    document.getElementById("bar-sub").textContent = "puis " + (s.facturation === "annuel" ? eur(q.annuel) + "/an" : eur(q.mensuel) + "/mois");
    document.getElementById("devis-texte").value = textSummary(s, q, numero);
    try { localStorage.setItem("cdh:devis", JSON.stringify(s)); } catch (e) {}
  }

  function textSummary(s, q, num) {
    var out = ["Devis " + num + " (" + C.marque + ")", "Établissement : " + q.type.label + ", " + s.qty + " " + (s.type === "location" ? plural(s.qty, "logement", "logements") : plural(s.qty, "chambre", "chambres")), ""];
    q.lines.forEach(function (x) {
      if (x.sec) { out.push("— " + x.sec); return; }
      out.push("  " + x.l + (x.small ? " (" + x.small + ")" : "") + " : " + (x.a ? (x.a < 0 ? "-" : "") + eur(Math.abs(x.a), true) : "inclus"));
    });
    out.push("— Forfait " + q.forfait.nom + " : " + (s.facturation === "annuel" ? eur(q.annuel, true) + "/an" : eur(q.mensuel, true) + "/mois") + (q.offerts ? " (" + q.offerts + " mois offerts)" : ""));
    out.push("", "Création : " + eur(q.creation, true), "Total 1re année : " + eur(q.premiereAnnee, true), "Livraison : " + q.delai);
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
    var k = s.type === "location" ? "porteCles" : "chevalet";
    var inc = ((F.supportsInclus || {})[k] || 0) * (s.type === "location" ? s.qty : 1);
    document.getElementById("sup-" + k).value = Math.max(0, s.qty - inc);
    update();
  });

  // Impression : seulement hors cadre (sur votre site en ligne)
  var printBtn = document.getElementById("print-devis");
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed) printBtn.hidden = true;
  else printBtn.addEventListener("click", function () { window.print(); });

  // Restaurer le dernier devis de ce visiteur
  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("cdh:devis") || "null");
    if (saved && T.types[saved.type]) {
      setRadio("type", saved.type); setRadio("formule", saved.formule); setRadio("forfait", saved.forfait); setRadio("facturation", saved.facturation);
      document.getElementById("qty").value = saved.qty; lastQty[saved.type] = saved.qty;
      document.getElementById("langues").value = saved.langues;
      Object.keys(saved.supports || {}).forEach(function (k) { var el = document.getElementById("sup-" + k); if (el) el.value = saved.supports[k]; });
      if (saved.couleur) setRadio("couleur", saved.couleur);
      document.getElementById("opt-express").checked = !!(saved.options && saved.options.express);
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
    if (!ok) { (nom.value.trim() ? mail : nom).focus(); return; }

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
          '<span class="suite">En attendant, vous pouvez déjà décrire votre logement : le questionnaire prend environ 15 minutes et vos réponses se sauvegardent.</span>' +
          '<a class="btn sapin small" href="questionnaire.html">Remplir mon questionnaire maintenant</a>';
        /* Les informations déjà données sont reprises dans le questionnaire (stockées sur l'appareil, pas dans l'adresse) */
        try { var st = state(); localStorage.setItem("cdh:questionnaire:prefill", JSON.stringify({ nom: nom.value.trim(), email: mv, tel: document.getElementById("r-tel").value.trim(), logement: document.getElementById("r-lieu").value.trim(), formule: st.formule, type: st.type })); } catch (e) {}
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
