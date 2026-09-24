import { Router, Request, Response } from 'express';
import { generateReport } from '../services/report/report.service';

const router = Router();

router.post('/scout/report', async (req: Request, res: Response) => {
  const { teamId, opponentId } = req.body;

  if (!teamId || !opponentId) {
    return res.status(400).json({ error: 'teamId and opponentId are required' });
  }

  try {
    const report = await generateReport(teamId, opponentId);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

