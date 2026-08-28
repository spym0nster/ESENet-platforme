import { LegalPage, LegalSection, NeedsReview } from "@/components/legal-page";

export const metadata = { title: "Terms of Service — ESENet" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <LegalSection title="What ESENet is">
        <p>
          ESENet is ESEN&rsquo;s (École Supérieure de l&rsquo;Économie
          Numérique) year-round platform connecting students, alumni, and
          companies — profiles, an opportunity marketplace (internships,
          PFE projects, jobs), and a community feed.
        </p>
      </LegalSection>

      <LegalSection title="Who can use it">
        <p>
          Signup is currently open to two account types: student and
          company. Admin access is granted directly by ESEN, never through
          self-signup.
        </p>
        <NeedsReview>
          Whether ESENet should verify that student accounts actually
          belong to real ESEN students/alumni (e.g. requiring an ESEN
          email address), and what eligibility ESEN wants enforced for
          company accounts beyond the existing admin verification step.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You&rsquo;re responsible for the accuracy of the information on
          your profile and for keeping your account credentials to
          yourself. A company account is multi-user — the owner and any
          team member they invite or approve act on the company&rsquo;s
          behalf, and the owner is responsible for who has that access.
        </p>
      </LegalSection>

      <LegalSection title="Company verification">
        <p>
          A company&rsquo;s postings are only visible to students once an
          ESEN admin has verified that company. Posting or applying does
          not itself constitute an offer or a guarantee of employment.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>ESENet&rsquo;s reporting system already exists to flag:</p>
        <ul>
          <li>Spam</li>
          <li>Harassment</li>
          <li>Inappropriate content</li>
          <li>Fake information (e.g. a company that isn&rsquo;t real)</li>
          <li>Recruitment abuse</li>
        </ul>
        <p>
          Content or accounts found to violate these can be removed by an
          ESEN admin; repeated or serious violations can lead to account
          suspension.
        </p>
        <NeedsReview>
          The exact suspension/termination process and what counts as a
          serious-enough violation to skip straight to it.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Content you post">
        <p>
          You keep ownership of what you post — your profile content, CV,
          projects, and feed posts.
        </p>
        <NeedsReview>
          What license, if any, ESENet needs from you to display your
          content on the platform (e.g. a public profile page necessarily
          involves displaying it) — standard for a platform like this, but
          worth stating precisely rather than assuming.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Disclaimers &amp; liability">
        <NeedsReview>
          Standard platform disclaimers (provided &ldquo;as is&rdquo;, no
          guarantee of matching outcomes, limitation of liability) —
          drafted by whoever handles ESEN&rsquo;s legal matters, not
          invented here.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Governing law">
        <NeedsReview>Which jurisdiction&rsquo;s law governs these terms.</NeedsReview>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If these terms change materially, ESENet will update this page
          and change the date at the top.
        </p>
        <NeedsReview>
          Whether users should also be notified directly (e.g. by email)
          of a material change, and how much advance notice to give.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Contact">
        <NeedsReview>A real contact address for questions about these terms.</NeedsReview>
      </LegalSection>
    </LegalPage>
  );
}
