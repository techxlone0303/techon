import { runPlayerEngine, PlayerIntelligence, recordPlayerMatch } from './playerEngine';
import { getTeamStats, TeamStatistics } from '../grid/stats.service';
import { analyzeMatchup, MatchupPrediction } from '../scoutiq/matchup.engine';
import { extractFeatures, TeamFeatures } from '../scoutiq/features.engine';
import { synergyGraphEngine, TeamSynergyReport, SynergyEdge } from '../ai/synergyGraph.service';
import { eloEngine } from '../ai/elo.service';

export interface TeamIntelligence {
  teamId: string;
  teamName: string;
  statistics: TeamStatistics | null;
  features: TeamFeatures;
  roster: PlayerIntelligence[];
  synergyReport: TeamSynergyReport;
  recentPerformance: {
    wins: number;
    losses: number;
    winRate: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  eloRatings: Array<{ playerId: string; rating: number; rank: number }>;
  metadata: {
    generatedAt: string;
    rosterSize: number;
    avgPlayerElo: number;
  };
}

export interface TeamEngineInput {
  teamId: string;
  playerIds: string[];
  teamName?: string;
  recentMatchResults?: Array<{ playerIds: string[]; result: 'win' | 'loss' }>;
}

export async function runTeamEngine(input: TeamEngineInput): Promise<TeamIntelligence> {
  const { teamId, playerIds, teamName, recentMatchResults = [] } = input;

  const [teamStats, ...playerIntelligences] = await Promise.all([
    getTeamStats(teamId).catch(() => ({ teamId, statistics: null, fetchedAt: new Date().toISOString() })),
    ...playerIds.map(playerId => runPlayerEngine({
      playerId,
      includeReport: false,
      includeSynergy: true,
      teamMates: playerIds,
    })),
  ]);

  const features = extractFeatures({
    teamId,
    gamesPlayed: teamStats.statistics?.gamesPlayed || 0,
    wins: teamStats.statistics?.wins || 0,
    losses: teamStats.statistics?.losses || 0,
    winRate: teamStats.statistics?.winRate || 0.5,
    avgKillsPerSeries: teamStats.statistics?.avgKillsPerSeries || 0,
  });

  for (const match of recentMatchResults) {
    recordPlayerMatch(match.playerIds, match.result);
  }

  const rosterIntelligences = playerIntelligences.filter(
    (p): p is PlayerIntelligence => p !== null
  );

  const synergyReport = synergyGraphEngine.getTeamSynergyReport(teamId, playerIds);

  const totalWins = teamStats.statistics?.wins || rosterIntelligences.reduce(
    (sum, p) => sum + (p.stats?.wins || 0), 0
  );
  const totalLosses = teamStats.statistics?.losses || rosterIntelligences.reduce(
    (sum, p) => sum + (p.stats?.losses || 0), 0
  );
  const totalGames = totalWins + totalLosses;
  const winRate = totalGames > 0 ? totalWins / totalGames : 0.5;

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (rosterIntelligences.length > 0) {
    const recentWinRates = rosterIntelligences.map(p => p.stats?.winRate || 0.5);
    const avgWinRate = recentWinRates.reduce((a, b) => a + b, 0) / recentWinRates.length;
    if (avgWinRate > winRate + 0.05) trend = 'improving';
    else if (avgWinRate < winRate - 0.05) trend = 'declining';
  }

  const eloRatings = rosterIntelligences.map(p => ({
    playerId: p.playerId,
    rating: p.eloRating.rating,
    rank: eloEngine.getPlayerRank(p.playerId),
  }));

  const avgPlayerElo = eloRatings.length > 0
    ? eloRatings.reduce((sum, e) => sum + e.rating, 0) / eloRatings.length
    : 1000;

  return {
    teamId,
    teamName: teamName || teamId,
    statistics: teamStats.statistics,
    features,
    roster: rosterIntelligences,
    synergyReport,
    recentPerformance: {
      wins: totalWins,
      losses: totalLosses,
      winRate,
      trend,
    },
    eloRatings,
    metadata: {
      generatedAt: new Date().toISOString(),
      rosterSize: rosterIntelligences.length,
      avgPlayerElo: Math.round(avgPlayerElo),
    },
  };
}

export async function analyzeTeamMatchup(
  teamA: TeamEngineInput,
  teamB: TeamEngineInput
): Promise<{
  teamAIntel: TeamIntelligence;
  teamBIntel: TeamIntelligence;
  prediction: MatchupPrediction;
  headToHead: {
    games: number;
    teamAWins: number;
    teamBWins: number;
    winRateA: number;
    winRateB: number;
  };
  recommendations: {
    keyMatchup: string;
    xFactor: string;
    predictedOutcome: string;
  };
}> {
  const [teamAIntel, teamBIntel] = await Promise.all([
    runTeamEngine(teamA),
    runTeamEngine(teamB),
  ]);

  const prediction = analyzeMatchup(teamAIntel.features, teamBIntel.features);

  const teamAWins = Math.round(
    teamAIntel.recentPerformance.wins * (teamAIntel.recentPerformance.winRate / teamBIntel.recentPerformance.winRate)
  );
  const teamBWins = teamAIntel.recentPerformance.wins + teamBIntel.recentPerformance.wins - teamAWins;
  const games = teamAWins + teamBWins || 1;

  const recommendations = {
    keyMatchup: `${teamAIntel.roster[0]?.player.name || teamA.teamId} vs ${teamBIntel.roster[0]?.player.name || teamB.teamId}`,
    xFactor: prediction.confidenceScore > 0.7
      ? (prediction.teamA_win_probability > prediction.teamB_win_probability
          ? teamAIntel.teamName
          : teamBIntel.teamName)
      : 'Recent form',
    predictedOutcome: prediction.teamA_win_probability > prediction.teamB_win_probability
      ? `${teamAIntel.teamName} wins ${(prediction.teamA_win_probability * 100).toFixed(0)}%`
      : `${teamBIntel.teamName} wins ${(prediction.teamB_win_probability * 100).toFixed(0)}%`,
  };

  return {
    teamAIntel,
    teamBIntel,
    prediction,
    headToHead: {
      games,
      teamAWins,
      teamBWins,
      winRateA: teamAWins / games,
      winRateB: teamBWins / games,
    },
    recommendations,
  };
}

export function getTeamLeaderboard(teams: TeamIntelligence[]): Array<{
  rank: number;
  teamId: string;
  teamName: string;
  winRate: number;
  avgPlayerElo: number;
  synergyScore: number;
}> {
  return teams
    .map((team, index) => ({
      rank: index + 1,
      teamId: team.teamId,
      teamName: team.teamName,
      winRate: team.recentPerformance.winRate,
      avgPlayerElo: team.metadata.avgPlayerElo,
      synergyScore: team.synergyReport.overallSynergy,
    }))
    .sort((a, b) => {
      const scoreA = a.winRate * 0.4 + (a.avgPlayerElo / 2000) * 0.3 + a.synergyScore * 0.3;
      const scoreB = b.winRate * 0.4 + (b.avgPlayerElo / 2000) * 0.3 + b.synergyScore * 0.3;
      return scoreB - scoreA;
    })
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

