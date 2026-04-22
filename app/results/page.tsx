"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PdfTextPane } from "@/components/PdfTextPane";
import { ResultsTabs } from "@/components/ResultsTabs";
import { RiskBadge } from "@/components/RiskBadge";
import {
  AnalysisSchema,
  type Analysis,
  type RiskCategory,
} from "@/lib/schema";

const SESSION_KEY = "leaselens:analysis";

type StoredAnalysis = Analysis & { filename?: string };

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [active, setActive] = useState<RiskCategory>("red");
  const [highlight, setHighlight] = useState<{
    quote: string;
    nonce: number;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.replace("/");
      return;
    }
    const result = AnalysisSchema.safeParse(parsed);
    if (!result.success) {
      router.replace("/");
      return;
    }
    const filename =
      parsed && typeof parsed === "object" && "filename" in parsed
        ? String((parsed as { filename?: string }).filename ?? "")
        : "";
    setAnalysis({ ...result.data, filename });
  }, [router]);

  if (!analysis) return null;

  const counts: Record<RiskCategory, number> = {
    red: analysis.red.length,
    yellow: analysis.yellow.length,
    green: analysis.green.length,
  };
  const findings = analysis[active];

  const onSeeInDocument = (quote: string) => {
    setHighlight({ quote, nonce: Date.now() });
  };

  const reset = () => {
    sessionStorage.removeItem(SESSION_KEY);
    router.push("/");
  };

  return (
    <main
      className="h-screen flex flex-col bg-white"
      style={{ minWidth: 1024 }}
    >
      <header className="shrink-0 px-6 py-3 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="font-semibold tracking-tight text-ink shrink-0"
            >
              LeaseLens
            </Link>
            <span className="text-slate-300" aria-hidden>
              /
            </span>
            <span className="text-sm text-slate-600 truncate">
              {analysis.filename || "lease.pdf"}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <RiskBadge level={analysis.meta.overall_risk} />
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50 transition-colors"
            >
              Analyze another
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[40%_60%]">
        <section className="min-h-0 border-r border-slate-200">
          <PdfTextPane
            pdfText={analysis.pdf_text}
            highlightQuote={highlight?.quote ?? null}
            highlightNonce={highlight?.nonce ?? 0}
          />
        </section>

        <section className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-3xl">
            {analysis.meta.summary && (
              <p className="mb-5 border-l-2 border-slate-300 pl-3 text-sm leading-relaxed text-slate-600">
                {analysis.meta.summary}
              </p>
            )}
            {analysis.meta.truncated && (
              <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This lease was long — analysis covered the first{" "}
                {analysis.meta.doc_length_chars.toLocaleString()} characters.
              </p>
            )}
            <ResultsTabs
              active={active}
              onChange={setActive}
              counts={counts}
              findings={findings}
              onSeeInDocument={onSeeInDocument}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
