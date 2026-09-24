/**
 * ScoutIQ Intelligence Layer - Main Index
 * 
 * Optional intelligence layer that provides mathematically rigorous
 * matchup analysis using Elo, features, probability, and graph models.
 * 
 * Usage (optional - existing code continues to work):
 * 
 * import { analyzeMatchupIntelligently } from '../intelligence';
 * 
 * const result = await analyzeMatchupIntelligently(matchupData);
 * console.log(result.prediction);
 */

import { MatchupInput, MatchupIntelligence, PredictionResult, SynergyResult, MatchupFeatures, TeamIntelligence, PredictionFactor, IntelligenceError, ERROR_CODES } from './types';
import { getTeamRating, predictMatch, EloRating } from './rating/elo.engine';
import { extractTeamFeatures, extractMatchupFeatures, extractTrendFeatures } from './features/team.features';
import { calculateProbabilityBreakdown, generatePredictionResult, generatePredictionFactors, DEFAULT_PROBABILITY_CONFIG } from './probability/win.probability.engine';
import { calculateTeamSynergy, compareTeamSynergy } from './graph/team.graph';
import { createEnsemble, generateEnsemblePrediction, DEFAULT_ENSEMBLE_CONFIG } from './fusion/ensemble.engine';
import { calibratePrediction, recordPredictionOutcome, adaptCalibration } from './calibration/prediction.calibrator';
import { generateMatchupExplanation, formatExplanationForAPI } from './explain/llm.explainer';

// ============================================================================
// Main Intelligence Function
// ============================================================================

export interface IntelligenceOptions {
  useCalibration?: boolean;
  useExplanation?: boolean;
  useSynergy?: boolean;
  calibrationModel?: string;
}

export interface IntelligenceResult {
  teams: {
    teamA: TeamIntelligence;
    teamB: TeamIntelligence;
  };
  prediction: PredictionResult;
  features: MatchupFeatures;
  graph: SynergyResult;
  explanation?: Record<string, any>;
  meta: {
    modelsUsed: string[];
    calibration: {
      applied: boolean;
      adjustedProbability?: number;
      confidence: number;
    };
    latency: number;
  };
}

/**
 * Main entry point for intelligent matchup analysis
 * 
 * This function orchestrates all intelligence modules:
 * 1. Extract features from team data
 * 2. Calculate Elo ratings
 * 3. Compute graph synergy
 * 4. Generate ensemble probability
 * 5. Calibrate predictions
 * 6. Generate LLM explanation
 * 
 * @param input - Matchup input data
 * @param options - Intelligence options
 * @returns Complete intelligence analysis result
 */
export async function analyzeMatchupIntelligently(
  input: MatchupInput,
  options: IntelligenceOptions = {}
): Promise<IntelligenceResult> {
  const startTime = Date.now();
  
  const {
    useCalibration = true,
    useExplanation = true,
    useSynergy = true,
    calibrationModel = 'matchup',
  } = options;
  
  try {
    // Step 1: Extract team features
    console.log('[INTELLIGENCE] Extracting features...');
    const featuresA = extractTeamFeatures(input.teamA);
    const featuresB = extractTeamFeatures(input.teamB);
    const matchupFeatures = extractMatchupFeatures(input.teamA, input.teamB);
    
    // Step 2: Get Elo ratings
    console.log('[INTELLIGENCE] Calculating Elo ratings...');
    const eloA = getTeamRating(input.teamA.id);
    const eloB = getTeamRating(input.teamB.id);
    
    // Step 3: Calculate graph synergy
    console.log('[INTELLIGENCE] Computing synergy...');
    const synergyResult = useSynergy 
      ? calculateSynergy(input.playersA || [], input.playersB || [])
      : { teamASynergy: 0.5, teamBSynergy: 0.5, keySynergies: [], weakLinks: [] };
    
    // Step 4: Generate model predictions
    console.log('[INTELLIGENCE] Generating model predictions...');
    const modelPredictions = generateModelPredictions(
      input.teamA,
      input.teamB,
      input.teamA.id,
      input.teamB.id,
      synergyResult.teamASynergy,
      synergyResult.teamBSynergy,
      eloA,
      eloB
    );
    
    // Step 5: Create ensemble
    console.log('[INTELLIGENCE] Creating ensemble...');
    const ensemble = createEnsemble(modelPredictions, DEFAULT_ENSEMBLE_CONFIG);
    const prediction = generateEnsemblePrediction(
      ensemble,
      input.teamA.id,
      input.teamB.id,
      input.teamA.name,
      input.teamB.name
    );
    
    // Step 6: Apply calibration
    let calibratedProb = ensemble.finalProbability;
    let calibrationConfidence = 0.5;
    
    if (useCalibration) {
      console.log('[INTELLIGENCE] Applying calibration...');
      const calibration = calibratePrediction(calibratedProb, calibrationModel);
      calibratedProb = calibration.calibratedProbability;
      calibrationConfidence = calibration.confidence;
      
      // Adjust prediction if calibrated significantly
      if (Math.abs(calibratedProb - ensemble.finalProbability) > 0.05) {
        prediction.winProbability = calibratedProb;
        if (calibratedProb > 0.5) {
          prediction.winner = input.teamA.name;
        } else {
          prediction.winner = input.teamB.name;
        }
      }
    }
    
    // Step 7: Generate explanation
    let explanation: Record<string, any> | undefined;
    
    if (useExplanation) {
      console.log('[INTELLIGENCE] Generating explanation...');
      try {
        const explanationResult = await generateMatchupExplanation(
          input,
          prediction,
          matchupFeatures,
          synergyResult
        );
        explanation = formatExplanationForAPI(explanationResult);
      } catch (error) {
        console.warn('[INTELLIGENCE] Explanation generation failed:', error);
      }
    }
    
    // Build team intelligence
    const teamAIntel: TeamIntelligence = {
      id: input.teamA.id,
      name: input.teamA.name,
      eloRating: Math.round(eloA.rating),
      winRate: featuresA.winRate,
      kda: featuresA.kda,
      form: featuresA.formTrend === 'improving' ? 'hot' : featuresA.formTrend === 'declining' ? 'cold' : 'warm',
      strengths: identifyStrengths(featuresA),
      weaknesses: identifyWeaknesses(featuresA),
      keyPlayers: (input.playersA || []).slice(0, 3).map(p => p.nickname),
    };
    
    const teamBIntel: TeamIntelligence = {
      id: input.teamB.id,
      name: input.teamB.name,
      eloRating: Math.round(eloB.rating),
      winRate: featuresB.winRate,
      kda: featuresB.kda,
      form: featuresB.formTrend === 'improving' ? 'hot' : featuresB.formTrend === 'declining' ? 'cold' : 'warm',
      strengths: identifyStrengths(featuresB),
      weaknesses: identifyWeaknesses(featuresB),
      keyPlayers: (input.playersB || []).slice(0, 3).map(p => p.nickname),
    };
    
    const latency = Date.now() - startTime;
    console.log('[INTELLIGENCE] Analysis complete in ' + latency + 'ms');
    
    return {
      teams: {
        teamA: teamAIntel,
        teamB: teamBIntel,
      },
      prediction,
      features: matchupFeatures,
      graph: synergyResult,
      explanation,
      meta: {
        modelsUsed: ['elo', 'stats', 'trend', 'graph'],
        calibration: {
          applied: useCalibration,
          adjustedProbability: calibratedProb !== ensemble.finalProbability ? calibratedProb : undefined,
          confidence: calibrationConfidence,
        },
        latency,
      },
    };
    
  } catch (error) {
    console.error('[INTELLIGENCE] Analysis failed:', error);
    
    throw new IntelligenceError(
      'Matchup analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      ERROR_CODES.MODEL_FAILURE
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateModelPredictions(
  teamA: any,
  teamB: any,
  teamAId: string,
  teamBId: string,
  synergyA: number,
  synergyB: number,
  eloA: EloRating,
  eloB: EloRating
): Array<{ model: string; probability: number; confidence: number; factors: Record<string, number> }> {
  const wrA = teamA.stats?.winRate || 0.5;
  const wrB = teamB.stats?.winRate || 0.5;
  
  // Stats model
  const statsProb = wrA / (wrA + wrB);
  
  // Elo model
  const eloProb = 1 / (1 + Math.pow(10, (eloB.rating - eloA.rating) / 400));
  
  // Trend model (simplified)
  const trendProb = 0.5 + (wrA - 0.5) * 0.3;
  
  // Graph model
  const graphProb = 0.5 + (synergyA - synergyB) * 0.3;
  
  return [
    {
      model: 'stats',
      probability: statsProb,
      confidence: 0.7,
      factors: { winRateDiff: wrA - wrB },
    },
    {
      model: 'elo',
      probability: eloProb,
      confidence: 0.75,
      factors: { ratingDiff: eloA.rating - eloB.rating },
    },
    {
      model: 'trend',
      probability: trendProb,
      confidence: 0.6,
      factors: { formDiff: 0 },
    },
    {
      model: 'graph',
      probability: graphProb,
      confidence: 0.55,
      factors: { synergyDiff: synergyA - synergyB },
    },
  ];
}

function calculateSynergy(
  playersA: any[],
  playersB: any[]
): SynergyResult {
  // Simplified synergy calculation
  const calcTeamSynergy = (players: any[]) => {
    if (players.length < 2) return 0.5;
    
    // Base synergy on KDA similarity
    const kdas = players.map(p => p.stats?.kills || 2);
    const avgKDA = kdas.reduce((a, b) => a + b, 0) / kdas.length;
    const variance = kdas.reduce((sum, k) => sum + Math.pow(k - avgKDA, 2), 0) / kdas.length;
    
    // Lower variance = better synergy
    return Math.max(0.3, Math.min(0.9, 0.6 - variance * 0.1));
  };
  
  return {
    teamASynergy: calcTeamSynergy(playersA),
    teamBSynergy: calcTeamSynergy(playersB),
    keySynergies: [],
    weakLinks: [],
  };
}

function identifyStrengths(features: any): string[] {
  const strengths: string[] = [];
  
  if (features.winRate > 0.55) strengths.push('Strong win rate');
  if (features.kda > 3) strengths.push('High KDA');
  if (features.formTrend === 'improving') strengths.push('Improving form');
  if (features.comebackAbility > 0.6) strengths.push('Good comeback ability');
  if (features.earlyGameStrength > 0.6) strengths.push('Strong early game');
  
  return strengths.slice(0, 4);
}

function identifyWeaknesses(features: any): string[] {
  const weaknesses: string[] = [];
  
  if (features.winRate < 0.45) weaknesses.push('Struggling win rate');
  if (features.kda < 2) weaknesses.push('Low KDA');
  if (features.formTrend === 'declining') weaknesses.push('Declining form');
  if (features.comebackAbility < 0.4) weaknesses.push('Poor comeback ability');
  if (features.lateGameStrength < 0.4) weaknesses.push('Weak late game');
  
  return weaknesses.slice(0, 4);
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function quickPredict(
  teamAId: string,
  teamBId: string,
  teamAData: any,
  teamBData: any
): Promise<PredictionResult> {
  const input: MatchupInput = {
    teamA: { id: teamAId, name: teamAData.name, stats: teamAData.stats },
    teamB: { id: teamBId, name: teamBData.name, stats: teamBData.stats },
  };
  
  const result = await analyzeMatchupIntelligently(input, {
    useExplanation: false,
    useSynergy: false,
  });
  
  return result.prediction;
}

export function recordMatchOutcome(
  predictedProb: number,
  actualWinner: 'A' | 'B',
  model: string = 'matchup'
): void {
  const actual = actualWinner === 'A' ? 1 : 0;
  recordPredictionOutcome(predictedProb, actual, model);
}

export { MatchupInput, MatchupIntelligence, PredictionResult, SynergyResult, MatchupFeatures, TeamIntelligence, PredictionFactor, IntelligenceError, ERROR_CODES };

export default {
  analyzeMatchupIntelligently,
  quickPredict,
  recordMatchOutcome,
};

