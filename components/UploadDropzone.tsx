"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Upload,
} from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;
const SESSION_KEY = "leaselens:analysis";

type State =
  | { kind: "idle" }
  | { kind: "dragover" }
  | { kind: "uploading"; filename: string }
  | { kind: "error"; message: string };

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  const analyze = useCallback(
    async (file: File) => {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setState({ kind: "error", message: "Please upload a PDF." });
        return;
      }
      if (file.size > MAX_BYTES) {
        setState({ kind: "error", message: "File too large. Max 10 MB." });
        return;
      }

      setState({ kind: "uploading", filename: file.name });

      const form = new FormData();
      form.append("file", file);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          body: form,
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState({
            kind: "error",
            message:
              payload?.error ?? "Analysis failed. Please try again.",
          });
          return;
        }
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ ...payload, filename: file.name }),
        );
        router.push("/results");
      } catch {
        setState({
          kind: "error",
          message: "Network error. Please try again.",
        });
      }
    },
    [router],
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (state.kind === "uploading") return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      analyze(file);
    } else {
      setState({ kind: "idle" });
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (state.kind === "uploading") return;
    if (state.kind !== "dragover") setState({ kind: "dragover" });
  };

  const onDragLeave = () => {
    if (state.kind === "dragover") setState({ kind: "idle" });
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
    e.target.value = "";
  };

  // §15.2 fast path: the sample lease ships with a pre-baked analysis so
  // the demo resolves in ~1s instead of ~25s. If the cached file is
  // missing, we fall back to the live analyze pipeline.
  const trySample = async () => {
    setState({ kind: "uploading", filename: "sample-lease.pdf" });
    try {
      const cachedRes = await fetch("/sample-analysis.json");
      if (cachedRes.ok) {
        const text = await cachedRes.text();
        sessionStorage.setItem(SESSION_KEY, text);
        router.push("/results");
        return;
      }
    } catch {
      // fall through to live path
    }

    try {
      const pdfRes = await fetch("/sample-lease.pdf");
      if (!pdfRes.ok) throw new Error("missing");
      const blob = await pdfRes.blob();
      const file = new File([blob], "sample-lease.pdf", {
        type: "application/pdf",
      });
      await analyze(file);
    } catch {
      setState({
        kind: "error",
        message:
          "Sample lease not available. Run `npm run generate:samples`.",
      });
    }
  };

  const busy = state.kind === "uploading";
  const dragging = state.kind === "dragover";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          "group relative block w-full rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
          dragging
            ? "border-ink bg-slate-100"
            : "border-slate-300 bg-white hover:border-ink hover:bg-slate-50",
          busy ? "cursor-wait" : "cursor-pointer",
        ].join(" ")}
      >
        {busy ? (
          <div className="flex flex-col items-center gap-3 text-ink">
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
            <div className="text-sm font-medium">
              Analyzing {(state as { filename: string }).filename}&hellip;
            </div>
            <div className="text-xs text-slate-500">
              This usually takes 20&ndash;30 seconds.
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload
              className="h-7 w-7 text-slate-400 group-hover:text-ink transition-colors"
              aria-hidden
            />
            <div className="text-base font-medium text-ink">
              Drop your lease PDF here, or click to browse
            </div>
            <div className="text-xs text-slate-500">
              PDF only &middot; 10 MB max
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={onPickFile}
          disabled={busy}
        />
      </div>

      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={trySample}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-ink disabled:opacity-50 transition-colors"
        >
          Try with a sample lease{" "}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {state.kind === "error" && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>{state.message}</div>
        </div>
      )}
    </div>
  );
}
