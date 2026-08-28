"use client";

import { useActionState, useState } from "react";
import {
  addProfileItem,
  deleteProfileItem,
  type ProfileItemState,
} from "@/app/actions/profile-items";
import { Field, Input, Textarea, Button, Card } from "@/components/ui";

export type ProfileItemField = {
  name: string;
  label: string;
  type?: "text" | "date" | "textarea";
  required?: boolean;
};

export type ProfileItemSummary = {
  id: string;
  title: string;
  subtitle: string;
};

export function ProfileItemSection({
  table,
  sectionTitle,
  emptyLabel,
  fields,
  items,
}: {
  table: "education" | "experiences" | "projects" | "certifications";
  sectionTitle: string;
  emptyLabel: string;
  fields: ProfileItemField[];
  items: ProfileItemSummary[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [addState, addAction, addPending] = useActionState<ProfileItemState, FormData>(
    addProfileItem,
    null
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          {sectionTitle}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="py-2 font-mono text-xs text-accent-2 hover:text-text"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form action={addAction} className="mt-3 space-y-3 rounded-md border border-border p-4">
          <input type="hidden" name="table" value={table} />
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.type === "textarea" ? (
                <Textarea name={f.name} required={f.required} rows={3} />
              ) : (
                <Input name={f.name} type={f.type ?? "text"} required={f.required} />
              )}
            </Field>
          ))}
          {addState && "error" in addState && (
            <p className="text-xs text-magenta">{addState.error}</p>
          )}
          <Button type="submit" disabled={addPending} className="px-4 py-2 text-xs">
            {addPending ? "Saving…" : "Save"}
          </Button>
        </form>
      )}

      {items.length === 0 && !showForm ? (
        <p className="mt-3 text-sm text-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemRow table={table} item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({
  table,
  item,
}: {
  table: string;
  item: ProfileItemSummary;
}) {
  const [state, action, pending] = useActionState<ProfileItemState, FormData>(
    deleteProfileItem,
    null
  );

  if (state && "success" in state) {
    return null;
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <div>
        <p className="text-sm font-medium">{item.title}</p>
        {item.subtitle && <p className="text-xs text-text-faint">{item.subtitle}</p>}
      </div>
      <form action={action}>
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          disabled={pending}
          className="py-2 font-mono text-xs text-text-faint hover:text-magenta"
        >
          {pending ? "…" : "Remove"}
        </button>
      </form>
    </Card>
  );
}
