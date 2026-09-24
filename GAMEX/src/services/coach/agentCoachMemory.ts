/**
 * ScoutIQ Esports AI Intelligence - Agent Coach Memory Engine
 * 
 * Provides unified hierarchical memory for the AI Coach:
 * 1. Working Memory (Short-Term): Active match round, economy, site state, alive players, momentum.
 * 2. Long-Term Memory (Persistent): Player tendencies, historic clutch rates, tilt thresholds, anti-strats.
 * 3. Strategy Feedback Memory: Tracks success/failure of crazy & apt strategies.
 * 4. Live Product Team Stream: Real-time broadcast and coaching feed for product teams.
 */

export interface PlayerTendencyMemory {
  playerName: string;
  team: string;
  preferredAgents: string[];
  playstyle: string;
  aggressionRating: number; // 0.0 - 1.0
  tiltSensitivity: number; // 0.0 - 1.0 (how fast performance degrades on death streak)
  favoritePositions: string[];
  knownWeaknesses: string[];
  clutchRating: number; // 0.0 - 1.0
  notes: string[];
}

export interface MatchWorkingMemory {
  matchId: string;
  map: string;
  teamA: string;
  teamB: string;
  currentRound: number;
  score: { teamA: number; teamB: number };
  sideA: "attack" | "defense";
  economyTeamA: "Eco" | "Force-Buy" | "Semi-Buy" | "Full-Buy";
  economyTeamB: "Eco" | "Force-Buy" | "Semi-Buy" | "Full-Buy";
  momentum: "teamA_heavy" | "teamA_slight" | "neutral" | "teamB_slight" | "teamB_heavy";
  consecutiveRoundsWonTeamA: number;
  consecutiveRoundsWonTeamB: number;
  lastRoundOutcome?: {
    winner: string;
    reason: "elimination" | "spike_defused" | "spike_detonated" | "time";
    mvp: string;
    crazyStratAttempted?: string;
    wasCrazyStratSuccessful?: boolean;
  };
}

export interface ProductTeamFeedItem {
  id: string;
  timestamp: string;
  type: "TACTICAL_ALERT" | "TILT_WARNING" | "CRAZY_STRAT" | "CLUTCH_MOMENT" | "LIVE_INSIGHT";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  title: string;
  summary: string;
  data: Record<string, any>;
  suggestedAction?: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: "team" | "player" | "agent" | "ability" | "counter" | "youtube_insight" | "map_callout";
  details: string;
  confidence: number;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  relation: string;
}

export class AgentCoachMemory {
  private workingMemory: MatchWorkingMemory;
  private playerTendencies: Map<string, PlayerTendencyMemory> = new Map();
  private strategyHistory: Map<string, { attempts: number; wins: number; winRate: number }> = new Map();
  private productTeamFeed: ProductTeamFeedItem[] = [];

  constructor() {
    this.workingMemory = this.getInitialWorkingMemory();
    this.seedDefaultPlayerTendencies();
  }

  private getInitialWorkingMemory(): MatchWorkingMemory {
    return {
      matchId: "vct-match-" + Date.now(),
      map: "Ascent",
      teamA: "Sentinels",
      teamB: "Fnatic",
      currentRound: 8,
      score: { teamA: 5, teamB: 3 },
      sideA: "attack",
      economyTeamA: "Full-Buy",
      economyTeamB: "Force-Buy",
      momentum: "teamA_slight",
      consecutiveRoundsWonTeamA: 2,
      consecutiveRoundsWonTeamB: 0,
      lastRoundOutcome: {
        winner: "Sentinels",
        reason: "spike_detonated",
        mvp: "zekken",
        crazyStratAttempted: "Mid Market Odin Wallbang Trap",
        wasCrazyStratSuccessful: true,
      },
    };
  }

  private seedDefaultPlayerTendencies(): void {
    const tendencies: PlayerTendencyMemory[] = [
      {
        playerName: "TenZ",
        team: "Sentinels",
        preferredAgents: ["Omen", "Yoru", "Jett"],
        playstyle: "Aggressive entry controller, exceptional first-contact micro-flicks",
        aggressionRating: 0.88,
        tiltSensitivity: 0.35,
        favoritePositions: ["A-Main Ascent", "Hookah Bind", "B-Long Pearl"],
        knownWeaknesses: ["Occasionally overheats on solo dry peeks without flash support"],
        clutchRating: 0.84,
        notes: ["Switches to proactive teleport setups when opponent plays slow default"],
      },
      {
        playerName: "zekken",
        team: "Sentinels",
        preferredAgents: ["Jett", "Raze"],
        playstyle: "Hyper-fast site entry and high first-blood conversion",
        aggressionRating: 0.94,
        tiltSensitivity: 0.25,
        favoritePositions: ["A-Rafters", "B-Main", "Showers"],
        knownWeaknesses: ["High-commitment satchels can be punished by well-timed stuns"],
        clutchRating: 0.80,
        notes: ["Dominates early round space; requires secondary flash support"],
      },
      {
        playerName: "Chronicle",
        team: "Fnatic",
        preferredAgents: ["Sova", "Breach", "KAY/O"],
        playstyle: "Methodical utility master, clutch anchor, extremely reliable under pressure",
        aggressionRating: 0.55,
        tiltSensitivity: 0.20,
        favoritePositions: ["B-Site Ascent", "A-Lamps Bind", "C-Long Haven"],
        knownWeaknesses: ["Can get overwhelmed if retake utility is baited out early"],
        clutchRating: 0.92,
        notes: ["Legendary 1v2 conversion rate; holds sites down to the wire"],
      },
      {
        playerName: "Boaster",
        team: "Fnatic",
        preferredAgents: ["Astra", "Omen", "Viper"],
        playstyle: "Macro IGL, strategic calling, heavy tactical timeout adjustments",
        aggressionRating: 0.40,
        tiltSensitivity: 0.50,
        favoritePositions: ["Spawn connector", "Tree room", "Back site"],
        knownWeaknesses: ["Lower raw ACS; vulnerable when isolated in direct aim duels"],
        clutchRating: 0.65,
        notes: ["Calls crazy mid-round counter-rotations when under score deficit"],
      },
      {
        playerName: "Derke",
        team: "Fnatic",
        preferredAgents: ["Yoru", "Jett", "Raze"],
        playstyle: "Explosive entry duelist, aggressive Operator holds",
        aggressionRating: 0.90,
        tiltSensitivity: 0.45,
        favoritePositions: ["Mid tiles", "A-Heaven", "B-Elbow"],
        knownWeaknesses: ["Can tilt if 0-3 on opening duels against aggressive anti-Op utility"],
        clutchRating: 0.78,
        notes: ["Operator usage swings momentum heavily in Fnatic's favor"],
      },
      {
        playerName: "aspas",
        team: "Leviatán",
        preferredAgents: ["Jett", "Iso"],
        playstyle: "Near-flawless mechanical duelist, unmatched positioning and reset timing",
        aggressionRating: 0.85,
        tiltSensitivity: 0.15,
        favoritePositions: ["A-Long Haven", "B-Site Bind", "Mid Market"],
        knownWeaknesses: ["Requires team to trade his entries cleanly"],
        clutchRating: 0.95,
        notes: ["Highest KAST in tier 1 esports; rarely overcommits without an escape route"],
      },
    ];

    for (const t of tendencies) {
      this.playerTendencies.set(t.playerName.toLowerCase(), t);
    }
  }

  // =========================================================================
  // Working Memory Management
  // =========================================================================

  public getWorkingMemory(): MatchWorkingMemory {
    return { ...this.workingMemory };
  }

  public updateRound(update: Partial<MatchWorkingMemory>): MatchWorkingMemory {
    this.workingMemory = {
      ...this.workingMemory,
      ...update,
    };

    // Calculate momentum
    const diff = this.workingMemory.score.teamA - this.workingMemory.score.teamB;
    if (diff >= 4) this.workingMemory.momentum = "teamA_heavy";
    else if (diff >= 2) this.workingMemory.momentum = "teamA_slight";
    else if (diff <= -4) this.workingMemory.momentum = "teamB_heavy";
    else if (diff <= -2) this.workingMemory.momentum = "teamB_slight";
    else this.workingMemory.momentum = "neutral";

    // Broadcast update to product team feed
    this.addFeedItem({
      type: "TACTICAL_ALERT",
      priority: "MEDIUM",
      title: `Round ${this.workingMemory.currentRound} Started (${this.workingMemory.score.teamA} - ${this.workingMemory.score.teamB})`,
      summary: `Score: ${this.workingMemory.teamA} ${this.workingMemory.score.teamA} - ${this.workingMemory.score.teamB} ${this.workingMemory.teamB} | Map: ${this.workingMemory.map}`,
      data: {
        economy: {
          [this.workingMemory.teamA]: this.workingMemory.economyTeamA,
          [this.workingMemory.teamB]: this.workingMemory.economyTeamB,
        },
        momentum: this.workingMemory.momentum,
      },
      suggestedAction:
        this.workingMemory.economyTeamA === "Eco"
          ? "Deploy Crazy Eco Trap Strategy (Shotgun Stack / Fast Audio Fake)"
          : "Execute Apt Default with High Map Control",
    });

    return this.getWorkingMemory();
  }

  // =========================================================================
  // Long-Term Player Tendency Management
  // =========================================================================

  public getPlayerTendency(name: string): PlayerTendencyMemory | undefined {
    return this.playerTendencies.get(name.toLowerCase());
  }

  public getAllPlayerTendencies(): PlayerTendencyMemory[] {
    return Array.from(this.playerTendencies.values());
  }

  public recordPlayerEvent(playerName: string, event: { isDeath?: boolean; isFirstBlood?: boolean; isClutch?: boolean; tilted?: boolean }): void {
    const tendency = this.playerTendencies.get(playerName.toLowerCase());
    if (!tendency) return;

    if (event.tilted) {
      this.addFeedItem({
        type: "TILT_WARNING",
        priority: "HIGH",
        title: `🚨 Tilt Alert: ${tendency.playerName} (${tendency.team})`,
        summary: `${tendency.playerName} is showing elevated tilt indicators after consecutive opening deaths.`,
        data: {
          playerName: tendency.playerName,
          team: tendency.team,
          tiltSensitivity: tendency.tiltSensitivity,
        },
        suggestedAction: `Target ${tendency.playerName}'s lane with double flash and early crossfire trap.`,
      });
    }

    if (event.isClutch) {
      this.addFeedItem({
        type: "CLUTCH_MOMENT",
        priority: "CRITICAL",
        title: `🔥 Clutch Factor: ${tendency.playerName}`,
        summary: `${tendency.playerName} secured a high-leverage 1vX clutch, swinging round economy!`,
        data: {
          playerName: tendency.playerName,
          clutchRating: tendency.clutchRating,
        },
        suggestedAction: "Ride momentum with aggressive opening territory fight next round.",
      });
    }
  }

  // =========================================================================
  // Strategy Outcome Tracking
  // =========================================================================

  public recordStrategyOutcome(strategyName: string, won: boolean): void {
    const existing = this.strategyHistory.get(strategyName) || { attempts: 0, wins: 0, winRate: 0 };
    existing.attempts += 1;
    if (won) existing.wins += 1;
    existing.winRate = Math.round((existing.wins / existing.attempts) * 100);
    this.strategyHistory.set(strategyName, existing);

    this.addFeedItem({
      type: "CRAZY_STRAT",
      priority: won ? "HIGH" : "MEDIUM",
      title: `${won ? "✅ Success" : "❌ Disrupted"}: Strategy "${strategyName}"`,
      summary: `Strategy execution concluded with ${won ? "a round win" : "an opponent counter-play"}. Win rate: ${existing.winRate}% across ${existing.attempts} attempts.`,
      data: {
        strategyName,
        success: won,
        stats: existing,
      },
      suggestedAction: won
        ? "Condition the opponent: they will expect this again, prepare a fake variant!"
        : "Revert to Apt Standard Default for stable economy.",
    });
  }

  public getStrategyStats(): Record<string, any> {
    const res: Record<string, any> = {};
    this.strategyHistory.forEach((val, key) => {
      res[key] = val;
    });
    return res;
  }

  // =========================================================================
  // Knowledge Graph & Live Induction System
  // =========================================================================
  private knowledgeNodes: Map<string, KnowledgeNode> = new Map();
  private knowledgeLinks: KnowledgeLink[] = [];

  private seedDefaultKnowledgeGraph(): void {
    const defaultNodes: KnowledgeNode[] = [
      { id: "node-map-ascent", label: "Ascent Map Geometry", type: "map_callout", details: "High mid control value; tight choke points into A-Main and B-Lane.", confidence: 0.98 },
      { id: "node-team-sentinels", label: "Sentinels Tactics", type: "team", details: "Aggressive entry protocol with dual flash-dash synchronization.", confidence: 0.95 },
      { id: "node-team-fnatic", label: "Fnatic Macro", type: "team", details: "Boaster's structured slow-default system and delayed site collapses.", confidence: 0.92 },
      { id: "node-agent-omen", label: "Omen Dark Cover & Paranoia", type: "ability", details: "30s rechargeable smokes + blind through geometry; sets up Jett dash.", confidence: 0.94 },
      { id: "node-agent-cypher", label: "Cypher Tripwires & Spycam", type: "ability", details: "Impenetrable flank hold; requires drone or shock dart pre-clear.", confidence: 0.96 },
      { id: "node-counter-derke-op", label: "Anti-Operator Smoke Blind", type: "counter", details: "Double flash + high smoke to completely deny Derke's A-Heaven Op angle.", confidence: 0.91 },
      { id: "node-yt-vct-insight", label: "VCT YouTube Telemetry", type: "youtube_insight", details: "Live stream chat velocity and caster quotes indicate 78% winrate on B-executes.", confidence: 0.89 },
    ];

    const defaultLinks: KnowledgeLink[] = [
      { source: "node-team-sentinels", target: "node-map-ascent", relation: "SPECIALIZES_IN" },
      { source: "node-agent-omen", target: "node-counter-derke-op", relation: "EXECUTES" },
      { source: "node-counter-derke-op", target: "node-team-fnatic", relation: "COUNTERS" },
      { source: "node-agent-cypher", target: "node-map-ascent", relation: "LOCKS_DOWN" },
      { source: "node-yt-vct-insight", target: "node-team-sentinels", relation: "EXTRACTED_FROM" },
    ];

    defaultNodes.forEach(n => this.knowledgeNodes.set(n.id, n));
    this.knowledgeLinks = defaultLinks;
  }

  public getKnowledgeGraph(): { nodes: KnowledgeNode[]; links: KnowledgeLink[] } {
    if (this.knowledgeNodes.size === 0) {
      this.seedDefaultKnowledgeGraph();
    }
    return {
      nodes: Array.from(this.knowledgeNodes.values()),
      links: this.knowledgeLinks,
    };
  }

  public induceKnowledge(payload: {
    type: "youtube" | "scrim_note" | "grid_data" | "tendency";
    content: string;
    sourceUrl?: string;
    myTeam?: string;
    opponentTeam?: string;
    map?: string;
  }): {
    newNode: KnowledgeNode;
    newLinks: KnowledgeLink[];
    adaptiveCounterStrategy: any;
    feedItem: ProductTeamFeedItem;
  } {
    if (this.knowledgeNodes.size === 0) this.seedDefaultKnowledgeGraph();

    const nodeId = "induced-" + Date.now();
    const cleanContent = payload.content.trim();
    const shortLabel = cleanContent.length > 30 ? cleanContent.slice(0, 27) + "..." : cleanContent;

    const newNode: KnowledgeNode = {
      id: nodeId,
      label: shortLabel,
      type: payload.type === "youtube" ? "youtube_insight" : payload.type === "tendency" ? "counter" : "map_callout",
      details: cleanContent,
      confidence: 0.94,
    };

    this.knowledgeNodes.set(nodeId, newNode);

    // Create tactical links to active map and opponent
    const newLinks: KnowledgeLink[] = [
      { source: nodeId, target: "node-map-ascent", relation: "ADAPTS_TO" },
      { source: nodeId, target: "node-team-fnatic", relation: "COUNTERS_TENDENCY" },
    ];
    this.knowledgeLinks.push(...newLinks);

    // Formulate dynamic adaptive counter-strategy
    const adaptiveCounterStrategy = {
      directiveTitle: `Adaptive Counter: "${shortLabel}"`,
      targetFlaw: cleanContent,
      counterPlaybook: `Deploy fast split execute exploiting opponent's read. When opponent shifts to counter our default, bait their rotation with Sova recon, then collapse through opposite chokepoint with double smoke.`,
      recommendedUtilityCombo: `KAY/O ZERO/POINT suppression + Omen Paranoia flash through main wall`,
      momentumSwing: "+24% predicted round conversion",
      generatedAt: new Date().toISOString(),
    };

    // Emit into Product Team Feed
    const feedItem = this.addFeedItem({
      type: "LIVE_INSIGHT",
      priority: "CRITICAL",
      title: `🧠 Knowledge Induced: ${newNode.label}`,
      summary: `Player induced new intelligence from ${payload.type}. Adaptive counter generated: ${adaptiveCounterStrategy.directiveTitle}`,
      data: {
        node: newNode,
        counter: adaptiveCounterStrategy,
      },
      suggestedAction: `Call tactical adjustment: "${adaptiveCounterStrategy.directiveTitle}"`,
    });

    return {
      newNode,
      newLinks,
      adaptiveCounterStrategy,
      feedItem,
    };
  }

  // =========================================================================
  // Product Team Real-Time Feed
  // =========================================================================

  public addFeedItem(item: Omit<ProductTeamFeedItem, "id" | "timestamp">): ProductTeamFeedItem {
    const feedItem: ProductTeamFeedItem = {
      id: "feed-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...item,
    };
    this.productTeamFeed.unshift(feedItem);
    if (this.productTeamFeed.length > 100) {
      this.productTeamFeed = this.productTeamFeed.slice(0, 100);
    }
    return feedItem;
  }

  public getProductTeamFeed(limit: number = 20): ProductTeamFeedItem[] {
    return this.productTeamFeed.slice(0, limit);
  }

  /**
   * Generates a context prompt string summarizing Agent Memory for Ollama LLM
   */
  public getMemoryContextPrompt(): string {
    const wm = this.workingMemory;
    const topPlayers = Array.from(this.playerTendencies.values()).slice(0, 4);
    return `
[AGENT MEMORY SNAPSHOT]
Active Match: ${wm.teamA} vs ${wm.teamB} on ${wm.map}
Round: ${wm.currentRound} | Score: ${wm.score.teamA} - ${wm.score.teamB} | Side: ${wm.teamA} (${wm.sideA})
Economy: ${wm.teamA} [${wm.economyTeamA}] vs ${wm.teamB} [${wm.economyTeamB}]
Momentum: ${wm.momentum} (Streak: ${wm.consecutiveRoundsWonTeamA} vs ${wm.consecutiveRoundsWonTeamB})
Key Player Tendencies:
${topPlayers.map(p => `• ${p.playerName} (${p.team}): ${p.playstyle}, Aggression: ${p.aggressionRating}, Tilt Sensitivity: ${p.tiltSensitivity}`).join("\n")}
Recent Tactical Events:
${this.productTeamFeed.slice(0, 3).map(f => `• [${f.type}] ${f.title}: ${f.summary}`).join("\n")}
`;
  }
}

export const agentCoachMemory = new AgentCoachMemory();
export default agentCoachMemory;

