/**
 * ScoutIQ v5 - Universal Esports Knowledge Graph
 * 
 * A comprehensive knowledge graph connecting players, teams, roles,
 * strategies, meta states, tournaments, and their relationships.
 * 
 * Computes graph metrics: influence score, synergy strength, rivalry intensity, strategy diffusion
 */

import { UniversalFeatures } from '../../agi/normalizationEngine';
import { PlayerEmbedding } from '../../ai/embedding.service';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type EntityType = 
  | 'player' 
  | 'team' 
  | 'role' 
  | 'strategy' 
  | 'meta_state' 
  | 'tournament' 
  | 'map' 
  | 'agent' 
  | 'patch';

export type RelationshipType = 
  | 'PLAYS_FOR' 
  | 'BEAT' 
  | 'LOST_TO' 
  | 'SIMILAR_TO' 
  | 'COUNTERS' 
  | 'COUNTERED_BY' 
  | 'ADAPTED_FROM' 
  | 'INFLUENCES' 
  | 'PARTICIPATED_IN' 
  | 'PLAYED_ON' 
  | 'EXPERTS_WITH'
  | 'RIVAL_OF'
  | 'MENTORED';

export interface GraphNode {
  id: string;
  type: EntityType;
  name: string;
  properties: Record<string, any>;
  embeddings: number[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: RelationshipType;
  weight: number;
  attributes: Record<string, any>;
  createdAt: string;
}

export interface GraphMetrics {
  influenceScore: number;
  synergyStrength: number;
  rivalryIntensity: number;
  strategyDiffusion: number;
  centrality: number;
  clusteringCoefficient: number;
}

export interface GraphQuery {
  types?: EntityType[];
  minInfluence?: number;
  relatedTo?: string;
  relationship?: RelationshipType;
  limit?: number;
}

export interface GraphSearchResult {
  node: GraphNode;
  metrics: GraphMetrics;
  relevanceScore: number;
  path?: string[];
}

// ============================================================================
// Graph Implementation
// ============================================================================

export class UniversalEsportsGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge[]> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private adjacencyMatrix: Map<string, Map<string, number>> = new Map();

  // =========================================================================
  // Node Operations
  // =========================================================================

  addNode(
    id: string,
    type: EntityType,
    name: string,
    properties: Record<string, any> = {},
    embeddings: number[] = []
  ): GraphNode {
    const now = new Date().toISOString();
    const existing = this.nodes.get(id);

    const node: GraphNode = {
      id,
      type,
      name,
      properties,
      embeddings,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
    };

    this.nodes.set(id, node);

    if (embeddings.length > 0) {
      this.embeddings.set(id, embeddings);
    }

    return node;
  }

  getNode(id: string): GraphNode | null {
    return this.nodes.get(id) || null;
  }

  getNodesByType(type: EntityType): GraphNode[] {
    const result: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        result.push(node);
      }
    }
    return result;
  }

  updateNodeProperties(id: string, properties: Record<string, any>): GraphNode | null {
    const node = this.nodes.get(id);
    if (!node) return null;

    node.properties = { ...node.properties, ...properties };
    node.updatedAt = new Date().toISOString();
    node.version++;

    return node;
  }

  // =========================================================================
  // Edge Operations
  // =========================================================================

  addEdge(
    source: string,
    target: string,
    relationship: RelationshipType,
    weight: number = 1.0,
    attributes: Record<string, any> = {}
  ): GraphEdge {
    const edgeKey = this.getEdgeKey(source, target);
    const edge: GraphEdge = {
      source,
      target,
      relationship,
      weight,
      attributes,
      createdAt: new Date().toISOString(),
    };

    const existing = this.edges.get(edgeKey) || [];
    existing.push(edge);
    this.edges.set(edgeKey, existing);

    // Update adjacency matrix
    this.updateAdjacency(source, target, weight);

    return edge;
  }

  getEdges(source: string): GraphEdge[] {
    return this.edges.get(source) || [];
  }

  getEdgesByRelationship(source: string, relationship: RelationshipType): GraphEdge[] {
    const edges = this.edges.get(source) || [];
    return edges.filter(e => e.relationship === relationship);
  }

  getRivalEdges(entityId: string): GraphEdge[] {
    const rivalEdges: GraphEdge[] = [];
    const directEdges = this.edges.get(entityId) || [];
    
    for (const edge of directEdges) {
      if (edge.relationship === 'BEAT' || edge.relationship === 'LOST_TO' || edge.relationship === 'RIVAL_OF') {
        rivalEdges.push(edge);
      }
      // Also check reverse edges
      const reverseKey = this.getEdgeKey(edge.target, edge.source);
      const reverseEdges = this.edges.get(reverseKey) || [];
      rivalEdges.push(...reverseEdges);
    }

    return rivalEdges;
  }

  // =========================================================================
  // Graph Metrics Computation
  // =========================================================================

  computeInfluenceScore(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    let influence = 0;
    const outgoingEdges = this.edges.get(nodeId) || [];
    
    // Incoming edges indicate others referencing this entity
    const incomingEdges = this.getIncomingEdges(nodeId);
    
    // Count edges weighted by relationship importance
    for (const edge of outgoingEdges) {
      const relationshipWeight = this.getRelationshipWeight(edge.relationship);
      influence += edge.weight * relationshipWeight * 0.3;
    }

    for (const edge of incomingEdges) {
      const relationshipWeight = this.getRelationshipWeight(edge.relationship);
      influence += edge.weight * relationshipWeight * 0.5;
    }

    // Boost for high-centrality nodes
    const centrality = this.computeCentrality(nodeId);
    influence += centrality * 0.2;

    return Math.min(1, influence);
  }

  computeSynergyStrength(teamId: string): number {
    const teamNode = this.nodes.get(teamId);
    if (!teamNode || teamNode.type !== 'team') return 0;

    // Find all players on the team
    const playerEdges = this.getEdgesByRelationship(teamId, 'PLAYS_FOR');
    const playerIds = playerEdges.map(e => e.target);

    if (playerIds.length < 2) return 0;

    // Calculate pairwise synergies
    let totalSynergy = 0;
    let pairCount = 0;

    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const synergy = this.computePairwiseSynergy(playerIds[i], playerIds[j]);
        totalSynergy += synergy;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalSynergy / pairCount : 0;
  }

  computeRivalryIntensity(entityA: string, entityB: string): number {
    const directEdges = this.edges.get(this.getEdgeKey(entityA, entityB)) || [];
    const reverseEdges = this.edges.get(this.getEdgeKey(entityB, entityA)) || [];
    const allEdges = [...directEdges, ...reverseEdges];

    let intensity = 0;
    let matchCount = 0;

    for (const edge of allEdges) {
      if (edge.relationship === 'BEAT' || edge.relationship === 'LOST_TO') {
        intensity += edge.weight;
        matchCount++;
      } else if (edge.relationship === 'RIVAL_OF') {
        intensity += edge.weight * 2;
        matchCount++;
      }
    }

    // Add temporal decay - recent matches matter more
    const recencyBoost = Math.min(1, matchCount / 10);
    
    return matchCount > 0 ? (intensity / matchCount) * (0.7 + recencyBoost * 0.3) : 0;
  }

  computeStrategyDiffusion(strategyId: string): number {
    // Find all teams/players who adopted this strategy
    const adoptionEdges = this.getEdgesByRelationship(strategyId, 'ADAPTED_FROM');
    
    if (adoptionEdges.length === 0) return 0;

    // Count second-order spread
    let directAdoptions = adoptionEdges.length;
    let indirectAdoptions = 0;

    for (const edge of adoptionEdges) {
      const secondaryEdges = this.getEdgesByRelationship(edge.target, 'ADAPTED_FROM');
      indirectAdoptions += secondaryEdges.length;
    }

    // Calculate diffusion coefficient
    const spreadRatio = indirectAdoptions / (directAdoptions || 1);
    const velocity = directAdoptions + indirectAdoptions;

    return Math.min(1, (spreadRatio * 0.5 + velocity * 0.01));
  }

  computeCentrality(nodeId: string): number {
    const adjacency = this.adjacencyMatrix.get(nodeId);
    if (!adjacency || adjacency.size === 0) return 0;

    // Betweenness-like centrality approximation
    const connections = adjacency.size;
    const totalNodes = this.nodes.size;

    return Math.min(1, connections / totalNodes);
  }

  computeClusteringCoefficient(nodeId: string): number {
    const neighbors = this.getNeighbors(nodeId);
    if (neighbors.length < 3) return 0;

    let triangles = 0;
    let possibleTriangles = 0;

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const neighborA = neighbors[i];
        const neighborB = neighbors[j];
        
        // Check if neighbors are connected
        const edgeKey = this.getEdgeKey(neighborA, neighborB);
        const connected = this.edges.has(edgeKey);
        
        if (connected) {
          triangles++;
        }
        possibleTriangles++;
      }
    }

    return possibleTriangles > 0 ? triangles / possibleTriangles : 0;
  }

  getAllMetrics(nodeId: string): GraphMetrics {
    return {
      influenceScore: this.computeInfluenceScore(nodeId),
      synergyStrength: this.computeSynergyStrength(nodeId),
      rivalryIntensity: this.computeRivalryIntensity(nodeId, nodeId),
      strategyDiffusion: this.computeStrategyDiffusion(nodeId),
      centrality: this.computeCentrality(nodeId),
      clusteringCoefficient: this.computeClusteringCoefficient(nodeId),
    };
  }

  // =========================================================================
  // Pairwise Computations
  // =========================================================================

  computePairwiseSynergy(playerA: string, playerB: string): number {
    const embA = this.embeddings.get(playerA);
    const embB = this.embeddings.get(playerB);

    if (!embA || !embB) return 0.5;

    // Cosine similarity
    const similarity = this.cosineSimilarity(embA, embB);

    // Check for direct edges
    const edgeKey = this.getEdgeKey(playerA, playerB);
    const edges = this.edges.get(edgeKey) || [];
    
    let edgeBoost = 0;
    for (const edge of edges) {
      if (edge.relationship === 'SIMILAR_TO') {
        edgeBoost = 0.2;
      } else if (edge.relationship === 'PLAYS_FOR') {
        edgeBoost = 0.3;
      }
    }

    return Math.min(1, similarity + edgeBoost);
  }

  computeFeatureCompatibility(
    featuresA: UniversalFeatures,
    featuresB: UniversalFeatures
  ): number {
    const featurePairs = [
      { a: featuresA.skill_index, b: featuresB.skill_index },
      { a: featuresA.aggression_index, b: featuresB.aggression_index },
      { a: featuresA.macro_intelligence, b: featuresB.macro_intelligence },
      { a: featuresA.adaptability_score, b: featuresB.adaptability_score },
      { a: featuresA.meta_alignment_score, b: featuresB.meta_alignment_score },
    ];

    let totalCompatibility = 0;
    for (const pair of featurePairs) {
      const diff = Math.abs(pair.a - pair.b);
      totalCompatibility += 1 - diff;
    }

    return totalCompatibility / featurePairs.length;
  }

  // =========================================================================
  // Graph Traversal & Search
  // =========================================================================

  getNeighbors(nodeId: string): string[] {
    const neighbors: Set<string> = new Set();
    
    const outgoing = this.edges.get(nodeId) || [];
    for (const edge of outgoing) {
      neighbors.add(edge.target);
    }

    const incoming = this.getIncomingEdges(nodeId);
    for (const edge of incoming) {
      neighbors.add(edge.source);
    }

    return Array.from(neighbors);
  }

  findShortestPath(sourceId: string, targetId: string): string[] | null {
    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [{ id: sourceId, path: [sourceId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === targetId) return path;

      if (visited.has(id)) continue;
      visited.add(id);

      const neighbors = this.getNeighbors(id);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  findSimilarEntities(
    queryEmbedding: number[],
    entityType?: EntityType,
    limit: number = 10
  ): GraphSearchResult[] {
    const results: GraphSearchResult[] = [];

    for (const [id, embedding] of this.embeddings) {
      const node = this.nodes.get(id);
      if (!node) continue;

      if (entityType && node.type !== entityType) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      const metrics = this.getAllMetrics(id);

      results.push({
        node,
        metrics,
        relevanceScore: similarity,
      });
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, limit);
  }

  query(q: GraphQuery): GraphSearchResult[] {
    const results: GraphSearchResult[] = [];

    for (const [id, node] of this.nodes) {
      let match = true;

      if (q.types && q.types.length > 0 && !q.types.includes(node.type)) {
        match = false;
      }

      if (q.minInfluence !== undefined) {
        const influence = this.computeInfluenceScore(id);
        if (influence < q.minInfluence) match = false;
      }

      if (q.relatedTo && q.relationship) {
        const relatedEdges = this.getEdgesByRelationship(q.relatedTo, q.relationship);
        const relatedIds = relatedEdges.map(e => e.target);
        if (!relatedIds.includes(id)) match = false;
      }

      if (match) {
        const metrics = this.getAllMetrics(id);
        const relevanceScore = metrics.influenceScore;

        results.push({
          node,
          metrics,
          relevanceScore,
        });
      }
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    if (q.limit) {
      return results.slice(0, q.limit);
    }

    return results;
  }

  // =========================================================================
  // Domain-Specific Operations
  // =========================================================================

  addPlayerNode(
    playerId: string,
    name: string,
    teamId: string,
    features: UniversalFeatures,
    stats: Record<string, any>
  ): GraphNode {
    const embeddings = this.featuresToEmbedding(features);
    return this.addNode(playerId, 'player', name, {
      teamId,
      ...stats,
      skill_index: features.skill_index,
      aggression_index: features.aggression_index,
      macro_intelligence: features.macro_intelligence,
      adaptability_score: features.adaptability_score,
      meta_alignment_score: features.meta_alignment_score,
      synergy_score: features.synergy_score,
    }, embeddings);
  }

  addTeamNode(
    teamId: string,
    name: string,
    avgFeatures: UniversalFeatures,
    stats: Record<string, any>
  ): GraphNode {
    const embeddings = this.featuresToEmbedding(avgFeatures);
    return this.addNode(teamId, 'team', name, {
      ...stats,
      avg_skill: avgFeatures.skill_index,
      avg_aggression: avgFeatures.aggression_index,
      avg_macro: avgFeatures.macro_intelligence,
    }, embeddings);
  }

  addRoleNode(roleName: string, gameTitle: string): GraphNode {
    return this.addNode(
      `role:${gameTitle}:${roleName}`,
      'role',
      roleName,
      { gameTitle }
    );
  }

  addStrategyNode(
    strategyId: string,
    name: string,
    gameTitle: string,
    effectiveness: number
  ): GraphNode {
    return this.addNode(strategyId, 'strategy', name, {
      gameTitle,
      effectiveness,
      timestamp: new Date().toISOString(),
    });
  }

  recordMatchResult(
    winnerId: string,
    loserId: string,
    score: string,
    tournament?: string
  ): void {
    this.addEdge(winnerId, loserId, 'BEAT', 1, { score, tournament });
    
    const matchNodeId = `match:${winnerId}:${loserId}:${Date.now()}`;
    this.addNode(matchNodeId, 'tournament', `${winnerId} vs ${loserId}`, {
      winner: winnerId,
      loser: loserId,
      score,
      tournament,
      timestamp: new Date().toISOString(),
    });
    
    this.addEdge(matchNodeId, winnerId, 'PARTICIPATED_IN');
    this.addEdge(matchNodeId, loserId, 'PARTICIPATED_IN');
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private getEdgeKey(source: string, target: string): string {
    return `${source}::${target}`;
  }

  private getIncomingEdges(nodeId: string): GraphEdge[] {
    const incoming: GraphEdge[] = [];
    for (const [key, edges] of this.edges) {
      if (key.endsWith(`::${nodeId}`)) {
        incoming.push(...edges);
      }
    }
    return incoming;
  }

  private updateAdjacency(source: string, target: string, weight: number): void {
    if (!this.adjacencyMatrix.has(source)) {
      this.adjacencyMatrix.set(source, new Map());
    }
    this.adjacencyMatrix.get(source)!.set(target, weight);
  }

  private getRelationshipWeight(relationship: RelationshipType): number {
    const weights: Record<RelationshipType, number> = {
      PLAYS_FOR: 0.8,
      BEAT: 1.0,
      LOST_TO: 0.8,
      SIMILAR_TO: 0.6,
      COUNTERS: 1.2,
      COUNTERED_BY: 1.0,
      ADAPTED_FROM: 0.7,
      INFLUENCES: 0.9,
      PARTICIPATED_IN: 0.5,
      PLAYED_ON: 0.4,
      EXPERTS_WITH: 0.7,
      RIVAL_OF: 0.9,
      MENTORED: 0.6,
    };
    return weights[relationship] || 0.5;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
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

  // =========================================================================
  // Export/Import
  // =========================================================================

  exportGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).flat(),
    };
  }

  importGraph(data: { nodes: GraphNode[]; edges: GraphEdge[] }): void {
    this.clear();
    
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
      if (node.embeddings.length > 0) {
        this.embeddings.set(node.id, node.embeddings);
      }
    }

    for (const edge of data.edges) {
      const key = this.getEdgeKey(edge.source, edge.target);
      const existing = this.edges.get(key) || [];
      existing.push(edge);
      this.edges.set(key, existing);
      this.updateAdjacency(edge.source, edge.target, edge.weight);
    }
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.embeddings.clear();
    this.adjacencyMatrix.clear();
  }

  size(): { nodes: number; edges: number } {
    return {
      nodes: this.nodes.size,
      edges: Array.from(this.edges.values()).reduce((sum, arr) => sum + arr.length, 0),
    };
  }
}

export const esportsGraph = new UniversalEsportsGraph();

