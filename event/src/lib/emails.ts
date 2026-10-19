import { esc, siteUrl } from "./server";

type Lang = "fr" | "en";

const C = { navy: "#07122e", night: "#040a1c", blue: "#2a48d0", cyan: "#12b5d8", green: "#5be36b", ink: "#0a1638", slate: "#4b587a", paper: "#f3f6fc", line: "#dfe6f3" };

const T = {
  fr: {
    hello: (n: string) => `Bonjour ${n},`,
    date: "Mercredi 25 novembre 2026 · dès 08:00",
    place: "ESEN Technopôle, Manouba",
    sig: "L’équipe ESENet Talent Fair",
    foot: "ESENet 2026 · Data Alchimie — Turning Data into Value",
    visitor: {
      subject: "Votre ticket ESENet 2026 — Data Alchimie",
      pre: "Voici votre QR code pour le 25 novembre.",
      intro: "Votre inscription à la 8ᵉ édition d’ESENet — <b>Data Alchimie</b> est confirmée. Voici votre QR code : présentez-le à l’entrée le jour J.",
      cta: "Voir mon ticket",
      poster: "L’affiche de l’édition",
      programme: "Le programme de la journée",
      outro: "Au programme : conférences et panels, stands d’entreprises, workshops et networking. À très vite !",
    },
    pending: {
      subject: "ESENet 2026 — inscription reçue, en attente d’approbation",
      pre: "Merci pour votre inscription.",
      body: "Merci pour votre inscription à ESENet 2026 — Data Alchimie. Nous avons bien reçu la candidature de <b>{c}</b> pour un stand gratuit : elle est <b>en attente d’approbation</b>. Nous revenons vers vous très vite par email avec votre numéro de stand et les badges QR de votre équipe.",
    },
    approved: {
      subject: "ESENet 2026 — votre stand est confirmé",
      pre: "Votre stand est confirmé.",
      body: "Bonne nouvelle : la candidature de <b>{c}</b> est <b>approuvée</b>.",
      stand: "Numéro de stand",
      badges: "Badges de votre équipe (QR à présenter à l’entrée)",
    },
  },
  en: {
    hello: (n: string) => `Hello ${n},`,
    date: "Wednesday 25 November 2026 · from 08:00",
    place: "ESEN Technopôle, Manouba",
    sig: "The ESENet Talent Fair team",
    foot: "ESENet 2026 · Data Alchimie — Turning Data into Value",
    visitor: {
      subject: "Your ESENet 2026 ticket — Data Alchimie",
      pre: "Here is your QR code for 25 November.",
      intro: "You are registered for the 8th edition of ESENet — <b>Data Alchimie</b>. Here is your QR code: show it at the entrance on the day.",
      cta: "View my ticket",
      poster: "The edition poster",
      programme: "The programme of the day",
      outro: "On the agenda: talks and panels, company stands, workshops and networking. See you soon!",
    },
    pending: {
      subject: "ESENet 2026 — application received, awaiting approval",
      pre: "Thank you for registering.",
      body: "Thank you for registering for ESENet 2026 — Data Alchimie. We received the free stand application from <b>{c}</b>: it is <b>awaiting approval</b>. We will get back to you very soon by email with your stand number and your team’s QR badges.",
    },
    approved: {
      subject: "ESENet 2026 — your stand is confirmed",
      pre: "Your stand is confirmed.",
      body: "Good news: the application from <b>{c}</b> is <b>approved</b>.",
      stand: "Stand number",
      badges: "Your team badges (show the QR at the entrance)",
    },
  },
} as const;

const img = (file: string) => `${siteUrl()}/email/${file}`;
const qr = (code: string) => `${siteUrl()}/qr/${code}.png`;

function shell(lang: Lang, preheader: string, inner: string) {
  const t = T[lang];
  return `<!doctype html><html lang="${lang}"><body style="margin:0;padding:0;background:${C.paper};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:${C.ink};">
<tr><td style="background:${C.navy};padding:22px 28px;border-bottom:3px solid ${C.cyan};">
<img src="${img("logo.png")}" alt="ESENet Talent Fair" width="150" style="display:block;border:0;height:auto;">
</td></tr>
<tr><td style="padding:30px 28px 8px 28px;font-size:16px;line-height:1.6;">${inner}</td></tr>
<tr><td style="padding:8px 28px 28px 28px;font-size:15px;color:${C.slate};">${t.sig}<br><a href="mailto:esenet.talentfair@esen.tn" style="color:${C.blue};">esenet.talentfair@esen.tn</a></td></tr>
<tr><td style="background:${C.night};padding:16px 28px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9fb0d8;">${t.foot}</td></tr>
</table></td></tr></table></body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.green};color:${C.night};text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px;">${esc(label)}</a>`;
const h = (s: string) => `<p style="margin:26px 0 10px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.blue};font-weight:bold;">${esc(s)}</p>`;

export function visitorEmail(lang: Lang, name: string, code: string) {
  const t = T[lang], v = t.visitor;
  const html = shell(lang, v.pre, `
<p style="margin:0 0 14px 0;">${esc(t.hello(name))}</p>
<p style="margin:0 0 20px 0;">${v.intro}</p>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 6px auto;"><tr><td align="center" style="border:1px solid ${C.line};border-radius:16px;padding:18px;background:#ffffff;">
<img src="${qr(code)}" alt="QR ${esc(code)}" width="220" height="220" style="display:block;border:0;">
<div style="margin-top:10px;font-family:monospace;font-size:14px;letter-spacing:2px;color:${C.slate};">${esc(code)}</div>
</td></tr></table>
<p style="text-align:center;margin:14px 0 0 0;font-size:14px;color:${C.slate};">${t.date}<br>${t.place}</p>
<p style="text-align:center;margin:20px 0 0 0;">${btn(`${siteUrl()}/${lang}/ticket/${code}`, v.cta)}</p>
${h(v.poster)}<img src="${img("affiche.jpg")}" alt="${esc(v.poster)}" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:12px;border:0;">
${h(v.programme)}<img src="${img("programme.jpg")}" alt="${esc(v.programme)}" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:12px;border:0;">
<p style="margin:24px 0 0 0;">${v.outro}</p>`);
  return { subject: v.subject, html };
}

export function exhibitorPendingEmail(lang: Lang, company: string) {
  const t = T[lang], p = t.pending;
  const html = shell(lang, p.pre, `
<p style="margin:0 0 14px 0;">${esc(t.hello(company))}</p>
<p style="margin:0 0 8px 0;">${p.body.replace("{c}", esc(company))}</p>`);
  return { subject: p.subject, html };
}

export function exhibitorApprovedEmail(lang: Lang, company: string, stand: string | null, people: { name: string; code: string }[]) {
  const t = T[lang], a = t.approved;
  const cards = people
    .map(
      (p) => `<td align="center" style="padding:6px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border:1px solid ${C.line};border-radius:14px;padding:14px;">
<img src="${qr(p.code)}" alt="QR ${esc(p.code)}" width="150" height="150" style="display:block;border:0;">
<div style="margin-top:8px;font-weight:bold;font-size:14px;">${esc(p.name)}</div>
<div style="font-family:monospace;font-size:12px;color:${C.slate};letter-spacing:1px;">${esc(p.code)}</div></td></tr></table></td>`,
    )
    .join("");
  const html = shell(lang, a.pre, `
<p style="margin:0 0 14px 0;">${esc(t.hello(company))}</p>
<p style="margin:0 0 14px 0;">${a.body.replace("{c}", esc(company))}</p>
${stand ? `<p style="margin:0 0 6px 0;font-size:13px;color:${C.slate};text-transform:uppercase;letter-spacing:1.5px;">${a.stand}</p><p style="margin:0 0 18px 0;font-size:30px;font-weight:bold;color:${C.blue};">${esc(stand)}</p>` : ""}
${h(a.badges)}<table role="presentation" cellpadding="0" cellspacing="0"><tr>${cards}</tr></table>
<p style="margin:22px 0 0 0;font-size:14px;color:${C.slate};">${t.date} · ${t.place}</p>`);
  return { subject: a.subject, html };
}

// Free-text message from the organisers (admin "send email"): paragraphs
// from blank lines, line breaks kept, always inside the branded frame.
export function broadcastEmail(lang: Lang, name: string, subject: string, message: string) {
  const body = message
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return { subject, html: shell(lang, subject, `<p style="margin:0 0 14px 0;">${esc(T[lang].hello(name))}</p>${body}`) };
}
