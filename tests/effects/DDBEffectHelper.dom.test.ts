// @vitest-environment jsdom
// Characterization tests for the HTML list/paragraph scraping helpers on
// DDBEffectHelper: extractListItems and extractParagraphItems.
//
// These pin the fragile nextSibling fallback chain
//   (content as HTMLElement).innerHTML ?? (content as Text).wholeText ?? content.textContent
// exactly as it behaves today (including the untrimmed content strings in the
// list variant), because this chain is the top refactor-fragility risk.
//
// DDBEffectHelper is the unit under test so it is imported un-mocked; the
// barrels its import chain drags in are stubbed exactly as in the pure test.

vi.mock("../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class {},
}));
import DDBEffectHelper from "../../src/effects/DDBEffectHelper";

describe("DDBEffectHelper.extractListItems", () => {
  it("extracts numbered title/content pairs from an ol with em titles", () => {
    const html = "<ol><li><em>Fire.</em> Deals fire damage.</li><li><em>Cold.</em> Deals cold damage.</li></ol>";
    expect(DDBEffectHelper.extractListItems(html)).toEqual([
      { number: 1, title: "Fire", content: " Deals fire damage.", full: "<em>Fire.</em> Deals fire damage." },
      { number: 2, title: "Cold", content: " Deals cold damage.", full: "<em>Cold.</em> Deals cold damage." },
    ]);
  });

  it("does not trim text-node content (unlike the paragraph variant)", () => {
    // wholeText is used raw; the leading space after </em> survives
    const html = "<ol><li><em>Ray.</em>   spaced out content   </li></ol>";
    const [item] = DDBEffectHelper.extractListItems(html);
    expect(item.content).toBe("   spaced out content   ");
  });

  it("uses innerHTML when the node after the title is an element", () => {
    const html = "<ol><li><em>Ray.</em><span>inner <b>bold</b></span></li></ol>";
    const [item] = DDBEffectHelper.extractListItems(html);
    expect(item.content).toBe("inner <b>bold</b>");
    expect(item.full).toBe("<em>Ray.</em><span>inner <b>bold</b></span>");
  });

  it("falls through to textContent for a comment node sibling", () => {
    // comments have neither innerHTML nor wholeText; textContent is the comment body
    const html = "<ol><li><em>Ray.</em><!-- hidden note --></li></ol>";
    const [item] = DDBEffectHelper.extractListItems(html);
    expect(item.content).toBe(" hidden note ");
  });

  it("keeps a whitespace-only text node as content", () => {
    const html = "<ol><li><em>Ray.</em> </li></ol>";
    expect(DDBEffectHelper.extractListItems(html)).toEqual([
      { number: 1, title: "Ray", content: " ", full: "<em>Ray.</em> " },
    ]);
  });

  it("supports a strong titleType", () => {
    const html = "<ol><li><strong>Alpha.</strong> one</li></ol>";
    const [item] = DDBEffectHelper.extractListItems(html, { titleType: "strong" });
    expect(item.title).toBe("Alpha");
    expect(item.content).toBe(" one");
  });

  it("supports a ul list type", () => {
    const html = "<ul><li><em>Alpha.</em> one</li></ul>";
    const [item] = DDBEffectHelper.extractListItems(html, { type: "ul" });
    expect(item.title).toBe("Alpha");
  });

  it("ignores a ul when looking for the default ol and falls back to paragraphs", () => {
    const html = "<ul><li><em>Alpha.</em> one</li></ul>";
    // no ol present, and no p elements either, so the paragraph fallback is empty
    expect(DDBEffectHelper.extractListItems(html)).toEqual([]);
  });

  it("only reads the first matching list in the document", () => {
    const html = "<ol><li><em>First.</em> a</li></ol><ol><li><em>Second.</em> b</li></ol>";
    const items = DDBEffectHelper.extractListItems(html);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("First");
  });

  it("flattens nested lists, duplicating nested content in the outer full", () => {
    const html = "<ol><li><em>Outer.</em> o<ol><li><em>Inner.</em> i</li></ol></li></ol>";
    const items = DDBEffectHelper.extractListItems(html);
    expect(items).toEqual([
      {
        number: 1,
        title: "Outer",
        content: " o",
        full: "<em>Outer.</em> o<ol><li><em>Inner.</em> i</li></ol>",
      },
      { number: 2, title: "Inner", content: " i", full: "<em>Inner.</em> i" },
    ]);
  });

  it("skips items without a title but keeps positional numbering gaps", () => {
    const html = "<ol><li>plain, no title</li><li><em>Titled.</em> yes</li></ol>";
    const items = DDBEffectHelper.extractListItems(html);
    expect(items).toEqual([
      { number: 2, title: "Titled", content: " yes", full: "<em>Titled.</em> yes" },
    ]);
  });

  it("skips items whose title has no following sibling", () => {
    const html = "<ol><li><em>Lonely.</em></li><li><em>Paired.</em> ok</li></ol>";
    const items = DDBEffectHelper.extractListItems(html);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Paired");
  });

  it("keeps an empty title element as an empty string title", () => {
    const html = "<ol><li><em></em> content only</li></ol>";
    expect(DDBEffectHelper.extractListItems(html)).toEqual([
      { number: 1, title: "", content: " content only", full: "<em></em> content only" },
    ]);
  });

  it("removes only a single trailing dot from the title", () => {
    const html = "<ol><li><em>Mr. Smith.</em> hi</li></ol>";
    const [item] = DDBEffectHelper.extractListItems(html);
    expect(item.title).toBe("Mr. Smith");
  });

  it("keeps the trailing dot when the title ends with whitespace (replace runs before trim)", () => {
    // /\.$/ does not match "Fire. " so the dot survives the later trim
    const html = "<ol><li><em>Fire. </em> hi</li></ol>";
    const [item] = DDBEffectHelper.extractListItems(html);
    expect(item.title).toBe("Fire.");
  });

  it("recovers unclosed li tags via the lenient HTML parser", () => {
    const html = "<ol><li><em>A.</em> one<li><em>B.</em> two</ol>";
    const items = DDBEffectHelper.extractListItems(html);
    expect(items).toEqual([
      { number: 1, title: "A", content: " one", full: "<em>A.</em> one" },
      { number: 2, title: "B", content: " two", full: "<em>B.</em> two" },
    ]);
  });

  it("falls back to paragraph extraction when the list yields no items", () => {
    // the ol has no strong titles, so with titleType strong the list produces
    // nothing and the fallback picks the paragraphs (carrying titleType along)
    const html = "<ol><li><em>EmOnly.</em> nope</li></ol><p><strong>Para.</strong> from paragraph</p>";
    const items = DDBEffectHelper.extractListItems(html, { titleType: "strong" });
    expect(items).toEqual([
      { number: 1, title: "Para", content: "from paragraph", full: "<strong>Para.</strong> from paragraph" },
    ]);
  });

  it("also falls back to paragraphs when there is no list at all", () => {
    const html = "<p><em>Para.</em> only paragraphs here</p>";
    expect(DDBEffectHelper.extractListItems(html)).toEqual([
      { number: 1, title: "Para", content: "only paragraphs here", full: "<em>Para.</em> only paragraphs here" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(DDBEffectHelper.extractListItems("")).toEqual([]);
  });

  it("returns an empty array for bare text with no markup", () => {
    expect(DDBEffectHelper.extractListItems("just some text")).toEqual([]);
  });
});

describe("DDBEffectHelper.extractParagraphItems", () => {
  it("extracts numbered title/content pairs from paragraphs with em titles", () => {
    const html = "<p><em>First.</em> Alpha</p><p><em>Second.</em> Beta</p>";
    expect(DDBEffectHelper.extractParagraphItems(html)).toEqual([
      { number: 1, title: "First", content: "Alpha", full: "<em>First.</em> Alpha" },
      { number: 2, title: "Second", content: "Beta", full: "<em>Second.</em> Beta" },
    ]);
  });

  it("trims text-node content (unlike the list variant)", () => {
    const html = "<p><em>Ray.</em>   spaced   </p>";
    const [item] = DDBEffectHelper.extractParagraphItems(html);
    expect(item.content).toBe("spaced");
  });

  it("numbers sequentially, skipping untitled paragraphs without gaps", () => {
    const html = "<p>no title</p><p><em>One.</em> a</p><p>also none</p><p><em>Two.</em> b</p>";
    const items = DDBEffectHelper.extractParagraphItems(html);
    expect(items.map((i) => [i.number, i.title])).toEqual([
      [1, "One"],
      [2, "Two"],
    ]);
  });

  it("supports a custom container type", () => {
    const html = "<div><em>Boxed.</em> in a div</div>";
    expect(DDBEffectHelper.extractParagraphItems(html, { type: "div" })).toEqual([
      { number: 1, title: "Boxed", content: "in a div", full: "<em>Boxed.</em> in a div" },
    ]);
  });

  it("supports a strong titleType", () => {
    const html = "<p><strong>Bold.</strong> content</p>";
    const [item] = DDBEffectHelper.extractParagraphItems(html, { titleType: "strong" });
    expect(item.title).toBe("Bold");
    expect(item.content).toBe("content");
  });

  it("uses trimmed innerHTML when the node after the title is an element", () => {
    const html = "<p><em>Ray.</em><span> inner <b>bold</b> </span></p>";
    const [item] = DDBEffectHelper.extractParagraphItems(html);
    expect(item.content).toBe("inner <b>bold</b>");
  });

  it("keeps an empty string when the element sibling trims to nothing", () => {
    // "" is not nullish, so the ?? chain does not fall through to later options
    const html = "<p><em>Ray.</em><span>   </span>trailing text</p>";
    const [item] = DDBEffectHelper.extractParagraphItems(html);
    expect(item.content).toBe("");
  });

  it("falls through to trimmed textContent for a comment node sibling", () => {
    const html = "<p><em>Ray.</em><!-- hidden note --></p>";
    const [item] = DDBEffectHelper.extractParagraphItems(html);
    expect(item.content).toBe("hidden note");
  });

  it("skips paragraphs whose title has no following sibling", () => {
    const html = "<p><em>Lonely.</em></p><p><em>Paired.</em> ok</p>";
    const items = DDBEffectHelper.extractParagraphItems(html);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Paired");
  });

  it("includes a whitespace-only text sibling as empty content", () => {
    // the text node exists so the item is kept; wholeText trims to ""
    const html = "<p><em>Ray.</em> </p>";
    expect(DDBEffectHelper.extractParagraphItems(html)).toEqual([
      { number: 1, title: "Ray", content: "", full: "<em>Ray.</em> " },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(DDBEffectHelper.extractParagraphItems("")).toEqual([]);
  });

  it("returns an empty array when no paragraphs exist", () => {
    expect(DDBEffectHelper.extractParagraphItems("<ol><li><em>A.</em> b</li></ol>")).toEqual([]);
  });
});
