export interface SupportedSite {
  host: string;
  name: string;
  url: string;
  customAdapter?: boolean;
}

export const SUPPORTED_SITES: SupportedSite[] = [
  { host: "chatgpt.com", name: "ChatGPT", url: "https://chatgpt.com", customAdapter: true },
  { host: "claude.ai", name: "Claude", url: "https://claude.ai", customAdapter: true },
  { host: "gemini.google.com", name: "Gemini", url: "https://gemini.google.com", customAdapter: true },
  { host: "aistudio.google.com", name: "Google AI Studio", url: "https://aistudio.google.com" },
  { host: "copilot.microsoft.com", name: "Microsoft Copilot", url: "https://copilot.microsoft.com" },
  { host: "chat.mistral.ai", name: "Mistral Le Chat", url: "https://chat.mistral.ai" },
  { host: "perplexity.ai", name: "Perplexity", url: "https://www.perplexity.ai" },
  { host: "poe.com", name: "Poe", url: "https://poe.com" },
  { host: "character.ai", name: "Character.AI", url: "https://character.ai" },
  { host: "huggingface.co", name: "HuggingChat", url: "https://huggingface.co/chat" },
  { host: "grok.com", name: "Grok", url: "https://grok.com" },
  { host: "chat.deepseek.com", name: "DeepSeek", url: "https://chat.deepseek.com" },
  { host: "you.com", name: "You.com", url: "https://you.com" },
  { host: "phind.com", name: "Phind", url: "https://www.phind.com" },
  { host: "meta.ai", name: "Meta AI", url: "https://www.meta.ai" },
  { host: "pi.ai", name: "Pi", url: "https://pi.ai" },
  { host: "chat.qwen.ai", name: "Qwen", url: "https://chat.qwen.ai" },
  { host: "openrouter.ai", name: "OpenRouter", url: "https://openrouter.ai" },
  { host: "lmarena.ai", name: "LMArena", url: "https://lmarena.ai" },
];

export function isSupportedHost(host: string): boolean {
  return SUPPORTED_SITES.some(
    (s) => host === s.host || host.endsWith("." + s.host),
  );
}
