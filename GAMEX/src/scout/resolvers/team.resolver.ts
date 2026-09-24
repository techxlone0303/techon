/**
 * ScoutIQ - Team Resolver
 * 
 * Resolves team names to GRID team objects using:
 * 1. Alias dictionary
 * 2. Cached team data with fuzzy matching
 */

import { CachedTeam, teamCache, TEAM_ALIASES, initializeTeamCache } from "../../grid/central/teamCache.service";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ResolveResult {
  team: CachedTeam;
  confidence: number;
  matchType: "exact" | "shortened" | "partial" | "alias";
  matchedName: string;
}

export interface ResolveError extends Error {
  code: "NOT_FOUND" | "AMBIGUOUS" | "CACHE_EMPTY";
  inputName: string;
  suggestions?: string[];
}

// ============================================================================
// Team Resolver Class
// ============================================================================

class TeamResolver {
  /**
   * Resolve a team name to a GRID team
   */
  async resolve(inputName: string): Promise<ResolveResult> {
    const normalized = this.normalizeInput(inputName);
    
    console.log("[TEAM RESOLVER] Resolving team: \"" + inputName + "\" (normalized: \"" + normalized + "\")");

    // Step 1: Check alias dictionary first (works even without GRID API)
    const aliasResult = await this.checkAlias(normalized);
    if (aliasResult) {
      console.log("[TEAM RESOLVER] Matched via alias: \"" + aliasResult.team.name + "\" (confidence: " + aliasResult.confidence + ")");
      return aliasResult;
    }

    // Step 2: Try to search in cache (if loaded)
    const allTeams = teamCache.getAllTeams();
    if (allTeams.length > 0) {
      const searchResults = teamCache.searchByName(normalized);

      if (searchResults.length > 0) {
        if (searchResults.length === 1) {
          const result = this.createResult(searchResults[0], 0.95, "partial", normalized);
          console.log("[TEAM RESOLVER] Matched from cache: \"" + result.team.name + "\" (confidence: " + result.confidence + ")");
          return result;
        }

        const sorted = this.rankMatches(normalized, searchResults);
        const best = sorted[0];

        if (best.confidence < 0.5) {
          throw this.createAmbiguousError(inputName, sorted.map(r => r.team.name));
        }

        console.log("[TEAM RESOLVER] Matched from cache: \"" + best.team.name + "\" (confidence: " + best.confidence + ")");
        return best;
      }
    }

    // Step 3: Try to load cache from GRID if not loaded
    if (allTeams.length === 0) {
      console.log("[TEAM RESOLVER] Cache empty, attempting to load from GRID...");
      try {
        await initializeTeamCache();
        const teams = teamCache.getAllTeams();
        console.log("[TEAM RESOLVER] Loaded " + teams.length + " teams from GRID");
        
        if (teams.length > 0) {
          return this.resolve(inputName); // Retry with loaded cache
        }
      } catch (error) {
        console.error("[TEAM RESOLVER] Failed to load from GRID:", error);
      }
    }

    // Step 4: Final fallback - throw error with suggestions from known aliases
    const aliasNames = Object.keys(TEAM_ALIASES);
    const suggestions = aliasNames.slice(0, 5);
    throw this.createNotFoundErrorWithSuggestions(inputName, suggestions);
  }

  /**
   * Normalize input name for comparison
   */
  private normalizeInput(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Check alias dictionary
   */
  private async checkAlias(normalized: string): Promise<ResolveResult | null> {
    // Normalize the input for alias lookup (remove all non-alphanumeric)
    const normalizedKey = normalized.replace(/[^a-z0-9]/g, "");
    
    console.log("[TEAM RESOLVER] Checking alias for: \"" + normalized + "\" (key: \"" + normalizedKey + "\")");
    
    // Direct alias match (e.g., "c9" -> "Cloud9")
    if (TEAM_ALIASES[normalizedKey]) {
      const aliasTarget = TEAM_ALIASES[normalizedKey];
      console.log("[TEAM RESOLVER] Alias found: \"" + normalizedKey + "\" -> \"" + aliasTarget + "\"");
      
      // Try to find in cache first
      const team = teamCache.getTeamByExactName(aliasTarget);
      if (team) {
        return this.createResult(team, 1.0, "alias", normalized);
      }
      
      // Team not in cache - try to fetch from GRID
      console.log("[TEAM RESOLVER] Team not in cache, fetching from GRID...");
      const fetchedTeam = await this.fetchTeamByName(aliasTarget);
      if (fetchedTeam) {
        return this.createResult(fetchedTeam, 0.95, "alias", normalized);
      }
    }

    // Also check if the original normalized name is an alias key
    if (TEAM_ALIASES[normalized]) {
      const aliasTarget = TEAM_ALIASES[normalized];
      console.log("[TEAM RESOLVER] Alias found (direct): \"" + normalized + "\" -> \"" + aliasTarget + "\"");
      
      const team = teamCache.getTeamByExactName(aliasTarget);
      if (team) {
        return this.createResult(team, 1.0, "alias", normalized);
      }
      
      const fetchedTeam = await this.fetchTeamByName(aliasTarget);
      if (fetchedTeam) {
        return this.createResult(fetchedTeam, 0.95, "alias", normalized);
      }
    }

    // Check if normalized input IS an alias target (reverse lookup)
    // e.g., "Cloud9" is in alias values, so "cloud9" should match
    const normalizedAliasValues = Object.values(TEAM_ALIASES).map(v => v.toLowerCase());
    if (normalizedAliasValues.includes(normalized.toLowerCase())) {
      console.log("[TEAM RESOLVER] Reverse alias match for: \"" + normalized + "\"");
      
      // Find the original case version
      const originalValue = Object.values(TEAM_ALIASES).find(v => v.toLowerCase() === normalized.toLowerCase());
      if (originalValue) {
        const team = teamCache.getTeamByExactName(originalValue);
        if (team) {
          return this.createResult(team, 0.95, "exact", normalized);
        }
        
        const fetchedTeam = await this.fetchTeamByName(originalValue);
        if (fetchedTeam) {
          return this.createResult(fetchedTeam, 0.90, "exact", normalized);
        }
      }
    }

    console.log("[TEAM RESOLVER] No alias match found for: \"" + normalized + "\"");
    return null;
  }

  /**
   * Fetch a single team from GRID by name
   */
  private async fetchTeamByName(name: string): Promise<CachedTeam | null> {
    try {
      const { getTeamByName } = await import("../../grid/central/teams.service");
      const team = await getTeamByName(name);
      if (team) {
        return {
          id: team.id,
          name: team.name,
          nameShortened: team.nameShortened,
          logoUrl: team.logoUrl,
          colorPrimary: team.colorPrimary,
          colorSecondary: team.colorSecondary,
        };
      }
    } catch (error) {
      console.error("[TEAM RESOLVER] Failed to fetch team \"" + name + "\" from GRID:", error);
    }
    return null;
  }

  /**
   * Rank matches by similarity score
   */
  private rankMatches(
    normalized: string,
    teams: CachedTeam[]
  ): ResolveResult[] {
    return teams.map(team => {
      const result = this.calculateMatch(normalized, team);
      return result;
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate match confidence for a team
   */
  private calculateMatch(
    normalized: string,
    team: CachedTeam
  ): ResolveResult {
    const teamName = team.name.toLowerCase();
    const teamShort = team.nameShortened?.toLowerCase() || "";

    // Exact match on full name
    if (teamName === normalized) {
      return this.createResult(team, 1.0, "exact", normalized);
    }

    // Exact match on shortened name
    if (teamShort && teamShort === normalized) {
      return this.createResult(team, 0.95, "shortened", normalized);
    }

    // Normalized full name match
    const normalizedTeamName = this.normalizeInput(team.name);
    if (normalizedTeamName === normalized) {
      return this.createResult(team, 0.95, "exact", normalized);
    }

    // Normalized shortened name match
    if (teamShort) {
      const normalizedShort = this.normalizeInput(teamShort);
      if (normalizedShort === normalized) {
        return this.createResult(team, 0.90, "shortened", normalized);
      }
    }

    // Partial match (input contains team name or vice versa)
    if (normalized.includes(teamName) || teamName.includes(normalized)) {
      return this.createResult(team, 0.75, "partial", normalized);
    }

    if (teamShort && (normalized.includes(teamShort) || teamShort.includes(normalized))) {
      return this.createResult(team, 0.70, "partial", normalized);
    }

    // Fuzzy character match (Jaccard similarity)
    const fuzzyScore = this.calculateFuzzyScore(normalized, teamName);
    if (fuzzyScore > 0.5) {
      return this.createResult(team, fuzzyScore * 0.6, "partial", normalized);
    }

    // Low confidence fallback
    return this.createResult(team, 0.3, "partial", normalized);
  }

  /**
   * Calculate fuzzy similarity score using Jaccard index
   */
  private calculateFuzzyScore(s1: string, s2: string): number {
    const set1 = new Set(s1.split(""));
    const set2 = new Set(s2.split(""));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Create a resolve result
   */
  private createResult(
    team: CachedTeam,
    confidence: number,
    matchType: ResolveResult["matchType"],
    matchedName: string
  ): ResolveResult {
    return {
      team,
      confidence: Math.round(confidence * 100) / 100,
      matchType,
      matchedName,
    };
  }

  /**
   * Ensure cache is loaded
   */
  private async ensureCacheLoaded(): Promise<void> {
    if (teamCache.isCacheEmpty()) {
      console.log("[TEAM RESOLVER] Cache empty, loading teams from GRID...");
      try {
        await initializeTeamCache();
        const count = teamCache.getAllTeams().length;
        console.log("[TEAM RESOLVER] Loaded " + count + " teams into cache");
        if (count === 0) {
          console.warn("[TEAM RESOLVER] WARNING: No teams loaded from GRID - check API key and connectivity");
        }
      } catch (error) {
        console.error("[TEAM RESOLVER] Failed to load teams from GRID:", error);
      }
    }
  }

  /**
   * Create NOT_FOUND error with suggestions
   */
  private createNotFoundErrorWithSuggestions(inputName: string, suggestions: string[]): ResolveError {
    const error = new Error("Team not found: \"" + inputName + "\". Try one of: " + suggestions.join(", ")) as ResolveError;
    error.code = "NOT_FOUND";
    error.inputName = inputName;
    error.suggestions = suggestions;
    console.log("[TEAM RESOLVER] Not found: \"" + inputName + "\" (suggestions: " + suggestions.join(", ") + ")");
    return error;
  }

  /**
   * Create NOT_FOUND error
   */
  private createNotFoundError(inputName: string): ResolveError {
    const error = new Error("Team not found: \"" + inputName + "\"") as ResolveError;
    error.code = "NOT_FOUND";
    error.inputName = inputName;

    const allTeams = teamCache.getAllTeams();
    const suggestions = allTeams.slice(0, 5).map((t: CachedTeam) => t.name);
    error.suggestions = suggestions;

    console.log("[TEAM RESOLVER] Not found: \"" + inputName + "\" (suggestions: " + suggestions.join(", ") + ")");
    return error;
  }

  /**
   * Create AMBIGUOUS error
   */
  private createAmbiguousError(inputName: string, suggestions: string[]): ResolveError {
    const error = new Error("Multiple teams match: \"" + inputName + "\"") as ResolveError;
    error.code = "AMBIGUOUS";
    error.inputName = inputName;
    error.suggestions = suggestions;

    console.log("[TEAM RESOLVER] Ambiguous: \"" + inputName + "\" (options: " + suggestions.join(", ") + ")");
    return error;
  }

  /**
   * Get all cached teams
   */
  getAllTeams(): CachedTeam[] {
    return teamCache.getAllTeams();
  }

  /**
   * Get resolver statistics
   */
  getStats(): { cachedTeams: number; aliases: number } {
    return {
      cachedTeams: teamCache.getAllTeams().length,
      aliases: Object.keys(TEAM_ALIASES).length,
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const teamResolver = new TeamResolver();

// Convenience function
export async function resolveTeamName(name: string): Promise<ResolveResult> {
  return teamResolver.resolve(name);
}

// Get all known teams
export function getAllKnownTeams(): CachedTeam[] {
  return teamResolver.getAllTeams();
}

// Get resolver stats
export function getResolverStats(): { cachedTeams: number; aliases: number } {
  return teamResolver.getStats();
}

export default {
  teamResolver,
  resolveTeamName,
  getAllKnownTeams,
  getResolverStats,
  TEAM_ALIASES,
};

