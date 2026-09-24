/**
 * GAMEX Esports AI Intelligence - Frontend API Client
 * Authored by Dhanshree Katre
 * 
 * Seamlessly interfaces with the local GAMEX Backend (port 4000):
 * - Valorant AI Coach & Player Analytics
 * - Crazy & Apt Tactical Playbook Generator (local Ollama LLM)
 * - Agent Coach Memory & Live Product Team Feed
 * - Live YouTube Esports Stream Tracking & Audience Hype Meter
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export interface ValorantPlayer {
  name: string;
  team: string;
  agent: string;
  role: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  adr: number;
  acs: number;
  hsPercentage: number;
  tiltScore: number;
  tiltStatus: "Flow State" | "Shaky" | "Tilted";
  clutchWinPercentage: number;
  impactRating: number;
  tendency: string;
}

export interface StrategyPlan {
  map: string;
  scoreContext: string;
  economyContext: string;
  activeModel: string;
  aiCommentary: string;
  crazyStrategy: {
    name: string;
    vibe: string;
    riskReward: string;
    setup: string;
    winCondition: string;
    aptnessRating: number;
    coachNotes: string;
  };
  aptStrategy: {
    name: string;
    vibe: string;
    riskReward: string;
    setup: string;
    winCondition: string;
    aptnessRating: number;
    coachNotes: string;
  };
  liveProductTeamAlert: any;
}

export interface WorkingMemory {
  matchId: string;
  map: string;
  teamA: string;
  teamB: string;
  currentRound: number;
  score: { teamA: number; teamB: number };
  sideA: string;
  economyTeamA: string;
  economyTeamB: string;
  momentum: string;
  lastRoundOutcome?: any;
}

export interface TrackedStream {
  streamId: string;
  streamUrl: string;
  title: string;
  tournament: string;
  teams: { teamA: string; teamB: string };
  matchState: {
    currentMap: string;
    score: string;
    round: number;
  };
  liveViewers: number;
  chatHypeIndex: number;
  chatVelocity: number;
  sentiment: string;
  topChatKeywords: Array<{ keyword: string; count: number }>;
  recentCasterQuotes: Array<{ caster: string; quote: string; timestamp: string }>;
  aiBroadcastInsights: string[];
  tacticalOverlayCallout: string;
}

export interface ProductFeedItem {
  id: string;
  timestamp: string;
  type: string;
  priority: string;
  title: string;
  summary: string;
  data: Record<string, any>;
  suggestedAction?: string;
}

// ============================================================================
// API Calls
// ============================================================================

export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE_URL}/scout/health`);
  if (!res.ok) throw new Error("Backend unreachable");
  return res.json();
}

export async function getValorantPlayers(): Promise<ValorantPlayer[]> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/players`);
  if (!res.ok) throw new Error("Failed to fetch players");
  const data = await res.json();
  return data.players || [];
}

export async function generateCoachStrategy(params: {
  map: string;
  scoreState: string;
  economyState: string;
}): Promise<StrategyPlan> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate strategy");
  const data = await res.json();
  return data.strategyPlan;
}

export async function getAgentMemory(): Promise<{
  workingMemory: WorkingMemory;
  playerTendencies: any[];
  strategyStats: any;
}> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/memory`);
  if (!res.ok) throw new Error("Failed to fetch agent memory");
  return res.json();
}

export async function simulateRoundOutcome(payload: {
  winner: string;
  mvp: string;
  crazyStratUsed?: string;
  stratSuccess?: boolean;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/round-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update round");
  return res.json();
}

export async function getActiveStreams(): Promise<TrackedStream[]> {
  const res = await fetch(`${API_BASE_URL}/youtube/active`);
  if (!res.ok) throw new Error("Failed to fetch active streams");
  const data = await res.json();
  return data.streams || [];
}

export async function getStreamInsights(streamId?: string): Promise<TrackedStream> {
  const url = streamId ? `${API_BASE_URL}/youtube/insights/${streamId}` : `${API_BASE_URL}/youtube/insights`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch stream insights");
  const data = await res.json();
  return data.insights;
}

export async function trackNewStream(params: {
  streamUrl: string;
  teamA?: string;
  teamB?: string;
  tournament?: string;
}): Promise<TrackedStream> {
  const res = await fetch(`${API_BASE_URL}/youtube/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to track stream");
  const data = await res.json();
  return data.stream;
}

export async function getProductTeamFeed(): Promise<{
  feed: ProductFeedItem[];
  activeMatch: any;
}> {
  const res = await fetch(`${API_BASE_URL}/product-team/live-feed`);
  if (!res.ok) throw new Error("Failed to fetch product team feed");
  return res.json();
}

export async function sendCoachingNote(title: string, note: string, priority: string = "HIGH"): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/product-team/coaching-note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, note, priority }),
  });
  if (!res.ok) throw new Error("Failed to send coaching note");
  return res.json();
}

// ============================================================================
// Deep Valorant Esports Matchup Intelligence & Nemotron Chat
// ============================================================================

export interface ValorantAbilityDetail {
  name: string;
  slot: string;
  description: string;
  tacticalUsage: string;
  cooldownOrCost: string;
}

export interface DeepAgentProfile {
  name: string;
  role: string;
  abilities: ValorantAbilityDetail[];
  utilitySynergy: string;
  setupPosition: string;
  counterTactic?: string;
  tiltVulnerability?: string;
}

export interface Timestamp15sDecision {
  interval: string;
  phaseTitle: string;
  myTeamUtility: string;
  opponentUtility: string;
  agenticDecision: string;
  riskReward: string;
  tacticalGoal: string;
  keyCallout: string;
}

export interface DeepMatchupIntelligence {
  myTeam: string;
  opponentTeam: string;
  map: string;
  side: "attack" | "defense";
  economy: string;
  activeModel: string;
  myRoster: DeepAgentProfile[];
  opponentRoster: DeepAgentProfile[];
  timeline15s: Timestamp15sDecision[];
  aiNemotronBriefing: string;
  tacticalCounters: string[];
  formationRecommendation: string;
  crazyGameplayGimmick: {
    name: string;
    setup: string;
    winCondition: string;
    riskReward: string;
  };
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  details: string;
  confidence: number;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export async function getMatchupDeepIntelligence(params: {
  myTeam?: string;
  opponentTeam?: string;
  map?: string;
  side?: "attack" | "defense";
  economy?: string;
  modelOverride?: string;
}): Promise<DeepMatchupIntelligence> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/matchup-deep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to load deep matchup intelligence");
  const data = await res.json();
  return data.data;
}

export async function sendCoachChat(params: {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  context?: { myTeam?: string; opponentTeam?: string; map?: string; side?: string };
  modelOverride?: string;
}): Promise<{ reply: string; activeModel: string }> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to communicate with AI Coach");
  return res.json();
}

export async function induceKnowledge(payload: {
  type: "youtube" | "scrim_note" | "grid_data" | "tendency";
  content: string;
  sourceUrl?: string;
  myTeam?: string;
  opponentTeam?: string;
  map?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/induce-knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to induce knowledge");
  return res.json();
}

export async function getKnowledgeGraph(): Promise<KnowledgeGraphData> {
  const res = await fetch(`${API_BASE_URL}/valorant/coach/knowledge-graph`);
  if (!res.ok) throw new Error("Failed to fetch knowledge graph");
  const data = await res.json();
  return data.graph;
}

