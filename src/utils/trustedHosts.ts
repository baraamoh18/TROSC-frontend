import { useEffect, useState } from "react";
import { getTrustedHosts } from "../services/api";

// The API rejects any session, material, attachment or submission link that
// isn't https on one of these hosts or a subdomain of one. The list comes from
// GET /config/trusted-hosts; this copy covers the moment before it loads.
const FALLBACK_HOSTS = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "drive.google.com",
  "docs.google.com",
  "dropbox.com",
  "dl.dropboxusercontent.com",
  "github.com",
  "raw.githubusercontent.com",
  "res.cloudinary.com",
  "i.imgur.com",
  "imgur.com",
  "cdn.discordapp.com",
  "media.discordapp.net",
];

let cached: string[] | null = null;
let pending: Promise<string[]> | null = null;

function loadTrustedHosts(): Promise<string[]> {
  if (cached) return Promise.resolve(cached);
  pending ??= getTrustedHosts()
    .then((res) => {
      const hosts = res.data?.trustedHosts;
      cached = hosts?.length ? hosts : FALLBACK_HOSTS;
      return cached;
    })
    .catch(() => {
      pending = null;
      return FALLBACK_HOSTS;
    });
  return pending;
}

export function useTrustedHosts(): string[] {
  const [hosts, setHosts] = useState<string[]>(cached ?? FALLBACK_HOSTS);
  useEffect(() => {
    let active = true;
    loadTrustedHosts().then((h) => {
      if (active) setHosts(h);
    });
    return () => {
      active = false;
    };
  }, []);
  return hosts;
}

/** Why the API would refuse this link, or null when it would accept it. */
export function linkProblem(value: string, hosts: string[]): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter a full link starting with https://";
  }
  if (url.protocol !== "https:") return "The link must start with https://";
  const host = url.hostname.toLowerCase();
  if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
    return `Links on ${host} aren't accepted. Use one of the allowed hosts.`;
  }
  return null;
}

/** Short, readable list for hints under link fields. */
export const hostListLabel = (hosts: string[]) => hosts.join(", ");
