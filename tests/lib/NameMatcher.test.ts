import NameMatcher from "../../src/lib/NameMatcher";

describe("NameMatcher.getMonsterNames", () => {
  it("returns the name and its lowercase form for a plain name", () => {
    expect(NameMatcher.getMonsterNames("Goblin")).toEqual(["Goblin", "goblin"]);
  });

  it("does not dedup when the name is already lowercase", () => {
    // characterization: the base pair is always pushed, even when identical
    expect(NameMatcher.getMonsterNames("goblin")).toEqual(["goblin", "goblin"]);
  });

  it("adds a comma variant for a leading +N", () => {
    expect(NameMatcher.getMonsterNames("+2 Longsword")).toEqual([
      "+2 Longsword",
      "+2 longsword",
      "longsword, +2",
    ]);
  });

  it("adds a comma variant for a trailing +N", () => {
    expect(NameMatcher.getMonsterNames("Longsword +2")).toEqual([
      "Longsword +2",
      "longsword +2",
      "longsword, +2",
    ]);
  });

  it("handles multi-digit bonuses", () => {
    expect(NameMatcher.getMonsterNames("Wand +12")).toContain("wand, +12");
  });

  it("ignores a +N in the middle of the name", () => {
    expect(NameMatcher.getMonsterNames("Sword of +2 Doom")).toEqual([
      "Sword of +2 Doom",
      "sword of +2 doom",
    ]);
  });

  it("handles the empty string", () => {
    expect(NameMatcher.getMonsterNames("")).toEqual(["", ""]);
  });
});

describe("NameMatcher.getLooseNames", () => {
  it("returns only the base name and an attack variant for a simple name", () => {
    expect(NameMatcher.getLooseNames("Goblin")).toEqual(["goblin", "goblin attack"]);
  });

  it("includes lowercased extra names first", () => {
    const result = NameMatcher.getLooseNames("Goblin", ["Hobgoblin", "ORC"]);
    expect(result).toContain("hobgoblin");
    expect(result).toContain("orc");
  });

  it("deduplicates names via the underlying set", () => {
    const result = NameMatcher.getLooseNames("goblin", ["Goblin"]);
    expect(result.filter((n) => n === "goblin")).toHaveLength(1);
  });

  it("strips parenthetical sections", () => {
    const result = NameMatcher.getLooseNames("Crossbow Bolts (Bag of 20)");
    expect(result).toContain("crossbow bolts");
    expect(result).toContain("crossbow bolts bag of 20");
  });

  it("also singularises the paren-stripped magic-cleaned name", () => {
    const result = NameMatcher.getLooseNames("Crossbow Bolts (Bag of 20)");
    expect(result).toContain("crossbow bolt");
  });

  it("refactors comma names to front-load the last segment", () => {
    const result = NameMatcher.getLooseNames("Longsword, Silvered");
    expect(result).toContain("silvered longsword");
  });

  it("adds straight and smart quote possessive variants", () => {
    expect(NameMatcher.getLooseNames("Witch's Hex")).toContain("witch’s hex");
    expect(NameMatcher.getLooseNames("Nolzur’s Marvelous Pigments")).toContain("nolzur's marvelous pigments");
  });

  it("strips a case-insensitive ' armor' suffix", () => {
    // toLowerCase runs BEFORE replace(" armor", ""), so title-case "Padded Armor"
    // (as DDB names it) is stripped the same as lowercase "Padded armor"
    expect(NameMatcher.getLooseNames("Padded armor")).toContain("padded");
    expect(NameMatcher.getLooseNames("Padded Armor")).toContain("padded");
  });

  it("adds a trailing-s trimmed variant", () => {
    expect(NameMatcher.getLooseNames("Caltrops")).toContain("caltrop");
  });

  it("adds an attack suffixed variant", () => {
    expect(NameMatcher.getLooseNames("Claw")).toContain("claw attack");
  });

  it("strips known packaging parentheticals", () => {
    expect(NameMatcher.getLooseNames("Potion of Poison (1 day)")).toContain("potion of poison");
    expect(NameMatcher.getLooseNames("Ball Bearings (Bag of 1000)")).toContain("ball bearings");
  });

  it("swaps between 10-foot and 10 foot forms", () => {
    expect(NameMatcher.getLooseNames("Pole (10-foot)")).toContain("pole (10 foot)");
    expect(NameMatcher.getLooseNames("Pole (10 foot)")).toContain("pole (10-foot)");
  });

  it("moves leading quality words to a comma suffix", () => {
    expect(NameMatcher.getLooseNames("Greater Healing Potion")).toContain("healing potion, greater");
  });

  it("moves trailing quality suffixes to a prefix, with singular form", () => {
    const result = NameMatcher.getLooseNames("Healing Potions, Greater");
    expect(result).toContain("greater healing potions");
    expect(result).toContain("greater healing potion");
  });

  it("strips magic bonuses when removeMagic is true", () => {
    const result = NameMatcher.getLooseNames("Longsword, +2");
    expect(result).toContain("longsword");
    expect(result).toContain("+2 longsword");
    expect(result).toContain("longsword +2");
  });

  it("keeps the magic bonus when removeMagic is false", () => {
    const result = NameMatcher.getLooseNames("Longsword +1", [], false);
    expect(result).toContain("longsword +1");
    expect(result).not.toContain("longsword");
  });

  it("still adds the first comma segment for non magic names when removeMagic is false", () => {
    const result = NameMatcher.getLooseNames("Boots of Speed, Fancy", [], false);
    expect(result).toContain("boots of speed");
  });

  it("handles the empty string", () => {
    expect(NameMatcher.getLooseNames("")).toEqual(["", " attack"]);
  });
});
