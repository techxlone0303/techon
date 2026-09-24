# GAMEX — Esports AI Intelligence Coach & Strategic Command System

**Authored & Architected by:** Dhanshree Katre  
**Repository:** [https://github.com/techxlone0303/techon.git](https://github.com/techxlone0303/techon.git)  
**Version:** 1.0.0 Production Ready  

---

## 🎮 Overview

**GAMEX** is an esports AI intelligence coaching and analytics platform designed for competitive teams, tactical analysts, and professional players. Powered by locally deployed AI models via **Ollama** (including **NVIDIA Nemotron**, **Qwen 2.5/3.5**, and **Gemma**), GAMEX delivers deep tactical directives, 5v5 agent utility breakdowns, 15-second round progression timelines, anti-strat modeling, and YouTube live stream intelligence tracking.

The entire web user interface is fully responsive and optimized for both desktop command centers and mobile/phone touchscreens.

---

## 🚀 Key Features

1. **Strategic Matchup Engine (Valorant & Multi-Title)**:
   - Dynamic team selection (Sentinels, Paper Rex, Fnatic, PRX, DRX, LOUD, etc.) vs opponent teams.
   - Comprehensive map coverage (Ascent, Bind, Haven, Split, Lotus, Sunset, Abyss, etc.).
   - Side toggles (Attack / Defense) and Economy states (Full Buy, Semi Buy, Eco, Pistol).
   - Instant tactical synthesis on **Deploy Tactics** with real-time HUD loading feedback.

2. **5v5 Agent Roster & Authentic Utility Playbook**:
   - Deep inspection of all 5 agents on your team and the opponent's team.
   - Breakdown of all 4 authentic Valorant utilities & signature lineups for every agent.
   - Ability costs, keybind mappings, tactical role, and primary execution directives.

3. **15-Second Agentic Round Timeline Progression**:
   - Granular round-by-round time interval breakdown:
     - `0:00 - 0:15`: Barrier Drop & Utility Deployment
     - `0:15 - 0:30`: Default & Space Contest
     - `0:30 - 0:45`: Mid Control & Probe
     - `0:45 - 1:00`: Site Hit / Fake Setup
     - `1:00 - 1:15`: Spike Plant & Anti-Retake Setup
     - `1:15 - 1:30`: Retake Execution / Crossfires
     - `1:30 - 1:45`: Clutch Situations & Economy Preservation
   - Agent-by-agent spatial positioning, utility triggers, and contingency counter-measures.

4. **Local AI Engine (Nemotron / Qwen via Ollama)**:
   - Communicates directly with locally hosted Ollama instances (`http://localhost:11434`).
   - Supports NVIDIA Nemotron (`nemotron`), Qwen 3.5 (`qwen3.5:4b`), and Gemma models.
   - Live AI interactive chat box to query tactics, educate the knowledge grid, and draft counter-strategies.
   - Text-to-Speech audio briefings for real-time tactical audio readouts.

5. **Live YouTube & Stream Telemetry Ingestion**:
   - Extract stream metadata, titles, and live VOD information from YouTube URLs.
   - Induce broadcast meta insights directly into the tactical decision graph.

6. **Mobile & Phone Compatibility**:
   - Fully optimized for all screen sizes (phones, tablets, and desktop displays).
   - Horizontal touch scrolling for tactical intervals and responsive rosters.
   - Zero horizontal overflow or layout jitter.

---

## 🏗️ Architecture

```
Project1/
├── GAMEX/                     # Express & TypeScript Backend
│   ├── src/
│   │   ├── controllers/       # Scout & Tactical Controllers
│   │   ├── routes/            # API Endpoints (/api/tactics, /api/agent-decision, etc.)
│   │   ├── services/          # Ollama & Grid Service Clients
│   │   └── server.ts          # Main Express Server
│   ├── ai/                    # Python AI scripts & data models
│   └── package.json
│
├── GAMEX-frontend/            # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── pages/             # Home, Coach, About, Services, Pricing, Contact
│   │   ├── components/        # UI components, layout, navbar, footer
│   │   └── index.css          # Design system & responsive styles
│   ├── package.json
│   └── vite.config.ts
│
├── server.js                  # Standalone Unified Express API Server
└── .gitignore                 # Root Git Ignore
```

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v26)
- **Ollama**: Installed and running (`ollama run nemotron` or `ollama run qwen3.5:4b`)
- **Git**

### 1. Start Ollama
Ensure your local Ollama server is running:
```bash
ollama serve
# Verify installed models
ollama list
```

### 2. Run the Backend Server
```bash
# Option A: Run the unified server
node server.js

# Option B: Run the GAMEX TypeScript backend
cd GAMEX
npm install
npm start
```
The backend will start on `http://localhost:4000` (or `http://localhost:3000`).

### 3. Run the Frontend
```bash
cd GAMEX-frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser (or your local IP on mobile devices on the same Wi-Fi).

---

## 📱 Mobile Experience

The user interface automatically adjusts across mobile viewports:
- Responsive navigation with mobile hamburger drawer.
- Grid collapsing to 1 and 2 columns on smartphones.
- Touch-friendly horizontal swipe for the 15-second tactical interval progression.
- Accessible tactical command buttons and audio briefing controls.

---

## 🛡️ License & Attribution

Designed and developed by **Dhanshree Katre**.  
All rights reserved.
