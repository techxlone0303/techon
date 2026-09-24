# Product Requirements Document (PRD)
## Project: GAMEX — Esports AI Intelligence Coach & Strategic Command System
**Author & Lead Architect:** Dhanshree Katre  
**Status:** Production MVP Ready  
**Date:** September 2026  
**Target Environment:** Local AI Inferencing (NVIDIA Nemotron / Qwen 3.5 / Gemma via Ollama) + Cloud Hybrid  

---

## 1. Executive Overview & Problem Statement

### 1.1 The Esports Tactical Dilemma
Competitive esports (Valorant, CS2, League of Legends, Rocket League, Fortnite) is a multi-billion dollar industry where match outcomes hinge on milliseconds, tactical adaptation, utility economy, and anti-stratting. 
However, **90% of esports teams, coaches, and analysts still prepare manually**:
- Analysts spend **15–20 hours per week** reviewing VODs and manually noting opponent utility habits.
- In-Game Leaders (IGLs) lack real-time predictive insights to counter opponent tendencies on specific maps and round economy phases.
- Small tier-2/tier-3 teams cannot afford 5–10 person analyst staffs, creating an unfair competitive divide.
- Data platforms (VLR.gg, Tracker.gg, HLTV) are **reactive and historical**—they display what happened in the past, but fail to generate **actionable tactical playbooks for what to do next**.

### 1.2 The Solution: GAMEX
**GAMEX** is an **agentic, generative AI intelligence coaching ecosystem** that converts static telemetry and live broadcast streams into **executable 5v5 tactical playbooks**. Driven by locally hosted high-reasoning neural models (**NVIDIA Nemotron**, **Qwen 3.5**, **Gemma**) via Ollama, GAMEX delivers:
1. **Interactive Matchup Simulations**: Instant anti-strat formulations between any two Tier-1/Tier-2 rosters.
2. **Granular 15-Second Agentic Timeline Decisions**: From barrier drop (0:00) to clutch retention (1:45).
3. **Comprehensive 5v5 Agent Roster & Utility Playbooks**: Deep dive into all 4 authentic Valorant utilities, lineups, costs, and execution priorities.
4. **Broadcast & YouTube Intelligence Induction**: Real-time extraction of live stream metadata, strategies, and meta-shifts.
5. **Interactive Local AI Coaching Terminal**: Direct communication with Nemotron to query counter-strategies, train knowledge graphs, and customize battle plans.

---

## 2. Multi-Stakeholder Perspectives (POVs)

### 2.1 User POV: The Esports Pro Player & In-Game Leader (IGL)
> *"I don't need raw spreadsheets. I need to know what Sentinels or Paper Rex will do on round 4 if they're on a bonus buy on Ascent, and what utility our Sova and Jett need to throw at 0:18 to deny their A-main contest."*

- **Workflow**:
  1. Opens GAMEX on desktop or mobile prior to a scrimmage or tournament match.
  2. Selects their team (e.g., Paper Rex), the opponent (e.g., Fnatic), map (e.g., Ascent), side (Attack), and economy (Full Buy).
  3. Clicks **Deploy Tactics** to synthesize the operational plan.
  4. Clicks **Listen Briefing** to hear the AI Nemotron audio callout in their headset during team prep.
  5. Reviews the 15-second timeline interval by interval (`0:00-0:15`, `0:15-0:30`, etc.) to align callouts with teammates.
  6. Uses the interactive AI chat box to ask: *"What if Fnatic counters with an aggressive Odin B-main spam?"* and gets instant contingency utility setups.

### 2.2 Client POV: Esports Team Organizations, Head Coaches & Analysts
> *"We need a scalable competitive intelligence engine that cuts scout preparation time from 20 hours to 30 seconds, uncovers statistical exploits in opponent compositions, and protects our proprietary strategies without leaking data to cloud providers."*

- **Workflow**:
  1. Organization subscribes to GAMEX Enterprise or deploys the local instance on their team facility gaming rigs.
  2. Because all tactical inference runs locally via **Ollama (Nemotron/Qwen)**, **zero scrim data or secret playbooks leave the team's local network** (absolute data sovereignty).
  3. Head coaches export structured JSON and printable tactical cards for pre-match huddles.
  4. Live stream analysts paste YouTube VOD links into the tracker to ingest live tournament insights directly into their team's private episodic memory graph.

### 2.3 Admin POV: Platform Administrator, Data Ops & AI Engineers
> *"We need a resilient, modular architecture that bridges real-time telemetry from GRID APIs, automates local LLM failover, maintains zero memory leaks across 24/7 scrim sessions, and exposes observable REST endpoints."*

- **Workflow**:
  1. Controls model allocation (`nemotron`, `qwen3.5:4b`, `gemma`) via environment variables and live toggle dropdowns.
  2. Monitors health and memory stats via `/api/health` and `/api/agi/memory`.
  3. Deploys background ingestion pipelines connecting esports tournament data feeds (GRID Central/Stats APIs) into vector stores and episodic graph caches.
  4. Configures rate limits, CORS policies, and WebSocket pub/sub channels for low-latency live broadcast telemetry.

---

## 3. Why GAMEX is the Ultimate MVP for the Esports Ecosystem

| Dimension | Legacy Tools (VLR, Tracker, Mobalytics) | Cloud AI Wrappers (ChatGPT wrappers) | **GAMEX MVP** |
| :--- | :--- | :--- | :--- |
| **Inference Location** | Static Server Database | Third-party Cloud (OpenAI, Anthropic) | **100% Local Inference via Ollama (Nemotron / Qwen)** |
| **Data Privacy** | Public data only | Scrims/Tactics leaked to public cloud | **Zero Scrim Leakage (Air-gapped capable)** |
| **Granularity** | Match K/D/A and historical stats | Generic text hallucinations | **15-Second Precision Round Timeline + 5v5 Lineups** |
| **Domain Authenticity** | Manual human notes | Often invents fake abilities | **Hardcoded Valorant Utility Ontology (Costs, Keys, Lineups)** |
| **Live Audio Output** | None | Generic TTS or none | **Integrated Tactical Voice Coach Synthesis** |
| **Multimodal Stream Input** | None | Manual text paste | **Direct YouTube Stream & Broadcast Ingestion** |
| **Device Ergonomics** | Desktop web only | Desktop web | **Unified Desktop & Phone Touch-Responsive UI** |

---

## 4. Detailed Functional Requirements

### 4.1 Module 1: Tactical Configuration & Deployment
- **FR-101**: The system must allow the user to select Any Pro Team, Opponent Team, Map, Side (Attack/Defense), Economy state, and AI Model.
- **FR-102**: On initial load, the system shall display a tactical standby state ("Awaiting Deployment") to prevent premature computation.
- **FR-103**: Upon triggering "Deploy Tactics", the UI must present an active tactical synthesis HUD with pulsing telemetry indicators.
- **FR-104**: Deployment must synthesize:
  1. Head Coach Executive Directive (Nemotron reasoning).
  2. Formation & Spatial Execution Plan.
  3. 5v5 Roster Utility Playbooks (5 friendly agents + 5 enemy agents).
  4. 7-phase 15-second chronological round timeline.
  5. Win probability rating and confidence calibration index.

### 4.2 Module 2: 15-Second Agentic Timeline Progression
- **FR-201**: The timeline must be partitioned into seven 15-second intervals covering the 105-second standard round:
  - `0:00 - 0:15`: Barrier Drop & Utility Deployment
  - `0:15 - 0:30`: Default & Space Contest
  - `0:30 - 0:45`: Mid Control & Probe
  - `0:45 - 1:00`: Site Hit / Fake Setup
  - `1:00 - 1:15`: Spike Plant & Anti-Retake Setup
  - `1:15 - 1:30`: Retake Execution / Crossfires
  - `1:30 - 1:45`: Clutch Situations & Economy Preservation
- **FR-202**: For each interval, the system must provide:
  - Phase Title and Tactical Objective.
  - Friendly agent actions (specific utility keys, targets, coordinates).
  - Opponent counter-measures and hazard zones.
  - Contingency triggers (e.g., if early pick conceded, fallback to secondary site).

### 4.3 Module 3: 5v5 Agent Roster & Authentic Utility Playbook
- **FR-301**: The roster view must support toggling between Friendly Roster and Opponent Roster.
- **FR-302**: Each agent card must display:
  - Agent Name, Tactical Role (Duelist, Initiator, Controller, Sentinel).
  - Primary execution role in the selected round strategy.
  - All 4 authentic Valorant utilities (Ability 1 [C], Ability 2 [Q], Signature [E], Ultimate [X]).
  - Keybinds, Cred costs, and specific lineup execution guidelines.

### 4.4 Module 4: Local LLM Engine & Interactive Chat
- **FR-401**: Backend must connect to Ollama at `http://localhost:11434` with configurable models (`nemotron`, `qwen3.5:4b`, `gemma`).
- **FR-402**: The frontend coach chat box must support multi-turn conversational interaction with local Nemotron.
- **FR-403**: The chat engine must allow users to inject live stream knowledge or YouTube tactical notes into the working memory.
- **FR-404**: Integrated browser Web Speech API must provide tactical audio voice readouts with toggleable mute states.

### 4.5 Module 5: Mobile & Phone Compatibility
- **FR-501**: All grids, modals, cards, and input fields must be 100% responsive across viewports from 320px (mobile) to 4K desktop.
- **FR-502**: Timeline intervals must support horizontal touch-swipe scrolling with hidden scrollbars on mobile.
- **FR-503**: Zero horizontal document overflow (`max-width: 100vw; overflow-x: hidden`).

---

## 5. Non-Functional Requirements (NFRs)

- **Performance**: Initial tactic synthesis response within < 1.8 seconds using local cached heuristics, and streaming Nemotron reasoning tokens under 150ms time-to-first-token.
- **Security & Privacy**: Zero transmission of team strategic data or scrim transcripts to third-party public cloud endpoints.
- **Availability**: Offline capable. Can run 100% on a disconnected LAN tournament environment (e.g., VCT LAN event).
- **Design Standard**: High-contrast, investor-grade terminal aesthetic (monochrome black/white palette with accent tactical indicators).

---

## 6. Success Metrics & KPIs
1. **Time-to-Playbook**: Reduced from ~120 minutes of manual VOD review to **< 5 seconds** per round scenario.
2. **Coach Adoption Rate**: > 85% weekly active usage among target esports teams during scrim weeks.
3. **Execution Fidelity**: 95%+ precision in matching official Valorant utility mechanics and lineup feasibility.
4. **Latency SLA**: < 100ms local server response latency for tactical retrieval.
