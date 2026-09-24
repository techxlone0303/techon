import { StatsProfile, normalizeStats } from './data.normalizer';
import { matchHistoryStore, TeamTrend } from './history.engine';

export interface FeatureVector {
  winRate: number;
  killEfficiency: number;
  aggressionIndex: number;
  clutchFactor: number;
  momentumScore: number;
  headToHeadScore: number;
  stabilityIndex: number;
  experienceScore: number;
}

export interface FeatureInput {
  teamId: string;
  stats: StatsProfile | null;
  trend: TeamTrend;
  h2hScore?: number;
}

function calculateKillEfficiency(stats: StatsProfile | null, avgKillsBaseline: number = 20): number {
  if (!stats || stats.gamesPlayed === 0) {
    return 0.5;
  }
  return Math.min(1, (stats.avgKillsPerSeries || 0) / avgKillsBaseline);
}

function calculateAggressionIndex(stats: StatsProfile | null): number {
  if (!stats || stats.gamesPlayed === 0) {
    return 0.5;
  }
  const winRate = stats.winRate;
  const tempoFactor = Math.abs(winRate - 0.5) * 2;
  return 0.5 + (tempoFactor * 0.3);
}

function calculateClutchFactor(trend: TeamTrend): number {
  if (trend.recentForm.length < 3) {
    return 0.5;
  }
  const recentMatches = trend.recentForm.slice(0, 5);
  const closeWins = recentMatches.filter((r, i) => {
    if (r !== 1) return false;
    return true;
  }).length;
  return Math.min(1, 0.3 + (closeWins / recentMatches.length) * 0.5);
}

function calculateMomentumScore(trend: TeamTrend): number {
  if (trend.recentForm.length === 0) {
    return 0.5;
  }
  let weightedSum = 0;
  let weightTotal = 0;
  const decayFactor = 0.8;

  for (let i = 0; i < trend.recentForm.length; i++) {
    const weight = Math.pow(decayFactor, i);
    weightedSum += trend.recentForm[i] * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0.5;
}

function calculateHeadToHeadScore(h2hScore: number | undefined): number {
  if (typeof h2hScore !== 'number' || isNaN(h2hScore)) {
    return 0.5;
  }
  return Math.max(0, Math.min(1, h2hScore));
}

function calculateStabilityIndex(trend: TeamTrend): number {
  if (trend.recentForm.length < 3) {
    return 0.5;
  }
  const variance = trend.recentForm.reduce((sum, val) => {
    const mean = trend.recentForm.reduce((a, b) => a + b, 0) / trend.recentForm.length;
    return sum + Math.pow(val - mean, 2);
  }, 0) / trend.recentForm.length;

  return Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));
}

function calculateExperienceScore(trend: TeamTrend): number {
  const totalMatches = trend.totalMatches;
  if (totalMatches >= 50) return 1.0;
  if (totalMatches >= 20) return 0.8;
  if (totalMatches >= 10) return 0.6;
  if (totalMatches >= 5) return 0.4;
  return 0.2;
}

export function buildFeatureVector(input: FeatureInput): FeatureVector {
  const { stats, trend, h2hScore } = input;

  const winRate = stats?.winRate ?? 0.5;
  const killEfficiency = calculateKillEfficiency(stats);
  const aggressionIndex = calculateAggressionIndex(stats);
  const clutchFactor = calculateClutchFactor(trend);
  const momentumScore = calculateMomentumScore(trend);
  const headToHeadScore = calculateHeadToHeadScore(h2hScore);
  const stabilityIndex = calculateStabilityIndex(trend);
  const experienceScore = calculateExperienceScore(trend);

  return {
    winRate: Math.round(winRate * 1000) / 1000,
    killEfficiency: Math.round(killEfficiency * 1000) / 1000,
    aggressionIndex: Math.round(aggressionIndex * 1000) / 1000,
    clutchFactor: Math.round(clutchFactor * 1000) / 1000,
    momentumScore: Math.round(momentumScore * 1000) / 1000,
    headToHeadScore: Math.round(headToHeadScore * 1000) / 1000,
    stabilityIndex: Math.round(stabilityIndex * 1000) / 1000,
    experienceScore: Math.round(experienceScore * 1000) / 1000,
  };
}

export function buildFeatureVectorFromRaw(
  teamId: string,
  rawStats: any,
  h2hScore?: number
): FeatureVector {
  const stats = normalizeStats(rawStats);
  const trend = matchHistoryStore.getTrend(teamId);
  return buildFeatureVector({ teamId, stats, trend, h2hScore });
}

