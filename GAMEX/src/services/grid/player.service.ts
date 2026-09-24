import { gridQuery, statsQuery, GridError } from './client';

export interface PlayerNode {
  id: string;
  name: string;
  nickname?: string;
  gameTitle?: string;
  teams?: Array<{
    id: string;
    name: string;
    baseInfo?: { name?: string };
  }>;
}

export interface PlayersConnection {
  edges: Array<{
    node: PlayerNode;
    cursor?: string;
  }>;
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

const GET_PLAYER_QUERY = `
  query GetPlayer($id: ID!) {
    player(id: $id) {
      id
      name
      nickname
      gameTitle
      teams {
        id
        name
        baseInfo {
          name
        }
      }
    }
  }
`;

const GET_PLAYERS_QUERY = `
  query GetPlayers($first: Int!, $after: String) {
    players(first: $first, after: $after) {
      edges {
        node {
          id
          name
          nickname
          gameTitle
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

const SEARCH_PLAYERS_QUERY = `
  query SearchPlayers($name: String!, $first: Int!) {
    players(first: $first, filter: { name: { equals: $name } }) {
      edges {
        node {
          id
          name
          nickname
          gameTitle
          teams {
            id
            name
          }
        }
      }
    }
  }
`;

export async function getPlayer(playerId: string): Promise<PlayerNode | null> {
  try {
    const data = await gridQuery<{ player: PlayerNode | null }>(GET_PLAYER_QUERY, { id: playerId });
    return data.player;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch player: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function getPlayers(limit: number = 10, after?: string): Promise<PlayersConnection> {
  try {
    const data = await gridQuery<{ players: PlayersConnection }>(GET_PLAYERS_QUERY, { first: limit, after });
    return data.players;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch players: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function searchPlayersByName(name: string, limit: number = 10): Promise<PlayerNode[]> {
  try {
    const data = await gridQuery<{ players: PlayersConnection }>(SEARCH_PLAYERS_QUERY, { name, first: limit });
    return data.players.edges.map(e => e.node);
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to search players: ${(error as Error).message}`,
      undefined,
      'SEARCH_ERROR'
    );
  }
}

export async function getPlayerWithTeam(playerId: string): Promise<PlayerNode | null> {
  const player = await getPlayer(playerId);
  return player;
}

