/**
 * ScoutIQ - GRID Stats Schema Layer
 * 
 * Schema-safe GraphQL queries that match the real GRID Stats API schema.
 * Prevents invalid field errors by only requesting valid fields.
 * 
 * GRID Stats Schema (validated):
 * - teamStatistics / playerStatistics with:
 *   - id
 *   - aggregationSeriesIds
 *   - series { count kills { sum avg min max } }
 *   - game { count wins { value percentage } }
 *   - segment { type count deaths { sum avg min max } }
 */

import { statsQuery } from './client';

// ============================================================================
// Safe Team Statistics Query
// ============================================================================

export const SAFE_TEAM_STATS_QUERY = `
  query TeamStats($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      id
      aggregationSeriesIds
      series {
        count
        kills {
          sum
          avg
          min
          max
        }
      }
      game {
        count
        wins {
          value
          percentage
        }
      }
      segment {
        type
        count
        deaths {
          sum
          avg
          min
          max
        }
      }
    }
  }
`;

// Minimal fallback query (in case some fields are removed in future)
export const MINIMAL_TEAM_STATS_QUERY = `
  query TeamStats($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      id
      series {
        count
      }
      game {
        count
        wins {
          value
          percentage
        }
      }
    }
  }
`;

// ============================================================================
// Safe Player Statistics Query
// ============================================================================

export const SAFE_PLAYER_STATS_QUERY = `
  query PlayerStats($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      id
      aggregationSeriesIds
      series {
        count
        kills {
          sum
          avg
          min
          max
        }
        assists {
          sum
          avg
          min
          max
        }
        deaths {
          sum
          avg
          min
          max
        }
      }
      game {
        count
        wins {
          value
          percentage
        }
      }
      segment {
        type
        count
        deaths {
          sum
          avg
          min
          max
        }
      }
    }
  }
`;

// Minimal fallback query for players
export const MINIMAL_PLAYER_STATS_QUERY = `
  query PlayerStats($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      id
      series {
        count
        kills {
          avg
        }
        deaths {
          avg
        }
        assists {
          avg
        }
      }
      game {
        count
        wins {
          value
          percentage
        }
      }
    }
  }
`;

// ============================================================================
// Query Builder Functions
// ============================================================================

/**
 * Build team statistics query with optional field selection
 */
export function buildTeamStatsQuery(options: {
  includeKills?: boolean;
  includeDeaths?: boolean;
  includeSegment?: boolean;
} = {}): string {
  const { includeKills = true, includeDeaths = true, includeSegment = true } = options;
  
  let query = `
    query TeamStats($teamId: ID!, $filter: TeamStatisticsFilter!) {
      teamStatistics(teamId: $teamId, filter: $filter) {
        id
        aggregationSeriesIds
        series {
          count
  `;
  
  if (includeKills) {
    query += `
        kills {
          sum
          avg
          min
          max
        }
    `;
  }
  
  query += `
      }
      game {
        count
        wins {
          value
          percentage
        }
      }
  `;
  
  if (includeSegment) {
    query += `
      segment {
        type
        count
        deaths {
          sum
          avg
          min
          max
        }
      }
    `;
  }
  
  query += `
      }
    }
  `;
  
  return query;
}

/**
 * Build player statistics query with optional field selection
 */
export function buildPlayerStatsQuery(options: {
  includeKills?: boolean;
  includeDeaths?: boolean;
  includeAssists?: boolean;
  includeSegment?: boolean;
} = {}): string {
  const { includeKills = true, includeDeaths = true, includeAssists = true, includeSegment = true } = options;
  
  let query = `
    query PlayerStats($playerId: ID!, $filter: PlayerStatisticsFilter!) {
      playerStatistics(playerId: $playerId, filter: $filter) {
        id
        aggregationSeriesIds
        series {
          count
  `;
  
  if (includeKills) {
    query += `
        kills {
          sum
          avg
          min
          max
        }
    `;
  }
  
  if (includeDeaths) {
    query += `
        deaths {
          sum
          avg
          min
          max
        }
    `;
  }
  
  if (includeAssists) {
    query += `
        assists {
          sum
          avg
          min
          max
        }
    `;
  }
  
  query += `
      }
      game {
        count
        wins {
          value
          percentage
        }
      }
  `;
  
  if (includeSegment) {
    query += `
      segment {
        type
        count
        deaths {
          sum
          avg
          min
          max
        }
      }
    `;
  }
  
  query += `
      }
    }
  `;
  
  return query;
}

// ============================================================================
// Default Filters
// ============================================================================

export const DEFAULT_STATS_FILTER = {
  timeWindow: "LAST_3_MONTHS" as const,
};

export const DEFAULT_PLAYER_FILTER = {
  timeWindow: "LAST_3_MONTHS" as const,
};

// ============================================================================
// Query Execution Helpers
// ============================================================================

/**
 * Execute safe team stats query with fallback
 */
export async function queryTeamStatsSafe(
  teamId: string,
  filter: object = DEFAULT_STATS_FILTER
): Promise<any> {
  try {
    return await statsQuery(SAFE_TEAM_STATS_QUERY, { teamId, filter });
  } catch (error) {
    console.warn(`[STATS SCHEMA] Safe query failed for team ${teamId}, trying minimal...`);
    // Fallback to minimal query
    try {
      return await statsQuery(MINIMAL_TEAM_STATS_QUERY, { teamId, filter });
    } catch (minimalError) {
      console.error(`[STATS SCHEMA] Minimal query also failed for team ${teamId}`);
      throw minimalError;
    }
  }
}

/**
 * Execute safe player stats query with fallback
 */
export async function queryPlayerStatsSafe(
  playerId: string,
  filter: object = DEFAULT_PLAYER_FILTER
): Promise<any> {
  try {
    return await statsQuery(SAFE_PLAYER_STATS_QUERY, { playerId, filter });
  } catch (error) {
    console.warn(`[STATS SCHEMA] Safe query failed for player ${playerId}, trying minimal...`);
    // Fallback to minimal query
    try {
      return await statsQuery(MINIMAL_PLAYER_STATS_QUERY, { playerId, filter });
    } catch (minimalError) {
      console.error(`[STATS SCHEMA] Minimal query also failed for player ${playerId}`);
      throw minimalError;
    }
  }
}

export default {
  SAFE_TEAM_STATS_QUERY,
  MINIMAL_TEAM_STATS_QUERY,
  SAFE_PLAYER_STATS_QUERY,
  MINIMAL_PLAYER_STATS_QUERY,
  buildTeamStatsQuery,
  buildPlayerStatsQuery,
  DEFAULT_STATS_FILTER,
  DEFAULT_PLAYER_FILTER,
  queryTeamStatsSafe,
  queryPlayerStatsSafe,
};

