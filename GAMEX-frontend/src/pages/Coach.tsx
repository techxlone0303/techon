import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  getMatchupDeepIntelligence,
  sendCoachChat,
  induceKnowledge,
  getKnowledgeGraph,
  getValorantPlayers,
  simulateRoundOutcome,
  getActiveStreams,
  getProductTeamFeed,
  DeepMatchupIntelligence,
  DeepAgentProfile,
  Timestamp15sDecision,
  KnowledgeGraphData,
  ValorantPlayer,
  TrackedStream,
  ProductFeedItem,
} from "@/lib/api";
import {
  ShieldAlert,
  Brain,
  MessageSquare,
  Sparkles,
  Zap,
  Target,
  Clock,
  Radio,
  Share2,
  Tv,
  Users,
  Compass,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Send,
  Plus,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";

const MAPS = ["Ascent", "Bind", "Haven", "Split", "Sunset", "Lotus", "Abyss", "Icebox", "Breeze"];
const TEAMS = ["Sentinels", "Fnatic", "Paper Rex", "Gen.G", "Team Liquid", "EDG", "Leviatán"];
const ECONOMIES = ["Full-Buy (Vandal/Phantom)", "Force-Buy (Sheriff/Spectre)", "Thrifty / Eco Round", "Pistol Round (Ghost/Frenzy)"];

export default function Coach() {
  // POV Matchup State
  const [myTeam, setMyTeam] = useState<string>("Sentinels");
  const [opponentTeam, setOpponentTeam] = useState<string>("Fnatic");
  const [selectedMap, setSelectedMap] = useState<string>("Ascent");
  const [side, setSide] = useState<"attack" | "defense">("attack");
  const [economy, setEconomy] = useState<string>("Full-Buy (Vandal/Phantom)");
  const [selectedModel, setSelectedModel] = useState<string>("nemotron");

  // Deep Matchup Intelligence Data
  const [matchupData, setMatchupData] = useState<DeepMatchupIntelligence | null>(null);
  const [loadingMatchup, setLoadingMatchup] = useState<boolean>(false);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState<number>(0);
  const [selectedAgentTab, setSelectedAgentTab] = useState<"myTeam" | "opponent">("myTeam");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Knowledge Graph State
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphData | null>(null);
  const [induceType, setInduceType] = useState<"youtube" | "scrim_note" | "tendency">("youtube");
  const [induceContent, setInduceContent] = useState<string>("");
  const [induceSource, setInduceSource] = useState<string>("");
  const [isInducing, setIsInducing] = useState<boolean>(false);
  const [latestAdaptiveCounter, setLatestAdaptiveCounter] = useState<any>(null);

  // Direct Nemotron AI Coach Chat
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "coach"; text: string; time: string }>>([
    {
      role: "coach",
      text: "Tactical Channel Open. I am your Nemotron-powered Valorant Head Coach. Select your team and opponent to simulate complete 5v5 ability strategies, or ask me any real-time question about counter-lineups, economy, or anti-stratting.",
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  // Web Speech Avatar
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Deployment & Loading State
  const [deployStep, setDeployStep] = useState<number>(1);
  const [hasDeployed, setHasDeployed] = useState<boolean>(false);

  // Auxiliary Telemetry
  const [players, setPlayers] = useState<ValorantPlayer[]>([]);
  const [activeStream, setActiveStream] = useState<TrackedStream | null>(null);
  const [productFeed, setProductFeed] = useState<ProductFeedItem[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<"masterplan" | "timeline" | "knowledgeGraph" | "streamRadar">("masterplan");

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initial Load: DO NOT preload matchup data! Load only auxiliary telemetry and graph.
  useEffect(() => {
    loadGraph();
    loadAuxiliaryTelemetry();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  async function loadDeepMatchup() {
    setLoadingMatchup(true);
    setDeployStep(1);
    setMatchupData(null); // Clear previous data so everything loads freshly upon click!

    const t1 = setTimeout(() => setDeployStep(2), 400);
    const t2 = setTimeout(() => setDeployStep(3), 900);

    try {
      const data = await getMatchupDeepIntelligence({
        myTeam,
        opponentTeam,
        map: selectedMap,
        side,
        economy,
        modelOverride: selectedModel,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      setDeployStep(4);
      setMatchupData(data);
      setHasDeployed(true);
      if (data.myRoster && data.myRoster.length > 0) {
        setExpandedAgent(data.myRoster[0].name);
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      console.warn("Failed to load deep matchup:", err);
      alert("Tactical deployment error: " + err.message);
    } finally {
      setLoadingMatchup(false);
    }
  }

  async function loadGraph() {
    try {
      const graph = await getKnowledgeGraph();
      setKnowledgeGraph(graph);
    } catch (err) {
      console.warn("Failed to load knowledge graph:", err);
    }
  }

  async function loadAuxiliaryTelemetry() {
    try {
      const [p, s, f] = await Promise.all([
        getValorantPlayers().catch(() => []),
        getActiveStreams().catch(() => []),
        getProductTeamFeed().catch(() => ({ feed: [] })),
      ]);
      setPlayers(p);
      if (s.length > 0) setActiveStream(s[0]);
      if (f.feed) setProductFeed(f.feed);
    } catch {
      // silent fallback
    }
  }

  // Handle Chat with Local Nemotron / Qwen Coach
  async function handleSendChat(e?: React.FormEvent, directPrompt?: string) {
    if (e) e.preventDefault();
    const query = directPrompt || chatInput;
    if (!query.trim() || isSendingChat) return;

    const userMsg = { role: "user" as const, text: query.trim(), time: "Now" };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!directPrompt) setChatInput("");
    setIsSendingChat(true);

    try {
      const res = await sendCoachChat({
        message: query.trim(),
        context: { myTeam, opponentTeam, map: selectedMap, side },
        modelOverride: selectedModel,
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "coach", text: res.reply, time: "Just now" },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: "Coach Nemotron Directive: Against " + opponentTeam + ", hold disciplined crossfires and let Sova drone clear before committing to site execute.",
          time: "Offline Call",
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  }

  // Handle Inducing Knowledge into Graph
  async function handleInduceKnowledge(e: React.FormEvent) {
    e.preventDefault();
    if (!induceContent.trim()) return;

    setIsInducing(true);
    try {
      const res = await induceKnowledge({
        type: induceType,
        content: induceContent,
        sourceUrl: induceSource,
        myTeam,
        opponentTeam,
        map: selectedMap,
      });
      setLatestAdaptiveCounter(res.adaptiveCounterStrategy);
      setInduceContent("");
      setInduceSource("");
      loadGraph();
    } catch (err: any) {
      alert("Error inducing knowledge: " + err.message);
    } finally {
      setIsInducing(false);
    }
  }

  // Web Speech Audio Avatar for Briefing
  function toggleSpeechBriefing() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!matchupData?.aiNemotronBriefing) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(matchupData.aiNemotronBriefing);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  const activeTimelineItem = matchupData?.timeline15s?.[activeTimelineIndex] || matchupData?.timeline15s?.[0];

  return (
    <Layout>
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-6">
        <div className="container-width space-y-6">

          {/* ================================================================= */}
          {/* 1. Header Banner & Tactical Control Bar */}
          {/* ================================================================= */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-widest">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  GAMEX Esports Intelligence • Player POV Command Center
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
                  Valorant AI Tactical Head Coach
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  5v5 Agent Roster Analysis, Ability Combinations, 15s Timestamp Timeline, & Local Ollama Nemotron Reasoning.
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Active: {selectedModel}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                  Port 4000: Ready
                </span>
              </div>
            </div>

            {/* Tactical Configuration Selectors */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 border-t border-slate-800">
              {/* My Team */}
              <div>
                <label className="block text-[11px] font-mono text-indigo-300 uppercase mb-1">
                  My Team (Your POV)
                </label>
                <select
                  value={myTeam}
                  onChange={(e) => setMyTeam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opponent Team */}
              <div>
                <label className="block text-[11px] font-mono text-rose-300 uppercase mb-1">
                  Opponent Team
                </label>
                <select
                  value={opponentTeam}
                  onChange={(e) => setOpponentTeam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Map */}
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                  Map
                </label>
                <select
                  value={selectedMap}
                  onChange={(e) => setSelectedMap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {MAPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Round Side */}
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                  Round Side
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setSide("attack")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      side === "attack"
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    Attack ⚔️
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("defense")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      side === "defense"
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    Defense 🛡️
                  </button>
                </div>
              </div>

              {/* Economy Phase */}
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                  Economy Phase
                </label>
                <select
                  value={economy}
                  onChange={(e) => setEconomy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 truncate"
                >
                  {ECONOMIES.map((eco) => (
                    <option key={eco} value={eco}>
                      {eco}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model & Generate Action */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={loadDeepMatchup}
                  disabled={loadingMatchup}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  {loadingMatchup ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Deploy Tactics
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tactical Loading Screen (Active Synthesis HUD) */}
          {loadingMatchup && (
            <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/40 p-8 lg:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/50 animate-spin" />
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-indigo-400">
                  <Radio className="w-6 h-6 animate-pulse text-indigo-400" />
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold block mb-1">
                  DEPLOYING TACTICAL REASONING ENGINE • {selectedModel.toUpperCase()}
                </span>
                <h2 className="text-2xl font-black text-white">
                  Synthesizing {myTeam} vs {opponentTeam} on {selectedMap}
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                  Drafting 5v5 agent utility suites, 15-second timeline progression, and anti-strat directives.
                </p>
              </div>

              {/* Progress Step Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left text-xs">
                <div className={`p-3 rounded-xl border transition-all ${deployStep >= 1 ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-900/30" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <div className="font-mono text-[10px] text-indigo-400 font-bold mb-1">STAGE 01</div>
                  <div>Map Geometry & Meta ({selectedMap})</div>
                </div>

                <div className={`p-3 rounded-xl border transition-all ${deployStep >= 2 ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-900/30" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <div className="font-mono text-[10px] text-indigo-400 font-bold mb-1">STAGE 02</div>
                  <div>Dual 5v5 Roster & Utilities</div>
                </div>

                <div className={`p-3 rounded-xl border transition-all ${deployStep >= 3 ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-900/30" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <div className="font-mono text-[10px] text-indigo-400 font-bold mb-1">STAGE 03</div>
                  <div>15s Agentic Decision Timeline</div>
                </div>

                <div className={`p-3 rounded-xl border transition-all ${deployStep >= 4 ? "bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-900/30" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <div className="font-mono text-[10px] text-emerald-400 font-bold mb-1">STAGE 04</div>
                  <div>Nemotron Tactical Briefing</div>
                </div>
              </div>
            </div>
          )}

          {/* Tactical Standby Screen (Awaiting Deployment HUD) */}
          {!matchupData && !loadingMatchup && (
            <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 p-8 lg:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono uppercase tracking-widest">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Tactical Command Room • Awaiting Deployment
              </div>

              <div className="max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Ready to Deploy Tactics: <span className="text-indigo-400">{myTeam}</span> vs <span className="text-rose-400">{opponentTeam}</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Select your team, opponent, map, side, and economy above, then click <strong className="text-white">"Deploy Tactics"</strong> to generate the comprehensive 5v5 agent utility playbook, 15-second agentic decision timeline, and Nemotron AI head coach directives. Everything loads freshly upon deployment!
                </p>
              </div>

              {/* Matchup Preview Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono">
                  Map: <strong className="text-white">{selectedMap}</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono">
                  Side: <strong className={side === "attack" ? "text-rose-400" : "text-indigo-400"}>{side.toUpperCase()} ⚔️</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono">
                  Economy: <strong className="text-amber-300">{economy.split(" ")[0]}</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono">
                  AI Model: <strong className="text-emerald-400">{selectedModel}</strong>
                </span>
              </div>

              {/* Big Center Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={loadDeepMatchup}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-indigo-600/40 hover:shadow-indigo-500/60 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  Deploy Tactical Masterplan
                </button>
              </div>

              {/* Feature Cards Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6 text-left border-t border-slate-800/80">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold mb-1">
                    <Users className="w-4 h-4" />
                    5v5 Dual-POV Agent Utilities
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Complete 4-ability breakdown for both teams with lineups, synergies, and counter-tactics.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold mb-1">
                    <Clock className="w-4 h-4" />
                    15s Timestamp Timeline
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Round progression from 0:00 to 1:45 with Nemotron live agentic voice calls and utility clocks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold mb-1">
                    <Share2 className="w-4 h-4" />
                    Knowledge Graph & Chat
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Induce YouTube stream insights and chat directly with local Ollama Nemotron model.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. Top AI Coach Briefing Card & Audio Narration */}
          {/* ================================================================= */}
          {matchupData && !loadingMatchup && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 8 Cols: AI Nemotron Tactical Call */}
              <div className="lg:col-span-8 rounded-xl bg-slate-900/90 border border-indigo-500/20 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Brain className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-300">
                      Nemotron AI Head Coach • Pre-Round Directive
                    </span>
                  </div>

                  <button
                    onClick={toggleSpeechBriefing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs transition cursor-pointer"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-400 font-mono">Mute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-mono">Listen Briefing</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  "{matchupData.aiNemotronBriefing}"
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono text-indigo-400">Formation:</span>
                  <span className="text-slate-300">{matchupData.formationRecommendation}</span>
                </div>
              </div>

              {/* Right 4 Cols: Crazy Gameplay Gimmick Card */}
              <div className="lg:col-span-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-purple-500/30 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-mono uppercase mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Gameplay Gimmick (High IQ Play)
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">
                    {matchupData.crazyGameplayGimmick.name}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {matchupData.crazyGameplayGimmick.setup}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
                  <span className="text-amber-300 font-mono">
                    Win Con: {matchupData.crazyGameplayGimmick.winCondition}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    {matchupData.crazyGameplayGimmick.riskReward}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. Main Navigation View Tabs */}
          {/* ================================================================= */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar flex-nowrap">
            <button
              onClick={() => setActiveViewTab("masterplan")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeViewTab === "masterplan"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              5v5 Agent Rosters & Valorant Utilities
            </button>

            <button
              onClick={() => setActiveViewTab("timeline")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeViewTab === "timeline"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              15-Second Agentic Decision Timeline (0:00 - 1:45)
            </button>

            <button
              onClick={() => setActiveViewTab("knowledgeGraph")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeViewTab === "knowledgeGraph"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Share2 className="w-4 h-4" />
              Knowledge Graph & Live Induction
            </button>

            <button
              onClick={() => setActiveViewTab("streamRadar")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeViewTab === "streamRadar"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Tv className="w-4 h-4" />
              Live YouTube Telemetry & Tilt Radar
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: 5v5 Agent Rosters & Valorant Utilities (Dual POV) */}
          {/* ================================================================= */}
          {activeViewTab === "masterplan" && matchupData && (
            <div className="space-y-6">
              {/* POV Selector */}
              <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedAgentTab("myTeam")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      selectedAgentTab === "myTeam"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    My Team POV: {myTeam} (Our Setup & Synergy)
                  </button>

                  <button
                    onClick={() => setSelectedAgentTab("opponent")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      selectedAgentTab === "opponent"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Opponent POV: {opponentTeam} (Counters & Vulnerabilities)
                  </button>
                </div>

                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  Click any agent to inspect all 4 authentic Valorant utilities & lineups
                </span>
              </div>

              {/* Agent Roster Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {(selectedAgentTab === "myTeam"
                  ? matchupData.myRoster
                  : matchupData.opponentRoster
                ).map((agent, idx) => {
                  const isExpanded = expandedAgent === agent.name;
                  const isOpponent = selectedAgentTab === "opponent";

                  return (
                    <div
                      key={idx}
                      onClick={() => setExpandedAgent(isExpanded ? null : agent.name)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isExpanded
                          ? isOpponent
                            ? "bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-900/20"
                            : "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-900/20"
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                              agent.role === "Duelist"
                                ? "bg-rose-500/20 text-rose-300"
                                : agent.role === "Initiator"
                                ? "bg-amber-500/20 text-amber-300"
                                : agent.role === "Controller"
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {agent.role}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">Slot #{idx + 1}</span>
                        </div>

                        <h3 className="text-lg font-extrabold text-white">{agent.name}</h3>

                        <div className="mt-2 text-xs text-slate-300 line-clamp-2">
                          {isOpponent
                            ? `Counter: ${agent.counterTactic}`
                            : `Setup: ${agent.setupPosition}`}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-mono">
                        <span>4 Abilities Loaded</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Active Agent 4-Ability Breakdown View */}
              {(() => {
                const activeAgentData = (
                  selectedAgentTab === "myTeam"
                    ? matchupData.myRoster
                    : matchupData.opponentRoster
                ).find((a) => a.name === expandedAgent) || (selectedAgentTab === "myTeam" ? matchupData.myRoster[0] : matchupData.opponentRoster[0]);

                if (!activeAgentData) return null;

                return (
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-white">{activeAgentData.name}</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold uppercase">
                            {activeAgentData.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          {selectedAgentTab === "myTeam" ? myTeam : opponentTeam} Tactical Assignment on {selectedMap}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-400">Tactical Position: </span>
                          <span className="text-slate-200 font-medium">{activeAgentData.setupPosition}</span>
                        </div>
                      </div>
                    </div>

                    {/* All 4 Specific Valorant Abilities */}
                    <div>
                      <h4 className="text-xs font-mono uppercase text-indigo-300 mb-3 tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Complete Valorant Ability Suite & Utility Execution
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {activeAgentData.abilities.map((ability, aIdx) => (
                          <div
                            key={aIdx}
                            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="w-6 h-6 rounded bg-indigo-600/30 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                                  {ability.slot}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {ability.cooldownOrCost}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-sm mb-1">{ability.name}</h5>
                              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                                {ability.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90">
                              <span className="font-mono text-slate-400">Map Usage: </span>
                              {ability.tacticalUsage}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Synergy & Counter-Play Protocols */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                        <span className="text-xs font-mono uppercase text-indigo-300 block mb-1">
                          Utility Synergy Combo
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {activeAgentData.utilitySynergy}
                        </p>
                      </div>

                      {activeAgentData.counterTactic ? (
                        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20">
                          <span className="text-xs font-mono uppercase text-rose-300 block mb-1">
                            Counter-Play Protocol & Tilt Vulnerability
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {activeAgentData.counterTactic} {activeAgentData.tiltVulnerability}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                          <span className="text-xs font-mono uppercase text-emerald-300 block mb-1">
                            Execution Goal
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            Synchronize opening flash/smoke within the first 15 seconds to claim uncontested map territory.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: 15-Second Granular Agentic Decision Timeline */}
          {/* ================================================================= */}
          {activeViewTab === "timeline" && matchupData && (
            <div className="space-y-6">
              {/* Scrubbing Bar */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Clock className="w-4 h-4" />
                    Round Progression Intervals (0:00 - 1:45)
                  </span>
                  <span>Active Phase: {activeTimelineItem?.interval}</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 no-scrollbar">
                  {matchupData.timeline15s.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTimelineIndex(idx)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between min-w-[125px] sm:min-w-0 shrink-0 sm:shrink ${
                        activeTimelineIndex === idx
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold block">{item.interval}</span>
                      <span className="text-xs font-semibold truncate block mt-1">{item.phaseTitle.split("&")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Interval Detail Card */}
              {activeTimelineItem && (
                <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/30 p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                          {activeTimelineItem.interval}
                        </span>
                        <h3 className="text-xl font-bold text-white">{activeTimelineItem.phaseTitle}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Tactical Goal: {activeTimelineItem.tacticalGoal}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                        {activeTimelineItem.riskReward}
                      </span>
                    </div>
                  </div>

                  {/* Nemotron Agentic Decision Callout */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/50 border border-indigo-500/40">
                    <span className="text-xs font-mono uppercase text-indigo-300 tracking-wider block mb-1">
                      Nemotron Real-Time Agentic Voice Callout
                    </span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {activeTimelineItem.agenticDecision}
                    </p>
                  </div>

                  {/* Dual Utility Split for this 15-second block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20">
                      <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {myTeam} Utility Execution
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {activeTimelineItem.myTeamUtility}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/20">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase mb-2">
                        <ShieldAlert className="w-4 h-4" />
                        {opponentTeam} Expected Utility & Response
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {activeTimelineItem.opponentUtility}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-mono text-amber-400/90 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Key In-Game Callout: {activeTimelineItem.keyCallout}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: Valorant Knowledge Graph & Induction Studio */}
          {/* ================================================================= */}
          {activeViewTab === "knowledgeGraph" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Cols: Knowledge Graph Visualization */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold text-white text-base">
                        Valorant Strategic Knowledge Graph
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {knowledgeGraph?.nodes.length || 0} Nodes • {knowledgeGraph?.links.length || 0} Links
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Live relational network connecting teams, map geometries, ability combos, and counter-tactics.
                  </p>

                  {/* Visual Node Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {knowledgeGraph?.nodes.map((node) => (
                      <div
                        key={node.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                node.type === "team"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : node.type === "ability"
                                  ? "bg-indigo-500/20 text-indigo-300"
                                  : node.type === "counter"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {node.type}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {Math.round(node.confidence * 100)}% Conf
                            </span>
                          </div>
                          <h5 className="font-bold text-xs text-white mb-1">{node.label}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                            {node.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 Cols: Induce Live Knowledge Studio */}
                <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/30 p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Induce Live Knowledge into Coach Model
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Paste YouTube VOD stream notes, caster insights, or scrim habits to dynamically adapt the counter-strat.
                    </p>
                  </div>

                  <form onSubmit={handleInduceKnowledge} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        Knowledge Type
                      </label>
                      <select
                        value={induceType}
                        onChange={(e: any) => setInduceType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <option value="youtube">Live YouTube Stream / Caster Quote</option>
                        <option value="tendency">Opponent Habit / Peeking Tendency</option>
                        <option value="scrim_note">Scrim Note / Tactical Observation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        Observed Intelligence or Caster Quote
                      </label>
                      <textarea
                        rows={3}
                        value={induceContent}
                        onChange={(e) => setInduceContent(e.target.value)}
                        placeholder="e.g. Boaster rotates off B site whenever Sova darts A-Main antenna..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        Source Link (Optional YouTube VOD)
                      </label>
                      <input
                        type="url"
                        value={induceSource}
                        onChange={(e) => setInduceSource(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isInducing}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isInducing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Inducing into Graph...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          Induce into Coach Memory & Graph
                        </>
                      )}
                    </button>
                  </form>

                  {/* Dynamically Generated Counter Card */}
                  {latestAdaptiveCounter && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                        ⚡ Newly Generated Counter-Adaptation
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        {latestAdaptiveCounter.directiveTitle}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {latestAdaptiveCounter.counterPlaybook}
                      </p>
                      <div className="text-[11px] font-mono text-amber-300 pt-1">
                        Utility: {latestAdaptiveCounter.recommendedUtilityCombo}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: Live YouTube Telemetry & Tilt Radar */}
          {/* ================================================================= */}
          {activeViewTab === "streamRadar" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Stream Telemetry */}
              <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-base">
                      VCT Tournament Broadcast Telemetry
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-mono">
                    LIVE
                  </span>
                </div>

                {activeStream ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-mono">Tournament</span>
                        <h4 className="text-sm font-bold text-white">{activeStream.title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-mono">Viewers</span>
                        <div className="text-sm font-extrabold text-emerald-400 font-mono">
                          {activeStream.liveViewers.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Chat Hype Index */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-400">Audience Chat Hype Index</span>
                        <span className="text-amber-400 font-bold">{activeStream.chatHypeIndex} / 100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-amber-500 h-full transition-all duration-500"
                          style={{ width: `${activeStream.chatHypeIndex}%` }}
                        />
                      </div>
                    </div>

                    {/* Recent Caster Quote */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-indigo-400 font-mono font-bold block mb-1">
                        Caster Broadcast Quote:
                      </span>
                      <p className="italic text-slate-200">
                        "{activeStream.recentCasterQuotes?.[0]?.quote || "Huge first blood trade on the A-site rotate!"}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-6 text-center">
                    Syncing YouTube live broadcast telemetry...
                  </div>
                )}
              </div>

              {/* Player Mental Tilt Radar */}
              <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">
                      Valorant Pro Mental Tilt Radar
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Python Analytics Core</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {players.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white text-sm">{p.name}</span>
                        <span className="text-slate-400">({p.team} • {p.agent})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono">ACS: {p.acs}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                            p.tiltStatus === "Flow State"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : p.tiltStatus === "Shaky"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {p.tiltStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. Direct Local Ollama Nemotron AI Coach Chat Terminal */}
          {/* ================================================================= */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/70 border border-indigo-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Direct Tactical Communication with AI Coach ({selectedModel})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ask real-time questions, request counter-formations, or solve retake scenarios.
                  </p>
                </div>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, "How do we counter their A-site Cypher setup?")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-indigo-300 border border-slate-700 transition"
                >
                  💡 Counter Cypher Setup
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, "Give me a crazy thrifty round eco play.")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 border border-slate-700 transition"
                >
                  ⚡ Eco Round Gimmick
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, "Our Cypher died early, what is our 4v5 retake formation?")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 border border-slate-700 transition"
                >
                  🛡️ 4v5 Retake Formation
                </button>
              </div>
            </div>

            {/* Chat Messages Container */}
            <div
              ref={chatScrollRef}
              className="bg-slate-950/90 rounded-xl border border-slate-800/90 p-4 h-[240px] overflow-y-auto space-y-3 text-xs"
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-3 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 border border-indigo-500/20 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>{msg.role === "user" ? "You (Player POV)" : `Coach Nemotron`}</span>
                      <span className="opacity-70">{msg.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isSendingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-3 text-slate-400 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Coach Nemotron is reasoning tactical counter...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the AI Coach: 'How do we deny their mid-market push with Omen smokes?'..."
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}
