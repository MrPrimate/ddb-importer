import { utils } from "../../../lib/_module";
import { replaceRollLinks } from "../../../parser/lib/DDBTable";
import { addClasses, foundryCompendiumReplace, replaceImageLinks } from "./NativeLinkReplacer";
import { injectHeadingAnchors } from "./NativeHeadingAnchors";

// ImageOpts, ContentRow + ProcessedRow are declared globally in ./types.d.ts.

/**
 * Port of the journals-relevant parts of the muncher's Row.js +
 * Journal._generateJournalEntryWithPages.
 *
 * Pipeline: parse → addClasses → ddb:// link replacement → strip the leading
 * title heading → collapse whitespace. JSDOM is replaced by `utils.htmlToDoc`
 * (DOMParser). Dice replacement and cross-page dynamic links are deferred.
 */
export function processRow(row: ContentRow, adventureConfig: any, images?: ImageOpts): ProcessedRow {
  const title = row.title ?? "";
  const rawHtml = row.html ?? "";

  // 1. styling classes, then ddb:// link replacement
  const classDoc = utils.htmlToDoc(rawHtml);
  addClasses(classDoc);
  const linked = foundryCompendiumReplace(classDoc.body.innerHTML, adventureConfig);

  const doc = utils.htmlToDoc(linked);

  // 2. image links → uploaded stored paths (only when assets were imported)
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
  const content = replaceRollLinks(doc.body.innerHTML).replace(/\s+/g, " ");

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
