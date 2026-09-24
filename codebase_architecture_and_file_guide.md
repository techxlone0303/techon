# Codebase Architecture & Senior Engineering File Guide
## Project: GAMEX — Esports AI Intelligence Coach & Strategic Command System
**Lead Architect:** Dhanshree Katre  
**Repository:** [https://github.com/techxlone0303/techon.git](https://github.com/techxlone0303/techon.git)  

---

## 1. Directory Tree & Structural Hierarchy

```
c:\Project1\
├── .env.example                     # Sample environment configuration template
├── .gitignore                       # Root ignore rules for node_modules, .venv, dist, .env
├── README.md                        # Master project documentation & quickstart guide
├── server.js                        # Unified root Node.js Express server (Port 4000)
│
├── GAMEX/                           # Backend Application Tier
│   ├── ai/                          # Python AI Engine & Simulation Scripts
│   │   ├── feature_cli.py           # Feature extraction CLI
│   │   ├── feature_engineering.py   # Elo/Glicko & telemetry feature extraction
│   │   ├── rag_cli.py               # RAG document retrieval CLI
│   │   ├── rag_store.py             # Vector store for esports meta documents
│   │   ├── requirements.txt         # Python dependencies
│   │   ├── strategy_cli.py          # Strategy simulation CLI
│   │   ├── strategy_simulator.py    # Monte Carlo round probability simulator
│   │   └── valorant_intelligence.py # Python Valorant tactical intelligence engine
│   ├── src/
│   │   ├── app.ts                   # Express application setup & middleware
│   │   ├── server.ts                # Express server bootstrap (Port 4000)
│   │   ├── ollama/
│   │   │   └── ollama.client.ts     # Client for local Ollama API (Nemotron/Qwen/Gemma)
│   │   ├── routes/
│   │   │   ├── valorantCoach.routes.ts # Tactical coach routes (/api/matchup, /api/agent-decision)
│   │   │   ├── scout.routes.ts      # Scouting report routes
│   │   │   ├── youtube.routes.ts    # YouTube stream telemetry routes
│   │   │   └── agi.routes.ts        # Advanced AGI agentic routes
│   │   ├── services/
│   │   │   ├── coach/
│   │   │   │   ├── valorantCoach.service.ts # Core tactical intelligence generator
│   │   │   │   ├── valorantData.ts          # Authentic Valorant agent abilities & lineups
│   │   │   │   └── agentCoachMemory.ts      # In-memory coaching session context
│   │   │   ├── agi/
│   │   │   │   ├── agents/          # Multi-agent behavioral systems
│   │   │   │   ├── memory/          # Knowledge graph & episodic memory
│   │   │   │   ├── meta/            # Meta strategy engine
│   │   │   │   └── simulation/      # Match simulation models
│   │   │   ├── grid/                # GRID Central & Stats API integrations
│   │   │   └── youtube/
│   │   │       └── youtubeTracker.service.ts # VOD metadata & live telemetry tracker
│   │   └── package.json             # Backend dependencies & build scripts
│
└── GAMEX-frontend/                  # Frontend Presentation Tier (React 18 + Vite 7)
    ├── index.html                   # HTML entry point with modern viewport meta tags
    ├── package.json                 # Frontend dependencies & build scripts
    ├── tailwind.config.js           # Tailwind theme configuration
    ├── vite.config.ts               # Vite configuration with path aliases (@ -> src)
    └── src/
        ├── main.tsx                 # React application mounting
        ├── App.tsx                  # Client router (Home, Coach, About, Services, Contact)
        ├── index.css                # Global design system, dark tokens, and mobile utilities
        ├── pages/
        │   ├── Coach.tsx            # Main Tactical Command Room (Heart of GAMEX)
        │   ├── Home.tsx             # Hero, features overview, trust badges
        │   ├── About.tsx            # Founder info (Dhanshree Katre), mission, timeline
        │   ├── Services.tsx         # Platform services & esports AGI roadmap
        │   ├── Pricing.tsx          # Pricing tiers and FAQ
        │   └── Contact.tsx          # Contact form & enterprise consultation booking
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.tsx       # Page wrapper with background grid
        │   │   ├── Navbar.tsx       # Responsive navigation with mobile drawer & AI CTA
        │   │   └── Footer.tsx       # Minimalist terminal footer
        │   └── shared/              # Reusable game cards, feature widgets, section headers
        ├── hooks/
        │   ├── useCoachSpeech.ts    # Web Speech API hook for spoken tactical briefings
        │   └── use-mobile.tsx       # Dynamic viewport breakpoint detector
        └── lib/
            ├── api.ts               # Generic API client
            └── scoutAiApi.ts        # Typed API interfaces for tactical endpoints
```

---

## 2. Core File Deep Dives

### 2.1 `c:\Project1\server.js` (Unified Gateway Server)
- **Role:** High-speed unified Express server that connects the React frontend directly to local Ollama models and domain heuristics.
- **Port:** Listens on port `4000`.
- **Key Routes Implemented:**
  - `POST /api/matchup`: Accepts `{ myTeam, opponentTeam, map, side, economy, model }`. Generates complete 5v5 rosters, authentic abilities, 15-second timeline progression, and queries Ollama Nemotron for the executive head coach briefing.
  - `POST /api/chat`: Accepts conversational queries from the frontend chat terminal, appends tactical context, and returns Nemotron's strategic response.
  - `POST /api/analyze`: Ingests YouTube URLs using YouTube's oEmbed endpoint to extract video titles, authors, and metadata.
  - `GET /api/health`: Provides JSON status reports confirming that the gateway, port, and Ollama bridge are operational.
- **Heuristic Resiliency:** If Ollama is cold or warming up, `server.js` includes procedural tactical generation routines so the frontend **never encounters an HTTP 500 error or blank UI**.

### 2.2 `c:\Project1\GAMEX-frontend\src\pages\Coach.tsx`
- **Role:** The primary tactical command room interface used by players, coaches, and analysts.
- **Key State Variables:**
  - `matchupData`: Holds the active synthesized tactical plan (briefing, rosters, 15s timeline, formations).
  - `loadingMatchup`: Controls whether the tactical synthesis HUD is active.
  - `selectedAgentTab`: Toggles between viewing "My Team" (5 agents) and "Opponent Team" (5 agents).
  - `expandedAgent`: Tracks which agent card is expanded to inspect their 4 authentic utilities and lineups.
  - `activeTimelineIndex`: Controls which of the seven 15-second intervals (`0:00-0:15` to `1:30-1:45`) is currently highlighted.
  - `chatMessages`: Maintains the interactive multi-turn conversation with local Nemotron.
  - `isSpeaking`: Manages audio playback for spoken tactical briefings via the browser's native `window.speechSynthesis`.
- **Phone Compatibility Implementations:**
  - Selector bar reflows into a mobile-friendly 1, 2, and 3-column grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6`).
  - Timeline intervals feature a horizontal touch-scrolling track on mobile (`flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-7`).
  - Agent roster reflows cleanly (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`).

### 2.3 `c:\Project1\GAMEX\src\services\coach\valorantData.ts`
- **Role:** The ground-truth Valorant domain ontology.
- **Data Structure:**
  - Maps every competitive agent (Jett, Sova, Cypher, Omen, Killjoy, Viper, Fade, Breach, etc.) to:
    - Official role (Duelist, Initiator, Controller, Sentinel).
    - All 4 abilities with exact in-game names.
    - Keybinds (`C`, `Q`, `Signature [E]`, `Ultimate [X]`).
    - Cred purchase costs (e.g., "200 Creds", "Free", "8 Ult Points").
    - Actionable lineup execution guidelines (e.g., *"Sova Recon dart from A Lobby into A Site dice to tag entry defenders"*).

### 2.4 `c:\Project1\GAMEX\src\ollama\ollama.client.ts`
- **Role:** Local AI bridge communicating with Ollama over HTTP (`http://localhost:11434`).
- **Capabilities:**
  - Supports model selection (`nemotron`, `qwen3.5:4b`, `gemma`).
  - Enforces temperature settings (0.2 for deterministic tactical planning, 0.7 for creative anti-strat generation).
  - Handles streaming responses and graceful timeout fallbacks.

### 2.5 `c:\Project1\GAMEX-frontend\src\index.css`
- **Role:** Master design system and responsive stylesheet.
- **Design Tokens:**
  - Curated monochrome palette (`--background: 0 0% 0%`, `--foreground: 0 0% 100%`, `--card: 0 0% 4%`).
  - Typography: Google Font `Inter` with tabular number alignments (`.stat-number`).
  - Mobile Utilities:
    - `.no-scrollbar`: Hides mobile scrollbars while allowing natural touch scrolling.
    - `html, body { overflow-x: hidden; max-width: 100vw; }`: Completely prevents horizontal viewport wobbling on iOS and Android devices.

---

## 3. Communication Contract & Flow

```
[User Browser (Coach.tsx)]
         │
         │  1. POST /api/matchup {myTeam, opponentTeam, map, side, economy, model}
         ▼
  [server.js : 4000]
   ├── Inspects valorantData.ts for authentic rosters
   ├── Formulates 7-phase 15-second timeline (0:00 to 1:45)
   │
   │  2. POST http://localhost:11434/api/generate
   ▼
[Local Ollama (Nemotron)]
   │
   │  3. Returns high-reasoning coach directive
   ▼
  [server.js : 4000]
         │
         │  4. JSON payload sent back to browser
         ▼
[User Browser (Coach.tsx)]
   ├── Updates HUD state
   ├── Renders 5v5 Roster Cards & 15-Second Timeline
   └── Initiates Speech Synthesis if requested
```

---

## 4. How to Run & Verify

1. **Verify Ollama is Running Locally:**
   ```bash
   ollama list
   # Verify 'nemotron' or 'qwen3.5:4b' is installed
   ```
2. **Launch the Backend Gateway:**
   ```bash
   node server.js
   # Running on http://localhost:4000
   ```
3. **Launch the Frontend Client:**
   ```bash
   cd GAMEX-frontend
   npm run dev -- --port 5173
   # Running on http://localhost:5173
   ```
4. **Production Build Verification:**
   ```bash
   cd GAMEX-frontend
   npm run build
   # Validated: 0 TypeScript errors, production bundle compiled cleanly in dist/
   ```
