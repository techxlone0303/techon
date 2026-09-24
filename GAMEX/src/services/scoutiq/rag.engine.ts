export interface Insight {
  key: string;
  value: any;
  timestamp: string;
  tags: string[];
}

export interface TeamMemory {
  teamId: string;
  profile: any;
  insights: Insight[];
  lastUpdated: string;
}

export interface MatchupMemory {
  teamA: string;
  teamB: string;
  insights: Insight[];
  matchHistory: any[];
}

export class ScoutMemory {
  private insights: Map<string, Insight> = new Map();
  private teamMemories: Map<string, TeamMemory> = new Map();
  private matchupMemories: Map<string, MatchupMemory> = new Map();

  private makeMatchupKey(teamA: string, teamB: string): string {
    return [teamA, teamB].sort().join('::');
  }

  storeInsight(key: string, value: any, tags: string[] = []): void {
    const insight: Insight = {
      key,
      value,
      timestamp: new Date().toISOString(),
      tags,
    };
    this.insights.set(key, insight);

    for (const tag of tags) {
      if (!tag.includes('team:')) continue;
      const teamId = tag.replace('team:', '');
      this.updateTeamInsight(teamId, insight);
    }
  }

  private updateTeamInsight(teamId: string, insight: Insight): void {
    if (!this.teamMemories.has(teamId)) {
      this.teamMemories.set(teamId, {
        teamId,
        profile: {},
        insights: [],
        lastUpdated: new Date().toISOString(),
      });
    }
    const memory = this.teamMemories.get(teamId)!;
    memory.insights.push(insight);
    memory.lastUpdated = new Date().toISOString();
  }

  retrieveInsight(query: string): Insight[] {
    const results: Insight[] = [];
    const queryLower = query.toLowerCase();

    for (const [key, insight] of this.insights) {
      const keyLower = key.toLowerCase();
      const valueStr = JSON.stringify(insight.value).toLowerCase();

      if (keyLower.includes(queryLower) || valueStr.includes(queryLower)) {
        results.push(insight);
      }
    }

    return results.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getTeamProfile(teamId: string): TeamMemory | null {
    return this.teamMemories.get(teamId) || null;
  }

  getMatchupContext(teamA: string, teamB: string): MatchupMemory | null {
    const key = this.makeMatchupKey(teamA, teamB);
    return this.matchupMemories.get(key) || null;
  }

  storeMatchupInsight(teamA: string, teamB: string, insight: any): void {
    const key = this.makeMatchupKey(teamA, teamB);

    if (!this.matchupMemories.has(key)) {
      this.matchupMemories.set(key, {
        teamA,
        teamB,
        insights: [],
        matchHistory: [],
      });
    }

    const memory = this.matchupMemories.get(key)!;
    memory.insights.push({
      key: `${teamA} vs ${teamB}`,
      value: insight,
      timestamp: new Date().toISOString(),
      tags: [`team:${teamA}`, `team:${teamB}`, 'matchup'],
    });
  }

  addMatchupHistory(teamA: string, teamB: string, matchResult: any): void {
    const key = this.makeMatchupKey(teamA, teamB);

    if (!this.matchupMemories.has(key)) {
      this.matchupMemories.set(key, {
        teamA,
        teamB,
        insights: [],
        matchHistory: [],
      });
    }

    const memory = this.matchupMemories.get(key)!;
    memory.matchHistory.push({
      ...matchResult,
      timestamp: new Date().toISOString(),
    });

    if (memory.matchHistory.length > 20) {
      memory.matchHistory = memory.matchHistory.slice(-20);
    }
  }

  semanticSearch(query: string, limit: number = 5): Insight[] {
    const allInsights = Array.from(this.insights.values());
    const scored = allInsights.map(insight => {
      const relevance = this.computeRelevance(query, insight);
      return { insight, relevance };
    });

    scored.sort((a, b) => b.relevance - a.relevance);

    return scored.slice(0, limit).map(s => s.insight);
  }

  private computeRelevance(query: string, insight: Insight): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const keyTerms = insight.key.toLowerCase().split(/\s+/);
    const valueStr = JSON.stringify(insight.value).toLowerCase();

    let score = 0;

    for (const term of queryTerms) {
      if (insight.key.toLowerCase().includes(term)) {
        score += 3;
      }
      if (valueStr.includes(term)) {
        score += 1;
      }
    }

    for (const tag of insight.tags) {
      if (queryTerms.some(term => tag.toLowerCase().includes(term))) {
        score += 2;
      }
    }

    return score;
  }

  getStats(): { insightCount: number; teamCount: number; matchupCount: number } {
    return {
      insightCount: this.insights.size,
      teamCount: this.teamMemories.size,
      matchupCount: this.matchupMemories.size,
    };
  }

  clear(): void {
    this.insights.clear();
    this.teamMemories.clear();
    this.matchupMemories.clear();
  }
}

export const scoutMemory = new ScoutMemory();

