import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import type { LegalSection } from "../components/LegalPage";

const EMAIL = "troscscu2@gmail.com";
const mail = <a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:text-brand-hover">{EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>We only collect what the site needs to run your learning.</p>
        <ul>
          <li>
            <strong>Your account:</strong> your name, email address and password.
          </li>
          <li>
            <strong>Your profile, if you fill it in:</strong> a photo, a short bio, a website and links to Twitter,
            LinkedIn or GitHub.
          </li>
          <li>
            <strong>Your learning:</strong> the tracks, courses, sessions and events you join or ask to join, which
            sessions you mark as watched, the weekly tasks you tick off, the links you submit for assignments, the
            grades and feedback you receive, and the reviews you write.
          </li>
          <li>
            <strong>An activity log:</strong> a record of actions such as signing in, joining a course or submitting
            an assignment, with the time each happened.
          </li>
          <li>
            <strong>Messages you send us:</strong> the name, email, phone number, track and message you enter on the
            contact page.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To sign you in and keep your account secure.</li>
        <li>To run tracks, courses and sessions: handling join requests, showing your progress, and letting instructors grade your work.</li>
        <li>To send emails about your account, such as password resets.</li>
        <li>To answer messages you send us.</li>
        <li>To understand how the platform is used, through counts such as how many students joined a track.</li>
      </ul>
    ),
  },
  {
    id: "who-sees",
    title: "Who can see your information",
    body: (
      <ul>
        <li>
          <strong>Anyone visiting the site</strong> can see the name and photo on reviews you write, and the names of
          instructors on tracks, courses and sessions.
        </li>
        <li>
          <strong>Instructors and admins</strong> of a track, course or session you join can see your name, email,
          progress and submissions for it, so they can teach and grade.
        </li>
        <li>
          <strong>Other members</strong> of a track or course you join may be able to see your name, email and
          photo.
        </li>
        <li>
          <strong>TROSC admins</strong> can see all accounts and the activity log, to run and look after the
          platform.
        </li>
      </ul>
    ),
  },
  {
    id: "services",
    title: "Services we rely on",
    body: (
      <>
        <p>We don't sell your information or share it with advertisers. A few services help us run the site:</p>
        <ul>
          <li>Vercel hosts the website, and Render runs the server that stores your data.</li>
          <li>Cloudinary stores the images uploaded to the site, such as profile photos and cover images.</li>
          <li>Google Fonts supplies the site's font, so your browser loads it from Google.</li>
          <li>
            Session videos and materials are embedded from, or link to, services such as YouTube and Google Drive.
            When you watch or open them, those services' own privacy policies apply.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We use one cookie to keep you signed in. We don't use advertising or analytics cookies. The site also keeps a
        small note in your browser's session storage so it can recover if a page fails to load after an update.
      </p>
    ),
  },
  {
    id: "keeping",
    title: "Keeping and deleting your data",
    body: (
      <>
        <p>We keep your information while your account exists.</p>
        <p>
          You can deactivate your account in{" "}
          <Link to="/settings" className="font-semibold text-brand hover:text-brand-hover">
            Settings
          </Link>
          . That signs you out and removes you from your tracks, courses and events, but keeps your data so you can
          come back by signing in again.
        </p>
        <p>
          To delete your account permanently, email {mail} from the address on your account. We'll delete it along
          with your enrollments, progress, submissions and grades. If you run courses or sessions as an
          instructor, we'll hand them to another instructor first.
        </p>
      </>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <ul>
        <li>Change your name, photo, bio and links at any time in Settings.</li>
        <li>Change your password in Settings.</li>
        <li>Email {mail} to ask for a copy of your data, to correct something, or to have it deleted.</li>
      </ul>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we'll update it here and change the date at the top. If a change affects how we use
        your information, we'll also point it out on the site.
      </p>
    ),
  },
];

const PrivacyPage = () => (
  <LegalPage
    title="Privacy policy"
    updated="8 October 2026"
    intro={
      <p>
        TROSC is a student team at the Faculty of Computers and Information, Suez Canal University. We run this
        learning platform. This page explains what information we collect when you use it, why, and what you can do
        about it.
      </p>
    }
    sections={sections}
  />
);

export default PrivacyPage;
