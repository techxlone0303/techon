import { PlayerEmbedding, cosineSimilarity } from './embedding.service';

export interface SynergyEdge {
  playerA: string;
  playerB: string;
  synergyScore: number;
  gamesTogether: number;
  winsTogether: number;
  winRate: number;
  similarityScore: number;
  lastPlayedAt: string | null;
}

export interface SynergyGraph {
  nodes: SynergyNode[];
  edges: SynergyEdge[];
}

export interface SynergyNode {
  playerId: string;
  playerName?: string;
  centrality: number;
  cluster: string;
}

export interface TeamSynergyReport {
  teamId: string;
  overallSynergy: number;
  topDuos: SynergyEdge[];
  weakestLinks: SynergyEdge[];
  networkDensity: number;
  avgCentrality: number;
}

const SYNERGY_WEIGHTS = {
  gamesTogether: 0.3,
  winRate: 0.35,
  similarity: 0.35,
};

export class SynergyGraphEngine {
  private edges: Map<string, SynergyEdge> = new Map();
  private nodeCentrality: Map<string, number> = new Map();
  private playerNames: Map<string, string> = new Map();
  private playerEmbeddings: Map<string, PlayerEmbedding> = new Map();

  private makeEdgeKey(playerA: string, playerB: string): string {
    return [playerA, playerB].sort().join('::');
  }

  private normalizeScore(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  recordMatchResult(
    playerIds: string[],
    result: 'win' | 'loss',
    timestamp?: string
  ): void {
    if (playerIds.length < 2) return;

    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const playerA = playerIds[i];
        const playerB = playerIds[j];
        const edgeKey = this.makeEdgeKey(playerA, playerB);

        const existingEdge = this.edges.get(edgeKey);
        const winsTogether = existingEdge
          ? existingEdge.winsTogether + (result === 'win' ? 1 : 0)
          : result === 'win' ? 1 : 0;
        const gamesTogether = existingEdge ? existingEdge.gamesTogether + 1 : 1;
        const winRate = gamesTogether > 0 ? winsTogether / gamesTogether : 0;

        const edge: SynergyEdge = {
          playerA,
          playerB,
          gamesTogether,
          winsTogether,
          winRate,
          similarityScore: existingEdge?.similarityScore || 0.5,
          synergyScore: 0,
          lastPlayedAt: timestamp || new Date().toISOString(),
        };

        this.edges.set(edgeKey, edge);
      }
    }

    this.recomputeAllSynergyScores();
    this.recomputeCentrality();
  }

  setPlayerEmbedding(playerId: string, embedding: PlayerEmbedding): void {
    this.playerEmbeddings.set(playerId, embedding);
  }

  setPlayerName(playerId: string, name: string): void {
    this.playerNames.set(playerId, name);
  }

  private computeSimilarityScore(playerA: string, playerB: string): number {
    const embA = this.playerEmbeddings.get(playerA);
    const embB = this.playerEmbeddings.get(playerB);

    if (!embA || !embB) return 0.5;

    return cosineSimilarity(embA.vector, embB.vector);
  }

  private recomputeAllSynergyScores(): void {
    const allScores: number[] = [];

    for (const edge of this.edges.values()) {
      const similarity = this.computeSimilarityScore(edge.playerA, edge.playerB);
      edge.similarityScore = similarity;

      const normalizedGames = this.normalizeScore(edge.gamesTogether, 0, 50);
      const normalizedWinRate = edge.winRate;
      const normalizedSimilarity = similarity;

      const synergyScore =
        normalizedGames * SYNERGY_WEIGHTS.gamesTogether +
        normalizedWinRate * SYNERGY_WEIGHTS.winRate +
        normalizedSimilarity * SYNERGY_WEIGHTS.similarity;

      edge.synergyScore = Math.round(synergyScore * 1000) / 1000;
      allScores.push(edge.synergyScore);
    }

    for (const edge of this.edges.values()) {
      edge.synergyScore = this.normalizeScore(edge.synergyScore, 0, Math.max(...allScores));
    }
  }

  private recomputeCentrality(): void {
    const playerDegrees: Map<string, number> = new Map();

    for (const edge of this.edges.values()) {
      const currentA = playerDegrees.get(edge.playerA) || 0;
      const currentB = playerDegrees.get(edge.playerB) || 0;
      playerDegrees.set(edge.playerA, currentA + edge.synergyScore);
      playerDegrees.set(edge.playerB, currentB + edge.synergyScore);
    }

    const maxDegree = Math.max(...playerDegrees.values(), 1);

    for (const [playerId, degree] of playerDegrees) {
      this.nodeCentrality.set(playerId, degree / maxDegree);
    }
  }

  getSynergy(playerA: string, playerB: string): SynergyEdge | null {
    const edgeKey = this.makeEdgeKey(playerA, playerB);
    return this.edges.get(edgeKey) || null;
  }

  getPlayerNetwork(playerId: string): SynergyEdge[] {
    const network: SynergyEdge[] = [];

    for (const edge of this.edges.values()) {
      if (edge.playerA === playerId) {
        network.push({ ...edge, playerA: playerId, playerB: edge.playerB });
      } else if (edge.playerB === playerId) {
        network.push({ ...edge, playerA: edge.playerA, playerB: playerId });
      }
    }

    return network.sort((a, b) => b.synergyScore - a.synergyScore);
  }

  getPlayerCentrality(playerId: string): number {
    return this.nodeCentrality.get(playerId) || 0;
  }

  getTopSynergies(limit: number = 5): SynergyEdge[] {
    return Array.from(this.edges.values())
      .sort((a, b) => b.synergyScore - a.synergyScore)
      .slice(0, limit);
  }

  getWeakestLinks(limit: number = 5): SynergyEdge[] {
    return Array.from(this.edges.values())
      .filter(e => e.gamesTogether >= 3)
      .sort((a, b) => a.synergyScore - b.synergyScore)
      .slice(0, limit);
  }

  getGraph(): SynergyGraph & { networkDensity: number; avgCentrality: number } {
    const nodes: SynergyNode[] = [];
    const playerIds = new Set<string>();

    for (const edge of this.edges.values()) {
      playerIds.add(edge.playerA);
      playerIds.add(edge.playerB);
    }

    for (const playerId of playerIds) {
      nodes.push({
        playerId,
        playerName: this.playerNames.get(playerId) || playerId,
        centrality: this.nodeCentrality.get(playerId) || 0,
        cluster: 'default',
      });
    }

    const networkDensity = this.edges.size > 0
      ? (2 * this.edges.size) / (playerIds.size * (playerIds.size - 1))
      : 0;

    const avgCentrality = playerIds.size > 0
      ? Array.from(this.nodeCentrality.values()).reduce((a, b) => a + b, 0) / playerIds.size
      : 0;

    return {
      nodes: nodes.sort((a, b) => b.centrality - a.centrality),
      edges: Array.from(this.edges.values()).sort((a, b) => b.synergyScore - a.synergyScore),
      networkDensity: Math.round(networkDensity * 1000) / 1000,
      avgCentrality: Math.round(avgCentrality * 1000) / 1000,
    };
  }

  getTeamSynergyReport(teamId: string, playerIds: string[]): TeamSynergyReport {
    const teamEdges = playerIds.flatMap((a, i) =>
      playerIds.slice(i + 1).map(b => this.getSynergy(a, b))
    ).filter((e): e is SynergyEdge => e !== null);

    const sortedBySynergy = [...teamEdges].sort((a, b) => b.synergyScore - a.synergyScore);
    const sortedByWeakness = [...teamEdges].sort((a, b) => a.synergyScore - b.synergyScore);

    const overallSynergy = teamEdges.length > 0
      ? teamEdges.reduce((sum, e) => sum + e.synergyScore, 0) / teamEdges.length
      : 0;

    return {
      teamId,
      overallSynergy: Math.round(overallSynergy * 1000) / 1000,
      topDuos: sortedBySynergy.slice(0, 3),
      weakestLinks: sortedByWeakness.slice(0, 3),
      networkDensity: this.getGraph().networkDensity,
      avgCentrality: this.getGraph().avgCentrality,
    };
  }

  findBestTeammate(
    playerId: string,
    candidateIds: string[]
  ): { playerId: string; synergyScore: number } | null {
    const candidates = candidateIds
      .filter(id => id !== playerId)
      .map(id => ({
        playerId: id,
        synergy: this.getSynergy(playerId, id),
      }));

    const best = candidates
      .filter(c => c.synergy !== null)
      .sort((a, b) => (b.synergy?.synergyScore || 0) - (a.synergy?.synergyScore || 0))[0];

    return best
      ? { playerId: best.playerId, synergyScore: best.synergy!.synergyScore }
      : null;
  }

  exportGraph(): Map<string, SynergyEdge> {
    return new Map(this.edges);
  }

  importGraph(edges: Map<string, SynergyEdge>): void {
    this.edges = new Map(edges);
    this.recomputeCentrality();
  }

  clear(): void {
    this.edges.clear();
    this.nodeCentrality.clear();
    this.playerNames.clear();
    this.playerEmbeddings.clear();
  }

  size(): number {
    return this.edges.size;
  }
}

export const synergyGraphEngine = new SynergyGraphEngine();

