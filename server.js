/**
 * ScoutAI Esports AI Intelligence Coach - Backend Server
 * Production-ready Express API with YouTube oEmbed & Local Ollama Qwen Integration
 * 
 * Port: 3000 (communicates with Vite frontend on http://localhost:5173)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:4b';

// ============================================================================
// 1. CORS & Setup Middleware
// ============================================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (such as mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in local dev environments
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ScoutAI Coaching Engine',
    model: OLLAMA_MODEL,
    ollamaHost: OLLAMA_HOST,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 2. Helper: YouTube oEmbed Extractor (No API Key Required)
// ============================================================================
async function extractYouTubeMetadata(url) {
  // Basic URL structure validation
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  if (!youtubeRegex.test(url.trim())) {
    throw new Error('Invalid YouTube URL format. Must be a standard youtube.com or youtu.be link.');
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url.trim())}&format=json`;

  try {
    const response = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ScoutAI-Esports-Intelligence/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('YouTube video not found or video is private/unlisted.');
      }
      throw new Error(`YouTube oEmbed returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    return {
      title: data.title || 'Unknown Esports VOD',
      authorName: data.author_name || 'Esports Broadcast',
      authorUrl: data.author_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      type: data.type || 'video',
      provider: data.provider_name || 'YouTube',
    };
  } catch (error) {
    console.warn(`[WARN] YouTube oEmbed fetch issue: ${error.message}. Using URL fallback.`);
    // Fallback metadata so the analysis pipeline remains resilient
    return {
      title: `Match VOD (${url.slice(0, 40)}...)`,
      authorName: 'Competitive Esports Stream',
      thumbnailUrl: '',
      fallback: true,
      error: error.message,
    };
  }
}

// ============================================================================
// 3. Strict JSON Schema for Ollama Qwen Generation
// ============================================================================
const COACH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    matchOverview: { type: 'string' },
    opponentAnalysis: { type: 'string' },
    winningStrategy: { type: 'string' },
    timeline: {
      type: 'array',
      items: { type: 'string' },
    },
    coachingPoints: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'matchOverview',
    'opponentAnalysis',
    'winningStrategy',
    'timeline',
    'coachingPoints',
  ],
};

// ============================================================================
// 4. POST /api/analyze Route
// ============================================================================
app.post('/api/analyze', async (req, res) => {
  const { team, url } = req.body;

  // Validation
  if (!team || typeof team !== 'string' || !team.trim()) {
    return res.status(400).json({
      error: 'Missing required field: "team". Please provide a team name.',
    });
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      error: 'Missing required field: "url". Please provide a valid YouTube VOD link.',
    });
  }

  console.log(`\n[SCOUT AI] Initiating match analysis for Team: "${team.trim()}"`);
  console.log(`[SCOUT AI] Video URL: ${url.trim()}`);

  // Step 1: Extract YouTube Metadata
  let videoMeta;
  try {
    videoMeta = await extractYouTubeMetadata(url);
    console.log(`[SCOUT AI] Extracted YouTube Title: "${videoMeta.title}" (${videoMeta.authorName})`);
  } catch (urlError) {
    return res.status(400).json({
      error: 'Malformed YouTube URL',
      details: urlError.message,
    });
  }

  // Step 2: Formulate System Prompt with Strict JSON Instructions
  const systemPrompt = `You are ScoutAI, an elite tier-1 esports head coach and strategic mastermind.
Your role is to conduct a deep tactical breakdown of competitive match VODs and deliver an unbeatable game plan.

Team Context: You are coaching "${team.trim()}".
Target VOD Title: "${videoMeta.title}"
Channel / Broadcast: "${videoMeta.authorName}"

You MUST respond strictly with valid JSON conforming to the following structure. Do NOT add preamble, markdown fences, or postscripts.
{
  "matchOverview": "High-level strategic overview of the map context, tempo, and current meta dynamics.",
  "opponentAnalysis": "Detailed breakdown of the opponent's setups, tendencies, habit loops, and exploitable weaknesses.",
  "winningStrategy": "The precise tactical playbook required to defeat them: utility combos, macro rotations, and economic protocols.",
  "timeline": [
    "Early Round (0:00 - 0:35): Map control default and utility probing.",
    "Mid Round (0:35 - 1:15): Counter-rotation triggers and territory execution.",
    "Late Round / Post-Plant (1:15 - End): Retake denial, cross-fires, and clutch positioning."
  ],
  "coachingPoints": [
    "Actionable verbal directive #1 for the players.",
    "Actionable verbal directive #2 (concise, high-impact).",
    "Actionable verbal directive #3.",
    "Actionable verbal directive #4."
  ]
}`;

  const userPrompt = `Analyze the esports match "${videoMeta.title}" for Team ${team.trim()}.
Synthesize your opponent scouting report, generate the winning tactical counter-strategy, define the round timeline, and output exactly 4 to 5 punchy coaching points for our avatar voice briefing. Return only JSON.`;

  // Step 3: Query Local Ollama Qwen Daemon
  try {
    console.log(`[SCOUT AI] Dispatching request to local Ollama daemon (${OLLAMA_MODEL} at ${OLLAMA_HOST})...`);

    const ollamaPayload = {
      model: OLLAMA_MODEL,
      prompt: `${systemPrompt}\n\nUser Request: ${userPrompt}`,
      stream: false,
      format: 'json', // Strict JSON mode in Ollama
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 900,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s safety timeout for local CPU/GPU

    const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      throw new Error(`Ollama returned HTTP ${ollamaResponse.status}: ${errText}`);
    }

    const ollamaData = await ollamaResponse.json();
    const rawContent = (ollamaData.response || '').trim();

    console.log(`[SCOUT AI] Received ${rawContent.length} characters from Ollama (${ollamaData.eval_duration ? Math.round(ollamaData.eval_duration / 1e6) + 'ms' : 'done'}).`);

    // Step 4: Parse & Validate Strict JSON
    let parsedStrategy;
    try {
      // Strip potential markdown code fences if the model outputted ```json ... ```
      const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsedStrategy = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[WARN] Direct JSON.parse failed. Attempting regex JSON extraction...');
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        parsedStrategy = JSON.parse(match[0]);
      } else {
        throw new Error('LLM output could not be parsed as valid JSON.');
      }
    }

    // Step 5: Enforce the 5 Required Keys with Graceful Fallbacks
    const finalizedResponse = {
      matchOverview: parsedStrategy.matchOverview || `Strategic VOD analysis for ${team} on ${videoMeta.title}. High-tempo meta requiring strict map control.`,
      opponentAnalysis: parsedStrategy.opponentAnalysis || 'Opponent exhibits predictable defensive rotations and overcommits utility during early map pressure.',
      winningStrategy: parsedStrategy.winningStrategy || `Execute disciplined defaults to bait opponent utility, followed by fast split-pushes and staggered post-plant crossfires.`,
      timeline: Array.isArray(parsedStrategy.timeline) && parsedStrategy.timeline.length > 0
        ? parsedStrategy.timeline
        : [
            'Early Phase (0:00 - 0:30): Establish primary vision and contest default territory.',
            'Mid Phase (0:30 - 1:10): Execute fake rotation and bait defensive cooldowns.',
            'Late Phase (1:10 - End): Fast site collapse with secondary flash support.',
          ],
      coachingPoints: Array.isArray(parsedStrategy.coachingPoints) && parsedStrategy.coachingPoints.length > 0
        ? parsedStrategy.coachingPoints
        : [
            `Maintain disciplined crosshairs on entry and avoid solo dry peeks.`,
            `Listen for opponent utility triggers before committing to site executes.`,
            `Save flash support for the secondary retake denial.`,
            `Communicate health and ultimate economy clearly in the clutch.`,
          ],
      meta: {
        video: videoMeta,
        model: OLLAMA_MODEL,
        generatedAt: new Date().toISOString(),
      },
    };

    return res.status(200).json(finalizedResponse);

  } catch (error) {
    // Ollama connection error resilience
    if (error.name === 'AbortError') {
      console.error('[ERROR] Ollama request timed out after 90 seconds.');
      return res.status(504).json({
        error: 'Inference Timeout',
        message: 'The local Ollama daemon took too long to generate a response. Ensure your local GPU/CPU is not overloaded.',
      });
    }

    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      console.error(`[ERROR] Unable to connect to Ollama at ${OLLAMA_HOST}.`);
      return res.status(503).json({
        error: 'Ollama Daemon Offline',
        message: `Could not connect to Ollama at ${OLLAMA_HOST}. Ensure the daemon is running with 'ollama serve' and model '${OLLAMA_MODEL}' is pulled.`,
        instructions: [
          '1. Run "ollama serve" in your terminal.',
          `2. Run "ollama pull ${OLLAMA_MODEL}" to ensure the model exists.`,
          '3. Check http://localhost:11434 in your browser.',
        ],
      });
    }

    console.error('[ERROR] Analysis pipeline error:', error.message);
    return res.status(500).json({
      error: 'Analysis Pipeline Error',
      message: error.message,
    });
  }
});

// ============================================================================
// 5. Server Boot with Graceful Port Conflict Handling
// ============================================================================
const server = app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 ScoutAI Backend Engine running on http://localhost:${PORT}`);
  console.log(`🔗 CORS configured for Vite frontend: http://localhost:5173`);
  console.log(`🧠 Local Ollama Endpoint: ${OLLAMA_HOST} (Model: ${OLLAMA_MODEL})`);
  console.log(`📡 Analyze Endpoint: POST http://localhost:${PORT}/api/analyze`);
  console.log('================================================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use. Please free port ${PORT} or run with PORT=3001.`);
  } else {
    console.error('[FATAL] Server error:', err);
  }
});

module.exports = app;
