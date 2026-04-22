// §8.1 Anthropic client wrapper + §10 call helpers.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";

// PRD §10 suggests 4096; empirically Claude hits that ceiling on a 10-page
// lease and the response truncates mid-JSON. 8192 leaves comfortable
// headroom while the prompt now caps findings/word counts so the actual
// output stays well under this.
const MAX_TOKENS = 8192;
const TEMPERATURE = 0.2;

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function callClaude(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const client = getAnthropic();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages,
  });
  // Grab the first text block. Claude may return multiple blocks but for
  // JSON-only prompts there's exactly one.
  for (const block of resp.content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("Claude returned no text content");
}

export function stripMarkdownFences(text: string): string {
  // Claude occasionally wraps JSON in ```json ... ``` despite instructions.
  return text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}
