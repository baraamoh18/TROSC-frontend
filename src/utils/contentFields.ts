import { useState } from "react";
import type { SyllabusItem } from "../services/api";
import { linkProblem, useTrustedHosts } from "./trustedHosts";

// Helpers for the cover, syllabus and attachment fields in components/Studio/ContentFields.

/** Placeholder covers the API fills in when none is set; treat them as empty. */
export const realCover = (url?: string) => (url && !url.includes("placehold.co") ? url : "");

/** What the API takes to drop a cover and go back to its default. */
export const COVER_CLEAR = "";

/**
 * The coverImage to send on save: the new link; COVER_CLEAR when an existing
 * cover was removed; undefined (leave it out) when there was none to begin with.
 */
export const coverForSave = (value: string, original?: string): string | undefined => {
  const v = value.trim();
  if (v) return v;
  return realCover(original) ? COVER_CLEAR : undefined;
};

/** Why a cover link would be refused, or null. */
export const coverProblem = (value: string): string | null => {
  if (!value.trim()) return null;
  try {
    return new URL(value.trim()).protocol === "https:" ? null : "The link must start with https://";
  } catch {
    return "Enter a full link starting with https://";
  }
};

/** Attachment links, one per line, checked against the trusted hosts. */
export const useLinkList = (initial: string[] = []) => {
  const hosts = useTrustedHosts();
  const [text, setText] = useState(initial.join("\n"));
  const links = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const problem = links.map((l) => linkProblem(l, hosts)).find(Boolean) ?? null;
  return { text, setText, links, problem, hosts };
};

/** Syllabus rows ready to send: blank rows dropped, text trimmed. */
export const cleanSyllabus = (items: SyllabusItem[]): SyllabusItem[] =>
  items
    .filter((it) => it.title.trim())
    .map((it) => ({
      title: it.title.trim(),
      ...(it.description?.trim() ? { description: it.description.trim() } : {}),
    }));
