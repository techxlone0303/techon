export interface StoredMatch {
  id: string;
  teamA: string;
  teamB: string;
  result: 'win' | 'loss' | 'draw';
  score: string;
  date: string;
  tournament?: string;
}

export interface TeamTrend {
  teamId: string;
  recentForm: number[];
  avgScore: string;
  winStreak: number;
  lossStreak: number;
  totalMatches: number;
}

export interface HeadToHead {
  teamA: string;
  teamB: string;
  totalMatches: number;
  winsA: number;
  winsB: number;
  draws: number;
  recentResults: StoredMatch[];
}

export class MatchHistoryStore {
  private matches: Map<string, StoredMatch[]> = new Map();
  private matchIndex: Map<string, Set<string>> = new Map();

  addMatch(match: StoredMatch): void {
    const matchList = this.matches.get(match.id);
    if (matchList) {
      return;
    }

    this.matches.set(match.id, [match]);

    this.indexTeamMatch(match.teamA, match.id);
    this.indexTeamMatch(match.teamB, match.id);
  }

  private indexTeamMatch(teamId: string, matchId: string): void {
    if (!this.matchIndex.has(teamId)) {
      this.matchIndex.set(teamId, new Set());
    }
    this.matchIndex.get(teamId)!.add(matchId);
  }

  getRecentMatches(teamId: string, limit: number = 10): StoredMatch[] {
    const matchIds = this.matchIndex.get(teamId);
    if (!matchIds || matchIds.size === 0) {
      return [];
    }

    const matches: StoredMatch[] = [];
    for (const id of matchIds) {
      const matchList = this.matches.get(id);
      if (matchList && matchList[0]) {
        matches.push(matchList[0]);
      }
    }

    matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return matches.slice(0, limit);
  }

  getHeadToHead(teamA: string, teamB: string): HeadToHead {
    const matchesA = this.matchIndex.get(teamA);
    const matchesB = this.matchIndex.get(teamB);

    if (!matchesA || !matchesB) {
      return {
        teamA,
        teamB,
        totalMatches: 0,
        winsA: 0,
        winsB: 0,
        draws: 0,
        recentResults: [],
      };
    }

    const h2hIds = new Set([...matchesA].filter(id => matchesB.has(id)));
    const matches: StoredMatch[] = [];

    for (const id of h2hIds) {
      const matchList = this.matches.get(id);
      if (matchList && matchList[0]) {
        matches.push(matchList[0]);
      }
    }

    matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let winsA = 0;
    let winsB = 0;
    let draws = 0;

    for (const m of matches) {
      if (m.result === 'win') {
        winsA += m.teamA === teamA ? 1 : 0;
        winsB += m.teamB === teamA ? 1 : 0;
      } else if (m.result === 'loss') {
        winsA += m.teamA === teamB ? 1 : 0;
        winsB += m.teamB === teamB ? 1 : 0;
      } else {
        draws++;
      }
    }

    return {
      teamA,
      teamB,
      totalMatches: matches.length,
      winsA,
      winsB,
      draws,
      recentResults: matches.slice(0, 5),
    };
  }

  getTrend(teamId: string): TeamTrend {
    const recentMatches = this.getRecentMatches(teamId, 10);
    const recentForm: number[] = [];
    let winStreak = 0;
    let lossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let totalScoreA = 0;
    let totalScoreB = 0;
    let scoreCount = 0;

    for (const m of recentMatches) {
      const isTeamA = m.teamA === teamId;
      const scoreParts = m.score.split(' - ');
      const myScore = isTeamA ? parseInt(scoreParts[0]) : parseInt(scoreParts[1]);
      const oppScore = isTeamA ? parseInt(scoreParts[1]) : parseInt(scoreParts[0]);

      if (!isNaN(myScore) && !isNaN(oppScore)) {
        totalScoreA += myScore;
        totalScoreB += oppScore;
        scoreCount++;
      }

      if (m.result === 'win') {
        recentForm.push(1);
        winStreak++;
        lossStreak = 0;
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
      } else if (m.result === 'loss') {
        recentForm.push(0);
        lossStreak++;
        winStreak = 0;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      } else {
        recentForm.push(0.5);
        winStreak = 0;
        lossStreak = 0;
      }
    }

    return {
      teamId,
      recentForm,
      avgScore: scoreCount > 0 ? `${(totalScoreA / scoreCount).toFixed(1)} - ${(totalScoreB / scoreCount).toFixed(1)}` : '0 - 0',
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
      totalMatches: recentMatches.length,
    };
  }

  clear(): void {
    this.matches.clear();
    this.matchIndex.clear();
  }

  size(): number {
    return this.matches.size;
  }
}

export const matchHistoryStore = new MatchHistoryStore();

