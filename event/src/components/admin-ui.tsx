"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { adminLogin, checkIn, type CheckInResult } from "@/app/actions/admin";

export function AdminLogin() {
  const [error, action, pending] = useActionState(adminLogin, null);
  return (
    <main className="mx-auto max-w-sm px-4 py-24 text-ink">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Organisers</h1>
      <form action={action} className="mt-8 space-y-4">
        <label className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate">
          Password
          <input name="password" type="password" required autoFocus className="mt-2 block w-full rounded-xl border border-ink/15 px-4 py-3 text-[16px] normal-case tracking-normal text-ink" />
        </label>
        {error && <p role="alert" className="text-[14px] text-red-700">{error}</p>}
        <button disabled={pending} className="h-12 w-full rounded-full bg-ink text-[15px] font-semibold text-snow">
          Sign in
        </button>
      </form>
    </main>
  );
}

type BarcodeDetectorLike = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

// Camera QR scanner for the entrance (BarcodeDetector: Chrome/Android/Edge;
// iPhone Safari falls back to typing or pasting the code).
export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [camera, setCamera] = useState(true);
  const busy = useRef(false);
  const last = useRef("");

  async function submit(code: string) {
    if (busy.current || code === last.current) return;
    busy.current = true;
    last.current = code;
    setResult(await checkIn(code));
    setTimeout(() => {
      busy.current = false;
      last.current = "";
    }, 2500);
  }

  useEffect(() => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices) {
      queueMicrotask(() => setCamera(false));
      return;
    }
    const detector = new BD({ formats: ["qr_code"] });
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        timer = window.setInterval(async () => {
          if (!video.current) return;
          const found = await detector.detect(video.current).catch(() => []);
          if (found[0]) void submit(found[0].rawValue);
        }, 400);
      })
      .catch(() => setCamera(false));
    return () => {
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const tone = !result ? "bg-paper" : !result.ok ? "bg-red-100" : result.already ? "bg-amber-100" : "bg-green/30";
  return (
    <main className="mx-auto max-w-md px-4 py-8 text-ink">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Check-in</h1>
      {camera ? (
        <video ref={video} muted playsInline className="mt-6 aspect-square w-full rounded-2xl bg-night object-cover" />
      ) : (
        <p className="mt-6 text-[14px] text-slate">Camera scanning isn’t available here — type or paste the code below.</p>
      )}
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("code") as HTMLInputElement;
          void submit(input.value);
          input.value = "";
        }}
      >
        <input name="code" placeholder="ESN-XXXXXXXX" autoCapitalize="characters" className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-3 font-mono text-[15px]" />
        <button className="rounded-full bg-ink px-5 text-[14px] font-semibold text-snow">Check in</button>
      </form>
      <div role="status" aria-live="polite" className={`mt-6 rounded-2xl p-5 ${tone}`}>
        {!result ? (
          <p className="text-slate">Waiting for a QR code…</p>
        ) : result.ok ? (
          <>
            <p className="font-display text-2xl font-semibold">{result.name}</p>
            <p className="mt-1 text-[14px]">{result.kind} · {result.already ? "already checked in" : "checked in"}</p>
          </>
        ) : (
          <p className="font-semibold text-red-800">{result.msg}</p>
        )}
      </div>
    </main>
  );
}
