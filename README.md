# Carnet d'Hôte — site vitrine + livrets d'accueil

Site statique (HTML, CSS, JavaScript sans framework) : il s'ouvre en double-cliquant sur `index.html` et se met en ligne tel quel sur GitHub Pages (ou Netlify).

## Les pages

| Fichier | Rôle |
|---|---|
| `index.html` | Vitrine : présentation, 3 exemples, offres, devis automatique, console, FAQ, contact |
| `livret.html` | Le livret lu par les voyageurs (`livret.html#identifiant`), en français et en anglais, toujours en thème clair |
| `console.html` | Console d'édition : bouton FR / EN, avant l'arrivée, rubriques, services en plus, adresses (GPS), activités, avis, QR code et affiche A6. `console.html?compte` = la même console branchée sur la base (espace client) |
| `espace.html` | Espace client : connexion des hôtes, leurs livrets, ouvertures sur 30 jours, mot de passe |
| `supabase/installation.sql` | Script à coller une fois dans Supabase : tables, règles de sécurité, photos |
| `sw.js` | Lecture hors connexion du livret (à garder à la racine du site) |
| `404.html` | Sur GitHub Pages : renvoie les adresses courtes `/l/identifiant` (et `/l/identifiant/arrivee`) vers le livret |
| `_redirects` | La même chose sur Netlify |
| `.nojekyll` | Indique à GitHub Pages de publier les fichiers tels quels |
| `.github/workflows/reveil-supabase.yml` | Appelle la base chaque matin pour qu'elle ne se mette pas en pause |

## Ce que vous modifierez le plus souvent

- **Nom de la marque, e-mail, téléphone, SIRET, mentions du devis** → `assets/js/config.js`
- **Prix, formules, forfaits, options, supports** → `assets/js/tarifs.js` (la page Offres et le devis se mettent à jour tout seuls)
- **Livrets publiés** → `data/livrets.js`
- **Couleurs et polices de la vitrine** → `assets/css/site.css`, tout en haut (`--ivoire`, `--sapin`, `--pierre`, `--laiton`…). Polices : Newsreader (titres) et Hanken Grotesk (texte).
- **Photos de la vitrine** → dans `index.html` : la chambre du héros (`photos/hotel-les-ondines/chambre.jpg`), la boîte à clés et la table d'hôtes. Remplacez-les par vos propres photos dès que possible (même cadre, recadrage automatique).

## Ajouter le livret d'un client (sans espace client)

Avec l'espace client activé, suivez plutôt « Mettre en ligne le livret d'un client » plus bas : le livret ne passe plus par ce fichier.

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

- **La console publique (`console.html`) reste une démonstration** : elle enregistre dans le navigateur du visiteur. Les vrais livrets des clients passent par l'espace client (section suivante).
- **Les statistiques** : créez un compte gratuit sur Umami Cloud (cloud.umami.is), ajoutez votre site, puis collez son « Website ID » dans `umamiId` de `config.js`. Chaque livret apparaît sous son adresse (`/livret.html?id=…`). Pas de cookies, donc pas de bandeau à afficher.
- **Langues** : le livret et la console gèrent le français, l'anglais, l'allemand et l'italien (Confort : FR + EN + DE ; Premium : + IT). Boutons FR / EN / DE / IT en haut de la console ; une traduction vide reprend le texte français. Les textes fixes du livret (boutons, titres, météo) sont déjà traduits ; le contenu propre à chaque logement est à traduire livret par livret.
- **Anciennes modifications** : le stockage local est passé en version 2 ; les essais faits avant dans la console sont ignorés (les nouveaux exemples s'affichent).

## Espace client (forfait Autonomie)

Les hôtes se connectent sur `espace.html`, modifient leur livret dans la console et cliquent sur « Publier » : les voyageurs voient la nouvelle version aussitôt, le QR code ne change pas. Les livrets des clients sont dans une base **Supabase** (gratuite jusqu'à 500 Mo de données et 1 Go de photos), **pas dans le dépôt GitHub** : leurs codes Wi-Fi et de boîte à clés ne sont donc pas publics, même avec un dépôt public.

### Ce que ça fait

- **Hôte** : connexion par e-mail + mot de passe ; il ne voit et ne modifie que ses livrets. Brouillon gardé sur son appareil tant qu'il n'a pas publié. Photos envoyées dans la base (réduites à 1600 px). 30 dernières versions gardées, « Reprendre » en un clic. Ouvertures du livret sur 30 jours (comptage anonyme, sans cookie). Changement de mot de passe dans « Mon compte ».
- **Vous (administrateur)** : tous les livrets ; mise en ligne d'un livret (exemple, import ou nouveau) avec choix de son adresse définitive ; accès des hôtes ; message d'invitation prêt à copier ; interrupteur « Livret en ligne » (fin d'abonnement : le QR affiche « Livret introuvable », rien n'est supprimé).
- **Voyageurs** : le livret est lu dans la base. Une copie reste sur leur téléphone : il s'ouvre encore sans réseau. Si deux personnes publient en même temps, la seconde est prévenue au lieu d'écraser la première.
- Les 3 exemples de la vitrine restent dans `data/livrets.js` et ne dépendent pas de la base.

### Mise en route (une seule fois, 15 minutes)

1. Créez un compte sur [supabase.com](https://supabase.com), puis **New project** : nom `carnet-hote`, région **Europe (Paris)**, un mot de passe de base (gardez-le). Laissez « Data API » activé.
2. **SQL Editor** → **New query** → collez tout le fichier `supabase/installation.sql` → **Run**. Message attendu : « Success. No rows returned ».
3. **Authentication → Sign In / Providers** (ou « Providers ») → **Email** : laissez la connexion par e-mail active et **désactivez « Allow new users to sign up »**. Seuls les comptes que vous créez pourront se connecter.
4. **Authentication → URL Configuration** : *Site URL* = l'adresse du site (`https://nathvrb.github.io/carnet-hote/`, plus tard votre domaine) ; dans *Redirect URLs*, ajoutez `https://nathvrb.github.io/carnet-hote/espace.html`.
5. Votre compte administrateur : **Authentication → Users → Add user → Create new user**, votre e-mail + un mot de passe, cochez **Auto Confirm User**. Puis dans le **SQL Editor** : `select cdh.ajouter_admin('votre@email.fr');`
6. **Project Settings → API Keys** : copiez la clé **Publishable** (`sb_publishable_…`). L'adresse du projet (`https://xxxx.supabase.co`) est sur la page d'accueil du projet (bouton **Connect**). Collez-les dans `assets/js/config.js` : `supabaseUrl` et `supabaseCle`. Cette clé est faite pour être publique ; ne mettez **jamais** la clé *secret* dans le site.
7. Allez sur `espace.html`, connectez-vous : vous voyez le badge « Administrateur ».

### Mettre en ligne le livret d'un client

1. `espace.html` → **Ouvrir la console**. Menu du haut : « + Créer un nouveau livret », ou un livret de la liste « Pas encore en ligne » (exemple, import).
2. **Publier** → choisissez l'adresse définitive (`gite-des-fagnes`). Elle est dans le QR code : ne la changez plus après impression.
3. Créez le compte de l'hôte dans Supabase (**Authentication → Users → Add user**, *Auto Confirm User* coché, un mot de passe provisoire).
4. Console → onglet **Accès et versions** → e-mail de l'hôte → **Donner l'accès**. Copiez le message d'invitation et envoyez-le, avec le mot de passe à part (SMS par exemple). L'hôte pourra le changer dans « Mon compte ».

### Mot de passe oublié

Le bouton « Mot de passe oublié » d'`espace.html` envoie un lien par e-mail, mais l'envoi intégré à Supabase ne part que vers les membres de votre équipe Supabase (2 e-mails par heure). Deux solutions :

- **Tout de suite** : donnez-lui un mot de passe provisoire depuis le **SQL Editor** : `select cdh.nouveau_mot_de_passe('hote@email.fr', 'Provisoire2026!');` puis transmettez-le ; il le changera dans « Mon compte ».
- **Pour que le bouton marche pour tous** : **Authentication → Emails → SMTP Settings** avec un service gratuit (Brevo : 300 e-mails par jour), puis traduisez le modèle **Reset Password** en français.

### Bon à savoir

- **Pause du forfait gratuit** : Supabase met en pause un projet gratuit resté 7 jours sans activité. Les ouvertures des livrets suffisent, et le script `.github/workflows/reveil-supabase.yml` appelle la base chaque matin par sécurité (onglet **Actions** du dépôt, rien à configurer). GitHub coupe les tâches planifiées d'un dépôt sans aucune modification pendant 60 jours : un envoi de temps en temps suffit. En cas de pause : tableau de bord Supabase → **Resume project** ; les livrets déjà ouverts restent lisibles sur les téléphones pendant ce temps.
- **Sauvegarde** : le forfait gratuit ne garde pas de sauvegardes automatiques téléchargeables. Une fois par mois, dans la console, onglet **Accès et versions → Exporter** pour chaque livret, ou passez au forfait Pro (25 $/mois) quand vous aurez plusieurs clients.
- **Sécurité** : toutes les règles sont dans `supabase/installation.sql` (tables privées, fonctions qui vérifient le compte connecté à chaque appel). Un voyageur ne peut lire qu'un livret dont il connaît l'adresse, jamais la liste.
- Après une mise à jour du site qui touche `supabase/installation.sql`, relancez-le dans le SQL Editor : il ne supprime rien.

## Avant de lancer l'activité

- Statut (micro-entreprise : mention « TVA non applicable, art. 293 B du CGI » déjà prévue), SIRET.
- Page mentions légales + conditions générales de vente (obligatoires pour un site qui vend).
- Vraie adresse e-mail et numéro dans `config.js` (ceux fournis sont fictifs).
- Vérifier le nom « Carnet d'Hôte » (INPI, nom de domaine disponible) ou en choisir un autre.

## Pourquoi ces prix (repères relevés en octobre 2026)

- Logiciels où l'hôte fait tout lui-même : gratuit à ~12 €/mois par logement (StyQR 3 €/mois, StayTap Pro dès 6,90 €/mois, Touch Stay ~12,50 €/mois).
- Freelances qui rédigent le livret : environ 100 € le livret avec QR code et affiche, sans hébergement ni mise à jour.
- Carnet d'Hôte se place entre les deux : rédigé pour l'hôte (149 ou 249 €), puis hébergé avec une console pour le modifier soi-même (7,90 €/mois, ou 19,90 €/mois avec les modifications faites pour l'hôte).

## Crédits

QR codes générés par qrcode-generator (Kazuhiko Arase, licence MIT), copié dans `assets/js/vendor/`. Carte : Leaflet (BSD-2), MapLibre GL JS (BSD-3) et maplibre-gl-leaflet (ISC), fond OpenFreeMap © OpenMapTiles, données © contributeurs OpenStreetMap. Météo : MET Norway (licence CC BY 4.0). Polices Google Fonts : Gloock, Marcellus, Young Serif, Schibsted Grotesk, Courier Prime.
