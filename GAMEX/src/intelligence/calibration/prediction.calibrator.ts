/**
 * ScoutIQ Intelligence Layer - Prediction Calibrator
 * 
 * Adjusts predictions based on historical error patterns.
 * Uses Platt scaling and isotonic regression concepts.
 */

import { CalibrationResult, PredictionFactor } from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CalibrationConfig {
  learningRate: number;
  momentum: number;
  maxIterations: number;
  minSamples: number;
}

export interface CalibrationData {
  predictedProbability: number;
  actualOutcome: number; // 0 or 1
  timestamp: Date;
}

export interface HistoricalError {
  model: string;
  absoluteError: number;
  squaredError: number;
  bias: number;
  count: number;
}

export interface CalibrationReport {
  overallBias: number;
  mae: number;
  rmse: number;
  calibrationCurve: Array<{ predicted: number; actual: number }>;
  recommendations: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  learningRate: 0.01,
  momentum: 0.9,
  maxIterations: 100,
  minSamples: 10,
};

// ============================================================================
// In-Memory Calibration Storage
// ============================================================================

const calibrationData: Map<string, CalibrationData[]> = new Map();
const modelErrors: Map<string, HistoricalError> = new Map();

// ============================================================================
// Calibration Functions
// ============================================================================

export function calibratePrediction(
  rawProbability: number,
  model: string = 'default',
  config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG
): CalibrationResult {
  const history = calibrationData.get(model) || [];
  
  // If not enough data, return raw probability
  if (history.length < config.minSamples) {
    return {
      rawProbability,
      calibratedProbability: rawProbability,
      adjustment: 0,
      confidence: 0.5,
    };
  }
  
  // Calculate bias from history
  const bias = calculateBias(history);
  
  // Apply Platt-like scaling: P_calibrated = 1 / (1 + exp(-(a * logit(P_raw) + b)))
  // Simplified: adjust towards 0.5 based on bias
  const adjustedProb = rawProbability - bias * 0.5;
  const calibrated = Math.max(0.1, Math.min(0.9, adjustedProb));
  
  // Calculate confidence based on sample size and consistency
  const consistency = calculateConsistency(history);
  const confidence = Math.min(0.9, 0.4 + history.length * 0.02 + consistency * 0.3);
  
  return {
    rawProbability,
    calibratedProbability: Math.round(calibrated * 1000) / 1000,
    adjustment: Math.round((calibrated - rawProbability) * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

export function recordPredictionOutcome(
  predictedProbability: number,
  actualOutcome: number,
  model: string = 'default'
): void {
  const data: CalibrationData = {
    predictedProbability,
    actualOutcome,
    timestamp: new Date(),
  };
  
  const history = calibrationData.get(model) || [];
  history.push(data);
  
  // Keep only last 1000 samples
  if (history.length > 1000) {
    history.shift();
  }
  
  calibrationData.set(model, history);
  
  // Update error tracking
  updateModelError(model, predictedProbability, actualOutcome);
}

function calculateBias(history: CalibrationData[]): number {
  // Calculate average difference between predicted and actual
  const sum = history.reduce((acc, d) => {
    const pred = d.predictedProbability;
    const actual = d.actualOutcome;
    return acc + (actual - pred);
  }, 0);
  
  return sum / history.length;
}

function calculateConsistency(history: CalibrationData[]): number {
  // Calculate how consistent predictions are with outcomes
  // High consistency = predictions cluster around actual outcomes
  const correct = history.filter(d => {
    const pred = d.predictedProbability;
    const actual = d.actualOutcome;
    return (pred > 0.5 && actual === 1) || (pred <= 0.5 && actual === 0);
  }).length;
  
  return correct / history.length;
}

function updateModelError(
  model: string,
  predicted: number,
  actual: number
): void {
  const existing = modelErrors.get(model) || {
    model,
    absoluteError: 0,
    squaredError: 0,
    bias: 0,
    count: 0,
  };
  
  const absError = Math.abs(actual - predicted);
  const sqError = Math.pow(actual - predicted, 2);
  const bias = actual - predicted;
  
  existing.absoluteError = (existing.absoluteError * existing.count + absError) / (existing.count + 1);
  existing.squaredError = (existing.squaredError * existing.count + sqError) / (existing.count + 1);
  existing.bias = (existing.bias * existing.count + bias) / (existing.count + 1);
  existing.count += 1;
  
  modelErrors.set(model, existing);
}

// ============================================================================
// Calibration Analysis
// ============================================================================

export function generateCalibrationReport(model: string = 'default'): CalibrationReport {
  const history = calibrationData.get(model) || [];
  
  if (history.length === 0) {
    return {
      overallBias: 0,
      mae: 0,
      rmse: 0,
      calibrationCurve: [],
      recommendations: ['Collect more prediction data for calibration'],
    };
  }
  
  const bias = calculateBias(history);
  const mae = calculateMAE(history);
  const rmse = calculateRMSE(history);
  const curve = generateCalibrationCurve(history);
  const recommendations = generateRecommendations(bias, mae, rmse, history.length);
  
  return {
    overallBias: Math.round(bias * 1000) / 1000,
    mae: Math.round(mae * 1000) / 1000,
    rmse: Math.round(rmse * 1000) / 1000,
    calibrationCurve: curve,
    recommendations,
  };
}

function calculateMAE(history: CalibrationData[]): number {
  const sum = history.reduce((acc, d) => acc + Math.abs(d.actualOutcome - d.predictedProbability), 0);
  return sum / history.length;
}

function calculateRMSE(history: CalibrationData[]): number {
  const sum = history.reduce((acc, d) => acc + Math.pow(d.actualOutcome - d.predictedProbability, 2), 0);
  return Math.sqrt(sum / history.length);
}

function generateCalibrationCurve(history: CalibrationData[]): Array<{ predicted: number; actual: number }> {
  // Bin predictions and calculate actual rate for each bin
  const bins: Map<number, { predicted: number; actual: number; count: number }> = new Map();
  
  for (const d of history) {
    // Round to nearest 0.1
    const bin = Math.round(d.predictedProbability * 10) / 10;
    const existing = bins.get(bin) || { predicted: bin, actual: 0, count: 0 };
    existing.actual = (existing.actual * existing.count + d.actualOutcome) / (existing.count + 1);
    existing.count += 1;
    bins.set(bin, existing);
  }
  
  return Array.from(bins.values())
    .filter(b => b.count >= 3) // Only bins with enough samples
    .sort((a, b) => a.predicted - b.predicted);
}

function generateRecommendations(
  bias: number,
  mae: number,
  rmse: number,
  sampleCount: number
): string[] {
  const recommendations: string[] = [];
  
  if (bias > 0.05) {
    recommendations.push('Model tends to underestimate outcomes (positive bias)');
  } else if (bias < -0.05) {
    recommendations.push('Model tends to overestimate outcomes (negative bias)');
  } else {
    recommendations.push('Model bias is within acceptable range');
  }
  
  if (mae > 0.15) {
    recommendations.push('High mean absolute error - consider reducing model complexity');
  }
  
  if (sampleCount < 50) {
    recommendations.push('Collect more samples for better calibration');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Model calibration is performing well');
  }
  
  return recommendations;
}

// ============================================================================
// Adaptive Calibration
// ============================================================================

export function adaptCalibration(
  rawProbability: number,
  model: string,
  recentWeight: number = 0.7,
  config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG
): number {
  const history = calibrationData.get(model) || [];
  
  if (history.length < config.minSamples) {
    return rawProbability;
  }
  
  // Split into recent and older samples
  const recentCount = Math.floor(history.length * (1 - recentWeight));
  const recent = history.slice(-recentCount);
  const older = history.slice(0, -recentCount);
  
  if (recent.length === 0) {
    return calibratePrediction(rawProbability, model, config).calibratedProbability;
  }
  
  // Calculate biases separately
  const recentBias = calculateBias(recent);
  const olderBias = calculateBias(older);
  
  // Weighted combination of biases
  const combinedBias = recentBias * recentWeight + olderBias * (1 - recentWeight);
  
  // Apply calibration
  const calibrated = rawProbability - combinedBias * 0.5;
  return Math.max(0.1, Math.min(0.9, calibrated));
}

// ============================================================================
// Utility Functions
// ============================================================================

export function resetCalibrationData(model?: string): void {
  if (model) {
    calibrationData.delete(model);
    modelErrors.delete(model);
  } else {
    calibrationData.clear();
    modelErrors.clear();
  }
}

export function getCalibrationStats(): {
  models: string[];
  sampleCounts: Record<string, number>;
} {
  const sampleCounts: Record<string, number> = {};
  
  for (const [model, data] of calibrationData.entries()) {
    sampleCounts[model] = data.length;
  }
  
  return {
    models: Array.from(calibrationData.keys()),
    sampleCounts,
  };
}

export default {
  calibratePrediction,
  recordPredictionOutcome,
  generateCalibrationReport,
  adaptCalibration,
  resetCalibrationData,
  getCalibrationStats,
  DEFAULT_CALIBRATION_CONFIG,
};

