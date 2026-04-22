import { z } from "zod";

// §9 data contract.

export const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  quote: z.string(),
  plain_english: z.string(),
  why_it_matters: z.string(),
  negotiation_script: z.string(),
});

export const OverallRiskSchema = z.enum(["high", "medium", "low"]);

// What the LLM is asked to return (pdf_text and doc_length_chars are
// injected server-side; the model never sees those fields).
export const LlmOutputSchema = z.object({
  meta: z.object({
    overall_risk: OverallRiskSchema,
    summary: z.string(),
  }),
  red: z.array(FindingSchema),
  yellow: z.array(FindingSchema),
  green: z.array(FindingSchema),
});

// Final shape returned to the client.
export const AnalysisSchema = z.object({
  meta: z.object({
    overall_risk: OverallRiskSchema,
    summary: z.string(),
    doc_length_chars: z.number(),
    truncated: z.boolean().optional(),
  }),
  red: z.array(FindingSchema),
  yellow: z.array(FindingSchema),
  green: z.array(FindingSchema),
  pdf_text: z.string(),
});

export type Finding = z.infer<typeof FindingSchema>;
export type OverallRisk = z.infer<typeof OverallRiskSchema>;
export type LlmOutput = z.infer<typeof LlmOutputSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type RiskCategory = "red" | "yellow" | "green";
