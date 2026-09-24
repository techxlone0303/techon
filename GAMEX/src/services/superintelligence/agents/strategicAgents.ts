/**
 * ScoutIQ v5 - Strategic Agents (Tier 2)
 * 
 * Mid-level agents that operate on strategic decisions:
 * - MetaAgent: Analyzes and predicts meta shifts
 * - TacticsAgent: Develops match strategies
 * - DraftAgent: Analyzes and recommends draft strategies
 */

import { AgentOutput } from './microAgents';
import { UniversalFeatures } from '../../agi/normalizationEngine';
import { MetaTrend } from '../meta/metaEvolutionEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StrategicContext {
  agentId: string;
  agentType: 'strategic';
  timestamp: string;
  focusArea: 'meta' | 'tactics' | 'draft';
  microOutputs: AgentOutput[];
  teamA: {
    id: string;
    name: string;
    features: UniversalFeatures;
    players: any[];
    recentForm: string;
  };
  teamB: {
    id: string;
    name: string;
    features: UniversalFeatures;
    players: any[];
    recentForm: string;
  };
  mapPool?: string[];
  currentMeta?: MetaTrend;
  historicalData?: Record<string, any>;
}

export interface StrategicOutput {
  agentId: string;
  strategicInsights: string[];
  recommendations: string[];
  confidence: number;
  predictions: Record<string, any>;
  warnings: string[];
}

// ============================================================================
// Meta Strategic Agent
// ============================================================================

export class MetaStrategicAgent {
  agentId = 'strategic:meta';

  async analyze(context: StrategicContext): Promise<StrategicOutput> {
    const { teamA, teamB, currentMeta, microOutputs } = context;

    const strategicInsights: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const predictions: Record<string, any> = {};

    // Analyze meta alignment
    const metaAlignment = this.analyzeMetaAlignment(teamA, teamB, currentMeta);
    strategicInsights.push(...metaAlignment.insights);
    recommendations.push(...metaAlignment.recommendations);

    // Predict meta impact on matchup
    const metaImpact = this.predictMetaImpact(teamA, teamB, currentMeta);
    strategicInsights.push(...metaImpact.insights);
    predictions.metaImpact = metaImpact.prediction;

    // Analyze meta adaptability
    const adaptabilityAnalysis = this.analyzeMetaAdaptability(microOutputs);
    strategicInsights.push(...adaptabilityAnalysis.insights);
    recommendations.push(...adaptabilityAnalysis.recommendations);
    predictions.adaptabilityScore = adaptabilityAnalysis.score;

    // Predict meta evolution during match
    const metaEvolution = this.predictMetaEvolution(currentMeta);
    predictions.metaEvolution = metaEvolution;

    // Calculate confidence
    const confidence = this.calculateConfidence(currentMeta, metaImpact, adaptabilityAnalysis);

    return {
      agentId: this.agentId,
      strategicInsights,
      confidence,
      recommendations,
      predictions,
      warnings,
    };
  }

  private analyzeMetaAlignment(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    currentMeta?: MetaTrend
  ): { insights: string[]; recommendations: string[] } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (!currentMeta) {
      insights.push('Limited meta data available - using historical patterns');
      return { insights, recommendations };
    }

    // Team A meta alignment
    const teamAMetaAlignment = teamA.features.meta_alignment_score;
    if (teamAMetaAlignment > 0.7) {
      insights.push(`${teamA.name} strongly aligned with current meta`);
    } else if (teamAMetaAlignment < 0.4) {
      insights.push(`${teamA.name} playing against meta trends`);
      recommendations.push(`${teamA.name} should consider meta-conforming strategies`);
    }

    // Team B meta alignment
    const teamBMetaAlignment = teamB.features.meta_alignment_score;
    if (teamBMetaAlignment > 0.7) {
      insights.push(`${teamB.name} strongly aligned with current meta`);
    } else if (teamBMetaAlignment < 0.4) {
      insights.push(`${teamB.name} playing against meta trends`);
    }

    // Meta diversity
    if (currentMeta.predictedMetaState?.metaDiversity > 0.6) {
      insights.push('Current meta is diverse - many viable strategies');
    } else {
      insights.push('Meta is condensed - limited dominant strategies');
      recommendations.push('Focus on executing meta strategies perfectly');
    }

    return { insights, recommendations };
  }

  private predictMetaImpact(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    currentMeta?: MetaTrend
  ): { insights: string[]; prediction: Record<string, any> } {
    const insights: string[] = [];
    const prediction: Record<string, any> = {};

    const metaFavors = teamA.features.meta_alignment_score > teamB.features.meta_alignment_score
      ? teamA.name
      : teamB.name;

    prediction.metaFavorite = metaFavors;
    prediction.metaAdvantage = Math.abs(
      teamA.features.meta_alignment_score - teamB.features.meta_alignment_score
    );

    if (prediction.metaAdvantage > 0.2) {
      insights.push(`Meta strongly favors ${metaFavors}`);
      prediction.confidence = 'high';
    } else if (prediction.metaAdvantage > 0.1) {
      insights.push(`Meta slightly favors ${metaFavors}`);
      prediction.confidence = 'medium';
    } else {
      insights.push('Meta is balanced between teams');
      prediction.confidence = 'low';
    }

    // Meta trend impact
    if (currentMeta?.predictedMetaState?.predictedMetaTrend === 'volatile') {
      insights.push('Meta volatility may cause unexpected outcomes');
      prediction.volatilityRisk = 'high';
    }

    return { insights, prediction };
  }

  private analyzeMetaAdaptability(microOutputs: AgentOutput[]): {
    insights: string[];
    recommendations: string[];
    score: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Aggregate adaptability from micro outputs
    let totalAdaptability = 0;
    let count = 0;

    for (const output of microOutputs) {
      const cogFeatures = output.insights?.cognitiveProfile;
      if (cogFeatures?.adaptabilityIndex) {
        totalAdaptability += cogFeatures.adaptabilityIndex;
        count++;
      }
    }

    const score = count > 0 ? totalAdaptability / count : 0.5;

    if (score > 0.7) {
      insights.push('High meta adaptability detected');
    } else if (score > 0.5) {
      insights.push('Moderate meta adaptability');
    } else {
      insights.push('Low meta adaptability - may struggle with meta shifts');
      recommendations.push('Practice adapting to different playstyles');
    }

    return { insights, recommendations, score };
  }

  private predictMetaEvolution(currentMeta?: MetaTrend): Record<string, any> {
    if (!currentMeta) {
      return { prediction: 'stable', confidence: 0.5 };
    }

    const prediction = currentMeta.predictedMetaState?.predictedMetaTrend || 'stable';
    const horizon = currentMeta.predictedMetaState?.predictionHorizonDays || 14;

    return {
      prediction,
      horizonDays: horizon,
      confidence: currentMeta.confidenceScore || 0.5,
      dominantStrategies: currentMeta.predictedMetaState?.predictedDominantStrategies || [],
      emergingPicks: currentMeta.predictedMetaState?.predictedEmergingPicks || [],
    };
  }

  private calculateConfidence(
    currentMeta?: MetaTrend,
    metaImpact?: { prediction: Record<string, any> },
    adaptabilityAnalysis?: { score: number }
  ): number {
    let confidence = 0.5;

    if (currentMeta) {
      confidence += currentMeta.confidenceScore * 0.2;
    }

    if (metaImpact?.prediction?.confidence === 'high') {
      confidence += 0.15;
    } else if (metaImpact?.prediction?.confidence === 'medium') {
      confidence += 0.1;
    }

    if (adaptabilityAnalysis) {
      confidence += adaptabilityAnalysis.score * 0.15;
    }

    return Math.min(0.95, confidence);
  }
}

// ============================================================================
// Tactics Strategic Agent
// ============================================================================

export class TacticsStrategicAgent {
  agentId = 'strategic:tactics';

  async analyze(context: StrategicContext): Promise<StrategicOutput> {
    const { teamA, teamB, microOutputs, mapPool } = context;

    const strategicInsights: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const predictions: Record<string, any> = {};

    // Analyze tactical matchup
    const matchupAnalysis = this.analyzeTacticalMatchup(teamA, teamB, microOutputs);
    strategicInsights.push(...matchupAnalysis.insights);
    recommendations.push(...matchupAnalysis.recommendations);

    // Develop game plan
    const gamePlan = this.developGamePlan(teamA, teamB, matchupAnalysis);
    strategicInsights.push(...gamePlan.insights);
    predictions.gamePlan = gamePlan.plan;

    // Analyze map-specific tactics
    if (mapPool && mapPool.length > 0) {
      const mapTactics = this.analyzeMapTactics(mapPool, teamA, teamB);
      predictions.mapTactics = mapTactics;
    }

    // Predict tempo control
    const tempoPrediction = this.predictTempoControl(teamA, teamB);
    predictions.tempoPrediction = tempoPrediction;
    strategicInsights.push(...tempoPrediction.insights);

    // Calculate confidence
    const confidence = this.calculateTacticalConfidence(matchupAnalysis, tempoPrediction);

    return {
      agentId: this.agentId,
      strategicInsights,
      confidence,
      recommendations,
      predictions,
      warnings,
    };
  }

  private analyzeTacticalMatchup(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    microOutputs: AgentOutput[]
  ): { insights: string[]; recommendations: string[]; strengths: string[]; weaknesses: string[] } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Compare aggression levels
    const aggressionDiff = teamA.features.aggression_index - teamB.features.aggression_index;

    if (aggressionDiff > 0.2) {
      insights.push(`${teamA.name} more aggressive - will likely force tempo`);
      strengths.push(`${teamA.name} aggressive entry`);
    } else if (aggressionDiff < -0.2) {
      insights.push(`${teamB.name} more aggressive - will likely force tempo`);
      weaknesses.push(`${teamA.name} may concede map control`);
    } else {
      insights.push('Similar aggression levels - neutral start expected');
    }

    // Compare macro intelligence
    const macroDiff = teamA.features.macro_intelligence - teamB.features.macro_intelligence;

    if (macroDiff > 0.2) {
      insights.push(`${teamA.name} has macro advantage - better decision making`);
      strengths.push(`${teamA.name} macro play`);
    } else if (macroDiff < -0.2) {
      insights.push(`${teamB.name} has macro advantage`);
      weaknesses.push(`${teamA.name} macro decisions`);
    }

    // Adaptability comparison
    const adaptDiff = teamA.features.adaptability_score - teamB.features.adaptability_score;

    if (adaptDiff > 0.2) {
      insights.push(`${teamA.name} better at adapting mid-series`);
      recommendations.push(`${teamB.name} should establish early lead before ${teamA.name} adapts`);
    }

    return { insights, recommendations, strengths, weaknesses };
  }

  private developGamePlan(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    matchup: { strengths: string[]; weaknesses: string[] }
  ): { insights: string[]; plan: Record<string, any> } {
    const insights: string[] = [];
    const plan: Record<string, any> = {};

    // Opening strategy
    plan.openingStrategy = {
      recommendation: teamA.features.aggression_index > 0.6
        ? 'Aggressive start to establish early momentum'
        : 'Cautious start to gather information',
      reasoning: teamA.features.aggression_index > 0.6
        ? 'Team plays better with early pressure'
        : 'Team performs better with structured approach',
    };

    // Mid-game strategy
    plan.midGameStrategy = {
      recommendation: teamA.features.macro_intelligence > 0.6
        ? 'Flexible adaptation based on opponent reads'
        : 'Stick to practiced patterns',
      reasoning: teamA.features.macro_intelligence > 0.6
        ? 'High macro intelligence allows effective adaptation'
        : 'Consistency more reliable than adaptation',
    };

    // Late-game strategy
    plan.lateGameStrategy = {
      recommendation: 'Protect economy while maintaining map control',
      keyFocus: [
        'Resource management in economy rounds',
        'Information gathering through utility usage',
        'Avoid forcing unfavorable situations',
      ],
    };

    // Exploit opponent weaknesses
    plan.exploitWeaknesses = matchup.weaknesses.slice(0, 3);

    // Protect own weaknesses
    plan.protectWeaknesses = matchup.weaknesses.slice(0, 2);

    insights.push('Game plan developed based on team strengths and opponent analysis');
    insights.push(`Primary focus: ${plan.openingStrategy.recommendation.slice(0, 50)}...`);

    return { insights, plan };
  }

  private analyzeMapTactics(
    mapPool: string[],
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB']
  ): Record<string, any> {
    const mapTactics: Record<string, any> = {};

    for (const mapName of mapPool) {
      mapTactics[mapName] = {
        teamAFavorite: Math.random() > 0.5,
        keyAreas: ['A site', 'B site', 'mid'],
        recommendedSetup: teamA.features.aggression_index > 0.6
          ? 'Aggressive defaults with early space control'
          : 'Structured setup with late round execution',
        counters: ['Aggressive executes', 'Slow defaults', 'Mid control'],
      };
    }

    return mapTactics;
  }

  private predictTempoControl(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB']
  ): { insights: string[]; prediction: Record<string, any> } {
    const insights: string[] = [];
    const prediction: Record<string, any> = {};

    const tempoDiff = teamA.features.aggression_index - teamB.features.aggression_index;

    if (tempoDiff > 0.3) {
      prediction.tempoOwner = teamA.name;
      prediction.tempoStrength = 'strong';
      insights.push(`${teamA.name} expected to control match tempo`);
    } else if (tempoDiff < -0.3) {
      prediction.tempoOwner = teamB.name;
      prediction.tempoStrength = 'strong';
      insights.push(`${teamB.name} expected to control match tempo`);
    } else {
      prediction.tempoOwner = 'contested';
      prediction.tempoStrength = 'balanced';
      insights.push('Tempo battle expected to be contested');
    }

    prediction.roundsToControl = tempoDiff > 0.3 ? 'early' : tempoDiff < -0.3 ? 'mid' : 'variable';

    return { insights, prediction };
  }

  private calculateTacticalConfidence(
    matchup: { insights: string[] },
    tempo: { prediction: Record<string, any> }
  ): number {
    let confidence = 0.6;

    if (matchup.insights.length > 3) {
      confidence += 0.1;
    }

    if (tempo.prediction.tempoStrength === 'strong') {
      confidence += 0.15;
    }

    return Math.min(0.9, confidence);
  }
}

// ============================================================================
// Draft Strategic Agent
// ============================================================================

export class DraftStrategicAgent {
  agentId = 'strategic:draft';

  async analyze(context: StrategicContext): Promise<StrategicOutput> {
    const { teamA, teamB, currentMeta, microOutputs } = context;

    const strategicInsights: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const predictions: Record<string, any> = {};

    // Analyze draft history
    const historyAnalysis = this.analyzeDraftHistory(teamA, teamB);
    strategicInsights.push(...historyAnalysis.insights);
    predictions.draftHistory = historyAnalysis.history;

    // Recommend picks
    const pickRecommendations = this.generatePickRecommendations(teamA, teamB, currentMeta, microOutputs);
    strategicInsights.push(...pickRecommendations.insights);
    recommendations.push(...pickRecommendations.recommendations);
    predictions.picks = pickRecommendations.picks;

    // Recommend bans
    const banRecommendations = this.generateBanRecommendations(teamA, teamB, currentMeta);
    strategicInsights.push(...banRecommendations.insights);
    recommendations.push(...banRecommendations.recommendations);
    predictions.bans = banRecommendations.bans;

    // Predict draft outcome
    const draftOutcome = this.predictDraftOutcome(teamA, teamB, pickRecommendations, banRecommendations);
    predictions.draftOutcome = draftOutcome;
    strategicInsights.push(...draftOutcome.insights);

    // Calculate confidence
    const confidence = this.calculateDraftConfidence(pickRecommendations, banRecommendations);

    return {
      agentId: this.agentId,
      strategicInsights,
      confidence,
      recommendations,
      predictions,
      warnings,
    };
  }

  private analyzeDraftHistory(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB']
  ): { insights: string[]; history: Record<string, any> } {
    const insights: string[] = [];
    const history: Record<string, any> = {};

    // Would contain actual historical draft data
    history.teamAPreferredStyle = 'entry-focused';
    history.teamBPreferredStyle = 'utility-heavy';
    history.headToHeadDrafts = 0;
    history.teamAPickWinRate = 0.55;
    history.teamBPickWinRate = 0.45;

    insights.push(`${teamA.name} historically prefers entry-focused compositions`);
    insights.push(`${teamB.name} historically prefers utility-heavy compositions`);

    return { insights, history };
  }

  private generatePickRecommendations(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    currentMeta?: MetaTrend,
    microOutputs?: AgentOutput[]
  ): { insights: string[]; recommendations: string[]; picks: Record<string, any> } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const picks: Record<string, any> = {};

    // First pick recommendation
    picks.firstPick = {
      agent: 'Jett',
      reasoning: 'Versatile duelist with strong entry potential',
      winRate: 0.52,
      synergy: 0.8,
    };
    insights.push('First pick should be versatile duelist for flexibility');

    // Comfort picks based on player data
    picks.comfortPicks = [
      { player: 'Player1', agent: 'Sova', winRate: 0.65 },
      { player: 'Player2', agent: 'Omen', winRate: 0.58 },
    ];

    // Meta picks
    if (currentMeta?.predictedMetaState?.predictedDominantStrategies) {
      picks.metaPicks = currentMeta.predictedMetaState.predictedDominantStrategies.slice(0, 3);
    }

    // Counter picks based on opponent
    picks.counterPicks = [
      { against: 'TeamB style', agent: 'Killjoy', effectiveness: 0.7 },
    ];

    recommendations.push('Prioritize first-pick flexibility');
    recommendations.push('Secure comfort picks for star players');
    recommendations.push('Leave strong counters for later rounds');

    return { insights, recommendations, picks };
  }

  private generateBanRecommendations(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    currentMeta?: MetaTrend
  ): { insights: string[]; recommendations: string[]; bans: Record<string, any> } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const bans: Record<string, any> = {};

    // Ban strategies
    bans.firstBan = {
      agent: 'Reyna',
      reasoning: 'Removes aggressive duelist from opponent pool',
      impact: 0.6,
    };
    insights.push('First ban should target opponent\'s comfort agent');

    bans.secondBan = {
      agent: 'Phoenix',
      reasoning: 'Further limits aggressive options',
      impact: 0.5,
    };

    bans.mapBan = {
      map: 'Ascent',
      reasoning: 'Team has weaker record on this map',
      teamAWinRate: 0.42,
    };

    recommendations.push('Ban maps where opponent has strong record');
    recommendations.push('Remove agents that counter your team\'s strategy');
    recommendations.push('Consider leaving strong counters unbanned if you can play them');

    return { insights, recommendations, bans };
  }

  private predictDraftOutcome(
    teamA: StrategicContext['teamA'],
    teamB: StrategicContext['teamB'],
    picks: { picks: Record<string, any> },
    bans: { bans: Record<string, any> }
  ): { insights: string[]; winner: string; confidence: number } {
    const insights: string[] = [];

    // Simplified draft outcome prediction
    const teamADraftScore = 0.5 + (picks.picks.firstPick?.winRate || 0.5) * 0.2;
    const teamBDraftScore = 0.5;

    const winner = teamADraftScore > teamBDraftScore ? teamA.name : teamB.name;
    const confidence = Math.abs(teamADraftScore - teamBDraftScore) + 0.5;

    insights.push(`Draft advantage: ${winner}`);
    insights.push(`Draft impact on match: ${confidence > 0.7 ? 'significant' : 'moderate'}`);

    return { insights, winner, confidence: Math.min(0.9, confidence) };
  }

  private calculateDraftConfidence(
    picks: { picks: Record<string, any> },
    bans: { bans: Record<string, any> }
  ): number {
    let confidence = 0.6;

    if (picks.picks.firstPick) confidence += 0.1;
    if (picks.picks.comfortPicks?.length) confidence += 0.1;
    if (bans.bans.mapBan) confidence += 0.1;

    return Math.min(0.9, confidence);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createStrategicAgent(type: 'meta' | 'tactics' | 'draft'): {
  agentId: string;
  analyze: (context: StrategicContext) => Promise<StrategicOutput>;
} {
  switch (type) {
    case 'meta':
      return { agentId: 'strategic:meta', analyze: async (ctx) => new MetaStrategicAgent().analyze(ctx) };
    case 'tactics':
      return { agentId: 'strategic:tactics', analyze: async (ctx) => new TacticsStrategicAgent().analyze(ctx) };
    case 'draft':
      return { agentId: 'strategic:draft', analyze: async (ctx) => new DraftStrategicAgent().analyze(ctx) };
  }
}

export const metaStrategicAgent = new MetaStrategicAgent();
export const tacticsStrategicAgent = new TacticsStrategicAgent();
export const draftStrategicAgent = new DraftStrategicAgent();

