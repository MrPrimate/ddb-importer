// Mock the deep dependency chain pulled in by CharacterSpellFactory; the helpers under test need
// none of it.
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({ default: class {} }));

import CharacterSpellFactory, { hasHealingReroll } from "../../../src/parser/spells/CharacterSpellFactory";

function makeFeatDDB(feats: any[]): any {
  return { character: { feats } };
}

// sourceId 2 is the 2014 PHB, 145 the 2024 PHB
function healerFeat(sourceId: number): any {
  return { definition: { id: 22, name: "Healer", sources: [{ sourceId, pageNumber: 167, sourceType: 1 }] } };
}

describe("CharacterSpellFactory.hasHealingReroll", () => {
  it("is true for the 2024 Healer feat", () => {
    expect(hasHealingReroll(makeFeatDDB([healerFeat(145)]))).toBe(true);
  });

  it("is false for the 2014 Healer feat, which has no reroll", () => {
    expect(hasHealingReroll(makeFeatDDB([healerFeat(2)]))).toBe(false);
  });

  it("is false when the character has no Healer feat", () => {
    expect(hasHealingReroll(makeFeatDDB([
      { definition: { id: 1, name: "Alert", sources: [{ sourceId: 145, pageNumber: 200, sourceType: 1 }] } },
    ]))).toBe(false);
  });

  it("is false when the character has no feats at all", () => {
    expect(hasHealingReroll({ character: {} } as any)).toBe(false);
  });
});

describe("CharacterSpellFactory._applyHealingRerolls", () => {
  function healingSpell(flags: any = {}): any {
    return {
      name: "Cure Wounds",
      flags: { ddbimporter: { ...flags } },
      system: {
        activities: {
          abc: {
            type: "heal",
            healing: { number: 2, denomination: 8, bonus: "@mod", types: ["healing"] },
          },
        },
      },
    };
  }

  // the factory is heavy to construct, and only these two fields matter here
  function factory(healingReroll: boolean, spells: any[]): any {
    const instance = Object.create(CharacterSpellFactory.prototype);
    instance.healingReroll = healingReroll;
    instance.processed = spells;
    return instance;
  }

  it("bakes the reroll onto healing dice and flags the spell", () => {
    const spell = healingSpell();
    factory(true, [spell])._applyHealingRerolls();
    expect(spell.system.activities.abc.healing.modifiers).toEqual(["r1"]);
    expect(spell.flags.ddbimporter.healingReroll).toBe(true);
  });

  it("leaves spells untouched when the character has no reroll", () => {
    const spell = healingSpell();
    factory(false, [spell])._applyHealingRerolls();
    expect(spell.system.activities.abc.healing.modifiers).toBeUndefined();
    expect(spell.flags.ddbimporter.healingReroll).toBeUndefined();
  });

  it("strips a previously applied reroll, so losing the feat cleans up", () => {
    const spell = healingSpell({ healingReroll: true });
    spell.system.activities.abc.healing.modifiers = ["r1"];
    factory(false, [spell])._applyHealingRerolls();
    expect(spell.system.activities.abc.healing.modifiers).toEqual([]);
    expect(spell.flags.ddbimporter.healingReroll).toBeUndefined();
  });
});

describe("CharacterSpellFactory.featureSourceItem", () => {
  // must reproduce the identifier DDBFeatureMixin stamps on the granting document
  // (`referenceNameString(originalName.toLowerCase())`), or dnd5e's identifiedItems lookup misses
  it("keys a species trait or feat as a feat item", () => {
    expect(CharacterSpellFactory.featureSourceItem("feat", "Drow Magic")).toBe("feat:drow-magic");
    expect(CharacterSpellFactory.featureSourceItem("feat", "Svirfneblin Magic")).toBe("feat:svirfneblin-magic");
  });

  it("keys a background as a background item and slugs like the feature identifier", () => {
    expect(CharacterSpellFactory.featureSourceItem("background", "Sage")).toBe("background:sage");
    expect(CharacterSpellFactory.featureSourceItem("feat", "Fey Ancestry's Gift (Eladrin)")).toBe("feat:fey-ancestrys-gift-eladrin");
  });
});

describe("CharacterSpellFactory.isIgnoredFeatureSpell", () => {
  // Wondrous Alteration ships Alter Self twice: the free once-per-rest cast and the always-prepared slot copy
  const freeCast: any = { usesSpellSlot: false, limitedUse: { maxUses: 1, resetType: 2 }, definition: { name: "Alter Self" } };
  const slotCopy: any = { usesSpellSlot: true, limitedUse: null, definition: { name: "Alter Self" } };
  // 2014 invocations such as Bewitching Whispers cast with a slot but once per Long Rest
  const slotLimited: any = { usesSpellSlot: true, limitedUse: { maxUses: 1, resetType: 2 }, definition: { name: "Compulsion" } };
  // at-will invocation grants such as Mask of Many Faces
  const atWill: any = { usesSpellSlot: false, limitedUse: null, definition: { name: "Disguise Self" } };

  it("drops the slot-less and limited-use copies of a listed feature's spell", () => {
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Wondrous Alteration", freeCast)).toBe(true);
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Bewitching Whispers", slotLimited)).toBe(true);
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Mask of Many Faces", atWill)).toBe(true);
  });

  it("keeps the always-prepared slot copy of a listed feature's spell in the spellbook", () => {
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Wondrous Alteration", slotCopy)).toBe(false);
  });

  it("matches DDB's curly apostrophes against the straight-quoted list entry", () => {
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Paladin\u2019s Smite", freeCast)).toBe(true);
  });

  it("ignores nothing for features outside the list", () => {
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Spirit Seeker", freeCast)).toBe(false);
    expect(CharacterSpellFactory.isIgnoredFeatureSpell(undefined, freeCast)).toBe(false);
  });
});
