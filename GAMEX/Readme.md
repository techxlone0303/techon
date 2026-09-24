# 🚀 ScoutIQ — AI-Powered Esports Intelligence Platform

ScoutIQ is a modular, AI-driven esports intelligence platform that integrates real-time esports data with advanced analytics and LLM-based reasoning to generate scouting insights, predictions, and strategic reports.

It combines:

* 📊 Real esports data (GRID APIs)
* 🧠 AI reasoning (Ollama / LLMs)
* 📈 Statistical modeling & analytics
* 🏗️ Scalable microservice architecture

ScoutIQ is designed to be extensible, production-ready, and future-proof for advanced esports analytics.

---

## 🧠 Core Capabilities

### ✅ Real Esports Data Integration

* GRID Central Data API
* GRID Statistics API
* Teams, Players, Series, Tournaments, Organizations
* Real-time data fetching with caching & normalization

### ✅ AI Scouting & Prediction Engine

* Team matchup analysis
* Player performance insights
* Win probability prediction
* LLM-generated scouting reports

### ✅ Modular Architecture

* Separate API clients for each GRID endpoint
* Dedicated service layers per esports domain
* Unified GRID Gateway
* ScoutIQ AI Orchestrator

### ✅ Production-Grade Backend

* TypeScript + Node.js
* Express REST API
* Ollama LLM integration
* Robust error handling & logging
* Async service initialization
* Scalable architecture for future AI modules

---

## 🏗️ Architecture Overview

```
src/
├── grid/                 # GRID API Gateway Layer
│   ├── central/          # Central Data API
│   ├── stats/            # Statistics API
│   └── index.ts          # Unified GRID Gateway
│
├── scout/                # AI Scouting Engine
│   ├── scout.engine.ts
│   └── resolvers/
│
├── ollama/               # LLM Integration
│   └── ollama.client.ts
│
├── api/                  # REST API Routes
│   └── scout.routes.ts
│
├── server.ts             # Server Bootstrap
└── config/               # Environment & Config
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/scoutiq-backend.git
cd scoutiq-backend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file:

```env
GRID_API_KEY=YOUR_GRID_API_KEY
OLLAMA_URL=http://localhost:11434
PORT=4000
```

### 4️⃣ Start Ollama (LLM Engine)

```bash
ollama run mistral
```

### 5️⃣ Run ScoutIQ Backend

```bash
npm run dev
```

---

## 🌐 API Endpoints

### 🔎 Health Check

```bash
curl http://localhost:4000/api/v1/scout/health
```

### 🤖 AI Matchup Analysis

```bash
curl -X POST http://localhost:4000/api/v1/scout/matchup \
  -H "Content-Type: application/json" \
  -d '{"teamA":"Cloud9","teamB":"G2"}'
```

### 📊 Teams

```bash
curl http://localhost:4000/api/v1/scout/teams
```

### 👤 Players

```bash
curl http://localhost:4000/api/v1/scout/players
```

### 📈 Team Stats

```bash
curl http://localhost:4000/api/v1/scout/teams/{teamId}/stats
```

### 📉 Player Stats

```bash
curl http://localhost:4000/api/v1/scout/players/{playerId}/stats
```

---

## 🧠 AI Workflow

ScoutIQ processes data through a multi-layer intelligence pipeline:

```
GRID Data → Normalization → Analytics → AI Reasoning → Prediction → Scouting Report
```

---

## 🧩 Key Design Principles

* 🔹 Separation of concerns (Central vs Stats APIs)
* 🔹 Modular service architecture
* 🔹 AI + Data hybrid intelligence
* 🔹 Fail-safe design (AI works even if data partially fails)
* 🔹 Extensible for future ML & AGI modules

---

## 🚀 Roadmap

### ✅ Current (v1)

* GRID integration
* Ollama AI reasoning
* Matchup prediction engine
* Modular backend architecture

### 🔥 Next (v2+)

* Real ML models (Elo, Glicko, Neural Networks)
* External esports datasets (Kaggle, APIs)
* Player embeddings & synergy graphs
* Multi-title esports intelligence
* Web UI dashboard
* Client-server architecture
* Cloud deployment

---

## 🧬 Future Vision

ScoutIQ aims to become a full-scale esports intelligence system similar to what professional esports organizations use internally.

Long-term goals:

* Autonomous esports analysis
* Predictive meta modeling
* Multi-agent AI reasoning
* Real-time esports strategy simulation

---

## 🧑‍💻 Development Notes

* Main branch = GRID-based production engine
* Experimental AI models and datasets are developed in separate branches
* Host and Client architectures are planned as independent modules

---

## 📜 License

MIT License (or your preferred license)

---

## 🤝 Contributing

Contributions are welcome.
This project is designed for scalability, research, and real-world esports intelligence applications.

---

## ⭐ If you like ScoutIQ, star the repo and follow the journey.

ScoutIQ is not just a project — it’s an AI system for esports intelligence.
