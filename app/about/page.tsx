import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-ink">
            LeaseLens
          </Link>
          <Link
            href="/about"
            className="text-sm text-slate-600 hover:text-ink transition"
          >
            About
          </Link>
        </div>
      </header>

      <section className="flex-1 px-6 py-16">
        <article className="mx-auto max-w-2xl space-y-8">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              About LeaseLens
            </h1>
          </header>

          <p className="text-base leading-relaxed text-slate-700">
            LeaseLens translates a residential lease PDF into a plain-English
            risk report in about thirty seconds. It is built for tenants who
            want to understand what they are signing before they sign it, and
            for new renters and international students who face the steepest
            language and legal-jargon barrier.
          </p>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              How it works
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              This tool uses Anthropic&rsquo;s Claude Sonnet 4.5, a large
              language model, to analyze lease documents. Every analysis is a
              fresh read of your document &mdash; we don&rsquo;t store your
              lease or your results after you close the page.
            </p>
          </section>

          <aside className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Disclaimer
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              LeaseLens is a research prototype, not a legal service. Do not
              rely on it as a substitute for advice from a licensed attorney.
              Laws vary by state and jurisdiction.
            </p>
          </aside>
        </article>
      </section>

      <footer className="mt-auto px-6 py-6 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-slate-500">
            Not legal advice. Consult a licensed attorney for binding review.
          </p>
        </div>
      </footer>
    </main>
  );
}
