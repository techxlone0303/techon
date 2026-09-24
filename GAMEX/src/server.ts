import 'dotenv/config';
import app from './app';
import { initializeAllGridServices } from './grid';
import { initializeOllama } from './ollama/ollama.client';
import { initializeScoutEngine } from './scout/scout.engine';

const PORT = process.env.PORT || 4000;

/**
 * Initialize all ScoutIQ services on startup
 */
async function initializeServices(): Promise<void> {
  console.log("[SERVER] Initializing ScoutIQ services...");
  
  // Initialize GRID Gateway (Central Data + Statistics)
  await initializeAllGridServices();
  
  // Initialize Ollama LLM
  await initializeOllama();
  
  // Initialize Scout Engine
  initializeScoutEngine();
  
  console.log("[SERVER] All services initialized successfully");
}

// Start server
initializeServices().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 ScoutIQ Server running on port ${PORT}`);
    console.log(`📡 API Endpoints:`);
    console.log(`   • GET  /api/v1/scout/health`);
    console.log(`   • POST /api/v1/scout/analyze`);
    console.log(`   • POST /api/v1/scout/predict`);
    console.log(`   • POST /api/v1/scout/player`);
    console.log(`   • POST /api/v1/scout/team`);
    console.log(`   • GET  /api/v1/scout/tournaments`);
    console.log(`   • GET  /api/v1/scout/series`);
    console.log(`   • GET  /api/v1/scout/teams`);
    console.log(`   • GET  /api/v1/scout/players`);
    console.log(`   • GET  /api/v1/scout/teams/:teamId/stats`);
    console.log(`   • GET  /api/v1/scout/players/:playerId/stats`);
    console.log(`   • POST /api/v1/valorant/coach/strategy (Crazy & Apt Strategies)`);
    console.log(`   • GET  /api/v1/valorant/coach/players (Live Realistic Player Updates)`);
    console.log(`   • POST /api/v1/valorant/coach/round-update (Agent Memory Sync)`);
    console.log(`   • GET  /api/v1/valorant/coach/memory (Agent Coach Memory)`);
    console.log(`   • POST /api/v1/youtube/track (Live Stream Tracking)`);
    console.log(`   • GET  /api/v1/youtube/insights (Live Stream & Chat Insights)`);
    console.log(`   • GET  /api/v1/product-team/live-feed (Live Product Team Broadcast Feed)`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [PORT IN USE] Port ${PORT} is already in use by another process.`);
      console.error(`👉 Quick fix in PowerShell:`);
      console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
      console.error(`   Or change PORT in .env (e.g., PORT=4001)\n`);
      process.exit(1);
    } else {
      console.error("[SERVER] Unexpected server error:", err);
      process.exit(1);
    }
  });
}).catch((error) => {
  console.error("[SERVER] Failed to initialize services:", error);
  process.exit(1);
});

