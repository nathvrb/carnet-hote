# Carnet d'Hôte — site vitrine + livrets d'accueil

Site statique (HTML, CSS, JavaScript sans framework) : il s'ouvre en double-cliquant sur `index.html` et se met en ligne tel quel sur GitHub Pages (ou Netlify).

## Les pages

| Fichier | Rôle |
|---|---|
| `index.html` | Vitrine : présentation, 3 exemples, offres, devis automatique, console, FAQ, contact |
| `livret.html` | Le livret lu par les voyageurs (`livret.html#identifiant`), en français et en anglais, toujours en thème clair |
| `console.html` | Console d'édition : bouton FR / EN, avant l'arrivée, rubriques, services en plus, adresses (GPS), activités, avis, QR code et affiche A6 |
| `sw.js` | Lecture hors connexion du livret (à garder à la racine du site) |
| `404.html` | Sur GitHub Pages : renvoie les adresses courtes `/l/identifiant` (et `/l/identifiant/arrivee`) vers le livret |
| `_redirects` | La même chose sur Netlify |
| `.nojekyll` | Indique à GitHub Pages de publier les fichiers tels quels |

## Ce que vous modifierez le plus souvent

- **Nom de la marque, e-mail, téléphone, SIRET, mentions du devis** → `assets/js/config.js`
- **Prix, formules, forfaits, options, supports** → `assets/js/tarifs.js` (la page Offres et le devis se mettent à jour tout seuls)
- **Livrets publiés** → `data/livrets.js`

## Ajouter le livret d'un client

1. Ouvrez `console.html`, menu du haut : « + Créer un nouveau livret ».
2. Remplissez les onglets ; l'aperçu à droite se met à jour en direct.
3. Onglet **Sauvegarde** → **Copier**, puis collez le texte à la fin de `data/livrets.js`.
4. Remettez le site en ligne. Le livret est accessible à `https://votre-domaine/l/identifiant`.
5. Onglet **QR code et affiche** : téléchargez le QR code (PNG) et l'affiche A6 à imprimer.
6. Onglet **Avant l'arrivée** : copiez le message prêt à envoyer la veille dans la messagerie Airbnb / Booking.

### Version anglaise
Bouton **FR / EN** en haut de la console : en EN, chaque champ montre le texte français en gris et vous tapez la traduction. Un champ laissé vide reste en français. Ajouts, suppressions, ordre et photos se font en FR ; la traduction suit. Le bouton FR / EN apparaît sur le livret dès qu'un texte anglais existe.

### Carte et météo
Renseignez les coordonnées GPS (« 48.5806, 7.7420 ») du logement, des adresses et des activités : clic droit dans Google Maps, puis clic sur les chiffres pour les copier. Sans coordonnées, pas de carte ni de météo, le reste du livret fonctionne. Carte : fond clair OpenFreeMap (gratuit, usage commercial autorisé, sans clé ni compte), affiché par MapLibre dans Leaflet (`assets/vendor/`). Couleurs du fond : `MAP_PAINT` dans `assets/js/livret.js`. Sans WebGL, repli automatique sur les tuiles OpenStreetMap. Météo : MET Norway, gratuite, mention « Données : MET Norway » obligatoire (déjà affichée).

Retirez la ligne `demo: true` des livrets de vrais clients (elle affiche le bandeau « Exemple fictif »).

## Photos

- Les photos se rangent dans `photos/<identifiant-du-livret>/` et se déclarent dans le livret (console ou `data/livrets.js`) : couverture, photos des rubriques (modes d'emploi) et photo de chaque activité.
- Une photo absente est remplacée par une illustration aux couleurs du livret : rien ne s'affiche cassé.
- Les photos des 3 exemples (libres de droits, Unsplash) sont rangées dans `photos/`.
- Dans la console, le bouton « Importer » ajoute une photo depuis l'ordinateur (réduite automatiquement). Pratique pour un essai ; pour le site en ligne, préférez des fichiers dans `photos/` : le livret reste plus léger.
- Taille conseillée : 1600 px de large maximum, en JPG.

## Mise en ligne sur GitHub Pages

Le site est dans un dépôt GitHub ; chaque modification envoyée sur la branche `main` est en ligne une à deux minutes plus tard, sans rien faire d'autre.

1. Dépôt public (obligatoire pour GitHub Pages avec un compte gratuit). Tout son contenu est lisible : n'y mettez que les livrets d'exemple tant que le site est en préparation.
2. Dans le dépôt : **Settings → Pages → Build and deployment** : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est à l'adresse `https://votre-compte.github.io/nom-du-depot/`.
4. Formulaire de devis : créez un formulaire gratuit sur formspree.io et collez son adresse dans `formulaireDevis` de `config.js`. Sans ça, le visiteur copie son récapitulatif et vous l'envoie par e-mail.
5. Plus tard, nom de domaine : **Settings → Pages → Custom domain**, puis renseignez `domaine: "https://votre-domaine.fr"` dans `config.js`. Faites-le **avant** d'imprimer des QR codes.

### Sur Netlify (si vous y revenez)
Glissez le dossier sur app.netlify.com ou reliez-le au dépôt GitHub (il se met alors à jour à chaque envoi, et le dépôt peut rester privé). Les demandes de devis arrivent dans Netlify → **Forms** si `formulaireDevis` est vide.

Important : une fois des QR codes imprimés, ne changez plus ni le domaine ni l'identifiant du livret.

## Ce qui est en mode démonstration

- **La console enregistre dans le navigateur** (localStorage). C'est parfait pour vous (vous créez et exportez les livrets), mais un client qui modifie son livret depuis chez lui ne publie rien pour les autres. Pour vendre le forfait Autonomie, il faudra brancher la console sur une base de données avec connexion par client (par exemple Supabase ou Firebase) : seules les fonctions de `assets/js/store.js` sont à remplacer.
- **Les statistiques** : créez un compte gratuit sur Umami Cloud (cloud.umami.is), ajoutez votre site, puis collez son « Website ID » dans `umamiId` de `config.js`. Chaque livret apparaît sous son adresse (`/livret.html?id=…`). Pas de cookies, donc pas de bandeau à afficher.
- **Langues** : le livret gère le français et l'anglais. L'allemand de la formule Premium n'est pas encore géré par le livret (à ajouter avant de vendre Premium).
- **Anciennes modifications** : le stockage local est passé en version 2 ; les essais faits avant dans la console sont ignorés (les nouveaux exemples s'affichent).

## Avant de lancer l'activité

- Statut (micro-entreprise : mention « TVA non applicable, art. 293 B du CGI » déjà prévue), SIRET.
- Page mentions légales + conditions générales de vente (obligatoires pour un site qui vend).
- Vraie adresse e-mail et numéro dans `config.js` (ceux fournis sont fictifs).
- Vérifier le nom « Carnet d'Hôte » (INPI, nom de domaine disponible) ou en choisir un autre.

## Pourquoi ces prix (repères relevés en octobre 2026)

- Logiciels où l'hôte fait tout lui-même : gratuit à ~12 €/mois par logement (StyQR 3 €/mois, StayTap Pro dès 6,90 €/mois, Touch Stay ~12,50 €/mois).
- Freelances qui rédigent le livret : environ 100 € le livret avec QR code et affiche, sans hébergement ni mise à jour.
- Carnet d'Hôte se place entre les deux : rédigé pour l'hôte (89 à 249 €), puis hébergé et mis à jour (3,90 à 14,90 €/mois).

## Crédits

QR codes générés par qrcode-generator (Kazuhiko Arase, licence MIT), copié dans `assets/js/vendor/`. Carte : Leaflet (BSD-2), MapLibre GL JS (BSD-3) et maplibre-gl-leaflet (ISC), fond OpenFreeMap © OpenMapTiles, données © contributeurs OpenStreetMap. Météo : MET Norway (licence CC BY 4.0). Polices Google Fonts : Gloock, Marcellus, Young Serif, Schibsted Grotesk, Courier Prime.
