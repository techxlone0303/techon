import { Router, Request, Response } from "express";
import { agentCoachMemory } from "../services/coach/agentCoachMemory";

const router = Router();

/**
 * Get real-time feed for live product teams and coaching staff
 * GET /api/v1/product-team/live-feed
 */
router.get("/live-feed", (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
  const feed = agentCoachMemory.getProductTeamFeed(limit);
  const workingMemory = agentCoachMemory.getWorkingMemory();

  res.json({
    success: true,
    count: feed.length,
    activeMatch: {
      matchId: workingMemory.matchId,
      teams: `${workingMemory.teamA} vs ${workingMemory.teamB}`,
      score: `${workingMemory.score.teamA} - ${workingMemory.score.teamB}`,
      map: workingMemory.map,
      round: workingMemory.currentRound,
      momentum: workingMemory.momentum,
    },
    feed,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Add a manual coaching note or priority directive from the product team
 * POST /api/v1/product-team/coaching-note
 */
router.post("/coaching-note", (req: Request, res: Response) => {
  const { title, note, priority } = req.body;
  if (!title || !note) {
    return res.status(400).json({ error: "title and note are required" });
  }

  const feedItem = agentCoachMemory.addFeedItem({
    type: "TACTICAL_ALERT",
    priority: priority || "HIGH",
    title: `📋 Coaching Directive: ${title}`,
    summary: note,
    data: { source: "Live Product Team / Head Coach", userCreated: true },
    suggestedAction: "Broadcast to in-game IGL HUD / coaching comms.",
  });

  res.json({
    success: true,
    message: "Coaching note broadcast to product team feed",
    feedItem,
  });
});

export default router;
