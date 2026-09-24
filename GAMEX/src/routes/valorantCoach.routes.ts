import { Router, Request, Response } from "express";
import { valorantCoachService } from "../services/coach/valorantCoach.service";
import { agentCoachMemory } from "../services/coach/agentCoachMemory";

const router = Router();

/**
 * Generate crazy & apt strategies using Ollama LLM + Agent Memory + Python analytics
 * POST /api/v1/valorant/coach/strategy
 */
router.post("/strategy", async (req: Request, res: Response) => {
  try {
    const { map, scoreState, economyState, modelOverride } = req.body;
    const plan = await valorantCoachService.generateCrazyAndAptStrategies({
      map,
      scoreState,
      economyState,
      modelOverride,
    });
    res.json({
      success: true,
      strategyPlan: plan,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Strategy error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get realistic live updates of Valorant players
 * GET /api/v1/valorant/coach/players
 */
router.get("/players", async (req: Request, res: Response) => {
  try {
    const players = await valorantCoachService.getLivePlayerUpdates();
    res.json({
      success: true,
      count: players.length,
      players,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Players error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Ingest live round outcome, trigger agent memory updates
 * POST /api/v1/valorant/coach/round-update
 */
router.post("/round-update", async (req: Request, res: Response) => {
  try {
    const result = await valorantCoachService.processRoundUpdate(req.body);
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Round update error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current Agent Coach Memory (working memory + player tendencies + strategy stats)
 * GET /api/v1/valorant/coach/memory
 */
router.get("/memory", (req: Request, res: Response) => {
  res.json({
    workingMemory: agentCoachMemory.getWorkingMemory(),
    playerTendencies: agentCoachMemory.getAllPlayerTendencies(),
    strategyStats: agentCoachMemory.getStrategyStats(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Deep 5v5 Matchup Intelligence with Full Valorant Abilities & 15s Timestamps
 * POST /api/v1/valorant/coach/matchup-deep
 */
router.post("/matchup-deep", async (req: Request, res: Response) => {
  try {
    const data = await valorantCoachService.generateMatchupDeepIntelligence(req.body);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Matchup-deep error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Direct Live Chat with Local Ollama Nemotron/Qwen AI Coach
 * POST /api/v1/valorant/coach/chat
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, context, modelOverride } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }
    const result = await valorantCoachService.chatWithCoach({
      message,
      history,
      context,
      modelOverride,
    });
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Induce Knowledge & Expand Valorant Knowledge Graph
 * POST /api/v1/valorant/coach/induce-knowledge
 */
router.post("/induce-knowledge", async (req: Request, res: Response) => {
  try {
    const { type, content, sourceUrl, myTeam, opponentTeam, map } = req.body;
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }
    const result = await valorantCoachService.induceKnowledge({
      type: type || "youtube",
      content,
      sourceUrl,
      myTeam,
      opponentTeam,
      map,
    });
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Induce knowledge error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Current Valorant Knowledge Graph
 * GET /api/v1/valorant/coach/knowledge-graph
 */
router.get("/knowledge-graph", (req: Request, res: Response) => {
  try {
    const graph = valorantCoachService.getKnowledgeGraph();
    res.json({
      success: true,
      graph,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALORANT COACH ROUTE] Knowledge graph error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
