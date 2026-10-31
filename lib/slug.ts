/**
 * URL-safe slug from a project name.
 *
 * Project URLs are stable once created: renaming a project does not change its
 * slug, because links to a project get shared in chat.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // Strip diacritics so "Café" and "Cafe" produce the same slug.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
