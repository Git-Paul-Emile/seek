/**
 * Service de cache en mémoire pour optimiser les requêtes fréquentes
 * Utilise un cache LRU avec TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number; // en millisecondes

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes par défaut
    this.defaultTTL = defaultTTL;
  }

  /**
   * Récupère une valeur du cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Définit une valeur dans le cache
   */
  set(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Supprime toutes les entrées dont la clé commence par le préfixe donné
   */
  deleteMany(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache pour les dernières annonces (TTL: 3 minutes)
export const dernieresAnnoncesCache = new MemoryCache<any[]>(3 * 60 * 1000);

// Cache pour les résultats de recherche (TTL: 2 minutes)
export const rechercheCache = new MemoryCache<{
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>(2 * 60 * 1000);

// Cache pour les lieux distincts (TTL: 10 minutes)
export const lieuxCache = new MemoryCache<{
  quartiers: { nom: string; ville: string }[];
  villes: string[];
}>(10 * 60 * 1000);

// Nettoyage périodique du cache (toutes les 5 minutes)
setInterval(() => {
  dernieresAnnoncesCache.cleanup();
  rechercheCache.cleanup();
  lieuxCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Invalide le cache lorsqu'une nouvelle annonce est publiée ou modifiée
 */
export const invalidateAnnoncesCache = (): void => {
  dernieresAnnoncesCache.clear();
  rechercheCache.clear();
};

/**
 * Invalide le cache des recherches (garder les dernières annonces)
 */
export const invalidateRechercheCache = (): void => {
  rechercheCache.clear();
};
