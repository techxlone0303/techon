import { UniversalFeatures } from '../normalizationEngine';

export interface SimulationConfig {
  iterations: number;
  noiseLevel: number;
  momentumFactor: number;
  upsetProbability: number;
  earlyGameWeight: number;
  midGameWeight: number;
  lateGameWeight: number;
}

export interface SimulationResult {
  teamA_wins: number;
  teamB_wins: number;
  iterations: number;
  avgScoreA: number;
  avgScoreB: number;
  scoreDistribution: number[];
  winConditionBreakdown: {
    earlyWinA: number;
    earlyWinB: number;
    midWinA: number;
    midWinB: number;
    lateWinA: number;
    lateWinB: number;
  };
  upsetScenarios: number;
  confidence: number;
}

export interface TeamSimulationState {
  name: string;
  features: UniversalFeatures;
  momentum: number;
  roundWins: number;
  currentScore: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  iterations: 1000,
  noiseLevel: 0.1,
  momentumFactor: 0.3,
  upsetProbability: 0.15,
  earlyGameWeight: 0.2,
  midGameWeight: 0.4,
  lateGameWeight: 0.4,
};

export class MatchSimulator {
  private config: SimulationConfig;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async simulateMatch(
    teamA_features: UniversalFeatures,
    teamB_features: UniversalFeatures,
    teamAName: string = 'Team A',
    teamBName: string = 'Team B'
  ): Promise<SimulationResult> {
    let teamA_wins = 0;
    let teamB_wins = 0;
    const scoreDistribution: number[] = [];
    let totalScoreA = 0;
    let totalScoreB = 0;
    let upsetScenarios = 0;

    const winConditionBreakdown = {
      earlyWinA: 0,
      earlyWinB: 0,
      midWinA: 0,
      midWinB: 0,
      lateWinA: 0,
      lateWinB: 0,
    };

    for (let i = 0; i < this.config.iterations; i++) {
      const result = this.simulateSingleMatch(teamA_features, teamB_features, teamAName, teamBName);

      if (result.winner === 'A') {
        teamA_wins++;
        if (result.winCondition === 'early') winConditionBreakdown.earlyWinA++;
        else if (result.winCondition === 'mid') winConditionBreakdown.midWinA++;
        else winConditionBreakdown.lateWinA++;
      } else {
        teamB_wins++;
        if (result.winCondition === 'early') winConditionBreakdown.earlyWinB++;
        else if (result.winCondition === 'mid') winConditionBreakdown.midWinB++;
        else winConditionBreakdown.lateWinB++;
      }

      if (result.isUpset) upsetScenarios++;

      scoreDistribution.push(result.scoreA - result.scoreB);
      totalScoreA += result.scoreA;
      totalScoreB += result.scoreB;
    }

    const scoreDiff = totalScoreA / this.config.iterations - totalScoreB / this.config.iterations;
    const scoreStdDev = this.calculateStdDev(scoreDistribution);
    const dominanceMetric = Math.abs(scoreDiff) / (scoreStdDev + 1);
    const confidence = Math.min(0.95, 0.5 + dominanceMetric * 0.3);

    return {
      teamA_wins,
      teamB_wins,
      iterations: this.config.iterations,
      avgScoreA: Math.round(totalScoreA / this.config.iterations * 10) / 10,
      avgScoreB: Math.round(totalScoreB / this.config.iterations * 10) / 10,
      scoreDistribution,
      winConditionBreakdown,
      upsetScenarios,
      confidence: Math.round(confidence * 1000) / 1000,
    };
  }

  private simulateSingleMatch(
    featuresA: UniversalFeatures,
    featuresB: UniversalFeatures,
    nameA: string,
    nameB: string
  ): { winner: 'A' | 'B'; scoreA: number; scoreB: number; winCondition: 'early' | 'mid' | 'late'; isUpset: boolean } {
    const stateA = this.initializeTeamState(nameA, featuresA);
    const stateB = this.initializeTeamState(nameB, featuresB);

    let round = 0;
    const maxRounds = 24;

    while (stateA.currentScore < 13 && stateB.currentScore < 13 && round < maxRounds) {
      const roundResult = this.simulateRound(stateA, stateB, featuresA, featuresB, round);

      if (roundResult.winner === 'A') {
        stateA.roundWins++;
        stateA.momentum = Math.min(1, stateA.momentum + this.config.momentumFactor * 0.1);
        stateB.momentum = Math.max(0, stateB.momentum - this.config.momentumFactor * 0.05);
      } else {
        stateB.roundWins++;
        stateB.momentum = Math.min(1, stateB.momentum + this.config.momentumFactor * 0.1);
        stateA.momentum = Math.max(0, stateA.momentum - this.config.momentumFactor * 0.05);
      }

      stateA.currentScore = stateA.roundWins;
      stateB.currentScore = stateB.roundWins;
      round++;
    }

    const baseStrengthA = this.calculateTeamStrength(featuresA, stateA.momentum);
    const baseStrengthB = this.calculateTeamStrength(featuresB, stateB.momentum);

    const isUpset = (baseStrengthA > baseStrengthB && stateB.currentScore > stateA.currentScore) ||
                    (baseStrengthB > baseStrengthA && stateA.currentScore > stateB.currentScore);

    const winCondition = this.determineWinCondition(stateA.roundWins, stateB.roundWins, round);

    return {
      winner: stateA.currentScore >= 13 ? 'A' : 'B',
      scoreA: stateA.currentScore,
      scoreB: stateB.currentScore,
      winCondition,
      isUpset,
    };
  }

  private initializeTeamState(name: string, features: UniversalFeatures): TeamSimulationState {
    return {
      name,
      features,
      momentum: 0.5,
      roundWins: 0,
      currentScore: 0,
    };
  }

  private calculateTeamStrength(features: UniversalFeatures, momentum: number): number {
    const skillComponent = features.skill_index * 0.35;
    const aggComponent = features.aggression_index * 0.15;
    const macroComponent = features.macro_intelligence * 0.25;
    const adaptabilityComponent = features.adaptability_score * 0.15;
    const metaComponent = features.meta_alignment_score * 0.1;

    return skillComponent + aggComponent + macroComponent + adaptabilityComponent + metaComponent + momentum * 0.1;
  }

  private simulateRound(
    stateA: TeamSimulationState,
    stateB: TeamSimulationState,
    featuresA: UniversalFeatures,
    featuresB: UniversalFeatures,
    roundNumber: number
  ): { winner: 'A' | 'B'; isUpset: boolean } {
    const strengthA = this.calculateTeamStrength(featuresA, stateA.momentum);
    const strengthB = this.calculateTeamStrength(featuresB, stateB.momentum);

    const noise = (Math.random() - 0.5) * this.config.noiseLevel;

    let adjustedStrengthA = strengthA + noise;
    let adjustedStrengthB = strengthB + noise;

    const roundPhase = this.getRoundPhase(roundNumber);
    const phaseMultiplierA = this.getPhaseMultiplier(featuresA, roundPhase);
    const phaseMultiplierB = this.getPhaseMultiplier(featuresB, roundPhase);

    adjustedStrengthA *= phaseMultiplierA;
    adjustedStrengthB *= phaseMultiplierB;

    const upsetRoll = Math.random();
    const isUpset = upsetRoll < this.config.upsetProbability;

    if (isUpset) {
      const temp = adjustedStrengthA;
      adjustedStrengthA = adjustedStrengthB;
      adjustedStrengthB = temp;
    }

    return {
      winner: adjustedStrengthA > adjustedStrengthB ? 'A' : 'B',
      isUpset,
    };
  }

  private getRoundPhase(roundNumber: number): 'early' | 'mid' | 'late' {
    if (roundNumber < 8) return 'early';
    if (roundNumber < 16) return 'mid';
    return 'late';
  }

  private getPhaseMultiplier(features: UniversalFeatures, phase: 'early' | 'mid' | 'late'): number {
    switch (phase) {
      case 'early':
        return this.config.earlyGameWeight + (1 - features.adaptability_score) * 0.2;
      case 'mid':
        return this.config.midGameWeight + features.macro_intelligence * 0.15;
      case 'late':
        return this.config.lateGameWeight + features.adaptability_score * 0.1;
      default:
        return 1;
    }
  }

  private determineWinCondition(
    scoreA: number,
    scoreB: number,
    roundNumber: number
  ): 'early' | 'mid' | 'late' {
    if (scoreA >= 13 || scoreB >= 13) {
      if (roundNumber < 20) return 'early';
      if (roundNumber < 28) return 'mid';
      return 'late';
    }
    return 'mid';
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  async simulateTournament(
    teams: Array<{ name: string; features: UniversalFeatures }>,
    format: 'single_elimination' | 'double_elimination' | 'round_robin' = 'single_elimination'
  ): Promise<{ champion: string; bracket: any; upsets: number }> {
    const bracket: any[] = [];
    let upsets = 0;

    if (format === 'single_elimination') {
      let currentRound = teams.map((t, i) => ({ ...t, seed: i + 1 }));

      let round = 1;
      while (currentRound.length > 1) {
        const nextRound: any[] = [];
        const roundMatches: any[] = [];

        for (let i = 0; i < currentRound.length; i += 2) {
          const teamA = currentRound[i];
          const teamB = currentRound[i + 1];

          if (!teamB) {
            nextRound.push(teamA);
            continue;
          }

          const result = await this.simulateMatch(teamA.features, teamB.features, teamA.name, teamB.name);
          const winner = result.teamA_wins > result.teamB_wins ? teamA : teamB;
          const isUpset = (teamA.seed < teamB.seed && winner.seed > teamA.seed) ||
                         (teamB.seed < teamA.seed && winner.seed > teamB.seed);
          if (isUpset) upsets++;

          roundMatches.push({
            teamA: teamA.name,
            teamB: teamB.name,
            winner: winner.name,
            score: `${result.avgScoreA.toFixed(1)} - ${result.avgScoreB.toFixed(1)}`,
          });
          nextRound.push(winner);
        }

        bracket.push({ round, matches: roundMatches });
        currentRound = nextRound;
        round++;
      }

      return {
        champion: currentRound[0].name,
        bracket,
        upsets,
      };
    }

    return {
      champion: teams[0].name,
      bracket: [],
      upsets: 0,
    };
  }

  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const matchSimulator = new MatchSimulator();

