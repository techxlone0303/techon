import { getTeamStats, TeamStatsResponse } from '../grid/stats.service';
import { normalizeStats } from './data.normalizer';
import { matchHistoryStore, HeadToHead } from './history.engine';
import { buildFeatureVector, FeatureVector } from './features.v2.engine';
import { predictMatch, PredictionResult } from './prediction.engine';
import { explainPrediction, Explanation } from './explain.engine';
import { buildV2Prompt } from './prompt.v2.builder';
import { scoutMemory } from './rag.engine';

export interface V2ScoutInput {
  teamAId: string;
  teamBId: string;
  teamAName?: string;
  teamBName?: string;
  includeHistory?: boolean;
}

export interface V2ScoutOutput {
  teamA: {
    id: string;
    name: string;
    features: FeatureVector;
    stats: any;
  };
  teamB: {
    id: string;
    name: string;
    features: FeatureVector;
    stats: any;
  };
  prediction: PredictionResult;
  explanation: Explanation;
  llmPrompt: string;
  metadata: {
    generatedAt: string;
    dataSource: string;
    h2hAvailable: boolean;
  };
}

export async function runV2Scout(input: V2ScoutInput): Promise<V2ScoutOutput> {
  const { teamAId, teamBId, teamAName, teamBName, includeHistory } = input;

  const teamANameFinal = teamAName || teamAId;
  const teamBNameFinal = teamBName || teamBId;

  const [statsA, statsB] = await Promise.all([
    getTeamStats(teamAId),
    getTeamStats(teamBId),
  ]);

  const trendA = matchHistoryStore.getTrend(teamAId);
  const trendB = matchHistoryStore.getTrend(teamBId);

  const h2h = matchHistoryStore.getHeadToHead(teamAId, teamBId);
  const h2hScore = h2h.totalMatches > 0
    ? h2h.winsA / h2h.totalMatches
    : undefined;

  const featuresA = buildFeatureVector({
    teamId: teamAId,
    stats: statsA.statistics,
    trend: trendA,
    h2hScore,
  });

  const featuresB = buildFeatureVector({
    teamId: teamBId,
    stats: statsB.statistics,
    trend: trendB,
    h2hScore: h2hScore !== undefined ? 1 - h2hScore : undefined,
  });

  const prediction = predictMatch(featuresA, featuresB);

  const explanation = explainPrediction(
    prediction,
    featuresA,
    featuresB,
    teamANameFinal,
    teamBNameFinal
  );

  let historicalContext: string | undefined;
  if (includeHistory && h2h.totalMatches > 0) {
    historicalContext = `Head-to-Head Record: ${teamANameFinal} ${h2h.winsA}W - ${h2h.winsB}L vs ${teamBNameFinal}\nRecent H2H: ${h2h.recentResults.slice(0, 3).map(m => `${m.result} (${m.score})`).join(', ')}`;
  }

  const llmPrompt = buildV2Prompt(
    { id: teamAId, name: teamANameFinal, features: featuresA, stats: statsA.statistics },
    { id: teamBId, name: teamBNameFinal, features: featuresB, stats: statsB.statistics },
    prediction,
    explanation,
    historicalContext
  );

  if (includeHistory) {
    scoutMemory.storeMatchupInsight(teamAId, teamBId, {
      prediction: prediction.winProbabilityA,
      explanation: explanation.summary,
    });
  }

  return {
    teamA: {
      id: teamAId,
      name: teamANameFinal,
      features: featuresA,
      stats: statsA.statistics,
    },
    teamB: {
      id: teamBId,
      name: teamBNameFinal,
      features: featuresB,
      stats: statsB.statistics,
    },
    prediction,
    explanation,
    llmPrompt,
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource: statsA.statistics ? 'GRID_LIVE' : 'GRID_SANDBOX',
      h2hAvailable: h2h.totalMatches > 0,
    },
  };
}

export function addMatchToHistory(
  teamA: string,
  teamB: string,
  result: 'win' | 'loss' | 'draw',
  score: string,
  date?: string
): void {
  matchHistoryStore.addMatch({
    id: `${teamA}-${teamB}-${Date.now()}`,
    teamA,
    teamB,
    result,
    score,
    date: date || new Date().toISOString(),
  });
}

export function storeTeamInsight(teamId: string, key: string, value: any, tags: string[] = []): void {
  scoutMemory.storeInsight(key, value, [`team:${teamId}`, ...tags]);
}

export function getTeamMemory(teamId: string): any {
  return scoutMemory.getTeamProfile(teamId);
}

export function searchMemory(query: string): any[] {
  return scoutMemory.semanticSearch(query);
}

