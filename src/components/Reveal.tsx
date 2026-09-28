import { useEffect, useRef, type ReactNode } from "react";
import { delay as delayStyle } from "../utils/motion";

interface RevealProps {
  children: ReactNode;
  /** Stagger in ms, for items that reveal together. */
  delay?: number;
  className?: string;
}

/** Fades and lifts its content in the first time it scrolls into view. */
const Reveal = ({ children, delay = 0, className }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-reveal", "shown");
    if (!("IntersectionObserver" in window)) {
      show();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal="" style={delayStyle(delay)} className={className}>
      {children}
    </div>
  );
};

export default Reveal;
