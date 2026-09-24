import { getTeamStats, TeamStatsResponse } from '../grid/stats.service';
import { extractFeatures, TeamFeatures } from './features.engine';
import { analyzeMatchup, MatchupPrediction } from './matchup.engine';
import { buildScoutPrompt } from './scout.prompt';

export interface ScoutIntegrationInput {
  teamAId: string;
  teamBId: string;
  teamAName?: string;
  teamBName?: string;
}

export interface ScoutIntegrationResult {
  teamA: {
    id: string;
    name: string;
    stats: TeamStatsResponse['statistics'];
    features: TeamFeatures;
  };
  teamB: {
    id: string;
    name: string;
    stats: TeamStatsResponse['statistics'];
    features: TeamFeatures;
  };
  prediction: MatchupPrediction;
  llmPrompt: string;
}

export async function buildScoutIntegration(
  input: ScoutIntegrationInput
): Promise<ScoutIntegrationResult> {
  const { teamAId, teamBId, teamAName, teamBName } = input;

  const [teamAStatsResponse, teamBStatsResponse] = await Promise.all([
    getTeamStats(teamAId),
    getTeamStats(teamBId),
  ]);

  const teamAFeatures = extractFeatures(teamAStatsResponse.statistics);
  const teamBFeatures = extractFeatures(teamBStatsResponse.statistics);

  const prediction = analyzeMatchup(
    teamAFeatures,
    teamBFeatures,
    teamAName || teamAId,
    teamBName || teamBId
  );

  const llmPrompt = buildScoutPrompt(
    teamAStatsResponse.statistics,
    teamBStatsResponse.statistics,
    prediction,
    teamAName || teamAId,
    teamBName || teamBId
  );

  return {
    teamA: {
      id: teamAId,
      name: teamAName || teamAId,
      stats: teamAStatsResponse.statistics,
      features: teamAFeatures,
    },
    teamB: {
      id: teamBId,
      name: teamBName || teamBId,
      stats: teamBStatsResponse.statistics,
      features: teamBFeatures,
    },
    prediction,
    llmPrompt,
  };
}

