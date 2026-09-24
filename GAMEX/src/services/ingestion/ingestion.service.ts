
import { gridQuery } from './grid.client';

// Data Provider Enum
export enum DataProvider {
  GRID = 'GRID',
  FACEIT = 'FACEIT',
  CSV = 'CSV',
}

// Get current provider from environment, default to GRID
function getDataProvider(): DataProvider {
  const provider = process.env.DATA_PROVIDER?.toUpperCase();
  if (provider === 'FACEIT' || provider === 'CSV') {
    return DataProvider[provider as keyof typeof DataProvider];
  }
  return DataProvider.GRID;
}

export interface Match {
  id: string;
  name: string;
  status: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  score: string;
}

export type DataSource = `${DataProvider}_LIVE` | `${DataProvider}_SANDBOX` | 'NO_DATA';

export interface MatchFetchResult {
  matches: Match[];
  dataSource: DataSource;
}

let lastDataSource: DataSource = 'NO_DATA';

export function getDataSource(): DataSource {
  return lastDataSource;
}

// ============================================
// GRID Provider Implementation
// ============================================

async function fetchGridMatches(teamId: string, limit: number): Promise<MatchFetchResult> {
  const query = `
    query GetTeamMatches($teamId: ID!, $limit: Int!) {
      team(id: $teamId) {
        matches(limit: $limit, status: "finished") {
          id
          name
          status
          scheduled_at
          finished_at
          team1 { id name }
          team2 { id name }
          winner { id }
          score { team1 team2 }
        }
      }
    }
  `;

  try {
    const data = await gridQuery(query, { teamId, limit });
    const matches = data?.team?.matches || [];

    const formattedMatches = matches.map((m: any) => {
      const isTeam1 = m.team1?.id === teamId;
      const opponent = isTeam1 ? m.team2 : m.team1;
      const myScore = isTeam1 ? m.score?.team1 : m.score?.team2;
      const oppScore = isTeam1 ? m.score?.team2 : m.score?.team1;

      let result: 'win' | 'loss' | 'draw' = 'draw';
      if (m.winner) {
        result = m.winner.id === teamId ? 'win' : 'loss';
      }

      return {
        id: m.id,
        name: m.name,
        status: m.status,
        date: m.finished_at || m.scheduled_at,
        opponent: opponent?.name || 'Unknown',
        result,
        score: `${myScore} - ${oppScore}`,
      };
    });

    lastDataSource = formattedMatches.length > 0 ? 'GRID_LIVE' : 'GRID_SANDBOX';
    return { matches: formattedMatches, dataSource: lastDataSource };
  } catch (error: any) {
    // GRID-specific error handling (404, 401, 403 = sandbox)
    if (error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 403) {
      lastDataSource = 'GRID_SANDBOX';
    } else {
      lastDataSource = 'GRID_SANDBOX';
    }
    return { matches: [], dataSource: lastDataSource };
  }
}

// ============================================
// FACEIT Provider Implementation (Stub)
// ============================================

async function fetchFaceitMatches(teamId: string, limit: number): Promise<MatchFetchResult> {
  const faceitApiKey = process.env.FACEIT_API_KEY;
  const faceitBaseUrl = process.env.FACEIT_API_URL || 'https://open.faceit.com/data/v4';

  if (!faceitApiKey) {
    lastDataSource = 'FACEIT_SANDBOX';
    return { matches: [], dataSource: 'FACEIT_SANDBOX' };
  }

  try {
    // Placeholder for FACEIT API integration
    // Would fetch: GET {faceitBaseUrl}/players/{playerId}/games
    lastDataSource = 'FACEIT_LIVE';
    return { matches: [], dataSource: 'FACEIT_LIVE' };
  } catch (error: any) {
    lastDataSource = 'FACEIT_SANDBOX';
    return { matches: [], dataSource: 'FACEIT_SANDBOX' };
  }
}

// ============================================
// CSV Provider Implementation (Stub)
// ============================================

async function fetchCsvMatches(teamId: string, limit: number): Promise<MatchFetchResult> {
  const csvPath = process.env.CSV_DATA_PATH;

  if (!csvPath) {
    lastDataSource = 'CSV_SANDBOX';
    return { matches: [], dataSource: 'CSV_SANDBOX' };
  }

  try {
    // Placeholder for CSV file parsing
    // Would read: {csvPath}/{teamId}.csv
    lastDataSource = 'CSV_LIVE';
    return { matches: [], dataSource: 'CSV_LIVE' };
  } catch (error: any) {
    lastDataSource = 'CSV_SANDBOX';
    return { matches: [], dataSource: 'CSV_SANDBOX' };
  }
}

// ============================================
// Unified Team ID Resolution
// ============================================

export async function resolveTeamId(nameOrId: string): Promise<string> {
  const provider = getDataProvider();

  switch (provider) {
    case DataProvider.GRID:
      return resolveGridTeamId(nameOrId);
    case DataProvider.FACEIT:
      return resolveFaceitTeamId(nameOrId);
    case DataProvider.CSV:
      return resolveCsvTeamId(nameOrId);
    default:
      return nameOrId;
  }
}

async function resolveGridTeamId(nameOrId: string): Promise<string> {
  const query = `
    query SearchTeams($name: String!) {
      teams(filter: { name: $name }, limit: 1) {
        id
      }
    }
  `;

  try {
    const data = await gridQuery(query, { name: nameOrId });
    if (data?.teams && data.teams.length > 0) {
      return data.teams[0].id;
    }
    lastDataSource = 'GRID_SANDBOX';
    return nameOrId;
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 403) {
      lastDataSource = 'GRID_SANDBOX';
    } else {
      lastDataSource = 'GRID_SANDBOX';
    }
    return nameOrId;
  }
}

async function resolveFaceitTeamId(nameOrId: string): Promise<string> {
  // Placeholder for FACEIT team resolution
  lastDataSource = 'FACEIT_SANDBOX';
  return nameOrId;
}

async function resolveCsvTeamId(nameOrId: string): Promise<string> {
  // CSV provider uses team names as IDs
  lastDataSource = 'CSV_SANDBOX';
  return nameOrId;
}

// ============================================
// Unified Match Fetching (Main Entry Point)
// ============================================

export async function fetchRecentMatches(teamId: string, limit = 5): Promise<MatchFetchResult> {
  const provider = getDataProvider();

  switch (provider) {
    case DataProvider.GRID:
      return fetchGridMatches(teamId, limit);
    case DataProvider.FACEIT:
      return fetchFaceitMatches(teamId, limit);
    case DataProvider.CSV:
      return fetchCsvMatches(teamId, limit);
    default:
      lastDataSource = 'NO_DATA';
      return { matches: [], dataSource: 'NO_DATA' };
  }
}

