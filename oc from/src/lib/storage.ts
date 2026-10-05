import "server-only";
import { randomUUID } from "node:crypto";
import { get, put } from "@vercel/blob";
import { CV_MAX_BYTES } from "@/lib/constants";
import { features } from "@/lib/env";

/**
 * CV storage on Vercel Blob with **private** access: the stored value is a pathname, never a
 * public URL. Files are streamed back only through /api/cv/[candidateId], which checks the
 * staff session first. If BLOB_READ_WRITE_TOKEN is not set, CV upload is simply disabled.
 */

export type CvCheck = { ok: true } | { ok: false; error: string };

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export async function validateCv(file: File): Promise<CvCheck> {
  if (file.size === 0) return { ok: false, error: "The selected file is empty." };
  if (file.size > CV_MAX_BYTES) return { ok: false, error: "Your CV must be 3 MB or smaller." };
  if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) {
    return { ok: false, error: "Upload your CV as a PDF file." };
  }
  // Don't trust the declared type — check the file signature.
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (!PDF_MAGIC.every((b, i) => head[i] === b)) {
    return { ok: false, error: "This file doesn't look like a valid PDF." };
  }
  return { ok: true };
}

export async function storeCv(file: File, applicationId: string) {
  if (!features.cvUpload) throw new Error("CV storage is not configured");
  const pathname = `cvs/${applicationId}-${randomUUID()}.pdf`;
  const blob = await put(pathname, file, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });
  return { pathname: blob.pathname, fileName: safeFileName(file.name) };
}

export async function readCv(pathname: string) {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return res;
}

function safeFileName(name: string) {
  const base = name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 100);
  return base.toLowerCase().endsWith(".pdf") ? base : `${base || "cv"}.pdf`;
}
