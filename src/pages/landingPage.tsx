import WhoWeAre from "../sections/WhoWeAre";
import Divider from "../components/Divider";
import Tracks from "../sections/Tracks";
import Events from "../sections/Events";
import UpcomingEvents from "../sections/UpComingEvents";
import MyEnrollments from "../sections/MyEnrollments";
import Announcements from "../sections/Announcements";

function LandingPage() {
  return (
    <>
      <section id="home">
        <WhoWeAre />
      </section>
      <MyEnrollments />
      <Divider />
      <section id="tracks">
        <Tracks />
      </section>
      <Divider />
      <Announcements />
      <Divider />
      <section id="events">
        <Events />
      </section>
      <Divider />
      <UpcomingEvents />
      <Divider />
    </>
  );
}
export default LandingPage;
