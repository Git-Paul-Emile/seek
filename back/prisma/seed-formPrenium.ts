/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';

dotenv.config();

const FORMULES = [
  {
    code: 'BOOST 7J',
    nom: 'Boost',
    dureeJours: 7,
    prix: 2500,
    accroche: 'Donnez un coup de pouce à votre annonce',
    description: 'Votre annonce apparaît en tête des résultats pendant 7 jours et bénéficie d\'une mise en avant sur la page d\'accueil.',
    idealPour: ['Tester la visibilité', 'Bien récemment mis en ligne', 'Budget limité'],
    populer: false,
    ordre: 1,
    actif: true,
  },
  {
    code: 'STANDARD 15J',
    nom: 'Standard',
    dureeJours: 15,
    prix: 5000,
    accroche: 'Plus de visibilité, plus de contacts',
    description: 'Votre annonce est mise en avant pendant 15 jours avec un badge "Premium" visible par tous les visiteurs.',
    idealPour: ['Maximiser les contacts', 'Annonce en attente de preneur', 'Rapport qualité-prix optimal'],
    populer: true,
    ordre: 2,
    actif: true,
  },
  {
    code: 'PREMIUM 30J',
    nom: 'Premium',
    dureeJours: 30,
    prix: 9000,
    accroche: 'La visibilité maximale pour louer ou vendre vite',
    description: 'Un mois complet de mise en avant prioritaire : position en tête de liste, badge "Premium", affichage en rotation sur la page d\'accueil.',
    idealPour: ['Bien haut de gamme', 'Vente rapide', 'Visibilité maximale'],
    populer: false,
    ordre: 3,
    actif: true,
  },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Début du seeding formPrenium...\n');

    for (const f of FORMULES) {
      const existing = await prisma.formulePremium.findUnique({
        where: { code: f.code },
      });

      if (!existing) {
        await prisma.formulePremium.create({ data: f });
        console.log(`  ✔ Créé : ${f.nom} (${f.dureeJours}j — ${f.prix.toLocaleString()} FCFA)`);
      } else {
        await prisma.formulePremium.update({
          where: { code: f.code },
          data: {
            nom: f.nom,
            dureeJours: f.dureeJours,
            prix: f.prix,
            accroche: f.accroche,
            description: f.description,
            idealPour: f.idealPour,
            populer: f.populer,
            ordre: f.ordre,
            actif: f.actif,
          },
        });
        console.log(`  ↺ Mis à jour : ${f.nom}`);
      }
    }

    console.log('\n🎉 Seeding formPrenium terminé avec succès !');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Erreur lors du seeding :', err);
  process.exit(1);
});
