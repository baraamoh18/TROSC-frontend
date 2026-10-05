import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}

/** Shared layout for the privacy policy and the terms. */
const LegalPage = ({ title, updated, intro, sections }: LegalPageProps) => {
  usePageTitle(title);
  return (
    <div className="min-h-screen bg-neutral-light pb-20 pt-28">
      <article className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <header className="mb-8 border-b border-neutral-light-active pb-8">
          <h1 className="text-3xl font-extrabold text-primary-darker sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-neutral-dark">Last updated {updated}</p>
          <div className="mt-5 space-y-3 text-base leading-relaxed text-neutral-darker">{intro}</div>
        </header>

        <nav aria-label="On this page" className="mb-10">
          <p className="mb-2 text-sm font-bold text-neutral-darker">On this page</p>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-8 items-center text-primary hover:text-primary-hover">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
              <h2 id={`${s.id}-h`} className="mb-3 text-xl font-bold text-primary-darker">
                {i + 1}. {s.title}
              </h2>
              <div className="space-y-3 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 text-[15px] leading-relaxed text-neutral-darker">{s.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-neutral-light-active pt-6 text-sm text-neutral-dark">
          Questions? Email{" "}
          <a href="mailto:troscscu2@gmail.com" className="font-semibold text-primary hover:text-primary-hover">
            troscscu2@gmail.com
          </a>{" "}
          or use the{" "}
          <Link to="/contact" className="font-semibold text-primary hover:text-primary-hover">
            contact page
          </Link>
          .
        </p>
      </article>
    </div>
  );
};

export default LegalPage;
