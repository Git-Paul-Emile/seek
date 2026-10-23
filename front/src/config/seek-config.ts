/**
 * Configuration SEEK - Application de gestion immobilière au Sénégal
 * 
 * Ce fichier contient tous les paramètres et configurations de l'application:
 * - Devise (XOF - Franc CFA Ouest Africain)
 * - Zones géographiques du Sénégal
 * - Modèles d'emails/SMS
 * - Règles de colocation
 * - Modèles de contrats sénégalais
 */

// ==================== DEVISE ====================
export const CURRENCY = {
  code: 'XOF',
  name: 'Franc CFA (BCEAO)',
  symbol: 'FCFA',
  locale: 'fr-SN',
  decimals: 0,
  format: (amount: number): string => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(amount);
  },
};

// ==================== ZONES GÉOGRAPHIQUES DU SÉNÉGAL ====================
export const GEOGRAPHIC_ZONES = {
  regions: [
    {
      id: 'dakar',
      name: 'Dakar',
      departments: [
        { id: 'dakar', name: 'Dakar' },
        { id: 'guédiawaye', name: 'Guédiawaye' },
        { id: 'pikine', name: 'Pikine' },
        { id: 'rufisque', name: 'Rufisque' },
        { id: 'keur-massar', name: 'Keur Massar' },
      ],
    },
    {
      id: 'thies',
      name: 'Thiès',
      departments: [
        { id: 'thies', name: 'Thiès' },
        { id: 'mbour', name: 'Mbour' },
        { id: 'tivaouane', name: 'Tivaouane' },
      ],
    },
    {
      id: 'saint-louis',
      name: 'Saint-Louis',
      departments: [
        { id: 'saint-louis', name: 'Saint-Louis' },
        { id: 'dagana', name: 'Dagana' },
        { id: 'podor', name: 'Podor' },
      ],
    },
    {
      id: 'kaolack',
      name: 'Kaolack',
      departments: [
        { id: 'kaolack', name: 'Kaolack' },
        { id: 'bambey', name: 'Bambey' },
        { id: 'guinguineo', name: 'Guinguinéo' },
      ],
    },
    {
      id: 'fatick',
      name: 'Fatick',
      departments: [
        { id: 'fatick', name: 'Fatick' },
        { id: 'foundiougne', name: 'Foundiougne' },
        { id: 'goswirie', name: 'Gossswirie' },
      ],
    },
    {
      id: 'louga',
      name: 'Louga',
      departments: [
        { id: 'louga', name: 'Louga' },
        { id: 'kébémer', name: 'Kébémer' },
        { id: 'linguere', name: 'Linguère' },
      ],
    },
    {
      id: 'tambacounda',
      name: 'Tambacounda',
      departments: [
        { id: 'tambacounda', name: 'Tambacounda' },
        { id: 'bakel', name: 'Bakel' },
        { id: 'goudiry', name: 'Goudiry' },
        { id: 'koumpentoum', name: 'Koumpentoum' },
      ],
    },
    {
      id: 'kolda',
      name: 'Kolda',
      departments: [
        { id: 'kolda', name: 'Kolda' },
        { id: 'medina-yoro-foulah', name: 'Médina Yoro Foulah' },
        { id: ' Vélingara', name: 'Vélingara' },
      ],
    },
    {
      id: 'ziguinchor',
      name: 'Ziguinchor',
      departments: [
        { id: 'ziguinchor', name: 'Ziguinchor' },
        { id: 'bignona', name: 'Bignona' },
        { id: 'oussouye', name: 'Oussouye' },
      ],
    },
    {
      id: 'sédhiou',
      name: 'Sédhiou',
      departments: [
        { id: 'sédhiou', name: 'Sédhiou' },
        { id: 'bounkiling', name: 'Bounkiling' },
        { id: 'goudomp', name: 'Goudomp' },
      ],
    },
    {
      id: 'matam',
      name: 'Matam',
      departments: [
        { id: 'matam', name: 'Matam' },
        { id: 'kanel', name: 'Kanel' },
        { id: 'ranérou-ferlo', name: 'Ranérou Ferlo' },
      ],
    },
    {
      id: 'kédougou',
      name: 'Kédougou',
      departments: [
        { id: 'kédougou', name: 'Kédougou' },
        { id: 'salémata', name: 'Salémata' },
        { id: 'saraya', name: 'Saraya' },
      ],
    },
  ],
};

// ==================== MODÈLES D'EMAILS/SMS ====================
export const EMAIL_TEMPLATES = {
  paymentReminder: {
    subject: 'Rappel de paiement - Loyer {month} {year}',
    body: `Bonjour {tenant_name},

Nous vous rappelons que votre loyer du mois de {month} {year} arrive à échéance.

Cordialement,
{agency_name}`,
  },
  paymentConfirmation: {
    subject: 'Confirmation de paiement - Reçu #{receipt_number}',
    body: `Bonjour {tenant_name},

Nous avons bien reçu votre paiement de {amount}.

Cordialement,
{agency_name}`,
  },
};

export const SMS_TEMPLATES = {
  paymentReminder: `SEEK: Rappel - loyer {amount} échoit le {due_date}.`,
  paymentConfirmation: `SEEK: Paiement reçu! Reçu #{receipt_number} pour {amount}.`,
};

// ==================== PARAMÈTRES GÉNÉRAUX ====================
export const GENERAL_SETTINGS = {
  defaultWhatsApp: '+221 77 123 45 67',
  defaultEmail: 'contact@seek.sn',
  openingHours: {
    weekdays: '08:30 - 18:00',
    saturday: '09:00 - 13:00',
    sunday: 'Fermé',
  },
  sla: {
    paymentConfirmation: '24h',
    generalInquiry: '48h',
    urgentIssues: '4h',
  },
  processingFees: {
    tenant: 10000,
    landlord: 0,
  },
  agencyCommission: {
    rental: 0.05,
    sale: 0.03,
  },
};

// ==================== EXPORT COMPLET ====================
export const SEEK_CONFIG = {
  currency: CURRENCY,
  geographicZones: GEOGRAPHIC_ZONES,
  emailTemplates: EMAIL_TEMPLATES,
  smsTemplates: SMS_TEMPLATES,
  generalSettings: GENERAL_SETTINGS,
};

export default SEEK_CONFIG;
