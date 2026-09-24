/**
 * ScoutIQ - Scout Routes
 * 
 * API endpoints for scouting and matchup analysis
 */

import { Router, Request, Response } from 'express';
import { analyzeMatchup, initializeScoutEngine } from '../scout/scout.engine';

const router = Router();

/**
 * Health check endpoint - lightweight, no GRID queries
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'scout',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Initialize scout engine
 */
router.post('/init', async (req: Request, res: Response) => {
  try {
    initializeScoutEngine();
    res.json({ status: 'initialized', service: 'scout' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Matchup analysis endpoint
 * 
 * Request body:
 * {
 *   "teamA": "Cloud9",
 *   "teamB": "G2"
 * }
 * 
 * Response:
 * {
 *   "teamA": "Cloud9",
 *   "teamB": "G2",
 *   "prediction": {
 *     "winner": "Cloud9",
 *     "winProbability": 0.65,
 *     "expectedScore": "2-0",
 *     "confidence": 0.8
 *   },
 *   "players": {
 *     "teamA": [{ "id": "...", "nickname": "..." }],
 *     "teamB": [{ "id": "...", "nickname": "..." }]
 *   },
 *   "playerStats": { ... },
 *   "aiReport": { ... },
 *   "resolution": { ... }
 * }
 */
router.post('/matchup', async (req: Request, res: Response) => {
  const { teamA, teamB } = req.body;

  if (!teamA || !teamB) {
    return res.status(400).json({
      error: 'teamA and teamB are required',
      example: { teamA: 'Cloud9', teamB: 'G2' }
    });
  }

  try {
    console.log("[SCOUT ROUTES] Analyzing matchup: " + teamA + " vs " + teamB);
    
    const result = await analyzeMatchup(teamA, teamB);
    
    res.json(result);
  } catch (error: any) {
    console.error("[SCOUT ROUTES] Matchup analysis failed:", error);
    
    if (error.message?.includes('Team not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze a single team
 */
router.post('/team/analyze', async (req: Request, res: Response) => {
  const { teamId, teamName } = req.body;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId is required' });
  }

  try {
    const { getTeamById, getTeamStats } = await import('../grid');
    
    const [team, stats] = await Promise.all([
      getTeamById(teamId),
      getTeamStats(teamId).catch(() => null),
    ]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      team,
      stats,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze a single player
 */
router.post('/player/analyze', async (req: Request, res: Response) => {
  const { playerId } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }

  try {
    const { getPlayerById, getPlayerStats } = await import('../grid');
    
    const [player, stats] = await Promise.all([
      getPlayerById(playerId),
      getPlayerStats(playerId).catch(() => null),
    ]);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      player,
      stats,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

