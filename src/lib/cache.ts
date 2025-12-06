// API Response Cache with TTL support

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RateLimitInfo {
  url: string;
  retryAfter: number;
  hitAt: number;
}

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private defaultTTL: number = 30000; // 30 seconds default

  /**
   * Get cached data if valid
   */
  get<T>(url: string): T | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(url);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(url: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    this.cache.set(url, {
      data,
      timestamp: now,
      expiresAt: now + (ttlMs || this.defaultTTL),
    });
  }

  /**
   * Check if URL is rate limited
   */
  isRateLimited(url: string): { limited: boolean; retryAfter?: number } {
    const domain = this.extractDomain(url);
    const info = this.rateLimits.get(domain);
    
    if (!info) return { limited: false };

    const now = Date.now();
    const timeLeft = info.retryAfter - (now - info.hitAt);

    if (timeLeft <= 0) {
      this.rateLimits.delete(domain);
      return { limited: false };
    }

    return { limited: true, retryAfter: Math.ceil(timeLeft / 1000) };
  }

  /**
   * Mark URL domain as rate limited
   */
  setRateLimited(url: string, retryAfterSeconds: number = 60): void {
    const domain = this.extractDomain(url);
    this.rateLimits.set(domain, {
      url: domain,
      retryAfter: retryAfterSeconds * 1000,
      hitAt: Date.now(),
    });
  }

  /**
   * Clear rate limit for a domain
   */
  clearRateLimit(url: string): void {
    const domain = this.extractDomain(url);
    this.rateLimits.delete(domain);
  }

  /**
   * Get cache statistics
   */
  getStats(): { cacheSize: number; rateLimitedDomains: string[] } {
    return {
      cacheSize: this.cache.size,
      rateLimitedDomains: Array.from(this.rateLimits.keys()),
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Extract domain from URL for rate limiting
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cleanup interval (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => apiCache.cleanup(), 5 * 60 * 1000);
}
