/**
 * ScoutIQ v5 - Strategic Memory System
 * 
 * Stores high-level strategic insights and decision patterns:
 * - Game plans and strategies
 * - Opponent scouting reports
 * - Draft strategies
 * - Adaptation patterns
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StrategicMemory {
  id: string;
  type: 'game_plan' | 'scouting_report' | 'draft_strategy' | 'adaptation' | 'lesson';
  
  // Context
  teamId?: string;
  opponentId?: string;
  tournament?: string;
  matchFormat?: string;
  
  // Content
  title: string;
  description: string;
  strategy: StrategicContent;
  
  // Effectiveness
  successRate: number;
  usageCount: number;
  lastUsed?: string;
  lastSuccessful?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  source: 'analysis' | 'coaching' | 'match' | 'experiment';
  tags: string[];
  
  // Version tracking
  version: number;
  evolutionHistory?: StrategyEvolution[];
}

export interface StrategicContent {
  corePrinciples: string[];
  keyPlays: string[];
  adjustments: Array<{
    condition: string;
    action: string;
  }>;
  counters?: string[];
  weakPoints?: string[];
}

export interface StrategyEvolution {
  version: number;
  changes: string[];
  reason: string;
  timestamp: string;
  successImpact: number;
}

export interface StrategicQuery {
  types?: string[];
  teamId?: string;
  opponentId?: string;
  tags?: string[];
  minSuccessRate?: number;
  recentFirst?: boolean;
  limit?: number;
}

export interface StrategicRetrievalResult {
  memory: StrategicMemory;
  relevanceScore: number;
  applicabilityScore: number;
}

// ============================================================================
// Strategic Memory Engine
// ============================================================================

export class StrategicMemoryEngine {
  private memories: Map<string, StrategicMemory> = new Map();
  private teamIndex: Map<string, Set<string>> = new Map();
  private opponentIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();

  // =========================================================================
  // Memory Storage
  // =========================================================================

  async storeGamePlan(
    planId: string,
    plan: {
      title: string;
      description: string;
      strategy: StrategicContent;
      teamId: string;
      opponentId?: string;
      tournament?: string;
      matchFormat?: string;
    }
  ): Promise<StrategicMemory> {
    const memory: StrategicMemory = {
      id: planId,
      type: 'game_plan',
      teamId: plan.teamId,
      opponentId: plan.opponentId,
      tournament: plan.tournament,
      matchFormat: plan.matchFormat,
      title: plan.title,
      description: plan.description,
      strategy: plan.strategy,
      successRate: 0.5,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'analysis',
      tags: [
        `team:${plan.teamId}`,
        ...(plan.opponentId ? [`opponent:${plan.opponentId}`] : []),
        ...plan.strategy.corePrinciples.map(p => `principle:${p}`),
        'game_plan',
      ],
      version: 1,
    };

    return this.updateMemory(memory);
  }

  async storeScoutingReport(
    reportId: string,
    report: {
      title: string;
      description: string;
      teamId: string;
      opponentId: string;
      analysis: {
        strengths: string[];
        weaknesses: string[];
        tendencies: string[];
        preferredStrategies: string[];
        keyPlayers: Array<{ id: string; role: string; threat: string }>;
        recommendedApproach: string;
      };
      tournament?: string;
    }
  ): Promise<StrategicMemory> {
    const memory: StrategicMemory = {
      id: reportId,
      type: 'scouting_report',
      teamId: report.teamId,
      opponentId: report.opponentId,
      tournament: report.tournament,
      title: report.title,
      description: report.description,
      strategy: {
        corePrinciples: report.analysis.preferredStrategies,
        keyPlays: report.analysis.recommendedApproach.split(',').map(s => s.trim()),
        adjustments: report.analysis.weaknesses.map(w => ({
          condition: `If ${w}`,
          action: 'Exploit this weakness',
        })),
        counters: report.analysis.tendencies,
      },
      successRate: 0.6,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'analysis',
      tags: [
        `team:${report.teamId}`,
        `opponent:${report.opponentId}`,
        ...report.analysis.keyPlayers.map(p => `key_player:${p.id}`),
        'scouting_report',
      ],
      version: 1,
    };

    return this.updateMemory(memory);
  }

  async storeDraftStrategy(
    strategyId: string,
    strategy: {
      title: string;
      description: string;
      teamId: string;
      format: string;
      mapPool?: string[];
      picks: Array<{ round: string; agent: string; reasoning: string }>;
      bans: Array<{ round: string; agent: string; reasoning: string }>;
      contingencies: Array<{ condition: string; adjustedPicks: string[] }>;
    }
  ): Promise<StrategicMemory> {
    const memory: StrategicMemory = {
      id: strategyId,
      type: 'draft_strategy',
      teamId: strategy.teamId,
      matchFormat: strategy.format,
      title: strategy.title,
      description: strategy.description,
      strategy: {
        corePrinciples: strategy.picks.map(p => p.reasoning),
        keyPlays: strategy.picks.map(p => `${p.round}: ${p.agent}`),
        adjustments: strategy.contingencies.map(c => ({
          condition: c.condition,
          action: c.adjustedPicks.join(', '),
        })),
        counters: strategy.bans.map(b => b.agent),
      },
      successRate: 0.55,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'coaching',
      tags: [
        `team:${strategy.teamId}`,
        `format:${strategy.format}`,
        ...(strategy.mapPool || []).map(m => `map:${m}`),
        'draft_strategy',
      ],
      version: 1,
    };

    return this.updateMemory(memory);
  }

  async storeAdaptation(
    adaptationId: string,
    adaptation: {
      title: string;
      description: string;
      teamId: string;
      opponentId?: string;
      originalStrategy: string;
      trigger: string;
      adjustedStrategy: string;
      outcome: 'success' | 'failure' | 'neutral';
      effectiveness?: number;
    }
  ): Promise<StrategicMemory> {
    const memory: StrategicMemory = {
      id: adaptationId,
      type: 'adaptation',
      teamId: adaptation.teamId,
      opponentId: adaptation.opponentId,
      title: adaptation.title,
      description: adaptation.description,
      strategy: {
        corePrinciples: [adaptation.originalStrategy],
        keyPlays: [adaptation.adjustedStrategy],
        adjustments: [{
          condition: adaptation.trigger,
          action: adaptation.adjustedStrategy,
        }],
      },
      successRate: adaptation.outcome === 'success' ? 0.8 : adaptation.outcome === 'neutral' ? 0.5 : 0.2,
      usageCount: 1,
      lastUsed: new Date().toISOString(),
      lastSuccessful: adaptation.outcome === 'success' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'match',
      tags: [
        `team:${adaptation.teamId}`,
        ...(adaptation.opponentId ? [`opponent:${adaptation.opponentId}`] : []),
        `trigger:${adaptation.trigger}`,
        'adaptation',
      ],
      version: 1,
    };

    return this.updateMemory(memory);
  }

  async storeLesson(
    lessonId: string,
    lesson: {
      title: string;
      description: string;
      teamId?: string;
      category: 'draft' | 'midgame' | 'economy' | 'mental' | 'execution' | 'general';
      insight: string;
      context: string;
      applicableScenarios: string[];
    }
  ): Promise<StrategicMemory> {
    const memory: StrategicMemory = {
      id: lessonId,
      type: 'lesson',
      teamId: lesson.teamId,
      title: lesson.title,
      description: lesson.description,
      strategy: {
        corePrinciples: [lesson.insight],
        keyPlays: lesson.applicableScenarios,
        adjustments: [{
          condition: 'When facing ' + lesson.context,
          action: lesson.insight,
        }],
      },
      successRate: 0.7,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'match',
      tags: [
        `category:${lesson.category}`,
        ...(lesson.teamId ? [`team:${lesson.teamId}`] : []),
        ...lesson.applicableScenarios.map(s => `scenario:${s}`),
        'lesson',
      ],
      version: 1,
    };

    return this.updateMemory(memory);
  }

  private async updateMemory(memory: StrategicMemory): Promise<StrategicMemory> {
    // Check for existing version
    const existing = this.memories.get(memory.id);
    if (existing) {
      memory.version = existing.version + 1;
      memory.evolutionHistory = [
        ...(existing.evolutionHistory || []),
        {
          version: memory.version,
          changes: ['Strategy updated'],
          reason: 'Performance feedback',
          timestamp: new Date().toISOString(),
          successImpact: memory.successRate - existing.successRate,
        },
      ];
    }

    this.memories.set(memory.id, memory);

    // Index by team
    if (memory.teamId) {
      this.indexEntity(memory.teamId, memory.id, this.teamIndex);
    }

    // Index by opponent
    if (memory.opponentId) {
      this.indexEntity(memory.opponentId, memory.id, this.opponentIndex);
    }

    // Index by type
    this.indexEntity(memory.type, memory.id, this.typeIndex);

    return memory;
  }

  private indexEntity(entity: string, memoryId: string, index: Map<string, Set<string>>): void {
    if (!index.has(entity)) {
      index.set(entity, new Set());
    }
    index.get(entity)!.add(memoryId);
  }

  // =========================================================================
  // Memory Retrieval
  // =========================================================================

  async retrieve(query: StrategicQuery): Promise<StrategicRetrievalResult[]> {
    const results: StrategicRetrievalResult[] = [];

    // Get candidate IDs
    const candidateIds = new Set<string>();

    if (query.teamId) {
      const ids = this.teamIndex.get(query.teamId);
      if (ids) ids.forEach(id => candidateIds.add(id));
    }

    if (query.opponentId) {
      const ids = this.opponentIndex.get(query.opponentId);
      if (ids) ids.forEach(id => candidateIds.add(id));
    }

    if (query.types && query.types.length > 0) {
      for (const type of query.types) {
        const ids = this.typeIndex.get(type);
        if (ids) ids.forEach(id => candidateIds.add(id));
      }
    }

    if (candidateIds.size === 0 && !query.minSuccessRate) {
      this.memories.forEach((_, id) => candidateIds.add(id));
    }

    // Filter and score
    for (const id of candidateIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      // Success rate filter
      if (query.minSuccessRate && memory.successRate < query.minSuccessRate) {
        continue;
      }

      // Calculate relevance
      let relevance = memory.successRate;
      relevance += memory.usageCount * 0.01;

      // Calculate applicability
      let applicability = 0.5;
      if (query.teamId === memory.teamId) applicability += 0.3;
      if (query.opponentId === memory.opponentId) applicability += 0.2;

      results.push({
        memory,
        relevanceScore: relevance,
        applicabilityScore: applicability,
      });
    }

    // Sort
    if (query.recentFirst) {
      results.sort((a, b) => 
        new Date(b.memory.updatedAt).getTime() - new Date(a.memory.updatedAt).getTime()
      );
    } else {
      results.sort((a, b) => 
        (b.relevanceScore + b.applicabilityScore) - (a.relevanceScore + a.applicabilityScore)
      );
    }

    // Apply limit
    if (query.limit) {
      return results.slice(0, query.limit);
    }

    return results;
  }

  async getGamePlans(
    teamId: string,
    opponentId?: string
  ): Promise<StrategicRetrievalResult[]> {
    return this.retrieve({
      types: ['game_plan'],
      teamId,
      opponentId,
      recentFirst: true,
      limit: 10,
    });
  }

  async getScoutingReports(
    teamId: string,
    opponentId: string
  ): Promise<StrategicRetrievalResult[]> {
    return this.retrieve({
      types: ['scouting_report'],
      teamId,
      opponentId,
      minSuccessRate: 0.5,
      limit: 5,
    });
  }

  async getDraftStrategies(
    teamId: string,
    format: string
  ): Promise<StrategicRetrievalResult[]> {
    return this.retrieve({
      types: ['draft_strategy'],
      teamId,
      tags: [`format:${format}`],
      minSuccessRate: 0.5,
      limit: 5,
    });
  }

  async getAdaptations(
    teamId: string,
    trigger?: string
  ): Promise<StrategicRetrievalResult[]> {
    const results = await this.retrieve({
      types: ['adaptation'],
      teamId,
      minSuccessRate: 0.6,
      limit: 10,
    });

    if (trigger) {
      return results.filter(r => 
        r.memory.strategy.adjustments.some(a => 
          a.condition.toLowerCase().includes(trigger.toLowerCase())
        )
      );
    }

    return results;
  }

  async getLessons(
    category?: string,
    teamId?: string
  ): Promise<StrategicRetrievalResult[]> {
    const tags = category ? [`category:${category}`] : undefined;
    return this.retrieve({
      types: ['lesson'],
      teamId,
      tags,
      minSuccessRate: 0.6,
      limit: 20,
    });
  }

  async recordUsage(
    memoryId: string,
    outcome: 'success' | 'failure' | 'neutral'
  ): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) return;

    memory.usageCount++;
    memory.updatedAt = new Date().toISOString();

    if (outcome === 'success') {
      memory.successRate = (memory.successRate * (memory.usageCount - 1) + 1) / memory.usageCount;
      memory.lastSuccessful = new Date().toISOString();
    } else if (outcome === 'failure') {
      memory.successRate = (memory.successRate * (memory.usageCount - 1) + 0) / memory.usageCount;
    } else {
      // Neutral - no change to success rate
    }

    memory.lastUsed = new Date().toISOString();
    this.memories.set(memoryId, memory);
  }

  // =========================================================================
  // Statistics & Export
  // =========================================================================

  async getStats(): Promise<{
    totalStrategies: number;
    byType: Record<string, number>;
    avgSuccessRate: number;
    topStrategies: Array<{ id: string; successRate: number; usageCount: number }>;
  }> {
    const byType: Record<string, number> = {};
    let successSum = 0;
    const topStrategies: Array<{ id: string; successRate: number; usageCount: number }> = [];

    for (const memory of this.memories.values()) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
      successSum += memory.successRate;
      topStrategies.push({
        id: memory.id,
        successRate: memory.successRate,
        usageCount: memory.usageCount,
      });
    }

    topStrategies.sort((a, b) => b.successRate - a.successRate);

    return {
      totalStrategies: this.memories.size,
      byType,
      avgSuccessRate: this.memories.size > 0 ? successSum / this.memories.size : 0,
      topStrategies: topStrategies.slice(0, 10),
    };
  }

  async exportMemories(): Promise<StrategicMemory[]> {
    return Array.from(this.memories.values());
  }

  async importMemories(memories: StrategicMemory[]): Promise<void> {
    for (const memory of memories) {
      await this.updateMemory(memory);
    }
  }

  clear(): void {
    this.memories.clear();
    this.teamIndex.clear();
    this.opponentIndex.clear();
    this.typeIndex.clear();
  }
}

export const strategicMemory = new StrategicMemoryEngine();

