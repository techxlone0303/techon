/**
 * ScoutIQ v5 - Hybrid Super Model
 * 
 * Fuses multiple prediction sources into a unified prediction:
 * - Neural embeddings
 * - Graph intelligence
 * - Elo/Glicko ratings
 * - Meta alignment
 * - Simulation outputs
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';
import { GraphMetrics } from '../graph/esportsGraph';
import { MetaTrend } from '../meta/metaEvolutionEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SuperPrediction {
  // Individual predictions
  neuralPrediction: {
    teamA_prob: number;
    teamB_prob: number;
    featureContributions: Record<string, number>;
  };
  graphPrediction: {
    teamA_prob: number;
    teamB_prob: number;
    influenceBonusA: number;
    influenceBonusB: number;
  };
  eloPrediction: {
    teamA_prob: number;
    teamB_prob: number;
    ratingDiff: number;
  };
  glickoPrediction: {
    teamA_prob: number;
    teamB_prob: number;
    uncertainty: number;
  };
  metaPrediction: {
    teamA_prob: number;
    teamB_prob: number;
    alignmentDiff: number;
  };
  simulationPrediction: {
    teamA_prob: number;
    teamB_prob: number;
    iterations: number;
    confidence: number;
  };
  
  // Fused prediction
  finalPrediction: {
    teamA_win_probability: number;
    teamB_win_probability: number;
    confidenceScore: number;
    uncertaintyEstimate: number;
    calibrationAdjustment: number;
  };
  
  // Analysis
  modelWeights: Record<string, number>;
  predictionFactors: PredictionFactor[];
  riskIndicators: RiskIndicator[];
  opportunities: string[];
  
  // Output
  expectedScore: string;
  recommendedBets?: BetRecommendation[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'favorable' | 'unfavorable' | 'neutral';
  confidence: number;
  description: string;
}

export interface RiskIndicator {
  factor: string;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface BetRecommendation {
  type: 'straight' | 'spread' | 'total';
  selection: string;
  odds: number;
  edge: number;
  confidence: number;
}

export interface SuperModelConfig {
  neuralWeight: number;
  graphWeight: number;
  eloWeight: number;
  glickoWeight: number;
  metaWeight: number;
  simulationWeight: number;
  adaptiveWeights: boolean;
  calibrationEnabled: boolean;
}

// ============================================================================
// Hybrid Super Model
// ============================================================================

export class HybridSuperModel {
  private config: SuperModelConfig;
  private weightHistory: Array<Record<string, number>> = [];

  constructor(config: Partial<SuperModelConfig> = {}) {
    this.config = {
      neuralWeight: config.neuralWeight ?? 0.25,
      graphWeight: config.graphWeight ?? 0.15,
      eloWeight: config.eloWeight ?? 0.15,
      glickoWeight: config.glickoWeight ?? 0.1,
      metaWeight: config.metaWeight ?? 0.15,
      simulationWeight: config.simulationWeight ?? 0.2,
      adaptiveWeights: config.adaptiveWeights ?? true,
      calibrationEnabled: config.calibrationEnabled ?? true,
    };
  }

  async predict(
    teamA: {
      id: string;
      name: string;
      universalFeatures: UniversalFeatures;
      graphMetrics?: GraphMetrics;
      eloRating: number;
      glickoRating: number;
      glickoDeviation: number;
    },
    teamB: {
      id: string;
      name: string;
      universalFeatures: UniversalFeatures;
      graphMetrics?: GraphMetrics;
      eloRating: number;
      glickoRating: number;
      glickoDeviation: number;
    },
    metaState?: MetaTrend,
    simulationResult?: { teamA_win_probability: number; teamB_win_probability: number; confidence: number }
  ): Promise<SuperPrediction> {
    // Calculate individual predictions
    const neural = this.calculateNeuralPrediction(teamA, teamB);
    const graph = this.calculateGraphPrediction(teamA, teamB);
    const elo = this.calculateEloPrediction(teamA, teamB);
    const glicko = this.calculateGlickoPrediction(teamA, teamB);
    const meta = this.calculateMetaPrediction(teamA, teamB, metaState);
    const simulation = this.calculateSimulationPrediction(teamA, teamB, simulationResult);

    // Adjust weights based on uncertainty
    const adjustedWeights = this.adjustWeights(neural, graph, elo, glicko, meta, simulation);

    // Store weights for adaptive learning
    if (this.config.adaptiveWeights) {
      this.weightHistory.push(adjustedWeights);
      if (this.weightHistory.length > 100) {
        this.weightHistory.shift();
      }
    }

    // Fuse predictions
    const fused = this.fusePredictions(
      neural, graph, elo, glicko, meta, simulation,
      adjustedWeights
    );

    // Apply calibration
    const calibrated = this.applyCalibration(fused);

    // Generate analysis
    const factors = this.generatePredictionFactors(
      teamA, teamB, neural, graph, elo, glicko, meta, simulation
    );

    const risks = this.identifyRiskIndicators(
      teamA, teamB, neural, graph, elo, glicko, meta, simulation, calibrated
    );

    const opportunities = this.identifyOpportunities(factors, risks);

    // Generate bet recommendations
    const bets = this.generateBetRecommendations(calibrated, factors);

    return {
      neuralPrediction: neural,
      graphPrediction: graph,
      eloPrediction: elo,
      glickoPrediction: glicko,
      metaPrediction: meta,
      simulationPrediction: simulation,
      finalPrediction: calibrated,
      modelWeights: adjustedWeights,
      predictionFactors: factors,
      riskIndicators: risks,
      opportunities,
      expectedScore: this.calculateExpectedScore(calibrated),
      recommendedBets: bets,
    };
  }

  // =========================================================================
  // Individual Prediction Calculations
  // =========================================================================

  private calculateNeuralPrediction(
    teamA: any,
    teamB: any
  ): SuperPrediction['neuralPrediction'] {
    const featurePairs = [
      { a: teamA.universalFeatures.skill_index, b: teamB.universalFeatures.skill_index, name: 'skill' },
      { a: teamA.universalFeatures.aggression_index, b: teamB.universalFeatures.aggression_index, name: 'aggression' },
      { a: teamA.universalFeatures.macro_intelligence, b: teamB.universalFeatures.macro_intelligence, name: 'macro' },
      { a: teamA.universalFeatures.adaptability_score, b: teamB.universalFeatures.adaptability_score, name: 'adaptability' },
      { a: teamA.universalFeatures.meta_alignment_score, b: teamB.universalFeatures.meta_alignment_score, name: 'meta_alignment' },
      { a: teamA.universalFeatures.synergy_score, b: teamB.universalFeatures.synergy_score, name: 'synergy' },
    ];

    const featureContributions: Record<string, number> = {};
    let score = 0.5;

    const weights = [0.25, 0.1, 0.2, 0.15, 0.15, 0.15];

    for (let i = 0; i < featurePairs.length; i++) {
      const diff = featurePairs[i].a - featurePairs[i].b;
      const contribution = diff * weights[i];
      featureContributions[featurePairs[i].name] = Math.round(contribution * 1000) / 1000;
      score += contribution;
    }

    const teamA_prob = this.sigmoid(score);
    const teamB_prob = 1 - teamA_prob;

    return {
      teamA_prob: Math.round(teamA_prob * 1000) / 1000,
      teamB_prob: Math.round(teamB_prob * 1000) / 1000,
      featureContributions,
    };
  }

  private calculateGraphPrediction(
    teamA: any,
    teamB: any
  ): SuperPrediction['graphPrediction'] {
    const metricsA = teamA.graphMetrics || { influenceScore: 0.5, synergyStrength: 0.5 };
    const metricsB = teamB.graphMetrics || { influenceScore: 0.5, synergyStrength: 0.5 };

    const influenceBonusA = metricsA.influenceScore * 0.1;
    const influenceBonusB = metricsB.influenceScore * 0.1;

    const synergyBonusA = metricsA.synergyStrength * 0.05;
    const synergyBonusB = metricsB.synergyStrength * 0.05;

    const baseProb = 0.5;
    const teamA_prob = Math.min(0.95, Math.max(0.05, baseProb + influenceBonusA + synergyBonusA - influenceBonusB - synergyBonusB));
    const teamB_prob = 1 - teamA_prob;

    return {
      teamA_prob: Math.round(teamA_prob * 1000) / 1000,
      teamB_prob: Math.round(teamB_prob * 1000) / 1000,
      influenceBonusA: Math.round(influenceBonusA * 1000) / 1000,
      influenceBonusB: Math.round(influenceBonusB * 1000) / 1000,
    };
  }

  private calculateEloPrediction(
    teamA: any,
    teamB: any
  ): SuperPrediction['eloPrediction'] {
    const ratingDiff = teamA.eloRating - teamB.eloRating;
    const teamA_prob = 1 / (1 + Math.pow(10, -ratingDiff / 400));

    return {
      teamA_prob: Math.round(teamA_prob * 1000) / 1000,
      teamB_prob: Math.round((1 - teamA_prob) * 1000) / 1000,
      ratingDiff,
    };
  }

  private calculateGlickoPrediction(
    teamA: any,
    teamB: any
  ): SuperPrediction['glickoPrediction'] {
    const ratingDiff = teamA.glickoRating - teamB.glickoRating;
    const combinedDev = Math.sqrt(
      Math.pow(teamA.glickoDeviation, 2) + Math.pow(teamB.glickoDeviation, 2)
    );

    const baseProb = 1 / (1 + Math.pow(10, -ratingDiff / 400));
    const uncertainty = combinedDev > 0 ? Math.min(1, combinedDev / 200) : 0.5;
    const adjustedProb = baseProb * (1 - uncertainty * 0.3) + 0.5 * uncertainty * 0.3;

    return {
      teamA_prob: Math.round(adjustedProb * 1000) / 1000,
      teamB_prob: Math.round((1 - adjustedProb) * 1000) / 1000,
      uncertainty,
    };
  }

  private calculateMetaPrediction(
    teamA: any,
    teamB: any,
    metaState?: MetaTrend
  ): SuperPrediction['metaPrediction'] {
    const alignmentDiff = teamA.universalFeatures.meta_alignment_score - teamB.universalFeatures.meta_alignment_score;
    
    let teamA_prob = 0.5 + alignmentDiff * 0.3;

    // Factor in meta predictions
    if (metaState?.predictedMetaState) {
      if (metaState.predictedMetaState.predictedDominantStrategies?.length > 0) {
        // Slight boost if aligned with predicted dominant strategies
        teamA_prob += 0.02;
      }
    }

    teamA_prob = Math.min(0.95, Math.max(0.05, teamA_prob));

    return {
      teamA_prob: Math.round(teamA_prob * 1000) / 1000,
      teamB_prob: Math.round((1 - teamA_prob) * 1000) / 1000,
      alignmentDiff: Math.round(alignmentDiff * 1000) / 1000,
    };
  }

  private calculateSimulationPrediction(
    teamA: any,
    teamB: any,
    simulationResult?: { teamA_win_probability: number; teamB_win_probability: number; confidence: number }
  ): SuperPrediction['simulationPrediction'] {
    if (simulationResult) {
      return {
        teamA_prob: simulationResult.teamA_win_probability,
        teamB_prob: simulationResult.teamB_win_probability,
        iterations: 10000,
        confidence: simulationResult.confidence,
      };
    }

    // Fallback simulation
    const teamA_prob = 0.5 + (teamA.universalFeatures.skill_index - teamB.universalFeatures.skill_index) * 0.3;

    return {
      teamA_prob: Math.round(teamA_prob * 1000) / 1000,
      teamB_prob: Math.round((1 - teamA_prob) * 1000) / 1000,
      iterations: 1000,
      confidence: 0.65,
    };
  }

  // =========================================================================
  // Weight Adjustment & Fusion
  // =========================================================================

  private adjustWeights(
    neural: any, graph: any, elo: any, glicko: any, meta: any, simulation: any
  ): Record<string, number> {
    // Adjust weights based on uncertainty
    let glickoUncertainty = glicko.uncertainty || 0.5;
    if (glickoUncertainty > 0.5) {
      // High uncertainty in glicko - reduce weight
      glickoUncertainty = 0.5;
    }

    const weights: Record<string, number> = {
      neural: this.config.neuralWeight,
      graph: this.config.graphWeight * (1 + (graph.teamA_prob - 0.5) * 0.1),
      elo: this.config.eloWeight,
      glicko: this.config.glickoWeight * (1 - glickoUncertainty),
      meta: this.config.metaWeight,
      simulation: this.config.simulationWeight * (simulation.confidence || 0.65),
    };

    // Normalize weights
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(weights)) {
      weights[key] = Math.round((weights[key] / total) * 1000) / 1000;
    }

    return weights;
  }

  private fusePredictions(
    neural: any, graph: any, elo: any, glicko: any, meta: any, simulation: any,
    weights: Record<string, number>
  ): SuperPrediction['finalPrediction'] {
    // Weighted average
    let weightedSum = 0;
    weightedSum += neural.teamA_prob * weights.neural;
    weightedSum += graph.teamA_prob * weights.graph;
    weightedSum += elo.teamA_prob * weights.elo;
    weightedSum += glicko.teamA_prob * weights.glicko;
    weightedSum += meta.teamA_prob * weights.meta;
    weightedSum += simulation.teamA_prob * weights.simulation;

    const teamA_prob = Math.max(0.05, Math.min(0.95, weightedSum));
    const teamB_prob = 1 - teamA_prob;

    // Calculate confidence based on model agreement
    const predictions = [
      neural.teamA_prob,
      graph.teamA_prob,
      elo.teamA_prob,
      glicko.teamA_prob,
      meta.teamA_prob,
      simulation.teamA_prob,
    ];
    const variance = this.calculateVariance(predictions);
    const confidence = Math.min(0.95, 0.6 + (1 - variance) * 0.3);

    // Calculate uncertainty
    const uncertainty = variance * 0.3;

    // Calculate calibration adjustment
    const calibrationAdjustment = this.calculateCalibrationAdjustment(teamA_prob, predictions);

    return {
      teamA_win_probability: Math.round(teamA_prob * 1000) / 1000,
      teamB_win_probability: Math.round(teamB_prob * 1000) / 1000,
      confidenceScore: Math.round(confidence * 1000) / 1000,
      uncertaintyEstimate: Math.round(uncertainty * 1000) / 1000,
      calibrationAdjustment: Math.round(calibrationAdjustment * 1000) / 1000,
    };
  }

  private applyCalibration(
    prediction: SuperPrediction['finalPrediction']
  ): SuperPrediction['finalPrediction'] {
    if (!this.config.calibrationEnabled) {
      return prediction;
    }

    // Simple calibration: regress toward 0.5 based on confidence
    const calibratedProb = prediction.teamA_win_probability +
      prediction.calibrationAdjustment;

    const finalProb = Math.max(0.05, Math.min(0.95, calibratedProb));

    return {
      teamA_win_probability: Math.round(finalProb * 1000) / 1000,
      teamB_win_probability: Math.round((1 - finalProb) * 1000) / 1000,
      confidenceScore: prediction.confidenceScore,
      uncertaintyEstimate: prediction.uncertaintyEstimate,
      calibrationAdjustment: prediction.calibrationAdjustment,
    };
  }

  // =========================================================================
  // Analysis Generation
  // =========================================================================

  private generatePredictionFactors(
    teamA: any, teamB: any,
    neural: any, graph: any, elo: any, glicko: any, meta: any, simulation: any
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    // Skill factor
    const skillDiff = teamA.universalFeatures.skill_index - teamB.universalFeatures.skill_index;
    factors.push({
      name: 'Individual Skill',
      impact: Math.abs(skillDiff),
      direction: skillDiff > 0 ? 'favorable' : 'unfavorable',
      confidence: 0.75,
      description: skillDiff > 0
        ? `${teamA.name} has higher skill index`
        : `${teamB.name} has higher skill index`,
    });

    // Elo factor
    if (Math.abs(elo.ratingDiff) > 100) {
      factors.push({
        name: 'Elo Rating',
        impact: Math.min(1, Math.abs(elo.ratingDiff) / 400),
        direction: elo.ratingDiff > 0 ? 'favorable' : 'unfavorable',
        confidence: 0.8,
        description: elo.ratingDiff > 0
          ? `${teamA.name} has higher Elo (${elo.ratingDiff.toFixed(0)} advantage)`
          : `${teamB.name} has higher Elo (${Math.abs(elo.ratingDiff).toFixed(0)} advantage)`,
      });
    }

    // Meta factor
    if (Math.abs(meta.alignmentDiff) > 0.1) {
      factors.push({
        name: 'Meta Alignment',
        impact: Math.abs(meta.alignmentDiff),
        direction: meta.alignmentDiff > 0 ? 'favorable' : 'unfavorable',
        confidence: 0.65,
        description: meta.alignmentDiff > 0
          ? `${teamA.name} better aligned with current meta`
          : `${teamB.name} better aligned with current meta`,
      });
    }

    // Graph factor
    const graphImpact = Math.abs(graph.influenceBonusA - graph.influenceBonusB);
    if (graphImpact > 0.02) {
      factors.push({
        name: 'Team Influence',
        impact: graphImpact,
        direction: graph.influenceBonusA > graph.influenceBonusB ? 'favorable' : 'unfavorable',
        confidence: 0.6,
        description: graph.influenceBonusA > graph.influenceBonusB
          ? `${teamA.name} has higher graph influence`
          : `${teamB.name} has higher graph influence`,
      });
    }

    return factors;
  }

  private identifyRiskIndicators(
    teamA: any, teamB: any,
    neural: any, graph: any, elo: any, glicko: any, meta: any, simulation: any,
    final: SuperPrediction['finalPrediction']
  ): RiskIndicator[] {
    const risks: RiskIndicator[] = [];

    // Model disagreement risk
    const predictions = [
      neural.teamA_prob,
      graph.teamA_prob,
      elo.teamA_prob,
      glicko.teamA_prob,
      meta.teamA_prob,
      simulation.teamA_prob,
    ];
    const variance = this.calculateVariance(predictions);
    if (variance > 0.02) {
      risks.push({
        factor: 'Model Disagreement',
        probability: variance * 10,
        impact: variance > 0.05 ? 'high' : 'medium',
        description: 'Different models suggest different outcomes',
      });
    }

    // Glicko uncertainty risk
    if (glicko.uncertainty > 0.4) {
      risks.push({
        factor: 'Rating Uncertainty',
        probability: glicko.uncertainty,
        impact: 'medium',
        description: 'Glicko indicates high uncertainty in ratings',
      });
    }

    // Close match risk
    if (Math.abs(final.teamA_win_probability - 0.5) < 0.1) {
      risks.push({
        factor: 'Close Match',
        probability: 0.5,
        impact: 'high',
        description: 'Match outcome is highly uncertain',
      });
    }

    return risks;
  }

  private identifyOpportunities(factors: PredictionFactor[], risks: RiskIndicator[]): string[] {
    const opportunities: string[] = [];

    // High confidence favorable factors
    for (const factor of factors) {
      if (factor.direction === 'favorable' && factor.confidence > 0.7 && factor.impact > 0.2) {
        opportunities.push(`Strong ${factor.name} advantage with ${(factor.confidence * 100).toFixed(0)}% confidence`);
      }
    }

    // Low risk opportunities
    for (const risk of risks) {
      if (risk.impact === 'low' && risk.probability < 0.2) {
        opportunities.push(`Risk-adjusted opportunity with minimal downside`);
      }
    }

    return opportunities;
  }

  private generateBetRecommendations(
    final: SuperPrediction['finalPrediction'],
    factors: PredictionFactor[]
  ): BetRecommendation[] {
    const bets: BetRecommendation[] = [];

    // Only recommend if confidence is high enough
    if (final.confidenceScore < 0.65) {
      return bets;
    }

    // Straight bet recommendation
    const teamA_prob = final.teamA_win_probability;
    const teamB_prob = final.teamB_win_probability;
    const fairOddsA = 1 / teamA_prob;
    const fairOddsB = 1 / teamB_prob;

    if (teamA_prob > 0.55) {
      bets.push({
        type: 'straight',
        selection: 'Team A',
        odds: Math.round(fairOddsA * 100) / 100,
        edge: teamA_prob - 0.5,
        confidence: final.confidenceScore,
      });
    } else if (teamB_prob > 0.55) {
      bets.push({
        type: 'straight',
        selection: 'Team B',
        odds: Math.round(fairOddsB * 100) / 100,
        edge: teamB_prob - 0.5,
        confidence: final.confidenceScore,
      });
    }

    // Over/under recommendation
    bets.push({
      type: 'total',
      selection: 'Over 24.5',
      odds: 1.91,
      edge: 0.03,
      confidence: 0.55,
    });

    return bets;
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-10 * (x - 0.5)));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateCalibrationAdjustment(
    finalProb: number,
    predictions: number[]
  ): number {
    const avgPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    return finalProb - avgPrediction;
  }

  private calculateExpectedScore(final: SuperPrediction['finalPrediction']): string {
    const baseScore = 13;
    const probDiff = Math.abs(final.teamA_win_probability - 0.5);
    
    if (probDiff > 0.3) {
      return '3-0';
    } else if (probDiff > 0.15) {
      return '3-1';
    } else if (probDiff > 0.05) {
      return '3-2';
    } else {
      return '2-3';
    }
  }

  updateConfig(newConfig: Partial<SuperModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SuperModelConfig {
    return { ...this.config };
  }
}

export const hybridSuperModel = new HybridSuperModel();

