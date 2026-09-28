import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import Tracks from "../sections/Tracks";
import Events from "../sections/Events";
import Announcements from "../sections/Announcements";
import usePageTitle from "../hooks/usePageTitle";

function LandingPage() {
  usePageTitle(null);
  return (
    <>
      <section id="home">
        <Hero />
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
