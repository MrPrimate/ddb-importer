import { logger, utils } from "../../../lib/_module";
import { normSlug } from "./NativeNoteResolution";

/**
 * Resolves internal cross-references to Foundry content links, after all
 * journals/pages exist (deterministic ids known). Port of the muncher's
 * DynamicLinkReplacer.moduleReplaceLinks. Applied to journal pages and to
 * RollTable result text.
 *
 *  - `ddb://compendium/<bookCode>/<slug>[#header]` → `@UUID[JournalEntry.<jid>.JournalEntryPage.<pid>[#header]]{text}`
 *    (resolved by slug; compendium links inside headings are flattened to text)
 *  - same-page `#anchor` (only with a current page) → `@UUID[...currentPage#anchor]{text}`
 *  - unresolved → left as-is + warning
 */

type SlugIndex = Map<string, { jid: string; pid: string }>;

// slug → { jid, pid } across every page (sections resolve to their chapter journal)
function buildSlugIndex(journals: any[]): SlugIndex {
  const index: SlugIndex = new Map();
  for (const journal of journals) {
    for (const page of journal.pages ?? []) {
      const slug = page.flags?.ddb?.slug;
      if (slug) index.set(normSlug(slug), { jid: journal._id, pid: page._id });
    }
  }
  return index;
}

// Resolve internal links in one HTML string. `current` enables same-page #anchors.
function resolveInHtml(
  html: string,
  slugIndex: SlugIndex,
  compendiumRe: RegExp,
  current?: { jid: string; pid: string },
): { html: string; resolved: number; unresolved: number } {
  const doc = utils.htmlToDoc(html);
  let resolved = 0;
  let unresolved = 0;
  let changed = false;

  // cross-page ddb://compendium links
  doc.querySelectorAll("a[href*='ddb://compendium/']").forEach((node) => {
    const href = node.getAttribute("href") ?? "";
    const match = href.match(compendiumRe);
    if (!match) return;

    const text = node.textContent ?? "";
    // headings: flatten the link to plain text (matches the muncher)
    if (node.closest("h1, h2, h3, h4, h5, h6")) {
      node.replaceWith(doc.createTextNode(text));
      changed = true;
      return;
    }

    const parts = match[1].replace(/\//g, "").split("#");
    const base = normSlug(parts[0]);
    const header = parts[1] ? `#${parts[1]}` : "";
    const target = slugIndex.get(base);
    if (!target) {
      unresolved++;
      logger.warn(`Native links: no page for ${href} (slug "${base}")`);
      return;
    }
    const label = text.trim() !== "" ? `{${text}}` : "";
    node.replaceWith(doc.createTextNode(
      `@UUID[JournalEntry.${target.jid}.JournalEntryPage.${target.pid}${header}]${label}`,
    ));
    resolved++;
    changed = true;
  });

  // same-page #anchor links → link to the current page (journals only)
  if (current) {
    doc.querySelectorAll("a[href^='#']").forEach((node) => {
      const anchor = (node.getAttribute("href") ?? "").slice(1);
      if (!anchor) return;
      const text = node.textContent ?? "";
      const label = text.trim() !== "" ? `{${text}}` : "";
      node.replaceWith(doc.createTextNode(
        `@UUID[JournalEntry.${current.jid}.JournalEntryPage.${current.pid}#${anchor}]${label}`,
      ));
      resolved++;
      changed = true;
    });
  }

  return { html: changed ? doc.body.innerHTML.replace(/\s+/g, " ") : html, resolved, unresolved };
}

/**
 * Resolve internal cross-page links across both journal pages and RollTable
 * result text. The slug index and compendium regex are built once and shared by
 * both passes (called together once all ids exist).
 */
export function resolveInternalLinks(journals: any[], tables: any[], bookCode: string): void {
  const slugIndex = buildSlugIndex(journals);
  const compendiumRe = new RegExp(`ddb://compendium/${utils.escapeRegExp(bookCode)}/([\\w0-9\\-._#+@/]*)`, "i");

  let journalResolved = 0;
  let journalUnresolved = 0;
  for (const journal of journals) {
    for (const page of journal.pages ?? []) {
      if (page.type !== "text" || !page.text?.content) continue;
      const out = resolveInHtml(page.text.content, slugIndex, compendiumRe, { jid: journal._id, pid: page._id });
      page.text.content = out.html;
      journalResolved += out.resolved;
      journalUnresolved += out.unresolved;
    }
  }
  logger.info(`NativeJournalLinker: resolved ${journalResolved} journal links, ${journalUnresolved} unresolved`);

  if (tables.length === 0) return;
  let tableResolved = 0;
  let tableUnresolved = 0;
  for (const table of tables) {
    for (const result of table.results ?? []) {
      if (!result.text) continue;
      const out = resolveInHtml(result.text, slugIndex, compendiumRe);
      result.text = out.html;
      tableResolved += out.resolved;
      tableUnresolved += out.unresolved;
    }
  }
  logger.info(`NativeJournalLinker: resolved ${tableResolved} table-result links, ${tableUnresolved} unresolved`);
}
