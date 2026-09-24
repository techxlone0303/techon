import { UniversalFeatures } from '../normalizationEngine';

export interface KnowledgeNode {
  id: string;
  type: 'player' | 'team' | 'strategy' | 'meta' | 'patch' | 'matchup';
  properties: Record<string, any>;
  embeddings?: number[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: 'PLAYED_FOR' | 'BEAT' | 'LOST_TO' | 'SIMILAR_TO' | 'COUNTERS' | 'COUNTERED_BY' | 'ADAPTED_FROM' | 'INFLUENCES';
  weight: number;
  createdAt: string;
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: Map<string, KnowledgeEdge[]>;
}

export interface GraphQuery {
  type?: string;
  properties?: Record<string, any>;
  minEmbeddingSimilarity?: number;
  queryEmbedding?: number[];
  limit?: number;
}

export interface GraphSearchResult {
  node: KnowledgeNode;
  relevanceScore: number;
  path?: string[];
}

export class KnowledgeGraphStore {
  private graph: KnowledgeGraph;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
    };
  }

  async addNode(node: Omit<KnowledgeNode, 'createdAt' | 'updatedAt' | 'version'>): Promise<KnowledgeNode> {
    const now = new Date().toISOString();
    const existing = this.graph.nodes.get(node.id);

    const newNode: KnowledgeNode = {
      ...node,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
    };

    this.graph.nodes.set(node.id, newNode);

    if (node.embeddings) {
      this.embeddingCache.set(node.id, node.embeddings);
    }

    return newNode;
  }

  async addEdge(edge: Omit<KnowledgeEdge, 'createdAt'>): Promise<KnowledgeEdge> {
    const newEdge: KnowledgeEdge = {
      ...edge,
      createdAt: new Date().toISOString(),
    };

    const existingEdges = this.graph.edges.get(edge.source) || [];
    existingEdges.push(newEdge);
    this.graph.edges.set(edge.source, existingEdges);

    return newEdge;
  }

  async findSimilar(queryEmbedding: number[], limit: number = 10): Promise<GraphSearchResult[]> {
    const results: GraphSearchResult[] = [];

    for (const [id, embedding] of this.embeddingCache) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      const node = this.graph.nodes.get(id);

      if (node) {
        results.push({
          node,
          relevanceScore: Math.round(similarity * 1000) / 1000,
        });
      }
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, limit);
  }

  async query(q: GraphQuery): Promise<GraphSearchResult[]> {
    const results: GraphSearchResult[] = [];

    for (const [id, node] of this.graph.nodes) {
      let match = true;

      if (q.type && node.type !== q.type) match = false;
      if (q.properties) {
        for (const [key, value] of Object.entries(q.properties)) {
          if (node.properties[key] !== value) match = false;
        }
      }

      if (match) {
        let relevanceScore = 1;

        if (q.queryEmbedding && node.embeddings) {
          const similarity = this.cosineSimilarity(q.queryEmbedding, node.embeddings);
          relevanceScore = similarity;
        }

        results.push({
          node,
          relevanceScore,
        });
      }
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, q.limit || 10);
  }

  async getNode(id: string): Promise<KnowledgeNode | null> {
    return this.graph.nodes.get(id) || null;
  }

  async getOutgoingEdges(nodeId: string): Promise<KnowledgeEdge[]> {
    return this.graph.edges.get(nodeId) || [];
  }

  async getIncomingEdges(nodeId: string): Promise<KnowledgeEdge[]> {
    const incoming: KnowledgeEdge[] = [];
    for (const [source, edges] of this.graph.edges) {
      for (const edge of edges) {
        if (edge.target === nodeId) {
          incoming.push(edge);
        }
      }
    }
    return incoming;
  }

  async findPath(sourceId: string, targetId: string, maxDepth: number = 5): Promise<string[] | null> {
    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [{ id: sourceId, path: [sourceId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === targetId) return path;

      if (path.length >= maxDepth) continue;
      if (visited.has(id)) continue;

      visited.add(id);

      const edges = await this.getOutgoingEdges(id);
      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          queue.push({ id: edge.target, path: [...path, edge.target] });
        }
      }
    }

    return null;
  }

  async addPlayerNode(
    playerId: string,
    name: string,
    teamId: string,
    features: UniversalFeatures,
    stats: Record<string, any>
  ): Promise<KnowledgeNode> {
    const embeddings = this.featuresToEmbedding(features);

    return this.addNode({
      id: playerId,
      type: 'player',
      properties: {
        name,
        teamId,
        ...stats,
        skill_index: features.skill_index,
        aggression_index: features.aggression_index,
        macro_intelligence: features.macro_intelligence,
        adaptability_score: features.adaptability_score,
        meta_alignment_score: features.meta_alignment_score,
        synergy_score: features.synergy_score,
      },
      embeddings,
    });
  }

  async addTeamNode(
    teamId: string,
    name: string,
    features: UniversalFeatures,
    stats: Record<string, any>
  ): Promise<KnowledgeNode> {
    const embeddings = this.featuresToEmbedding(features);

    return this.addNode({
      id: teamId,
      type: 'team',
      properties: {
        name,
        ...stats,
        avg_skill: features.skill_index,
        avg_aggression: features.aggression_index,
        avg_macro: features.macro_intelligence,
      },
      embeddings,
    });
  }

  async recordMatchup(
    teamAId: string,
    teamBId: string,
    winner: 'A' | 'B',
    score: string,
    features: { teamA: UniversalFeatures; teamB: UniversalFeatures }
  ): Promise<void> {
    const winnerId = winner === 'A' ? teamAId : teamBId;
    const loserId = winner === 'A' ? teamBId : teamAId;

    await this.addEdge({
      source: winnerId,
      target: loserId,
      relationship: 'BEAT',
      weight: 1,
    });

    const matchNodeId = `match_${teamAId}_${teamBId}_${Date.now()}`;
    await this.addNode({
      id: matchNodeId,
      type: 'matchup',
      properties: {
        teamA: teamAId,
        teamB: teamBId,
        winner: winnerId,
        score,
        timestamp: new Date().toISOString(),
      },
    });

    await this.addEdge({
      source: matchNodeId,
      target: teamAId,
      relationship: 'INFLUENCES',
      weight: 0.5,
    });

    await this.addEdge({
      source: matchNodeId,
      target: teamBId,
      relationship: 'INFLUENCES',
      weight: 0.5,
    });
  }

  async recordPrediction(
    matchId: string,
    teamAId: string,
    teamBId: string,
    predictedWinner: string,
    actualWinner: string | null,
    confidence: number,
    features: UniversalFeatures
  ): Promise<void> {
    const predictionNodeId = `pred_${matchId}`;
    await this.addNode({
      id: predictionNodeId,
      type: 'meta',
      properties: {
        matchId,
        teamA: teamAId,
        teamB: teamBId,
        predictedWinner,
        actualWinner,
        correct: actualWinner ? predictedWinner === actualWinner : null,
        confidence,
        timestamp: new Date().toISOString(),
      },
      embeddings: this.featuresToEmbedding(features),
    });
  }

  private featuresToEmbedding(features: UniversalFeatures): number[] {
    return [
      features.skill_index,
      features.aggression_index,
      features.macro_intelligence,
      features.adaptability_score,
      features.meta_alignment_score,
      features.synergy_score,
    ];
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dot / denominator : 0;
  }

  async exportGraph(): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    return {
      nodes: Array.from(this.graph.nodes.values()),
      edges: Array.from(this.graph.edges.values()).flat(),
    };
  }

  async importGraph(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): Promise<void> {
    for (const node of data.nodes) {
      this.graph.nodes.set(node.id, node);
      if (node.embeddings) {
        this.embeddingCache.set(node.id, node.embeddings);
      }
    }

    for (const edge of data.edges) {
      const existing = this.graph.edges.get(edge.source) || [];
      existing.push(edge);
      this.graph.edges.set(edge.source, existing);
    }
  }

  async clear(): Promise<void> {
    this.graph.nodes.clear();
    this.graph.edges.clear();
    this.embeddingCache.clear();
  }
}

export const knowledgeGraph = new KnowledgeGraphStore();

