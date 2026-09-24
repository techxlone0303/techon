/**
 * ScoutIQ - GRID Statistics API: Team Statistics Service
 * 
 * Retrieves team performance metrics from GRID Statistics API
 */

import { statsQuery, executeStatsQuery } from "./grid.stats.client";

// ============================================================================
// Type Definitions (Minimal safe schema)
// ============================================================================

export interface TeamStatistics {
  id: string;
  teamId: string;
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

export interface TeamStatsResponse {
  teamStatistics: TeamStatistics;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get team statistics for the last 3 months (minimal safe query)
 */
export async function getTeamStats(teamId: string): Promise<TeamStatistics | null> {
  const query = `
    query TeamStats($teamId: ID!) {
      teamStatistics(
        teamId: $teamId,
        filter: { timeWindow: LAST_3_MONTHS }
      ) {
        id
        series {
          count
          kills {
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

  try {
    const response = await executeStatsQuery<TeamStatsResponse>(
      "TeamStats",
      query,
      { teamId }
    );
    return response.teamStatistics;
  } catch (error) {
    console.error(`[TEAM STATS SERVICE] Error fetching stats for team ${teamId}:`, error);
    return null;
  }
}

/**
 * Get team statistics history for trend analysis
 */
export async function getTeamStatsHistory(teamId: string, timeWindows: string[] = ["LAST_7_DAYS", "LAST_30_DAYS", "LAST_3_MONTHS"]): Promise<TeamStatistics[]> {
  const results: TeamStatistics[] = [];

  for (const timeWindow of timeWindows) {
    const stats = await getTeamStats(teamId);
    if (stats) {
      stats.timeWindow = timeWindow;
      results.push(stats);
    }
  }

  return results;
}

/**
 * Get team series performance
 */
export async function getTeamSeriesStats(teamId: string): Promise<TeamStatistics['series'] | null> {
  const query = `
    query TeamSeriesStats($teamId: ID!) {
      teamStatistics(
        teamId: $teamId,
        filter: { timeWindow: LAST_3_MONTHS }
      ) {
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
    const response = await executeStatsQuery<{ teamStatistics: { series: TeamStatistics['series'] } }>(
      "TeamSeriesStats",
      query,
      { teamId }
    );
    return response.teamStatistics.series;
  } catch (error) {
    console.error(`[TEAM STATS SERVICE] Error fetching series stats for team ${teamId}:`, error);
    return null;
  }
}

/**
 * Get team game performance
 */
export async function getTeamGameStats(teamId: string): Promise<TeamStatistics['game'] | null> {
  const query = `
    query TeamGameStats($teamId: ID!) {
      teamStatistics(
        teamId: $teamId,
        filter: { timeWindow: LAST_3_MONTHS }
      ) {
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
    const response = await executeStatsQuery<{ teamStatistics: { game: TeamStatistics['game'] } }>(
      "TeamGameStats",
      query,
      { teamId }
    );
    return response.teamStatistics.game;
  } catch (error) {
    console.error(`[TEAM STATS SERVICE] Error fetching game stats for team ${teamId}:`, error);
    return null;
  }
}

/**
 * Get team head-to-head against another team
 */
export async function getTeamHeadToHead(teamIdA: string, teamIdB: string): Promise<{
  teamA: TeamStatistics['game'];
  teamB: TeamStatistics['game'];
  matchesPlayed: number;
  teamAWins: number;
  teamBWins: number;
} | null> {
  const query = `
    query TeamHeadToHead($teamIdA: ID!, $teamIdB: ID!) {
      headToHead(teamIdA: $teamIdA, teamIdB: $teamIdB) {
        teamAStats {
          wins
          losses
          winRate
        }
        teamBStats {
          wins
          losses
          winRate
        }
        matchesPlayed
      }
    }
  `;

  try {
    const response = await executeStatsQuery<any>(
      "TeamHeadToHead",
      query,
      { teamIdA, teamIdB }
    );
    return response.headToHead;
  } catch (error) {
    console.error(`[TEAM STATS SERVICE] Error fetching head-to-head:`, error);
    return null;
  }
}

/**
 * Get team performance on specific maps
 */
export async function getTeamMapStats(teamId: string): Promise<Array<{
  mapId: string;
  mapName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}>> {
  const query = `
    query TeamMapStats($teamId: ID!) {
      teamStatistics(
        teamId: $teamId,
        filter: { timeWindow: LAST_3_MONTHS }
      ) {
        mapStats {
          mapId
          mapName
          gamesPlayed
          wins
          losses
          winRate
        }
      }
    }
  `;

  try {
    const response = await executeStatsQuery<{ teamStatistics: { mapStats: any[] } }>(
      "TeamMapStats",
      query,
      { teamId }
    );
    return response.teamStatistics.mapStats || [];
  } catch (error) {
    console.error(`[TEAM STATS SERVICE] Error fetching map stats for team ${teamId}:`, error);
    return [];
  }
}

/**
 * Get team performance by game mode
 */
export async function getTeamModeStats(teamId: string): Promise<Array<{
  modeId: string;
  modeName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}>> {
  const query = `
    query TeamModeStats($teamId: ID!) {
      teamStatistics(
        teamId: $teamId,
        filter: { timeWindow: LAST_3_MONTHS }
      ) {
        modeStats {
          modeId
          modeName
          gamesPlayed
          wins
          losses
          winRate
        }
      }
    }
  `;

  try {
    const response = await executeStatsQuery<{ teamStatistics: { modeStats: any[] } }>(
      "TeamModeStats",
      query,
      { teamId }
    );
    return response.teamStatistics.modeStats || [];
  } catch (error) {
    console.error(`[TEAM STATS SERVICE] Error fetching mode stats for team ${teamId}:`, error);
    return [];
  }
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let teamStatsInitialized = false;

export async function initTeamStats(): Promise<void> {
  try {
    console.log("[GRID] Initializing team stats service...");
    await getTeamStats("83");
    console.log("[GRID] Team stats service ready ✅");
  } catch (err) {
    console.error("[GRID] Team stats init failed ❌", err);
  }
}

export function initializeTeamStatsService(): void {
  if (teamStatsInitialized) {
    console.log("[TEAM STATS SERVICE] Already initialized");
    return;
  }

  console.log("[TEAM STATS SERVICE] Initialized successfully");
  teamStatsInitialized = true;
}

export default {
  getTeamStats,
  getTeamStatsHistory,
  getTeamSeriesStats,
  getTeamGameStats,
  getTeamHeadToHead,
  getTeamMapStats,
  getTeamModeStats,
  initTeamStats,
  initialize: initializeTeamStatsService,
};

