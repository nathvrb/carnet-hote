/* ------------------------------------------------------------------
   Grille tarifaire — utilisée par la page Offres ET le devis automatique.
   Changez un prix ici, il change partout.
   Modèle retenu le 27/10/2026 : création payée une fois (Confort ou Premium),
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
      prix: 149,
      populaire: true,
      accroche: "Le bon choix pour la plupart des logements.",
      delai: "7 à 10 jours ouvrés",
      langues: 3,
      supportsInclus: { porteCles: 1 },
      corrections: 1,
      inclus: [
        "Livret rédigé et mis en page pour vous, rubriques illimitées",
        "Wi-Fi, arrivée, départ, règles, adresses utiles et urgences",
        "3 langues : français, anglais + 1 au choix",
        "Modes d'emploi pas à pas avec photos : lave-linge, plaques, chauffage…",
        "Guide local sur-mesure : 15 adresses et activités sélectionnées",
        "Carte interactive, météo, lien « avant votre arrivée »",
        "1 porte-clés transparent avec votre QR code, livré chez vous",
        "1 série de corrections, dans les 10 jours suivant la mise en ligne",
        "Votre console pour modifier le livret quand vous voulez"
      ]
    },
    premium: {
      nom: "Premium",
      prix: 249,
      accroche: "Pour les hôtes exigeants et les établissements. Plus de contenu, donc un peu plus de temps.",
      delai: "10 à 13 jours ouvrés",
      langues: 4,
      supportsInclus: { porteCles: 3, chevalet: 1 },
      corrections: 3,
      moisOfferts: 3,
      inclus: [
        "Tout le Confort",
        "4 langues : français, anglais + 2 au choix",
        "Vos couleurs et votre logo",
        "Vos vidéos tutos intégrées",
        "Services en plus : départ tardif, panier, ménage…",
        "3 porte-clés transparents + 1 chevalet plexi avec votre QR code",
        "3 séries de corrections, dans les 10 jours suivant la mise en ligne",
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
      inclus: ["Tout l'Autonomie", "Vos modifications faites par nous, jusqu'à 2 demandes par mois", "Mise à jour saisonnière du guide local", "Réponse sous 24 h"]
    }
  },
  moisOffertsAnnuel: 2,          // paiement annuel = 10 mois payés
  modificationPonctuelle: 15,

  // Options
  options: {
    langue: { label: "Langue supplémentaire", prix: 29, par: "livret" },
    express: { label: "Livret en ligne en priorité", detail: "En ligne sous 5 jours ouvrés, supports livrés ensuite", prix: 49, par: "commande", delai: "livret en ligne sous 5 jours ouvrés, supports livrés ensuite" }
  },
  // Supports physiques. « court » = [singulier, pluriel] pour les phrases du devis.
  supports: {
    porteCles: { label: "Porte-clés transparent QR", court: ["porte-clés", "porte-clés"], prix: 9, detail: "Visuel imprimé avec le nom du logement et le QR code, glissé dans le porte-clés" },
    chevalet:  { label: "Chevalet plexiglas A6", court: ["chevalet", "chevalets"], prix: 12, detail: "Table de chevet, réception, bureau" }
  },
};
