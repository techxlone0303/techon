export interface TeamFeatures {
  win_rate: number;
  aggression_score: number;
  consistency_score: number;
  momentum_score: number;
  volatility_index: number;
}

export interface RawTeamStats {
  teamId?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKillsPerSeries: number;
  seriesKillAverage?: number | null;
  timeWindow?: string;
}

export function extractFeatures(stats: RawTeamStats | null): TeamFeatures {
  if (!stats) {
    return {
      win_rate: 0.5,
      aggression_score: 0.5,
      consistency_score: 0.5,
      momentum_score: 0.5,
      volatility_index: 0.5,
    };
  }

  const { gamesPlayed, wins, losses, winRate, avgKillsPerSeries } = stats;

  const win_rate = Math.max(0, Math.min(1, winRate));

  const aggression_score = gamesPlayed > 0
    ? Math.min(1, (avgKillsPerSeries || 0) / 25)
    : 0.5;

  const totalGames = gamesPlayed;
  const winRateVal = winRate;
  const lossRateVal = 1 - winRateVal;

  const consistency_score = totalGames > 0
    ? 1 - Math.sqrt((winRateVal * lossRateVal) * 2)
    : 0.5;

  const momentum_score = gamesPlayed >= 3
    ? 0.5 + ((winRateVal - 0.5) * Math.min(1, gamesPlayed / 10))
    : 0.5;

  const volatility_index = totalGames > 0
    ? Math.min(1, Math.abs(lossRateVal - winRateVal) + (totalGames < 5 ? 0.2 : 0))
    : 0.5;

  return {
    win_rate,
    aggression_score: Math.round(aggression_score * 1000) / 1000,
    consistency_score: Math.round(consistency_score * 1000) / 1000,
    momentum_score: Math.round(momentum_score * 1000) / 1000,
    volatility_index: Math.round(volatility_index * 1000) / 1000,
  };
}

export function normalizeFeatures(features: TeamFeatures): Record<string, number> {
  return {
    win_rate_norm: features.win_rate,
    aggression_norm: features.aggression_score,
    consistency_norm: features.consistency_score,
    momentum_norm: features.momentum_score,
    volatility_norm: features.volatility_index,
  };
}

export function computeFeatureVector(features: TeamFeatures): number[] {
  return [
    features.win_rate,
    features.aggression_score,
    features.consistency_score,
    features.momentum_score,
    1 - features.volatility_index,
  ];
}

