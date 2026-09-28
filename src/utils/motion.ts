import type { CSSProperties } from "react";

/** Stagger delay for .anim-rise, .anim-draw and <Reveal>, in ms. */
export const delay = (ms: number): CSSProperties => ({ "--d": ms }) as CSSProperties;
