import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/*
 * The agent runs on any model: pick a provider and a model in Agent → Settings.
 * Anthropic, OpenAI and Google use their own SDKs; everything else speaks the
 * OpenAI-compatible API (OpenRouter alone reaches hundreds of models, and
 * Ollama runs models on your own machine).
 */

export type ProviderId =
  | "anthropic"
  | "openai"
  | "google"
  | "openrouter"
  | "groq"
  | "deepseek"
  | "xai"
  | "mistral"
  | "together"
  | "ollama"
  | "custom";

type Provider = { label: string; env?: string; baseURL?: string; keyless?: boolean; example: string };

export const PROVIDERS: Record<ProviderId, Provider> = {
  anthropic: { label: "Anthropic (Claude)", env: "ANTHROPIC_API_KEY", example: "claude-opus-5-5" },
  openai: { label: "OpenAI", env: "OPENAI_API_KEY", example: "gpt-5" },
  google: { label: "Google (Gemini)", env: "GEMINI_API_KEY", example: "gemini-2.5-pro" },
  openrouter: {
    label: "OpenRouter (hundreds of models)",
    env: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    example: "anthropic/claude-opus-5-5",
  },
  groq: { label: "Groq", env: "GROQ_API_KEY", baseURL: "https://api.groq.com/openai/v1", example: "openai/gpt-oss-120b" },
  deepseek: { label: "DeepSeek", env: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com", example: "deepseek-v4-flash" },
  xai: { label: "xAI (Grok)", env: "XAI_API_KEY", baseURL: "https://api.x.ai/v1", example: "grok-4" },
  mistral: { label: "Mistral", env: "MISTRAL_API_KEY", baseURL: "https://api.mistral.ai/v1", example: "mistral-large-latest" },
  together: { label: "Together AI", env: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1", example: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  ollama: { label: "Ollama (your own machine)", baseURL: "http://localhost:11434/v1", keyless: true, example: "llama3.3" },
  custom: { label: "Any OpenAI-compatible service", env: "AGENT_API_KEY", example: "your-model-id" },
};

export const DEFAULT_PROVIDER: ProviderId = "anthropic";
export const DEFAULT_MODEL = "claude-opus-5-5";
export const DEFAULT_FAST_MODEL = "claude-haiku-4-5-20251001";

export type ModelSettings = { provider: ProviderId; model: string; apiKey: string; baseURL?: string | null };

/** The key to use: the one saved in the admin, else the provider's environment variable. */
export function resolveKey(provider: ProviderId, saved: string): string {
  if (saved) return saved;
  const env = PROVIDERS[provider]?.env;
  const fallback = provider === "google" ? process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY : undefined;
  return (env && process.env[env]) || fallback || "";
}

export function missingSetup(s: ModelSettings): string | null {
  const p = PROVIDERS[s.provider];
  if (!p) return `Unknown provider "${s.provider}".`;
  if (!s.model.trim()) return "Choose a model in Agent → Settings.";
  if (!p.keyless && !resolveKey(s.provider, s.apiKey)) {
    return `Add an API key for ${p.label} in Agent → Settings${p.env ? ` (or set ${p.env})` : ""}.`;
  }
  if (s.provider === "custom" && !s.baseURL) return "Add the service's address (base URL) in Agent → Settings.";
  return null;
}

export function buildModel(s: ModelSettings): LanguageModel {
  const apiKey = resolveKey(s.provider, s.apiKey) || undefined;
  const model = s.model.trim();
  switch (s.provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "deepseek":
      // DeepSeek's own adapter handles its thinking mode between tool calls.
      return createDeepSeek({ apiKey, ...(s.baseURL?.trim() ? { baseURL: s.baseURL.trim().replace(/\/$/, "") } : {}) })(model);
    default: {
      const baseURL = (s.baseURL?.trim() || PROVIDERS[s.provider]?.baseURL || "").replace(/\/$/, "");
      return createOpenAICompatible({ name: s.provider, baseURL, apiKey, includeUsage: true }).chatModel(model);
    }
  }
}

/* ---------- What models a key can use ---------- */

export type ModelInfo = { id: string; label?: string };

/**
 * The models the provider offers this key, read live from the provider (so
 * new models appear without an update here). `purpose: "voice"` keeps only
 * Gemini models that can hold a live voice conversation.
 */
export type ModelPurpose = "text" | "voice" | "vision" | "image";

export async function listModels(s: { provider: ProviderId; apiKey: string; baseURL?: string | null }, purpose: ModelPurpose = "text"): Promise<ModelInfo[]> {
  const key = resolveKey(s.provider, s.apiKey);
  const timeout = AbortSignal.timeout(15_000);
  const fail = async (res: Response) => {
    const body = await res.text().catch(() => "");
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error?.message || j.message || body;
    } catch {
      // plain text
    }
    throw new Error(`${res.status}: ${String(msg).slice(0, 300)}`);
  };

  if (s.provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: timeout,
    });
    if (!res.ok) await fail(res);
    const j = (await res.json()) as { data?: { id: string; display_name?: string }[] };
    return (j.data ?? []).map((m) => ({ id: m.id, label: m.display_name }));
  }

  if (s.provider === "google") {
    const base = (process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
    const out: ModelInfo[] = [];
    let page = "";
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${base}/v1beta/models?pageSize=200${page ? `&pageToken=${page}` : ""}`, {
        headers: { "x-goog-api-key": key },
        signal: timeout,
      });
      if (!res.ok) await fail(res);
      const j = (await res.json()) as {
        models?: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
        nextPageToken?: string;
      };
      for (const m of j.models ?? []) {
        const methods = m.supportedGenerationMethods ?? [];
        const id = m.name.replace(/^models\//, "");
        const ok =
          purpose === "voice"
            ? methods.includes("bidiGenerateContent")
            : purpose === "image"
              ? (/image/.test(id) && methods.includes("generateContent")) || (/^imagen-/.test(id) && methods.includes("predict"))
              : purpose === "vision"
                ? methods.includes("generateContent") && /^gemini-/.test(id) && !/(tts|live|audio|image|embedding)/.test(id)
                : methods.includes("generateContent");
        if (ok) out.push({ id: m.name.replace(/^models\//, ""), label: m.displayName });
      }
      if (!j.nextPageToken) break;
      page = j.nextPageToken;
    }
    return out;
  }

  // OpenAI and every OpenAI-compatible service list their models at /models.
  const base = (s.baseURL?.trim() || (s.provider === "openai" ? "https://api.openai.com/v1" : PROVIDERS[s.provider]?.baseURL) || "").replace(/\/$/, "");
  if (!base) throw new Error("Add the service's address (base URL) first.");
  const res = await fetch(`${base}/models`, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: timeout });
  if (!res.ok) await fail(res);
  const j = (await res.json()) as { data?: { id: string; name?: string }[] };
  return (j.data ?? []).map((m) => ({ id: m.id, label: m.name && m.name !== m.id ? m.name : undefined }));
}
