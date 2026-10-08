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

const Faq = () => (
  <section id="faq" className="w-full bg-page-alt px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <Reveal className="self-start">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-brand">Questions</p>
        <h2 className="text-3xl font-extrabold leading-tight text-brand-darker md:text-4xl">
          What students ask before joining.
        </h2>
      </Reveal>
      <FaqList items={faq.en.questions} />
    </div>

    <div
      lang="ar"
      dir="rtl"
      className="mx-auto mt-16 grid w-full max-w-6xl gap-10 border-t border-gray-200 pt-16 font-arabic lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
    >
      <Reveal className="self-start">
        <h2 className="text-3xl font-extrabold leading-tight text-brand-darker md:text-4xl">{faq.ar.heading}</h2>
        <p className="mt-5 max-w-md text-base leading-loose text-neutral-dark">{faq.ar.about}</p>
      </Reveal>
      <FaqList items={faq.ar.questions} />
    </div>
  </section>
);

export default Faq;
