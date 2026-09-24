/**
 * ScoutIQ Intelligence Layer - Ensemble Engine
 * 
 * Combines multiple prediction models into a final probability.
 * Uses weighted averaging with confidence-based adjustments.
 */

import { PredictionResult, PredictionFactor, ModelPrediction, EnsembleConfig } from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface EnsembleResult {
  finalProbability: number;
  confidence: number;
  modelContributions: Array<{
    model: string;
    probability: number;
    weight: number;
    contribution: number;
  }>;
  factors: PredictionFactor[];
}

export interface ModelWeights {
  stats: number;
  elo: number;
  trend: number;
  graph: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_ENSEMBLE_CONFIG: EnsembleConfig = {
  statsWeight: 0.30,
  eloWeight: 0.35,
  trendWeight: 0.20,
  graphWeight: 0.15,
};

// ============================================================================
// Ensemble Functions
// ============================================================================

export function createEnsemble(
  predictions: ModelPrediction[],
  config: EnsembleConfig = DEFAULT_ENSEMBLE_CONFIG
): EnsembleResult {
  if (predictions.length === 0) {
    return {
      finalProbability: 0.5,
      confidence: 0.3,
      modelContributions: [],
      factors: [],
    };
  }
  
  // Calculate weighted contributions
  const contributions = predictions.map(pred => {
    let weight: number;
    switch (pred.model) {
      case 'stats': weight = config.statsWeight; break;
      case 'elo': weight = config.eloWeight; break;
      case 'trend': weight = config.trendWeight; break;
      case 'graph': weight = config.graphWeight; break;
      default: weight = 1 / predictions.length;
    }
    
    return {
      model: pred.model,
      probability: pred.probability,
      weight,
      contribution: pred.probability * weight,
    };
  });
  
  // Calculate final probability
  const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
  const totalContribution = contributions.reduce((sum, c) => sum + c.contribution, 0);
  const finalProbability = totalWeight > 0 ? totalContribution / totalWeight : 0.5;
  
  // Calculate confidence based on model agreement
  const probabilities = predictions.map(p => p.probability);
  const variance = calculateVariance(probabilities);
  const modelAgreement = 1 - Math.sqrt(variance) * 2;
  const confidence = Math.max(0.3, Math.min(0.95, modelAgreement * predictions[0].confidence));
  
  // Extract factors from all predictions
  const allFactors = predictions.flatMap(p => 
    Object.entries(p.factors || {}).map(([name, value]) => ({
      name,
      impact: Math.abs(value),
      direction: value > 0 ? 'teamA' : value < 0 ? 'teamB' : 'neutral' as 'teamA' | 'teamB' | 'neutral',
      description: `${p.model}: ${name}`,
    }))
  );
  
  return {
    finalProbability: Math.round(finalProbability * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
    modelContributions: contributions,
    factors: allFactors,
  };
}

export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateStandardDeviation(values: number[]): number {
  return Math.sqrt(calculateVariance(values));
}

export function calculateInterquartileRange(values: number[]): number {
  if (values.length < 4) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return q3 - q1;
}

// ============================================================================
// Model Aggregation Strategies
// ============================================================================

export function weightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length || values.length === 0) {
    return 0.5;
  }
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0.5;
  
  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
}

export function geometricMean(values: number[]): number {
  if (values.length === 0 || values.some(v => v <= 0)) {
    return 0.5;
  }
  
  const product = values.reduce((prod, v) => prod * v, 1);
  return Math.pow(product, 1 / values.length);
}

export function harmonicMean(values: number[]): number {
  if (values.length === 0 || values.some(v => v <= 0)) {
    return 0.5;
  }
  
  const sumReciprocals = values.reduce((sum, v) => sum + 1 / v, 0);
  return values.length / sumReciprocals;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0.5;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function trimmedMean(
  values: number[],
  trimPercent: number = 0.1
): number {
  if (values.length < 3) return median(values);
  
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(values.length * trimPercent);
  
  const trimmed = sorted.slice(trimCount, values.length - trimCount);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

// ============================================================================
// Adaptive Weighting
// ============================================================================

export function adaptWeightsBasedOnConfidence(
  predictions: ModelPrediction[],
  targetConfidence: number = 0.7
): number[] {
  const confidences = predictions.map(p => p.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  
  // Adjust weights based on how much each model exceeds target
  return predictions.map((p, i) => {
    const adjustment = Math.max(0.2, p.confidence / avgConfidence);
    return 1 / predictions.length * adjustment;
  });
}

export function adaptWeightsBasedOnRecentPerformance(
  predictions: ModelPrediction[],
  recentAccuracy: Map<string, number>
): number[] {
  return predictions.map(p => {
    const accuracy = recentAccuracy.get(p.model) || 0.5;
    return accuracy * accuracy; // Square to emphasize better models
  });
}

export function normalizeWeights(weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) {
    const equal = 1 / weights.length;
    return weights.map(() => equal);
  }
  return weights.map(w => w / total);
}

// ============================================================================
// Prediction Result Generation
// ============================================================================

export function generateEnsemblePrediction(
  ensemble: EnsembleResult,
  teamAId: string,
  teamBId: string,
  teamAName: string,
  teamBName: string
): PredictionResult {
  const winner = ensemble.finalProbability > 0.5 ? teamAName : teamBName;
  const winProb = Math.max(ensemble.finalProbability, 1 - ensemble.finalProbability);
  
  // Calculate expected score
  const scoreDiff = Math.abs(ensemble.finalProbability - 0.5);
  let expectedScore: string;
  
  if (scoreDiff < 0.1) {
    expectedScore = '2-1';
  } else if (winProb > 0.75) {
    expectedScore = '2-0';
  } else if (winProb > 0.6) {
    expectedScore = '2-1';
  } else {
    expectedScore = '1-2';
  }
  
  return {
    winner,
    winProbability: winProb,
    expectedScore,
    confidence: ensemble.confidence,
    factors: ensemble.factors,
  };
}

export default {
  createEnsemble,
  weightedAverage,
  geometricMean,
  harmonicMean,
  median,
  trimmedMean,
  adaptWeightsBasedOnConfidence,
  adaptWeightsBasedOnRecentPerformance,
  normalizeWeights,
  generateEnsemblePrediction,
  DEFAULT_ENSEMBLE_CONFIG,
};

