/* Affichage d'un livret d'accueil.
   Adresses possibles :
     livret.html#identifiant · livret.html?id=identifiant · /l/identifiant (en ligne)
     + vue arrivée : livret.html?id=identifiant&s=arrivee · /l/identifiant/arrivee
   Langues : français + anglais si le livret contient un bloc « en ».
   Dans la console, la page est chargée en aperçu (iframe name="cdh-apercu")
   et reçoit le livret en cours d'édition par postMessage. */
(function () {
  var esc = window.cdhEsc, I = window.cdhIcon;
  var app = document.getElementById("app");
  var APERCU = window.name === "cdh-apercu";
  var VITRINE = window.name === "cdh-vitrine";
  var current = null, currentLang = "fr", forcedLang = null;
  if (VITRINE || APERCU) {
    document.documentElement.classList.add("in-phone");
    window.addEventListener("scroll", function () {
      document.documentElement.classList.toggle("defile", (window.scrollY || document.documentElement.scrollTop) > 24);
    }, { passive: true });
    /* barre d'état du téléphone dessiné (heure, réseau, batterie) : remplit la zone de l'encoche */
    var sb = document.createElement("div");
    sb.className = "sbar"; sb.setAttribute("aria-hidden", "true");
    sb.innerHTML = '<span class="sb-heure"></span><span></span><span class="sb-icones">' +
      '<svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg>' +
      '<svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.6 5.6 9.1a3.4 3.4 0 0 1 4.8 0Z"/><path d="M3.4 6.9a6.6 6.6 0 0 1 9.2 0l-1.1 1.1a5 5 0 0 0-7 0Z"/><path d="M1.2 4.7a9.7 9.7 0 0 1 13.6 0l-1.1 1.1a8.1 8.1 0 0 0-11.4 0Z"/></svg>' +
      '<svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2.2"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill-opacity=".45"/></svg></span>';
    var heure = function () { var d = new Date(); sb.firstChild.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };
    heure(); setInterval(heure, 30000);
    (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener("DOMContentLoaded", r); })).then(function () { document.body.appendChild(sb); });
  }

  /* Statistiques (Umami, sans cookies) : uniquement sur le vrai livret en ligne,
     jamais dans la vitrine ni dans l'aperçu de la console. Chaque livret est
     compté via son adresse (livret.html?id=…). */
  (function () {
    var C = window.CDH_CONFIG || {};
    if (!C.umamiId || APERCU || VITRINE || !/^https:$/.test(location.protocol)) return;
    var s = document.createElement("script");
    s.defer = true; s.src = "https://cloud.umami.is/script.js";
    s.setAttribute("data-website-id", C.umamiId);
    if (C.domaine) { try { s.setAttribute("data-domains", new URL(C.domaine).hostname); } catch (e) {} }
    document.head.appendChild(s);
  })();

  var FONTS = {
    "Lora": '"Lora", Georgia, serif',
    "Gloock": '"Lora", Georgia, serif', /* ancien choix, remplacé par Lora (plus lisible) */
    "Marcellus": '"Marcellus", Georgia, serif',
    "Young Serif": '"Young Serif", Georgia, serif',
    "Newsreader": '"Newsreader", Georgia, serif',
    "Schibsted Grotesk": '"Schibsted Grotesk", system-ui, sans-serif'
  };

  /* ---------- textes de l'interface ---------- */
  var TXT = {
    fr: {
      lieu: { location: "Le logement", maison: "La maison", hotel: "L'hôtel" },
      toc: { arrivee: "Arrivée", services: "Services", adresses: "Adresses", carte: "Carte", activites: "À faire", depart: "Départ", urgences: "Urgences" },
      demo: "Exemple de livret réalisé par {m}. Logement, hôtes et commerces fictifs.", demoCta: "Créer le mien",
      bienvenue: { defaut: "Bienvenue chez nous !", hotel: "Bienvenue" },
      annonce: { info: "À savoir", alerte: "Important", bonplan: "Bon plan" },
      wifi: "Wi-Fi", reseau: "Réseau", mdp: "Mot de passe", copier: "Copier", copie: "Copié", mdpCopie: "Mot de passe copié", mdpSel: "Mot de passe sélectionné : copiez-le",
      arrivee: "Arrivée", depart: "Départ", contacter: "Contacter", hote: "l'hôte", appeler: "Appeler", email: "E-mail", urgence: "Urgence",
      recherche: "Chercher : chauffage, poubelles, parking…", rechercheLabel: "Chercher dans le livret", effacer: "Effacer la recherche",
      resultats: function (n, q) { return n + " résultat" + (n > 1 ? "s" : "") + " pour « " + q + " »"; }, aucun: "Aucun résultat. Essayez un autre mot ou contactez votre hôte.",
      arriveeTitre: "Avant votre arrivée", arriveeSub: "Comment venir et entrer, sans stress.",
      hubTitre: "Que cherchez-vous ?",
      hub: { arrivee: "Adresse, accès, clés", logement: function (n) { return n + (n > 1 ? " rubriques" : " rubrique"); }, services: function (n) { return n + (n > 1 ? " services à demander" : " service à demander"); }, adresses: function (n) { return n + (n > 1 ? " adresses" : " adresse"); }, carte: "Tout sur une carte", activites: function (n) { return n + (n > 1 ? " idées de sorties" : " idée de sortie"); }, depart: "Check-list avant de partir", urgences: "112, 15, 17, 18" },
      bientot: "Votre séjour approche ! Voici tout ce qu'il faut savoir pour arriver.",
      adresse: "Adresse", itineraire: "Itinéraire", copierAdresse: "Copier l'adresse", adresseCopiee: "Adresse copiée",
      prevenir: "Prévenir de mon heure d'arrivée", msgArrivee: function (n) { return "Bonjour, nous arriverons à " + n + " vers … h. À bientôt !"; },
      ouvrir: "Touchez une rubrique pour l'ouvrir.",
      servicesTitre: "Services en plus", servicesSub: "Pour un séjour encore plus agréable, sur simple demande.", demander: "Demander",
      msgService: function (t, p) { return "Bonjour, nous aimerions réserver : " + t + (p ? " (" + p + ")" : "") + ". Merci !"; },
      adressesTitre: "Adresses utiles", adressesSub: "Commerces, santé et bonnes tables autour de vous.", tout: "Tout", aucuneAdresse: "Aucune adresse ne correspond.",
      carteTitre: "Sur la carte", carteSub: "Le logement, les adresses utiles et les sorties.", carteLogement: "Le logement", carteAdresses: "Adresses", carteActivites: "À faire",
      carteToucher: "Touchez la carte pour la déplacer", carteHors: "La carte n'est pas disponible hors connexion.",
      activitesTitre: "À faire autour", activitesSub: "Nos idées de sorties, testées et approuvées.", voirCarte: "Voir sur la carte", aucuneActivite: "Aucune activité ne correspond.",
      aucuneRubrique: "Aucune rubrique ne correspond.",
      departTitre: "Avant de partir", departSub: function (h) { return (h ? "Départ " + h.charAt(0).toLowerCase() + h.slice(1) + ". " : "") + "Cochez au fur et à mesure."; },
      fait: function (n, t) { return n + " sur " + t + " fait" + (n > 1 ? "s" : ""); }, pret: "Tout est prêt, bon retour !",
      urgencesTitre: "Urgences", urgencesSub: "Appels gratuits, depuis n'importe quel téléphone.",
      u112: "Urgences, depuis toute l'Europe", u15: "SAMU, urgence médicale", u18: "Pompiers", u17: "Police secours", u114: "Urgences par SMS (personnes sourdes ou malentendantes)",
      u3237: "Pharmacie de garde (service payant)", antipoison: "Centre antipoison", hopital: "Hôpital le plus proche",
      avis: "Laisser un avis", avisDemo: "Dans un vrai livret, ce bouton ouvre la page d'avis de l'hôte (Google, Airbnb, Booking…).",
      maj: "Mis à jour le", fait_avec: "Livret d'accueil créé avec", horsLigneOk: "Ce livret reste consultable sans connexion.",
      horsLigne: "Hors connexion : vous consultez la version enregistrée du livret.",
      meteo: "Météo", meteoSource: "Données : MET Norway",
      introuvable: "Livret introuvable", introuvableTxt: "Le lien est peut-être incomplet. Scannez à nouveau le QR code ou contactez votre hôte.", retour: "Retour à l'accueil",
      chargement: "Ouverture du livret…", horsLigne: "Pas de connexion", horsLigneTxt: "Ce livret s'affichera dès que le téléphone sera connecté à internet (Wi-Fi ou données mobiles).", reessayer: "Réessayer",
      locale: "fr-FR"
    },
    en: {
      lieu: { location: "The place", maison: "The house", hotel: "The hotel" },
      toc: { arrivee: "Arrival", services: "Extras", adresses: "Addresses", carte: "Map", activites: "Things to do", depart: "Check-out", urgences: "Emergency" },
      demo: "Sample welcome book made by {m}. Property, hosts and shops are fictional.", demoCta: "Get mine",
      bienvenue: { defaut: "Welcome!", hotel: "Welcome" },
      annonce: { info: "Good to know", alerte: "Important", bonplan: "Special offer" },
      wifi: "Wi-Fi", reseau: "Network", mdp: "Password", copier: "Copy", copie: "Copied", mdpCopie: "Password copied", mdpSel: "Password selected: copy it",
      arrivee: "Check-in", depart: "Check-out", contacter: "Contact", hote: "your host", appeler: "Call", email: "Email", urgence: "Emergency",
      recherche: "Search: heating, bins, parking…", rechercheLabel: "Search this welcome book", effacer: "Clear search",
      resultats: function (n, q) { return n + " result" + (n > 1 ? "s" : "") + " for “" + q + "”"; }, aucun: "No results. Try another word or contact your host.",
      arriveeTitre: "Before you arrive", arriveeSub: "How to get here and get in, stress-free.",
      hubTitre: "What are you looking for?",
      hub: { arrivee: "Address, access, keys", logement: function (n) { return n + (n > 1 ? " topics" : " topic"); }, services: function (n) { return n + (n > 1 ? " extras to request" : " extra to request"); }, adresses: function (n) { return n + (n > 1 ? " places" : " place"); }, carte: "Everything on one map", activites: function (n) { return n + (n > 1 ? " ideas" : " idea"); }, depart: "Checklist before you go", urgences: "112, 15, 17, 18" },
      bientot: "Your stay is coming up! Here is everything you need to arrive.",
      adresse: "Address", itineraire: "Directions", copierAdresse: "Copy address", adresseCopiee: "Address copied",
      prevenir: "Tell us when you'll arrive", msgArrivee: function (n) { return "Hello, we will arrive at " + n + " around … See you soon!"; },
      ouvrir: "Tap a topic to open it.",
      servicesTitre: "Extras", servicesSub: "Make your stay even better, just ask.", demander: "Request",
      msgService: function (t, p) { return "Hello, we would like to book: " + t + (p ? " (" + p + ")" : "") + ". Thank you!"; },
      adressesTitre: "Useful addresses", adressesSub: "Shops, health and good places to eat nearby.", tout: "All", aucuneAdresse: "No matching address.",
      carteTitre: "On the map", carteSub: "The place, useful addresses and things to do.", carteLogement: "The place", carteAdresses: "Addresses", carteActivites: "Things to do",
      carteToucher: "Tap the map to move it", carteHors: "The map is not available offline.",
      activitesTitre: "Things to do nearby", activitesSub: "Our favourite outings, tried and tested.", voirCarte: "See on map", aucuneActivite: "No matching activity.",
      aucuneRubrique: "No matching topic.",
      departTitre: "Before you leave", departSub: function (h) { return (h ? "Check-out " + h.charAt(0).toLowerCase() + h.slice(1) + ". " : "") + "Tick as you go."; },
      fait: function (n, t) { return n + " of " + t + " done"; }, pret: "All set, have a safe trip home!",
      urgencesTitre: "Emergency", urgencesSub: "Free calls, from any phone.",
      u112: "Emergency, anywhere in Europe", u15: "Medical emergency (SAMU)", u18: "Fire brigade", u17: "Police", u114: "Emergency by text (deaf or hard of hearing)",
      u3237: "On-duty pharmacy (paid service)", antipoison: "Poison control centre", hopital: "Nearest hospital",
      avis: "Leave a review", avisDemo: "In a real welcome book, this button opens the host's review page (Google, Airbnb, Booking…).",
      maj: "Updated on", fait_avec: "Welcome book made with", horsLigneOk: "This welcome book also works offline.",
      horsLigne: "Offline: you are viewing the saved version of this welcome book.",
      meteo: "Weather", meteoSource: "Data: MET Norway",
      introuvable: "Welcome book not found", introuvableTxt: "The link may be incomplete. Scan the QR code again or contact your host.", retour: "Back to home page",
      chargement: "Opening the welcome book…", horsLigne: "No connection", horsLigneTxt: "This welcome book will open as soon as your phone is online (Wi-Fi or mobile data).", reessayer: "Try again",
      locale: "en-GB"
    },
    de: {
      lieu: { location: "Die Unterkunft", maison: "Das Haus", hotel: "Das Hotel" },
      toc: { arrivee: "Anreise", services: "Extras", adresses: "Adressen", carte: "Karte", activites: "Ausflüge", depart: "Abreise", urgences: "Notfall" },
      demo: "Beispiel eines Willkommensbuchs von {m}. Unterkunft, Gastgeber und Geschäfte sind frei erfunden.", demoCta: "Mein eigenes erstellen",
      bienvenue: { defaut: "Willkommen!", hotel: "Willkommen" },
      annonce: { info: "Gut zu wissen", alerte: "Wichtig", bonplan: "Tipp" },
      wifi: "WLAN", reseau: "Netzwerk", mdp: "Passwort", copier: "Kopieren", copie: "Kopiert", mdpCopie: "Passwort kopiert", mdpSel: "Passwort markiert: bitte kopieren",
      arrivee: "Check-in", depart: "Check-out", contacter: "Kontakt", hote: "Gastgeber", appeler: "Anrufen", email: "E-Mail", urgence: "Notfall",
      recherche: "Suchen: Heizung, Müll, Parken…", rechercheLabel: "Im Willkommensbuch suchen", effacer: "Suche löschen",
      resultats: function (n, q) { return n + (n > 1 ? " Ergebnisse" : " Ergebnis") + " für „" + q + "“"; }, aucun: "Keine Ergebnisse. Versuchen Sie ein anderes Wort oder fragen Sie Ihren Gastgeber.",
      arriveeTitre: "Vor Ihrer Anreise", arriveeSub: "So kommen Sie stressfrei an und ins Haus.",
      hubTitre: "Was suchen Sie?",
      hub: { arrivee: "Adresse, Zugang, Schlüssel", logement: function (n) { return n + (n > 1 ? " Themen" : " Thema"); }, services: function (n) { return n + (n > 1 ? " Extras auf Anfrage" : " Extra auf Anfrage"); }, adresses: function (n) { return n + (n > 1 ? " Adressen" : " Adresse"); }, carte: "Alles auf einer Karte", activites: function (n) { return n + (n > 1 ? " Ideen" : " Idee"); }, depart: "Checkliste vor der Abreise", urgences: "112, 15, 17, 18" },
      bientot: "Ihr Aufenthalt steht bevor! Hier finden Sie alles, was Sie für die Anreise wissen müssen.",
      adresse: "Adresse", itineraire: "Route", copierAdresse: "Adresse kopieren", adresseCopiee: "Adresse kopiert",
      prevenir: "Ankunftszeit mitteilen", msgArrivee: function (n) { return "Guten Tag, wir kommen voraussichtlich gegen … Uhr in „" + n + "“ an. Bis bald!"; },
      ouvrir: "Tippen Sie auf ein Thema, um es zu öffnen.",
      servicesTitre: "Extras", servicesSub: "Für einen noch schöneren Aufenthalt, einfach anfragen.", demander: "Anfragen",
      msgService: function (t, p) { return "Guten Tag, wir möchten gern buchen: " + t + (p ? " (" + p + ")" : "") + ". Vielen Dank!"; },
      adressesTitre: "Nützliche Adressen", adressesSub: "Geschäfte, Gesundheit und gute Lokale in der Nähe.", tout: "Alle", aucuneAdresse: "Keine passende Adresse.",
      carteTitre: "Auf der Karte", carteSub: "Die Unterkunft, nützliche Adressen und Ausflüge.", carteLogement: "Die Unterkunft", carteAdresses: "Adressen", carteActivites: "Ausflüge",
      carteToucher: "Tippen Sie auf die Karte, um sie zu verschieben", carteHors: "Die Karte ist offline nicht verfügbar.",
      activitesTitre: "Ausflüge in der Nähe", activitesSub: "Unsere Lieblingsziele, ausprobiert und empfohlen.", voirCarte: "Auf der Karte ansehen", aucuneActivite: "Keine passende Aktivität.",
      aucuneRubrique: "Kein passendes Thema.",
      departTitre: "Vor der Abreise", departSub: function (h) { return (h ? "Check-out " + h.charAt(0).toLowerCase() + h.slice(1) + ". " : "") + "Haken setzen, sobald etwas erledigt ist."; },
      fait: function (n, t) { return n + " von " + t + " erledigt"; }, pret: "Alles erledigt, gute Heimreise!",
      urgencesTitre: "Notfall", urgencesSub: "Kostenlose Anrufe von jedem Telefon.",
      u112: "Notruf, in ganz Europa", u15: "Rettungsdienst (SAMU)", u18: "Feuerwehr", u17: "Polizei", u114: "Notruf per SMS (für Gehörlose und Schwerhörige)",
      u3237: "Notdienst-Apotheke (kostenpflichtig)", antipoison: "Giftnotruf", hopital: "Nächstes Krankenhaus",
      avis: "Bewertung abgeben", avisDemo: "In einem echten Willkommensbuch öffnet diese Schaltfläche die Bewertungsseite des Gastgebers (Google, Airbnb, Booking…).",
      maj: "Aktualisiert am", fait_avec: "Willkommensbuch erstellt mit", horsLigneOk: "Dieses Willkommensbuch funktioniert auch offline.",
      meteo: "Wetter", meteoSource: "Daten: MET Norway",
      introuvable: "Willkommensbuch nicht gefunden", introuvableTxt: "Der Link ist vielleicht unvollständig. Scannen Sie den QR-Code erneut oder kontaktieren Sie Ihren Gastgeber.", retour: "Zurück zur Startseite",
      chargement: "Willkommensbuch wird geöffnet…", horsLigne: "Keine Verbindung", horsLigneTxt: "Dieses Willkommensbuch wird angezeigt, sobald Ihr Telefon online ist (WLAN oder mobile Daten).", reessayer: "Erneut versuchen",
      locale: "de-DE"
    },
    it: {
      lieu: { location: "L'alloggio", maison: "La casa", hotel: "L'hotel" },
      toc: { arrivee: "Arrivo", services: "Extra", adresses: "Indirizzi", carte: "Mappa", activites: "Da fare", depart: "Partenza", urgences: "Emergenze" },
      demo: "Esempio di guida di benvenuto realizzata da {m}. Alloggio, host e negozi sono fittizi.", demoCta: "Crea la mia",
      bienvenue: { defaut: "Benvenuti!", hotel: "Benvenuti" },
      annonce: { info: "Da sapere", alerte: "Importante", bonplan: "Consiglio" },
      wifi: "Wi-Fi", reseau: "Rete", mdp: "Password", copier: "Copia", copie: "Copiato", mdpCopie: "Password copiata", mdpSel: "Password selezionata: copiala",
      arrivee: "Check-in", depart: "Check-out", contacter: "Contatta", hote: "l'host", appeler: "Chiama", email: "E-mail", urgence: "Emergenza",
      recherche: "Cerca: riscaldamento, rifiuti, parcheggio…", rechercheLabel: "Cerca nella guida", effacer: "Cancella la ricerca",
      resultats: function (n, q) { return n + (n > 1 ? " risultati" : " risultato") + " per «" + q + "»"; }, aucun: "Nessun risultato. Prova un'altra parola o contatta il tuo host.",
      arriveeTitre: "Prima del vostro arrivo", arriveeSub: "Come arrivare ed entrare, senza stress.",
      hubTitre: "Cosa cercate?",
      hub: { arrivee: "Indirizzo, accesso, chiavi", logement: function (n) { return n + (n > 1 ? " argomenti" : " argomento"); }, services: function (n) { return n + (n > 1 ? " servizi su richiesta" : " servizio su richiesta"); }, adresses: function (n) { return n + (n > 1 ? " indirizzi" : " indirizzo"); }, carte: "Tutto su una mappa", activites: function (n) { return n + (n > 1 ? " idee" : " idea"); }, depart: "Lista di controllo prima di partire", urgences: "112, 15, 17, 18" },
      bientot: "Il vostro soggiorno si avvicina! Ecco tutto ciò che serve per arrivare.",
      adresse: "Indirizzo", itineraire: "Percorso", copierAdresse: "Copia l'indirizzo", adresseCopiee: "Indirizzo copiato",
      prevenir: "Avvisare dell'orario di arrivo", msgArrivee: function (n) { return "Buongiorno, arriveremo a " + n + " verso le … A presto!"; },
      ouvrir: "Toccate un argomento per aprirlo.",
      servicesTitre: "Servizi extra", servicesSub: "Per un soggiorno ancora più piacevole, su semplice richiesta.", demander: "Richiedi",
      msgService: function (t, p) { return "Buongiorno, vorremmo prenotare: " + t + (p ? " (" + p + ")" : "") + ". Grazie!"; },
      adressesTitre: "Indirizzi utili", adressesSub: "Negozi, salute e buoni locali nei dintorni.", tout: "Tutti", aucuneAdresse: "Nessun indirizzo corrisponde.",
      carteTitre: "Sulla mappa", carteSub: "L'alloggio, gli indirizzi utili e le gite.", carteLogement: "L'alloggio", carteAdresses: "Indirizzi", carteActivites: "Da fare",
      carteToucher: "Toccate la mappa per spostarla", carteHors: "La mappa non è disponibile offline.",
      activitesTitre: "Da fare nei dintorni", activitesSub: "Le nostre idee per uscire, provate e approvate.", voirCarte: "Vedi sulla mappa", aucuneActivite: "Nessuna attività corrisponde.",
      aucuneRubrique: "Nessun argomento corrisponde.",
      departTitre: "Prima di partire", departSub: function (h) { return (h ? "Check-out " + h.charAt(0).toLowerCase() + h.slice(1) + ". " : "") + "Spuntate man mano."; },
      fait: function (n, t) { return n + " su " + t + (n > 1 ? " fatti" : " fatto"); }, pret: "Tutto pronto, buon viaggio!",
      urgencesTitre: "Emergenze", urgencesSub: "Chiamate gratuite da qualsiasi telefono.",
      u112: "Emergenze, in tutta Europa", u15: "Emergenza medica (SAMU)", u18: "Vigili del fuoco", u17: "Polizia", u114: "Emergenze via SMS (persone sorde o con problemi di udito)",
      u3237: "Farmacia di turno (servizio a pagamento)", antipoison: "Centro antiveleni", hopital: "Ospedale più vicino",
      avis: "Lascia una recensione", avisDemo: "In una guida reale, questo pulsante apre la pagina delle recensioni dell'host (Google, Airbnb, Booking…).",
      maj: "Aggiornato il", fait_avec: "Guida di benvenuto creata con", horsLigneOk: "Questa guida funziona anche offline.",
      meteo: "Meteo", meteoSource: "Dati: MET Norway",
      introuvable: "Guida non trovata", introuvableTxt: "Il link potrebbe essere incompleto. Scansionate di nuovo il codice QR o contattate il vostro host.", retour: "Torna alla home",
      chargement: "Apertura della guida…", horsLigne: "Nessuna connessione", horsLigneTxt: "Questa guida si aprirà appena il telefono sarà connesso a internet (Wi-Fi o dati mobili).", reessayer: "Riprova",
      locale: "it-IT"
    }
  };

  /* ---------- adresse de la page ---------- */
  function route() {
    var p = new URLSearchParams(location.search);
    var id = p.get("id"), view = p.get("s");
    var m = location.pathname.match(/\/l\/([\w-]+)(?:\/([\w-]+))?\/?$/);
    if (!id && m) { id = m[1]; view = view || m[2]; }
    if (!id) {
      var h = decodeURIComponent((location.hash || "").replace(/^#/, "")).split("/");
      id = h[0]; view = view || h[1];
    }
    return { id: id || "nid-des-tanneurs", view: view || "", lang: p.get("lang") };
  }

  /* ---------- langue ---------- */
  var LANGS = ["fr", "en", "de", "it"];
  function langsOf(d) {
    var a = ["fr"];
    ["en", "de", "it"].forEach(function (l) { if (d && d[l] && typeof d[l] === "object" && Object.keys(d[l]).length) a.push(l); });
    return a;
  }
  function hasEn(d) { return langsOf(d).length > 1; }   /* « a plusieurs langues » */
  function pickLang(d) {
    var av = langsOf(d);
    if (APERCU && forcedLang && LANGS.indexOf(forcedLang) > -1) return forcedLang;   /* aperçu de la console : la langue en cours de saisie */
    if (av.length < 2) return "fr";
    if (forcedLang && av.indexOf(forcedLang) > -1) return forcedLang;
    if (VITRINE) return "fr";
    var r = route().lang;
    if (av.indexOf(r) > -1) return r;
    try { var s = localStorage.getItem("cdh:lang"); if (av.indexOf(s) > -1) return s; } catch (e) {}
    var prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "fr"]);
    for (var i = 0; i < prefs.length; i++) { var p = String(prefs[i] || "").slice(0, 2).toLowerCase(); if (av.indexOf(p) > -1) return p; }
    return av.indexOf("en") > -1 && !/^fr/i.test(prefs[0] || "fr") ? "en" : "fr";
  }
  function merge(base, over) {
    if (over == null) return base;
    if (Array.isArray(base) && Array.isArray(over)) {
      if (base.every(function (x) { return typeof x !== "object" || x === null; })) {
        return over.some(function (x) { return String(x == null ? "" : x).trim(); }) ? over : base;
      }
      return base.map(function (b, i) { return merge(b, over[i]); });
    }
    if (base && typeof base === "object" && over && typeof over === "object" && !Array.isArray(over)) {
      var o = {}; Object.keys(base).forEach(function (k) { o[k] = base[k]; });
      Object.keys(over).forEach(function (k) { o[k] = merge(base[k], over[k]); });
      return o;
    }
    if (typeof over === "string") return over.trim() ? over : base;
    return over;
  }
  function localize(d, lang) {
    if (lang === "fr" || !d || !d[lang]) return d;
    var out = merge(d, d[lang]);
    LANGS.forEach(function (l) { if (d[l]) out[l] = d[l]; });
    return out;
  }

  /* ---------- illustrations (couverture et photos manquantes) ---------- */
  function motif(name, W) {
    W = W || 400;
    var s = "", k2 = W / 400;
    if (name === "colombages") {
      for (var i = 0; i < Math.ceil((W + 40) / 92); i++) {
        var x = i * 92 - 20, w = 92, top = 40 + (i % 2) * 14;
        s += '<path d="M' + x + " " + (top + 26) + "L" + (x + w / 2) + " " + (top - 18) + "L" + (x + w) + " " + (top + 26) + 'Z" fill="currentColor" fill-opacity=".10" stroke="currentColor" stroke-opacity=".45" stroke-width="2.5"/>';
        s += '<rect x="' + x + '" y="' + (top + 26) + '" width="' + w + '" height="' + (170 - top) + '" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".45" stroke-width="2.5"/>';
        var b1 = top + 62, b2 = top + 100;
        s += '<path d="M' + x + " " + b1 + "h" + w + "M" + x + " " + b2 + "h" + w + "M" + (x + 30) + " " + (top + 26) + "V170M" + (x + 62) + " " + (top + 26) + "V170" +
             "M" + x + " " + (top + 26) + "L" + (x + 30) + " " + b1 + "M" + (x + w) + " " + (top + 26) + "L" + (x + 62) + " " + b1 +
             "M" + (x + 30) + " " + b2 + "L" + (x + 62) + " " + (b2 + 38) + "M" + (x + 62) + " " + b2 + "L" + (x + 30) + " " + (b2 + 38) +
             '" stroke="currentColor" stroke-opacity=".5" stroke-width="3" fill="none"/>';
        s += '<rect x="' + (x + 38) + '" y="' + (b1 + 8) + '" width="16" height="22" rx="2" fill="currentColor" fill-opacity=".28"/>';
        s += '<rect x="' + (x + 6) + '" y="' + (b1 + 8) + '" width="18" height="22" rx="2" fill="currentColor" fill-opacity=".18"/>';
        s += '<rect x="' + (x + 68) + '" y="' + (b1 + 8) + '" width="18" height="22" rx="2" fill="currentColor" fill-opacity=".18"/>';
      }
      s += '<path d="M0 150 Q' + W / 4 + ' 140 ' + W / 2 + ' 150 T' + W + ' 150 V170 H0Z" fill="currentColor" fill-opacity=".22"/>';
    } else if (name === "lac") {
      s += '<circle cx="' + (W - 90) + '" cy="46" r="20" fill="currentColor" fill-opacity=".18"/>';
      s += '<g transform="scale(' + k2 + ' 1)">';
      s += '<path d="M-10 108 L60 46 L96 76 L150 22 L214 86 L250 60 L300 100 L346 54 L410 108Z" fill="currentColor" fill-opacity=".14"/>';
      s += '<path d="M150 22 L136 36 L150 32 L162 40Z M346 54 L336 64 L348 62 L356 66Z" fill="currentColor" fill-opacity=".35"/>';
      s += '<path d="M-10 112 L40 80 L80 100 L130 66 L190 104 L240 82 L290 108 L350 78 L410 112Z" fill="currentColor" fill-opacity=".22"/>';
      s += '<rect x="0" y="110" width="400" height="60" fill="currentColor" fill-opacity=".12"/></g>';
      for (var t = 0; t < Math.ceil(W / 400); t++) for (var k = 0; k < 4; k++) {
        var y = 124 + k * 11, ox = t * 400;
        s += '<path d="M' + (ox + 20 + k * 30) + " " + y + " q15 -5 30 0 t30 0 M" + (ox + 210 - k * 20) + " " + y + " q15 -5 30 0 t30 0 t30 0" + '" stroke="currentColor" stroke-opacity=".4" stroke-width="2" fill="none" stroke-linecap="round"/>';
      }
      s += '<path transform="translate(' + (W * 0.3 - 120) + ' 0)" d="M120 120 l40 0 l-6 8 l-28 0z M140 120 v-18 l12 16z" fill="currentColor" fill-opacity=".45"/>';
    } else {
      s += '<circle cx="' + (W - 100) + '" cy="58" r="28" fill="currentColor" fill-opacity=".2"/>';
      s += '<g transform="scale(' + k2 + ' 1)"><path d="M-10 100 Q80 60 170 92 T410 84 V170 H-10Z" fill="currentColor" fill-opacity=".12"/>';
      s += '<path d="M-10 122 Q110 92 220 118 T410 110 V170 H-10Z" fill="currentColor" fill-opacity=".18"/></g>';
      [[64, 66], [84, 78], [W - 62, 74]].concat(W > 700 ? [[W * 0.42, 70], [W * 0.42 + 20, 80]] : []).forEach(function (c) {
        s += '<path d="M' + c[0] + " " + (c[1] + 46) + " C" + (c[0] - 9) + " " + (c[1] + 28) + " " + (c[0] - 6) + " " + (c[1] + 6) + " " + c[0] + " " + c[1] + " C" + (c[0] + 6) + " " + (c[1] + 6) + " " + (c[0] + 9) + " " + (c[1] + 28) + " " + c[0] + " " + (c[1] + 46) + 'Z" fill="currentColor" fill-opacity=".5"/>';
      });
      for (var r = 0; r < 6; r++) {
        var yy = 134 + r * 7;
        s += '<path d="M' + (-10 + r * 4) + " " + yy + " Q" + W / 2 + " " + (yy - 14) + " " + (W + 10) + " " + yy + '" stroke="currentColor" stroke-opacity="' + (0.25 + r * 0.06).toFixed(2) + '" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round" fill="none"/>';
      }
    }
    return '<svg viewBox="0 0 ' + W + ' 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + s + "</svg>";
  }
  function coverW() { var w = window.innerWidth || 400; return w >= 1100 ? 1100 : w >= 760 ? 800 : 400; }

  /* Bloc photo : l'illustration reste dessous tant que la photo n'est pas chargée */
  function head(icon, title, sub) {
    return '<div class="section-head"><span class="sh-ico" aria-hidden="true">' + I(icon) + '</span><div class="sh-t"><h2>' + esc(title) + "</h2>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div></div>";
  }
  function photo(src, alt, icon, cls) {
    return '<div class="ph' + (cls ? " " + cls : "") + '"><span class="ph-fb" aria-hidden="true">' + I(icon, "ph-mark") + '<span class="ph-badge">' + I(icon) + "</span></span>" +
      (safeImg(src) ? '<img data-ph src="' + esc(safeImg(src)) + '" alt="' + esc(alt || "") + '" loading="lazy" decoding="async">' : "") + "</div>";
  }
  function paras(txt) { return txt ? String(txt).split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") : ""; }
  function lines(arr, tag) {
    var a = (arr || []).filter(function (x) { return String(x || "").trim(); });
    if (!a.length) return "";
    return "<" + tag + ">" + a.map(function (e) { return "<li>" + (tag === "ol" ? "<span>" + esc(e) + "</span>" : esc(e)) + "</li>"; }).join("") + "</" + tag + ">";
  }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function annonceActive(a) {
    if (!a || !a.actif || !a.texte) return false;
    if (a.fin) { var end = new Date(a.fin + "T23:59:59"); if (!isNaN(end) && end < new Date()) return false; }
    return true;
  }
  function catLabel(map, key, lang) { var m = map[key] || {}; return lang !== "fr" && m[lang] ? m[lang] : m.label; }

  /* Lien pour écrire à l'hôte avec un message déjà rédigé */
  function contactLink(d, text) {
    var h = d.hote || {}, canal = h.canal || (h.whatsapp ? "whatsapp" : h.tel ? "sms" : "email");
    var tel = h.tel ? window.cdhTel(h.tel) : "";
    if (canal === "whatsapp" && h.whatsapp) return "https://wa.me/" + digits(h.whatsapp) + "?text=" + encodeURIComponent(text);
    if (canal === "sms" && tel) return "sms:" + tel + "?&body=" + encodeURIComponent(text);
    if (h.email) return "mailto:" + h.email + "?subject=" + encodeURIComponent(d.nom || "") + "&body=" + encodeURIComponent(text);
    if (h.whatsapp) return "https://wa.me/" + digits(h.whatsapp) + "?text=" + encodeURIComponent(text);
    return tel ? "sms:" + tel + "?&body=" + encodeURIComponent(text) : "";
  }
  function external(href) { return /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ""; }
  /* Les livrets peuvent être rédigés par les hôtes : seuls les liens web, e-mail, téléphone
     et les chemins du site sont acceptés (jamais « javascript: » ni « data: »). */
  function safeUrl(u) {
    var raw = String(u == null ? "" : u).trim(), s = raw.replace(/[\u0000-\u0020]+/g, "");
    if (!s) return "";
    if (/^(https?:|mailto:|tel:|sms:)/i.test(s)) return raw;
    return /^[a-z][a-z0-9+.\-]*:/i.test(s) ? "" : raw;
  }
  function safeImg(u) {
    var raw = String(u == null ? "" : u).trim();
    if (/^data:image\/(jpeg|png|webp|gif);/i.test(raw)) return raw;
    var v = safeUrl(raw);
    return /^(mailto|tel|sms):/i.test(v) ? "" : v;
  }
  function digits(x) { return String(x == null ? "" : x).replace(/\D/g, ""); }

  /* ---------- rendu ---------- */
  /* Menu des langues : petit bouton « FR ▾ » qui ouvre la liste */
  var LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", it: "Italiano" };
  var X = {
    fr: { titre: " · Livret d'accueil", bienvenue: "BIENVENUE", deuxPoints: " : ", essentiel: "L'essentiel", auj: "Auj.", credits: "Photos d'illustration" },
    en: { titre: " · Welcome book", bienvenue: "WELCOME", deuxPoints: ": ", essentiel: "Essentials", auj: "Today", credits: "Illustration photos" },
    de: { titre: " · Willkommensbuch", bienvenue: "WILLKOMMEN", deuxPoints: ": ", essentiel: "Das Wichtigste", auj: "Heute", credits: "Illustrationsfotos" },
    it: { titre: " · Guida di benvenuto", bienvenue: "BENVENUTI", deuxPoints: ": ", essentiel: "L'essenziale", auj: "Oggi", credits: "Foto illustrative" }
  };
  function langMenu(lang, av) {
    return '<div class="lang" id="lang">' +
      '<button type="button" class="lang-btn" id="lang-btn" aria-haspopup="true" aria-expanded="false" aria-controls="lang-list" aria-label="Langue / Language : ' + LANG_NAMES[lang] + '">' +
      I("globe", "ico-s") + "<span>" + lang.toUpperCase() + "</span>" + I("bas", "ico-s lang-chev") + "</button>" +
      '<ul class="lang-list" id="lang-list" role="menu" aria-label="Langue / Language" hidden>' +
      (av || ["fr", "en"]).map(function (l) {
        return '<li role="none"><button type="button" role="menuitemradio" aria-checked="' + (l === lang) + '" data-lang="' + l + '" lang="' + l + '"><span class="lang-code">' + l.toUpperCase() + "</span><span>" + LANG_NAMES[l] + "</span>" + I("check", "ico-s lang-ok") + "</button></li>";
      }).join("") + "</ul></div>";
  }

  function render(d0, opts) {
    opts = opts || {};
    var lang = pickLang(d0);
    currentLang = lang;
    var d = localize(d0, lang), t = TXT[lang];
    current = d0;
    var root = document.documentElement;
    var theme = d.theme || {};
    root.lang = lang;
    root.style.setProperty("--accent", /^#[0-9a-f]{3,8}$/i.test(theme.accent || "") ? theme.accent : "#1D5C7A");
    root.style.setProperty("--display", FONTS[theme.police] || FONTS.Lora);
    document.title = (d.nom || "Livret d'accueil") + X[lang].titre;

    var h = [];
    var marque = (window.CDH_CONFIG && window.CDH_CONFIG.marque) || "Carnet d'Hôte";
    var hote = d.hote || {};
    var ville = String(d.ville || "").split("·")[0].trim();
    var hor = d.horaires || {};
    var view = opts.view || "";

    if (d.demo && !VITRINE && !APERCU) {
      h.push('<div class="demo-strip"><span>' + esc(t.demo.replace("{m}", marque)) + '</span><a href="index.html#offres">' + esc(t.demoCta) + "</a></div>");
    }
    h.push('<div class="offline-bar" id="offline-bar" hidden>' + I("horsligne", "ico-s") + "<span>" + esc(t.horsLigne) + "</span></div>");
    h.push('<main class="page">');

    /* Couverture + choix de la langue */
    h.push('<header class="cover' + (hasEn(d0) ? " has-lang" : "") + '">' +
      (safeImg(theme.couverture) ? '<img class="cover-img" data-ph data-cover src="' + esc(safeImg(theme.couverture)) + '" alt="">' : "") +
      '<div class="cover-art">' + motif(theme.motif, coverW()) + "</div>" +
      (hasEn(d0) ? langMenu(lang, langsOf(d0)) : "") +
      '<div class="cover-text"><span class="cover-kicker">' + I("pin", "ico-s") + esc(d.ville || "") + "</span>" +
      "<h1>" + esc(d.nom || "Mon logement") + "</h1>" +
      '<p class="cover-sub">' + esc(d.sousTitre || "") + "</p></div></header>");

    h.push('<div class="layout"><div class="main">');

    if (view === "arrivee" && !APERCU) h.push('<p class="soon">' + I("cle", "ico-s") + "<span>" + esc(t.bientot) + "</span></p>");

    /* Carte postale d'accueil */
    var now = new Date();
    var stamp = String(now.getDate()).padStart(2, "0") + "." + String(now.getMonth() + 1).padStart(2, "0") + "." + String(now.getFullYear()).slice(2);
    var arcId = "pc-arc-" + String(d.id || "x").replace(/[^\w-]/g, "");
    var titreAcc = d.titreAccueil || (d.type === "hotel" ? t.bienvenue.hotel : t.bienvenue.defaut);
    h.push('<section class="postcard" aria-label="' + esc(titreAcc) + '">' +
      '<div class="pc-stamp" aria-hidden="true"><div class="pc-stamp-in">' + motif(theme.motif) +
      (safeImg(theme.couverture) ? '<img data-ph src="' + esc(safeImg(theme.couverture)) + '" alt="">' : "") + "</div></div>" +
      '<svg class="pc-mark" viewBox="0 0 180 76" aria-hidden="true">' +
      '<defs><path id="' + arcId + '" d="M38 66 a28 28 0 1 1 0.01 0"/></defs>' +
      '<circle cx="38" cy="38" r="35" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="38" cy="38" r="20" fill="none" stroke="currentColor" stroke-width="1"/>' +
      '<text font-size="7.4" font-weight="700" letter-spacing="1" fill="currentColor"><textPath href="#' + arcId + '" textLength="172" lengthAdjust="spacing">' + (X[lang].bienvenue + " · ") + esc(ville.toUpperCase()) + " ·</textPath></text>" +
      '<text x="38" y="41" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" font-family="ui-monospace, Menlo, monospace">' + stamp + "</text>" +
      '<path d="M78 26 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 M78 38 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 M78 50 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' +
      '<h2 class="pc-title">' + esc(titreAcc) + "</h2>" +
      (d.bienvenue ? '<div class="pc-msg">' + paras(d.bienvenue) + "</div>" : "") +
      '<p class="pc-sign"><span class="pc-script">' + esc(hote.signature || hote.nom || "") + "</span>" + (hote.role ? "<small>" + esc(hote.role) + "</small>" : "") + "</p></section>");

    /* Message du moment */
    if (annonceActive(d.annonce)) {
      var st = d.annonce.style || "info";
      var ic = { info: "info", alerte: "alerte", bonplan: "etiquette" }[st] || "info";
      h.push('<aside class="annonce ' + esc(st) + '">' + I(ic) + "<div><b>" + esc(t.annonce[st] || t.annonce.info) + "</b><p>" + esc(d.annonce.texte) + "</p></div></aside>");
    }

    /* Sommaire */
    var arr = d.arrivee || {};
    var hasArr = !!(arr.texte || (arr.blocs || []).length || d.adresse);
    d.depart = (d.depart || []).filter(function (x) { return String(x).trim(); });
    var geoPts = (d.adresses || []).concat(d.activites || []).filter(function (x) { return x.geo; });
    var hasMap = !!(d.geo || geoPts.length);
    var secs = [];
    if (hasArr) secs.push(["arrivee", t.toc.arrivee]);
    secs.push(["logement", t.lieu[d.type] || t.lieu.location]);
    if ((d.services || []).length) secs.push(["services", t.toc.services]);
    if ((d.adresses || []).length) secs.push(["adresses", t.toc.adresses]);
    if (hasMap) secs.push(["carte", t.toc.carte]);
    if ((d.activites || []).length) secs.push(["activites", t.toc.activites]);
    if (d.depart.length) secs.push(["depart", t.toc.depart]);
    secs.push(["urgences", t.toc.urgences]);
    var HUBI = { arrivee: "cle", logement: "maison", services: "cadeau", adresses: "pin", carte: "carte", activites: "montagne", depart: "valise", urgences: "hopital" };
    var hubN = { logement: (d.rubriques || []).length, services: (d.services || []).length, adresses: (d.adresses || []).length, activites: (d.activites || []).length };
    h.push('<section class="hub" aria-labelledby="hub-t"><h2 id="hub-t">' + esc(t.hubTitre) + "</h2>" +
      '<div class="search-wrap"><div class="search">' + I("recherche") + '<input id="q" type="search" placeholder="' + esc(t.recherche) + '" aria-label="' + esc(t.rechercheLabel) + '" autocomplete="off"><button class="search-clear" type="button" id="q-clear" aria-label="' + esc(t.effacer) + '" hidden>' + I("croix", "ico-s") + '</button></div><p class="search-info" id="q-info" hidden></p></div>' +
      '<ul class="hub-grid">' + secs.map(function (s) {
        var hint = t.hub[s[0]]; if (typeof hint === "function") hint = hint(hubN[s[0]] || 0);
        return '<li><a class="hub-tile' + (s[0] === "urgences" ? " ht-sos" : "") + '" href="#s-' + s[0] + '" data-jump="' + s[0] + '"><span class="ht-ico" aria-hidden="true">' + I(HUBI[s[0]] || "info") + '</span><span class="ht-t"><b>' + esc(s[1]) + "</b><small>" + esc(hint || "") + "</small></span></a></li>";
      }).join("") + "</ul></section>");
    h.push('<nav class="toc" aria-label="Sommaire"><ul>' + secs.map(function (s) { return '<li><a href="#s-' + s[0] + '" data-s="' + s[0] + '">' + esc(s[1]) + "</a></li>"; }).join("") + "</ul></nav>");

    /* Avant votre arrivée */
    if (hasArr) {
      var addrQ = d.adresse || (d.geo ? d.geo.join(",") : d.carte || d.ville || "");
      var arrMsg = contactLink(d, t.msgArrivee(d.nom || ""));
      h.push('<section class="section" id="s-arrivee" data-sec>' + head("cle", t.arriveeTitre, arr.texte || t.arriveeSub));
      if (d.adresse) {
        h.push('<div class="arr-addr" data-q="' + esc(norm(d.adresse)) + '"><span class="arr-ico">' + I("pin") + '</span><div class="arr-addr-main"><small>' + esc(t.adresse) + '</small><b id="arr-addr">' + esc(d.adresse) + "</b>" +
          (hor.arrivee ? '<span class="arr-time">' + I("horloge", "ico-s") + esc(t.arrivee) + X[lang].deuxPoints + esc(hor.arrivee) + "</span>" : "") +
          '</div><div class="arr-actions"><a class="btn small primary" href="' + esc(window.cdhMapsUrl(addrQ)) + '" target="_blank" rel="noopener">' + I("itineraire", "ico-s") + esc(t.itineraire) + '</a><button class="btn small" type="button" id="copy-addr">' + I("copier", "ico-s") + "<span>" + esc(t.copierAdresse) + "</span></button></div></div>");
      }
      h.push('<div class="arr-blocs">');
      (arr.blocs || []).forEach(function (b) {
        h.push('<article class="arr-bloc" data-q="' + esc(norm([b.titre, b.texte, (b.etapes || []).join(" "), b.astuce].join(" "))) + '">' +
          (b.photo ? photo(b.photo, b.titre, b.icone || "info", "arr-ph") : "") +
          '<div class="arr-bloc-body"><h3>' + I(b.icone || "info", "ico-s") + esc(b.titre || "") + "</h3>" + paras(b.texte) + lines(b.etapes, "ol") +
          (b.astuce ? '<div class="astuce">' + I("etoile", "ico-s") + "<span>" + esc(b.astuce) + "</span></div>" : "") + "</div></article>");
      });
      h.push("</div>");
      if (arrMsg) h.push('<a class="btn primary arr-cta" href="' + esc(arrMsg) + '"' + external(arrMsg) + ">" + I("message", "ico-s") + esc(t.prevenir) + "</a>");
      h.push("</section>");
    }

    /* Rubriques */
    h.push('<section class="section" id="s-logement" data-sec>' + head("maison", t.lieu[d.type] || t.lieu.location, t.ouvrir) + '<div class="rubriques">');
    (d.rubriques || []).forEach(function (r, i) {
      var photos = (r.photos || []).filter(function (p) { return p && p.src; });
      var txt = [r.titre, r.resume, r.texte, (r.etapes || []).join(" "), (r.liste || []).join(" "), r.astuce].join(" ");
      h.push('<details class="rub" data-q="' + esc(norm(txt)) + '" id="r-' + esc(r.id || i) + '"><summary><span class="rub-ico">' + I(r.icone) + '</span><span class="rub-t"><b>' + esc(r.titre) + "</b>" + (r.resume ? "<small>" + esc(r.resume) + "</small>" : "") + "</span>" +
        (photos.length ? '<span class="rub-cam">' + I("photo", "ico-s") + "</span>" : "<span></span>") + I("bas", "ico-s chev") + '</summary><div class="rub-body">' +
        (photos.length ? '<div class="gallery' + (photos.length === 1 ? " one" : "") + '">' + photos.map(function (p) {
          return '<figure class="gph"><div class="ph"><img data-ph data-gal src="' + esc(safeImg(p.src)) + '" alt="' + esc(p.legende || r.titre) + '" decoding="async"></div>' + (p.legende ? "<figcaption>" + esc(p.legende) + "</figcaption>" : "") + "</figure>";
        }).join("") + "</div>" : "") +
        paras(r.texte) + lines(r.etapes, "ol") + lines(r.liste, "ul") +
        (r.astuce ? '<div class="astuce">' + I("etoile", "ico-s") + "<span>" + esc(r.astuce) + "</span></div>" : "") +
        "</div></details>");
    });
    h.push('</div><p class="empty-search" hidden>' + esc(t.aucuneRubrique) + "</p></section>");

    /* Services en plus */
    if ((d.services || []).length) {
      h.push('<section class="section" id="s-services" data-sec>' + head("cadeau", t.servicesTitre, t.servicesSub) + '<div class="svcs">');
      d.services.forEach(function (sv) {
        var link = contactLink(d, t.msgService(sv.titre || "", sv.prix || ""));
        h.push('<article class="svc" data-q="' + esc(norm([sv.titre, sv.description].join(" "))) + '"><span class="svc-ico">' + I(sv.icone || "cadeau") + '</span><div class="svc-main"><div class="svc-top"><b>' + esc(sv.titre || "") + "</b>" + (sv.prix ? '<span class="svc-prix">' + esc(sv.prix) + "</span>" : "") + "</div>" +
          (sv.description ? "<p>" + esc(sv.description) + "</p>" : "") +
          (link ? '<a class="lien-act" href="' + esc(link) + '"' + external(link) + ">" + I("message", "ico-s") + esc(t.demander) + "</a>" : "") + "</div></article>");
      });
      h.push("</div></section>");
    }

    /* Adresses */
    var CA = window.CDH_CAT_ADRESSES, CT = window.CDH_CAT_ACTIVITES;
    if ((d.adresses || []).length) {
      var cats = {};
      d.adresses.forEach(function (a) { cats[a.categorie] = 1; });
      h.push('<section class="section" id="s-adresses" data-sec>' + head("pin", t.adressesTitre, t.adressesSub));
      h.push('<div class="chips" role="group" aria-label="' + esc(t.adressesTitre) + '"><button class="chip" type="button" data-cat="" aria-pressed="true">' + esc(t.tout) + "</button>" +
        Object.keys(cats).map(function (c) { var m = CA[c] || CA.services; return '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="false">' + I(m.icone, "ico-s") + esc(catLabel(CA, c, lang) || c) + "</button>"; }).join("") + "</div>");
      h.push('<div class="places">');
      d.adresses.forEach(function (a) {
        var m = CA[a.categorie] || CA.services;
        var q = a.requete || (a.nom + " " + (d.carte || d.ville || ""));
        h.push('<article class="place" data-cat="' + esc(a.categorie) + '" data-q="' + esc(norm([a.nom, m.label, m.en, m.de, m.it, a.note, a.horaires].join(" "))) + '"><span class="place-ico">' + I(m.icone) + '</span><div class="place-main"><div class="place-top"><b>' + esc(a.nom) + '</b><span class="place-cat">' + esc(catLabel(CA, a.categorie, lang) || "") + '</span></div><div class="place-meta">' +
          (a.distance ? "<span>" + I("pin", "ico-s") + esc(a.distance) + "</span>" : "") + (a.horaires ? "<span>" + I("horloge", "ico-s") + esc(a.horaires) + "</span>" : "") + "</div>" +
          (a.note ? "<p>" + esc(a.note) + "</p>" : "") +
          '<a class="lien-act" href="' + esc(window.cdhMapsUrl(q)) + '" target="_blank" rel="noopener">' + I("itineraire", "ico-s") + esc(t.itineraire) + "</a></div></article>");
      });
      h.push('</div><p class="empty-search" hidden>' + esc(t.aucuneAdresse) + "</p></section>");
    }

    /* Carte */
    if (hasMap) {
      h.push('<section class="section" id="s-carte" data-sec data-nosearch>' + head("carte", t.carteTitre, t.carteSub) +
        '<div class="map-legend" role="group" aria-label="' + esc(t.carteTitre) + '">' +
        (d.geo ? '<span class="lg lg-home">' + I("maison", "ico-s") + esc(t.carteLogement) + "</span>" : "") +
        '<button type="button" class="lg lg-a" data-layer="a" aria-pressed="true">' + I("pin", "ico-s") + esc(t.carteAdresses) + "</button>" +
        '<button type="button" class="lg lg-b" data-layer="b" aria-pressed="true">' + I("etoile", "ico-s") + esc(t.carteActivites) + "</button></div>" +
        '<div class="map-wrap"><div class="map" id="map" role="region" aria-label="' + esc(t.carteTitre) + '"></div><p class="map-hint" id="map-hint" hidden>' + esc(t.carteToucher) + '</p><p class="map-off" id="map-off" hidden>' + esc(t.carteHors) + "</p></div></section>");
    }

    /* Activités */
    if ((d.activites || []).length) {
      h.push('<section class="section" id="s-activites" data-sec>' + head("montagne", t.activitesTitre, t.activitesSub) + '<div class="acts">');
      d.activites.forEach(function (a) {
        var m = CT[a.categorie] || CT.culture;
        h.push('<article class="act" data-q="' + esc(norm([a.titre, a.description, m.label, m.en, m.de, m.it].join(" "))) + '">' +
          photo(a.photo, a.titre, m.icone, "act-ph") +
          '<div class="act-body"><span class="act-top">' + I(m.icone, "ico-s") + esc(catLabel(CT, a.categorie, lang) || "") + "</span><h3>" + esc(a.titre) + "</h3>" +
          (a.description ? "<p>" + esc(a.description) + "</p>" : "") +
          '<div class="act-meta">' + (a.distance ? '<span class="tag">' + I("pin", "ico-s") + esc(a.distance) + "</span>" : "") + (a.duree ? '<span class="tag">' + I("horloge", "ico-s") + esc(a.duree) + "</span>" : "") + "</div>" +
          '<a href="' + esc(window.cdhMapsUrl(a.requete || a.titre + " " + (d.carte || d.ville || ""))) + '" target="_blank" rel="noopener">' + esc(t.voirCarte) + " " + I("fleche", "ico-s") + "</a></div></article>");
      });
      h.push('</div><p class="empty-search" hidden>' + esc(t.aucuneActivite) + "</p></section>");
    }

    /* Départ */
    var avisLien = d.avisLien === "demo" ? "demo" : safeUrl(d.avisLien);
    var avisBtn = avisLien ? '<a class="btn primary avis-btn" href="' + esc(avisLien === "demo" ? "#avis" : avisLien) + '"' + (avisLien === "demo" ? ' data-avis-demo="1"' : external(avisLien)) + ">" + I("etoile", "ico-s") + esc(t.avis) + "</a>" : "";
    if (d.depart.length) {
      h.push('<section class="section" id="s-depart" data-sec>' + head("valise", t.departTitre, t.departSub(hor.depart)) +
        '<ul class="checklist">' + d.depart.map(function (x, i) {
          return '<li><label class="check"><input type="checkbox" data-i="' + i + '"><span class="box">' + I("check", "ico-s") + "</span><span>" + esc(x) + "</span></label></li>";
        }).join("") + '</ul><div class="depart-end"><p class="progress" id="progress"></p>' + (avisBtn ? '<div id="avis-done" hidden>' + avisBtn + "</div>" : "") + "</div></section>");
    }

    /* Urgences */
    var u = d.urgences || {};
    h.push('<section class="section sec-sos" id="s-urgences" data-sec>' + head("hopital", t.urgencesTitre, t.urgencesSub) + '<div class="sos">' +
      '<a class="first" href="tel:112"><span class="num">112</span><small>' + esc(t.u112) + "</small></a>" +
      '<a href="tel:15"><span class="num">15</span><small>' + esc(t.u15) + "</small></a>" +
      '<a href="tel:18"><span class="num">18</span><small>' + esc(t.u18) + "</small></a>" +
      '<a href="tel:17"><span class="num">17</span><small>' + esc(t.u17) + "</small></a>" +
      '<a href="sms:114"><span class="num">114</span><small>' + esc(t.u114) + "</small></a>" +
      '<a href="tel:3237"><span class="num">3237</span><small>' + esc(t.u3237) + "</small></a>" +
      (u.antipoison ? '<a href="tel:' + esc(window.cdhTel(u.antipoison)) + '"><span class="num small">' + esc(u.antipoison) + "</span><small>" + esc(t.antipoison) + "</small></a>" : "") +
      (u.hopital && u.hopital.nom ? '<a class="wide" href="' + esc(window.cdhMapsUrl(u.hopital.requete || u.hopital.nom)) + '" target="_blank" rel="noopener"><span class="num small">' + esc(u.hopital.nom) + "</span><small>" + esc(u.hopital.detail || t.hopital) + " · " + esc(t.itineraire.toLowerCase()) + "</small></a>" : "") +
      "</div></section>");

    /* Pied */
    var maj = d.majLe ? new Date(d.majLe) : null;
    h.push('<footer class="foot">' + (d.avis ? '<p class="avis">' + esc(d.avis) + "</p>" : "") + (avisBtn ? "<p>" + avisBtn + "</p>" : "") +
      (d.credits ? "<p>" + esc(lang === "fr" ? d.credits : d.credits.replace("Photos d'illustration", X[lang].credits)) + "</p>" : "") +
      (maj && !isNaN(maj) ? "<p>" + esc(t.maj) + " " + maj.toLocaleDateString(t.locale, { day: "numeric", month: "long", year: "numeric" }) + "</p>" : "") +
      '<p class="sw-ok" id="sw-ok" hidden>' + I("check", "ico-s") + esc(t.horsLigneOk) + "</p>" +
      (d.sansMention ? "" : '<p class="made">' + esc(t.fait_avec) + ' <a href="index.html">' + esc(marque) + "</a></p>") + "</footer>");

    h.push('</div><aside class="aside" aria-label="' + esc(X[lang].essentiel) + '">');

    /* Raccourcis (colonne de droite sur ordinateur) */
    var wifi = d.wifi || {};
    var tel = hote.tel ? window.cdhTel(hote.tel) : "";
    h.push('<section class="quick">');
    if (wifi.reseau) {
      h.push('<div class="tile wide wifi"><span class="tile-label">' + I("wifi", "ico-s") + esc(t.wifi) + '</span><div class="wifi-grid"><small>' + esc(t.reseau) + '</small><span></span><span class="tile-value">' + esc(wifi.reseau) + '</span><span></span>' +
        (wifi.motDePasse ? "<small>" + esc(t.mdp) + '</small><span></span><span class="tile-value mono" id="wifi-pass">' + esc(wifi.motDePasse) + '</span><button class="btn small" type="button" id="copy-wifi">' + I("copier", "ico-s") + "<span>" + esc(t.copier) + "</span></button>" : "") +
        "</div></div>");
    }
    if (hor.arrivee) h.push('<div class="tile"><span class="tile-label">' + I("cle", "ico-s") + esc(t.arrivee) + '</span><span class="tile-value">' + esc(hor.arrivee) + "</span></div>");
    if (hor.depart) h.push('<div class="tile"><span class="tile-label">' + I("valise", "ico-s") + esc(t.depart) + '</span><span class="tile-value">' + esc(hor.depart) + "</span></div>");
    if (tel || hote.email) {
      h.push('<div class="tile wide contact"><span class="tile-label">' + I("telephone", "ico-s") + esc(t.contacter) + " " + esc(hote.nom || t.hote) + "</span>" +
        (hote.reponse ? '<span class="contact-num">' + esc(hote.reponse) + "</span>" : "") +
        '<div class="contact-row">' +
        (tel ? '<a class="btn primary" href="tel:' + esc(tel) + '">' + I("telephone", "ico-s") + esc(t.appeler) + "</a>" : "") +
        (hote.whatsapp ? '<a class="btn" href="https://wa.me/' + esc(digits(hote.whatsapp)) + '" target="_blank" rel="noopener">' + I("message", "ico-s") + "WhatsApp</a>" : "") +
        (hote.email ? '<a class="btn" href="mailto:' + esc(hote.email) + '">' + I("mail", "ico-s") + esc(t.email) + "</a>" : "") +
        "</div>" +
        '<span class="contact-num">' + [hote.tel, hote.email].filter(Boolean).map(esc).join(" · ") + "</span></div>");
    }
    if (d.geo) h.push('<div class="tile wide meteo" id="meteo" hidden></div>');
    h.push('<a class="tile wide sos-link" href="#s-urgences" data-jump="urgences"><span class="tile-label">' + I("hopital", "ico-s") + esc(t.urgence) + '</span><span class="tile-value">112 · 15 · 17 · 18</span></a>');
    h.push("</section></aside></div></main>");

    app.innerHTML = h.join("");
    bind(d, t, lang);
    photos();
    if (d.geo) meteo(d, t, lang);
    if (hasMap) prepareMap(d, t, lang);
    offline();
    caching(d0);
  }

  /* ---------- photos : affichage progressif, repli si absente ---------- */
  function photos() {
    app.querySelectorAll("img[data-ph]").forEach(function (img) {
      function ok() {
        img.classList.add("on");
        if (img.hasAttribute("data-cover")) img.closest(".cover").classList.add("has-photo");
      }
      function ko() {
        img.classList.add("off");
        /* Bloc « Avant l'arrivée » : une photo introuvable ne laisse pas de cadre vide */
        var ap = img.closest(".arr-ph"); if (ap) ap.remove();
        if (img.hasAttribute("data-gal")) {
          var fig = img.closest(".gph"); if (fig) fig.hidden = true;
          var gal = img.closest(".gallery");
          if (gal && !gal.querySelector(".gph:not([hidden])")) {
            gal.hidden = true;
            var rub = gal.closest(".rub"); var cam = rub && rub.querySelector(".rub-cam"); if (cam) cam.hidden = true;
          } else if (gal) gal.classList.toggle("one", gal.querySelectorAll(".gph:not([hidden])").length === 1);
        }
      }
      if (img.complete) { if (img.naturalWidth > 0) ok(); else ko(); }
      else { img.addEventListener("load", ok); img.addEventListener("error", ko); }
    });
  }

  /* ---------- météo (MET Norway, gratuit, licence CC BY 4.0) ---------- */
  var SYMB = {
    fr: { clearsky: "Ensoleillé", clearsky_night: "Ciel dégagé", fair: "Belles éclaircies", partlycloudy: "Partiellement nuageux", cloudy: "Nuageux", fog: "Brouillard", rain: "Pluie", lightrain: "Pluie faible", heavyrain: "Forte pluie", showers: "Averses", sleet: "Neige fondue", snow: "Neige", thunder: "Orage" },
    en: { clearsky: "Sunny", clearsky_night: "Clear", fair: "Mostly sunny", partlycloudy: "Partly cloudy", cloudy: "Cloudy", fog: "Fog", rain: "Rain", lightrain: "Light rain", heavyrain: "Heavy rain", showers: "Showers", sleet: "Sleet", snow: "Snow", thunder: "Thunderstorm" },
    de: { clearsky: "Sonnig", clearsky_night: "Klar", fair: "Überwiegend sonnig", partlycloudy: "Teils bewölkt", cloudy: "Bewölkt", fog: "Nebel", rain: "Regen", lightrain: "Leichter Regen", heavyrain: "Starker Regen", showers: "Schauer", sleet: "Schneeregen", snow: "Schnee", thunder: "Gewitter" },
    it: { clearsky: "Soleggiato", clearsky_night: "Sereno", fair: "Prevalentemente soleggiato", partlycloudy: "Parzialmente nuvoloso", cloudy: "Nuvoloso", fog: "Nebbia", rain: "Pioggia", lightrain: "Pioggia debole", heavyrain: "Pioggia forte", showers: "Rovesci", sleet: "Nevischio", snow: "Neve", thunder: "Temporale" }
  };
  function symInfo(code, lang) {
    code = String(code || "cloudy"); var night = /_night/.test(code); var base = code.replace(/_(day|night|polartwilight)$/, "");
    var L = SYMB[lang], key, icon;
    if (/thunder/.test(base)) { key = "thunder"; icon = "orage"; }
    else if (/snow/.test(base)) { key = "snow"; icon = "neige"; }
    else if (/sleet/.test(base)) { key = "sleet"; icon = "neige"; }
    else if (/showers/.test(base)) { key = "showers"; icon = "pluie"; }
    else if (/^lightrain/.test(base)) { key = "lightrain"; icon = "pluie"; }
    else if (/^heavyrain/.test(base)) { key = "heavyrain"; icon = "pluie"; }
    else if (/rain/.test(base)) { key = "rain"; icon = "pluie"; }
    else if (base === "fog") { key = "fog"; icon = "brouillard"; }
    else if (base === "cloudy") { key = "cloudy"; icon = "nuage"; }
    else if (base === "partlycloudy" || base === "fair") { key = base; icon = night ? "lune" : "soleilnuage"; }
    else { key = night ? "clearsky_night" : "clearsky"; icon = night ? "lune" : "soleil"; }
    return { label: L[key], icon: icon };
  }
  function meteo(d, t, lang) {
    var el = document.getElementById("meteo");
    if (!el || !window.fetch) return;
    var lat = (+d.geo[0]).toFixed(4), lon = (+d.geo[1]).toFixed(4), key = "cdh:meteo:" + lat + "," + lon;
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) {}
    if (cached && Date.now() - cached.at < 60 * 60 * 1000) { draw(cached.data); return; }
    fetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=" + lat + "&lon=" + lon)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) { try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: j })); } catch (e) {} draw(j); })
      .catch(function () { if (cached) draw(cached.data); });
    function draw(j) {
      try {
        var ts = j.properties.timeseries, now = ts[0], det = now.data.instant.details;
        var nowSym = (now.data.next_1_hours || now.data.next_6_hours || {}).summary.symbol_code;
        var days = {}, order = [];
        ts.forEach(function (x) {
          var dt = new Date(x.time), k = dt.toLocaleDateString("fr-CA");
          if (!days[k]) { days[k] = { min: 99, max: -99, sym: null, dist: 99, date: dt }; order.push(k); }
          var tt = x.data.instant.details.air_temperature;
          days[k].min = Math.min(days[k].min, tt); days[k].max = Math.max(days[k].max, tt);
          var s6 = x.data.next_6_hours && x.data.next_6_hours.summary.symbol_code;
          var s1 = x.data.next_1_hours && x.data.next_1_hours.summary.symbol_code;
          var dist = Math.abs(dt.getHours() - 12);
          if ((s6 || s1) && dist < days[k].dist) { days[k].dist = dist; days[k].sym = s6 || s1; }
        });
        var cur = symInfo(nowSym, lang);
        var ville = String(d.ville || "").split("·")[0].trim();
        var list = order.slice(0, 4).map(function (k, i) {
          var x = days[k], si = symInfo(x.sym, lang);
          var name = i === 0 ? X[lang].auj : x.date.toLocaleDateString(t.locale, { weekday: "short" });
          return '<li><span class="md-day">' + esc(name) + "</span>" + I(si.icon, "ico") + '<span class="md-t"><b>' + Math.round(x.max) + "°</b> " + Math.round(x.min) + "°</span></li>";
        }).join("");
        el.innerHTML = '<span class="tile-label">' + I("soleil", "ico-s") + esc(t.meteo) + (ville ? " · " + esc(ville) : "") + "</span>" +
          '<div class="met-now">' + I(cur.icon, "met-ico") + '<span class="met-temp">' + Math.round(det.air_temperature) + '°</span><span class="met-lab">' + esc(cur.label) + "</span></div>" +
          '<ul class="met-days">' + list + '</ul><small class="met-src">' + esc(t.meteoSource) + "</small>";
        el.hidden = false;
      } catch (e) {}
    }
  }

  /* ---------- carte : fond clair façon « appli de voyage », chargée quand on s'en approche ----------
     Fond vectoriel OpenFreeMap (gratuit, usage commercial autorisé, sans clé) affiché par MapLibre
     dans Leaflet. Sans WebGL (rare), repli sur les tuiles OpenStreetMap classiques. */
  var V = "assets/vendor/";
  var MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
  var MAP_ATTR = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
  /* Palette claire et chaleureuse : terre crème, parcs verts, eau bleue, routes blanches */
  var MAP_PAINT = {
    background: { "background-color": "#F5F2EC" },
    landuse_residential: { "fill-color": "#EFEBE3" },
    park: { "fill-color": "#D3E8C6", "fill-opacity": 0.85 },
    landcover_wood: { "fill-color": "#E0EDD5", "fill-opacity": 0.6 },
    landcover_glacier: { "fill-color": "#FFFFFF" },
    landcover_ice_shelf: { "fill-color": "#FFFFFF" },
    water: { "fill-color": "#A9D4F2" },
    waterway: { "line-color": "#A9D4F2" },
    building: { "fill-color": "#EDE9E1", "fill-outline-color": "#E2DCD0" },
    road_area_pier: { "fill-color": "#F5F2EC" },
    road_pier: { "line-color": "#F5F2EC" },
    highway_path: { "line-color": "#FFFFFF" },
    highway_minor: { "line-color": "#FFFFFF" },
    highway_major_casing: { "line-color": "#E2DCD1" },
    highway_major_inner: { "line-color": "#FFFFFF" },
    highway_major_subtle: { "line-color": "#FFFFFF" },
    highway_motorway_casing: { "line-color": "#E9CD86" },
    highway_motorway_inner: { "line-color": "#FCE5A6" },
    highway_motorway_subtle: { "line-color": "#F6DC98" },
    highway_motorway_bridge_casing: { "line-color": "#E9CD86" },
    highway_motorway_bridge_inner: { "line-color": "#FCE5A6" },
    tunnel_motorway_casing: { "line-color": "#E9CD86" },
    tunnel_motorway_inner: { "line-color": "#FDF0CC" },
    railway: { "line-color": "#D9D3C8" },
    railway_service: { "line-color": "#D9D3C8" },
    railway_transit: { "line-color": "#D9D3C8" },
    boundary_2: { "line-color": "#C9C1B4" },
    boundary_3: { "line-color": "#D3CCC0" },
    water_name_point_label: { "text-color": "#3B78AC" },
    water_name_line_label: { "text-color": "#3B78AC" },
    "highway-name-minor": { "text-color": "#77756F" },
    "highway-name-major": { "text-color": "#6B6963" },
    label_other: { "text-color": "#55534E" },
    label_village: { "text-color": "#3A3935" },
    label_town: { "text-color": "#2F2E2B" },
    label_city: { "text-color": "#2A2927" }
  };
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function loadCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
  }
  function hasWebGL() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { return false; }
  }
  var mapLibsP = null;
  function loadMapLibs() {
    if (mapLibsP) return mapLibsP;
    loadCss(V + "leaflet/leaflet.css");
    mapLibsP = (window.L ? Promise.resolve() : loadScript(V + "leaflet/leaflet.js")).then(function () {
      if (!hasWebGL()) return false;
      loadCss(V + "maplibre/maplibre-gl.css");
      return (window.maplibregl ? Promise.resolve() : loadScript(V + "maplibre/maplibre-gl.js"))
        .then(function () { return window.L.maplibreGL ? null : loadScript(V + "maplibre/leaflet-maplibre-gl.js"); })
        .then(function () { return !!window.L.maplibreGL; }, function () { return false; });
    });
    return mapLibsP;
  }
  var mapStyleP = null;
  function loadMapStyle() {
    if (!mapStyleP) {
      mapStyleP = fetch(MAP_STYLE_URL).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (st) {
        (st.layers || []).forEach(function (l) {
          var p = MAP_PAINT[l.id]; if (!p) return;
          l.paint = l.paint || {};
          Object.keys(p).forEach(function (k) { l.paint[k] = p[k]; });
        });
        return st;
      });
      mapStyleP.catch(function () { mapStyleP = null; });
    }
    return mapStyleP;
  }
  function dist(a, b) {
    var R = 6371, dLat = (b[0] - a[0]) * Math.PI / 180, dLon = (b[1] - a[1]) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function mapOff() { var off = document.getElementById("map-off"); if (off) off.hidden = false; }
  function prepareMap(d, t, lang) {
    var el = document.getElementById("map");
    if (!el) return;
    var started = false;
    function go() {
      if (started) return; started = true;
      loadMapLibs().then(function (vector) {
        if (!vector) { buildMap(d, t, lang, el, null); return; }
        return loadMapStyle().then(function (style) { buildMap(d, t, lang, el, style); }, function () {
          if (navigator.onLine === false) mapOff(); else buildMap(d, t, lang, el, null);
        });
      }).catch(mapOff);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: "400px 0px" });
      io.observe(el);
    } else go();
  }
  function buildMap(d, t, lang, el, style) {
    if (!el.isConnected) return;
    var L = window.L, CA = window.CDH_CAT_ADRESSES, CT = window.CDH_CAT_ACTIVITES;
    var touch = matchMedia("(pointer: coarse)").matches;
    var map = L.map(el, { scrollWheelZoom: false, dragging: !touch, tap: false, zoomControl: true, attributionControl: true, minZoom: 3, maxZoom: 18 });
    if (style) {
      L.maplibreGL({ style: style, attributionControl: { customAttribution: MAP_ATTR } }).addTo(map);
    } else {
      var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
      var tileErrors = 0;
      tiles.on("tileerror", function () { tileErrors++; if (tileErrors === 4 && navigator.onLine === false) mapOff(); });
    }
    function pin(icon, cls, size) { size = size || 34; return L.divIcon({ className: "cdh-pin " + cls, html: "<span>" + I(icon, "ico-s") + "</span>", iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2 + 2] }); }
    function pop(name, sub, q) {
      return "<b>" + esc(name) + "</b>" + (sub ? "<br><small>" + esc(sub) + "</small>" : "") + '<br><a href="' + esc(window.cdhMapsUrl(q)) + '" target="_blank" rel="noopener">' + esc(t.itineraire) + " →</a>";
    }
    var gA = L.layerGroup().addTo(map), gB = L.layerGroup().addTo(map), all = [], near = [];
    var home = d.geo ? [+d.geo[0], +d.geo[1]] : null;
    (d.adresses || []).forEach(function (a) {
      if (!a.geo) return; var m = CA[a.categorie] || CA.services, p = [+a.geo[0], +a.geo[1]];
      L.marker(p, { icon: pin(m.icone, "pin-a"), title: a.nom, riseOnHover: true }).addTo(gA).bindPopup(pop(a.nom, [catLabel(CA, a.categorie, lang), a.distance].filter(Boolean).join(" · "), a.requete || a.nom + " " + (d.carte || d.ville || "")));
      all.push(p); if (!home || dist(home, p) < 8) near.push(p);
    });
    (d.activites || []).forEach(function (a) {
      if (!a.geo) return; var m = CT[a.categorie] || CT.culture, p = [+a.geo[0], +a.geo[1]];
      L.marker(p, { icon: pin(m.icone, "pin-b"), title: a.titre, riseOnHover: true }).addTo(gB).bindPopup(pop(a.titre, [catLabel(CT, a.categorie, lang), a.distance].filter(Boolean).join(" · "), a.requete || a.titre));
      all.push(p); if (!home || dist(home, p) < 8) near.push(p);
    });
    var u = d.urgences || {};
    if (u.hopital && u.hopital.geo) {
      var hp = [+u.hopital.geo[0], +u.hopital.geo[1]];
      L.marker(hp, { icon: pin("hopital", "pin-h"), title: u.hopital.nom, riseOnHover: true }).addTo(gA).bindPopup(pop(u.hopital.nom, u.hopital.detail, u.hopital.requete || u.hopital.nom));
    }
    if (home) {
      L.marker(home, { icon: pin("maison", "pin-home", 44), zIndexOffset: 1000, title: d.nom }).addTo(map).bindPopup("<b>" + esc(d.nom || "") + "</b>" + (d.adresse ? "<br><small>" + esc(d.adresse) + "</small>" : ""));
      all.push(home); near.push(home);
    }
    var pts = near.length > 1 ? near : all;
    if (pts.length > 1) map.fitBounds(pts, { padding: [34, 34], maxZoom: 16 });
    else if (pts.length) map.setView(pts[0], 15);
    else map.setView([46.6, 2.4], 5);
    app.querySelectorAll(".map-legend [data-layer]").forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        var g = b.dataset.layer === "a" ? gA : gB;
        if (on) g.addTo(map); else map.removeLayer(g);
      });
    });
    if (touch) {
      var hint = document.getElementById("map-hint"); if (hint) hint.hidden = false;
      map.once("click", function () { map.dragging.enable(); if (hint) hint.hidden = true; });
    }
    setTimeout(function () { map.invalidateSize(); }, 200);
  }

  /* ---------- hors connexion ---------- */
  function offline() {
    var bar = document.getElementById("offline-bar");
    function upd() { if (bar) bar.hidden = navigator.onLine !== false; }
    upd();
    window.removeEventListener("online", offline._u || function () {}); window.removeEventListener("offline", offline._u || function () {});
    offline._u = upd;
    window.addEventListener("online", upd); window.addEventListener("offline", upd);
  }
  function caching(d) {
    if (APERCU || VITRINE || !("serviceWorker" in navigator)) return;
    if (!/^https:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    var urls = [];
    var api = window.CDH_CLOUD && window.CDH_CLOUD.actif ? window.CDH_CLOUD.base : "";
    var apiOrigin = ""; try { apiOrigin = api ? new URL(api).origin : ""; } catch (e) {}
    function add(src) { if (!src) return; try { var u = new URL(src, location.href); if (u.origin === location.origin || (apiOrigin && u.origin === apiOrigin)) urls.push(u.href); } catch (e) {} }
    add((d.theme || {}).couverture);
    (d.rubriques || []).forEach(function (r) { (r.photos || []).forEach(function (p) { add(p.src); }); });
    (d.activites || []).forEach(function (a) { add(a.photo); });
    ((d.arrivee || {}).blocs || []).forEach(function (b) { add(b.photo); });
    try {
      navigator.serviceWorker.register("sw.js" + (apiOrigin ? "?api=" + encodeURIComponent(apiOrigin) : "")).then(function () { return navigator.serviceWorker.ready; }).then(function (reg) {
        if (reg.active) reg.active.postMessage({ type: "cdh:cache", urls: urls });
        var ok = document.getElementById("sw-ok"); if (ok) ok.hidden = false;
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- interactions ---------- */
  function toast(msg) {
    var el = document.createElement("div");
    el.className = "toast"; el.textContent = msg; el.setAttribute("role", "status");
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }
  function smooth() { return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }
  /* Défilement limité à la page du livret : scrollIntoView ferait aussi défiler
     la page qui l'affiche (téléphone de la vitrine, aperçu de la console). */
  function goTo(el, block, behavior) {
    var r = el.getBoundingClientRect(), y;
    if (block === "center") y = r.top + window.scrollY - (window.innerHeight - r.height) / 2;
    else {
      var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      var mar = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      y = r.top + window.scrollY - pad - mar; /* même calcul que scrollIntoView */
    }
    window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: behavior || "auto" });
  }

  function bind(d, t, lang) {
    var lbtn = document.getElementById("lang-btn"), llist = document.getElementById("lang-list");
    if (lbtn && llist) {
      var items = function () { return Array.prototype.slice.call(llist.querySelectorAll("[data-lang]")); };
      var openMenu = function (focusIdx) {
        llist.hidden = false; lbtn.setAttribute("aria-expanded", "true");
        var it = items(), i = focusIdx != null ? focusIdx : Math.max(0, it.findIndex(function (x) { return x.getAttribute("aria-checked") === "true"; }));
        if (it[i]) it[i].focus();
        setTimeout(function () { document.addEventListener("click", outside, true); }, 0);
      };
      var closeMenu = function (refocus) {
        llist.hidden = true; lbtn.setAttribute("aria-expanded", "false");
        document.removeEventListener("click", outside, true);
        if (refocus) lbtn.focus();
      };
      var outside = function (e) { if (!e.target.closest("#lang")) closeMenu(false); };
      lbtn.addEventListener("click", function () { if (llist.hidden) openMenu(); else closeMenu(true); });
      lbtn.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openMenu(e.key === "ArrowUp" ? items().length - 1 : 0); }
      });
      llist.addEventListener("keydown", function (e) {
        var it = items(), i = it.indexOf(document.activeElement);
        if (e.key === "Escape") { e.preventDefault(); closeMenu(true); }
        else if (e.key === "ArrowDown") { e.preventDefault(); it[(i + 1) % it.length].focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
        else if (e.key === "Tab") closeMenu(false);
      });
      items().forEach(function (b) {
        b.addEventListener("click", function () {
          var l = b.dataset.lang;
          if (l === currentLang) { closeMenu(true); return; }
          forcedLang = l;
          try { localStorage.setItem("cdh:lang", l); } catch (e) {}
          document.removeEventListener("click", outside, true);
          var y = window.scrollY; render(current); window.scrollTo(0, y);
          var nb = document.getElementById("lang-btn"); if (nb) nb.focus({ preventScroll: true });
        });
      });
    }

    var copy = document.getElementById("copy-wifi");
    if (copy) copy.addEventListener("click", function () {
      window.cdhCopy(d.wifi.motDePasse, document.getElementById("wifi-pass")).then(function (ok) {
        if (ok) { copy.querySelector("span").textContent = t.copie; toast(t.mdpCopie); setTimeout(function () { copy.querySelector("span").textContent = t.copier; }, 2000); }
        else toast(t.mdpSel);
      });
    });
    var ca = document.getElementById("copy-addr");
    if (ca) ca.addEventListener("click", function () {
      window.cdhCopy(d.adresse, document.getElementById("arr-addr")).then(function (ok) { toast(ok ? t.adresseCopiee : d.adresse); });
    });
    app.querySelectorAll("[data-avis-demo]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); toast(t.avisDemo); });
    });

    var chips = app.querySelectorAll(".chip");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
        applyFilters(t);
      });
    });

    var q = document.getElementById("q"), clear = document.getElementById("q-clear");
    q.addEventListener("input", function () { applyFilters(t); });
    clear.addEventListener("click", function () { q.value = ""; applyFilters(t); q.focus(); });

    var key = "cdh:depart:" + d.id;
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
    var boxes = app.querySelectorAll(".checklist input");
    boxes.forEach(function (b) {
      b.checked = saved.indexOf(+b.dataset.i) > -1;
      b.addEventListener("change", function () {
        var on = []; boxes.forEach(function (x) { if (x.checked) on.push(+x.dataset.i); });
        try { localStorage.setItem(key, JSON.stringify(on)); } catch (e) {}
        progress();
      });
    });
    function progress() {
      var p = document.getElementById("progress"); if (!p) return;
      var n = 0; boxes.forEach(function (x) { if (x.checked) n++; });
      var done = n === boxes.length;
      p.innerHTML = done ? "<b>" + esc(t.pret) + "</b>" : esc(t.fait(n, boxes.length));
      var av = document.getElementById("avis-done"); if (av) av.hidden = !done;
    }
    progress();

    var links = app.querySelectorAll(".toc a");
    /* le sommaire défile tout seul pour que la partie en cours reste visible */
    var tocBar = app.querySelector(".toc");
    function showChip(id) {
      if (!tocBar) return;
      var chip = tocBar.querySelector('a[data-s="' + id + '"]'); if (!chip) return;
      var left = chip.offsetLeft - (tocBar.clientWidth - chip.offsetWidth) / 2;
      tocBar.scrollTo({ left: Math.max(0, left), behavior: smooth() });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var id = e.target.id.replace("s-", "");
            links.forEach(function (l) { l.setAttribute("aria-current", String(l.dataset.s === id)); });
            showChip(id);
          }
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      app.querySelectorAll("[data-sec]").forEach(function (s) { io.observe(s); });
    }
    app.querySelectorAll(".toc a, [data-jump]").forEach(function (l) {
      l.addEventListener("click", function (ev) {
        var target = document.getElementById(l.getAttribute("href").slice(1));
        if (target) { ev.preventDefault(); goTo(target, "start", smooth()); }
      });
    });
  }

  function applyFilters(t) {
    var q = document.getElementById("q");
    var term = norm(q.value.trim());
    document.getElementById("q-clear").hidden = !term;
    var pressed = app.querySelector('.chip[aria-pressed="true"]');
    var cat = pressed ? pressed.dataset.cat : "";
    var total = 0;
    app.querySelectorAll("[data-sec]").forEach(function (sec) {
      if (sec.hasAttribute("data-nosearch")) { sec.hidden = !!term; return; }
      var items = sec.querySelectorAll("[data-q]"), shown = 0;
      items.forEach(function (it) {
        var ok = !term || it.dataset.q.indexOf(term) > -1;
        if (ok && cat && it.classList.contains("place")) ok = it.dataset.cat === cat;
        it.hidden = !ok;
        if (ok) shown++;
        if (it.tagName === "DETAILS") it.open = !!term && ok;
      });
      if (items.length) {
        var empty = sec.querySelector(".empty-search");
        if (empty) empty.hidden = shown > 0;
        sec.hidden = !!term && shown === 0;
        if (term) total += shown;
      } else if (sec.id !== "s-urgences") sec.hidden = !!term;
    });
    var info = document.getElementById("q-info");
    info.hidden = !term;
    info.textContent = total ? t.resultats(total, q.value.trim()) : t.aucun;
  }

  /* ---------- démarrage ---------- */
  function uiLang() { var p = String((navigator.languages && navigator.languages[0]) || navigator.language || "fr").slice(0, 2).toLowerCase(); return TXT[p] ? p : "en"; }
  function notFound(offlineMsg) {
    var t = TXT[uiLang()];
    current = null;
    if (offlineMsg) {
      app.innerHTML = '<main class="notfound"><h1>' + esc(t.horsLigne) + "</h1><p>" + esc(t.horsLigneTxt) + '</p><p><button type="button" class="btn primary" id="retry">' + esc(t.reessayer) + "</button></p></main>";
      document.getElementById("retry").addEventListener("click", function () { boot(route()); });
      return;
    }
    app.innerHTML = '<main class="notfound"><h1>' + esc(t.introuvable) + "</h1><p>" + esc(t.introuvableTxt) + "</p></main>";
  }
  function loading() {
    app.innerHTML = '<main class="notfound is-loading" aria-busy="true"><span class="ld-dot" aria-hidden="true"></span><p>' + esc(TXT[uiLang()].chargement) + "</p></main>";
  }

  if (APERCU) {
    window.addEventListener("message", function (ev) {
      if (ev.source !== window.parent || !ev.data || ev.data.type !== "cdh:render") return;
      var y = window.scrollY;
      forcedLang = ev.data.lang || "fr";
      render(ev.data.livret);
      if (ev.data.open) { var el = document.getElementById("r-" + ev.data.open); if (el) { el.open = true; goTo(el, "center"); return; } }
      if (ev.data.section) { var s = document.getElementById("s-" + ev.data.section); if (s) { goTo(s, "start"); return; } }
      window.scrollTo(0, y);
    });
    try { window.parent.postMessage({ type: "cdh:ready" }, "*"); } catch (e) {}
  }

  /* Livrets des clients : lus dans la base (Supabase). Une copie reste sur le téléphone
     pour l'ouvrir sans réseau ; les exemples du site restent dans data/livrets.js. */
  var K = window.CDH_CLOUD, CLOUD = !!(K && K.actif) && !APERCU && !VITRINE;
  var CACHE = "cdh:pub:";
  function readCache(id) { try { var r = localStorage.getItem(CACHE + id); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function writeCache(d) { try { localStorage.setItem(CACHE + d.id, JSON.stringify(d)); } catch (e) {} }
  function dropCache(id) { try { localStorage.removeItem(CACHE + id); } catch (e) {} }
  function countOpen(id) {
    try { if (sessionStorage.getItem("cdh:vu:" + id)) return; sessionStorage.setItem("cdh:vu:" + id, "1"); } catch (e) {}
    K.compter(id);
  }
  function show(d, view, scroll) {
    render(d, { view: view });
    if (scroll && view && !APERCU) {
      var target = document.getElementById("s-" + view);
      if (target) setTimeout(function () { goTo(target, "start"); }, 60);
    }
  }
  var bootSeq = 0;
  function boot(r) {
    var seq = ++bootSeq;
    var local = window.CDH_STORE.get(r.id);
    if (!CLOUD) { if (local) show(local, r.view, true); else if (!APERCU) notFound(); return; }
    var cached = readCache(r.id), first = cached || local;
    if (first) show(first, r.view, true); else loading();
    K.livret(r.id).then(function (d) {
      if (seq !== bootSeq) return;
      if (d && typeof d === "object" && !Array.isArray(d)) {
        d.id = r.id;
        writeCache(d); countOpen(r.id);
        if (!current || JSON.stringify(current) !== JSON.stringify(d)) {
          var y = window.scrollY;
          show(d, r.view, !first);
          if (first) window.scrollTo(0, y);
        }
        return;
      }
      /* Pas (ou plus) dans la base : livret d'exemple du site, ou livret désactivé */
      if (cached) { dropCache(r.id); if (local) show(local, r.view, false); else notFound(); }
      else if (!first) notFound();
    }, function () {
      if (seq !== bootSeq) return;
      if (!first) notFound(true);
    });
  }
  window.addEventListener("online", function () { if (!current && CLOUD) boot(route()); });

  boot(route());

  var lastW = coverW();
  window.addEventListener("resize", function () {
    var w = coverW();
    if (w === lastW || !current) return;
    lastW = w;
    var art = app.querySelector(".cover-art");
    if (art) art.innerHTML = motif((current.theme || {}).motif, w);
  });

  window.addEventListener("hashchange", function () {
    var r = route();
    if (!current || r.id !== current.id) { boot(r); window.scrollTo(0, 0); }
  });
})();
