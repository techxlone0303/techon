import { Router, Request, Response } from 'express';
import { agiEngine, AGIAnalysisInput } from '../services/agi/orchestrator/agiEngine';
import { UniversalFeatures } from '../services/agi/normalizationEngine';

const router = Router();

function generateMockFeatures(): UniversalFeatures {
  return {
    skill_index: 0.5 + (Math.random() - 0.5) * 0.4,
    aggression_index: 0.5 + (Math.random() - 0.5) * 0.4,
    macro_intelligence: 0.5 + (Math.random() - 0.5) * 0.4,
    adaptability_score: 0.5 + (Math.random() - 0.5) * 0.4,
    meta_alignment_score: 0.5 + (Math.random() - 0.5) * 0.4,
    synergy_score: 0.5 + (Math.random() - 0.5) * 0.3,
  };
}

router.post('/agi/predict', async (req: Request, res: Response) => {
  try {
    const { matchId, gameTitle, teamA, teamB, historicalContext } = req.body;

    if (!matchId || !gameTitle || !teamA || !teamB) {
      return res.status(400).json({
        error: 'matchId, gameTitle, teamA, and teamB are required',
      });
    }

    const input: AGIAnalysisInput = {
      matchId,
      gameTitle,
      teamA: {
        id: teamA.id || 'teamA',
        name: teamA.name || 'Team A',
        features: teamA.features || generateMockFeatures(),
        eloRating: teamA.eloRating || 1500,
        glickoRating: teamA.glickoRating || 1500,
        glickoDeviation: teamA.glickoDeviation || 350,
      },
      teamB: {
        id: teamB.id || 'teamB',
        name: teamB.name || 'Team B',
        features: teamB.features || generateMockFeatures(),
        eloRating: teamB.eloRating || 1500,
        glickoRating: teamB.glickoRating || 1500,
        glickoDeviation: teamB.glickoDeviation || 350,
      },
      historicalContext,
    };

    const result = await agiEngine.analyze(input);

    res.json(result);
  } catch (error: any) {
    console.error('[AGI API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/agi/meta/:gameTitle', async (req: Request, res: Response) => {
  try {
    const { gameTitle } = req.params;

    const { metaEngine } = await import('../services/agi/meta/metaEngine');
    const metaState = await metaEngine.fetchCurrentMeta(gameTitle as any);

    res.json(metaState);
  } catch (error: any) {
    console.error('[AGI API] Meta fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/agi/simulate', async (req: Request, res: Response) => {
  try {
    const { teamAFeatures, teamBFeatures, teamAName, teamBName } = req.body;

    const { matchSimulator } = await import('../services/agi/simulation/matchSimulator');
    const result = await matchSimulator.simulateMatch(
      teamAFeatures || generateMockFeatures(),
      teamBFeatures || generateMockFeatures(),
      teamAName || 'Team A',
      teamBName || 'Team B'
    );

    res.json(result);
  } catch (error: any) {
    console.error('[AGI API] Simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/agi/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    components: {
      agiEngine: 'ready',
      metaEngine: 'ready',
      matchSimulator: 'ready',
      knowledgeGraph: 'ready',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;

