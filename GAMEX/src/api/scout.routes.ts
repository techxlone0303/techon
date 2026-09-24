/**
 * ScoutIQ - Scout API Routes
 * 
 * REST API endpoints for esports scouting intelligence
 * All routes are prefixed with /api/v1/scout
 */

import { Router, Request, Response } from "express";
import { runScoutAnalysis, analyzeMatchup, predictMatch, analyzePlayer, initializeScoutEngine } from "../scout/scout.engine";
import { getTeams, searchTeamsByName, getTeamById } from "../grid/central/teams.service";
import { getPlayers, searchPlayers, getPlayersByTeam } from "../grid/central/players.service";
import { getTeamStats, getTeamStatsHistory, getTeamMapStats } from "../grid/stats/teamStats.service";
import { getPlayerStats, getPlayerStatsHistory } from "../grid/stats/playerStats.service";

const router = Router();

// ============================================================================
// Health & Status
// ============================================================================

router.get("/health", async (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    components: {
      scoutEngine: "ready",
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Scouting Analysis
// ============================================================================

router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { teamId, opponentId, playerId, seriesId, tournamentId, includeStats, includePredictions } = req.body;

    if (!teamId && !playerId) {
      return res.status(400).json({ error: "Either teamId or playerId is required" });
    }

    const result = await runScoutAnalysis({
      teamId,
      opponentId,
      playerId,
      seriesId,
      tournamentId,
      includeStats: includeStats ?? true,
      includePredictions: includePredictions ?? true,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[SCOUT API] Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Matchup Analysis
// ============================================================================

router.post("/matchup", async (req: Request, res: Response) => {
  try {
    const { teamA, teamB } = req.body;

    if (!teamA || !teamB) {
      return res.status(400).json({ error: "Both teamA and teamB are required" });
    }

    console.log("[SCOUT API] Analyzing matchup: " + teamA + " vs " + teamB);

    const result = await analyzeMatchup(teamA, teamB);

    res.json(result);
  } catch (error: any) {
    console.error("[SCOUT API] Matchup analysis error:", error);
    
    if (error.message?.includes("Team not found")) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Match Predictions
// ============================================================================

router.post("/predict", async (req: Request, res: Response) => {
  try {
    const { teamAId, teamBId } = req.body;

    if (!teamAId || !teamBId) {
      return res.status(400).json({ error: "Both teamAId and teamBId are required" });
    }

    const prediction = await predictMatch(teamAId, teamBId);
    res.json(prediction);
  } catch (error: any) {
    console.error("[SCOUT API] Prediction error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Player Analysis
// ============================================================================

router.post("/player", async (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: "playerId is required" });
    }

    const analysis = await analyzePlayer(playerId);
    res.json(analysis);
  } catch (error: any) {
    console.error("[SCOUT API] Player analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Team Data Routes
// ============================================================================

router.get("/teams", async (req: Request, res: Response) => {
  try {
    const { limit, search } = req.query;

    let teams;
    if (search) {
      teams = await searchTeamsByName(search as string, parseInt(limit as string) || 10);
    } else {
      teams = await getTeams(parseInt(limit as string) || 10);
    }

    res.json({ teams });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/teams/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const team = await getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ team });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/teams/:teamId/stats", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const [stats, history, mapStats] = await Promise.all([
      getTeamStats(teamId),
      getTeamStatsHistory(teamId),
      getTeamMapStats(teamId),
    ]);

    res.json({ stats, history, mapStats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Player Data Routes
// ============================================================================

router.get("/players", async (req: Request, res: Response) => {
  try {
    const { limit, search, teamId } = req.query;

    let players;
    if (search) {
      players = await searchPlayers(search as string, parseInt(limit as string) || 10);
    } else if (teamId) {
      players = await getPlayersByTeam(teamId as string);
    } else {
      players = await getPlayers(parseInt(limit as string) || 10);
    }

    res.json({ players });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/players/:playerId/stats", async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const [stats, history] = await Promise.all([
      getPlayerStats(playerId),
      getPlayerStatsHistory(playerId),
    ]);

    res.json({ stats, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Initialization
// ============================================================================

router.post("/init", async (req: Request, res: Response) => {
  try {
    initializeScoutEngine();
    res.json({ status: "initialized", service: "scout" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

