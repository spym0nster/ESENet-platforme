import { LegalPage, LegalSection, NeedsReview } from "@/components/legal-page";

export const metadata = { title: "Privacy Policy — ESENet" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalSection title="What data ESENet collects">
        <p>Depending on your account type, ESENet stores:</p>
        <ul>
          <li>
            <strong>Everyone:</strong> your name, email address, and account
            role (student, company, or admin).
          </li>
          <li>
            <strong>Students:</strong> profile photo and banner, headline,
            bio, skills, availability, LinkedIn URL, education, work
            experience, projects, certifications, and your CV file.
          </li>
          <li>
            <strong>Companies:</strong> company name, website, description,
            logo and banner, and the profile of anyone your company invites
            or who is approved to join it as a team member.
          </li>
          <li>
            <strong>Activity:</strong> opportunities you post or apply to,
            applications and their status history, posts, comments, likes,
            and any content report you file.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Why it's collected">
        <p>
          Each of the above exists to run a specific part of the platform:
          your profile so companies and other students can find and
          evaluate you, your CV so a company you apply to can review it,
          applications and their status so both sides can track a hiring
          process, and posts/comments/reports to run the community feed and
          its moderation.
        </p>
        <NeedsReview>
          The exact legal basis for each category (consent, legitimate
          interest, contract, etc.) under whichever data protection
          framework applies to ESEN.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Who can see your data">
        <ul>
          <li>
            Student and company profiles (name, headline, bio, skills,
            education, experience, projects, certifications, company info)
            are <strong>publicly readable</strong> — visible to anyone
            visiting ESENet, signed in or not. This is a real, current
            characteristic of the platform, not a hypothetical.
          </li>
          <li>
            Your <strong>CV file is private</strong>: only you and a
            company you&rsquo;ve actually applied to can access it, via a
            time-limited signed link — never a public URL.
          </li>
          <li>
            An application&rsquo;s message and status are visible to you and to
            the company you applied to, not to other students or other
            companies.
          </li>
          <li>
            Feed posts, comments, and likes are visible the same way the
            rest of the feed is — publicly, unless a post or comment has
            been removed by its author or by an admin.
          </li>
        </ul>
        <NeedsReview>
          Whether student profiles being visible to fully anonymous,
          logged-out visitors (not just other ESEN community members) is
          the intended scope, or should be restricted to signed-in users
          only.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Data retention">
        <NeedsReview>
          How long each category of data is kept after it&rsquo;s created, and
          how long after an account is deleted or goes inactive.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Account deletion">
        <p>
          Account self-deletion is not yet available in the product as of
          this writing — this section will be updated once it ships, and
          this paragraph will be replaced rather than left inaccurate. In
          the meantime, deletion can only be requested directly from ESEN.
        </p>
        <NeedsReview>
          The request channel (an email address, a form) and what actually
          happens to an account&rsquo;s applications, posts, and comments on
          deletion — anonymized in place, or removed outright.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          See the <a href="/cookies" className="text-accent-2 hover:text-text">Cookie Policy</a> for
          what ESENet actually sets today.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          ESENet is built on{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-accent-2 hover:text-text"
          >
            Supabase
          </a>
          , which provides the database, authentication, and file storage
          this platform runs on — every category of data described above is
          stored there. No other third-party service currently processes
          ESENet data (no analytics, no advertising, no separate email
          provider yet).
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <NeedsReview>
          What rights ESENet commits to (access, correction, deletion,
          export) and how someone actually exercises them, under whichever
          legal framework applies.
        </NeedsReview>
      </LegalSection>

      <LegalSection title="Contact">
        <NeedsReview>
          A real contact address or person at ESEN responsible for privacy
          questions.
        </NeedsReview>
      </LegalSection>
    </LegalPage>
  );
}
