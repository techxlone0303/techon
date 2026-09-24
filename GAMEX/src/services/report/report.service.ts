import { fetchRecentMatches, resolveTeamId, getDataSource, DataSource } from '../ingestion/ingestion.service';
import { getGamePhaseInsights } from '../analytics/insights.engine';
import { callLLM as ollamaCallLLM } from '../llm/llm.client';
import { runFeatures, runRAG, runSimulation } from '../ai/ai.bridge';

export interface MatchupReport {
  dataSource: DataSource;
  team: {
    teamName: string;
    overallRating: number;
    strengths: string[];
    weaknesses: string[];
    keyPlayers: Array<{ name: string; role: string; rating: number; highlights: string }>;
    gamePhaseInsights: {
      earlyGame: string;
      midGame: string;
      lateGame: string;
    };
    intelligenceMetrics: {
      features: {
        winRateTrend: number;
        tempoScore: number;
        comebackProbability: number;
        winRate: number;
      };
    };
  };
  opponent: {
    teamName: string;
    overallRating: number;
    strengths: string[];
    weaknesses: string[];
    keyPlayers: Array<{ name: string; role: string; rating: number; highlights: string }>;
    gamePhaseInsights: {
      earlyGame: string;
      midGame: string;
      lateGame: string;
    };
    intelligenceMetrics: {
      features: {
        winRateTrend: number;
        tempoScore: number;
        comebackProbability: number;
        winRate: number;
      };
    };
  };
  comparison: {
    strategicAnalysis: string;
    recommendedApproach: string;
    winRateEdge: number;
    tempoMismatch: number;
    comebackEdge: number;
  };
  predictedWinner: string;
  winProbability: number;
  draftImpact: {
    favoredStyle: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    analysis: string;
  };
  tacticalAdvice: string;
  intelligenceMetrics: {
    simulation: {
      predictedWinProbability: number;
    };
    similarMatches: Array<{
      teamName: string;
      result: string;
      score: string;
      opponent: string;
      similarity: number;
    }>;
  };
}

export async function generateReport(teamId: string, opponentId: string): Promise<MatchupReport> {
  const teamIdResolved = await resolveTeamId(teamId);
  const opponentIdResolved = await resolveTeamId(opponentId);

  const teamResult = await fetchRecentMatches(teamIdResolved, 5);
  const opponentResult = await fetchRecentMatches(opponentIdResolved, 5);

  const teamMatches = teamResult.matches;
  const opponentMatches = opponentResult.matches;
  const dataSource = teamResult.dataSource === 'GRID_LIVE' && opponentResult.dataSource === 'GRID_LIVE' 
    ? 'GRID_LIVE' 
    : teamResult.dataSource;

  if (teamMatches.length === 0 || opponentMatches.length === 0) {
    throw new Error('No matches found for team or opponent');
  }

  const insights = getGamePhaseInsights();

  let teamFeatures = null;
  let opponentFeatures = null;
  let similarMatches: any[] = [];
  let simulation: any = null;

  try {
    teamFeatures = await runFeatures(teamMatches);
    opponentFeatures = await runFeatures(opponentMatches);
    const ragResult = await runRAG(`${teamId} vs ${opponentId} matchup`);
    similarMatches = ragResult.similar_matches || [];
    simulation = await runSimulation({ team: teamFeatures, opponent: opponentFeatures });
  } catch (err) {
    console.warn('AI pipeline unavailable, proceeding with basic analysis');
  }

  // Enhancement 1: Explicit Team Comparison Block
  const comparison = {
    winRateEdge: (teamFeatures?.win_rate_trend || 0) - (opponentFeatures?.win_rate_trend || 0),
    tempoMismatch: (teamFeatures?.tempo_score || 0) - (opponentFeatures?.tempo_score || 0),
    comebackEdge: (teamFeatures?.comeback_probability || 0) - (opponentFeatures?.comeback_probability || 0),
  };

  // Enhancement 2: Deterministic Winner Prediction (Before LLM)
  const winProbability = simulation?.predicted_win_probability ?? 0.5;
  const predictedWinner = winProbability >= 0.5 ? teamId : opponentId;

  // Enhancement 3: Draft Impact as First-Class Field
  const draftImpact = {
    favoredStyle: (teamFeatures?.tempo_score || 0) > (opponentFeatures?.tempo_score || 0)
      ? 'fast-paced compositions'
      : 'scaling compositions',
    riskLevel: Math.abs(comparison.winRateEdge) < 0.05 ? 'HIGH' : 'MEDIUM',
    analysis: '',
  };

  const prompt = buildPrompt(teamId, opponentId, teamMatches, opponentMatches, insights, teamFeatures, opponentFeatures, simulation, comparison, predictedWinner, winProbability, draftImpact);
  const response = await ollamaCallLLM(prompt);

  let reportData;
  try {
    reportData = JSON.parse(response);
  } catch (e) {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      reportData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse LLM response');
    }
  }

  return formatReport(reportData, teamId, opponentId, teamMatches, opponentMatches, insights, teamFeatures, opponentFeatures, simulation, similarMatches, comparison, predictedWinner, winProbability, draftImpact, dataSource);
}

function buildPrompt(
  teamId: string,
  opponentId: string,
  teamMatches: any[],
  opponentMatches: any[],
  insights: any,
  teamFeatures: any,
  opponentFeatures: any,
  simulation: any,
  comparison: { winRateEdge: number; tempoMismatch: number; comebackEdge: number },
  predictedWinner: string,
  winProbability: number,
  draftImpact: { favoredStyle: string; riskLevel: string; analysis: string }
): string {
  const teamMatchSummary = teamMatches.map(m =>
    `${m.date} | vs ${m.opponent} | ${m.result.toUpperCase()} | ${m.score}`
  ).join('\n');

  const opponentMatchSummary = opponentMatches.map(m =>
    `${m.date} | vs ${m.opponent} | ${m.result.toUpperCase()} | ${m.score}`
  ).join('\n');

  const aiSection = (teamFeatures && opponentFeatures) ? `
## Advanced Analytics
### ${teamId}
- Win Rate Trend: ${(teamFeatures.win_rate_trend || 0).toFixed(2)}
- Tempo Score: ${(teamFeatures.tempo_score || 0).toFixed(2)}
- Comeback Probability: ${(teamFeatures.comeback_probability || 0).toFixed(2)}

### ${opponentId}
- Win Rate Trend: ${(opponentFeatures.win_rate_trend || 0).toFixed(2)}
- Tempo Score: ${(opponentFeatures.tempo_score || 0).toFixed(2)}
- Comeback Probability: ${(opponentFeatures.comeback_probability || 0).toFixed(2)}

### Team Comparison (Edge Analysis)
- Win Rate Edge: ${comparison.winRateEdge.toFixed(2)} (positive favors ${teamId})
- Tempo Mismatch: ${comparison.tempoMismatch.toFixed(2)} (positive favors ${teamId})
- Comeback Edge: ${comparison.comebackEdge.toFixed(2)} (positive favors ${teamId})

### Deterministic Predictions
- Predicted Winner: ${predictedWinner}
- Win Probability: ${(winProbability * 100).toFixed(1)}%

### Draft Impact Analysis
- Favored Style: ${draftImpact.favoredStyle}
- Risk Level: ${draftImpact.riskLevel}
` : '';

  return `
You are an expert Esports analyst. Generate a detailed matchup scouting report for ${teamId} vs ${opponentId}.

## Team: ${teamId}

## Recent Matches for ${teamId}
${teamMatchSummary}

## Team: ${opponentId}

## Recent Matches for ${opponentId}
${opponentMatchSummary}

## Game Phase Analysis
${insights.summary}

${aiSection}

## Output Format
Provide a JSON object with:
{
  "team": {
    "teamName": "${teamId}",
    "overallRating": 1-100,
    "strengths": ["3-5 strengths"],
    "weaknesses": ["3-5 weaknesses"],
    "keyPlayers": [{"name": "player", "role": "role", "rating": 1-100, "highlights": "brief"}],
    "gamePhaseInsights": {
      "earlyGame": "early game analysis",
      "midGame": "mid game analysis",
      "lateGame": "late game analysis"
    }
  },
  "opponent": {
    "teamName": "${opponentId}",
    "overallRating": 1-100,
    "strengths": ["3-5 strengths"],
    "weaknesses": ["3-5 weaknesses"],
    "keyPlayers": [{"name": "player", "role": "role", "rating": 1-100, "highlights": "brief"}],
    "gamePhaseInsights": {
      "earlyGame": "early game analysis",
      "midGame": "mid game analysis",
      "lateGame": "late game analysis"
    }
  },
  "comparison": {
    "strategicAnalysis": "Comparative analysis of both teams",
    "recommendedApproach": "How ${teamId} should approach this matchup"
  },
  "predictedWinner": "${teamId}" or "${opponentId}",
  "winProbability": 0-100,
  "draftImpact": "Analysis of how draft affects this matchup",
  "tacticalAdvice": "Specific tactics for ${teamId} to win"
}

Consider the AI analytics data when forming your analysis. Focus on actionable insights for the matchup.

JSON Output:
`;
}

function formatReport(
  data: any,
  teamId: string,
  opponentId: string,
  teamMatches: any[],
  opponentMatches: any[],
  insights: any,
  teamFeatures: any,
  opponentFeatures: any,
  simulation: any,
  similarMatches: any[],
  comparison: { winRateEdge: number; tempoMismatch: number; comebackEdge: number },
  predictedWinner: string,
  winProbability: number,
  draftImpact: { favoredStyle: string; riskLevel: string; analysis: string },
  dataSource: DataSource
): MatchupReport {
  // Merge LLM analysis with deterministic values
  const llmDraftImpact = typeof data.draftImpact === 'object' ? data.draftImpact : { analysis: data.draftImpact || '' };

  return {
    dataSource: dataSource,
    team: {
      teamName: data.team?.teamName || teamId,
      overallRating: data.team?.overallRating || 70,
      strengths: data.team?.strengths || [],
      weaknesses: data.team?.weaknesses || [],
      keyPlayers: data.team?.keyPlayers || [],
      gamePhaseInsights: data.team?.gamePhaseInsights || {
        earlyGame: insights.earlyGame || 'No data',
        midGame: insights.midGame || 'No data',
        lateGame: insights.lateGame || 'No data',
      },
      intelligenceMetrics: {
        features: {
          winRateTrend: teamFeatures?.win_rate_trend || 0,
          tempoScore: teamFeatures?.tempo_score || 0,
          comebackProbability: teamFeatures?.comeback_probability || 0,
          winRate: teamFeatures?.win_rate || 0,
        },
      },
    },
    opponent: {
      teamName: data.opponent?.teamName || opponentId,
      overallRating: data.opponent?.overallRating || 70,
      strengths: data.opponent?.strengths || [],
      weaknesses: data.opponent?.weaknesses || [],
      keyPlayers: data.opponent?.keyPlayers || [],
      gamePhaseInsights: data.opponent?.gamePhaseInsights || {
        earlyGame: insights.earlyGame || 'No data',
        midGame: insights.midGame || 'No data',
        lateGame: insights.lateGame || 'No data',
      },
      intelligenceMetrics: {
        features: {
          winRateTrend: opponentFeatures?.win_rate_trend || 0,
          tempoScore: opponentFeatures?.tempo_score || 0,
          comebackProbability: opponentFeatures?.comeback_probability || 0,
          winRate: opponentFeatures?.win_rate || 0,
        },
      },
    },
    comparison: {
      strategicAnalysis: data.comparison?.strategicAnalysis || '',
      recommendedApproach: data.comparison?.recommendedApproach || '',
      winRateEdge: comparison.winRateEdge,
      tempoMismatch: comparison.tempoMismatch,
      comebackEdge: comparison.comebackEdge,
    },
    predictedWinner: predictedWinner,
    winProbability: winProbability,
    draftImpact: {
      favoredStyle: draftImpact.favoredStyle,
      riskLevel: draftImpact.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW',
      analysis: llmDraftImpact.analysis || '',
    },
    tacticalAdvice: data.tacticalAdvice || '',
    intelligenceMetrics: {
      simulation: {
        predictedWinProbability: simulation?.predicted_win_probability || 0,
      },
      similarMatches: similarMatches.map((m: any) => ({
        teamName: m.teamName,
        result: m.result,
        score: m.score,
        opponent: m.opponent,
        similarity: m.similarity || 0,
      })),
    },
  };
}

