/**
 * ScoutIQ v5 - Hyper-Simulation Engine
 * 
 * Simulates thousands of future scenarios using:
 * - Embeddings for player/team comparison
 * - Graph influence metrics
 * - Meta states
 * - Player form variance
 * - Monte Carlo methods
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';
import { GraphMetrics } from '../graph/esportsGraph';
import { MetaTrend } from '../meta/metaEvolutionEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SimulationInput {
  teamA: {
    id: string;
    name: string;
    features: UniversalFeatures;
    graphMetrics?: GraphMetrics;
    recentForm: number[];
    players: SimulationPlayer[];
  };
  teamB: {
    id: string;
    name: string;
    features: UniversalFeatures;
    graphMetrics?: GraphMetrics;
    recentForm: number[];
    players: SimulationPlayer[];
  };
  metaState?: MetaTrend;
  context: {
    format: 'bo1' | 'bo3' | 'bo5';
    mapPool?: string[];
    homeAdvantage?: string;
    tournamentImportance?: string;
  };
}

export interface SimulationPlayer {
  id: string;
  features: UniversalFeatures;
  cognitiveFeatures?: {
    clutchProbability: number;
    adaptabilityIndex: number;
    pressureResilience: number;
  };
  formVariance: number;
}

export interface SimulationResult {
  teamAWinProbability: number;
  teamBWinProbability: number;
  expectedScore: string;
  scoreDistribution: Record<string, number>;
  roundByRound: RoundSimulation[];
  scenarioAnalysis: ScenarioResult[];
  confidence: number;
  keyFactors: string[];
  riskScenarios: RiskScenario[];
  recommendations: string[];
}

export interface RoundSimulation {
  round: number;
  teamAWinProb: number;
  expectedScoreA: number;
  expectedScoreB: number;
  momentumShift: number;
}

export interface ScenarioResult {
  name: string;
  probability: number;
  teamAWinRate: number;
  teamBWinRate: number;
  expectedOutcome: string;
}

export interface RiskScenario {
  scenario: string;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

// ============================================================================
// Hyper-Simulation Engine
// ============================================================================

export class HyperSimulationEngine {
  private readonly DEFAULT_ITERATIONS = 10000;
  private readonly ROUNDS_PER_GAME = 24;

  async simulateMatch(input: SimulationInput): Promise<SimulationResult> {
    const { teamA, teamB, metaState, context } = input;

    // Run Monte Carlo simulation
    const mcResult = this.runMonteCarlo(input);

    // Simulate round by round
    const roundByRound = this.simulateRoundByRound(input);

    // Analyze different scenarios
    const scenarioAnalysis = this.analyzeScenarios(input, mcResult);

    // Identify risk scenarios
    const riskScenarios = this.identifyRisks(input, mcResult);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, mcResult);

    // Calculate key factors
    const keyFactors = this.identifyKeyFactors(input);

    // Calculate confidence
    const confidence = this.calculateConfidence(input, mcResult);

    return {
      teamAWinProbability: mcResult.teamAWinRate,
      teamBWinProbability: mcResult.teamBWinRate,
      expectedScore: mcResult.expectedScore,
      scoreDistribution: mcResult.scoreDistribution,
      roundByRound,
      scenarioAnalysis,
      confidence,
      keyFactors,
      riskScenarios,
      recommendations,
    };
  }

  private runMonteCarlo(input: SimulationInput): {
    teamAWinRate: number;
    teamBWinRate: number;
    expectedScore: string;
    scoreDistribution: Record<string, number>;
  } {
    const { teamA, teamB, metaState, context } = input;

    let teamAWins = 0;
    let totalScoreA = 0;
    let totalScoreB = 0;
    const scoreDistribution: Record<string, number> = {};

    // Calculate base win probability
    const baseWinProb = this.calculateBaseWinProbability(teamA, teamB, metaState);
    
    // Apply form modifiers
    const formModifier = this.calculateFormModifier(teamA, teamB);
    
    // Apply graph influence
    const graphModifier = this.calculateGraphModifier(teamA, teamB);

    // Combined modifier
    const adjustedWinProb = Math.max(0.1, Math.min(0.9, baseWinProb * (1 + formModifier) * (1 + graphModifier)));

    // Run simulations
    for (let i = 0; i < this.DEFAULT_ITERATIONS; i++) {
      const gameResult = this.simulateSingleGame(teamA, teamB, adjustedWinProb);
      
      if (gameResult.teamAWon) {
        teamAWins++;
      }

      totalScoreA += gameResult.scoreA;
      totalScoreB += gameResult.scoreB;

      const score = `${gameResult.scoreA}-${gameResult.scoreB}`;
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
    }

    return {
      teamAWinRate: teamAWins / this.DEFAULT_ITERATIONS,
      teamBWinRate: 1 - teamAWins / this.DEFAULT_ITERATIONS,
      expectedScore: `${(totalScoreA / this.DEFAULT_ITERATIONS).toFixed(1)}-${(totalScoreB / this.DEFAULT_ITERATIONS).toFixed(1)}`,
      scoreDistribution,
    };
  }

  private calculateBaseWinProbability(
    teamA: SimulationInput['teamA'],
    teamB: SimulationInput['teamB'],
    metaState?: MetaTrend
  ): number {
    let probability = 0.5;

    // Skill difference
    const skillDiff = teamA.features.skill_index - teamB.features.skill_index;
    probability += skillDiff * 0.3;

    // Aggression difference
    const aggDiff = teamA.features.aggression_index - teamB.features.aggression_index;
    probability += aggDiff * 0.1;

    // Macro difference
    const macroDiff = teamA.features.macro_intelligence - teamB.features.macro_intelligence;
    probability += macroDiff * 0.2;

    // Adaptability difference
    const adaptDiff = teamA.features.adaptability_score - teamB.features.adaptability_score;
    probability += adaptDiff * 0.15;

    // Meta alignment
    if (metaState) {
      const metaDiff = teamA.features.meta_alignment_score - teamB.features.meta_alignment_score;
      probability += metaDiff * 0.15;
    }

    // Synergy boost
    const synergyBoost = teamA.features.synergy_score * 0.1;
    probability += synergyBoost;

    return probability;
  }

  private calculateFormModifier(
    teamA: SimulationInput['teamA'],
    teamB: SimulationInput['teamB']
  ): number {
    // Calculate recent form
    const formA = this.averageForm(teamA.recentForm);
    const formB = this.averageForm(teamB.recentForm);

    // Form momentum
    const momentumA = this.calculateMomentum(teamA.recentForm);
    const momentumB = this.calculateMomentum(teamB.recentForm);

    return (formA - formB) * 0.3 + (momentumA - momentumB) * 0.2;
  }

  private calculateGraphModifier(
    teamA: SimulationInput['teamA'],
    teamB: SimulationInput['teamB']
  ): number {
    let modifier = 0;

    // Influence score
    const influenceA = teamA.graphMetrics?.influenceScore || 0.5;
    const influenceB = teamB.graphMetrics?.influenceScore || 0.5;
    modifier += (influenceA - influenceB) * 0.2;

    // Synergy strength
    const synergyA = teamA.graphMetrics?.synergyStrength || 0.5;
    const synergyB = teamB.graphMetrics?.synergyStrength || 0.5;
    modifier += (synergyA - synergyB) * 0.15;

    // Rivalry intensity (if facing known rival)
    const rivalry = teamA.graphMetrics?.rivalryIntensity || 0.5;
    if (rivalry > 0.7) {
      modifier += 0.05; // Boosts team with established rivalry
    }

    return modifier;
  }

  private simulateSingleGame(
    teamA: SimulationInput['teamA'],
    teamB: SimulationInput['teamB'],
    winProbability: number
  ): { teamAWon: boolean; scoreA: number; scoreB: number } {
    let scoreA = 0;
    let scoreB = 0;
    let momentumA = 0.5;
    let momentumB = 0.5;

    // Simulate rounds
    for (let round = 0; round < this.ROUNDS_PER_GAME && scoreA < 13 && scoreB < 13; round++) {
      // Round win probability with momentum
      const roundProb = this.calculateRoundWinProbability(
        winProbability,
        momentumA,
        momentumB,
        scoreA,
        scoreB
      );

      const teamAWinRound = Math.random() < roundProb;

      if (teamAWinRound) {
        scoreA++;
        momentumA = Math.min(1, momentumA + 0.05);
        momentumB = Math.max(0, momentumB - 0.03);
      } else {
        scoreB++;
        momentumB = Math.min(1, momentumB + 0.05);
        momentumA = Math.max(0, momentumA - 0.03);
      }
    }

    // Overtime if tied 12-12
    if (scoreA === 12 && scoreB === 12) {
      while (scoreA === scoreB) {
        if (Math.random() < winProbability) {
          scoreA++;
        } else {
          scoreB++;
        }
      }
    }

    return {
      teamAWon: scoreA > scoreB,
      scoreA,
      scoreB,
    };
  }

  private calculateRoundWinProbability(
    baseProb: number,
    momentumA: number,
    momentumB: number,
    scoreA: number,
    scoreB: number
  ): number {
    let prob = baseProb;

    // Momentum adjustment
    prob += (momentumA - momentumB) * 0.1;

    // Clutch factor for late rounds
    if (scoreA >= 10 || scoreB >= 10) {
      prob += (momentumA - momentumB) * 0.05;
    }

    // Economic rounds impact (simplified)
    const isEcoRound = (scoreA + scoreB) % 5 === 0;
    if (isEcoRound) {
      prob *= 0.95; // Slight variance increase in eco rounds
    }

    return Math.max(0.1, Math.min(0.9, prob));
  }

  private simulateRoundByRound(input: SimulationInput): RoundSimulation[] {
    const rounds: RoundSimulation[] = [];
    const { teamA, teamB } = input;

    const baseWinProb = this.calculateBaseWinProbability(teamA, teamB);
    let momentumA = 0.5;
    let momentumB = 0.5;
    let scoreA = 0;
    let scoreB = 0;

    for (let round = 1; round <= this.ROUNDS_PER_GAME; round++) {
      const roundProb = this.calculateRoundWinProbability(baseWinProb, momentumA, momentumB, scoreA, scoreB);
      
      // Update momentum based on expected outcome
      const expectedWinner = roundProb > 0.5 ? 'A' : 'B';
      const momentumShift = roundProb > 0.5 ? 0.02 : -0.02;

      rounds.push({
        round,
        teamAWinProb: roundProb,
        expectedScoreA: scoreA + roundProb,
        expectedScoreB: scoreB + (1 - roundProb),
        momentumShift,
      });

      // Simulate actual round outcome
      const teamAWinRound = Math.random() < roundProb;
      if (teamAWinRound) {
        scoreA++;
        momentumA = Math.min(1, momentumA + 0.05);
        momentumB = Math.max(0, momentumB - 0.03);
      } else {
        scoreB++;
        momentumB = Math.min(1, momentumB + 0.05);
        momentumA = Math.max(0, momentumA - 0.03);
      }
    }

    return rounds;
  }

  private analyzeScenarios(
    input: SimulationInput,
    mcResult: { teamAWinRate: number; teamBWinRate: number; expectedScore: string }
  ): ScenarioResult[] {
    const scenarios: ScenarioResult[] = [];

    // Base scenario
    scenarios.push({
      name: 'Base Case',
      probability: 0.6,
      teamAWinRate: mcResult.teamAWinRate,
      teamBWinRate: mcResult.teamBWinRate,
      expectedOutcome: mcResult.expectedScore,
    });

    // High momentum scenario
    scenarios.push({
      name: 'Team A Momentum Swing',
      probability: 0.15,
      teamAWinRate: Math.min(0.95, mcResult.teamAWinRate * 1.3),
      teamBWinRate: 1 - Math.min(0.95, mcResult.teamAWinRate * 1.3),
      expectedOutcome: '3-0 or 3-1 sweep',
    });

    // Opponent adaptation scenario
    scenarios.push({
      name: 'Team B Adaptation',
      probability: 0.15,
      teamAWinRate: Math.max(0.1, mcResult.teamAWinRate * 0.7),
      teamBWinRate: 1 - Math.max(0.1, mcResult.teamAWinRate * 0.7),
      expectedOutcome: 'Close series or upset',
    });

    // Volatile meta scenario
    scenarios.push({
      name: 'Meta Volatility',
      probability: 0.1,
      teamAWinRate: 0.5,
      teamBWinRate: 0.5,
      expectedOutcome: 'Unpredictable outcome',
    });

    return scenarios;
  }

  private identifyRisks(
    input: SimulationInput,
    mcResult: { teamAWinRate: number; teamBWinRate: number }
  ): RiskScenario[] {
    const risks: RiskScenario[] = [];
    const { teamA, teamB, context } = input;

    // Close match risk
    if (Math.abs(mcResult.teamAWinRate - 0.5) < 0.1) {
      risks.push({
        scenario: 'Close match outcome',
        probability: 0.4,
        impact: 'high',
        mitigation: 'Focus on mental preparation and clutch performance',
      });
    }

    // Form variance risk
    if (this.calculateFormVariance(teamA.recentForm) > 0.2) {
      risks.push({
        scenario: 'Inconsistent form',
        probability: 0.25,
        impact: 'medium',
        mitigation: 'Establish early lead to build confidence',
      });
    }

    // Map pool risk
    if (context.mapPool && context.mapPool.length < 5) {
      risks.push({
        scenario: 'Limited map pool',
        probability: 0.2,
        impact: 'medium',
        mitigation: 'Prioritize ban of weakest maps',
      });
    }

    // Meta mismatch risk
    if (Math.abs(teamA.features.meta_alignment_score - teamB.features.meta_alignment_score) > 0.2) {
      const disadvantagedTeam = teamA.features.meta_alignment_score < teamB.features.meta_alignment_score ? teamA.name : teamB.name;
      risks.push({
        scenario: `${disadvantagedTeam} meta disadvantage`,
        probability: 0.3,
        impact: 'medium',
        mitigation: 'Consider anti-meta strategies or unconventional picks',
      });
    }

    // Tournament pressure risk
    if (context.tournamentImportance === 'championship') {
      risks.push({
        scenario: 'Championship pressure',
        probability: 0.15,
        impact: 'high',
        mitigation: 'Mental preparation and pressure management training',
      });
    }

    return risks;
  }

  private generateRecommendations(
    input: SimulationInput,
    mcResult: { teamAWinRate: number; teamBWinRate: number; expectedScore: string }
  ): string[] {
    const recommendations: string[] = [];
    const { teamA, teamB, context } = input;

    // Strategy recommendation
    if (mcResult.teamAWinRate > 0.6) {
      recommendations.push('Aggressive opening strategy recommended to capitalize on team strengths');
    } else if (mcResult.teamAWinRate < 0.4) {
      recommendations.push('Cautious approach - wait for opponent mistakes and capitalize on errors');
    } else {
      recommendations.push('Balanced strategy - adapt based on opponent reads');
    }

    // Tempo recommendation
    if (teamA.features.aggression_index > 0.6) {
      recommendations.push('Force tempo early to maintain control of match pacing');
    } else if (teamA.features.aggression_index < 0.4) {
      recommendations.push('Let opponent make first moves and counter effectively');
    }

    // Form-based recommendation
    const momentumA = this.calculateMomentum(teamA.recentForm);
    if (momentumA > 0.7) {
      recommendations.push('Ride the positive momentum - maintain current approach');
    } else if (momentumA < 0.3) {
      recommendations.push('Consider tactical changes to spark momentum shift');
    }

    // Map recommendation
    if (context.mapPool && context.mapPool.length > 0) {
      recommendations.push(`Prepare thoroughly for ${context.mapPool[0]} as first map`);
    }

    return recommendations;
  }

  private identifyKeyFactors(input: SimulationInput): string[] {
    const factors: string[] = [];
    const { teamA, teamB, metaState } = input;

    // Compare skills
    const skillDiff = teamA.features.skill_index - teamB.features.skill_index;
    if (Math.abs(skillDiff) > 0.15) {
      factors.push(skillDiff > 0 ? 'Team A has skill advantage' : 'Team B has skill advantage');
    }

    // Compare aggression
    const aggDiff = teamA.features.aggression_index - teamB.features.aggression_index;
    if (Math.abs(aggDiff) > 0.2) {
      factors.push(aggDiff > 0 ? 'Team A plays more aggressively' : 'Team B plays more aggressively');
    }

    // Compare macro
    const macroDiff = teamA.features.macro_intelligence - teamB.features.macro_intelligence;
    if (Math.abs(macroDiff) > 0.15) {
      factors.push(macroDiff > 0 ? 'Team A has better macro decisions' : 'Team B has better macro decisions');
    }

    // Compare adaptability
    const adaptDiff = teamA.features.adaptability_score - teamB.features.adaptability_score;
    if (Math.abs(adaptDiff) > 0.15) {
      factors.push(adaptDiff > 0 ? 'Team A adapts better mid-series' : 'Team B adapts better mid-series');
    }

    // Meta alignment
    if (metaState) {
      const metaDiff = teamA.features.meta_alignment_score - teamB.features.meta_alignment_score;
      if (Math.abs(metaDiff) > 0.15) {
        factors.push(metaDiff > 0 ? 'Team A better aligned with meta' : 'Team B better aligned with meta');
      }
    }

    return factors;
  }

  private calculateConfidence(
    input: SimulationInput,
    mcResult: { teamAWinRate: number; teamBWinRate: number }
  ): number {
    let confidence = 0.7;

    // More confidence when prediction is clear
    confidence += Math.abs(mcResult.teamAWinRate - 0.5) * 0.15;

    // Less confidence with high form variance
    if (this.calculateFormVariance(input.teamA.recentForm) > 0.2) {
      confidence -= 0.1;
    }

    // Less confidence in bo1 format
    if (input.context.format === 'bo1') {
      confidence -= 0.1;
    }

    // More confidence with good data
    if (input.teamA.players.length >= 5 && input.teamB.players.length >= 5) {
      confidence += 0.05;
    }

    return Math.min(0.95, Math.max(0.5, confidence));
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private averageForm(form: number[]): number {
    if (form.length === 0) return 0.5;
    let sum = 0;
    for (const f of form) sum += f;
    return sum / form.length;
  }

  private calculateMomentum(form: number[]): number {
    if (form.length === 0) return 0.5;
    
    let momentum = 0;
    let weight = 1;
    const decay = 0.8;

    for (let i = form.length - 1; i >= 0; i--) {
      momentum += form[i] * weight;
      weight *= decay;
    }

    const totalWeight = (1 - Math.pow(decay, form.length)) / (1 - decay);
    return momentum / totalWeight;
  }

  private calculateFormVariance(form: number[]): number {
    if (form.length < 2) return 0;
    
    const mean = this.averageForm(form);
    let variance = 0;
    for (const f of form) variance += Math.pow(f - mean, 2);
    return variance / form.length;
  }
}

export const hyperSimulationEngine = new HyperSimulationEngine();

