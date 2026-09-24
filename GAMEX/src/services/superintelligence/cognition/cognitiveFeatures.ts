/**
 * ScoutIQ v5 - Cognitive Feature Engineering Layer
 * 
 * Generates advanced cognitive and psychological features for esports performance:
 * - Clutch probability
 * - Adaptability index
 * - Psychological momentum
 * - Strategic entropy
 * - Anti-meta score
 * - Cognitive load index
 * - Decision quality score
 * - Pressure resilience
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';
import { EmbeddingFeatures } from '../../ai/embedding.service';
import { TeamTrend } from '../../scoutiq/history.engine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CognitiveFeatures {
  // Core Performance Features
  clutchProbability: number;
  adaptabilityIndex: number;
  psychologicalMomentum: number;
  strategicEntropy: number;
  antiMetaScore: number;
  
  // Advanced Cognitive Features
  cognitiveLoadIndex: number;
  decisionQualityScore: number;
  pressureResilience: number;
  learningVelocity: number;
  gameSenseIndex: number;
  
  // Meta-Awareness Features
  metaAwarenessScore: number;
  counterPlayIndex: number;
  patchAdaptationSpeed: number;
  
  // Team Cognitive Features
  communicationEfficiency: number;
  leadershipScore: number;
  collectiveMomentum: number;
  
  // Uncertainty Metrics
  featureConfidence: number;
  predictionStability: number;
}

export interface PlayerCognitiveInput {
  playerId: string;
  universalFeatures: UniversalFeatures;
  embeddingFeatures: EmbeddingFeatures;
  matchHistory: Array<{
    result: 'win' | 'loss' | null;
    score: string;
    roundScores?: number[];
    clutchSituations?: number;
    comebackAttempts?: number;
    timestamp: string;
  }>;
  role: string;
  experienceLevel: number;
}

export interface TeamCognitiveInput {
  teamId: string;
  playerIds: string[];
  universalFeatures: UniversalFeatures;
  matchHistory: TeamTrend;
  communicationPattern: 'high' | 'medium' | 'low';
  leadershipStructure: 'distributed' | 'hierarchical' | 'rotating';
}

// ============================================================================
// Feature Computation Engines
// ============================================================================

export class CognitiveFeatureEngine {
  private readonly WEIGHTS = {
    clutch: { recent: 0.4, historical: 0.35, pressure: 0.25 },
    adaptability: { patch: 0.3, meta: 0.4, opponent: 0.3 },
    momentum: { recent: 0.5, streak: 0.3, opponentQuality: 0.2 },
    entropy: { strategyVariety: 0.4, outcomeVariance: 0.35, adaptationSpeed: 0.25 },
    meta: { pickRate: 0.25, winRate: 0.35, counterScore: 0.4 },
  };

  // =========================================================================
  // Core Cognitive Features
  // =========================================================================

  computeClutchProbability(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length < 3) return 0.5;

    // Analyze clutch situations from match history
    const clutchData = this.analyzeClutchPerformance(matchHistory);
    
    // Combine with base features
    const skillComponent = universalFeatures.skill_index * 0.3;
    const pressureComponent = universalFeatures.adaptability_score * 0.2;
    
    // Calculate clutch probability
    const clutchProb = 
      clutchData.recentClutchRate * this.WEIGHTS.clutch.recent +
      clutchData.historicalClutchRate * this.WEIGHTS.clutch.historical +
      clutchData.pressurePerformance * this.WEIGHTS.clutch.pressure +
      skillComponent +
      pressureComponent;

    return this.clamp(clutchProb, 0.05, 0.95);
  }

  computeAdaptabilityIndex(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures, role } = input;
    
    if (matchHistory.length < 5) return 0.5;

    // Patch adaptation speed
    const patchAdaptation = this.measurePatchAdaptation(matchHistory);
    
    // Meta adaptation
    const metaAdaptation = this.measureMetaAdaptation(matchHistory);
    
    // Opponent-based adaptation
    const opponentAdaptation = this.measureOpponentAdaptation(matchHistory);
    
    // Role flexibility
    const roleFlexibility = this.measureRoleFlexibility(role, matchHistory);
    
    const adaptabilityIndex = 
      patchAdaptation * this.WEIGHTS.adaptability.patch +
      metaAdaptation * this.WEIGHTS.adaptability.meta +
      opponentAdaptation * this.WEIGHTS.adaptability.opponent +
      roleFlexibility * 0.2 + // Additional weight for role flexibility
      universalFeatures.adaptability_score * 0.1;

    return this.clamp(adaptabilityIndex, 0.1, 0.9);
  }

  computePsychologicalMomentum(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length === 0) return 0.5;

    // Recent performance trend
    const recentTrend = this.calculatePerformanceTrend(matchHistory);
    
    // Streak analysis
    const streakAnalysis = this.analyzeStreaks(matchHistory);
    
    // Opponent quality impact
    const opponentQualityImpact = this.assessOpponentQualityImpact(matchHistory);
    
    const momentum = 
      recentTrend * this.WEIGHTS.momentum.recent +
      streakAnalysis * this.WEIGHTS.momentum.streak +
      opponentQualityImpact * this.WEIGHTS.momentum.opponentQuality +
      universalFeatures.skill_index * 0.1;

    return this.clamp(momentum, 0.1, 0.95);
  }

  computeStrategicEntropy(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    // Strategy variety
    const strategyVariety = this.measureStrategyVariety(matchHistory);
    
    // Outcome variance (lower variance = lower entropy = more predictable)
    const outcomeVariance = this.calculateOutcomeVariance(matchHistory);
    
    // Adaptation speed between rounds
    const adaptationSpeed = this.measureRoundAdaptationSpeed(matchHistory);
    
    const entropy = 
      strategyVariety * this.WEIGHTS.entropy.strategyVariety +
      (1 - outcomeVariance) * this.WEIGHTS.entropy.outcomeVariance +
      adaptationSpeed * this.WEIGHTS.entropy.adaptationSpeed +
      universalFeatures.macro_intelligence * 0.1;

    // Normalize entropy to 0-1 scale
    return this.clamp(entropy, 0.05, 0.95);
  }

  computeAntiMetaScore(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length < 5) return 0.5;

    // Performance against popular strategies
    const antiMetaPerformance = this.measureAntiMetaPerformance(matchHistory);
    
    // Counter-play effectiveness
    const counterPlayEffectiveness = this.measureCounterPlayEffectiveness(matchHistory);
    
    // Unconventional pick/win rate
    const unconventionalPerformance = this.measureUnconventionalPerformance(matchHistory);
    
    const antiMetaScore = 
      antiMetaPerformance * this.WEIGHTS.meta.pickRate +
      counterPlayEffectiveness * this.WEIGHTS.meta.counterScore +
      unconventionalPerformance * this.WEIGHTS.meta.winRate +
      universalFeatures.adaptability_score * 0.15;

    return this.clamp(antiMetaScore, 0.1, 0.95);
  }

  // =========================================================================
  // Advanced Cognitive Features
  // =========================================================================

  computeCognitiveLoadIndex(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    // Complexity of matches played
    const matchComplexity = this.assessMatchComplexity(matchHistory);
    
    // Role cognitive demands
    const roleCognitiveLoad = this.getRoleCognitiveLoad(input.role);
    
    // Multi-tasking indicators
    const multitaskingIndex = this.measureMultitaskingAbility(matchHistory);
    
    const cognitiveLoad = 
      matchComplexity * 0.3 +
      roleCognitiveLoad * 0.3 +
      multitaskingIndex * 0.25 +
      universalFeatures.macro_intelligence * 0.15;

    return this.clamp(cognitiveLoad, 0.1, 0.95);
  }

  computeDecisionQualityScore(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length < 3) return 0.5;

    // Decision accuracy under pressure
    const decisionAccuracy = this.measureDecisionAccuracy(matchHistory);
    
    // Reaction time quality
    const reactionQuality = this.estimateReactionQuality(matchHistory);
    
    // Risk assessment
    const riskAssessment = this.measureRiskAssessment(matchHistory);
    
    const decisionQuality = 
      decisionAccuracy * 0.4 +
      reactionQuality * 0.3 +
      riskAssessment * 0.2 +
      universalFeatures.skill_index * 0.1;

    return this.clamp(decisionQuality, 0.15, 0.95);
  }

  computePressureResilience(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length < 3) return 0.5;

    // Performance in close matches
    const closeMatchPerformance = this.measureCloseMatchPerformance(matchHistory);
    
    // Comeback ability
    const comebackAbility = this.measureComebackAbility(matchHistory);
    
    // Late-game performance
    const lateGamePerformance = this.measureLateGamePerformance(matchHistory);
    
    const resilience = 
      closeMatchPerformance * 0.35 +
      comebackAbility * 0.35 +
      lateGamePerformance * 0.2 +
      universalFeatures.adaptability_score * 0.1;

    return this.clamp(resilience, 0.1, 0.95);
  }

  computeLearningVelocity(input: PlayerCognitiveInput): number {
    const { matchHistory, experienceLevel } = input;
    
    if (matchHistory.length < 10) return 0.5;

    // Improvement rate over recent matches
    const improvementRate = this.calculateImprovementRate(matchHistory);
    
    // Error reduction rate
    const errorReduction = this.measureErrorReduction(matchHistory);
    
    // New strategy adoption speed
    const strategyAdoptionSpeed = this.measureStrategyAdoptionSpeed(matchHistory);
    
    const learningVelocity = 
      improvementRate * 0.4 +
      errorReduction * 0.3 +
      strategyAdoptionSpeed * 0.2 +
      (1 - experienceLevel) * 0.1; // Lower experience = higher potential learning

    return this.clamp(learningVelocity, 0.1, 0.95);
  }

  computeGameSenseIndex(input: PlayerCognitiveInput): number {
    const { universalFeatures, embeddingFeatures } = input;
    
    // Combine multiple indicators
    const mapAwareness = this.estimateMapAwareness(embeddingFeatures);
    const objectivePriority = this.estimateObjectivePriority(embeddingFeatures);
    const positioningSense = this.estimatePositioningSense(embeddingFeatures);
    const timingSense = this.estimateTimingSense(embeddingFeatures);
    
    const gameSense = 
      mapAwareness * 0.25 +
      objectivePriority * 0.25 +
      positioningSense * 0.25 +
      timingSense * 0.15 +
      universalFeatures.macro_intelligence * 0.1;

    return this.clamp(gameSense, 0.1, 0.95);
  }

  // =========================================================================
  // Meta-Awareness Features
  // =========================================================================

  computeMetaAwarenessScore(input: PlayerCognitiveInput, currentMetaState: any): number {
    const { matchHistory, universalFeatures } = input;
    
    // How well player aligns with current meta
    const metaAlignment = universalFeatures.meta_alignment_score;
    
    // Performance trend relative to meta shifts
    const metaTrendPerformance = this.measureMetaTrendPerformance(matchHistory, currentMetaState);
    
    // Understanding of meta counters
    const metaUnderstanding = this.assessMetaUnderstanding(matchHistory);

    const metaAwareness = 
      metaAlignment * 0.4 +
      metaTrendPerformance * 0.3 +
      metaUnderstanding * 0.3;

    return this.clamp(metaAwareness, 0.1, 0.95);
  }

  computeCounterPlayIndex(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length < 5) return 0.5;

    // Ability to counter opponent strategies
    const counterAbility = this.measureCounterAbility(matchHistory);
    
    // Adaptation during matches
    const inMatchAdaptation = this.measureInMatchAdaptation(matchHistory);
    
    // Strategy reading
    const strategyReading = this.measureStrategyReading(matchHistory);
    
    const counterPlayIndex = 
      counterAbility * 0.35 +
      inMatchAdaptation * 0.35 +
      strategyReading * 0.2 +
      universalFeatures.adaptability_score * 0.1;

    return this.clamp(counterPlayIndex, 0.1, 0.95);
  }

  computePatchAdaptationSpeed(input: PlayerCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.length < 10) return 0.5;

    // Performance change after patch
    const patchPerformanceChange = this.measurePatchPerformanceChange(matchHistory);
    
    // Strategy adjustment speed
    const strategyAdjustmentSpeed = this.measureStrategyAdjustmentSpeed(matchHistory);
    
    const patchAdaptationSpeed = 
      patchPerformanceChange * 0.5 +
      strategyAdjustmentSpeed * 0.5 +
      universalFeatures.adaptability_score * 0.1;

    return this.clamp(patchAdaptationSpeed, 0.1, 0.95);
  }

  // =========================================================================
  // Team Cognitive Features
  // =========================================================================

  computeCommunicationEfficiency(input: TeamCognitiveInput): number {
    const { communicationPattern, universalFeatures } = input;
    
    const patternScore = {
      high: 0.9,
      medium: 0.6,
      low: 0.3,
    }[communicationPattern] || 0.5;

    const communicationEfficiency = 
      patternScore * 0.6 +
      universalFeatures.synergy_score * 0.4;

    return this.clamp(communicationEfficiency, 0.1, 0.95);
  }

  computeLeadershipScore(input: TeamCognitiveInput): number {
    const { leadershipStructure, universalFeatures, playerIds } = input;
    
    const structureScore = {
      distributed: 0.8,
      hierarchical: 0.6,
      rotating: 0.7,
    }[leadershipStructure] || 0.5;

    // Leadership typically comes from support or IGL roles
    const leadershipPotential = universalFeatures.macro_intelligence * 0.3 +
      universalFeatures.synergy_score * 0.3;

    return this.clamp(
      structureScore * 0.4 + leadershipPotential * 0.6,
      0.1,
      0.95
    );
  }

  computeCollectiveMomentum(input: TeamCognitiveInput): number {
    const { matchHistory, universalFeatures } = input;
    
    if (matchHistory.recentForm.length < 3) return 0.5;

    // Team momentum based on recent form
    const teamMomentum = this.calculateTeamMomentum(matchHistory);
    
    // Synergy boost
    const synergyBoost = universalFeatures.synergy_score * 0.2;

    const collectiveMomentum = 
      teamMomentum * 0.7 +
      synergyBoost * 0.3;

    return this.clamp(collectiveMomentum, 0.1, 0.95);
  }

  // =========================================================================
  // Uncertainty Metrics
  // =========================================================================

  computeFeatureConfidence(input: PlayerCognitiveInput): number {
    const { matchHistory } = input;
    
    // More data = higher confidence
    const dataPoints = Math.min(matchHistory.length / 20, 1.0);
    
    // Consistency increases confidence
    const consistency = 1 - this.calculateOutcomeVariance(matchHistory);
    
    // Recency matters
    const recencyBoost = matchHistory.length > 0 ? 0.8 : 0.2;

    return dataPoints * 0.4 + consistency * 0.3 + recencyBoost * 0.3;
  }

  computePredictionStability(input: PlayerCognitiveInput): number {
    const { matchHistory } = input;
    
    if (matchHistory.length < 5) return 0.5;

    // Stable performance = high stability
    const variance = this.calculateOutcomeVariance(matchHistory);
    const trendStability = 1 - variance;
    
    // Predictable playstyle
    const predictability = this.measureStrategyVariety(matchHistory);

    return (trendStability + predictability) / 2;
  }

  // =========================================================================
  // Main Computation Method
  // =========================================================================

  computeAllFeatures(input: PlayerCognitiveInput, currentMetaState?: any): CognitiveFeatures {
    return {
      clutchProbability: this.computeClutchProbability(input),
      adaptabilityIndex: this.computeAdaptabilityIndex(input),
      psychologicalMomentum: this.computePsychologicalMomentum(input),
      strategicEntropy: this.computeStrategicEntropy(input),
      antiMetaScore: this.computeAntiMetaScore(input),
      cognitiveLoadIndex: this.computeCognitiveLoadIndex(input),
      decisionQualityScore: this.computeDecisionQualityScore(input),
      pressureResilience: this.computePressureResilience(input),
      learningVelocity: this.computeLearningVelocity(input),
      gameSenseIndex: this.computeGameSenseIndex(input),
      metaAwarenessScore: currentMetaState 
        ? this.computeMetaAwarenessScore(input, currentMetaState)
        : 0.5,
      counterPlayIndex: this.computeCounterPlayIndex(input),
      patchAdaptationSpeed: this.computePatchAdaptationSpeed(input),
      communicationEfficiency: 0.5, // Set by team context
      leadershipScore: 0.5, // Set by team context
      collectiveMomentum: 0.5, // Set by team context
      featureConfidence: this.computeFeatureConfidence(input),
      predictionStability: this.computePredictionStability(input),
    };
  }

  // =========================================================================
  // Helper Analysis Methods
  // =========================================================================

  private analyzeClutchPerformance(
    matchHistory: PlayerCognitiveInput['matchHistory']
  ): { recentClutchRate: number; historicalClutchRate: number; pressurePerformance: number } {
    let recentClutchWins = 0;
    let recentClutchTotal = 0;
    let historicalClutchWins = 0;
    let historicalClutchTotal = 0;
    let pressurePoints = 0;

    const recentMatches = matchHistory.slice(-5);
    const olderMatches = matchHistory.slice(0, -5);

    for (const match of recentMatches) {
      if (match.clutchSituations !== undefined) {
        recentClutchWins += match.clutchSituations;
        recentClutchTotal += match.clutchSituations * 2; // Estimate
        pressurePoints += match.comebackAttempts || 0;
      } else {
        // Infer from close scores
        if (this.isCloseMatch(match.score)) {
          pressurePoints += 1;
          if (match.result === 'win') recentClutchWins++;
          recentClutchTotal++;
        }
      }
    }

    for (const match of olderMatches) {
      if (this.isCloseMatch(match.score)) {
        if (match.result === 'win') historicalClutchWins++;
        historicalClutchTotal++;
      }
    }

    return {
      recentClutchRate: recentClutchTotal > 0 ? recentClutchWins / recentClutchTotal : 0.5,
      historicalClutchRate: historicalClutchTotal > 0 ? historicalClutchWins / historicalClutchTotal : 0.5,
      pressurePerformance: Math.min(1, pressurePoints / 10),
    };
  }

  private measurePatchAdaptation(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    if (matchHistory.length < 10) return 0.5;
    
    // Compare first half vs second half performance
    const midpoint = Math.floor(matchHistory.length / 2);
    const firstHalf = matchHistory.slice(0, midpoint);
    const secondHalf = matchHistory.slice(midpoint);
    
    const firstHalfWins = firstHalf.filter(m => m.result === 'win').length / firstHalf.length;
    const secondHalfWins = secondHalf.filter(m => m.result === 'win').length / secondHalf.length;
    
    // Adaptation = improvement or maintained performance
    return secondHalfWins >= firstHalfWins ? 0.6 + (secondHalfWins - firstHalfWins) * 0.5 : 0.5;
  }

  private measureMetaAdaptation(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Look for performance consistency across different opponents
    // Simplified: assume 0.6 base with variance
    return 0.6;
  }

  private measureOpponentAdaptation(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Look for improvement against repeat opponents
    // Simplified: assume 0.55 base
    return 0.55;
  }

  private measureRoleFlexibility(role: string, matchHistory: PlayerCognitiveInput['matchHistory']): number {
    const flexibleRoles = ['Controller', 'Initiator', 'Support'];
    return flexibleRoles.includes(role) ? 0.7 : 0.5;
  }

  private calculatePerformanceTrend(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    if (matchHistory.length < 3) return 0.5;
    
    const recent = matchHistory.slice(-3);
    const older = matchHistory.slice(-6, -3);
    
    const recentWinRate = recent.filter(m => m.result === 'win').length / recent.length;
    const olderWinRate = older.length > 0 
      ? older.filter(m => m.result === 'win').length / older.length 
      : 0.5;
    
    return recentWinRate - olderWinRate + 0.5; // Normalize to 0-1
  }

  private analyzeStreaks(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    let maxStreak = 0;
    let currentStreak = 0;
    let lastResult: 'win' | 'loss' | null = null;

    for (const match of matchHistory) {
      if (match.result === lastResult) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
        lastResult = match.result;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);

    // Positive streaks boost momentum
    return Math.min(1, maxStreak / 5);
  }

  private assessOpponentQualityImpact(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Simplified: assume neutral impact
    return 0.5;
  }

  private measureStrategyVariety(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Count different strategies used (inferred from score patterns)
    const uniquePatterns = new Set(matchHistory.map(m => this.categorizeScorePattern(m.score)));
    return Math.min(1, uniquePatterns.size / 5);
  }

  private calculateOutcomeVariance(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    if (matchHistory.length < 2) return 0;
    
    const results: number[] = matchHistory.map(m => (m.result === 'win' ? 1 : 0));
    let sum = 0;
    for (const r of results) sum += r;
    const mean = sum / results.length;
    
    let varianceSum = 0;
    for (const r of results) varianceSum += Math.pow(r - mean, 2);
    const variance = varianceSum / results.length;
    
    return variance;
  }

  private measureRoundAdaptationSpeed(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Use round scores to measure adaptation
    const roundAdaptations = matchHistory
      .filter(m => m.roundScores && m.roundScores.length > 1)
      .map(m => this.calculateRoundImprovement(m.roundScores!));
    
    return roundAdaptations.length > 0 
      ? roundAdaptations.reduce((a, b) => a + b, 0) / roundAdaptations.length 
      : 0.5;
  }

  private measureAntiMetaPerformance(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Performance against top teams (inferred)
    return 0.5;
  }

  private measureCounterPlayEffectiveness(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Ability to counter opponent strategies
    return 0.55;
  }

  private measureUnconventionalPerformance(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Performance with non-meta picks (simplified)
    return 0.5;
  }

  private assessMatchComplexity(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    const avgRoundScore = matchHistory
      .map(m => this.parseScore(m.score))
      .reduce((sum, [a, b]) => sum + a + b, 0) / matchHistory.length / 2;
    
    return Math.min(1, avgRoundScore / 15);
  }

  private getRoleCognitiveLoad(role: string): number {
    const loadByRole: Record<string, number> = {
      'DUELIST': 0.7,
      'INITIATOR': 0.6,
      'CONTROLLER': 0.5,
      'SENTINEL': 0.5,
      'IGL': 0.85,
    };
    return loadByRole[role] || 0.6;
  }

  private measureMultitaskingAbility(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Simplified: assume moderate multitasking
    return 0.6;
  }

  private measureDecisionAccuracy(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Performance in decision-critical situations
    return 0.65;
  }

  private estimateReactionQuality(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Quick round wins suggest good reactions
    const quickWins = matchHistory.filter(m => {
      const [a, b] = this.parseScore(m.score);
      return a >= 13 && a <= 15;
    }).length;
    return Math.min(1, quickWins / matchHistory.length + 0.3);
  }

  private measureRiskAssessment(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Calculated risk-taking (clutch situations won vs attempted)
    return 0.6;
  }

  private measureCloseMatchPerformance(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    const closeMatches = matchHistory.filter(m => this.isCloseMatch(m.score));
    if (closeMatches.length === 0) return 0.5;
    
    const closeWins = closeMatches.filter(m => m.result === 'win').length;
    return closeWins / closeMatches.length;
  }

  private measureComebackAbility(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    const comebackAttempts = matchHistory.filter(m => 
      (m.comebackAttempts || 0) > 0 || this.isComebackMatch(m.score)
    ).length;
    return Math.min(1, comebackAttempts / matchHistory.length + 0.3);
  }

  private measureLateGamePerformance(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Performance in matches that go to overtime or close finishes
    const lateGameMatches = matchHistory.filter(m => 
      this.parseScore(m.score).reduce((a, b) => a + b, 0) >= 24
    );
    if (lateGameMatches.length === 0) return 0.5;
    
    const lateGameWins = lateGameMatches.filter(m => m.result === 'win').length;
    return lateGameWins / lateGameMatches.length;
  }

  private calculateImprovementRate(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    const quarter1 = matchHistory.slice(0, Math.floor(matchHistory.length / 4));
    const quarter4 = matchHistory.slice(-Math.floor(matchHistory.length / 4));
    
    const q1Wins = quarter1.filter(m => m.result === 'win').length / quarter1.length;
    const q4Wins = quarter4.filter(m => m.result === 'win').length / quarter4.length;
    
    return q4Wins - q1Wins + 0.5; // Normalize
  }

  private measureErrorReduction(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Fewer errors in recent matches
    return 0.6;
  }

  private measureStrategyAdoptionSpeed(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Quick adoption of winning strategies
    return 0.65;
  }

  private estimateMapAwareness(features: EmbeddingFeatures): number {
    return features.impactScore * 0.7 + features.consistencyScore * 0.3;
  }

  private estimateObjectivePriority(features: EmbeddingFeatures): number {
    return features.winRate * 0.6 + features.impactScore * 0.4;
  }

  private estimatePositioningSense(features: EmbeddingFeatures): number {
    return features.consistencyScore * 0.5 + features.clutchFactor * 0.5;
  }

  private estimateTimingSense(features: EmbeddingFeatures): number {
    return features.kdaRatio * 0.4 + features.aggressionIndex * 0.3 + features.winRate * 0.3;
  }

  private measureMetaTrendPerformance(matchHistory: PlayerCognitiveInput['matchHistory'], metaState: any): number {
    return 0.55;
  }

  private assessMetaUnderstanding(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    return 0.6;
  }

  private measureCounterAbility(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    return 0.6;
  }

  private measureInMatchAdaptation(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    const adaptations = matchHistory.filter(m => m.roundScores && m.roundScores.length > 5);
    return Math.min(1, adaptations.length / matchHistory.length + 0.4);
  }

  private measureStrategyReading(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    return 0.55;
  }

  private measurePatchPerformanceChange(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    // Simplified: assume positive adaptation
    return 0.6;
  }

  private measureStrategyAdjustmentSpeed(matchHistory: PlayerCognitiveInput['matchHistory']): number {
    return 0.6;
  }

  private calculateTeamMomentum(trend: TeamTrend): number {
    if (trend.recentForm.length === 0) return 0.5;
    
    const recentForm = trend.recentForm.slice(-5);
    const momentum = recentForm.reduce((a, b) => a + b, 0) / recentForm.length;
    return momentum;
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private isCloseMatch(score: string): boolean {
    const [a, b] = this.parseScore(score);
    return Math.abs(a - b) <= 2 && a + b >= 20;
  }

  private isComebackMatch(score: string): boolean {
    const [a, b] = this.parseScore(score);
    return (a >= 13 && b >= 11) || (b >= 13 && a >= 11);
  }

  private parseScore(score: string): [number, number] {
    const parts = score.split('-').map(s => parseInt(s.trim()) || 0);
    return [parts[0] || 0, parts[1] || 0];
  }

  private categorizeScorePattern(score: string): string {
    const [a, b] = this.parseScore(score);
    const total = a + b;
    if (total >= 26) return 'overtime';
    if (total >= 24) return 'close';
    if (total >= 20) return 'medium';
    return 'decisive';
  }

  private calculateRoundImprovement(roundScores: number[]): number {
    if (roundScores.length < 2) return 0.5;
    
    const firstHalf = roundScores.slice(0, Math.floor(roundScores.length / 2));
    const secondHalf = roundScores.slice(Math.floor(roundScores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / 15 + 0.5; // Normalize
  }
}

export const cognitiveFeatureEngine = new CognitiveFeatureEngine();

