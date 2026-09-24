import { FeatureVector } from './features.v2.engine';
import { PredictionResult } from './prediction.engine';

export interface Explanation {
  summary: string;
  strengthsA: string[];
  strengthsB: string[];
  weaknessesA: string[];
  weaknessesB: string[];
  tacticalInsights: string[];
}

function analyzeFeatureContribution(
  features: FeatureVector,
  delta: Record<string, number>
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (features.winRate > 0.6) {
    strengths.push('Consistent winner with strong overall performance');
  } else if (features.winRate < 0.4) {
    weaknesses.push('Struggling to secure victories');
  }

  if (features.momentumScore > 0.7) {
    strengths.push('Entering with strong positive momentum');
  } else if (features.momentumScore < 0.3) {
    weaknesses.push('Recent form indicates declining performance');
  }

  if (features.clutchFactor > 0.7) {
    strengths.push('Excellent clutch performance in critical moments');
  } else if (features.clutchFactor < 0.3) {
    weaknesses.push('Difficulty closing out close games');
  }

  if (features.headToHeadScore > 0.6) {
    strengths.push('Historical dominance in similar matchups');
  } else if (features.headToHeadScore < 0.4 && delta.headToHeadScore < -0.1) {
    weaknesses.push('Historical struggles against this opponent');
  }

  if (features.stabilityIndex > 0.7) {
    strengths.push('Highly consistent and predictable performance');
  } else if (features.stabilityIndex < 0.3) {
    strengths.push('Unpredictable playstyle can be unpredictable for opponents');
  }

  if (features.experienceScore > 0.8) {
    strengths.push('Extensive competitive experience');
  } else if (features.experienceScore < 0.3) {
    weaknesses.push('Limited high-level competitive experience');
  }

  if (features.killEfficiency > 0.7) {
    strengths.push('High individual skill ceiling');
  } else if (features.killEfficiency < 0.3) {
    weaknesses.push('Kill efficiency below average');
  }

  if (features.aggressionIndex > 0.6) {
    strengths.push('Aggressive playstyle that forces errors');
  } else if (features.aggressionIndex < 0.4) {
    weaknesses.push('Passive approach may concede map control');
  }

  return { strengths, weaknesses };
}

function generateSummary(
  teamA: string,
  teamB: string,
  prediction: PredictionResult,
  delta: Record<string, number>
): string {
  const probA = prediction.winProbabilityA * 100;
  const probB = prediction.winProbabilityB * 100;

  const favorite = probA > probB ? teamA : teamB;
  const underdog = probA > probB ? teamB : teamA;
  const favoriteProb = Math.max(probA, probB);

  let summary = `${favorite} enters as the predicted favorite with a ${favoriteProb.toFixed(1)}% win probability. `;

  if (prediction.confidence > 0.7) {
    summary += `High confidence prediction based on strong statistical indicators. `;
  } else if (prediction.confidence < 0.4) {
    summary += `Low confidence prediction due to limited historical data. `;
  }

  if (prediction.upsetLikelihood > 0.1) {
    summary += `Notable upset potential exists.`;
  }

  return summary;
}

function generateTacticalInsights(
  delta: Record<string, number>,
  teamAName: string,
  teamBName: string
): string[] {
  const insights: string[] = [];

  if (delta.winRate > 0.1) {
    insights.push(`${teamAName} should capitalize on superior overall performance`);
  } else if (delta.winRate < -0.1) {
    insights.push(`${teamAName} needs to find unconventional strategies to overcome win rate gap`);
  }

  if (delta.momentumScore > 0.1) {
    insights.push(`${teamAName} should maintain current playstyle and confidence`);
  } else if (delta.momentumScore < -0.1) {
    insights.push(`${teamAName} may benefit from tactical adjustments to reset momentum`);
  }

  if (delta.clutchFactor > 0.1) {
    insights.push(`${teamAName} should aim to create high-pressure situations`);
  } else if (delta.clutchFactor < -0.1) {
    insights.push(`${teamAName} should avoid late-game situations where possible`);
  }

  if (delta.headToHeadScore > 0.1) {
    insights.push(`${teamAName} should leverage historical playbook that works against ${teamBName}`);
  }

  if (delta.stabilityIndex > 0.1) {
    insights.push(`${teamAName} can rely on consistent team coordination`);
  } else if (delta.stabilityIndex < -0.1) {
    insights.push(`${teamAName} should focus on establishing clear protocols`);
  }

  if (insights.length === 0) {
    insights.push('Both teams show comparable statistics, making this a matchup of细微差異');
    insights.push('Individual player performance may be the deciding factor');
  }

  return insights;
}

export function explainPrediction(
  prediction: PredictionResult,
  featuresA: FeatureVector,
  featuresB: FeatureVector,
  teamAName: string = 'Team A',
  teamBName: string = 'Team B'
): Explanation {
  const { strengths: strengthsA, weaknesses: weaknessesA } = analyzeFeatureContribution(
    featuresA,
    prediction.featureDelta
  );
  const { strengths: strengthsB, weaknesses: weaknessesB } = analyzeFeatureContribution(
    featuresB,
    { ...prediction.featureDelta }
  );
  Object.keys(prediction.featureDelta).forEach(k => {
    (prediction.featureDelta as any)[k] = -(prediction.featureDelta as any)[k];
  });

  const summary = generateSummary(teamAName, teamBName, prediction, prediction.featureDelta);
  const tacticalInsights = generateTacticalInsights(prediction.featureDelta, teamAName, teamBName);

  return {
    summary,
    strengthsA,
    strengthsB,
    weaknessesA,
    weaknessesB,
    tacticalInsights,
  };
}

