/**
 * ScoutIQ - GRID Central Data API Client
 * 
 * Central Data API for tournaments, series, organizations, teams, and players
 * Endpoint: https://api-op.grid.gg/central-data/graphql
 */

import axios from "axios";

const CENTRAL_URL = "https://api-op.grid.gg/central-data/graphql";

export interface CentralQueryOptions {
  query: string;
  variables?: Record<string, any>;
}

export interface CentralResponse<T = any> {
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

export async function centralQuery<T = any>(options: CentralQueryOptions): Promise<T>;
export async function centralQuery<T = any>(query: string, variables?: Record<string, any>): Promise<T>;
export async function centralQuery<T = any>(
  queryOrOptions: string | CentralQueryOptions,
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
      CENTRAL_URL,
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
      console.error(`[GRID CENTRAL ERROR] ${timestamp}`, JSON.stringify(res.data.errors));
      throw new Error(`GRID Central API Error: ${res.data.errors[0].message}`);
    }

    console.log(`[GRID CENTRAL SUCCESS] ${timestamp} | query_length=${query.length}`);
    return res.data.data;
  } catch (err: any) {
    const errorMessage = err.response?.data?.errors?.[0]?.message || err.message;
    
    // Check for rate limit
    if (err.response?.status === 429 || errorMessage?.includes("rate limit")) {
      console.warn(`[GRID CENTRAL RATE LIMITED] ${timestamp} - waiting 5s`);
      // Wait 5 seconds and return null (graceful degradation)
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error(`GRID Central API rate limited`);
    }
    
    console.error(`[GRID CENTRAL FATAL ERROR] ${timestamp} | ${errorMessage}`);
    throw err;
  }
}

// Helper for executing GraphQL queries with error handling
export async function executeCentralQuery<T>(
  queryName: string,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  console.log(`[GRID CENTRAL REQUEST] Executing query: ${queryName}`);
  return centralQuery<T>(query, variables);
}

