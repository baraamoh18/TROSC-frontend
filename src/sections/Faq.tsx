import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import Reveal from "../components/Reveal";
import faq from "../content/faq.json";

// The same file feeds the server-rendered page text and FAQPage data
// (api/seo.ts reads it as /faq.json), so edit the questions there.

interface Item {
  q: string;
  a: string;
  link?: { to: string; label: string };
}

const FaqList = ({ items }: { items: Item[] }) => (
  <div className="divide-y divide-gray-200 border-y border-gray-200">
    {items.map((item) => (
      <details key={item.q} className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-start font-bold text-brand-darker transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
          {item.q}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className="shrink-0 text-brand transition-transform motion-safe:duration-200 group-open:rotate-180"
          />
        </summary>
        <p className="pb-5 leading-relaxed text-neutral-dark">
          {item.a}
          {item.link && (
            <>
              {" "}
              <Link to={item.link.to} className="font-semibold text-brand hover:text-brand-hover">
                {item.link.label}
              </Link>
            </>
          )}
        </p>
      </details>
    ))}
  </div>
);

interface Block {
  eyebrow: string;
  heading: string;
  questions: Item[];
}

/** One language's heading and questions; the Arabic one is the same layout mirrored. */
const FaqBlock = ({ block, arabic = false }: { block: Block; arabic?: boolean }) => (
  <div
    lang={arabic ? "ar" : undefined}
    dir={arabic ? "rtl" : undefined}
    className={`mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 ${arabic ? "font-arabic" : ""}`}
  >
    <Reveal className="self-start">
      {/* Letter spacing would break up joined Arabic letters */}
      <p className={`mb-4 font-bold text-brand ${arabic ? "text-base" : "text-sm uppercase tracking-widest"}`}>{block.eyebrow}</p>
      <h2 className={`text-3xl font-extrabold text-brand-darker md:text-4xl ${arabic ? "leading-snug" : "leading-tight"}`}>
        {block.heading}
      </h2>
    </Reveal>
    <FaqList items={block.questions} />
  </div>
);

// The landing page wraps this in the #faq anchor, so the navbar link
// works while this chunk is still loading.
const Faq = () => (
  <section className="w-full bg-page-alt px-4 py-20 sm:px-6 lg:px-8">
    <FaqBlock block={faq.en} />
    <div className="mx-auto my-16 w-full max-w-6xl border-t border-gray-200" />
    <FaqBlock block={faq.ar} arabic />
  </section>
);

export default Faq;
