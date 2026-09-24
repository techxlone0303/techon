/**
 * GAMEX Esports AI Intelligence - Valorant Comprehensive Game Data
 * Maps, Agents, Full 4-Ability Utilities, Counter-Matrices, and 15s Timestamp Frameworks
 */

export interface ValorantAbility {
  name: string;
  slot: "C" | "Q" | "E" | "X" | string;
  description: string;
  tacticalUsage: string;
  cooldownOrCost: string;
}

export interface ValorantAgentData {
  name: string;
  role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
  abilities: ValorantAbility[];
  defaultUtilitySynergy: string;
  commonSetups: Record<string, string>; // Map -> Setup description
}

export const VALORANT_AGENTS: Record<string, ValorantAgentData> = {
  Omen: {
    name: "Omen",
    role: "Controller",
    abilities: [
      {
        name: "Shrouded Step",
        slot: "C",
        description: "Shadow walk teleport after a brief channel to bypass lines of sight or cross elevation.",
        tacticalUsage: "Teleport past Cypher trapwires or onto high boxes (e.g. A-Site Ascent generator, Bind lamps).",
        cooldownOrCost: "100 Creds (2 charges)",
      },
      {
        name: "Paranoia",
        slot: "Q",
        description: "Blinding shadow projectile that pierces through walls and deafens all affected players.",
        tacticalUsage: "Execute flash through main choke points; synergizes with Duelist entry dash/satchel.",
        cooldownOrCost: "250 Creds",
      },
      {
        name: "Dark Cover",
        slot: "E",
        description: "Signature phased shadow orb smoke with 15s duration that recharges every 30 seconds.",
        tacticalUsage: "Place deep one-ways on A-Heaven or B-Lane Ascent to block defender Op sightlines.",
        cooldownOrCost: "Signature (30s cooldown)",
      },
      {
        name: "From the Shadows",
        slot: "X",
        description: "Map-wide ultimate teleport with shade formation. Allows canceling or instant spike retrieval.",
        tacticalUsage: "Fake site rotation, retrieve dropped spike from enemy territory, or execute 360 scout.",
        cooldownOrCost: "7 Ultimate Points",
      },
    ],
    defaultUtilitySynergy: "Paranoia flash through wall into chokepoint + Jett dash into smoke for uncontested entry.",
    commonSetups: {
      Ascent: "Dark Cover on A-Heaven and Garden door; Paranoia through A-Main wall; one-way on B-Lane.",
      Bind: "One-way smoke on A-Short lamps; deep smoke on B-Hookah; Shrouded Step across Hookah window.",
      Haven: "Deep smokes on A-Long and Garage; Paranoia down C-Long to counter aggressive Operator.",
      Split: "Mid-Vent smoke + B-Heaven one-way; Paranoia down B-Main to stop 5-man rush.",
    },
  },

  Jett: {
    name: "Jett",
    role: "Duelist",
    abilities: [
      {
        name: "Cloudburst",
        slot: "C",
        description: "Instant cloud smoke projectile that obscures vision for 2.5s with curve-trajectory control.",
        tacticalUsage: "Drop quick smoke on entry chokepoint to cut off crossfire angles before dashing in.",
        cooldownOrCost: "200 Creds (2 charges)",
      },
      {
        name: "Updraft",
        slot: "Q",
        description: "Propels Jett high into the air with instant vertical elevation.",
        tacticalUsage: "Get elevation over Sova recon or surprise defenders holding standard head-level crosshairs.",
        cooldownOrCost: "150 Creds",
      },
      {
        name: "Tailwind",
        slot: "E",
        description: "Signature dash in movement direction after a 0.75s wind-up window.",
        tacticalUsage: "Aggressive opening Op peek with guaranteed escape or explosive site entry dash.",
        cooldownOrCost: "Signature (Resets after 2 kills)",
      },
      {
        name: "Blade Storm",
        slot: "X",
        description: "Equips 5 high-accuracy throwing knives that deal 50 body / 150 head damage with 100% running accuracy.",
        tacticalUsage: "Full eco round equalizer; right-click burst in close quarters or 1-tap long range duels.",
        cooldownOrCost: "8 Ultimate Points",
      },
    ],
    defaultUtilitySynergy: "Updraft + Blade Storm over smokes to eliminate anchor players before they react.",
    commonSetups: {
      Ascent: "Hold Mid-Bottom with Operator on defense; on attack, dash into A-site generator with cloudburst.",
      Bind: "Aggressive A-Bath entry with updraft onto lamps; B-Long early pick and dash back into hookah.",
      Haven: "Hold C-Long with Operator on defense; double cloudburst into A-Site heaven on attack.",
      Split: "Fast dash into B-site pillars behind flash; hold Mid-Mail with Operator on defense.",
    },
  },

  Sova: {
    name: "Sova",
    role: "Initiator",
    abilities: [
      {
        name: "Owl Drone",
        slot: "C",
        description: "Pilotable scout drone that fires marking darts revealing enemy locations in real time.",
        tacticalUsage: "Clear close corners (e.g. Ascent Wine, Hookah corners) and destroy Killjoy/Cypher traps safely.",
        cooldownOrCost: "400 Creds",
      },
      {
        name: "Shock Dart",
        slot: "Q",
        description: "Explosive bow arrow dealing up to 75 damage on impact with bounce physics.",
        tacticalUsage: "Pre-round double shock dart lineups for spike defuse denial or breaking Cypher trapwires.",
        cooldownOrCost: "150 Creds (2 charges)",
      },
      {
        name: "Recon Bolt",
        slot: "E",
        description: "Signature sonar arrow that pulses 3 times to reveal enemies within line of sight.",
        tacticalUsage: "High sky lineups scanning back-site anchors to force defenders out of cover.",
        cooldownOrCost: "Signature (40s cooldown)",
      },
      {
        name: "Hunter's Fury",
        slot: "X",
        description: "3 wall-piercing energy blasts that deal 80 damage each and reveal struck enemies.",
        tacticalUsage: "Post-plant spike denial from safe off-site locations or punishing choked rotations.",
        cooldownOrCost: "8 Ultimate Points",
      },
    ],
    defaultUtilitySynergy: "Recon Bolt high over site + Odin wallbang through penetrable walls (e.g. Ascent B-Main/Market).",
    commonSetups: {
      Ascent: "A-Main high antenna recon; B-Main wallbang shock darts; post-plant Hunter's Fury from B-lobby.",
      Bind: "B-Long early bounce dart; Hookah clearing drone; double shock dart for default spike plant in A-Lamps.",
      Haven: "A-Long tree dart; Garage double shock dart; C-Long drone clear for site entry.",
      Split: "Mid-Vent clearing drone; B-Back site recon arrow.",
    },
  },

  Cypher: {
    name: "Cypher",
    role: "Sentinel",
    abilities: [
      {
        name: "Trapwire",
        slot: "C",
        description: "Stealth tripwire tethering and concussing enemies who cross it, re-arming after 1.5s if not broken.",
        tacticalUsage: "Lock down flank chokepoints and site entryways; impenetrable without utility destruction.",
        cooldownOrCost: "200 Creds (2 charges)",
      },
      {
        name: "Cyber Cage",
        slot: "Q",
        description: "Remote smoke cage triggered on crosshair line-of-sight with distinct sound cues on enemy crossing.",
        tacticalUsage: "One-way cages placed on high ledges or triggered when enemy trips Trapwire for blind sprays.",
        cooldownOrCost: "100 Creds (2 charges)",
      },
      {
        name: "Spycam",
        slot: "E",
        description: "Deployable reusable camera with dart-firing mechanism to tag and track enemies.",
        tacticalUsage: "Place in off-angle high ceilings to track entire team rotations without exposing player.",
        cooldownOrCost: "Signature (15s cooldown if picked up)",
      },
      {
        name: "Neural Theft",
        slot: "X",
        description: "Extracts memory from a fresh enemy corpse to reveal the real-time location of all living enemies twice.",
        tacticalUsage: "Eliminates all mid-round ambiguity; instantly confirms whether opponents are faking.",
        cooldownOrCost: "6 Ultimate Points",
      },
    ],
    defaultUtilitySynergy: "Trapwire at B-lane + Cyber Cage on doorway -> spray through cage when trip activates.",
    commonSetups: {
      Ascent: "B-site lockdown with low-profile unbreakable trips; Mid-tiles spycam tracking cat/market.",
      Bind: "B-site hookah multi-trip setup; A-Lamps flank trip covering shower and short.",
      Haven: "C-site garage solo hold with camera and double tripwires.",
      Sunset: "B-site market cross-trips with cage one-ways.",
    },
  },

  KAYO: {
    name: "KAY/O",
    role: "Initiator",
    abilities: [
      {
        name: "FRAG/MENT",
        slot: "C",
        description: "Explosive pulse grenade dealing high damage in 4 pulses through geometric obstacles.",
        tacticalUsage: "Post-plant spike denial or flushing defenders out of cubbies (e.g. Ascent Wine or Bind Lamps).",
        cooldownOrCost: "200 Creds",
      },
      {
        name: "FLASH/POINT",
        slot: "Q",
        description: "Throwing flash grenade with left-click long toss and right-click pop-flash mechanics.",
        tacticalUsage: "Right-click pop-flash through smokes to guarantee blind duels without team flash risk.",
        cooldownOrCost: "250 Creds (2 charges)",
      },
      {
        name: "ZERO/POINT",
        slot: "E",
        description: "Signature suppression blade that suppresses and reveals all enemies caught in radius for 8s.",
        tacticalUsage: "Knife early main choke to disable Killjoy/Cypher setup utility and stop Jett dash entries.",
        cooldownOrCost: "Signature (40s cooldown)",
      },
      {
        name: "NULL/CMD",
        slot: "X",
        description: "Overloaded polarized energy pulses suppressing enemies in large radius and enabling ally revive on death.",
        tacticalUsage: "Site execute anchor; completely disables all enemy utility while granting aggressive team entry.",
        cooldownOrCost: "8 Ultimate Points",
      },
    ],
    defaultUtilitySynergy: "ZERO/POINT knife suppresses Sentinel setup + right-click pop flash for team site flood.",
    commonSetups: {
      Ascent: "Knife A-Main early to detect team stack; pop-flash through B-Main smoke on retake.",
      Bind: "Knife A-Showers to detect entry; FRAG/MENT into U-Hall lamps.",
      Haven: "Suppress Garage doors with early knife; flash down A-Long for team push.",
      Split: "Mid-Mail suppression knife disabling Raze satchels; A-Ramps pop-flash.",
    },
  },

  Killjoy: {
    name: "Killjoy",
    role: "Sentinel",
    abilities: [
      {
        name: "Nanoswarm",
        slot: "C",
        description: "Covert grenade that deploys a swarm of damaging nanobots on remote activation.",
        tacticalUsage: "Place on spike plant zones or choke doorways; activate remotely to stall push or deny defuse.",
        cooldownOrCost: "200 Creds (2 charges)",
      },
      {
        name: "Alarmbot",
        slot: "Q",
        description: "Stealth bot that hunts down enemies in range, applying Vulnerable status doubling incoming damage.",
        tacticalUsage: "Combine with Nanoswarm for instant lethal damage when enemies trigger the bot.",
        cooldownOrCost: "200 Creds",
      },
      {
        name: "Turret",
        slot: "E",
        description: "Autonomous turret that fires burst shots in a 180-degree cone, tagging and revealing enemies.",
        tacticalUsage: "Place on mid platforms to gather free information and tag peeking duelists.",
        cooldownOrCost: "Signature (20s cooldown if recalled)",
      },
      {
        name: "Lockdown",
        slot: "X",
        description: "Deploys a device that detains all enemies caught in its massive radius for 8 seconds after a 13s windup.",
        tacticalUsage: "Uncontested site execute or site retake device; forces all defenders to evacuate site completely.",
        cooldownOrCost: "9 Ultimate Points",
      },
    ],
    defaultUtilitySynergy: "Alarmbot + Nanoswarm on spike default + Turret crossfire.",
    commonSetups: {
      Ascent: "A-Site wine Lockdown clearing entire site and heaven; B-Site lane turret and dual swarms.",
      Bind: "B-Site hookah trap with alarmbot and nanoswarm.",
      Haven: "C-Site garage lockdown; A-Site turret watching long and short.",
      Lotus: "C-Site pillar lockdown forcing attackers back to spawn.",
    },
  },
};

/**
 * Team Roster Meta mapping for major Tier-1 VCT teams
 */
export const TEAM_COMPOSITIONS: Record<string, Record<string, string[]>> = {
  Sentinels: {
    Ascent: ["Omen", "Jett", "Sova", "Cypher", "KAYO"],
    Bind: ["Brimstone", "Raze", "Skye", "Viper", "Cypher"],
    Haven: ["Omen", "Jett", "Sova", "Breach", "Killjoy"],
    Split: ["Omen", "Raze", "Skye", "Cypher", "Viper"],
    Sunset: ["Omen", "Raze", "Fade", "Cypher", "Breach"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Omen", "Jett", "Sova", "Cypher", "KAYO"],
  },
  Fnatic: {
    Ascent: ["Omen", "Jett", "Sova", "Killjoy", "KAYO"],
    Bind: ["Brimstone", "Raze", "Fade", "Viper", "Cypher"],
    Haven: ["Omen", "Jett", "Breach", "Sova", "Killjoy"],
    Split: ["Astra", "Raze", "Skye", "Cypher", "Viper"],
    Sunset: ["Omen", "Raze", "Breach", "Cypher", "Sova"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Astra", "Jett", "Sova", "Cypher", "KAYO"],
  },
  "Paper Rex": {
    Ascent: ["Omen", "Reyna", "Sova", "Killjoy", "KAYO"],
    Bind: ["Brimstone", "Raze", "Yoru", "Viper", "Skye"],
    Haven: ["Omen", "Neon", "Breach", "Sova", "Killjoy"],
    Split: ["Omen", "Raze", "Yoru", "Cypher", "Skye"],
    Sunset: ["Omen", "Neon", "Breach", "Cypher", "Fade"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Omen", "Yoru", "Sova", "Cypher", "KAYO"],
  },
  "Gen.G": {
    Ascent: ["Omen", "Jett", "Sova", "Killjoy", "KAYO"],
    Bind: ["Viper", "Raze", "Skye", "Brimstone", "Cypher"],
    Haven: ["Omen", "Jett", "Sova", "Breach", "Killjoy"],
    Split: ["Astra", "Raze", "Skye", "Cypher", "Viper"],
    Sunset: ["Omen", "Raze", "Breach", "Cypher", "Fade"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Omen", "Jett", "Sova", "Cypher", "KAYO"],
  },
  "Team Liquid": {
    Ascent: ["Omen", "Jett", "Sova", "Cypher", "KAYO"],
    Bind: ["Brimstone", "Raze", "Fade", "Viper", "Cypher"],
    Haven: ["Omen", "Jett", "Breach", "Sova", "Killjoy"],
    Split: ["Omen", "Raze", "Skye", "Cypher", "Viper"],
    Sunset: ["Omen", "Raze", "Fade", "Cypher", "Breach"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Astra", "Jett", "Sova", "Cypher", "KAYO"],
  },
  EDG: {
    Ascent: ["Omen", "Jett", "Sova", "Killjoy", "KAYO"],
    Bind: ["Brimstone", "Raze", "Fade", "Viper", "Cypher"],
    Haven: ["Omen", "Jett", "Sova", "Breach", "Killjoy"],
    Split: ["Omen", "Raze", "Skye", "Cypher", "Viper"],
    Sunset: ["Omen", "Raze", "Breach", "Cypher", "Fade"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Omen", "Jett", "Sova", "Cypher", "KAYO"],
  },
  Leviatán: {
    Ascent: ["Omen", "Jett", "Sova", "Killjoy", "KAYO"],
    Bind: ["Brimstone", "Raze", "Skye", "Viper", "Cypher"],
    Haven: ["Omen", "Jett", "Sova", "Breach", "Killjoy"],
    Split: ["Astra", "Raze", "Skye", "Cypher", "Viper"],
    Sunset: ["Omen", "Raze", "Breach", "Cypher", "Fade"],
    Lotus: ["Omen", "Raze", "Fade", "Killjoy", "Viper"],
    Abyss: ["Omen", "Jett", "Sova", "Cypher", "KAYO"],
  },
};

/**
 * 15-Second Granular Agentic Decision Timeline Builder
 */
export interface Timestamp15sDecision {
  interval: string; // e.g. "0:00 - 0:15"
  phaseTitle: string;
  myTeamUtility: string;
  opponentUtility: string;
  agenticDecision: string;
  riskReward: string;
  tacticalGoal: string;
  keyCallout: string;
}

export function generate15sTimestampTimeline(
  myTeam: string,
  opponentTeam: string,
  map: string,
  side: "attack" | "defense",
  myAgentNames: string[],
  oppAgentNames: string[]
): Timestamp15sDecision[] {
  const isAttack = side === "attack";
  const controller = myAgentNames.find(a => ["Omen", "Brimstone", "Viper", "Astra"].includes(a)) || "Omen";
  const duelist = myAgentNames.find(a => ["Jett", "Raze", "Reyna", "Yoru", "Neon"].includes(a)) || "Jett";
  const initiator = myAgentNames.find(a => ["Sova", "Fade", "Breach", "KAYO", "Skye"].includes(a)) || "Sova";
  const sentinel = myAgentNames.find(a => ["Cypher", "Killjoy", "Sage", "Deadlock"].includes(a)) || "Cypher";

  const oppDuelist = oppAgentNames.find(a => ["Jett", "Raze", "Reyna", "Yoru"].includes(a)) || "Jett";
  const oppSentinel = oppAgentNames.find(a => ["Cypher", "Killjoy"].includes(a)) || "Cypher";

  return [
    {
      interval: "0:00 - 0:15",
      phaseTitle: "Spawn Barriers Drop & Default Vision Setup",
      myTeamUtility: isAttack
        ? `${controller} holds signature smoke. ${initiator} lines up high-trajectory recon arrow scanning mid-territory.`
        : `${sentinel} deploys primary Trapwires and Cam. ${controller} prepares deep choke one-way smoke.`,
      opponentUtility: isAttack
        ? `${oppSentinel} activates early surveillance camera. ${oppDuelist} positions for aggressive opening Op line.`
        : `${oppDuelist} takes jump-peek info on main choke point.`,
      agenticDecision: `Nemotron Live Call: "Do NOT dry-peek the opening angle! Let ${initiator}'s dart ping first to bait ${oppDuelist}'s Operator shot before taking territory."`,
      riskReward: "Low Risk / High Info Value",
      tacticalGoal: "Confirm opponent early stack distribution across sites without taking first-bullet damage.",
      keyCallout: `Track sound cues for ${oppSentinel}'s cage or trip triggers!`,
    },
    {
      interval: "0:15 - 0:30",
      phaseTitle: "Default Territory Contestation & Utility Baiting",
      myTeamUtility: isAttack
        ? `${initiator} launches Owl Drone / Dog to clear close corner angles. ${duelist} holds off-angle with Sheriff/Vandal.`
        : `${controller} drops first smoke on primary choke. ${initiator} throws suppression knife to cancel early execute.`,
      opponentUtility: `${oppDuelist} fires test utility and falls back to secondary crossfire angle.`,
      agenticDecision: `Nemotron Live Call: "${opponentTeam} is probing for fast flank info. Execute 3-man mid pressure while ${sentinel} locks our flank down tight."`,
      riskReward: "Medium Risk / High Map Control",
      tacticalGoal: "Strip opponent's forward vision and force them to burn secondary smokes early.",
      keyCallout: `Watch out for ${oppDuelist}'s dash-escape timing!`,
    },
    {
      interval: "0:30 - 0:45",
      phaseTitle: "Information Confirmation & Rotation Baiting",
      myTeamUtility: `${controller} smokes opposite site chokepoint to simulate a fake execute. ${duelist} taps footsteps then shifts walk.`,
      opponentUtility: `${opponentTeam} begins committing 2 players to rotate through spawn/market connector.`,
      agenticDecision: `Nemotron Live Call: "Bait triggered! Two ${opponentTeam} anchors are rotating off site. Hold your position for 5 seconds to let them commit into our crossfire trap."`,
      riskReward: "High Reward / Tactical Surprise",
      tacticalGoal: "Create numerical isolation against the solo site anchor before executing.",
      keyCallout: `Listen for running footsteps in connector!`,
    },
    {
      interval: "0:45 - 1:00",
      phaseTitle: "Mid-Round Strategic Pivot / Site Collapse",
      myTeamUtility: `${controller} drops tactical smoke blocking defender line of sight. ${initiator} fires flash/paranoia through wall. ${duelist} executes entry dash.`,
      opponentUtility: `Solo anchor attempts desperate utility stall; second rotater stuck in transit.`,
      agenticDecision: `Nemotron Live Call: "Execute NOW! ${duelist} clear site logs; ${initiator} trade immediately if contact is made. Plant default immediately!"`,
      riskReward: "Calculated Aggression / 85% Win Probability",
      tacticalGoal: "Secure clean opening frag, claim site territory, and initiate spike plant.",
      keyCallout: `Spike carrier commit to plant with cover smoke!`,
    },
    {
      interval: "1:00 - 1:15",
      phaseTitle: "Spike Plant & Retake Anchor Lockdown",
      myTeamUtility: `${sentinel} plants flank tripwire on main entrance. ${controller} and ${initiator} take post-plant crossfire geometry.`,
      opponentUtility: `${opponentTeam} regroups for 4-man coordinated retake, saving flash utilities for simultaneous push.`,
      agenticDecision: `Nemotron Live Call: "Spike is DOWN! Shift into post-plant crossfire protocol. Do NOT peek into their retake flash! Wait for defuse sound."`,
      riskReward: "High Discipline / Defense Advantage",
      tacticalGoal: "Convert site territory into an impenetrable post-plant crossfire.",
      keyCallout: `Crossfires established: A-Main + Site Hell!`,
    },
    {
      interval: "1:15 - 1:30",
      phaseTitle: "Post-Plant Utility Lockout & Molly Cascade",
      myTeamUtility: `${initiator} and ${sentinel} launch post-plant shock darts / nanoswarms / mollies directly onto spike defuse zone.`,
      opponentUtility: `${opponentTeam} burns smokes to tap defuse; players forced off spike by incoming molly damage.`,
      agenticDecision: `Nemotron Live Call: "Burn their clock! Molly cascade active. Opponents have only 12 seconds to stick the defuse or they lose to detonation."`,
      riskReward: "Zero Risk / Pure Time Denial",
      tacticalGoal: "Waste 15 seconds of defuse timer purely through delayed utility without exposing body.",
      keyCallout: `Mollies landing on spike! 15 seconds remaining!`,
    },
    {
      interval: "1:30 - 1:45",
      phaseTitle: "Clutch Protocol & Defuse Denial Finish",
      myTeamUtility: `Last alive players trade crosshair angles on tap. ${duelist} holds safe jiggle-peek to prevent ninja defuse.`,
      opponentUtility: `Frantic half-defuse attempt under extreme time pressure and low health.`,
      agenticDecision: `Nemotron Live Call: "Tap heard! Swing together on 3... 2... 1... TRADE THE FRAG! Round secured for ${myTeam}!"`,
      riskReward: "Clean Execution / Round Won",
      tacticalGoal: "Secure final elimination or let spike detonate safely.",
      keyCallout: `VICTORY SECURED: Round conversion confirmed.`,
    },
  ];
}
