import { TeamFeatures, extractFeatures, computeFeatureVector } from './features.engine';

export interface MatchupPrediction {
  teamA_win_probability: number;
  teamB_win_probability: number;
  advantageFactors: string[];
  riskFactors: string[];
  confidenceScore: number;
}

export interface TeamFeaturesInput {
  teamId: string;
  teamName: string;
  features: TeamFeatures;
}

const WEIGHTS = {
  win_rate: 0.35,
  aggression: 0.15,
  consistency: 0.2,
  momentum: 0.2,
  stability: 0.1,
};

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function computeStrengthScore(features: TeamFeatures): number {
  const vector = computeFeatureVector(features);
  const weights = [
    WEIGHTS.win_rate,
    WEIGHTS.aggression,
    WEIGHTS.consistency,
    WEIGHTS.momentum,
    WEIGHTS.stability,
  ];
  return dotProduct(vector, weights);
}

function computeAdvantageFactors(
  featuresA: TeamFeatures,
  featuresB: TeamFeatures,
  teamAName: string,
  teamBName: string
): string[] {
  const factors: string[] = [];
  const diff = {
    win_rate: featuresA.win_rate - featuresB.win_rate,
    aggression: featuresA.aggression_score - featuresB.aggression_score,
    consistency: featuresA.consistency_score - featuresB.consistency_score,
    momentum: featuresA.momentum_score - featuresB.momentum_score,
    stability: (1 - featuresA.volatility_index) - (1 - featuresB.volatility_index),
  };

  if (diff.win_rate > 0.1) {
    factors.push(`${teamAName} has superior win rate (+${(diff.win_rate * 100).toFixed(1)}%)`);
  }
  if (diff.aggression > 0.15) {
    factors.push(`${teamAName} plays more aggressively`);
  }
  if (diff.consistency > 0.1) {
    factors.push(`${teamAName} shows more consistent performance`);
  }
  if (diff.momentum > 0.1) {
    factors.push(`${teamAName} enters with positive momentum`);
  }
  if (diff.stability > 0.1) {
    factors.push(`${teamAName} demonstrates lower volatility`);
  }

  return factors;
}

function computeRiskFactors(
  featuresA: TeamFeatures,
  featuresB: TeamFeatures,
  teamAName: string,
  teamBName: string
): string[] {
  const risks: string[] = [];
  const diff = {
    win_rate: featuresA.win_rate - featuresB.win_rate,
    momentum: featuresA.momentum_score - featuresB.momentum_score,
    volatility: featuresA.volatility_index - featuresB.volatility_index,
  };

  if (diff.win_rate < -0.1) {
    risks.push(`${teamAName} trails in win rate against ${teamBName}`);
  }
  if (diff.momentum < -0.1) {
    risks.push(`${teamAName} may lack recent match momentum`);
  }
  if (diff.volatility > 0.15) {
    risks.push(`${teamAName} shows higher performance volatility`);
  }

  return risks;
}

export function analyzeMatchup(
  teamAFeatures: TeamFeatures,
  teamBFeatures: TeamFeatures,
  teamAName: string = 'Team A',
  teamBName: string = 'Team B'
): MatchupPrediction {
  const strengthA = computeStrengthScore(teamAFeatures);
  const strengthB = computeStrengthScore(teamBFeatures);

  const totalStrength = strengthA + strengthB;
  let winProbA: number;
  let winProbB: number;

  if (totalStrength === 0) {
    winProbA = 0.5;
    winProbB = 0.5;
  } else {
    winProbA = Math.max(0.1, Math.min(0.9, strengthA / totalStrength));
    winProbB = 1 - winProbA;
  }

  const sampleWeightA = Math.min((teamAFeatures.win_rate > 0 ? 1 : 0) * (teamAFeatures.momentum_score), 1);
  const sampleWeightB = Math.min((teamBFeatures.win_rate > 0 ? 1 : 0) * (teamBFeatures.momentum_score), 1);
  const confidenceScore = (sampleWeightA + sampleWeightB) / 2;

  const advantageFactors = computeAdvantageFactors(teamAFeatures, teamBFeatures, teamAName, teamBName);
  const riskFactors = computeRiskFactors(teamAFeatures, teamBFeatures, teamAName, teamBName);

  return {
    teamA_win_probability: Math.round(winProbA * 1000) / 1000,
    teamB_win_probability: Math.round(winProbB * 1000) / 1000,
    advantageFactors,
    riskFactors,
    confidenceScore: Math.round(confidenceScore * 1000) / 1000,
  };
}

