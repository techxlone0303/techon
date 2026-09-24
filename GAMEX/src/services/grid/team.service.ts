import { gridQuery, statsQuery, GridError } from './client';

export interface TeamNode {
  id: string;
  name: string;
  nameShortened?: string;
  region?: string;
}

export interface TeamEdge {
  node: TeamNode;
  cursor?: string;
}

export interface TeamsConnection {
  edges: TeamEdge[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

export interface TeamWithSeries {
  id: string;
  name: string;
  series?: {
    edges: Array<{
      node: {
        id: string;
        startTimeScheduled?: string;
        title?: {
          nameShortened?: string;
        };
      };
    }>;
  };
}

export interface TeamStatsData {
  teamStatistics: {
    game?: {
      count?: number;
      wins?: {
        percentage?: number;
        count?: number;
      };
      losses?: {
        percentage?: number;
        count?: number;
      };
    };
    kills?: {
      average?: number;
      total?: number;
    };
    series?: {
      count?: number;
      wins?: {
        percentage?: number;
      };
    };
  };
}

export interface TeamProfile {
  id: string;
  name: string;
  nameShortened?: string;
  region?: string;
  series?: Array<{
    id: string;
    startTimeScheduled?: string;
    titleName?: string;
  }>;
  statistics?: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    avgKills: number;
    seriesCount: number;
    seriesWinRate: number;
  };
}

const GET_TEAM_QUERY = `
  query GetTeam($id: ID!) {
    team(id: $id) {
      id
      name
      nameShortened
      region
    }
  }
`;

const GET_TEAMS_QUERY = `
  query GetTeams($first: Int!, $after: String) {
    teams(first: $first, after: $after) {
      edges {
        node {
          id
          name
          nameShortened
          region
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

const GET_TEAM_WITH_SERIES_QUERY = `
  query GetTeamWithSeries($id: ID!, $seriesFirst: Int!) {
    team(id: $id) {
      id
      name
      series(first: $seriesFirst) {
        edges {
          node {
            id
            startTimeScheduled
            title {
              nameShortened
            }
          }
        }
      }
    }
  }
`;

const SEARCH_TEAMS_QUERY = `
  query SearchTeams($name: String!, $first: Int!) {
    teams(first: $first, filter: { name: { equals: $name } }) {
      edges {
        node {
          id
          name
          nameShortened
        }
      }
    }
  }
`;

const TEAM_STATS_QUERY = `
  query TeamStats($teamId: ID!) {
    teamStatistics(teamId: $teamId) {
      game {
        count
        wins {
          percentage
          count
        }
        losses {
          percentage
          count
        }
      }
      kills {
        average
        total
      }
      series {
        count
        wins {
          percentage
        }
      }
    }
  }
`;

export async function getTeam(teamId: string): Promise<TeamNode | null> {
  try {
    const data = await gridQuery<{ team: TeamNode | null }>(GET_TEAM_QUERY, { id: teamId });
    return data.team;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch team: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function getTeams(limit: number = 5, after?: string): Promise<TeamsConnection> {
  try {
    const data = await gridQuery<{ teams: TeamsConnection }>(GET_TEAMS_QUERY, { first: limit, after });
    return data.teams;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch teams: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function getTeamWithSeries(teamId: string, seriesLimit: number = 5): Promise<TeamWithSeries | null> {
  try {
    const data = await gridQuery<{ team: TeamWithSeries | null }>(
      GET_TEAM_WITH_SERIES_QUERY,
      { id: teamId, seriesFirst: seriesLimit }
    );
    return data.team;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch team with series: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function searchTeamsByName(name: string, limit: number = 5): Promise<TeamNode[]> {
  try {
    const data = await gridQuery<{ teams: TeamsConnection }>(SEARCH_TEAMS_QUERY, { name, first: limit });
    return data.teams.edges.map(e => e.node);
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to search teams: ${(error as Error).message}`,
      undefined,
      'SEARCH_ERROR'
    );
  }
}

export async function getTeamStats(teamId: string): Promise<TeamStatsData | null> {
  try {
    const data = await statsQuery<{ teamStatistics: TeamStatsData['teamStatistics'] }>(
      TEAM_STATS_QUERY,
      { teamId }
    );
    return { teamStatistics: data.teamStatistics };
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch team stats: ${(error as Error).message}`,
      undefined,
      'STATS_ERROR'
    );
  }
}

export async function getTeamProfile(teamId: string): Promise<TeamProfile | null> {
  try {
    const [teamData, seriesData, statsData] = await Promise.all([
      getTeam(teamId),
      getTeamWithSeries(teamId, 5),
      getTeamStats(teamId).catch(() => null),
    ]);

    if (!teamData) {
      return null;
    }

    const teamStats = statsData?.teamStatistics;

    const profile: TeamProfile = {
      id: teamData.id,
      name: teamData.name,
      nameShortened: teamData.nameShortened,
      region: teamData.region,
      series: seriesData?.series?.edges.map(e => ({
        id: e.node.id,
        startTimeScheduled: e.node.startTimeScheduled,
        titleName: e.node.title?.nameShortened,
      })) || [],
      statistics: teamStats ? {
        gamesPlayed: teamStats.game?.count || 0,
        wins: teamStats.game?.wins?.count || 0,
        losses: teamStats.game?.losses?.count || 0,
        winRate: teamStats.game?.wins?.percentage || 0,
        avgKills: teamStats.kills?.average || 0,
        seriesCount: teamStats.series?.count || 0,
        seriesWinRate: teamStats.series?.wins?.percentage || 0,
      } : undefined,
    };

    return profile;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to build team profile: ${(error as Error).message}`,
      undefined,
      'PROFILE_ERROR'
    );
  }
}

