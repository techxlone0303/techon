export { normalizeTeam, normalizeSeries, normalizeStats, TeamProfile, SeriesProfile, StatsProfile, RawGridTeam, RawGridSeries, RawGridStats } from './data.normalizer';
export { MatchHistoryStore, matchHistoryStore, StoredMatch, TeamTrend, HeadToHead } from './history.engine';
export { extractFeatures, TeamFeatures, RawTeamStats, normalizeFeatures, computeFeatureVector } from './features.engine';
export { buildFeatureVector, buildFeatureVectorFromRaw, FeatureVector, FeatureInput } from './features.v2.engine';
export { analyzeMatchup, MatchupPrediction, TeamFeaturesInput } from './matchup.engine';
export { predictMatch, PredictionResult } from './prediction.engine';
export { explainPrediction, Explanation } from './explain.engine';
export { buildScoutPrompt, ScoutPromptContext, ScoutPromptOutput } from './scout.prompt';
export { buildV2Prompt, PromptContext, V2PromptResult } from './prompt.v2.builder';
export { ScoutMemory, scoutMemory, Insight, TeamMemory, MatchupMemory } from './rag.engine';
export { buildScoutIntegration, ScoutIntegrationInput, ScoutIntegrationResult } from './scout.integration';
export { runV2Scout, V2ScoutInput, V2ScoutOutput, addMatchToHistory, storeTeamInsight, getTeamMemory, searchMemory } from './v2.orchestrator';

// Truth Layer exports
export { 
  assertValidTeamId, 
  assertValidResolvedTeam, 
  isValidTeamId, 
  isTeamName, 
  createFallbackTeam,
  ResolvedTeam,
  ResolutionError,
  TRUTH_LAYER_CONFIG 
} from './truth.layer';

