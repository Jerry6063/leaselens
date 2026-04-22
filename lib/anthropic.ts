// §8.1 Anthropic client wrapper + §10 call helpers.

import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

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
  // Disable SDK-level retries — we do our own retry in the route with a
  // shared deadline, and a silent SDK retry can eat 10+s on slow calls.
  _client = new Anthropic({ apiKey, maxRetries: 0 });
  return _client;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Tool-use path: force a single-tool call whose input_schema is flat —
// one `findings` array tagged with `category`. The server re-buckets into
// red/yellow/green before returning to the client. Empirically this
// flatter shape is far more reliable than three parallel nested arrays,
// which Claude sometimes serializes as a string mid-generation.
//
// This also eliminates JSON-escaping bugs from the prior text-output
// path (e.g. a lease clause containing `¼"` breaking JSON.parse).
const findingSchema = {
  type: "object" as const,
  required: [
    "category",
    "id",
    "title",
    "quote",
    "plain_english",
    "why_it_matters",
    "negotiation_script",
  ],
  properties: {
    category: { type: "string" as const, enum: ["red", "yellow", "green"] },
    id: { type: "string" as const },
    title: { type: "string" as const },
    quote: { type: "string" as const },
    plain_english: { type: "string" as const },
    why_it_matters: { type: "string" as const },
    negotiation_script: { type: "string" as const },
  },
};

export const REPORT_TOOL: Tool = {
  name: "report_findings",
  description:
    "Return the structured lease analysis. This is the only way to emit your result; do not reply with text.",
  input_schema: {
    type: "object",
    required: ["meta", "findings"],
    properties: {
      meta: {
        type: "object",
        required: ["overall_risk", "summary"],
        properties: {
          overall_risk: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          summary: { type: "string" },
        },
      },
      findings: { type: "array", items: findingSchema },
    },
  },
};

export async function callClaudeTool(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<unknown> {
  const client = getAnthropic();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: REPORT_TOOL.name },
    messages,
  });
  for (const block of resp.content) {
    if (block.type === "tool_use" && block.name === REPORT_TOOL.name) {
      return block.input;
    }
  }
  throw new Error("Claude did not emit a report_findings tool_use block");
}
