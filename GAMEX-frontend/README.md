# 🧠 GAMEX — AI-Powered Esports Intelligence Platform
**Authored by: Dhanshree Katre**

GAMEX is an AI-driven esports intelligence platform designed to deliver scouting insights, match predictions, performance analytics, and strategic decision support for competitive esports teams, analysts, organizations, and investors.

Built with real-world esports data pipelines, local Ollama LLMs (Qwen 3.5, Gemma, Nemotron), Python virtual environment analytics, and advanced AI reasoning, GAMEX transforms raw match data into actionable competitive intelligence.

---

## 🚀 What GAMEX Does

GAMEX combines data engineering, statistical modeling, and AI reasoning to help esports stakeholders:

- 🔍 Scout teams and players
- 📊 Analyze performance trends & player tilt radar
- 🔮 Predict match outcomes & round momentum
- 🧠 Generate AI-powered "Crazy & Apt" tactical strategies
- ⚔️ Compare teams head-to-head with live round simulator
- 🔴 Track live YouTube tournament streams with chat hype telemetry
- 🧬 Extract insights even when live data sources fail

GAMEX is designed to never break — if external data sources go down, the intelligence core still produces predictions using internal models and local Ollama reasoning.

---

## 🏗️ Platform Architecture (High-Level)

```
Client (Web UI - GAMEX Frontend)
      ↓
GAMEX API (Node.js + TypeScript + Express :4000)
      ↓
Intelligence Core
 ├── Local Ollama AI Engine (Qwen 3.5, Gemma, Nemotron)
 ├── Python venv Analytics (.venv - Valorant Intelligence)
 ├── Agent Coach Working & Tendency Memory
 ├── Live YouTube VCT Stream Tracker
 ├── Statistical Engine & Win Probability
 └── Product Team Feed & Directive Dispatcher
      ↓
External & Local Telemetry (Live streams, match datasets, AI models)
```

---

## 🧠 Core Capabilities

### 1️⃣ Valorant AI Coach & Tilt Radar
- Live player tilt indicators (TenZ, zekken, Chronicle, Boaster, Derke, aspas)
- Clutch rate, ACS, ADR, and K/D performance tracking
- Real-time round simulation with economic & momentum shifts

### 2️⃣ "Crazy & Apt" Tactical Playbooks
- Generates high-surprise, optimal-probability counter-strategies using local Ollama LLMs
- Tactical directives for eco rounds, force buys, and site retakes
- Memory-augmented counter-strat history

### 3️⃣ Live YouTube Tournament Intelligence
- Real-time VCT broadcast tracking
- Live chat sentiment & hype velocity scoring (0–100)
- Instant caster quote transcription and highlight detection

### 4️⃣ Product Team & Coach Feedback Loop
- Direct alert feed and coaching directive dispatcher
- Memory persistence across match rounds

---

## 🌐 Project Structure

```
GAMEX-frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # Navbar, Footer, Layout (Branded GAMEX by Dhanshree Katre)
│   │   ├── shared/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   └── StarfieldCanvas.tsx  # Dynamic celestial starfield
│   ├── pages/
│   │   ├── Home.tsx         # Landing page with AI Coach Hub launch
│   │   ├── Coach.tsx        # Comprehensive Valorant Esports AI Intelligence Hub
│   │   ├── About.tsx        # Team & Dhanshree Katre (Founder & Lead Architect)
│   │   ├── Services.tsx     # Platform features & AI capabilities
│   │   ├── Pricing.tsx      # Tiers & enterprise options
│   │   ├── Contact.tsx      # Inquiries & direct feedback
│   │   ├── Login.tsx        # Authentication
│   │   └── Signup.tsx       # Registration
│   ├── lib/
│   │   └── api.ts           # Axios client connected to http://localhost:4000/api/v1
│   ├── App.tsx              # Main routing with /coach
│   └── main.tsx             # Entry point
```

---

## 🖥️ Running GAMEX Locally

### ✅ Requirements

- Node.js ≥ 18
- Python 3.10+ (with `.venv` in GAMEX backend)
- Ollama with `qwen3.5:4b` (or gemma/nemotron)
- npm or pnpm

### 🎨 Frontend Setup

```bash
cd GAMEX-frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**
Backend runs on: **http://localhost:4000**

---

## 🎮 Supported Esports

- Valorant (Full AI Coach & Tilt Radar active)
- League of Legends
- CS2
- Rocket League
- *(More coming)*

---

## 🎯 Who GAMEX Is For

- Esports teams & head coaches
- Analysts & tactical scouts
- Broadcast production & tournament organizers
- Competitive players wanting AI-driven round reviews

---

## 🧬 Philosophy

GAMEX is built on one principle:

> Real intelligence must still work when data is incomplete.

That's why GAMEX blends:
- **Math & Statistics**
- **Local AI reasoning (Ollama)**
- **Domain knowledge & player telemetry**

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 7 + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI Core**: Ollama (`qwen3.5:4b`), Python 3 (`pandas`, `numpy`, `scipy`, `scikit-learn`)
- **Author**: Dhanshree Katre

---

## ✨ Final Note

> GAMEX is not just a dashboard.  
> It's an esports intelligence system for competitive dominance.
