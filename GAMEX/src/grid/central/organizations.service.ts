/**
 * ScoutIQ - GRID Central Data: Organizations Service
 * 
 * Retrieves organization/team roster information from GRID Central Data API
 */

import { centralQuery, executeCentralQuery } from "./grid.central.client";

// ============================================================================
// Type Definitions
// ============================================================================

export interface OrganizationNode {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  website?: string;
  location?: string;
  teams?: Array<{
    id: string;
    name: string;
    logoUrl?: string;
  }>;
  games?: Array<{
    id: string;
    name: string;
  }>;
}

export interface OrganizationsResponse {
  organizations: {
    edges: Array<{ node: OrganizationNode }>;
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface OrganizationDetailsResponse {
  organization: OrganizationNode;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all organizations
 */
export async function getOrganizations(limit: number = 10): Promise<OrganizationNode[]> {
  const query = `
    query GetOrganizations($first: Int!) {
      organizations(first: $first) {
        edges {
          node {
            id
            name
            shortName
            logoUrl
            website
            location
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
    const response = await executeCentralQuery<OrganizationsResponse>(
      "GetOrganizations",
      query,
      { first: limit }
    );
    return response.organizations.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[ORGANIZATIONS SERVICE] Error fetching organizations:", error);
    return [];
  }
}

/**
 * Get organization by ID with full details
 */
export async function getOrganizationById(organizationId: string): Promise<OrganizationNode | null> {
  const query = `
    query GetOrganizationById($id: ID!) {
      organization(id: $id) {
        id
        name
        shortName
        logoUrl
        website
        location
        teams {
          id
          name
          logoUrl
        }
        games {
          id
          name
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<OrganizationDetailsResponse>(
      "GetOrganizationById",
      query,
      { id: organizationId }
    );
    return response.organization;
  } catch (error) {
    console.error(`[ORGANIZATIONS SERVICE] Error fetching organization ${organizationId}:`, error);
    return null;
  }
}

/**
 * Get organizations by game
 */
export async function getOrganizationsByGame(gameId: string, limit: number = 10): Promise<OrganizationNode[]> {
  const query = `
    query GetOrganizationsByGame($gameId: ID!, $first: Int!) {
      game(id: $gameId) {
        organizations(first: $first) {
          edges {
            node {
              id
              name
              shortName
              logoUrl
            }
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<{ game: { organizations: { edges: Array<{ node: OrganizationNode }> } } }>(
      "GetOrganizationsByGame",
      query,
      { gameId, first: limit }
    );
    return response.game.organizations.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[ORGANIZATIONS SERVICE] Error fetching organizations for game ${gameId}:`, error);
    return [];
  }
}

/**
 * Search organizations by name
 */
export async function searchOrganizations(name: string, limit: number = 10): Promise<OrganizationNode[]> {
  const query = `
    query SearchOrganizations($name: String!, $first: Int!) {
      organizations(filter: { name: { includesInsensitive: $name } }, first: $first) {
        edges {
          node {
            id
            name
            shortName
            logoUrl
            website
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<OrganizationsResponse>(
      "SearchOrganizations",
      query,
      { name, first: limit }
    );
    return response.organizations.edges.map(edge => edge.node);
  } catch (error) {
    console.error(`[ORGANIZATIONS SERVICE] Error searching organizations:`, error);
    return [];
  }
}

/**
 * Get top organizations by following/popularity
 */
export async function getTopOrganizations(limit: number = 10): Promise<OrganizationNode[]> {
  const query = `
    query GetTopOrganizations($first: Int!) {
      organizations(first: $first, orderBy: FOLLOWERS_COUNT_DESC) {
        edges {
          node {
            id
            name
            shortName
            logoUrl
            website
          }
        }
      }
    }
  `;

  try {
    const response = await executeCentralQuery<OrganizationsResponse>(
      "GetTopOrganizations",
      query,
      { first: limit }
    );
    return response.organizations.edges.map(edge => edge.node);
  } catch (error) {
    console.error("[ORGANIZATIONS SERVICE] Error fetching top organizations:", error);
    return [];
  }
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let organizationsInitialized = false;

export function initializeOrganizationsService(): void {
  if (organizationsInitialized) {
    console.log("[ORGANIZATIONS SERVICE] Already initialized");
    return;
  }

  console.log("[ORGANIZATIONS SERVICE] Initialized successfully");
  organizationsInitialized = true;
}

export default {
  getOrganizations,
  getOrganizationById,
  getOrganizationsByGame,
  searchOrganizations,
  getTopOrganizations,
  initialize: initializeOrganizationsService,
};

