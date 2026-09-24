/**
 * GRID Schema Map - Maps query intent to correct GRID endpoint
 * 
 * Detects whether a GraphQL query targets:
 * - central-data (teams, players, tournaments, series, organizations)
 * - stats-feed (teamStatistics, playerStatistics)
 */

// ============================================================================
// Keywords that indicate central-data queries
// ============================================================================

const CENTRAL_KEYWORDS = [
  'teams(',
  'team(id:',
  'team(',
  'players(',
  'player(id:',
  'player(',
  'tournaments(',
  'tournament(id:',
  'tournament(',
  'series(',
  'series(id:',
  'organizations(',
  'organization(id:',
  'organization(',
  'games(',
  'game(id:',
  'game(',
  'members',
  'roster',
  'teams{',
  'teams {',
  'team{',
  'team {',
  'players{',
  'players {',
  'player{',
  'player {',
  'tournaments{',
  'tournaments {',
  'series{',
  'series {',
];

// ============================================================================
// Keywords that indicate stats-feed queries
// ============================================================================

const STATS_KEYWORDS = [
  'teamStatistics',
  'teamStatistics(',
  'teamStatistics{',
  'teamStatistics {',
  'playerStatistics',
  'playerStatistics(',
  'playerStatistics{',
  'playerStatistics {',
  'teamStats',
  'playerStats',
  'Stats(',
  'Stats{',
  'Stats {',
];

// ============================================================================
// Endpoint Detection
// ============================================================================

export type GridEndpoint = 'central' | 'stats';

/**
 * Detect which GRID endpoint a query should target
 * 
 * @param query - GraphQL query string
 * @returns 'central' | 'stats'
 */
export function detectGridEndpoint(query: string): GridEndpoint {
  const normalizedQuery = query.toLowerCase();
  
  // Check for stats keywords first (more specific)
  for (const keyword of STATS_KEYWORDS) {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      console.log("[GRID ROUTER] Detected stats-feed endpoint (keyword: " + keyword + ")");
      return 'stats';
    }
  }
  
  // Check for central keywords
  for (const keyword of CENTRAL_KEYWORDS) {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      console.log("[GRID ROUTER] Detected central-data endpoint (keyword: " + keyword + ")");
      return 'central';
    }
  }
  
  // Default to central-data for unknown queries
  console.log("[GRID ROUTER] No specific keywords found, defaulting to central-data");
  return 'central';
}

/**
 * Detect if a query contains multiple operations
 * Returns the operation type if identifiable
 */
export function detectOperationType(query: string): 'query' | 'mutation' | 'subscription' {
  const normalized = query.trim();
  if (normalized.startsWith('mutation')) return 'mutation';
  if (normalized.startsWith('subscription')) return 'subscription';
  return 'query';
}

/**
 * Extract operation name from query if present
 */
export function extractOperationName(query: string): string | null {
  const match = query.match(/^\s*(?:query|mutation|subscription)\s+(\w+)/i);
  return match ? match[1] : null;
}

export default {
  detectGridEndpoint,
  detectOperationType,
  extractOperationName,
};

