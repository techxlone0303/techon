import { PlayerStatistics } from '../grid/playerStats.service';

export interface PlayerEmbedding {
  vector: number[];
  dimensions: number;
  generatedAt: string;
}

export interface EmbeddingFeatures {
  killsAvg: number;
  deathsAvg: number;
  winRate: number;
  aggressionIndex: number;
  consistencyScore: number;
  clutchFactor: number;
  kdaRatio: number;
  impactScore: number;
}

const EMBEDDING_DIMENSIONS = 16;

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function calculateAggressionIndex(stats: PlayerStatistics): number {
  const { killsPerGame, deathsPerGame, kdaRatio } = stats;
  const aggressionBase = (killsPerGame * 0.4) + (kdaRatio * 0.3) - (deathsPerGame * 0.1);
  return Math.max(0, Math.min(1, 0.5 + aggressionBase));
}

function calculateConsistencyScore(stats: PlayerStatistics): number {
  const { kdaRatio, winRate } = stats;
  const kdaVariance = Math.min(1, kdaRatio / 3);
  const winConsistency = winRate;
  return (kdaVariance * 0.5 + winConsistency * 0.5);
}

function calculateClutchFactor(stats: PlayerStatistics): number {
  const { clutchesWon, clutchesLost, kdaRatio } = stats;
  const totalClutches = (clutchesWon || 0) + (clutchesLost || 0);
  if (totalClutches === 0) return 0.5;
  const clutchRate = clutchesWon! / totalClutches;
  return (clutchRate * 0.7 + Math.min(1, kdaRatio / 3) * 0.3);
}

function calculateImpactScore(stats: PlayerStatistics): number {
  const { kdaRatio, winRate, headshotPercentage, firstBloodContribution } = stats;
  const kdaImpact = Math.min(1, kdaRatio / 2.5);
  const winImpact = winRate;
  const hsImpact = (headshotPercentage || 0) * 2;
  const fbImpact = (firstBloodContribution || 0) * 5;
  return Math.min(1, (kdaImpact * 0.4 + winImpact * 0.4 + hsImpact * 0.1 + fbImpact * 0.1));
}

export function extractFeatures(stats: PlayerStatistics | null): EmbeddingFeatures {
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

  const normalizedKills = normalize(stats.killsPerGame, 0, 30);
  const normalizedDeaths = normalize(stats.deathsPerGame, 0, 25);
  const normalizedKDA = normalize(stats.kdaRatio, 0, 3);

  return {
    killsAvg: Math.round(normalizedKills * 1000) / 1000,
    deathsAvg: Math.round(normalizedDeaths * 1000) / 1000,
    winRate: Math.round(stats.winRate * 1000) / 1000,
    aggressionIndex: Math.round(calculateAggressionIndex(stats) * 1000) / 1000,
    consistencyScore: Math.round(calculateConsistencyScore(stats) * 1000) / 1000,
    clutchFactor: Math.round(calculateClutchFactor(stats) * 1000) / 1000,
    kdaRatio: Math.round(normalizedKDA * 1000) / 1000,
    impactScore: Math.round(calculateImpactScore(stats) * 1000) / 1000,
  };
}

export function generateEmbedding(features: EmbeddingFeatures): PlayerEmbedding {
  const vector: number[] = [
    features.killsAvg,
    features.deathsAvg,
    features.winRate,
    features.aggressionIndex,
    features.consistencyScore,
    features.clutchFactor,
    features.kdaRatio,
    features.impactScore,
    features.killsAvg * features.winRate,
    features.killsAvg * features.aggressionIndex,
    features.kdaRatio * features.consistencyScore,
    features.clutchFactor * features.winRate,
    features.impactScore * features.kdaRatio,
    features.consistencyScore * features.aggressionIndex,
    Math.sin(features.killsAvg * Math.PI),
    Math.cos(features.deathsAvg * Math.PI),
  ];

  return {
    vector: vector.map(v => Math.round(v * 1000) / 1000),
    dimensions: EMBEDDING_DIMENSIONS,
    generatedAt: new Date().toISOString(),
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return 1;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

export function generateEmbeddingFromStats(stats: PlayerStatistics | null): PlayerEmbedding {
  const features = extractFeatures(stats);
  return generateEmbedding(features);
}

