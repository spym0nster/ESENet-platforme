import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-4">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" aria-hidden />
      <div className="relative text-center">
        <p className="font-mono text-sm tracking-[0.2em] text-azure">404</p>
        <h1 className="display mt-4 text-5xl uppercase">Not found</h1>
        <p className="mt-4 text-muted">This page doesn&apos;t exist, or it was moved.</p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
