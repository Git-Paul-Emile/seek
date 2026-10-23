/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { Seeder } from './seeders/seeder.interface.js';
import { PaysSeeder } from './seeders/pays.seeder.js';
import { VilleSeeder } from './seeders/ville.seeder.js';
import { AdminSeeder } from './seeders/admin.seeder.js';
import { TypeLogementSeeder } from './seeders/type-logement.seeder.js';
import { TypeTransactionSeeder } from './seeders/type-transaction.seeder.js';
import { StatutBienSeeder } from './seeders/statut-bien.seeder.js';
import { MeubleSeeder } from './seeders/meuble.seeder.js';
import { EquipementSeeder } from './seeders/equipement.seeder.js';
import { CategorieSeeder } from './seeders/categorie.seeder.js';
import { ModeleContratSeeder } from './seeders/modeleContrat.seeder.js';
import { QuartierSeeder } from './seeders/quartier.seeder.js';
import { TemoignageSeeder } from './seeders/temoignage.seeder.js';
import { FormulePremiumSeeder } from './seeders/formulePremium.seeder.js';
import { ConfigSiteSeeder } from './seeders/configSite.seeder.js';
import { ConfigMonetisationSeeder } from './seeders/configMonetisation.seeder.js';
import { PageLegaleSeeder } from './seeders/pageLegale.seeder.js';
import { ChampSeeder } from './seeders/champ.seeder.js';
import { ProprietaireSeeder } from './seeders/proprietaire.seeder.js';
import { BienSeeder } from './seeders/bien.seeder.js';
import { LocataireSeeder } from './seeders/locataire.seeder.js';
import { ComptePublicSeeder } from './seeders/comptePublic.seeder.js';
import { EngagementSeeder } from './seeders/engagement.seeder.js';
import { BailInvitationSeeder } from './seeders/bailInvitation.seeder.js';
import { BailLocationSeeder } from './seeders/bailLocation.seeder.js';
import { PromotionHistorySeeder } from './seeders/promotionHistory.seeder.js';
import { MessagingSeeder } from './seeders/messaging.seeder.js';
import { SessionArtifactsSeeder } from './seeders/sessionArtifacts.seeder.js';

dotenv.config();

/**
 * Ordre d'exécution — respecter les dépendances entre entités :
 *  0.  ConfigSite       (indépendant)
 *  1.  Pays             (référencé par Ville)
 *  2.  Ville            (dépend de Pays)
 *  3.  Quartier         (dépend de Ville)
 *  4.  Admin            (indépendant)
 *  5.  TypeLogement     (upsert — ajoute Chambre si absent)
 *  6.  TypeTransaction  (upsert)
 *  7.  StatutBien       (upsert)
 *  8.  Categorie        (catégories Meuble et Équipement)
 *  9.  Meuble           (dépend de Categorie)
 * 10.  Equipement       (dépend de Categorie)
 * 11.  ModeleContrat    (indépendant)
 * 12.  Temoignage       (upsert)
 * 13.  FormulePremium   (upsert)
 * 14.  ConfigMonetisation (indépendant)
 * 15.  PageLegale       (indépendant)
 * 16.  Champ            (dépend de TypeLogement)
 * 17.  Proprietaire     (indépendant)
 * 18.  Bien             (dépend de Proprietaire, Quartier, TypeLogement, TypeTransaction, StatutBien, Meuble, Equipement, Champ)
 * 19.  Locataire        (dépend de Proprietaire)
 * 20.  ComptePublic     (dépend de Locataire, Proprietaire)
 * 21.  Engagement       (Favori, VueBien, Signalement, Alerte — dépend de ComptePublic, Bien)
 * 22.  BailInvitation   (dépend de Proprietaire, Bien, Locataire)
 * 23.  BailLocation     (bail + contrat + échéancier + caution + état des lieux — dépend de Proprietaire, Bien, Locataire, ModeleContrat)
 * 24.  PromotionHistory (dépend de Bien premium, FormulePremium)
 * 25.  Messaging        (Notification, MessageInterne, MessageInterneLocataire)
 * 26.  SessionArtifacts (jetons factices — dépend de Admin, Proprietaire, Locataire, ComptePublic)
 *
 * Pour ajouter un seeder : créer son fichier dans ./seeders/ et l'ajouter ici.
 */
const SEEDERS: readonly Seeder[] = [
  new ConfigSiteSeeder(),
  new PaysSeeder(),
  new VilleSeeder(),
  new QuartierSeeder(),
  new AdminSeeder(),
  new TypeLogementSeeder(),
  new TypeTransactionSeeder(),
  new StatutBienSeeder(),
  new CategorieSeeder(),
  new MeubleSeeder(),
  new EquipementSeeder(),
  new ModeleContratSeeder(),
  new TemoignageSeeder(),
  new FormulePremiumSeeder(),
  new ConfigMonetisationSeeder(),
  new PageLegaleSeeder(),
  new ChampSeeder(),
  new ProprietaireSeeder(),
  new BienSeeder(),
  new LocataireSeeder(),
  new ComptePublicSeeder(),
  new EngagementSeeder(),
  new BailInvitationSeeder(),
  new BailLocationSeeder(),
  new PromotionHistorySeeder(),
  new MessagingSeeder(),
  new SessionArtifactsSeeder(),
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Début du seeding...\n');

    for (const seeder of SEEDERS) {
      console.log(`▶ ${seeder.name}`);
      await seeder.run(prisma);
    }

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('\n📋 Comptes de test créés :');
    console.log('  Admin        → admin@seek.sn            / Admin@2024!');
    console.log('  Propriétaire → (email généré aléatoirement) / Proprio@2024!');
    console.log('  Locataire    → (email généré aléatoirement) / Locataire@2024!');
    console.log('  Compte public→ (email généré aléatoirement) / Public@2024!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Erreur lors du seeding :', err);
  process.exit(1);
});
