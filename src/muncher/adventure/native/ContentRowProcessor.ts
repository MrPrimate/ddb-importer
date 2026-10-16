import { logger, utils } from "../../../lib/_module";
import { replaceRollLinks } from "../../../parser/lib/DDBTable";
import { addClasses, foundryCompendiumReplace, replaceImageLinks } from "./NativeLinkReplacer";
import { injectHeadingAnchors } from "./NativeHeadingAnchors";

// ImageOpts, ContentRow + ProcessedRow are declared globally in ./types.d.ts.

export const UNKNOWN_JOURNAL_NAME = "Unknown Journal";

/**
 * Some Content rows ship a null/blank Title (seen on the RWG introduction chapter).
 * Foundry rejects a JournalEntry or page without a name, so recover one from the
 * first h1, then h2, then h3 in the page HTML, and otherwise use a placeholder.
 */
export function deriveTitle(doc: Document, title: string | null | undefined): string {
  if (title && title.trim() !== "") return title;
  for (const tag of ["h1", "h2", "h3"]) {
    const text = doc.querySelector(tag)?.textContent?.replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return UNKNOWN_JOURNAL_NAME;
}

/**
 * Port of the muncher's row parent adjustments (Row.js:40-132), applied to the
 * processed rows in document order. Three repairs, mirroring the standalone:
 *
 * 1. Journal hints (Row.js:40-66): per-book enhancement data reparents rows
 *    whose title is listed in a hint's `childNames` under the chapter row
 *    titled `parentName` (e.g. PHB class/spell chapters), carrying the hint's
 *    heading level.
 * 2. "Misformatted db" promotion (Row.js:68-114): some books (e.g. FRHoF) ship
 *    chapter groups where every row has a `parentId` but no row carries that
 *    id as its `cobaltId`. Without repair the whole group is dropped by the
 *    journal builder and the scene/table chapter folders fall back to literal
 *    "Chapter <id>" names. The first orphan in a group is promoted to the
 *    chapter (`cobaltId = parentId`, `parentId = null`, trailing "#" trimmed
 *    from its slug) so subsequent rows attach beneath it.
 * 3. Adjusted-parent fixup (Row.js:116-132): children of a hint-reparented row
 *    (their `parentId` is the reparented row's ORIGINAL `cobaltId`, which no
 *    longer owns a journal) follow it to the same hint chapter at level 3.
 */
export function adjustParentRows(rows: ProcessedRow[], journalHints: JournalHint[] = []): void {
  // seed with every declared chapter (standalone Database.js pass 1)
  const parents: { cobaltId: number; title: string }[] = [];
  for (const row of rows) {
    if (row.cobaltId !== null) parents.push({ cobaltId: row.cobaltId, title: row.title });
  }
  const adjustedParents: { parentId: number | null; originalCobaltId: number | null }[] = [];

  for (const row of rows) {
    const hint = journalHints.find((h) => h.childNames.includes(row.title));
    if (hint) {
      row.level = hint.levelHint ?? 1;
      const parent = parents.find((p) => p.title === hint.parentName);
      if (parent) {
        adjustedParents.push({ parentId: parent.cobaltId, originalCobaltId: row.cobaltId });
        row.cobaltId = null;
        row.parentId = parent.cobaltId;
      }
    }

    if (!hint && row.parentId && !parents.some((p) => p.cobaltId === row.parentId)) {
      logger.warn(`Native adventure: no parent (cobaltId=${row.parentId}) for "${row.title}"; promoting row ${row.id} to chapter`);
      row.cobaltId = row.parentId;
      row.parentId = null;
      if (row.slug?.endsWith("#")) row.slug = row.slug.slice(0, -1);
      parents.push({ cobaltId: row.cobaltId, title: row.title });
    }

    const parentHint = row.parentId !== null
      ? adjustedParents.find((p) => p.originalCobaltId === row.parentId)
      : undefined;
    if (parentHint) {
      row.level = 3;
      row.parentId = parentHint.parentId;
      row.cobaltId = null;
    }
  }
}

/**
 * A map nav container holding the only image of its figure is the map itself (Project_Lamordia's
 * keyed maps, location buttons over the image), not a floating copy of a map shown elsewhere.
 */
function isOnlyFigureImage(container: Element): boolean {
  const figure = container.closest("figure");
  if (!figure || !container.querySelector("img")) return false;
  return Array.from(figure.querySelectorAll("img")).every((img) => container.contains(img));
}

/**
 * Port of the muncher's Row._removeMapContainers: drops the book's map figures
 * (`figure.<bookCode>-map-figure` / `figure.<bookCode>--map-figure`), which DDB
 * renders as a floating map sidebar alongside the chapter text, plus the
 * book-independent `div.map-nav-container` floating map navigation, unless the
 * container holds its figure's only image.
 */
export function removeMapContainers(doc: Document, bookCode: string | undefined): void {
  if (bookCode) {
    doc.body
      .querySelectorAll(`figure.${bookCode}-map-figure, figure.${bookCode}--map-figure`)
      .forEach((node) => node.remove());
  }
  doc.body
    .querySelectorAll("div.map-nav-container")
    .forEach((node) => {
      if (!isOnlyFigureImage(node)) node.remove();
    });
}

/**
 * Rollable dice on the page's text only. `replaceRollLinks` collapses every run of dashes, so run
 * over the serialised HTML it also rewrote attribute values and comments: an asset filename with
 * a double hyphen pointed at a file that does not exist, and `<!--` became `<!-`, bringing the
 * commented-out markup back into the page.
 */
export function replaceRollLinksInText(doc: Document): void {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  for (const node of nodes) {
    const replaced = replaceRollLinks(node.data);
    if (replaced !== node.data) node.data = replaced;
  }
}

/**
 * Port of the journals-relevant parts of the muncher's Row.js +
 * Journal._generateJournalEntryWithPages.
 *
 * Pipeline: parse -> addClasses -> ddb:// link replacement -> remove map figures
 * -> strip the leading title heading -> collapse whitespace. JSDOM is replaced by
 * `utils.htmlToDoc` (DOMParser). Dice replacement and cross-page dynamic links are deferred.
 */
export function processRow(
  row: ContentRow,
  adventureConfig: any,
  images?: ImageOpts,
  bookCode: string | undefined = images?.bookCode,
): ProcessedRow {
  const rawHtml = row.html ?? "";

  // 1. styling classes, then ddb:// link replacement
  const classDoc = utils.htmlToDoc(rawHtml);
  addClasses(classDoc);
  const linked = foundryCompendiumReplace(classDoc.body.innerHTML, adventureConfig);

  const doc = utils.htmlToDoc(linked);
  // resolved before the heading strip below so a missing Title can borrow the page heading
  const title = deriveTitle(doc, row.title);

  // removed before sourceHtml is captured so table and scene parsing never see them, matching Row.js
  removeMapContainers(doc, bookCode);

  // 2. image links -> uploaded stored paths (only when assets were imported)
  if (images) replaceImageLinks(doc, images.bookCode, images.assetMap);

  // capture pre-strip, PRE-dice HTML (tables + headings intact) for table parsing.
  // Dice replacement mangles dice-column headers/cells, so tables must be parsed
  // from this; dice links are added to the page content (below) and to table
  // result text (in buildTable) separately.
  const sourceHtml = doc.body.innerHTML;

  // 3. strip the leading title heading (the journal/page already carries the name)
  const firstElement = doc.body.firstElementChild;
  if (firstElement) {
    const sameTag = doc.body.getElementsByTagName(firstElement.tagName);
    if (firstElement.tagName === "H1" || (sameTag.length === 1 && firstElement.tagName !== "P")) {
      firstElement.remove();
    }
  }

  // 3b. inject heading anchor ids so scene-note pins / TOC can jump to
  // sub-sections (heading id === DDB note slugLink). After the title strip so
  // the page-title heading is never anchored.
  injectHeadingAnchors(doc);

  // 4. rollable dice on the final page content, then collapse whitespace.
  // (muncher DiceReplacer parity - applied AFTER sourceHtml so table detection is unaffected)
  replaceRollLinksInText(doc);
  const content = doc.body.innerHTML.replace(/\s+/g, " ");

  return {
    id: row.id,
    cobaltId: row.cobaltId,
    parentId: row.parentId,
    slug: row.slug,
    title,
    contentChunkId: null,
    content,
    sourceHtml,
    level: 1,
  };
}
