# LeaseLens

Upload a residential lease PDF and get a plain-English, color-coded risk
report in about thirty seconds. Built for tenants.

> **Not legal advice.** Research prototype — consult a licensed attorney
> for binding review.

## What it does

1. You drop a lease PDF (or click **Try with a sample lease**).
2. Server extracts the text with `pdf-parse` and sends it to Claude
   Sonnet 4.5 with a few-shot tenant-rights prompt.
3. Claude returns JSON flagging every clause as red / yellow / green with
   a plain-English explanation, a why-it-matters line, and a
   copy-pasteable negotiation script.
4. The Results page pairs the PDF text with color-coded cards. Click
   **See in document** on any finding to scroll and highlight the
   matching paragraph.

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Name                | Required | Notes                                     |
| ------------------- | -------- | ----------------------------------------- |
| `ANTHROPIC_API_KEY` | yes      | Server-side only; never committed.        |
| `ANTHROPIC_MODEL`   | no       | Defaults to `claude-sonnet-4-5`.          |

## Regenerating the sample lease

`public/sample-lease.pdf` and `public/sample-analysis.json` are checked
in so the **Try sample** button resolves in about a second without a
round-trip to Claude (per PRD §15.2). To rebuild them after editing
either script:

```bash
npm run generate:samples
```

## Deployment

Zero-config on Vercel: push to `main`, then in
Project → Settings → Environment Variables set `ANTHROPIC_API_KEY`.

## Tech stack

- Next.js 14 (App Router)
- TypeScript, Tailwind CSS
- `@anthropic-ai/sdk` — Claude Sonnet 4.5
- `pdf-parse` — server-side PDF text extraction
- `zod` — LLM output validation
- Deployment: Vercel. State: `sessionStorage` (no database).
