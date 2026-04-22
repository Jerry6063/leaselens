import type { OverallRisk } from "@/lib/schema";

const tone: Record<OverallRisk, string> = {
  high: "bg-red-50 text-red-800 border-red-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

const dot: Record<OverallRisk, string> = {
  high: "bg-risk-red",
  medium: "bg-risk-yellow",
  low: "bg-risk-green",
};

export function RiskBadge({ level }: { level: OverallRisk }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        tone[level],
      ].join(" ")}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${dot[level]}`}
        aria-hidden
      />
      Risk: {level}
    </span>
  );
}
