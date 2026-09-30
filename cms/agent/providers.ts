import { createAnthropic } from "@ai-sdk/anthropic";
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
  deepseek: { label: "DeepSeek", env: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com/v1", example: "deepseek-chat" },
  xai: { label: "xAI (Grok)", env: "XAI_API_KEY", baseURL: "https://api.x.ai/v1", example: "grok-4" },
  mistral: { label: "Mistral", env: "MISTRAL_API_KEY", baseURL: "https://api.mistral.ai/v1", example: "mistral-large-latest" },
  together: { label: "Together AI", env: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1", example: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  ollama: { label: "Ollama (your own machine)", baseURL: "http://localhost:11434/v1", keyless: true, example: "llama3.3" },
  custom: { label: "Any OpenAI-compatible service", env: "AGENT_API_KEY", example: "your-model-id" },
};

/** The Claude models, newest first, offered as quick picks for Anthropic. */
export const CLAUDE_MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-4-5-20251001", "claude-fable-5-1"];

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
    default: {
      const baseURL = (s.baseURL?.trim() || PROVIDERS[s.provider]?.baseURL || "").replace(/\/$/, "");
      return createOpenAICompatible({ name: s.provider, baseURL, apiKey, includeUsage: true }).chatModel(model);
    }
  }
}
