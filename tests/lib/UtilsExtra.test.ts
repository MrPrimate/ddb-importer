// @vitest-environment jsdom
import Utils from "../../src/lib/Utils";

describe("Utils.escapeRegExp", () => {
  it("escapes regex metacharacters", () => {
    expect(Utils.escapeRegExp("a.b*c+d?")).toBe("a\\.b\\*c\\+d\\?");
    expect(Utils.escapeRegExp("(a)[b]{c}|d")).toBe("\\(a\\)\\[b\\]\\{c\\}\\|d");
    expect(Utils.escapeRegExp("^$\\")).toBe("\\^\\$\\\\");
  });

  it("leaves plain text untouched", () => {
    expect(Utils.escapeRegExp("Fire Bolt 3")).toBe("Fire Bolt 3");
  });

  it("produces a pattern that matches the original literal", () => {
    const literal = "+1 Sword (Rare)";
    expect(new RegExp(`^${Utils.escapeRegExp(literal)}$`).test(literal)).toBe(true);
  });
});

describe("Utils.renderLesserString", () => {
  it("strips html and lowercases", () => {
    expect(Utils.renderLesserString("<p><b>Fire</b> Bolt</p>")).toBe("fire bolt");
  });

  it("normalises non-breaking spaces", () => {
    expect(Utils.renderLesserString("Fire&nbsp;Bolt")).toBe("fire bolt");
  });
});

describe("Utils.stringKindaEqual", () => {
  it("matches across markup, case and whitespace", () => {
    expect(Utils.stringKindaEqual("<p>Fire Bolt </p>", "fire   BOLT")).toBe(true);
  });

  it("rejects different strings", () => {
    expect(Utils.stringKindaEqual("Fire Bolt", "Firebolt")).toBe(false);
  });
});

describe("Utils.stringKindaContains", () => {
  it("matches an exact string across markup, case and whitespace", () => {
    expect(Utils.stringKindaContains("<p>Fire Bolt </p>", "fire   BOLT")).toBe(true);
  });

  it("matches a needle quoted inside a larger haystack", () => {
    expect(Utils.stringKindaContains("<p>Before. <em>Fire Bolt</em>. After.</p>", "fire bolt")).toBe(true);
  });

  it("rejects an empty needle rather than matching everything", () => {
    expect(Utils.stringKindaContains("<p>Fire Bolt</p>", "")).toBe(false);
    expect(Utils.stringKindaContains("<p>Fire Bolt</p>", "<p> </p>")).toBe(false);
  });

  it("rejects a needle that is not present", () => {
    expect(Utils.stringKindaContains("Fire Bolt", "Firebolt")).toBe(false);
  });
});

describe("Utils.stripNoteBlocks", () => {
  const MARKERS = ["Deselect", "Character Builder", "updated the character sheet"];

  it("removes an italic instruction paragraph and keeps the surrounding text", () => {
    const html = "<p>Real rules text.</p><p><em>Activate Adaptive Wild Shape by selecting an option from the drop down. Deselect it to end Adaptive Wild Shape.</em></p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<p>Real rules text.</p>");
  });

  it("removes the DDB-styled paragraph variant", () => {
    const html = "<p>Keep me.</p><p class=\"styles_description__uABlx\"><em>Activate Burning Wrath below to apply the effects from Burning Wrath. Deselect it to end the effect.</em></p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<p>Keep me.</p>");
  });

  it("removes a whole blockquote rather than leaving an empty shell", () => {
    const html = "<p>Keep me.</p><blockquote>\n<p>In the <em>Character Builder</em>, set the option for Hybrid Transformation.</p>\n</blockquote>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<p>Keep me.</p>");
  });

  it("leaves real rules text that merely mentions selecting an option", () => {
    // Armed Combat Lessons: "select this option" is rules text, not a sheet instruction
    const html = "<p>A seasoned fighter taught you how to use a simple combat stance to wield your weapons more effectively. When you select this option, choose from the following Fighting Styles:</p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe(html);
  });

  it("leaves Foundry reference enrichers in retained blocks untouched", () => {
    const html = "<p>If you use Reckless &Reference[attack]{Attack} while raging.</p><p><em>Select Activate Rage below. Deselect it to stop Raging.</em></p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<p>If you use Reckless &Reference[attack]{Attack} while raging.</p>");
  });

  it("returns the input unchanged when no marker is present", () => {
    const html = "<p>Nothing to strip here.</p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe(html);
    expect(Utils.stripNoteBlocks("", MARKERS)).toBe("");
  });

  it("takes the <hr> separator DDB fences the note off with", () => {
    // the real Grotesque Growth description; leaving the rule behind kept this copy of the
    // feature from matching the builder copy, so the whole thing was appended as a duplicate
    const html = "<p>When you use your Dread Hand feature, you gain the benefits of the Enlarge effect.</p>\n<hr />\n<p><em>Select Activate Grotesque Growth below to apply the effects from Grotesque Growth. Deselect it to stop the effects.</em></p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<p>When you use your Dread Hand feature, you gain the benefits of the Enlarge effect.</p>\n");
  });

  it("takes an unclosed <hr> with attributes too", () => {
    const html = "<p>Keep me.</p><hr class=\"styles_divider__x1\"><blockquote><p>In the Character Builder, set the option.</p></blockquote>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<p>Keep me.</p>");
  });

  it("keeps an <hr> that separates real rules text", () => {
    const html = "<p>Deselect it to end the effect.</p><hr /><p>Real rules text that stays.</p>";
    expect(Utils.stripNoteBlocks(html, MARKERS)).toBe("<hr /><p>Real rules text that stays.</p>");
  });
});

describe("Utils.intSigner", () => {
  it("prefixes positive numbers and zero with a plus", () => {
    expect(Utils.intSigner(3)).toBe("+3");
    expect(Utils.intSigner(0)).toBe("+0");
  });

  it("keeps the minus on negative numbers", () => {
    expect(Utils.intSigner(-2)).toBe("-2");
  });

  it("accepts numeric strings", () => {
    expect(Utils.intSigner("5")).toBe("+5");
  });
});

describe("Utils.diceStringResultBuild", () => {
  const die = (sign: string, count: number, dieSize: number) => ({ sign, count, die: dieSize });

  it("builds a dice string with a positive bonus", () => {
    const map = [die("+", 2, 6)];
    const result = Utils.diceStringResultBuild(map, map, 3);
    expect(result.diceString).toBe("2d6 + 3");
    expect(result.diceHintString).toBe("2d6");
    expect(result.bonus).toBe(3);
  });

  it("keeps a double space before negative bonuses", () => {
    // characterization: the negative branch emits " " + " -2", leaving an
    // internal double space that trim() cannot remove
    const map = [die("+", 1, 6)];
    const result = Utils.diceStringResultBuild(map, map, -2);
    expect(result.diceString).toBe("1d6  -2");
  });

  it("joins multiple dice with their signs", () => {
    const map = [die("+", 1, 4), die("+", 2, 8)];
    const result = Utils.diceStringResultBuild(map, map, 0);
    expect(result.diceString).toBe("1d4 + 2d8");
  });

  it("appends mods verbatim", () => {
    const map = [die("+", 2, 6)];
    const result = Utils.diceStringResultBuild(map, map, 0, " + @mod");
    expect(result.diceString).toBe("2d6 + @mod");
  });

  it("adds special flags and the hint only when addHint is set", () => {
    const map = [die("+", 2, 6)];
    const withHint = Utils.diceStringResultBuild(map, map, 0, "", "[fire]", "r<2", true);
    expect(withHint.diceString).toBe("2d6r<2[fire]");
    const withoutHint = Utils.diceStringResultBuild(map, map, 0, "", "[fire]", "r<2", false);
    expect(withoutHint.diceString).toBe("2d6r<2");
  });
});

describe("Utils.matchProperties", () => {
  const doc: any = {
    name: "Rage",
    system: { activation: { type: "bonus" }, uses: { max: "3" } },
  };

  it("returns true when all dot-path properties match", () => {
    expect(Utils.matchProperties(doc, { "system.activation.type": "bonus", "name": "Rage" })).toBe(true);
  });

  it("returns false on any mismatch", () => {
    expect(Utils.matchProperties(doc, { "system.activation.type": "action" })).toBe(false);
    expect(Utils.matchProperties(doc, { "name": "Rage", "system.uses.max": "2" })).toBe(false);
  });

  it("returns false when the property is missing", () => {
    expect(Utils.matchProperties(doc, { "system.range.value": 30 })).toBe(false);
  });

  it("returns true for an empty property set", () => {
    expect(Utils.matchProperties(doc, {})).toBe(true);
  });
});

describe("Utils.isDefaultOrPlaceholderImage", () => {
  it("treats null, undefined and empty string as placeholders", () => {
    expect(Utils.isDefaultOrPlaceholderImage(null)).toBe(true);
    expect(Utils.isDefaultOrPlaceholderImage(undefined)).toBe(true);
    expect(Utils.isDefaultOrPlaceholderImage("")).toBe(true);
  });

  it("treats the default token as a placeholder", () => {
    expect(Utils.isDefaultOrPlaceholderImage("icons/svg/mystery-man.svg")).toBe(true);
  });

  it("treats dnd5e default actor svgs as placeholders", () => {
    expect(Utils.isDefaultOrPlaceholderImage("systems/dnd5e/icons/svg/actors/npc.svg")).toBe(true);
    expect(Utils.isDefaultOrPlaceholderImage("prefix/systems/dnd5e/icons/svg/actors/character.svg")).toBe(true);
    expect(Utils.isDefaultOrPlaceholderImage("systems/dnd5e/icons/svg/actors/vehicle.svg")).toBe(true);
  });

  it("recognises configured default artwork", () => {
    const artwork: Record<string, string> = CONFIG.DND5E.defaultArtwork.Actor;
    artwork.npc = "some/default/npc-art.webp";
    try {
      expect(Utils.isDefaultOrPlaceholderImage("some/default/npc-art.webp")).toBe(true);
    } finally {
      delete artwork.npc;
    }
  });

  it("accepts real images", () => {
    expect(Utils.isDefaultOrPlaceholderImage("worlds/my-world/goblin.webp")).toBe(false);
  });
});
