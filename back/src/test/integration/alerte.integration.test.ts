import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { creerAlerte, creerAlerteCompte } from '../../controllers/alerte.controller.js';

// Mock du client Prisma
vi.mock('../../generated/prisma/client.js', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => {
      return {
        alerte: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          count: vi.fn(),
        },
        comptePublic: {
          findUnique: vi.fn(),
        },
      };
    }),
  };
});

// Création d'une application de test express
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Route publique
  app.post('/api/alertes', creerAlerte);

  // Route authentifiée (on simule le middleware d'authentification)
  const mockAuthenticate = (req: any, _res: any, next: any) => {
    req.comptePublic = { id: 'test-compte-id' };
    next();
  };
  app.post('/api/alertes/compte', mockAuthenticate, creerAlerteCompte);

  return app;
};

describe('Alertes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('POST /api/alertes (Public)', () => {
    it('devrait rejeter la création si le budget min est supérieur au budget max', async () => {
      const response = await request(app)
        .post('/api/alertes')
        .send({
          telephone: '771234567',
          prixMin: 500000,
          prixMax: 300000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le budget minimum ne peut pas être supérieur au budget maximum');
    });

    it('devrait accepter la création si le budget min est inférieur ou égal au budget max', async () => {
      const response = await request(app)
        .post('/api/alertes')
        .send({
          telephone: '771234567',
          prixMin: 300000,
          prixMax: 500000,
        });

      // Le test va échouer plus loin car prisma est mocké et retourne undefined pour findFirst
      // mais le statut ne devrait pas être 400
      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/alertes/compte (Compte)', () => {
    it('devrait rejeter la création si le budget min est supérieur au budget max', async () => {
      const response = await request(app)
        .post('/api/alertes/compte')
        .send({
          prixMin: 500000,
          prixMax: 300000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le budget minimum ne peut pas être supérieur au budget maximum');
    });

    it('devrait accepter la création si le budget min est inférieur ou égal au budget max', async () => {
      const response = await request(app)
        .post('/api/alertes/compte')
        .send({
          prixMin: 300000,
          prixMax: 500000,
        });

      expect(response.status).not.toBe(400);
    });
  });
});
