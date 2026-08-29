import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-2xl font-bold">Set a new password</h1>

      {user ? (
        <>
          <p className="mt-1 text-sm text-text-muted">
            Choose a new password for {user.email}.
          </p>
          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-text-muted">
            This reset link is invalid or has expired — they only work once and
            for a short window.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-white"
          >
            Request a new link
          </Link>
        </>
      )}
    </div>
  );
}
