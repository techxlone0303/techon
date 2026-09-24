import { getPlayer, searchPlayersByName } from '../grid/player.service';
import { getPlayerStats, getPlayerSeriesStats } from '../grid/playerStats.service';
import { PlayerNode } from '../grid/player.service';
import { PlayerStatistics } from '../grid/playerStats.service';
import { generateEmbeddingFromStats, PlayerEmbedding, EmbeddingFeatures } from '../ai/embedding.service';
import { detectRole, PlayerRole, getRoleDescription } from '../ai/roleDetection.service';
import { assignPlayerToCluster, CLUSTER_DESCRIPTIONS, ClusterDefinition } from '../ai/clustering.service';
import { eloEngine, EloRating } from '../ai/elo.service';
import { synergyGraphEngine, SynergyEdge } from '../ai/synergyGraph.service';
import { generateScoutingReport, ScoutingReportInput, ScoutingReportOutput } from '../ai/scoutingReport.service';

export interface PlayerIntelligence {
  playerId: string;
  player: {
    id: string;
    name: string;
    nickname?: string;
    teams?: Array<{ id: string; name: string }>;
  };
  stats: PlayerStatistics | null;
  features: EmbeddingFeatures;
  embedding: PlayerEmbedding;
  role: {
    detectedRole: PlayerRole;
    confidence: number;
    description: string;
  };
  cluster: {
    clusterId: number;
    clusterName: string;
    description: string;
    confidence: number;
  };
  eloRating: EloRating;
  synergyGraph: {
    centrality: number;
    topTeammates: Array<{ playerId: string; synergyScore: number }>;
  };
  scoutingReport: ScoutingReportOutput | null;
  metadata: {
    generatedAt: string;
    dataSource: string;
    gamesAnalyzed: number;
  };
}

export interface PlayerEngineInput {
  playerId: string;
  includeReport?: boolean;
  includeSynergy?: boolean;
  teamMates?: string[];
}

export async function runPlayerEngine(input: PlayerEngineInput): Promise<PlayerIntelligence> {
  const { playerId, includeReport = true, includeSynergy = false, teamMates = [] } = input;

  const [player, statsResponse, seriesStats] = await Promise.all([
    getPlayer(playerId),
    getPlayerStats(playerId),
    getPlayerSeriesStats(playerId).catch(() => null),
  ]);

  const stats = statsResponse.statistics;
  const dataSource = statsResponse.dataSource;

  const features = extractPlayerFeatures(stats, seriesStats);
  const embedding = generateEmbeddingFromStats(stats);

  const role = detectRole(stats);
  const roleInfo = {
    detectedRole: role.role,
    confidence: role.confidence,
    description: getRoleDescription(role.role),
  };

  const cluster = assignPlayerToCluster(embedding);

  let eloRating = eloEngine.getRating(playerId);
  if (stats && eloRating.gamesPlayed === 0) {
    eloRating = eloEngine.initializeFromStats(playerId, {
      winRate: stats.winRate,
      gamesPlayed: stats.gamesPlayed,
      kdaRatio: stats.kdaRatio,
    });
  }

  synergyGraphEngine.setPlayerName(playerId, player?.name || playerId);
  synergyGraphEngine.setPlayerEmbedding(playerId, embedding);

  if (includeSynergy && teamMates.length > 0) {
    for (const teammateId of teamMates) {
      const teammateStats = await getPlayerStats(teammateId).catch(() => null);
      if (teammateStats?.statistics) {
        const teammateEmbedding = generateEmbeddingFromStats(teammateStats.statistics);
        synergyGraphEngine.setPlayerEmbedding(teammateId, teammateEmbedding);
        synergyGraphEngine.setPlayerName(teammateId, teammateId);
      }
    }
  }

  const synergyNetwork = synergyGraphEngine.getPlayerNetwork(playerId);
  const topTeammates = synergyNetwork
    .slice(0, 5)
    .map(e => ({
      playerId: e.playerA === playerId ? e.playerB : e.playerA,
      synergyScore: e.synergyScore,
    }));

  let scoutingReport: ScoutingReportOutput | null = null;
  if (includeReport && stats) {
    const reportInput: ScoutingReportInput = {
      playerId,
      playerName: player?.name,
      stats: {
        gamesPlayed: stats.gamesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        killsPerGame: stats.killsPerGame,
        deathsPerGame: stats.deathsPerGame,
        assistsPerGame: stats.assistsPerGame,
        kdaRatio: stats.kdaRatio,
        headshotPercentage: stats.headshotPercentage,
        clutchRate: stats.clutchesWon && stats.clutchesLost
          ? stats.clutchesWon / (stats.clutchesWon + stats.clutchesLost)
          : undefined,
      },
      role: {
        role: roleInfo.detectedRole,
        confidence: roleInfo.confidence,
      },
      eloRating: {
        rating: eloRating.rating,
        rank: eloEngine.getPlayerRank(playerId),
        peakRating: eloRating.peakRating,
      },
      cluster: {
        clusterId: cluster.clusterId,
        clusterName: cluster.clusterName,
        description: cluster.description,
        confidence: cluster.confidence,
      },
      synergy: {
        topTeammates,
        centrality: synergyGraphEngine.getPlayerCentrality(playerId),
      },
    };

    scoutingReport = await generateScoutingReport(reportInput);
  }

  return {
    playerId,
    player: {
      id: player?.id || playerId,
      name: player?.name || playerId,
      nickname: player?.nickname,
      teams: player?.teams?.map(t => ({ id: t.id, name: t.name })),
    },
    stats,
    features,
    embedding,
    role: roleInfo,
    cluster: {
      clusterId: cluster.clusterId,
      clusterName: cluster.clusterName,
      description: cluster.description,
      confidence: cluster.confidence,
    },
    eloRating,
    synergyGraph: {
      centrality: synergyGraphEngine.getPlayerCentrality(playerId),
      topTeammates,
    },
    scoutingReport,
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource,
      gamesAnalyzed: stats?.gamesPlayed || 0,
    },
  };
}

function extractPlayerFeatures(stats: PlayerStatistics | null, seriesStats: any): EmbeddingFeatures {
  if (!stats) {
    return {
      killsAvg: 0.5,
      deathsAvg: 0.5,
      winRate: 0.5,
      aggressionIndex: 0.5,
      consistencyScore: 0.5,
      clutchFactor: 0.5,
      kdaRatio: 0.5,
      impactScore: 0.5,
    };
  }

  const killsAvg = Math.min(1, stats.killsPerGame / 25);
  const deathsAvg = Math.min(1, stats.deathsPerGame / 20);
  const winRate = stats.winRate;
  const kdaRatio = Math.min(1, stats.kdaRatio / 3);
  const aggressionIndex = killsAvg * 0.6 + kdaRatio * 0.3 + (1 - deathsAvg) * 0.1;
  const consistencyScore = kdaRatio * 0.5 + winRate * 0.5;
  const clutchRate = stats.clutchesWon && stats.clutchesLost
    ? stats.clutchesWon / (stats.clutchesWon + stats.clutchesLost)
    : 0.5;
  const clutchFactor = clutchRate * 0.7 + kdaRatio * 0.3;
  const impactScore = kdaRatio * 0.4 + winRate * 0.4 + (stats.headshotPercentage || 0) * 2;

  return {
    killsAvg: Math.round(killsAvg * 1000) / 1000,
    deathsAvg: Math.round(deathsAvg * 1000) / 1000,
    winRate: Math.round(winRate * 1000) / 1000,
    aggressionIndex: Math.round(Math.min(1, aggressionIndex) * 1000) / 1000,
    consistencyScore: Math.round(consistencyScore * 1000) / 1000,
    clutchFactor: Math.round(clutchFactor * 1000) / 1000,
    kdaRatio: Math.round(kdaRatio * 1000) / 1000,
    impactScore: Math.round(Math.min(1, impactScore) * 1000) / 1000,
  };
}

export async function searchAndAnalyzePlayers(
  query: string,
  limit: number = 5
): Promise<PlayerIntelligence[]> {
  const players = await searchPlayersByName(query, limit);

  const results: PlayerIntelligence[] = [];
  for (const player of players.slice(0, limit)) {
    try {
      const intel = await runPlayerEngine({
        playerId: player.id,
        includeReport: false,
      });
      results.push(intel);
    } catch (error) {
      console.error(`Error analyzing player ${player.id}:`, error);
    }
  }

  return results;
}

export function recordPlayerMatch(
  playerIds: string[],
  result: 'win' | 'loss',
  timestamp?: string
): void {
  synergyGraphEngine.recordMatchResult(playerIds, result, timestamp);

  for (const playerId of playerIds) {
    const playerElo = eloEngine.getRating(playerId);
    if (playerElo.gamesPlayed > 0) {
      const opponentId = playerIds.find(id => id !== playerId) || 'unknown';
      const isUpset = result === 'win' && playerElo.rating < 1000;
      eloEngine.updateRating(playerId, opponentId, result, isUpset);
    }
  }
}

