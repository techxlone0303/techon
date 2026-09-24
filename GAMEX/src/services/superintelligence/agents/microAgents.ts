/**
 * ScoutIQ v5 - Micro Agents (Tier 1)
 * 
 * Base-level agents that analyze individual entities:
 * - PlayerAgent: Individual player performance analysis
 * - TeamAgent: Team-level analysis
 * - MapAgent: Map-specific analysis
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';
import { CognitiveFeatures } from '../cognition/cognitiveFeatures';

// ============================================================================
// Base Agent Interface
// ============================================================================

export interface AgentContext {
  agentId: string;
  agentType: 'micro';
  timestamp: string;
  focusEntity: string;
  entityType: 'player' | 'team' | 'map' | 'role';
  data: Record<string, any>;
}

export interface AgentOutput {
  agentId: string;
  findings: string[];
  confidence: number;
  recommendations: string[];
  insights: Record<string, any>;
  warnings: string[];
}

// ============================================================================
// Player Micro Agent
// ============================================================================

export interface PlayerAgentContext extends AgentContext {
  focusEntity: string;
  entityType: 'player';
  data: {
    playerId: string;
    universalFeatures: UniversalFeatures;
    cognitiveFeatures: CognitiveFeatures;
    recentMatches: Array<{ result: string; score: string }>;
    role: string;
    experienceLevel: number;
  };
}

export class PlayerMicroAgent {
  agentId = 'micro:player';

  async analyze(context: PlayerAgentContext): Promise<AgentOutput> {
    const { universalFeatures, cognitiveFeatures, recentMatches, role } = context.data;

    const findings: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const insights: Record<string, any> = {};

    // Analyze skill profile
    const skillAnalysis = this.analyzeSkillProfile(universalFeatures);
    findings.push(...skillAnalysis.findings);
    recommendations.push(...skillAnalysis.recommendations);

    // Analyze cognitive features
    const cognitiveAnalysis = this.analyzeCognitiveProfile(cognitiveFeatures);
    findings.push(...cognitiveAnalysis.findings);
    recommendations.push(...cognitiveAnalysis.recommendations);

    // Analyze recent form
    const formAnalysis = this.analyzeRecentForm(recentMatches);
    findings.push(...formAnalysis.findings);
    warnings.push(...formAnalysis.warnings);

    // Role-specific analysis
    const roleAnalysis = this.analyzeRoleFit(role, universalFeatures, cognitiveFeatures);
    findings.push(...roleAnalysis.findings);

    // Compile insights
    insights.skillProfile = {
      overall: universalFeatures.skill_index,
      strengths: skillAnalysis.strengths,
      weaknesses: skillAnalysis.weaknesses,
    };

    insights.cognitiveProfile = {
      clutchProbability: cognitiveFeatures.clutchProbability,
      adaptabilityIndex: cognitiveFeatures.adaptabilityIndex,
      pressureResilience: cognitiveFeatures.pressureResilience,
      gameSenseIndex: cognitiveFeatures.gameSenseIndex,
    };

    insights.formAnalysis = {
      recentTrend: formAnalysis.trend,
      consistency: formAnalysis.consistency,
      momentum: formAnalysis.momentum,
    };

    // Calculate overall confidence
    const dataQuality = Math.min(1, recentMatches.length / 10);
    const confidence = 0.5 + (dataQuality * 0.3) + (cognitiveFeatures.featureConfidence * 0.2);

    return {
      agentId: this.agentId,
      findings,
      confidence: Math.min(0.95, confidence),
      recommendations,
      insights,
      warnings,
    };
  }

  private analyzeSkillProfile(features: UniversalFeatures): {
    findings: string[];
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
  } {
    const findings: string[] = [];
    const recommendations: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (features.skill_index > 0.7) {
      findings.push('Exceptional individual skill level');
      strengths.push('High skill ceiling');
    } else if (features.skill_index < 0.4) {
      findings.push('Skill index below average');
      recommendations.push('Focus on aim training and mechanical skills');
      weaknesses.push('Individual skill');
    }

    if (features.aggression_index > 0.7) {
      findings.push('Highly aggressive playstyle');
      strengths.push('Aggressive entry');
    } else if (features.aggression_index < 0.3) {
      findings.push('Passive playstyle detected');
      recommendations.push('Work on aggressive plays and space creation');
      weaknesses.push('Aggression');
    }

    if (features.macro_intelligence > 0.7) {
      findings.push('Excellent macro awareness and decision making');
      strengths.push('Game sense');
    } else if (features.macro_intelligence < 0.4) {
      findings.push('Macro intelligence needs improvement');
      recommendations.push('Study professional gameplay and rotation patterns');
      weaknesses.push('Macro play');
    }

    if (features.adaptability_score > 0.7) {
      findings.push('High adaptability to different situations');
      strengths.push('Versatility');
    }

    if (features.meta_alignment_score < 0.4) {
      findings.push('Below meta performance');
      recommendations.push('Study current meta strategies and popular picks');
    }

    return { findings, recommendations, strengths, weaknesses };
  }

  private analyzeCognitiveProfile(cognitive: CognitiveFeatures): {
    findings: string[];
    recommendations: string[];
  } {
    const findings: string[] = [];
    const recommendations: string[] = [];

    if (cognitive.clutchProbability > 0.7) {
      findings.push('Excellent clutch performer under pressure');
    } else if (cognitive.clutchProbability < 0.4) {
      findings.push('Struggles in clutch situations');
      recommendations.push('Practice 1vX scenarios and mental preparation');
    }

    if (cognitive.adaptabilityIndex > 0.7) {
      findings.push('Quick adapter to opponent strategies');
    }

    if (cognitive.psychologicalMomentum > 0.7) {
      findings.push('Strong momentum player - feeds off streaks');
    } else if (cognitive.psychologicalMomentum < 0.4) {
      findings.push('Momentum-dependent performer');
      recommendations.push('Work on consistency and mental resilience');
    }

    if (cognitive.antiMetaScore > 0.7) {
      findings.push('Strong anti-meta performer - excels against popular strategies');
    }

    if (cognitive.learningVelocity > 0.7) {
      findings.push('High learning velocity - rapid improvement');
    }

    return { findings, recommendations };
  }

  private analyzeRecentForm(matches: Array<{ result: string; score: string }>): {
    findings: string[];
    warnings: string[];
    trend: string;
    consistency: number;
    momentum: number;
  } {
    const findings: string[] = [];
    const warnings: string[] = [];

    if (matches.length === 0) {
      return {
        findings: ['No recent match data available'],
        warnings: [],
        trend: 'unknown',
        consistency: 0.5,
        momentum: 0.5,
      };
    }

    const recentMatches = matches.slice(-5);
    let wins = 0;
    for (const m of recentMatches) {
      if (m.result === 'win') wins++;
    }
    const winRate = wins / recentMatches.length;

    let trend: string;
    if (winRate > 0.7) {
      trend = 'rising';
      findings.push('Strong recent form - 70%+ win rate in last 5 matches');
    } else if (winRate > 0.5) {
      trend = 'stable';
      findings.push('Consistent recent form - positive win rate');
    } else if (winRate > 0.3) {
      trend = 'declining';
      warnings.push('Recent form declining - below 50% win rate');
      findings.push('Recent struggles detected');
    } else {
      trend = 'slump';
      warnings.push('Significant form slump - immediate attention needed');
      findings.push('Major performance dip in recent matches');
    }

    // Calculate consistency
    const results: number[] = recentMatches.map(m => m.result === 'win' ? 1 : 0);
    let sum = 0;
    for (const r of results) sum += r;
    const mean = sum / results.length;
    let varianceSum = 0;
    for (const r of results) varianceSum += Math.pow(r - mean, 2);
    const variance = varianceSum / results.length;
    const consistency = 1 - variance;

    return { findings, warnings, trend, consistency, momentum: winRate };
  }

  private analyzeRoleFit(
    role: string,
    features: UniversalFeatures,
    cognitive: CognitiveFeatures
  ): { findings: string[] } {
    const findings: string[] = [];

    const roleRequirements: Record<string, { requiredSkill: keyof UniversalFeatures; cognitiveKey: keyof CognitiveFeatures }> = {
      'DUELIST': { requiredSkill: 'skill_index', cognitiveKey: 'clutchProbability' },
      'CONTROLLER': { requiredSkill: 'macro_intelligence', cognitiveKey: 'gameSenseIndex' },
      'INITIATOR': { requiredSkill: 'macro_intelligence', cognitiveKey: 'decisionQualityScore' },
      'SENTINEL': { requiredSkill: 'adaptability_score', cognitiveKey: 'pressureResilience' },
    };

    const req = roleRequirements[role];
    if (req) {
      const skillLevel = features[req.requiredSkill];
      const cognitiveLevel = cognitive[req.cognitiveKey];
      const roleFit = (skillLevel + cognitiveLevel) / 2;

      if (roleFit > 0.7) {
        findings.push(`Strong role fit for ${role} - skills align well`);
      } else if (roleFit > 0.5) {
        findings.push(`Moderate role fit for ${role} - room for improvement`);
      } else {
        findings.push(`Low role fit for ${role} - consider role adjustment or targeted training`);
      }
    }

    return { findings };
  }
}

// ============================================================================
// Team Micro Agent
// ============================================================================

export interface TeamAgentContext extends AgentContext {
  focusEntity: string;
  entityType: 'team';
  data: {
    teamId: string;
    playerAnalyses: any[];
    teamFeatures: UniversalFeatures;
    synergyScore: number;
    recentForm: Array<{ result: string }>;
    rosterStability: number;
  };
}

export class TeamMicroAgent {
  agentId = 'micro:team';

  async analyze(context: TeamAgentContext): Promise<AgentOutput> {
    const { playerAnalyses, teamFeatures, synergyScore, recentForm, rosterStability } = context.data;

    const findings: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const insights: Record<string, any> = {};

    // Analyze team composition
    const compositionAnalysis = this.analyzeTeamComposition(playerAnalyses);
    findings.push(...compositionAnalysis.findings);
    recommendations.push(...compositionAnalysis.recommendations);

    // Analyze synergy
    const synergyAnalysis = this.analyzeSynergy(synergyScore);
    findings.push(...synergyAnalysis.findings);
    recommendations.push(...synergyAnalysis.recommendations);

    // Analyze recent form
    const formAnalysis = this.analyzeTeamForm(recentForm);
    findings.push(...formAnalysis.findings);
    warnings.push(...formAnalysis.warnings);

    // Analyze roster stability
    const stabilityAnalysis = this.analyzeRosterStability(rosterStability);
    findings.push(...stabilityAnalysis.findings);

    // Compile insights
    insights.teamComposition = {
      playerCount: playerAnalyses.length,
      roleDistribution: compositionAnalysis.roleDistribution,
      skillDistribution: compositionAnalysis.skillDistribution,
    };

    insights.synergy = {
      overall: synergyScore,
      topDuos: synergyAnalysis.topDuos,
      weakestLinks: synergyAnalysis.weakestLinks,
    };

    insights.formAnalysis = {
      recentTrend: formAnalysis.trend,
      winRate: formAnalysis.winRate,
      momentum: formAnalysis.momentum,
    };

    insights.rosterStability = {
      score: rosterStability,
      stabilityLevel: stabilityAnalysis.level,
    };

    const confidence = 0.6 + (synergyScore * 0.2) + (rosterStability * 0.2);

    return {
      agentId: this.agentId,
      findings,
      confidence: Math.min(0.95, confidence),
      recommendations,
      insights,
      warnings,
    };
  }

  private analyzeTeamComposition(playerAnalyses: any[]): {
    findings: string[];
    recommendations: string[];
    roleDistribution: Record<string, number>;
    skillDistribution: { avg: number; min: number; max: number };
  } {
    const findings: string[] = [];
    const recommendations: string[] = [];
    const roleDistribution: Record<string, number> = {};
    const skills: number[] = [];

    for (const analysis of playerAnalyses) {
      const role = analysis.data?.role || 'unknown';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      
      const skill = analysis.insights?.skillProfile?.overall || 0.5;
      skills.push(skill);
    }

    const roleCount = Object.keys(roleDistribution).length;
    if (roleCount < 4) {
      recommendations.push('Consider diversifying role distribution');
    }

    let sum = 0;
    for (const s of skills) sum += s;
    const avgSkill = sum / skills.length;
    const minSkill = Math.min(...skills);
    const maxSkill = Math.max(...skills);
    const skillGap = maxSkill - minSkill;

    if (skillGap > 0.4) {
      findings.push('Significant skill gap between players');
      recommendations.push('Focus on developing lower-skilled players');
    } else if (skillGap < 0.15) {
      findings.push('Balanced skill distribution across roster');
    }

    if (maxSkill > 0.8) {
      findings.push('Strong carry potential with top performer');
    }

    return {
      findings,
      recommendations,
      roleDistribution,
      skillDistribution: { avg: avgSkill, min: minSkill, max: maxSkill },
    };
  }

  private analyzeSynergy(synergyScore: number): {
    findings: string[];
    recommendations: string[];
    topDuos: string[];
    weakestLinks: string[];
  } {
    const findings: string[] = [];
    const recommendations: string[] = [];

    if (synergyScore > 0.7) {
      findings.push('Excellent team synergy');
    } else if (synergyScore > 0.5) {
      findings.push('Average team synergy');
    } else {
      findings.push('Below average team synergy');
      recommendations.push('Focus on team practice and communication drills');
    }

    return { findings, recommendations, topDuos: [], weakestLinks: [] };
  }

  private analyzeTeamForm(recentForm: Array<{ result: string }>): {
    findings: string[];
    warnings: string[];
    trend: string;
    winRate: number;
    momentum: number;
  } {
    const findings: string[] = [];
    const warnings: string[] = [];

    if (recentForm.length === 0) {
      return {
        findings: ['No recent form data'],
        warnings: [],
        trend: 'unknown',
        winRate: 0.5,
        momentum: 0.5,
      };
    }

    let wins = 0;
    for (const m of recentForm) {
      if (m.result === 'win') wins++;
    }
    const winRate = wins / recentForm.length;
    const momentum = winRate;

    let trend: string;
    if (winRate > 0.7) {
      trend = 'rising';
      findings.push('Team in excellent form');
    } else if (winRate > 0.5) {
      trend = 'stable';
      findings.push('Team performing consistently');
    } else if (winRate > 0.3) {
      trend = 'declining';
      warnings.push('Team form declining');
    } else {
      trend = 'crisis';
      warnings.push('Team in critical form slump');
    }

    return { findings, warnings, trend, winRate, momentum };
  }

  private analyzeRosterStability(stability: number): {
    findings: string[];
    level: string;
  } {
    const findings: string[] = [];
    let level: string;
    if (stability > 0.8) {
      level = 'very stable';
      findings.push('Roster has been stable');
    } else if (stability > 0.5) {
      level = 'moderately stable';
    } else {
      level = 'unstable';
    }
    return { findings, level };
  }
}

// ============================================================================
// Map Micro Agent
// ============================================================================

export interface MapAgentContext extends AgentContext {
  focusEntity: string;
  entityType: 'map';
  data: {
    mapName: string;
    teamPerformanceOnMap: { winRate: number } | null;
    opponentPerformanceOnMap: { winRate: number } | null;
    mapCharacteristics: Record<string, number>;
  };
}

export class MapMicroAgent {
  agentId = 'micro:map';

  async analyze(context: MapAgentContext): Promise<AgentOutput> {
    const { mapName, teamPerformanceOnMap, opponentPerformanceOnMap, mapCharacteristics } = context.data;

    const findings: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const insights: Record<string, any> = {};

    // Analyze map characteristics
    for (const [key, value] of Object.entries(mapCharacteristics)) {
      if (value > 0.7) {
        findings.push(`Map heavily favors ${key}`);
      } else if (value > 0.5) {
        findings.push(`Map slightly favors ${key}`);
      }
    }

    // Analyze team performance
    if (teamPerformanceOnMap) {
      if (teamPerformanceOnMap.winRate > 0.6) {
        findings.push('Strong performance on this map');
      } else if (teamPerformanceOnMap.winRate < 0.4) {
        findings.push('Struggles on this map');
        recommendations.push('Additional practice needed on this map');
      }
    } else {
      findings.push('No team performance data on this map');
    }

    // Analyze opponent performance
    if (opponentPerformanceOnMap) {
      if (opponentPerformanceOnMap.winRate > 0.7) {
        warnings.push('Opponent dominates on this map');
      }
    }

    // Compile insights
    insights.mapName = mapName;
    insights.mapCharacteristics = mapCharacteristics;
    insights.teamPerformance = teamPerformanceOnMap;
    insights.opponentPerformance = opponentPerformanceOnMap;

    const mapDataQuality = (teamPerformanceOnMap ? 0.5 : 0) + (opponentPerformanceOnMap ? 0.3 : 0);
    const confidence = 0.5 + mapDataQuality;

    return {
      agentId: this.agentId,
      findings,
      confidence: Math.min(0.9, confidence),
      recommendations,
      insights,
      warnings,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createMicroAgent(type: 'player' | 'team' | 'map'): {
  agentId: string;
  analyze: (context: any) => Promise<AgentOutput>;
} {
  switch (type) {
    case 'player':
      return { agentId: 'micro:player', analyze: async (ctx) => new PlayerMicroAgent().analyze(ctx) };
    case 'team':
      return { agentId: 'micro:team', analyze: async (ctx) => new TeamMicroAgent().analyze(ctx) };
    case 'map':
      return { agentId: 'micro:map', analyze: async (ctx) => new MapMicroAgent().analyze(ctx) };
  }
}

export const playerMicroAgent = new PlayerMicroAgent();
export const teamMicroAgent = new TeamMicroAgent();
export const mapMicroAgent = new MapMicroAgent();

