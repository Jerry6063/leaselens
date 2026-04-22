// Reproduce the actual /api/analyze prompt end-to-end in isolation,
// so we can see whether Claude really takes >55s on a typical lease.
//
// Usage (bash):
//   export ANTHROPIC_API_KEY="$(grep ^ANTHROPIC_API_KEY= .env.local | sed 's/^[^=]*=//')"
//   node scripts/probe-full-prompt.js

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse/lib/pdf-parse.js");
const Anthropic = require("@anthropic-ai/sdk");

async function main() {
  const tsPrompt = fs.readFileSync(
    path.join(__dirname, "..", "lib", "prompt.ts"),
    "utf8",
  );
  const systemMatch = tsPrompt.match(
    /export const SYSTEM_PROMPT = `([\s\S]*?)`;/,
  );
  const userMatch = tsPrompt.match(
    /const USER_PROMPT_TEMPLATE = `([\s\S]*?)`;/,
  );
  const SYSTEM_PROMPT = systemMatch[1];
  const USER_PROMPT_TEMPLATE = userMatch[1];

  const buf = fs.readFileSync(
    path.join(__dirname, "..", "public", "sample-lease.pdf"),
  );
  const parsed = await pdf(buf);
  const pdfText = parsed.text.trim();

  const userPrompt = USER_PROMPT_TEMPLATE + pdfText;

  console.log(`system tokens~ ${Math.round(SYSTEM_PROMPT.length / 4)}`);
  console.log(`user tokens~   ${Math.round(userPrompt.length / 4)}`);
  console.log(`lease chars    ${pdfText.length}`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const t0 = Date.now();
  try {
    const resp = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 4096,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const ms = Date.now() - t0;
    const text = resp.content.find((b) => b.type === "text")?.text ?? "";
    console.log(`OK  ${ms}ms  stop=${resp.stop_reason}  output_tokens=${resp.usage?.output_tokens}`);
    console.log(`parses=${(() => { try { JSON.parse(text.replace(/^```(?:json)?/, '').replace(/```$/, '').trim()); return 'yes'; } catch { return 'NO'; } })()}`);
    console.log(`--- head ---\n${text.slice(0, 200)}`);
  } catch (err) {
    console.log(`ERR ${Date.now() - t0}ms`);
    console.log(`status=${err.status}  message=${err.message}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
