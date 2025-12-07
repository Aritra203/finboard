import { apiCache } from './cache';

export interface FieldInfo {
  path: string;
  label: string;
  type: string;
  value: unknown;
  isArray: boolean;
  arrayLength?: number;
}

export interface FetchOptions {
  useCache?: boolean;
  cacheTTL?: number;
  retryOnRateLimit?: boolean;
  maxRetries?: number;
}

export interface FetchResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
  rateLimited?: boolean;
  retryAfter?: number;
}

export function extractFields(obj: unknown, prefix = '', maxDepth = 5): FieldInfo[] {
  const fields: FieldInfo[] = [];
  
  if (maxDepth <= 0) return fields;
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (Array.isArray(obj)) {
    fields.push({
      path: prefix || 'root',
      label: prefix || 'root',
      type: 'array',
      value: obj,
      isArray: true,
      arrayLength: obj.length,
    });
    
    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
      const nestedFields = extractFields(obj[0], prefix ? `${prefix}[0]` : '[0]', maxDepth - 1);
      fields.push(...nestedFields);
    }
    return fields;
  }
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const type = Array.isArray(value) ? 'array' : typeof value;
      
      fields.push({
        path,
        label: key,
        type,
        value,
        isArray: Array.isArray(value),
        arrayLength: Array.isArray(value) ? value.length : undefined,
      });
      
      if (typeof value === 'object' && value !== null) {
        const nestedFields = extractFields(value, path, maxDepth - 1);
        fields.push(...nestedFields);
      }
    }
  }
  
  return fields;
}

export function getValueByPath(obj: unknown, path: string): unknown {
  if (!path || !obj) return undefined;
  
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export async function testApiConnection(url: string): Promise<{ success: boolean; data?: unknown; error?: string; fieldCount?: number }> {
  try {
    // Check if rate limited
    const rateLimitCheck = apiCache.isRateLimited(url);
    if (rateLimitCheck.limited) {
      return {
        success: false,
        error: `Rate limited. Retry in ${rateLimitCheck.retryAfter} seconds`,
      };
    }

    const response = await fetch(url);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      apiCache.setRateLimited(url, retryAfter);
      return {
        success: false,
        error: `Rate limit exceeded. Retry in ${retryAfter} seconds`,
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return { 
      success: true, 
      data,
      fieldCount: Object.keys(data).length 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect to API' 
    };
  }
}

export async function fetchWithCache<T = unknown>(
  url: string, 
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { 
    useCache = true, 
    cacheTTL = 30000, 
    retryOnRateLimit = false,
    maxRetries = 3 
  } = options;

  // Check rate limit first
  const rateLimitCheck = apiCache.isRateLimited(url);
  if (rateLimitCheck.limited) {
    return {
      success: false,
      error: `Rate limited. Retry in ${rateLimitCheck.retryAfter} seconds`,
      rateLimited: true,
      retryAfter: rateLimitCheck.retryAfter,
    };
  }

  // Check cache
  if (useCache) {
    const cached = apiCache.get<T>(url);
    if (cached !== null) {
      return {
        success: true,
        data: cached,
        fromCache: true,
      };
    }
  }

  // Fetch with retry logic
  let lastError: string = 'Unknown error';
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        apiCache.setRateLimited(url, retryAfter);
        
        if (retryOnRateLimit && retries < maxRetries - 1) {
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter * 1000, 5000)));
          retries++;
          continue;
        }

        return {
          success: false,
          error: `Rate limit exceeded. Retry in ${retryAfter} seconds`,
          rateLimited: true,
          retryAfter,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as T;

      // Cache the result
      if (useCache) {
        apiCache.set(url, data, cacheTTL);
      }

      return {
        success: true,
        data,
        fromCache: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Failed to fetch data';
      retries++;
      
      if (retries < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

export function clearCacheForUrl(url: string): void {
  apiCache.clear();
}

export function getCacheStats() {
  return apiCache.getStats();
}
