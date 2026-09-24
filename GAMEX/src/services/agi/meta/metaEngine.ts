import axios from 'axios';
import { GameTitle, UniversalFeatures } from '../normalizationEngine';

export interface MetaState {
  gameTitle: GameTitle;
  timestamp: string;
  patchVersion: string;
  dominantStrategies: string[];
  metaTrend: 'rising' | 'stable' | 'declining';
  winRateDelta: number;
  pickRateChanges: Array<{
    agent: string;
    pickRate: number;
    change: number;
  }>;
  recommendationStrength: number;
  stateVector: number[];
}

export interface PatchNote {
  version: string;
  releaseDate: string;
  buffAgents: string[];
  nerfAgents: string[];
  mapChanges: string[];
  mechanicChanges: string[];
  expectedImpact: 'high' | 'medium' | 'low';
}

export interface MetaPrediction {
  predictedMetaState: MetaState;
  confidence: number;
  keyChanges: string[];
  recommendation: string;
}

const PATCH_API_URL = 'https://api-pub.tft.gg';

export class MetaEngine {
  private metaHistory: Map<string, MetaState[]> = new Map();
  private patchNotes: Map<string, PatchNote> = new Map();
  private stateVectorCache: Map<string, MetaState> = new Map();

  private readonly VECTOR_DIMENSIONS = 16;
  private readonly STATE_WEIGHTS = {
    winRateSpread: 0.15,
    pickRateConcentration: 0.12,
    agentDiversity: 0.1,
    mapVariance: 0.08,
    roleBalance: 0.1,
    trendMomentum: 0.15,
    recentPatchImpact: 0.12,
    regionalVariance: 0.08,
    competitiveAdoption: 0.1,
  };

  async fetchCurrentMeta(gameTitle: GameTitle): Promise<MetaState> {
    const cacheKey = `${gameTitle}_current`;
    const cached = this.stateVectorCache.get(cacheKey);
    if (cached) return cached;

    const metaState = await this.constructMetaState(gameTitle);

    this.stateVectorCache.set(cacheKey, metaState);
    const history = this.metaHistory.get(gameTitle) || [];
    history.push(metaState);
    if (history.length > 50) history.shift();
    this.metaHistory.set(gameTitle, history);

    return metaState;
  }

  async constructMetaState(gameTitle: GameTitle): Promise<MetaState> {
    const now = new Date().toISOString();
    const patchVersion = await this.getLatestPatch(gameTitle);

    const dominantStrategies = await this.identifyDominantStrategies(gameTitle);
    const pickRateChanges = await this.getPickRateChanges(gameTitle);

    const winRates = await this.getWinRates(gameTitle);
    const winRateSpread = Math.max(...winRates) - Math.min(...winRates);
    const avgWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length;

    const metaTrend = this.calculateMetaTrend(gameTitle);
    const winRateDelta = this.calculateWinRateDelta(gameTitle);

    const stateVector = this.encodeMetaState(gameTitle, winRateSpread, avgWinRate, winRateDelta);

    return {
      gameTitle,
      timestamp: now,
      patchVersion,
      dominantStrategies,
      metaTrend,
      winRateDelta,
      pickRateChanges,
      recommendationStrength: this.calculateRecommendationStrength(stateVector),
      stateVector,
    };
  }

  private async getLatestPatch(gameTitle: GameTitle): Promise<string> {
    return `1.0.${Math.floor(Date.now() / 86400000)}`;
  }

  private async identifyDominantStrategies(gameTitle: GameTitle): Promise<string[]> {
    const strategies: Record<GameTitle, string[]> = {
      VALORANT: ['Double Duelist', 'Controller Stack', 'Initiator Heavy', 'Speed comp'],
      CS2: ['Aggressive T-side', 'Default heavy', 'IGL-led execs', 'AWP anchor'],
      DOTA2: ['5-position core', 'Deathball', 'Split push', 'Pickoff style'],
      LOL: ['Scaling comp', 'Early aggression', 'Vision control', 'Objective focused'],
    };
    return strategies[gameTitle] || [];
  }

  private async getPickRateChanges(gameTitle: GameTitle): Promise<MetaState['pickRateChanges']> {
    return [
      { agent: 'Jett', pickRate: 0.45, change: 0.05 },
      { agent: 'KAY/O', pickRate: 0.25, change: -0.03 },
      { agent: 'Viper', pickRate: 0.35, change: 0.08 },
      { agent: 'Sova', pickRate: 0.30, change: 0.02 },
    ];
  }

  private async getWinRates(gameTitle: GameTitle): Promise<number[]> {
    return [0.52, 0.48, 0.51, 0.49, 0.53, 0.47, 0.50, 0.50];
  }

  private calculateMetaTrend(gameTitle: GameTitle): 'rising' | 'stable' | 'declining' {
    const history = this.metaHistory.get(gameTitle) || [];
    if (history.length < 2) return 'stable';

    const recent = history.slice(-3);
    const trend = recent.reduce((acc, state, i) => {
      if (i === 0) return 0;
      return acc + (state.winRateDelta - recent[i - 1].winRateDelta);
    }, 0);

    if (trend > 0.02) return 'rising';
    if (trend < -0.02) return 'declining';
    return 'stable';
  }

  private calculateWinRateDelta(gameTitle: GameTitle): number {
    return (Math.random() - 0.5) * 0.1;
  }

  private encodeMetaState(
    gameTitle: GameTitle,
    winRateSpread: number,
    avgWinRate: number,
    winRateDelta: number
  ): number[] {
    const vector = new Array(this.VECTOR_DIMENSIONS).fill(0);

    vector[0] = Math.min(1, winRateSpread / 0.2);
    vector[1] = avgWinRate;
    vector[2] = Math.min(1, Math.abs(winRateDelta) / 0.1);
    vector[3] = this.metaHistory.get(gameTitle)?.length ? 0.5 : 0.3;
    vector[4] = 0.5;
    vector[5] = 0.5;
    vector[6] = 0.5;
    vector[7] = 0.5;
    vector[8] = 0.5;
    vector[9] = 0.5;
    vector[10] = 0.5;
    vector[11] = 0.5;
    vector[12] = 0.5;
    vector[13] = 0.5;
    vector[14] = 0.5;
    vector[15] = 0.5;

    return vector.map(v => Math.round(v * 1000) / 1000);
  }

  private calculateRecommendationStrength(stateVector: number[]): number {
    let strength = 0.5;

    for (let i = 0; i < 5; i++) {
      strength += (stateVector[i] - 0.5) * 0.1;
    }

    return Math.max(0, Math.min(1, Math.round(strength * 1000) / 1000));
  }

  async analyzePatchImpact(patchNotes: PatchNote): Promise<MetaPrediction> {
    const gameTitle: GameTitle = 'VALORANT';
    const predictedState = await this.fetchCurrentMeta(gameTitle);

    const impactFactors: string[] = [];

    for (const agent of patchNotes.buffAgents) {
      impactFactors.push(`${agent} received buffs - expect pick rate increase`);
    }
    for (const agent of patchNotes.nerfAgents) {
      impactFactors.push(`${agent} nerfed - pick rate likely to decrease`);
    }

    const confidence = patchNotes.expectedImpact === 'high' ? 0.85 : patchNotes.expectedImpact === 'medium' ? 0.7 : 0.5;

    const recommendation = patchNotes.expectedImpact === 'high'
      ? 'Meta shift expected - prepare multiple compositions'
      : patchNotes.expectedImpact === 'medium'
      ? 'Minor adjustments needed - maintain current strategies'
      : 'Stable meta - continue optimal play';

    return {
      predictedMetaState: {
        ...predictedState,
        patchVersion: patchNotes.version,
        dominantStrategies: patchNotes.expectedImpact === 'high'
          ? ['New comps emerging', 'Wait for meta settlement']
          : predictedState.dominantStrategies,
        recommendationStrength: confidence * 0.8 + 0.1,
      },
      confidence,
      keyChanges: impactFactors,
      recommendation,
    };
  }

  async getMetaTrendVector(gameTitle: GameTitle, timeWindowDays: number = 30): Promise<number[]> {
    const history = this.metaHistory.get(gameTitle) || [];
    const cutoff = Date.now() - timeWindowDays * 86400000;

    const recentStates = history.filter(s => new Date(s.timestamp).getTime() > cutoff);

    if (recentStates.length === 0) {
      return new Array(this.VECTOR_DIMENSIONS).fill(0.5);
    }

    const avgVector = new Array(this.VECTOR_DIMENSIONS).fill(0);
    for (const state of recentStates) {
      for (let i = 0; i < this.VECTOR_DIMENSIONS; i++) {
        avgVector[i] += state.stateVector[i] || 0;
      }
    }

    return avgVector.map(v => Math.round((v / recentStates.length) * 1000) / 1000);
  }

  getMetaHistory(gameTitle: GameTitle): MetaState[] {
    return this.metaHistory.get(gameTitle) || [];
  }

  clearCache(): void {
    this.stateVectorCache.clear();
  }
}

export const metaEngine = new MetaEngine();

