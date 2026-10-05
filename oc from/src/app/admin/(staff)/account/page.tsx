import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/settings-forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireStaff();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="My account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="eyebrow text-dim">Name</dt>
              <dd className="mt-1">{user.name}</dd>
            </div>
            <div>
              <dt className="eyebrow text-dim">Email</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="eyebrow text-dim">Role</dt>
              <dd className="mt-1">{ROLE_LABEL[user.role]}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-dim">Name, email and role are managed by an admin.</p>
        </Panel>
        <Panel title="Change password">
          <ChangePasswordForm />
        </Panel>
      </div>
    </div>
  );
}
