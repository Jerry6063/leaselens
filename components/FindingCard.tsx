"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Search,
} from "lucide-react";

import type { Finding, RiskCategory } from "@/lib/schema";

const dot: Record<RiskCategory, string> = {
  red: "bg-risk-red",
  yellow: "bg-risk-yellow",
  green: "bg-risk-green",
};

export function FindingCard({
  finding,
  category,
  onSeeInDocument,
}: {
  finding: Finding;
  category: RiskCategory;
  onSeeInDocument: (quote: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(finding.negotiation_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — no-op
    }
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-2.5">
        <span
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot[category]}`}
          aria-hidden
        />
        <h3 className="text-base font-semibold text-ink leading-snug">
          {finding.title}
        </h3>
      </header>

      <blockquote className="mt-3 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-700">
        &ldquo;{finding.quote}&rdquo;
      </blockquote>

      <section className="mt-4 space-y-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            What this means
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {finding.plain_english}
          </p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Why it matters
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {finding.why_it_matters}
          </p>
        </div>
      </section>

      <section className="mt-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-ink transition-colors"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
          What to say to landlord
        </button>
        {open && (
          <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
              {finding.negotiation_script}
            </p>
            <button
              type="button"
              onClick={copy}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-ink transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" aria-hidden /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </section>

      <footer className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onSeeInDocument(finding.quote)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-ink transition-colors"
        >
          <Search className="h-3 w-3" aria-hidden />
          See in document
        </button>
      </footer>
    </article>
  );
}
