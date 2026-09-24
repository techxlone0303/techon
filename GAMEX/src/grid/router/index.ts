/**
 * GRID Router Index - Export all router modules
 * 
 * This module provides the GRID Super Router v2:
 * - Intelligent endpoint routing (central-data vs stats-feed)
 * - Safe execution with retry logic
 * - Response normalization
 * - In-memory caching
 * - Team alias resolution
 * 
 * Usage (optional - existing code continues to work):
 * 
 * import { superGridQuery, resolveTeamAlias } from "../grid/router";
 * 
 * const result = await superGridQuery(query, variables);
 * console.log(result.normalized);
 */

export { detectGridEndpoint, detectOperationType, extractOperationName } from "./grid.schema.map";

export { 
  safeGridQuery, 
  clearQueryCache, 
  getCacheStats,
  SafeExecutorResult,
  SafeExecutorOptions,
} from "./grid.safe.executor";

export {
  normalizeTeam,
  normalizeTeams,
  normalizeTeamStats,
  normalizeTeamWithStats,
  normalizePlayer,
  normalizePlayers,
  normalizePlayerStats,
  normalizePlayerWithStats,
  normalizeResponse,
  createTeamProfile,
  NormalizedTeam,
  NormalizedPlayer,
  NormalizedEntity,
  TeamStatsSummary,
  PlayerStatsSummary,
} from "./grid.normalizer";

export {
  superGridQuery,
  getTeamById,
  getPlayerById,
  searchTeams,
  getTeamStatistics,
  getPlayerStatistics,
  getTeamsByGame,
  getPlayersByTeam,
  clearQueryCache as clearRouterCache,
  getCacheStats as getRouterCacheStats,
  resolveTeamAlias,
  getAllTeamAliases,
  TEAM_ALIASES,
  SuperRouterResult,
  SuperRouterOptions,
} from "./grid.super.router";

