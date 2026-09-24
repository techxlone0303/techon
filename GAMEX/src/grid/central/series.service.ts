/**
 * ScoutIQ - GRID Central Data: Series Service
 * 
 * Retrieves series/match information from GRID Central Data API
 */

import { centralQuery, executeCentralQuery } from "./grid.central.client";

// ============================================================================
// Type Definitions (Minimal safe schema)
// ============================================================================

export interface SeriesNode {
  id: string;
  startTimeScheduled: string;
  title?: {
    nameShortened?: string;
  };
  tournament?: {
    nameShortened?: string;
  };
  format?: {
    nameShortened?: string;
  };
  teams?: {
    baseInfo?: Array<{
      name?: string;
    }>;
  };
}

export interface SeriesResponse {
  allSeries: {
    edges: Array<{ node: SeriesNode }>;
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface SeriesDetailsResponse {
  series: SeriesNode;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all series (minimal safe query)
 */
export async function getSeries(limit: number = 10): Promise<SeriesNode[]> {
  const query = `
    query GetSeries($first: Int!) {
      allSeries(first: $first) {
        edges {
          node {
            id
            startTimeScheduled
            title {
              nameShortened
            }
            tournament {
              nameShortened
            }
            format {
              nameShortened
            }
            teams {
              baseInfo {
                name
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<SeriesResponse>(
      "GetSeries",
      query,
      { first: limit }
    );
    return response.allSeries.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[SERIES SERVICE] Error fetching series:", error);
    return [];
  }
}

/**
 * Get series by ID with full details
 */
export async function getSeriesById(seriesId: string): Promise<SeriesNode | null> {
  const query = `
    query GetSeriesById($id: ID!) {
      series(id: $id) {
        id
        startTimeScheduled
        title {
          nameShortened
        }
        tournament {
          nameShortened
        }
        format {
          nameShortened
        }
        teams {
          baseInfo {
            name
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<SeriesDetailsResponse>(
      "GetSeriesById",
      query,
      { id: seriesId }
    );
    return response.series;
  } catch (error) {
    console.error(`[SERIES SERVICE] Error fetching series ${seriesId}:`, error);
    return null;
  }
}

/**
 * Get series by tournament
 */
export async function getSeriesByTournament(tournamentId: string, limit: number = 20): Promise<SeriesNode[]> {
  const query = `
    query GetSeriesByTournament($tournamentId: ID!, $first: Int!) {
      tournament(id: $tournamentId) {
        series(first: $first) {
          edges {
            node {
              id
              startTimeScheduled
              title {
                nameShortened
              }
              format {
                nameShortened
              }
              teams {
                baseInfo {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ tournament: { series: { edges: Array<{ node: SeriesNode }> } } }>(
      "GetSeriesByTournament",
      query,
      { tournamentId, first: limit }
    );
    return response.tournament.series.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[SERIES SERVICE] Error fetching series for tournament ${tournamentId}:`, error);
    return [];
  }
}

/**
 * Get series by team
 */
export async function getSeriesByTeam(teamId: string, limit: number = 20): Promise<SeriesNode[]> {
  const query = `
    query GetSeriesByTeam($teamId: ID!, $first: Int!) {
      team(id: $teamId) {
        series(first: $first) {
          edges {
            node {
              id
              startTimeScheduled
              title {
                nameShortened
              }
              tournament {
                nameShortened
              }
              format {
                nameShortened
              }
              teams {
                baseInfo {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ team: { series: { edges: Array<{ node: SeriesNode }> } } }>(
      "GetSeriesByTeam",
      query,
      { teamId, first: limit }
    );
    return response.team.series.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[SERIES SERVICE] Error fetching series for team ${teamId}:`, error);
    return [];
  }
}

/**
 * Get upcoming series
 */
export async function getUpcomingSeries(limit: number = 10): Promise<SeriesNode[]> {
  const query = `
    query GetUpcomingSeries($first: Int!) {
      allSeries(first: $first, filter: { startTime: { after: "now" } }) {
        edges {
          node {
            id
            startTimeScheduled
            title {
              nameShortened
            }
            tournament {
              nameShortened
            }
            format {
              nameShortened
            }
            teams {
              baseInfo {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<SeriesResponse>(
      "GetUpcomingSeries",
      query,
      { first: limit }
    );
    return response.allSeries.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[SERIES SERVICE] Error fetching upcoming series:", error);
    return [];
  }
}

/**
 * Get recent series
 */
export async function getRecentSeries(limit: number = 10): Promise<SeriesNode[]> {
  const query = `
    query GetRecentSeries($first: Int!) {
      allSeries(first: $first) {
        edges {
          node {
            id
            startTimeScheduled
            title {
              nameShortened
            }
            tournament {
              nameShortened
            }
            format {
              nameShortened
            }
            teams {
              baseInfo {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<SeriesResponse>(
      "GetRecentSeries",
      query,
      { first: limit }
    );
    return response.allSeries.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[SERIES SERVICE] Error fetching recent series:", error);
    return [];
  }
}

/**
 * Get live series (currently in progress)
 */
export async function getLiveSeries(limit: number = 10): Promise<SeriesNode[]> {
  const query = `
    query GetLiveSeries($first: Int!) {
      allSeries(first: $first, filter: { status: LIVE }) {
        edges {
          node {
            id
            startTimeScheduled
            title {
              nameShortened
            }
            tournament {
              nameShortened
            }
            format {
              nameShortened
            }
            teams {
              baseInfo {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<SeriesResponse>(
      "GetLiveSeries",
      query,
      { first: limit }
    );
    return response.allSeries.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[SERIES SERVICE] Error fetching live series:", error);
    return [];
  }
}

/**
 * Get series by game
 */
export async function getSeriesByGame(gameId: string, limit: number = 10): Promise<SeriesNode[]> {
  const query = `
    query GetSeriesByGame($gameId: ID!, $first: Int!) {
      game(id: $gameId) {
        series(first: $first) {
          edges {
            node {
              id
              startTimeScheduled
              title {
                nameShortened
              }
              tournament {
                nameShortened
              }
              format {
                nameShortened
              }
              teams {
                baseInfo {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ game: { series: { edges: Array<{ node: SeriesNode }> } } }>(
      "GetSeriesByGame",
      query,
      { gameId, first: limit }
    );
    return response.game.series.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[SERIES SERVICE] Error fetching series for game ${gameId}:`, error);
    return [];
  }
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let seriesInitialized = false;

export async function initSeries(): Promise<void> {
  try {
    console.log("[GRID] Initializing series service...");
    await getSeries(1);
    console.log("[GRID] Series service ready ✅");
  } catch (err) {
    console.error("[GRID] Series init failed ❌", err);
  }
}

export function initializeSeriesService(): void {
  if (seriesInitialized) {
    console.log("[SERIES SERVICE] Already initialized");
    return;
  }

  console.log("[SERIES SERVICE] Initialized successfully");
  seriesInitialized = true;
}

export default {
  getSeries,
  getSeriesById,
  getSeriesByTournament,
  getSeriesByTeam,
  getUpcomingSeries,
  getRecentSeries,
  getLiveSeries,
  getSeriesByGame,
  initSeries,
  initialize: initializeSeriesService,
};

