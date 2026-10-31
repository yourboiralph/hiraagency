/**
 * Link handling for submissions. Client-safe: no database, no `server-only`.
 * Everything that gets stored goes through `normalizeUrl` first.
 */

const PLATFORMS: { pattern: RegExp; name: string }[] = [
  { pattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/, name: "youtube" },
  { pattern: /(^|\.)vimeo\.com$/, name: "vimeo" },
  { pattern: /(^|\.)loom\.com$/, name: "loom" },
  { pattern: /(^|\.)drive\.google\.com$/, name: "drive" },
  { pattern: /(^|\.)docs\.google\.com$/, name: "docs" },
  { pattern: /(^|\.)figma\.com$/, name: "figma" },
  { pattern: /(^|\.)notion\.so$|(^|\.)notion\.site$/, name: "notion" },
  { pattern: /(^|\.)dropbox\.com$/, name: "dropbox" },
  { pattern: /(^|\.)github\.com$/, name: "github" },
  { pattern: /(^|\.)framer\.com$/, name: "framer" },
  { pattern: /(^|\.)behance\.net$/, name: "behance" },
  { pattern: /(^|\.)dribbble\.com$/, name: "dribbble" },
  { pattern: /(^|\.)instagram\.com$/, name: "instagram" },
  { pattern: /(^|\.)tiktok\.com$/, name: "tiktok" },
  { pattern: /(^|\.)canva\.com$/, name: "canva" },
];

/**
 * Accepts what people actually paste: `figma.com/file/…` without a scheme,
 * with stray whitespace, or already normalized. Returns null when it is not a
 * web address we are willing to store — including `javascript:` and `data:`.
 */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value)
    ? value
    : `https://${value}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null;

  return url.toString();
}

export function platformOf(normalizedUrl: string): string | null {
  try {
    const host = new URL(normalizedUrl).hostname
      .replace(/^www\./, "")
      .toLowerCase();

    return PLATFORMS.find(({ pattern }) => pattern.test(host))?.name ?? null;
  } catch {
    return null;
  }
}

/** Short, readable label when the author did not give one. */
export function hostnameOf(normalizedUrl: string): string {
  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    return normalizedUrl;
  }
}
