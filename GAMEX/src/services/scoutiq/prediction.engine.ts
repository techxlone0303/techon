import { FeatureVector } from './features.v2.engine';

export interface PredictionResult {
  winProbabilityA: number;
  winProbabilityB: number;
  upsetLikelihood: number;
  confidence: number;
  keyFactors: string[];
  featureDelta: Record<string, number>;
}

const WEIGHTS = {
  winRate: 0.30,
  killEfficiency: 0.12,
  aggressionIndex: 0.08,
  clutchFactor: 0.10,
  momentumScore: 0.15,
  headToHeadScore: 0.12,
  stabilityIndex: 0.08,
  experienceScore: 0.05,
};

function computeRawScore(features: FeatureVector): number {
  return (
    features.winRate * WEIGHTS.winRate +
    features.killEfficiency * WEIGHTS.killEfficiency +
    features.aggressionIndex * WEIGHTS.aggressionIndex +
    features.clutchFactor * WEIGHTS.clutchFactor +
    features.momentumScore * WEIGHTS.momentumScore +
    features.headToHeadScore * WEIGHTS.headToHeadScore +
    features.stabilityIndex * WEIGHTS.stabilityIndex +
    features.experienceScore * WEIGHTS.experienceScore
  );
}

function computeFeatureDelta(featuresA: FeatureVector, featuresB: FeatureVector): Record<string, number> {
  return {
    winRate: featuresA.winRate - featuresB.winRate,
    killEfficiency: featuresA.killEfficiency - featuresB.killEfficiency,
    aggressionIndex: featuresA.aggressionIndex - featuresB.aggressionIndex,
    clutchFactor: featuresA.clutchFactor - featuresB.clutchFactor,
    momentumScore: featuresA.momentumScore - featuresB.momentumScore,
    headToHeadScore: featuresA.headToHeadScore - featuresB.headToHeadScore,
    stabilityIndex: featuresA.stabilityIndex - featuresB.stabilityIndex,
    experienceScore: featuresA.experienceScore - featuresB.experienceScore,
  };
}

function generateKeyFactors(delta: Record<string, number>): string[] {
  const factors: string[] = [];
  const threshold = 0.08;

  if (delta.winRate > threshold) {
    factors.push('Superior win rate');
  } else if (delta.winRate < -threshold) {
    factors.push('Win rate disadvantage');
  }

  if (delta.momentumScore > threshold) {
    factors.push('Strong recent momentum');
  } else if (delta.momentumScore < -threshold) {
    factors.push('Lacks recent momentum');
  }

  if (delta.headToHeadScore > threshold) {
    factors.push('Historical head-to-head advantage');
  } else if (delta.headToHeadScore < -threshold) {
    factors.push('Historical head-to-head disadvantage');
  }

  if (delta.clutchFactor > threshold) {
    factors.push('Better clutch performance');
  } else if (delta.clutchFactor < -threshold) {
    factors.push('Clutch performance concern');
  }

  if (delta.stabilityIndex > threshold) {
    factors.push('More consistent performances');
  } else if (delta.stabilityIndex < -threshold) {
    factors.push('Inconsistent performances');
  }

  if (delta.experienceScore > 0.2) {
    factors.push('Experience advantage');
  } else if (delta.experienceScore < -0.2) {
    factors.push('Experience gap');
  }

  return factors.length > 0 ? factors : ['Comparable team strengths'];
}

function bayesianAdjust(
  rawProb: number,
  prior: number,
  sampleSize: number,
  strength: number
): number {
  const alpha = 1 + sampleSize * strength;
  const beta = 1 + sampleSize * (1 - strength);

  const posterior = (prior * 2 + rawProb * sampleSize) / (2 + sampleSize);

  return Math.max(0.05, Math.min(0.95, posterior));
}

export function predictMatch(
  featuresA: FeatureVector,
  featuresB: FeatureVector
): PredictionResult {
  const rawScoreA = computeRawScore(featuresA);
  const rawScoreB = computeRawScore(featuresB);
  const totalRaw = rawScoreA + rawScoreB;

  let baseProbA: number;
  let baseProbB: number;

  if (totalRaw === 0) {
    baseProbA = 0.5;
    baseProbB = 0.5;
  } else {
    baseProbA = rawScoreA / totalRaw;
    baseProbB = rawScoreB / totalRaw;
  }

  const sampleSizeA = featuresA.experienceScore * 100;
  const sampleSizeB = featuresB.experienceScore * 100;

  const winProbA = bayesianAdjust(baseProbA, 0.5, sampleSizeA, featuresA.winRate);
  const winProbB = 1 - winProbA;

  const confidenceA = Math.min(1, sampleSizeA / 50);
  const confidenceB = Math.min(1, sampleSizeB / 50);
  const confidence = (confidenceA + confidenceB) / 2;

  const avgWinRate = (featuresA.winRate + featuresB.winRate) / 2;
  const upsetLikelihood = avgWinRate < 0.3 || avgWinRate > 0.7 ? 0.15 : 0.05;

  const featureDelta = computeFeatureDelta(featuresA, featuresB);
  const keyFactors = generateKeyFactors(featureDelta);

  return {
    winProbabilityA: Math.round(winProbA * 1000) / 1000,
    winProbabilityB: Math.round(winProbB * 1000) / 1000,
    upsetLikelihood: Math.round(upsetLikelihood * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
    keyFactors,
    featureDelta,
  };
}

