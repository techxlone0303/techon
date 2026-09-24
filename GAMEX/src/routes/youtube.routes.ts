import { Router, Request, Response } from "express";
import { youtubeTrackerService } from "../services/youtube/youtubeTracker.service";

const router = Router();

/**
 * Track a live YouTube esports tournament stream
 * POST /api/v1/youtube/track
 */
router.post("/track", async (req: Request, res: Response) => {
  try {
    const { streamUrl, teamA, teamB, tournament, map } = req.body;
    if (!streamUrl) {
      return res.status(400).json({ error: "streamUrl is required" });
    }
    const tracked = await youtubeTrackerService.trackStream({
      streamUrl,
      teamA,
      teamB,
      tournament,
      map,
    });
    res.json({
      success: true,
      message: "Successfully initiated live YouTube stream tracking",
      stream: tracked,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[YOUTUBE ROUTES] Track error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get real-time stream insights, chat hype, and caster quotes
 * GET /api/v1/youtube/insights/:streamId?
 */
router.get("/insights/:streamId?", async (req: Request, res: Response) => {
  try {
    const streamId = req.params.streamId || "vct-v-live-2026";
    const insights = await youtubeTrackerService.getStreamInsights(streamId);
    if (!insights) {
      return res.status(404).json({ error: "Tracked stream not found" });
    }
    res.json({
      success: true,
      streamId,
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[YOUTUBE ROUTES] Insights error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all active tracked YouTube streams
 * GET /api/v1/youtube/active
 */
router.get("/active", (req: Request, res: Response) => {
  const active = youtubeTrackerService.listActiveStreams();
  res.json({
    success: true,
    count: active.length,
    streams: active,
    timestamp: new Date().toISOString(),
  });
});

export default router;
