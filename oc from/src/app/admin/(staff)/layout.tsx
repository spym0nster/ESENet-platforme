import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Staff", template: "%s · ESENet OC" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-dvh lg:flex">
      <AdminNav user={{ name: user.name, email: user.email, role: user.role }} />
      <main id="main" className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
