/**
 * ScoutIQ Intelligence Layer - Feature Engineering
 * 
 * Derives meaningful features from GRID data for ML models.
 * Features include:
 * - Team performance metrics
 * - Player statistics
 * - Trend indicators
 * - Synergy scores
 */

import { TeamData, PlayerData, SeriesData } from "../types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TeamFeatures {
  // Basic stats
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  
  // Performance metrics
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  
  // Form indicators
  recentWinRate: number;
  formTrend: 'improving' | 'stable' | 'declining';
  streak: number;
  
  // Advanced metrics
  winConsistency: number;
  comebackAbility: number;
  earlyGameStrength: number;
  lateGameStrength: number;
}

export interface PlayerFeatures {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  
  role: string;
  performanceScore: number;
  consistency: number;
  
  recentForm: 'hot' | 'warm' | 'cold';
  carryPotential: number;
}

export interface TrendFeatures {
  winRateChange: number;
  kdaChange: number;
  formMomentum: number;
  fatigueIndex: number;
  metaAdaptation: number;
}

export interface MatchupFeatures {
  teamAAdvantage: number;
  teamBAdvantage: number;
  formDiff: number;
  eloDiff: number;
  keyPlayerMatchups: Array<{
    playerA: string;
    playerB: string;
    advantage: number;
  }>;
  predictedScoreDiff: number;
  upsetPotential: number;
}

// ============================================================================
// Team Feature Extraction
// ============================================================================

export function extractTeamFeatures(data: TeamData): TeamFeatures {
  const stats = data.stats || { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 };
  
  const gamesPlayed = stats.gamesPlayed || 0;
  const wins = stats.wins || 0;
  const losses = stats.losses || 0;
  const winRate = stats.winRate || 0;
  
  return {
    gamesPlayed,
    wins,
    losses,
    winRate,
    
    avgKills: (data as any).avgKills || 0,
    avgDeaths: (data as any).avgDeaths || 0,
    avgAssists: (data as any).avgAssists || 0,
    kda: calculateKDA(data),
    
    recentWinRate: calculateRecentWinRate(data),
    formTrend: calculateFormTrend(data),
    streak: calculateStreak(data),
    
    winConsistency: calculateWinConsistency(data),
    comebackAbility: calculateComebackAbility(data),
    earlyGameStrength: calculateEarlyGameStrength(data),
    lateGameStrength: calculateLateGameStrength(data),
  };
}

function calculateKDA(data: TeamData): number {
  const kills = (data as any).avgKills || 0;
  const deaths = (data as any).avgDeaths || 0;
  const assists = (data as any).avgAssists || 0;
  
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / Math.max(deaths, 1)) * 100) / 100;
}

function calculateRecentWinRate(data: TeamData): number {
  return (data as any).recentWinRate || (data.stats?.winRate || 0.5);
}

function calculateFormTrend(data: TeamData): 'improving' | 'stable' | 'declining' {
  const recentWR = (data as any).recentWinRate || 0.5;
  const overallWR = data.stats?.winRate || 0.5;
  const diff = recentWR - overallWR;
  
  if (diff > 0.05) return 'improving';
  if (diff < -0.05) return 'declining';
  return 'stable';
}

function calculateStreak(data: TeamData): number {
  return (data as any).streak || 0;
}

function calculateWinConsistency(data: TeamData): number {
  const wr = data.stats?.winRate || 0.5;
  return Math.round(Math.abs(wr - 0.5) * 2 * 100) / 100;
}

function calculateComebackAbility(data: TeamData): number {
  return (data as any).comebackRate || 0.5;
}

function calculateEarlyGameStrength(data: TeamData): number {
  return (data as any).earlyGameWR || 0.5;
}

function calculateLateGameStrength(data: TeamData): number {
  return (data as any).lateGameWR || 0.5;
}

// ============================================================================
// Player Feature Extraction
// ============================================================================

export function extractPlayerFeatures(data: PlayerData): PlayerFeatures {
  const stats = data.stats || { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 };
  
  return {
    gamesPlayed: stats.gamesPlayed || 0,
    wins: stats.wins || 0,
    losses: stats.losses || 0,
    winRate: stats.winRate || 0.5,
    
    avgKills: (data as any).kills || 0,
    avgDeaths: (data as any).deaths || 0,
    avgAssists: (data as any).assists || 0,
    kda: calculatePlayerKDA(data),
    
    role: (data as any).role || 'unknown',
    performanceScore: calculatePerformanceScore(data),
    consistency: calculatePlayerConsistency(data),
    
    recentForm: calculateRecentForm(data),
    carryPotential: calculateCarryPotential(data),
  };
}

function calculatePlayerKDA(data: PlayerData): number {
  const kills = (data as any).kills || 0;
  const deaths = (data as any).deaths || 0;
  const assists = (data as any).assists || 0;
  
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / Math.max(deaths, 1)) * 100) / 100;
}

function calculatePerformanceScore(data: PlayerData): number {
  const kda = calculatePlayerKDA(data);
  const wr = (data.stats?.winRate || 0.5) * 100;
  return Math.round((kda * 10 + wr) / 2);
}

function calculatePlayerConsistency(data: PlayerData): number {
  return 0.7;
}

function calculateRecentForm(data: PlayerData): 'hot' | 'warm' | 'cold' {
  const recentKDA = (data as any).recentKDA || 3;
  if (recentKDA > 4) return 'hot';
  if (recentKDA < 2) return 'cold';
  return 'warm';
}

function calculateCarryPotential(data: PlayerData): number {
  const kda = calculatePlayerKDA(data);
  const role = (data as any).role || '';
  
  if (role === 'carry' || role === 'adc') return Math.min(1, kda / 5);
  if (role === 'jungle') return Math.min(1, kda / 4);
  return Math.min(1, kda / 3);
}

// ============================================================================
// Trend Features
// ============================================================================

export function extractTrendFeatures(
  currentData: TeamData | PlayerData,
  historicalData: TeamData[] | PlayerData[]
): TrendFeatures {
  const currentStats = currentData.stats || { winRate: 0.5 };
  const historicalAvgWR = historicalData.length > 0 
    ? historicalData.reduce((sum, d) => sum + (d.stats?.winRate || 0.5), 0) / historicalData.length
    : 0.5;
  
  return {
    winRateChange: Math.round((currentStats.winRate - historicalAvgWR) * 1000) / 1000,
    kdaChange: 0,
    formMomentum: calculateMomentum(currentData),
    fatigueIndex: 0,
    metaAdaptation: 0.5,
  };
}

function calculateMomentum(data: TeamData | PlayerData): number {
  const form = (data as any).formTrend || 'stable';
  switch (form) {
    case 'improving': return 0.7;
    case 'declining': return 0.3;
    default: return 0.5;
  }
}

// ============================================================================
// Matchup Features
// ============================================================================

export function extractMatchupFeatures(
  teamA: TeamData,
  teamB: TeamData
): MatchupFeatures {
  const wrA = teamA.stats?.winRate || 0.5;
  const wrB = teamB.stats?.winRate || 0.5;
  
  const teamAAdvantage = wrA - wrB;
  const teamBAdvantage = wrB - wrA;
  
  const kdaA = extractTeamFeatures(teamA).kda;
  const kdaB = extractTeamFeatures(teamB).kda;
  
  const featuresA = extractTeamFeatures(teamA);
  const featuresB = extractTeamFeatures(teamB);
  
  return {
    teamAAdvantage: Math.round(teamAAdvantage * 1000) / 1000,
    teamBAdvantage: Math.round(teamBAdvantage * 1000) / 1000,
    formDiff: featuresA.recentWinRate - featuresB.recentWinRate,
    eloDiff: 0,
    keyPlayerMatchups: [],
    predictedScoreDiff: Math.round((wrA - wrB) * 2),
    upsetPotential: Math.round(Math.abs(teamAAdvantage) * 10) / 10,
  };
}

// ============================================================================
// Feature Vector for ML Models
// ============================================================================

export function createFeatureVector(features: TeamFeatures): number[] {
  return [
    features.winRate,
    features.kda,
    features.recentWinRate,
    features.streak / 10,
    features.winConsistency,
    features.comebackAbility,
    features.earlyGameStrength,
    features.lateGameStrength,
    features.gamesPlayed / 100,
    features.wins / 100,
  ];
}

export function combineFeatureVectors(
  vectorA: number[],
  vectorB: number[]
): number[] {
  const combined: number[] = [];
  
  for (let i = 0; i < vectorA.length; i++) {
    combined.push(vectorA[i] - vectorB[i]);
  }
  
  return combined;
}

export default {
  extractTeamFeatures,
  extractPlayerFeatures,
  extractTrendFeatures,
  extractMatchupFeatures,
  createFeatureVector,
  combineFeatureVectors,
};

