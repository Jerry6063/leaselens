// §10 LLM prompt spec.

export const SYSTEM_PROMPT = `You are a tenant-rights attorney with 15 years of experience reviewing residential leases in the United States. Your job is to help ordinary tenants understand what they're signing — in plain English, with concrete consequences and practical next steps.

You are analyzing a lease and will output ONLY valid JSON matching the provided schema. No markdown fences, no preamble, no trailing prose.`;

const USER_PROMPT_TEMPLATE = `Analyze the residential lease below. Identify clauses in three categories:

RED (high risk to tenant): clauses that are clearly disadvantageous, potentially illegal in most states, or expose the tenant to significant financial or legal risk. Examples: non-refundable deposits, unlimited rent increases, waiver of right to sue, landlord-friendly indemnification.

YELLOW (non-standard or restrictive): legal but unusual or worth noting. Examples: strict no-guest policies, mandatory arbitration, specific insurance requirements, early termination penalties above 2 months' rent.

GREEN (standard tenant protections present): positive items the tenant should know are protected. Examples: written notice requirements before entry, habitability clauses, return-of-deposit timeline specified.

Report AT MOST 3 findings per category. Prioritize the most impactful; skip minor or redundant clauses.

For EACH finding, provide:
- id: "R1", "R2", "Y1", etc. (sequential within category)
- title: 5-8 word summary
- quote: EXACT text from the lease, 30 words maximum
- plain_english: one sentence, under 25 words
- why_it_matters: concrete $ or life impact, 1-2 sentences, under 40 words total
- negotiation_script: 2-3 sentences the tenant can literally send to the landlord, under 60 words total. Tone: polite but firm. Start with "Hi [Landlord],"

Also provide:
- overall_risk: "high" if any red findings, "medium" if only yellow, "low" if only green
- summary: one sentence characterizing the lease overall, under 30 words

Output ONLY this JSON structure, nothing else:
{
  "meta": { "overall_risk": "...", "summary": "..." },
  "red": [...],
  "yellow": [...],
  "green": [...]
}

Here is a concrete example of one RED finding, for format reference:

{
  "id": "R1",
  "title": "Non-refundable security deposit",
  "quote": "Security deposit shall be retained by Landlord in full regardless of the condition of the Premises upon move-out.",
  "plain_english": "The landlord keeps your entire deposit even if you leave the apartment in perfect condition.",
  "why_it_matters": "In most states, deposits must be returned minus actual damages. This likely violates state law and could cost you $1,500-$3,000.",
  "negotiation_script": "Hi [Landlord], I'd like to modify the deposit clause to follow standard practice — full deposit returned within 30 days of move-out, less documented damages with receipts. Would you be open to that change?"
}

LEASE TEXT:
`;

export function buildUserPrompt(pdfText: string): string {
  return USER_PROMPT_TEMPLATE + pdfText;
}

export const RETRY_REMINDER =
  "Your previous response was not valid JSON. Output ONLY the JSON object, no markdown, no prose.";
