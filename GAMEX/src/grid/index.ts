/**
 * ScoutIQ - Unified GRID Gateway
 * 
 * Central export point for all GRID API services
 * Each esports domain has its own dedicated service layer
 */

// ============================================================================
// Central Data API Services
// ============================================================================

export * from "./central/tournaments.service";
export * from "./central/series.service";
export * from "./central/organizations.service";
export * from "./central/teams.service";
export * from "./central/players.service";

// ============================================================================
// Statistics API Services
// ============================================================================

export * from "./stats/teamStats.service";
export * from "./stats/playerStats.service";

// ============================================================================
// Services Layer (Statistics + Series)
// ============================================================================

export {
  getTeamStats,
  TeamStatistics,
  TeamStatsResponse,
  getUpcomingSeries,
  getSeriesByTeam,
  SeriesInfo,
  UpcomingSeriesResponse
} from "../services/grid";

// ============================================================================
// Initialization Functions
// ============================================================================

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      const isRateLimit = error.message?.includes("rate limit") || 
                          error.message?.includes("UNAVAILABLE");
      
      if (!isRateLimit) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[GRID] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Initialize all GRID services (async version - recommended)
 * Called automatically when backend starts
 * Gracefully handles rate limits and failures
 */
export async function initializeAllGridServices(): Promise<void> {
  console.log("[GRID GATEWAY] Initializing all services...");
  
  try {
    // Central Data Services
    const tournaments = await import("./central/tournaments.service");
    const series = await import("./central/series.service");
    const teams = await import("./central/teams.service");
    const players = await import("./central/players.service");
    
    // Statistics Services
    const teamStats = await import("./stats/teamStats.service");
    const playerStats = await import("./stats/playerStats.service");

    // Initialize with retry and graceful error handling
    const initPromises = [
      retryWithBackoff(() => tournaments.initTournaments?.().catch(e => {
        console.warn("[GRID] Tournaments init skipped:", e.message);
      }), 1).catch(() => {}),
      retryWithBackoff(() => series.initSeries?.().catch(e => {
        console.warn("[GRID] Series init skipped:", e.message);
      }), 1).catch(() => {}),
      retryWithBackoff(() => teams.initTeams?.().catch(e => {
        console.warn("[GRID] Teams init skipped:", e.message);
      }), 1).catch(() => {}),
      retryWithBackoff(() => players.initPlayers?.().catch(e => {
        console.warn("[GRID] Players init skipped:", e.message);
      }), 1).catch(() => {}),
      retryWithBackoff(() => teamStats.initTeamStats?.().catch(e => {
        console.warn("[GRID] Team stats init skipped:", e.message);
      }), 1).catch(() => {}),
      retryWithBackoff(() => playerStats.initPlayerStats?.().catch(e => {
        console.warn("[GRID] Player stats init skipped:", e.message);
      }), 1).catch(() => {}),
    ];

    await Promise.all(initPromises);

    console.log("[GRID GATEWAY] All services initialized (some may be rate-limited)");
  } catch (err) {
    console.warn("[GRID GATEWAY] Service initialization completed with warnings:", err);
  }
}

/**
 * Initialize all GRID services (sync version - legacy)
 */
export function initializeGridServicesSync(): void {
  console.log("[GRID GATEWAY] Initializing all services (sync)...");
  
  // Central Data Services
  const { initialize: initTournaments } = require("./central/tournaments.service");
  const { initialize: initSeries } = require("./central/series.service");
  const { initialize: initOrganizations } = require("./central/organizations.service");
  const { initialize: initTeams } = require("./central/teams.service");
  const { initialize: initPlayers } = require("./central/players.service");
  
  // Statistics Services
  const { initialize: initTeamStats } = require("./stats/teamStats.service");
  const { initialize: initPlayerStats } = require("./stats/playerStats.service");

  // Initialize all services
  initTournaments();
  initSeries();
  initOrganizations();
  initTeams();
  initPlayers();
  initTeamStats();
  initPlayerStats();

  console.log("[GRID GATEWAY] All services initialized successfully");
}

/**
 * Check GRID API health
 */
export async function checkGridHealth(): Promise<{
  central: boolean;
  stats: boolean;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  try {
    // Test central API
    const { getTournaments } = await import("./central/tournaments.service");
    await getTournaments(1);
    
    // Test stats API
    const { getPlayerStats } = await import("./stats/playerStats.service");
    await getPlayerStats("test").catch(() => null);

    return {
      central: true,
      stats: true,
      timestamp,
    };
  } catch (err) {
    console.error("[GRID GATEWAY] Health check failed:", err);
    return {
      central: false,
      stats: false,
      timestamp,
    };
  }
}

export default {
  // Central Data
  ...require("./central/tournaments.service"),
  ...require("./central/series.service"),
  ...require("./central/organizations.service"),
  ...require("./central/teams.service"),
  ...require("./central/players.service"),
  
  // Statistics
  ...require("./stats/teamStats.service"),
  ...require("./stats/playerStats.service"),
  
  // Utilities
  initializeAllGridServices,
  initializeGridServicesSync,
  checkGridHealth,
};

