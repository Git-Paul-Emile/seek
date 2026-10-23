import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Configuration globale pour les tests
beforeAll(() => {
  // Configuration avant tous les tests
});

afterAll(() => {
  // Nettoyage après tous les tests
});

afterEach(() => {
  // Nettoyage après chaque test
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Mock global pour console.error en environnement de test
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
