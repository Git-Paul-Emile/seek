import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { StatusCodes } from "http-status-codes";
import swaggerUi from "swagger-ui-express";
import { AppError } from "../utils/AppError.js";
import { prisma } from "./database.js";
import { limiteurGlobal } from "../middlewares/rateLimiter.middleware.js";
import { getAllowedFrontendOrigins, getFrontendBaseUrl } from "./external.js";
import authRouter from "../routes/auth.routes.js";
import ownerRouter from "../routes/owner.routes.js";
import verificationRouter from "../routes/verification.routes.js";
import adminVerificationRouter from "../routes/adminVerification.routes.js";
import typeLogementRouter from "../routes/typeLogement.routes.js";
import typeTransactionRouter from "../routes/typeTransaction.routes.js";
import statutBienRouter from "../routes/statutBien.routes.js";
import meubleRouter from "../routes/meuble.routes.js";
import equipementRouter from "../routes/equipement.routes.js";
import categorieMeubleRouter from "../routes/categorieMeuble.routes.js";
import categorieEquipementRouter from "../routes/categorieEquipement.routes.js";
import statsRouter from "../routes/stats.routes.js";
import bienRouter from "../routes/bien.routes.js";
import annonceRouter from "../routes/annonce.routes.js";
import geoRouter from "../routes/geo.routes.js";
import locataireRouter from "../routes/locataire.routes.js";
import bailRouter from "../routes/bail.routes.js";
import locataireAuthRouter from "../routes/locataireAuth.routes.js";
import modeleContratRouter from "../routes/modeleContrat.routes.js";
import temoignageRouter from "../routes/temoignage.routes.js";
import alerteRouter from "../routes/alerte.routes.js";
import premiumRouter from "../routes/premium.routes.js";
import transactionRouter from "../routes/transaction.routes.js";
import suspensionRouter from "../routes/suspension.routes.js";
import documentBienRouter from "../routes/documentBien.routes.js";
import favoriRouter from "../routes/favori.routes.js";
import comptePublicAuthRouter from "../routes/comptePublicAuth.routes.js";
import proprietairesRouter, { ownerScoreRouter } from "../routes/trustScore.routes.js";
import monetisationRouter from "../routes/monetisation.routes.js";
import ownerBailRouter from "../routes/ownerBail.routes.js";
import signalementRouter from "../routes/signalement.routes.js";
import etatDesLieuxRouter from "../routes/etat-des-lieux.routes.js";
import configSiteRouter from "../routes/configSite.routes.js";
import pageLegaleRouter from "../routes/pageLegale.routes.js";
import { ownerNotifRouter, locataireNotifRouter, adminNotifRouter } from "../routes/notificationInApp.routes.js";
import feedbackRouter from "../routes/feedback.routes.js";
import categorieChampRouter from "../routes/categorieChamp.routes.js";
import champRouter from "../routes/champ.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const resolveTrustProxy = (): boolean | number | string => {
  const rawTrustProxy = process.env.TRUST_PROXY?.trim();

  if (!rawTrustProxy) {
    return process.env.NODE_ENV === "production" ? 1 : false;
  }

  if (rawTrustProxy === "true") return true;
  if (rawTrustProxy === "false") return false;

  const parsedNumber = Number(rawTrustProxy);
  if (!Number.isNaN(parsedNumber)) return parsedNumber;

  return rawTrustProxy;
};

app.set("trust proxy", resolveTrustProxy());

const allowedOrigins = new Set(getAllowedFrontendOrigins());

const isAllowedDevOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

// ============= COMPRESSION =============

app.use(compression());

// ============= SÉCURITÉ =============

// Helmet - Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
    // Allow requests with no origin (e.g., curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-owner-id"],
  optionsSuccessStatus: 204,
};

// ============= CORS =============

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Rate limiting global
app.use(limiteurGlobal);

// ============= PARSERS =============

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============= FICHIERS STATIQUES =============

// Servir les fichiers uploadés (images, covers)
// Override Helmet's Cross-Origin-Resource-Policy pour permettre le chargement cross-origin des images
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../../uploads')));

// ============= ROUTES =============

app.get('/', (req, res) => {
  res.redirect(getFrontendBaseUrl());
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', message: 'API opérationnelle', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'ERROR', message: 'Base de données inaccessible', db: 'disconnected' });
  }
});

// Auth admin
app.use('/api/auth', authRouter);

// Auth propriétaires
app.use('/api/owner/auth', ownerRouter);

// Vérification d'identité propriétaire
app.use('/api/owner/verification', verificationRouter);

// Vérification admin
app.use('/api/admin', adminVerificationRouter);

// Types de logement
app.use('/api/types-logement', typeLogementRouter);

// Types de transaction
app.use('/api/types-transaction', typeTransactionRouter);

// Statuts de bien
app.use('/api/statuts-bien', statutBienRouter);

// Meubles & Équipements
app.use('/api/meubles',     meubleRouter);
app.use('/api/equipements', equipementRouter);

// Catégories Meublé / Équipement
app.use('/api/categories-meubles',     categorieMeubleRouter);
app.use('/api/categories-equipements', categorieEquipementRouter);

// Statistiques publiques
app.use('/api/stats', statsRouter);

// Biens immobiliers
app.use('/api/biens', bienRouter);

// Annonces (admin)
app.use('/api/annonces', annonceRouter);

// Géographie (pays / villes)
app.use('/api/geo', geoRouter);

// Locataires (owner CRUD)
app.use('/api/owner/locataires', locataireRouter);

// Bails owner (routes globales sans bienId)
app.use('/api/owner/biens', ownerBailRouter);

// Bails (sous /api/biens/:id/bail)
app.use('/api/biens/:id/bail', bailRouter);

// Auth espace locataire
app.use('/api/locataire/auth', locataireAuthRouter);

// Modèles de contrat (admin CRUD + owner liste)
app.use('/api/modeles-contrat', modeleContratRouter);

// Témoignages (public)
app.use('/api/temoignages', temoignageRouter);

// Alertes (public)
app.use('/api/alertes', alerteRouter);

// Mise en avant des annonces (formules payantes, historique, page d'accueil)
app.use('/api/premium', premiumRouter);

// Transactions / Historique des paiements
app.use('/api/transactions', transactionRouter);

// Suspension de comptes (admin)
app.use('/api/suspension', suspensionRouter);

// Signalements (public & admin)
app.use('/api/signalements', signalementRouter);

// États des lieux (owner & locataire)
app.use('/api/etats-des-lieux', etatDesLieuxRouter);

// Documents des biens (owner)
app.use('/api/biens/:bienId/documents', documentBienRouter);

// Auth compte public (visiteurs)
app.use('/api/public/auth', comptePublicAuthRouter);

// Favoris (compte public authentifié)
app.use('/api/public/favoris', favoriRouter);

// Score de confiance des propriétaires (public)
app.use('/api/proprietaires', proprietairesRouter);

// Score de confiance du propriétaire connecté
app.use('/api/owner', ownerScoreRouter);

// Monétisation (abonnements, commissions, mises en avant)
app.use('/api/monetisation', monetisationRouter);

// Configuration globale du site (Footer, Contact)
app.use('/api/config-site', configSiteRouter);

// Pages légales (Politique, CGU, Conformité)
app.use('/api/pages-legales', pageLegaleRouter);

// Feedbacks utilisateurs (public + admin)
app.use('/api/feedbacks', feedbackRouter);

// Formulaire dynamique : catégories de champs + champs
app.use('/api/admin/categories-champ', categorieChampRouter);
app.use('/api/champs', champRouter);

// Notifications in-app
app.use('/api/owner/notifications', ownerNotifRouter);
app.use('/api/locataire/notifications', locataireNotifRouter);
app.use('/api/admin/notifications', adminNotifRouter);

// ============= SWAGGER UI =============

// Servir le fichier YAML OpenAPI
app.get('/api-docs.yaml', (_req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.sendFile(path.join(__dirname, 'swagger.yaml'));
});

// Alias /api-docs.json vers le YAML
app.get('/api-docs.json', (_req, res) => {
  res.redirect('/api-docs.yaml');
});

// Interface Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(
  undefined,
  {
    swaggerOptions: {
      url: '/api-docs.yaml',
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2.5em; }
      .swagger-ui .info .description { font-size: 1.1em; line-height: 1.5; }
      .swagger-ui .scheme-container { background: #f5f5f5; padding: 15px; border-radius: 8px; }
    `,
    customSiteTitle: "SEEK API - Documentation",
    customfavIcon: "/favicon.ico",
  }
));

// ============= GESTION DES ERREURS =============

// Middleware pour routes non trouvées
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: "Route non trouvée" });
});

// Middleware de gestion des erreurs
app.use((err: Error | AppError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);

  // Gestion des erreurs Prisma
  if ('code' in err && typeof err.code === 'string') {
    switch (err.code) {
      case 'P2002':
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Conflit unique sur le champ: ${(err as any).meta?.target || 'inconnu'}`
        });
      case 'P2025':
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Ressource non trouvée' });
      default:
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur de base de données inconnue' });
    }
  }

  // Gestion des AppError et autres erreurs
  const statusCode = (err instanceof AppError) ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Erreur interne du serveur';
  res.status(statusCode).json({ message });
});

export default app;
