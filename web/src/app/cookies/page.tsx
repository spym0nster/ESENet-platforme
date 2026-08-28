import { LegalPage, LegalSection, NeedsReview } from "@/components/legal-page";

export const metadata = { title: "Cookie Policy — ESENet" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <LegalSection title="What ESENet actually sets today">
        <p>
          ESENet currently uses exactly one kind of cookie: the session
          cookie Supabase Auth sets when you log in, so you stay signed in
          between page loads. It&rsquo;s strictly necessary for the site to
          function — there&rsquo;s no way to use a logged-in feature without
          it, and no consent banner or opt-out toggle would let you keep
          using the site without it either.
        </p>
        <p>
          As of this writing, ESENet sets{" "}
          <strong>no analytics, advertising, or tracking cookies</strong> —
          there is no analytics of any kind wired into the platform yet.
          This page will be updated if that changes, rather than left
          silently out of date.
        </p>
      </LegalSection>

      <LegalSection title="Categories">
        <ul>
          <li>
            <strong>Strictly necessary</strong> — the Supabase Auth session
            cookie described above. Always on.
          </li>
        </ul>
        <NeedsReview>
          This section needs a new category (and a real consent mechanism)
          the moment analytics, or any other non-essential cookie, is
          actually added — not before.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Controlling cookies">
        <p>
          Since the only cookie ESENet sets is required to stay logged in,
          blocking it through your browser&rsquo;s own cookie settings
          means you won&rsquo;t be able to stay signed in — there&rsquo;s no
          middle ground to offer today.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If ESENet ever adds a cookie beyond the one described above, this
          page will say so specifically, with a real consent flow to match
          — not a blanket rewrite.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
