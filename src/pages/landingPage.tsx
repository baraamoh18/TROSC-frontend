import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import Tracks from "../sections/Tracks";
import Events from "../sections/Events";
import Announcements from "../sections/Announcements";
import usePageTitle from "../hooks/usePageTitle";
import { Suspense } from "react";
import { lazyWithReload } from "../utils/lazyWithReload";

// Below the fold and mostly text, so it loads after the rest of the page
const Faq = lazyWithReload(() => import("../sections/Faq"));

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
      <section id="faq">
        <Suspense fallback={null}>
          <Faq />
        </Suspense>
      </section>
    </>
  );
}
export default LandingPage;
