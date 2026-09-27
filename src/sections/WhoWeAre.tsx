import TeamPic from '../../assets/teamwork.webp';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/** belowNavbar: leave room for the fixed navbar when this is the first section. */
function WhoWeAre({ belowNavbar = true }: { belowNavbar?: boolean }) {
  const { user } = useAuth();
  return (
    <>
      {/* Hero Section */}
      <section className={belowNavbar ? "pt-16" : ""}>
        <div className="w-full h-[500px] overflow-hidden relative">
          <div className="absolute inset-0 z-10 bg-black/40"></div>


          <div className="absolute inset-0 z-20 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-2xl">
                Not just a team. A family of growth.
              </h1>
              <div className="mt-8">
                <Link
                  to={user ? "/dashboard" : "/signup"}
                  className="inline-block bg-primary text-white font-bold text-lg py-3 px-8 rounded-lg hover:bg-primary-hover transition-colors duration-300 shadow-lg"
                >
                  {user ? "Go to my dashboard" : "Join our family"}
                </Link>
              </div>
            </div>
          </div>

          <img
            src={TeamPic}
            alt="TROSC members together at a team meetup"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </section>

      {/* Who We Are Section */}
      <section id="about" className="bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Who We Are
            </h2>

            <p className="text-base md:text-lg leading-relaxed text-gray-700 font-semibold">
              TROSC is a student-led team from the Faculty of Computers and Information. We run
              learning tracks in Frontend & UI/UX, Backend, Mobile, Cyber Security, AI and 3D, each
              with sessions, weekly tasks, assignments and instructors who review your work.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

export default WhoWeAre;
