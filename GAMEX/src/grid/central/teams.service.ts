/**
 * ScoutIQ - GRID Central Data: Teams Service
 * 
 * Retrieves team information from GRID Central Data API
 */

import { centralQuery } from "./grid.central.client";

// ============================================================================
// Type Definitions (Minimal safe schema)
// ============================================================================

export interface TeamNode {
  id: string;
  name: string;
  nameShortened?: string;
  logoUrl?: string;
  colorPrimary?: string;
  colorSecondary?: string;
}

export interface TeamsResponse {
  teams: {
    edges: Array<{ node: TeamNode }>;
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface TeamDetailsResponse {
  team: TeamNode;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all teams with pagination (minimal safe query)
 */
export async function getTeams(limit: number = 10): Promise<TeamNode[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const query = "query GetTeams($first: Int!) { teams(first: $first) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } pageInfo { hasNextPage hasPreviousPage } } }";

  try {
    const response = await centralQuery<TeamsResponse>(query, { first: safeLimit });
    return response.teams?.edges?.map(edge => edge.node) || [];
  } catch (error) {
    console.error("[TEAMS SERVICE] Error fetching teams:", error);
    return [];
  }
}

/**
 * Get team by ID with full details
 */
export async function getTeamById(teamId: string): Promise<TeamNode | null> {
  const query = "query GetTeamById($id: ID!) { team(id: $id) { id name nameShortened logoUrl colorPrimary colorSecondary } }";

  try {
    const response = await centralQuery<TeamDetailsResponse>(query, { id: teamId });
    return response.team;
  } catch (error) {
    console.error("[TEAMS SERVICE] Error fetching team " + teamId + ":", error);
    return null;
  }
}

/**
 * Search teams by name using fuzzy cache matching
 * GRID doesn't support fuzzy search, so we load all teams to cache and search there
 */
export async function searchTeamsByName(name: string, limit: number = 10): Promise<TeamNode[]> {
  try {
    const { teamCache, initializeTeamCache } = await import("./teamCache.service");
    
    if (teamCache.isCacheEmpty()) {
      await initializeTeamCache();
    }
    
    const teams = teamCache.searchByName(name);
    console.log("[TEAMS SERVICE] Fuzzy search for \"" + name + "\": found " + teams.length + " teams");
    
    return teams.slice(0, limit);
  } catch (error) {
    console.error("[TEAMS SERVICE] Error in fuzzy search:", error);
    return [];
  }
}

/**
 * Get team by exact name from cache or GRID
 */
export async function getTeamByName(name: string): Promise<TeamNode | null> {
  console.log("[TEAMS SERVICE] getTeamByName called for: \"" + name + "\"");
  
  try {
    const { teamCache, initializeTeamCache } = await import("./teamCache.service");
    
    // First try cache
    if (!teamCache.isCacheEmpty()) {
      const team = teamCache.getTeamByExactName(name);
      if (team) {
        console.log("[TEAMS SERVICE] Found \"" + name + "\" in cache");
        return team;
      }
    }
    
    // If cache is empty or team not found, load cache from GRID
    console.log("[TEAMS SERVICE] Cache empty or team not found, loading from GRID...");
    await initializeTeamCache();
    
    // Try cache again after loading
    const team = teamCache.getTeamByExactName(name);
    if (team) {
      console.log("[TEAMS SERVICE] Found \"" + name + "\" in cache after loading");
      return team;
    }
    
    // If still not found, try a direct GRID query as fallback
    console.log("[TEAMS SERVICE] Team not in cache, trying direct GRID query...");
    const query = "query SearchTeamByName($name: String!) { teams(filter: { name: { equals: $name } }, first: 1) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } } }";
    
    try {
      const response = await centralQuery<{ teams: { edges: Array<{ node: TeamNode }> } }>(query, { name });
      if (response.teams?.edges?.length > 0) {
        console.log("[TEAMS SERVICE] Found \"" + name + "\" via direct GRID query");
        return response.teams.edges[0].node;
      }
    } catch (directError) {
      console.error("[TEAMS SERVICE] Direct GRID query failed:", directError);
    }
    
    console.log("[TEAMS SERVICE] Team \"" + name + "\" not found anywhere");
    return null;
  } catch (error) {
    console.error("[TEAMS SERVICE] Error fetching team by name \"" + name + "\":", error);
    return null;
  }
}

/**
 * Get teams by game
 */
export async function getTeamsByGame(gameId: string, limit: number = 10): Promise<TeamNode[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const query = "query GetTeamsByGame($gameId: ID!, $first: Int!) { game(id: $gameId) { teams(first: $first) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } } } }";

  try {
    const response = await centralQuery<{ game: { teams: { edges: Array<{ node: TeamNode }> } } }>(query, { gameId, first: safeLimit });
    return response.game?.teams?.edges?.map(edge => edge.node) || [];
  } catch (error) {
    console.error("[TEAMS SERVICE] Error fetching teams for game " + gameId + ":", error);
    return [];
  }
}

/**
 * Get teams by organization
 */
export async function getTeamsByOrganization(organizationId: string): Promise<TeamNode[]> {
  const query = "query GetTeamsByOrganization($organizationId: ID!) { organization(id: $organizationId) { teams { id name nameShortened logoUrl colorPrimary colorSecondary } } }";

  try {
    const response = await centralQuery<{ organization: { teams: TeamNode[] } }>(query, { organizationId });
    return response.organization?.teams || [];
  } catch (error) {
    console.error("[TEAMS SERVICE] Error fetching teams for organization " + organizationId + ":", error);
    return [];
  }
}

/**
 * Get team roster with active players
 */
export async function getTeamRoster(teamId: string): Promise<Array<{ id: string; nickname: string }>> {
  const query = "query TeamRoster($teamId: ID!) { team(id: $teamId) { players { id nickname } } }";

  try {
    const response = await centralQuery<{ team: { players: Array<{ id: string; nickname: string }> } }>(query, { teamId });
    return response.team?.players || [];
  } catch (error) {
    console.error("[TEAMS SERVICE] Error fetching roster for team " + teamId + ":", error);
    return [];
  }
}

/**
 * Get top ranked teams
 */
export async function getTopRankedTeams(gameId: string, limit: number = 10): Promise<TeamNode[]> {
  return getTeamsByGame(gameId, limit);
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let teamsInitialized = false;

export async function initTeams(): Promise<void> {
  try {
    console.log("[GRID] Initializing teams service...");
    await getTeams(1);
    console.log("[GRID] Teams service ready");
  } catch (err) {
    console.error("[GRID] Teams init failed", err);
  }
}

export function initializeTeamsService(): void {
  if (teamsInitialized) {
    console.log("[TEAMS SERVICE] Already initialized");
    return;
  }

  console.log("[TEAMS SERVICE] Initialized successfully");
  teamsInitialized = true;
}

export default {
  getTeams,
  getTeamById,
  searchTeamsByName,
  getTeamByName,
  getTeamsByGame,
  getTeamsByOrganization,
  getTeamRoster,
  getTopRankedTeams,
  initTeams,
  initialize: initializeTeamsService,
};

