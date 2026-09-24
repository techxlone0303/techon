/**
 * ScoutIQ Intelligence Layer - Win Probability Engine
 * 
 * Computes win probabilities using multiple models:
 * - Elo-based probability
 * - Stats-based probability
 * - Trend-based probability
 * - Graph synergy probability
 * 
 * Final probability is a weighted ensemble of all models.
 */

import { TeamData, PlayerData, PredictionResult, PredictionFactor, TeamFeatures } from '../types';
import { calculateExpectedScore } from '../rating/elo.engine';
import { extractTeamFeatures, extractMatchupFeatures } from '../features/team.features';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ProbabilityConfig {
  eloWeight: number;
  statsWeight: number;
  trendWeight: number;
  graphWeight: number;
}

export interface ModelProbabilities {
  elo: number;
  stats: number;
  trend: number;
  graph: number;
  combined: number;
}

export interface ProbabilityBreakdown {
  teamA: ModelProbabilities;
  teamB: ModelProbabilities;
  finalWinProbabilityA: number;
  finalWinProbabilityB: number;
  confidence: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_PROBABILITY_CONFIG: ProbabilityConfig = {
  eloWeight: 0.35,
  statsWeight: 0.30,
  trendWeight: 0.20,
  graphWeight: 0.15,
};

// ============================================================================
// Probability Calculations
// ============================================================================

export function calculateEloProbability(
  teamAId: string,
  teamBId: string,
  getRating: (id: string) => { rating: number }
): number {
  const ratingA = getRating(teamAId).rating;
  const ratingB = getRating(teamBId).rating;
  
  return calculateExpectedScore(ratingA, ratingB);
}

export function calculateStatsProbability(teamA: TeamData, teamB: TeamData): number {
  const wrA = teamA.stats?.winRate || 0.5;
  const wrB = teamB.stats?.winRate || 0.5;
  
  // Use win rate difference with diminishing returns
  const diff = wrA - wrB;
  const baseProb = 0.5;
  
  // Log-scale adjustment for extreme differences
  const adjustedDiff = Math.sign(diff) * Math.log1p(Math.abs(diff) * 10) / Math.log(11);
  
  return Math.max(0.1, Math.min(0.9, baseProb + adjustedDiff));
}

export function calculateTrendProbability(
  teamA: TeamData,
  teamB: TeamData
): number {
  const featuresA = extractTeamFeatures(teamA);
  const featuresB = extractTeamFeatures(teamB);
  
  // Form trend impact
  let formImpact = 0;
  
  if (featuresA.formTrend === 'improving' && featuresB.formTrend !== 'improving') {
    formImpact += 0.08;
  } else if (featuresB.formTrend === 'improving' && featuresA.formTrend !== 'improving') {
    formImpact -= 0.08;
  }
  
  // Streak impact
  const streakDiff = Math.min(featuresA.streak, 5) - Math.min(featuresB.streak, 5);
  const streakImpact = streakDiff * 0.02;
  
  // Recent win rate impact
  const recentWRDiff = featuresA.recentWinRate - featuresB.recentWinRate;
  
  return Math.max(0.1, Math.min(0.9, 0.5 + formImpact + streakImpact + recentWRDiff * 0.5));
}

export function calculateGraphProbability(
  synergyA: number,
  synergyB: number
): number {
  const synergyDiff = synergyA - synergyB;
  return Math.max(0.1, Math.min(0.9, 0.5 + synergyDiff * 0.3));
}

// ============================================================================
// Ensemble Probability
// ============================================================================

export function calculateEnsembleProbability(
  modelProbs: ModelProbabilities,
  config: ProbabilityConfig = DEFAULT_PROBABILITY_CONFIG
): number {
  const weightedSum = 
    modelProbs.elo * config.eloWeight +
    modelProbs.stats * config.statsWeight +
    modelProbs.trend * config.trendWeight +
    modelProbs.graph * config.graphWeight;
  
  return Math.round(weightedSum * 1000) / 1000;
}

export function calculateProbabilityBreakdown(
  teamA: TeamData,
  teamB: TeamData,
  teamAId: string,
  teamBId: string,
  synergyA: number,
  synergyB: number,
  getRating: (id: string) => { rating: number },
  config: ProbabilityConfig = DEFAULT_PROBABILITY_CONFIG
): ProbabilityBreakdown {
  // Calculate individual model probabilities
  const probA = {
    elo: calculateEloProbability(teamAId, teamBId, getRating),
    stats: calculateStatsProbability(teamA, teamB),
    trend: calculateTrendProbability(teamA, teamB),
    graph: calculateGraphProbability(synergyA, synergyB),
    combined: 0,
  };
  
  const probB = {
    elo: 1 - probA.elo,
    stats: 1 - probA.stats,
    trend: 1 - probA.trend,
    graph: 1 - probA.graph,
    combined: 0,
  };
  
  // Calculate combined probabilities
  probA.combined = calculateEnsembleProbability(probA, config);
  probB.combined = calculateEnsembleProbability(probB, config);
  
  // Normalize to ensure they sum to 1
  const total = probA.combined + probB.combined;
  const normalizedA = probA.combined / total;
  const normalizedB = probB.combined / total;
  
  // Calculate confidence based on model agreement
  const modelValues = [probA.elo, probA.stats, probA.trend, probA.graph];
  const variance = calculateVariance(modelValues);
  const confidence = Math.max(0.3, Math.min(0.95, 1 - variance * 2));
  
  return {
    teamA: { ...probA, combined: normalizedA },
    teamB: { ...probB, combined: normalizedB },
    finalWinProbabilityA: normalizedA,
    finalWinProbabilityB: normalizedB,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================================================
// Prediction Result Generation
// ============================================================================

export function generatePredictionResult(
  breakdown: ProbabilityBreakdown,
  teamAId: string,
  teamBId: string,
  teamAName: string,
  teamBName: string,
  factors: PredictionFactor[]
): PredictionResult {
  const winner = breakdown.finalWinProbabilityA > breakdown.finalWinProbabilityB 
    ? teamAName : teamBName;
  
  const winProb = Math.max(
    breakdown.finalWinProbabilityA,
    breakdown.finalWinProbabilityB
  );
  
  // Calculate expected score
  const scoreDiff = Math.abs(breakdown.finalWinProbabilityA - breakdown.finalWinProbabilityB);
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
    winProbability: Math.round(winProb * 1000) / 1000,
    expectedScore,
    confidence: breakdown.confidence,
    factors,
  };
}

export function generatePredictionFactors(
  breakdown: ProbabilityBreakdown,
  teamAFeatures: any,
  teamBFeatures: any,
  teamAName: string,
  teamBName: string
): PredictionFactor[] {
  const factors: PredictionFactor[] = [];
  
  // Elo factor
  if (Math.abs(breakdown.teamA.elo - breakdown.teamB.elo) > 0.1) {
    const advantage = breakdown.teamA.elo > 0.5 ? teamAName : teamBName;
    factors.push({
      name: 'Elo Rating',
      impact: Math.abs(breakdown.teamA.elo - breakdown.teamB.elo),
      direction: breakdown.teamA.elo > 0.5 ? 'teamA' : 'teamB',
      description: advantage + ' has higher rated players',
    });
  }
  
  // Form factor
  if (teamAFeatures.formTrend !== teamBFeatures.formTrend) {
    const betterForm = teamAFeatures.formTrend === 'improving' ? teamAName : teamBName;
    factors.push({
      name: 'Recent Form',
      impact: 0.08,
      direction: teamAFeatures.formTrend === 'improving' ? 'teamA' : 'teamB',
      description: betterForm + ' showing improving form',
    });
  }
  
  // KDA factor
  const kdaDiff = teamAFeatures.kda - teamBFeatures.kda;
  if (Math.abs(kdaDiff) > 0.5) {
    factors.push({
      name: 'KDA',
      impact: Math.min(Math.abs(kdaDiff) / 5, 0.1),
      direction: kdaDiff > 0 ? 'teamA' : 'teamB',
      description: (kdaDiff > 0 ? teamAName : teamBName) + ' has better KDA',
    });
  }
  
  // Win rate factor
  const wrDiff = Math.abs(teamAFeatures.winRate - teamBFeatures.winRate);
  if (wrDiff > 0.1) {
    factors.push({
      name: 'Win Rate',
      impact: wrDiff * 0.5,
      direction: teamAFeatures.winRate > teamBFeatures.winRate ? 'teamA' : 'teamB',
      description: 'Significant win rate difference',
    });
  }
  
  return factors;
}

export default {
  calculateEloProbability,
  calculateStatsProbability,
  calculateTrendProbability,
  calculateGraphProbability,
  calculateEnsembleProbability,
  calculateProbabilityBreakdown,
  generatePredictionResult,
  generatePredictionFactors,
  DEFAULT_PROBABILITY_CONFIG,
};

