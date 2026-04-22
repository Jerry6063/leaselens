import Link from "next/link";
import { UploadDropzone } from "@/components/UploadDropzone";

const steps = [
  { n: 1, title: "Upload your lease PDF" },
  { n: 2, title: "Our AI reads every clause" },
  { n: 3, title: "Get a color-coded risk report" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
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

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink">
              Know what you&rsquo;re signing.
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Upload your lease. Get a plain-English risk report in 30 seconds.
              Built for tenants.
            </p>
          </div>

          <div className="mt-10">
            <UploadDropzone />
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 text-center">
            How it works
          </h2>
          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="text-xs font-medium text-slate-400">
                  Step {s.n}
                </div>
                <div className="mt-1 text-sm font-medium text-ink">
                  {s.title}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mt-auto px-6 py-6 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-2">
          <Link
            href="/about"
            className="text-sm text-slate-600 hover:text-ink transition"
          >
            About
          </Link>
          <p className="text-xs text-slate-500">
            Not legal advice. Consult a licensed attorney for binding review.
          </p>
        </div>
      </footer>
    </main>
  );
}
