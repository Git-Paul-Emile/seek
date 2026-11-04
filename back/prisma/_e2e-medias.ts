// Test de bout en bout temporaire : brouillon + 3 photos + soumission via la file medias-bien.
import 'dotenv/config';
import sharp from 'sharp';
import { PrismaClient } from '../src/generated/prisma/client.js';

const API = 'http://localhost:8000/api';
const EMAIL = 'hippolyte.lambert37@gmail.com';
const p = new PrismaClient();

const proprio = await p.proprietaire.findFirst({ where: { email: EMAIL }, select: { id: true } });
const brouillonExistant = await p.bien.findFirst({ where: { proprietaireId: proprio!.id, statutAnnonce: 'BROUILLON' } });
if (brouillonExistant) throw new Error(`Brouillon déjà présent (${brouillonExistant.id}) : test annulé pour ne pas l'écraser`);

const login = await fetch(`${API}/owner/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifiant: EMAIL, password: 'Proprio@2024!' }),
});
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
console.log('login', login.status);

const [types, transactions, statuts, quartier] = await Promise.all([
  p.typeLogement.findFirst({ where: { slug: 'appartement' } }),
  p.typeTransaction.findFirst({ where: { slug: 'location' } }),
  p.statutBien.findFirst(),
  p.quartier.findFirst({ include: { ville: { include: { pays: true } } } }),
]);

const couleurs = ['#2d6a4f', '#e9c46a', '#264653'];
const form = new FormData();
form.append('data', JSON.stringify({
  titre: 'Test file medias-bien',
  description: 'Annonce de test pour la file BullMQ.',
  typeLogementId: types!.id,
  typeTransactionId: transactions!.id,
  statutBienId: statuts!.id,
  pays: quartier!.ville.pays.nom,
  region: quartier!.ville.nom,
  quartier: quartier!.nom,
  latitude: quartier!.latitude,
  longitude: quartier!.longitude,
  prix: 150000,
  frequencePaiement: 'mensuel',
  surface: 60,
  soumettre: true,
}));
for (const [i, couleur] of couleurs.entries()) {
  const image = await sharp({ create: { width: 800, height: 600, channels: 3, background: couleur } }).jpeg().toBuffer();
  form.append('photos', new Blob([image], { type: 'image/jpeg' }), `test-${i}.jpg`);
}

const t0 = Date.now();
const envoi = await fetch(`${API}/biens/draft`, { method: 'POST', headers: { cookie }, body: form });
const reponse = await envoi.json();
console.log('draft', envoi.status, `${Date.now() - t0} ms`, reponse.message, 'traitementId', reponse.data?.traitementId);
if (!reponse.data?.traitementId) { await p.$disconnect(); process.exit(1); }

let etat = '';
for (let i = 0; i < 120 && etat !== 'termine' && etat !== 'echec'; i++) {
  const r = await (await fetch(`${API}/biens/traitements/${reponse.data.traitementId}`, { headers: { cookie } })).json();
  etat = r.data?.etat;
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)} s`, etat, JSON.stringify(r.data?.progression), r.data?.erreur ?? '');
  await new Promise((res) => setTimeout(res, 1000));
}

const bien = await p.bien.findUnique({ where: { id: reponse.data.id }, select: { id: true, statutAnnonce: true, photos: true } });
console.log('bien', bien!.statutAnnonce, bien!.photos.length, 'photos', bien!.photos.map((u) => u.split('/').pop()));
console.log('BIEN_ID', bien!.id);

// Accès refusé à un autre propriétaire : traitement introuvable
const autre = await fetch(`${API}/biens/traitements/${reponse.data.traitementId}`);
console.log('sans session', autre.status);
await p.$disconnect();
