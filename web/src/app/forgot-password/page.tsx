import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-text-muted">
        Enter your email and we&rsquo;ll send you a link to set a new password.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm text-text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-accent-2">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
