import { FeatureVector } from './features.v2.engine';
import { PredictionResult } from './prediction.engine';
import { Explanation } from './explain.engine';

export interface PromptContext {
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
  historicalContext?: string;
}

export interface V2PromptResult {
  prompt: string;
  context: PromptContext;
}

export function buildV2Prompt(
  teamA: { id: string; name: string; features: FeatureVector; stats: any },
  teamB: { id: string; name: string; features: FeatureVector; stats: any },
  prediction: PredictionResult,
  explanation: Explanation,
  historicalContext?: string
): string {
  const formatFeatures = (features: FeatureVector, name: string): string => {
    return `${name} Feature Profile:
  - Win Rate: ${(features.winRate * 100).toFixed(1)}%
  - Kill Efficiency: ${(features.killEfficiency * 100).toFixed(1)}%
  - Aggression Index: ${(features.aggressionIndex * 100).toFixed(1)}%
  - Clutch Factor: ${(features.clutchFactor * 100).toFixed(1)}%
  - Momentum Score: ${(features.momentumScore * 100).toFixed(1)}%
  - Head-to-Head Score: ${(features.headToHeadScore * 100).toFixed(1)}%
  - Stability Index: ${(features.stabilityIndex * 100).toFixed(1)}%
  - Experience Score: ${(features.experienceScore * 100).toFixed(1)}%`;
  };

  const formatPrediction = (prediction: PredictionResult, teamAName: string, teamBName: string): string => {
    return `Prediction:
  - ${teamAName} Win Probability: ${(prediction.winProbabilityA * 100).toFixed(1)}%
  - ${teamBName} Win Probability: ${(prediction.winProbabilityB * 100).toFixed(1)}%
  - Upset Likelihood: ${(prediction.upsetLikelihood * 100).toFixed(1)}%
  - Confidence: ${(prediction.confidence * 100).toFixed(1)}%
  - Key Factors: ${prediction.keyFactors.join(', ') || 'None identified'}`;
  };

  const formatExplanation = (explanation: Explanation): string => {
    return `Analysis Summary:
${explanation.summary}

${teamA.name} Strengths:
${explanation.strengthsA.map(s => `  - ${s}`).join('\n') || '  - No significant strengths identified'}

${teamA.name} Weaknesses:
${explanation.weaknessesA.map(w => `  - ${w}`).join('\n') || '  - No significant weaknesses identified'}

${teamB.name} Strengths:
${explanation.strengthsB.map(s => `  - ${s}`).join('\n') || '  - No significant strengths identified'}

${teamB.name} Weaknesses:
${explanation.weaknessesB.map(w => `  - ${w}`).join('\n') || '  - No significant weaknesses identified'}

Tactical Insights:
${explanation.tacticalInsights.map(t => `  - ${t}`).join('\n')}`;
  };

  const featureA = formatFeatures(teamA.features, teamA.name);
  const featureB = formatFeatures(teamB.features, teamB.name);
  const predictionText = formatPrediction(prediction, teamA.name, teamB.name);
  const explanationText = formatExplanation(explanation);

  const historicalSection = historicalContext
    ? `\n## Historical Context\n${historicalContext}`
    : '';

  return `You are a Professional esports analyst and strategist specializing in competitive ${teamA.name} vs ${teamB.name} matchup analysis.

## Team Feature Profiles

${featureA}

${featureB}

${predictionText}

${explanationText}${historicalSection}

## Output Format

Generate a comprehensive scouting report in JSON format:

{
  "matchupSummary": "2-3 sentence overview of the matchup",
  "teamAAnalysis": {
    "strengths": ["3-5 key strengths for this matchup"],
    "weaknesses": ["3-5 exploitable weaknesses"],
    "playstyle": "Brief description of playstyle characteristics"
  },
  "teamBAnalysis": {
    "strengths": ["3-5 key strengths for this matchup"],
    "weaknesses": ["3-5 exploitable weaknesses"],
    "playstyle": "Brief description of playstyle characteristics"
  },
  "keyBattles": [
    {"battle": "Specific matchup or area", "favoredTeam": "Team A or Team B", "reason": "Why"}
  ],
  "gamePlanTeamA": {
    "earlyGame": "Recommended early game strategy",
    "midGame": "Recommended mid game approach",
    "lateGame": "Recommended late game execution"
  },
  "winConditions": [
    "3-5 specific conditions for Team A to win"
  ],
  "upsetPaths": [
    "2-3 scenarios where Team B could win despite prediction"
  ],
  "finalRecommendation": "Clear recommendation with confidence level"
}

Focus on actionable intelligence. Consider statistical indicators, historical trends, and tactical implications.

JSON Output:`;
}

