/**
 * ScoutIQ - Ollama LLM Client
 * 
 * Local LLM integration for generating AI-powered esports intelligence
 * Endpoint: http://localhost:11434
 */

import axios from "axios";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:4b";

let discoveredModel: string | null = null;

export async function getBestOllamaModel(preferred?: string): Promise<string> {
  if (preferred && preferred !== "mistral" && preferred !== "qwen3.5:4b") {
    return preferred;
  }
  if (process.env.OLLAMA_MODEL && process.env.OLLAMA_MODEL !== "mistral") {
    return process.env.OLLAMA_MODEL;
  }
  if (discoveredModel) return discoveredModel;

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    const models = response.data?.models || [];
    if (models.length > 0) {
      const match = models.find((m: any) =>
        (preferred && m.name.includes(preferred)) ||
        m.name.includes("qwen") ||
        m.name.includes("nemotron") ||
        m.name.includes("gemma") ||
        m.name.includes("mistral")
      );
      const finalModel: string = match ? match.name : models[0].name;
      discoveredModel = finalModel;
      return finalModel;
    }
  } catch (err) {
    // Ollama not reachable or timeout
  }
  return DEFAULT_MODEL;
}

export interface OllamaGenerateOptions {
  prompt: string;
  model?: string;
  stream?: boolean;
  format?: "json" | "text";
  temperature?: number;
  maxTokens?: number;
}

export interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate text using Ollama LLM
 */
export async function ollamaGenerate(options: OllamaGenerateOptions): Promise<string>;
export async function ollamaGenerate(prompt: string, model?: string): Promise<string>;
export async function ollamaGenerate(
  promptOrOptions: string | OllamaGenerateOptions,
  model?: string
): Promise<string> {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  
  let prompt: string;
  let modelName: string;
  let stream: boolean;
  let format: "json" | "text" | undefined;
  let temperature: number | undefined;
  let maxTokens: number | undefined;

  if (typeof promptOrOptions === 'string') {
    prompt = promptOrOptions;
    modelName = await getBestOllamaModel(model);
    stream = false;
  } else {
    prompt = promptOrOptions.prompt;
    modelName = await getBestOllamaModel(promptOrOptions.model);
    stream = promptOrOptions.stream || false;
    format = promptOrOptions.format || undefined;
    temperature = promptOrOptions.temperature || undefined;
    maxTokens = promptOrOptions.maxTokens || undefined;
  }

  try {
    console.log(`[OLLAMA REQUEST] ${timestamp} | model=${modelName} | prompt_length=${prompt.length}`);

    const requestBody: any = {
      model: modelName,
      prompt,
      stream,
    };

    if (format) requestBody.format = format;
    requestBody.options = {
      num_predict: maxTokens || 120,
      temperature: temperature !== undefined ? temperature : 0.7,
    };

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      requestBody,
      {
        timeout: 45000,
      }
    );

    const responseText: string = response.data?.response || "";
    console.log(`[OLLAMA RESPONSE] ${timestamp} | response_length=${responseText.length}`);

    return responseText;
  } catch (err: any) {
    const errorMessage = err.code === "ECONNREFUSED" || err.message?.includes("connect")
      ? `Ollama unreachable at ${OLLAMA_BASE_URL}`
      : err.message;
    
    console.error(`[OLLAMA ERROR] ${timestamp} | ${errorMessage}`);
    throw new Error(`Ollama generation failed: ${errorMessage}`);
  }
}

/**
 * Generate JSON response using Ollama
 */
export async function ollamaGenerateJSON<T = any>(prompt: string, model?: string): Promise<T> {
  const responseText = await ollamaGenerate({
    prompt,
    model,
    format: "json",
  });

  try {
    // Try to parse the response as JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    // If no JSON found, try parsing the entire response
    return JSON.parse(responseText) as T;
  } catch (parseError) {
    console.error("[OLLAMA JSON PARSE ERROR]", parseError);
    throw new Error("Failed to parse Ollama JSON response");
  }
}

/**
 * Stream generate using Ollama (for real-time responses)
 */
export async function* ollamaStreamGenerate(
  prompt: string,
  model?: string
): AsyncGenerator<string> {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const modelName = model || DEFAULT_MODEL;

  try {
    console.log(`[OLLAMA STREAM REQUEST] ${timestamp} | model=${modelName}`);

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: modelName,
        prompt,
        stream: true,
      },
      {
        timeout: 180000,
        responseType: "stream",
      }
    );

    let buffer = "";
    
    for await (const chunk of response.data) {
      const text = chunk.toString();
      buffer += text;
      
      // Parse individual JSON objects from the stream
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              yield parsed.response;
            }
            if (parsed.done) {
              console.log(`[OLLAMA STREAM COMPLETE] ${timestamp}`);
              return;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } catch (err: any) {
    const errorMessage = err.code === "ECONNREFUSED" || err.message?.includes("connect")
      ? `Ollama unreachable at ${OLLAMA_BASE_URL}`
      : err.message;
    
    console.error(`[OLLAMA STREAM ERROR] ${timestamp} | ${errorMessage}`);
    throw new Error(`Ollama stream failed: ${errorMessage}`);
  }
}

/**
 * Check if Ollama is available
 */
export async function ollamaCheckHealth(): Promise<{
  available: boolean;
  model: string;
  error?: string;
}> {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const models = response.data?.models || [];
    const activeModel = await getBestOllamaModel();
    return {
      available: true,
      model: activeModel,
    };
  } catch (err: any) {
    return {
      available: false,
      model: DEFAULT_MODEL,
      error: err.message,
    };
  }
}

/**
 * Pull a model (download if not available)
 */
export async function ollamaPullModel(model?: string): Promise<{ success: boolean; message: string }> {
  const modelName = model || DEFAULT_MODEL;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

  try {
    console.log(`[OLLAMA PULL] ${timestamp} | model=${modelName}`);

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/pull`,
      { name: modelName },
      { timeout: 300000 } // 5 minutes for model download
    );

    return {
      success: true,
      message: `Model ${modelName} pulled successfully`,
    };
  } catch (err: any) {
    console.error(`[OLLAMA PULL ERROR] ${timestamp} | ${err.message}`);
    return {
      success: false,
      message: `Failed to pull model: ${err.message}`,
    };
  }
}

// ============================================================================
// Helper: Generate Scouting Report
// ============================================================================

export interface ScoutingReportPrompt {
  teamName: string;
  opponentName: string;
  teamStats: Record<string, any>;
  opponentStats: Record<string, any>;
  keyPlayers: Array<{ name: string; role: string; stats: Record<string, any> }>;
  recentPerformance: Record<string, any>;
  headToHead?: Record<string, any>;
}

export async function generateScoutingReport(prompt: ScoutingReportPrompt): Promise<string> {
  const fullPrompt = `
You are a professional esports analyst and scout. Generate a detailed scouting report for the following matchup.

MATCHUP:
${prompt.teamName} vs ${prompt.opponentName}

TEAM STATISTICS:
${JSON.stringify(prompt.teamStats, null, 2)}

OPPONENT STATISTICS:
${JSON.stringify(prompt.opponentStats, null, 2)}

KEY PLAYERS:
${prompt.keyPlayers.map(p => `- ${p.name} (${p.role}): ${JSON.stringify(p.stats)}`).join('\n')}

RECENT PERFORMANCE:
${JSON.stringify(prompt.recentPerformance, null, 2)}

${prompt.headToHead ? `HEAD-TO-HEAD:\n${JSON.stringify(prompt.headToHead, null, 2)}` : ""}

Generate a comprehensive scouting report in JSON format:
{
  "summary": "2-3 sentence matchup overview",
  "teamAnalysis": {
    "strengths": ["3-5 key strengths"],
    "weaknesses": ["3-4 areas for improvement"],
    "playstyle": "description of team's playstyle"
  },
  "opponentAnalysis": {
    "strengths": ["3-5 key strengths"],
    "weaknesses": ["3-4 areas for improvement"],
    "playstyle": "description of opponent's playstyle"
  },
  "keyMatchups": [
    {"playerA": "name", "playerB": "name", "prediction": "description"}
  ],
  "winConditions": ["3-4 conditions for team to win"],
  "recommendedStrategy": "strategic recommendations",
  "predictedScore": "e.g., 2-1",
  "confidence": 0.0-1.0
}

Focus on actionable intelligence for coaching staff.
JSON Output:
`;

  return ollamaGenerate({
    prompt: fullPrompt,
    format: "json",
    temperature: 0.7,
  });
}

// ============================================================================
// Auto-Initialization
// ============================================================================

let ollamaInitialized = false;

export async function initializeOllama(): Promise<void> {
  if (ollamaInitialized) {
    console.log("[OLLAMA] Already initialized");
    return;
  }

  console.log("[OLLAMA] Checking connection...");
  const health = await ollamaCheckHealth();
  
  if (health.available) {
    console.log(`[OLLAMA] Connected successfully | model=${health.model}`);
    ollamaInitialized = true;
  } else {
    console.warn(`[OLLAMA] Not available: ${health.error}`);
    console.warn("[OLLAMA] Run 'ollama pull mistral' to enable AI features");
  }
}

export default {
  ollamaGenerate,
  ollamaGenerateJSON,
  ollamaStreamGenerate,
  ollamaCheckHealth,
  ollamaPullModel,
  generateScoutingReport,
  initialize: initializeOllama,
};

