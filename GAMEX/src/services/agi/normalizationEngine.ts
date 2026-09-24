export type GameTitle = 'VALORANT' | 'CS2' | 'DOTA2' | 'LOL';

export interface UniversalFeatures {
  skill_index: number;
  aggression_index: number;
  macro_intelligence: number;
  adaptability_score: number;
  meta_alignment_score: number;
  synergy_score: number;
}

export interface GameSpecificStats {
  gameTitle: GameTitle;
  rawStats: Record<string, number>;
  role?: string;
  mapPool?: string[];
  agents?: string[];
  heroes?: string[];
}

export interface NormalizedProfile {
  entityId: string;
  entityType: 'player' | 'team';
  gameTitles: GameTitle[];
  universalFeatures: UniversalFeatures;
  gameSpecificProfiles: Map<GameTitle, GameSpecificStats>;
  lastUpdated: string;
}

export class MultiTitleNormalizer {
  private gameWeights: Record<GameTitle, Record<string, number>> = {
    VALORANT: {
      adr: 0.15,
      kda: 0.2,
      firstBlood: 0.1,
      clutchRate: 0.12,
      utilAccuracy: 0.1,
      hsPercentage: 0.1,
      roundSurvival: 0.08,
      teamUtility: 0.15,
    },
    CS2: {
      adr: 0.18,
      kda: 0.15,
      firstKill: 0.12,
      clutchRate: 0.1,
      entrySuccess: 0.12,
      hsPercentage: 0.08,
      awpPercentage: 0.1,
      teamPlay: 0.15,
    },
    DOTA2: {
      gpm: 0.15,
      xpm: 0.12,
      kda: 0.18,
      lastHits: 0.08,
      denies: 0.05,
      teamfightParticipation: 0.15,
      objectiveDamage: 0.12,
      visionScore: 0.15,
    },
    LOL: {
      csPerMin: 0.12,
      goldPerMin: 0.15,
      kda: 0.18,
      damageShare: 0.12,
      visionScore: 0.1,
      objectiveContest: 0.12,
      roamEfficiency: 0.1,
      teamwork: 0.11,
    },
  };

  private gameRoleMappings: Record<GameTitle, Record<string, string[]>> = {
    VALORANT: {
      DUELIST: ['Jett', 'Reyna', 'Raze', 'Yoru', 'Neon'],
      INITIATOR: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade'],
      CONTROLLER: ['Viper', 'Omen', 'Brimstone', 'Harbor'],
      SENTINEL: ['Killjoy', 'Chamber', 'Sage', 'Cyper'],
    },
    CS2: {
      AWPER: [],
      RIFLER: [],
      LURKER: [],
      IGL: [],
      SUPPORT: [],
    },
    DOTA2: {
      CARRY: ['Anti-Mage', 'Phantom Assassin', 'Juggernaut', 'Spectre'],
      MIDLANER: ['Puck', 'Storm Spirit', 'Queen of Pain', 'Templar Assassin'],
      OFFLANER: ['Axe', 'Brewmaster', 'Tidehunter', 'Dark Seer'],
      SUPPORT: ['Crystal Maiden', 'Lich', 'Warlock', 'Skywrath Mage'],
      HARD_SUPPORT: ['Omniknight', 'Oracle', 'Winter Wyvern'],
    },
    LOL: {
      TOP: [],
      JUNGLE: [],
      MID: [],
      ADC: [],
      SUPPORT: [],
    },
  };

  normalize(stats: GameSpecificStats): UniversalFeatures {
    const weights = this.gameWeights[stats.gameTitle];
    const normalized = { skill_index: 0, aggression_index: 0, macro_intelligence: 0, adaptability_score: 0, meta_alignment_score: 0.5, synergy_score: 0.5 };

    for (const [statKey, weight] of Object.entries(weights)) {
      const rawValue = stats.rawStats[statKey] || 0;
      const normalizedValue = this.normalizeStat(statKey, rawValue, stats.gameTitle);
      normalized.skill_index += normalizedValue * weight;
    }

    const role = stats.role || this.detectRole(stats);
    const roleMultipliers = this.getRoleMultipliers(stats.gameTitle, role);

    normalized.aggression_index = this.calculateAggression(stats, roleMultipliers);
    normalized.macro_intelligence = this.calculateMacro(stats, roleMultipliers);
    normalized.adaptability_score = this.calculateAdaptability(stats, roleMultipliers);
    normalized.meta_alignment_score = this.calculateMetaAlignment(stats, roleMultipliers);

    return {
      skill_index: Math.round(normalized.skill_index * 1000) / 1000,
      aggression_index: Math.round(normalized.aggression_index * 1000) / 1000,
      macro_intelligence: Math.round(normalized.macro_intelligence * 1000) / 1000,
      adaptability_score: Math.round(normalized.adaptability_score * 1000) / 1000,
      meta_alignment_score: Math.round(normalized.meta_alignment_score * 1000) / 1000,
      synergy_score: 0.5,
    };
  }

  private normalizeStat(statKey: string, value: number, gameTitle: GameTitle): number {
    const benchmarks: Record<string, { min: number; max: number }> = {
      adr: { min: 50, max: 150 },
      kda: { min: 0.5, max: 3 },
      firstBlood: { min: 0, max: 0.5 },
      clutchRate: { min: 0, max: 0.4 },
      gpm: { min: 300, max: 700 },
      xpm: { min: 300, max: 700 },
      csPerMin: { min: 5, max: 10 },
      goldPerMin: { min: 300, max: 600 },
      damageShare: { min: 0.15, max: 0.35 },
    };

    const benchmark = benchmarks[statKey];
    if (!benchmark) return 0.5;

    return Math.max(0, Math.min(1, (value - benchmark.min) / (benchmark.max - benchmark.min)));
  }

  private detectRole(stats: GameSpecificStats): string {
    const agents = stats.agents || [];
    const heroes = stats.heroes || [];

    for (const [role, characters] of Object.entries(this.gameRoleMappings[stats.gameTitle])) {
      if (characters.length > 0 && characters.some(c => agents.includes(c) || heroes.includes(c))) {
        return role;
      }
    }
    return 'GENERAL';
  }

  private getRoleMultipliers(gameTitle: GameTitle, role: string): Record<string, number> {
    const multipliers: Record<string, Record<string, Record<string, number>>> = {
      VALORANT: {
        DUELIST: { aggression: 1.3, macro: 0.7, adaptability: 0.8 },
        SENTINEL: { aggression: 0.6, macro: 0.9, adaptability: 0.7 },
        CONTROLLER: { aggression: 0.5, macro: 1.2, adaptability: 0.9 },
        INITIATOR: { aggression: 0.7, macro: 1.1, adaptability: 0.9 },
        GENERAL: { aggression: 1.0, macro: 1.0, adaptability: 1.0 },
      },
      CS2: {
        AWPER: { aggression: 1.2, macro: 0.8, adaptability: 0.7 },
        LURKER: { aggression: 1.1, macro: 1.3, adaptability: 0.9 },
        IGL: { aggression: 0.7, macro: 1.4, adaptability: 1.0 },
        RIFLER: { aggression: 1.1, macro: 1.0, adaptability: 0.8 },
        SUPPORT: { aggression: 0.6, macro: 1.1, adaptability: 0.8 },
        GENERAL: { aggression: 1.0, macro: 1.0, adaptability: 1.0 },
      },
      DOTA2: {
        CARRY: { aggression: 1.2, macro: 0.8, adaptability: 0.7 },
        MIDLANER: { aggression: 1.1, macro: 1.1, adaptability: 0.9 },
        OFFLANER: { aggression: 1.0, macro: 1.0, adaptability: 0.8 },
        SUPPORT: { aggression: 0.5, macro: 1.3, adaptability: 1.0 },
        HARD_SUPPORT: { aggression: 0.4, macro: 1.2, adaptability: 1.0 },
        GENERAL: { aggression: 1.0, macro: 1.0, adaptability: 1.0 },
      },
      LOL: {
        TOP: { aggression: 1.1, macro: 1.0, adaptability: 0.8 },
        JUNGLE: { aggression: 0.9, macro: 1.4, adaptability: 1.0 },
        MID: { aggression: 1.1, macro: 1.1, adaptability: 0.9 },
        ADC: { aggression: 1.0, macro: 0.8, adaptability: 0.7 },
        SUPPORT: { aggression: 0.5, macro: 1.3, adaptability: 1.0 },
        GENERAL: { aggression: 1.0, macro: 1.0, adaptability: 1.0 },
      },
    };

    const gameMultipliers = multipliers[gameTitle];
    return gameMultipliers?.[role] || gameMultipliers?.GENERAL || { aggression: 1.0, macro: 1.0, adaptability: 1.0 };
  }

  private calculateAggression(stats: GameSpecificStats, roleMultipliers: Record<string, number>): number {
    const aggressionKeys = ['firstKill', 'firstBlood', 'entrySuccess', 'duelWon', 'aggroBait'];
    let baseAggression = 0.5;

    for (const key of aggressionKeys) {
      if (stats.rawStats[key] !== undefined) {
        baseAggression = (baseAggression + this.normalizeStat(key, stats.rawStats[key], stats.gameTitle)) / 2;
      }
    }

    return Math.min(1, baseAggression * roleMultipliers.aggression);
  }

  private calculateMacro(stats: GameSpecificStats, roleMultipliers: Record<string, number>): number {
    const macroKeys = ['visionScore', 'objectiveContest', 'teamfightParticipation', 'roamEfficiency'];
    let baseMacro = 0.5;

    for (const key of macroKeys) {
      if (stats.rawStats[key] !== undefined) {
        baseMacro = (baseMacro + this.normalizeStat(key, stats.rawStats[key], stats.gameTitle)) / 2;
      }
    }

    return Math.min(1, baseMacro * roleMultipliers.macro);
  }

  private calculateAdaptability(stats: GameSpecificStats, roleMultipliers: Record<string, number>): number {
    const adaptabilityKeys = ['counterPickWin', 'mapWinRate', 'patchWinRate', 'heroPoolSize'];
    let baseAdaptability = 0.5;

    for (const key of adaptabilityKeys) {
      if (stats.rawStats[key] !== undefined) {
        baseAdaptability = (baseAdaptability + this.normalizeStat(key, stats.rawStats[key], stats.gameTitle)) / 2;
      }
    }

    return Math.min(1, baseAdaptability * roleMultipliers.adaptability);
  }

  private calculateMetaAlignment(stats: GameSpecificStats, roleMultipliers: Record<string, number>): number {
    const metaKeys = ['metaPickWinRate', 'sTierWinRate', 'metaAgentWinRate'];
    let metaScore = 0.5;

    for (const key of metaKeys) {
      if (stats.rawStats[key] !== undefined) {
        metaScore = (metaScore + this.normalizeStat(key, stats.rawStats[key], stats.gameTitle)) / 2;
      }
    }

    return Math.min(1, metaScore);
  }

  mergeMultiTitleProfiles(profiles: NormalizedProfile[]): UniversalFeatures {
    if (profiles.length === 0) {
      return {
        skill_index: 0.5,
        aggression_index: 0.5,
        macro_intelligence: 0.5,
        adaptability_score: 0.5,
        meta_alignment_score: 0.5,
        synergy_score: 0.5,
      };
    }

    const gameCount = profiles.length;
    const aggregated = profiles.reduce(
      (acc, p) => ({
        skill_index: acc.skill_index + p.universalFeatures.skill_index,
        aggression_index: acc.aggression_index + p.universalFeatures.aggression_index,
        macro_intelligence: acc.macro_intelligence + p.universalFeatures.macro_intelligence,
        adaptability_score: acc.adaptability_score + p.universalFeatures.adaptability_score,
        meta_alignment_score: acc.meta_alignment_score + p.universalFeatures.meta_alignment_score,
        synergy_score: acc.synergy_score + p.universalFeatures.synergy_score,
      }),
      { skill_index: 0, aggression_index: 0, macro_intelligence: 0, adaptability_score: 0, meta_alignment_score: 0, synergy_score: 0 }
    );

    return {
      skill_index: Math.round((aggregated.skill_index / gameCount) * 1000) / 1000,
      aggression_index: Math.round((aggregated.aggression_index / gameCount) * 1000) / 1000,
      macro_intelligence: Math.round((aggregated.macro_intelligence / gameCount) * 1000) / 1000,
      adaptability_score: Math.round((aggregated.adaptability_score / gameCount) * 1000) / 1000,
      meta_alignment_score: Math.round((aggregated.meta_alignment_score / gameCount) * 1000) / 1000,
      synergy_score: Math.round((aggregated.synergy_score / gameCount) * 1000) / 1000,
    };
  }
}

export const multiTitleNormalizer = new MultiTitleNormalizer();

