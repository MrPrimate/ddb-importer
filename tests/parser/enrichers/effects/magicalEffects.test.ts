import AutoEffects from "../../../../src/parser/enrichers/effects/AutoEffects";
import EnchantmentEffects from "../../../../src/parser/enrichers/effects/EnchantmentEffects";

// dnd5e 6.0 only sets `system.magical` in its world migration and from the item sheet, never on
// effects a module creates, so the parsers replay its rule (spells, scrolls, `mgc` items) themselves.
describe("AutoEffects.isMagicalSource", () => {
  it.each([
    ["a spell", { type: "spell", system: {} }, true],
    ["a spell scroll", { type: "consumable", system: { type: { value: "scroll" } } }, true],
    ["a potion", { type: "consumable", system: { type: { value: "potion" }, properties: [] } }, false],
    ["an item with the magical property", { type: "weapon", system: { properties: ["fin", "mgc"] } }, true],
    ["an item with a Set of properties", { type: "equipment", system: { properties: new Set(["mgc"]) } }, true],
    ["a mundane item", { type: "weapon", system: { properties: ["fin"] } }, false],
    ["a class feature", { type: "feat", system: {} }, false],
  ])("%s", (_label, document, expected) => {
    expect(AutoEffects.isMagicalSource(document as any)).toBe(expected);
  });
});

describe("AutoEffects.markMagical", () => {
  function magicItem(effects: any[], standalone?: any[]) {
    const document: any = {
      type: "weapon",
      name: "Flame Tongue",
      system: { properties: ["mgc"] },
      effects,
      flags: {},
    };
    if (standalone) document.flags.ddbimporter = { standaloneEffects: standalone };
    return document;
  }

  it("flags base effects on a magical source, including status-only effects", () => {
    const document = magicItem([
      { name: "Bonus", system: { changes: [{ key: "system.attributes.ac.bonus" }] } },
      { name: "Paralyzed", type: "base", statuses: ["paralyzed"], system: { changes: [] } },
      { name: "No system" },
    ]);
    AutoEffects.markMagical(document);
    expect(document.effects.map((e: any) => e.system.magical)).toEqual([true, true, true]);
  });

  it("leaves condition effects alone, since ConditionData has no magical field", () => {
    const document = magicItem([{ name: "Prone", type: "condition", system: { type: "prone" } }]);
    AutoEffects.markMagical(document);
    expect(document.effects[0].system).toEqual({ type: "prone" });
  });

  it("respects an explicit value already on the effect", () => {
    const document = magicItem([
      { name: "Topple", system: { magical: false, changes: [] } },
      { name: "Enchant", type: "enchantment", system: { magical: true, changes: [] } },
    ]);
    AutoEffects.markMagical(document);
    expect(document.effects[0].system.magical).toBe(false);
    expect(document.effects[1].system.magical).toBe(true);
  });

  it("also stamps the stashed standalone effects", () => {
    const document = magicItem([], [{ name: "Silenced", system: { changes: [] } }]);
    AutoEffects.markMagical(document);
    expect(document.flags.ddbimporter.standaloneEffects[0].system.magical).toBe(true);
  });

  it("does nothing for a non magical source", () => {
    const document: any = {
      type: "feat",
      system: {},
      effects: [{ name: "Rage", system: { changes: [] } }],
      flags: {},
    };
    AutoEffects.markMagical(document);
    expect(document.effects[0].system.magical).toBeUndefined();
  });
});

describe("effect builders", () => {
  const document: any = { name: "Test", img: "icon.webp", type: "spell", system: {}, flags: {} };

  it("BaseEffect only writes magical when the option is given", () => {
    expect(AutoEffects.BaseEffect(document, "Plain").system.magical).toBeUndefined();
    expect(AutoEffects.BaseEffect(document, "Mundane", { magical: false }).system.magical).toBe(false);
    expect(AutoEffects.SpellEffect(document, "Magic", { magical: true }).system.magical).toBe(true);
  });

  it("EnchantmentEffect sets the enchantment document type rather than the legacy flag", () => {
    const effect = EnchantmentEffects.EnchantmentEffect(document, "Enchant");
    expect(effect.type).toBe("enchantment");
    expect(effect.flags?.dnd5e).toBeUndefined();
  });
});
