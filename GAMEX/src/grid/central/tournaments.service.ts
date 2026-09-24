/**
 * ScoutIQ - GRID Central Data: Tournaments Service
 * 
 * Retrieves tournament information from GRID Central Data API
 */

import { centralQuery, executeCentralQuery } from "./grid.central.client";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TournamentNode {
  id: string;
  name: string;
  nameShortened?: string;
  logoUrl?: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  tier?: string;
}

export interface TournamentsResponse {
  tournaments: {
    edges: Array<{ node: TournamentNode }>;
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface TournamentDetailsResponse {
  tournament: {
    id: string;
    name: string;
    nameShortened: string;
    seriesList?: {
      edges: Array<{
        node: {
          id: string;
          startTimeScheduled: string;
          status: string;
        };
      }>;
    };
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all tournaments with pagination
 */
export async function getTournaments(limit: number = 10): Promise<TournamentNode[]> {
  const query = `
    query GetTournaments($first: Int!) {
      tournaments(first: $first) {
        edges {
          node {
            id
            name
            nameShortened
            logoUrl
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  `;

  const response = await executeCentralQuery<TournamentsResponse>(
    "GetTournaments",
    query,
    { first: limit }
  );

  return response.tournaments.edges.map(edge => edge.node);
}

/**
 * Get tournament by ID with full details
 */
export async function getTournamentById(tournamentId: string): Promise<TournamentNode | null> {
  const query = `
    query GetTournamentById($id: ID!) {
      tournament(id: $id) {
        id
        name
        nameShortened
        logoUrl
        startDate
        endDate
        region
        tier
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ tournament: TournamentNode }>(
      "GetTournamentById",
      query,
      { id: tournamentId }
    );
    return response.tournament;
  } catch (error) {
    console.error(`[TOURNAMENTS SERVICE] Error fetching tournament ${tournamentId}:`, error);
    return null;
  }
}

/**
 * Get active/popular tournaments
 */
export async function getActiveTournaments(): Promise<TournamentNode[]> {
  const query = `
    query GetActiveTournaments {
      tournaments(filter: { status: ACTIVE }, first: 10) {
        edges {
          node {
            id
            name
            nameShortened
            logoUrl
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ tournaments: { edges: Array<{ node: TournamentNode }> } }>(
      "GetActiveTournaments",
      query
    );
    return response.tournaments.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[TOURNAMENTS SERVICE] Error fetching active tournaments:", error);
    return [];
  }
}

/**
 * Get upcoming tournaments
 */
export async function getUpcomingTournaments(limit: number = 5): Promise<TournamentNode[]> {
  const query = `
    query GetUpcomingTournaments($first: Int!) {
      tournaments(filter: { status: UPCOMING }, first: $first) {
        edges {
          node {
            id
            name
            nameShortened
            startDate
            region
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ tournaments: { edges: Array<{ node: TournamentNode }> } }>(
      "GetUpcomingTournaments",
      query,
      { first: limit }
    );
    return response.tournaments.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[TOURNAMENTS SERVICE] Error fetching upcoming tournaments:", error);
    return [];
  }
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let tournamentsInitialized = false;

export async function initTournaments(): Promise<void> {
  try {
    console.log("[GRID] Initializing tournaments service...");
    await getTournaments(1);
    console.log("[GRID] Tournaments service ready ✅");
  } catch (err) {
    console.error("[GRID] Tournaments init failed ❌", err);
  }
}

export function initializeTournamentsService(): void {
  if (tournamentsInitialized) {
    console.log("[TOURNAMENTS SERVICE] Already initialized");
    return;
  }

  console.log("[TOURNAMENTS SERVICE] Initialized successfully");
  tournamentsInitialized = true;
}

export default {
  getTournaments,
  getTournamentById,
  getActiveTournaments,
  getUpcomingTournaments,
  initTournaments,
  initialize: initializeTournamentsService,
};

