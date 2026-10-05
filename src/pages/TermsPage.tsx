import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import type { LegalSection } from "../components/LegalPage";

const linkCls = "font-semibold text-primary hover:text-primary-hover";

const sections: LegalSection[] = [
  {
    id: "using",
    title: "Using TROSC",
    body: (
      <p>
        TROSC is a free learning platform run by volunteers. By creating an account or using the site, you agree to
        these terms and to our{" "}
        <Link to="/privacy" className={linkCls}>
          privacy policy
        </Link>
        . If you don't agree, please don't use the site.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>Use your real name and an email address you can access.</li>
        <li>Keep your password to yourself. You're responsible for what happens under your account.</li>
        <li>One account per person. Don't sign in as someone else or let others use your account.</li>
      </ul>
    ),
  },
  {
    id: "joining",
    title: "Tracks, courses and sessions",
    body: (
      <ul>
        <li>You can be in one track at a time. Joining or leaving a track may need an instructor's approval.</li>
        <li>Instructors and admins decide who joins, and can remove members who break these terms.</li>
        <li>Schedules, sessions and content can change or be cancelled. We'll try to give notice on the site.</li>
      </ul>
    ),
  },
  {
    id: "work",
    title: "Your work and reviews",
    body: (
      <>
        <ul>
          <li>
            Submit only your own work. Copying someone else's work, or sharing yours for others to copy, can get your
            submission rejected and your account removed from the track.
          </li>
          <li>
            You keep ownership of what you submit and write. You let TROSC show it to the instructors and admins who
            grade it, and show your reviews publicly with your name and photo.
          </li>
          <li>Make sure the links you submit open for anyone with the link, and stay up until your work is graded.</li>
        </ul>
      </>
    ),
  },
  {
    id: "content",
    title: "Learning material",
    body: (
      <p>
        Sessions, slides and other material belong to the instructors who made them or to TROSC. Use them for your own
        learning. Don't share members-only material outside the platform without the instructor's permission.
      </p>
    ),
  },
  {
    id: "conduct",
    title: "Behaving well",
    body: (
      <>
        <p>Don't:</p>
        <ul>
          <li>Harass, insult or threaten anyone, in reviews or anywhere else.</li>
          <li>Post spam, ads, or anything illegal or offensive.</li>
          <li>Share other people's personal information.</li>
          <li>Try to get into accounts or data that aren't yours, or disrupt the site.</li>
        </ul>
        <p>We can remove content that breaks these rules, and deactivate the accounts that post it.</p>
      </>
    ),
  },
  {
    id: "warranty",
    title: "No guarantees",
    body: (
      <p>
        We provide TROSC as it is. We work to keep it running and accurate, but we can't promise it will always be
        available or free of mistakes. As far as the law allows, TROSC and its volunteers aren't responsible for losses
        that come from using the site.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. When we do, we'll change the date at the top of this page. Using the site after an
        update means you accept the new terms.
      </p>
    ),
  },
];

const TermsPage = () => (
  <LegalPage
    title="Terms of use"
    updated="5 October 2026"
    intro={
      <p>
        These terms cover how you can use TROSC, the learning platform run by the TROSC student team at the Faculty of
        Computers and Information, Suez Canal University.
      </p>
    }
    sections={sections}
  />
);

export default TermsPage;
