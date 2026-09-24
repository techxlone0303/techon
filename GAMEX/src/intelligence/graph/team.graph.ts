/**
 * ScoutIQ Intelligence Layer - Team Synergy Graph
 * 
 * Computes team and player synergy scores using graph-based analysis.
 * 
 * Synergy Metrics:
 * - Communication efficiency between players
 * - Role complementarity
 * - Win rate when playing together
 * - Experience factor (games played as unit)
 */

import { PlayerData, SynergyResult } from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SynergyConfig {
  communicationWeight: number;
  complementarityWeight: number;
  experienceWeight: number;
  roleBonus: number;
}

export interface PlayerNode {
  id: string;
  nickname: string;
  role: string;
  kda: number;
  winRate: number;
  experience: number;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  type: 'communication' | 'complementarity' | 'experience';
}

export interface GraphMetrics {
  density: number;
  centrality: Map<string, number>;
  clustering: number;
  avgPathLength: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_SYNNERGY_CONFIG: SynergyConfig = {
  communicationWeight: 0.35,
  complementarityWeight: 0.30,
  experienceWeight: 0.25,
  roleBonus: 0.10,
};

// ============================================================================
// Role Complements (which roles work well together)
// ============================================================================

const ROLE_COMPLEMENTS: Record<string, string[]> = {
  'top': ['jungle', 'support'],
  'jungle': ['mid', 'support'],
  'mid': ['jungle', 'adc'],
  'adc': ['support', 'mid'],
  'support': ['top', 'adc'],
};

// ============================================================================
// Core Graph Functions
// ============================================================================

export function buildPlayerGraph(players: PlayerData[]): {
  nodes: PlayerNode[];
  edges: Edge[];
} {
  const nodes: PlayerNode[] = players.map(p => ({
    id: p.id,
    nickname: p.nickname,
    role: (p.role || 'unknown').toLowerCase(),
    kda: calculatePlayerKDA(p),
    winRate: p.stats?.winRate || 0.5,
    experience: p.stats?.gamesPlayed || 0,
  }));
  
  const edges: Edge[] = [];
  
  // Build edges between all player pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      
      const edge = calculateEdgeWeight(nodeA, nodeB);
      if (edge.weight > 0) {
        edges.push(edge);
      }
    }
  }
  
  return { nodes, edges };
}

export function calculateEdgeWeight(nodeA: PlayerNode, nodeB: PlayerNode): Edge {
  // Communication score based on KDA similarity
  const kdaDiff = Math.abs(nodeA.kda - nodeB.kda);
  const communicationScore = Math.max(0, 1 - kdaDiff / 5);
  
  // Complementarity based on role synergy
  const complementarityScore = calculateComplementarity(nodeA.role, nodeB.role);
  
  // Experience similarity (teams with similar experience work better)
  const expDiff = Math.abs(nodeA.experience - nodeB.experience);
  const experienceScore = Math.max(0, 1 - expDiff / 50);
  
  return {
    source: nodeA.id,
    target: nodeB.id,
    weight: communicationScore + complementarityScore + experienceScore,
    type: 'communication',
  };
}

export function calculateComplementarity(roleA: string, roleB: string): number {
  if (roleA === roleB) return 0.5;
  
  const complementsA = ROLE_COMPLEMENTS[roleA] || [];
  const complementsB = ROLE_COMPLEMENTS[roleB] || [];
  
  if (complementsA.includes(roleB) || complementsB.includes(roleA)) {
    return 1.0;
  }
  
  return 0.5;
}

function calculatePlayerKDA(player: PlayerData): number {
  const stats = player.stats;
  if (!stats) return 2.5;
  
  const kills = stats.kills || 0;
  const deaths = stats.deaths || 0;
  const assists = stats.assists || 0;
  
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / Math.max(deaths, 1)) * 100) / 100;
}

// ============================================================================
// Graph Metrics Calculation
// ============================================================================

export function calculateGraphMetrics(
  nodes: PlayerNode[],
  edges: Edge[]
): GraphMetrics {
  const n = nodes.length;
  if (n < 2) {
    return {
      density: 0,
      centrality: new Map(),
      clustering: 0,
      avgPathLength: 0,
    };
  }
  
  // Density: actual edges / possible edges
  const maxEdges = (n * (n - 1)) / 2;
  const density = edges.length / maxEdges;
  
  // Degree centrality
  const centrality = new Map<string, number>();
  for (const node of nodes) {
    const connections = edges.filter(e => e.source === node.id || e.target === node.id);
    centrality.set(node.id, connections.length / (n - 1));
  }
  
  // Clustering coefficient
  let clusteringSum = 0;
  for (const node of nodes) {
    const neighbors = getNeighbors(node.id, edges);
    const neighborEdges = edges.filter(e => 
      neighbors.includes(e.source) && neighbors.includes(e.target)
    );
    const possibleEdges = (neighbors.length * (neighbors.length - 1)) / 2;
    if (possibleEdges > 0) {
      clusteringSum += neighborEdges.length / possibleEdges;
    }
  }
  const clustering = clusteringSum / n;
  
  return {
    density,
    centrality,
    clustering,
    avgPathLength: 1.5, // Simplified
  };
}

function getNeighbors(nodeId: string, edges: Edge[]): string[] {
  const neighbors: string[] = [];
  for (const edge of edges) {
    if (edge.source === nodeId && !neighbors.includes(edge.target)) {
      neighbors.push(edge.target);
    }
    if (edge.target === nodeId && !neighbors.includes(edge.source)) {
      neighbors.push(edge.source);
    }
  }
  return neighbors;
}

// ============================================================================
// Synergy Score Calculation
// ============================================================================

export function calculateTeamSynergy(
  players: PlayerData[],
  config: SynergyConfig = DEFAULT_SYNNERGY_CONFIG
): SynergyResult {
  if (players.length < 2) {
    return {
      teamASynergy: 0.5,
      teamBSynergy: 0.5,
      keySynergies: [],
      weakLinks: [],
    };
  }
  
  const { nodes, edges } = buildPlayerGraph(players);
  const metrics = calculateGraphMetrics(nodes, edges);
  
  // Calculate overall synergy score
  const avgEdgeWeight = edges.length > 0 
    ? edges.reduce((sum, e) => sum + e.weight, 0) / edges.length 
    : 0.5;
  
  const synergyScore = (
    avgEdgeWeight * config.communicationWeight +
    metrics.density * config.complementarityWeight +
    0.5 * config.experienceWeight
  );
  
  // Identify key synergies (highest edge weights)
  const sortedEdges = [...edges].sort((a, b) => b.weight - a.weight);
  const keySynergies = sortedEdges.slice(0, 3).map(e => ({
    players: [
      nodes.find(n => n.id === e.source)?.nickname || '',
      nodes.find(n => n.id === e.target)?.nickname || '',
    ],
    score: Math.round(e.weight * 100) / 100,
  }));
  
  // Identify weak links (lowest centrality)
  const sortedCentrality = [...metrics.centrality.entries()]
    .sort((a, b) => a[1] - b[1]);
  const weakLinks = sortedCentrality.slice(0, 2).map(([id, score]) => ({
    player: nodes.find(n => n.id === id)?.nickname || '',
    score: Math.round(score * 100) / 100,
  }));
  
  return {
    teamASynergy: Math.round(synergyScore * 1000) / 1000,
    teamBSynergy: 0, // For single team analysis
    keySynergies,
    weakLinks,
  };
}

export function compareTeamSynergy(
  teamAPlayers: PlayerData[],
  teamBPlayers: PlayerData[],
  config: SynergyConfig = DEFAULT_SYNNERGY_CONFIG
): SynergyResult {
  const resultA = calculateTeamSynergy(teamAPlayers, config);
  const resultB = calculateTeamSynergy(teamBPlayers, config);
  
  return {
    teamASynergy: resultA.teamASynergy,
    teamBSynergy: resultB.teamASynergy,
    keySynergies: [...resultA.keySynergies, ...resultB.keySynergies],
    weakLinks: [...resultA.weakLinks, ...resultB.weakLinks],
  };
}

export default {
  buildPlayerGraph,
  calculateEdgeWeight,
  calculateTeamSynergy,
  compareTeamSynergy,
  calculateGraphMetrics,
  DEFAULT_SYNNERGY_CONFIG,
};

