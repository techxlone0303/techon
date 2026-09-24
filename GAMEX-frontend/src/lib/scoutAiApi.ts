/**
 * ScoutAI API Fetcher & Types
 * Connects frontend to Express backend on port 3000
 */

export interface ScoutStrategyResponse {
  matchOverview: string;
  opponentAnalysis: string;
  winningStrategy: string;
  timeline: string[];
  coachingPoints: string[];
  meta?: {
    video?: {
      title: string;
      authorName: string;
      thumbnailUrl?: string;
    };
    model?: string;
    generatedAt?: string;
  };
}

export interface AnalyzePayload {
  team: string;
  url: string;
}

const BACKEND_URL = import.meta.env.VITE_SCOUT_BACKEND_URL || "http://localhost:3000";

/**
 * Posts URL & Team context to Express backend /api/analyze
 */
export async function analyzeMatchVOD(payload: AnalyzePayload): Promise<ScoutStrategyResponse> {
  const { team, url } = payload;

  if (!team || !team.trim()) {
    throw new Error("Team name is required.");
  }
  if (!url || !url.trim()) {
    throw new Error("YouTube VOD URL is required.");
  }

  const response = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      team: team.trim(),
      url: url.trim(),
    }),
  });

  if (!response.ok) {
    let errorDetail = `Backend returned HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || errorJson.error || errorDetail;
    } catch {
      // fallback to status text
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  const data: ScoutStrategyResponse = await response.json();

  // Validate the 5 required keys
  if (
    !data.matchOverview ||
    !data.opponentAnalysis ||
    !data.winningStrategy ||
    !Array.isArray(data.timeline) ||
    !Array.isArray(data.coachingPoints)
  ) {
    throw new Error("Received malformed strategy format from coaching engine.");
  }

  return data;
}
