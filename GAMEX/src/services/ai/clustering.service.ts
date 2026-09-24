import { PlayerEmbedding } from './embedding.service';

export interface ClusterAssignment {
  clusterId: number;
  clusterName: string;
  description: string;
  distance: number;
  confidence: number;
}

export interface ClusterDefinition {
  id: number;
  name: string;
  description: string;
  centroid: number[];
}

const CLUSTER_COUNT = 5;

const DEFAULT_CLUSTERS: ClusterDefinition[] = [
  {
    id: 0,
    name: 'ELITE FRAGGER',
    description: 'High kills, strong impact, carry potential',
    centroid: [0.8, 0.3, 0.7, 0.8, 0.7, 0.8, 0.8, 0.8, 0.9, 0.9, 0.9, 0.8, 0.8, 0.8, 0.9, 0.8],
  },
  {
    id: 1,
    name: 'SUPPORT SPECIALIST',
    description: 'High assists, team-oriented, consistent',
    centroid: [0.4, 0.6, 0.6, 0.4, 0.7, 0.6, 0.5, 0.6, 0.5, 0.4, 0.6, 0.5, 0.6, 0.6, 0.4, 0.5],
  },
  {
    id: 2,
    name: 'CLUTCH MASTER',
    description: 'High clutch factor, consistency under pressure',
    centroid: [0.5, 0.5, 0.6, 0.5, 0.8, 0.9, 0.6, 0.6, 0.6, 0.5, 0.7, 0.7, 0.6, 0.7, 0.5, 0.6],
  },
  {
    id: 3,
    name: 'ROAMING LURKER',
    description: 'Unpredictable playstyle, map control',
    centroid: [0.5, 0.5, 0.5, 0.7, 0.5, 0.5, 0.5, 0.7, 0.6, 0.7, 0.5, 0.5, 0.7, 0.5, 0.7, 0.6],
  },
  {
    id: 4,
    name: 'STRUCTURED ANCHOR',
    description: 'Defensive, consistent, site-holder',
    centroid: [0.4, 0.7, 0.6, 0.3, 0.8, 0.5, 0.5, 0.5, 0.4, 0.3, 0.6, 0.5, 0.5, 0.6, 0.3, 0.5],
  },
];

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return 1;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

function initializeCentroids(embeddings: number[][]): ClusterDefinition[] {
  const centroids: ClusterDefinition[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < CLUSTER_COUNT; i++) {
    let centroidIndex: number;
    do {
      centroidIndex = Math.floor(Math.random() * embeddings.length);
    } while (usedIndices.has(centroidIndex) && usedIndices.size < embeddings.length);

    usedIndices.add(centroidIndex);
    centroids.push({
      id: i,
      name: `CLUSTER_${i}`,
      description: `Player cluster ${i}`,
      centroid: [...embeddings[centroidIndex]],
    });
  }

  return centroids;
}

function assignToClusters(
  embedding: number[],
  centroids: ClusterDefinition[]
): { clusterId: number; distance: number }[] {
  const assignments = centroids.map((centroid, index) => {
    const distance = euclideanDistance(embedding, centroid.centroid);
    return { clusterId: index, distance };
  });

  return assignments.sort((a, b) => a.distance - b.distance);
}

function updateCentroids(
  embeddings: number[][],
  assignments: number[],
  clusterCount: number
): number[][] {
  const newCentroids: number[][] = Array(clusterCount).fill(null).map(() => []);

  for (let i = 0; i < clusterCount; i++) {
    const clusterEmbeddings = embeddings.filter((_, idx) => assignments[idx] === i);
    if (clusterEmbeddings.length > 0) {
      for (let d = 0; d < embeddings[0].length; d++) {
        const sum = clusterEmbeddings.reduce((acc, e) => acc + e[d], 0);
        newCentroids[i][d] = sum / clusterEmbeddings.length;
      }
    }
  }

  return newCentroids;
}

export function runKMeans(
  embeddings: number[][],
  maxIterations: number = 10
): ClusterDefinition[] {
  if (embeddings.length === 0) {
    return DEFAULT_CLUSTERS;
  }

  if (embeddings.length < CLUSTER_COUNT) {
    return DEFAULT_CLUSTERS.slice(0, embeddings.length);
  }

  let centroids = initializeCentroids(embeddings);
  let assignments = new Array(embeddings.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = embeddings.map((emb, idx) => {
      const assignment = assignToClusters(emb, centroids);
      return assignment[0].clusterId;
    });

    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;

    if (!changed) {
      break;
    }

    const newCentroids = updateCentroids(embeddings, assignments, CLUSTER_COUNT);

    let centroidChanged = false;
    for (let i = 0; i < CLUSTER_COUNT; i++) {
      const dist = euclideanDistance(centroids[i].centroid, newCentroids[i]);
      if (dist > 0.001) {
        centroidChanged = true;
        break;
      }
    }

    if (!centroidChanged) {
      break;
    }

    for (let i = 0; i < CLUSTER_COUNT; i++) {
      centroids[i].centroid = newCentroids[i];
    }
  }

  return centroids;
}

export function assignPlayerToCluster(
  embedding: PlayerEmbedding,
  clusters?: ClusterDefinition[]
): ClusterAssignment {
  const activeClusters = clusters || DEFAULT_CLUSTERS;

  const assignments = assignToClusters(embedding.vector, activeClusters);
  const bestAssignment = assignments[0];
  const bestCluster = activeClusters[bestAssignment.clusterId];
  const secondBestDistance = assignments[1]?.distance || bestAssignment.distance;

  const maxDistance = bestAssignment.distance + secondBestDistance;
  const confidence = maxDistance > 0 ? 1 - (bestAssignment.distance / maxDistance) : 0.5;

  return {
    clusterId: bestAssignment.clusterId,
    clusterName: bestCluster.name,
    description: bestCluster.description,
    distance: Math.round(bestAssignment.distance * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

export function findSimilarPlayers(
  targetEmbedding: PlayerEmbedding,
  allEmbeddings: Map<string, PlayerEmbedding>,
  limit: number = 5
): Array<{ playerId: string; similarity: number }> {
  const similarities: Array<{ playerId: string; similarity: number }> = [];

  for (const [playerId, embedding] of allEmbeddings) {
    const similarity = cosineSimilarity(targetEmbedding.vector, embedding.vector);
    similarities.push({ playerId, similarity });
  }

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, limit);
}

export const CLUSTER_DESCRIPTIONS: Record<number, string> = {
  0: 'Elite Fragger - Players who consistently secure kills and carry their team through individual performance.',
  1: 'Support Specialist - Team-oriented players who enable success through assists and utility.',
  2: 'Clutch Master - Players who excel in high-pressure situations and 1vX scenarios.',
  3: 'Roaming Lurker - Unpredictable players who control map space and create confusion.',
  4: 'Structured Anchor - Defensive-minded players who hold sites and provide stability.',
};

