import { DDBDescriptions } from "../../../src/parser/lib/_module";

describe("DDBDescriptions.extractActivitySection", () => {
  it("extracts a bold activity section through the next block heading", () => {
    const description = [
      "<p><strong>Replenishing Meal.</strong> As part of a Short Rest, prepare food for",
      "4 + your Proficiency Bonus creatures. A creature that spends Hit Dice regains",
      "an extra <strong>1d8</strong> HP.</p>",
      "<p><strong>Bolstering Treats.</strong> Create a number of treats.</p>",
    ].join(" ");

    expect(DDBDescriptions.extractActivitySection(description, "Replenishing Meal")).toBe([
      "<p>As part of a Short Rest, prepare food for 4 + your Proficiency Bonus creatures.",
      "A creature that spends Hit Dice regains an extra <strong>1d8</strong> HP.</p>",
    ].join(" "));
  });

  it("supports nested italic/bold labels and list-item sections", () => {
    const description = [
      "<ul>",
      "<li><em><strong>Replenishing Meal:</strong></em> Recover {{fixedvalue:8}} extra HP.</li>",
      "<li><em><strong>Bolstering Treats:</strong></em> Gain Temporary HP.</li>",
      "</ul>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Replenishing Meal"))
      .toBe("Recover {{fixedvalue:8}} extra HP.");
  });

  it("supports semantic HTML headings", () => {
    const description = [
      "<h3>Replenishing Meal</h3>",
      "<p>Prepare restorative food.</p>",
      "<h3>Bolstering Treats</h3>",
      "<p>Prepare treats.</p>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Replenishing Meal"))
      .toBe("<p>Prepare restorative food.</p>");
  });

  it("does not treat inline emphasis as a section boundary", () => {
    const description = [
      "<p><strong>Replenishing Meal.</strong> Regain <em>extra</em> HP and roll <strong>1d8</strong>.</p>",
      "<p><strong>Bolstering Treats.</strong> Prepare treats.</p>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Replenishing Meal"))
      .toBe("<p>Regain <em>extra</em> HP and roll <strong>1d8</strong>.</p>");
  });

  it("requires the emphasized heading to match the complete activity name", () => {
    const description = "<p><strong>Meal.</strong> Prepare restorative food.</p>";

    expect(DDBDescriptions.extractActivitySection(description, "Replenishing Meal")).toBeNull();
  });

  it("balances a section extracted from the last list item", () => {
    const description = [
      "<ul>",
      "<li><strong>Alpha:</strong> a.</li>",
      "<li><strong>Beta:</strong> b rules.</li>",
      "</ul>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Beta")).toBe("b rules.");
  });

  it("balances a section bounded by a <br> label inside one paragraph", () => {
    const description = "<p><strong>Alpha.</strong> a.<br><strong>Beta.</strong> b rules.</p>";

    expect(DDBDescriptions.extractActivitySection(description, "Beta")).toBe("b rules.");
  });

  it("drops a trailing list opener that belongs to the next section", () => {
    const description = [
      "<p><strong>Alpha.</strong> a rules:</p>",
      "<ul><li><strong>Beta.</strong> b.</li></ul>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Alpha")).toBe("<p>a rules:</p>");
  });

  it("keeps a balanced inner list inside the extracted section", () => {
    const description = [
      "<p><strong>Alpha.</strong> a rules:</p>",
      "<ul><li>one</li><li>two</li></ul>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Alpha"))
      .toBe("<p>a rules:</p><ul><li>one</li><li>two</li></ul>");
  });

  it("does not treat a weaker italic label as a section boundary", () => {
    const description = [
      "<p><strong>Alpha.</strong> Cast the spell.</p>",
      "<p><em>misty step</em> is cast as part of this action.</p>",
      "<p><strong>Beta.</strong> Other rules.</p>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Alpha"))
      .toBe("<p>Cast the spell.</p><p><em>misty step</em> is cast as part of this action.</p>");
  });

  it("normalizes numeric entities in section labels", () => {
    const description = "<p><strong>Hunter&#8217;s Mark.</strong> Mark the prey.</p>";

    expect(DDBDescriptions.extractActivitySection(description, "Hunter’s Mark"))
      .toBe("<p>Mark the prey.</p>");
  });
});

describe("DDBDescriptions.extractActivitySection on snippets", () => {
  // DDB snippets carry inline markup only: their block structure is literal blank lines.
  const CHEF = [
    "You have taken up cooking as a hobby.",
    "<strong>Ability Score Increase.</strong> Increase your Con. or Wis. by 1.",
    "<strong>Replenishing Meal.</strong> Prepare food during a Short Rest.",
    "<strong>Bolstering Treats.</strong> Cook special treats. They last 8 hours.",
  ].join("\r\n\r\n");

  it("treats a blank line as a block boundary", () => {
    expect(DDBDescriptions.extractActivitySection(CHEF, "Replenishing Meal"))
      .toBe("Prepare food during a Short Rest.");
  });

  it("runs a final section to the end of the snippet", () => {
    expect(DDBDescriptions.extractActivitySection(CHEF, "Bolstering Treats"))
      .toBe("Cook special treats. They last 8 hours.");
  });

  it("matches a multi-word label contained in the activity name", () => {
    expect(DDBDescriptions.extractActivitySection(CHEF, "Create Bolstering Treats"))
      .toBe("Cook special treats. They last 8 hours.");
  });

  it("does not match on containment when an exact label is demanded", () => {
    expect(DDBDescriptions.extractActivitySection(CHEF, "Create Bolstering Treats", { exactOnly: true }))
      .toBeNull();
  });

  it("returns null for an activity the snippet does not describe", () => {
    expect(DDBDescriptions.extractActivitySection(CHEF, "Eat Treat")).toBeNull();
  });

  it("finds unemphasised labels when the snippet carries no markup at all", () => {
    const snippet = "Alpha Strike. Hit them hard.\nBolstering Treats. Cook the treats.";

    expect(DDBDescriptions.extractActivitySection(snippet, "Bolstering Treats")).toBe("Cook the treats.");
  });

  it("does not read an ordinary sentence as an unemphasised label", () => {
    const snippet = "Alpha Strike. You gain proficiency with Cook's Utensils. Hit them hard.";

    expect(DDBDescriptions.extractActivitySection(snippet, "Alpha Strike"))
      .toBe("You gain proficiency with Cook's Utensils. Hit them hard.");
  });
});

describe("DDBDescriptions.extractActivitySection with a qualified activity name", () => {
  // Activity names disambiguate siblings with a parenthesised qualifier that DDB's own
  // section labels never carry.
  const FEY_STEP = [
    "<p>As a bonus action, you can magically teleport up to 30 feet to an unoccupied space.</p>",
    "<p><strong>Autumn.</strong> Up to two creatures must succeed on a Wisdom saving throw or be charmed.</p>",
    "<p><strong>Winter.</strong> One creature must succeed on a Wisdom saving throw or be frightened.</p>",
    "<p><strong>Summer.</strong> Each creature takes fire damage equal to your Charisma modifier.</p>",
  ].join("\r\n");

  it("matches a single-word label once the qualifier is dropped", () => {
    expect(DDBDescriptions.extractActivitySection(FEY_STEP, "Autumn (Save)"))
      .toBe("<p>Up to two creatures must succeed on a Wisdom saving throw or be charmed.</p>");
  });

  it("matches the last section from a qualified name", () => {
    expect(DDBDescriptions.extractActivitySection(FEY_STEP, "Summer (Damage)"))
      .toBe("<p>Each creature takes fire damage equal to your Charisma modifier.</p>");
  });

  it("finds nothing for a qualified name the description does not label", () => {
    // so the activity keeps the inherited teleport snippet
    expect(DDBDescriptions.extractActivitySection(FEY_STEP, "Fey Step (Teleport)")).toBeNull();
  });

  it("prefers a label that carries its own parentheses", () => {
    const description = [
      "<p><strong>Putrid Aura.</strong> Generic rules.</p>",
      "<p><strong>Putrid Aura (Acid and Poison Forms Only).</strong> Specific rules.</p>",
    ].join("");

    expect(DDBDescriptions.extractActivitySection(description, "Putrid Aura (Acid and Poison Forms Only)"))
      .toBe("<p>Specific rules.</p>");
  });

  it("reports the label it matched", () => {
    expect(DDBDescriptions.matchActivitySection(FEY_STEP, "Winter (Save)")?.label).toBe("winter");
  });
});

describe("DDBDescriptions.extractActivitySection on a bare fragment", () => {
  // A monster enricher that carves a feature into chunks (Eye Rays) hands over one item's
  // inner html: a leading label, no block wrapper.
  it("strips the leading label off a chunk", () => {
    const ray = "<strong>1: Charm Ray.</strong> <em>Wisdom Saving Throw:</em> DC 16. <em>Failure:</em> Charmed for 1 hour.";

    expect(DDBDescriptions.extractActivitySection(ray, "1: Charm Ray"))
      .toBe("<em>Wisdom Saving Throw:</em> DC 16. <em>Failure:</em> Charmed for 1 hour.");
  });

  it("does not treat the chunk's inner emphasis as a section boundary", () => {
    const ray = "<p><strong>Death Ray.</strong> The target must make a <em>DC 16</em> save or take damage.</p>";

    expect(DDBDescriptions.extractActivitySection(ray, "Death Ray"))
      .toBe("<p>The target must make a <em>DC 16</em> save or take damage.</p>");
  });
});

describe("DDBDescriptions.sectionLabelCount", () => {
  it("counts the labelled sections of a snippet", () => {
    const snippet = [
      "Intro.",
      "<strong>Alpha.</strong> a.",
      "<strong>Beta.</strong> b.",
    ].join("\r\n\r\n");

    expect(DDBDescriptions.sectionLabelCount(snippet)).toBe(2);
  });

  it("does not count inline emphasis inside one section", () => {
    expect(DDBDescriptions.sectionLabelCount("<p><strong>Alpha.</strong> Roll <strong>1d8</strong>.</p>")).toBe(1);
  });

  it("is zero for unlabelled text", () => {
    expect(DDBDescriptions.sectionLabelCount("Just some rules text.")).toBe(0);
  });
});

describe("DDBDescriptions.snippetToHtml", () => {
  it("wraps a single line in a paragraph", () => {
    expect(DDBDescriptions.snippetToHtml("A short snippet.")).toBe("<p>A short snippet.</p>");
  });

  it("turns blank lines into paragraphs and lone newlines into line breaks", () => {
    expect(DDBDescriptions.snippetToHtml("One.\r\n\r\nTwo.\nStill two."))
      .toBe("<p>One.</p>\n<p>Two.<br>Still two.</p>");
  });

  it("emphasises a bare section label", () => {
    expect(DDBDescriptions.snippetToHtml("Bolstering Treats. Cook the treats."))
      .toBe("<p><strong>Bolstering Treats.</strong> Cook the treats.</p>");
  });

  it("leaves a block DDB has already marked up alone", () => {
    expect(DDBDescriptions.snippetToHtml("<strong>Bolstering Treats.</strong> Cook the treats."))
      .toBe("<p><strong>Bolstering Treats.</strong> Cook the treats.</p>");
  });

  it("does not emphasise an ordinary opening sentence", () => {
    expect(DDBDescriptions.snippetToHtml("You gain proficiency. Use it well."))
      .toBe("<p>You gain proficiency. Use it well.</p>");
  });

  it("passes block markup through untouched", () => {
    expect(DDBDescriptions.snippetToHtml("<p>Already a paragraph.</p>")).toBe("<p>Already a paragraph.</p>");
    expect(DDBDescriptions.snippetToHtml("<ul><li>one</li></ul>")).toBe("<ul><li>one</li></ul>");
  });

  it("passes empty text through untouched", () => {
    expect(DDBDescriptions.snippetToHtml("")).toBe("");
    expect(DDBDescriptions.snippetToHtml("   ")).toBe("   ");
  });

  it("keeps the same words as the raw source once tags are stripped", () => {
    // the blocks are joined with a newline so stringKindaEqual comparisons against the
    // raw snippet still line up
    const raw = "One.\r\n\r\nTwo.";
    const stripped = DDBDescriptions.snippetToHtml(raw).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

    expect(stripped).toBe("One. Two.");
  });
});
