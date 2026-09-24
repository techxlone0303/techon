import { UniversalFeatures, GameTitle, GameSpecificStats } from '../normalizationEngine';

export interface AgentState {
  agentId: string;
  timestamp: string;
  phase: 'initialization' | 'analysis' | 'reasoning' | 'consensus' | 'finalized';
  context: AgentContext;
  findings: AgentFindings;
  confidence: number;
  messages: AgentMessage[];
}

export interface AgentContext {
  gameTitle: GameTitle;
  matchId?: string;
  teamA: EntityContext;
  teamB: EntityContext;
  metaState?: any;
  historicalData?: any;
}

export interface EntityContext {
  entityId: string;
  entityType: 'player' | 'team';
  name: string;
  universalFeatures?: UniversalFeatures;
  gameSpecificStats?: GameSpecificStats[];
  embeddings?: number[];
  eloRating?: number;
  recentPerformance?: {
    wins: number;
    losses: number;
    winRate: number;
    trend: string;
  };
}

export interface AgentFindings {
  statisticalInsights?: string[];
  tacticalObservations?: string[];
  metaInsights?: string[];
  predictions?: (string | PredictionOutput)[];
  criticisms?: string[];
  recommendations?: string[];
}

export interface AgentMessage {
  fromAgent: string;
  toAgent?: string;
  content: string;
  timestamp: string;
  type: 'question' | 'answer' | 'challenge' | 'agreement' | 'disagreement';
}

export interface PredictionOutput {
  teamA_win_probability: number;
  teamB_win_probability: number;
  predictedScore?: string;
  keyFactors: string[];
  confidence: number;
}

export type AgentType = 'data' | 'tactical' | 'meta' | 'prediction' | 'critic';

export abstract class BaseAgent {
  protected agentId: AgentType;
  protected state: AgentState;

  constructor(agentId: AgentType) {
    this.agentId = agentId;
    this.state = this.createInitialState();
  }

  protected createInitialState(): AgentState {
    return {
      agentId: this.agentId,
      timestamp: new Date().toISOString(),
      phase: 'initialization',
      context: {} as AgentContext,
      findings: {},
      confidence: 0.5,
      messages: [],
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  updateContext(context: Partial<AgentContext>): void {
    this.state.context = { ...this.state.context, ...context };
  }

  addFinding(category: keyof AgentFindings, finding: any): void {
    const categoryArray = (this.state.findings[category] as any[]) || [];
    this.state.findings[category] = [...categoryArray, finding];
  }

  sendMessage(toAgent: AgentType, content: string, type: AgentMessage['type'] = 'question'): void {
    this.state.messages.push({
      fromAgent: this.agentId,
      toAgent,
      content,
      timestamp: new Date().toISOString(),
      type,
    });
  }

  abstract analyze(): Promise<void>;
  abstract reason(): Promise<void>;

  protected log(phase: string, message: string): void {
    console.log(`[${this.agentId.toUpperCase()}] [${phase}] ${message}`);
  }
}

export class DataAgent extends BaseAgent {
  constructor() {
    super('data');
  }

  async analyze(): Promise<void> {
    this.state.phase = 'analysis';
    this.log('analysis', 'Gathering statistical data');

    const { teamA, teamB } = this.state.context;

    if (teamA.universalFeatures && teamB.universalFeatures) {
      this.addFinding('statisticalInsights', `${teamA.name} has skill index of ${teamA.universalFeatures.skill_index.toFixed(2)}`);
      this.addFinding('statisticalInsights', `${teamB.name} has skill index of ${teamB.universalFeatures.skill_index.toFixed(2)}`);

      const skillDiff = teamA.universalFeatures.skill_index - teamB.universalFeatures.skill_index;
      if (Math.abs(skillDiff) > 0.1) {
        this.addFinding('statisticalInsights', `${skillDiff > 0 ? teamA.name : teamB.name} shows ${Math.abs(skillDiff * 100).toFixed(1)}% skill advantage`);
      }
    }

    if (teamA.recentPerformance && teamB.recentPerformance) {
      this.addFinding('statisticalInsights', `${teamA.name} recent form: ${teamA.recentPerformance.wins}W-${teamA.recentPerformance.losses}L (${(teamA.recentPerformance.winRate * 100).toFixed(1)}%)`);
      this.addFinding('statisticalInsights', `${teamB.name} recent form: ${teamB.recentPerformance.wins}W-${teamB.recentPerformance.losses}L (${(teamB.recentPerformance.winRate * 100).toFixed(1)}%)`);
    }

    this.state.confidence = 0.85;
  }

  async reason(): Promise<void> {
    this.state.phase = 'reasoning';
    this.log('reasoning', 'Deriving statistical conclusions');

    const { teamA, teamB } = this.state.context;

    if (teamA.eloRating && teamB.eloRating) {
      const eloDiff = teamA.eloRating - teamB.eloRating;
      this.addFinding('statisticalInsights', `Elo differential: ${Math.abs(eloDiff).toFixed(0)} points favoring ${eloDiff > 0 ? teamA.name : teamB.name}`);
    }

    if (teamA.universalFeatures && teamB.universalFeatures) {
      const aggDiff = teamA.universalFeatures.aggression_index - teamB.universalFeatures.aggression_index;
      const macroDiff = teamA.universalFeatures.macro_intelligence - teamB.universalFeatures.macro_intelligence;

      this.addFinding('statisticalInsights', `Aggression differential: ${aggDiff.toFixed(2)}`);
      this.addFinding('statisticalInsights', `Macro intelligence differential: ${macroDiff.toFixed(2)}`);
    }
  }
}

export class TacticalAgent extends BaseAgent {
  constructor() {
    super('tactical');
  }

  async analyze(): Promise<void> {
    this.state.phase = 'analysis';
    this.log('analysis', 'Analyzing tactical patterns');

    const { teamA, teamB } = this.state.context;

    if (teamA.universalFeatures && teamB.universalFeatures) {
      const aAggro = teamA.universalFeatures.aggression_index;
      const bAggro = teamB.universalFeatures.aggression_index;

      if (aAggro > 0.7 && bAggro < 0.5) {
        this.addFinding('tacticalObservations', `${teamA.name} plays aggressively - may exploit ${teamB.name}'s defensive weaknesses`);
      } else if (aAggro < 0.4 && bAggro > 0.6) {
        this.addFinding('tacticalObservations', `${teamA.name} plays conservatively - may struggle against ${teamB.name}'s pressure`);
      }
    }

    this.addFinding('tacticalObservations', 'Team coordination and utility usage will be key differentiators');
  }

  async reason(): Promise<void> {
    this.state.phase = 'reasoning';
    this.log('reasoning', 'Formulating tactical recommendations');

    const { teamA, teamB } = this.state.context;

    if (teamA.universalFeatures && teamB.universalFeatures) {
      const aMacro = teamA.universalFeatures.macro_intelligence;
      const bMacro = teamB.universalFeatures.macro_intelligence;

      if (aMacro > bMacro + 0.15) {
        this.addFinding('tacticalObservations', `${teamA.name} should leverage superior macro play - focus on objectives and rotations`);
        this.addFinding('recommendations', `${teamB.name} should disrupt ${teamA.name}'s rhythm with aggressive early plays`);
      } else if (bMacro > aMacro + 0.15) {
        this.addFinding('tacticalObservations', `${teamB.name} should leverage superior macro play - focus on objectives and rotations`);
        this.addFinding('recommendations', `${teamA.name} should disrupt ${teamB.name}'s rhythm with aggressive early plays`);
      }
    }

    this.state.confidence = 0.75;
  }
}

export class MetaAgent extends BaseAgent {
  constructor() {
    super('meta');
  }

  async analyze(): Promise<void> {
    this.state.phase = 'analysis';
    this.log('analysis', 'Analyzing meta context');

    if (this.state.context.metaState) {
      const meta = this.state.context.metaState;

      this.addFinding('metaInsights', `Current meta trend: ${meta.metaTrend}`);
      this.addFinding('metaInsights', `Patch version: ${meta.patchVersion}`);

      if (meta.dominantStrategies && meta.dominantStrategies.length > 0) {
        this.addFinding('metaInsights', `Dominant strategies: ${meta.dominantStrategies.join(', ')}`);
      }

      this.addFinding('metaInsights', `Recommendation strength: ${(meta.recommendationStrength * 100).toFixed(0)}%`);
    } else {
      this.addFinding('metaInsights', 'No meta data available - assuming balanced meta');
    }

    this.state.confidence = 0.7;
  }

  async reason(): Promise<void> {
    this.state.phase = 'reasoning';
    this.log('reasoning', 'Applying meta analysis to matchup');

    const { teamA, teamB, metaState } = this.state.context;

    if (metaState && teamA.universalFeatures && teamB.universalFeatures) {
      const aMetaAlign = teamA.universalFeatures.meta_alignment_score;
      const bMetaAlign = teamB.universalFeatures.meta_alignment_score;

      if (aMetaAlign > bMetaAlign + 0.1) {
        this.addFinding('metaInsights', `${teamA.name} aligns better with current meta - favorable matchup`);
        this.addFinding('recommendations', `${teamA.name} should play to their meta-aligned strengths`);
      } else if (bMetaAlign > aMetaAlign + 0.1) {
        this.addFinding('metaInsights', `${teamB.name} aligns better with current meta - unfavorable matchup for ${teamA.name}`);
        this.addFinding('recommendations', `${teamA.name} may need off-meta strategies to compete`);
      }
    }

    this.state.confidence = 0.75;
  }
}

export class PredictionAgent extends BaseAgent {
  constructor() {
    super('prediction');
  }

  async analyze(): Promise<void> {
    this.state.phase = 'analysis';
    this.log('analysis', 'Computing prediction models');

    const { teamA, teamB } = this.state.context;

    let teamA_prob = 0.5;
    let teamB_prob = 0.5;
    const keyFactors: string[] = [];

    if (teamA.universalFeatures && teamB.universalFeatures) {
      const skillWeight = 0.35;
      const aggWeight = 0.15;
      const macroWeight = 0.2;
      const metaWeight = 0.15;
      const eloWeight = 0.15;

      const skillScoreA = teamA.universalFeatures.skill_index;
      const skillScoreB = teamB.universalFeatures.skill_index;

      const aggScoreA = teamA.universalFeatures.aggression_index;
      const aggScoreB = teamB.universalFeatures.aggression_index;

      const macroScoreA = teamA.universalFeatures.macro_intelligence;
      const macroScoreB = teamB.universalFeatures.macro_intelligence;

      const metaScoreA = teamA.universalFeatures.meta_alignment_score;
      const metaScoreB = teamB.universalFeatures.meta_alignment_score;

      const totalA = skillScoreA * skillWeight + aggScoreA * aggWeight + macroScoreA * macroWeight + metaScoreA * metaWeight;
      const totalB = skillScoreB * skillWeight + aggScoreB * aggWeight + macroScoreB * macroWeight + metaScoreB * metaWeight;

      const total = totalA + totalB;
      if (total > 0) {
        teamA_prob = Math.max(0.1, Math.min(0.9, totalA / total));
        teamB_prob = 1 - teamA_prob;
      }

      if (skillScoreA > skillScoreB + 0.1) {
        keyFactors.push(`${teamA.name} superior skill index`);
      } else if (skillScoreB > skillScoreA + 0.1) {
        keyFactors.push(`${teamB.name} superior skill index`);
      }

      if (macroScoreA > macroScoreB + 0.1) {
        keyFactors.push(`${teamA.name} superior macro play`);
      } else if (macroScoreB > macroScoreA + 0.1) {
        keyFactors.push(`${teamB.name} superior macro play`);
      }
    }

    if (teamA.eloRating && teamB.eloRating) {
      const eloDiff = teamA.eloRating - teamB.eloRating;
      if (Math.abs(eloDiff) > 50) {
        const eloAdjustment = (eloDiff / 2000) * 0.15;
        teamA_prob = Math.max(0.1, Math.min(0.9, teamA_prob + eloAdjustment));
        teamB_prob = 1 - teamA_prob;
        keyFactors.push(`Elo differential of ${Math.abs(eloDiff).toFixed(0)} points`);
      }
    }

    this.state.findings.predictions = [{
      teamA_win_probability: Math.round(teamA_prob * 1000) / 1000,
      teamB_win_probability: Math.round(teamB_prob * 1000) / 1000,
      keyFactors,
      confidence: 0.75,
    }];

    this.state.confidence = 0.75;
  }

  async reason(): Promise<void> {
    this.state.phase = 'reasoning';
    this.log('reasoning', 'Refining prediction with scenario analysis');

    const prediction = this.state.findings.predictions?.[0] as PredictionOutput | undefined;
    if (prediction && typeof prediction === 'object' && 'teamA_win_probability' in prediction) {
      const teamAFavored = prediction.teamA_win_probability > 0.65;
      const teamBFavored = prediction.teamB_win_probability > 0.65;
      
      if (teamAFavored) {
        this.addFinding('recommendations', `${this.state.context.teamA.name} should maintain current playstyle`);
        this.addFinding('recommendations', `${this.state.context.teamB.name} needs to disrupt opponent rhythm`);
      } else if (teamBFavored) {
        this.addFinding('recommendations', `${this.state.context.teamB.name} should maintain current playstyle`);
        this.addFinding('recommendations', `${this.state.context.teamA.name} needs to disrupt opponent rhythm`);
      } else {
        this.addFinding('recommendations', 'Both teams should focus on minimizing individual mistakes');
      }
    }

    this.state.confidence = 0.8;
  }
}

export class CriticAgent extends BaseAgent {
  constructor() {
    super('critic');
  }

  async analyze(): Promise<void> {
    this.state.phase = 'analysis';
    this.log('analysis', 'Reviewing agent findings');

    this.addFinding('criticisms', 'DataAgent findings are statistically sound but may not capture intangibles');
    this.addFinding('criticisms', 'TacticalAgent assumes optimal execution which may not occur');
    this.addFinding('criticisms', 'MetaAgent relies on historical data that may not predict current form');

    this.state.confidence = 0.65;
  }

  async reason(): Promise<void> {
    this.state.phase = 'reasoning';
    this.log('reasoning', 'Synthesizing critical analysis');

    const { teamA, teamB } = this.state.context;

    this.addFinding('criticisms', 'Predictions assume both teams play at historical average - actual performance may vary');
    this.addFinding('criticisms', 'Head-to-head history may be more predictive than overall stats');
    this.addFinding('criticisms', 'In-game adaptations and momentum swings not captured by models');

    this.addFinding('recommendations', 'Consider recent head-to-head results for final prediction adjustment');
    this.addFinding('recommendations', 'Account for potential upset scenarios when confidence < 0.8');
    this.addFinding('recommendations', 'Monitor in-game developments for early indicator signals');

    this.state.confidence = 0.7;
  }
}

export function createAgent(agentType: AgentType): BaseAgent {
  switch (agentType) {
    case 'data':
      return new DataAgent();
    case 'tactical':
      return new TacticalAgent();
    case 'meta':
      return new MetaAgent();
    case 'prediction':
      return new PredictionAgent();
    case 'critic':
      return new CriticAgent();
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

