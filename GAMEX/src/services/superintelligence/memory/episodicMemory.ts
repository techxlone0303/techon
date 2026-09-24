/**
 * ScoutIQ v5 - Episodic Memory System
 * 
 * Stores and retrieves specific match experiences and outcomes:
 * - Match results
 * - Predictions with outcomes
 * - Performance over time
 * - Notable events
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EpisodicMemory {
  id: string;
  timestamp: string;
  type: 'match' | 'prediction' | 'training' | 'event';
  
  // Context
  teamA?: string;
  teamB?: string;
  players?: string[];
  matchFormat?: string;
  map?: string;
  tournament?: string;
  
  // Content
  content: Record<string, any>;
  
  // Outcome (for matches and predictions)
  actualOutcome?: Record<string, any>;
  predictionCorrect?: boolean;
  
  // Emotional/salience weight
  salience: number; // 0-1, higher = more memorable
  emotionalImpact?: 'positive' | 'negative' | 'neutral';
  
  // Tags for retrieval
  tags: string[];
  
  // Learned insights
  insights?: string[];
  lessons?: string[];
}

export interface EpisodicQuery {
  types?: string[];
  teams?: string[];
  players?: string[];
  tags?: string[];
  minSalience?: number;
  maxAgeDays?: number;
  limit?: number;
}

export interface EpisodicRetrievalResult {
  memory: EpisodicMemory;
  relevanceScore: number;
  recencyBoost: number;
}

// ============================================================================
// Episodic Memory Engine
// ============================================================================

export class EpisodicMemoryEngine {
  private memories: Map<string, EpisodicMemory> = new Map();
  private teamIndex: Map<string, Set<string>> = new Map();
  private playerIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private timeline: string[] = [];

  // =========================================================================
  // Memory Storage
  // =========================================================================

  async storeMatch(
    matchId: string,
    teamA: string,
    teamB: string,
    result: {
      winner: string;
      score: string;
      format: string;
      map?: string;
      tournament?: string;
    },
    context: {
      predictions?: {
        predictedWinner: string;
        confidence: number;
        predictedScore: string;
      };
      features?: {
        teamA: UniversalFeatures;
        teamB: UniversalFeatures;
      };
      players?: string[];
    },
    salience: number = 0.5
  ): Promise<EpisodicMemory> {
    const now = new Date().toISOString();
    
    const memory: EpisodicMemory = {
      id: matchId,
      timestamp: now,
      type: 'match',
      teamA,
      teamB,
      players: context.players,
      matchFormat: result.format,
      map: result.map,
      tournament: result.tournament,
      content: {
        winner: result.winner,
        score: result.score,
        format: result.format,
      },
      actualOutcome: {
        winner: result.winner,
        score: result.score,
      },
      predictionCorrect: context.predictions
        ? context.predictions.predictedWinner === result.winner
        : undefined,
      salience,
      tags: [
        `team:${teamA}`,
        `team:${teamB}`,
        `result:${result.winner === teamA ? 'win' : 'loss'}`,
        result.format,
        ...(result.map ? [result.map] : []),
        ...(result.tournament ? [result.tournament] : []),
      ],
    };

    return this.addMemory(memory);
  }

  async storePrediction(
    predictionId: string,
    prediction: {
      teamA: string;
      teamB: string;
      predictedWinner: string;
      winProbability: number;
      confidence: number;
      expectedScore: string;
      keyFactors: string[];
    },
    actualOutcome?: {
      winner: string;
      score: string;
    }
  ): Promise<EpisodicMemory> {
    const now = new Date().toISOString();
    
    const memory: EpisodicMemory = {
      id: predictionId,
      timestamp: now,
      type: 'prediction',
      teamA: prediction.teamA,
      teamB: prediction.teamB,
      content: {
        predictedWinner: prediction.predictedWinner,
        winProbability: prediction.winProbability,
        confidence: prediction.confidence,
        expectedScore: prediction.expectedScore,
        keyFactors: prediction.keyFactors,
      },
      actualOutcome,
      predictionCorrect: actualOutcome
        ? prediction.predictedWinner === actualOutcome.winner
        : undefined,
      salience: prediction.confidence * 0.8,
      tags: [
        `team:${prediction.teamA}`,
        `team:${prediction.teamB}`,
        actualOutcome ? 'resolved' : 'pending',
      ],
    };

    return this.addMemory(memory);
  }

  async storeTrainingSession(
    sessionId: string,
    session: {
      focus: string;
      exercises: string[];
      metrics: Record<string, number>;
      notes: string;
    },
    participants: string[],
    salience: number = 0.3
  ): Promise<EpisodicMemory> {
    const now = new Date().toISOString();
    
    const memory: EpisodicMemory = {
      id: sessionId,
      timestamp: now,
      type: 'training',
      players: participants,
      content: session,
      salience,
      tags: ['training', ...participants.map(p => `player:${p}`)],
    };

    return this.addMemory(memory);
  }

  async storeEvent(
    eventId: string,
    event: {
      type: string;
      description: string;
      participants?: string[];
      impact: 'high' | 'medium' | 'low';
    }
  ): Promise<EpisodicMemory> {
    const now = new Date().toISOString();
    
    const memory: EpisodicMemory = {
      id: eventId,
      timestamp: now,
      type: 'event',
      players: event.participants,
      content: event,
      salience: event.impact === 'high' ? 0.8 : event.impact === 'medium' ? 0.5 : 0.3,
      emotionalImpact: event.impact === 'high' ? 'positive' : 'neutral',
      tags: ['event', event.type],
    };

    return this.addMemory(memory);
  }

  private async addMemory(memory: EpisodicMemory): Promise<EpisodicMemory> {
    this.memories.set(memory.id, memory);
    this.timeline.push(memory.id);

    // Index by team
    if (memory.teamA) {
      this.indexEntity(memory.teamA, memory.id, this.teamIndex);
    }
    if (memory.teamB) {
      this.indexEntity(memory.teamB, memory.id, this.teamIndex);
    }

    // Index by player
    if (memory.players) {
      for (const player of memory.players) {
        this.indexEntity(player, memory.id, this.playerIndex);
      }
    }

    // Index by tag
    for (const tag of memory.tags) {
      this.indexEntity(tag, memory.id, this.tagIndex);
    }

    // Limit memory size
    if (this.memories.size > 10000) {
      const oldestId = this.timeline.shift();
      if (oldestId) {
        this.removeMemory(oldestId);
      }
    }

    return memory;
  }

  private indexEntity(entity: string, memoryId: string, index: Map<string, Set<string>>): void {
    if (!index.has(entity)) {
      index.set(entity, new Set());
    }
    index.get(entity)!.add(memoryId);
  }

  private removeMemory(memoryId: string): void {
    const memory = this.memories.get(memoryId);
    if (!memory) return;

    // Remove from indices
    if (memory.teamA) {
      this.teamIndex.get(memory.teamA)?.delete(memoryId);
    }
    if (memory.teamB) {
      this.teamIndex.get(memory.teamB)?.delete(memoryId);
    }
    if (memory.players) {
      for (const player of memory.players) {
        this.playerIndex.get(player)?.delete(memoryId);
      }
    }
    for (const tag of memory.tags) {
      this.tagIndex.get(tag)?.delete(memoryId);
    }

    this.memories.delete(memoryId);
  }

  // =========================================================================
  // Memory Retrieval
  // =========================================================================

  async retrieve(query: EpisodicQuery): Promise<EpisodicRetrievalResult[]> {
    const results: EpisodicRetrievalResult[] = [];
    const now = Date.now();

    // Get candidate memory IDs
    const candidateIds = new Set<string>();

    // From team filter
    if (query.teams && query.teams.length > 0) {
      for (const team of query.teams) {
        const teamIds = this.teamIndex.get(team);
        if (teamIds) {
          teamIds.forEach(id => candidateIds.add(id));
        }
      }
    }

    // From player filter
    if (query.players && query.players.length > 0) {
      for (const player of query.players) {
        const playerIds = this.playerIndex.get(player);
        if (playerIds) {
          playerIds.forEach(id => candidateIds.add(id));
        }
      }
    }

    // From tag filter
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        const tagIds = this.tagIndex.get(tag);
        if (tagIds) {
          tagIds.forEach(id => candidateIds.add(id));
        }
      }
    }

    // If no filters, use all memories
    if (candidateIds.size === 0 && !query.types && !query.maxAgeDays && !query.minSalience) {
      this.memories.forEach((_, id) => candidateIds.add(id));
    }

    // Filter and score memories
    for (const id of candidateIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      // Type filter
      if (query.types && query.types.length > 0 && !query.types.includes(memory.type)) {
        continue;
      }

      // Salience filter
      if (query.minSalience && memory.salience < query.minSalience) {
        continue;
      }

      // Age filter
      if (query.maxAgeDays) {
        const memoryTime = new Date(memory.timestamp).getTime();
        const maxAge = query.maxAgeDays * 24 * 60 * 60 * 1000;
        if (now - memoryTime > maxAge) {
          continue;
        }
      }

      // Calculate relevance score
      let relevance = memory.salience;
      
      // Boost for matching teams/players
      if (query.teams?.includes(memory.teamA || '')) relevance += 0.1;
      if (query.teams?.includes(memory.teamB || '')) relevance += 0.1;
      
      // Boost for specific tags
      const matchingTags = memory.tags.filter(t => query.tags?.includes(t) || t.startsWith('team:'));
      relevance += matchingTags.length * 0.05;

      // Recency boost
      const memoryTime = new Date(memory.timestamp).getTime();
      const recencyDays = (now - memoryTime) / (24 * 60 * 60 * 1000);
      const recencyBoost = Math.max(0, 1 - recencyDays / 30) * 0.2;

      results.push({
        memory,
        relevanceScore: relevance,
        recencyBoost,
      });
    }

    // Sort by relevance
    results.sort((a, b) => 
      (b.relevanceScore + b.recencyBoost) - (a.relevanceScore + a.recencyBoost)
    );

    // Apply limit
    if (query.limit) {
      return results.slice(0, query.limit);
    }

    return results;
  }

  async getMatchHistory(
    teamA: string,
    teamB: string,
    limit: number = 10
  ): Promise<EpisodicRetrievalResult[]> {
    const h2hKey = [teamA, teamB].sort().join('::');
    return this.retrieve({
      teams: [teamA, teamB],
      tags: [`h2h:${h2hKey}`],
      limit,
    });
  }

  async getPlayerHistory(
    playerId: string,
    type?: string,
    limit: number = 20
  ): Promise<EpisodicRetrievalResult[]> {
    return this.retrieve({
      players: [playerId],
      types: type ? [type] : undefined,
      limit,
    });
  }

  async getRecentMatches(
    teamId: string,
    limit: number = 10
  ): Promise<EpisodicRetrievalResult[]> {
    return this.retrieve({
      teams: [teamId],
      types: ['match'],
      limit,
      maxAgeDays: 90,
    });
  }

  async getPredictionAccuracy(
    teamA: string,
    teamB: string
  ): Promise<{
    total: number;
    correct: number;
    accuracy: number;
    avgConfidence: number;
  }> {
    const predictions = await this.retrieve({
      teams: [teamA, teamB],
      types: ['prediction'],
      limit: 100,
    });

    let correct = 0;
    let confidenceSum = 0;
    let count = 0;

    for (const result of predictions) {
      if (result.memory.predictionCorrect !== undefined) {
        if (result.memory.predictionCorrect) correct++;
        confidenceSum += result.memory.content.confidence || 0;
        count++;
      }
    }

    return {
      total: count,
      correct,
      accuracy: count > 0 ? correct / count : 0,
      avgConfidence: count > 0 ? confidenceSum / count : 0,
    };
  }

  // =========================================================================
  // Statistics & Export
  // =========================================================================

  async getStats(): Promise<{
    totalMemories: number;
    byType: Record<string, number>;
    oldestMemory: string | null;
    newestMemory: string | null;
  }> {
    const byType: Record<string, number> = {};
    for (const memory of this.memories.values()) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    }

    return {
      totalMemories: this.memories.size,
      byType,
      oldestMemory: this.timeline[0] || null,
      newestMemory: this.timeline[this.timeline.length - 1] || null,
    };
  }

  async exportMemories(): Promise<EpisodicMemory[]> {
    return Array.from(this.memories.values());
  }

  async importMemories(memories: EpisodicMemory[]): Promise<void> {
    for (const memory of memories) {
      await this.addMemory(memory);
    }
  }

  clear(): void {
    this.memories.clear();
    this.teamIndex.clear();
    this.playerIndex.clear();
    this.tagIndex.clear();
    this.timeline = [];
  }
}

export const episodicMemory = new EpisodicMemoryEngine();

