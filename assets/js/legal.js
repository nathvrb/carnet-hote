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
  var o = document.getElementById("grille-options");
  if (o && T) {
    var ls = [
      ["Langue supplémentaire", eur(T.options.langue.prix) + " par livret"],
      [T.options.express.label, eur(T.options.express.prix) + " par commande"],
      ["Modification faite par nos soins, à l'unité (forfait Autonomie)", eur(T.modificationPonctuelle)]
    ].concat(Object.keys(T.supports).map(function (k) { return [T.supports[k].label + " en plus", eur(T.supports[k].prix) + " l'unité"]; }));
    o.innerHTML = "<table><tbody>" + ls.map(function (x) { return "<tr><td>" + esc(x[0]) + '</td><td class="p">' + esc(x[1]) + "</td></tr>"; }).join("") + "</tbody></table>";
  }
})();
