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
