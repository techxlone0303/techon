import axios from "axios";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

function timestamp(): string {
  const now = new Date();
  return now.toISOString().split("T")[1].split(".")[0];
}

let activeModel: string | null = null;

export async function getActiveLlmModel(): Promise<string> {
  if (process.env.OLLAMA_MODEL) return process.env.OLLAMA_MODEL;
  if (activeModel) return activeModel;
  try {
    const res = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    const models = res.data?.models || [];
    if (models.length > 0) {
      const match = models.find((m: any) =>
        m.name.includes("qwen") ||
        m.name.includes("nemotron") ||
        m.name.includes("gemma") ||
        m.name.includes("mistral")
      );
      const finalModel: string = match ? match.name : models[0].name;
      activeModel = finalModel;
      return finalModel;
    }
  } catch (err) {
    // fallback
  }
  return "qwen3.5:4b";
}

export async function callLLM(prompt: string, modelOverride?: string): Promise<string> {
  const model = modelOverride || await getActiveLlmModel();

  // 🔍 BEFORE REQUEST LOG (PROOF)
  console.log(
    `[OLLAMA][REQUEST] ${timestamp()} | model=${model} | prompt="${prompt.slice(
      0,
      50
    )}..."`
  );

  try {
    const res = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model,
        prompt,
        stream: false
      },
      {
        timeout: 120000
      }
    );

    const responseText: string = res.data?.response || "";

    // 🔍 AFTER RESPONSE LOG (PROOF)
    console.log(
      `[OLLAMA][RESPONSE] ${timestamp()} | response_length=${responseText.length}`
    );

    return responseText;
  } catch (err: any) {
    // 🔥 ERROR LOG (PROOF)
    if (
      err.code === "ECONNREFUSED" ||
      err.message?.includes("connect")
    ) {
      console.error(
        `[OLLAMA][ERROR] ${timestamp()} | Ollama unreachable at ${OLLAMA_BASE_URL}`
      );
    } else {
      console.error(
        `[OLLAMA][ERROR] ${timestamp()} | ${err.message}`
      );
    }
    throw err;
  }
}
