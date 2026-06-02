// Heading-anchor injection for native journal pages. Kept dependency-free
// (DOM only) so it can be unit-tested without the heavy parser/_module chain.

import { ddbSlugify } from "./NativeShared";

// Sanitise a heading's text into the slugLink form DDB notes use (via
// `ddbSlugify`: case preserved, no separators). Mirrors the muncher's
// NoteFactory.getNoteTitle (bold text first, else full text) + the `slugLink`
// formula, so an injected heading id equals the note's slugLink.
function headingSlugLink(heading: Element): string {
  const bold = heading.querySelector("b, strong");
  const text = (bold?.textContent ?? heading.textContent ?? "").trim();
  return ddbSlugify(text);
}

/**
 * Inject anchor ids onto headings so scene-note pins (and the in-journal TOC)
 * can jump to sub-sections. Foundry derives a page's TOC slug from
 * `heading.id || heading.slugify()` (JournalEntryPage._makeHeadingNode); DDB
 * note `slugLink`s use a different shape (`Text.replace(/[^\w\d]+/g, "")`), so
 * without an explicit id the TOC slug never matches the note and the jump is
 * silently dropped. We stamp `heading.id` using the same formula that produced
 * the note slugLink, making TOC slug === note slugLink.
 *
 * Headings that already carry an id are left untouched (respect DDB-supplied
 * anchors). Duplicate ids are harmless: Foundry dedupes at the TOC level.
 */
export function injectHeadingAnchors(doc: Document): void {
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  for (const heading of Array.from(headings)) {
    if (heading.id) continue;
    const id = headingSlugLink(heading);
    if (id) heading.setAttribute("id", id);
  }
}
