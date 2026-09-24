/**
 * GRID Safe Executor - Safe execution wrapper with retry logic
 * 
 * Wraps existing GRID clients with:
 * - Retry logic (max 2 retries)
 * - Graceful error handling
 * - Fallback to safe mode if query fails
 * - Rate-limit protection
 * - Logging
 */

import { centralQuery } from "../central/grid.central.client";
import { statsQuery } from "../stats/grid.stats.client";
import { detectGridEndpoint, GridEndpoint } from "./grid.schema.map";

// ============================================================================
// Types
// ============================================================================

export interface SafeExecutorOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  fallbackOnError?: boolean;
}

export interface SafeExecutorResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  endpoint: GridEndpoint;
  attempts: number;
  latency: number;
  cached: boolean;
}

// ============================================================================
// In-memory cache for rate-limit protection
// ============================================================================

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const queryCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache
const RATE_LIMIT_DELAY = 200; // 200ms between requests

let lastRequestTime = 0;

// ============================================================================
// Safe Executor
// ============================================================================

/**
 * Execute a GRID query with safe retry logic
 * 
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param options - Execution options
 * @returns SafeExecutorResult with data, metadata, and error info
 */
export async function safeGridQuery<T = any>(
  query: string,
  variables?: Record<string, any>,
  options: SafeExecutorOptions = {}
): Promise<SafeExecutorResult<T>> {
  const startTime = Date.now();
  const maxRetries = options.maxRetries ?? 2;
  const retryDelay = options.retryDelay ?? 1000;
  const timeout = options.timeout ?? 30000;
  
  // Detect endpoint
  const endpoint = detectGridEndpoint(query);
  
  // Check cache first
  const cacheKey = generateCacheKey(query, variables, endpoint);
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log("[GRID ROUTER] Cache hit for query (endpoint: " + endpoint + ")");
    return {
      success: true,
      data: cached.data,
      endpoint,
      attempts: 0,
      latency: Date.now() - startTime,
      cached: true,
    };
  }
  
  // Rate limiting
  await applyRateLimit();
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log("[GRID ROUTER] Executing query (attempt " + attempt + "/" + (maxRetries + 1) + ", endpoint: " + endpoint + ")");
      
      const data = await executeWithTimeout(
        () => endpoint === 'stats' ? statsQuery<T>(query, variables) : centralQuery<T>(query, variables),
        timeout
      );
      
      // Cache successful response
      queryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL_MS,
      });
      
      const latency = Date.now() - startTime;
      console.log("[GRID ROUTER] Query successful (latency: " + latency + "ms, endpoint: " + endpoint + ")");
      
      return {
        success: true,
        data,
        endpoint,
        attempts: attempt,
        latency,
        cached: false,
      };
      
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || 'Unknown error';
      
      console.warn("[GRID ROUTER] Query attempt " + attempt + " failed: " + errorMessage);
      
      // Check for rate limit
      if (errorMessage.includes('rate limit') || errorMessage.includes('ENHANCE_YOUR_CAMOV') || error.response?.status === 429) {
        console.warn("[GRID ROUTER] Rate limited, waiting before retry...");
        await applyRateLimit(5000); // Wait 5s on rate limit
        continue;
      }
      
      // Don't retry on validation errors
      if (errorMessage.includes('ValidationError') || errorMessage.includes('BAD_REQUEST')) {
        console.error("[GRID ROUTER] Validation error, not retrying: " + errorMessage);
        break;
      }
      
      // Retry on other errors
      if (attempt <= maxRetries) {
        console.log("[GRID ROUTER] Waiting " + retryDelay + "ms before retry...");
        await sleep(retryDelay);
      }
    }
  }
  
  // All retries exhausted
  const latency = Date.now() - startTime;
  console.error("[GRID ROUTER] Query failed after " + (maxRetries + 1) + " attempts: " + (lastError?.message || 'Unknown'));
  
  // Fallback mode - return safe empty response
  if (options.fallbackOnError !== false) {
    console.log("[GRID ROUTER] Returning fallback empty response");
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      endpoint,
      attempts: maxRetries + 1,
      latency,
      cached: false,
    };
  }
  
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    endpoint,
    attempts: maxRetries + 1,
    latency,
    cached: false,
  };
}

/**
 * Execute query with timeout
 */
async function executeWithTimeout<T>(
  promise: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Apply rate limiting
 */
async function applyRateLimit(delayMs: number = RATE_LIMIT_DELAY): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const delay = Math.max(0, delayMs - timeSinceLastRequest);
  lastRequestTime = now + delay;
  
  if (delay > 0) {
    await sleep(delay);
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate cache key for query
 */
function generateCacheKey(
  query: string,
  variables?: Record<string, any>,
  endpoint?: string
): string {
  const queryHash = simpleHash(query);
  const varsHash = variables ? simpleHash(JSON.stringify(variables)) : '0';
  return endpoint + ':' + queryHash + ':' + varsHash;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clear query cache
 */
export function clearQueryCache(): void {
  queryCache.clear();
  console.log("[GRID ROUTER] Query cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; oldestEntry: number | null } {
  let oldestEntry: number | null = null;
  
  for (const entry of queryCache.values()) {
    if (oldestEntry === null || entry.timestamp < oldestEntry) {
      oldestEntry = entry.timestamp;
    }
  }
  
  return {
    size: queryCache.size,
    oldestEntry,
  };
}

export default {
  safeGridQuery,
  clearQueryCache,
  getCacheStats,
};

