import { gridQuery, GridError } from './grid.service';
import { assertValidTeamId } from '../scoutiq/truth.layer';

export interface SeriesInfo {
  id: string;
  startTimeScheduled: string;
  titleNameShortened: string;
  tournamentNameShortened: string;
  teamNames: string[];
}

export interface UpcomingSeriesResponse {
  series: SeriesInfo[];
  fetchedAt: string;
}

const GET_UPCOMING_SERIES_QUERY = `
  query GetUpcomingSeries($limit: Int!, $status: String!) {
    series(limit: $limit, filter: { status: $status }) {
      id
      startTimeScheduled
      title {
        nameShortened
      }
      tournament {
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

/**
 * Get series for a specific team using valid GraphQL schema
 * Uses series(filter: { teamIds: [$teamId] }) pattern
 */
export async function getSeriesByTeam(
  teamId: string,
  limit: number = 10
): Promise<SeriesInfo[]> {
  // TRUTH LAYER GUARD: Validate teamId before making API call
  assertValidTeamId(teamId);

  const GET_TEAM_SERIES_QUERY = `
    query GetTeamSeries($teamId: ID!, $first: Int!) {
      series(filter: { teamIds: [$teamId] }, first: $first, orderBy: { field: START_TIME_SCHEDULED, direction: DESC }) {
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
            teams {
              baseInfo {
                name
              }
            }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  try {
    const data = await gridQuery<{
      series: {
        edges: Array<{
          node: {
            id: string;
            startTimeScheduled: string;
            title?: { nameShortened?: string };
            tournament?: { nameShortened?: string };
            teams?: Array<{ baseInfo?: { name?: string } }>;
          };
        }>;
        pageInfo?: { hasNextPage?: boolean };
      };
    }>(GET_TEAM_SERIES_QUERY, { teamId, first: limit });

    const series: SeriesInfo[] = (data.series?.edges || []).map(edge => ({
      id: edge.node.id,
      startTimeScheduled: edge.node.startTimeScheduled,
      titleNameShortened: edge.node.title?.nameShortened || 'Unknown',
      tournamentNameShortened: edge.node.tournament?.nameShortened || 'Unknown',
      teamNames: (edge.node.teams?.map(t => t.baseInfo?.name).filter(Boolean) as string[]) || [],
    }));

    return series;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch series for team ${teamId}: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function getUpcomingSeries(
  limit: number = 10,
  status: string = 'SCHEDULED'
): Promise<UpcomingSeriesResponse> {
  try {
    const data = await gridQuery<{
      series: Array<{
        id: string;
        startTimeScheduled: string;
        title: { nameShortened: string };
        tournament: { nameShortened: string };
        teams: Array<{ baseInfo: { name: string } }>;
      }>;
    }>(GET_UPCOMING_SERIES_QUERY, { limit, status });

    const series: SeriesInfo[] = (data.series || []).map(s => ({
      id: s.id,
      startTimeScheduled: s.startTimeScheduled,
      titleNameShortened: s.title?.nameShortened || 'Unknown',
      tournamentNameShortened: s.tournament?.nameShortened || 'Unknown',
      teamNames: s.teams?.map(t => t.baseInfo?.name).filter(Boolean) || [],
    }));

    return {
      series,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch upcoming series: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

