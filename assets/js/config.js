/* ------------------------------------------------------------------
   Carnet d'Hôte — réglages généraux du site
   Modifiez ici le nom de la marque et vos coordonnées :
   tout le site (vitrine, livrets, console, devis) les reprend.
------------------------------------------------------------------- */
window.CDH_CONFIG = {
  marque: "Carnet d'Hôte",
  slogan: "Le livret d'accueil qui tient dans un QR code",
  email: "contact@carnetdhote.fr",          // ← à remplacer par votre adresse pro
  telephone: "06 39 98 00 00",              // ← à remplacer (numéro fictif)
  zone: "Partout en France, 100 % à distance",
  // Adresse publique du site une fois en ligne (sert aux QR codes des livrets).
  // Laissez vide : le site utilisera automatiquement l'adresse où il est ouvert.
  domaine: "https://carnetdhote.fr",
  // Statistiques de consultation des livrets (Umami Cloud, gratuit, sans cookies).
  // Créez un site sur cloud.umami.is et collez ici son « Website ID ».
  // Vide = aucune statistique.
  umamiId: "",
  // Formulaire « Recevoir ce devis ».
  // Sur GitHub Pages : créez un formulaire gratuit sur formspree.io et collez ici
  // son adresse (ex. "https://formspree.io/f/abcdwxyz"). Les demandes arrivent par e-mail.
  // Vide : sur Netlify, Netlify Forms est utilisé ; ailleurs, le visiteur copie
  // le récapitulatif et vous l'envoie par e-mail.
  formulaireDevis: "https://formspree.io/f/xdeearza",
  // Questionnaire en ligne (questionnaire.html). Même principe : un formulaire Formspree.
  // Vide : le questionnaire utilise formulaireDevis ; si celui-ci est vide aussi,
  // le client copie ou télécharge ses réponses et vous les envoie par e-mail.
  formulaireQuestionnaire: "https://formspree.io/f/xdeearza",
  // Espace client (forfait Autonomie) : base Supabase où vivent les livrets des clients.
  // Supabase → Project Settings → API Keys : « Project URL » et clé « Publishable »
  // (sb_publishable_…, faite pour être publique). Vides : la console reste une démonstration.
  supabaseUrl: "https://banisbeqqzdodnrxnast.supabase.co",
  supabaseCle: "sb_publishable_rxgiSoqSFq1DajBuY0aMvA_Q5TCQ8Z3",
  // Mentions légales (pages mentions-legales.html, cgv.html, confidentialite.html).
  // Laissés vides, ces champs apparaissent en jaune « à compléter » sur les pages.
  editeur: "",       // Nom et prénom de l'exploitant (entrepreneur individuel)
  adresse: "",       // Adresse postale professionnelle (siège de l'entreprise)
  mediateur: "",     // Médiateur de la consommation (obligatoire pour vendre à des particuliers)
  // Mentions du devis
  siret: "SIRET en cours d'immatriculation",
  mentionTVA: "TVA non applicable, art. 293 B du CGI",
  validiteDevisJours: 30,
  conditions: "Acompte de 50 % à la commande, solde à la livraison. Forfait mensuel sans engagement, résiliable à tout moment avec 30 jours de préavis."
};
