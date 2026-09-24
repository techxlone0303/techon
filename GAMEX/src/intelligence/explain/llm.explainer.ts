/**
 * ScoutIQ Intelligence Layer - LLM Explainer
 * 
 * Generates human-readable scouting reports using Ollama.
 * Provides narrative explanations for match predictions.
 */

import { ollamaGenerateJSON } from '../../ollama/ollama.client';
import { MatchupInput, MatchupIntelligence, PredictionResult, SynergyResult, MatchupFeatures } from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ExplanationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  includeStats: boolean;
  includeRecommendations: boolean;
}

export interface ExplanationResult {
  summary: string;
  teamAAnalysis: string;
  teamBAnalysis: string;
  keyFactors: string[];
  winConditions: string[];
  recommendedStrategy: string;
  predictedScore: string;
  upsetPotential: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_EXPLANATION_CONFIG: ExplanationConfig = {
  model: 'mistral',
  temperature: 0.7,
  maxTokens: 1024,
  includeStats: true,
  includeRecommendations: true,
};

// ============================================================================
// Explanation Generation
// ============================================================================

export async function generateMatchupExplanation(
  input: MatchupInput,
  prediction: PredictionResult,
  features: MatchupFeatures,
  synergy: SynergyResult,
  config: ExplanationConfig = DEFAULT_EXPLANATION_CONFIG
): Promise<ExplanationResult> {
  const teamA = input.teamA;
  const teamB = input.teamB;
  
  const prompt = buildExplanationPrompt(teamA, teamB, prediction, features, synergy, config);
  
  try {
    const response = await ollamaGenerateJSON(prompt);
    
    return {
      summary: response.summary || generateDefaultSummary(teamA.name, teamB.name, prediction),
      teamAAnalysis: response.teamAAnalysis || generateTeamAnalysis(teamA.name, 'A', features),
      teamBAnalysis: response.teamBAnalysis || generateTeamAnalysis(teamB.name, 'B', features),
      keyFactors: response.keyFactors || generateDefaultFactors(prediction),
      winConditions: response.winConditions || generateWinConditions(teamA.name, teamB.name),
      recommendedStrategy: response.recommendedStrategy || generateStrategy(teamA.name),
      predictedScore: response.predictedScore || prediction.expectedScore,
      upsetPotential: response.upsetPotential || assessUpsetPotential(features.upsetPotential),
    };
  } catch (error) {
    console.error('[LLM EXPLAINER] Failed to generate explanation:', error);
    
    // Fallback to template-based explanation
    return generateFallbackExplanation(teamA, teamB, prediction, features, synergy);
  }
}

function buildExplanationPrompt(
  teamA: any,
  teamB: any,
  prediction: PredictionResult,
  features: MatchupFeatures,
  synergy: SynergyResult,
  config: ExplanationConfig
): string {
  return `
Generate a comprehensive esports matchup analysis.

TEAM A: ${teamA.name}
- Win Rate: ${((teamA.stats?.winRate || 0.5) * 100).toFixed(1)}%
- Elo Rating: ${features.teamAAdvantage > 0 ? 'Higher' : 'Lower'} than opponent
- Form: ${features.formDiff > 0 ? 'Improving' : features.formDiff < 0 ? 'Declining' : 'Stable'}
- Synergy Score: ${(synergy.teamASynergy * 100).toFixed(0)}%

TEAM B: ${teamB.name}
- Win Rate: ${((teamB.stats?.winRate || 0.5) * 100).toFixed(1)}%
- Elo Rating: ${features.teamBAdvantage > 0 ? 'Higher' : 'Lower'} than opponent
- Form: ${features.formDiff < 0 ? 'Improving' : features.formDiff > 0 ? 'Declining' : 'Stable'}
- Synergy Score: ${(synergy.teamBSynergy * 100).toFixed(0)}%

PREDICTION:
- Winner: ${prediction.winner}
- Win Probability: ${(prediction.winProbability * 100).toFixed(0)}%
- Confidence: ${(prediction.confidence * 100).toFixed(0)}%
- Expected Score: ${prediction.expectedScore}

KEY FACTORS:
${prediction.factors.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Generate a detailed analysis in JSON format:
{
  "summary": "2-3 sentence overview",
  "teamAAnalysis": "Strengths and weaknesses of Team A",
  "teamBAnalysis": "Strengths and weaknesses of Team B", 
  "keyFactors": ["3-5 key factors"],
  "winConditions": ["3-4 conditions for Team A to win"],
  "recommendedStrategy": "Strategic recommendation",
  "predictedScore": "e.g., 2-1",
  "upsetPotential": "high/medium/low assessment"
}

JSON Output:
`;
}

function generateDefaultSummary(teamA: string, teamB: string, prediction: PredictionResult): string {
  const winner = prediction.winner;
  const prob = (prediction.winProbability * 100).toFixed(0);
  
  return `${teamA} faces ${teamB} in this matchup. ${winner} is favored to win with a ${prob}% probability based on current form and statistics.`;
}

function generateTeamAnalysis(teamName: string, side: string, features: MatchupFeatures): string {
  const advantage = side === 'A' ? features.teamAAdvantage : features.teamBAdvantage;
  const wr = 0.5 + advantage;
  
  let analysis = `${teamName} enters this match with a ${(wr * 100).toFixed(1)}% win rate.`;
  
  if (advantage > 0.1) {
    analysis += ' The team shows strong recent form and is performing well above their season average.';
  } else if (advantage < -0.1) {
    analysis += ' The team has been struggling recently and may need to improve their coordination.';
  } else {
    analysis += ' The team is performing at their expected level with consistent results.';
  }
  
  return analysis;
}

function generateDefaultFactors(prediction: PredictionResult): string[] {
  return prediction.factors.map(f => f.name);
}

function generateWinConditions(teamA: string, teamB: string): string[] {
  return [
    `Execute early game strategy to establish map control`,
    `Capitalize on individual player advantages`,
    `Maintain objective focus throughout the match`,
    `Adapt to opponent's playstyle dynamically`,
  ];
}

function generateStrategy(teamName: string): string {
  return `Focus on ${teamName}'s strengths and look to establish early game advantages through coordinated plays. Prioritize objective control over kills.`;
}

function assessUpsetPotential(upsetPotential: number): string {
  if (upsetPotential > 0.7) return 'High - This is a prime upset opportunity';
  if (upsetPotential > 0.4) return 'Medium - An upset is possible with optimal performance';
  return 'Low - The favorite is strongly positioned to win';
}

function generateFallbackExplanation(
  teamA: any,
  teamB: any,
  prediction: PredictionResult,
  features: MatchupFeatures,
  synergy: SynergyResult
): ExplanationResult {
  const teamAWR = (teamA.stats?.winRate || 0.5) * 100;
  const teamBWR = (teamB.stats?.winRate || 0.5) * 100;
  
  return {
    summary: `${teamA.name} (${teamAWR.toFixed(0)}% WR) vs ${teamB.name} (${teamBWR.toFixed(0)}% WR). ${prediction.winner} predicted to win.`,
    teamAAnalysis: `${teamA.name} has a ${teamAWR.toFixed(0)}% win rate with synergy score of ${(synergy.teamASynergy * 100).toFixed(0)}%.`,
    teamBAnalysis: `${teamB.name} has a ${teamBWR.toFixed(0)}% win rate with synergy score of ${(synergy.teamBSynergy * 100).toFixed(0)}%.`,
    keyFactors: ['Win Rate', 'Recent Form', 'Synergy', 'Elo Rating', 'Head-to-Head'],
    winConditions: [
      'Execute team strategy effectively',
      'Win early game objectives',
      'Maintain communication',
    ],
    recommendedStrategy: 'Focus on team strengths and capitalize on opponent weaknesses.',
    predictedScore: prediction.expectedScore,
    upsetPotential: assessUpsetPotential(features.upsetPotential),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatExplanationForAPI(result: ExplanationResult): Record<string, any> {
  return {
    summary: result.summary,
    analysis: {
      teamA: result.teamAAnalysis,
      teamB: result.teamBAnalysis,
    },
    factors: result.keyFactors,
    winConditions: result.winConditions,
    strategy: result.recommendedStrategy,
    prediction: {
      score: result.predictedScore,
      upsetPotential: result.upsetPotential,
    },
  };
}

export function extractKeyInsights(explanation: ExplanationResult): string[] {
  const insights: string[] = [];
  
  if (explanation.summary) insights.push(explanation.summary);
  insights.push(...explanation.keyFactors.slice(0, 3));
  insights.push(...explanation.winConditions.slice(0, 2));
  
  return insights;
}

export default {
  generateMatchupExplanation,
  formatExplanationForAPI,
  extractKeyInsights,
  DEFAULT_EXPLANATION_CONFIG,
};

