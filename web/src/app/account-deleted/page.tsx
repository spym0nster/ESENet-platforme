import Link from "next/link";
import { Button } from "@/components/ui";

export const metadata = { title: "Account deleted — ESENet" };

export default function AccountDeletedPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        ESENet
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Your account has been deleted
      </h1>
      <p className="mt-4 text-text-muted">
        Your personal information, CV, and profile details have been
        removed, and you&rsquo;ve been signed out. Anything you posted or
        applied to that other people legitimately hold a record of — a
        comment thread, a company&rsquo;s own hiring history — stays in
        place, now attributed to &ldquo;Deleted user&rdquo; instead of you.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to ESENet</Button>
        </Link>
      </div>
    </div>
  );
}
