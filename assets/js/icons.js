/* Jeu d'icônes au trait (24 × 24), partagé par la vitrine, les livrets et la console. */
(function () {
  var P = {
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5 12a10 10 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    cle: '<circle cx="7.5" cy="15.5" r="4"/><path d="M10.4 12.6 20 3"/><path d="m16.5 6.5 2.5 2.5"/><path d="m14 9 2 2"/>',
    porte: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><circle cx="15" cy="12" r="1"/>',
    lavelinge: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M4 7h16"/><circle cx="12" cy="14" r="4.5"/><path d="M7.5 4.8h.01"/><path d="M9.6 15c1.1-1 3.7.6 4.8-.6"/>',
    plaques: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="2.5"/><circle cx="15.5" cy="15.5" r="2.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/>',
    four: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18"/><rect x="6.5" y="11" width="11" height="7" rx="1"/><path d="M7 5.5h.01M10 5.5h.01"/>',
    cafe: '<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9Z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5c-.6 1 .6 2 0 3M12 2.5c-.6 1 .6 2 0 3"/>',
    chauffage: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M7.5 5v13M12 5v13M16.5 5v13"/><path d="M5.5 21v-3M18.5 21v-3"/>',
    flocon: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 3.8 3 2 3-2M9 20.2l3-2 3 2"/>',
    tv: '<rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M8 21h8"/><path d="m9 2 3 3 3-3"/>',
    poubelle: '<path d="M4 6h16"/><path d="M9 6V4h6v2"/><path d="m6 6 1 15h10l1-15"/><path d="M10 10v7M14 10v7"/>',
    voiture: '<path d="M5 17H3v-5l2.2-5.2A2 2 0 0 1 7 5.5h10a2 2 0 0 1 1.8 1.3L21 12v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
    tram: '<rect x="5" y="4" width="14" height="14" rx="3"/><path d="M5 11h14"/><path d="M9 2h6"/><path d="m8 18-2 4M16 18l2 4"/><path d="M8.5 14.5h.01M15.5 14.5h.01"/>',
    regles: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 2.5h6v3H9z"/><path d="M9 11h6M9 15h6M9 19h3"/>',
    horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lit: '<path d="M3 19V6"/><path d="M3 11h18v8"/><path d="M3 16h18"/><path d="M7 11V9.5A1.5 1.5 0 0 1 8.5 8h3A1.5 1.5 0 0 1 13 9.5V11"/>',
    bebe: '<circle cx="12" cy="8" r="5"/><path d="M10 7.5h.01M14 7.5h.01"/><path d="M10.5 10.2c.8.6 2.2.6 3 0"/><path d="M6.5 21c0-3 2.4-5 5.5-5s5.5 2 5.5 5"/>',
    patte: '<circle cx="5.5" cy="10" r="2"/><circle cx="9" cy="5.5" r="2"/><circle cx="15" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M12 12c-3 0-5.5 3.5-5.5 6 0 1.7 1.3 2.5 3 2.5 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c1.7 0 3-.8 3-2.5 0-2.5-2.5-6-5.5-6Z"/>',
    piscine: '<path d="M2 18c1.7 0 1.7-1.2 3.3-1.2S7 18 8.7 18s1.7-1.2 3.3-1.2 1.7 1.2 3.3 1.2 1.7-1.2 3.4-1.2S20.3 18 22 18"/><path d="M8 15V5a2 2 0 0 1 4 0"/><path d="M16 15V5a2 2 0 0 1 4 0"/><path d="M8 8h8M8 12h8"/>',
    petitdej: '<path d="M5 8h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z"/><path d="M16 9.5h1.5a2 2 0 0 1 0 4H16"/><path d="M3 20.5h16"/><path d="M9 2.5c-.5.8.5 1.7 0 2.5M12.5 2.5c-.5.8.5 1.7 0 2.5"/>',
    couverts: '<path d="M6 2v7a2 2 0 0 0 4 0V2"/><path d="M8 9v13"/><path d="M18 2c-2 1.5-3 4-3 7v4h3v9"/>',
    vin: '<path d="M8 2h8l-.5 6a3.5 3.5 0 0 1-7 0L8 2Z"/><path d="M12 11.5V20"/><path d="M8.5 21h7"/><path d="M8.3 6h7.4"/>',
    pain: '<path d="M4.2 19.8a2.5 2.5 0 0 1 0-3.5L16.3 4.2a2.5 2.5 0 0 1 3.5 3.5L7.7 19.8a2.5 2.5 0 0 1-3.5 0Z"/><path d="m8 13 2 2M11 10l2 2M14 7l2 2"/>',
    panier: '<path d="M2.5 4h2.2l2.3 11h11l2-8H6"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    marche: '<path d="M3 9h18l-1.5 11h-15Z"/><path d="m8 9 3-6M16 9l-3-6"/><path d="M8 13v4M12 13v4M16 13v4"/>',
    pharmacie: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
    hopital: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7.5v9M7.5 12h9"/>',
    telephone: '<path d="M5 3h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 7.3 7.3l1.4-2.2L21 15.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    pin: '<path d="M12 21.5s-7-6.2-7-11.5a7 7 0 0 1 14 0c0 5.3-7 11.5-7 11.5Z"/><circle cx="12" cy="10" r="2.5"/>',
    montagne: '<path d="m2 20 7-12 4 6.5L15.5 11 22 20Z"/><path d="m7.2 11 1.8 1.3 1.6-1.4"/>',
    velo: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17 9.5 9.5h7L18.5 17"/><path d="M12 17 9.5 9.5"/><path d="M8.5 6.5h3M15 6.5l1.5 3"/>',
    musee: '<path d="M3 21h18"/><path d="M12 3 3.5 8h17Z"/><path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8"/><path d="M4 18h16"/>',
    photo: '<path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    feuille: '<path d="M5 19c0-9 6-14 15-15-1 9-6 15-15 15Z"/><path d="m5 19 8-8"/>',
    etoile: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
    cloche: '<path d="M4 17a8 8 0 0 1 16 0"/><path d="M2.5 17h19"/><path d="M12 9V7"/><path d="M10 7h4"/><path d="M4 20h16"/>',
    valise: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M8 7v13M16 7v13"/>',
    spa: '<path d="M12 21c-4.5 0-8-2.5-8-6.5 2.5 0 5 1 8 4 3-3 5.5-4 8-4 0 4-3.5 6.5-8 6.5Z"/><path d="M12 18.5c-2-2-2.5-4.5-2.5-7S11 6 12 4.5c1 1.5 2.5 4.5 2.5 7s-.5 5-2.5 7Z"/>',
    coffre: '<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="12" cy="11.5" r="3.5"/><path d="M12 8v1M12 14v1M8.5 11.5h1M14.5 11.5h1"/><path d="M6 19v2M18 19v2"/>',
    linge: '<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3c0 1.7-1.8 3-4 3S8 4.7 8 3Z"/>',
    lune: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    eau: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
    bateau: '<path d="m3 16 1.5 4h15L21 16Z"/><path d="M12 3v13"/><path d="m12 4 6 9h-6"/><path d="m12 7-4 6h4"/>',
    ampoule: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
    livre: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5Z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M9 8h7"/>',
    alerte: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4.5"/><path d="M12 17.5v.01"/>',
    etiquette: '<path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    copier: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    retour: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    recherche: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    itineraire: '<path d="M3 11 21 3l-8 18-2-8Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    crayon: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    moins: '<path d="M5 12h14"/>',
    haut: '<path d="m6 15 6-6 6 6"/>',
    bas: '<path d="m6 9 6 6 6-6"/>',
    croix: '<path d="M6 6l12 12M18 6 6 18"/>',
    oeil: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    telecharger: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17.5 17.5H21V21h-3.5z"/>',
    poignee: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    rideau: '<path d="M3 3h18"/><path d="M5 3c0 6 2 10 5 13v5H5"/><path d="M19 3c0 6-2 10-5 13v5h5"/>',
    maison: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    nuage: '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18Z"/>',
    soleilnuage: '<path d="M8 2.5v1.5M3 7.5h1.5M4.5 4l1 1M11.5 4l-1 1"/><path d="M5 10a3.5 3.5 0 0 1 6.4-2.4"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .4-6.97A5 5 0 0 0 8.4 12a3.75 3.75 0 0 0 .6 8Z"/>',
    pluie: '<path d="M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 6.5 4.25 4.25 0 0 0 7 15Z"/><path d="m8 18-1 3M12 18l-1 3M16 18l-1 3"/>',
    neige: '<path d="M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 5.5 4.25 4.25 0 0 0 7 14Z"/><path d="M8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01"/>',
    orage: '<path d="M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 5.5 4.25 4.25 0 0 0 7 14Z"/><path d="m12 14-2 4h4l-2 4"/>',
    brouillard: '<path d="M7 12h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 3.5 4.25 4.25 0 0 0 7 12Z"/><path d="M4 16h16M6 20h12"/>',
    cadeau: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8"/><path d="M12 8v12"/><path d="M12 8c-2-3-6-3-6-1s4 1 6 1Zm0 0c2-3 6-3 6-1s-4 1-6 1Z"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14"/><path d="m9 21 1.5-4M15 21l-1.5-4"/><path d="M8.5 13.5h.01M15.5 13.5h.01"/>',
    carte: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    horsligne: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 4.6M5 12.5a10 10 0 0 1 2.9-2"/><path d="M12 20h.01"/>'
  };

  // Libellés (console : choix d'icône)
  var LABELS = {
    cle: "Clés / arrivée", porte: "Porte / accès", wifi: "Wi-Fi", tv: "Télévision", lavelinge: "Lave-linge",
    plaques: "Plaques", four: "Four", cafe: "Café", chauffage: "Chauffage", flocon: "Climatisation",
    poubelle: "Poubelles", voiture: "Voiture / parking", tram: "Transports", regles: "Règles", horloge: "Horaires",
    lit: "Chambre", bebe: "Enfants", patte: "Animaux", piscine: "Piscine", petitdej: "Petit-déjeuner",
    couverts: "Restaurant", vin: "Vin / bar", spa: "Spa", coffre: "Coffre-fort", linge: "Linge",
    lune: "Calme / nuit", eau: "Eau", ampoule: "Électricité", cloche: "Réception", valise: "Bagages / départ",
    info: "Information", alerte: "Attention", etoile: "Coup de cœur", livre: "Livre d'or", velo: "Vélo",
    montagne: "Nature", musee: "Culture", bateau: "Bateau", soleil: "Soleil", feuille: "Jardin", rideau: "Rideaux / volets",
    maison: "Maison", train: "Train", carte: "Plan", cadeau: "Cadeau / service", telephone: "Téléphone", panier: "Panier", pin: "Lieu"
  };

  function icon(name, cls) {
    var body = P[name] || P.info;
    return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  window.CDH_ICONS = P;
  window.CDH_ICON_LABELS = LABELS;
  window.cdhIcon = icon;

  window.CDH_CAT_ADRESSES = {
    boulangerie: { label: "Boulangerie", icone: "pain" , en: "Bakery" },
    courses: { label: "Courses", icone: "panier" , en: "Groceries" },
    marche: { label: "Marché", icone: "marche" , en: "Market" },
    pharmacie: { label: "Pharmacie", icone: "pharmacie" , en: "Pharmacy" },
    sante: { label: "Santé", icone: "hopital" , en: "Health" },
    restaurant: { label: "Restaurant", icone: "couverts" , en: "Restaurant" },
    bar: { label: "Bar & cave", icone: "vin" , en: "Bar & wine" },
    transport: { label: "Transport", icone: "tram" , en: "Transport" },
    parking: { label: "Parking", icone: "voiture" , en: "Parking" },
    services: { label: "Services", icone: "info" , en: "Services" }
  };

  window.CDH_CAT_ACTIVITES = {
    culture: { label: "Culture", icone: "musee" , en: "Culture" },
    nature: { label: "Nature", icone: "montagne" , en: "Nature" },
    balade: { label: "Balade", icone: "velo" , en: "Outdoors" },
    sortie: { label: "Sortie", icone: "bateau" , en: "Outing" },
    gastronomie: { label: "Gastronomie", icone: "vin" , en: "Food & wine" },
    famille: { label: "En famille", icone: "bebe" , en: "Family" }
  };
})();
