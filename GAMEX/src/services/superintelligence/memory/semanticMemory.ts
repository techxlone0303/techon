/**
 * ScoutIQ v5 - Semantic Memory System
 * 
 * Stores general knowledge and learned patterns:
 * - Player archetypes and tendencies
 * - Team playstyles
 * - Meta strategies
 * - Cross-game insights
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SemanticMemory {
  id: string;
  category: 'player' | 'team' | 'strategy' | 'meta' | 'role' | 'pattern';
  entityId: string;
  entityName: string;
  
  // Knowledge
  attributes: Record<string, any>;
  features: UniversalFeatures;
  
  // Learned patterns
  patterns: LearnedPattern[];
  
  // Confidence and evidence
  confidence: number;
  evidenceCount: number;
  lastUpdated: string;
  
  // Metadata
  source: string;
  tags: string[];
}

export interface LearnedPattern {
  name: string;
  description: string;
  conditions: string[];
  outcomes: string[];
  successRate: number;
  sampleSize: number;
  discoveredAt: string;
}

export interface SemanticQuery {
  categories?: string[];
  entityIds?: string[];
  tags?: string[];
  minConfidence?: number;
  patternType?: string;
  limit?: number;
}

export interface SemanticRetrievalResult {
  memory: SemanticMemory;
  relevanceScore: number;
  matchQuality: 'exact' | 'partial' | 'related';
}

// ============================================================================
// Semantic Memory Engine
// ============================================================================

export class SemanticMemoryEngine {
  private memories: Map<string, SemanticMemory> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private entityIndex: Map<string, string> = new Map();
  private patternIndex: Map<string, Set<string>> = new Map();

  // =========================================================================
  // Memory Storage
  // =========================================================================

  async storePlayer(
    playerId: string,
    playerName: string,
    attributes: {
      role: string;
      teamId?: string;
      stats?: Record<string, number>;
    },
    features: UniversalFeatures,
    patterns: LearnedPattern[] = []
  ): Promise<SemanticMemory> {
    const existing = this.memories.get(playerId);
    
    const memory: SemanticMemory = {
      id: playerId,
      category: 'player',
      entityId: playerId,
      entityName: playerName,
      attributes: {
        role: attributes.role,
        teamId: attributes.teamId,
        stats: attributes.stats,
      },
      features,
      patterns,
      confidence: existing 
        ? Math.min(1, existing.confidence + 0.1)
        : 0.5 + (patterns.length * 0.05),
      evidenceCount: (existing?.evidenceCount || 0) + 1,
      lastUpdated: new Date().toISOString(),
      source: 'match_analysis',
      tags: [
        `role:${attributes.role}`,
        ...(attributes.teamId ? [`team:${attributes.teamId}`] : []),
        'player',
      ],
    };

    return this.updateMemory(memory);
  }

  async storeTeam(
    teamId: string,
    teamName: string,
    attributes: {
      playstyle: string;
      strengths: string[];
      weaknesses: string[];
      preferredStrategies: string[];
    },
    features: UniversalFeatures,
    patterns: LearnedPattern[] = []
  ): Promise<SemanticMemory> {
    const existing = this.memories.get(teamId);
    
    const memory: SemanticMemory = {
      id: teamId,
      category: 'team',
      entityId: teamId,
      entityName: teamName,
      attributes,
      features,
      patterns,
      confidence: existing
        ? Math.min(1, existing.confidence + 0.1)
        : 0.6 + (patterns.length * 0.05),
      evidenceCount: (existing?.evidenceCount || 0) + 1,
      lastUpdated: new Date().toISOString(),
      source: 'match_analysis',
      tags: [
        `playstyle:${attributes.playstyle}`,
        ...attributes.strengths.map(s => `strength:${s}`),
        ...attributes.weaknesses.map(w => `weakness:${w}`),
        'team',
      ],
    };

    return this.updateMemory(memory);
  }

  async storeStrategy(
    strategyId: string,
    strategyName: string,
    attributes: {
      description: string;
     适用场景: string[];
      counters?: string[];
      counteredBy?: string[];
      winRate?: number;
      popularity?: number;
    },
    features: UniversalFeatures,
    patterns: LearnedPattern[] = []
  ): Promise<SemanticMemory> {
    const memory: SemanticMemory = {
      id: strategyId,
      category: 'strategy',
      entityId: strategyId,
      entityName: strategyName,
      attributes,
      features,
      patterns,
      confidence: 0.5 + (patterns.length * 0.1) + (attributes.winRate || 0) * 0.2,
      evidenceCount: patterns.reduce((sum, p) => sum + p.sampleSize, 0),
      lastUpdated: new Date().toISOString(),
      source: 'meta_analysis',
      tags: [
        ...attributes.适用场景.map(s => `scenario:${s}`),
        ...(attributes.counters?.map(c => `counters:${c}`) || []),
        ...(attributes.counteredBy?.map(c => `counteredBy:${c}`) || []),
        'strategy',
      ],
    };

    return this.updateMemory(memory);
  }

  async storeMetaPattern(
    patternId: string,
    patternName: string,
    pattern: LearnedPattern
  ): Promise<SemanticMemory> {
    const existing = this.memories.get(`meta:${patternName}`);
    
    const memory: SemanticMemory = {
      id: `meta:${patternId}`,
      category: 'meta',
      entityId: patternName,
      entityName: patternName,
      attributes: {
        patternType: pattern.name,
        conditions: pattern.conditions,
        outcomes: pattern.outcomes,
      },
      features: {
        skill_index: pattern.successRate,
        aggression_index: 0.5,
        macro_intelligence: 0.5,
        adaptability_score: 0.5,
        meta_alignment_score: 0.5,
        synergy_score: 0.5,
      },
      patterns: [pattern],
      confidence: Math.min(1, 0.5 + pattern.sampleSize / 100),
      evidenceCount: pattern.sampleSize,
      lastUpdated: new Date().toISOString(),
      source: 'pattern_discovery',
      tags: [
        `pattern:${pattern.name}`,
        ...pattern.conditions.map(c => `condition:${c}`),
        'meta',
      ],
    };

    return this.updateMemory(memory);
  }

  private async updateMemory(memory: SemanticMemory): Promise<SemanticMemory> {
    this.memories.set(memory.id, memory);
    
    // Index by category
    if (!this.categoryIndex.has(memory.category)) {
      this.categoryIndex.set(memory.category, new Set());
    }
    this.categoryIndex.get(memory.category)!.add(memory.id);

    // Index by entity
    this.entityIndex.set(memory.id, memory.entityId);

    // Index patterns
    for (const pattern of memory.patterns) {
      if (!this.patternIndex.has(pattern.name)) {
        this.patternIndex.set(pattern.name, new Set());
      }
      this.patternIndex.get(pattern.name)!.add(memory.id);
    }

    return memory;
  }

  // =========================================================================
  // Memory Retrieval
  // =========================================================================

  async retrieve(query: SemanticQuery): Promise<SemanticRetrievalResult[]> {
    const results: SemanticRetrievalResult[] = [];

    // Get candidate IDs
    const candidateIds = new Set<string>();

    if (query.categories && query.categories.length > 0) {
      for (const category of query.categories) {
        const ids = this.categoryIndex.get(category);
        if (ids) {
          ids.forEach(id => candidateIds.add(id));
        }
      }
    }

    if (query.entityIds && query.entityIds.length > 0) {
      for (const entityId of query.entityIds) {
        for (const [id, eid] of this.entityIndex) {
          if (eid === entityId) {
            candidateIds.add(id);
          }
        }
      }
    }

    if (query.patternType) {
      const ids = this.patternIndex.get(query.patternType);
      if (ids) {
        ids.forEach(id => candidateIds.add(id));
      }
    }

    if (candidateIds.size === 0 && !query.minConfidence) {
      this.memories.forEach((_, id) => candidateIds.add(id));
    }

    // Filter and score
    for (const id of candidateIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      // Confidence filter
      if (query.minConfidence && memory.confidence < query.minConfidence) {
        continue;
      }

      // Calculate relevance
      let relevance = memory.confidence;
      relevance += memory.evidenceCount * 0.001;
      relevance += memory.patterns.length * 0.02;

      // Pattern match quality
      let matchQuality: 'exact' | 'partial' | 'related' = 'related';
      if (query.patternType && memory.patterns.some(p => p.name === query.patternType)) {
        matchQuality = 'exact';
      } else if (query.patternType && memory.patterns.length > 0) {
        matchQuality = 'partial';
      }

      results.push({
        memory,
        relevanceScore: relevance,
        matchQuality,
      });
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply limit
    if (query.limit) {
      return results.slice(0, query.limit);
    }

    return results;
  }

  async findSimilarEntities(
    features: UniversalFeatures,
    category: string,
    limit: number = 5
  ): Promise<SemanticRetrievalResult[]> {
    const candidates = await this.retrieve({
      categories: [category],
      limit: 50,
    });

    // Calculate similarity
    const scored = candidates.map(result => {
      const similarity = this.calculateFeatureSimilarity(features, result.memory.features);
      const matchQuality: 'exact' | 'partial' | 'related' = 
        similarity > 0.8 ? 'exact' : similarity > 0.5 ? 'partial' : 'related';
      return {
        ...result,
        relevanceScore: similarity,
        matchQuality,
      };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scored.slice(0, limit) as SemanticRetrievalResult[];
  }

  async getPlayerArchetype(
    playerId: string
  ): Promise<{
    archetype: string;
    confidence: number;
    similarPlayers: string[];
    keyCharacteristics: string[];
  } | null> {
    const player = this.memories.get(playerId);
    if (!player || player.category !== 'player') return null;

    // Find similar players
    const similar = await this.findSimilarEntities(player.features, 'player', 5);
    const similarPlayers = similar
      .filter(s => s.memory.id !== playerId)
      .map(s => s.memory.entityName);

    // Determine archetype based on features
    const archetype = this.determineArchetype(player.features, player.attributes);

    // Extract key characteristics
    const characteristics = this.extractCharacteristics(player);

    return {
      archetype,
      confidence: player.confidence,
      similarPlayers,
      keyCharacteristics: characteristics,
    };
  }

  async getTeamPlaystyle(
    teamId: string
  ): Promise<{
    playstyle: string;
    confidence: number;
    strengths: string[];
    weaknesses: string[];
    recommendedStrategies: string[];
  } | null> {
    const team = this.memories.get(teamId);
    if (!team || team.category !== 'team') return null;

    return {
      playstyle: team.attributes.playstyle || 'balanced',
      confidence: team.confidence,
      strengths: team.attributes.strengths || [],
      weaknesses: team.attributes.weaknesses || [],
      recommendedStrategies: team.attributes.preferredStrategies || [],
    };
  }

  async discoverPatterns(
    entityId: string,
    outcomes: Array<{ condition: string; outcome: string; result: boolean }>
  ): Promise<LearnedPattern[]> {
    const patterns: LearnedPattern[] = [];

    // Group outcomes by condition
    const conditionGroups = new Map<string, typeof outcomes>();
    for (const outcome of outcomes) {
      if (!conditionGroups.has(outcome.condition)) {
        conditionGroups.set(outcome.condition, []);
      }
      conditionGroups.get(outcome.condition)!.push(outcome);
    }

    // Calculate success rates
    for (const [condition, group] of conditionGroups) {
      const successes = group.filter(o => o.result).length;
      const successRate = successes / group.length;

      if (group.length >= 3 && successRate > 0.6) {
        patterns.push({
          name: `pattern_${condition}`,
          description: `When ${condition}, outcome tends to be positive`,
          conditions: [condition],
          outcomes: [...new Set(group.filter(o => o.result).map(o => o.outcome))],
          successRate,
          sampleSize: group.length,
          discoveredAt: new Date().toISOString(),
        });
      }
    }

    // Update memory with new patterns
    const existing = this.memories.get(entityId);
    if (existing) {
      existing.patterns = [...existing.patterns, ...patterns];
      existing.confidence = Math.min(1, existing.confidence + patterns.length * 0.05);
      existing.lastUpdated = new Date().toISOString();
      this.memories.set(entityId, existing);
    }

    return patterns;
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private calculateFeatureSimilarity(
    featuresA: UniversalFeatures,
    featuresB: UniversalFeatures
  ): number {
    const featureKeys: (keyof UniversalFeatures)[] = [
      'skill_index', 'aggression_index', 'macro_intelligence',
      'adaptability_score', 'meta_alignment_score', 'synergy_score',
    ];

    let totalDiff = 0;
    for (const key of featureKeys) {
      totalDiff += Math.abs(featuresA[key] - featuresB[key]);
    }

    return 1 - (totalDiff / featureKeys.length);
  }

  private determineArchetype(
    features: UniversalFeatures,
    attributes: Record<string, any>
  ): string {
    const { skill_index, aggression_index, macro_intelligence } = features;

    if (skill_index > 0.7 && aggression_index > 0.6) {
      return 'Aggressive Fragster';
    } else if (macro_intelligence > 0.7 && aggression_index < 0.5) {
      return 'Tactical Controller';
    } else if (skill_index > 0.6 && macro_intelligence > 0.6) {
      return 'IGL/Support';
    } else if (aggression_index > 0.7) {
      return 'Entry Fragger';
    } else if (macro_intelligence > 0.6) {
      return 'Lurker';
    }
    return 'Balanced Player';
  }

  private extractCharacteristics(memory: SemanticMemory): string[] {
    const chars: string[] = [];

    if (memory.attributes.role) {
      chars.push(`Primary role: ${memory.attributes.role}`);
    }

    if (memory.features.skill_index > 0.7) {
      chars.push('High individual skill');
    }
    if (memory.features.macro_intelligence > 0.7) {
      chars.push('Strong game sense');
    }
    if (memory.features.adaptability_score > 0.7) {
      chars.push('Highly adaptable');
    }

    if (memory.patterns.length > 0) {
      chars.push(`${memory.patterns.length} learned patterns`);
    }

    return chars;
  }

  // =========================================================================
  // Statistics & Export
  // =========================================================================

  async getStats(): Promise<{
    totalMemories: number;
    byCategory: Record<string, number>;
    avgConfidence: number;
  }> {
    const byCategory: Record<string, number> = {};
    let confidenceSum = 0;

    for (const memory of this.memories.values()) {
      byCategory[memory.category] = (byCategory[memory.category] || 0) + 1;
      confidenceSum += memory.confidence;
    }

    return {
      totalMemories: this.memories.size,
      byCategory,
      avgConfidence: this.memories.size > 0 
        ? confidenceSum / this.memories.size 
        : 0,
    };
  }

  async exportMemories(): Promise<SemanticMemory[]> {
    return Array.from(this.memories.values());
  }

  async importMemories(memories: SemanticMemory[]): Promise<void> {
    for (const memory of memories) {
      await this.updateMemory(memory);
    }
  }

  clear(): void {
    this.memories.clear();
    this.categoryIndex.clear();
    this.entityIndex.clear();
    this.patternIndex.clear();
  }
}

export const semanticMemory = new SemanticMemoryEngine();

