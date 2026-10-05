import "server-only";

/** Feature switches derived from environment. Nothing here throws — optional features just turn off. */
export const features = {
  cvUpload: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  email: Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM),
};

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
