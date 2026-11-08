/** Static provider catalogue. Models are editable by the admin because vendors rename them often. */
export type ProviderType = "openai" | "anthropic" | "gemini";
export type ProviderDef = {
  key: string;
  label: string;
  type: ProviderType;
  tier: "free" | "free-tier" | "paid";
  baseUrl?: string; // fixed for known vendors
  defaultModel: string;
  note: string;
  keyUrl?: string;
  custom?: boolean;
};

export const PROVIDERS: ProviderDef[] = [
  { key: "gemini", label: "Google Gemini", type: "gemini", tier: "free-tier", defaultModel: "gemini-3.8-flash", note: "Generous free tier via Google AI Studio.", keyUrl: "https://aistudio.google.com/apikey" },
  { key: "groq", label: "Groq", type: "openai", tier: "free-tier", baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.1-8b-instant", note: "Very fast, free tier with rate limits.", keyUrl: "https://console.groq.com/keys" },
  { key: "openrouter", label: "OpenRouter", type: "openai", tier: "free-tier", baseUrl: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-3.3-70b-instruct:free", note: "One key, many models; some are free (':free' suffix).", keyUrl: "https://openrouter.ai/keys" },
  { key: "mistral", label: "Mistral", type: "openai", tier: "free-tier", baseUrl: "https://api.mistral.ai/v1", defaultModel: "mistral-small-latest", note: "Free experimentation tier available.", keyUrl: "https://console.mistral.ai/api-keys" },
  { key: "cerebras", label: "Cerebras", type: "openai", tier: "free-tier", baseUrl: "https://api.cerebras.ai/v1", defaultModel: "llama3.1-8b", note: "Fast inference, free tier.", keyUrl: "https://cloud.cerebras.ai" },
  { key: "openai", label: "OpenAI", type: "openai", tier: "paid", baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini", note: "Paid. Set a spending limit in your OpenAI account.", keyUrl: "https://platform.openai.com/api-keys" },
  { key: "anthropic", label: "Anthropic Claude", type: "anthropic", tier: "paid", defaultModel: "claude-haiku-5-5", note: "Paid. Haiku is the cheapest; Sonnet is stronger.", keyUrl: "https://console.anthropic.com/settings/keys" },
  { key: "deepseek", label: "DeepSeek", type: "openai", tier: "paid", baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat", note: "Paid, low cost.", keyUrl: "https://platform.deepseek.com/api_keys" },
  { key: "xai", label: "xAI Grok", type: "openai", tier: "paid", baseUrl: "https://api.x.ai/v1", defaultModel: "grok-3-mini", note: "Paid.", keyUrl: "https://console.x.ai" },
  { key: "together", label: "Together AI", type: "openai", tier: "paid", baseUrl: "https://api.together.xyz/v1", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", note: "Paid, open models.", keyUrl: "https://api.together.ai/settings/api-keys" },
  { key: "custom", label: "Custom (OpenAI-compatible)", type: "openai", tier: "paid", defaultModel: "", note: "Any OpenAI-compatible HTTPS endpoint. You provide the base URL and model.", custom: true },
];

export const providerDef = (key: string) => PROVIDERS.find((p) => p.key === key);

export const TASKS = [
  { key: "cv_analysis", label: "CV analysis" },
  { key: "job_match", label: "Job matching & explanation" },
  { key: "draft_writing", label: "Application drafts" },
  { key: "translation", label: "Translation (English/Bengali)" },
  { key: "roadmap", label: "Skills & roadmap" },
  { key: "general", label: "General / other" },
] as const;
export type TaskKey = (typeof TASKS)[number]["key"];
