import { GameTitle, UniversalFeatures, GameSpecificStats } from '../normalizationEngine';

export interface HybridPrediction {
  eloRating: {
    teamA_prob: number;
    teamB_prob: number;
  };
  glickoRating: {
    teamA_prob: number;
    teamB_prob: number;
    uncertainty: number;
  };
  neuralScore: {
    teamA_prob: number;
    teamB_prob: number;
    featureContributions: Record<string, number>;
  };
  metaAlignment: {
    teamA_score: number;
    teamB_score: number;
    advantage: number;
  };
  simulationResult: {
    teamA_wins: number;
    teamB_wins: number;
    iterations: number;
    confidence: number;
  };
  finalPrediction: {
    teamA_win_probability: number;
    teamB_win_probability: number;
    confidenceScore: number;
    calibrationAdjustment: number;
  };
  modelWeights: {
    elo: number;
    glicko: number;
    neural: number;
    meta: number;
    simulation: number;
  };
}

export interface NeuralInput {
  teamA_features: UniversalFeatures;
  teamB_features: UniversalFeatures;
  meta_features: number[];
  embedding_similarity: number;
  recent_form_delta: number;
}

export interface HybridModelConfig {
  eloWeight: number;
  glickoWeight: number;
  neuralWeight: number;
  metaWeight: number;
  simulationWeight: number;
}

const DEFAULT_CONFIG: HybridModelConfig = {
  eloWeight: 0.2,
  glickoWeight: 0.15,
  neuralWeight: 0.3,
  metaWeight: 0.15,
  simulationWeight: 0.2,
};

export class HybridPredictionModel {
  private config: HybridModelConfig;
  private neuralWeights: number[] = [];
  private bias: number = 0;

  constructor(config: Partial<HybridModelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeNeuralWeights();
  }

  private initializeNeuralWeights(): void {
    this.neuralWeights = [
      0.15, 0.12, 0.1, 0.1, 0.08, 0.08, 0.1, 0.12,
      0.08, 0.08, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
    ];
    this.bias = 0.5;
  }

  sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-10 * (x - 0.5)));
  }

  computeNeuralScore(input: NeuralInput): { teamA_prob: number; teamB_prob: number; contributions: Record<string, number> } {
    const featurePairs = [
      { a: input.teamA_features.skill_index, b: input.teamB_features.skill_index, name: 'skill_index' },
      { a: input.teamA_features.aggression_index, b: input.teamB_features.aggression_index, name: 'aggression' },
      { a: input.teamA_features.macro_intelligence, b: input.teamB_features.macro_intelligence, name: 'macro' },
      { a: input.teamA_features.adaptability_score, b: input.teamB_features.adaptability_score, name: 'adaptability' },
      { a: input.teamA_features.meta_alignment_score, b: input.teamB_features.meta_alignment_score, name: 'meta_alignment' },
      { a: input.teamA_features.synergy_score, b: input.teamB_features.synergy_score, name: 'synergy' },
    ];

    let score = this.bias;
    const contributions: Record<string, number> = {};

    for (let i = 0; i < featurePairs.length; i++) {
      const diff = featurePairs[i].a - featurePairs[i].b;
      const contribution = diff * this.neuralWeights[i];
      score += contribution;
      contributions[featurePairs[i].name] = Math.round(contribution * 1000) / 1000;
    }

    const metaContribution = (input.meta_features[0] || 0.5) * this.neuralWeights[6];
    score += metaContribution;
    contributions['meta_state'] = Math.round(metaContribution * 1000) / 1000;

    const similarityContribution = (input.embedding_similarity - 0.5) * this.neuralWeights[7];
    score += similarityContribution;
    contributions['embedding_similarity'] = Math.round(similarityContribution * 1000) / 1000;

    const formContribution = input.recent_form_delta * this.neuralWeights[8];
    score += formContribution;
    contributions['recent_form'] = Math.round(formContribution * 1000) / 1000;

    const teamA_prob = this.sigmoid(score);
    const teamB_prob = 1 - teamA_prob;

    return {
      teamA_prob: Math.round(teamA_prob * 1000) / 1000,
      teamB_prob: Math.round(teamB_prob * 1000) / 1000,
      contributions,
    };
  }

  async predict(
    teamA_elo: number,
    teamB_elo: number,
    teamA_glicko: number,
    teamB_glicko: number,
    glicko_deviationA: number,
    glicko_deviationB: number,
    teamA_features: UniversalFeatures,
    teamB_features: UniversalFeatures,
    meta_features: number[],
    simulation_result: { teamA_wins: number; teamB_wins: number; iterations: number }
  ): Promise<HybridPrediction> {
    const eloPrediction = this.computeEloPrediction(teamA_elo, teamB_elo);
    const glickoPrediction = this.computeGlickoPrediction(teamA_glicko, teamB_glicko, glicko_deviationA, glicko_deviationB);
    const meta_alignment = this.computeMetaAlignment(teamA_features, teamB_features);

    const neuralInput: NeuralInput = {
      teamA_features,
      teamB_features,
      meta_features,
      embedding_similarity: 0.5,
      recent_form_delta: teamA_features.skill_index - teamB_features.skill_index,
    };
    const neuralResult = this.computeNeuralScore(neuralInput);

    const { teamA_wins, teamB_wins, iterations } = simulation_result;
    const simulationProbA = iterations > 0 ? teamA_wins / iterations : 0.5;
    const simulationProbB = 1 - simulationProbA;

    const weightedA =
      eloPrediction.teamA_prob * this.config.eloWeight +
      glickoPrediction.teamA_prob * this.config.glickoWeight +
      neuralResult.teamA_prob * this.config.neuralWeight +
      meta_alignment.teamA_score * this.config.metaWeight +
      simulationProbA * this.config.simulationWeight;

    const finalProbA = Math.max(0.1, Math.min(0.9, weightedA));
    const finalProbB = 1 - finalProbA;

    const uncertainty = (
      (1 - glickoPrediction.uncertainty) * 0.2 +
      (1 - Math.abs(eloPrediction.teamA_prob - 0.5)) * 0.15 +
      (1 - Math.abs(neuralResult.teamA_prob - 0.5)) * 0.15 +
      Math.abs(1 - Math.abs(finalProbA - 0.5) * 2) * 0.3 +
      Math.abs(1 - simulationProbA) * 0.2
    );

    const calibrationAdjustment = this.computeCalibrationAdjustment([
      eloPrediction.teamA_prob,
      glickoPrediction.teamA_prob,
      neuralResult.teamA_prob,
      meta_alignment.teamA_score,
      simulationProbA,
    ], finalProbA);

    return {
      eloRating: {
        teamA_prob: Math.round(eloPrediction.teamA_prob * 1000) / 1000,
        teamB_prob: Math.round(eloPrediction.teamB_prob * 1000) / 1000,
      },
      glickoRating: {
        teamA_prob: Math.round(glickoPrediction.teamA_prob * 1000) / 1000,
        teamB_prob: Math.round(glickoPrediction.teamB_prob * 1000) / 1000,
        uncertainty: Math.round(glickoPrediction.uncertainty * 1000) / 1000,
      },
      neuralScore: {
        teamA_prob: neuralResult.teamA_prob,
        teamB_prob: neuralResult.teamB_prob,
        featureContributions: neuralResult.contributions,
      },
      metaAlignment: {
        teamA_score: meta_alignment.teamA_score,
        teamB_score: meta_alignment.teamB_score,
        advantage: Math.round(meta_alignment.advantage * 1000) / 1000,
      },
      simulationResult: {
        teamA_wins,
        teamB_wins,
        iterations,
        confidence: Math.round(simulationProbA === 0.5 ? 0.5 : Math.abs(simulationProbA - 0.5) * 2 * 1000) / 1000,
      },
      finalPrediction: {
        teamA_win_probability: Math.round(finalProbA * 1000) / 1000,
        teamB_win_probability: Math.round(finalProbB * 1000) / 1000,
        confidenceScore: Math.round(uncertainty * 1000) / 1000,
        calibrationAdjustment: Math.round(calibrationAdjustment * 1000) / 1000,
      },
      modelWeights: {
        elo: this.config.eloWeight,
        glicko: this.config.glickoWeight,
        neural: this.config.neuralWeight,
        meta: this.config.metaWeight,
        simulation: this.config.simulationWeight,
      },
    };
  }

  private computeEloPrediction(eloA: number, eloB: number): { teamA_prob: number; teamB_prob: number } {
    const diff = eloA - eloB;
    const prob = 1 / (1 + Math.pow(10, -diff / 400));
    return {
      teamA_prob: Math.round(prob * 1000) / 1000,
      teamB_prob: Math.round((1 - prob) * 1000) / 1000,
    };
  }

  private computeGlickoPrediction(
    glickoA: number,
    glickoB: number,
    devA: number,
    devB: number
  ): { teamA_prob: number; teamB_prob: number; uncertainty: number } {
    const diff = glickoA - glickoB;
    const combinedDev = Math.sqrt(devA * devA + devB * devB);
    const baseProb = 1 / (1 + Math.pow(10, -diff / 400));
    const uncertainty = combinedDev > 0 ? Math.min(1, combinedDev / 200) : 0.5;
    const adjustedProb = baseProb * (1 - uncertainty * 0.3) + 0.5 * uncertainty * 0.3;

    return {
      teamA_prob: Math.round(adjustedProb * 1000) / 1000,
      teamB_prob: Math.round((1 - adjustedProb) * 1000) / 1000,
      uncertainty,
    };
  }

  private computeMetaAlignment(
    featuresA: UniversalFeatures,
    featuresB: UniversalFeatures
  ): { teamA_score: number; teamB_score: number; advantage: number } {
    const scoreA = featuresA.meta_alignment_score;
    const scoreB = featuresB.meta_alignment_score;
    const total = scoreA + scoreB;

    const teamA_norm = total > 0 ? scoreA / total : 0.5;
    const teamB_norm = total > 0 ? scoreB / total : 0.5;

    return {
      teamA_score: Math.round(teamA_norm * 1000) / 1000,
      teamB_score: Math.round(teamB_norm * 1000) / 1000,
      advantage: Math.round((teamA_norm - teamB_norm) * 1000) / 1000,
    };
  }

  private computeCalibrationAdjustment(predictions: number[], finalPrediction: number): number {
    const avgPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    return finalPrediction - avgPrediction;
  }

  updateWeights(newWeights: Partial<HybridModelConfig>): void {
    this.config = { ...this.config, ...newWeights };
  }
}

export const hybridPredictionModel = new HybridPredictionModel();

