import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import Tracks from "../sections/Tracks";
import Events from "../sections/Events";
import MyEnrollments from "../sections/MyEnrollments";
import Announcements from "../sections/Announcements";
import usePageTitle from "../hooks/usePageTitle";
import { useAuth } from "../context/useAuth";

function LandingPage() {
  usePageTitle(null);
  const { user } = useAuth();
  // Signed-in students see their own track before the marketing hero.
  const showMyTrack = user?.role === "student";
  return (
    <>
      {showMyTrack && <MyEnrollments />}
      <section id="home">
        <Hero belowNavbar={!showMyTrack} />
      </section>
      <HowItWorks />
      <section id="tracks">
        <Tracks />
      </section>
      <Announcements />
      <section id="events">
        <Events />
      </section>
    </>
  );
}
export default LandingPage;
