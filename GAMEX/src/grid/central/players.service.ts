/**
 * ScoutIQ - GRID Central Data: Players Service
 * 
 * Retrieves player information from GRID Central Data API
 */

import { centralQuery, executeCentralQuery } from "./grid.central.client";

// ============================================================================
// Type Definitions (Minimal safe schema)
// ============================================================================

export interface PlayerNode {
  id: string;
  nickname: string;
  title?: {
    name: string;
  };
  team?: {
    baseInfo?: {
      name: string;
    };
  };
}

export interface PlayersResponse {
  players: {
    edges: Array<{ node: PlayerNode }>;
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface PlayerDetailsResponse {
  player: PlayerNode;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all players (minimal safe query)
 */
export async function getPlayers(limit: number = 10): Promise<PlayerNode[]> {
  const query = `
    query GetPlayers($first: Int!) {
      players(first: $first) {
        edges {
          node {
            id
            nickname
            title {
              name
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
    const response = await executeCentralQuery<PlayersResponse>(
      "GetPlayers",
      query,
      { first: limit }
    );
    return response.players.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[PLAYERS SERVICE] Error fetching players:", error);
    return [];
  }
}

/**
 * Get player by ID with full details
 */
export async function getPlayerById(playerId: string): Promise<PlayerNode | null> {
  const query = `
    query GetPlayerById($id: ID!) {
      player(id: $id) {
        id
        nickname
        title {
          name
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<PlayerDetailsResponse>(
      "GetPlayerById",
      query,
      { id: playerId }
    );
    return response.player;
  } catch (error) {
    console.error(`[PLAYERS SERVICE] Error fetching player ${playerId}:`, error);
    return null;
  }
}

/**
 * Search players by nickname
 */
export async function searchPlayers(nickname: string, limit: number = 10): Promise<PlayerNode[]> {
  const query = `
    query SearchPlayers($nickname: String!, $first: Int!) {
      players(filter: { nickname: { includesInsensitive: $nickname } }, first: $first) {
        edges {
          node {
            id
            nickname
            title {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<PlayersResponse>(
      "SearchPlayers",
      query,
      { nickname, first: limit }
    );
    return response.players.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[PLAYERS SERVICE] Error searching players:`, error);
    return [];
  }
}

/**
 * Get players by team
 */
export async function getPlayersByTeam(teamId: string): Promise<PlayerNode[]> {
  const query = `
    query GetPlayersByTeam($teamId: ID!) {
      team(id: $teamId) {
        players {
          id
          nickname
          title {
            name
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ team: { players: PlayerNode[] } }>(
      "GetPlayersByTeam",
      query,
      { teamId }
    );
    return response.team.players;
  } catch (error) {
    console.error(`[PLAYERS SERVICE] Error fetching players for team ${teamId}:`, error);
    return [];
  }
}

/**
 * Get players by game
 */
export async function getPlayersByGame(gameId: string, limit: number = 20): Promise<PlayerNode[]> {
  const query = `
    query GetPlayersByGame($gameId: ID!, $first: Int!) {
      game(id: $gameId) {
        players(first: $first) {
          edges {
            node {
              id
              nickname
              title {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ game: { players: { edges: Array<{ node: PlayerNode }> } } }>(
      "GetPlayersByGame",
      query,
      { gameId, first: limit }
    );
    return response.game.players.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[PLAYERS SERVICE] Error fetching players for game ${gameId}:`, error);
    return [];
  }
}

/**
 * Get players by country
 */
export async function getPlayersByCountry(countryCode: string, limit: number = 10): Promise<PlayerNode[]> {
  const query = `
    query GetPlayersByCountry($countryCode: String!, $first: Int!) {
      players(filter: { country: { equals: $countryCode } }, first: $first) {
        edges {
          node {
            id
            nickname
            title {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<PlayersResponse>(
      "GetPlayersByCountry",
      query,
      { countryCode, first: limit }
    );
    return response.players.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[PLAYERS SERVICE] Error fetching players for country ${countryCode}:`, error);
    return [];
  }
}

/**
 * Get top players by achievements
 */
export async function getTopPlayers(gameId: string, limit: number = 10): Promise<PlayerNode[]> {
  const query = `
    query GetTopPlayers($gameId: ID!, $first: Int!) {
      game(id: $gameId) {
        players(first: $first) {
          edges {
            node {
              id
              nickname
              title {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ game: { players: { edges: Array<{ node: PlayerNode }> } } }>(
      "GetTopPlayers",
      query,
      { gameId, first: limit }
    );
    return response.game.players.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[PLAYERS SERVICE] Error fetching top players for game ${gameId}:`, error);
    return [];
  }
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let playersInitialized = false;

export async function initPlayers(): Promise<void> {
  try {
    console.log("[GRID] Initializing players service...");
    await getPlayers(1);
    console.log("[GRID] Players service ready ✅");
  } catch (err) {
    console.error("[GRID] Players init failed ❌", err);
  }
}

export function initializePlayersService(): void {
  if (playersInitialized) {
    console.log("[PLAYERS SERVICE] Already initialized");
    return;
  }

  console.log("[PLAYERS SERVICE] Initialized successfully");
  playersInitialized = true;
}

export default {
  getPlayers,
  getPlayerById,
  searchPlayers,
  getPlayersByTeam,
  getPlayersByGame,
  getPlayersByCountry,
  getTopPlayers,
  initPlayers,
  initialize: initializePlayersService,
};

