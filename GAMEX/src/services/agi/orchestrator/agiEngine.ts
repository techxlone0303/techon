import { GameTitle, UniversalFeatures } from '../normalizationEngine';
import { metaEngine, MetaState } from '../meta/metaEngine';
import { createAgent, AgentContext, AgentState, PredictionOutput } from '../agents/agentSystem';
import { hybridPredictionModel, HybridPrediction } from '../models/hybridModel';
import { matchSimulator, SimulationResult } from '../simulation/matchSimulator';
import { knowledgeGraph } from '../memory/knowledgeGraph';

export interface AGIConfig {
  simulationIterations: number;
  agentEnabled: boolean;
  metaEnabled: boolean;
  memoryEnabled: boolean;
  confidenceThreshold: number;
}

export interface AGIAnalysisInput {
  matchId: string;
  gameTitle: GameTitle;
  teamA: {
    id: string;
    name: string;
    features: UniversalFeatures;
    eloRating: number;
    glickoRating: number;
    glickoDeviation: number;
  };
  teamB: {
    id: string;
    name: string;
    features: UniversalFeatures;
    eloRating: number;
    glickoRating: number;
    glickoDeviation: number;
  };
  historicalContext?: {
    headToHead?: Array<{ winner: string; score: string; date: string }>;
    recentForm?: { teamA: { wins: number; losses: number }; teamB: { wins: number; losses: number } };
  };
}

export interface AGIAnalysisResult {
  matchId: string;
  gameTitle: GameTitle;
  timestamp: string;
  metaState: MetaState;
  agentInsights: {
    dataAgent: AgentState;
    tacticalAgent: AgentState;
    metaAgent: AgentState;
    predictionAgent: AgentState;
    criticAgent: AgentState;
    consensus: {
      predictedWinner: string;
      confidenceScore: number;
      keyInsights: string[];
      riskFactors: string[];
    };
  };
  simulationResults: SimulationResult;
  hybridPrediction: HybridPrediction;
  finalPrediction: {
    winner: string;
    winProbability: number;
    confidenceScore: number;
    expectedScore: string;
    keyFactors: string[];
    advantageFactors: string[];
    riskFactors: string[];
  };
  explanation: string;
  memoryUpdate: {
    predictionRecorded: boolean;
    graphUpdated: boolean;
  };
}

const DEFAULT_CONFIG: AGIConfig = {
  simulationIterations: 1000,
  agentEnabled: true,
  metaEnabled: true,
  memoryEnabled: true,
  confidenceThreshold: 0.6,
};

export class AGIEngine {
  private config: AGIConfig;

  constructor(config: Partial<AGIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async analyze(input: AGIAnalysisInput): Promise<AGIAnalysisResult> {
    const startTime = Date.now();
    console.log(`[AGI Engine] Starting analysis for match ${input.matchId}`);

    const metaState = await this.fetchMetaState(input.gameTitle);
    const simulationResult = await this.runSimulation(input);
    const agentResult = await this.runAgentDebate(input, metaState);
    const hybridPrediction = await this.runHybridPrediction(input, metaState, simulationResult);

    const finalPrediction = this.synthesizeFinalPrediction(
      input,
      agentResult,
      simulationResult,
      hybridPrediction
    );

    const explanation = await this.generateExplanation(input, agentResult, finalPrediction);

    let memoryUpdate = { predictionRecorded: false, graphUpdated: false };
    if (this.config.memoryEnabled) {
      memoryUpdate = await this.updateMemory(input, finalPrediction, agentResult);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[AGI Engine] Analysis complete in ${processingTime}ms`);

    return {
      matchId: input.matchId,
      gameTitle: input.gameTitle,
      timestamp: new Date().toISOString(),
      metaState,
      agentInsights: agentResult,
      simulationResults: simulationResult,
      hybridPrediction,
      finalPrediction,
      explanation,
      memoryUpdate,
    };
  }

  private async fetchMetaState(gameTitle: GameTitle): Promise<MetaState> {
    if (!this.config.metaEnabled) {
      return {
        gameTitle,
        timestamp: new Date().toISOString(),
        patchVersion: 'unknown',
        dominantStrategies: [],
        metaTrend: 'stable',
        winRateDelta: 0,
        pickRateChanges: [],
        recommendationStrength: 0.5,
        stateVector: new Array(16).fill(0.5),
      };
    }

    return metaEngine.fetchCurrentMeta(gameTitle);
  }

  private async runSimulation(input: AGIAnalysisInput): Promise<SimulationResult> {
    return matchSimulator.simulateMatch(
      input.teamA.features,
      input.teamB.features,
      input.teamA.name,
      input.teamB.name
    );
  }

  private async runAgentDebate(
    input: AGIAnalysisInput,
    metaState: MetaState
  ): Promise<AGIAnalysisResult['agentInsights']> {
    if (!this.config.agentEnabled) {
      return this.getEmptyAgentResult();
    }

    const context: AgentContext = {
      gameTitle: input.gameTitle,
      matchId: input.matchId,
      teamA: {
        entityId: input.teamA.id,
        entityType: 'team',
        name: input.teamA.name,
        universalFeatures: input.teamA.features,
        eloRating: input.teamA.eloRating,
        recentPerformance: input.historicalContext?.recentForm?.teamA
          ? {
              wins: input.historicalContext.recentForm.teamA.wins,
              losses: input.historicalContext.recentForm.teamA.losses,
              winRate: input.historicalContext.recentForm.teamA.wins /
                (input.historicalContext.recentForm.teamA.wins + input.historicalContext.recentForm.teamA.losses),
              trend: 'stable',
            }
          : undefined,
      },
      teamB: {
        entityId: input.teamB.id,
        entityType: 'team',
        name: input.teamB.name,
        universalFeatures: input.teamB.features,
        eloRating: input.teamB.eloRating,
        recentPerformance: input.historicalContext?.recentForm?.teamB
          ? {
              wins: input.historicalContext.recentForm.teamB.wins,
              losses: input.historicalContext.recentForm.teamB.losses,
              winRate: input.historicalContext.recentForm.teamB.wins /
                (input.historicalContext.recentForm.teamB.wins + input.historicalContext.recentForm.teamB.losses),
              trend: 'stable',
            }
          : undefined,
      },
      metaState,
    };

    const dataAgent = createAgent('data');
    const tacticalAgent = createAgent('tactical');
    const metaAgent = createAgent('meta');
    const predictionAgent = createAgent('prediction');
    const criticAgent = createAgent('critic');

    dataAgent.updateContext(context);
    tacticalAgent.updateContext(context);
    metaAgent.updateContext(context);
    predictionAgent.updateContext(context);
    criticAgent.updateContext(context);

    await Promise.all([
      dataAgent.analyze(),
      tacticalAgent.analyze(),
      metaAgent.analyze(),
      predictionAgent.analyze(),
      criticAgent.analyze(),
    ]);

    await Promise.all([
      dataAgent.reason(),
      tacticalAgent.reason(),
      metaAgent.reason(),
      predictionAgent.reason(),
      criticAgent.reason(),
    ]);

    const dataState = dataAgent.getState();
    const tacticalState = tacticalAgent.getState();
    const metaStateAgent = metaAgent.getState();
    const predictionState = predictionAgent.getState();
    const criticState = criticAgent.getState();

    const consensus = this.computeConsensus(
      dataState,
      tacticalState,
      metaStateAgent,
      predictionState,
      criticState,
      input
    );

    return {
      dataAgent: dataState,
      tacticalAgent: tacticalState,
      metaAgent: metaStateAgent,
      predictionAgent: predictionState,
      criticAgent: criticState,
      consensus,
    };
  }

  private computeConsensus(
    dataState: AgentState,
    tacticalState: AgentState,
    metaState: AgentState,
    predictionState: AgentState,
    criticState: AgentState,
    input: AGIAnalysisInput
  ): AGIAnalysisResult['agentInsights']['consensus'] {
    const predictions = predictionState.findings.predictions || [];
    const prediction = predictions[0] as PredictionOutput | undefined;

    const allInsights = [
      ...(dataState.findings.statisticalInsights || []),
      ...(tacticalState.findings.tacticalObservations || []),
      ...(metaState.findings.metaInsights || []),
      ...(criticState.findings.criticisms || []),
    ];

    const keyInsights = allInsights.slice(0, 5);
    const riskFactors = criticState.findings.recommendations || [];

    const predictedWinner = prediction && prediction.teamA_win_probability > prediction.teamB_win_probability
      ? input.teamA.name
      : input.teamB.name;

    const confidence = prediction?.confidence || 0.5;

    return {
      predictedWinner,
      confidenceScore: confidence,
      keyInsights,
      riskFactors,
    };
  }

  private async runHybridPrediction(
    input: AGIAnalysisInput,
    metaState: MetaState,
    simulationResult: SimulationResult
  ): Promise<HybridPrediction> {
    const metaFeatures = metaState.stateVector || new Array(16).fill(0.5);

    return hybridPredictionModel.predict(
      input.teamA.eloRating,
      input.teamB.eloRating,
      input.teamA.glickoRating,
      input.teamB.glickoRating,
      input.teamA.glickoDeviation,
      input.teamB.glickoDeviation,
      input.teamA.features,
      input.teamB.features,
      metaFeatures,
      {
        teamA_wins: simulationResult.teamA_wins,
        teamB_wins: simulationResult.teamB_wins,
        iterations: simulationResult.iterations,
      }
    );
  }

  private synthesizeFinalPrediction(
    input: AGIAnalysisInput,
    agentResult: AGIAnalysisResult['agentInsights'],
    simulationResult: SimulationResult,
    hybridPrediction: HybridPrediction
  ): AGIAnalysisResult['finalPrediction'] {
    const agentWinner = agentResult.consensus.predictedWinner;
    const hybridWinner = hybridPrediction.finalPrediction.teamA_win_probability > hybridPrediction.finalPrediction.teamB_win_probability
      ? input.teamA.name
      : input.teamB.name;

    const simulationWinner = simulationResult.teamA_wins > simulationResult.teamB_wins
      ? input.teamA.name
      : input.teamB.name;

    const winnerVotes = [
      agentWinner,
      hybridWinner,
      simulationWinner,
    ];

    const winnerCount = winnerVotes.filter(w => w === input.teamA.name).length;
    const teamA_prob = winnerCount >= 2
      ? (0.6 + winnerCount * 0.1)
      : (0.4 - (3 - winnerCount) * 0.1);

    const finalProb = Math.max(0.1, Math.min(0.9, teamA_prob));
    const confidenceScore = (
      hybridPrediction.finalPrediction.confidenceScore * 0.4 +
      agentResult.consensus.confidenceScore * 0.3 +
      simulationResult.confidence * 0.3
    );

    const advantageFactors: string[] = [];
    const riskFactors: string[] = [];

    if (input.teamA.features.skill_index > input.teamB.features.skill_index + 0.1) {
      advantageFactors.push(`${input.teamA.name} has superior individual skill`);
    }
    if (input.teamA.features.macro_intelligence > input.teamB.features.macro_intelligence + 0.1) {
      advantageFactors.push(`${input.teamA.name} shows better macro play`);
    }
    if (input.teamA.features.meta_alignment_score > input.teamB.features.meta_alignment_score + 0.1) {
      advantageFactors.push(`${input.teamA.name} aligns better with current meta`);
    }

    riskFactors.push('Head-to-head history may differ from statistical averages');
    riskFactors.push('In-game adaptations not captured by models');
    riskFactors.push('Momentum swings can swing match outcome');

    return {
      winner: finalProb > 0.5 ? input.teamA.name : input.teamB.name,
      winProbability: Math.round(finalProb * 1000) / 1000,
      confidenceScore: Math.round(confidenceScore * 1000) / 1000,
      expectedScore: `${simulationResult.avgScoreA.toFixed(1)} - ${simulationResult.avgScoreB.toFixed(1)}`,
      keyFactors: [
        `Statistical advantage: ${(finalProb * 100).toFixed(0)}% win probability`,
        `Simulation confidence: ${(simulationResult.confidence * 100).toFixed(0)}%`,
        `Model confidence: ${(hybridPrediction.finalPrediction.confidenceScore * 100).toFixed(0)}%`,
      ],
      advantageFactors,
      riskFactors,
    };
  }

  private async generateExplanation(
    input: AGIAnalysisInput,
    agentResult: AGIAnalysisResult['agentInsights'],
    finalPrediction: AGIAnalysisResult['finalPrediction']
  ): Promise<string> {
    const explanationPrompt = `Generate a concise scouting report summary for ${input.teamA.name} vs ${input.teamB.name}.

Predicted Winner: ${finalPrediction.winner}
Win Probability: ${(finalPrediction.winProbability * 100).toFixed(0)}%
Confidence: ${(finalPrediction.confidenceScore * 100).toFixed(0)}%
Expected Score: ${finalPrediction.expectedScore}

Key Insights:
${agentResult.consensus.keyInsights.slice(0, 3).map(i => `- ${i}`).join('\n')}

Risk Factors:
${agentResult.consensus.riskFactors.slice(0, 2).map(r => `- ${r}`).join('\n')}

Provide a 2-3 sentence summary suitable for coaching staff.`;

    return explanationPrompt;
  }

  private async updateMemory(
    input: AGIAnalysisInput,
    finalPrediction: AGIAnalysisResult['finalPrediction'],
    agentResult: AGIAnalysisResult['agentInsights']
  ): Promise<{ predictionRecorded: boolean; graphUpdated: boolean }> {
    try {
      await knowledgeGraph.recordPrediction(
        input.matchId,
        input.teamA.id,
        input.teamB.id,
        finalPrediction.winner,
        null,
        finalPrediction.confidenceScore,
        input.teamA.features
      );

      if (input.historicalContext?.headToHead && input.historicalContext.headToHead.length > 0) {
        const lastMatch = input.historicalContext.headToHead[0];
        const winner = lastMatch.winner === input.teamA.name ? 'A' : 'B';
        await knowledgeGraph.recordMatchup(
          input.teamA.id,
          input.teamB.id,
          winner,
          lastMatch.score,
          { teamA: input.teamA.features, teamB: input.teamB.features }
        );
      }

      return { predictionRecorded: true, graphUpdated: true };
    } catch (error) {
      console.error('[AGI Engine] Memory update failed:', error);
      return { predictionRecorded: false, graphUpdated: false };
    }
  }

  private getEmptyAgentResult(): AGIAnalysisResult['agentInsights'] {
    return {
      dataAgent: { agentId: 'data', timestamp: '', phase: 'finalized', context: {} as AgentContext, findings: {}, confidence: 0.5, messages: [] },
      tacticalAgent: { agentId: 'tactical', timestamp: '', phase: 'finalized', context: {} as AgentContext, findings: {}, confidence: 0.5, messages: [] },
      metaAgent: { agentId: 'meta', timestamp: '', phase: 'finalized', context: {} as AgentContext, findings: {}, confidence: 0.5, messages: [] },
      predictionAgent: { agentId: 'prediction', timestamp: '', phase: 'finalized', context: {} as AgentContext, findings: {}, confidence: 0.5, messages: [] },
      criticAgent: { agentId: 'critic', timestamp: '', phase: 'finalized', context: {} as AgentContext, findings: {}, confidence: 0.5, messages: [] },
      consensus: {
        predictedWinner: 'Unknown',
        confidenceScore: 0.5,
        keyInsights: [],
        riskFactors: [],
      },
    };
  }

  updateConfig(newConfig: Partial<AGIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const agiEngine = new AGIEngine();

