/**
 * GRID Super Router v2 - Main Router Brain
 * 
 * Intelligently routes GraphQL queries to the correct GRID endpoint
 * while providing caching, normalization, and error handling.
 * 
 * Architecture:
 * 
 * Scout Engine → Super Router → Safe Executor → GRID Clients
 *                      ↓
 *                   Normalizer
 *                      ↓
 *                Returns: { raw, normalized, meta }
 * 
 * Existing code continues to work without any dependency on the router.
 * New features can optionally use superGridQuery for enhanced reliability.
 */

import { safeGridQuery, SafeExecutorResult, clearQueryCache, getCacheStats } from "./grid.safe.executor";
import { normalizeResponse, normalizeTeam, normalizePlayer, createTeamProfile, NormalizedEntity } from "./grid.normalizer";
import { detectGridEndpoint, GridEndpoint } from "./grid.schema.map";

// ============================================================================
// Types
// ============================================================================

export interface SuperRouterOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  normalize?: boolean;
  useCache?: boolean;
}

export interface SuperRouterResult<T = any> {
  // Raw response from GRID
  raw: T | null;
  
  // Normalized intelligence layer
  normalized: NormalizedEntity | NormalizedEntity[] | null;
  
  // Metadata about the query execution
  meta: {
    endpointUsed: GridEndpoint;
    success: boolean;
    latency: number;
    attempts: number;
    cached: boolean;
    error?: string;
    timestamp: string;
  };
}

// ============================================================================
// Main Super Query Function
// ============================================================================

/**
 * Execute a GRID query through the Super Router
 * 
 * This is the main entry point for the Super Router.
 * It automatically:
 * 1. Detects the correct endpoint (central or stats)
 * 2. Executes with retry logic and rate-limit protection
 * 3. Normalizes the response into a unified format
 * 4. Returns both raw and normalized data
 * 
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param options - Router options
 * @returns SuperRouterResult with raw, normalized, and meta data
 */
export async function superGridQuery<T = any>(
  query: string,
  variables?: Record<string, any>,
  options: SuperRouterOptions = {}
): Promise<SuperRouterResult<T>> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log("[GRID ROUTER] superGridQuery called (options: " + JSON.stringify(options) + ")");
  
  // Execute query through safe executor
  const execResult = await safeGridQuery<T>(query, variables, {
    maxRetries: options.maxRetries ?? 2,
    retryDelay: options.retryDelay ?? 1000,
    timeout: options.timeout ?? 30000,
    fallbackOnError: true,
  });
  
  // Normalize response if requested
  let normalized: NormalizedEntity | NormalizedEntity[] | null = null;
  if (options.normalize !== false && execResult.success && execResult.data) {
    try {
      normalized = normalizeResponse(execResult.data, execResult.data);
      console.log("[GRID ROUTER] Response normalized successfully");
    } catch (error: any) {
      console.warn("[GRID ROUTER] Normalization failed: " + error.message);
    }
  }
  
  const latency = Date.now() - startTime;
  
  return {
    raw: execResult.data ?? null,
    normalized,
    meta: {
      endpointUsed: execResult.endpoint,
      success: execResult.success,
      latency,
      attempts: execResult.attempts,
      cached: execResult.cached,
      error: execResult.error,
      timestamp,
    },
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get a team by ID with normalization
 */
export async function getTeamById(teamId: string): Promise<SuperRouterResult> {
  const query = "query GetTeamById($id: ID!) { team(id: $id) { id name nameShortened logoUrl colorPrimary colorSecondary } }";
  return superGridQuery(query, { id: teamId }, { normalize: true });
}

/**
 * Get a player by ID with normalization
 */
export async function getPlayerById(playerId: string): Promise<SuperRouterResult> {
  const query = "query GetPlayerById($id: ID!) { player(id: $id) { id nickname title { name } team { baseInfo { name } } } }";
  return superGridQuery(query, { id: playerId }, { normalize: true });
}

/**
 * Search teams by name with fuzzy matching
 */
export async function searchTeams(name: string, limit: number = 10): Promise<SuperRouterResult> {
  // Note: GRID doesn't support fuzzy search, so we use exact match
  const query = "query SearchTeams($name: String!, $first: Int!) { teams(filter: { name: { equals: $name } }, first: $first) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } } }";
  return superGridQuery(query, { name, first: limit }, { normalize: true });
}

/**
 * Get team statistics with normalization
 */
export async function getTeamStatistics(teamId: string): Promise<SuperRouterResult> {
  const query = "query TeamStats($teamId: ID!) { teamStatistics(teamId: $teamId) { id teamId game { count wins { value percentage } } series { count kills { avg } deaths { avg } assists { avg } } } }";
  return superGridQuery(query, { teamId }, { normalize: true });
}

/**
 * Get player statistics with normalization
 */
export async function getPlayerStatistics(playerId: string): Promise<SuperRouterResult> {
  const query = "query PlayerStats($playerId: ID!) { playerStatistics(playerId: $playerId) { id playerId game { count wins { value percentage } } series { count kills { avg } deaths { avg } assists { avg } } } }";
  return superGridQuery(query, { playerId }, { normalize: true });
}

/**
 * Get teams by game with normalization
 */
export async function getTeamsByGame(gameId: string, limit: number = 20): Promise<SuperRouterResult> {
  const query = "query GetTeamsByGame($gameId: ID!, $first: Int!) { game(id: $gameId) { teams(first: $first) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } } } }";
  return superGridQuery(query, { gameId, first: limit }, { normalize: true });
}

/**
 * Get players by team with normalization
 */
export async function getPlayersByTeam(teamId: string): Promise<SuperRouterResult> {
  const query = "query GetPlayersByTeam($teamId: ID!) { team(id: $teamId) { members { id nickname } } }";
  return superGridQuery(query, { teamId }, { normalize: true });
}

// ============================================================================
// Cache Management
// ============================================================================

export { clearQueryCache, getCacheStats };

// ============================================================================
// Team Alias Resolver
// ============================================================================

export const TEAM_ALIASES: Record<string, string> = {
  'c9': 'Cloud9',
  'cloud9': 'Cloud9',
  'g2': 'G2 Esports',
  'g2 esports': 'G2 Esports',
  'fnc': 'Fnatic',
  'fnatic': 'Fnatic',
  't1': 'T1',
  'drx': 'DRX',
  'loud': 'LOUD',
  'eg': 'Evil Geniuses',
  'evil geniuses': 'Evil Geniuses',
  'sen': 'Sentinels',
  'sentinels': 'Sentinels',
  '100t': '100 Thieves',
  '100 thieves': '100 Thieves',
  'navi': 'NAVI',
  'natus vincere': 'NAVI',
  'tl': 'Team Liquid',
  'team liquid': 'Team Liquid',
  'mibr': 'MIBR',
  'kru': 'KRU Esports',
  'kru esports': 'KRU Esports',
  'zeta': 'ZETA DIVISION',
  'zeta division': 'ZETA DIVISION',
  'prx': 'Paper Rex',
  'paper rex': 'Paper Rex',
  'talon': 'Talon Esports',
  'talon esports': 'Talon Esports',
};

/**
 * Resolve team alias to canonical name
 */
export function resolveTeamAlias(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check aliases
  if (TEAM_ALIASES[normalized]) {
    return TEAM_ALIASES[normalized];
  }
  
  // Check if it's already a canonical name
  const values = Object.values(TEAM_ALIASES);
  const matchingValue = values.find(v => v.toLowerCase() === name.toLowerCase());
  if (matchingValue) {
    return matchingValue;
  }
  
  // Return original if no alias found
  return name;
}

/**
 * Get all known team aliases
 */
export function getAllTeamAliases(): Record<string, string> {
  return { ...TEAM_ALIASES };
}

// ============================================================================
// Export
// ============================================================================

export default {
  superGridQuery,
  getTeamById,
  getPlayerById,
  searchTeams,
  getTeamStatistics,
  getPlayerStatistics,
  getTeamsByGame,
  getPlayersByTeam,
  clearQueryCache,
  getCacheStats,
  resolveTeamAlias,
  getAllTeamAliases,
  TEAM_ALIASES,
};

