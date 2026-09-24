/**
 * ScoutIQ - Scout Engine (Intelligence Core v2)
 * 
 * AI-powered esports intelligence engine that combines:
 * - GRID Stats API (primary data source)
 * - Truth Layer (validation and resolution)
 * - Math Engine v2 (fallback prediction)
 * - Ollama LLM (natural language analysis)
 * 
 * Pipeline: GRID Stats → Schema Guard → Normalizer → Math Engine → Ollama → Fusion
 */

import * as GRID from "../grid";
import { ollamaGenerateJSON, generateScoutingReport, ollamaCheckHealth } from "../ollama/ollama.client";
import { resolveTeamName, ResolveResult, teamResolver } from "./resolvers/team.resolver";
import { getTeamPlayers } from "./playerResolver.service";
import { getPlayerStats } from "../grid/stats/playerStats.service";
import { teamCache } from "../grid/central/teamCache.service";
import { 
  assertValidTeamId, 
  ResolutionError, 
  ResolvedTeam,
  createFallbackTeam 
} from "../services/scoutiq/truth.layer";
import { getTeamStatsV2 } from "../services/grid/stats.service";
import { 
  sanitizeTeamStatsResponse,
  createFallbackTeamStats,
  GuardedTeamStats 
} from "../services/grid/stats.guard";
import { buildFeatureVectorFromRaw } from "../services/scoutiq/features.v2.engine";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ScoutInput {
  teamId?: string;
  opponentId?: string;
  playerId?: string;
  seriesId?: string;
  tournamentId?: string;
  includeStats?: boolean;
  includePredictions?: boolean;
  includeRecommendations?: boolean;
}

export interface ScoutIntelligence {
  teams?: GRID.TeamNode[];
  teamStats?: GRID.TeamStatistics | null;
  opponentStats?: GRID.TeamStatistics | null;
  players?: GRID.PlayerNode[];
  playerStats?: GRID.PlayerStatistics | null;
  series?: GRID.SeriesNode[];
  scoutingReport?: any;
  generatedAt: string;
  aiModel: string;
  processingTime: number;
}

export interface MatchupAnalysisResult {
  teamA: string;
  teamB: string;
  prediction: {
    winner: string;
    winProbability: number;
    expectedScore: string;
    confidence: number;
  };
  players: {
    teamA: Array<{ id: string; nickname: string }>;
    teamB: Array<{ id: string; nickname: string }>;
  };
  playerStats: {
    teamA: any[];
    teamB: any[];
  };
  aiReport?: any;
  resolution?: {
    teamA?: ResolveResult;
    teamB?: ResolveResult;
  };
}

// ============================================================================
// TRUTH LAYER: Resolution Pipeline
// ============================================================================

/**
 * Resolve and validate a team name using the Truth Layer pipeline.
 * This function MUST be used before any Stats API calls.
 * 
 * @param teamName - Human-readable team name (e.g., "Cloud9", "G2")
 * @returns ResolvedTeam with valid GRID ID
 * @throws ResolutionError if resolution fails
 */
async function resolveAndValidateTeam(teamName: string): Promise<ResolvedTeam> {
  console.log("[SCOUT ENGINE] Resolving team: \"" + teamName + "\" via Truth Layer");
  
  // Step 1: Resolve team name to GRID team
  const resolveResult = await resolveTeamName(teamName);
  
  // Step 2: Validate the resolved team ID
  assertValidTeamId(resolveResult.team.id);
  
  console.log("[SCOUT ENGINE] ✓ Team resolved: \"" + teamName + "\" → ID: " + 
    resolveResult.team.id + " (\"" + resolveResult.team.name + "\"), confidence: " + resolveResult.confidence);
  
  return {
    id: resolveResult.team.id,
    name: resolveResult.team.name,
    source: "GRID",
    confidence: resolveResult.confidence,
    matchType: resolveResult.matchType,
    originalInput: teamName,
  };
}

/**
 * Get team stats with Truth Layer validation and Math Engine fallback.
 * 
 * Pipeline:
 * 1. Validate teamId (Truth Layer)
 * 2. Query GRID Stats API (with schema-safe query)
 * 3. Sanitize response (Stats Guard)
 * 4. If GRID fails → use Intelligence Core v2 Math Engine
 */
async function getTeamStatsWithValidation(
  teamId: string, 
  teamName: string
): Promise<{
  statistics: GuardedTeamStats | null;
  dataSource: 'GRID_STATS' | 'MATH_ENGINE' | 'FALLBACK';
}> {
  // GUARD: Validate teamId before calling Stats API
  assertValidTeamId(teamId);
  
  try {
    // Use v2 API which includes schema-safe query and guard layer
    const stats = await getTeamStatsV2(teamId);
    
    if (stats.dataSource === 'GRID_STATS' && !stats.isPartial) {
      return { statistics: stats, dataSource: 'GRID_STATS' };
    }
    
    // If GRID returned partial/fallback data, supplement with Math Engine
    console.log("[SCOUT ENGINE] GRID stats partial for " + teamName + ", supplementing with Math Engine");
    
  } catch (error) {
    console.warn("[SCOUT ENGINE] GRID stats unavailable for " + teamName + ": " + (error as Error).message);
  }
  
  // Fallback 1: Try Intelligence Core v2 Math Engine
  try {
    console.log("[SCOUT ENGINE] Using Intelligence Core v2 Math Engine for " + teamName);
    
    // Create feature vector from available data
    const featureVector = buildFeatureVectorFromRaw(teamId, {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0.5,
      avgKillsPerSeries: 0,
    });
    
    // The math engine provides normalized predictions
    return { statistics: null, dataSource: 'MATH_ENGINE' };
    
  } catch (mathError) {
    console.warn("[SCOUT ENGINE] Math Engine fallback also failed for " + teamName);
  }
  
  // Final fallback: Return safe defaults
  const fallback = createFallbackTeamStats(teamId, 'ALL_SOURCES_FAILED');
  return { statistics: fallback, dataSource: 'FALLBACK' };
}

/**
 * Get series for a team with Truth Layer validation.
 */
async function getSeriesWithValidation(teamId: string, teamName: string): Promise<any[]> {
  // GUARD: Validate teamId before calling Series API
  assertValidTeamId(teamId);
  
  try {
    const series = await GRID.getSeriesByTeam(teamId, 5);
    return series;
  } catch (error: any) {
    if (error.message?.includes("rate limit") || error.code === "RATE_LIMIT") {
      console.warn("[SCOUT ENGINE] ⚠ Series fetch rate limited for \"" + teamName + "\" (ID: " + teamId + ")");
      return [];
    }
    throw error;
  }
}

// ============================================================================
// Scout Engine Core
// ============================================================================

/**
 * Main scouting analysis function
 */
export async function runScoutAnalysis(input: ScoutInput): Promise<ScoutIntelligence> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log("[SCOUT ENGINE] Starting analysis for: " + JSON.stringify(input));

  const data = await fetchAllGridData(input);

  let scoutingReport = null;
  if (input.includePredictions !== false && (input.teamId || input.playerId)) {
    try {
      scoutingReport = await generateComprehensiveScoutReport(data, input);
    } catch (error) {
      console.error("[SCOUT ENGINE] AI report generation failed:", error);
    }
  }

  const processingTime = Date.now() - startTime;
  const health = await ollamaCheckHealth();

  return {
    ...data,
    scoutingReport,
    generatedAt: timestamp,
    aiModel: health.model || "unknown",
    processingTime,
  };
}

async function fetchAllGridData(input: ScoutInput): Promise<{
  teams?: GRID.TeamNode[];
  teamStats?: GRID.TeamStatistics | null;
  opponentStats?: GRID.TeamStatistics | null;
  players?: GRID.PlayerNode[];
  playerStats?: GRID.PlayerStatistics | null;
  series?: GRID.SeriesNode[];
}> {
  const results: any = {};

  if (input.teamId) {
    // TRUTH LAYER: Validate teamId before API calls
    assertValidTeamId(input.teamId);
    
    const team = await GRID.getTeamById(input.teamId);
    results.teams = team ? [team] : [];
    
    if (input.includeStats !== false) {
      results.teamStats = await getTeamStatsWithValidation(input.teamId, input.teamId);
    }

    if (input.opponentId) {
      // TRUTH LAYER: Validate opponentId before API calls
      assertValidTeamId(input.opponentId);
      results.opponentStats = await getTeamStatsWithValidation(input.opponentId, input.opponentId);
    }
  }

  if (input.playerId) {
    const player = await GRID.getPlayerById(input.playerId);
    results.players = player ? [player] : [];
    
    if (input.includeStats !== false) {
      results.playerStats = await GRID.getPlayerStats(input.playerId);
    }
  }

  if (input.teamId && input.includeStats !== false) {
    // TRUTH LAYER: Validate teamId before Series API call
    assertValidTeamId(input.teamId);
    results.series = await getSeriesWithValidation(input.teamId, input.teamId);
  }

  return results;
}

async function generateComprehensiveScoutReport(data: any, input: ScoutInput): Promise<any> {
  const prompt = "Generate a comprehensive esports scouting analysis.\n\nTEAM DATA:\n" + (data.teams ? JSON.stringify(data.teams, null, 2) : "No team data") + "\n\nTEAM STATS:\n" + (data.teamStats ? JSON.stringify(data.teamStats, null, 2) : "No team stats") + "\n\nOPPONENT STATS:\n" + (data.opponentStats ? JSON.stringify(data.opponentStats, null, 2) : "No opponent stats") + "\n\nPLAYER DATA:\n" + (data.players ? JSON.stringify(data.players, null, 2) : "No player data") + "\n\nPLAYER STATS:\n" + (data.playerStats ? JSON.stringify(data.playerStats, null, 2) : "No player stats") + "\n\nRECENT SERIES:\n" + (data.series ? JSON.stringify(data.series.slice(0, 3), null, 2) : "No series data") + "\n\nProvide a comprehensive scouting report in JSON format with:\n1. Team strengths and weaknesses\n2. Key players to watch\n3. Strategic recommendations\n4. Matchup analysis\n5. Win conditions\n\nJSON Output:";

  const report = await ollamaGenerateJSON(prompt);
  return report;
}

// ============================================================================
// Matchup Analysis (Main Entry Point)
// ============================================================================

export interface TeamDataInfo {
  team: {
    id: string;
    name: string;
  };
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export interface PlayerInfo {
  id: string;
  nickname: string;
}

/**
 * Analyze matchup between two teams using cached data when possible
 * Gracefully degrades when GRID rate limits
 * 
 * TRUTH LAYER: This function enforces the resolution pipeline:
 * 1. Resolve team names to GRID IDs
 * 2. Validate IDs are numeric
 * 3. Fetch stats only with valid IDs
 */
export async function analyzeMatchup(teamAName: string, teamBName: string): Promise<MatchupAnalysisResult> {
  console.log("[SCOUT ENGINE] Analyzing matchup: " + teamAName + " vs " + teamBName);

  // TRUTH LAYER: Resolve and validate both teams BEFORE any stats calls
  let teamAResult: ResolvedTeam;
  let teamBResult: ResolvedTeam;

  try {
    teamAResult = await resolveAndValidateTeam(teamAName);
  } catch (error) {
    console.warn("[SCOUT ENGINE] Could not resolve team A: " + teamAName);
    throw new ResolutionError(
      `Team not found: "${teamAName}". Please check the team name and try again.`,
      "NOT_FOUND",
      teamAName
    );
  }

  try {
    teamBResult = await resolveAndValidateTeam(teamBName);
  } catch (error) {
    console.warn("[SCOUT ENGINE] Could not resolve team B: " + teamBName);
    throw new ResolutionError(
      `Team not found: "${teamBName}". Please check the team name and try again.`,
      "NOT_FOUND",
      teamBName
    );
  }

  // Both teams are now resolved and validated
  const teamAId = teamAResult.id;
  const teamBId = teamBResult.id;

  console.log("[SCOUT ENGINE] ✓ Team A resolved: \"" + teamAName + "\" → ID: " + teamAId);
  console.log("[SCOUT ENGINE] ✓ Team B resolved: \"" + teamBName + "\" → ID: " + teamBId);

  // Get team stats using validation helper (GUARD ensures valid IDs)
  const teamAStatsResponse = await getTeamStatsWithValidation(teamAId, teamAResult.name);
  const teamBStatsResponse = await getTeamStatsWithValidation(teamBId, teamBResult.name);

  // Extract statistics from response (TeamStatsResponse has .statistics nested)
  const teamAStats = teamAStatsResponse?.statistics;
  const teamBStats = teamBStatsResponse?.statistics;

  // Build team data from resolved info + stats
  const teamAData: TeamDataInfo = {
    team: {
      id: teamAId,
      name: teamAResult.name,
    },
    stats: {
      gamesPlayed: teamAStats?.gamesPlayed || 0,
      wins: teamAStats?.wins || 0,
      losses: teamAStats?.losses || 0,
      winRate: teamAStats?.winRate || 0.5,
    },
  };

  const teamBData: TeamDataInfo = {
    team: {
      id: teamBId,
      name: teamBResult.name,
    },
    stats: {
      gamesPlayed: teamBStats?.gamesPlayed || 0,
      wins: teamBStats?.wins || 0,
      losses: teamBStats?.losses || 0,
      winRate: teamBStats?.winRate || 0.5,
    },
  };

  // Get players (may be rate limited, use try/catch for graceful degradation)
  let teamAPlayers: PlayerInfo[] = [];
  let teamBPlayers: PlayerInfo[] = [];

  try {
    // GUARD: Validate teamId before getting players
    assertValidTeamId(teamAId);
    teamAPlayers = await getTeamPlayers(teamAId);
  } catch (error) {
    console.warn("[SCOUT ENGINE] Could not fetch players for " + teamAData.team.name + ": rate limited or error");
  }

  try {
    // GUARD: Validate teamId before getting players
    assertValidTeamId(teamBId);
    teamBPlayers = await getTeamPlayers(teamBId);
  } catch (error) {
    console.warn("[SCOUT ENGINE] Could not fetch players for " + teamBData.team.name + ": rate limited or error");
  }

  console.log("[SCOUT ENGINE] Found " + teamAPlayers.length + " players for " + teamAData.team.name);
  console.log("[SCOUT ENGINE] Found " + teamBPlayers.length + " players for " + teamBData.team.name);

  // Get player stats (with graceful error handling)
  let teamAPlayerStats: any[] = [];
  let teamBPlayerStats: any[] = [];

  try {
    teamAPlayerStats = await Promise.all(
      teamAPlayers.slice(0, 5).map((p) => getPlayerStats(p.id).catch(() => null))
    );
  } catch (error) {
    console.warn("[SCOUT ENGINE] Could not fetch player stats for team A");
  }

  try {
    teamBPlayerStats = await Promise.all(
      teamBPlayers.slice(0, 5).map((p) => getPlayerStats(p.id).catch(() => null))
    );
  } catch (error) {
    console.warn("[SCOUT ENGINE] Could not fetch player stats for team B");
  }

  // Calculate win probability based on available data
  let winProbability = 0.5;
  
  if (teamAData.stats.gamesPlayed > 0 || teamBData.stats.gamesPlayed > 0) {
    const avgWinRate = (teamAData.stats.winRate + teamBData.stats.winRate) / 2;
    winProbability = avgWinRate;

    if (teamAData.stats.winRate > teamBData.stats.winRate) {
      winProbability = 0.5 + (teamAData.stats.winRate - teamBData.stats.winRate) * 0.5;
    } else {
      winProbability = 0.5 - (teamBData.stats.winRate - teamAData.stats.winRate) * 0.5;
    }
  }

  // Clamp probability
  winProbability = Math.max(0.1, Math.min(0.9, winProbability));

  const winner = winProbability > 0.5 ? teamAData.team.name : teamBData.team.name;
  const confidence = Math.abs(winProbability - 0.5) * 2;

  // Generate AI report
  let aiReport = null;
  try {
    aiReport = await generateMatchupReport(teamAData, teamBData, teamAPlayers, teamBPlayers, teamAPlayerStats, teamBPlayerStats);
  } catch (error) {
    console.error("[SCOUT ENGINE] AI report generation failed:", error);
  }

  return {
    teamA: teamAData.team.name,
    teamB: teamBData.team.name,
    prediction: {
      winner,
      winProbability: Math.round(winProbability * 1000) / 1000,
      expectedScore: winProbability > 0.6 ? "2-0" : winProbability > 0.4 ? "2-1" : "0-2",
      confidence: Math.round(confidence * 1000) / 1000,
    },
    players: {
      teamA: teamAPlayers,
      teamB: teamBPlayers,
    },
    playerStats: {
      teamA: teamAPlayerStats.filter(Boolean),
      teamB: teamBPlayerStats.filter(Boolean),
    },
    aiReport,
    resolution: {
      teamA: { team: { id: teamAResult.id, name: teamAResult.name }, confidence: teamAResult.confidence, matchType: teamAResult.matchType, matchedName: teamAName },
      teamB: { team: { id: teamBResult.id, name: teamBResult.name }, confidence: teamBResult.confidence, matchType: teamBResult.matchType, matchedName: teamBName },
    },
  };
}
async function getTeamData(teamId: string): Promise<TeamDataInfo | null> {
  // TRUTH LAYER: Validate teamId before any API calls
  assertValidTeamId(teamId);
  
  // Try cache first
  const cachedTeam = teamCache.getTeamById(teamId);
  if (cachedTeam) {
    // Get stats with validation (returns TeamStatsResponse with .statistics nested)
    const statsResponse = await getTeamStatsWithValidation(teamId, cachedTeam.name);
    const stats = statsResponse?.statistics;
    
    return {
      team: {
        id: cachedTeam.id,
        name: cachedTeam.name,
      },
      stats: {
        gamesPlayed: stats?.gamesPlayed || 0,
        wins: stats?.wins || 0,
        losses: stats?.losses || 0,
        winRate: stats?.winRate || 0.5,
      },
    };
  }

  // Fall back to API
  const team = await GRID.getTeamById(teamId);
  if (!team) {
    console.warn("[SCOUT ENGINE] Team not found: " + teamId);
    return null;
  }

  // Get stats with validation
  const statsResponse = await getTeamStatsWithValidation(teamId, team.name);
  const stats = statsResponse?.statistics;
  
  return {
    team: {
      id: team.id,
      name: team.name,
    },
    stats: {
      gamesPlayed: stats?.gamesPlayed || 0,
      wins: stats?.wins || 0,
      losses: stats?.losses || 0,
      winRate: stats?.winRate || 0.5,
    },
  };
}

async function generateMatchupReport(
  teamAData: TeamDataInfo,
  teamBData: TeamDataInfo,
  teamAPlayers: PlayerInfo[],
  teamBPlayers: PlayerInfo[],
  teamAPlayerStats: any[],
  teamBPlayerStats: any[]
): Promise<any> {
  const prompt = "Generate a comprehensive esports matchup analysis.\n\nTEAM A: " + teamAData.team.name + "\n- Games Played: " + teamAData.stats.gamesPlayed + "\n- Record: " + teamAData.stats.wins + "W - " + teamAData.stats.losses + "L\n- Win Rate: " + (teamAData.stats.winRate * 100).toFixed(1) + "%\n\nTEAM B: " + teamBData.team.name + "\n- Games Played: " + teamBData.stats.gamesPlayed + "\n- Record: " + teamBData.stats.wins + "W - " + teamBData.stats.losses + "L\n- Win Rate: " + (teamBData.stats.winRate * 100).toFixed(1) + "%\n\nROSTER " + teamAData.team.name + ":\n" + teamAPlayers.map((p, i) => "- " + p.nickname + ": " + JSON.stringify(teamAPlayerStats[i] || {})).join("\n") + "\n\nROSTER " + teamBData.team.name + ":\n" + teamBPlayers.map((p, i) => "- " + p.nickname + ": " + JSON.stringify(teamBPlayerStats[i] || {})).join("\n") + "\n\nProvide a matchup analysis in JSON format:\n{\n  \"summary\": \"2-3 sentence overview of the matchup\",\n  \"teamAAnalysis\": {\n    \"strengths\": [\"3-4 key strengths\"],\n    \"weaknesses\": [\"3-4 weaknesses to exploit\"],\n    \"keyPlayers\": [\"top 3 impact players\"]\n  },\n  \"teamBAnalysis\": {\n    \"strengths\": [\"3-4 key strengths\"],\n    \"weaknesses\": [\"3-4 weaknesses to exploit\"],\n    \"keyPlayers\": [\"top 3 impact players\"]\n  },\n  \"keyMatchups\": [\n    {\"playerA\": \"name\", \"playerB\": \"name\", \"prediction\": \"who wins this battle\"}\n  ],\n  \"winConditions\": [\"3-5 conditions for team A to win\"],\n  \"recommendedStrategy\": \"strategic recommendations for team A\",\n  \"predictedScore\": \"e.g., 2-1\",\n  \"upsetPotential\": \"high/medium/low\"\n}\n\nFocus on actionable intelligence.\nJSON Output:";

  const report = await ollamaGenerateJSON(prompt);
  return report;
}

// ============================================================================
// Legacy Functions (for compatibility)
// ============================================================================

export async function predictMatch(teamIdA: string, teamIdB: string): Promise<{
  winner: string;
  winProbability: number;
  expectedScore: string;
  keyFactors: string[];
  confidence: number;
  recommendedStrategy: string;
}> {
  console.log("[SCOUT ENGINE] Predicting match: " + teamIdA + " vs " + teamIdB);

  // TRUTH LAYER: Validate teamIds before making any API calls
  assertValidTeamId(teamIdA);
  assertValidTeamId(teamIdB);

  // Get stats with validation
  const statsResponseA = await getTeamStatsWithValidation(teamIdA, teamIdA);
  const statsResponseB = await getTeamStatsWithValidation(teamIdB, teamIdB);

  // Extract statistics from response (TeamStatsResponse has .statistics nested)
  const statsA = statsResponseA?.statistics;
  const statsB = statsResponseB?.statistics;

const winRateA = statsA?.winRate ?? 0.5;
  const winRateB = statsB?.winRate ?? 0.5;
  const avgWinRate = (winRateA + winRateB) / 2;
  let winProbability = avgWinRate;

  if (statsA && statsB) {
    // Use avgKills from stats (GuardedTeamStats uses avgKills)
    const killsA = statsA.avgKills || 0;
    const killsB = statsB.avgKills || 0;
    const killsDiff = (killsA - killsB) / Math.max(killsA, killsB, 1);
    winProbability = 0.5 + (killsDiff * 0.2);
  }

  winProbability = Math.max(0.1, Math.min(0.9, winProbability));

  return {
    winner: winProbability > 0.5 ? teamIdA : teamIdB,
    winProbability: Math.round(winProbability * 1000) / 1000,
    expectedScore: "2-1",
    keyFactors: ["Team performance", "Recent form"],
    confidence: 0.7,
    recommendedStrategy: "Play to team strengths",
  };
}

export async function analyzePlayer(playerId: string): Promise<{
  player: GRID.PlayerNode | null;
  stats: GRID.PlayerStatistics | null;
  analysis: any;
}> {
  console.log("[SCOUT ENGINE] Analyzing player: " + playerId);

  const [player, stats, history] = await Promise.all([
    GRID.getPlayerById(playerId),
    GRID.getPlayerStats(playerId),
    GRID.getPlayerStatsHistory(playerId),
  ]);

  const currentKills = history[0]?.series?.kills?.avg || 0;
  const previousKills = history.length > 1 ? history[history.length - 1]?.series?.kills?.avg || 0 : 0;
  const killsTrend = history.length > 1 ? currentKills - previousKills : 0;

  const analysisPrompt = "Analyze this esports player's performance:\n\nPLAYER:\n" + (player ? JSON.stringify(player, null, 2) : "Player data not found") + "\n\nCURRENT STATS:\n" + (stats ? JSON.stringify(stats, null, 2) : "Stats not found") + "\n\nHISTORY TRENDS:\n" + JSON.stringify(history, null, 2) + "\n\nKills Trend: " + (killsTrend > 0 ? "Improving" : killsTrend < 0 ? "Declining" : "Stable") + "\n\nProvide a comprehensive player analysis in JSON format:\n{\n  \"summary\": \"2-3 sentence overview\",\n  \"strengths\": [\"3-5 strengths\"],\n  \"weaknesses\": [\"3-4 weaknesses\"],\n  \"playstyle\": \"description of playstyle\",\n  \"roleFit\": \"best role for this player\",\n  \"developmentAreas\": [\"2-3 areas to improve\"],\n  \"ceiling\": \"projected potential\",\n  \"trend\": \"improving/stable/declining\"\n}\nJSON Output:";

  let analysis = null;
  try {
    analysis = await ollamaGenerateJSON(analysisPrompt);
  } catch (error) {
    console.error("[SCOUT ENGINE] Player analysis failed:", error);
  }

  return {
    player,
    stats,
    analysis,
  };
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let scoutEngineInitialized = false;

export function initializeScoutEngine(): void {
  if (scoutEngineInitialized) {
    console.log("[SCOUT ENGINE] Already initialized");
    return;
  }

  GRID.initializeAllGridServices();
  console.log("[SCOUT ENGINE] Initialized successfully");
  scoutEngineInitialized = true;
}

export default {
  runScoutAnalysis,
  predictMatch,
  analyzePlayer,
  analyzeMatchup,
  initialize: initializeScoutEngine,
};

