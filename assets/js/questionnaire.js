/* Questionnaire en ligne : le futur client décrit son logement, on en tire le livret.
   - le contenu des questions est décrit dans SECTIONS (en bas de ce commentaire, modifiable)
   - les réponses sont gardées sur l'appareil au fil de la saisie (brouillon), jamais envoyées avant le clic final
   - l'envoi passe par Formspree (config.js → formulaireQuestionnaire, sinon formulaireDevis) ;
     sans adresse configurée, le client copie ou télécharge ses réponses et les envoie par e-mail */
(function () {
  var C = window.CDH_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* espaces insécables à la française : « mot : » et « « texte » » */
  var nb = function (s) { return String(s).replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« "); };
  var KEY = "cdh:questionnaire:v1";
  var ORDRE = { essentiel: 1, confort: 2, premium: 3 };

  var APPAREILS = ["Lave-linge", "Sèche-linge", "Lave-vaisselle", "Plaques (induction, gaz, vitrocéramique)", "Four, micro-ondes", "Machine à café (capsules, grains, filtre)", "Hotte, bouilloire, grille-pain", "Poêle ou cheminée", "Spa, jacuzzi, sauna", "Piscine", "Barbecue, plancha", "Volets roulants, store banne", "Alarme, coffre-fort", "Borne de recharge électrique", "Autre appareil"];

  var SECTIONS = [
    { id: "logement", titre: "Vous et votre logement", intro: "Ces informations servent à créer votre livret et à vous recontacter. Si vous avez une annonce en ligne, donnez-nous son lien : nous y reprenons déjà beaucoup de choses.",
      q: [
        { k: "nom", l: "Vos nom et prénom", ac: "name", req: 1 },
        { k: "email", l: "Votre e-mail", type: "email", ac: "email", req: 1, h: "Pour vous répondre et vous envoyer l'aperçu de votre livret." },
        { k: "tel", l: "Votre téléphone", type: "tel", ac: "tel", h: "Facultatif : utile pour un point rapide au besoin." },
        { k: "type", l: "Type de logement", choix: ["Appartement", "Maison", "Gîte", "Chambres d'hôtes", "Hôtel"] },
        { k: "logement", l: "Nom du logement tel que vos voyageurs le connaissent", req: 1 },
        { k: "annonce", l: "Lien de l'annonce", type: "url", h: "Airbnb, Booking, Abritel ou votre site." },
        { k: "adresse", l: "Adresse complète", ac: "street-address" },
        { k: "acces", l: "Étage, ascenseur, bâtiment, numéro de porte" },
        { k: "capacite", l: "Nombre de voyageurs maximum et de chambres" },
        { k: "formule", l: "Formule choisie", choix: ["Essentiel", "Confort", "Premium", "Je ne sais pas encore"], formule: 1 },
        { k: "date", l: "Date de la prochaine réservation, ou date souhaitée de mise en ligne" }
      ] },
    { id: "accueil", titre: "Le mot d'accueil et le contact", intro: "Le livret s'ouvre sur une carte d'accueil signée de votre main. Quelques mots suffisent : nous rédigeons le message.",
      q: [
        { k: "signature", l: "Signature à afficher", h: "Par exemple « Claire & Julien » ou « L'équipe des Ondines »." },
        { k: "ressortir", l: "Ce qui doit ressortir de l'accueil", h: "Le calme, la vue, la famille, le quartier…", zone: 2 },
        { k: "ton", l: "Ton souhaité", choix: ["Chaleureux, avec tutoiement", "Chaleureux, avec vouvoiement", "Sobre et professionnel"] },
        { k: "tel-voy", l: "Numéro de téléphone à donner aux voyageurs", type: "tel" },
        { k: "whatsapp", l: "WhatsApp", choix: ["Même numéro", "Un autre numéro (à préciser plus bas)", "Pas de WhatsApp"] },
        { k: "mail-voy", l: "E-mail à donner aux voyageurs", type: "email" },
        { k: "canal", l: "Par où préférez-vous recevoir les demandes ?", multi: ["WhatsApp", "SMS", "E-mail"] },
        { k: "dispo", l: "Quand êtes-vous joignable ?", h: "Par exemple : de 8 h à 22 h, réponse en moins d'une heure." },
        { k: "relais", l: "Qui contacter si vous êtes absent ?", h: "Co-hôte, voisin, conciergerie : nom et numéro." }
      ] },
    { id: "arrivee", titre: "Avant l'arrivée : venir, se garer, entrer", intro: "Cette partie devient la page « Avant votre arrivée », dont vous enverrez le lien à vos voyageurs la veille. C'est elle qui évite les appels à 23 h.",
      q: [
        { k: "heure-arr", l: "Heure d'arrivée possible", h: "Par exemple : à partir de 16 h." },
        { k: "autonome", l: "Arrivée autonome ou accueil en personne ?", choix: ["Arrivée autonome", "Accueil en personne", "Selon les séjours"] },
        { k: "train", l: "En train : gare la plus proche, puis bus, tram ou taxi ?", zone: 2 },
        { k: "voiture", l: "En voiture : où se garer ?", h: "Gratuit ou payant ? Code ou badge de parking ?", zone: 2 },
        { k: "entree", l: "Comment trouver l'entrée ?", h: "Porte, couleur, sonnette, portail…", zone: 2 },
        { k: "cles", l: "Récupération des clés", choix: ["Boîte à clés", "Serrure à code", "Chez un voisin", "À l'accueil", "Remise en main propre"] },
        { k: "boite", l: "Où est la boîte à clés et comment l'ouvrir ?", h: "Ne notez pas le code ici : écrivez « code envoyé par message ». Le livret dira où le trouver, sans l'afficher.", zone: 2 },
        { k: "quelle-cle", l: "Quelle clé ouvre quoi ?" },
        { k: "tardive", l: "Arrivée tardive : que doit faire le voyageur ?", zone: 2 },
        { k: "anticipee", l: "Arrivée anticipée ou dépôt des bagages possible ?" }
      ] },
    { id: "wifi", titre: "Wi-Fi et essentiels", intro: "Le Wi-Fi s'affiche en tête du livret, avec un bouton pour copier le mot de passe.",
      q: [
        { k: "wifi", l: "Nom du réseau Wi-Fi" },
        { k: "wifi-mdp", l: "Mot de passe du Wi-Fi", h: "Il s'affichera dans le livret. Si vous le changez souvent, vous pourrez le modifier vous-même ensuite." },
        { k: "box", l: "Où est la box, et que faire si le Wi-Fi coupe ?", zone: 2 },
        { k: "tv", l: "Télévision", h: "Chaînes, Netflix ou autres applis, télécommandes.", zone: 2 },
        { k: "chauffage", l: "Chauffage", h: "Type (radiateurs, sol, poêle, pompe à chaleur) et réglage conseillé.", zone: 2 },
        { k: "clim", l: "Climatisation", h: "Oui ou non, et comment l'allumer." },
        { k: "eau-chaude", l: "Eau chaude", h: "Ballon à attendre, limite à connaître ?" },
        { k: "disjoncteur", l: "Où sont le disjoncteur et l'arrivée d'eau ?" },
        { k: "lits", l: "Lits", h: "Canapé-lit à déplier, lit parapluie, linge supplémentaire (où ?).", zone: 2 }
      ] },
    { id: "equipements", titre: "Équipements et modes d'emploi", intro: "Pour chaque appareil présent, notez sa marque et ce qui pose souvent question. Nous en faisons un mode d'emploi en étapes. Vous pouvez laisser vide ce qui n'existe pas chez vous.",
      q: [
        { k: "appareils", l: "Appareils", lignes: APPAREILS, check: "Il y en a un", cols: [{ l: "Marque, modèle" }, { l: "Ce qui pose question", h: "Programme conseillé, piège à éviter…" }] },
        { k: "classeur", l: "Vous avez déjà un classeur ou des notices ?", h: "Envoyez-les en photo avec les autres images (voir la dernière partie) : on s'en sert comme base.", seul: 1 }
      ] },
    { id: "regles", titre: "Règles de la maison et déchets", intro: "Cochez ce qui s'applique, et précisez si besoin.",
      q: [
        { k: "regles", l: "Règles", multi: ["Logement non-fumeur", "Animaux acceptés", "Pas de fête ni d'événement", "Calme à partir d'une certaine heure", "Pas de visiteurs en plus des voyageurs prévus", "Chaussures à retirer à l'entrée", "Piscine ou spa : horaires, enfants accompagnés"] },
        { k: "regles-p", l: "Précisions et autres règles importantes pour vous", h: "Balcon et jardin compris pour le tabac ? Conditions pour les animaux ? Heure du calme ?", zone: 3 },
        { k: "poubelles", l: "Où sont les poubelles ?" },
        { k: "bacs", l: "Quels bacs, pour quoi ?", h: "Ordures, emballages, verre, biodéchets.", zone: 2 },
        { k: "sortie", l: "Jours de sortie des poubelles", h: "Seulement si le voyageur doit s'en charger." },
        { k: "verre", l: "Où déposer le verre ?" }
      ] },
    { id: "services", titre: "Services en plus", min: "confort", intro: "Chaque service a un bouton « Demander » qui envoie un message déjà rédigé. Deux départs tardifs à 20 € remboursent déjà le livret. Indiquez un prix pour ceux que vous proposez, laissez vide les autres.",
      q: [
        { k: "services", l: "Services", lignes: ["Départ tardif", "Arrivée anticipée", "Ménage en cours de séjour", "Linge ou serviettes en plus", "Panier petit-déjeuner ou produits locaux", "Bois pour la cheminée ou le poêle", "Location de vélos", "Transfert depuis la gare ou l'aéroport", "Lit bébé, chaise haute", "Autre service"], check: "Je le propose", cols: [{ l: "Prix" }, { l: "Conditions", h: "Délai, disponibilité, paiement." }] }
      ] },
    { id: "adresses", titre: "Vos bonnes adresses et sorties", intro: "Donnez juste les noms et ce que vous aimez : nous ajoutons les horaires, les distances, l'itinéraire et la place sur la carte. Vos coups de cœur comptent plus que la liste complète.",
      q: [
        { k: "adresses", l: "Adresses utiles", lignes: ["Boulangerie", "Supérette ou supermarché", "Marché (jour et lieu)", "Pharmacie", "Médecin ou maison de santé", "Restaurant 1", "Restaurant 2", "Restaurant 3", "Café ou bar", "Producteur, cave, épicerie fine"], cols: [{ l: "Nom" }, { l: "Votre conseil", h: "Ce que vous aimez, quoi commander." }] },
        { k: "sorties", l: "Sorties et activités", min: "confort", lignes: ["Balade ou randonnée", "Visite (village, château, musée)", "Activité avec des enfants", "Idée pour un jour de pluie", "Autre coup de cœur"], cols: [{ l: "Quoi ?" }, { l: "Pourquoi vous la conseillez", h: "Durée, saison, avec enfants ?" }] },
        { k: "partenaire", l: "Un partenaire qui offre une réduction à vos voyageurs ?", h: "Restaurant, location, spa : on l'affiche en bon plan.", zone: 2 }
      ] },
    { id: "depart", titre: "Départ et avis", intro: "Le voyageur coche une liste avant de partir. Quand tout est coché, un bouton l'emmène vers votre page d'avis.",
      q: [
        { k: "heure-dep", l: "Heure de départ", h: "Par exemple : avant 11 h." },
        { k: "avant-dep", l: "Que doit faire le voyageur avant de partir ?", h: "Vaisselle, poubelles, linge, fenêtres, chauffage…", zone: 3 },
        { k: "cles-dep", l: "Où laisser les clés ?" },
        { k: "avis", l: "Lien de votre page d'avis", type: "url", h: "Airbnb, Booking ou Google." },
        { k: "mot", l: "Un dernier mot pour vos voyageurs ?", zone: 2 }
      ] },
    { id: "securite", titre: "Sécurité et urgences", intro: "Les numéros nationaux (112, 15, 17, 18) et l'hôpital le plus proche sont ajoutés par nos soins. Il nous manque seulement ce qui est propre à votre logement.",
      q: [
        { k: "extincteur", l: "Où sont l'extincteur et la trousse de secours ?" },
        { k: "coupures", l: "Où couper l'eau, l'électricité et le gaz ?", zone: 2 },
        { k: "artisan", l: "Un voisin ou un artisan à appeler en cas de souci", h: "Fuite, panne : nom et numéro." },
        { k: "vigilance", l: "Un point de vigilance ?", h: "Escalier raide, piscine non clôturée, route passante…", zone: 2 }
      ] },
    { id: "style", titre: "Langues, style et supports QR", intro: "Le dernier tour : l'allure du livret et l'objet que vos voyageurs scanneront.",
      q: [
        { k: "langues", l: "Langues du livret", h: "Français inclus. Anglais dès la formule Confort ; d'autres langues en option.", multi: ["Français", "Anglais", "Allemand", "Néerlandais", "Autre (à préciser plus bas)"] },
        { k: "ambiance", l: "Couleur préférée, ou une ambiance", h: "Par exemple « bord de lac », « Provence »." },
        { k: "logo", l: "Logo à intégrer", min: "premium", h: "Vous l'enverrez avec vos photos." },
        { k: "videos", l: "Vidéos tutos à intégrer", min: "premium", h: "Un lien, ou dites-nous que vous les envoyez." },
        { k: "support", l: "Support", min: "confort", choix: ["Porte-clés gravé", "Chevalet plexiglas", "Je ne sais pas encore"] },
        { k: "couleur-support", l: "Couleur du porte-clés", min: "confort", choix: ["Vert sapin", "Terracotta", "Bleu nuit", "Ocre", "Bordeaux", "Noir mat"] },
        { k: "gravure", l: "Texte gravé sur le porte-clés", min: "confort", h: "18 caractères maximum.", max: 18 },
        { k: "supports-plus", l: "Supports en plus du nombre inclus", min: "confort", h: "Combien de chaque ?" },
        { k: "livraison", l: "Adresse de livraison des supports", min: "confort", ac: "street-address", zone: 2 },
        { k: "autre", l: "Autre chose à nous dire ?", zone: 3 }
      ],
      note: "Formule Essentiel : rien à livrer. Vous recevez une affiche A5 en PDF, avec le QR code du livret et celui du Wi-Fi." },
    { id: "photos", titre: "Photos à nous envoyer", intro: "Des photos prises au téléphone suffisent, en lumière du jour et à l'horizontale. Les photos ne passent pas par ce formulaire : envoyez-les par WhatsApp, par e-mail ou par un lien de partage (Google Drive, WeTransfer).",
      liste: ["Une belle photo du logement ou de la vue, pour la couverture", "La façade ou l'entrée, pour que le voyageur la reconnaisse", "La boîte à clés ou la serrure à code", "Le parking ou l'emplacement de stationnement", "Chaque appareil de la partie 5 : en entier, puis ses boutons de face", "Le tableau électrique et l'arrivée d'eau", "Les poubelles et les bacs de tri", "Vos photos des environs, si vous voulez qu'on les utilise pour les sorties", "Votre logo (formule Premium)"],
      q: [
        { k: "photos", l: "Comment nous envoyez-vous vos photos ?", h: "Collez un lien de partage, ou indiquez « je les envoie par WhatsApp / par e-mail ».", zone: 2 }
      ] }
  ];

  var form = $("#q-form"), rail = $("#q-rail"), prog = $("#q-prog"), saveEl = $("#q-save");
  var etat = { n: 0 };

  /* ---------- construction ---------- */
  function name(si, k) { return "s" + si + "_" + k; }
  function champ(si, q, idx) {
    var id = "q-" + si + "-" + idx, nm = name(si, q.k), lab = nb(q.l), h = q.h ? '<small class="q-h" id="' + id + '-h">' + esc(nb(q.h)) + "</small>" : "";
    var meta = ' data-l="' + esc(q.l) + '"' + (q.min ? ' data-min="' + q.min + '"' : "") + (q.formule ? ' data-formule="1"' : "");
    var aria = q.h ? ' aria-describedby="' + id + '-h"' : "";
    if (q.lignes) {
      return '<fieldset class="q q-lignes"' + meta + '><legend class="q-lab">' + esc(lab) + "</legend>" + q.lignes.map(function (ln, i) {
        var base = nm + "_" + i;
        return '<div class="q-ligne" data-ligne="' + esc(ln) + '"><p class="q-ligne-t">' + esc(nb(ln)) + "</p>" +
          (q.check ? '<label class="q-check"><input type="checkbox" name="' + base + '_ok" data-c="' + esc(q.check) + '"><span>' + esc(q.check) + "</span></label>" : "") +
          '<div class="q-cols">' + q.cols.map(function (c, j) {
            var cid = id + "-" + i + "-" + j;
            return '<label class="q-col" for="' + cid + '"><span>' + esc(nb(c.l)) + (c.h ? " <small>(" + esc(nb(c.h.replace(/\.$/, ""))) + ")</small>" : "") + '</span><input id="' + cid + '" name="' + base + "_" + j + '" data-c="' + esc(c.l) + '" type="text" autocomplete="off"></label>';
          }).join("") + "</div></div>";
      }).join("") + "</fieldset>";
    }
    if (q.choix) {
      return '<fieldset class="q q-choix"' + meta + aria + '><legend class="q-lab">' + esc(lab) + "</legend>" + h + '<div class="q-opts">' + q.choix.map(function (o, i) {
        return '<label class="q-opt"><input type="radio" name="' + nm + '" value="' + esc(o) + '"><span>' + esc(nb(o)) + "</span></label>";
      }).join("") + "</div></fieldset>";
    }
    if (q.multi) {
      return '<fieldset class="q q-choix"' + meta + aria + '><legend class="q-lab">' + esc(lab) + "</legend>" + h + '<div class="q-opts">' + q.multi.map(function (o, i) {
        return '<label class="q-opt"><input type="checkbox" name="' + nm + "_" + i + '" value="' + esc(o) + '"><span>' + esc(nb(o)) + "</span></label>";
      }).join("") + "</div></fieldset>";
    }
    var ctl = q.zone
      ? '<textarea id="' + id + '" name="' + nm + '" rows="' + (q.zone + 1) + '"' + aria + '></textarea>'
      : '<input id="' + id + '" name="' + nm + '" type="' + (q.type || "text") + '"' + (q.ac ? ' autocomplete="' + q.ac + '"' : ' autocomplete="off"') + (q.type === "email" ? ' inputmode="email"' : "") + (q.type === "tel" ? ' inputmode="tel"' : "") + (q.type === "url" ? ' inputmode="url" placeholder="https://"' : "") + (q.max ? ' maxlength="' + q.max + '"' : "") + (q.req ? " required" : "") + aria + ">";
    return '<div class="q"' + meta + '><label class="q-lab" for="' + id + '">' + esc(lab) + (q.req ? ' <b class="q-req" title="obligatoire">*</b>' : "") + "</label>" + h + ctl + "</div>";
  }

  function build() {
    form.innerHTML = SECTIONS.map(function (s, si) {
      var n = si + 1;
      return '<section class="q-sec" id="partie-' + n + '" data-s="' + si + '"' + (s.min ? ' data-min="' + s.min + '"' : "") + ' aria-labelledby="t-' + n + '">' +
        '<header class="q-head"><span class="q-num" aria-hidden="true">' + n + '</span><div><h2 id="t-' + n + '">' + esc(nb(s.titre)) + '</h2><p class="q-intro">' + esc(nb(s.intro)) + "</p></div></header>" +
        (s.liste ? '<ul class="q-liste">' + s.liste.map(function (x) { return "<li>" + esc(nb(x)) + "</li>"; }).join("") + "</ul>" : "") +
        '<div class="q-body">' + s.q.map(function (q, i) { return champ(si, q, i); }).join("") + "</div>" +
        (s.note ? '<p class="q-note">' + esc(nb(s.note)) + "</p>" : "") +
        '<p class="q-skip" hidden></p></section>';
    }).join("");
    rail.innerHTML = SECTIONS.map(function (s, si) {
      return '<li data-r="' + si + '"><a href="#partie-' + (si + 1) + '"><span class="r-n">' + (si + 1) + '</span><span class="r-t">' + esc(nb(s.titre)) + '</span><span class="r-ok" aria-hidden="true"></span></a></li>';
    }).join("");
  }

  /* ---------- lecture des réponses ---------- */
  function lire() {
    var out = [];
    SECTIONS.forEach(function (s, si) {
      var secEl = $("#partie-" + (si + 1)), lignes = [];
      if (secEl.hidden) return;
      s.q.forEach(function (q) {
        var el = $('[data-l="' + q.l.replace(/"/g, '\\"') + '"]', secEl); if (!el || el.hidden) return;
        var nm = name(si, q.k), val = "";
        if (q.lignes) {
          var rows = [];
          $$(".q-ligne", el).forEach(function (r) {
            if (r.hidden) return;
            var parts = [], ck = $('input[type="checkbox"]', r);
            if (ck && ck.checked) parts.push(ck.dataset.c);
            $$('input[type="text"]', r).forEach(function (i) { if (i.value.trim()) parts.push(i.dataset.c + " : " + i.value.trim()); });
            if (parts.length) rows.push("  - " + r.dataset.ligne + " → " + parts.join(" ; "));
          });
          if (rows.length) lignes.push(q.l + " :\n" + rows.join("\n"));
          return;
        }
        if (q.choix) { var r = $('input[name="' + nm + '"]:checked', el); val = r ? r.value : ""; }
        else if (q.multi) { val = $$('input:checked', el).map(function (i) { return i.value; }).join(", "); }
        else { var c = $("input,textarea", el); val = c ? c.value.trim() : ""; }
        if (val) lignes.push(q.l + " : " + val);
      });
      if (lignes.length) out.push({ titre: (si + 1) + ". " + s.titre, lignes: lignes });
    });
    return out;
  }
  function val(k) { var e = form.elements[name(0, k)]; return e ? (e.value || "").trim() : ""; }
  function formule() { var r = $('input[name="' + name(0, "formule") + '"]:checked', form); return r ? r.value : ""; }
  function recap() {
    var tete = "QUESTIONNAIRE · " + (val("logement") || "logement") + "\nDe : " + val("nom") + " · " + val("email") + (val("tel") ? " · " + val("tel") : "") + "\nFormule : " + (formule() || "non précisée") + "\nReçu le : " + new Date().toLocaleString("fr-FR") + "\n";
    return tete + lire().map(function (b) { return "\n== " + b.titre + " ==\n" + b.lignes.join("\n"); }).join("\n") + "\n";
  }

  /* ---------- brouillon ---------- */
  function etatForm() {
    var d = {};
    $$("input,textarea", form).forEach(function (e) {
      if (!e.name) return;
      if (e.type === "radio") { if (e.checked) d[e.name] = e.value; }
      else if (e.type === "checkbox") { if (e.checked) d[e.name] = 1; }
      else if (e.value) d[e.name] = e.value;
    });
    return d;
  }
  function sauver() {
    try { localStorage.setItem(KEY, JSON.stringify({ d: etatForm(), t: Date.now() })); saveEl.textContent = "Brouillon enregistré sur cet appareil"; saveEl.dataset.ok = "1"; }
    catch (e) { saveEl.textContent = "Brouillon non enregistré (stockage bloqué) : envoyez avant de fermer la page"; }
  }
  function restaurer() {
    var raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    if (!raw || !raw.d) return false;
    $$("input,textarea", form).forEach(function (e) {
      var v = raw.d[e.name]; if (v == null) return;
      if (e.type === "radio") e.checked = e.value === v;
      else if (e.type === "checkbox") e.checked = true;
      else e.value = v;
    });
    return Object.keys(raw.d).length > 0;
  }

  /* ---------- affichage selon la formule, avancement ---------- */
  function majFormule() {
    var f = (formule() || "").toLowerCase().replace(/ .*/, ""), rang = ORDRE[f] || 3; /* « je ne sais pas » → tout afficher */
    $$("[data-min]", form).forEach(function (el) {
      var cache = (ORDRE[el.dataset.min] || 0) > rang;
      el.hidden = cache;
    });
    $$(".q-sec", form).forEach(function (sec, i) {
      var skip = $(".q-skip", sec);
      var tout = $$(".q", sec).every(function (q) { return q.hidden; });
      var cacheTout = sec.hidden;
      if (!cacheTout && tout) { sec.hidden = true; }
      rail.children[i].hidden = sec.hidden;
      if (sec.dataset.min && sec.hidden) { skip.hidden = false; }
    });
    $$("#q-form .q-sec").forEach(function (sec, i) { rail.children[i].hidden = sec.hidden; });
    var f2 = $("#q-formule-note");
    f2.hidden = !(f === "essentiel");
  }
  function majAvancement() {
    var touche = 0, total = 0;
    $$(".q-sec", form).forEach(function (sec, i) {
      if (sec.hidden) return;
      total++;
      var ok = $$("input,textarea", sec).some(function (e) { return (e.type === "radio" || e.type === "checkbox") ? e.checked : e.value.trim() !== ""; });
      rail.children[i].classList.toggle("fait", ok);
      if (ok) touche++;
    });
    prog.textContent = touche + " partie" + (touche > 1 ? "s" : "") + " sur " + total + " commencée" + (touche > 1 ? "s" : "");
    $("#q-bar").style.setProperty("--p", total ? (touche / total) : 0);
  }
  var tempo = 0;
  function change() { majFormule(); majAvancement(); clearTimeout(tempo); tempo = setTimeout(sauver, 350); }

  /* ---------- sommaire : partie en cours ---------- */
  function suivre() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.dataset.s;
        Array.prototype.forEach.call(rail.children, function (li) { li.classList.toggle("actif", +li.dataset.r === i); });
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    $$(".q-sec", form).forEach(function (s) { io.observe(s); });
  }

  /* ---------- envoi ---------- */
  var status = $("#q-status");
  function msg(html, kind) { status.className = "q-status " + (kind || ""); status.innerHTML = html; status.hidden = !html; }
  function telecharger(text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = "questionnaire-" + (val("logement") || "livret").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".txt";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function fallback(text) {
    var mail = C.email || "";
    msg("<b>L'envoi automatique n'est pas disponible pour le moment.</b><span>Vos réponses ne sont pas perdues : copiez-les ou téléchargez-les, puis envoyez-les à <b>" + esc(mail) + '</b>.</span><div class="q-actions"><button type="button" class="btn small" id="q-copy">Copier mes réponses</button><button type="button" class="btn small trait" id="q-dl">Télécharger (.txt)</button><a class="btn small trait" href="mailto:' + esc(mail) + "?subject=" + encodeURIComponent("Questionnaire · " + (val("logement") || "mon livret")) + '">Ouvrir mon e-mail</a></div>', "info");
    $("#q-copy").addEventListener("click", function () { (window.cdhCopy ? window.cdhCopy(text) : Promise.resolve(false)).then(function (ok) { $("#q-copy").textContent = ok ? "Copié" : "Utilisez « Télécharger »"; }); });
    $("#q-dl").addEventListener("click", function () { telecharger(text); });
  }
  window.addEventListener("pagehide", function () { clearTimeout(tempo); if (!form.hidden) sauver(); });
  form.addEventListener("input", change);
  form.addEventListener("change", change);
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if ($("#q-pot").value) return; /* champ piège anti-robot */
    var bad = ["nom", "email", "logement"].filter(function (k) { var e = form.elements[name(0, k)]; var ok = e.value.trim() && (k !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value.trim())); e.setAttribute("aria-invalid", ok ? "false" : "true"); return !ok; });
    if (bad.length) { form.elements[name(0, bad[0])].focus(); msg("Il manque votre nom, un e-mail valide et le nom du logement (partie 1).", "err"); return; }
    if (!$("#q-ok").checked) { $("#q-ok").focus(); msg("Cochez la case d'accord pour envoyer le questionnaire.", "err"); return; }
    var text = recap(), btn = $("#q-send"), endpoint = C.formulaireQuestionnaire || C.formulaireDevis || "";
    if (!endpoint) { fallback(text); return; }
    btn.disabled = true; var lab = btn.textContent; btn.textContent = "Envoi…"; msg("");
    var body = new URLSearchParams();
    body.set("_subject", "Questionnaire · " + (val("logement") || val("nom")));
    body.set("email", val("email")); body.set("nom", val("nom")); body.set("logement", val("logement")); body.set("formule", formule()); body.set("questionnaire", text);
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" }, body: body.toString() })
      .then(function (r) {
        if (!r.ok) throw new Error("http");
        try { localStorage.removeItem(KEY); } catch (e) {}
        form.hidden = true; $("#q-final").hidden = true; $("#q-tools").hidden = true;
        $("#q-merci").hidden = false; $("#q-merci-nom").textContent = (val("nom").split(" ")[0] || "").trim();
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(function () { btn.disabled = false; btn.textContent = lab; fallback(text); });
  });
  $("#q-vider").addEventListener("click", function () {
    if (!window.confirm("Effacer toutes vos réponses sur cet appareil ?")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    form.reset(); change(); saveEl.textContent = "Réponses effacées"; msg("");
  });
  $("#q-fichier").addEventListener("click", function () { telecharger(recap()); });

  /* ---------- démarrage ---------- */
  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.marque || el.textContent; });
  document.querySelectorAll("[data-mail]").forEach(function (a) { a.href = "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent("Questionnaire"); a.textContent = C.email || a.textContent; });
  build();
  if (restaurer()) { $("#q-reprise").hidden = false; }
  majFormule(); majAvancement(); suivre();
})();
