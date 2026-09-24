/**
 * ScoutIQ Intelligence Layer - Elo Rating Engine
 * 
 * Standard Elo rating implementation with K-factor for rating updates.
 * 
 * Elo Formula:
 * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 * 
 * Rating Update:
 * R'_A = R_A + K * (S_A - E_A)
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface EloRating {
  id: string;
  rating: number;
  gamesPlayed: number;
  lastUpdated: Date;
}

export interface EloConfig {
  initialRating: number;
  kFactor: number;
  homeAdvantage: number;
  maxRatingChange: number;
}

export interface EloPrediction {
  expectedScoreA: number;
  expectedScoreB: number;
  winProbabilityA: number;
  winProbabilityB: number;
  ratingImpact: {
    winA: number;
    winB: number;
    drawA: number;
    drawB: number;
  };
}

export interface MatchResultInput {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  isDraw: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_ELO_CONFIG: EloConfig = {
  initialRating: 1200,
  kFactor: 32,
  homeAdvantage: 25,
  maxRatingChange: 64,
};

// ============================================================================
// In-Memory Rating Store
// ============================================================================

const teamRatings: Map<string, EloRating> = new Map();
const playerRatings: Map<string, EloRating> = new Map();

// ============================================================================
// Core Elo Functions
// ============================================================================

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateRating(
  currentRating: number,
  actualScore: number,
  expectedScore: number,
  kFactor: number = DEFAULT_ELO_CONFIG.kFactor
): number {
  const rawChange = kFactor * (actualScore - expectedScore);
  const sign = rawChange >= 0 ? 1 : -1;
  const magnitude = Math.min(Math.abs(rawChange), DEFAULT_ELO_CONFIG.maxRatingChange);
  return currentRating + sign * magnitude;
}

export function getRating(id: string, isPlayer: boolean = false): EloRating {
  const store = isPlayer ? playerRatings : teamRatings;
  
  if (!store.has(id)) {
    const rating: EloRating = {
      id,
      rating: DEFAULT_ELO_CONFIG.initialRating,
      gamesPlayed: 0,
      lastUpdated: new Date(),
    };
    store.set(id, rating);
  }
  
  return store.get(id)!;
}

export function getTeamRating(teamId: string): EloRating {
  return getRating(teamId, false);
}

export function getPlayerRating(playerId: string): EloRating {
  return getRating(playerId, true);
}

export function predictMatch(
  teamAId: string,
  teamBId: string,
  config: EloConfig = DEFAULT_ELO_CONFIG
): EloPrediction {
  const ratingA = getRating(teamAId);
  const ratingB = getRating(teamBId);
  
  const adjustedRatingB = ratingB.rating - config.homeAdvantage;
  const expectedA = calculateExpectedScore(ratingA.rating, adjustedRatingB);
  const expectedB = calculateExpectedScore(ratingB.rating, ratingA.rating + config.homeAdvantage);
  
  return {
    expectedScoreA: Math.round(expectedA * 1000) / 1000,
    expectedScoreB: Math.round(expectedB * 1000) / 1000,
    winProbabilityA: Math.round(expectedA * 1000) / 1000,
    winProbabilityB: Math.round(expectedB * 1000) / 1000,
    ratingImpact: {
      winA: Math.round(config.kFactor * (1 - expectedA) * 10) / 10,
      winB: Math.round(config.kFactor * (1 - expectedB) * 10) / 10,
      drawA: Math.round(config.kFactor * (0.5 - expectedA) * 10) / 10,
      drawB: Math.round(config.kFactor * (0.5 - expectedB) * 10) / 10,
    },
  };
}

export function processMatchResult(
  result: MatchResultInput,
  config: EloConfig = DEFAULT_ELO_CONFIG
): { ratingA: EloRating; ratingB: EloRating } {
  const ratingA = getRating(result.teamAId);
  const ratingB = getRating(result.teamBId);
  
  const adjustedRatingB = ratingB.rating - config.homeAdvantage;
  const expectedA = calculateExpectedScore(ratingA.rating, adjustedRatingB);
  const expectedB = calculateExpectedScore(ratingB.rating, ratingA.rating + config.homeAdvantage);
  
  let actualScoreA: number;
  let actualScoreB: number;
  
  if (result.isDraw) {
    actualScoreA = 0.5;
    actualScoreB = 0.5;
  } else if (result.scoreA > result.scoreB) {
    actualScoreA = 1;
    actualScoreB = 0;
  } else {
    actualScoreA = 0;
    actualScoreB = 1;
  }
  
  const newRatingA = updateRating(ratingA.rating, actualScoreA, expectedA, config.kFactor);
  const newRatingB = updateRating(ratingB.rating, actualScoreB, expectedB, config.kFactor);
  
  ratingA.rating = newRatingA;
  ratingA.gamesPlayed++;
  ratingA.lastUpdated = new Date();
  
  ratingB.rating = newRatingB;
  ratingB.gamesPlayed++;
  ratingB.lastUpdated = new Date();
  
  teamRatings.set(result.teamAId, ratingA);
  teamRatings.set(result.teamBId, ratingB);
  
  return { ratingA, ratingB };
}

export function getTeamRankings(): EloRating[] {
  return Array.from(teamRatings.values())
    .sort((a, b) => b.rating - a.rating);
}

export function resetRatings(): void {
  teamRatings.clear();
  playerRatings.clear();
}

export default {
  calculateExpectedScore,
  updateRating,
  getTeamRating,
  getPlayerRating,
  predictMatch,
  processMatchResult,
  getTeamRankings,
  resetRatings,
  DEFAULT_ELO_CONFIG,
};

