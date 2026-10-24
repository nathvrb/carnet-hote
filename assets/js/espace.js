/* Espace client : connexion, mot de passe oublié, tableau de bord des livrets. */
(function () {
  var C = window.CDH_CONFIG || {}, K = window.CDH_CLOUD, esc = window.cdhEsc, I = window.cdhIcon;
  var $ = function (id) { return document.getElementById(id); };

  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.marque; });
  document.querySelectorAll("[data-mail]").forEach(function (a) {
    a.href = "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent("Mon livret d'accueil");
  });
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
  var TITLES = { connexion: "Espace client", oubli: "Mot de passe oublié", nouveau: "Nouveau mot de passe", tableau: "Vos livrets", inactif: "Espace client", chargement: "Espace client" };
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

  /* ---------- tableau de bord ---------- */
  function tableau() {
    show("chargement");
    K.moi().then(function (m) {
      $("who").hidden = false; $("who-mail").textContent = m.email || K.email();
      $("acc-mail").textContent = m.email || "";
      $("t-admin").hidden = !m.admin;
      var ls = m.livrets || [];
      $("t-titre").textContent = ls.length === 1 && !m.admin ? "Votre livret" : "Vos livrets";
      msg($("t-msg"), "");
      $("cards").innerHTML = ls.length ? ls.map(card).join("") :
        '<div class="es-empty"><b>Aucun livret n\'est encore relié à ce compte.</b>' + (m.admin ? "Ouvrez la console pour mettre un livret en ligne." : "Écrivez-nous : nous l'associons à votre compte.") + "</div>";
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
  function card(l) {
    var url = window.cdhLivretUrl(l.id), cov = safeImg(l.couverture);
    return '<article class="lcard" data-id="' + esc(l.id) + '">' +
      '<div class="lcard-top" style="--c:' + hex(l.accent) + '">' + (cov ? '<img data-cover src="' + esc(cov) + '" alt="">' : "") +
      '<span class="lcard-state status ' + (l.actif ? "ok" : "off") + '">' + (l.actif ? "En ligne" : "Hors ligne") + "</span></div>" +
      '<div class="lcard-body"><div><h2>' + esc(l.nom || l.id) + "</h2>" +
      '<p class="meta">' + esc([l.ville, l.publieLe ? "publié le " + quand(l.publieLe) : ""].filter(Boolean).join(" · ")) + "</p></div>" +
      '<div class="vues" data-vues="' + esc(l.id) + '"><div class="vues-head"><span class="vues-num">' + (+l.vues30 || 0) + '</span><span class="vues-lab">' + (+l.vues30 > 1 ? "ouvertures" : "ouverture") + " ces 30 derniers jours</span></div></div>" +
      '<div class="actions"><a class="btn primary" href="console.html?compte#' + esc(l.id) + '">' + I("crayon", "ico-s") + "Modifier</a>" +
      '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">' + I("oeil", "ico-s") + "Voir</a>" +
      '<button class="btn" type="button" data-copy="' + esc(url) + '">' + I("copier", "ico-s") + "Copier le lien</button></div>" +
      "</div></article>";
  }
  $("cards").addEventListener("click", function (e) {
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
