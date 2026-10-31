import { LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr";

import { hostnameOf } from "@/lib/url";

/** Link chips shared by the project feed and the review queue. */
export function LinkChips({
  links,
}: {
  links: { id: string; url: string; label: string | null }[];
}) {
  if (links.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.url}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <LinkSimpleIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
            />
            <span className="truncate">
              {link.label ?? hostnameOf(link.url)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
