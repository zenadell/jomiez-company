/* The providers the agent can use: names and defaults only, safe to load in the browser. */

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
