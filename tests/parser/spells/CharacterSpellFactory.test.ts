// Mock the deep dependency chain pulled in by CharacterSpellFactory; the helpers under test need
// none of it.
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({ default: class {} }));

import CharacterSpellFactory from "../../../src/parser/spells/CharacterSpellFactory";

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

describe("CharacterSpellFactory mastered spells (Spell Mastery / Signature Spells)", () => {
  const ddb: any = {
    character: {
      classes: [{ classFeatures: [
        { definition: { id: 413, name: "Spell Mastery" } },
        { definition: { id: 414, name: "Signature Spells" } },
        { definition: { id: 1, name: "Arcane Recovery" } },
      ] }],
      choices: { class: [
        { componentId: 413, optionValue: 2001 },
        { componentId: 413, optionValue: null },
        { componentId: 414, optionValue: 3001 },
        { componentId: 1, optionValue: 9999 },
      ] },
    },
  };

  it("collects the picked spell definition ids from the two features' choices only", () => {
    expect([...CharacterSpellFactory.masteredSpellChoiceIds(ddb)].sort()).toEqual([2001, 3001]);
    expect(CharacterSpellFactory.masteredSpellChoiceIds({ character: { classes: [], choices: { class: [] } } } as any).size).toBe(0);
  });

  it("recognises a pick by DDB's spell list flags or by the recorded choice", () => {
    const ids = CharacterSpellFactory.masteredSpellChoiceIds(ddb);
    const flagged: any = { baseLevelAtWill: true, atWillLimitedUseLevel: null, definition: { id: 5 } };
    // DDB's signature pick: isSignatureSpell null, the at-will level set
    const signature: any = { isSignatureSpell: null, atWillLimitedUseLevel: 3, definition: { id: 6 } };
    const chosen: any = { atWillLimitedUseLevel: null, definition: { id: 2001 } };
    const plain: any = { atWillLimitedUseLevel: null, definition: { id: 7 } };
    expect(CharacterSpellFactory.isMasteredSpell(flagged, ids)).toBe(true);
    expect(CharacterSpellFactory.isMasteredSpell(signature, ids)).toBe(true);
    expect(CharacterSpellFactory.isMasteredSpell(chosen, ids)).toBe(true);
    expect(CharacterSpellFactory.isMasteredSpell(plain, ids)).toBe(false);
  });

  it("parses the feature's slot-less pick as an always-prepared slot spell without touching the entry", () => {
    const pick: any = { usesSpellSlot: false, alwaysPrepared: false, atWillLimitedUseLevel: 3, limitedUse: { maxUses: 1, resetType: 1, numberUsed: 1 }, definition: { id: 6, name: "Haste" } };
    const spellbook = CharacterSpellFactory.asMasteredSpellbookSpell(pick);
    expect(spellbook).toMatchObject({ usesSpellSlot: true, alwaysPrepared: true, limitedUse: null, definition: { name: "Haste" } });
    expect(pick.usesSpellSlot).toBe(false);
    expect(pick.limitedUse.numberUsed).toBe(1);
  });

  it("does not drop the picks through the feature spell ignore list", () => {
    const pick: any = { usesSpellSlot: false, limitedUse: null, definition: { name: "Shield" } };
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Spell Mastery", pick)).toBe(false);
    expect(CharacterSpellFactory.isIgnoredFeatureSpell("Signature Spells", pick)).toBe(false);
  });
});

describe("CharacterSpellFactory.grantAllowsSlotCasting", () => {
  it("allows a slot copy when the trait lets its spells be cast with slots", () => {
    expect(CharacterSpellFactory.grantAllowsSlotCasting(
      "<p>Once you cast it with this trait, you can't do so again until you finish a long rest. You can also cast these spells using any spell slots you have of the appropriate level.</p>",
    )).toBe(true);
    expect(CharacterSpellFactory.grantAllowsSlotCasting("You can also cast it using spell slots you have of 2nd level or higher.")).toBe(true);
  });

  // DDB often sends no slot-castable entry for these, so the text decides
  it("allows one for a spell the feature keeps always prepared or adds to a spell list", () => {
    expect(CharacterSpellFactory.grantAllowsSlotCasting(
      "You always have the Find Familiar spell prepared. Additionally, you can cast it as a Magic action without expending a spell slot.",
    )).toBe(true);
    expect(CharacterSpellFactory.grantAllowsSlotCasting("The spell is added to your Wizard spell list.")).toBe(true);
  });

  it("denies one when the trait only grants the once-per-rest casting", () => {
    expect(CharacterSpellFactory.grantAllowsSlotCasting(
      "<p>You can cast the Bless spell once with this trait, requiring no Material components, and you regain the ability when you finish a long rest.</p>",
    )).toBe(false);
    expect(CharacterSpellFactory.grantAllowsSlotCasting("You can cast it once without expending a spell slot.")).toBe(false);
  });

  it("has no answer without text", () => {
    expect(CharacterSpellFactory.grantAllowsSlotCasting("")).toBeNull();
    expect(CharacterSpellFactory.grantAllowsSlotCasting(undefined)).toBeNull();
  });
});

describe("CharacterSpellFactory.isClassFeatureDuplicate", () => {
  function listed(name: string, level: number, usesSpellSlot: boolean, className = "Magus"): any {
    return {
      name,
      system: { level },
      flags: { ddbimporter: { originalName: name, dndbeyond: { class: className, usesSpellSlot } } },
    };
  }

  function granted(name: string, level: number, usesSpellSlot: boolean, limitedUse: any = null): any {
    return { usesSpellSlot, limitedUse, definition: { name, level } };
  }

  it("matches a subclass cantrip that is also on the class list, though DDB sends it without a slot", () => {
    const classCopy = listed("Hateful Haunting", 0, false);
    expect(CharacterSpellFactory.isClassFeatureDuplicate(granted("Hateful Haunting", 0, false), classCopy, "Magus")).toBe(true);
  });

  it("matches a slot spell granted by a feature, as before", () => {
    const classCopy = listed("Bless", 1, true, "Cleric");
    expect(CharacterSpellFactory.isClassFeatureDuplicate(granted("Bless", 1, true), classCopy, "Cleric")).toBe(true);
  });

  it("keeps a feature's own slot-less or limited casting separate", () => {
    expect(CharacterSpellFactory.isClassFeatureDuplicate(granted("Misty Step", 2, false), listed("Misty Step", 2, true), "Magus")).toBe(false);
    const limited = granted("Thornhold", 0, false, { maxUses: 1, resetType: 2 });
    expect(CharacterSpellFactory.isClassFeatureDuplicate(limited, listed("Thornhold", 0, false), "Magus")).toBe(false);
  });

  it("keeps the same spell from another class", () => {
    expect(CharacterSpellFactory.isClassFeatureDuplicate(granted("Guidance", 0, false), listed("Guidance", 0, false, "Druid"), "Cleric")).toBe(false);
  });
});
