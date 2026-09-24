export interface EloRating {
  rating: number;
  previousRating: number;
  change: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  peakRating: number;
  lastGameAt: string | null;
}

export interface EloHistoryEntry {
  timestamp: string;
  rating: number;
  change: number;
  opponentId?: string;
  result: 'win' | 'loss' | 'draw';
}

export interface EloConfig {
  baseRating: number;
  kFactor: number;
  ratingFloor: number;
  ratingCeiling: number;
}

const DEFAULT_ELO_CONFIG: EloConfig = {
  baseRating: 1000,
  kFactor: 32,
  ratingFloor: 500,
  ratingCeiling: 2000,
};

export class EloEngine {
  private config: EloConfig;
  private ratings: Map<string, EloRating> = new Map();
  private history: Map<string, EloHistoryEntry[]> = new Map();

  constructor(config: Partial<EloConfig> = {}) {
    this.config = { ...DEFAULT_ELO_CONFIG, ...config };
  }

  private getExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  private clampRating(rating: number): number {
    return Math.max(this.config.ratingFloor, Math.min(this.config.ratingCeiling, rating));
  }

  getRating(playerId: string): EloRating {
    if (!this.ratings.has(playerId)) {
      const initialRating: EloRating = {
        rating: this.config.baseRating,
        previousRating: this.config.baseRating,
        change: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        peakRating: this.config.baseRating,
        lastGameAt: null,
      };
      this.ratings.set(playerId, initialRating);
      this.history.set(playerId, []);
    }
    return this.ratings.get(playerId)!;
  }

  updateRating(
    playerId: string,
    opponentId: string,
    result: 'win' | 'loss' | 'draw',
    isUpset: boolean = false
  ): EloRating {
    const playerRating = this.getRating(playerId);
    const opponentRating = this.getRating(opponentId);

    const expectedScore = this.getExpectedScore(playerRating.rating, opponentRating.rating);

    let actualScore = 0;
    if (result === 'win') actualScore = 1;
    else if (result === 'draw') actualScore = 0.5;

    let kFactor = this.config.kFactor;
    if (isUpset) {
      kFactor *= 1.5;
    } else if (Math.abs(playerRating.rating - opponentRating.rating) > 200) {
      kFactor *= 0.8;
    }

    const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
    const newRating = this.clampRating(playerRating.rating + ratingChange);

    const updatedRating: EloRating = {
      rating: newRating,
      previousRating: playerRating.rating,
      change: ratingChange,
      gamesPlayed: playerRating.gamesPlayed + 1,
      wins: playerRating.wins + (result === 'win' ? 1 : 0),
      losses: playerRating.losses + (result === 'loss' ? 1 : 0),
      winRate: 0,
      peakRating: Math.max(playerRating.peakRating, newRating),
      lastGameAt: new Date().toISOString(),
    };

    updatedRating.winRate = updatedRating.gamesPlayed > 0
      ? Math.round((updatedRating.wins / updatedRating.gamesPlayed) * 1000) / 1000
      : 0;

    this.ratings.set(playerId, updatedRating);

    const historyEntry: EloHistoryEntry = {
      timestamp: new Date().toISOString(),
      rating: newRating,
      change: ratingChange,
      opponentId,
      result,
    };
    const playerHistory = this.history.get(playerId) || [];
    playerHistory.push(historyEntry);
    this.history.set(playerId, playerHistory);

    return updatedRating;
  }

  predictMatchOutcome(
    playerIdA: string,
    playerIdB: string
  ): { probabilityA: number; probabilityB: number; expectedMargin: number } {
    const ratingA = this.getRating(playerIdA).rating;
    const ratingB = this.getRating(playerIdB).rating;

    const probA = this.getExpectedScore(ratingA, ratingB);
    const probB = 1 - probA;

    const ratingDiff = ratingA - ratingB;
    const expectedMargin = ratingDiff / 25;

    return {
      probabilityA: Math.round(probA * 1000) / 1000,
      probabilityB: Math.round(probB * 1000) / 1000,
      expectedMargin: Math.round(expectedMargin * 100) / 100,
    };
  }

  getRatingHistory(playerId: string): EloHistoryEntry[] {
    return this.history.get(playerId) || [];
  }

  getTopPlayers(limit: number = 10): Array<{ playerId: string; rating: EloRating }> {
    const allRatings = Array.from(this.ratings.entries())
      .map(([playerId, rating]) => ({ playerId, rating }))
      .sort((a, b) => b.rating.rating - a.rating.rating);

    return allRatings.slice(0, limit);
  }

  getPlayerRank(playerId: string): number {
    const entries = Array.from(this.ratings.entries());
    entries.sort((a, b) => b[1].rating - a[1].rating);

    const rank = entries.findIndex(([id]) => id === playerId);
    return rank >= 0 ? rank + 1 : -1;
  }

  getLeaderboard(limit: number = 10): Array<{ rank: number; playerId: string; rating: number; winRate: number }> {
    return this.getTopPlayers(limit).map((entry, index) => ({
      rank: index + 1,
      playerId: entry.playerId,
      rating: entry.rating.rating,
      winRate: entry.rating.winRate,
    }));
  }

  initializeFromStats(
    playerId: string,
    stats: { winRate: number; gamesPlayed: number; kdaRatio: number }
  ): EloRating {
    const baseRating = this.config.baseRating;

    const winRateAdjustment = (stats.winRate - 0.5) * 200;
    const experienceAdjustment = Math.min(100, stats.gamesPlayed * 2);
    const kdaAdjustment = (stats.kdaRatio - 1) * 50;

    const initialRating = Math.round(baseRating + winRateAdjustment + experienceAdjustment + kdaAdjustment);
    const clampedRating = this.clampRating(initialRating);

    const rating: EloRating = {
      rating: clampedRating,
      previousRating: clampedRating,
      change: 0,
      gamesPlayed: stats.gamesPlayed,
      wins: Math.round(stats.gamesPlayed * stats.winRate),
      losses: stats.gamesPlayed - Math.round(stats.gamesPlayed * stats.winRate),
      winRate: stats.winRate,
      peakRating: clampedRating,
      lastGameAt: null,
    };

    this.ratings.set(playerId, rating);
    this.history.set(playerId, []);

    return rating;
  }

  exportRatings(): Map<string, EloRating> {
    return new Map(this.ratings);
  }

  importRatings(ratings: Map<string, EloRating>): void {
    this.ratings = new Map(ratings);
  }

  clear(): void {
    this.ratings.clear();
    this.history.clear();
  }

  size(): number {
    return this.ratings.size;
  }
}

export const eloEngine = new EloEngine();

