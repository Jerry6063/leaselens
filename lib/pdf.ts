// §8.1 pdf-parse wrapper.
//
// Import path note: importing the package entry runs a debug path that
// tries to read a test file in node_modules. We import the internal
// module directly to avoid that.
import pdf from "pdf-parse/lib/pdf-parse.js";

export const MAX_TEXT_CHARS = 80_000;
export const MIN_TEXT_CHARS = 500;

export async function extractPdfText(
  buffer: Buffer,
): Promise<{ text: string; truncated: boolean }> {
  const result = await pdf(buffer);
  const raw = (result.text ?? "").trim();
  if (raw.length <= MAX_TEXT_CHARS) return { text: raw, truncated: false };
  return { text: raw.slice(0, MAX_TEXT_CHARS), truncated: true };
}
