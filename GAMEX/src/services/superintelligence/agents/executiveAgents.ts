/**
 * ScoutIQ v5 - Executive Agents (Tier 3)
 * 
 * Top-level agents that synthesize all outputs into final decisions:
 * - PredictionAgent: Final match prediction
 * - RiskAgent: Risk assessment and mitigation
 * - SimulationAgent: Outcome simulation and verification
 */

import { AgentOutput } from './microAgents';
import { StrategicOutput } from './strategicAgents';
import { UniversalFeatures } from '../../agi/normalizationEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ExecutiveContext {
  agentId: string;
  agentType: 'executive';
  timestamp: string;
  focusArea: 'prediction' | 'risk' | 'simulation';
  microOutputs: AgentOutput[];
  strategicOutputs: StrategicOutput[];
  teamA: {
    id: string;
    name: string;
    features: UniversalFeatures;
    eloRating: number;
    glickoRating: number;
    recentForm: string;
  };
  teamB: {
    id: string;
    name: string;
    features: UniversalFeatures;
    eloRating: number;
    glickoRating: number;
    recentForm: string;
  };
  matchContext: {
    format: 'bo1' | 'bo3' | 'bo5';
    mapPool?: string[];
    homeAdvantage?: string;
    tournamentImportance?: string;
  };
}

export interface ExecutiveOutput {
  agentId: string;
  finalDecision: Record<string, any>;
  confidence: number;
  reasoning: string[];
  riskFactors: string[];
  opportunities: string[];
  recommendations: string[];
}

// ============================================================================
// Prediction Executive Agent
// ============================================================================

export class PredictionExecutiveAgent {
  agentId = 'executive:prediction';

  async analyze(context: ExecutiveContext): Promise<ExecutiveOutput> {
    const { teamA, teamB, microOutputs, strategicOutputs, matchContext } = context;

    const reasoning: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];

    // Aggregate all predictions
    const aggregatedPrediction = this.aggregatePredictions(microOutputs, strategicOutputs);
    reasoning.push(...aggregatedPrediction.reasoning);

    // Factor in ratings
    const ratingFactors = this.analyzeRatingFactors(teamA, teamB);
    reasoning.push(...ratingFactors.reasoning);
    riskFactors.push(...ratingFactors.riskFactors);

    // Factor in recent form
    const formFactors = this.analyzeFormFactors(teamA, teamB);
    reasoning.push(...formFactors.reasoning);
    opportunities.push(...formFactors.opportunities);

    // Factor in match context
    const contextFactors = this.analyzeMatchContext(teamA, teamB, matchContext);
    reasoning.push(...contextFactors.reasoning);
    recommendations.push(...contextFactors.recommendations);

    // Synthesize final prediction
    const finalPrediction = this.synthesizePrediction(
      aggregatedPrediction,
      ratingFactors,
      formFactors,
      contextFactors
    );

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      aggregatedPrediction,
      ratingFactors,
      formFactors
    );

    return {
      agentId: this.agentId,
      finalDecision: finalPrediction,
      confidence,
      reasoning,
      riskFactors,
      opportunities,
      recommendations,
    };
  }

  private aggregatePredictions(
    microOutputs: AgentOutput[],
    strategicOutputs: StrategicOutput[]
  ): { reasoning: string[]; winner: string; winProbability: number } {
    const reasoning: string[] = [];
    
    // Weight micro agent predictions
    let microWinProbability = 0.5;
    let microConfidence = 0;

    for (const output of microOutputs) {
      const cogFeatures = output.insights?.cognitiveProfile;
      if (cogFeatures?.clutchProbability) {
        microWinProbability += (cogFeatures.clutchProbability - 0.5) * 0.05;
      }
      microConfidence += output.confidence;
    }

    if (microOutputs.length > 0) {
      microConfidence /= microOutputs.length;
    }

    // Weight strategic agent predictions
    let strategicWinProbability = 0.5;
    let strategicConfidence = 0;

    for (const output of strategicOutputs) {
      if (output.predictions?.metaImpact?.metaFavorite) {
        if (output.predictions.metaImpact.metaFavorite === 'teamA') {
          strategicWinProbability += 0.1;
        } else {
          strategicWinProbability -= 0.1;
        }
      }
      strategicConfidence += output.confidence;
    }

    if (strategicOutputs.length > 0) {
      strategicConfidence /= strategicOutputs.length;
    }

    // Combine predictions
    const microWeight = 0.4;
    const strategicWeight = 0.6;
    const combinedProbability = 
      microWinProbability * microWeight + 
      strategicWinProbability * strategicWeight;

    const winner = combinedProbability > 0.5 ? 'teamA' : 'teamB';
    const winProbability = Math.abs(combinedProbability - 0.5) + 0.5;

    reasoning.push(`Micro analysis contribution: ${(microWinProbability * 100).toFixed(1)}% teamA probability`);
    reasoning.push(`Strategic analysis contribution: ${(strategicWinProbability * 100).toFixed(1)}% teamA probability`);
    reasoning.push(`Combined prediction: ${winner === 'teamA' ? 'Team A' : 'Team B'} favored at ${(winProbability * 100).toFixed(1)}%`);

    return { reasoning, winner, winProbability };
  }

  private analyzeRatingFactors(
    teamA: ExecutiveContext['teamA'],
    teamB: ExecutiveContext['teamB']
  ): { reasoning: string[]; riskFactors: string[] } {
    const reasoning: string[] = [];
    const riskFactors: string[] = [];

    // Elo comparison
    const eloDiff = teamA.eloRating - teamB.eloRating;
    const eloAdvantage = eloDiff > 0 ? teamA.name : teamB.name;
    const eloDiffAbs = Math.abs(eloDiff);

    if (eloDiffAbs > 200) {
      reasoning.push(`${eloAdvantage} has significant Elo advantage (${eloDiffAbs.toFixed(0)} points)`);
    } else if (eloDiffAbs > 100) {
      reasoning.push(`${eloAdvantage} has moderate Elo advantage (${eloDiffAbs.toFixed(0)} points)`);
    } else {
      reasoning.push('Elo ratings are closely matched');
    }

    // Glicko comparison
    const glickoDiff = teamA.glickoRating - teamB.glickoRating;
    if (Math.abs(glickoDiff) > 100) {
      const glickoAdvantage = glickoDiff > 0 ? teamA.name : teamB.name;
      reasoning.push(`${glickoAdvantage} has higher Glicko rating suggesting consistency`);
    }

    // Rating-based risk
    if (eloDiffAbs < 50) {
      riskFactors.push('Close Elo ratings increase uncertainty');
    }

    return { reasoning, riskFactors };
  }

  private analyzeFormFactors(
    teamA: ExecutiveContext['teamA'],
    teamB: ExecutiveContext['teamB']
  ): { reasoning: string[]; opportunities: string[] } {
    const reasoning: string[] = [];
    const opportunities: string[] = [];

    // Recent form analysis
    const formA = teamA.recentForm;
    const formB = teamB.recentForm;

    const formTrend = this.parseFormTrend(formA);
    const opponentFormTrend = this.parseFormTrend(formB);

    if (formTrend === 'rising' && opponentFormTrend !== 'rising') {
      reasoning.push(`${teamA.name} has momentum advantage`);
      opportunities.push(`${teamA.name} can exploit opponent's inconsistent form`);
    } else if (formTrend === 'declining' && opponentFormTrend !== 'declining') {
      reasoning.push(`${teamA.name} form concerns`);
      opportunities.push(`${teamB.name} can capitalize on ${teamA.name}'s struggles`);
    } else if (formTrend === 'stable' && opponentFormTrend === 'stable') {
      reasoning.push('Both teams in similar stable form');
    }

    return { reasoning, opportunities };
  }

  private parseFormTrend(form: string): string {
    if (form === 'rising') return 'rising';
    if (form === 'declining') return 'declining';
    return 'stable';
  }

  private analyzeMatchContext(
    teamA: ExecutiveContext['teamA'],
    teamB: ExecutiveContext['teamB'],
    matchContext: ExecutiveContext['matchContext']
  ): { reasoning: string[]; recommendations: string[] } {
    const reasoning: string[] = [];
    const recommendations: string[] = [];

    // Format impact
    if (matchContext.format === 'bo5') {
      reasoning.push('Best of 5 format favors deeper rosters and adaptability');
      recommendations.push('Ensure all players are prepared for long series');
    } else if (matchContext.format === 'bo1') {
      reasoning.push('Best of 1 increases variance and importance of preparation');
      recommendations.push('Focus on map-specific strategies');
    }

    // Map pool consideration
    if (matchContext.mapPool && matchContext.mapPool.length > 0) {
      reasoning.push(`Map pool (${matchContext.mapPool.length} maps) provides strategic depth`);
    }

    // Tournament importance
    if (matchContext.tournamentImportance === 'championship') {
      reasoning.push('Championship match - expect peak performance from both teams');
      recommendations.push('Account for potential nerves and pressure');
    }

    return { reasoning, recommendations };
  }

  private synthesizePrediction(
    aggregated: { winner: string; winProbability: number },
    rating: { reasoning: string[] },
    form: { reasoning: string[] },
    context: { reasoning: string[] }
  ): Record<string, any> {
    return {
      predictedWinner: aggregated.winner === 'teamA' ? 'Team A' : 'Team B',
      winProbability: aggregated.winProbability,
      expectedScore: aggregated.winProbability > 0.7
        ? '3-0'
        : aggregated.winProbability > 0.55
        ? '3-1'
        : aggregated.winProbability > 0.5
        ? '3-2'
        : '2-3',
      keyFactors: [
        'Team skill comparison',
        'Recent form and momentum',
        'Match format and context',
        'Strategic preparation',
      ],
      upsetProbability: Math.max(0.05, 1 - aggregated.winProbability * 2),
      predictedGameCount: aggregated.winProbability > 0.7 ? 3 : aggregated.winProbability > 0.5 ? 4 : 5,
    };
  }

  private calculateConfidence(
    aggregated: { winProbability: number },
    rating: { reasoning: string[] },
    form: { reasoning: string[] }
  ): number {
    let confidence = 0.5;

    // Base confidence on prediction strength
    confidence += Math.abs(aggregated.winProbability - 0.5) * 0.3;

    // Increase with more supporting evidence
    confidence += (rating.reasoning.length + form.reasoning.length) * 0.02;

    return Math.min(0.95, confidence);
  }
}

// ============================================================================
// Risk Executive Agent
// ============================================================================

export class RiskExecutiveAgent {
  agentId = 'executive:risk';

  async analyze(context: ExecutiveContext): Promise<ExecutiveOutput> {
    const { teamA, teamB, microOutputs, strategicOutputs, matchContext } = context;

    const reasoning: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];

    // Identify risks
    const identifiedRisks = this.identifyRisks(microOutputs, strategicOutputs);
    riskFactors.push(...identifiedRisks.risks);
    reasoning.push(...identifiedRisks.reasoning);

    // Assess risk magnitude
    const riskAssessment = this.assessRiskMagnitude(riskFactors, teamA, teamB);
    reasoning.push(...riskAssessment.reasoning);
    riskFactors.push(...riskAssessment.additionalRisks);

    // Identify opportunities
    const opportunityAnalysis = this.identifyOpportunities(microOutputs, strategicOutputs);
    opportunities.push(...opportunityAnalysis.opportunities);
    reasoning.push(...opportunityAnalysis.reasoning);

    // Generate mitigation strategies
    const mitigations = this.generateMitigations(riskFactors, opportunities);
    recommendations.push(...mitigations.recommendations);

    // Calculate risk-adjusted confidence
    const confidence = this.calculateRiskAdjustedConfidence(
      identifiedRisks,
      opportunityAnalysis,
      matchContext
    );

    return {
      agentId: this.agentId,
      finalDecision: {
        overallRiskLevel: riskAssessment.overallLevel,
        riskScore: riskAssessment.score,
        opportunityScore: opportunityAnalysis.score,
        riskAdjustedPrediction: riskAssessment.riskAdjustedPrediction,
        keyRisks: riskFactors.slice(0, 5),
        keyOpportunities: opportunities.slice(0, 3),
        mitigationPlan: mitigations.plan,
      },
      confidence,
      reasoning,
      riskFactors,
      opportunities,
      recommendations,
    };
  }

  private identifyRisks(
    microOutputs: AgentOutput[],
    strategicOutputs: StrategicOutput[]
  ): { reasoning: string[]; risks: string[] } {
    const reasoning: string[] = [];
    const risks: string[] = [];

    // Check micro agent warnings
    for (const output of microOutputs) {
      for (const warning of output.warnings || []) {
        if (!risks.includes(warning)) {
          risks.push(warning);
        }
      }
    }

    // Check strategic agent risks
    for (const output of strategicOutputs) {
      if (output.recommendations) {
        for (const rec of output.recommendations) {
          if (rec.toLowerCase().includes('focus') || rec.toLowerCase().includes('practice')) {
            risks.push(`Area for improvement: ${rec}`);
          }
        }
      }
    }

    reasoning.push(`Identified ${risks.length} risk factors from analysis`);
    if (risks.length === 0) {
      risks.push('No significant risk factors identified');
    }

    return { reasoning, risks };
  }

  private assessRiskMagnitude(
    risks: string[],
    teamA: ExecutiveContext['teamA'],
    teamB: ExecutiveContext['teamB']
  ): { reasoning: string[]; additionalRisks: string[]; score: number; overallLevel: string; riskAdjustedPrediction: Record<string, any> } {
    const reasoning: string[] = [];
    const additionalRisks: string[] = [];

    // Calculate base risk score
    let riskScore = 0.3; // Base risk

    // Add risk for close ratings
    if (Math.abs(teamA.eloRating - teamB.eloRating) < 50) {
      riskScore += 0.15;
      additionalRisks.push('Close team strength increases upset risk');
    }

    // Add risk for poor recent form
    if (teamA.recentForm === 'declining') {
      riskScore += 0.1;
      additionalRisks.push(`${teamA.name} declining form increases risk`);
    }

    // Determine overall risk level
    let overallLevel: string;
    if (riskScore > 0.6) {
      overallLevel = 'high';
      reasoning.push('Overall risk level: HIGH');
    } else if (riskScore > 0.4) {
      overallLevel = 'medium';
      reasoning.push('Overall risk level: MEDIUM');
    } else {
      overallLevel = 'low';
      reasoning.push('Overall risk level: LOW');
    }

    reasoning.push(`Risk score: ${(riskScore * 100).toFixed(0)}%`);

    // Risk-adjusted prediction
    const riskAdjustedPrediction = {
      baseWinProbability: 0.5,
      riskAdjustment: -riskScore * 0.1,
      adjustedWinProbability: 0.5 - riskScore * 0.1,
      confidenceReduction: riskScore * 0.15,
    };

    return { reasoning, additionalRisks, score: riskScore, overallLevel, riskAdjustedPrediction };
  }

  private identifyOpportunities(
    microOutputs: AgentOutput[],
    strategicOutputs: StrategicOutput[]
  ): { reasoning: string[]; opportunities: string[]; score: number } {
    const reasoning: string[] = [];
    const opportunities: string[] = [];

    // Check micro agent insights
    for (const output of microOutputs) {
      for (const finding of output.findings || []) {
        if (finding.toLowerCase().includes('strong') || finding.toLowerCase().includes('excellent')) {
          opportunities.push(finding);
        }
      }
    }

    // Check strategic agent predictions
    for (const output of strategicOutputs) {
      if (output.predictions?.gamePlan) {
        opportunities.push('Favorable game plan identified');
      }
    }

    // Calculate opportunity score
    const score = Math.min(1, 0.3 + opportunities.length * 0.15);

    reasoning.push(`Identified ${opportunities.length} key opportunities`);
    reasoning.push(`Opportunity score: ${(score * 100).toFixed(0)}%`);

    return { reasoning, opportunities, score };
  }

  private generateMitigations(
    risks: string[],
    opportunities: string[]
  ): { recommendations: string[]; plan: Record<string, any> } {
    const recommendations: string[] = [];
    const plan: Record<string, any> = {};

    // Generate specific mitigations
    const mitigationMap: Record<string, string> = {
      'form': 'Focus on recent practice results and mental preparation',
      'meta': 'Review opponent playstyle and prepare counters',
      'synergy': 'Additional team practice sessions',
      'adaptability': 'Develop flexible game plan with multiple approaches',
      'mechanical': 'Individual aim training and warmup routines',
    };

    // Map risks to mitigations
    const mitigationActions: string[] = [];
    for (const risk of risks) {
      const lowerRisk = risk.toLowerCase();
      for (const [key, action] of Object.entries(mitigationMap)) {
        if (lowerRisk.includes(key)) {
          mitigationActions.push(action);
        }
      }
    }

    // Deduplicate and add
    const uniqueActions = [...new Set(mitigationActions)];
    recommendations.push(...uniqueActions);

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Maintain current preparation routine');
      recommendations.push('Focus on executing established strategies');
    }

    plan.riskBasedRecommendations = recommendations;
    plan.priorityActions = recommendations.slice(0, 3);

    return { recommendations, plan };
  }

  private calculateRiskAdjustedConfidence(
    risks: { risks: string[] },
    opportunities: { score: number },
    matchContext: ExecutiveContext['matchContext']
  ): number {
    let confidence = 0.7;

    // Reduce confidence with more risks
    confidence -= risks.risks.length * 0.05;

    // Increase confidence with opportunities
    confidence += opportunities.score * 0.1;

    // Reduce confidence for important matches
    if (matchContext.tournamentImportance === 'championship') {
      confidence -= 0.1;
    }

    // Reduce confidence for short formats
    if (matchContext.format === 'bo1') {
      confidence -= 0.1;
    }

    return Math.max(0.4, Math.min(0.95, confidence));
  }
}

// ============================================================================
// Simulation Executive Agent
// ============================================================================

export class SimulationExecutiveAgent {
  agentId = 'executive:simulation';

  async analyze(context: ExecutiveContext): Promise<ExecutiveOutput> {
    const { teamA, teamB, microOutputs, strategicOutputs, matchContext } = context;

    const reasoning: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];

    // Run Monte Carlo simulation (simplified)
    const simulationResults = this.runMonteCarloSimulation(teamA, teamB, matchContext);
    reasoning.push(...simulationResults.reasoning);

    // Analyze scenario outcomes
    const scenarioAnalysis = this.analyzeScenarios(simulationResults);
    reasoning.push(...scenarioAnalysis.reasoning);
    opportunities.push(...scenarioAnalysis.opportunities);
    riskFactors.push(...scenarioAnalysis.risks);

    // Generate predictions with confidence intervals
    const predictions = this.generatePredictions(simulationResults, matchContext);
    const recs = predictions.recommendedApproach;
    reasoning.push(...predictions.reasoning);
    recommendations.push(recs);

    // Calculate simulation confidence
    const confidence = this.calculateSimulationConfidence(simulationResults, matchContext);

    return {
      agentId: this.agentId,
      finalDecision: {
        simulationsRun: simulationResults.iterations,
        teamAWinRate: simulationResults.teamAWinRate,
        teamBWinRate: simulationResults.teamBWinRate,
        expectedScore: predictions.expectedScore,
        scoreDistribution: simulationResults.scoreDistribution,
        confidenceInterval: predictions.confidenceInterval,
        scenarioBreakdown: scenarioAnalysis.breakdown,
        recommendedApproach: predictions.recommendedApproach,
      },
      confidence,
      reasoning,
      riskFactors,
      opportunities,
      recommendations,
    };
  }

  private runMonteCarloSimulation(
    teamA: ExecutiveContext['teamA'],
    teamB: ExecutiveContext['teamB'],
    matchContext: ExecutiveContext['matchContext']
  ): { reasoning: string[]; iterations: number; teamAWinRate: number; teamBWinRate: number; scoreDistribution: Record<string, number> } {
    const reasoning: string[] = [];
    
    const iterations = 10000;
    const baseWinRate = 0.5 + (teamA.features.skill_index - teamB.features.skill_index) * 0.3;
    const formBonus = teamA.recentForm === 'rising' ? 0.03 : teamA.recentForm === 'declining' ? -0.03 : 0;
    const adjustedWinRate = Math.max(0.1, Math.min(0.9, baseWinRate + formBonus));

    // Simulate outcomes
    let teamAWins = 0;
    const scoreDistribution: Record<string, number> = {};

    for (let i = 0; i < iterations; i++) {
      const isTeamAWin = Math.random() < adjustedWinRate;
      if (isTeamAWin) {
        teamAWins++;
      }

      // Generate score based on win
      const baseScore = isTeamAWin ? 13 : 11;
      const variance = Math.floor(Math.random() * 5);
      const score = isTeamAWin 
        ? `${baseScore}-${Math.max(0, baseScore - 5 - variance)}`
        : `${Math.max(0, baseScore - 5 - variance)}-${baseScore}`;
      
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
    }

    const teamAWinRate = teamAWins / iterations;
    const teamBWinRate = 1 - teamAWinRate;

    reasoning.push(`Ran ${iterations.toLocaleString()} Monte Carlo simulations`);
    reasoning.push(`Team A simulated win rate: ${(teamAWinRate * 100).toFixed(1)}%`);
    reasoning.push(`Team B simulated win rate: ${(teamBWinRate * 100).toFixed(1)}%`);

    return { reasoning, iterations, teamAWinRate, teamBWinRate, scoreDistribution };
  }

  private analyzeScenarios(
    simulation: { iterations: number; teamAWinRate: number; teamBWinRate: number; scoreDistribution: Record<string, number> }
  ): { reasoning: string[]; opportunities: string[]; risks: string[]; breakdown: Record<string, any> } {
    const reasoning: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];
    const breakdown: Record<string, any> = {};

    // Analyze score distribution
    const scores = Object.entries(simulation.scoreDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    breakdown.mostLikelyScores = scores.map(([score, count]) => ({
      score,
      probability: (count / simulation.iterations * 100).toFixed(1) + '%'
    }));

    // Identify sweep potential
    const sweep3_0 = simulation.scoreDistribution['3-0'] || 0;
    const sweep0_3 = simulation.scoreDistribution['0-3'] || 0;
    const total = simulation.iterations;

    breakdown.sweepProbability = {
      teamA: ((sweep3_0 / total) * 100).toFixed(1) + '%',
      teamB: ((sweep0_3 / total) * 100).toFixed(1) + '%',
    };

    // Identify close match probability
    let closeGames = 0;
    for (const [score, count] of Object.entries(simulation.scoreDistribution)) {
      const [a, b] = score.split('-').map(Number);
      if (Math.abs(a - b) <= 2 && (a + b) >= 24) {
        closeGames += count;
      }
    }

    breakdown.closeGameProbability = ((closeGames / total) * 100).toFixed(1) + '%';

    // Generate insights
    if (sweep3_0 / total > 0.2) {
      opportunities.push('High sweep probability suggests dominant performance potential');
    }

    if (closeGames / total > 0.3) {
      risks.push('High probability of close games - mental toughness critical');
    }

    if (Math.abs(simulation.teamAWinRate - 0.5) < 0.05) {
      reasoning.push('Match is too close to call - expect even contest');
    } else {
      reasoning.push(`Clear advantage for ${simulation.teamAWinRate > 0.5 ? 'Team A' : 'Team B'}`);
    }

    return { reasoning, opportunities, risks, breakdown };
  }

  private generatePredictions(
    simulation: { teamAWinRate: number; teamBWinRate: number; scoreDistribution: Record<string, number> },
    matchContext: ExecutiveContext['matchContext']
  ): { reasoning: string[]; expectedScore: string; confidenceInterval: { low: string; high: string }; recommendedApproach: string } {
    const reasoning: string[] = [];
    
    // Find most likely score
    let maxScore = '';
    let maxCount = 0;
    for (const [score, count] of Object.entries(simulation.scoreDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        maxScore = score;
      }
    }

    // Calculate expected score
    let totalA = 0, totalB = 0, totalGames = 0;
    for (const [score, count] of Object.entries(simulation.scoreDistribution)) {
      const [a, b] = score.split('-').map(Number);
      totalA += a * count;
      totalB += b * count;
      totalGames += count;
    }
    const avgScoreA = totalA / totalGames;
    const avgScoreB = totalB / totalGames;
    const expectedScore = `${avgScoreA.toFixed(1)}-${avgScoreB.toFixed(1)}`;

    // Confidence interval
    const ciLow = `${Math.floor(avgScoreA - 2)}-${Math.floor(avgScoreB + 2)}`;
    const ciHigh = `${Math.ceil(avgScoreA + 2)}-${Math.ceil(avgScoreB - 2)}`;

    // Recommended approach
    let recommendedApproach: string;
    if (simulation.teamAWinRate > 0.6) {
      recommendedApproach = 'Aggressive approach - exploit advantages early';
    } else if (simulation.teamAWinRate < 0.4) {
      recommendedApproach = 'Cautious approach - wait for opponent mistakes';
    } else {
      recommendedApproach = 'Balanced approach - adapt to opponent';
    }

    reasoning.push(`Expected score: ${expectedScore}`);
    reasoning.push(`Most likely exact score: ${maxScore}`);
    reasoning.push(`Recommended approach: ${recommendedApproach}`);

    return {
      reasoning,
      expectedScore,
      confidenceInterval: { low: ciLow, high: ciHigh },
      recommendedApproach,
    };
  }

  private calculateSimulationConfidence(
    simulation: { teamAWinRate: number },
    matchContext: ExecutiveContext['matchContext']
  ): number {
    let confidence = 0.75;

    // Higher confidence when prediction is clear
    confidence += Math.abs(simulation.teamAWinRate - 0.5) * 0.2;

    // Reduce for short formats
    if (matchContext.format === 'bo1') {
      confidence -= 0.15;
    }

    return Math.min(0.95, Math.max(0.5, confidence));
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createExecutiveAgent(type: 'prediction' | 'risk' | 'simulation'): {
  agentId: string;
  analyze: (context: ExecutiveContext) => Promise<ExecutiveOutput>;
} {
  switch (type) {
    case 'prediction':
      return { agentId: 'executive:prediction', analyze: async (ctx) => new PredictionExecutiveAgent().analyze(ctx) };
    case 'risk':
      return { agentId: 'executive:risk', analyze: async (ctx) => new RiskExecutiveAgent().analyze(ctx) };
    case 'simulation':
      return { agentId: 'executive:simulation', analyze: async (ctx) => new SimulationExecutiveAgent().analyze(ctx) };
  }
}

export const predictionExecutiveAgent = new PredictionExecutiveAgent();
export const riskExecutiveAgent = new RiskExecutiveAgent();
export const simulationExecutiveAgent = new SimulationExecutiveAgent();

