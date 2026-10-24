/* ------------------------------------------------------------------
   Grille tarifaire — utilisée par la page Offres ET le devis automatique.
   Changez un prix ici, il change partout.
   Repères marché (oct. 2026) :
   - logiciels « à faire soi-même » : gratuit à ~12 €/mois (StyQR 3 €/mois,
     StayTap Pro dès 6,90 €/mois, Touch Stay ~12,50 €/mois)
   - freelances « fait pour vous » : ~100 € le livret + QR, sans hébergement
------------------------------------------------------------------- */
window.CDH_TARIFS = {
  formules: {
    essentiel: {
      nom: "Essentiel",
      prix: 89,
      accroche: "Le livret clair et complet, sans fioritures.",
      delai: "5 jours ouvrés",
      langues: 1,
      supportsInclus: 0,
      corrections: 1,
      inclus: [
        "Livret rédigé et mis en page pour vous (jusqu'à 10 rubriques)",
        "Wi-Fi, arrivée, départ, règles de la maison",
        "Adresses utiles : boulangerie, courses, pharmacie, hôpital",
        "Numéros d'urgence et contact de l'hôte",
        "Affiche A5 à imprimer (PDF) avec QR du livret et du Wi-Fi",
        "1 série de corrections"
      ]
    },
    confort: {
      nom: "Confort",
      prix: 149,
      populaire: true,
      accroche: "Le bon choix pour la plupart des logements.",
      delai: "7 à 10 jours ouvrés",
      langues: 2,
      supportsInclus: 1,
      corrections: 2,
      inclus: [
        "Tout l'Essentiel, rubriques illimitées",
        "Français + anglais",
        "Modes d'emploi pas à pas avec photos : lave-linge, plaques, chauffage…",
        "Guide local sur-mesure : 15 adresses et activités sélectionnées",
        "Carte interactive, météo, lien « avant votre arrivée »",
        "1 porte-clés gravé ou 1 chevalet plexi, livré chez vous",
        "2 séries de corrections"
      ]
    },
    premium: {
      nom: "Premium",
      prix: 249,
      accroche: "Pour les hôtes exigeants et les établissements. Plus de contenu, donc un peu plus de temps.",
      delai: "10 à 13 jours ouvrés",
      langues: 4,
      supportsInclus: 3,
      corrections: 3,
      moisOfferts: 3,
      inclus: [
        "Tout le Confort",
        "4 langues (FR, EN, DE + 1 au choix)",
        "Vos couleurs, votre logo, vos photos",
        "Vos vidéos tutos intégrées",
        "Services en plus : départ tardif, panier, ménage…",
        "3 porte-clés ou chevalets, couleur au choix",
        "3 mois de forfait offerts"
      ]
    }
  },

  // Type d'établissement
  types: {
    location: { label: "Location courte durée", detail: "Airbnb, Booking, gîte, meublé", unite: "logement", unitePluriel: "logements" },
    maison:   { label: "Maison / chambres d'hôtes", detail: "1 livret pour la maison, un QR par chambre", unite: "chambre", unitePluriel: "chambres" },
    hotel:    { label: "Hôtel", detail: "Room directory digital, un QR par chambre", unite: "chambre", unitePluriel: "chambres" }
  },

  // Hôtels : contenu plus dense (restaurant, spa, services…)
  majorationHotel: [
    { jusqua: 15, prix: 0,   label: "jusqu'à 15 chambres" },
    { jusqua: 40, prix: 90,  label: "16 à 40 chambres" },
    { jusqua: Infinity, prix: 190, label: "plus de 40 chambres" }
  ],

  // Remise multi-logements (locations courte durée) — appliquée à la création et au forfait
  remises: [
    { min: 1,  taux: 0 },
    { min: 2,  taux: 0.15 },
    { min: 4,  taux: 0.25 },
    { min: 10, taux: 0.35 }
  ],

  // Forfaits mensuels (par livret)
  forfaits: {
    hebergement: {
      nom: "Hébergement",
      mensuel: 3.9,
      accroche: "Votre livret reste en ligne, le QR code ne change jamais.",
      inclus: ["Livret en ligne 24 h/24", "QR code permanent", "Sauvegardes", "Modification à la demande : 15 €"]
    },
    autonomie: {
      nom: "Autonomie",
      mensuel: 7.9,
      accroche: "Vous modifiez vous-même, quand vous voulez.",
      inclus: ["Tout l'Hébergement", "Espace client : vous modifiez votre livret vous-même", "Message du moment (travaux, événement…)", "Retour à une version précédente en un clic", "Statistiques de consultation sur 30 jours"]
    },
    serenite: {
      nom: "Sérénité",
      mensuel: 14.9,
      populaire: true,
      accroche: "On s'occupe de tout, chaque mois.",
      inclus: ["Tout l'Autonomie", "1 modification par mois faite par nous", "Mise à jour saisonnière du guide local", "Support prioritaire sous 24 h"]
    }
  },
  moisOffertsAnnuel: 2,          // paiement annuel = 10 mois payés
  modificationPonctuelle: 15,

  // Options
  options: {
    langue: { label: "Langue supplémentaire", prix: 29, par: "livret" },
    express: { label: "Livret en ligne en priorité", detail: "En ligne sous 5 jours ouvrés, supports livrés ensuite", prix: 49, par: "commande", delai: "livret en ligne sous 5 jours ouvrés, supports livrés ensuite" },
    visite: { label: "Visite sur place & photos (Strasbourg + 30 km)", prix: 79, par: "livret" }
  },
  // Supports physiques. « court » = [singulier, pluriel] pour les phrases du devis.
  supports: {
    porteCles: { label: "Porte-clés QR gravé", choix: "Porte-clés gravé", court: ["porte-clés", "porte-clés"], prix: 9, detail: "Accroché aux clés remises au voyageur · couleur au choix" },
    chevalet:  { label: "Chevalet plexiglas A6", choix: "Chevalet plexi", court: ["chevalet", "chevalets"], prix: 12, detail: "Table de chevet, réception, bureau" }
  },
  // Support inclus par défaut selon l'établissement (modifiable dans le devis)
  supportParDefaut: { location: "porteCles", maison: "chevalet", hotel: "chevalet" },
  // Couleurs des porte-clés
  couleurs: [
    { id: "sapin",      nom: "Vert sapin", hex: "#1F5B4C" },
    { id: "terracotta", nom: "Terracotta", hex: "#A3402B" },
    { id: "nuit",       nom: "Bleu nuit",  hex: "#1F3A5F" },
    { id: "ocre",       nom: "Ocre",       hex: "#B07A1E" },
    { id: "bordeaux",   nom: "Bordeaux",   hex: "#6E2236" },
    { id: "noir",       nom: "Noir mat",   hex: "#232323" }
  ]
};
