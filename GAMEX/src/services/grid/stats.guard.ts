/**
 * ScoutIQ - GRID Stats Guard Layer
 * 
 * Provides automatic protection against schema changes and invalid responses.
 * Sanitizes and normalizes GRID Stats API responses.
 * 
 * If GRID rejects fields or changes schema, this guard:
 * 1. Extracts only known valid fields
 * 2. Provides sensible defaults for missing data
 * 3. Never throws - always returns safe, normalized output
 */

import { GridError } from './client';

// ============================================================================
// Guard Types
// ============================================================================

export interface GuardedTeamStats {
  teamId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  totalKills: number;
  avgDeaths: number;
  totalDeaths: number;
  avgAssists: number;
  totalAssists: number;
  kda: number;
  seriesCount: number;
  dataSource: 'GRID_STATS' | 'FALLBACK' | 'NONE';
  rawResponse?: any;
  isPartial: boolean;
}

export interface GuardedPlayerStats {
  playerId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  totalKills: number;
  avgDeaths: number;
  totalDeaths: number;
  avgAssists: number;
  totalAssists: number;
  kda: number;
  seriesCount: number;
  dataSource: 'GRID_STATS' | 'FALLBACK' | 'NONE';
  rawResponse?: any;
  isPartial: boolean;
}

export interface StatsGuardConfig {
  /** Maximum age of cached stats (ms) */
  maxCacheAge: number;
  /** Enable fallback to math engine */
  enableMathFallback: boolean;
  /** Log schema errors */
  logSchemaErrors: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_STATS_GUARD_CONFIG: StatsGuardConfig = {
  maxCacheAge: 5 * 60 * 1000, // 5 minutes
  enableMathFallback: true,
  logSchemaErrors: true,
};

// ============================================================================
// Response Sanitization
// ============================================================================

/**
 * Sanitize team statistics response - extracts only valid fields
 * Returns safe, normalized output regardless of GRID response shape
 */
export function sanitizeTeamStatsResponse(
  data: any,
  teamId: string,
  options: { isPartial?: boolean } = {}
): GuardedTeamStats {
  const { isPartial = false } = options;
  
  // Handle null/undefined response
  if (!data?.teamStatistics) {
    return createEmptyTeamStats(teamId, isPartial);
  }
  
  const stats = data.teamStatistics;
  const game = stats.game;
  const series = stats.series;
  const segment = stats.segment;
  
  // Safely extract values with defaults
  const gamesPlayed = safeNumber(game?.count, 0);
  const wins = safeNumber(game?.wins?.value, 0);
  const losses = gamesPlayed > 0 ? gamesPlayed - wins : 0;
  const winRate = safeNumber(game?.wins?.percentage, gamesPlayed > 0 ? wins / gamesPlayed : 0);
  
  const kills = series?.kills || {};
  const avgKills = safeNumber(kills.avg, 0);
  const totalKills = safeNumber(kills.sum, 0);
  
  const deaths = segment?.deaths || {};
  const avgDeaths = safeNumber(deaths.avg, 0);
  const totalDeaths = safeNumber(deaths.sum, 0);
  
  // No assists in team stats, use 0
  const avgAssists = 0;
  const totalAssists = 0;
  
  // Calculate KDA: (kills + assists) / deaths
  const kda = avgDeaths > 0 
    ? Math.round((avgKills + avgAssists) / avgDeaths * 100) / 100
    : avgKills + avgAssists;
  
  const seriesCount = safeNumber(series?.count, 0);
  
  return {
    teamId,
    gamesPlayed,
    wins,
    losses,
    winRate: Math.round(winRate * 1000) / 1000,
    avgKills: Math.round(avgKills * 100) / 100,
    totalKills,
    avgDeaths: Math.round(avgDeaths * 100) / 100,
    totalDeaths,
    avgAssists,
    totalAssists,
    kda: Math.round(kda * 100) / 100,
    seriesCount,
    dataSource: 'GRID_STATS',
    rawResponse: data,
    isPartial,
  };
}

/**
 * Sanitize player statistics response - extracts only valid fields
 */
export function sanitizePlayerStatsResponse(
  data: any,
  playerId: string,
  options: { isPartial?: boolean } = {}
): GuardedPlayerStats {
  const { isPartial = false } = options;
  
  // Handle null/undefined response
  if (!data?.playerStatistics) {
    return createEmptyPlayerStats(playerId, isPartial);
  }
  
  const stats = data.playerStatistics;
  const game = stats.game;
  const series = stats.series;
  const segment = stats.segment;
  
  // Safely extract values with defaults
  const gamesPlayed = safeNumber(game?.count, 0);
  const wins = safeNumber(game?.wins?.value, 0);
  const losses = gamesPlayed > 0 ? gamesPlayed - wins : 0;
  const winRate = safeNumber(game?.wins?.percentage, gamesPlayed > 0 ? wins / gamesPlayed : 0);
  
  const kills = series?.kills || {};
  const avgKills = safeNumber(kills.avg, 0);
  const totalKills = safeNumber(kills.sum, 0);
  
  const deaths = series?.deaths || {};
  const avgDeaths = safeNumber(deaths.avg, 0);
  const totalDeaths = safeNumber(deaths.sum, 0);
  
  const assists = series?.assists || {};
  const avgAssists = safeNumber(assists.avg, 0);
  const totalAssists = safeNumber(assists.sum, 0);
  
  // Calculate KDA: (kills + assists) / deaths
  const kda = avgDeaths > 0 
    ? Math.round((avgKills + avgAssists) / avgDeaths * 100) / 100
    : avgKills + avgAssists;
  
  const seriesCount = safeNumber(series?.count, 0);
  
  return {
    playerId,
    gamesPlayed,
    wins,
    losses,
    winRate: Math.round(winRate * 1000) / 1000,
    avgKills: Math.round(avgKills * 100) / 100,
    totalKills,
    avgDeaths: Math.round(avgDeaths * 100) / 100,
    totalDeaths,
    avgAssists: Math.round(avgAssists * 100) / 100,
    totalAssists,
    kda: Math.round(kda * 100) / 100,
    seriesCount,
    dataSource: 'GRID_STATS',
    rawResponse: data,
    isPartial,
  };
}

// ============================================================================
// Fallback Generation
// ============================================================================

/**
 * Generate fallback team stats when GRID is unavailable
 * Uses default values that allow the math engine to still function
 */
export function createFallbackTeamStats(
  teamId: string,
  reason: string = 'GRID_UNAVAILABLE'
): GuardedTeamStats {
  console.warn(`[STATS GUARD] Creating fallback for team ${teamId}: ${reason}`);
  
  return {
    teamId,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0.5, // Neutral default
    avgKills: 0,
    totalKills: 0,
    avgDeaths: 0,
    totalDeaths: 0,
    avgAssists: 0,
    totalAssists: 0,
    kda: 2.5, // Reasonable default
    seriesCount: 0,
    dataSource: 'FALLBACK',
    isPartial: true,
  };
}

/**
 * Generate fallback player stats when GRID is unavailable
 */
export function createFallbackPlayerStats(
  playerId: string,
  reason: string = 'GRID_UNAVAILABLE'
): GuardedPlayerStats {
  console.warn(`[STATS GUARD] Creating fallback for player ${playerId}: ${reason}`);
  
  return {
    playerId,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0.5,
    avgKills: 0,
    totalKills: 0,
    avgDeaths: 0,
    totalDeaths: 0,
    avgAssists: 0,
    totalAssists: 0,
    kda: 2.0,
    seriesCount: 0,
    dataSource: 'FALLBACK',
    isPartial: true,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function safeNumber(value: any, defaultValue: number): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function createEmptyTeamStats(teamId: string, isPartial: boolean): GuardedTeamStats {
  return {
    teamId,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0.5,
    avgKills: 0,
    totalKills: 0,
    avgDeaths: 0,
    totalDeaths: 0,
    avgAssists: 0,
    totalAssists: 0,
    kda: 2.5,
    seriesCount: 0,
    dataSource: 'NONE',
    isPartial,
  };
}

function createEmptyPlayerStats(playerId: string, isPartial: boolean): GuardedPlayerStats {
  return {
    playerId,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0.5,
    avgKills: 0,
    totalKills: 0,
    avgDeaths: 0,
    totalDeaths: 0,
    avgAssists: 0,
    totalAssists: 0,
    kda: 2.0,
    seriesCount: 0,
    dataSource: 'NONE',
    isPartial,
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Determine if an error is a schema-related error
 */
export function isSchemaError(error: any): boolean {
  if (error instanceof GridError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('validation error') ||
      message.includes('missing field') ||
      message.includes('field undefined') ||
      message.includes('type mismatch') ||
      message.includes('wrong type')
    );
  }
  return false;
}

/**
 * Handle schema errors gracefully
 */
export function handleSchemaError(
  error: any,
  fallbackValue: any,
  context: string
): any {
  if (isSchemaError(error)) {
    console.warn(`[STATS GUARD] Schema error in ${context}: ${error.message}`);
    console.warn(`[STATS GUARD] Returning fallback value`);
    return fallbackValue;
  }
  // Re-throw non-schema errors
  throw error;
}

// ============================================================================
// Stats Cache (Simple in-memory)
// ============================================================================

interface CachedStats {
  data: GuardedTeamStats | GuardedPlayerStats;
  timestamp: number;
}

const statsCache: Map<string, CachedStats> = new Map();
const CACHE_TTL = DEFAULT_STATS_GUARD_CONFIG.maxCacheAge;

/**
 * Get cached stats if still valid
 */
export function getCachedStats(key: string): GuardedTeamStats | GuardedPlayerStats | null {
  const cached = statsCache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    statsCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Cache stats with timestamp
 */
export function cacheStats(key: string, data: GuardedTeamStats | GuardedPlayerStats): void {
  statsCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear all cached stats
 */
export function clearStatsCache(): void {
  statsCache.clear();
  console.log('[STATS GUARD] Cache cleared');
}

export default {
  sanitizeTeamStatsResponse,
  sanitizePlayerStatsResponse,
  createFallbackTeamStats,
  createFallbackPlayerStats,
  isSchemaError,
  handleSchemaError,
  getCachedStats,
  cacheStats,
  clearStatsCache,
  DEFAULT_STATS_GUARD_CONFIG,
};

