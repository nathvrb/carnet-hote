/* Espace client : connexion, mot de passe oublié, tableau de bord des livrets. */
(function () {
  var C = window.CDH_CONFIG || {}, K = window.CDH_CLOUD, esc = window.cdhEsc, I = window.cdhIcon, T = window.CDH_TARIFS || {};
  var $ = function (id) { return document.getElementById(id); };

  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.marque; });
  document.querySelectorAll("[data-mail]").forEach(function (a) {
    a.href = "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent("Mon livret d'accueil");
  });
  document.querySelectorAll("[data-cfg-mail]").forEach(function (a) { a.textContent = C.email || ""; });
  document.querySelectorAll("[data-ic]").forEach(function (el) { el.innerHTML = I(el.dataset.ic, "ico-s"); });
  document.querySelectorAll("[data-eye]").forEach(function (b) {
    b.innerHTML = I("oeil", "ico");
    b.addEventListener("click", function () {
      var inp = $(b.dataset.eye), on = inp.type === "password";
      inp.type = on ? "text" : "password";
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Masquer le mot de passe" : "Afficher le mot de passe");
    });
  });

  /* ---------- outils ---------- */
  var TITLES = { connexion: "Espace client", oubli: "Mot de passe oublié", nouveau: "Nouveau mot de passe", tableau: "Espace client", inactif: "Espace client", chargement: "Espace client" };
  function show(v, focus) {
    document.querySelectorAll("[data-view]").forEach(function (s) { s.hidden = s.dataset.view !== v; });
    document.title = TITLES[v] + " · " + (C.marque || "");
    if (focus) { var f = document.querySelector('[data-view="' + v + '"] input'); if (f) f.focus(); }
  }
  function msg(el, text, kind) {
    el.hidden = !text; el.textContent = text || "";
    el.className = "msg " + (kind || "err");
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || "Patientez…"; btn.setAttribute("aria-busy", "true"); }
    else { if (btn.dataset.label) btn.textContent = btn.dataset.label; btn.removeAttribute("aria-busy"); }
  }
  function toast(text) {
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  var validMail = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim()); };
  var hex = function (c) { return /^#[0-9a-f]{3,8}$/i.test(c || "") ? c : "#1F5B4C"; };
  var safeImg = function (s) { s = String(s || "").trim(); return /^(https?:\/\/|data:image\/|[\w.\/-])/i.test(s) && !/^javascript:/i.test(s) ? s : ""; };
  function quand(iso) {
    var d = new Date(String(iso || "").replace(/(\.\d{3})\d+/, "$1")); if (isNaN(d)) return "";
    var j = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    var h = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
    return j + " à " + h;
  }
  function retourSur() {
    var r = new URLSearchParams(location.search).get("retour") || "";
    return /^console\.html(\?[\w=&-]*)?(#[\w-]*)?$/.test(r) ? r : "";
  }
  var EMAIL = "";
  var urlRecuperation = new URL("espace.html", location.href).href.split("#")[0].split("?")[0];

  /* ---------- connexion ---------- */
  $("f-login").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = $("l-mail").value.trim(), p = $("l-pass").value, out = $("l-msg"), b = $("l-go");
    if (!validMail(m)) { msg(out, "Indiquez l'e-mail de votre compte."); $("l-mail").focus(); return; }
    if (!p) { msg(out, "Indiquez votre mot de passe."); $("l-pass").focus(); return; }
    msg(out, ""); busy(b, true, "Connexion…");
    K.connexion(m, p).then(function () {
      $("l-pass").value = "";
      var r = retourSur();
      if (r) { location.href = r; return; }
      busy(b, false); tableau();
    }, function (er) { busy(b, false); msg(out, er.message); });
  });

  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.go === "oubli") { $("o-mail").value = $("l-mail").value; msg($("o-msg"), ""); }
      show(b.dataset.go, true);
    });
  });

  $("f-oubli").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = $("o-mail").value.trim(), out = $("o-msg"), b = $("o-go");
    if (!validMail(m)) { msg(out, "Indiquez l'e-mail de votre compte."); $("o-mail").focus(); return; }
    busy(b, true, "Envoi…");
    K.motDePasseOublie(m, urlRecuperation).then(function () {
      busy(b, false);
      msg(out, "Si un compte existe pour cette adresse, un e-mail vient de partir. Pensez à regarder dans les indésirables.", "ok");
    }, function (er) {
      busy(b, false);
      if (er.code === "envoi_mail" || er.code === "serveur") msg(out, "L'envoi automatique est indisponible pour le moment. Écrivez-nous à " + (C.email || "notre adresse") + " : nous réinitialisons votre mot de passe.");
      else msg(out, er.message);
    });
  });

  function mdpForm(form, p1, p2, out, btn, done) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var a = $(p1).value, c = $(p2).value, o = $(out), b = $(btn);
      if (a.length < 8) { msg(o, "8 caractères minimum."); $(p1).focus(); return; }
      if (a !== c) { msg(o, "Les deux mots de passe ne sont pas identiques."); $(p2).focus(); return; }
      msg(o, ""); busy(b, true, "Enregistrement…");
      K.changerMotDePasse(a).then(function () {
        busy(b, false); $(p1).value = ""; $(p2).value = ""; done(o);
      }, function (er) {
        busy(b, false);
        if (er.code === "session") { show("connexion"); msg($("l-msg"), "Le lien a expiré. Connectez-vous ou demandez un nouveau lien."); return; }
        msg(o, er.message);
      });
    });
  }
  mdpForm($("f-nouveau"), "n-pass", "n-pass2", "n-msg", "n-go", function () { toast("Mot de passe enregistré"); tableau(); });
  mdpForm($("f-mdp"), "m-pass", "m-pass2", "m-msg", "m-go", function (o) { msg(o, "Mot de passe modifié.", "ok"); });

  $("logout").addEventListener("click", function () {
    K.deconnexion().then(function () {
      $("who").hidden = true; $("cards").innerHTML = "";
      show("connexion", true); toast("Vous êtes déconnecté");
    });
  });

  /* ---------- menu de l'espace client ---------- */
  function panneau(nom, focus) {
    document.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.dataset.panel !== nom; });
    document.querySelectorAll("#es-nav [data-sp]").forEach(function (b) {
      if (b.dataset.sp === nom) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (focus) window.scrollTo({ top: 0 });
  }
  $("es-nav").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sp]"); if (b) panneau(b.dataset.sp, true);
  });
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-goto]"); if (g) panneau(g.dataset.goto, true);
  });

  /* ---------- tableau de bord ---------- */
  function tableau() {
    show("chargement");
    K.moi().then(function (m) {
      $("who").hidden = false; $("who-mail").textContent = m.email || K.email();
      $("acc-mail").textContent = m.email || ""; $("acc-mail2").textContent = m.email || ""; EMAIL = m.email || K.email() || "";
      $("t-admin").hidden = !m.admin;
      var ls = m.livrets || [];
      msg($("t-msg"), "");
      var vide = '<div class="es-empty"><b>Aucun livret n\'est encore relié à ce compte.</b>' + (m.admin ? "Ouvrez la console pour mettre un livret en ligne." : "Écrivez-nous : nous l'associons à votre compte.") + "</div>";
      $("cards").innerHTML = ls.length ? ls.map(card).join("") : vide;
      $("stats-list").innerHTML = ls.length ? ls.map(function (l) { return statBloc(l); }).join("") : vide;
      $("affiche-list").innerHTML = ls.length ? ls.map(afficheBloc).join("") : vide;
      accueil(ls); boutique(ls);
      panneau("accueil");
      show("tableau");
      $("cards").querySelectorAll("img[data-cover]").forEach(function (img) { img.addEventListener("error", function () { img.remove(); }); });
      ls.forEach(function (l) { chargerVues(l); });
    }, function (er) {
      if (er.code === "session") { show("connexion", true); msg($("l-msg"), er.message); return; }
      show("tableau"); $("cards").innerHTML = "";
      msg($("t-msg"), er.message + " ");
      var again = document.createElement("button"); again.type = "button"; again.className = "btn tiny"; again.textContent = "Réessayer";
      again.addEventListener("click", tableau); $("t-msg").appendChild(again);
    });
  }
  function dernier(ls) { return ls.slice().sort(function (a, b) { return String(b.publieLe || "").localeCompare(String(a.publieLe || "")); })[0]; }
  function accueil(ls) {
    var d = dernier(ls), en = ls.filter(function (l) { return l.actif; }).length, vues = ls.reduce(function (a, l) { return a + (+l.vues30 || 0); }, 0);
    var hero = "";
    if (d) {
      var url = window.cdhLivretUrl(d.id);
      hero = '<div class="hero" style="--c:' + hex(d.accent) + '"><div class="hero-txt">' +
        '<p class="es-sur">Bonjour, voici votre livret</p><h1>' + esc(d.nom || d.id) + "</h1>" +
        '<p class="meta"><span class="status ' + (d.actif ? "ok" : "off") + '">' + (d.actif ? "En ligne" : "Hors ligne") + "</span> " + esc([d.ville, d.publieLe ? "publié le " + quand(d.publieLe) : ""].filter(Boolean).join(" · ")) + "</p>" +
        '<p class="lead">Modifiez le Wi-Fi, un code ou un message du moment : vos voyageurs voient la nouvelle version dès que vous cliquez sur « Publier ».</p>' +
        '<div class="quick"><a class="btn primary" href="console.html?compte#' + esc(d.id) + '">' + I("crayon", "ico-s") + "Modifier mon livret</a>" +
        '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">' + I("oeil", "ico-s") + "Voir</a>" +
        '<button class="btn" type="button" data-copy="' + esc(url) + '">' + I("copier", "ico-s") + "Copier le lien</button></div></div>" +
        '<div class="hero-phone" aria-hidden="true"><div class="phone"><div class="phone-screen"><iframe title="Aperçu de votre livret" tabindex="-1" loading="lazy" scrolling="no" ' + (window.innerWidth > 860 ? 'src="' + esc(url) + '"' : "") + "></iframe></div></div></div></div>";
    } else {
      hero = '<div class="hero"><div class="hero-txt"><p class="es-sur">Bonjour</p><h1>Bienvenue dans votre espace</h1><p class="lead">Aucun livret n\'est encore relié à ce compte. Écrivez-nous : nous l\'associons à votre compte.</p><div class="quick"><a class="btn primary" data-mail href="#">Nous écrire</a></div></div></div>';
    }
    $("hero").innerHTML = hero;
    document.querySelectorAll("#hero [data-mail]").forEach(function (a) { a.href = "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent("Mon livret d'accueil"); });
    var ic = function (n) { return '<span class="tile-ic" aria-hidden="true">' + I(n, "ico-s") + "</span>"; };
    $("tiles").innerHTML =
      '<article class="tile">' + ic("livre") + "<h2>Mes livrets</h2><p class=\"big\">" + ls.length + '</p><p class="meta">' + (ls.length ? en + " en ligne" : "Aucun livret relié") + '</p><button class="btn tiny" type="button" data-goto="livrets">Voir mes livrets</button></article>' +
      '<article class="tile">' + ic("globe") + "<h2>Ouvertures</h2><p class=\"big\">" + vues + '</p><p class="meta">ces 30 derniers jours</p><button class="btn tiny" type="button" data-goto="stats">Voir les statistiques</button></article>' +
      '<article class="tile">' + ic("cadeau") + "<h2>Boutique</h2><p class=\"big\">" + T.supports.porteCles.prix + ' €</p><p class="meta">le porte-clés en plus, envoi compris en France</p><button class="btn tiny" type="button" data-goto="boutique">Commander</button></article>' +
      '<article class="tile">' + ic("message") + "<h2>Besoin d'aide ?</h2><p class=\"meta\">Une modification à nous confier, une question : nous répondons sous 24 h.</p><button class=\"btn tiny\" type=\"button\" data-goto=\"aide\">Aide et support</button></article>";
    var did = d ? d.id : "";
    var todo = [
      ["crayon", "Relisez votre livret", "Vérifiez le Wi-Fi, les codes (envoyés par message) et les adresses.", d ? '<a class="btn tiny" href="console.html?compte#' + esc(did) + '">Ouvrir l\'éditeur</a>' : ""],
      ["photo", "Ajoutez vos photos", "Quelques photos du logement rendent le livret plus accueillant.", d ? '<a class="btn tiny" href="console.html?compte#' + esc(did) + '">Ajouter</a>' : ""],
      ["qr", "Imprimez l'affiche", "Posez le QR code à l'entrée ou sur la table de la cuisine.", '<button class="btn tiny" type="button" data-goto="affiche">QR code et affiche</button>'],
      ["cle", "Mettez un porte-clés avec les clés", "Le voyageur a le livret sur lui pendant tout le séjour.", '<button class="btn tiny" type="button" data-goto="boutique">Boutique</button>']
    ];
    $("todo").innerHTML = todo.map(function (t) {
      return '<div class="todo-i"><span class="tile-ic" aria-hidden="true">' + I(t[0], "ico-s") + "</span><div><b>" + t[1] + "</b><p>" + t[2] + "</p></div>" + t[3] + "</div>";
    }).join("");
  }
  function statBloc(l) {
    return '<article class="es-box"><h2>' + esc(l.nom || l.id) + '</h2><div class="vues" data-vues="' + esc(l.id) + '"><div class="vues-head"><span class="vues-num">' + (+l.vues30 || 0) + '</span><span class="vues-lab">' + (+l.vues30 > 1 ? "ouvertures" : "ouverture") + " ces 30 derniers jours</span></div></div></article>";
  }
  function afficheBloc(l) {
    var url = window.cdhLivretUrl(l.id), qr = "";
    try { qr = window.cdhQrSvg(url, { fg: "#182B40", margin: 1, size: 132 }); } catch (e) {}
    return '<article class="es-box qrbox"><div class="qrbox-img" aria-hidden="true">' + qr + "</div><div><h2>" + esc(l.nom || l.id) + '</h2><p class="meta">Le QR code de votre livret et l\'affiche A5 à imprimer, avec ou sans le Wi-Fi. Il reste le même quand vous modifiez votre livret.</p>' +
      '<p class="row"><a class="btn primary" href="console.html?compte&onglet=qr#' + esc(l.id) + '">' + I("telecharger", "ico-s") + "Télécharger le QR code et l'affiche</a>" +
      '<button class="btn" type="button" data-copy="' + esc(url) + '">' + I("copier", "ico-s") + "Copier le lien</button></p>" +
      '<p class="meta"><b>Où le poser&nbsp;?</b> À l\'entrée, sur la table de la cuisine, près du Wi-Fi ou accroché aux clés.</p></div></article>';
  }
  function card(l) {
    var url = window.cdhLivretUrl(l.id), cov = safeImg(l.couverture);
    return '<article class="lcard" data-id="' + esc(l.id) + '">' +
      '<div class="lcard-top" style="--c:' + hex(l.accent) + '">' + (cov ? '<img data-cover src="' + esc(cov) + '" alt="">' : "") +
      '<span class="lcard-state status ' + (l.actif ? "ok" : "off") + '">' + (l.actif ? "En ligne" : "Hors ligne") + "</span></div>" +
      '<div class="lcard-body"><div><h2>' + esc(l.nom || l.id) + "</h2>" +
      '<p class="meta">' + esc([l.ville, l.publieLe ? "publié le " + quand(l.publieLe) : ""].filter(Boolean).join(" · ")) + "</p></div>" +
      '<p class="meta">' + (+l.vues30 || 0) + (+l.vues30 > 1 ? " ouvertures" : " ouverture") + " ces 30 derniers jours</p>" +
      '<div class="actions"><a class="btn primary" href="console.html?compte#' + esc(l.id) + '">' + I("crayon", "ico-s") + "Modifier</a>" +
      '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">' + I("oeil", "ico-s") + "Voir</a>" +
      '<button class="btn" type="button" data-copy="' + esc(url) + '">' + I("copier", "ico-s") + "Copier le lien</button></div>" +
      "</div></article>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]"); if (!b) return;
    window.cdhCopy(b.dataset.copy).then(function (ok) { toast(ok ? "Lien copié" : "Copie impossible : " + b.dataset.copy); });
  });

  /* Ouvertures par jour : 30 barres, survol ou appui pour le détail */
  var JOUR = function (iso, long) { var d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("fr-FR", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" }); };
  function chargerVues(l) {
    var box = document.querySelector('[data-vues="' + l.id + '"]'); if (!box) return;
    K.stats(l.id).then(function (s) {
      s = Array.isArray(s) ? s : [];
      var total = s.reduce(function (a, x) { return a + (+x.n || 0); }, 0);
      box.querySelector(".vues-num").textContent = total;
      box.querySelector(".vues-lab").textContent = (total > 1 ? "ouvertures" : "ouverture") + " ces 30 derniers jours";
      if (total) {
        var rec = s.reduce(function (a, x) { return (+x.n || 0) > (+a.n || 0) ? x : a; }, s[0]);
        box.querySelector(".vues-head").insertAdjacentHTML("afterend", '<div class="sum"><div><b>' + (Math.round(total / s.length * 10) / 10).toString().replace(".", ",") + "</b><span>par jour en moyenne</span></div><div><b>" + (+rec.n) + "</b><span>record (" + esc(JOUR(rec.jour)) + ")</span></div><div><b>" + s.filter(function (x) { return +x.n; }).length + "</b><span>jours avec des ouvertures</span></div></div>");
      }
      if (!total) {
        box.insertAdjacentHTML("beforeend", '<p class="vues-empty">Les ouvertures s\'afficheront ici dès que vos voyageurs scanneront le QR code.</p>');
        return;
      }
      var W = 300, H = 44, gap = 2, n = s.length, bw = (W - gap * (n - 1)) / n;
      var max = Math.max.apply(null, s.map(function (x) { return +x.n || 0; }));
      var bars = s.map(function (x, i) {
        var v = +x.n || 0, h = v ? Math.max(3, Math.round(v / max * H)) : 2, xx = (i * (bw + gap)).toFixed(2);
        return '<g data-i="' + i + '"><rect class="hit" x="' + xx + '" y="0" width="' + (bw + gap).toFixed(2) + '" height="' + H + '"/>' +
          '<rect class="bar' + (v ? "" : " zero") + '" x="' + xx + '" y="' + (H - h) + '" width="' + bw.toFixed(2) + '" height="' + h + '" rx="1.5"/></g>';
      }).join("");
      var rows = s.slice().reverse().filter(function (x) { return +x.n; }).map(function (x) {
        return "<tr><td>" + esc(JOUR(x.jour, true)) + "</td><td>" + (+x.n) + "</td></tr>";
      }).join("");
      box.insertAdjacentHTML("beforeend",
        '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Ouvertures par jour sur 30 jours, maximum ' + max + ' en une journée">' + bars + "</svg>" +
        '<div class="vues-axis" aria-hidden="true"><span>' + esc(JOUR(s[0].jour)) + "</span><span>aujourd'hui</span></div>" +
        '<details><summary>Détail par jour</summary><table><thead><tr><th scope="col">Jour</th><th scope="col">Ouvertures</th></tr></thead><tbody>' + rows + "</tbody></table></details>");
      var svg = box.querySelector("svg"), tip = document.createElement("div");
      tip.className = "vues-tip"; tip.hidden = true; box.appendChild(tip);
      function at(clientX) {
        var r = svg.getBoundingClientRect(), i = Math.min(n - 1, Math.max(0, Math.floor((clientX - r.left) / r.width * n)));
        svg.querySelectorAll("g.on").forEach(function (g) { g.classList.remove("on"); });
        svg.querySelector('g[data-i="' + i + '"]').classList.add("on");
        tip.textContent = "";
        var b = document.createElement("b"); b.textContent = String(+s[i].n || 0);
        tip.appendChild(b); tip.appendChild(document.createTextNode(" · " + JOUR(s[i].jour, true)));
        tip.style.left = (svg.offsetLeft + (i + 0.5) / n * r.width) + "px";
        tip.style.top = svg.offsetTop + "px";
        tip.hidden = false;
      }
      svg.addEventListener("pointermove", function (e) { at(e.clientX); });
      svg.addEventListener("pointerdown", function (e) { at(e.clientX); });
      function hide() { tip.hidden = true; svg.querySelectorAll("g.on").forEach(function (g) { g.classList.remove("on"); }); }
      /* au doigt, le détail reste affiché jusqu'au prochain appui ailleurs */
      svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hide(); });
      document.addEventListener("pointerdown", function (e) { if (!tip.hidden && !svg.contains(e.target)) hide(); });
    }, function () {
      box.insertAdjacentHTML("beforeend", '<p class="vues-empty">Statistiques indisponibles pour le moment.</p>');
    });
  }


  /* ---------- boutique : porte-clés supplémentaires ---------- */
  var SHOP = { ls: [], col: (T.couleurs && T.couleurs[0]) ? T.couleurs[0].hex : "#1F3A5F" };
  function eur(n) { return (Math.round(n * 100) / 100).toString().replace(".", ",") + " €"; }
  function boutique(ls) {
    SHOP.ls = ls;
    var unit = T.supports.porteCles.prix;
    $("shop-unit").textContent = eur(unit) + " l'unité";
    $("s-livret").innerHTML = ls.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(l.nom || l.id) + "</option>"; }).join("");
    var pays = ["France"].concat((T.livraison && T.livraison.pays) || []);
    $("s-pays").innerHTML = pays.map(function (p) { return "<option>" + esc(p) + "</option>"; }).join("");
    $("s-cols").innerHTML = (T.couleurs || []).map(function (c, i) {
      return '<label class="sw"><input type="radio" name="s-col" value="' + esc(c.hex) + '" data-nom="' + esc(c.nom) + '"' + (i === 0 ? " checked" : "") + '><span style="--c:' + esc(c.hex) + '"></span><em>' + esc(c.nom) + "</em></label>";
    }).join("");
    if (ls[0]) { $("s-nom").value = (ls[0].nom || "").slice(0, 40); SHOP.col = (T.couleurs[0] || {}).hex || SHOP.col; }
    shopRefresh();
  }
  function shopQty() { var q = parseInt($("s-qte").value, 10); return isFinite(q) ? Math.min(50, Math.max(1, q)) : 1; }
  function shopRefresh() {
    var id = $("s-livret").value, l = SHOP.ls.filter(function (x) { return x.id === id; })[0] || SHOP.ls[0] || {};
    var chk = document.querySelector('#s-cols input:checked'); SHOP.col = chk ? chk.value : SHOP.col;
    var nom = $("s-nom").value.trim() || l.nom || "Votre logement", q = shopQty(), unit = T.supports.porteCles.prix;
    var ship = $("s-pays").value && $("s-pays").value !== "France" ? (T.livraison.prix || 0) : 0;
    $("s-total").textContent = eur(q * unit + ship);
    $("s-detail").textContent = q + " × " + eur(unit) + (ship ? " + livraison " + eur(ship) : " · livraison comprise");
    nom = nom.length > 44 ? nom.slice(0, 43).trim() + "…" : nom;
    var up = nom.toUpperCase(), fs = 8.6, lines = [up];
    function wrap(txt, max) {
      var out = [], cur = "";
      txt.split(/\s+/).forEach(function (w) {
        while (w.length > max) { if (cur) { out.push(cur); cur = ""; } out.push(w.slice(0, max)); w = w.slice(max); }
        if (!w) return;
        if (!cur) cur = w; else if ((cur + " " + w).length <= max) cur += " " + w; else { out.push(cur); cur = w; }
      });
      if (cur) out.push(cur);
      return out;
    }
    for (fs = 8.6; fs >= 4.8; fs -= 0.4) {
      lines = wrap(up, Math.floor(64 / (fs * 0.74)));
      if (lines.length <= (fs > 6.6 ? 1 : fs > 5.4 ? 2 : 3)) break;
    }
    lines = lines.slice(0, 3);
    var lh = fs * 1.22, band = Math.max(30, 20 + lines.length * lh + 4), y0 = 66 + band + 5, qs = Math.max(38, Math.min(54, 152 - y0)), qr = "";
    try { qr = window.cdhQrSvg(window.cdhLivretUrl(l.id || "x"), { fg: "#182B40", margin: 1, size: qs }); } catch (e) {}
    var txt = lines.map(function (ln, i) {
      return '<text x="60" y="' + (84 + fs * 0.35 + i * lh).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="' + fs.toFixed(1) + '" font-weight="700" letter-spacing=".4" font-family="Schibsted Grotesk, sans-serif">' + esc(ln) + "</text>";
    }).join("");
    $("shop-prev").innerHTML = '<svg viewBox="0 0 120 200" role="img" aria-label="Aperçu du porte-clés">' +
      '<circle cx="60" cy="24" r="17" fill="none" stroke="#8E918F" stroke-width="3"/>' +
      '<path d="M48 36h24v14H48z" fill="#DCE4E8" stroke="#B7C2C8"/>' +
      '<path d="M26 50h68l12 12v108l-12 12H26L14 170V62z" fill="#F2F6F8" stroke="#B7C2C8" stroke-width="1.5"/>' +
      '<rect x="24" y="66" width="72" height="104" fill="#fff"/>' +
      '<rect x="24" y="66" width="72" height="' + band.toFixed(1) + '" fill="' + esc(SHOP.col) + '"/>' +
      '<text x="60" y="76" text-anchor="middle" fill="#fff" fill-opacity=".85" font-size="3.9" font-weight="700" letter-spacing="1" font-family="Schibsted Grotesk, sans-serif">BIENVENUE</text>' + txt +
      '<g transform="translate(' + (60 - qs / 2).toFixed(1) + " " + y0.toFixed(1) + ')">' + qr + "</g>" +
      '<text x="60" y="164" text-anchor="middle" fill="#182B40" font-size="8" font-style="italic" font-family="Brygada 1918, Georgia, serif">livret d\'accueil</text></svg>';
  }
  ["s-livret", "s-qte", "s-nom", "s-pays"].forEach(function (id) { $(id).addEventListener("input", shopRefresh); $(id).addEventListener("change", shopRefresh); });
  $("s-livret").addEventListener("change", function () { var l = SHOP.ls.filter(function (x) { return x.id === $("s-livret").value; })[0]; if (l) { $("s-nom").value = (l.nom || "").slice(0, 40); shopRefresh(); } });
  $("s-cols").addEventListener("change", shopRefresh);
  $("f-shop").addEventListener("submit", function (e) {
    e.preventDefault();
    var out = $("s-msg"), btn = $("s-go"), need = ["s-dest", "s-adr", "s-cp", "s-ville"];
    for (var i = 0; i < need.length; i++) if (!$(need[i]).value.trim()) { msg(out, "Complétez l'adresse de livraison."); $(need[i]).focus(); return; }
    if (!$("s-nom").value.trim()) { msg(out, "Indiquez le nom à imprimer."); $("s-nom").focus(); return; }
    if (!$("s-ok").checked) { msg(out, "Cochez la case pour que nous puissions traiter votre commande."); $("s-ok").focus(); return; }
    var url = C.formulaireDevis; if (!url) { msg(out, "L'envoi n'est pas disponible pour le moment. Écrivez-nous à " + (C.email || "notre adresse") + "."); return; }
    var chk = document.querySelector("#s-cols input:checked"), q = shopQty(), unit = T.supports.porteCles.prix, ship = $("s-pays").value !== "France" ? T.livraison.prix : 0;
    var data = {
      _subject: "Commande de porte-clés : " + $("s-nom").value.trim(),
      email: EMAIL, livret: $("s-livret").value, quantite: q, couleur_bandeau: chk ? chk.dataset.nom + " " + chk.value : "", nom_imprime: $("s-nom").value.trim(),
      destinataire: $("s-dest").value.trim(), telephone: $("s-tel").value.trim(), adresse: $("s-adr").value.trim(), code_postal: $("s-cp").value.trim(), ville: $("s-ville").value.trim(), pays: $("s-pays").value,
      total: eur(q * unit + ship), _gotcha: $("s-pot").value
    };
    msg(out, ""); busy(btn, true, "Envoi…");
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) }).then(function (r) {
      busy(btn, false);
      if (!r.ok) throw new Error("http");
      msg(out, "Merci, votre commande est bien reçue. Nous vous répondons sous 24 h à " + EMAIL + " avec le lien de paiement. Aucun e-mail automatique n'est envoyé.", "ok");
      $("f-shop").querySelectorAll("input[type=text], input[type=tel]").forEach(function (i) { if (i.id !== "s-nom") i.value = ""; });
      $("s-ok").checked = false;
    }, function () { busy(btn, false); msg(out, "L'envoi a échoué. Réessayez, ou écrivez-nous à " + (C.email || "notre adresse") + "."); }).catch(function () { busy(btn, false); msg(out, "L'envoi a échoué. Réessayez, ou écrivez-nous à " + (C.email || "notre adresse") + "."); });
  });

  /* ---------- démarrage ---------- */
  if (!K || !K.actif) { show("inactif"); return; }
  function lien(r) {
    if (r && r.error) { show("connexion"); msg($("l-msg"), r.error.message); return true; }
    if (r && r.type === "recovery") {
      $("n-lead").textContent = "Compte " + (r.email || "") + " : choisissez votre nouveau mot de passe (8 caractères minimum).";
      show("nouveau", true); return true;
    }
    return false;
  }
  /* lien de l'e-mail ouvert alors que la page était déjà affichée */
  window.addEventListener("hashchange", function () { K.lienRecu().then(function (r) { if (!lien(r) && r) tableau(); }); });
  K.lienRecu().then(function (r) {
    if (lien(r)) return;
    return K.session().then(function (s) {
      if (!s) { show("connexion", true); return; }
      var ret = retourSur(); if (ret) { location.replace(ret); return; }
      tableau();
    });
  });
})();
