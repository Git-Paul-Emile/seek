import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

// Types de bail supprimés lors de la migration vers 3 types (Habitation / Commercial / Mixte)
const OBSOLETE_TYPE_BAILS = ['Meublé', 'Non meublé', 'Saisonnier'];

const SIGNATURE_TABLE = `
<br/>
<table style="width:100%;border-collapse:collapse;margin-top:32px;">
  <tr>
    <td style="width:50%;padding:20px;text-align:center;border:1px solid #ccc;vertical-align:top;">
      <p style="font-weight:bold;">Signature du Bailleur</p>
      <p style="font-size:12px;color:#555;">(Lu et approuvé)</p>
      <br/><br/><br/>
      <p><strong>{{prenom_bailleur}} {{nom_bailleur}}</strong></p>
    </td>
    <td style="width:50%;padding:20px;text-align:center;border:1px solid #ccc;vertical-align:top;">
      <p style="font-weight:bold;">Signature du Preneur</p>
      <p style="font-size:12px;color:#555;">(Lu et approuvé)</p>
      <br/><br/><br/>
      <p><strong>{{prenom_locataire}} {{nom_locataire}}</strong></p>
    </td>
  </tr>
</table>`;

const TEMPLATES: readonly {
  titre: string;
  typeBail: string | null;
  ordre: number;
  contenu: string;
}[] = [
  // ─── Habitation ─────────────────────────────────────────────────────────────
  {
    titre: "Contrat de location (Usage d'Habitation)",
    typeBail: "Habitation",
    ordre: 1,
    contenu: `<div style="font-family:'Times New Roman',Times,serif;padding:32px;max-width:800px;margin:0 auto;line-height:1.6;">
<h1 style="text-align:center;font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:24px;">
  CONTRAT DE LOCATION (Usage d'Habitation)
</h1>

<p><strong>Entre les soussignés :</strong></p>
<p>M./Mme <strong>{{prenom_bailleur}} {{nom_bailleur}}</strong>, Propriétaire demeurant à <strong>{{adresse_bien}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Bailleur</strong> »</p>

<p><strong>ET</strong></p>
<p>M./Mme <strong>{{prenom_locataire}} {{nom_locataire}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Preneur</strong> »</p>

<p style="text-align:center;margin:16px 0;"><em>Il a été convenu et arrêté ce qui suit :</em></p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 1 : DÉSIGNATION DU BIEN</h2>
<p>Le Bailleur donne en location au Preneur, qui accepte, le bien suivant :</p>
<ul>
  <li>Quartier : <strong>{{quartier}}</strong></li>
  <li>Ville : <strong>{{ville}}</strong></li>
</ul>
<p>Le bien est destiné exclusivement à usage d'habitation.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 2 : DURÉE</h2>
<p>Le présent contrat est conclu pour une durée de <strong>{{duree}}</strong>, prenant effet le <strong>{{date_debut}}</strong>
et expirant le <strong>{{date_fin}}</strong>.<br/>
Le contrat est renouvelable par tacite reconduction (devient à durée indéterminée).</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 3 : LOYER</h2>
<p>Le loyer mensuel est fixé à : <strong>{{loyer}} Francs CFA</strong>, payable <strong>{{frequence_paiement}}</strong>.<br/>
Ce loyer est établi conformément aux dispositions du Décret n° 2023-447 sur la baisse des loyers.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 4 : CAUTION ET AVANCE (Loi 2023)</h2>
<p>Le Preneur verse :</p>
<ul>
  <li>Une caution de : <strong>{{caution}} FCFA</strong> (Maximum 2 mois de loyer)</li>
  <li>Une avance de : 1 mois de loyer</li>
</ul>
<p>Le total versé à l'entrée ne peut excéder 3 mois de loyer.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 5 : ÉTAT DES LIEUX</h2>
<p>Un état des lieux contradictoire est établi à l'entrée et à la sortie.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 6 : RÉSILIATION</h2>
<ul>
  <li>Par le Preneur : préavis de <strong>3 mois</strong>.</li>
  <li>Par le Bailleur : préavis de <strong>6 mois</strong> pour motif légitime (reprise, travaux, faute du preneur).</li>
</ul>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 7 : ÉLECTION DE DOMICILE</h2>
<p>Les parties élisent domicile à leurs adresses respectives.</p>

<p style="margin-top:32px;">Fait à <strong>{{region}}</strong>, le <strong>{{date_signature}}</strong><br/>
En deux exemplaires originaux.</p>
${SIGNATURE_TABLE}
</div>`,
  },

  // ─── Commercial ─────────────────────────────────────────────────────────────
  {
    titre: "Contrat de location (Usage Commercial)",
    typeBail: "Commercial",
    ordre: 2,
    contenu: `<div style="font-family:'Times New Roman',Times,serif;padding:32px;max-width:800px;margin:0 auto;line-height:1.6;">
<h1 style="text-align:center;font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:24px;">
  CONTRAT DE LOCATION (Usage Commercial)
</h1>

<p><strong>Entre les soussignés :</strong></p>
<p>M./Mme/Société <strong>{{prenom_bailleur}} {{nom_bailleur}}</strong>, Propriétaire demeurant à <strong>{{adresse_bien}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Bailleur</strong> »</p>

<p><strong>ET</strong></p>
<p>M./Mme/Société <strong>{{prenom_locataire}} {{nom_locataire}}</strong>,
exerçant la profession de : <strong>{{profession_locataire}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Preneur</strong> »</p>

<p style="text-align:center;margin:16px 0;"><em>Il a été convenu et arrêté ce qui suit :</em></p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 1 : DÉSIGNATION ET DESTINATION</h2>
<p>Le Bailleur donne en location les locaux situés à : <strong>{{adresse_bien}}</strong>,
Quartier <strong>{{quartier}}</strong>, <strong>{{ville}}</strong>.<br/>
Le bien est destiné exclusivement à usage commercial / professionnel pour l'activité de :
<strong>{{profession_locataire}}</strong> (Régime OHADA).</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 2 : DURÉE</h2>
<p>Le présent bail est conclu à compter du <strong>{{date_debut}}</strong>.<br/>
Conformément à l'Acte Uniforme de l'OHADA, le droit au renouvellement est acquis après 2 ans d'exploitation.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 3 : LOYER</h2>
<p>Le loyer mensuel est fixé à : <strong>{{loyer}} Francs CFA</strong>.<br/>
Payable d'avance, <strong>{{frequence_paiement}}</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 4 : CAUTION</h2>
<p>Le Preneur verse une caution de : <strong>{{caution}} FCFA</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 5 : CLAUSE RÉSOLUTOIRE</h2>
<p>À défaut de paiement d'un seul terme de loyer, le bail sera résilié de plein droit un (1) mois
après une mise en demeure par exploit d'huissier restée infructueuse.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 6 : CESSION ET SOUS-LOCATION</h2>
<p>La sous-location est interdite. La cession du bail est régie par les articles 118 et suivants
de l'Acte Uniforme de l'OHADA.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 7 : ENREGISTREMENT</h2>
<p>Le présent contrat doit être enregistré à la DGID. Les droits sont à la charge du Preneur.</p>

<p style="margin-top:32px;">Fait à <strong>{{region}}</strong>, le <strong>{{date_signature}}</strong><br/>
En deux exemplaires originaux.</p>
${SIGNATURE_TABLE}
</div>`,
  },

  // ─── Mixte ───────────────────────────────────────────────────────────────────
  {
    titre: "Contrat de location (Usage Mixte)",
    typeBail: "Mixte",
    ordre: 3,
    contenu: `<div style="font-family:'Times New Roman',Times,serif;padding:32px;max-width:800px;margin:0 auto;line-height:1.6;">
<h1 style="text-align:center;font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:24px;">
  CONTRAT DE LOCATION (Usage Mixte)
</h1>

<p><strong>Entre les soussignés :</strong></p>
<p>M./Mme <strong>{{prenom_bailleur}} {{nom_bailleur}}</strong>, Propriétaire demeurant à <strong>{{adresse_bien}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Bailleur</strong> »</p>

<p><strong>ET</strong></p>
<p>M./Mme <strong>{{prenom_locataire}} {{nom_locataire}}</strong>,
exerçant la profession de <strong>{{profession_locataire}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Preneur</strong> »</p>

<p style="text-align:center;margin:16px 0;"><em>Il a été convenu et arrêté ce qui suit :</em></p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 1 : DÉSIGNATION ET DESTINATION MIXTE</h2>
<p>Le Bailleur donne en location les locaux situés à : <strong>{{adresse_bien}}</strong>,
Quartier <strong>{{quartier}}</strong>, <strong>{{ville}}</strong>.</p>
<p>Le bien est destiné conjointement à :</p>
<ol>
  <li>L'habitation principale du Preneur.</li>
  <li>L'exercice de l'activité professionnelle de : <strong>{{profession_locataire}}</strong></li>
</ol>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 2 : DURÉE</h2>
<p>Le présent contrat est conclu à compter du <strong>{{date_debut}}</strong>
et se termine le <strong>{{date_fin}}</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 3 : LOYER</h2>
<p>Le loyer mensuel global est fixé à : <strong>{{loyer}} Francs CFA</strong>.<br/>
Il est payable <strong>{{frequence_paiement}}</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 4 : CAUTION ET AVANCE (Loi 2023)</h2>
<p>Le Preneur verse une caution de : <strong>{{caution}} FCFA</strong> (Maximum 2 mois)
et une avance de 1 mois de loyer.<br/>
Le régime des baux à usage d'habitation s'applique pour le plafonnement des garanties.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 5 : CHARGES</h2>
<p>Le Preneur supporte les charges de SENELEC, SEN'EAU et les taxes liées à son activité professionnelle.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 6 : RÉSILIATION</h2>
<ul>
  <li>Préavis du Preneur : <strong>3 mois</strong>.</li>
  <li>Préavis du Bailleur : <strong>6 mois</strong> (soumis aux conditions du COCC pour l'habitation).</li>
</ul>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 7 : ENREGISTREMENT</h2>
<p>Le contrat sera enregistré à la DGID conformément à la législation fiscale en vigueur.</p>

<p style="margin-top:32px;">Fait à <strong>{{region}}</strong>, le <strong>{{date_signature}}</strong><br/>
En deux exemplaires originaux.</p>
${SIGNATURE_TABLE}
</div>`,
  },

  // ─── Générique (fallback) ────────────────────────────────────────────────────
  {
    titre: "Contrat de location (Modèle générique)",
    typeBail: null,
    ordre: 99,
    contenu: `<div style="font-family:'Times New Roman',Times,serif;padding:32px;max-width:800px;margin:0 auto;line-height:1.6;">
<h1 style="text-align:center;font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:24px;">
  CONTRAT DE LOCATION
</h1>

<p><strong>Entre les soussignés :</strong></p>
<p>M./Mme <strong>{{prenom_bailleur}} {{nom_bailleur}}</strong>, Propriétaire ;<br/>
Ci-après dénommé(e) « <strong>Le Bailleur</strong> »</p>

<p><strong>ET</strong></p>
<p>M./Mme <strong>{{prenom_locataire}} {{nom_locataire}}</strong> ;<br/>
Ci-après dénommé(e) « <strong>Le Preneur</strong> »</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 1 : DÉSIGNATION</h2>
<p>Bien situé à : <strong>{{adresse_bien}}</strong>, <strong>{{quartier}}</strong>, <strong>{{ville}}</strong>.<br/>
Type de bail : <strong>{{type_bail}}</strong></p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 2 : DURÉE</h2>
<p>Du <strong>{{date_debut}}</strong> au <strong>{{date_fin}}</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 3 : LOYER</h2>
<p>Loyer : <strong>{{loyer}} FCFA</strong>, payable <strong>{{frequence_paiement}}</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 4 : CAUTION</h2>
<p>Caution : <strong>{{caution}} FCFA</strong>.</p>

<h2 style="font-size:14px;font-weight:bold;margin-top:20px;">ARTICLE 5 : RÉSILIATION</h2>
<p>Préavis : selon accord entre les parties, conformément au COCC.</p>

<p style="margin-top:32px;">Fait à <strong>{{region}}</strong>, le <strong>{{date_signature}}</strong><br/>
En deux exemplaires originaux.</p>
${SIGNATURE_TABLE}
</div>`,
  },
];

export class ModeleContratSeeder implements Seeder {
  readonly name = 'ModeleContratSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    // Supprimer les anciens modèles devenus obsolètes (types fusionnés en "Habitation")
    const deleted = await prisma.modeleContrat.deleteMany({
      where: { typeBail: { in: OBSOLETE_TYPE_BAILS } },
    });
    if (deleted.count > 0) {
      console.log(`  🗑  Supprimé ${deleted.count} modèle(s) obsolète(s) (${OBSOLETE_TYPE_BAILS.join(', ')})`);
    }

    for (const t of TEMPLATES) {
      const existing = await prisma.modeleContrat.findFirst({
        where: { titre: t.titre },
      });
      if (!existing) {
        await prisma.modeleContrat.create({ data: { ...t, actif: true } });
        console.log(`  ✔ Créé : ${t.titre}`);
      } else {
        await prisma.modeleContrat.update({
          where: { id: existing.id },
          data: { contenu: t.contenu, typeBail: t.typeBail, ordre: t.ordre, actif: true },
        });
        console.log(`  ↺ Mis à jour : ${t.titre}`);
      }
    }
  }
}
