import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

// ─── Contenu par défaut conforme au droit sénégalais ──────────────────────────

const DEFAULTS: Record<string, { titre: string; version: string; contenu: string }> = {
  "politique-confidentialite": {
    titre: "Politique de confidentialité",
    version: "1.0",
    contenu: `<h2>1. Responsable du traitement</h2>
<p>Seek (ci-après « la Plateforme ») est responsable du traitement de vos données personnelles, conformément à la <strong>Loi n° 2008-12 du 25 janvier 2008</strong> relative à la protection des données à caractère personnel au Sénégal et aux recommandations de la <strong>Commission de Protection des Données Personnelles (CDP)</strong>.</p>
<p>Contact : <a href="mailto:contact@seek.sn">contact@seek.sn</a> — Dakar, Sénégal</p>

<h2>2. Données collectées</h2>
<p>Dans le cadre de l'utilisation de la Plateforme, nous collectons les données suivantes :</p>
<ul>
  <li><strong>Données d'identification</strong> : nom, prénom, numéro de téléphone, adresse e-mail</li>
  <li><strong>Données de localisation</strong> : ville, quartier, coordonnées GPS (pour la géolocalisation des biens)</li>
  <li><strong>Documents d'identité</strong> : pièce nationale d'identité, passeport (vérification des propriétaires)</li>
  <li><strong>Données financières</strong> : historique des transactions, informations de paiement (Mobile Money)</li>
  <li><strong>Données de navigation</strong> : adresse IP, cookies, pages visitées, données de session</li>
</ul>

<h2>3. Finalités du traitement</h2>
<p>Vos données sont collectées pour :</p>
<ul>
  <li>La création et la gestion de votre compte utilisateur</li>
  <li>La publication et la gestion d'annonces immobilières</li>
  <li>La vérification d'identité des propriétaires (conformité légale)</li>
  <li>La gestion des baux et des paiements locatifs</li>
  <li>L'envoi de notifications et de communications liées à votre compte</li>
  <li>L'amélioration de nos services et la prévention des fraudes</li>
  <li>Le respect de nos obligations légales et réglementaires</li>
</ul>

<h2>4. Vos droits</h2>
<p>Conformément à la Loi n° 2008-12, vous disposez des droits suivants :</p>
<ul>
  <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
  <li><strong>Droit de rectification</strong> : corriger des données inexactes ou incomplètes</li>
  <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
  <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données à des fins de prospection</li>
  <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
</ul>
<p>Pour exercer ces droits, contactez-nous à <a href="mailto:contact@seek.sn">contact@seek.sn</a>. Vous pouvez également saisir la <strong>CDP Sénégal</strong> à l'adresse : <a href="https://cdp.sn" target="_blank" rel="noopener noreferrer">cdp.sn</a>.</p>

<h2>5. Durée de conservation</h2>
<p>Vos données sont conservées pendant :</p>
<ul>
  <li><strong>Données de compte</strong> : durée de la relation contractuelle + 5 ans</li>
  <li><strong>Documents d'identité</strong> : 3 ans après la fin de la relation</li>
  <li><strong>Données de navigation</strong> : 13 mois maximum</li>
  <li><strong>Données de transaction</strong> : 10 ans (obligation comptable)</li>
</ul>

<h2>6. Transferts internationaux de données</h2>
<p>Dans le cadre de l'exploitation de la Plateforme, vos données peuvent être transférées vers des serveurs situés aux États-Unis (hébergement Neon Database, Vercel). Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types, certifications) conformément aux exigences de la CDP.</p>

<h2>7. Cookies</h2>
<p>La Plateforme utilise des cookies techniques nécessaires au fonctionnement du service (authentification, préférences). Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement.</p>

<h2>8. Sécurité des données</h2>
<p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement TLS, hachage des mots de passe, contrôle d'accès strict, journalisation des accès.</p>

<h2>9. Modifications</h2>
<p>Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification substantielle vous sera notifiée par e-mail ou via la Plateforme.</p>
<p><em>Dernière mise à jour : avril 2025</em></p>`,
  },

  "conditions-utilisation": {
    titre: "Conditions générales d'utilisation",
    version: "1.0",
    contenu: `<h2>1. Objet et acceptation</h2>
<p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme immobilière <strong>Seek</strong> (ci-après « la Plateforme »), accessible sur le territoire sénégalais et au-delà. Elles sont conclues conformément à la <strong>Loi n° 2008-10 du 25 janvier 2008</strong> portant sur les transactions électroniques au Sénégal et à la <strong>Loi n° 2008-11 du 25 janvier 2008</strong> portant sur la cybercriminalité.</p>
<p>En accédant à la Plateforme, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.</p>

<h2>2. Description du service</h2>
<p>Seek est une plateforme de mise en relation entre propriétaires immobiliers et locataires/acheteurs potentiels au Sénégal. La Plateforme propose :</p>
<ul>
  <li>La publication et la consultation d'annonces immobilières</li>
  <li>La gestion des baux de location (propriétaires vérifiés)</li>
  <li>Le suivi des paiements de loyer</li>
  <li>La messagerie entre propriétaires et locataires</li>
</ul>

<h2>3. Inscription et compte utilisateur</h2>
<p>L'inscription est réservée aux personnes majeures (18 ans et plus). Vous vous engagez à fournir des informations exactes, complètes et à jour. Tout compte créé avec de fausses informations pourra être suspendu immédiatement.</p>
<p>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.</p>

<h2>4. Obligations des propriétaires</h2>
<p>Les propriétaires s'engagent à :</p>
<ul>
  <li>Fournir des informations exactes et à jour sur leurs biens</li>
  <li>Soumettre les documents d'identité requis pour la vérification</li>
  <li>Respecter la réglementation sénégalaise en matière de location immobilière</li>
  <li>Ne pas publier d'annonces frauduleuses, trompeuses ou illicites</li>
  <li>Respecter les prix affichés et les conditions annoncées</li>
</ul>

<h2>5. Obligations des locataires/utilisateurs</h2>
<p>Les utilisateurs s'engagent à :</p>
<ul>
  <li>Utiliser la Plateforme uniquement à des fins licites</li>
  <li>Ne pas porter atteinte aux droits de tiers</li>
  <li>Ne pas diffuser de contenus illicites, offensants ou portant atteinte à l'ordre public</li>
  <li>Ne pas tenter de contourner les mesures de sécurité de la Plateforme</li>
</ul>

<h2>6. Contenu et propriété intellectuelle</h2>
<p>L'ensemble du contenu de la Plateforme (textes, images, interface, marque « Seek ») est protégé par les droits de propriété intellectuelle. Toute reproduction ou utilisation non autorisée est interdite. Les utilisateurs accordent à Seek une licence non exclusive pour afficher les contenus publiés (annonces, photos) sur la Plateforme.</p>

<h2>7. Responsabilité</h2>
<p>Seek agit en qualité d'intermédiaire technique et ne saurait être tenu responsable du contenu des annonces publiées par les propriétaires, ni des transactions conclues entre utilisateurs. La Plateforme met en œuvre des mécanismes de modération et de signalement pour garantir la qualité des annonces.</p>
<p>Seek ne peut être tenu responsable des dommages indirects résultant de l'utilisation de la Plateforme (perte de données, interruption de service, etc.).</p>

<h2>8. Suspension et résiliation</h2>
<p>Seek se réserve le droit de suspendre ou de résilier tout compte en cas de violation des présentes CGU, de comportement frauduleux ou de décision judiciaire. L'utilisateur peut demander la suppression de son compte à tout moment en contactant <a href="mailto:contact@seek.sn">contact@seek.sn</a>.</p>

<h2>9. Droit applicable et juridiction</h2>
<p>Les présentes CGU sont soumises au <strong>droit sénégalais</strong>. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les <strong>tribunaux compétents de Dakar</strong> seront seuls compétents pour connaître du différend.</p>

<h2>10. Modifications des CGU</h2>
<p>Seek se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par voie électronique. La poursuite de l'utilisation de la Plateforme après modification vaut acceptation des nouvelles conditions.</p>
<p><em>Dernière mise à jour : avril 2025</em></p>`,
  },

  "conformite-donnees": {
    titre: "Conformité & protection des données",
    version: "1.0",
    contenu: `<h2>1. Cadre légal applicable</h2>
<p>Seek s'engage à respecter la réglementation sénégalaise en matière de protection des données personnelles, notamment :</p>
<ul>
  <li><strong>Loi n° 2008-12 du 25 janvier 2008</strong> relative à la protection des données à caractère personnel</li>
  <li><strong>Loi n° 2008-10 du 25 janvier 2008</strong> portant sur les transactions électroniques</li>
  <li>Les recommandations et délibérations de la <strong>Commission de Protection des Données Personnelles (CDP)</strong></li>
</ul>

<h2>2. Autorité de contrôle</h2>
<p>L'autorité de contrôle compétente est la <strong>Commission de Protection des Données Personnelles (CDP)</strong> du Sénégal :</p>
<ul>
  <li>Site web : <a href="https://cdp.sn" target="_blank" rel="noopener noreferrer">cdp.sn</a></li>
  <li>Adresse : Dakar, Sénégal</li>
</ul>
<p>Seek a procédé aux déclarations/autorisations requises auprès de la CDP pour les traitements de données mis en œuvre sur la Plateforme.</p>

<h2>3. Base légale des traitements</h2>
<table>
  <thead>
    <tr><th>Finalité</th><th>Base légale</th></tr>
  </thead>
  <tbody>
    <tr><td>Gestion du compte utilisateur</td><td>Exécution du contrat</td></tr>
    <tr><td>Vérification d'identité</td><td>Obligation légale</td></tr>
    <tr><td>Prévention des fraudes</td><td>Intérêt légitime</td></tr>
    <tr><td>Communications marketing</td><td>Consentement</td></tr>
    <tr><td>Statistiques d'usage</td><td>Intérêt légitime</td></tr>
    <tr><td>Conservation des transactions</td><td>Obligation légale (comptabilité)</td></tr>
  </tbody>
</table>

<h2>4. Transferts internationaux de données</h2>
<p>Dans le cadre de l'exploitation technique de la Plateforme, des données peuvent être transférées vers des pays tiers :</p>
<ul>
  <li><strong>Base de données</strong> : Neon (PostgreSQL serverless) — serveurs US-East-1, États-Unis</li>
  <li><strong>Hébergement frontend</strong> : Vercel — serveurs en Europe et aux États-Unis</li>
  <li><strong>Stockage médias</strong> : Cloudinary — serveurs en Europe</li>
</ul>
<p>Ces transferts sont encadrés par des <strong>clauses contractuelles types</strong> et des garanties appropriées. Des mesures techniques complémentaires (chiffrement des données en transit et au repos) sont appliquées.</p>

<h2>5. Mesures de sécurité</h2>
<p>Seek met en œuvre les mesures de sécurité suivantes :</p>
<ul>
  <li><strong>Chiffrement TLS 1.3</strong> pour toutes les communications</li>
  <li><strong>Hachage bcrypt</strong> des mots de passe (coût 12)</li>
  <li><strong>Tokens JWT</strong> avec durée de vie limitée + rotation des refresh tokens</li>
  <li><strong>Contrôle d'accès basé sur les rôles</strong> (RBAC) : Admin / Propriétaire / Locataire</li>
  <li><strong>Rate limiting</strong> sur toutes les routes sensibles</li>
  <li><strong>Journalisation</strong> des accès et des modifications de données</li>
  <li><strong>Sauvegardes automatiques</strong> de la base de données (Neon point-in-time recovery)</li>
</ul>

<h2>6. Délégué à la protection des données (DPO)</h2>
<p>Pour toute question relative à la protection de vos données personnelles :</p>
<ul>
  <li>E-mail : <a href="mailto:contact@seek.sn">contact@seek.sn</a></li>
  <li>Objet : « Protection des données personnelles »</li>
</ul>
<p>Nous nous engageons à répondre à toute demande dans un délai maximum de <strong>30 jours</strong>.</p>

<h2>7. Registre des traitements</h2>
<p>Seek tient à jour un registre interne des activités de traitement, conformément aux exigences de la Loi n° 2008-12. Ce registre recense l'ensemble des traitements de données, leurs finalités, les catégories de données traitées, les destinataires et les durées de conservation.</p>

<h2>8. Violations de données</h2>
<p>En cas de violation de données à caractère personnel susceptible d'engendrer un risque pour les droits et libertés des personnes, Seek s'engage à :</p>
<ul>
  <li>Notifier la <strong>CDP</strong> dans les meilleurs délais</li>
  <li>Informer les personnes concernées lorsque la violation est susceptible d'engendrer un risque élevé</li>
  <li>Documenter la violation et les mesures prises</li>
</ul>

<h2>9. Mise à jour</h2>
<p>Cette page de conformité est mise à jour régulièrement pour refléter l'évolution de nos pratiques et de la réglementation applicable.</p>
<p><em>Dernière mise à jour : avril 2025</em></p>`,
  },
};

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getBySlug = async (req: Request, res: Response) => {
  const slug = req.params["slug"] as string;

  const page = await prisma.pageLegale.findUnique({ where: { slug } });

  if (!page) {
    const def = DEFAULTS[slug];
    if (!def) return res.status(404).json({ message: "Page introuvable" });
    return res.json({ data: { slug, ...def, publie: true, id: null, createdAt: null, updatedAt: null } });
  }

  res.json({ data: page });
};

export const getAll = async (_req: Request, res: Response) => {
  const pages = await prisma.pageLegale.findMany({ orderBy: { slug: "asc" } });

  // Merge with defaults to always return 3 pages
  const result = Object.keys(DEFAULTS).map((slug) => {
    const existing = pages.find((p) => p.slug === slug);
    if (existing) return existing;
    const def = DEFAULTS[slug]!;
    return { id: null, slug, titre: def.titre, contenu: def.contenu, publie: true, version: def.version, createdAt: null, updatedAt: null };
  });

  res.json({ data: result });
};

export const upsert = async (req: Request, res: Response) => {
  const slug = req.params["slug"] as string;
  const { titre, contenu, publie, version } = req.body as { titre: string; contenu: string; publie?: boolean; version?: string };

  if (!titre || !contenu) {
    return res.status(400).json({ message: "Titre et contenu sont requis" });
  }

  const page = await prisma.pageLegale.upsert({
    where: { slug },
    create: { slug, titre, contenu, publie: publie ?? true, version },
    update: { titre, contenu, publie: publie ?? true, version },
  });

  res.json({ data: page });
};
