/* Questionnaire en ligne : le futur client décrit son logement, on en tire le livret.
   - le contenu des questions est décrit dans SECTIONS (plus bas, modifiable)
   - les réponses sont gardées sur l'appareil au fil de la saisie (brouillon), jamais envoyées avant le clic final
   - l'envoi passe par Formspree (config.js → formulaireQuestionnaire, sinon formulaireDevis) ;
     sans adresse configurée, le client copie ou télécharge ses réponses et les envoie par e-mail
   - photos et fichiers (notices, logo, vidéos) partent dans le dossier privé Supabase « depots »

   Types de questions (propriétés d'une question q) :
     (rien)      champ texte ; type: "email" | "tel" | "url" | "date" ; zone: n → zone de texte
     choix       boutons à choix unique ; autre: "Précisez" → champ qui s'ouvre sur « Autre »
     multi       cases à cocher ; plus: [...] → bouton « + » et menu d'autres choix ; autre: idem choix
     ouinon      Oui / Non ; detail: libellé de la zone d'explication ; detailSi: "Oui" → zone seulement si Oui
     cas         une seule case à cocher
     compteurs   [{ k, l, min, max, val }] → compteurs − / +
     heure       "16:00" → compteur d'horaire (pas de 30 min) ; pre: « À partir de », « Avant »…
     plage       ["08:00", "22:00"] → « de … à … »
     adresse     "ban" → suggestions d'adresses postales (Géoplateforme IGN) ; cplt: 1 → champ complément
     groupes     listes à cocher par catégorie, les champs s'ouvrent quand la case est cochée ; ajout: libellé du bouton
     rep         lignes répétables (cols), bouton d'ajout, max ; une colonne « lieu » cherche les lieux (OpenStreetMap)
     couleurs    pastilles prédéfinies + couleur personnalisée (spectre et code)
     bandeau     couleurs du porte-clés + case « même couleur que le livret »
     fichiers    { kind, accept, max, maxMo } → dépôt de fichiers
     photosIci   { sujet, prec, bouton } → ajoute des photos à la liste générale, avec un sujet déjà choisi
     rappel      encadré des supports compris dans la formule
   Communs : k (clé), l (libellé), h (aide sous le libellé), hApres (aide grisée sous le champ), req (obligatoire),
     reqSauf (clé d'une case qui dispense), min (formule minimale), si { k, v: [...], sauf: [...] } (affichage conditionnel) */
(function () {
  var C = window.CDH_CONFIG || {}, T = window.CDH_TARIFS || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* espaces insécables à la française : « mot : » et « « texte » » */
  var nb = function (s) { return String(s).replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« "); };
  var KEY = "cdh:questionnaire:v1";
  var ORDRE = { essentiel: 1, confort: 2, premium: 3 };

  /* ---------- listes ---------- */
  var APPAREILS = [
    { t: "Gros électroménager", items: [
      { l: "Lave-linge", q: "Où sont la lessive et l'étendoir ?" },
      { l: "Sèche-linge", q: "Bac à eau ou filtre à vider ?" },
      { l: "Lave-vaisselle", q: "Où sont les tablettes ?" },
      { l: "Four" },
      { l: "Plaques de cuisson (induction, gaz, vitrocéramique)", q: "Sécurité enfant à déverrouiller ?" },
      { l: "Réfrigérateur, congélateur" }] },
    { t: "Petit électroménager", items: [
      { l: "Machine à café (capsules, grains, filtre)", q: "Quel café, et où sont les capsules ou filtres ?" },
      { l: "Micro-ondes" },
      { l: "Bouilloire, grille-pain" },
      { l: "Hotte aspirante" },
      { l: "Aspirateur", q: "Où est-il rangé ?" }] },
    { t: "Chauffage et confort", items: [
      { l: "Poêle ou cheminée", q: "Où est le bois, comment l'allumer ?" },
      { l: "Volets roulants, store banne", q: "Manuels, électriques ou à télécommande ?" },
      { l: "Ventilateur, déshumidificateur" }] },
    { t: "Loisirs et extérieur", items: [
      { l: "Spa, jacuzzi, sauna", q: "Horaires et règles d'utilisation ?" },
      { l: "Piscine", q: "Période d'ouverture, chauffée, horaires ?" },
      { l: "Barbecue, plancha", q: "Charbon, gaz ou électrique ? Où est le combustible ?" },
      { l: "Console de jeux, enceinte" }] },
    { t: "Sécurité et maison", items: [
      { l: "Alarme", q: "Comment l'activer et la couper ? (sans le code)" },
      { l: "Coffre-fort", q: "Comment le voyageur choisit-il son code ?" },
      { l: "Borne de recharge électrique", q: "Type de prise, gratuite ou payante ?" }] }
  ];
  var SERVICES = [{ items: ["Départ tardif", "Arrivée anticipée", "Ménage en cours de séjour", "Linge ou serviettes en plus", "Panier petit-déjeuner ou produits locaux", "Bois pour la cheminée ou le poêle", "Location de vélos", "Transfert depuis la gare ou l'aéroport", "Lit bébé, chaise haute"].map(function (l) { return { l: l }; }) }];
  var LIEUX_CATS = [
    { t: "Adresses utiles", items: ["Boulangerie", "Supérette ou supermarché", "Marché", "Pharmacie", "Médecin ou maison de santé", "Restaurant", "Café ou bar", "Producteur, cave, épicerie fine", "Autre adresse"] },
    { t: "Sorties et activités", items: ["Balade ou randonnée", "Visite (village, château, musée)", "Activité avec des enfants", "Idée pour un jour de pluie", "Autre sortie"] }
  ];
  var LANGUES = ["Français", "Anglais", "Allemand", "Italien", "Espagnol", "Néerlandais"];
  var AUTRES_LANGUES = ["Arabe", "Catalan", "Chinois", "Coréen", "Danois", "Finnois", "Grec", "Hébreu", "Hindi", "Hongrois", "Japonais", "Norvégien", "Polonais", "Portugais", "Roumain", "Russe", "Suédois", "Tchèque", "Turc", "Ukrainien"];
  var PALETTE = [
    { nom: "Vert sapin", hex: "#1F5B4C" }, { nom: "Terracotta", hex: "#A3402B" }, { nom: "Bleu lac", hex: "#1D5C7A" }, { nom: "Olive", hex: "#56632A" },
    { nom: "Lavande", hex: "#6A4C93" }, { nom: "Caramel", hex: "#B5651D" }, { nom: "Bleu ardoise", hex: "#2E3A59" }, { nom: "Framboise", hex: "#8C2F4B" }
  ];
  var BANDEAU = T.couleurs || [{ id: "nuit", nom: "Bleu nuit", hex: "#1F3A5F" }];
  var CLES = ["Boîte à clés", "Serrure à code", "Chez un voisin", "À l'accueil", "Remise en main propre", "Autre"];
  var CONTACT = [{ k: "nom", l: "Nom" }, { k: "tel", l: "Numéro", type: "tel" }, { k: "role", l: "Rôle", h: "Co-hôte, voisin, plombier…" }];

  var SECTIONS = [
    { id: "logement", titre: "Vous et votre logement", intro: "Ces informations servent à créer votre livret et à vous recontacter. Si vous avez une annonce en ligne, donnez-nous son lien : nous y reprenons déjà beaucoup de choses.",
      q: [
        { k: "nom", l: "Vos nom et prénom", ac: "name", req: 1 },
        { k: "email", l: "Votre e-mail", type: "email", ac: "email", req: 1, h: "Pour vous répondre et vous envoyer l'aperçu de votre livret." },
        { k: "tel", l: "Votre téléphone", type: "tel", ac: "tel", h: "Facultatif : utile pour un point rapide au besoin." },
        { k: "type", l: "Type de logement", choix: ["Appartement", "Maison", "Gîte", "Chambres d'hôtes", "Hôtel"], req: 1 },
        { k: "logement", l: "Nom du logement tel que vos voyageurs le connaissent", req: 1 },
        { k: "annonce", l: "Lien de l'annonce", type: "url", h: "Airbnb, Booking, Abritel ou votre site." },
        { k: "adresse", l: "Adresse complète", adresse: "ban", ac: "street-address", h: "Commencez à taper : choisissez votre adresse dans la liste.", req: 1 },
        { k: "acces", l: "Étage, ascenseur, bâtiment, numéro de porte" },
        { k: "capacite", l: "Chambres et voyageurs", compteurs: [{ k: "chambres", l: "Nombre de chambres", min: 0, max: 40, val: 1, h: "0 pour un studio" }, { k: "voyageurs", l: "Voyageurs maximum", min: 1, max: 80, val: 2 }] },
        { k: "formule", l: "Formule choisie", choix: ["Confort", "Premium", "Je ne sais pas encore"], formule: 1, req: 1 },
        { k: "date", l: "Date de la prochaine réservation, ou date souhaitée de mise en ligne", type: "date" }
      ] },
    { id: "accueil", titre: "Le mot d'accueil et le contact", intro: "Le livret s'ouvre sur une carte d'accueil signée de votre main. Quelques mots suffisent : nous rédigeons le message.",
      q: [
        { k: "signature", l: "Signature à afficher", h: "Par exemple « Claire & Julien » ou « L'équipe des Ondines »." },
        { k: "ressortir", l: "Ce qui doit ressortir de l'accueil", h: "Le calme, la vue, la famille, le quartier…", zone: 2 },
        { k: "ton", l: "Ton souhaité", choix: ["Chaleureux, avec tutoiement", "Chaleureux, avec vouvoiement", "Sobre et professionnel"] },
        { k: "tel-voy", l: "Numéro de téléphone à donner aux voyageurs", type: "tel", req: 1 },
        { k: "whatsapp", l: "WhatsApp", choix: ["Même numéro", "Un autre numéro (à préciser plus bas)", "Pas de WhatsApp"] },
        { k: "mail-voy", l: "E-mail à donner aux voyageurs", type: "email" },
        { k: "canal", l: "Par où préférez-vous recevoir les demandes ?", multi: ["WhatsApp", "SMS", "E-mail"], req: 1 },
        { k: "dispo", l: "Quand êtes-vous joignable ?", plage: ["08:00", "22:00"] },
        { k: "dispo-p", l: "Précisions sur vos horaires (facultatif)", h: "Délai de réponse, jours où vous n'êtes pas joignable…", zone: 2 },
        { k: "relais", l: "Qui contacter si vous êtes absent ?", h: "Co-hôte, voisin, conciergerie.", rep: { cols: CONTACT, add: "Ajouter un contact", max: 6 } }
      ] },
    { id: "arrivee", titre: "Avant l'arrivée : venir, se garer, entrer", intro: "Cette partie devient la page « Avant votre arrivée », dont vous enverrez le lien à vos voyageurs la veille. C'est elle qui évite les appels à 23 h.",
      q: [
        { k: "heure-arr", l: "Heure d'arrivée possible", heure: "16:00", pre: "À partir de" },
        { k: "autonome", l: "Arrivée autonome ou accueil en personne ?", choix: ["Arrivée autonome", "Accueil en personne", "Selon les séjours"] },
        { k: "train", l: "En train : gare la plus proche, puis bus, tram ou taxi ?", zone: 2 },
        { k: "voiture", l: "En voiture : où se garer ?", h: "Gratuit ou payant ? Code ou badge de parking ?", zone: 2 },
        { k: "entree", l: "Comment trouver l'entrée ?", h: "Porte, couleur, sonnette, interphone, portail…", zone: 2, photosIci: { sujet: "Façade ou entrée", prec: "Entrée, interphone", bouton: "Ajouter des photos (entrée, interphone, sonnette)" } },
        { k: "cles", l: "Récupération des clés", choix: CLES, autre: "Précisez", req: 1 },
        { k: "boite", l: "Où est la boîte à clés et comment l'ouvrir ?", h: "Ne notez pas le code ici : écrivez « code envoyé par message ». Le livret dira où le trouver, sans l'afficher.", zone: 2, si: { k: "cles", v: ["Boîte à clés"] }, req: 1 },
        { k: "serrure", l: "Où est la serrure à code et comment l'utiliser ?", h: "Ne notez pas le code ici : écrivez « code envoyé par message ».", zone: 2, si: { k: "cles", v: ["Serrure à code"] }, req: 1 },
        { k: "voisin", l: "Chez qui récupérer les clés ?", h: "Nom, adresse, et à quelles heures il est là.", zone: 2, si: { k: "cles", v: ["Chez un voisin"] }, req: 1 },
        { k: "accueil-cles", l: "Où est l'accueil et quand est-il ouvert ?", zone: 2, si: { k: "cles", v: ["À l'accueil"] }, req: 1 },
        { k: "main-propre", l: "Où vous retrouver, et comment le voyageur vous prévient-il de son heure d'arrivée ?", zone: 2, si: { k: "cles", v: ["Remise en main propre"] }, req: 1 },
        { k: "cles-autre", l: "Expliquez comment le voyageur récupère les clés", zone: 2, si: { k: "cles", v: ["Autre"] }, req: 1 },
        { k: "quelle-cle", l: "Quelle clé ouvre quoi ?", si: { k: "cles", sauf: ["Serrure à code"] } },
        { k: "tardive", l: "Arrivée tardive possible ?", ouinon: 1, detail: "Que doit faire le voyageur ? (facultatif)" },
        { k: "anticipee", l: "Arrivée anticipée ou dépôt des bagages possible ?", ouinon: 1, detail: "Dans quelles conditions ? (facultatif)" }
      ] },
    { id: "wifi", titre: "Wi-Fi et essentiels", intro: "Le Wi-Fi s'affiche en tête du livret, avec un bouton pour copier le mot de passe.",
      q: [
        { k: "wifi", l: "Nom du réseau Wi-Fi", hApres: "Vérifiez que le nom est exact, majuscules et espaces compris.", req: 1, reqSauf: "sans-wifi" },
        { k: "wifi-mdp", l: "Mot de passe du Wi-Fi", h: "Il s'affichera dans le livret. Si vous le changez souvent, vous pourrez le modifier vous-même ensuite.", req: 1, reqSauf: "sans-wifi" },
        { k: "sans-wifi", l: "Pas de Wi-Fi", cas: "Il n'y a pas de Wi-Fi dans le logement" },
        { k: "box", l: "Où est la box, et que faire si le Wi-Fi coupe ?", zone: 2 },
        { k: "tv", l: "Télévision", h: "Chaînes, Netflix ou autres applis, télécommandes.", zone: 2 },
        { k: "chauffage", l: "Chauffage", h: "Type (radiateurs, sol, poêle, pompe à chaleur) et réglage conseillé.", zone: 2 },
        { k: "clim", l: "Climatisation", ouinon: 1, detailSi: "Oui", detail: "Comment l'allumer et la régler ?" },
        { k: "eau-chaude", l: "Eau chaude : y a-t-il une limite à connaître ?", h: "Par exemple : ballon de 150 litres, soit deux douches à la suite, puis environ une heure pour qu'il se recharge. Laissez vide si l'eau chaude ne manque jamais." },
        { k: "disjoncteur", l: "Où sont le disjoncteur et l'arrivée d'eau ?" },
        { k: "lits", l: "Lits", h: "Canapé-lit à déplier, lit parapluie, linge supplémentaire (où ?).", zone: 2 }
      ] },
    { id: "equipements", titre: "Équipements et modes d'emploi", intro: "Cochez les appareils présents chez vous : les champs s'ouvrent. Notez la marque, le modèle et ce qui pose souvent question, nous en faisons un mode d'emploi en étapes.",
      q: [
        { k: "appareils", l: "Appareils", groupes: APPAREILS, check: "J'en ai un", cols: [{ l: "Marque" }, { l: "Modèle" }, { l: "Ce qui pose question", h: "Programme conseillé, piège à éviter…" }], ajout: "Ajouter un appareil", ajoutNom: "Appareil" },
        { k: "classeur", l: "Vous avez déjà un classeur ou des notices ?", h: "Ajoutez-les ici, en PDF ou en photo : on s'en sert comme base pour les modes d'emploi.", fichiers: { kind: "notice", accept: "application/pdf,image/*", max: 10, maxMo: 20, bouton: "Ajouter des fichiers" } }
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
    { id: "services", titre: "Services en plus", min: "confort", intro: "Chaque service a un bouton « Demander » qui envoie un message déjà rédigé. Deux départs tardifs à 20 € remboursent déjà le livret. Cochez ceux que vous proposez et indiquez leur prix.",
      q: [
        { k: "services", l: "Services", groupes: SERVICES, check: "Je le propose", cols: [{ l: "Prix" }, { l: "Conditions", h: "Délai, disponibilité, paiement." }], ajout: "Ajouter un service", ajoutNom: "Service" }
      ] },
    { id: "adresses", titre: "Vos bonnes adresses et sorties", intro: "C'est la partie que vos voyageurs ouvrent le plus. Choisissez une catégorie, tapez le nom du lieu : les suggestions s'affichent comme sur une carte. Ajoutez votre conseil, puis « Ajouter » pour passer au suivant. Jusqu'à 15 lieux : nous complétons le reste, avec les horaires, les distances et l'itinéraire.",
      q: [
        { k: "lieux", l: "Vos adresses et sorties", rep: { cols: [{ k: "cat", l: "Catégorie", select: LIEUX_CATS }, { k: "nom", l: "Nom du lieu", lieu: 1, h: "Tapez le nom : choisissez dans la liste" }, { k: "adr", l: "Adresse" }, { k: "conseil", l: "Votre conseil", h: "Ce que vous aimez, quoi commander", wide: 1 }], add: "Ajouter", max: 15, compte: 1 } },
        { k: "completer", l: "Si vous n'avez pas tout rempli", choix: ["Complétez pour moi avec des adresses et sorties vérifiées, je valide", "Ne complétez rien, je donne tout moi-même"], h: "Nous cherchons les bonnes adresses autour du logement (nom, distance, horaires) et vous les montrons avant la mise en ligne." },
        { k: "partenaire", l: "Un partenaire qui offre une réduction à vos voyageurs ?", h: "Restaurant, location, spa : on l'affiche en bon plan.", zone: 2 }
      ] },
    { id: "depart", titre: "Départ et avis", intro: "Le voyageur coche une liste avant de partir. Quand tout est coché, un bouton l'emmène vers votre page d'avis.",
      q: [
        { k: "heure-dep", l: "Heure de départ", heure: "11:00", pre: "Avant" },
        { k: "avant-dep", l: "Que doit faire le voyageur avant de partir ?", h: "Vaisselle, poubelles, linge, fenêtres, chauffage…", zone: 3 },
        { k: "cles-dep", l: "Où laisser les clés ?", multi: ["Dans la boîte à clés", "Sur la table de l'entrée ou de la cuisine", "À l'accueil", "Dans la boîte aux lettres", "En main propre", "Porte claquée (serrure à code)", "Autre"], autre: "Précisez", autreZone: 1, req: 1 },
        { k: "avis", l: "Lien de votre page d'avis", h: "Airbnb, Booking, Google… Ajoutez-en plusieurs si besoin.", rep: { cols: [{ k: "url", l: "Lien", type: "url" }], add: "Ajouter un lien", max: 5 } },
        { k: "mot", l: "Un dernier mot pour vos voyageurs ?", zone: 2 }
      ] },
    { id: "securite", titre: "Sécurité et urgences", intro: "Les numéros nationaux (112, 15, 17, 18) et l'hôpital le plus proche sont ajoutés par nos soins. Il nous manque seulement ce qui est propre à votre logement.",
      q: [
        { k: "extincteur", l: "Où sont l'extincteur et la trousse de secours ?" },
        { k: "coupures", l: "Où couper l'eau, l'électricité et le gaz ?", zone: 2 },
        { k: "artisan", l: "Un voisin ou un artisan à appeler en cas de souci", h: "Fuite, panne : nom, numéro et rôle.", rep: { cols: CONTACT, add: "Ajouter un contact", max: 6 } },
        { k: "vigilance", l: "Un point de vigilance ?", h: "Escalier raide, piscine non clôturée, route passante…", zone: 2 }
      ] },
    { id: "style", titre: "Langues, style et supports QR", intro: "Le dernier tour : l'allure du livret et l'objet que vos voyageurs scanneront.",
      q: [
        { k: "langues", l: "Langues du livret", h: "Confort : 4 langues au choix (29 € par langue en plus). Premium : langues illimitées. Une autre langue ? Bouton « + ».", multi: LANGUES, plus: AUTRES_LANGUES, req: 1 },
        { k: "couleur", l: "Couleur du livret", h: "Choisissez une couleur, ou décrivez une ambiance juste en dessous.", couleurs: PALETTE },
        { k: "ambiance", l: "L'ambiance souhaitée", h: "Par exemple « bord de lac », « Provence », « chalet chaleureux ».", zone: 2 },
        { k: "logo", l: "Votre logo", min: "premium", h: "PNG (fond transparent de préférence), JPG ou SVG.", fichiers: { kind: "logo", accept: "image/png,image/jpeg,image/webp,image/svg+xml", max: 1, maxMo: 10, bouton: "Ajouter mon logo" } },
        { k: "videos", l: "Vos vidéos tutos", min: "premium", h: "3 vidéos maximum, 50 Mo chacune (environ 45 secondes filmées au téléphone). Plus longues ? Donnez un lien juste en dessous.", fichiers: { kind: "video", accept: "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm", max: 3, maxMo: 50, bouton: "Ajouter des vidéos" } },
        { k: "videos-lien", l: "Lien vers vos vidéos (facultatif)", min: "premium", h: "YouTube, Google Drive, WeTransfer…", type: "url" },
        { k: "rappel", l: "Supports compris", min: "confort", rappel: 1 },
        { k: "couleur-support", l: "Couleur du bandeau (porte-clés)", min: "confort", bandeau: BANDEAU },
        { k: "gravure", l: "Nom à imprimer sur le porte-clés", min: "confort", h: "Par défaut, le nom de votre logement. 25 caractères maximum.", max: 25, req: 1 },
        { k: "livraison", l: "Adresse de livraison des porte-clés", min: "confort", adresse: "ban", cplt: 1, ac: "street-address", h: "Commencez à taper : choisissez l'adresse dans la liste, le code postal suit.", req: 1 },
        { k: "autre", l: "Autre chose à nous dire ?", zone: 3 }
      ] },
    { id: "photos", titre: "Photos à nous envoyer", depot: 1, introAlt: "Des photos prises au téléphone suffisent, en lumière du jour et à l'horizontale. Envoyez-les par WhatsApp, par e-mail ou par un lien de partage (Google Drive, WeTransfer).", intro: "Des photos prises au téléphone suffisent, en lumière du jour et à l'horizontale. Ajoutez-les ci-dessous : elles sont réduites automatiquement et envoyées en même temps que vos réponses.",
      liste: ["Une belle photo du logement ou de la vue, pour la couverture", "La façade ou l'entrée, pour que le voyageur la reconnaisse", "La boîte à clés ou la serrure à code", "Le parking ou l'emplacement de stationnement", "Chaque appareil de la partie 5 : en entier, puis ses boutons de face", "Le tableau électrique et l'arrivée d'eau", "Les poubelles et les bacs de tri", "Vos photos des environs, si vous voulez qu'on les utilise pour les sorties", "Votre logo et, si vous le souhaitez, une photo pour la couverture (formule Premium)"],
      q: [
        { k: "photos", l: "Autre moyen d'envoi (facultatif)", h: "Un lien de partage (Google Drive, WeTransfer), ou « je les envoie par WhatsApp / par e-mail ».", zone: 2 }
      ] }
  ];

  var SI = {}; SECTIONS.forEach(function (s, i) { SI[s.id] = i; });

  var SUJETS = ["Couverture : logement ou vue", "Façade ou entrée", "Boîte à clés ou serrure", "Parking", "Appareil, en entier", "Appareil, boutons de face", "Tableau électrique, arrivée d'eau", "Poubelles et tri", "Environs, sorties", "Logo", "Autre"];
  var MAXPHOTOS = 40, photos = [], fichiers = [], dossier = "", seq = 0;
  var DEPOT = !!(C.supabaseUrl && C.supabaseCle);

  var form = $("#q-form"), rail = $("#q-rail"), prog = $("#q-prog"), saveEl = $("#q-save");
  var tente = false; /* le client a déjà essayé d'envoyer : on signale les champs manquants au fil de la saisie */

  /* ---------- petits outils ---------- */
  function name(si, k) { return "s" + si + "_" + k; }
  function qid(si, q) { return "q-" + si + "-" + q.k; }
  function hm(v) { var m = /^(\d{1,2}):(\d{2})$/.exec(v || ""); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function fmtH(v) { var t = hm(v); if (t == null) return v || ""; var h = Math.floor(t / 60), m = t % 60; return h + " h" + (m ? " " + (m < 10 ? "0" : "") + m : ""); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function stepH(v, d) { var t = hm(v); if (t == null) t = 12 * 60; t = (t + d + 1440) % 1440; return pad(Math.floor(t / 60)) + ":" + pad(t % 60); }
  function slug(t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "fichier"; }
  function mo(b) { return Math.round(b / 1024 / 1024 * 10) / 10; }
  function hApres(q, id) { return q.hApres ? '<small class="q-h q-h-apres" id="' + id + '-ha">' + esc(nb(q.hApres)) + "</small>" : ""; }
  function reqMark(q) { return q.req ? ' <b class="q-req" title="obligatoire">*</b>' : ""; }

  /* ---------- construction des champs ---------- */
  function meta(si, q) {
    return ' data-k="' + q.k + '" data-l="' + esc(q.l) + '"' + (q.min ? ' data-min="' + q.min + '"' : "") + (q.formule ? ' data-formule="1"' : "") +
      (q.req ? ' data-req="1"' : "") + (q.reqSauf ? ' data-req-sauf="' + name(si, q.reqSauf) + '"' : "") +
      (q.si ? ' data-si="' + name(si, q.si.k) + '"' + (q.si.v ? ' data-si-v="' + esc(q.si.v.join("|")) + '"' : "") + (q.si.sauf ? ' data-si-sauf="' + esc(q.si.sauf.join("|")) + '"' : "") : "");
  }
  function stepper(nm, val, attrs, lab) {
    return '<div class="stepper q-stepper"><button type="button" data-q-step="-1" aria-label="Moins">−</button><input name="' + nm + '" value="' + esc(val) + '"' + attrs + ' aria-label="' + esc(lab) + '"><button type="button" data-q-step="1" aria-label="Plus">+</button></div>';
  }
  function hStepper(nm, val, lab) {
    return '<div class="stepper q-stepper q-heure"><button type="button" data-q-h="-30" aria-label="30 minutes plus tôt">−</button><input type="text" readonly inputmode="none" name="' + nm + '" value="' + val + '" aria-label="' + esc(lab) + '" aria-live="polite"><button type="button" data-q-h="30" aria-label="30 minutes plus tard">+</button></div>';
  }
  function opt(type, nm, v, lab, checked) {
    return '<label class="q-opt"><input type="' + type + '" name="' + nm + '" value="' + esc(v) + '"' + (checked ? " checked" : "") + "><span>" + esc(nb(lab)) + "</span></label>";
  }
  function colHtml(c, nm, id) {
    var lab = '<span>' + esc(nb(c.l)) + (c.h ? " <small>(" + esc(nb(c.h)) + ")</small>" : "") + "</span>";
    if (c.select) {
      return '<label class="q-col" for="' + id + '">' + lab + '<select id="' + id + '" name="' + nm + '" data-c="' + esc(c.l) + '"><option value="">Choisir…</option>' + c.select.map(function (g) {
        return '<optgroup label="' + esc(g.t) + '">' + g.items.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</optgroup>";
      }).join("") + "</select></label>";
    }
    var ac = c.lieu ? ' data-ac="lieu" role="combobox" aria-autocomplete="list" aria-expanded="false"' : "";
    return '<label class="q-col' + (c.wide ? " q-col-wide" : "") + (c.lieu ? " q-ac-wrap" : "") + '" for="' + id + '">' + lab + '<input id="' + id + '" name="' + nm + '" data-c="' + esc(c.l) + '" type="' + (c.type || "text") + '"' + (c.type === "tel" ? ' inputmode="tel"' : "") + (c.type === "url" ? ' inputmode="url" placeholder="https://"' : "") + ' autocomplete="off"' + ac + "></label>";
  }
  function repRow(si, q, i) {
    var nm = name(si, q.k), id = qid(si, q) + "-" + i;
    return '<div class="q-rep-row" data-i="' + i + '"><div class="q-cols q-cols-' + Math.min(q.rep.cols.length, 3) + '">' + q.rep.cols.map(function (c) { return colHtml(c, nm + "_" + i + "_" + c.k, id + "-" + c.k); }).join("") +
      (q.rep.cols.some(function (c) { return c.lieu; }) ? '<input type="hidden" name="' + nm + "_" + i + '_gps">' : "") +
      '</div><button type="button" class="q-rm" data-q-rm="1" aria-label="Retirer cette ligne">Retirer</button></div>';
  }
  function ligneHtml(nm, base, it, q, custom) {
    var cols = q.cols.slice(0, 2).concat(it.q ? [{ l: it.q }] : []).concat(q.cols.slice(2));
    return '<div class="q-ligne' + (custom ? " q-ligne-x" : "") + '" data-ligne="' + esc(it.l) + '">' +
      (custom ? '<label class="q-col q-col-nom"><span>' + esc(q.ajoutNom) + '</span><input type="text" name="' + base + '_nom" data-c="nom" autocomplete="off" placeholder="Nom"></label>'
        : '<label class="q-check"><input type="checkbox" name="' + base + '_ok" data-c="' + esc(q.check) + '"><span class="q-ligne-t">' + esc(nb(it.l)) + "</span></label>") +
      '<div class="q-cols q-cols-' + Math.min(cols.length, 3) + '"' + (custom ? "" : " hidden") + ">" + cols.map(function (c, j) {
        return '<label class="q-col"><span>' + esc(nb(c.l)) + (c.h ? " <small>(" + esc(nb(c.h.replace(/\.$/, ""))) + ")</small>" : "") + '</span><input name="' + base + "_" + j + '" data-c="' + esc(c.l) + '" type="text" autocomplete="off"></label>';
      }).join("") + "</div>" + (custom ? '<button type="button" class="q-rm" data-q-rm-x="1">Retirer</button>' : "") + "</div>";
  }

  function champ(si, q) {
    var id = qid(si, q), nm = name(si, q.k), lab = nb(q.l), m = meta(si, q);
    var h = q.h ? '<small class="q-h" id="' + id + '-h">' + esc(nb(q.h)) + "</small>" : "";
    var aria = q.h ? ' aria-describedby="' + id + '-h"' : "";
    var legend = '<legend class="q-lab">' + esc(lab) + reqMark(q) + "</legend>";
    var err = '<p class="q-err" hidden></p>';

    if (q.groupes) {
      return '<fieldset class="q q-lignes"' + m + ">" + legend + q.groupes.map(function (g, gi) {
        return (g.t ? '<p class="q-groupe-t">' + esc(g.t) + "</p>" : "") + g.items.map(function (it, i) { return ligneHtml(nm, nm + "_" + gi + "_" + i, it, q, false); }).join("");
      }).join("") + '<div class="q-ajouts" data-ajouts="' + nm + '"></div><input type="hidden" name="' + nm + '_xn" value="0">' +
        '<button type="button" class="btn trait small q-plus" data-q-ajout="' + nm + '">+ ' + esc(q.ajout) + "</button></fieldset>";
    }
    if (q.rep) {
      return '<fieldset class="q q-rep"' + m + ' data-rep="' + nm + '" data-max="' + q.rep.max + '">' + legend + h + (q.rep.compte ? '<p class="q-obj" aria-live="polite"></p>' : "") +
        '<div class="q-rep-rows">' + repRow(si, q, 0) + '</div><input type="hidden" name="' + nm + '_n" value="1">' +
        '<button type="button" class="btn trait small q-plus" data-q-add="' + nm + '">+ ' + esc(q.rep.add) + "</button>" + err + "</fieldset>";
    }
    if (q.choix) {
      return '<fieldset class="q q-choix"' + m + aria + ">" + legend + h + '<div class="q-opts">' + q.choix.map(function (o) { return opt("radio", nm, o, o); }).join("") + "</div>" +
        (q.autre ? '<label class="q-autre" hidden><span>' + esc(q.autre) + '</span><input type="text" name="' + nm + '_autre" autocomplete="off"></label>' : "") + err + "</fieldset>";
    }
    if (q.multi) {
      return '<fieldset class="q q-choix"' + m + aria + ">" + legend + h + '<div class="q-opts">' + q.multi.map(function (o, i) { return opt("checkbox", nm + "_" + i, o, o); }).join("") +
        (q.plus ? '<span class="q-plus-opts"></span><span class="q-plus-wrap"><button type="button" class="q-plus-btn" data-q-plus="' + nm + '" aria-label="Ajouter une autre langue" aria-expanded="false">+</button><select class="q-plus-sel" data-q-plus-sel="' + nm + '" hidden aria-label="Choisir une autre langue"><option value="">Autre langue…</option>' + q.plus.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + '</select></span><input type="hidden" name="' + nm + '_plus" value="">' : "") +
        "</div>" + (q.autre ? '<label class="q-autre" hidden><span>' + esc(q.autre) + "</span>" + (q.autreZone ? '<textarea name="' + nm + '_autre" rows="2"></textarea>' : '<input type="text" name="' + nm + '_autre" autocomplete="off">') + "</label>" : "") + err + "</fieldset>";
    }
    if (q.ouinon) {
      return '<fieldset class="q q-choix q-ouinon"' + m + ">" + legend + h + '<div class="q-opts">' + opt("radio", nm, "Oui", "Oui") + opt("radio", nm, "Non", "Non") + "</div>" +
        '<label class="q-detail"' + (q.detailSi ? " hidden" : "") + (q.detailSi ? ' data-detail-si="' + q.detailSi + '"' : "") + '><span>' + esc(nb(q.detail)) + '</span><textarea name="' + nm + '_detail" rows="2"></textarea></label>' + err + "</fieldset>";
    }
    if (q.cas) {
      return '<div class="q q-cas"' + m + '><label class="q-check"><input type="checkbox" name="' + nm + '" value="1"><span>' + esc(nb(q.cas)) + "</span></label></div>";
    }
    if (q.compteurs) {
      return '<fieldset class="q q-compteurs"' + m + ">" + legend + h + '<div class="q-duo">' + q.compteurs.map(function (c) {
        return '<div class="q-compteur"><span class="q-compteur-l">' + esc(c.l) + (c.h ? " <small>(" + esc(c.h) + ")</small>" : "") + "</span>" + stepper(nm + "_" + c.k, c.val, ' type="number" inputmode="numeric" min="' + c.min + '" max="' + c.max + '"', c.l) + "</div>";
      }).join("") + "</div></fieldset>";
    }
    if (q.heure) {
      return '<fieldset class="q q-h1"' + m + ">" + legend + h + '<div class="q-heure-row"><span class="q-pre">' + esc(q.pre || "") + "</span>" + hStepper(nm, q.heure, q.l) + "</div></fieldset>";
    }
    if (q.plage) {
      return '<fieldset class="q q-h1"' + m + ">" + legend + h + '<div class="q-heure-row"><span class="q-pre">de</span>' + hStepper(nm + "_de", q.plage[0], "Joignable à partir de") + '<span class="q-pre">à</span>' + hStepper(nm + "_a", q.plage[1], "Joignable jusqu'à") + "</div></fieldset>";
    }
    if (q.couleurs) {
      return '<fieldset class="q q-couleurs"' + m + ">" + legend + h + '<div class="q-swatches" role="radiogroup">' + q.couleurs.map(function (c) {
        return '<label class="q-sw" style="--c:' + c.hex + '" title="' + esc(c.nom) + '"><input type="radio" name="' + nm + '" value="' + c.hex + '" data-nom="' + esc(c.nom) + '"><span class="dot" aria-hidden="true"></span><span class="q-sw-n">' + esc(c.nom) + "</span></label>";
      }).join("") + '<label class="q-sw q-sw-perso" data-min="premium" title="Couleur personnalisée"><input type="radio" name="' + nm + '" value="perso" data-nom="Couleur personnalisée"><span class="dot" aria-hidden="true"></span><span class="q-sw-n">Couleur personnalisée</span></label></div>' +
        '<div class="q-perso" hidden><label><span>Spectre</span><input type="color" class="q-perso-color" value="#2e5e4e"></label><label><span>Code couleur</span><input type="text" class="q-perso-hex" name="' + nm + '_perso" maxlength="7" placeholder="#2E5E4E" spellcheck="false" autocomplete="off"></label></div></fieldset>';
    }
    if (q.bandeau) {
      return '<fieldset class="q q-couleurs q-bandeau"' + m + ">" + legend + h + '<label class="q-check q-meme"><input type="checkbox" name="' + nm + '_meme" value="1"><span>Même couleur que le livret <span class="q-meme-dot" aria-hidden="true"></span><span class="q-meme-n"></span></span></label>' +
        '<div class="q-swatches" role="radiogroup">' + q.bandeau.map(function (c, i) {
          return '<label class="q-sw" style="--c:' + c.hex + '" title="' + esc(c.nom) + '"><input type="radio" name="' + nm + '" value="' + c.id + '" data-nom="' + esc(c.nom) + '" data-hex="' + c.hex + '"' + (i === 0 ? " checked" : "") + '><span class="dot" aria-hidden="true"></span><span class="q-sw-n">' + esc(c.nom) + "</span></label>";
        }).join("") + "</div></fieldset>";
    }
    if (q.fichiers) {
      var F = q.fichiers;
      return '<div class="q q-fichiers"' + m + ' data-kind="' + F.kind + '"><p class="q-lab">' + esc(lab) + reqMark(q) + "</p>" + h +
        (DEPOT ? '<div class="q-drop" data-drop="' + F.kind + '"><label class="btn trait small q-add"><input type="file" data-fichiers="' + F.kind + '" accept="' + F.accept + '"' + (F.max > 1 ? " multiple" : "") + ' hidden>' + esc(F.bouton) + '</label><span class="q-drop-t">ou glissez-les ici</span></div><ul class="q-files" data-files="' + F.kind + '"></ul><p class="q-files-msg" aria-live="polite"></p>'
          : '<p class="q-h">Envoyez-les-nous par e-mail à <b>' + esc(C.email || "") + "</b> ou par WhatsApp.</p>") + "</div>";
    }
    if (q.rappel) {
      return '<div class="q q-rappel"' + m + '><p class="q-lab">' + esc(lab) + '</p><p class="q-rappel-t"></p></div>';
    }
    /* champ texte, adresse ou zone */
    var isAdr = !!q.adresse;
    var ctl = q.zone
      ? '<textarea id="' + id + '" name="' + nm + '" rows="' + (q.zone + 1) + '"' + aria + "></textarea>"
      : '<input id="' + id + '" name="' + nm + '" type="' + (q.type || "text") + '"' + (q.ac && !isAdr ? ' autocomplete="' + q.ac + '"' : ' autocomplete="off"') + (q.type === "email" ? ' inputmode="email"' : "") + (q.type === "tel" ? ' inputmode="tel"' : "") + (q.type === "url" ? ' inputmode="url" placeholder="https://"' : "") + (q.type === "date" ? ' min="' + new Date().toISOString().slice(0, 10) + '"' : "") + (q.max ? ' maxlength="' + q.max + '"' : "") + (isAdr ? ' data-ac="ban" role="combobox" aria-autocomplete="list" aria-expanded="false" placeholder="Numéro, rue, ville"' : "") + aria + ">";
    if (isAdr) ctl = '<div class="q-ac-wrap">' + ctl + '</div><input type="hidden" name="' + nm + '_gps"><input type="hidden" name="' + nm + '_cp">' + (q.cplt ? '<label class="q-col q-cplt"><span>Complément <small>(bâtiment, étage, nom sur la boîte aux lettres)</small></span><input type="text" name="' + nm + '_cplt" autocomplete="off"></label>' : "");
    var ph = q.photosIci && DEPOT ? '<div class="q-ici"><label class="btn trait small q-add"><input type="file" data-photos-ici="' + nm + '" accept="image/*" multiple hidden>' + esc(q.photosIci.bouton) + '</label><ul class="q-ici-list" data-ici="' + nm + '"></ul></div>' : "";
    return '<div class="q"' + m + '><label class="q-lab" for="' + id + '">' + esc(lab) + reqMark(q) + "</label>" + h + ctl + hApres(q, id) + ph + err + "</div>";
  }

  function depotHtml() {
    return '<div class="q-depot" id="q-depot"><p class="q-lab">Vos photos</p>' +
      '<small class="q-h">Choisissez-les dans votre galerie, ou prenez-les à l\'instant. Pour chaque photo, indiquez ce qu\'elle montre : cela nous évite de deviner. Elles ne sont pas conservées si vous fermez la page avant d\'envoyer.</small>' +
      '<label class="btn trait small q-add"><input type="file" id="q-files" accept="image/*" multiple hidden>Ajouter des photos</label>' +
      '<p class="q-count" id="q-count" aria-live="polite"></p><ul class="q-photos" id="q-photos"></ul></div>';
  }
  function build() {
    form.innerHTML = SECTIONS.map(function (s, si) {
      var n = si + 1;
      return '<section class="q-sec" id="partie-' + n + '" data-s="' + si + '"' + (s.min ? ' data-min="' + s.min + '"' : "") + ' aria-labelledby="t-' + n + '">' +
        '<header class="q-head"><span class="q-num" aria-hidden="true">' + n + '</span><div><h2 id="t-' + n + '">' + esc(nb(s.titre)) + '</h2><p class="q-intro">' + esc(nb(s.depot && !DEPOT ? s.introAlt : s.intro)) + "</p></div></header>" +
        (s.liste ? '<ul class="q-liste">' + s.liste.map(function (x) { return "<li>" + esc(nb(x)) + "</li>"; }).join("") + "</ul>" : "") +
        '<div class="q-body">' + s.q.map(function (q) { return champ(si, q); }).join("") + "</div>" +
        (s.depot && DEPOT ? depotHtml() : "") +
        '<p class="q-skip" hidden></p></section>';
    }).join("");
    rail.innerHTML = SECTIONS.map(function (s, si) {
      return '<li data-r="' + si + '"><a href="#partie-' + (si + 1) + '"><span class="r-n">' + (si + 1) + '</span><span class="r-t">' + esc(nb(s.titre)) + '</span><span class="r-ok" aria-hidden="true"></span></a></li>';
    }).join("");
  }
  function trouverQ(nm) {
    var m = /^s(\d+)_(.+)$/.exec(nm); if (!m) return null;
    var si = +m[1], q = SECTIONS[si] && SECTIONS[si].q.filter(function (x) { return x.k === m[2]; })[0];
    return q ? { si: si, q: q } : null;
  }

  /* ---------- lignes ajoutées (contacts, liens, lieux, appareils, services, langues) ---------- */
  function repEl(nm) { return $('[data-rep="' + nm + '"]', form); }
  function repN(nm, n) {
    var fs = repEl(nm), t = trouverQ(nm); if (!fs || !t) return;
    var rows = $(".q-rep-rows", fs), cur = $$(".q-rep-row", rows).length;
    n = Math.max(1, Math.min(+fs.dataset.max, n));
    for (var i = cur; i < n; i++) rows.insertAdjacentHTML("beforeend", repRow(t.si, t.q, i));
    form.elements[nm + "_n"].value = $$(".q-rep-row", rows).length;
    majRep(fs);
  }
  function majRep(fs) {
    var n = $$(".q-rep-row", fs).length, max = +fs.dataset.max, btn = $("[data-q-add]", fs);
    btn.hidden = n >= max;
    $$(".q-rep-row [data-q-rm]", fs).forEach(function (b) { b.hidden = n <= 1; });
    var obj = $(".q-obj", fs);
    if (obj) {
      var filled = $$(".q-rep-row", fs).filter(function (r) { var i = $('input[data-c="Nom du lieu"]', r); return i && i.value.trim(); }).length;
      obj.className = "q-obj" + (filled >= 10 ? " ok" : "");
      obj.textContent = filled + " lieu" + (filled > 1 ? "x" : "") + " sur " + max + " possibles. " + (filled >= max ? "C'est complet, merci !" : filled >= 10 ? "Votre livret sera bien garni, merci !" : "Visez au moins 6 adresses et 4 sorties : nous complétons le reste.");
    }
  }
  /* Retirer une ligne : on décale les valeurs des suivantes, puis on supprime la dernière (les noms restent continus) */
  function repRetirer(fs, row) {
    var rows = $$(".q-rep-row", fs), idx = rows.indexOf(row), nm = fs.dataset.rep;
    for (var i = idx; i < rows.length - 1; i++) {
      $$("input,select,textarea", rows[i]).forEach(function (el) {
        var nx = form.elements[el.name.replace(nm + "_" + i + "_", nm + "_" + (i + 1) + "_")]; if (nx) el.value = nx.value;
      });
    }
    rows[rows.length - 1].remove();
    form.elements[nm + "_n"].value = rows.length - 1;
    majRep(fs);
  }
  function ajoutN(nm, n) {
    var box = $('[data-ajouts="' + nm + '"]', form), t = trouverQ(nm); if (!box || !t) return;
    var cur = $$(".q-ligne-x", box).length;
    for (var i = cur; i < n; i++) box.insertAdjacentHTML("beforeend", ligneHtml(nm, nm + "_x" + i, { l: "Ajout " + (i + 1) }, t.q, true));
    form.elements[nm + "_xn"].value = $$(".q-ligne-x", box).length;
  }
  function ajoutRetirer(box, ligne) {
    var nm = box.dataset.ajouts, lignes = $$(".q-ligne-x", box), idx = lignes.indexOf(ligne);
    for (var i = idx; i < lignes.length - 1; i++) {
      $$("input", lignes[i]).forEach(function (el) { var nx = form.elements[el.name.replace(nm + "_x" + i + "_", nm + "_x" + (i + 1) + "_")]; if (nx) el.value = nx.value; });
    }
    lignes[lignes.length - 1].remove();
    form.elements[nm + "_xn"].value = lignes.length - 1;
  }
  function plusLangues(nm, liste) {
    var fs = $('[data-q-plus="' + nm + '"]', form); if (!fs) return;
    var box = fs.closest(".q-opts").querySelector(".q-plus-opts"), hid = form.elements[nm + "_plus"];
    var deja = $$("input", box).map(function (i) { return i.value; });
    liste.forEach(function (lg) {
      if (!lg || deja.indexOf(lg) > -1) return;
      box.insertAdjacentHTML("beforeend", opt("checkbox", nm + "_p" + $$("input", box).length, lg, lg, true));
      deja.push(lg);
    });
    hid.value = deja.join("|");
  }

  /* ---------- lecture des réponses ---------- */
  function vis(el) { return el && !el.hidden && !el.closest("[hidden]"); }
  function texte(si, q, el) {
    var nm = name(si, q.k), E = form.elements, v = function (n) { var e = E[n]; return e && e.value ? String(e.value).trim() : ""; };
    if (q.groupes) {
      var rows = [];
      $$(".q-ligne", el).forEach(function (r) {
        var parts = [], ck = $('input[type="checkbox"]', r), nomX = $('input[data-c="nom"]', r);
        if (ck && !ck.checked) return;
        if (nomX && !nomX.value.trim()) return;
        $$('.q-cols input', r).forEach(function (i) { if (i.value.trim()) parts.push(i.dataset.c + " : " + i.value.trim()); });
        rows.push("  - " + (nomX ? nomX.value.trim() + " (ajouté)" : r.dataset.ligne) + (parts.length ? " → " + parts.join(" ; ") : ""));
      });
      return rows.length ? "\n" + rows.join("\n") : "";
    }
    if (q.rep) {
      var out = [];
      $$(".q-rep-row", el).forEach(function (r) {
        var vals = {}, parts = [];
        q.rep.cols.forEach(function (c) { var e = $('[data-c="' + c.l + '"]', r); vals[c.k] = e ? e.value.trim() : ""; });
        if (q.k === "lieux") {
          if (!vals.nom && !vals.adr && !vals.conseil) return;
          var gps = v(nm + "_" + r.dataset.i + "_gps");
          parts = [(vals.cat || "Lieu") + " · " + (vals.nom || "sans nom")];
          var det = [];
          if (vals.adr) det.push("Adresse : " + vals.adr);
          if (vals.conseil) det.push("Votre conseil : " + vals.conseil);
          if (gps) det.push("GPS : " + gps);
          out.push("  - " + parts[0] + (det.length ? " → " + det.join(" ; ") : ""));
          return;
        }
        q.rep.cols.forEach(function (c) { if (vals[c.k]) parts.push((q.rep.cols.length > 1 ? c.l + " : " : "") + vals[c.k]); });
        if (parts.length) out.push("  - " + parts.join(" ; "));
      });
      return out.length ? "\n" + out.join("\n") : "";
    }
    if (q.choix) {
      var r = $('input[name="' + nm + '"]:checked', el), val = r ? r.value : "";
      if (val === "Autre" && q.autre && v(nm + "_autre")) val += " : " + v(nm + "_autre");
      return val;
    }
    if (q.multi) {
      return $$('.q-opts input[type="checkbox"]:checked', el).map(function (i) {
        return i.value === "Autre" && q.autre && v(nm + "_autre") ? "Autre : " + v(nm + "_autre") : i.value;
      }).join(", ");
    }
    if (q.ouinon) {
      var o = $('input[name="' + nm + '"]:checked', el); if (!o) return "";
      var d = v(nm + "_detail"), dEl = $(".q-detail", el);
      return o.value + (d && vis(dEl) ? " — " + d : "");
    }
    if (q.cas) { var c = E[nm]; return c && c.checked ? "oui" : ""; }
    if (q.compteurs) return q.compteurs.map(function (c) { return c.l + " : " + v(nm + "_" + c.k); }).join(" ; ");
    if (q.heure) return v(nm) ? (q.pre ? q.pre + " " : "") + fmtH(v(nm)) : "";
    if (q.plage) return v(nm + "_de") && v(nm + "_a") ? "de " + fmtH(v(nm + "_de")) + " à " + fmtH(v(nm + "_a")) : "";
    if (q.couleurs) {
      var cr = $('input[name="' + nm + '"]:checked', el); if (!cr) return "";
      if (cr.value === "perso") { var hx = hexOk(v(nm + "_perso")); return hx ? "Couleur personnalisée " + hx : ""; }
      return cr.dataset.nom + " (" + cr.value + ")";
    }
    if (q.bandeau) {
      if (E[nm + "_meme"] && E[nm + "_meme"].checked) { var lc = couleurLivret(); return "Même couleur que le livret" + (lc ? " (" + lc.hex + ")" : ""); }
      var br = $('input[name="' + nm + '"]:checked', el); return br ? br.dataset.nom + " (" + br.dataset.hex + ")" : "";
    }
    if (q.fichiers) {
      var fl = fichiers.filter(function (f) { return f.kind === q.fichiers.kind; });
      return fl.length ? fl.length + " fichier" + (fl.length > 1 ? "s" : "") + " joint" + (fl.length > 1 ? "s" : "") + " : " + fl.map(function (f) { return f.orig; }).join(", ") + " (voir la liste des fichiers en fin de message)" : "";
    }
    if (q.rappel) return "";
    if (q.adresse) {
      var a = v(nm), gps = v(nm + "_gps"), cp = v(nm + "_cp"), cplt = v(nm + "_cplt");
      if (!a) return "";
      return a + (cplt ? " — " + cplt : "") + (gps && !q.cplt ? " (GPS : " + gps + ")" : "") + (!cp && !gps ? " (adresse saisie à la main)" : "");
    }
    if (q.type === "date") { var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v(nm)); return dm ? dm[3] + "/" + dm[2] + "/" + dm[1] : v(nm); }
    return v(nm);
  }
  function lire() {
    var out = [];
    SECTIONS.forEach(function (s, si) {
      var secEl = $("#partie-" + (si + 1)), lignes = [];
      if (!secEl || secEl.hidden) return;
      s.q.forEach(function (q) {
        var el = $('[data-k="' + q.k + '"]', secEl); if (!vis(el)) return;
        var t = texte(si, q, el);
        if (t) lignes.push(q.l + " :" + (t.charAt(0) === "\n" ? t : " " + t));
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

  /* ---------- couleurs ---------- */
  function hexOk(h) { h = String(h || "").trim(); if (h && h[0] !== "#") h = "#" + h; return /^#[0-9a-f]{6}$/i.test(h) ? h.toUpperCase() : ""; }
  function couleurLivret() {
    var nm = name(SI.style, "couleur"), r = $('input[name="' + nm + '"]:checked', form); if (!r) return null;
    if (r.value === "perso") { var h = hexOk((form.elements[nm + "_perso"] || {}).value); return h ? { nom: "Couleur personnalisée", hex: h } : null; }
    return { nom: r.dataset.nom, hex: r.value };
  }
  function majCouleurs() {
    $$(".q-couleurs:not(.q-bandeau)", form).forEach(function (fs) {
      var r = $('input[type="radio"]:checked', fs), perso = $(".q-perso", fs), col = $(".q-perso-color", fs), hex = $(".q-perso-hex", fs);
      var on = !!(r && r.value === "perso" && vis(r.closest(".q-sw")));
      perso.hidden = !on;
      if (r && r.value === "perso" && !vis(r.closest(".q-sw"))) r.checked = false;
      var h = hexOk(hex.value); if (h) { col.value = h.toLowerCase(); $(".q-sw-perso", fs).style.setProperty("--c", h); }
    });
    $$(".q-bandeau", form).forEach(function (fs) {
      var meme = $('input[name$="_meme"]', fs), lc = couleurLivret();
      $(".q-swatches", fs).hidden = meme.checked;
      $(".q-meme-dot", fs).style.background = lc ? lc.hex : "transparent";
      $(".q-meme-dot", fs).hidden = !lc;
      $(".q-meme-n", fs).textContent = lc ? lc.nom : "(choisissez d'abord la couleur du livret)";
    });
  }

  /* ---------- brouillon ---------- */
  function etatForm() {
    var d = {};
    $$("input,textarea,select", form).forEach(function (e) {
      if (!e.name || e.type === "file") return;
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
  function appliquer(d) {
    $$("input,textarea,select", form).forEach(function (e) {
      if (!e.name || e.type === "file") return;
      var v = d[e.name]; if (v == null) return;
      if (e.type === "radio") e.checked = e.value === v;
      else if (e.type === "checkbox") e.checked = true;
      else e.value = v;
    });
  }
  function restaurer() {
    var raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    if (!raw || !raw.d) return false;
    var d = raw.d;
    /* d'abord recréer les lignes ajoutées, puis remplir */
    Object.keys(d).forEach(function (k) {
      var m;
      if ((m = /^(s\d+_[a-z-]+)_n$/.exec(k))) repN(m[1], +d[k] || 1);
      else if ((m = /^(s\d+_[a-z-]+)_xn$/.exec(k))) ajoutN(m[1], +d[k] || 0);
      else if ((m = /^(s\d+_[a-z-]+)_plus$/.exec(k))) plusLangues(m[1], String(d[k]).split("|"));
    });
    appliquer(d);
    $$(".q-lignes .q-ligne", form).forEach(majLigne);
    return Object.keys(d).length > 0;
  }

  /* Informations laissées dans le formulaire de devis : reprises une seule fois, puis effacées */
  var TYPES_DEVIS = { appartement: "Appartement", maison: "Maison", gite: "Gîte", chambres: "Chambres d'hôtes", hotel: "Hôtel" };
  function prefill() {
    var p; try { p = JSON.parse(localStorage.getItem("cdh:questionnaire:prefill") || "null"); localStorage.removeItem("cdh:questionnaire:prefill"); } catch (e) { p = null; }
    if (!p) return;
    var set = function (n, v) { var e = form.elements[n]; if (e && v && !e.value) e.value = v; };
    var radio = function (n, v) { var r = v && $('input[name="' + n + '"][value="' + String(v).replace(/"/g, "") + '"]', form); if (r) r.checked = true; };
    set(name(0, "nom"), p.nom); set(name(0, "email"), p.email); set(name(0, "tel"), p.tel); set(name(0, "logement"), p.logement);
    radio(name(0, "formule"), { essentiel: "Essentiel", confort: "Confort", premium: "Premium" }[p.formule]);
    radio(name(0, "type"), TYPES_DEVIS[p.type]);
    /* couleur et nom essayés sur la maquette du devis */
    if (p.nomMaquette && p.nomMaquette !== "Le Nid des Tanneurs") set(name(SI.style, "gravure"), p.nomMaquette);
    if (p.couleur === "perso" && p.couleurPerso) { radio(name(SI.style, "couleur"), "perso"); set(name(SI.style, "couleur") + "_perso", p.couleurPerso); var m = form.elements[name(SI.style, "couleur-support") + "_meme"]; if (m) m.checked = true; }
    else if (p.couleur) radio(name(SI.style, "couleur-support"), p.couleur);
    $("#q-reprise").textContent = "Nous avons repris vos informations du devis. Vérifiez-les, puis continuez."; $("#q-reprise").hidden = false;
  }

  /* ---------- affichage : formule, questions conditionnelles, avancement ---------- */
  /* Formule pas encore choisie ou « je ne sais pas » : on affiche ce qui est commun aux deux offres ;
     les questions réservées au Premium (logo, vidéos, couleur personnalisée) n'apparaissent que si « Premium » est coché */
  function rangFormule() { var f = (formule() || "").toLowerCase().replace(/ .*/, ""); return ORDRE[f] || ORDRE.confort; }
  function okSi(el) {
    if (!el.dataset.si) return true;
    var inputs = $$('[name="' + el.dataset.si + '"]', form), v = "";
    inputs.forEach(function (i) { if ((i.type === "radio" || i.type === "checkbox") ? i.checked : true) v = i.type === "checkbox" ? "1" : i.value; });
    if (el.dataset.siV) return el.dataset.siV.split("|").indexOf(v) > -1;
    if (el.dataset.siSauf) return el.dataset.siSauf.split("|").indexOf(v) === -1;
    return true;
  }
  function majVisibilite() {
    var rang = rangFormule();
    $$("[data-min],[data-si]", form).forEach(function (el) {
      el.hidden = !((ORDRE[el.dataset.min] || 0) <= rang && okSi(el));
    });
    $$(".q-sec", form).forEach(function (sec, i) {
      if (!sec.dataset.min) sec.hidden = $$(".q-body > .q", sec).every(function (q) { return q.hidden; });
      rail.children[i].hidden = sec.hidden;
      var skip = $(".q-skip", sec); if (skip) skip.hidden = true;
    });
    /* « Autre » : champ « précisez » ; Oui/Non : zone d'explication */
    $$(".q-autre", form).forEach(function (l) { var fs = l.closest("fieldset"); l.hidden = !$$('.q-opts input:checked', fs).some(function (i) { return i.value === "Autre"; }); });
    $$(".q-detail[data-detail-si]", form).forEach(function (l) { var r = $('.q-opts input:checked', l.closest("fieldset")); l.hidden = !(r && r.value === l.dataset.detailSi); });
    $("#q-formule-note").hidden = true;
    majRappel();
  }
  function majRappel() {
    var el = $(".q-rappel-t", form); if (!el) return;
    var f = (formule() || "").toLowerCase(), F = (T.formules || {})[f];
    var txt = function (F) { var n = ((F.supportsInclus || {}).porteCles) || 0; return n + " porte-clés transparent" + (n > 1 ? "s" : "") + " avec votre QR code"; };
    if (F) el.textContent = nb("Compris dans votre formule " + F.nom + " : " + txt(F) + ", livré" + (((F.supportsInclus || {}).porteCles || 0) > 1 ? "s" : "") + " chez vous, et l'affiche A5 à imprimer (PDF, QR du livret et du Wi-Fi).");
    else el.textContent = nb("Compris : Confort, " + txt(T.formules.confort) + " ; Premium, " + txt(T.formules.premium) + ". L'affiche A5 à imprimer (PDF) est incluse dans les deux.");
  }
  function majLigne(l) {
    var ck = $('input[type="checkbox"]', l), cols = $(".q-cols", l); if (!ck || !cols) return;
    cols.hidden = !ck.checked; l.classList.toggle("on", ck.checked);
  }
  function majAvancement() {
    var touche = 0, total = 0;
    $$(".q-sec", form).forEach(function (sec, i) {
      if (sec.hidden) return;
      total++;
      var ok = $$("input,textarea,select", sec).some(function (e) {
        if (e.type === "hidden" || e.type === "file" || e.type === "number" || e.readOnly || e.type === "color" || e.closest("[hidden]")) return false;
        return (e.type === "radio" || e.type === "checkbox") ? e.checked && !(e.closest(".q-bandeau") && e.type === "radio") : e.value.trim() !== "";
      }) || (sec.querySelector(".q-photos li, .q-files li"));
      rail.children[i].classList.toggle("fait", !!ok);
      if (ok) touche++;
    });
    prog.textContent = touche + " partie" + (touche > 1 ? "s" : "") + " sur " + total + " commencée" + (touche > 1 ? "s" : "");
    $("#q-bar").style.setProperty("--p", total ? (touche / total) : 0);
  }
  var tempo = 0;
  function change() {
    majVisibilite(); majCouleurs(); $$("[data-rep]", form).forEach(majRep); majAvancement();
    if (tente) verifier(false);
    clearTimeout(tempo); tempo = setTimeout(sauver, 350);
  }

  /* ---------- champs obligatoires ---------- */
  function rempli(el) {
    var nm = name(+el.closest(".q-sec").dataset.s, el.dataset.k), E = form.elements;
    if (el.dataset.reqSauf && E[el.dataset.reqSauf] && E[el.dataset.reqSauf].checked) return true;
    var checked = $$('.q-opts input:checked', el);
    if (el.classList.contains("q-choix")) {
      if (!checked.length) return false;
      if (checked.some(function (i) { return i.value === "Autre"; }) && E[nm + "_autre"] && !E[nm + "_autre"].value.trim()) return false;
      return true;
    }
    var c = $("input:not([type=hidden]),textarea,select", el);
    if (c && c.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.value.trim());
    return !!(c && c.value.trim());
  }
  function verifier(montrer) {
    var manquants = [];
    $$("[data-req]", form).forEach(function (el) {
      var errEl = $(".q-err", el), ok = !vis(el) || rempli(el);
      el.classList.toggle("q-manque", !ok);
      $$("input:not([type=hidden]),textarea", el).forEach(function (i) { if (i.type !== "radio" && i.type !== "checkbox") i.setAttribute("aria-invalid", ok ? "false" : "true"); });
      if (errEl) { errEl.hidden = ok; errEl.textContent = ok ? "" : (el.dataset.k === "email" ? "Indiquez un e-mail valide." : "Réponse obligatoire."); }
      if (!ok) manquants.push(el);
    });
    return manquants;
  }

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

  /* ---------- suggestions d'adresses et de lieux ---------- */
  var acTimer = 0, acSeq = 0, acCache = {};
  function gpsLogement() { var g = (form.elements[name(0, "adresse") + "_gps"] || {}).value || ""; var m = /^(-?[\d.]+),\s*(-?[\d.]+)$/.exec(g); return m ? { lat: +m[1], lon: +m[2] } : null; }
  function chercher(kind, q) {
    var url;
    if (kind === "ban") url = "https://data.geopf.fr/geocodage/search?index=address&limit=6&autocomplete=1&q=" + encodeURIComponent(q);
    else { var g = gpsLogement(); url = "https://photon.komoot.io/api/?limit=6&q=" + encodeURIComponent(q) + (g ? "&lat=" + g.lat + "&lon=" + g.lon : ""); }
    if (acCache[url]) return Promise.resolve(acCache[url]);
    return fetch(url).then(function (r) { return r.ok ? r.json() : { features: [] }; }).then(function (j) {
      var res = (j.features || []).map(function (f) {
        var p = f.properties || {}, c = (f.geometry || {}).coordinates || [];
        var gps = c.length > 1 ? (+c[1]).toFixed(5) + ", " + (+c[0]).toFixed(5) : "";
        if (kind === "ban") return { titre: p.label || p.name, sous: p.context || "", adr: p.label || "", cp: p.postcode || "", gps: gps };
        var rue = [p.housenumber, p.street].filter(Boolean).join(" "), ville = [p.postcode, p.city || p.town || p.village].filter(Boolean).join(" ");
        var adr = [rue, ville].filter(Boolean).join(", ");
        return { titre: p.name || rue || ville, sous: adr || [p.city, p.state].filter(Boolean).join(", "), nom: p.name || "", adr: adr, cp: p.postcode || "", gps: gps };
      }).filter(function (x) { return x.titre; });
      acCache[url] = res; return res;
    }, function () { return []; });
  }
  function acListe(input) {
    var wrap = input.closest(".q-ac-wrap"), ul = $(".q-ac", wrap);
    if (!ul) { ul = document.createElement("ul"); ul.className = "q-ac"; ul.setAttribute("role", "listbox"); ul.id = (input.id || input.name) + "-ac"; input.setAttribute("aria-controls", ul.id); wrap.appendChild(ul); }
    return ul;
  }
  function acFermer(input) { var ul = input && $(".q-ac", input.closest(".q-ac-wrap")); if (ul) { ul.hidden = true; ul.innerHTML = ""; } if (input) input.setAttribute("aria-expanded", "false"); }
  function acChoisir(input, r) {
    var kind = input.dataset.ac, E = form.elements;
    if (kind === "ban") {
      input.value = r.adr; if (E[input.name + "_gps"]) E[input.name + "_gps"].value = r.gps; if (E[input.name + "_cp"]) E[input.name + "_cp"].value = r.cp;
    } else {
      var row = input.closest(".q-rep-row"), adr = $('input[data-c="Adresse"]', row), gps = $('input[name$="_gps"]', row);
      if (r.nom) input.value = r.nom; if (adr && r.adr) adr.value = r.adr; if (gps) gps.value = r.gps;
    }
    acFermer(input); change();
  }
  function acOuvrir(input) {
    var q = input.value.trim(), kind = input.dataset.ac;
    if (input.dataset.ac === "ban" && form.elements[input.name + "_gps"]) { form.elements[input.name + "_gps"].value = ""; form.elements[input.name + "_cp"].value = ""; }
    if (q.length < 3) { acFermer(input); return; }
    var n = ++acSeq;
    chercher(kind, q).then(function (res) {
      if (n !== acSeq || document.activeElement !== input) return;
      var ul = acListe(input);
      if (!res.length) { acFermer(input); return; }
      ul.innerHTML = res.map(function (r, i) { return '<li role="option" id="' + ul.id + "-" + i + '" data-i="' + i + '"><b>' + esc(r.titre) + "</b>" + (r.sous && r.sous !== r.titre ? "<small>" + esc(r.sous) + "</small>" : "") + "</li>"; }).join("") + (kind === "lieu" ? '<li class="q-ac-src" aria-hidden="true">© OpenStreetMap</li>' : "");
      ul._res = res; ul.hidden = false; input.setAttribute("aria-expanded", "true");
    });
  }
  form.addEventListener("input", function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.ac) return;
    clearTimeout(acTimer); acTimer = setTimeout(function () { acOuvrir(t); }, 280);
  });
  form.addEventListener("keydown", function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.ac) return;
    var ul = $(".q-ac", t.closest(".q-ac-wrap")); if (!ul || ul.hidden) return;
    var items = $$('li[role="option"]', ul), cur = items.findIndex(function (li) { return li.classList.contains("on"); });
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); cur = (cur + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach(function (li, i) { li.classList.toggle("on", i === cur); }); t.setAttribute("aria-activedescendant", items[cur].id);
    } else if (e.key === "Enter" && cur > -1) { e.preventDefault(); acChoisir(t, ul._res[cur]); }
    else if (e.key === "Escape") acFermer(t);
  });
  form.addEventListener("mousedown", function (e) {
    var li = e.target.closest(".q-ac li[data-i]"); if (!li) return;
    e.preventDefault(); var ul = li.parentNode, input = $("[data-ac]", ul.closest(".q-ac-wrap"));
    acChoisir(input, ul._res[+li.dataset.i]);
  });
  form.addEventListener("focusout", function (e) { var t = e.target; if (t.dataset && t.dataset.ac) setTimeout(function () { acFermer(t); }, 150); });

  /* ---------- clics : compteurs, ajouts, retraits, langues ---------- */
  form.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-q-step]"))) {
      var inp = $("input", b.parentNode), v = (parseInt(inp.value, 10) || 0) + (+b.dataset.qStep);
      inp.value = Math.min(+inp.max, Math.max(+inp.min, v)); change(); return;
    }
    if ((b = e.target.closest("[data-q-h]"))) { var ih = $("input", b.parentNode); ih.value = stepH(ih.value, +b.dataset.qH); change(); return; }
    if ((b = e.target.closest("[data-q-add]"))) {
      var nm = b.dataset.qAdd; repN(nm, (+form.elements[nm + "_n"].value || 1) + 1);
      var rows = $$(".q-rep-row", repEl(nm)), last = rows[rows.length - 1]; var f0 = last && $("select, input:not([type=hidden])", last); if (f0) f0.focus();
      change(); return;
    }
    if ((b = e.target.closest("[data-q-rm]"))) { repRetirer(b.closest("[data-rep]"), b.closest(".q-rep-row")); change(); return; }
    if ((b = e.target.closest("[data-q-ajout]"))) {
      var nmA = b.dataset.qAjout; ajoutN(nmA, (+form.elements[nmA + "_xn"].value || 0) + 1);
      var xs = $$(".q-ligne-x", $('[data-ajouts="' + nmA + '"]', form)); $("input", xs[xs.length - 1]).focus(); change(); return;
    }
    if ((b = e.target.closest("[data-q-rm-x]"))) { ajoutRetirer(b.closest("[data-ajouts]"), b.closest(".q-ligne-x")); change(); return; }
    if ((b = e.target.closest("[data-q-plus]"))) {
      var sel = $('[data-q-plus-sel="' + b.dataset.qPlus + '"]', form); sel.hidden = !sel.hidden; b.setAttribute("aria-expanded", String(!sel.hidden)); if (!sel.hidden) sel.focus(); return;
    }
    if ((b = e.target.closest("[data-f-rm]"))) { var k = +b.dataset.fRm; fichiers = fichiers.filter(function (f) { return f.id !== k; }); dessinerFichiers(); change(); return; }
    if ((b = e.target.closest("[data-ici-rm]"))) { var pi = +b.dataset.iciRm; photos = photos.filter(function (p) { if (p.id === pi) URL.revokeObjectURL(p.url); return p.id !== pi; }); dessinerPhotos(); change(); return; }
  });
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.qPlusSel) { if (t.value) plusLangues(t.dataset.qPlusSel, [t.value]); t.value = ""; t.hidden = true; $('[data-q-plus="' + t.dataset.qPlusSel + '"]', form).setAttribute("aria-expanded", "false"); }
    if (t.closest && t.closest(".q-lignes") && t.type === "checkbox") majLigne(t.closest(".q-ligne"));
    if (t.type === "number") t.value = Math.min(+t.max, Math.max(+t.min, parseInt(t.value, 10) || +t.min));
    /* Nom imprimé : par défaut le nom du logement */
    if (t.name === name(0, "logement")) { var g = form.elements[name(SI.style, "gravure")]; if (g && !g.value.trim()) g.value = t.value.trim().slice(0, 25); }
  });
  form.addEventListener("input", function (e) {
    var t = e.target;
    if (t.classList.contains("q-perso-color")) { var fs = t.closest("fieldset"); $(".q-perso-hex", fs).value = t.value.toUpperCase(); }
    if (t.classList.contains("q-perso-color") || t.classList.contains("q-perso-hex")) { var r = $('input[value="perso"]', t.closest("fieldset")); if (r) r.checked = true; }
  }, true);

  /* ---------- photos : réduction sur l'appareil, envoi dans le dossier privé « depots » ---------- */
  function reduire(file, max) {
    max = max || 1800;
    return new Promise(function (ok, ko) {
      var fin = function (src, w, h, rel) {
        var k = Math.min(1, max / Math.max(w, h)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
        if (rel) rel();
        c.toBlob(function (b) {
          if (!b) return ko();
          if (b.size > 3000000) c.toBlob(function (b2) { b2 ? ok(b2) : ko(); }, "image/jpeg", .65); else ok(b);
        }, "image/jpeg", .85);
      };
      var viaImg = function () {
        var u = URL.createObjectURL(file), im = new Image();
        im.onload = function () { fin(im, im.naturalWidth, im.naturalHeight, function () { URL.revokeObjectURL(u); }); };
        im.onerror = function () { URL.revokeObjectURL(u); ko(); };
        im.src = u;
      };
      if (window.createImageBitmap) createImageBitmap(file, { imageOrientation: "from-image" }).then(function (bm) { fin(bm, bm.width, bm.height, function () { if (bm.close) bm.close(); }); }, viaImg);
      else viaImg();
    });
  }
  var uid = 0;
  function dessinerPhotos() {
    var ul = $("#q-photos");
    if (ul) {
      ul.innerHTML = "";
      photos.forEach(function (p) {
        var li = document.createElement("li"); li.className = "q-photo" + (p.ok ? " ok" : "");
        li.innerHTML = '<img alt="" src="' + p.url + '"><div><label class="q-col"><span>Ce que montre la photo</span><select>' + SUJETS.map(function (s) { return "<option" + (s === p.sujet ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + '</select></label><label class="q-col"><span>Précision <small>(facultatif)</small></span><input type="text" class="q-prec" maxlength="80" placeholder="Ex. : lave-linge, terrasse, vue du balcon" value="' + esc(p.prec || "") + '"></label><button type="button" class="q-rm">Retirer</button></div>';
        $("select", li).addEventListener("change", function (e) { p.sujet = e.target.value; });
        $(".q-prec", li).addEventListener("input", function (e) { p.prec = e.target.value; });
        $(".q-rm", li).addEventListener("click", function () { URL.revokeObjectURL(p.url); photos.splice(photos.indexOf(p), 1); dessinerPhotos(); });
        ul.appendChild(li);
      });
      var n = photos.length; $("#q-count").textContent = n ? n + " photo" + (n > 1 ? "s" : "") + " prête" + (n > 1 ? "s" : "") + " à l'envoi (" + mo(photos.reduce(function (t, p) { return t + p.blob.size; }, 0)) + " Mo)" : "";
    }
    /* vignettes à côté des questions (entrée, interphone…) */
    $$("[data-ici]", form).forEach(function (u) {
      u.innerHTML = photos.filter(function (p) { return p.ici === u.dataset.ici; }).map(function (p) {
        return '<li><img alt="" src="' + p.url + '"><button type="button" class="q-rm" data-ici-rm="' + p.id + '" aria-label="Retirer cette photo">Retirer</button></li>';
      }).join("");
    });
  }
  function ajouterPhotos(files, opts) {
    opts = opts || {};
    var liste = Array.prototype.slice.call(files), refus = 0, c = $("#q-count");
    if (c) c.textContent = "Préparation des photos…";
    var suite = liste.reduce(function (pr, f) {
      return pr.then(function () {
        if (photos.length >= MAXPHOTOS) { refus++; return; }
        return reduire(f).then(function (b) { photos.push({ id: ++uid, blob: b, url: URL.createObjectURL(b), sujet: opts.sujet || (photos.some(function (x) { return !x.ici; }) ? "Autre" : SUJETS[0]), prec: opts.prec || "", ici: opts.ici || "", ok: false }); }, function () { refus++; });
      });
    }, Promise.resolve());
    suite.then(function () {
      dessinerPhotos(); change();
      if (refus && c) c.textContent += ". " + refus + " photo" + (refus > 1 ? "s" : "") + " non ajoutée" + (refus > 1 ? "s" : "") + " (format non pris en charge, ou maximum de " + MAXPHOTOS + " atteint).";
    });
  }

  /* ---------- fichiers : notices, logo, vidéos ---------- */
  var VIDEO_EXT = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
  function logoPrepare(file) {
    /* SVG → PNG ; grands logos réduits ; transparence gardée */
    var svg = /svg/.test(file.type) || /\.svg$/i.test(file.name);
    if (!svg && file.size < 2500000 && /png|jpeg|webp/.test(file.type)) return Promise.resolve({ blob: file, ext: { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[file.type], type: file.type });
    return new Promise(function (ok, ko) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = im.naturalWidth || 1200, h = im.naturalHeight || 1200, k = Math.min(svg ? 1200 / Math.max(w, h) : 1, 1600 / Math.max(w, h)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? ok({ blob: b, ext: "png", type: "image/png" }) : ko(); }, "image/png");
      };
      im.onerror = function () { URL.revokeObjectURL(u); ko(); };
      im.src = u;
    });
  }
  function ajouterFichiers(kind, files) {
    var t = SECTIONS.reduce(function (a, s) { return a || s.q.filter(function (q) { return q.fichiers && q.fichiers.kind === kind; })[0]; }, null);
    if (!t) return;
    var F = t.fichiers, liste = Array.prototype.slice.call(files), msgEl = $('[data-kind="' + kind + '"] .q-files-msg', form), refus = [];
    msgEl.textContent = "Préparation…";
    liste.reduce(function (pr, f) {
      return pr.then(function () {
        var deja = fichiers.filter(function (x) { return x.kind === kind; }).length;
        if (deja >= F.max) { if (F.max === 1) { fichiers = fichiers.filter(function (x) { return x.kind !== kind; }); } else { refus.push(f.name + " (maximum " + F.max + ")"); return; } }
        if (f.size > F.maxMo * 1048576 && kind !== "notice") { refus.push(f.name + " (plus de " + F.maxMo + " Mo)"); return; }
        if (kind === "video") {
          var ext = VIDEO_EXT[f.type] || (/\.(mp4|mov|webm)$/i.exec(f.name) || [])[1];
          if (!ext) { refus.push(f.name + " (format vidéo non pris en charge : MP4, MOV ou WebM)"); return; }
          fichiers.push({ id: ++uid, kind: kind, blob: f, ext: ext.toLowerCase(), type: f.type || "video/" + (ext === "mov" ? "quicktime" : ext), orig: f.name, ok: false }); return;
        }
        if (kind === "logo") return logoPrepare(f).then(function (r) { fichiers.push({ id: ++uid, kind: kind, blob: r.blob, ext: r.ext, type: r.type, orig: f.name, ok: false }); }, function () { refus.push(f.name + " (illisible)"); });
        /* notices : images réduites, PDF tels quels (20 Mo maximum) */
        if (/^image\//.test(f.type)) return reduire(f, 2200).then(function (b) { fichiers.push({ id: ++uid, kind: kind, blob: b, ext: "jpg", type: "image/jpeg", orig: f.name, ok: false }); }, function () { refus.push(f.name + " (illisible)"); });
        if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
          if (f.size > F.maxMo * 1048576) { refus.push(f.name + " (plus de " + F.maxMo + " Mo)"); return; }
          fichiers.push({ id: ++uid, kind: kind, blob: f, ext: "pdf", type: "application/pdf", orig: f.name, ok: false }); return;
        }
        refus.push(f.name + " (format non pris en charge : PDF ou photo)");
      });
    }, Promise.resolve()).then(function () {
      dessinerFichiers(); change();
      msgEl.textContent = refus.length ? "Non ajouté : " + refus.join(", ") + "." : "";
    });
  }
  function dessinerFichiers() {
    $$("[data-files]", form).forEach(function (ul) {
      var kind = ul.dataset.files;
      ul.innerHTML = fichiers.filter(function (f) { return f.kind === kind; }).map(function (f) {
        var img = /^image\//.test(f.type) ? '<img alt="" src="' + (f.url || (f.url = URL.createObjectURL(f.blob))) + '">' : '<span class="q-file-ic" aria-hidden="true">' + esc(f.ext.toUpperCase()) + "</span>";
        return '<li class="' + (f.ok ? "ok" : f.echec ? "ko" : "") + '">' + img + '<span class="q-file-n">' + esc(f.orig) + " <small>" + mo(f.blob.size) + " Mo" + (f.echec ? " · non envoyé" : f.ok ? " · envoyé" : "") + '</small></span><button type="button" class="q-rm" data-f-rm="' + f.id + '">Retirer</button></li>';
      }).join("");
    });
  }
  /* glisser-déposer */
  form.addEventListener("dragover", function (e) { var d = e.target.closest && e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("survol"); } });
  form.addEventListener("dragleave", function (e) { var d = e.target.closest && e.target.closest("[data-drop]"); if (d) d.classList.remove("survol"); });
  form.addEventListener("drop", function (e) { var d = e.target.closest && e.target.closest("[data-drop]"); if (!d) return; e.preventDefault(); d.classList.remove("survol"); ajouterFichiers(d.dataset.drop, e.dataTransfer.files); });

  /* ---------- envoi des fichiers ---------- */
  function envoyer(chemin, blob, type, onprog) {
    return new Promise(function (ok, ko) {
      var x = new XMLHttpRequest();
      x.open("POST", C.supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/depots/" + chemin);
      x.setRequestHeader("apikey", C.supabaseCle); x.setRequestHeader("Authorization", "Bearer " + C.supabaseCle);
      x.setRequestHeader("Content-Type", type); x.setRequestHeader("x-upsert", "false");
      if (onprog && x.upload) x.upload.onprogress = function (e) { if (e.lengthComputable) onprog(e.loaded / e.total); };
      x.onload = function () { (x.status >= 200 && x.status < 300) || x.status === 409 ? ok() : ko(x.status); };
      x.onerror = function () { ko(0); };
      x.send(blob);
    });
  }
  function nomFichier(it) {
    if (it.nom) return it.nom;
    seq++;
    var base = it.kind === "logo" ? "logo" : it.kind === "notice" ? "notice-" + slug(it.orig.replace(/\.[a-z0-9]+$/i, "")) : it.kind === "video" ? "video-" + slug(it.orig.replace(/\.[a-z0-9]+$/i, "")) : slug(it.sujet);
    it.nom = pad(seq) + "-" + base.slice(0, 50) + "." + (it.ext || "jpg");
    return it.nom;
  }
  function envoyerTout(btn) {
    if (!photos.length && !fichiers.length) return Promise.resolve(0);
    if (!dossier) dossier = new Date().toISOString().slice(0, 10) + "-" + slug(val("logement") || val("nom")) + "-" + Math.random().toString(36).slice(2, 8);
    /* les photos d'abord : si l'une échoue, on s'arrête (le client réessaie) */
    var p1 = photos.reduce(function (pr, p, i) {
      return pr.then(function () {
        if (p.ok) return;
        btn.textContent = "Photos " + (i + 1) + " sur " + photos.length + "…";
        return envoyer(dossier + "/" + nomFichier(p), p.blob, "image/jpeg").then(function () { p.ok = true; });
      });
    }, Promise.resolve());
    /* puis les fichiers : un échec n'empêche pas l'envoi du questionnaire, il est signalé dans le mail */
    return p1.then(function () {
      return fichiers.reduce(function (pr, f, i) {
        return pr.then(function () {
          if (f.ok) return;
          var lab = f.kind === "video" ? "Vidéo" : f.kind === "logo" ? "Logo" : "Fichier";
          btn.textContent = lab + " " + (i + 1) + " sur " + fichiers.length + "…";
          return envoyer(dossier + "/" + nomFichier(f), f.blob, f.type, function (p) { btn.textContent = lab + " " + (i + 1) + " sur " + fichiers.length + " · " + Math.round(p * 100) + " %"; })
            .then(function () { f.ok = true; f.echec = false; }, function () { f.echec = true; });
        });
      }, Promise.resolve());
    }).then(function () { dessinerFichiers(); return photos.length + fichiers.length; });
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
    tente = true;
    var manquants = verifier(true);
    if (manquants.length) {
      var parts = manquants.map(function (el) { var sec = el.closest(".q-sec"); return '<a href="#' + sec.id + '" data-aller="' + manquants.indexOf(el) + '">' + esc(nb(el.dataset.l)) + " <small>(partie " + (+sec.dataset.s + 1) + ")</small></a>"; });
      msg("<b>Il manque " + manquants.length + " réponse" + (manquants.length > 1 ? "s" : "") + " obligatoire" + (manquants.length > 1 ? "s" : "") + ".</b><span>Elles sont signalées en rouge dans le questionnaire :</span><div class=\"q-manquants\">" + parts.join("") + "</div>", "err");
      $$("[data-aller]", status).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); aller(manquants[+a.dataset.aller]); }); });
      aller(manquants[0]);
      return;
    }
    if (!$("#q-ok").checked) { $("#q-ok").focus(); msg("Cochez la case d'accord pour envoyer le questionnaire.", "err"); return; }
    var text = recap(), btn = $("#q-send"), endpoint = C.formulaireQuestionnaire || C.formulaireDevis || "";
    if (!endpoint) { fallback(text); return; }
    btn.disabled = true; var lab = btn.textContent; btn.textContent = "Envoi…"; msg("");
    var pr = (DEPOT ? envoyerTout(btn) : Promise.resolve(0)).catch(function () {
      btn.disabled = false; btn.textContent = lab; dessinerPhotos();
      msg("<b>Toutes les photos n'ont pas pu être envoyées.</b><span>Vos réponses sont conservées. Réessayez dans un instant (les photos déjà parties ne seront pas renvoyées), ou retirez-les et envoyez-les plus tard par WhatsApp ou par e-mail.</span>", "err");
      return null;
    });
    pr.then(function (nbEnvois) {
      if (nbEnvois === null) return;
      var body = new URLSearchParams();
      body.set("_subject", "Questionnaire · " + (val("logement") || val("nom")));
      body.set("email", val("email")); body.set("nom", val("nom")); body.set("logement", val("logement")); body.set("formule", formule());
      lire().forEach(function (b) { body.set(b.titre, b.lignes.join("\n")); });
      var okPh = photos.filter(function (p) { return p.ok && p.nom; }), logo = fichiers.filter(function (f) { return f.ok && f.kind === "logo"; });
      var autres = fichiers.filter(function (f) { return f.ok && f.kind !== "logo"; }), ko = fichiers.filter(function (f) { return f.echec; });
      if (okPh.length || logo.length || autres.length) body.set("Photos déposées", (okPh.length + logo.length + autres.length) + " fichier(s), dossier « depots/" + dossier + " » (Supabase → Storage)");
      /* Liste lisible par la création automatique du livret : fichier, sujet choisi, précision du client (le logo en fait partie) */
      if (okPh.length || logo.length) body.set("Fichiers photos", okPh.map(function (p) { return "depot:" + dossier + "/" + p.nom + " | " + p.sujet + (p.prec && p.prec.trim() ? " | " + p.prec.trim() : ""); })
        .concat(logo.map(function (f) { return "depot:" + dossier + "/" + f.nom + " | Logo | " + f.orig; })).join("\n"));
      /* Notices et vidéos : à lire ou à héberger, pas à placer telles quelles dans le livret */
      if (autres.length) body.set("Fichiers joints", autres.map(function (f) { return "depot:" + dossier + "/" + f.nom + " | " + (f.kind === "video" ? "Vidéo" : "Notice") + " | " + f.orig; }).join("\n"));
      if (ko.length) body.set("Fichiers non transmis", ko.map(function (f) { return f.orig + " (" + mo(f.blob.size) + " Mo)"; }).join("\n") + "\n→ à demander au client par e-mail.");
      return fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" }, body: body.toString() })
        .then(function (r) {
          if (!r.ok) throw new Error("http");
          try { localStorage.removeItem(KEY); } catch (e) {}
          form.hidden = true; $("#q-final").hidden = true; $("#q-tools").hidden = true;
          $("#q-merci").hidden = false; $("#q-merci-nom").textContent = (val("nom").split(" ")[0] || "").trim();
          if (ko.length) { var mk = $("#q-merci-ko"); mk.hidden = false; mk.textContent = nb("Ces fichiers n'ont pas pu partir : " + ko.map(function (f) { return f.orig; }).join(", ") + ". Envoyez-les-nous à " + (C.email || "") + "."); }
          window.scrollTo({ top: 0, behavior: "smooth" });
        })
        .catch(function () { btn.disabled = false; btn.textContent = lab; fallback(text); });
    });
  });
  function aller(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    var f = $("input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea,select", el) || $("input", el);
    if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, 350);
  }
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "q-files") { ajouterPhotos(t.files); t.value = ""; }
    else if (t.dataset.photosIci) { var q = trouverQ(t.dataset.photosIci); ajouterPhotos(t.files, { sujet: q.q.photosIci.sujet, prec: q.q.photosIci.prec, ici: t.dataset.photosIci }); t.value = ""; }
    else if (t.dataset.fichiers) { ajouterFichiers(t.dataset.fichiers, t.files); t.value = ""; }
  });
  $("#q-vider").addEventListener("click", function () {
    if (!window.confirm("Effacer toutes vos réponses sur cet appareil ?")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    photos.forEach(function (p) { URL.revokeObjectURL(p.url); }); photos = []; fichiers = []; tente = false;
    build(); dessinerPhotos(); change(); suivre(); saveEl.textContent = "Réponses effacées"; msg("");
  });
  $("#q-fichier").addEventListener("click", function () { telecharger(recap()); });

  /* ---------- démarrage ---------- */
  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.marque || el.textContent; });
  document.querySelectorAll("[data-mail]").forEach(function (a) { a.href = "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent("Questionnaire"); a.textContent = C.email || a.textContent; });
  build();
  if (restaurer()) { $("#q-reprise").hidden = false; }
  else prefill();
  /* couleur du bandeau ou nom imprimé déjà donnés : on les montre cochés */
  change(); suivre();
})();
