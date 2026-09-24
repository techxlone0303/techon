/**
 * ScoutIQ v5 - Meta Evolution Prediction Engine
 * 
 * Predicts how the competitive meta will evolve over time.
 * Analyzes patch notes, tournament data, and player adaptation patterns
 * to forecast meta shifts, emerging strategies, and declining picks.
 */

import { GameTitle, UniversalFeatures } from '../../agi/normalizationEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MetaTrend {
  gameTitle: GameTitle;
  timestamp: string;
  patchVersion: string;
  
  // Current State
  currentDominantStrategies: string[];
  currentPopularPicks: string[];
  currentWinRateLeaders: string[];
  
  // Trend Indicators
  risingStrategies: string[];
  decliningStrategies: string[];
  emergingPicks: string[];
  dyingPicks: string[];
  
  // Predictions
  predictedMetaState: PredictedMetaState;
  confidenceScore: number;
  
  // Historical Comparison
  metaShiftIndicators: MetaShiftIndicator[];
}

export interface PredictedMetaState {
  predictedDominantStrategies: string[];
  predictedPopularPicks: string[];
  predictedWinRateLeaders: string[];
  predictedDecliningPicks: string[];
  predictedEmergingPicks: string[];
  
  // Meta Health
  metaDiversity: number;
  metaBalance: number;
  predictedMetaTrend: 'rising' | 'stable' | 'declining' | 'volatile';
  
  // Timeframe
  predictionHorizonDays: number;
  predictionConfidenceDecay: number;
}

export interface MetaShiftIndicator {
  type: 'buff' | 'nerf' | 'bug_fix' | 'map_change' | 'tournament_influence';
  affectedEntity: string;
  magnitude: number;
  expectedImpact: number;
  predictedTimeToImpact: number;
}

export interface PatchAnalysis {
  version: string;
  releaseDate: string;
  buffedAgents: string[];
  nerfedAgents: string[];
  mapChanges: string[];
  mechanicChanges: string[];
  overallImpact: 'high' | 'medium' | 'low';
  predictedMetaImpact: number;
}

export interface TournamentMetaInfluence {
  tournamentId: string;
  winnerStrategies: string[];
  winnerPicks: string[];
  surprisingUpsets: string[];
  metaInnovations: string[];
  influenceStrength: number;
}

export interface MetaPredictionInput {
  gameTitle: GameTitle;
  currentMetaState: any;
  recentPatchNotes: PatchAnalysis[];
  recentTournaments: TournamentMetaInfluence[];
  playerAdaptationData: Array<{
    playerId: string;
    pickRateChange: number;
    winRateChange: number;
    adaptationSpeed: number;
  }>;
  historicalMetaPatterns: Array<{
    patternType: string;
    frequency: number;
    averageDuration: number;
    successRate: number;
  }>;
}

// ============================================================================
// Meta Evolution Engine
// ============================================================================

export class MetaEvolutionEngine {
  private readonly PATCH_IMPACT_WEIGHTS = {
    buffMagnitude: 0.3,
    nerfMagnitude: 0.25,
    mechanicChangeImpact: 0.2,
    mapChangeImpact: 0.15,
    communityReaction: 0.1,
  };

  private readonly META_PREDICTION_HORIZONS = {
    immediate: 1,
    shortTerm: 7,
    mediumTerm: 14,
    longTerm: 30,
  };

  private metaHistory: Map<string, MetaTrend[]> = new Map();
  private patchAnalyses: Map<string, PatchAnalysis[]> = new Map();

  // =========================================================================
  // Main Prediction Methods
  // =========================================================================

  async predictMetaEvolution(input: MetaPredictionInput): Promise<MetaTrend> {
    const { gameTitle, currentMetaState, recentPatchNotes, recentTournaments } = input;

    // Analyze patch impact
    const patchAnalysis = this.analyzePatchImpact(recentPatchNotes);
    
    // Analyze tournament influence
    const tournamentInfluence = this.analyzeTournamentInfluence(recentTournaments);
    
    // Predict strategy shifts
    const strategyPredictions = this.predictStrategyShifts(
      currentMetaState,
      patchAnalysis,
      tournamentInfluence
    );
    
    // Predict pick rate changes
    const pickPredictions = this.predictPickRateChanges(
      currentMetaState,
      patchAnalysis,
      tournamentInfluence
    );
    
    // Calculate meta diversity and balance
    const metaHealth = this.calculateMetaHealth(strategyPredictions, pickPredictions);
    
    // Determine meta trend
    const metaTrend = this.determineMetaTrend(strategyPredictions, tournamentInfluence);
    
    // Calculate confidence
    const confidence = this.calculatePredictionConfidence(
      patchAnalysis,
      tournamentInfluence,
      input.historicalMetaPatterns
    );

    const predictedState: PredictedMetaState = {
      predictedDominantStrategies: strategyPredictions.willDominate,
      predictedPopularPicks: pickPredictions.willBePopular,
      predictedWinRateLeaders: pickPredictions.willHaveHighWinRate,
      predictedDecliningPicks: pickPredictions.willDecline,
      predictedEmergingPicks: pickPredictions.willEmerge,
      metaDiversity: metaHealth.diversity,
      metaBalance: metaHealth.balance,
      predictedMetaTrend: metaTrend,
      predictionHorizonDays: this.META_PREDICTION_HORIZONS.mediumTerm,
      predictionConfidenceDecay: this.calculateConfidenceDecay(confidence),
    };

    const trend: MetaTrend = {
      gameTitle,
      timestamp: new Date().toISOString(),
      patchVersion: recentPatchNotes[0]?.version || 'unknown',
      
      currentDominantStrategies: currentMetaState?.dominantStrategies || [],
      currentPopularPicks: currentMetaState?.pickRateChanges?.map((p: any) => p.agent) || [],
      currentWinRateLeaders: [],
      
      risingStrategies: strategyPredictions.willDominate,
      decliningStrategies: strategyPredictions.willDecline,
      emergingPicks: pickPredictions.willEmerge,
      dyingPicks: pickPredictions.willDecline,
      
      predictedMetaState: predictedState,
      confidenceScore: confidence,
      
      metaShiftIndicators: this.generateMetaShiftIndicators(patchAnalysis, tournamentInfluence),
    };

    // Store in history
    this.storeMetaTrend(gameTitle, trend);

    return trend;
  }

  async predictMatchupMeta(
    gameTitle: GameTitle,
    teamA: string,
    teamB: string,
    patchVersion: string
  ): Promise<{
    favorableStrategies: string[];
    counterStrategies: string[];
    expectedMetaFactors: string[];
    confidence: number;
  }> {
    const historicalPerformance = this.getHistoricalMetaPerformance(gameTitle, teamA, teamB);
    
    const metaFactors = this.predictMatchupMetaFactors(
      gameTitle,
      patchVersion,
      historicalPerformance
    );
    
    const favorableStrategies = this.determineFavorableStrategies(
      metaFactors,
      historicalPerformance
    );
    
    const counterStrategies = this.determineCounterStrategies(
      metaFactors,
      historicalPerformance
    );

    return {
      favorableStrategies,
      counterStrategies,
      expectedMetaFactors: metaFactors,
      confidence: this.calculateMatchupMetaConfidence(historicalPerformance),
    };
  }

  // =========================================================================
  // Patch Analysis
  // =========================================================================

  private analyzePatchImpact(patchNotes: PatchAnalysis[]): {
    overallImpact: number;
    buffImpact: Map<string, number>;
    nerfImpact: Map<string, number>;
    mechanicImpact: number;
    expectedShiftSpeed: string;
  } {
    const overallImpact = patchNotes.length > 0
      ? patchNotes.reduce((sum, patch) => sum + patch.predictedMetaImpact, 0) / patchNotes.length
      : 0;

    const buffImpact = new Map<string, number>();
    const nerfImpact = new Map<string, number>();
    let mechanicImpact = 0;

    for (const patch of patchNotes) {
      for (const agent of patch.buffedAgents) {
        const current = buffImpact.get(agent) || 0;
        buffImpact.set(agent, current + patch.predictedMetaImpact * 0.15);
      }

      for (const agent of patch.nerfedAgents) {
        const current = nerfImpact.get(agent) || 0;
        nerfImpact.set(agent, current - patch.predictedMetaImpact * 0.15);
      }

      if (patch.mechanicChanges.length > 0) {
        mechanicImpact += patch.predictedMetaImpact * 0.1;
      }
    }

    let shiftSpeed: string;
    if (overallImpact > 0.5) shiftSpeed = 'fast';
    else if (overallImpact > 0.2) shiftSpeed = 'moderate';
    else shiftSpeed = 'slow';

    return {
      overallImpact: Math.min(1, overallImpact),
      buffImpact,
      nerfImpact,
      mechanicImpact: Math.min(1, mechanicImpact),
      expectedShiftSpeed: shiftSpeed,
    };
  }

  private generatePatchAnalysis(
    version: string,
    changes: {
      buffs: string[];
      nerfs: string[];
      mapChanges: string[];
      mechanicChanges: string[];
    }
  ): PatchAnalysis {
    const magnitude = this.calculatePatchMagnitude(changes);
    
    return {
      version,
      releaseDate: new Date().toISOString(),
      buffedAgents: changes.buffs,
      nerfedAgents: changes.nerfs,
      mapChanges: changes.mapChanges,
      mechanicChanges: changes.mechanicChanges,
      overallImpact: magnitude > 0.7 ? 'high' : magnitude > 0.3 ? 'medium' : 'low',
      predictedMetaImpact: magnitude,
    };
  }

  private calculatePatchMagnitude(changes: {
    buffs: string[];
    nerfs: string[];
    mapChanges: string[];
    mechanicChanges: string[];
  }): number {
    let magnitude = 0;
    
    magnitude += changes.buffs.length * 0.1;
    magnitude += changes.nerfs.length * 0.12;
    magnitude += changes.mapChanges.length * 0.08;
    magnitude += changes.mechanicChanges.length * 0.15;
    
    return Math.min(1, magnitude);
  }

  // =========================================================================
  // Tournament Influence Analysis
  // =========================================================================

  private analyzeTournamentInfluence(
    tournaments: TournamentMetaInfluence[]
  ): {
    influenceStrength: number;
    innovativeStrategies: string[];
    surprisingPicks: string[];
    dominantPlaystyles: string[];
  } {
    if (tournaments.length === 0) {
      return {
        influenceStrength: 0.3,
        innovativeStrategies: [],
        surprisingPicks: [],
        dominantPlaystyles: [],
      };
    }

    const avgInfluence = tournaments.reduce((sum, t) => sum + t.influenceStrength, 0) / tournaments.length;
    
    const innovativeStrategies = new Set<string>();
    const surprisingPicks = new Set<string>();
    const dominantPlaystyles = new Set<string>();

    for (const t of tournaments) {
      t.metaInnovations.forEach(s => innovativeStrategies.add(s));
      t.surprisingUpsets.forEach(p => surprisingPicks.add(p));
      t.winnerStrategies.forEach(s => dominantPlaystyles.add(s));
    }

    return {
      influenceStrength: avgInfluence,
      innovativeStrategies: Array.from(innovativeStrategies),
      surprisingPicks: Array.from(surprisingPicks),
      dominantPlaystyles: Array.from(dominantPlaystyles),
    };
  }

  // =========================================================================
  // Strategy Predictions
  // =========================================================================

  private predictStrategyShifts(
    currentMeta: any,
    patchAnalysis: any,
    tournamentInfluence: any
  ): {
    willDominate: string[];
    willDecline: string[];
    willEmerge: string[];
    willRemainStable: string[];
  } {
    const willDominate: string[] = [];
    const willDecline: string[] = [];
    const willEmerge: string[] = [];
    const willRemainStable: string[] = [];

    const currentStrategies = currentMeta?.dominantStrategies || [];
    
    // Get buffed/nerfed agents from maps
    const patchBuffs: string[] = [];
    patchAnalysis.buffImpact.forEach((impact: number, agent: string) => {
      if (impact > 0.1) patchBuffs.push(agent);
    });
    
    const patchNerfs: string[] = [];
    patchAnalysis.nerfImpact.forEach((impact: number, agent: string) => {
      if (impact < -0.1) patchNerfs.push(agent);
    });

    // Strategies that will dominate
    for (const strategy of currentStrategies) {
      const isNerfed = patchNerfs.some(n => strategy.toLowerCase().includes(n.toLowerCase()));
      if (!isNerfed) {
        willDominate.push(strategy);
      } else {
        willRemainStable.push(strategy);
      }
    }

    // Strategies boosted by patches
    for (const agent of patchBuffs) {
      willDominate.push(`${agent}-centric strategy`);
    }

    // Strategies that will decline
    for (const strategy of currentStrategies) {
      const isNerfed = patchNerfs.some(n => strategy.toLowerCase().includes(n.toLowerCase()));
      if (isNerfed) {
        willDecline.push(strategy);
      }
    }

    // Emerging strategies from tournaments
    for (const innovation of tournamentInfluence.innovativeStrategies || []) {
      if (!willDominate.includes(innovation) && !willDecline.includes(innovation)) {
        willEmerge.push(innovation);
      }
    }

    // Strategies that remain stable
    for (const strategy of currentStrategies) {
      const inDominate = willDominate.includes(strategy);
      const inDecline = willDecline.includes(strategy);
      if (!inDominate && !inDecline) {
        willRemainStable.push(strategy);
      }
    }

    return {
      willDominate: willDominate.slice(0, 5),
      willDecline: willDecline.slice(0, 5),
      willEmerge: willEmerge.slice(0, 3),
      willRemainStable: willRemainStable.slice(0, 3),
    };
  }

  private predictPickRateChanges(
    currentMeta: any,
    patchAnalysis: any,
    tournamentInfluence: any
  ): {
    willBePopular: string[];
    willHaveHighWinRate: string[];
    willDecline: string[];
    willEmerge: string[];
  } {
    const willBePopular: string[] = [];
    const willHaveHighWinRate: string[] = [];
    const willDecline: string[] = [];
    const willEmerge: string[] = [];

    const currentPicks = currentMeta?.pickRateChanges?.map((p: any) => p.agent) || [];
    
    // Get buffed/nerfed agents from maps
    const patchBuffs: string[] = [];
    patchAnalysis.buffImpact.forEach((impact: number, agent: string) => {
      if (impact > 0.05) patchBuffs.push(agent);
    });
    
    const patchNerfs: string[] = [];
    patchAnalysis.nerfImpact.forEach((impact: number, agent: string) => {
      if (impact < -0.05) patchNerfs.push(agent);
    });

    // Picks that will remain popular
    for (const pick of currentPicks) {
      const isNerfed = patchNerfs.some(n => pick.toLowerCase().includes(n.toLowerCase()));
      if (!isNerfed) {
        willBePopular.push(pick);
      }
    }

    // Buffed picks will become popular
    willBePopular.push(...patchBuffs);

    // Tournament winners have high win rates
    for (const pick of tournamentInfluence.surprisingPicks || []) {
      if (!willHaveHighWinRate.includes(pick)) {
        willHaveHighWinRate.push(pick);
      }
    }

    // Nerfed picks will decline
    willDecline.push(...patchNerfs);

    // Emerging picks from tournaments
    for (const pick of tournamentInfluence.surprisingPicks || []) {
      const isPopular = willBePopular.includes(pick);
      const isDeclining = willDecline.includes(pick);
      if (!isPopular && !isDeclining) {
        willEmerge.push(pick);
      }
    }

    return {
      willBePopular: willBePopular.slice(0, 10),
      willHaveHighWinRate: willHaveHighWinRate.slice(0, 5),
      willDecline: willDecline.slice(0, 5),
      willEmerge: willEmerge.slice(0, 5),
    };
  }

  // =========================================================================
  // Meta Health Calculations
  // =========================================================================

  private calculateMetaHealth(
    strategies: { willDominate: string[]; willDecline: string[]; willEmerge: string[] },
    picks: { willBePopular: string[]; willHaveHighWinRate: string[]; willDecline: string[]; willEmerge: string[] }
  ): { diversity: number; balance: number } {
    const uniqueEntities = new Set([
      ...strategies.willDominate,
      ...strategies.willEmerge,
      ...picks.willBePopular,
      ...picks.willEmerge,
    ]).size;

    const diversity = Math.min(1, uniqueEntities / 15);
    const balance = 0.7;

    return { diversity, balance };
  }

  private determineMetaTrend(
    strategies: { willDominate: string[]; willDecline: string[]; willEmerge: string[] },
    tournamentInfluence: any
  ): 'rising' | 'stable' | 'declining' | 'volatile' {
    const shiftCount = strategies.willDecline.length + strategies.willEmerge.length;
    const innovationCount = tournamentInfluence.innovativeStrategies?.length || 0;

    if (shiftCount > 5 && innovationCount > 2) {
      return 'volatile';
    } else if (shiftCount > 3) {
      return 'rising';
    } else if (shiftCount === 0 && innovationCount === 0) {
      return 'stable';
    } else {
      return 'declining';
    }
  }

  // =========================================================================
  // Matchup Meta Prediction
  // =========================================================================

  private getHistoricalMetaPerformance(
    gameTitle: GameTitle,
    teamA: string,
    teamB: string
  ): any {
    return {
      headToHeadWins: { teamA: 0, teamB: 0 },
      commonStrategies: [],
      winRateInCurrentMeta: { teamA: 0.5, teamB: 0.5 },
    };
  }

  private predictMatchupMetaFactors(
    gameTitle: GameTitle,
    patchVersion: string,
    historical: any
  ): string[] {
    return [
      `Patch ${patchVersion} impact`,
      'Meta diversity advantage',
      'Team adaptation speed',
    ];
  }

  private determineFavorableStrategies(
    metaFactors: string[],
    historical: any
  ): string[] {
    return ['Aggressive opening', 'Utility usage', 'Team coordination'];
  }

  private determineCounterStrategies(
    metaFactors: string[],
    historical: any
  ): string[] {
    return ['Slow default', 'Flash aggression', 'Mid-control focus'];
  }

  private calculateMatchupMetaConfidence(historical: any): number {
    return 0.7;
  }

  // =========================================================================
  // Confidence & Indicators
  // =========================================================================

  private calculatePredictionConfidence(
    patchAnalysis: any,
    tournamentInfluence: any,
    historicalPatterns: any[]
  ): number {
    let confidence = 0.5;

    confidence += patchAnalysis.overallImpact * 0.15;
    confidence += tournamentInfluence.influenceStrength * 0.15;

    if (historicalPatterns.length > 5) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  private calculateConfidenceDecay(confidence: number): number {
    return 0.02;
  }

  private generateMetaShiftIndicators(
    patchAnalysis: any,
    tournamentInfluence: any
  ): MetaShiftIndicator[] {
    const indicators: MetaShiftIndicator[] = [];

    // Add buff indicators
    patchAnalysis.buffImpact.forEach((impact: number, agent: string) => {
      if (impact > 0.1) {
        indicators.push({
          type: 'buff',
          affectedEntity: agent,
          magnitude: impact,
          expectedImpact: impact,
          predictedTimeToImpact: 3,
        });
      }
    });

    // Add nerf indicators
    patchAnalysis.nerfImpact.forEach((impact: number, agent: string) => {
      if (impact < -0.1) {
        indicators.push({
          type: 'nerf',
          affectedEntity: agent,
          magnitude: Math.abs(impact),
          expectedImpact: Math.abs(impact),
          predictedTimeToImpact: 2,
        });
      }
    });

    // Add tournament influence indicators
    for (const strategy of tournamentInfluence.innovativeStrategies || []) {
      indicators.push({
        type: 'tournament_influence',
        affectedEntity: strategy,
        magnitude: tournamentInfluence.influenceStrength,
        expectedImpact: tournamentInfluence.influenceStrength * 0.8,
        predictedTimeToImpact: 7,
      });
    }

    return indicators;
  }

  // =========================================================================
  // History Management
  // =========================================================================

  private storeMetaTrend(gameTitle: GameTitle, trend: MetaTrend): void {
    const history = this.metaHistory.get(gameTitle) || [];
    history.push(trend);
    
    if (history.length > 100) {
      history.shift();
    }
    
    this.metaHistory.set(gameTitle, history);
  }

  getMetaHistory(gameTitle: GameTitle, days: number = 30): MetaTrend[] {
    const history = this.metaHistory.get(gameTitle) || [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    
    return history.filter(t => new Date(t.timestamp).getTime() > cutoff);
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  async analyzePatchNotes(patchNotes: string): Promise<PatchAnalysis> {
    return this.generatePatchAnalysis('1.0', {
      buffs: [],
      nerfs: [],
      mapChanges: [],
      mechanicChanges: [],
    });
  }

  clearHistory(): void {
    this.metaHistory.clear();
    this.patchAnalyses.clear();
  }
}

export const metaEvolutionEngine = new MetaEvolutionEngine();

