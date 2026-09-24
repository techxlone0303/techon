import { statsQuery, GridError } from './client';

export interface PlayerStatistics {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  killsTotal: number;
  deathsTotal: number;
  assistsTotal: number;
  killsPerGame: number;
  deathsPerGame: number;
  assistsPerGame: number;
  kdaRatio: number;
  headshotPercentage?: number;
  firstBloodContribution?: number;
  clutchesWon?: number;
  clutchesLost?: number;
  multiKillCount?: number;
}

export interface PlayerStatsResponse {
  playerId: string;
  statistics: PlayerStatistics | null;
  fetchedAt: string;
  dataSource: 'GRID_STATS' | 'NO_DATA';
}

const PLAYER_STATS_QUERY = `
  query PlayerStats($playerId: ID!) {
    playerStatistics(playerId: $playerId) {
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
        total
        average
      }
      deaths {
        total
        average
      }
      assists {
        total
        average
      }
      headshotPercentage
      firstBloodContribution
      clutches {
        won
        lost
      }
      multiKillCount
    }
  }
`;

const PLAYER_SERIES_STATS_QUERY = `
  query PlayerSeriesStats($playerId: ID!) {
    playerStatistics(playerId: $playerId) {
      series {
        count
        wins {
          percentage
        }
      }
      impact {
        rating
      }
    }
  }
`;

export async function getPlayerStats(playerId: string): Promise<PlayerStatsResponse> {
  if (!playerId || playerId.trim() === '') {
    throw new GridError('Player ID is required', undefined, 'INVALID_INPUT');
  }

  try {
    const data = await statsQuery<{
      playerStatistics: {
        game?: {
          count?: number;
          wins?: { percentage?: number; count?: number };
          losses?: { percentage?: number; count?: number };
        } | null;
        kills?: { total?: number; average?: number } | null;
        deaths?: { total?: number; average?: number } | null;
        assists?: { total?: number; average?: number } | null;
        headshotPercentage?: number;
        firstBloodContribution?: number;
        clutches?: { won?: number; lost?: number } | null;
        multiKillCount?: number;
      } | null;
    }>(PLAYER_STATS_QUERY, { playerId });

    const stats = data.playerStatistics;

    if (!stats) {
      return {
        playerId,
        statistics: null,
        fetchedAt: new Date().toISOString(),
        dataSource: 'NO_DATA',
      };
    }

    const kills = stats.kills?.total || 0;
    const deaths = stats.deaths?.total || 0;
    const assists = stats.assists?.total || 0;
    const gamesPlayed = stats.game?.count || 0;

    const kdaRatio = deaths > 0 ? (kills + assists) / deaths : (kills + assists);

    const statistics: PlayerStatistics = {
      gamesPlayed,
      wins: stats.game?.wins?.count || 0,
      losses: stats.game?.losses?.count || 0,
      winRate: typeof stats.game?.wins?.percentage === 'number' ? stats.game.wins.percentage : 0,
      killsTotal: kills,
      deathsTotal: deaths,
      assistsTotal: assists,
      killsPerGame: gamesPlayed > 0 ? kills / gamesPlayed : 0,
      deathsPerGame: gamesPlayed > 0 ? deaths / gamesPlayed : 0,
      assistsPerGame: gamesPlayed > 0 ? assists / gamesPlayed : 0,
      kdaRatio: Math.round(kdaRatio * 100) / 100,
      headshotPercentage: stats.headshotPercentage,
      firstBloodContribution: stats.firstBloodContribution,
      clutchesWon: stats.clutches?.won,
      clutchesLost: stats.clutches?.lost,
      multiKillCount: stats.multiKillCount,
    };

    return {
      playerId,
      statistics,
      fetchedAt: new Date().toISOString(),
      dataSource: 'GRID_STATS',
    };
  } catch (error) {
    if (error instanceof GridError) {
      if (error.code === 'STATS_UNAUTHENTICATED' || error.code === 'REQUEST_FAILED') {
        return {
          playerId,
          statistics: null,
          fetchedAt: new Date().toISOString(),
          dataSource: 'NO_DATA',
        };
      }
      throw error;
    }
    throw new GridError(
      `Failed to fetch player stats: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

export async function getPlayerSeriesStats(playerId: string): Promise<any> {
  try {
    const data = await statsQuery<{
      playerStatistics: {
        series?: { count?: number; wins?: { percentage?: number } } | null;
        impact?: { rating?: number } | null;
      } | null;
    }>(PLAYER_SERIES_STATS_QUERY, { playerId });
    return data.playerStatistics;
  } catch (error) {
    if (error instanceof GridError) {
      throw error;
    }
    throw new GridError(
      `Failed to fetch player series stats: ${(error as Error).message}`,
      undefined,
      'FETCH_ERROR'
    );
  }
}

