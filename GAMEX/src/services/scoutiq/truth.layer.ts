/**
 * ScoutIQ Truth Layer - Single Source of Truth for Team Resolution
 * 
 * This module provides the authoritative resolution pipeline:
 * INPUT (team name) → ResolvedTeam → Stats API / Series API / AI Engine
 * 
 * All downstream modules MUST use this layer for team resolution.
 */

import { CachedTeam } from "../../grid/central/teamCache.service";

// ============================================================================
// Truth Layer Types
// ============================================================================

export type TeamSource = "GRID" | "ALIAS" | "CACHE";

export interface ResolvedTeam {
  /** GRID team ID (numeric string) */
  id: string;
  /** Official team name from GRID */
  name: string;
  /** Source of resolution */
  source: TeamSource;
  /** Confidence score (0-1) */
  confidence: number;
  /** Match type for debugging */
  matchType: "exact" | "shortened" | "partial" | "alias";
  /** Original input that was resolved */
  originalInput: string;
}

export interface ResolutionError extends Error {
  code: "NOT_FOUND" | "INVALID_ID" | "AMBIGUOUS" | "RESOLUTION_FAILED";
  inputName: string;
  suggestions?: string[];
}

// ============================================================================
// Guard Functions
// ============================================================================

/**
 * VALIDATION GUARD: Ensure teamId is a valid GRID ID
 * 
 * GRID team IDs are numeric strings (e.g., "79", "96").
 * This guard MUST be called before any Stats API call.
 * 
 * @throws ResolutionError if teamId is invalid
 */
export function assertValidTeamId(teamId: string): void {
  if (!teamId || typeof teamId !== "string") {
    throw new ResolutionError(
      `Invalid team ID: must be a non-empty string`,
      "INVALID_ID",
      teamId
    );
  }

  // GRID team IDs are numeric strings
  const numericRegex = /^\d+$/;
  
  if (!numericRegex.test(teamId)) {
    console.error(`[TRUTH LAYER] Invalid team ID: "${teamId}" (not numeric)`);
    throw new ResolutionError(
      `Invalid GRID team ID: "${teamId}". Team IDs must be numeric strings like "79" or "96".`,
      "INVALID_ID",
      teamId
    );
  }

  // Additional validation: ID should not be too long (GRID IDs are typically 2-6 digits)
  if (teamId.length > 10) {
    console.warn(`[TRUTH LAYER] Suspiciously long team ID: "${teamId}"`);
    throw new ResolutionError(
      `Invalid GRID team ID: "${teamId}" appears to be malformed`,
      "INVALID_ID",
      teamId
    );
  }
}

/**
 * Validate a ResolvedTeam object
 * Ensures all downstream operations receive valid data
 */
export function assertValidResolvedTeam(resolved: ResolvedTeam): void {
  if (!resolved || !resolved.id || !resolved.name) {
    throw new ResolutionError(
      "Invalid resolved team: missing required fields",
      "RESOLUTION_FAILED",
      resolved?.originalInput
    );
  }

  assertValidTeamId(resolved.id);

  if (resolved.confidence < 0) {
    throw new ResolutionError(
      "Invalid resolved team: confidence cannot be negative",
      "RESOLUTION_FAILED",
      resolved.originalInput
    );
  }
}

/**
 * Check if a string looks like a valid GRID team ID
 */
export function isValidTeamId(teamId: string): boolean {
  if (!teamId || typeof teamId !== "string") {
    return false;
  }
  return /^\d+$/.test(teamId) && teamId.length <= 10;
}

/**
 * Check if a string looks like a team name (not an ID)
 */
export function isTeamName(name: string): boolean {
  if (!name || typeof name !== "string") {
    return false;
  }
  // If it's all digits, it's likely an ID, not a name
  return !/^\d+$/.test(name);
}

// ============================================================================
// Resolution Error Class
// ============================================================================

export class ResolutionError extends Error {
  code: "NOT_FOUND" | "INVALID_ID" | "AMBIGUOUS" | "RESOLUTION_FAILED";
  inputName: string;
  suggestions?: string[];

  constructor(
    message: string,
    code: ResolutionError["code"],
    inputName: string,
    suggestions?: string[]
  ) {
    super(message);
    this.name = "ResolutionError";
    this.code = code;
    this.inputName = inputName;
    this.suggestions = suggestions;
  }
}

// ============================================================================
// Default Team Fallback (for graceful degradation)
// ============================================================================

export const DEFAULT_TEAM_FALLBACK: ResolvedTeam = {
  id: "0",
  name: "Unknown Team",
  source: "CACHE",
  confidence: 0,
  matchType: "partial",
  originalInput: "unknown",
};

/**
 * Create a controlled fallback response when resolution fails
 */
export function createFallbackTeam(inputName: string): ResolvedTeam {
  return {
    ...DEFAULT_TEAM_FALLBACK,
    originalInput: inputName,
  };
}

// ============================================================================
// Export Truth Layer Configuration
// ============================================================================

export const TRUTH_LAYER_CONFIG = {
  /** Minimum confidence threshold for resolution */
  MIN_CONFIDENCE: 0.3,
  /** Maximum retry attempts for resolution */
  MAX_RETRIES: 2,
  /** Cache TTL for resolved teams (ms) */
  CACHE_TTL: 5 * 60 * 1000,
};

export default {
  ResolutionError,
  assertValidTeamId,
  assertValidResolvedTeam,
  isValidTeamId,
  isTeamName,
  createFallbackTeam,
  TRUTH_LAYER_CONFIG,
};

