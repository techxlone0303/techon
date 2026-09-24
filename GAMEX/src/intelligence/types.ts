/**
 * ScoutIQ Intelligence Layer - Common Types
 */

export interface TeamData {
  id: string;
  name: string;
  stats?: TeamStats;
  players?: PlayerData[];
  series?: SeriesData[];
}

export interface PlayerData {
  id: string;
  nickname: string;
  teamId?: string;
  role?: string;
  stats?: PlayerStats;
}

export interface SeriesData {
  id: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  startTime: Date;
  tournament?: string;
}

export interface TeamStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kills?: number;
  deaths?: number;
  assists?: number;
}

export interface TeamFeatures {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  recentWinRate: number;
  formTrend: 'improving' | 'stable' | 'declining';
  streak: number;
  winConsistency: number;
  comebackAbility: number;
  earlyGameStrength: number;
  lateGameStrength: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
}

export interface MatchupInput {
  teamA: TeamData;
  teamB: TeamData;
  playersA?: PlayerData[];
  playersB?: PlayerData[];
  seriesHistory?: SeriesData[];
}

export interface MatchupIntelligence {
  teams: {
    teamA: TeamIntelligence;
    teamB: TeamIntelligence;
  };
  prediction: PredictionResult;
  features: MatchupFeatures;
  graph: SynergyResult;
  explanation: string;
}

export interface TeamIntelligence {
  id: string;
  name: string;
  eloRating: number;
  winRate: number;
  kda: number;
  form: 'hot' | 'warm' | 'cold';
  strengths: string[];
  weaknesses: string[];
  keyPlayers: string[];
}

export interface PredictionResult {
  winner: string;
  winProbability: number;
  expectedScore: string;
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'teamA' | 'teamB' | 'neutral';
  description: string;
}

export interface MatchupFeatures {
  teamAAdvantage: number;
  teamBAdvantage: number;
  formDiff: number;
  eloDiff: number;
  upsetPotential: number;
  predictedScoreDiff: number;
}

export interface SynergyResult {
  teamASynergy: number;
  teamBSynergy: number;
  keySynergies: Array<{ players: string[]; score: number }>;
  weakLinks: Array<{ player: string; score: number }>;
}

export interface EnsembleConfig {
  statsWeight: number;
  eloWeight: number;
  trendWeight: number;
  graphWeight: number;
}

export interface ModelPrediction {
  model: string;
  probability: number;
  confidence: number;
  factors: Record<string, number>;
}

export interface CalibrationResult {
  rawProbability: number;
  calibratedProbability: number;
  adjustment: number;
  confidence: number;
}

export class IntelligenceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'IntelligenceError';
    this.code = code;
  }
}

export const ERROR_CODES = {
  MISSING_DATA: 'MISSING_DATA',
  MODEL_FAILURE: 'MODEL_FAILURE',
  CALIBRATION_ERROR: 'CALIBRATION_ERROR',
  GRAPH_ERROR: 'GRAPH_ERROR',
  LLM_ERROR: 'LLM_ERROR',
} as const;

