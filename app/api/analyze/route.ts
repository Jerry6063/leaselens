import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import {
  callClaudeTool,
  type ChatMessage,
} from "@/lib/anthropic";
import { extractPdfText, MIN_TEXT_CHARS } from "@/lib/pdf";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { LlmOutputSchema, type Finding } from "@/lib/schema";

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

  let raw: unknown;
  try {
    raw = await withTimeout(
      callClaudeTool(SYSTEM_PROMPT, messages),
      Math.max(MIN_CALL_BUDGET_MS, deadline - Date.now()),
    );
  } catch (err) {
    return handleLlmError(err);
  }

  let parsed = LlmOutputSchema.safeParse(coerceToolInput(raw));

  if (!parsed.success) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_CALL_BUDGET_MS) {
      return json(500, "We couldn't generate a clean report. Please retry.");
    }
    // With tool_use the schema is enforced by the API itself, so a zod
    // failure means Claude produced something structurally odd (e.g.
    // missing a required field). One retry, same call shape.
    try {
      raw = await withTimeout(
        callClaudeTool(SYSTEM_PROMPT, messages),
        remaining,
      );
    } catch (err) {
      return handleLlmError(err);
    }
    parsed = LlmOutputSchema.safeParse(coerceToolInput(raw));
    if (!parsed.success) {
      return json(500, "We couldn't generate a clean report. Please retry.");
    }
  }

  const red: Finding[] = [];
  const yellow: Finding[] = [];
  const green: Finding[] = [];
  for (const f of parsed.data.findings) {
    const { category, ...rest } = f;
    (category === "red" ? red : category === "yellow" ? yellow : green).push(rest);
  }

  const analysis = {
    meta: {
      ...parsed.data.meta,
      doc_length_chars: extracted.text.length,
      ...(extracted.truncated ? { truncated: true as const } : {}),
    },
    red,
    yellow,
    green,
    pdf_text: extracted.text,
  };

  return NextResponse.json(analysis);
}

// ————— helpers —————

function json(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

// Claude's tool_use sometimes serializes a long array as a JSON-encoded
// string instead of a real array (observed on 20-page leases: `findings`
// came back as a 7800-char string starting with `[`). If so, parse it —
// and if Claude truncated the JSON mid-object, salvage complete items.
function coerceToolInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  if (typeof r.findings === "string") {
    const s = r.findings;
    try {
      const asArray = JSON.parse(s);
      if (Array.isArray(asArray)) r.findings = asArray;
    } catch {
      // Claude's serialized string sometimes contains an unescaped `"`
      // from a quoted lease clause (e.g. `¼"`). Salvage whatever complete
      // objects we can before the break.
      const salvaged = salvageArrayPrefix(s);
      if (salvaged.length > 0) r.findings = salvaged;
    }
  }
  return r;
}

// When Claude streams a serialized array and hits its max_tokens ceiling,
// the trailing item is incomplete. Recover the complete objects up to the
// break point by scanning braces inside a bracketed array literal.
function salvageArrayPrefix(s: string): unknown[] {
  const trimmed = s.trim();
  if (!trimmed.startsWith("[")) return [];
  const out: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 1; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") { if (depth === 0) start = i; depth++; }
    else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try { out.push(JSON.parse(trimmed.slice(start, i + 1))); } catch { /* skip */ }
        start = -1;
      }
    }
  }
  return out;
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
