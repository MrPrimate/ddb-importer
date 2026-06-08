import { logger, utils } from "../../../lib/_module";
import { normSlug, resolveNote } from "./NativeNoteResolution";

/**
 * Re-point scene note pins (`scene.notes[]`) at the journal pages we built this
 * run, so double-clicking a pin opens the imported DDB journal page (instead of
 * the meta-data placeholder journal the standalone DDBMapMetaData flow uses).
 *
 * The adjustment's notes carry `flags.ddb.contentChunkId` (a specific content
 * chunk), `flags.ddb.slugLink` (in-page anchor / heading id) and
 * `flags.ddb.slug` (page slug). We resolve to a page in DDBMaps' priority order:
 * contentChunkId -> slugLink (element id) -> slug. The slugLink also drives the
 * in-page scroll via the activateNote -> anchorInjection hook (it matches an
 * injected heading id, see NativeHeadingAnchors.injectHeadingAnchors).
 *
 * Scenes are world-only; this resolver always uses raw world journal ids.
 */

export { resolveNote } from "./NativeNoteResolution";

/**
 * Build the lookup indices from the journals we built this run. Parses each
 * page's HTML for content-chunk ids and element ids (the page-level
 * `flags.ddb.contentChunkId` is not populated by the native builder), mirroring
 * the muncher's Journal.generateContentLinks.
 */
const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

// The anchor (injected heading id) for a content chunk: the chunk element is
// itself the heading (DDB notes target a heading chunk), else the first
// descendant heading carrying an id.
function chunkAnchor(node: Element): string | null {
  if (HEADING_TAGS.has(node.tagName) && node.id) return node.id;
  const heading = node.querySelector("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
  return heading?.id ?? null;
}

export function buildJournalPageLookup(journals: any[]): JournalPageLookup {
  const pageByChunk = new Map<string, PageRef>();
  const anchorByChunk = new Map<string, string>();
  const pageByElementId = new Map<string, PageRef>();
  const pageBySlug = new Map<string, PageRef>();

  for (const journal of journals) {
    for (const page of journal.pages ?? []) {
      const ref: PageRef = { entryId: journal._id, pageId: page._id };

      const slug = page.flags?.ddb?.slug;
      if (slug) {
        const key = normSlug(slug);
        if (!pageBySlug.has(key)) pageBySlug.set(key, ref);
      }

      const html = page.text?.content;
      if (typeof html !== "string" || html === "") continue;
      let doc: Document;
      try {
        doc = utils.htmlToDoc(html);
      } catch {
        continue;
      }
      for (const node of Array.from(doc.querySelectorAll("[data-content-chunk-id]"))) {
        const chunk = node.getAttribute("data-content-chunk-id");
        if (!chunk) continue;
        if (!pageByChunk.has(chunk)) pageByChunk.set(chunk, ref);
        if (!anchorByChunk.has(chunk)) {
          const anchor = chunkAnchor(node);
          if (anchor) anchorByChunk.set(chunk, anchor);
        }
      }
      for (const node of Array.from(doc.querySelectorAll("[id]"))) {
        const id = node.getAttribute("id");
        if (id && !pageByElementId.has(id)) pageByElementId.set(id, ref);
      }
    }
  }
  return { pageByChunk, anchorByChunk, pageByElementId, pageBySlug };
}

/**
 * Re-point every scene's `notes[]` entries at the matching native journal page.
 * Mutates each scene's notes in place. Notes that can't be resolved are left
 * untouched (the activateNote hook handles fallback rendering).
 */
export function resolveSceneNotes(scenes: any[], lookup: JournalPageLookup): { resolved: number; unresolved: number } {
  let resolved = 0;
  let unresolved = 0;
  for (const scene of scenes) {
    if (!Array.isArray(scene.notes) || scene.notes.length === 0) continue;
    for (const note of scene.notes) {
      const ref = resolveNote(note.flags, lookup, note.text ?? note.label);
      if (!ref) {
        unresolved++; continue;
      }
      note.entryId = ref.entryId;
      note.pageId = ref.pageId;
      // Stamp the resolved anchor so the activateNote -> anchorInjection hook
      // scrolls to the heading (it reads flags.ddb.slugLink).
      if (ref.anchor) {
        note.flags ??= {};
        note.flags.ddb ??= {};
        note.flags.ddb.slugLink = ref.anchor;
      }
      resolved++;
    }
  }
  if (resolved || unresolved) {
    logger.info(`NativeSceneNoteResolver: ${resolved} note pins resolved, ${unresolved} unresolved`);
  }
  return { resolved, unresolved };
}
