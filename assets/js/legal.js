/* Pages juridiques : reprend les coordonnées de config.js et la grille de tarifs.js */
(function () {
  var C = window.CDH_CONFIG || {}, T = window.CDH_TARIFS;
  var A_COMPLETER = { editeur: "nom et prénom de l'exploitant", adresse: "adresse postale professionnelle", mediateur: "nom et coordonnées du médiateur de la consommation" };
  function eur(n) { return n.toLocaleString("fr-FR", { minimumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 }).replace(/ /g, " ") + " €"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var k = el.dataset.cfg, v = C[k];
    if (k === "siret" && v && /en cours/i.test(v)) v = "";
    if (v) { if (k === "email") el.innerHTML = '<a href="mailto:' + esc(v) + '">' + esc(v) + "</a>"; else el.textContent = v; }
    else el.innerHTML = '<mark class="a-completer">[à compléter : ' + esc(A_COMPLETER[k] || (k === "siret" ? "numéro SIRET, en cours d'immatriculation" : k)) + "]</mark>";
  });
  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.marque || "Carnet d'Hôte"; });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  document.querySelectorAll("[data-valide]").forEach(function (el) { el.textContent = C.validiteDevisJours || 30; });
  var g = document.getElementById("grille");
  if (g && T) {
    var rows = [];
    Object.keys(T.formules).forEach(function (k) {
      var f = T.formules[k];
      rows.push("<tr><td><b>" + esc(f.nom) + "</b></td><td>" + f.inclus.map(esc).join("<br>") + '</td><td class="p">' + eur(f.prix) + "</td></tr>");
    });
    g.innerHTML = '<table><thead><tr><th>Formule de création</th><th>Contenu</th><th>Prix par livret</th></tr></thead><tbody>' + rows.join("") + "</tbody></table>";
  }
  var h = document.getElementById("grille-forfaits");
  if (h && T) {
    var r = Object.keys(T.forfaits).map(function (k) {
      var f = T.forfaits[k], an = Math.round(f.mensuel * (12 - T.moisOffertsAnnuel) * 100) / 100;
      return "<tr><td><b>" + esc(f.nom) + "</b></td><td>" + f.inclus.map(esc).join("<br>") + '</td><td class="p">' + eur(f.mensuel) + " par mois<br>ou " + eur(an) + " par an</td></tr>";
    });
    h.innerHTML = '<table><thead><tr><th>Forfait</th><th>Contenu</th><th>Prix par livret</th></tr></thead><tbody>' + r.join("") + "</tbody></table>";
  }
  var mc = document.getElementById("multi-cgv");
  if (mc && T) mc.textContent = Object.keys(T.formules).map(function (k) {
    var f = T.formules[k], ps = f.prixSuivants || [];
    return "en " + f.nom + ", " + eur(f.prix) + " le 1er, " + ps.map(function (p, i) { return eur(p) + (i === ps.length - 1 ? " pour le " + (i + 2) + "e et chacun des suivants" : " le " + (i + 2) + "e"); }).join(", ");
  }).join(" ; ");
  var lc = document.getElementById("livr-cgv"); if (lc && T.livraisonEurope) lc.textContent = eur(T.livraisonEurope.prix);
  var vc = document.getElementById("variante-cgv"); if (vc && T) vc.textContent = eur(T.variante.prix);
  var o = document.getElementById("grille-options");
  if (o && T) {
    var ls = [
      [T.options.langue.label, eur(T.options.langue.prix) + " par livret"],
      [T.variante.label + " (hôtels et maisons d'hôtes)", eur(T.variante.prix) + " par type de chambre"],
      ["Modification faite par nos soins, à l'unité (forfait Autonomie)", eur(T.modificationPonctuelle)],
      [T.livraisonEurope.label, eur(T.livraisonEurope.prix) + " par commande"]
    ].concat(Object.keys(T.supports).map(function (k) { return [T.supports[k].label + " en plus", eur(T.supports[k].prix) + " l'unité"]; }));
    o.innerHTML = "<table><tbody>" + ls.map(function (x) { return "<tr><td>" + esc(x[0]) + '</td><td class="p">' + esc(x[1]) + "</td></tr>"; }).join("") + "</tbody></table>";
  }

  /* Supprimer mes données : effacement local et demande de suppression */
  var eb = document.getElementById("effacer-local");
  if (eb) eb.addEventListener("click", function () {
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try { if (window.caches) caches.keys().then(function (ks) { ks.forEach(function (k) { if (k.indexOf("cdh-") === 0) caches.delete(k); }); }); } catch (e) {}
    var ok = document.getElementById("effacer-local-ok"); if (ok) ok.hidden = false;
  });
  var sf = document.getElementById("form-suppression");
  if (sf) sf.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var st = document.getElementById("s-status"), mail = document.getElementById("s-email"), btn = document.getElementById("s-submit");
    var mv = mail.value.trim(), okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mv);
    var portee = Array.prototype.map.call(sf.querySelectorAll("input[name=portee]:checked"), function (x) { return x.value; });
    st.hidden = false; st.className = "form-status";
    if (!okMail) { st.textContent = "Indiquez l'adresse e-mail de votre dossier, pour que nous puissions vous répondre."; mail.focus(); return; }
    if (!portee.length) { st.textContent = "Cochez au moins une case : que faut-il supprimer ?"; return; }
    if (sf.querySelector("[name=_gotcha]").value) return;
    var endpoint = C.formulaireQuestionnaire || C.formulaireDevis || "";
    var texte = "Demande de suppression de données\nE-mail du dossier : " + mv + "\nÀ supprimer : " + portee.join(", ");
    var repli = function () {
      st.className = "form-status ko";
      st.innerHTML = "L'envoi n'a pas abouti. Écrivez-nous à <a href=\"mailto:" + esc(C.email || "") + "?subject=" + encodeURIComponent("Demande de suppression de données") + "&body=" + encodeURIComponent(texte) + "\">" + esc(C.email || "") + "</a>.";
      btn.disabled = false;
    };
    if (!endpoint) { repli(); return; }
    btn.disabled = true;
    var body = new URLSearchParams({ _subject: "Demande de suppression de données", email: mv, portee: portee.join(", "), message: texte }).toString();
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" }, body: body })
      .then(function (r) { if (!r.ok) throw 0; st.className = "form-status ok"; st.textContent = "Demande envoyée. Nous vérifions qu'elle vient bien de l'adresse de votre dossier, puis nous supprimons les données et nous vous le confirmons par e-mail dans un délai d'un mois."; sf.reset(); btn.disabled = false; })
      .catch(repli);
  });
})();
