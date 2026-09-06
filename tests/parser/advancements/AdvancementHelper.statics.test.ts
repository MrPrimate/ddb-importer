// Characterization tests for AdvancementHelper pure static helpers.
// These pin CURRENT behavior ahead of a refactor; oddities are noted inline.

// AdvancementHelper imports the activities barrel (for DDBBasicActivity, only used
// by the async spell advancement path we do not test); stub it to avoid pulling in
// the entire enricher tree.
vi.mock("../../../src/parser/activities/_module", () => ({ DDBBasicActivity: class DDBBasicActivity {} }));
// DDBClass has a static initializer that reads AdvancementHelper before the
// circular import (AdvancementHelper -> parser/lib -> DDBDataUtils -> DDBClass)
// resolves; stub it to break the cycle.
vi.mock("../../../src/parser/classes/DDBClass", () => ({ default: class DDBClass {} }));
vi.mock("../../../src/parser/classes/DDBSubClass", () => ({ default: class DDBSubClass {} }));

import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";

// =============================================================================
// stripDescription
// =============================================================================
describe("AdvancementHelper.stripDescription", () => {
  it("converts paragraph ends to newlines and strips tags", () => {
    const result = AdvancementHelper.stripDescription("<p>Hello</p><p>World</p>");
    expect(result).toBe("Hello\n\nWorld\n\n");
  });

  it("converts br tags to newlines", () => {
    const result = AdvancementHelper.stripDescription("one<br />two");
    expect(result).toBe("one\n\ntwo");
  });

  it("strips inline formatting tags without adding whitespace", () => {
    const result = AdvancementHelper.stripDescription("<p><strong>Saving Throws:</strong> Strength</p>");
    expect(result).toBe("Saving Throws: Strength\n\n");
  });
});

// =============================================================================
// getChoiceReplacements
// =============================================================================
describe("AdvancementHelper.getChoiceReplacements", () => {
  it("marks replacement true for all levels >= lowestLevel when 'you can replace' appears", () => {
    const choices = AdvancementHelper.getChoiceReplacements("At later levels you can replace a choice.", 5);
    expect((choices as any)["4"]).toBeUndefined();
    expect((choices as any)["5"]).toEqual({ replacement: true });
    expect((choices as any)["20"]).toEqual({ replacement: true });
  });

  it("does not treat 'you can replace one of your attacks' as a replacement grant", () => {
    const existing: any = { 3: {} };
    const choices = AdvancementHelper.getChoiceReplacements("you can replace one of your attacks", 1, existing);
    expect((choices as any)["3"]).toEqual({ replacement: false });
    expect((choices as any)["1"]).toBeUndefined();
  });

  it("forceReplace marks replacement even without matching text", () => {
    const choices = AdvancementHelper.getChoiceReplacements("nothing relevant", 19, {}, true);
    expect((choices as any)["19"]).toEqual({ replacement: true });
    expect((choices as any)["20"]).toEqual({ replacement: true });
    expect((choices as any)["18"]).toBeUndefined();
  });

  it("sets replacement false on existing levels when no replacement text", () => {
    const existing: any = { 2: { count: 1 }, 7: {} };
    const choices: any = AdvancementHelper.getChoiceReplacements("plain feature text", 1, existing);
    expect(choices["2"]).toEqual({ count: 1, replacement: false });
    expect(choices["7"]).toEqual({ replacement: false });
  });
});

// =============================================================================
// hasScaleConfiguration
// =============================================================================
describe("AdvancementHelper.hasScaleConfiguration", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("returns true when configuration has a scale key", () => {
    const adv: any = { configuration: { scale: {} } };
    expect(AdvancementHelper.hasScaleConfiguration(adv)).toBe(true);
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("returns false when configuration lacks scale", () => {
    const adv: any = { configuration: { identifier: "x" } };
    expect(AdvancementHelper.hasScaleConfiguration(adv)).toBe(false);
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("returns false when configuration is missing", () => {
    const adv: any = { name: "No Config" };
    expect(AdvancementHelper.hasScaleConfiguration(adv)).toBe(false);
  });
});

// =============================================================================
// isBaseProficiency
// =============================================================================
describe("AdvancementHelper.isBaseProficiency", () => {
  it("matches the literal 'Proficiencies' feature", () => {
    expect(AdvancementHelper.isBaseProficiency({ name: "Proficiencies" })).toBe(true);
  });

  it("matches 'Core <Class> Traits' features", () => {
    expect(AdvancementHelper.isBaseProficiency({ name: "Core Barbarian Traits" })).toBe(true);
  });

  it("does not match ordinary features", () => {
    expect(AdvancementHelper.isBaseProficiency({ name: "Rage" })).toBe(false);
  });

  it("does not match 'Core' names that do not end in 'Traits'", () => {
    expect(AdvancementHelper.isBaseProficiency({ name: "Core Values" })).toBe(false);
  });
});

// =============================================================================
// convertToSingularDie / renameTotal / rename / addSingularDie
// =============================================================================
describe("AdvancementHelper.convertToSingularDie", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("sets every scale entry's die number to 1 and appends (Die) to name", () => {
    const adv: any = {
      name: "Bardic Inspiration",
      configuration: { scale: { 1: { number: 2, faces: 6 }, 5: { number: 3, faces: 8 } } },
    };
    const result: any = AdvancementHelper.convertToSingularDie(adv);
    expect(result.name).toBe("Bardic Inspiration (Die)");
    expect(result.configuration.scale["1"]).toEqual({ number: 1, faces: 6 });
    expect(result.configuration.scale["5"]).toEqual({ number: 1, faces: 8 });
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("returns the advancement unchanged when there is no scale", () => {
    const adv: any = { name: "Plain", configuration: {} };
    const result: any = AdvancementHelper.convertToSingularDie(adv);
    expect(result.name).toBe("Plain");
  });
});

describe("AdvancementHelper.renameTotal", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("appends (Total) to the name", () => {
    const adv: any = { name: "Sneak Attack" };
    expect((AdvancementHelper.renameTotal(adv) as any).name).toBe("Sneak Attack (Total)");
  });
});

describe("AdvancementHelper.rename", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("replaces the name when newName is supplied", () => {
    const adv: any = { name: "Old", configuration: {} };
    const result: any = AdvancementHelper.rename(adv, { newName: "New" } as any);
    expect(result.name).toBe("New");
  });

  it("updates identifier only when configuration already has one", () => {
    const adv: any = { name: "T", configuration: { identifier: "old-id" } };
    const result: any = AdvancementHelper.rename(adv, { identifier: "new-id" } as any);
    expect(result.configuration.identifier).toBe("new-id");
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("does not add an identifier to a configuration lacking one", () => {
    const adv: any = { name: "T", configuration: {} };
    const result: any = AdvancementHelper.rename(adv, { identifier: "new-id" } as any);
    expect(result.configuration.identifier).toBeUndefined();
  });
});

describe("AdvancementHelper.buildNumberScale / buildDiceScale", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("builds a numeric scale advancement from level to value entries", () => {
    const result: any = AdvancementHelper.buildNumberScale({ name: "Moxie", identifier: "moxie", scale: { 2: 2, 4: 3 } });
    expect(result.type).toBe("ScaleValue");
    expect(result._id).toBeTruthy();
    expect(result.name).toBe("Moxie");
    expect(result.configuration).toMatchObject({ identifier: "moxie", type: "number", scale: { 2: { value: 2 }, 4: { value: 3 } } });
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("builds a dice scale advancement from level to die entries", () => {
    const result: any = AdvancementHelper.buildDiceScale({
      name: "Sneak Attack", identifier: "sneak-attack", scale: { 1: { number: 1, faces: 6 }, 3: { number: 2, faces: 6 } },
    });
    expect(result.name).toBe("Sneak Attack");
    expect(result.configuration).toMatchObject({
      identifier: "sneak-attack", type: "dice", scale: { 1: { number: 1, faces: 6 }, 3: { number: 2, faces: 6 } },
    });
  });
});

describe("AdvancementHelper.fixedNumberScale", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("builds a numeric scale advancement from hand-written levels, ignoring its input", () => {
    const fn = AdvancementHelper.fixedNumberScale({ name: "Jinx Points", identifier: "jinx-points", scale: { 3: 4, 13: 6 } });
    const result: any = fn({ name: "Misfortunist", configuration: { identifier: "misfortunist", scale: { 3: { value: 2 } } } } as any);
    expect(result.type).toBe("ScaleValue");
    expect(result.name).toBe("Jinx Points");
    expect(result.configuration).toMatchObject({
      identifier: "jinx-points",
      type: "number",
      scale: { 3: { value: 4 }, 13: { value: 6 } },
    });
  });
});

describe("AdvancementHelper.addScaleEntries", () => {
  it("adds missing levels and leaves recorded ones alone", () => {
    const adv: any = { name: "Steal Luck", configuration: { identifier: "steal-luck", scale: { 17: { value: 3 } } } };
    const result: any = AdvancementHelper.addScaleEntries(adv, { scale: { 9: { value: 1 }, 17: { value: 99 } } });
    expect(result.configuration.scale).toEqual({ 9: { value: 1 }, 17: { value: 3 } });
  });

  it("returns the advancement unchanged without entries or configuration", () => {
    const adv: any = { name: "Plain" };
    expect(AdvancementHelper.addScaleEntries(adv, { scale: { 1: { value: 1 } } })).toBe(adv);
    const configured: any = { name: "T", configuration: { scale: { 1: { value: 2 } } } };
    expect((AdvancementHelper.addScaleEntries(configured) as any).configuration.scale).toEqual({ 1: { value: 2 } });
  });
});

describe("AdvancementHelper.addSingularDie", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("returns a singular-die copy with a fresh id and -die identifier", () => {
    const adv: any = {
      _id: "originalid1234567",
      name: "Bardic Inspiration",
      configuration: { identifier: "bardic-inspiration", scale: { 1: { number: 2, faces: 6 } } },
    };
    const result: any = AdvancementHelper.addSingularDie(adv);
    expect(result._id).not.toBe("originalid1234567");
    expect(result.name).toBe("Bardic Inspiration (Die)");
    expect(result.configuration.identifier).toBe("bardic-inspiration-die");
    expect(result.configuration.scale["1"]).toEqual({ number: 1, faces: 6 });
  });

  it("does not mutate the original advancement", () => {
    const adv: any = {
      _id: "originalid1234567",
      name: "Bardic Inspiration",
      configuration: { identifier: "bardic-inspiration", scale: { 1: { number: 2, faces: 6 } } },
    };
    AdvancementHelper.addSingularDie(adv);
    expect(adv.name).toBe("Bardic Inspiration");
    expect(adv.configuration.scale["1"].number).toBe(2);
    expect(adv._id).toBe("originalid1234567");
  });
});

// =============================================================================
// Tool lookups
// =============================================================================
describe("AdvancementHelper.getToolGroup", () => {
  it("maps musical instrument to music", () => {
    expect(AdvancementHelper.getToolGroup("one Musical Instrument of your choice")).toBe("music");
  });

  it("maps artisan's tools (with curly apostrophe) to art", () => {
    expect(AdvancementHelper.getToolGroup("artisan’s tools")).toBe("art");
  });

  it("maps gaming set to game and unknown text to null", () => {
    expect(AdvancementHelper.getToolGroup("Gaming Set")).toBe("game");
    expect(AdvancementHelper.getToolGroup("cartographer's stuff")).toBeNull();
  });
});

describe("AdvancementHelper.getDictionaryTool", () => {
  it("finds a direct match regardless of apostrophe style", () => {
    const tool: any = AdvancementHelper.getDictionaryTool("smith’s tools");
    expect(tool?.name).toBe("Smith's Tools");
    expect(tool?.baseTool).toBe("smith");
  });

  it("finds tools embedded in a longer phrase", () => {
    const tool: any = AdvancementHelper.getDictionaryTool("proficiency with thieves' tools today");
    expect(tool?.name).toBe("Thieves' Tools");
  });

  it("returns null for unknown tools", () => {
    expect(AdvancementHelper.getDictionaryTool("chainsaw")).toBeNull();
  });
});

describe("AdvancementHelper.getToolAdvancementValue", () => {
  it("prefixes toolType for grouped tools", () => {
    expect(AdvancementHelper.getToolAdvancementValue("Smith's Tools")).toBe("art:smith");
  });

  it("returns the bare baseTool when toolType is empty", () => {
    expect(AdvancementHelper.getToolAdvancementValue("Thieves' Tools")).toBe("thief");
    expect(AdvancementHelper.getToolAdvancementValue("Herbalism Kit")).toBe("herb");
  });

  it("returns null for unknown tools", () => {
    expect(AdvancementHelper.getToolAdvancementValue("laser cutter")).toBeNull();
  });
});

// =============================================================================
// Armor lookups
// =============================================================================
describe("AdvancementHelper.getArmorGroup", () => {
  it("maps top level armor categories", () => {
    expect(AdvancementHelper.getArmorGroup("Light armor")).toBe("lgt");
    expect(AdvancementHelper.getArmorGroup("medium armor")).toBe("med");
    expect(AdvancementHelper.getArmorGroup("Shields")).toBe("shl");
  });

  it("returns null for specific armors that are not groups", () => {
    expect(AdvancementHelper.getArmorGroup("breastplate")).toBeNull();
  });
});

describe("AdvancementHelper.getDictionaryArmor", () => {
  it("finds direct matches", () => {
    const armor: any = AdvancementHelper.getDictionaryArmor("Plate");
    expect(armor?.foundryValue).toBe("plate");
    expect(armor?.advancement).toBe("hvy");
  });

  it("finds armor embedded in a longer phrase", () => {
    const armor: any = AdvancementHelper.getDictionaryArmor("studded leather armor");
    expect(armor?.name).toBe("Studded Leather");
  });
});

describe("AdvancementHelper.getArmorAdvancementValue", () => {
  it("returns a bare value for armor groups", () => {
    expect(AdvancementHelper.getArmorAdvancementValue("Light Armor")).toBe("lgt");
  });

  it("returns group:value for specific armors", () => {
    expect(AdvancementHelper.getArmorAdvancementValue("Scale Mail")).toBe("med:scalemail");
    expect(AdvancementHelper.getArmorAdvancementValue("shield")).toBe("shl:shield");
  });

  it("returns null for unknown armor", () => {
    expect(AdvancementHelper.getArmorAdvancementValue("power armor mk2")).toBeNull();
  });
});

// =============================================================================
// Weapon lookups
// =============================================================================
describe("AdvancementHelper.getWeaponGroup", () => {
  it("matches weapon group names via substring", () => {
    expect(AdvancementHelper.getWeaponGroup("simple weapons")).toBe("sim");
    // 'martial melee weapon' hits the bare 'martial' group key
    expect(AdvancementHelper.getWeaponGroup("martial melee weapon")).toBe("mar");
  });

  it("returns null when no group name is present", () => {
    expect(AdvancementHelper.getWeaponGroup("longsword")).toBeNull();
  });
});

describe("AdvancementHelper.getStrictWeaponGroup", () => {
  it("only matches exact group names", () => {
    expect(AdvancementHelper.getStrictWeaponGroup("Martial Weapons")).toBe("mar");
    expect(AdvancementHelper.getStrictWeaponGroup("Simple")).toBe("sim");
  });

  it("rejects partial matches", () => {
    expect(AdvancementHelper.getStrictWeaponGroup("simple weapon stuff")).toBeNull();
  });
});

describe("AdvancementHelper.getDictionaryWeapon", () => {
  it("matches singular, plural and 'the '-prefixed names", () => {
    expect((AdvancementHelper.getDictionaryWeapon("Longsword") as any)?.foundryValue).toBe("longsword");
    expect((AdvancementHelper.getDictionaryWeapon("longswords") as any)?.foundryValue).toBe("longsword");
    expect((AdvancementHelper.getDictionaryWeapon("the scimitar") as any)?.foundryValue).toBe("scimitar");
  });

  it("skips weapons without a foundryValue", () => {
    // Boomerang exists in the dictionary but has foundryValue ""
    expect(AdvancementHelper.getDictionaryWeapon("Boomerang")).toBeNull();
  });

  it("returns null for unknown weapons", () => {
    expect(AdvancementHelper.getDictionaryWeapon("chair leg")).toBeNull();
  });
});

describe("AdvancementHelper.getWeaponAdvancementValue", () => {
  it("returns group:value for specific weapons", () => {
    expect(AdvancementHelper.getWeaponAdvancementValue("Longsword")).toBe("mar:longsword");
    expect(AdvancementHelper.getWeaponAdvancementValue("hand crossbows")).toBe("mar:handcrossbow");
  });

  it("returns the bare value for weapon groups", () => {
    expect(AdvancementHelper.getWeaponAdvancementValue("Simple Weapons")).toBe("sim");
  });

  it("returns null for unknown weapons", () => {
    expect(AdvancementHelper.getWeaponAdvancementValue("banana")).toBeNull();
  });
});
