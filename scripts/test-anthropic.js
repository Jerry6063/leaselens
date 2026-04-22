// Ad-hoc latency probe. Run with:
//   node --env-file=.env.local scripts/test-anthropic.js [model]

const Anthropic = require("@anthropic-ai/sdk");

const model = process.argv[2] || "claude-sonnet-4-5";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

(async () => {
  const t0 = Date.now();
  try {
    const resp = await client.messages.create({
      model,
      max_tokens: 64,
      messages: [{ role: "user", content: "Reply with exactly: pong" }],
    });
    console.log(`OK  ${model}  ${Date.now() - t0}ms`);
    const text = resp.content.find((b) => b.type === "text")?.text;
    console.log(`text=${JSON.stringify(text)}`);
  } catch (err) {
    console.log(`ERR ${model}  ${Date.now() - t0}ms`);
    console.log(`status=${err.status}  type=${err.constructor?.name}`);
    console.log(`message=${err.message}`);
  }
})();
