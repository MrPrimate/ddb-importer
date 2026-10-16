import { logger, utils } from "../../../lib/_module";
import { normSlug } from "./NativeNoteResolution";

/**
 * Resolves internal cross-references to Foundry content links, after all
 * journals/pages exist (deterministic ids known). Port of the muncher's
 * DynamicLinkReplacer.moduleReplaceLinks. Applied to journal pages and to
 * RollTable result text.
 *
 *  - `ddb://compendium/<bookCode>/<slug>[#header]` -> `@UUID[JournalEntry.<jid>.JournalEntryPage.<pid>[#header]]{text}`
 *    (resolved by slug; compendium links inside headings are flattened to text)
 *  - same-page `#anchor` (only with a current page) -> `@UUID[...currentPage#anchor]{text}`
 *  - unresolved -> left as-is + warning
 *
 * A chapter is split into one page per section, so `<chapter>#<Section>` names a page of its own
 * (its slug carries the anchor) and a sub-heading anchor can sit on any page of the chapter. Both
 * are looked up before falling back to the chapter's first page.
 */

type SlugIndex = Map<string, { jid: string; pid: string }>;
// journal id -> element id -> the pages holding it, in page order
type AnchorIndex = Map<string, Map<string, string[]>>;

// slug -> { jid, pid } across every page (sections resolve to their chapter journal)
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

// every element id on every text page of each journal
function buildAnchorIndex(journals: any[]): AnchorIndex {
  const index: AnchorIndex = new Map();
  for (const journal of journals) {
    const anchors = new Map<string, string[]>();
    for (const page of journal.pages ?? []) {
      if (page.type !== "text" || !page.text?.content) continue;
      for (const match of (page.text.content as string).matchAll(/\sid="([^"]+)"/g)) {
        const holders = anchors.get(match[1]) ?? [];
        if (!holders.includes(page._id)) holders.push(page._id);
        anchors.set(match[1], holders);
      }
    }
    index.set(journal._id, anchors);
  }
  return index;
}

/**
 * The id a link's anchor names in one journal. Injected heading ids keep the heading's case
 * ("Hendrik von Aubrecker" -> `HendrikvonAubrecker`) where DDB's links capitalise every word, and
 * a stat block DDB links as `<Name>StatBlock` can arrive without its own id, leaving the heading.
 */
function findAnchor(anchors: Map<string, string[]> | undefined, anchor: string): string | null {
  if (!anchors || !anchor) return null;
  if (anchors.has(anchor)) return anchor;
  const candidates = [anchor, anchor.replace(/StatBlock$/, "")].filter((candidate) => candidate !== "");
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const match = Array.from(anchors.keys()).find((id) => id.toLowerCase() === lower);
    if (match) return match;
  }
  return null;
}

/**
 * The page a `<slug>[#<Section>][#<anchor>]` link should open. The longest leading run of parts
 * that names a page wins: `<chapter>#<Section>` is a section page of its own, and DDB writes an
 * anchor on that page as `<chapter>#<Section>#<anchor>`. The last remaining part is the anchor,
 * found on whichever page of that journal holds it. An anchor no page holds is dropped: it is
 * usually the section's own title heading, which became the page title.
 */
function resolveTarget(
  parts: string[],
  slugIndex: SlugIndex,
  anchorIndex: AnchorIndex,
): { jid: string; pid: string; anchor: string } | null {
  for (let count = parts.length; count > 0; count--) {
    const target = slugIndex.get(normSlug(parts.slice(0, count).join("#")));
    if (!target) continue;
    const anchor = parts.slice(count).pop() ?? "";
    if (!anchor) return { ...target, anchor: "" };
    const anchors = anchorIndex.get(target.jid);
    const id = findAnchor(anchors, anchor);
    const holders = id ? anchors?.get(id) ?? [] : [];
    // the slug's own page wins when it holds the anchor; ids can repeat across pages
    const pid = holders.length === 0 || holders.includes(target.pid) ? target.pid : holders[0];
    return { jid: target.jid, pid, anchor: id ?? "" };
  }
  return null;
}

// Resolve internal links in one HTML string. `current` enables same-page #anchors.
function resolveInHtml(
  html: string,
  slugIndex: SlugIndex,
  anchorIndex: AnchorIndex,
  compendiumRe: RegExp,
  current?: { jid: string; pid: string; slug: string },
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
    const target = resolveTarget(parts, slugIndex, anchorIndex);
    if (!target) {
      unresolved++;
      logger.warn(`Native links: no page for ${href} (slug "${normSlug(parts[0])}")`);
      return;
    }
    const label = text.trim() !== "" ? `{${text}}` : "";
    const header = target.anchor ? `#${target.anchor}` : "";
    node.replaceWith(doc.createTextNode(
      `@UUID[JournalEntry.${target.jid}.JournalEntryPage.${target.pid}${header}]${label}`,
    ));
    resolved++;
    changed = true;
  });

  // same-page #anchor links -> link to the current page (journals only)
  if (current) {
    doc.querySelectorAll("a[href^='#']").forEach((node) => {
      const anchor = (node.getAttribute("href") ?? "").slice(1);
      if (!anchor) return;
      const text = node.textContent ?? "";
      const label = text.trim() !== "" ? `{${text}}` : "";
      // an anchor on this page stays here; otherwise it can be a sibling section page or a
      // heading on another page of the chapter
      const onPage = Array.from(doc.querySelectorAll("[id]")).some((element) => element.id === anchor);
      const target = onPage || !current.slug
        ? null
        : resolveTarget([current.slug, anchor], slugIndex, anchorIndex);
      const inJournal = target && target.jid === current.jid ? target : null;
      const pid = inJournal?.pid ?? current.pid;
      const resolvedAnchor = inJournal ? inJournal.anchor : anchor;
      const header = resolvedAnchor ? `#${resolvedAnchor}` : "";
      node.replaceWith(doc.createTextNode(
        `@UUID[JournalEntry.${current.jid}.JournalEntryPage.${pid}${header}]${label}`,
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
  const anchorIndex = buildAnchorIndex(journals);
  const compendiumRe = new RegExp(`ddb://compendium/${utils.escapeRegExp(bookCode)}/([\\w0-9\\-._#+@/]*)`, "i");

  let journalResolved = 0;
  let journalUnresolved = 0;
  for (const journal of journals) {
    for (const page of journal.pages ?? []) {
      if (page.type !== "text" || !page.text?.content) continue;
      const slug = normSlug((page.flags?.ddb?.slug ?? "").split("#")[0]);
      const out = resolveInHtml(page.text.content, slugIndex, anchorIndex, compendiumRe, { jid: journal._id, pid: page._id, slug });
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
      const out = resolveInHtml(result.text, slugIndex, anchorIndex, compendiumRe);
      result.text = out.html;
      tableResolved += out.resolved;
      tableUnresolved += out.unresolved;
    }
  }
  logger.info(`NativeJournalLinker: resolved ${tableResolved} table-result links, ${tableUnresolved} unresolved`);
}
