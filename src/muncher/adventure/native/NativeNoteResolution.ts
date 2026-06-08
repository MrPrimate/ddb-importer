// Pure note -> journal-page resolution. Dependency-free (no lib/_module chain)
// so it can be unit-tested in the node vitest environment.

import { ddbSlugify } from "./NativeShared";

// PageRef, NoteTarget + JournalPageLookup are declared globally in ./types.d.ts.

// Normalise a slug: drop empty hyphen segments, lowercase. The `#` is NOT
// stripped: DDB section slugs legitimately contain it (e.g.
// "phandalin#RedbrandHideout" is the section's own slug, distinct from the
// "phandalin" chapter slug), and notes reference the full slug verbatim.
export function normSlug(slug: string | null | undefined): string {
  if (!slug) return "";
  return slug.split("-").filter((x) => x.trim() !== "").join("-").toLowerCase();
}

// The base slug with any `#anchor` suffix removed - used only as a fallback for
// genuine "<page>#<sub-anchor>" notes whose page slug is the bare "<page>".
function baseSlug(slug: string | null | undefined): string {
  if (!slug) return "";
  return normSlug(slug.split("#")[0]);
}

/**
 * Guess a slugLink from a note's display name, for older meta-data that omits
 * `slugLink`. Mirrors the DDB heading-id scheme: trim, drop a leading-zero pad
 * on a numeric prefix, then slugify (`name.replace(/[^\w\d]+/g, "")`).
 * e.g. "01. Secret Den" -> "1SecretDen" (matches the heading id DDB emits).
 * Returns null when there is no usable name.
 */
export function guessSlugLink(name: string | null | undefined): string | null {
  if (!name) return null;
  const slug = ddbSlugify(name.trim()).replace(/^0+(?=\d)/, "");
  return slug === "" ? null : slug;
}

/**
 * Resolve a note's DDB flags to a journal page + in-page anchor in DDBMaps
 * priority order: contentChunkId -> slugLink (element id) -> slug. Returns null
 * when no page matches.
 *
 * The `anchor` is what the activateNote -> anchorInjection hook scrolls to. We
 * prefer the heading id mapped from the note's contentChunkId (guaranteed to
 * match an injected heading id on the resolved page); slugLink resolves to its
 * own id; a slug-only match has no specific anchor (page opens at the top).
 */
export function resolveNote(flags: any, lookup: JournalPageLookup, name?: string | null): NoteTarget | null {
  const ddb = flags?.ddb ?? {};
  const meta = flags?.ddbimporter?.metaDataNote ?? {};

  const chunk = ddb.contentChunkId ?? meta.contentChunkId ?? null;
  if (chunk && lookup.pageByChunk.has(chunk)) {
    const ref = lookup.pageByChunk.get(chunk)!;
    return { ...ref, anchor: lookup.anchorByChunk.get(chunk) ?? null };
  }

  // slugLink, falling back to a guess from the note name for older meta-data
  // that omits it.
  const slugLink = ddb.slugLink ?? meta.slugLink
    ?? guessSlugLink(name ?? ddb.labelName ?? meta.linkName ?? meta.labelName);
  if (slugLink && lookup.pageByElementId.has(slugLink)) {
    return { ...lookup.pageByElementId.get(slugLink)!, anchor: slugLink };
  }

  const slug = ddb.slug ?? meta.slug ?? null;
  // Exact slug match first (page slugs include their `#section`).
  const full = normSlug(slug);
  if (full && lookup.pageBySlug.has(full)) {
    // The note's slugLink may still name a heading within the page
    // (anchorInjection no-ops if the TOC lacks it).
    return { ...lookup.pageBySlug.get(full)!, anchor: slugLink ?? null };
  }
  // Fallback: a "<page>#<sub-anchor>" note whose page slug is the bare "<page>".
  // The `#`-suffix becomes the in-page anchor.
  const base = baseSlug(slug);
  if (base && base !== full && lookup.pageBySlug.has(base)) {
    const hashAnchor = String(slug).split("#")[1] ?? null;
    return { ...lookup.pageBySlug.get(base)!, anchor: slugLink ?? hashAnchor ?? null };
  }

  return null;
}
