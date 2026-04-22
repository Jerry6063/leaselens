"use client";

import type { Finding, RiskCategory } from "@/lib/schema";
import { FindingCard } from "./FindingCard";

const TABS: Array<{ key: RiskCategory; label: string; dot: string }> = [
  { key: "red", label: "Red", dot: "bg-risk-red" },
  { key: "yellow", label: "Yellow", dot: "bg-risk-yellow" },
  { key: "green", label: "Green", dot: "bg-risk-green" },
];

export function ResultsTabs({
  active,
  onChange,
  counts,
  findings,
  onSeeInDocument,
}: {
  active: RiskCategory;
  onChange: (c: RiskCategory) => void;
  counts: Record<RiskCategory, number>;
  findings: Finding[];
  onSeeInDocument: (quote: string) => void;
}) {
  return (
    <div>
      <div role="tablist" aria-label="Findings by risk" className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const selected = active === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(t.key)}
              className={[
                "relative px-3.5 py-2.5 text-sm font-medium transition-colors",
                selected ? "text-ink" : "text-slate-500 hover:text-ink",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${t.dot}`}
                  aria-hidden
                />
                {t.label} ({counts[t.key]})
              </span>
              {selected && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 bg-ink"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-5 space-y-4">
        {findings.length === 0 ? (
          <EmptyState category={active} />
        ) : (
          findings.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              category={active}
              onSeeInDocument={onSeeInDocument}
            />
          ))
        )}
      </div>
    </div>
  );
}

const EMPTY_COPY: Record<RiskCategory, string> = {
  red: "✓ No major red flags detected in this lease.",
  yellow: "No yellow flags found.",
  green:
    "No standard protections explicitly identified — consider asking your landlord to add them.",
};

function EmptyState({ category }: { category: RiskCategory }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
      {EMPTY_COPY[category]}
    </div>
  );
}
