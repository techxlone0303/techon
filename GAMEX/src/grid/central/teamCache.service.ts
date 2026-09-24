/**
 * ScoutIQ - GRID Team Cache Service
 * 
 * Loads and caches teams from GRID Central API with proper pagination.
 * GRID has a maximum page size of 50, so we use cursor-based pagination.
 */

import { centralQuery } from "./grid.central.client";

// ============================================================================
// Type Definitions
// ============================================================================

export type CachedTeam = {
  id: string;
  name: string;
  nameShortened?: string;
  logoUrl?: string;
  colorPrimary?: string;
  colorSecondary?: string;
};

export interface TeamPageResponse {
  teams: {
    edges: Array<{ node: CachedTeam }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

// ============================================================================
// Team Aliases Dictionary
// ============================================================================

export const TEAM_ALIASES: Record<string, string> = {
  "fnc": "Fnatic",
  "fnatic": "Fnatic",
  "g2": "G2 Esports",
  "g2 esports": "G2 Esports",
  "c9": "Cloud9",
  "cloud9": "Cloud9",
  "t1": "T1",
  "drx": "DRX",
  "loud": "LOUD",
  "eg": "Evil Geniuses",
  "evil geniuses": "Evil Geniuses",
  "sen": "Sentinels",
  "sentinels": "Sentinels",
  "100t": "100 Thieves",
  "100 thieves": "100 Thieves",
  "navi": "NAVI",
  "natus vincere": "NAVI",
  "tl": "Team Liquid",
  "team liquid": "Team Liquid",
  "mibr": "MIBR",
  "kru": "KRU Esports",
  "kru esports": "KRU Esports",
  "zeta": "ZETA DIVISION",
  "zeta division": "ZETA DIVISION",
  "bleed": "Bleed Esports",
  "bleed esports": "Bleed Esports",
  "rrq": "RRQ",
  "rrq nexus": "RRQ",
  "prx": "Paper Rex",
  "paper rex": "Paper Rex",
  "talon": "Talon Esports",
  "talon esports": "Talon Esports",
  "team secret": "Team Secret",
  "teamsecret": "Team Secret",
};

// ============================================================================
// Team Cache Service
// ============================================================================

class TeamCacheService {
  private cache: Map<string, CachedTeam> = new Map();
  private nameIndex: Map<string, string[]> = new Map();
  private lastRefresh: number = 0;
  private readonly CACHE_TTL_MS = 10 * 60 * 1000;
  private readonly PAGE_SIZE = 50;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  getAllTeams(): CachedTeam[] {
    return Array.from(this.cache.values());
  }

  getTeamById(id: string): CachedTeam | undefined {
    return this.cache.get(id);
  }

  getTeamByExactName(name: string): CachedTeam | undefined {
    const normalized = name.toLowerCase().trim();
    const ids = this.nameIndex.get(normalized);
    if (ids && ids.length > 0) {
      return this.cache.get(ids[0]);
    }
    return undefined;
  }

  searchByName(name: string): CachedTeam[] {
    const normalized = this.normalizeForSearch(name);
    const results: CachedTeam[] = [];
    const seenIds = new Set<string>();

    const entries = Array.from(this.nameIndex.entries());
    for (const [key, ids] of entries) {
      const normalizedKey = this.normalizeForSearch(key);
      if (this.fuzzyMatch(normalized, normalizedKey)) {
        for (const id of ids) {
          if (!seenIds.has(id)) {
            const team = this.cache.get(id);
            if (team) {
              results.push(team);
              seenIds.add(id);
            }
          }
        }
      }
    }

    return results;
  }

  private normalizeForSearch(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "")
      .replace(/\s+/g, "");
  }

  private fuzzyMatch(input: string, target: string): boolean {
    if (input.length === 0 || target.length === 0) return false;
    if (input === target) return true;
    if (target.includes(input) || input.includes(target)) return true;
    if (this.calculateSimilarity(input, target) > 0.5) return true;
    return false;
  }

  private calculateSimilarity(s1: string, s2: string): number {
    const set1 = new Set(s1.split(""));
    const set2 = new Set(s2.split(""));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  isCacheStale(): boolean {
    return this.cache.size > 0 && Date.now() - this.lastRefresh > this.CACHE_TTL_MS;
  }

  isCacheEmpty(): boolean {
    return this.cache.size === 0;
  }

  async loadTeams(forceRefresh: boolean = false): Promise<void> {
    if (this.isLoading) {
      if (this.loadPromise) {
        return this.loadPromise;
      }
      return;
    }

    if (!forceRefresh && !this.isCacheStale() && !this.isCacheEmpty()) {
      console.log("[TEAM CACHE] Using cached teams (" + this.cache.size + " teams)");
      return;
    }

    this.isLoading = true;
    const loadPromise = this.doLoadTeams(forceRefresh);
    this.loadPromise = loadPromise;

    try {
      await loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async doLoadTeams(forceRefresh: boolean): Promise<void> {
    const startTime = Date.now();
    let cursor: string | null = null;
    let pageCount = 0;
    let totalTeams = 0;

    if (forceRefresh) {
      this.cache.clear();
      this.nameIndex.clear();
    }

    console.log("[TEAM CACHE] Loading teams from GRID (page size: " + this.PAGE_SIZE + ")...");

    try {
      do {
        // Pass variables explicitly to avoid null issues
        const variables: { first: number; after?: string } = cursor 
          ? { first: this.PAGE_SIZE, after: cursor }
          : { first: this.PAGE_SIZE };
        
        const query: string = cursor
          ? "query GetTeamsPage($first: Int!, $after: String!) { teams(first: $first, after: $after) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }"
          : "query GetTeamsPage($first: Int!) { teams(first: $first) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }";
        
        const response: TeamPageResponse = await centralQuery<TeamPageResponse>(query, variables);

        if (!response || !response.teams || !response.teams.edges) {
          console.warn("[TEAM CACHE] Invalid response on page " + (pageCount + 1));
          break;
        }

        const edges = response.teams.edges;
        const pageInfo = response.teams.pageInfo;

        for (const edge of edges) {
          const team = edge.node;
          this.cache.set(team.id, team);
          this.indexTeam(team);
          totalTeams++;
        }

        cursor = pageInfo.endCursor || null;
        pageCount++;

        if (totalTeams >= 500) {
          console.warn("[TEAM CACHE] Safety limit reached (500 teams)");
          break;
        }

        console.log("[TEAM CACHE] Loaded page " + pageCount + " (" + edges.length + " teams, total: " + totalTeams + ")");

      } while (cursor);

      this.lastRefresh = Date.now();
      const duration = Date.now() - startTime;
      console.log("[TEAM CACHE] Loaded " + totalTeams + " teams in " + pageCount + " pages (" + duration + "ms)");

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[TEAM CACHE] Failed to load teams: " + errorMsg);
      console.warn("[TEAM CACHE] Cache has " + this.cache.size + " teams from partial load");
    }
  }

  private buildPaginationQuery(cursor: string | null): string {
    if (cursor) {
      return "query GetTeamsPage($first: Int!, $after: String!) { teams(first: $first, after: $after) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }";
    }
    return "query GetTeamsPage($first: Int!) { teams(first: $first) { edges { node { id name nameShortened logoUrl colorPrimary colorSecondary } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }";
  }

  private indexTeam(team: CachedTeam): void {
    const fullName = team.name.toLowerCase();
    this.addToIndex(fullName, team.id);

    if (team.nameShortened) {
      const shortName = team.nameShortened.toLowerCase();
      this.addToIndex(shortName, team.id);
    }
  }

  private addToIndex(key: string, teamId: string): void {
    const existing = this.nameIndex.get(key) || [];
    if (!existing.includes(teamId)) {
      existing.push(teamId);
      this.nameIndex.set(key, existing);
    }
  }

  getStats(): { count: number; lastRefresh: number; ageMs: number } {
    return {
      count: this.cache.size,
      lastRefresh: this.lastRefresh,
      ageMs: Date.now() - this.lastRefresh,
    };
  }

  clear(): void {
    this.cache.clear();
    this.nameIndex.clear();
    this.lastRefresh = 0;
    console.log("[TEAM CACHE] Cache cleared");
  }
}

export const teamCache = new TeamCacheService();

export async function initializeTeamCache(forceRefresh: boolean = false): Promise<void> {
  await teamCache.loadTeams(forceRefresh);
}

export function getCachedTeams(): CachedTeam[] {
  return teamCache.getAllTeams();
}

export function searchCachedTeams(name: string): CachedTeam[] {
  return teamCache.searchByName(name);
}

export default {
  teamCache,
  initializeTeamCache,
  getCachedTeams,
  searchCachedTeams,
  TEAM_ALIASES,
};

