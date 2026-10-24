/* ------------------------------------------------------------------
   Livrets publiés.
   Chaque livret = une entrée. L'identifiant (id) est l'adresse du livret :
   livret.html#nid-des-tanneurs  (ou /l/nid-des-tanneurs une fois en ligne).
   Le bloc « en » contient la traduction anglaise : chaque texte vide
   ou absent reprend la version française. Les listes (rubriques,
   adresses…) sont traduites dans le même ordre que la version française.
   « geo » = [latitude, longitude] pour la carte et la météo.
   Les trois livrets ci-dessous sont des EXEMPLES FICTIFS pour la vitrine :
   logements, hôtes, numéros et commerces sont inventés.
   Pour ajouter un client : créez son livret dans la console,
   « Exporter », puis collez le résultat à la suite de cette liste.
------------------------------------------------------------------- */
window.CDH_LIVRETS = window.CDH_LIVRETS || {};

/* ============ 1. Location courte durée — Strasbourg ============ */
window.CDH_LIVRETS["nid-des-tanneurs"] = {
  id: "nid-des-tanneurs",
  demo: true,
  credits: "Photos d'illustration : Unsplash",
  type: "location",
  nom: "Le Nid des Tanneurs",
  sousTitre: "Appartement 2 pièces · 3e étage sans ascenseur",
  ville: "Strasbourg · Petite France",
  carte: "Petite France, Strasbourg",
  adresse: "Quartier de la Petite France, 67000 Strasbourg",
  geo: [48.5806, 7.7420],
  theme: { accent: "#A3402B", police: "Gloock", motif: "colombages", couverture: "photos/nid-des-tanneurs/couverture.jpg" },
  titreAccueil: "Bienvenue chez nous !",
  hote: {
    nom: "Claire & Julien",
    role: "Vos hôtes",
    tel: "06 39 98 12 47",
    whatsapp: "33639981247",
    email: "nid.tanneurs@exemple.fr",
    reponse: "Réponse en moins d'une heure, de 8 h à 22 h"
  },
  bienvenue: "Bienvenue à Strasbourg ! Vous trouverez ici tout ce qu'il faut pour un séjour sans souci : le Wi-Fi, le fonctionnement de l'appartement et nos adresses préférées du quartier. Bon séjour !",
  annonce: {
    actif: true,
    style: "info",
    texte: "Marché de Noël à partir de fin novembre : le centre est très fréquenté le week-end, réservez vos restaurants à l'avance.",
    fin: ""
  },
  wifi: { reseau: "NidTanneurs_5G", motDePasse: "colombage-1907" },
  horaires: { arrivee: "À partir de 16 h", depart: "Avant 11 h" },
  arrivee: {
    texte: "Tout ce qu'il faut pour arriver sans stress. Dites-nous à quelle heure vous arrivez, on vous attend !",
    blocs: [
      { icone: "train", titre: "En train", texte: "Depuis la gare centrale : 12 minutes à pied, ou le tram A ou D jusqu'à l'arrêt Alt Winmärik (2 arrêts), puis 4 minutes à pied." },
      { icone: "voiture", titre: "En voiture", texte: "Le quartier est piéton. Garez-vous dans un parking relais tram (P+R) en périphérie : le ticket comprend le tram aller-retour pour tous les passagers." },
      {
        icone: "cle", titre: "Récupérer les clés",
        photo: "photos/nid-des-tanneurs/boite-a-cles.jpg",
        texte: "La boîte à clés est fixée à droite de la porte de l'immeuble, sous la sonnette « Nid des Tanneurs ».",
        etapes: [
          "Composez le code 2408 et tirez le volet vers le bas.",
          "Prenez le trousseau : la clé ronde ouvre l'immeuble, la clé plate ouvre l'appartement.",
          "Montez au 3e étage, porte de gauche.",
          "Refermez la boîte et brouillez le code."
        ],
        astuce: "Vous arrivez en avance ? Écrivez-nous : si l'appartement est prêt, vous pourrez entrer plus tôt."
      }
    ]
  },
  rubriques: [
    {
      id: "wifi-tv", titre: "Wi-Fi et télévision", icone: "tv",
      resume: "Box, Netflix, redémarrage",
      texte: "La box est dans le meuble TV. La télévision est connectée : Netflix et YouTube fonctionnent avec vos propres identifiants. Pensez à vous déconnecter avant de partir.",
      astuce: "Si le Wi-Fi coupe, débranchez la box 10 secondes puis rebranchez-la. Le redémarrage prend environ 3 minutes."
    },
    {
      id: "lave-linge", titre: "Lave-linge", icone: "lavelinge",
      resume: "Programme 30°, capsules, ouverture",
      texte: "Le lave-linge est dans la salle de bain. Les capsules de lessive sont dans le placard juste au-dessus.",
      etapes: [
        "Chargez le linge sans dépasser les trois quarts du tambour.",
        "Posez une capsule directement au fond du tambour.",
        "Tournez le bouton sur « Mix 30° » (1 h 05) ou « Rapide 15' » pour un petit lavage.",
        "Appuyez sur Départ/Pause : la porte se verrouille.",
        "En fin de cycle, attendez que le voyant cadenas s'éteigne (environ 2 minutes) avant d'ouvrir."
      ],
      astuce: "L'étendoir pliant est rangé derrière la porte de la salle de bain.",
      photos: [
        { src: "photos/nid-des-tanneurs/lave-linge.jpg", legende: "Le lave-linge, dans la salle de bain" },
        { src: "photos/nid-des-tanneurs/lave-linge-programmes.jpg", legende: "Le bouton des programmes : choisissez « Mix 30° »" }
      ]
    },
    {
      id: "cuisine", titre: "Cuisine", icone: "plaques",
      resume: "Plaques à induction, café, équipements",
      texte: "Plaques à induction, four, micro-ondes, bouilloire, grille-pain et machine à capsules compatible Nespresso. Huile, sel, poivre, thé et quelques capsules sont à votre disposition.",
      etapes: [
        "Appuyez 2 secondes sur la touche Marche des plaques.",
        "Touchez la zone de cuisson voulue, puis réglez la puissance avec + et –.",
        "Si le panneau ne répond plus, maintenez la touche cadenas 3 secondes pour le déverrouiller."
      ],
      astuce: "Les casseroles du placard sous l'évier sont compatibles induction, pas celles en aluminium du haut.",
      photos: [
        { src: "photos/nid-des-tanneurs/cafetiere.jpg", legende: "La machine à café, à côté de la bouilloire" }
      ]
    },
    {
      id: "chauffage", titre: "Chauffage", icone: "chauffage",
      resume: "Robinets thermostatiques de 1 à 5",
      texte: "Le chauffage collectif fonctionne de mi-octobre à mi-avril. Chaque radiateur a un robinet numéroté de 1 à 5.",
      liste: [
        "Position 3 : environ 20 °C, idéal en journée.",
        "Position 2 : pour la nuit dans la chambre.",
        "Position ✻ : hors gel, quand vous aérez longtemps."
      ],
      photos: [
        { src: "photos/nid-des-tanneurs/radiateur.jpg", legende: "Les radiateurs ont un robinet réglable de 1 à 5" }
      ]
    },
    {
      id: "tri", titre: "Poubelles et tri", icone: "poubelle",
      resume: "Bacs dans la cour, verre dans la rue",
      texte: "Les bacs sont dans la cour, au bout du couloir du rez-de-chaussée.",
      liste: [
        "Bac jaune : emballages en plastique et en métal, cartons et papiers, en vrac (sans sac).",
        "Bac gris : ordures ménagères, dans un sac fermé.",
        "Verre : borne à l'angle de la rue, à 50 m. Pas après 22 h, par respect pour les voisins.",
        "Épluchures : petit seau sous l'évier, à vider dans le bac marron de la cour."
      ]
    },
    {
      id: "regles", titre: "Règles de la maison", icone: "regles",
      resume: "Non-fumeur, calme après 22 h",
      liste: [
        "Appartement non-fumeur, balcon compris.",
        "Pas de fêtes ni d'événements.",
        "Calme après 22 h : les murs du vieux Strasbourg sont fins.",
        "Animaux non admis.",
        "4 voyageurs maximum."
      ]
    },
    {
      id: "transports", titre: "Se déplacer", icone: "tram",
      resume: "Tram à 4 min, vélos, gare",
      texte: "Tout se fait à pied dans le centre. Pour aller plus loin, le tram et le vélo sont les plus pratiques.",
      liste: [
        "Tram A et D, arrêt Alt Winmärik : 4 min à pied.",
        "Gare centrale : 12 min à pied.",
        "Vélos en location Vélhop : station à 3 min."
      ],
      astuce: "Achetez vos tickets sur l'application CTS ou aux distributeurs des stations."
    },
    {
      id: "linge", titre: "Linge et équipement bébé", icone: "linge",
      resume: "Draps, serviettes, lit parapluie",
      texte: "Draps et serviettes sont fournis : une grande et une petite serviette par personne. Lit parapluie et chaise haute sont rangés dans le placard de l'entrée."
    }
  ],
  services: [
    { icone: "horloge", titre: "Départ tardif jusqu'à 14 h", prix: "20 €", description: "Profitez de l'appartement quelques heures de plus, selon disponibilités." },
    { icone: "cle", titre: "Arrivée anticipée dès 13 h", prix: "20 €", description: "Posez vos bagages et commencez la visite plus tôt." },
    { icone: "petitdej", titre: "Panier petit-déjeuner alsacien", prix: "18 € pour 2", description: "Kougelhopf, bretzels, confiture et café, déposés avant votre arrivée." },
    { icone: "linge", titre: "Ménage en cours de séjour", prix: "35 €", description: "Pour les séjours de plus de 4 nuits : ménage et linge propre." }
  ],
  adresses: [
    { categorie: "boulangerie", nom: "Boulangerie Kugel", distance: "3 min à pied", horaires: "Mar.–dim. 7 h–19 h", note: "Bretzels chauds dès 7 h et kougelhopf le dimanche.", geo: [48.5817, 7.7433] },
    { categorie: "courses", nom: "Supérette du Quai", distance: "4 min à pied", horaires: "Tous les jours 8 h–22 h", note: "Pour les courses du soir et le dépannage.", geo: [48.5794, 7.7446] },
    { categorie: "courses", nom: "Supermarché des Halles", distance: "10 min à pied", horaires: "Lun.–sam. 8 h 30–20 h", note: "Le plus grand choix du centre-ville.", geo: [48.5866, 7.7428] },
    { categorie: "pharmacie", nom: "Pharmacie des Ponts Couverts", distance: "5 min à pied", horaires: "Lun.–sam. 8 h 30–19 h 30", note: "Pharmacie de garde le soir et le dimanche : appelez le 3237.", geo: [48.5800, 7.7396] },
    { categorie: "sante", nom: "Cabinet médical du Faubourg", distance: "8 min à pied", horaires: "Sur rendez-vous", note: "Médecins généralistes, rendez-vous en ligne souvent possible le jour même.", geo: [48.5789, 7.7352] },
    { categorie: "restaurant", nom: "Winstub Le Tonnelier", distance: "4 min à pied", horaires: "Mer.–dim. midi et soir", note: "Choucroute, baeckeoffe et tarte flambée. Réservation conseillée.", geo: [48.5812, 7.7449] },
    { categorie: "restaurant", nom: "La Petite Écluse", distance: "2 min à pied", horaires: "Tous les jours 9 h–18 h", note: "Brunch le week-end, terrasse au bord de l'eau.", geo: [48.5809, 7.7409] },
    { categorie: "bar", nom: "Cave du Riesling", distance: "6 min à pied", horaires: "Mar.–sam. 11 h–20 h", note: "Vins d'Alsace et crémant, dégustation le samedi.", geo: [48.5826, 7.7456] },
    { categorie: "transport", nom: "Arrêt de tram Alt Winmärik", distance: "4 min à pied", horaires: "Lignes A et D", note: "Direct pour la gare et le centre.", requete: "Alt Winmärik tram Strasbourg", geo: [48.5836, 7.7413] },
    { categorie: "parking", nom: "Parkings relais tram (P+R)", distance: "En périphérie", horaires: "Tous les jours", note: "La solution la plus économique pour venir en voiture.", requete: "Parking relais tram Strasbourg" }
  ],
  activites: [
    { photo: "photos/nid-des-tanneurs/cathedrale.jpg", categorie: "culture", titre: "Cathédrale et horloge astronomique", distance: "15 min à pied", duree: "1 h 30", description: "Montez les 332 marches jusqu'à la plateforme pour la vue sur les toits. À 12 h 30, les automates de l'horloge astronomique se mettent en mouvement.", requete: "Cathédrale Notre-Dame de Strasbourg", geo: [48.5818, 7.7509] },
    { photo: "photos/nid-des-tanneurs/barrage-vauban.jpg", categorie: "balade", titre: "Barrage Vauban", distance: "5 min à pied", duree: "30 min", description: "Sa terrasse panoramique, gratuite, offre la plus belle vue sur les Ponts Couverts et la Petite France.", requete: "Barrage Vauban Strasbourg", geo: [48.5797, 7.7375] },
    { photo: "photos/nid-des-tanneurs/croisiere.jpg", categorie: "sortie", titre: "Croisière sur l'Ill", distance: "12 min à pied", duree: "Environ 1 h", description: "Le tour de la Grande Île en bateau, avec commentaires audio. Idéal le premier jour pour se repérer.", requete: "Croisière Ill Strasbourg embarcadère", geo: [48.5808, 7.7520] },
    { photo: "photos/nid-des-tanneurs/orangerie.jpg", categorie: "famille", titre: "Parc de l'Orangerie", distance: "25 min en tram", duree: "2 h", description: "Cigognes, lac, barques et mini-ferme : la sortie préférée des enfants.", requete: "Parc de l'Orangerie Strasbourg", geo: [48.5921, 7.7746] },
    { photo: "photos/nid-des-tanneurs/neustadt.jpg", categorie: "culture", titre: "Quartier de la Neustadt", distance: "20 min à pied", duree: "1 h 30", description: "Le quartier impérial allemand, classé à l'Unesco avec la Grande Île. Grands boulevards, palais et façades Art nouveau.", requete: "Neustadt Strasbourg place de la République", geo: [48.5878, 7.7546] },
    { photo: "photos/nid-des-tanneurs/colmar.jpg", categorie: "gastronomie", titre: "Colmar et la Route des vins", distance: "Environ 30 min en TER", duree: "Une journée", description: "Colmar en train, puis Riquewihr et Eguisheim en voiture pour les caves et les villages fleuris.", requete: "Colmar", geo: [48.0794, 7.3585] }
  ],
  depart: [
    "Lancer le lave-vaisselle",
    "Sortir les poubelles dans la cour",
    "Fermer les fenêtres et baisser les radiateurs sur 2",
    "Laisser les serviettes utilisées dans la baignoire",
    "Remettre les clés dans la boîte et brouiller le code"
  ],
  urgences: {
    hopital: { nom: "Nouvel Hôpital Civil", detail: "Hôpitaux universitaires · 15 min en tram", requete: "Nouvel Hôpital Civil Strasbourg", geo: [48.5766, 7.7471] },
    antipoison: "03 88 37 37 37"
  },
  avis: "Votre séjour vous a plu ? Quelques mots sur la plateforme de réservation nous aident énormément. Merci !",
  avisLien: "demo",

  en: {
    sousTitre: "2-room apartment · 3rd floor, no lift",
    titreAccueil: "Welcome to our home!",
    bienvenue: "Welcome to Strasbourg! Here you'll find everything you need for a smooth stay: the Wi-Fi, how the apartment works and our favourite places in the neighbourhood. Enjoy your stay!",
    hote: { role: "Your hosts", reponse: "We reply within an hour, 8 am to 10 pm" },
    annonce: { texte: "Christmas market from late November: the centre gets very busy at weekends, so book your restaurants ahead." },
    horaires: { arrivee: "From 4 pm", depart: "Before 11 am" },
    adresse: "Petite France district, 67000 Strasbourg",
    arrivee: {
      texte: "Everything you need for a stress-free arrival. Let us know what time you'll arrive, we're looking forward to it!",
      blocs: [
        { titre: "By train", texte: "From the main station: a 12-minute walk, or tram A or D to the Alt Winmärik stop (2 stops), then a 4-minute walk." },
        { titre: "By car", texte: "The area is pedestrian. Park in a park-and-ride (P+R) on the outskirts: the ticket includes a return tram trip for everyone in the car." },
        {
          titre: "Getting the keys",
          texte: "The key box is on the right of the building's front door, under the “Nid des Tanneurs” doorbell.",
          etapes: [
            "Enter code 2408 and pull the cover down.",
            "Take the keys: the round key opens the building, the flat key opens the apartment.",
            "Go up to the 3rd floor, door on the left.",
            "Close the box and scramble the code."
          ],
          astuce: "Arriving early? Message us: if the apartment is ready, you can come in sooner."
        }
      ]
    },
    rubriques: [
      { titre: "Wi-Fi and TV", resume: "Router, Netflix, restarting", texte: "The router is in the TV cabinet. The TV is a smart TV: Netflix and YouTube work with your own accounts. Remember to log out before you leave.", astuce: "If the Wi-Fi drops, unplug the router for 10 seconds and plug it back in. It takes about 3 minutes to restart." },
      {
        titre: "Washing machine", resume: "30° programme, pods, opening the door",
        texte: "The washing machine is in the bathroom. Detergent pods are in the cupboard just above it.",
        etapes: [
          "Load the laundry, filling the drum no more than three quarters.",
          "Put one pod straight into the back of the drum.",
          "Turn the dial to “Mix 30°” (1 h 05) or “Rapide 15'” for a quick wash.",
          "Press Start/Pause: the door locks.",
          "When the cycle ends, wait for the padlock light to go off (about 2 minutes) before opening."
        ],
        astuce: "The folding drying rack is behind the bathroom door.",
        photos: [{ legende: "The washing machine, in the bathroom" }, { legende: "The programme dial: choose “Mix 30°”" }]
      },
      {
        titre: "Kitchen", resume: "Induction hob, coffee, equipment",
        texte: "Induction hob, oven, microwave, kettle, toaster and a Nespresso-compatible capsule machine. Oil, salt, pepper, tea and a few capsules are there for you.",
        etapes: [
          "Hold the hob's On button for 2 seconds.",
          "Touch the cooking zone you want, then set the power with + and –.",
          "If the panel stops responding, hold the padlock button for 3 seconds to unlock it."
        ],
        astuce: "The pans in the cupboard under the sink work on induction; the aluminium ones on the top shelf don't.",
        photos: [{ legende: "The coffee machine, next to the kettle" }]
      },
      {
        titre: "Heating", resume: "Radiator valves from 1 to 5",
        texte: "Central heating runs from mid-October to mid-April. Each radiator has a valve numbered from 1 to 5.",
        liste: ["Setting 3: about 20 °C, ideal during the day.", "Setting 2: for the night in the bedroom.", "Setting ✻: frost protection, when airing the room for a long time."],
        photos: [{ legende: "Each radiator has a valve you can set from 1 to 5" }]
      },
      {
        titre: "Bins and recycling", resume: "Bins in the courtyard, glass in the street",
        texte: "The bins are in the courtyard, at the end of the ground-floor corridor.",
        liste: [
          "Yellow bin: plastic and metal packaging, cardboard and paper, loose (no bag).",
          "Grey bin: general waste, in a closed bag.",
          "Glass: bottle bank on the street corner, 50 m away. Not after 10 pm, out of respect for the neighbours.",
          "Food scraps: small bucket under the sink, to empty into the brown bin in the courtyard."
        ]
      },
      {
        titre: "House rules", resume: "No smoking, quiet after 10 pm",
        liste: ["No smoking, including on the balcony.", "No parties or events.", "Quiet after 10 pm: the walls in old Strasbourg are thin.", "No pets.", "4 guests maximum."]
      },
      {
        titre: "Getting around", resume: "Tram 4 min away, bikes, station",
        texte: "The centre is easy to explore on foot. To go further, the tram and bikes are the most practical.",
        liste: ["Trams A and D, Alt Winmärik stop: 4-minute walk.", "Main station: 12-minute walk.", "Vélhop bike hire: station 3 minutes away."],
        astuce: "Buy tickets on the CTS app or from the machines at the stops."
      },
      { titre: "Linen and baby equipment", resume: "Sheets, towels, travel cot", texte: "Sheets and towels are provided: one large and one small towel per person. A travel cot and a high chair are in the hall cupboard." }
    ],
    services: [
      { titre: "Late check-out until 2 pm", prix: "€20", description: "Enjoy the apartment a few more hours, subject to availability." },
      { titre: "Early check-in from 1 pm", prix: "€20", description: "Drop your bags and start exploring sooner." },
      { titre: "Alsatian breakfast basket", prix: "€18 for 2", description: "Kougelhopf, pretzels, jam and coffee, left for you before you arrive." },
      { titre: "Mid-stay cleaning", prix: "€35", description: "For stays of more than 4 nights: cleaning and fresh linen." }
    ],
    adresses: [
      { distance: "3-min walk", horaires: "Tue–Sun 7 am–7 pm", note: "Warm pretzels from 7 am and kougelhopf on Sundays." },
      { distance: "4-min walk", horaires: "Daily 8 am–10 pm", note: "For evening shopping and essentials." },
      { distance: "10-min walk", horaires: "Mon–Sat 8.30 am–8 pm", note: "The widest choice in the city centre." },
      { distance: "5-min walk", horaires: "Mon–Sat 8.30 am–7.30 pm", note: "For the on-duty pharmacy at night and on Sundays, call 3237." },
      { distance: "8-min walk", horaires: "By appointment", note: "General practitioners; online same-day appointments are often available." },
      { distance: "4-min walk", horaires: "Wed–Sun lunch and dinner", note: "Sauerkraut, baeckeoffe and tarte flambée. Booking recommended." },
      { distance: "2-min walk", horaires: "Daily 9 am–6 pm", note: "Weekend brunch and a terrace by the water." },
      { distance: "6-min walk", horaires: "Tue–Sat 11 am–8 pm", note: "Alsace wines and crémant, tastings on Saturdays." },
      { distance: "4-min walk", horaires: "Lines A and D", note: "Direct to the station and the centre." },
      { distance: "On the outskirts", horaires: "Daily", note: "The cheapest way to come by car." }
    ],
    activites: [
      { titre: "Cathedral and astronomical clock", distance: "15-min walk", duree: "1 h 30", description: "Climb the 332 steps to the platform for the view over the rooftops. At 12.30 pm, the figures of the astronomical clock come to life." },
      { titre: "Vauban Dam", distance: "5-min walk", duree: "30 min", description: "Its free rooftop terrace offers the best view of the Ponts Couverts and Petite France." },
      { titre: "Boat tour on the Ill", distance: "12-min walk", duree: "About 1 h", description: "A boat trip around the Grande Île with an audio guide. Perfect on your first day to get your bearings." },
      { titre: "Orangerie Park", distance: "25 min by tram", duree: "2 h", description: "Storks, a lake, rowing boats and a small farm: children love it." },
      { titre: "The Neustadt district", distance: "20-min walk", duree: "1 h 30", description: "The German imperial quarter, a UNESCO World Heritage site along with the Grande Île. Wide boulevards, palaces and Art Nouveau facades." },
      { titre: "Colmar and the Wine Route", distance: "About 30 min by train", duree: "A full day", description: "Colmar by train, then Riquewihr and Eguisheim by car for wine cellars and flower-filled villages." }
    ],
    depart: [
      "Start the dishwasher",
      "Take the bins down to the courtyard",
      "Close the windows and turn the radiators down to 2",
      "Leave used towels in the bath",
      "Put the keys back in the box and scramble the code"
    ],
    urgences: { hopital: { detail: "University hospital · 15 min by tram" } },
    avis: "Enjoyed your stay? A few words on the booking platform help us a lot. Thank you!"
  }
};

/* ============ 2. Hôtel — Annecy ============ */
window.CDH_LIVRETS["hotel-les-ondines"] = {
  id: "hotel-les-ondines",
  demo: true,
  credits: "Photos d'illustration : Unsplash",
  type: "hotel",
  nom: "Hôtel Les Ondines",
  sousTitre: "Hôtel ★★★ · 32 chambres au bord du lac",
  ville: "Annecy · Haute-Savoie",
  carte: "Annecy lac",
  adresse: "Bord du lac, 74000 Annecy",
  geo: [45.9045, 6.1390],
  theme: { accent: "#1D5C7A", police: "Marcellus", motif: "lac", couverture: "photos/hotel-les-ondines/couverture.jpg" },
  titreAccueil: "Bienvenue aux Ondines",
  hote: {
    nom: "La réception",
    signature: "L'équipe des Ondines",
    role: "Réception ouverte 24 h/24",
    tel: "04 65 71 20 20",
    whatsapp: "",
    email: "reception@les-ondines.exemple",
    canal: "email",
    reponse: "Depuis la chambre, composez le 9"
  },
  bienvenue: "Toute l'équipe des Ondines vous souhaite un excellent séjour. Ce livret remplace le classeur de la chambre : horaires, services, et nos conseils pour profiter du lac.",
  annonce: {
    actif: true,
    style: "bonplan",
    texte: "Cette semaine au spa : -15 % sur les soins du lundi au jeudi. Réservation à la réception.",
    fin: ""
  },
  wifi: { reseau: "Ondines-Guest", motDePasse: "lac-annecy-74" },
  horaires: { arrivee: "À partir de 15 h", depart: "Avant 11 h" },
  arrivee: {
    texte: "Nous avons hâte de vous accueillir. La réception est ouverte 24 h/24 : vous pouvez arriver à toute heure.",
    blocs: [
      { icone: "train", titre: "En train", texte: "La gare d'Annecy est à 15 minutes à pied ou 10 minutes en taxi. Prévenez-nous : nous vous réservons un taxi." },
      { icone: "voiture", titre: "En voiture", texte: "L'entrée du parking souterrain est à droite de l'hôtel. Sonnez à l'interphone, la réception vous ouvre." },
      { icone: "lune", titre: "Arrivée tardive", texte: "Après minuit, sonnez à la porte principale : le veilleur de nuit vous accueille et vous remet votre carte." }
    ]
  },
  rubriques: [
    {
      id: "reception", titre: "Réception et services", icone: "cloche",
      resume: "24 h/24, bagagerie, prêts",
      texte: "Notre équipe est présente jour et nuit au rez-de-chaussée. Depuis la chambre, composez le 9.",
      liste: [
        "Bagagerie gratuite le jour de votre arrivée et de votre départ.",
        "Prêt de chargeurs, d'adaptateurs et de parapluies.",
        "Réservation de taxis, de restaurants et d'activités.",
        "Fer et planche à repasser sur demande."
      ]
    },
    {
      id: "petit-dejeuner", titre: "Petit-déjeuner", icone: "petitdej",
      resume: "Buffet de 7 h à 10 h 30",
      texte: "Buffet servi dans la salle panoramique du 1er étage : viennoiseries de notre boulanger, fromages de Savoie, fruits frais et œufs préparés à la minute. 19 € par adulte, 9 € de 4 à 12 ans.",
      liste: [
        "En semaine : 7 h – 10 h 30.",
        "Week-end et jours fériés : 7 h 30 – 11 h.",
        "En chambre : 6 € de supplément, à commander la veille avant 22 h."
      ],
      photos: [
        { src: "photos/hotel-les-ondines/petit-dejeuner.jpg", legende: "Le buffet, dans la salle panoramique" }
      ]
    },
    {
      id: "chambre", titre: "Votre chambre", icone: "lit",
      resume: "Climatisation, coffre-fort, fenêtres",
      texte: "La climatisation se règle entre 18 et 26 °C avec le boîtier près de la porte. Elle se coupe quand une fenêtre est ouverte.",
      etapes: [
        "Coffre-fort : il est dans l'armoire, porte ouverte.",
        "Tapez un code à 4 chiffres de votre choix, puis appuyez sur #.",
        "Fermez la porte : le coffre se verrouille. Pour l'ouvrir, retapez votre code."
      ],
      astuce: "Oreillers à mémoire de forme et couverture supplémentaire sur simple appel à la réception.",
      photos: [
        { src: "photos/hotel-les-ondines/chambre.jpg", legende: "Une chambre Supérieure" }
      ]
    },
    {
      id: "tv", titre: "Télévision", icone: "tv",
      resume: "Chaînes et partage d'écran",
      texte: "Chaînes françaises de 1 à 27, chaînes internationales de 30 à 45 (anglais, allemand, italien, espagnol). Pour afficher votre téléphone, appuyez sur « Source » puis « Partage d'écran »."
    },
    {
      id: "spa", titre: "Spa et piscine", icone: "spa",
      resume: "Niveau -1, de 8 h à 21 h",
      texte: "Piscine intérieure chauffée, sauna et hammam au niveau -1, en accès libre pour les clients de l'hôtel.",
      liste: [
        "Tous les jours de 8 h à 21 h.",
        "Peignoirs et serviettes dans votre chambre.",
        "Enfants de moins de 12 ans accompagnés, jusqu'à 18 h.",
        "Soins et massages sur réservation à la réception."
      ],
      photos: [
        { src: "photos/hotel-les-ondines/spa.jpg", legende: "La piscine intérieure, niveau -1" }
      ]
    },
    {
      id: "restaurant", titre: "Restaurant et bar", icone: "couverts",
      resume: "Cuisine savoyarde, terrasse sur le lac",
      texte: "Le restaurant L'Ondée sert une cuisine savoyarde de saison. Le bar ouvre sur la terrasse face au lac.",
      liste: [
        "Restaurant : 19 h – 22 h, fermé le dimanche soir.",
        "Bar : 16 h – minuit.",
        "Room service : 11 h – 22 h, carte sur la tablette de la chambre."
      ]
    },
    {
      id: "parking", titre: "Parking et recharge", icone: "voiture",
      resume: "Souterrain, bornes électriques",
      texte: "Parking souterrain fermé, accessible avec votre carte de chambre.",
      liste: [
        "18 € par nuit, à régler au départ.",
        "2 bornes de recharge 22 kW, à réserver à la réception.",
        "Local à vélos fermé et gratuit."
      ]
    },
    {
      id: "depart", titre: "Départ", icone: "valise",
      resume: "Avant 11 h, départ tardif possible",
      texte: "Déposez simplement votre carte à la réception avant 11 h.",
      liste: [
        "Facture envoyée par e-mail sur demande.",
        "Vos bagages peuvent rester à la bagagerie jusqu'à votre départ d'Annecy."
      ]
    },
    {
      id: "animaux", titre: "Animaux", icone: "patte",
      resume: "Chiens bienvenus",
      texte: "Les chiens sont les bienvenus (15 € par nuit). Gamelle et coussin fournis sur demande. Merci de ne pas les laisser seuls dans la chambre."
    }
  ],
  services: [
    { icone: "horloge", titre: "Départ tardif jusqu'à 14 h", prix: "25 €", description: "Selon disponibilités, à demander la veille." },
    { icone: "spa", titre: "Massage au spa (50 min)", prix: "85 €", description: "Huiles bio et vue sur le jardin. Réservation 24 h à l'avance." },
    { icone: "vin", titre: "Crémant en chambre", prix: "39 €", description: "Une bouteille de crémant de Savoie bien frais à votre arrivée." },
    { icone: "petitdej", titre: "Petit-déjeuner en chambre", prix: "+ 6 €", description: "À commander la veille avant 22 h." }
  ],
  adresses: [
    { categorie: "pharmacie", nom: "Pharmacie du Lac", distance: "6 min à pied", horaires: "Lun.–sam. 8 h 30–19 h 30", note: "Pharmacie de garde : appelez le 3237.", geo: [45.9021, 6.1336] },
    { categorie: "sante", nom: "Centre hospitalier Annecy Genevois", distance: "15 min en voiture", horaires: "Urgences 24 h/24", note: "Site d'Annecy, à Épagny Metz-Tessy.", requete: "Centre Hospitalier Annecy Genevois" },
    { categorie: "boulangerie", nom: "Le Fournil des Aravis", distance: "4 min à pied", horaires: "Tous les jours 6 h 30–19 h 30", note: "Pain au levain et tartes aux myrtilles.", geo: [45.9036, 6.1343] },
    { categorie: "courses", nom: "Fromagerie Le Reblochon d'Or", distance: "8 min à pied", horaires: "Mar.–dim. 9 h–19 h", note: "Fromages de Savoie mis sous vide pour le voyage.", geo: [45.8996, 6.1291] },
    { categorie: "restaurant", nom: "Le Chalet du Vieil Annecy", distance: "10 min à pied", horaires: "Tous les soirs", note: "Fondue, raclette et tartiflette. Réservez en saison.", geo: [45.8984, 6.1254] },
    { categorie: "restaurant", nom: "Brasserie du Thiou", distance: "9 min à pied", horaires: "Tous les jours 12 h–23 h", note: "Poissons du lac et grande terrasse sur le canal.", geo: [45.8991, 6.1271] },
    { categorie: "services", nom: "Location de vélos et pédalos", distance: "3 min à pied", horaires: "Avril à octobre", note: "Au bord du lac, à côté du ponton.", geo: [45.9031, 6.1406] },
    { categorie: "transport", nom: "Gare d'Annecy", distance: "15 min à pied", horaires: "TGV et TER", note: "Taxi depuis l'hôtel : environ 10 minutes.", requete: "Gare d'Annecy", geo: [45.9020, 6.1220] }
  ],
  activites: [
    { photo: "photos/hotel-les-ondines/vieille-ville.jpg", categorie: "culture", titre: "Vieille ville et Palais de l'Isle", distance: "10 min à pied", duree: "2 h", description: "Canaux, ruelles à arcades et l'ancienne prison du XIIe siècle posée au milieu du Thiou.", requete: "Palais de l'Isle Annecy", geo: [45.8986, 6.1264] },
    { photo: "photos/hotel-les-ondines/velo.jpg", categorie: "balade", titre: "Le lac à vélo", distance: "Départ de l'hôtel", duree: "Une demi-journée", description: "La voie verte longe la rive ouest jusqu'à Doussard, presque à plat. Pique-nique possible sur les plages en chemin.", requete: "Voie verte du lac d'Annecy", geo: [45.8655, 6.1440] },
    { photo: "photos/hotel-les-ondines/croisiere.jpg", categorie: "sortie", titre: "Croisière sur le lac", distance: "12 min à pied", duree: "Environ 1 h", description: "Tour du lac commenté au départ du quai Napoléon III, avec vue sur les châteaux et les montagnes.", requete: "Quai Napoléon III Annecy bateaux", geo: [45.9002, 6.1310] },
    { photo: "photos/hotel-les-ondines/baignade.jpg", categorie: "nature", titre: "Baignade au lac", distance: "5 à 15 min à pied", duree: "Juin à septembre", description: "Plages de l'Impérial et d'Albigny, dans l'une des eaux de lac les plus claires d'Europe.", requete: "Plage d'Albigny Annecy", geo: [45.9090, 6.1500] },
    { photo: "photos/hotel-les-ondines/semnoz.jpg", categorie: "nature", titre: "Le Semnoz", distance: "35 min en voiture", duree: "Une demi-journée", description: "La montagne d'Annecy : randonnées l'été, luge et ski de fond l'hiver. Vue sur le Mont-Blanc depuis le Crêt de Châtillon.", requete: "Crêt de Châtillon Semnoz", geo: [45.7930, 6.0980] },
    { photo: "photos/hotel-les-ondines/gorges-du-fier.jpg", categorie: "famille", titre: "Gorges du Fier", distance: "20 min en voiture", duree: "1 h", description: "Des passerelles accrochées à la paroi au-dessus de la rivière. Spectaculaire et accessible aux enfants.", requete: "Gorges du Fier", geo: [45.9188, 6.0560] },
    { photo: "photos/hotel-les-ondines/marche.jpg", categorie: "gastronomie", titre: "Marché de la vieille ville", distance: "10 min à pied", duree: "Le matin", description: "Fromages, charcuteries et produits des alpages dans les rues piétonnes.", requete: "Marché vieille ville Annecy", geo: [45.8988, 6.1240] }
  ],
  depart: [
    "Vérifier le coffre-fort",
    "Rendre la carte de chambre à la réception",
    "Régler le parking et les extras",
    "Récupérer vos bagages à la bagagerie"
  ],
  urgences: {
    hopital: { nom: "Centre hospitalier Annecy Genevois", detail: "Urgences 24 h/24 · 15 min en voiture", requete: "Centre Hospitalier Annecy Genevois", geo: [45.9407, 6.0937] },
    antipoison: "04 72 11 69 11"
  },
  avis: "Merci d'avoir séjourné aux Ondines. Votre avis nous aide à progresser.",
  avisLien: "demo",

  en: {
    sousTitre: "★★★ hotel · 32 rooms on the lakeside",
    titreAccueil: "Welcome to Les Ondines",
    bienvenue: "The whole Ondines team wishes you a wonderful stay. This guide replaces the folder in your room: opening hours, services and our tips for enjoying the lake.",
    hote: { nom: "Reception", signature: "The Ondines team", role: "Reception open 24/7", reponse: "From your room, dial 9" },
    annonce: { texte: "This week at the spa: 15% off treatments from Monday to Thursday. Book at reception." },
    horaires: { arrivee: "From 3 pm", depart: "Before 11 am" },
    adresse: "Lakeside, 74000 Annecy",
    arrivee: {
      texte: "We look forward to welcoming you. Reception is open 24/7, so you can arrive at any time.",
      blocs: [
        { titre: "By train", texte: "Annecy station is a 15-minute walk or a 10-minute taxi ride away. Let us know and we'll book a taxi for you." },
        { titre: "By car", texte: "The underground car park entrance is on the right of the hotel. Ring the intercom and reception will open the gate." },
        { titre: "Late arrival", texte: "After midnight, ring at the main door: the night porter will welcome you and give you your key card." }
      ]
    },
    rubriques: [
      { titre: "Reception and services", resume: "24/7, luggage room, loans", texte: "Our team is on the ground floor day and night. From your room, dial 9.", liste: ["Free luggage storage on your arrival and departure days.", "Chargers, adapters and umbrellas to borrow.", "Taxi, restaurant and activity bookings.", "Iron and ironing board on request."] },
      {
        titre: "Breakfast", resume: "Buffet from 7 to 10.30 am",
        texte: "Buffet served in the panoramic room on the 1st floor: pastries from our baker, Savoy cheeses, fresh fruit and eggs cooked to order. €19 per adult, €9 for ages 4 to 12.",
        liste: ["Weekdays: 7 – 10.30 am.", "Weekends and bank holidays: 7.30 – 11 am.", "In your room: €6 extra, to order the night before by 10 pm."],
        photos: [{ legende: "The buffet, in the panoramic room" }]
      },
      {
        titre: "Your room", resume: "Air conditioning, safe, windows",
        texte: "Set the air conditioning between 18 and 26 °C with the panel by the door. It switches off when a window is open.",
        etapes: ["The safe is in the wardrobe, with its door open.", "Enter a 4-digit code of your choice, then press #.", "Close the door: the safe locks. To open it, enter your code again."],
        astuce: "Memory-foam pillows and an extra blanket are just a call to reception away.",
        photos: [{ legende: "A Superior room" }]
      },
      { titre: "Television", resume: "Channels and screen sharing", texte: "French channels 1 to 27, international channels 30 to 45 (English, German, Italian, Spanish). To show your phone on screen, press “Source” then “Screen sharing”." },
      {
        titre: "Spa and pool", resume: "Level -1, 8 am to 9 pm",
        texte: "Heated indoor pool, sauna and hammam on level -1, free for hotel guests.",
        liste: ["Daily from 8 am to 9 pm.", "Bathrobes and towels in your room.", "Children under 12 must be accompanied, until 6 pm.", "Treatments and massages bookable at reception."],
        photos: [{ legende: "The indoor pool, level -1" }]
      },
      { titre: "Restaurant and bar", resume: "Savoy cuisine, lakeside terrace", texte: "L'Ondée restaurant serves seasonal Savoy cuisine. The bar opens onto the terrace facing the lake.", liste: ["Restaurant: 7 – 10 pm, closed Sunday evening.", "Bar: 4 pm – midnight.", "Room service: 11 am – 10 pm, menu on the tablet in your room."] },
      { titre: "Parking and charging", resume: "Underground, EV chargers", texte: "Secure underground car park, opened with your room card.", liste: ["€18 per night, paid on departure.", "2 x 22 kW EV chargers, bookable at reception.", "Free, locked bike storage."] },
      { titre: "Check-out", resume: "Before 11 am, late check-out possible", texte: "Simply leave your key card at reception before 11 am.", liste: ["Invoice sent by email on request.", "Your luggage can stay in the luggage room until you leave Annecy."] },
      { titre: "Pets", resume: "Dogs welcome", texte: "Dogs are welcome (€15 per night). Bowl and cushion available on request. Please do not leave them alone in the room." }
    ],
    services: [
      { titre: "Late check-out until 2 pm", prix: "€25", description: "Subject to availability, ask the day before." },
      { titre: "Spa massage (50 min)", prix: "€85", description: "Organic oils and a view of the garden. Book 24 hours ahead." },
      { titre: "Crémant in your room", prix: "€39", description: "A bottle of chilled Savoy crémant waiting for you on arrival." },
      { titre: "Breakfast in your room", prix: "+ €6", description: "Order the night before by 10 pm." }
    ],
    adresses: [
      { distance: "6-min walk", horaires: "Mon–Sat 8.30 am–7.30 pm", note: "For the on-duty pharmacy, call 3237." },
      { distance: "15 min by car", horaires: "Emergency 24/7", note: "Annecy site, in Épagny Metz-Tessy." },
      { distance: "4-min walk", horaires: "Daily 6.30 am–7.30 pm", note: "Sourdough bread and blueberry tarts." },
      { distance: "8-min walk", horaires: "Tue–Sun 9 am–7 pm", note: "Savoy cheeses vacuum-packed for your trip home." },
      { distance: "10-min walk", horaires: "Every evening", note: "Fondue, raclette and tartiflette. Book in high season." },
      { distance: "9-min walk", horaires: "Daily 12 noon–11 pm", note: "Lake fish and a large terrace on the canal." },
      { distance: "3-min walk", horaires: "April to October", note: "On the lakeside, next to the pontoon." },
      { distance: "15-min walk", horaires: "TGV and regional trains", note: "Taxi from the hotel: about 10 minutes." }
    ],
    activites: [
      { titre: "Old town and Palais de l'Isle", distance: "10-min walk", duree: "2 h", description: "Canals, arcaded lanes and the 12th-century former prison sitting in the middle of the Thiou." },
      { titre: "The lake by bike", distance: "From the hotel", duree: "Half a day", description: "The cycle path runs along the west shore to Doussard, almost flat. Picnic on the beaches along the way." },
      { titre: "Lake cruise", distance: "12-min walk", duree: "About 1 h", description: "A guided cruise from Quai Napoléon III, with views of the castles and mountains." },
      { titre: "Swimming in the lake", distance: "5 to 15-min walk", duree: "June to September", description: "Impérial and Albigny beaches, in one of the clearest lakes in Europe." },
      { titre: "The Semnoz", distance: "35 min by car", duree: "Half a day", description: "Annecy's mountain: hiking in summer, sledging and cross-country skiing in winter. View of Mont Blanc from the Crêt de Châtillon." },
      { titre: "Gorges du Fier", distance: "20 min by car", duree: "1 h", description: "Walkways clinging to the rock face above the river. Spectacular and suitable for children." },
      { titre: "Old town market", distance: "10-min walk", duree: "Mornings", description: "Cheeses, cured meats and mountain produce in the pedestrian streets." }
    ],
    depart: ["Check the safe", "Return your key card to reception", "Pay for parking and extras", "Collect your luggage from the luggage room"],
    urgences: { hopital: { detail: "Emergency 24/7 · 15 min by car" } },
    avis: "Thank you for staying at Les Ondines. Your review helps us improve."
  }
};

/* ============ 3. Maison d'hôtes — Luberon ============ */
window.CDH_LIVRETS["bastide-aux-amandiers"] = {
  id: "bastide-aux-amandiers",
  demo: true,
  credits: "Photos d'illustration : Unsplash",
  type: "maison",
  nom: "La Bastide aux Amandiers",
  sousTitre: "Chambres d'hôtes · 5 chambres et table d'hôtes",
  ville: "Bonnieux · Luberon",
  carte: "Bonnieux, Luberon",
  adresse: "Route de Lourmarin, 84480 Bonnieux",
  geo: [43.8195, 5.3075],
  theme: { accent: "#56632A", police: "Young Serif", motif: "collines", couverture: "photos/bastide-aux-amandiers/couverture.jpg" },
  titreAccueil: "Bienvenue à la Bastide",
  hote: {
    nom: "Sophie & Marc",
    role: "Vos hôtes",
    tel: "06 39 98 55 12",
    whatsapp: "33639985512",
    email: "bonjour@bastide-amandiers.exemple",
    reponse: "Nous habitons l'aile est de la maison"
  },
  bienvenue: "Bienvenue à la Bastide ! Installez-vous et prenez le temps. Nous vivons dans l'aile est de la maison : n'hésitez jamais à frapper ou à nous appeler.",
  annonce: {
    actif: true,
    style: "bonplan",
    texte: "Samedi soir : dîner aux chandelles au bord de la piscine. Inscription avant vendredi midi.",
    fin: ""
  },
  wifi: { reseau: "Bastide-Amandiers", motDePasse: "cigale-du-luberon" },
  horaires: { arrivee: "De 16 h à 19 h", depart: "Avant 10 h 30" },
  arrivee: {
    texte: "La Bastide est un peu à l'écart du village, au calme. Voici comment nous trouver.",
    blocs: [
      { icone: "train", titre: "En train", texte: "La gare TGV d'Avignon est à 50 minutes. Nous pouvons vous conseiller un taxi ou une agence de location de voitures." },
      { icone: "voiture", titre: "En voiture", texte: "Depuis Bonnieux, prenez la route de Lourmarin sur 2 km, puis le chemin de terre à droite après le panneau « La Bastide aux Amandiers ». Roulez doucement !" },
      { icone: "cle", titre: "À votre arrivée", texte: "Le portail s'ouvre avec le code 1987#. Garez-vous sous les platanes : nous venons vous accueillir. Si vous arrivez après 19 h, prévenez-nous." }
    ]
  },
  rubriques: [
    {
      id: "petit-dejeuner", titre: "Petit-déjeuner", icone: "petitdej",
      resume: "De 8 h à 10 h, sous le tilleul",
      texte: "Servi sur la terrasse sous le tilleul, ou dans la salle voûtée quand le mistral souffle : confitures maison, miel du Luberon, fougasse, yaourts de la chèvrerie voisine et fruits du verger.",
      liste: [
        "De 8 h à 10 h.",
        "Prévenez-nous la veille de vos allergies ou de vos envies.",
        "Panier pique-nique sur demande : 15 € par personne."
      ],
      photos: [
        { src: "photos/bastide-aux-amandiers/petit-dejeuner.jpg", legende: "Le petit-déjeuner sous le tilleul" }
      ]
    },
    {
      id: "table-hotes", titre: "Table d'hôtes", icone: "couverts",
      resume: "Mardi, jeudi et samedi à 20 h",
      texte: "Marc cuisine les produits du marché, servis en menu unique à la grande table avec les autres hôtes.",
      liste: [
        "Mardi, jeudi et samedi à 20 h.",
        "35 € par adulte, vin du domaine et café compris.",
        "Réservation la veille avant 18 h."
      ],
      photos: [
        { src: "photos/bastide-aux-amandiers/table-hotes.jpg", legende: "La grande table, dressée dans le jardin" }
      ]
    },
    {
      id: "piscine", titre: "Piscine", icone: "piscine",
      resume: "De 9 h à 20 h, non surveillée",
      texte: "Piscine au sel de 12 × 5 m, chauffée de mai à septembre.",
      liste: [
        "Ouverte de 9 h à 20 h.",
        "Pas de verre au bord de l'eau.",
        "Piscine non surveillée : les enfants restent sous la responsabilité de leurs parents.",
        "Serviettes de piscine dans le panier en osier de votre chambre."
      ],
      photos: [
        { src: "photos/bastide-aux-amandiers/piscine.jpg", legende: "La piscine au sel" }
      ]
    },
    {
      id: "chambre", titre: "Votre chambre", icone: "lit",
      resume: "Climatisation, volets, ménage",
      texte: "Chaque chambre porte le nom d'une plante de la garrigue. Climatisation silencieuse, moustiquaires aux fenêtres, ménage tous les deux jours.",
      liste: [
        "Serviettes à changer : laissez-les au sol de la salle de bain.",
        "L'été, fermez les volets en journée : la maison reste fraîche naturellement.",
        "Coffre-fort dans l'armoire."
      ]
    },
    {
      id: "eau", titre: "L'eau, une ressource précieuse", icone: "eau",
      resume: "Douches courtes en été",
      texte: "En été, le Luberon manque souvent d'eau. Merci de privilégier les douches courtes et de nous signaler la moindre fuite."
    },
    {
      id: "animaux", titre: "Pistou et Lavande", icone: "patte",
      resume: "Le chat et la chienne de la maison",
      texte: "Pistou, notre chat, et Lavande, notre vieille labrador, vivent avec nous. Ils sont très doux mais n'ont pas le droit d'entrer dans les chambres : merci de garder vos portes fermées."
    },
    {
      id: "calme", titre: "Calme et voisinage", icone: "lune",
      resume: "Silence après 22 h 30",
      texte: "La Bastide est un lieu de repos. Le silence est de mise après 22 h 30 autour de la piscine et dans le jardin."
    },
    {
      id: "linge", titre: "Lave-linge", icone: "lavelinge",
      resume: "Buanderie, 5 € la machine",
      texte: "Un lave-linge est à votre disposition dans la buanderie, à côté du cellier : 5 € la machine, lessive comprise. L'étendoir est dans le jardin, côté potager."
    }
  ],
  services: [
    { icone: "couverts", titre: "Dîner à la table d'hôtes", prix: "35 € / pers.", description: "Mardi, jeudi et samedi à 20 h, vin du domaine compris." },
    { icone: "panier", titre: "Panier pique-nique", prix: "15 € / pers.", description: "Pour vos balades : sandwichs maison, fruits du verger et boissons." },
    { icone: "velo", titre: "Vélos électriques livrés", prix: "30 € / jour", description: "Livrés à la Bastide le matin, récupérés le soir." },
    { icone: "feuille", titre: "Atelier cuisine provençale", prix: "45 € / pers.", description: "Deux heures avec Marc pour préparer tapenade, pistou et tian." }
  ],
  adresses: [
    { categorie: "boulangerie", nom: "Boulangerie du Vieux Four", distance: "5 min en voiture", horaires: "Fermée le mercredi", note: "Fougasse aux olives et pain de campagne.", geo: [43.8255, 5.3087] },
    { categorie: "courses", nom: "Épicerie du village", distance: "4 min en voiture", horaires: "Tous les jours 8 h–12 h 30 et 16 h–19 h", note: "Pour l'essentiel, avec un rayon de produits locaux.", geo: [43.8248, 5.3079] },
    { categorie: "courses", nom: "Supermarchés d'Apt", distance: "20 min en voiture", horaires: "Lun.–sam.", note: "Grandes surfaces pour les courses de la semaine.", requete: "Supermarché Apt", geo: [43.8745, 5.3870] },
    { categorie: "marche", nom: "Marché d'Apt", distance: "20 min en voiture", horaires: "Samedi matin", note: "L'un des plus grands marchés provençaux.", requete: "Marché d'Apt", geo: [43.8762, 5.3961] },
    { categorie: "pharmacie", nom: "Pharmacie du Luberon", distance: "5 min en voiture", horaires: "Lun.–sam. 9 h–12 h 30 et 15 h–19 h", note: "Pharmacie de garde : appelez le 3237.", geo: [43.8252, 5.3070] },
    { categorie: "sante", nom: "Centre hospitalier du Pays d'Apt", distance: "20 min en voiture", horaires: "Urgences 24 h/24", note: "L'hôpital le plus proche.", requete: "Centre hospitalier du Pays d'Apt" },
    { categorie: "restaurant", nom: "Le Mas des Cigales", distance: "6 min en voiture", horaires: "Fermé le lundi", note: "Cuisine provençale, terrasse face à la vallée. Réservation indispensable l'été.", geo: [43.8228, 5.2995] },
    { categorie: "bar", nom: "Domaine de la Combe", distance: "10 min en voiture", horaires: "Sur rendez-vous", note: "Dégustation de vins AOP Luberon chez un vigneron ami.", geo: [43.8125, 5.2930] }
  ],
  activites: [
    { photo: "photos/bastide-aux-amandiers/lourmarin.jpg", categorie: "gastronomie", titre: "Marché de Lourmarin", distance: "15 min en voiture", duree: "Vendredi matin", description: "Au pied du château, l'un des marchés les plus agréables du Luberon. Arrivez avant 10 h pour vous garer.", requete: "Lourmarin", geo: [43.7640, 5.3620] },
    { photo: "photos/bastide-aux-amandiers/ocres.jpg", categorie: "nature", titre: "Sentier des Ocres à Roussillon", distance: "25 min en voiture", duree: "30 à 50 min de boucle", description: "Falaises du jaune au rouge vif. Évitez les chaussures blanches !", requete: "Sentier des Ocres Roussillon", geo: [43.9015, 5.2930] },
    { photo: "photos/bastide-aux-amandiers/senanque.jpg", categorie: "culture", titre: "Gordes et l'abbaye de Sénanque", distance: "30 min en voiture", duree: "Une demi-journée", description: "Le village perché, puis l'abbaye entourée de lavande. Floraison de fin juin à mi-juillet.", requete: "Abbaye de Sénanque", geo: [43.9282, 5.1872] },
    { photo: "photos/bastide-aux-amandiers/pont-julien.jpg", categorie: "culture", titre: "Le pont Julien", distance: "10 min en voiture", duree: "30 min", description: "Un pont romain vieux de plus de 2 000 ans, toujours debout au milieu des vignes.", requete: "Pont Julien Bonnieux", geo: [43.8604, 5.3083] },
    { photo: "photos/bastide-aux-amandiers/cedres.jpg", categorie: "famille", titre: "Forêt des Cèdres", distance: "10 min en voiture", duree: "1 h 30", description: "Balade ombragée sur les crêtes du Petit Luberon, parfaite les jours de grosse chaleur.", requete: "Forêt des Cèdres Bonnieux", geo: [43.8080, 5.3150] },
    { photo: "photos/bastide-aux-amandiers/colorado.jpg", categorie: "nature", titre: "Le Colorado provençal", distance: "35 min en voiture", duree: "2 h", description: "D'anciennes carrières d'ocre aux allures de canyon, à Rustrel.", requete: "Colorado provençal Rustrel", geo: [43.9180, 5.4810] }
  ],
  depart: [
    "Laisser la clé sur la porte de la chambre",
    "Fermer la climatisation et les fenêtres",
    "Régler la table d'hôtes et les extras",
    "Nous dire au revoir !"
  ],
  urgences: {
    hopital: { nom: "Centre hospitalier du Pays d'Apt", detail: "Urgences · 20 min en voiture", requete: "Centre hospitalier du Pays d'Apt", geo: [43.8706, 5.3889] },
    antipoison: "04 91 75 25 25"
  },
  avis: "Vous avez aimé la Bastide ? Un mot dans notre livre d'or, ou un avis en ligne, nous fait toujours très plaisir.",
  avisLien: "demo",

  en: {
    sousTitre: "B&B · 5 rooms and table d'hôtes dinners",
    titreAccueil: "Welcome to the Bastide",
    bienvenue: "Welcome to the Bastide! Settle in and take your time. We live in the east wing of the house: never hesitate to knock or call us.",
    hote: { role: "Your hosts", reponse: "We live in the east wing of the house" },
    annonce: { texte: "Saturday evening: candlelit dinner by the pool. Sign up by Friday noon." },
    horaires: { arrivee: "4 to 7 pm", depart: "Before 10.30 am" },
    arrivee: {
      texte: "The Bastide is a little way out of the village, in a quiet spot. Here's how to find us.",
      blocs: [
        { titre: "By train", texte: "Avignon TGV station is 50 minutes away. We can recommend a taxi or a car hire company." },
        { titre: "By car", texte: "From Bonnieux, take the road to Lourmarin for 2 km, then the dirt track on the right after the “La Bastide aux Amandiers” sign. Drive slowly!" },
        { titre: "When you arrive", texte: "The gate opens with code 1987#. Park under the plane trees and we'll come and greet you. If you're arriving after 7 pm, let us know." }
      ]
    },
    rubriques: [
      { titre: "Breakfast", resume: "8 to 10 am, under the lime tree", texte: "Served on the terrace under the lime tree, or in the vaulted room when the mistral blows: homemade jams, Luberon honey, fougasse, yoghurts from the neighbouring goat farm and fruit from the orchard.", liste: ["From 8 to 10 am.", "Tell us the day before about any allergies or wishes.", "Picnic basket on request: €15 per person."], photos: [{ legende: "Breakfast under the lime tree" }] },
      { titre: "Table d'hôtes dinners", resume: "Tuesday, Thursday and Saturday at 8 pm", texte: "Marc cooks with produce from the market, served as a set menu at the big table with the other guests.", liste: ["Tuesday, Thursday and Saturday at 8 pm.", "€35 per adult, estate wine and coffee included.", "Book the day before by 6 pm."], photos: [{ legende: "The big table, laid in the garden" }] },
      { titre: "Swimming pool", resume: "9 am to 8 pm, unsupervised", texte: "12 × 5 m salt-water pool, heated from May to September.", liste: ["Open from 9 am to 8 pm.", "No glass by the pool.", "The pool is unsupervised: children remain their parents' responsibility.", "Pool towels are in the wicker basket in your room."], photos: [{ legende: "The salt-water pool" }] },
      { titre: "Your room", resume: "Air conditioning, shutters, cleaning", texte: "Each room is named after a garrigue plant. Quiet air conditioning, mosquito screens on the windows, cleaning every other day.", liste: ["Towels to change: leave them on the bathroom floor.", "In summer, close the shutters during the day: the house stays cool naturally.", "Safe in the wardrobe."] },
      { titre: "Water is precious", resume: "Short showers in summer", texte: "In summer, the Luberon is often short of water. Please keep showers short and tell us about any leak." },
      { titre: "Pistou and Lavande", resume: "The house cat and dog", texte: "Pistou, our cat, and Lavande, our old Labrador, live with us. They are very gentle but not allowed in the rooms: please keep your doors closed." },
      { titre: "Peace and quiet", resume: "Silence after 10.30 pm", texte: "The Bastide is a place to rest. Please keep quiet after 10.30 pm around the pool and in the garden." },
      { titre: "Washing machine", resume: "Laundry room, €5 per load", texte: "A washing machine is available in the laundry room, next to the cellar: €5 per load, detergent included. The drying rack is in the garden, by the vegetable patch." }
    ],
    services: [
      { titre: "Table d'hôtes dinner", prix: "€35 / person", description: "Tuesday, Thursday and Saturday at 8 pm, estate wine included." },
      { titre: "Picnic basket", prix: "€15 / person", description: "For your walks: homemade sandwiches, orchard fruit and drinks." },
      { titre: "E-bikes delivered", prix: "€30 / day", description: "Delivered to the Bastide in the morning, collected in the evening." },
      { titre: "Provençal cooking class", prix: "€45 / person", description: "Two hours with Marc making tapenade, pistou and tian." }
    ],
    adresses: [
      { distance: "5 min by car", horaires: "Closed on Wednesdays", note: "Olive fougasse and country bread." },
      { distance: "4 min by car", horaires: "Daily 8 am–12.30 pm and 4–7 pm", note: "The essentials, plus local produce." },
      { distance: "20 min by car", horaires: "Mon–Sat", note: "Large supermarkets for the weekly shop." },
      { distance: "20 min by car", horaires: "Saturday morning", note: "One of the biggest markets in Provence." },
      { distance: "5 min by car", horaires: "Mon–Sat 9 am–12.30 pm and 3–7 pm", note: "For the on-duty pharmacy, call 3237." },
      { distance: "20 min by car", horaires: "Emergency 24/7", note: "The nearest hospital." },
      { distance: "6 min by car", horaires: "Closed on Mondays", note: "Provençal cooking, terrace overlooking the valley. Booking essential in summer." },
      { distance: "10 min by car", horaires: "By appointment", note: "AOP Luberon wine tasting with a winemaker friend." }
    ],
    activites: [
      { titre: "Lourmarin market", distance: "15 min by car", duree: "Friday morning", description: "At the foot of the château, one of the loveliest markets in the Luberon. Arrive before 10 am to find parking." },
      { titre: "Ochre trail in Roussillon", distance: "25 min by car", duree: "30 to 50-min loop", description: "Cliffs from yellow to bright red. Avoid white shoes!" },
      { titre: "Gordes and Sénanque Abbey", distance: "30 min by car", duree: "Half a day", description: "The hilltop village, then the abbey surrounded by lavender. In bloom from late June to mid-July." },
      { titre: "Pont Julien", distance: "10 min by car", duree: "30 min", description: "A Roman bridge over 2,000 years old, still standing among the vineyards." },
      { titre: "Cedar Forest", distance: "10 min by car", duree: "1 h 30", description: "A shady walk along the ridges of the Petit Luberon, perfect on very hot days." },
      { titre: "The Provençal Colorado", distance: "35 min by car", duree: "2 h", description: "Former ochre quarries that look like a canyon, in Rustrel." }
    ],
    depart: ["Leave the key in your room door", "Turn off the air conditioning and close the windows", "Settle the table d'hôtes and extras", "Come and say goodbye!"],
    urgences: { hopital: { detail: "Emergency · 20 min by car" } },
    avis: "Did you enjoy the Bastide? A note in our guest book, or an online review, always makes our day."
  }
};
