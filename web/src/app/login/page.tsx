import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-2xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-text-muted">
        Welcome back to ESENet.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-text-muted">
        No account yet?{" "}
        <Link href="/signup" className="text-accent-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}
