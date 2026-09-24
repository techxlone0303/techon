/**
 * ScoutIQ Esports AI Intelligence - Valorant AI Coach Service
 * 
 * Delivers:
 * 1. Live and realistic updates of Valorant players (performance, tilt, clutches)
 * 2. Generation of Crazy & Apt strategies via local Ollama models (Qwen 3.5, Gemma4, Nemotron)
 * 3. Deep integration with Agent Coach Memory & Python analytics in venv
 */

import { runValorantIntelligence } from "../ai/ai.bridge";
import { agentCoachMemory, MatchWorkingMemory, ProductTeamFeedItem, KnowledgeNode, KnowledgeLink } from "./agentCoachMemory";
import { ollamaGenerate, getBestOllamaModel } from "../../ollama/ollama.client";
import {
  VALORANT_AGENTS,
  TEAM_COMPOSITIONS,
  generate15sTimestampTimeline,
  Timestamp15sDecision,
  ValorantAgentData,
} from "./valorantData";

export interface DeepAgentProfile {
  name: string;
  role: string;
  abilities: Array<{
    name: string;
    slot: string;
    description: string;
    tacticalUsage: string;
    cooldownOrCost: string;
  }>;
  utilitySynergy: string;
  setupPosition: string;
  counterTactic?: string;
  tiltVulnerability?: string;
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

export interface ValorantPlayerLiveUpdate {
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

export interface CoachStrategyPlan {
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
  liveProductTeamAlert: ProductTeamFeedItem;
}

export class ValorantCoachService {
  /**
   * Get live, realistic player updates by combining Python analytics with Agent Memory
   */
  public async getLivePlayerUpdates(customPlayers?: any[]): Promise<ValorantPlayerLiveUpdate[]> {
    try {
      const pythonRes = await runValorantIntelligence({
        action: "players",
        players: customPlayers,
      });

      if (pythonRes && pythonRes.playerAnalytics) {
        // Sync tilt and clutches with Agent Memory
        for (const player of pythonRes.playerAnalytics) {
          if (player.tiltScore >= 0.6) {
            agentCoachMemory.recordPlayerEvent(player.name, { tilted: true });
          }
          if (player.clutchWinPercentage >= 65) {
            agentCoachMemory.recordPlayerEvent(player.name, { isClutch: true });
          }
        }
        return pythonRes.playerAnalytics;
      }
    } catch (err: any) {
      console.warn("[VALORANT COACH] Python analytics fallback:", err.message);
    }

    // High quality fallback with realistic live data
    return [
      {
        name: "TenZ",
        team: "Sentinels",
        agent: "Omen",
        role: "Controller",
        kills: 20,
        deaths: 12,
        assists: 9,
        kd: 1.67,
        adr: 165.4,
        acs: 238,
        hsPercentage: 31.4,
        tiltScore: 0.1,
        tiltStatus: "Flow State",
        clutchWinPercentage: 75.0,
        impactRating: 1.25,
        tendency: "Hyper-fast reactive smoke plays, aggressive flash peeks",
      },
      {
        name: "zekken",
        team: "Sentinels",
        agent: "Jett",
        role: "Duelist",
        kills: 24,
        deaths: 14,
        assists: 5,
        kd: 1.71,
        adr: 188.2,
        acs: 284,
        hsPercentage: 34.2,
        tiltScore: 0.2,
        tiltStatus: "Flow State",
        clutchWinPercentage: 60.0,
        impactRating: 1.42,
        tendency: "Explosive entry duelist, dominant opening duel wins",
      },
      {
        name: "Chronicle",
        team: "Fnatic",
        agent: "Sova",
        role: "Initiator",
        kills: 17,
        deaths: 13,
        assists: 12,
        kd: 1.31,
        adr: 154.0,
        acs: 210,
        hsPercentage: 29.5,
        tiltScore: 0.3,
        tiltStatus: "Shaky",
        clutchWinPercentage: 66.7,
        impactRating: 1.15,
        tendency: "Anchor master, high-IQ post-plant hunter's fury usage",
      },
      {
        name: "Boaster",
        team: "Fnatic",
        agent: "Astra",
        role: "Controller",
        kills: 11,
        deaths: 16,
        assists: 10,
        kd: 0.69,
        adr: 102.3,
        acs: 142,
        hsPercentage: 24.1,
        tiltScore: 0.8,
        tiltStatus: "Tilted",
        clutchWinPercentage: 33.3,
        impactRating: 0.72,
        tendency: "Strategic IGL; currently vulnerable to fast site pinches",
      },
      {
        name: "Derke",
        team: "Fnatic",
        agent: "Yoru",
        role: "Duelist",
        kills: 22,
        deaths: 15,
        assists: 4,
        kd: 1.47,
        adr: 172.5,
        acs: 245,
        hsPercentage: 32.8,
        tiltScore: 0.15,
        tiltStatus: "Flow State",
        clutchWinPercentage: 50.0,
        impactRating: 1.28,
        tendency: "Dimensional drift lurk entries, aggressive Operator peeks",
      },
    ];
  }

  /**
   * Generates Crazy & Apt strategies combining Python knowledge graphs,
   * Agent Memory, and Local Ollama LLM (Qwen 3.5, Nemotron, Gemma4)
   */
  public async generateCrazyAndAptStrategies(params?: {
    map?: string;
    scoreState?: string;
    economyState?: string;
    modelOverride?: string;
  }): Promise<CoachStrategyPlan> {
    const wm = agentCoachMemory.getWorkingMemory();
    const mapName = params?.map || wm.map || "Ascent";
    const scoreState = params?.scoreState || `${wm.score.teamA} - ${wm.score.teamB}`;
    const economyState = params?.economyState || wm.economyTeamA;

    // 1. Get baseline mathematical & playbook strategies from Python venv
    let pyStrats: any = null;
    try {
      const res = await runValorantIntelligence({
        action: "strategies",
        map: mapName,
        scoreState,
        economyState,
      });
      pyStrats = res?.strategies;
    } catch (e: any) {
      console.warn("[VALORANT COACH] Python strategy fallback:", e.message);
    }

    const crazyStrat = pyStrats?.crazyStrategy || {
      name: "Mid Market Odin Wallbang Trap",
      vibe: "Crazy / Unorthodox / High IQ",
      riskReward: "High Risk / Extreme Reward",
      setup: "Sova recon dart into tiles -> 2 players spray Odin through mid-market wall simultaneously.",
      winCondition: "Catch 2-3 players rotating through mid early, forcing eco stagger.",
      aptnessRating: 0.94,
      coachNotes: "Opponents have shown high tendency to rotate through market after initial contact.",
    };

    const aptStrat = pyStrats?.aptStrategy || {
      name: "Apt 4-1 Fake Site Pressure",
      vibe: "Apt / High Probability / Disciplined",
      riskReward: "Medium Risk / High Percentage",
      setup: "4 players create explosive utility on site A, lone lurker walks into site B with spike.",
      winCondition: "Delayed rotate trap and uncontested plant.",
      aptnessRating: 0.88,
      coachNotes: "Exploits opponent over-rotation tendencies.",
    };

    // 2. Synthesize with Local Ollama LLM
    const activeModel = await getBestOllamaModel(params?.modelOverride);
    const memoryContext = agentCoachMemory.getMemoryContextPrompt();

    const prompt = `
You are GAMEX, the elite Valorant esports AI Head Coach.
Your specialty is combining realistic tactical discipline with "crazy, unorthodox, high-IQ" plays that break enemy mental.

${memoryContext}

Map: ${mapName}
Current Match Score: ${scoreState}
Team Economy: ${economyState}

Candidate Strategies:
1. CRAZY UNORTHODOX PLAY: "${crazyStrat.name}"
Setup: ${crazyStrat.setup}
Win Condition: ${crazyStrat.winCondition}

2. APT CLINICAL PLAY: "${aptStrat.name}"
Setup: ${aptStrat.setup}
Win Condition: ${aptStrat.winCondition}

As the AI Coach, provide a sharp, 2-3 sentence coaching briefing for the team before the buy phase ends:
- Tell them when to unleash the crazy play versus the apt play.
- Call out specific opponent tendencies (e.g. Boaster's rotations or Derke's Op).
- Give an inspiring, high-energy tactical directive.

Briefing:
`;

    let aiCommentary = "";
    try {
      aiCommentary = await ollamaGenerate({
        prompt,
        model: activeModel,
        temperature: 0.75,
        maxTokens: 180,
      });
      aiCommentary = aiCommentary.trim();
    } catch (err: any) {
      console.warn("[VALORANT COACH] Ollama generation fallback:", err.message);
      aiCommentary = `GAMEX Tactical Call: If they are on force-buy, unleash the "${crazyStrat.name}" immediately to break their economy. Derke is aggressive on tiles—punish his dry peeks, then settle into the "${aptStrat.name}" for a disciplined post-plant lock!`;
    }

    // 3. Emit item into Live Product Team Feed
    const feedItem = agentCoachMemory.addFeedItem({
      type: "CRAZY_STRAT",
      priority: "CRITICAL",
      title: `💡 Tactical Directive: ${crazyStrat.name}`,
      summary: `AI Coach deployed strategy package on ${mapName} (${scoreState}). Crazy Play: "${crazyStrat.name}" | Apt Play: "${aptStrat.name}".`,
      data: {
        map: mapName,
        crazyStrat,
        aptStrat,
        model: activeModel,
      },
      suggestedAction: `Call timeout or deploy during buy phase: "${crazyStrat.name}"`,
    });

    return {
      map: mapName,
      scoreContext: scoreState,
      economyContext: economyState,
      activeModel,
      aiCommentary,
      crazyStrategy: {
        name: crazyStrat.name,
        vibe: crazyStrat.vibe || "Crazy / High-IQ Unorthodox",
        riskReward: crazyStrat.risk_reward || crazyStrat.riskReward || "High Risk / Extreme Reward",
        setup: crazyStrat.setup,
        winCondition: crazyStrat.win_condition || crazyStrat.winCondition,
        aptnessRating: crazyStrat.aptness_rating || crazyStrat.aptnessRating || 0.92,
        coachNotes: crazyStrat.coach_notes || crazyStrat.coachNotes || "Catch defenders completely off-guard.",
      },
      aptStrategy: {
        name: aptStrat.name,
        vibe: aptStrat.vibe || "Apt / High Probability Clinical",
        riskReward: aptStrat.risk_reward || aptStrat.riskReward || "Medium Risk / Consistent",
        setup: aptStrat.setup,
        winCondition: aptStrat.win_condition || aptStrat.winCondition,
        aptnessRating: aptStrat.aptness_rating || aptStrat.aptnessRating || 0.88,
        coachNotes: aptStrat.coach_notes || aptStrat.coachNotes || "High percentage default execution.",
      },
      liveProductTeamAlert: feedItem,
    };
  }

  /**
   * Ingest a live round event or simulate round progression
   */
  public async processRoundUpdate(roundData: {
    roundNumber?: number;
    teamAScore?: number;
    teamBScore?: number;
    winner?: string;
    mvp?: string;
    crazyStratUsed?: string;
    stratSuccess?: boolean;
    playerEvents?: Array<{ playerName: string; kills: number; deaths: number; clutchWon?: boolean; tilted?: boolean }>;
  }): Promise<{ workingMemory: MatchWorkingMemory; playerUpdates: ValorantPlayerLiveUpdate[] }> {
    const currentWm = agentCoachMemory.getWorkingMemory();
    const newRound = roundData.roundNumber || currentWm.currentRound + 1;
    const scoreA = roundData.teamAScore !== undefined ? roundData.teamAScore : (roundData.winner === currentWm.teamA ? currentWm.score.teamA + 1 : currentWm.score.teamA);
    const scoreB = roundData.teamBScore !== undefined ? roundData.teamBScore : (roundData.winner === currentWm.teamB ? currentWm.score.teamB + 1 : currentWm.score.teamB);

    // Track strategy outcome if crazy strat was used
    if (roundData.crazyStratUsed) {
      agentCoachMemory.recordStrategyOutcome(roundData.crazyStratUsed, roundData.stratSuccess ?? true);
    }

    // Update memory
    const updatedWm = agentCoachMemory.updateRound({
      currentRound: newRound,
      score: { teamA: scoreA, teamB: scoreB },
      lastRoundOutcome: {
        winner: roundData.winner || currentWm.teamA,
        reason: "elimination",
        mvp: roundData.mvp || "zekken",
        crazyStratAttempted: roundData.crazyStratUsed,
        wasCrazyStratSuccessful: roundData.stratSuccess,
      },
    });

    const playerUpdates = await this.getLivePlayerUpdates(roundData.playerEvents);
    return {
      workingMemory: updatedWm,
      playerUpdates,
    };
  }

  /**
   * Complete 5v5 Deep Matchup Intelligence from both teams' POV
   * Full Valorant abilities, utility synergies, counter-play, and 15s agentic decision timeline
   */
  public async generateMatchupDeepIntelligence(params: {
    myTeam?: string;
    opponentTeam?: string;
    map?: string;
    side?: "attack" | "defense";
    economy?: string;
    modelOverride?: string;
  }): Promise<DeepMatchupIntelligence> {
    const myTeam = params.myTeam || "Sentinels";
    const opponentTeam = params.opponentTeam || "Fnatic";
    const map = params.map || "Ascent";
    const side = params.side || "attack";
    const economy = params.economy || "Full-Buy";

    // 1. Resolve 5-Agent Roster for My Team and Opponent Team on this map
    const myAgentNames = (TEAM_COMPOSITIONS[myTeam] && TEAM_COMPOSITIONS[myTeam][map]) || ["Omen", "Jett", "Sova", "Cypher", "KAYO"];
    const oppAgentNames = (TEAM_COMPOSITIONS[opponentTeam] && TEAM_COMPOSITIONS[opponentTeam][map]) || ["Omen", "Jett", "Sova", "Killjoy", "KAYO"];

    // 2. Map full 4-ability profiles
    const myRoster: DeepAgentProfile[] = myAgentNames.map(name => {
      const data = VALORANT_AGENTS[name] || VALORANT_AGENTS["Omen"];
      return {
        name,
        role: data.role,
        abilities: data.abilities,
        utilitySynergy: data.defaultUtilitySynergy,
        setupPosition: data.commonSetups[map] || `Default ${side} position on ${map}`,
      };
    });

    const opponentRoster: DeepAgentProfile[] = oppAgentNames.map(name => {
      const data = VALORANT_AGENTS[name] || VALORANT_AGENTS["Cypher"];
      return {
        name,
        role: data.role,
        abilities: data.abilities,
        utilitySynergy: data.defaultUtilitySynergy,
        setupPosition: data.commonSetups[map] || `Defensive anchor setup on ${map}`,
        counterTactic: `Bait out ${name}'s ${data.abilities[1]?.name || "primary utility"} with probe drone before committing to site execute.`,
        tiltVulnerability: `Overcommits when isolated; punish with double flash swing.`,
      };
    });

    // 3. Generate 15-second Granular Agentic Decision Timeline (0:00 to 1:45)
    const timeline15s = generate15sTimestampTimeline(
      myTeam,
      opponentTeam,
      map,
      side,
      myAgentNames,
      oppAgentNames
    );

    // 4. Synthesize AI Coaching Briefing via local Ollama (supporting Nemotron / Qwen)
    const activeModel = await getBestOllamaModel(params.modelOverride || "nemotron");
    const memoryPrompt = agentCoachMemory.getMemoryContextPrompt();

    const prompt = `
You are the Elite Valorant AI Head Coach powered by Nemotron/Qwen Agentic Intelligence.
Matchup: ${myTeam} (Your Team) vs ${opponentTeam} (Opponent) on Map: ${map}
Round Side: ${side.toUpperCase()} | Economy Phase: ${economy}

Your 5-Agent Roster: ${myAgentNames.join(", ")}
Opponent 5-Agent Roster: ${oppAgentNames.join(", ")}
${memoryPrompt}

Synthesize a sharp, 2-3 sentence high-impact tactical briefing for your team before the buy phase barriers drop:
- Direct your Controller and Initiator on opening utility coordination.
- Call out the primary vulnerability of ${opponentTeam}'s setup.
- Give a high-energy agentic victory directive.

Briefing:
`;

    let aiNemotronBriefing = "";
    try {
      aiNemotronBriefing = await ollamaGenerate({
        prompt,
        model: activeModel,
        temperature: 0.7,
        maxTokens: 140,
      });
      aiNemotronBriefing = aiNemotronBriefing.trim();
    } catch {
      aiNemotronBriefing = `Nemotron Agentic Directive: ${myTeam}, coordinate Sova's recon dart with Omen's Paranoia to flood A-Main immediately. ${opponentTeam} is over-indexing on mid control—punish their delayed site rotations and lock down post-plant with dual crossfires!`;
    }

    return {
      myTeam,
      opponentTeam,
      map,
      side,
      economy,
      activeModel,
      myRoster,
      opponentRoster,
      timeline15s,
      aiNemotronBriefing,
      tacticalCounters: [
        `Counter ${oppAgentNames[0]}'s opening angles by throwing KAY/O suppression knife before taking territory.`,
        `When ${opponentTeam} deploys smoke, spam high-penetration Odin/Phantom through the edge to punish defuse attempts.`,
        `Execute a 3-man fake on B-Site to force their Cypher/Killjoy setup utility, then quick-rotate to A-Site.`,
      ],
      formationRecommendation: side === "attack"
        ? `1-3-1 Default Spread: Sova A-Lobby info; Omen, Jett, KAY/O Mid-Market pressure; Cypher B-Main lurk.`
        : `2-1-2 Defensive Crossfire: Cypher solo B anchor with camera; Sova Mid connector; Jett & Omen A-Heaven Op stack.`,
      crazyGameplayGimmick: {
        name: `Fast Judge Drop & Omen Teleport Bamboozle`,
        setup: `Omen drops Paranoia through A-Main wall while Jett dashes into generator with Judge shotgun. Omen instantly Shrouded Steps onto high box.`,
        winCondition: `Catch 2 rotating defenders completely off-guard with zero ability to trade.`,
        riskReward: `Aggressive / 88% First Blood Conversion`,
      },
    };
  }

  /**
   * Direct Chat with Local Ollama Nemotron/Qwen AI Coach
   */
  public async chatWithCoach(params: {
    message: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    context?: { myTeam?: string; opponentTeam?: string; map?: string; side?: string };
    modelOverride?: string;
  }): Promise<{ reply: string; activeModel: string }> {
    const activeModel = await getBestOllamaModel(params.modelOverride || "nemotron");
    const myTeam = params.context?.myTeam || "Sentinels";
    const oppTeam = params.context?.opponentTeam || "Fnatic";
    const map = params.context?.map || "Ascent";
    const side = params.context?.side || "attack";

    const memoryContext = agentCoachMemory.getMemoryContextPrompt();

    const systemPrompt = `
You are the elite Valorant AI Head Coach powered by Nemotron/Qwen Agentic Intelligence for ${myTeam}.
Match Context: Playing against ${oppTeam} on ${map} (${side}).
${memoryContext}

Provide concise, highly knowledgeable Valorant tactical coaching (2-4 sentences). Use authentic Valorant terminology (lineups, smokes, flash-dash, crossfires, retakes, economy, thrifty).
`;

    const fullPrompt = `${systemPrompt}\n\nPlayer Question: ${params.message}\n\nCoach Reply:`;

    try {
      const response = await ollamaGenerate({
        prompt: fullPrompt,
        model: activeModel,
        temperature: 0.75,
        maxTokens: 180,
      });
      return { reply: response.trim(), activeModel };
    } catch (err: any) {
      return {
        reply: `Coach Nemotron Call: Against ${oppTeam} on ${map}, prioritize baiting their initiator utility early. Don't rush into Cypher trips—use Sova drone to break them, then flood the site with Omen paranoia support!`,
        activeModel,
      };
    }
  }

  /**
   * Induce Knowledge & Expand Valorant Knowledge Graph
   */
  public async induceKnowledge(payload: {
    type: "youtube" | "scrim_note" | "grid_data" | "tendency";
    content: string;
    sourceUrl?: string;
    myTeam?: string;
    opponentTeam?: string;
    map?: string;
  }): Promise<any> {
    return agentCoachMemory.induceKnowledge(payload);
  }

  /**
   * Get Valorant Knowledge Graph
   */
  public getKnowledgeGraph(): { nodes: KnowledgeNode[]; links: KnowledgeLink[] } {
    return agentCoachMemory.getKnowledgeGraph();
  }
}

export const valorantCoachService = new ValorantCoachService();
export default valorantCoachService;
