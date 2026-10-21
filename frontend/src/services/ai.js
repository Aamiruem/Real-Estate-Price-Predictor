import axios from "axios";

const AI_API_URL =
  import.meta.env.VITE_RAG_API_URL ||
  (import.meta.env.DEV ? "/ai" : "http://localhost:8002");

const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 240000,
});

export const getAiHealth = async () => {
  const response = await aiApi.get("/health");
  return response.data;
};

/**
 * Streams the agent's answer. `onEvent` receives each NDJSON event:
 * step | sources | data | token | done | error.
 */
export async function streamAiAssistant(message, history, onEvent, signal) {
  const response = await fetch(`${AI_API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    let detail = `The assistant service returned HTTP ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // Keep the generic message when the body isn't JSON.
    }
    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line));
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer));
}
