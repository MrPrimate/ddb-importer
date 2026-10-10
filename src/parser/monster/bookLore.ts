import { splitMonsterBiography } from "./biographyText";

/**
 * Reads monster lore out of a D&D Beyond book database (the decrypted `.db3` the native adventure
 * importer downloads).
 *
 * The monster API leaves `characteristicsDescription` empty for many monsters (every 2024 Monster
 * Manual entry, most 2014 Monster Manual entries), although the monster page shows a long lore
 * section. The book's `HTMLDescription` table holds that page split into ordered sections for each
 * monster (`EntityTypeID` = the monster entity type, `EntityID` = the DDB monster id):
 * - an avatar `<img>`, then the stat block
 * - `<h3>Traits</h3>`, `<h3>Actions</h3>` ... each followed by its body
 * - `<h3>Description</h3>` + body: identical to the API `characteristicsDescription`
 * - `<h3>Lair</h3>` + body: identical to the API `lairDescription`
 * - `<hr>` + body: the lore the API never sends
 * - the italic source line
 */

const LOOKUP_LINK_TYPES = new Set(["spells", "magicitems", "weapons", "armor", "adventuring-gear", "monsters", "vehicles"]);
const RULE_LINK_TYPES = new Set(["conditions", "senses", "skills"]);

/**
 * Comparable text of an HTML fragment: tags become spaces, entities are decoded (the API writes
 * `&rsquo;` where the book has `’`) and whitespace is collapsed.
 */
function plainText(html: string | null | undefined): string {
  const stripped = (html ?? "").replace(/<[^>]+>/g, " ");
  const text = new DOMParser().parseFromString(stripped, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

function sentencesOf(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence !== "");
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^0-9a-z-]/g, "");
}

/**
 * Splits one monster's ordered `HTMLDescription` texts into the sections that matter for the
 * biography. Section headings are whole rows, each followed by its body row.
 * @param parts the monster's `Text` values in `DisplayOrder` order
 * @returns the description, lair and lore bodies, empty strings when absent
 */
export function splitBookMonsterSections(parts: string[]): IBookMonsterSections {
  const sections: IBookMonsterSections = { description: "", lair: "", lore: "" };
  for (let i = 0; i < parts.length - 1; i++) {
    const heading = parts[i].trim();
    const body = parts[i + 1].trim();
    if ((/^<hr\s*\/?>$/i).test(heading)) sections.lore = body;
    else if ((/^<h3>\s*Description\s*<\/h3>$/i).test(heading)) sections.description = body;
    else if ((/^<h3>\s*Lair\s*<\/h3>$/i).test(heading)) sections.lair = body;
  }
  return sections;
}

/**
 * Rewrites the book's `ddb://` links into the shapes the monster API uses, so the monster
 * parser's own link pass (`DDBReferenceLinker.replaceMonsterALinks`) resolves them:
 * - spells / items / monsters / vehicles: `https://www.dndbeyond.com/<type>/<id>-<slug>`, which
 *   the linker matches against the compendium indexes
 * - conditions / senses / skills: a `data-tooltip-json-href`, which the linker turns into a
 *   reference
 * - book pages (`ddb://compendium/<book>/<page>`): the DDB source page url
 * - anything else (rules glossary, lore glossary, actions): the link is dropped, its text kept
 * Some book links carry a stray `https://dndbeyond.com` prefix before `ddb://`, which is ignored.
 * @param html lore HTML from the book
 * @returns the HTML with no `ddb://` links left
 */
export function normalizeBookLinks(html: string): string {
  if (!html.includes("ddb://")) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll<HTMLAnchorElement>("a[href*='ddb://']").forEach((node) => {
    const href = node.getAttribute("href") ?? "";
    const match = href.slice(href.indexOf("ddb://")).match(/^ddb:\/\/([^/]+)\/?(.*)$/);
    const type = match?.[1] ?? "";
    const rest = match?.[2] ?? "";
    const id = rest.match(/^(\d+)/)?.[1];

    if (LOOKUP_LINK_TYPES.has(type) && id) {
      const slug = slugify(node.textContent ?? "");
      node.setAttribute("href", `https://www.dndbeyond.com/${type}/${id}${slug ? `-${slug}` : ""}`);
    } else if (RULE_LINK_TYPES.has(type) && id) {
      node.setAttribute("href", "https://www.dndbeyond.com/sources/dnd/free-rules/rules-glossary");
      node.setAttribute("data-tooltip-json-href", `/${type}/${id}/tooltip-json`);
    } else if (type === "compendium" && rest) {
      node.setAttribute("href", `https://www.dndbeyond.com/sources/dnd/${rest}`);
    } else {
      node.replaceWith(...Array.from(node.childNodes));
    }
  });
  return doc.body.innerHTML;
}

/**
 * The source fields to patch onto an API monster from its book sections. The book lore follows
 * whatever description DDB sent, as on the monster page, unless the lore already holds every
 * sentence of that description, in which case the lore replaces it; a lair DDB left empty comes from the
 * book's Lair section, or from a "<Name> Lairs" section inside the lore (the 2024 Monster Manual
 * layout), which also sends it through the lair parser.
 * @param monster the monster as fetched from the API
 * @param sections the book sections for the monster
 * @returns the fields to overwrite, or null when the book adds nothing
 */
export function bookLorePatch(monster: IDDBMonsterSourceData, sections: IBookMonsterSections): Partial<IDDBMonsterSourceData> | null {
  const patch: Partial<IDDBMonsterSourceData> = {};
  const existing = (monster.characteristicsDescription ?? "").trim();
  const description = existing === "" ? normalizeBookLinks(sections.description) : existing;
  const lore = normalizeBookLinks(sections.lore);

  const descriptionText = plainText(description);
  const loreText = plainText(lore);
  // DDB's short description is often a summary built from lore sentences; when the lore already
  // holds every one of them, it stands alone rather than repeating them. A description with a
  // sentence of its own stays, followed by the lore, as on the monster page.
  const loreHoldsDescription = descriptionText !== ""
    && sentencesOf(descriptionText).every((sentence) => loreText.includes(sentence));
  let parts: string[];
  if (loreText === "" || descriptionText.includes(loreText)) {
    // no lore, or the description already carries it (a re-run over patched data)
    parts = [description];
  } else if (loreHoldsDescription) {
    parts = [lore];
  } else {
    parts = [description, lore];
  }
  const biography = parts.filter((part) => part !== "").join("\n");
  if (biography !== existing) patch.characteristicsDescription = biography;

  if (plainText(monster.lairDescription) === "") {
    const lair = sections.lair !== ""
      ? normalizeBookLinks(sections.lair)
      : splitMonsterBiography(lore).lair;
    if (lair !== "") {
      patch.lairDescription = lair;
      patch.hasLair = true;
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
