// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { bookLorePatch, normalizeBookLinks, splitBookMonsterSections } from "../../../src/parser/monster/bookLore";

// synthetic rows in the shape of a book database's HTMLDescription sections for one monster
const statBlock = "\r\n<div class=\"stat-block\"><h4>Test Wyrm</h4><p>Huge Dragon</p></div>";
const source = "<p style=\"font-style: italic; text-align: right; font-size: 0.8em;\">Test Book, pg. 1</p>";
const description = "<p>Test wyrms are long.</p>";
const lairBody = "<p>A test wyrm lairs in a drawer.</p>";
const loreIntro = "<p>Test wyrms hoard spoons.</p>";
const loreLair = "<h3>Test Wyrm Lairs</h3>\n<p><strong>Spoon Rain.</strong> It rains spoons.</p>";

function monster(fields: Partial<IDDBMonsterSourceData> = {}): IDDBMonsterSourceData {
  return {
    id: 1,
    name: "Test Wyrm",
    characteristicsDescription: "",
    lairDescription: "",
    hasLair: false,
    ...fields,
  } as IDDBMonsterSourceData;
}

describe("splitBookMonsterSections", () => {
  it("takes the description, lair and lore bodies by their headings", () => {
    const parts = [
      "<img src=\"BOOK_PATH/listing_images/1.png\">", statBlock,
      "<h3>Actions</h3>", "<p>Bite.</p>",
      "<h3>Description</h3>", description,
      "<h3>Lair</h3>", lairBody,
      "<hr>", loreIntro,
      source,
    ];
    expect(splitBookMonsterSections(parts)).toEqual({ description, lair: lairBody, lore: loreIntro });
  });

  it("returns empty sections when the page has none", () => {
    expect(splitBookMonsterSections([statBlock, "<h3>Actions</h3>", "<p>Bite.</p>", source]))
      .toEqual({ description: "", lair: "", lore: "" });
  });
});

describe("normalizeBookLinks", () => {
  it("rewrites lookup links into the API url shape the monster linker matches", () => {
    const html = normalizeBookLinks("<p><a href=\"ddb://monsters/123\">Test Wyrm</a> casts <a href=\"ddb://spells/45\">Fire Bolt</a>.</p>");
    expect(html).toContain("href=\"https://www.dndbeyond.com/monsters/123-test-wyrm\"");
    expect(html).toContain("href=\"https://www.dndbeyond.com/spells/45-fire-bolt\"");
  });

  it("gives rule links the tooltip href the rule linker reads", () => {
    const html = normalizeBookLinks("<p><a href=\"ddb://conditions/11\">Poisoned</a></p>");
    expect(html).toContain("data-tooltip-json-href=\"/conditions/11/tooltip-json\"");
  });

  it("points book page links at the DDB source page, ignoring a stray host prefix", () => {
    const html = normalizeBookLinks("<p><a href=\"https://dndbeyond.comddb://compendium/tb/drawers#Spoons\">drawers</a></p>");
    expect(html).toContain("href=\"https://www.dndbeyond.com/sources/dnd/tb/drawers#Spoons\"");
  });

  it("drops links with no target outside the book and keeps their text", () => {
    expect(normalizeBookLinks("<p>See <a href=\"ddb://rulesglossary/79\">Hoard</a>.</p>")).toBe("<p>See Hoard.</p>");
  });

  it("leaves html without book links untouched", () => {
    expect(normalizeBookLinks(description)).toBe(description);
  });
});

describe("bookLorePatch", () => {
  it("fills an empty biography with the lore and takes a lair section out of it", () => {
    const lore = `${loreIntro}\n${loreLair}`;
    const patch = bookLorePatch(monster(), { description: "", lair: "", lore });
    expect(patch).toEqual({ characteristicsDescription: lore, lairDescription: loreLair, hasLair: true });
  });

  it("uses the book description when DDB sent none", () => {
    const patch = bookLorePatch(monster(), { description, lair: "", lore: "" });
    expect(patch).toEqual({ characteristicsDescription: description });
  });

  it("appends the lore after the description DDB sent, and keeps DDB's lair", () => {
    const patch = bookLorePatch(
      monster({ characteristicsDescription: description, lairDescription: lairBody, hasLair: true }),
      { description, lair: lairBody, lore: loreIntro },
    );
    expect(patch).toEqual({ characteristicsDescription: `${description}\n${loreIntro}` });
  });

  it("fills an empty lair from the book's Lair section", () => {
    const patch = bookLorePatch(monster({ characteristicsDescription: description }), { description, lair: lairBody, lore: "" });
    expect(patch).toEqual({ lairDescription: lairBody, hasLair: true });
  });

  it("uses the lore alone when it already holds every sentence of DDB's description", () => {
    const summary = "<p>Test wyrms hoard spoons.</p>";
    const lore = "<p>Test wyrms hoard spoons. They polish each one nightly.</p>";
    const patch = bookLorePatch(monster({ characteristicsDescription: summary }), { description: summary, lair: "", lore });
    expect(patch).toEqual({ characteristicsDescription: lore });
  });

  it("keeps a description with a sentence of its own, followed by the lore", () => {
    const summary = "<p>Test wyrms hoard spoons. Nobody knows why.</p>";
    const lore = "<p>Test wyrms hoard spoons. They polish each one nightly.</p>";
    const patch = bookLorePatch(monster({ characteristicsDescription: summary }), { description: summary, lair: "", lore });
    expect(patch).toEqual({ characteristicsDescription: `${summary}\n${lore}` });
  });

  it("matches DDB's encoded entities against the book's typographic characters", () => {
    const encoded = "<p>The wyrm&rsquo;s hoard is &ldquo;vast&rdquo;.</p>";
    const lore = "<p>The wyrm’s hoard is “vast”.</p>";
    expect(bookLorePatch(monster({ characteristicsDescription: encoded }), { description: encoded, lair: "", lore })).toBeNull();
  });

  it("adds nothing when the lore is already in the biography", () => {
    const patched = monster({ characteristicsDescription: `${description}\n${loreIntro}` });
    expect(bookLorePatch(patched, { description, lair: "", lore: loreIntro })).toBeNull();
  });
});
