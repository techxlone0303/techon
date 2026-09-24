import express, { Application } from 'express';
import cors from 'cors';
import 'dotenv/config';
import reportRoutes from './routes/report.routes';
import scoutRoutes from './routes/scout.routes';
import agiRoutes from './routes/agi.routes';
import newScoutRoutes from './api/scout.routes';
import valorantCoachRoutes from './routes/valorantCoach.routes';
import youtubeRoutes from './routes/youtube.routes';
import productTeamRoutes from './routes/productTeam.routes';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1', reportRoutes);
app.use('/api/v1/scout', scoutRoutes);
app.use('/api/v1', agiRoutes);
// New modular scout routes (ScoutIQ GRID Gateway)
app.use('/api/v1/scout', newScoutRoutes);
// Valorant AI Coach & Player Intelligence
app.use('/api/v1/valorant/coach', valorantCoachRoutes);
// Live YouTube Stream Tracking & Insights
app.use('/api/v1/youtube', youtubeRoutes);
// Live Product Team / Coaching Staff Real-time Feed
app.use('/api/v1/product-team', productTeamRoutes);

export default app;

