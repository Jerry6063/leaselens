import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import {
  callClaude,
  stripMarkdownFences,
  type ChatMessage,
} from "@/lib/anthropic";
import {
  extractPdfText,
  MAX_TEXT_CHARS,
  MIN_TEXT_CHARS,
} from "@/lib/pdf";
import {
  RETRY_REMINDER,
  SYSTEM_PROMPT,
  buildUserPrompt,
} from "@/lib/prompt";
import { LlmOutputSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60; // §11 Anthropic timeout budget.

const MAX_BYTES = 10 * 1024 * 1024;
// Vercel Hobby caps at 60s (`maxDuration` above). Budget is shared across
// the initial call and the optional retry so we never blow the ceiling.
const LLM_BUDGET_MS = 58_000;
const MIN_CALL_BUDGET_MS = 4_000;

// §11 error map:
//   file > 10 MB           -> 400 "File too large. Max 10 MB."
//   non-pdf                -> 400 "Please upload a PDF."
//   text < 500 chars       -> 400 "This PDF appears to be scanned or empty..."
//   Anthropic timeout      -> 500 "Analysis timed out. Please try again."
//   Anthropic API error    -> 502 "AI service unavailable..."
//   2x JSON parse failure  -> 500 "We couldn't generate a clean report..."
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, "Invalid upload.");
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return json(400, "No file uploaded.");
  }
  if (file.size > MAX_BYTES) {
    return json(400, "File too large. Max 10 MB.");
  }
  const mimeOk = file.type === "application/pdf";
  const extOk = file.name.toLowerCase().endsWith(".pdf");
  if (!mimeOk && !extOk) {
    return json(400, "Please upload a PDF.");
  }

  let extracted: { text: string; truncated: boolean };
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    extracted = await extractPdfText(buffer);
  } catch {
    return json(400, "Could not read this PDF. The file may be corrupted.");
  }

  if (extracted.text.length < MIN_TEXT_CHARS) {
    return json(
      400,
      "This PDF appears to be scanned or empty. LeaseLens currently supports text-based PDFs only.",
    );
  }

  const userPrompt = buildUserPrompt(extracted.text);
  const messages: ChatMessage[] = [{ role: "user", content: userPrompt }];
  const deadline = Date.now() + LLM_BUDGET_MS;

  let firstResp: string;
  try {
    firstResp = await withTimeout(
      callClaude(SYSTEM_PROMPT, messages),
      Math.max(MIN_CALL_BUDGET_MS, deadline - Date.now()),
    );
  } catch (err) {
    return handleLlmError(err);
  }

  let parsed = LlmOutputSchema.safeParse(safeJsonParse(stripMarkdownFences(firstResp)));

  if (!parsed.success) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_CALL_BUDGET_MS) {
      return json(500, "We couldn't generate a clean report. Please retry.");
    }
    // One retry with a stricter reminder per §10.
    messages.push({ role: "assistant", content: firstResp });
    messages.push({ role: "user", content: RETRY_REMINDER });
    let retryResp: string;
    try {
      retryResp = await withTimeout(
        callClaude(SYSTEM_PROMPT, messages),
        remaining,
      );
    } catch (err) {
      return handleLlmError(err);
    }
    parsed = LlmOutputSchema.safeParse(safeJsonParse(stripMarkdownFences(retryResp)));
    if (!parsed.success) {
      return json(500, "We couldn't generate a clean report. Please retry.");
    }
  }

  const analysis = {
    meta: {
      ...parsed.data.meta,
      doc_length_chars: extracted.text.length,
      ...(extracted.truncated ? { truncated: true as const } : {}),
    },
    red: parsed.data.red,
    yellow: parsed.data.yellow,
    green: parsed.data.green,
    pdf_text: extracted.text,
  };

  return NextResponse.json(analysis);
}

// ————— helpers —————

function json(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

class TimeoutError extends Error {
  constructor() {
    super("timeout");
    this.name = "TimeoutError";
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new TimeoutError()), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

function handleLlmError(err: unknown) {
  if (err instanceof TimeoutError) {
    return json(500, "Analysis timed out. Please try again.");
  }
  if (err instanceof Anthropic.APIError) {
    return json(502, "AI service unavailable. Please try again in a moment.");
  }
  if (err instanceof Error && /ANTHROPIC_API_KEY/.test(err.message)) {
    return json(500, "Server is missing an API key. Contact the site owner.");
  }
  return json(500, "Analysis failed. Please try again.");
}
