/**
 * ScoutIQ - Player Resolver Service
 * 
 * Retrieves player information from GRID Central API.
 * 
 * IMPORTANT: GRID Central API has a platform limitation - there is no supported
 * way to query players by team. The API doesn't expose:
 * - team.players field
 * - players(filter: { teamId: ... })
 * - team.roster field
 * - team.activePlayers field
 * - gameTeams query
 * 
 * This is a GRID API design limitation, not a code issue.
 * 
 * The system handles this gracefully by:
 * 1. Returning empty player arrays
 * 2. Using AI-generated roster information from the LLM
 * 3. Continuing with matchup analysis without player data
 */

import { centralQuery } from "../grid/central/grid.central.client";

export interface PlayerInfo {
  id: string;
  nickname: string;
}

export interface PlayersResponse {
  players: {
    edges: Array<{ node: PlayerNode }>;
  };
}

export interface PlayerNode {
  id: string;
  nickname: string;
}

/**
 * Get all players for a team
 * 
 * NOTE: This function always returns empty array due to GRID API limitation.
 * The GRID Central API does not support querying players by team.
 * 
 * @param teamId - The GRID team ID
 * @returns Empty array (players unavailable via GRID API)
 */
export async function getTeamPlayers(teamId: string): Promise<PlayerInfo[]> {
  console.log("[PLAYER RESOLVER] Fetching players for team " + teamId);
  
  // Try all possible approaches - none are supported by GRID API
  
  // Approach 1: team.players (doesn't exist)
  const query1 = `
    query GetPlayersByTeam($teamId: ID!) {
      team(id: $teamId) {
        players {
          id
          nickname
        }
      }
    }
  `;
  
  // Approach 2: team.roster (doesn't exist)
  const query2 = `
    query GetTeamRoster($teamId: ID!) {
      team(id: $teamId) {
        roster {
          id
          nickname
        }
      }
    }
  `;
  
  // Approach 3: players with teamId filter (doesn't exist)
  const query3 = `
    query GetPlayersByTeam($teamId: ID!, $first: Int!) {
      players(filter: { teamId: { equals: $teamId } }, first: $first) {
        edges {
          node {
            id
            nickname
          }
        }
      }
    }
  `;
  
  const queries = [
    { name: "team.players", query: query1, args: { teamId } },
    { name: "team.roster", query: query2, args: { teamId } },
    { name: "players(filter: teamId)", query: query3, args: { teamId, first: 20 } },
  ];
  
  for (const q of queries) {
    try {
      console.log("[PLAYER RESOLVER] Trying: " + q.name);
      await centralQuery(q.query, q.args);
      console.log("[PLAYER RESOLVER] SUCCESS: " + q.name + " works!");
    } catch (error) {
      const msg = (error as Error).message;
      console.log("[PLAYER RESOLVER] Failed: " + q.name + " - " + msg.substring(0, 80));
    }
  }
  
  // Return empty array - GRID API doesn't support player lookup by team
  console.log("[PLAYER RESOLVER] ⚠️ GRID API limitation: Cannot fetch players by team. Returning empty array.");
  return [];
}

/**
 * Search players by nickname
 * This works - you can search individual players by name
 */
export async function searchPlayers(nickname: string, limit: number = 10): Promise<PlayerInfo[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  
  const query = `
    query SearchPlayers($nickname: String!, $first: Int!) {
      players(filter: { nickname: { includesInsensitive: $nickname } }, first: $first) {
        edges {
          node {
            id
            nickname
          }
        }
      }
    }
  `;

  try {
    const response = await centralQuery<PlayersResponse>(
      query,
      { nickname, first: safeLimit }
    );
    
    const players = response.players?.edges || [];
    console.log("[PLAYER RESOLVER] Found " + players.length + " players matching: " + nickname);
    return players.map(p => ({ id: p.node.id, nickname: p.node.nickname }));
  } catch (error) {
    console.warn("[PLAYER RESOLVER] Player search failed:", (error as Error).message);
    return [];
  }
}

/**
 * Get player by ID
 * This works - you can fetch individual player details
 */
export async function getPlayerById(playerId: string): Promise<PlayerInfo | null> {
  const query = `
    query GetPlayerById($id: ID!) {
      player(id: $id) {
        id
        nickname
      }
    }
  `;

  try {
    const response = await centralQuery<{ player: { id: string; nickname: string } }>(
      query,
      { id: playerId }
    );
    
    if (response.player) {
      return { id: response.player.id, nickname: response.player.nickname };
    }
    return null;
  } catch (error) {
    console.warn("[PLAYER RESOLVER] Failed to fetch player " + playerId + ":", (error as Error).message);
    return null;
  }
}

/**
 * Get all players (for testing/debugging)
 * This works - returns all players with pagination
 */
export async function getAllPlayers(limit: number = 50): Promise<PlayerInfo[]> {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  
  const query = `
    query GetAllPlayers($first: Int!) {
      players(first: $first) {
        edges {
          node {
            id
            nickname
          }
        }
      }
    }
  `;

  try {
    const response = await centralQuery<PlayersResponse>(
      query,
      { first: safeLimit }
    );
    
    const players = response.players?.edges || [];
    console.log("[PLAYER RESOLVER] Retrieved " + players.length + " total players");
    return players.map(p => ({ id: p.node.id, nickname: p.node.nickname }));
  } catch (error) {
    console.warn("[PLAYER RESOLVER] Failed to fetch players:", (error as Error).message);
    return [];
  }
}

export default {
  getTeamPlayers,
  searchPlayers,
  getPlayerById,
  getAllPlayers,
};

