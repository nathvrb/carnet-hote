/* ------------------------------------------------------------------
   Grille tarifaire — utilisée par la page Offres ET le devis automatique.
   Changez un prix ici, il change partout.
   Modèle retenu le 27/10/2026, mis à jour le 03/11/2026 : création payée une fois
   (Confort 89,99 € ou Premium 189,99 €, acompte de 50 %, solde après 14 jours d'essai),
   puis forfait mensuel avec console incluse (Autonomie), Sérénité en option.
   Repères marché (oct. 2026) :
   - logiciels « à faire soi-même » : gratuit à ~12 €/mois (StyQR 3 €/mois,
     StayTap Pro dès 6,90 €/mois, Touch Stay ~12,50 €/mois)
   - freelances « fait pour vous » : ~100 € le livret + QR, sans hébergement
------------------------------------------------------------------- */
window.CDH_TARIFS = {
  formules: {
    confort: {
      nom: "Confort",
      prix: 89.99,
      // Plusieurs logements, chaque livret différent : 2e, 3e, puis 4e et suivants
      prixSuivants: [75, 65, 55],
      populaire: true,
      accroche: "Le bon choix pour la plupart des logements.",
      delai: "3 à 5 jours ouvrés",
      langues: 4,
      languesTexte: "4 langues au choix",
      supportsInclus: { porteCles: 1 },
      corrections: 1,
      guide: 15,
      inclus: [
        "Livret rédigé et mis en page pour vous, rubriques illimitées",
        "Wi-Fi, arrivée, départ, règles, adresses utiles et urgences",
        "4 langues au choix : français, anglais, allemand, italien, espagnol, néerlandais",
        "Modes d'emploi pas à pas avec photos : lave-linge, plaques, chauffage…",
        "Guide local sur mesure : 15 adresses et activités, vérifiées et complétées par nos soins",
        "Carte interactive, météo, lien « avant votre arrivée »",
        "Services en plus : départ tardif, panier, ménage…",
        "1 porte-clés transparent avec votre QR code, livré chez vous",
        "1 série de corrections, dans les 10 jours suivant la mise en ligne",
        "Votre console pour modifier le livret quand vous voulez",
        "14 jours d'essai après la mise en ligne, avant de régler le solde"
      ]
    },
    premium: {
      nom: "Premium",
      prix: 189.99,
      prixSuivants: [155, 135, 115],
      accroche: "Un livret entièrement à votre image, pour les hôtes exigeants et les établissements.",
      delai: "3 à 5 jours ouvrés, en priorité",
      langues: 6,
      languesIllimitees: true,
      languesTexte: "langues illimitées",
      couleurPerso: true,
      supportsInclus: { porteCles: 2 },
      corrections: 3,
      guide: 30,
      inclus: [
        "Tout le Confort",
        "Un livret entièrement à votre image : couverture, vos couleurs, votre logo, votre mot d'accueil",
        "Guide local étendu : 30 adresses, avec des parcours prêts à suivre (en amoureux, avec des enfants, s'il pleut…)",
        "Langues illimitées",
        "Vos vidéos tutos intégrées",
        "2 porte-clés transparents, avec un QR code aux couleurs de votre établissement",
        "3 séries de corrections, dans les 10 jours suivant la mise en ligne",
        "Livraison prioritaire",
        "1re mise à jour saisonnière du guide local offerte, après 6 mois",
        "14 jours d'essai après la mise en ligne, avant de régler le solde"
      ]
    }
  },

  // Les langues proposées d'office (le Confort en comprend 4 au choix, sans limite au-delà
  // à 29 € la langue ; le Premium : langues illimitées)
  languesDispo: ["Français", "Anglais", "Allemand", "Italien", "Espagnol", "Néerlandais"],

  // Catégories d'établissement (devis). mode « logement » = un livret par logement,
  // mode « chambres » = un seul livret pour toutes les chambres (hôtels, chambres d'hôtes).
  types: {
    appartement: { label: "Appartement", detail: "Studio, T2, loft… en location courte durée", mode: "logement" },
    maison:      { label: "Maison ou villa", detail: "Location courte durée : Airbnb, Abritel, Booking", mode: "logement" },
    gite:        { label: "Gîte ou meublé de tourisme", detail: "Gîtes de France, Clévacances, gîte rural", mode: "logement" },
    chambres:    { label: "Chambres d'hôtes", detail: "1 livret pour la maison, un QR par chambre", mode: "chambres" },
    hotel:       { label: "Hôtel", detail: "Room directory digital, un QR par chambre", mode: "chambres" }
  },

  // Hôtels et maisons d'hôtes : un livret pour toutes les chambres, au prix d'un seul.
  // Variante = un type de chambre avec 2 ou 3 consignes propres (suite, chambre familiale…).
  variante: { prix: 15, label: "Variante par type de chambre", detail: "2 ou 3 consignes propres à un type de chambre (suite, familiale…)" },

  // Paiement de la création : acompte à la commande, solde après l'essai
  acompte: 0.5,
  essaiJours: 14,
  pdfApresMois: 3,

  // Forfaits mensuels (par livret ; un seul pour un hôtel ou une maison d'hôtes)
  forfaits: {
    autonomie: {
      nom: "Autonomie",
      mensuel: 7.9,
      populaire: true,
      accroche: "Votre console incluse : vous modifiez le livret vous-même, quand vous voulez.",
      inclus: ["Livret en ligne 24 h/24, QR code permanent", "Console : modifications et publication en direct", "Message du moment (travaux, événement…)", "Retour à une version précédente en un clic", "Statistiques de consultation sur 30 jours", "Modification faite par nous : 15 € l'unité"]
    },
    serenite: {
      nom: "Sérénité",
      mensuel: 19.9,
      accroche: "La console, et nous faisons vos modifications pour vous.",
      inclus: ["Tout l'Autonomie", "Vos modifications faites par nous, jusqu'à 2 demandes par mois", "Mise à jour saisonnière du guide local", "Réponse sous 48 h"]
    }
  },
  // Astérisque des délais : les supports physiques sont livrés ensuite
  noteSupports: "* La livraison des porte-clés peut être sujette à retard, selon les délais de fabrication et de livraison.",
  moisOffertsAnnuel: 2,          // paiement annuel = 10 mois payés
  modificationPonctuelle: 15,

  // Options
  options: {
    langue: { label: "Langue supplémentaire (Confort)", prix: 29, par: "livret" }
  },
  // Supports physiques. « court » = [singulier, pluriel] pour les phrases du devis.
  supports: {
    porteCles: { label: "Porte-clés transparent QR", court: ["porte-clés", "porte-clés"], prix: 9, detail: "Visuel imprimé avec le nom du logement et le QR code, glissé dans le porte-clés" }
  },
  // Couleur du bandeau du visuel imprimé (porte-clés, affiche) ; le Premium ajoute une couleur personnalisée
  couleurs: [
    { id: "nuit",       nom: "Bleu nuit",  hex: "#1F3A5F" },
    { id: "sapin",      nom: "Vert sapin", hex: "#1F5B4C" },
    { id: "terracotta", nom: "Terracotta", hex: "#A3402B" },
    { id: "ocre",       nom: "Ocre",       hex: "#B07A1E" },
    { id: "bordeaux",   nom: "Bordeaux",   hex: "#6E2236" },
    { id: "noir",       nom: "Noir mat",   hex: "#232323" }
  ],
};
