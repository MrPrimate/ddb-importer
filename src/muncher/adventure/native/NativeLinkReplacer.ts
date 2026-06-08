import { logger, utils } from "../../../lib/_module";
import { foundryCompendiumReplace as sharedCompendiumReplace } from "../CompendiumLinkReplacer";
import { IMAGE_EXT } from "./NativeShared";

/**
 * Native (journals-only) adventure link rewriting. The compendium-link logic is
 * shared with the zip importer via CompendiumLinkReplacer; here we only add the
 * native-specific image-path rewrite + CSS classes, plus a thin wrapper that
 * passes the native `adventureConfig.lookups` and the optional 2014→2024
 * `monstersToReplace` map (the world-actor branch stays off via shared defaults).
 */

/**
 * Rewrite adventure image links (port of the muncher's replaceImageLinks), then
 * point them at the uploaded stored paths.
 *
 *  - `<img src="./<bookCode>/X">` (or `"<bookCode>/X"`) → `assets/X`
 *  - `<a href="ddb://file/<bookCode>/X">`: image ext → drop href; else → `assets/X`
 *  - finally, any `assets/X` ref → the uploaded stored path from `assetMap`
 *
 * Mutates the live document nodes (DOMParser persists setAttribute into innerHTML).
 */
export function replaceImageLinks(doc: Document, bookCode: string, assetMap: Map<string, string>): void {
  const dotPrefix = `./${bookCode}/`;
  const barePrefix = `${bookCode}/`;

  // 1. relative <img> src → assets/
  doc.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    if (src.startsWith(dotPrefix)) img.setAttribute("src", `assets/${src.slice(dotPrefix.length)}`);
    else if (src.startsWith(barePrefix)) img.setAttribute("src", `assets/${src.slice(barePrefix.length)}`);
  });

  // 2. ddb://file/<bookCode>/X anchors
  const fileRe = new RegExp(`^ddb://file/${utils.escapeRegExp(bookCode)}/(.*)$`);
  doc.querySelectorAll("a[href]").forEach((a) => {
    const m = (a.getAttribute("href") ?? "").match(fileRe);
    if (!m) return;
    if (IMAGE_EXT.test(m[1])) a.removeAttribute("href");
    else a.setAttribute("href", `assets/${m[1]}`);
  });

  // 3. swap assets/ refs for the uploaded stored paths
  doc.querySelectorAll("img[src], a[href]").forEach((node) => {
    const attr = node.tagName === "IMG" ? "src" : "href";
    const ref = node.getAttribute(attr) ?? "";
    if (!ref.startsWith("assets/")) return;
    const stored = assetMap.get(ref);
    if (stored) node.setAttribute(attr, stored);
    else logger.warn(`Native asset: no uploaded file for ${ref}`);
  });
}

/** Add the journal CSS classes the DDB book sheet expects. */
export function addClasses(doc: Document): void {
  for (const bq of Array.from(doc.getElementsByTagName("blockquote"))) {
    bq.classList.add("ddb-blockquote");
  }
  for (const h of [...Array.from(doc.getElementsByTagName("H4")), ...Array.from(doc.getElementsByTagName("H5"))]) {
    h.classList.add("ddb-book-header");
  }
}

/**
 * Replace ddb:// links in journal HTML with compendium links, or fall back to DDB urls.
 * Thin wrapper over the shared CompendiumLinkReplacer (journals-only: the world-actor
 * branch stays off; 2014→2024 monster swap applied when adventureConfig carries it).
 * @param text the page HTML
 * @param adventureConfig result of generateAdventureConfig({ full: true }), optionally
 *   carrying `monstersToReplace: {id2014,id2024}[]` from the native importer
 */
export function foundryCompendiumReplace(text: string, adventureConfig: any): string {
  return sharedCompendiumReplace(text, {
    lookups: adventureConfig.lookups,
    monstersToReplace: adventureConfig.monstersToReplace ?? [],
  });
}
