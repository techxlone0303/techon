/**
 * ScoutIQ - Team Statistics Service (Schema-Safe v2)
 * 
 * Uses schema-safe queries from stats.schema.ts and guard layer from stats.guard.ts
 * This service is resilient to GRID schema changes and always returns valid data.
 */

import { GridError } from './client';
import { assertValidTeamId } from '../scoutiq/truth.layer';
import { 
  SAFE_TEAM_STATS_QUERY, 
  DEFAULT_STATS_FILTER,
  queryTeamStatsSafe 
} from './stats.schema';
import { 
  sanitizeTeamStatsResponse, 
  createFallbackTeamStats,
  GuardedTeamStats 
} from './stats.guard';

// ============================================================================
// Service Types (Backward Compatible)
// ============================================================================

export interface TeamStatistics {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKillsPerSeries: number;
  seriesCount: number;
  seriesWinRate: number;
}

export interface TeamStatsResponse {
  teamId: string;
  statistics: TeamStatistics | null;
  fetchedAt: string;
  dataSource: 'GRID_STATS' | 'FALLBACK' | 'NO_DATA' | 'NONE';
  isPartial?: boolean;
}

// ============================================================================
// Main Service Function
// ============================================================================

export async function getTeamStats(
  teamId: string
): Promise<TeamStatsResponse> {
  // Validate input
  if (!teamId || teamId.trim() === '') {
    throw new GridError('Team ID is required', undefined, 'INVALID_INPUT');
  }

  // TRUTH LAYER GUARD: Validate teamId before making API call
  // This ensures we never call Stats API with team names
  assertValidTeamId(teamId);

  try {
    // Use schema-safe query with automatic fallback
    const rawData = await queryTeamStatsSafe(teamId, DEFAULT_STATS_FILTER);
    
    // Sanitize response using guard layer
    const guardedStats = sanitizeTeamStatsResponse(rawData, teamId);
    
    // Convert to legacy format for backward compatibility
    return {
      teamId,
      statistics: {
        gamesPlayed: guardedStats.gamesPlayed,
        wins: guardedStats.wins,
        losses: guardedStats.losses,
        winRate: guardedStats.winRate,
        avgKillsPerSeries: guardedStats.avgKills,
        seriesCount: guardedStats.seriesCount,
        seriesWinRate: guardedStats.winRate, // Use game win rate as proxy
      },
      fetchedAt: new Date().toISOString(),
      dataSource: guardedStats.dataSource,
      isPartial: guardedStats.isPartial,
    };
    
  } catch (error) {
    // Graceful degradation: return fallback stats
    console.warn(`[TEAM STATS SERVICE] Stats unavailable for ${teamId}, using fallback: ${(error as Error).message}`);
    
    const fallbackStats = createFallbackTeamStats(teamId, (error as Error).message);
    
    return {
      teamId,
      statistics: {
        gamesPlayed: fallbackStats.gamesPlayed,
        wins: fallbackStats.wins,
        losses: fallbackStats.losses,
        winRate: fallbackStats.winRate,
        avgKillsPerSeries: fallbackStats.avgKills,
        seriesCount: fallbackStats.seriesCount,
        seriesWinRate: fallbackStats.winRate,
      },
      fetchedAt: new Date().toISOString(),
      dataSource: 'FALLBACK',
      isPartial: true,
    };
  }
}

// ============================================================================
// New v2 API: Returns GuardedStats (recommended for new code)
// ============================================================================

/**
 * Get team stats using the new guard layer
 * Returns full statistics with metadata about data source and completeness
 */
export async function getTeamStatsV2(
  teamId: string
): Promise<GuardedTeamStats> {
  if (!teamId || teamId.trim() === '') {
    throw new GridError('Team ID is required', undefined, 'INVALID_INPUT');
  }

  assertValidTeamId(teamId);

  try {
    const rawData = await queryTeamStatsSafe(teamId, DEFAULT_STATS_FILTER);
    return sanitizeTeamStatsResponse(rawData, teamId);
  } catch (error) {
    return createFallbackTeamStats(teamId, (error as Error).message);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get team stats with caching
 */
export async function getTeamStatsCached(
  teamId: string,
  maxAgeMs: number = 300000 // 5 minutes
): Promise<TeamStatsResponse> {
  const cacheKey = `team_stats_${teamId}`;
  
  // Check cache (simple implementation - in production use Redis)
  const cached = getTeamStatsFromMemoryCache(cacheKey, maxAgeMs);
  if (cached) return cached;
  
  // Fetch fresh data
  const fresh = await getTeamStats(teamId);
  
  // Cache result
  setTeamStatsInMemoryCache(cacheKey, fresh);
  
  return fresh;
}

// ============================================================================
// Simple In-Memory Cache (for backward compatibility)
// ============================================================================

interface CacheEntry {
  data: TeamStatsResponse;
  timestamp: number;
}

const memoryCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getTeamStatsFromMemoryCache(key: string, maxAgeMs: number): TeamStatsResponse | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > maxAgeMs) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setTeamStatsInMemoryCache(key: string, data: TeamStatsResponse): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear team stats cache
 */
export function clearTeamStatsCache(): void {
  memoryCache.clear();
  console.log('[TEAM STATS SERVICE] Cache cleared');
}

export default {
  getTeamStats,
  getTeamStatsV2,
  getTeamStatsCached,
  clearTeamStatsCache,
};

