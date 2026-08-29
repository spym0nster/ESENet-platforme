import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

/**
 * A form field needs a visible edge (`--border-strong`, not the `--border`
 * hairline that dividers use). Focus lights the border cyan and the global
 * `:focus-visible` ring lands on top. Radius matches the control scale (10).
 */
const controlClass =
  "w-full rounded-ctrl border border-border-strong bg-surface p-3 text-sm " +
  "placeholder:text-text-faint focus:border-accent-2";

/** Label + control + inline error, wrapping any single child control. */
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-text-faint">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-magenta">{error}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}
