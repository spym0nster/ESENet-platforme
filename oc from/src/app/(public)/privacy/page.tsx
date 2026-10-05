import type { Metadata } from "next";
import { EVENT } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy notice" };

const SECTIONS = [
  {
    title: "Who collects your data",
    body: `${EVENT.org}, the student organisation of the École Supérieure de l'Économie Numérique (ESEN, Manouba), organising the ${EVENT.name} Organizing Committee (OC).`,
  },
  {
    title: "What we collect",
    body: "The information you enter in the OC application: identity and contact details, class and specialization, optional links (LinkedIn, portfolio), your skills, your experience answers, your motivation text, your availability confirmation and, if you choose to upload one, your CV.",
  },
  {
    title: "Why",
    body: `Only to organise the ${EVENT.name} Operations Team: reviewing applications, selecting members, assigning missions and teams, and coordinating the team during J-2, J-1 and Jour J. Your data is not sold, shared with sponsors or companies, or used for marketing.`,
  },
  {
    title: "Who can see it",
    body: "Only authorised members of the ESEN Ambassadors team, through a password-protected staff area. Applications and CVs are never public. Every review and assignment decision is logged for accountability.",
  },
  {
    title: "How long we keep it",
    body: `For the organisation of ${EVENT.name} and its follow-up. Applications are deleted or anonymised once the event is over and they are no longer needed.`,
  },
  {
    title: "Your rights",
    body: `You can ask to see, correct or delete your application at any time by contacting ${EVENT.org} through ${EVENT.orgUrl.replace("https://", "")}. Quote your application ID so we can find it quickly.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="eyebrow">Privacy notice</p>
      <h1 className="display mt-4 text-4xl uppercase sm:text-5xl">Your application data</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">
        This platform collects personal information to organise the {EVENT.name} Organizing Committee. Here is exactly what
        that means.
      </p>
      <dl className="mt-12 divide-y divide-line border-y border-line">
        {SECTIONS.map((s, i) => (
          <div key={s.title} className="grid gap-2 py-6 sm:grid-cols-[180px_1fr] sm:gap-8">
            <dt className="font-mono text-xs uppercase tracking-[0.16em] text-azure">
              {String(i + 1).padStart(2, "0")} — {s.title}
            </dt>
            <dd className="leading-relaxed text-muted">{s.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
