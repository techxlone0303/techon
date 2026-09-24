import { MatchupPrediction } from './matchup.engine';
import { TeamStatistics } from '../grid/stats.service';

export interface ScoutPromptContext {
  teamA: {
    id: string;
    name: string;
    stats: TeamStatistics | null;
  };
  teamB: {
    id: string;
    name: string;
    stats: TeamStatistics | null;
  };
  prediction: MatchupPrediction;
}

export interface ScoutPromptOutput {
  prompt: string;
  context: ScoutPromptContext;
}

export function buildScoutPrompt(
  teamAStats: TeamStatistics | null,
  teamBStats: TeamStatistics | null,
  prediction: MatchupPrediction,
  teamAName: string,
  teamBName: string
): string {
  const formatStats = (stats: TeamStatistics | null, teamName: string): string => {
    if (!stats) {
      return `${teamName}: No recent statistics available`;
    }
    return `${teamName} (Recent Performance):
  - Games Played: ${stats.gamesPlayed}
  - Record: ${stats.wins}W - ${stats.losses}L
  - Win Rate: ${(stats.winRate * 100).toFixed(1)}%
  - Avg Kills/Series: ${stats.avgKillsPerSeries.toFixed(1)}
  - Series Count: ${stats.seriesCount}
  - Series Win Rate: ${(stats.seriesWinRate * 100).toFixed(1)}%`;
  };

  const teamAInfo = formatStats(teamAStats, teamAName);
  const teamBInfo = formatStats(teamBStats, teamBName);

  const winProbA = (prediction.teamA_win_probability * 100).toFixed(1);
  const winProbB = (prediction.teamB_win_probability * 100).toFixed(1);
  const confidence = (prediction.confidenceScore * 100).toFixed(0);

  const favorite = prediction.teamA_win_probability > prediction.teamB_win_probability ? teamAName : teamBName;
  const underdog = prediction.teamA_win_probability > prediction.teamB_win_probability ? teamBName : teamAName;

  const advantageList = prediction.advantageFactors.length > 0
    ? prediction.advantageFactors.map(f => `- ${f}`).join('\n')
    : 'No significant advantages identified';

  const riskList = prediction.riskFactors.length > 0
    ? prediction.riskFactors.map(r => `- ${r}`).join('\n')
    : 'No significant risks identified';

  return `You are an expert esports analyst for competitive ${teamAName} vs ${teamBName} matchup.

## Team Performance Summary

${teamAInfo}

${teamBInfo}

## Predictive Analysis

Based on GRID statistics and feature engineering:
- ${teamAName} Win Probability: ${winProbA}%
- ${teamBName} Win Probability: ${winProbB}%
- Prediction Confidence: ${confidence}%
- Projected Favorite: ${favorite}
- Projected Underdog: ${underdog}

## Advantage Factors
${advantageList}

## Risk Factors
${riskList}

## Analysis Requirements

Generate a JSON response with the following structure:

{
  "strengths": [
    "3-5 key strengths of ${teamAName} for this matchup"
  ],
  "weaknesses": [
    "3-5 key weaknesses of ${teamAName} to exploit"
  ],
  "tactical_insights": [
    "3-5 tactical recommendations based on the matchup"
  ],
  "win_conditions": [
    "3-5 specific conditions required for ${teamAName} to win"
  ],
  "upset_scenarios": [
    "2-3 scenarios where the underdog could win"
  ]
}

Focus on actionable intelligence. Consider:
- Win rate trends and recent form
- Kill average differentials
- Statistical advantages and exploitable patterns
- How the predicted outcome can be achieved or reversed
- Under what conditions the upset becomes likely

JSON Output:`;
}

