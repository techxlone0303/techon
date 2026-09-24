/**
 * ScoutIQ - GRID Statistics API Client
 * 
 * Statistics API for team and player performance metrics
 * Endpoint: https://api-op.grid.gg/statistics-feed/graphql
 */

import axios from "axios";

const STATS_URL = "https://api-op.grid.gg/statistics-feed/graphql";

export interface StatsQueryOptions {
  query: string;
  variables?: Record<string, any>;
}

export interface StatsResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

/**
 * Get delay until next request is allowed
 */
function getRequestDelay(): number {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const delay = Math.max(0, MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  lastRequestTime = now + delay;
  return delay;
}

export async function statsQuery<T = any>(options: StatsQueryOptions): Promise<T>;
export async function statsQuery<T = any>(query: string, variables?: Record<string, any>): Promise<T>;
export async function statsQuery<T = any>(
  queryOrOptions: string | StatsQueryOptions,
  variables?: Record<string, any>
): Promise<T> {
  const query = typeof queryOrOptions === 'string' ? queryOrOptions : queryOrOptions.query;
  const vars = typeof queryOrOptions === 'string' ? variables : queryOrOptions.variables;

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

  try {
    // Rate limiting: wait before making request
    const delay = getRequestDelay();
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const res = await axios.post(
      STATS_URL,
      { query, variables: vars },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.GRID_API_KEY!,
        },
        timeout: 30000,
      }
    );

    if (res.data.errors && res.data.errors.length > 0) {
      console.error(`[GRID STATS ERROR] ${timestamp}`, JSON.stringify(res.data.errors));
      throw new Error(`GRID Stats API Error: ${res.data.errors[0].message}`);
    }

    console.log(`[GRID STATS SUCCESS] ${timestamp} | query_length=${query.length}`);
    return res.data.data;
  } catch (err: any) {
    const errorMessage = err.response?.data?.errors?.[0]?.message || err.message;
    
    // Check for rate limit
    if (err.response?.status === 429 || errorMessage?.includes("rate limit")) {
      console.warn(`[GRID STATS RATE LIMITED] ${timestamp} - waiting 5s`);
      // Wait 5 seconds and return null (graceful degradation)
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error(`GRID Stats API rate limited`);
    }
    
    console.error(`[GRID STATS FATAL ERROR] ${timestamp} | ${errorMessage}`);
    throw err;
  }
}

// Helper for executing GraphQL queries with error handling
export async function executeStatsQuery<T>(
  queryName: string,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  console.log(`[GRID STATS REQUEST] Executing query: ${queryName}`);
  return statsQuery<T>(query, variables);
}

