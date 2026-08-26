import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-2xl font-bold">Create your profile</h1>
      <p className="mt-1 text-sm text-text-muted">
        Join the ESENet talent network.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
