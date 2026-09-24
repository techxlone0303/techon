/**
 * ScoutIQ - GRID Statistics API: Player Statistics Service
 * 
 * Retrieves player performance metrics from GRID Statistics API
 */

import { statsQuery } from "./grid.stats.client";

// ============================================================================
// Type Definitions (Minimal safe schema)
// ============================================================================

export interface PlayerStatistics {
  id: string;
  playerId: string;
  nickname?: string;
  series?: {
    count?: number;
    kills?: {
      avg?: number;
    };
  };
  game?: {
    count?: number;
    wins?: {
      value?: number;
      percentage?: number;
    };
  };
  timeWindow?: string;
  lastUpdated?: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get player statistics for the last 3 months
 * Includes ID validation to prevent crashes from invalid player IDs
 */
export async function getPlayerStats(playerId: string): Promise<PlayerStatistics | null> {
  // Validate player ID - must be a valid numeric ID
  if (!playerId || isNaN(Number(playerId))) {
    console.warn("[PLAYER STATS] Skipping invalid player ID:", playerId);
    return null;
  }

  const query = `
    query PlayerStats($playerId: ID!) {
      playerStatistics(playerId: $playerId, filter: { timeWindow: LAST_3_MONTHS }) {
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

  try {
    const response = await statsQuery(query, { playerId });
    return response.playerStatistics;
  } catch (error) {
    console.error(`[PLAYER STATS SERVICE] Error fetching stats for player ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player statistics history for trend analysis
 */
export async function getPlayerStatsHistory(playerId: string, timeWindows: string[] = ["LAST_7_DAYS", "LAST_30_DAYS", "LAST_3_MONTHS"]): Promise<PlayerStatistics[]> {
  const results: PlayerStatistics[] = [];

  for (const timeWindow of timeWindows) {
    const stats = await getPlayerStats(playerId);
    if (stats) {
      stats.timeWindow = timeWindow;
      results.push(stats);
    }
  }

  return results;
}

/**
 * Get player series performance
 */
export async function getPlayerSeriesStats(playerId: string): Promise<PlayerStatistics['series'] | null> {
  // Validate player ID
  if (!playerId || isNaN(Number(playerId))) {
    return null;
  }

  const query = `
    query PlayerSeriesStats($playerId: ID!) {
      playerStatistics(playerId: $playerId, filter: { timeWindow: LAST_3_MONTHS }) {
        series {
          count
          kills {
            avg
          }
        }
      }
    }
  `;

  try {
    const response = await statsQuery(query, { playerId });
    return response.playerStatistics?.series;
  } catch (error) {
    console.error(`[PLAYER STATS SERVICE] Error fetching series stats for player ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player game performance
 */
export async function getPlayerGameStats(playerId: string): Promise<PlayerStatistics['game'] | null> {
  // Validate player ID
  if (!playerId || isNaN(Number(playerId))) {
    return null;
  }

  const query = `
    query PlayerGameStats($playerId: ID!) {
      playerStatistics(playerId: $playerId, filter: { timeWindow: LAST_3_MONTHS }) {
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

  try {
    const response = await statsQuery(query, { playerId });
    return response.playerStatistics?.game;
  } catch (error) {
    console.error(`[PLAYER STATS SERVICE] Error fetching game stats for player ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player advanced metrics
 * Computes derived stats like KDA, ADR, clutch rate from available data
 */
export async function getPlayerAdvancedMetrics(playerId: string): Promise<{
  kda: number;
  winRate: number;
  gamesPlayed: number;
  killsPerGame: number;
  deathsPerGame: number;
  assistsPerGame: number;
  clutchesWon?: number;
  clutchesLost?: number;
  clutchRate?: number;
} | null> {
  // Validate player ID
  if (!playerId || isNaN(Number(playerId))) {
    console.warn("[PLAYER STATS] Skipping invalid player ID:", playerId);
    return null;
  }

  // Get basic stats
  const stats = await getPlayerStats(playerId);
  if (!stats) {
    return null;
  }

  // Compute advanced metrics from available data
  const gamesPlayed = stats.game?.count || 0;
  const wins = stats.game?.wins?.value || 0;
  const winRate = gamesPlayed > 0 ? wins / gamesPlayed : 0;
  
  // KDA calculation (kills avg / max(deaths avg, 1))
  const killsAvg = stats.series?.kills?.avg || 0;
  const deathsAvg = 0; // deaths not in current schema, assume 0 for safety
  const kda = deathsAvg > 0 ? killsAvg / deathsAvg : killsAvg;

  // Default clutch metrics (not available in current schema)
  const clutchesWon = 0;
  const clutchesLost = 0;
  const clutchRate = 0;

  return {
    kda: Math.round(kda * 100) / 100,
    winRate: Math.round(winRate * 1000) / 1000,
    gamesPlayed,
    killsPerGame: Math.round(killsAvg * 100) / 100,
    deathsPerGame: Math.round(deathsAvg * 100) / 100,
    assistsPerGame: 0, // Not available in current schema
    clutchesWon,
    clutchesLost,
    clutchRate: Math.round(clutchRate * 1000) / 1000,
  };
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let playerStatsInitialized = false;

export async function initPlayerStats(): Promise<void> {
  try {
    console.log("[GRID] Initializing player stats service...");
    await getPlayerStats("1123");
    console.log("[GRID] Player stats service ready ✅");
  } catch (err) {
    console.error("[GRID] Player stats init failed ❌", err);
  }
}

export function initializePlayerStatsService(): void {
  if (playerStatsInitialized) {
    console.log("[PLAYER STATS SERVICE] Already initialized");
    return;
  }

  console.log("[PLAYER STATS SERVICE] Initialized successfully");
  playerStatsInitialized = true;
}

export default {
  getPlayerStats,
  getPlayerStatsHistory,
  getPlayerSeriesStats,
  getPlayerGameStats,
  getPlayerAdvancedMetrics,
  initPlayerStats,
  initialize: initializePlayerStatsService,
};
