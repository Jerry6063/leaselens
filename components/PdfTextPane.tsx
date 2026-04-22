"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function PdfTextPane({
  pdfText,
  highlightQuote,
  highlightNonce,
}: {
  pdfText: string;
  highlightQuote: string | null;
  // Bump to re-trigger the scroll+highlight even if the quote is identical
  // to the previous one.
  highlightNonce: number;
}) {
  const paragraphs = useMemo(
    () =>
      pdfText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [pdfText],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!highlightQuote) return;
    const idx = findBestParagraph(paragraphs, highlightQuote);
    if (idx < 0) return;

    setHighlightIdx(idx);
    const el = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-p="${idx}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(() => setHighlightIdx(null), 3000);
    return () => clearTimeout(t);
  }, [highlightQuote, highlightNonce, paragraphs]);

  return (
    <div
      ref={scrollerRef}
      className="h-full overflow-y-auto bg-slate-50 px-6 py-5"
    >
      <div className="mx-auto max-w-prose space-y-3 font-mono text-[13px] leading-relaxed text-slate-800">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            data-p={i}
            className={[
              "rounded px-2 py-1 transition-colors whitespace-pre-wrap",
              highlightIdx === i ? "bg-yellow-200" : "",
            ].join(" ")}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Find the paragraph that most likely contains the quoted snippet.
// Exact substring preferred; fall back to longest matching prefix chunk.
function findBestParagraph(paragraphs: string[], quote: string): number {
  const target = normalize(quote);
  if (!target) return -1;

  for (let i = 0; i < paragraphs.length; i++) {
    if (normalize(paragraphs[i]).includes(target)) return i;
  }

  const minChunk = 24;
  for (
    let len = target.length - 8;
    len >= minChunk;
    len -= Math.max(8, Math.floor(target.length / 12))
  ) {
    const head = target.slice(0, len);
    for (let i = 0; i < paragraphs.length; i++) {
      if (normalize(paragraphs[i]).includes(head)) return i;
    }
  }
  return -1;
}
