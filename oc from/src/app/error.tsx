"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Friendly fallback — never shows raw error details to the visitor. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm tracking-[0.2em] text-gold">Something went wrong</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase [font-stretch:112%]">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-muted">It&apos;s probably temporary. Try again in a moment.</p>
        <Button onClick={reset} variant="outline" className="mt-8">
          <RotateCcw /> Try again
        </Button>
      </div>
    </main>
  );
}
