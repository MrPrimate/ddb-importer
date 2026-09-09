// @vitest-environment jsdom
// Characterization tests for the pure static surface of CharacterFeatureFactory:
// isDuplicateFeature, getNameMatchedFeature and includedFeatureNameCheck.
// jsdom: isDuplicateFeature compares rendered text, and utils.stripHtml wants a document.
import { setMockSettings, resetMockSettings } from "../../_setup/foundryMocks";

import CharacterFeatureFactory from "../../../src/parser/features/CharacterFeatureFactory";

interface IItemStubOptions {
  name: string;
  description?: string;
  type?: string;
  originalName?: string;
  klass?: string;
}

function makeItem({ name, description = "", type, originalName, klass }: IItemStubOptions): any {
  const ddbimporter: any = {};
  if (originalName !== undefined) ddbimporter.originalName = originalName;
  if (type !== undefined) ddbimporter.type = type;
  if (klass !== undefined) ddbimporter.class = klass;
  return {
    name,
    flags: { ddbimporter },
    system: { description: { value: description } },
  };
}

describe("CharacterFeatureFactory.duplicateCheckName", () => {
  it("uses originalName in preference to the document name", () => {
    const item = makeItem({ name: "Critical Shot", originalName: "Crit Shot" });
    expect(CharacterFeatureFactory.duplicateCheckName(item)).toBe("Crit Shot");
  });

  it("strips the DDB level prefix left on originalName", () => {
    // DDBFeatureMixin strips "9: " from the document name but not from originalName
    const item = makeItem({ name: "Critical Shot", originalName: "9: Critical Shot" });
    expect(CharacterFeatureFactory.duplicateCheckName(item)).toBe("Critical Shot");
  });

  it("leaves a name with a non level colon alone", () => {
    const item = makeItem({ name: "Maneuver: Blindfire" });
    expect(CharacterFeatureFactory.duplicateCheckName(item)).toBe("Maneuver: Blindfire");
  });
});

describe("CharacterFeatureFactory.isDuplicateFeature", () => {
  it("returns true when name and description both match", () => {
    const existing = [makeItem({ name: "Sneak Attack", description: "<p>Extra damage.</p>" })];
    const item = makeItem({ name: "Sneak Attack", description: "<p>Extra damage.</p>" });
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item)).toBe(true);
  });

  it("matches the builder and sheet copies of one feature through markup differences", () => {
    // Grotesque Growth: DDB ships a hideInSheet builder copy and a hideInBuilder sheet copy,
    // the latter left with a bare <hr> once its character-sheet note was stripped. Comparing
    // markup here let the caller mistake the second copy for a new level's text and append it.
    const builderCopy = [makeItem({
      name: "Grotesque Growth",
      description: "<p>When you use your Dread Hand feature, you gain the Enlarge effect.</p>",
    })];
    const sheetCopy = makeItem({
      name: "Grotesque Growth",
      description: "<p>When you use your Dread&nbsp;Hand feature, you gain the Enlarge effect.</p>\n<hr />",
    });
    expect(CharacterFeatureFactory.isDuplicateFeature(builderCopy, sheetCopy)).toBe(true);
  });

  it("returns true for two descriptionless features of the same name", () => {
    const existing = [makeItem({ name: "Ability Score Improvement" })];
    const item = makeItem({ name: "Ability Score Improvement" });
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item)).toBe(true);
  });

  it("returns false when the name matches but the description differs", () => {
    const existing = [makeItem({ name: "Sneak Attack", description: "<p>Extra damage.</p>" })];
    const item = makeItem({ name: "Sneak Attack", description: "<p>Different.</p>" });
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item)).toBe(false);
  });

  it("returns false when the name differs", () => {
    const existing = [makeItem({ name: "Sneak Attack", description: "<p>Extra damage.</p>" })];
    const item = makeItem({ name: "Cunning Action", description: "<p>Extra damage.</p>" });
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item)).toBe(false);
  });

  it("returns false against an empty list", () => {
    const item = makeItem({ name: "Sneak Attack" });
    expect(CharacterFeatureFactory.isDuplicateFeature([], item)).toBe(false);
  });

  it("forces class matching for FORCE_FEATURE_CLASS_MATCH names (Psionic Power)", () => {
    const desc = "<p>Psi dice.</p>";
    const fighter = makeItem({ name: "Psionic Power", description: desc, klass: "Fighter" });
    const rogue = makeItem({ name: "Psionic Power", description: desc, klass: "Rogue" });
    const fighterAgain = makeItem({ name: "Psionic Power", description: desc, klass: "Fighter" });

    expect(CharacterFeatureFactory.isDuplicateFeature([fighter], rogue)).toBe(false);
    expect(CharacterFeatureFactory.isDuplicateFeature([fighter], fighterAgain)).toBe(true);
  });

  it("treats a missing class flag as not matched for forced-class-match names", () => {
    const desc = "<p>Psi dice.</p>";
    const noClass = makeItem({ name: "Psionic Power", description: desc });
    const withClass = makeItem({ name: "Psionic Power", description: desc, klass: "Fighter" });
    expect(CharacterFeatureFactory.isDuplicateFeature([noClass], withClass)).toBe(false);
  });

  it("uses flags.ddbimporter.originalName for the forced-class-match lookup", () => {
    const desc = "<p>Psi dice.</p>";
    const existing = [makeItem({ name: "Renamed Power", description: desc, klass: "Fighter" })];
    const item = makeItem({
      name: "Renamed Power",
      description: desc,
      originalName: "Psionic Power",
      klass: "Rogue",
    });
    // originalName triggers the class comparison, and the classes differ
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item)).toBe(false);
  });

  it("honours the matchClass option for arbitrary features", () => {
    const desc = "<p>Text.</p>";
    const existing = [makeItem({ name: "Fighting Style", description: desc, klass: "Fighter" })];
    const item = makeItem({ name: "Fighting Style", description: desc, klass: "Paladin" });
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item)).toBe(true);
    expect(CharacterFeatureFactory.isDuplicateFeature(existing, item, { matchClass: true })).toBe(false);
  });
});

describe("CharacterFeatureFactory.getNameMatchedFeature", () => {
  it("finds a feature by name and ddbimporter type", () => {
    const target = makeItem({ name: "Rage", type: "class" });
    const items = [makeItem({ name: "Rage", type: "race" }), target];
    const lookup = makeItem({ name: "Rage", type: "class" });
    expect(CharacterFeatureFactory.getNameMatchedFeature(items, lookup)).toBe(target);
  });

  it("returns undefined when the name matches but the type differs", () => {
    const items = [makeItem({ name: "Rage", type: "race" })];
    const lookup = makeItem({ name: "Rage", type: "class" });
    expect(CharacterFeatureFactory.getNameMatchedFeature(items, lookup)).toBeUndefined();
  });

  it("returns undefined when nothing matches by name", () => {
    const items = [makeItem({ name: "Rage", type: "class" })];
    const lookup = makeItem({ name: "Frenzy", type: "class" });
    expect(CharacterFeatureFactory.getNameMatchedFeature(items, lookup)).toBeUndefined();
  });

  it("matches when both types are undefined (undefined === undefined)", () => {
    const target = makeItem({ name: "Rage" });
    const lookup = makeItem({ name: "Rage" });
    expect(CharacterFeatureFactory.getNameMatchedFeature([target], lookup)).toBe(target);
  });

  it("returns the first match in list order", () => {
    const first = makeItem({ name: "Rage", type: "class", description: "a" });
    const second = makeItem({ name: "Rage", type: "class", description: "b" });
    const lookup = makeItem({ name: "Rage", type: "class" });
    expect(CharacterFeatureFactory.getNameMatchedFeature([first, second], lookup)).toBe(first);
  });

  it("enforces class matching for forced-class-match names", () => {
    const fighter = makeItem({ name: "Psionic Power", type: "class", klass: "Fighter" });
    const lookupRogue = makeItem({ name: "Psionic Power", type: "class", klass: "Rogue" });
    const lookupFighter = makeItem({ name: "Psionic Power", type: "class", klass: "Fighter" });
    expect(CharacterFeatureFactory.getNameMatchedFeature([fighter], lookupRogue)).toBeUndefined();
    expect(CharacterFeatureFactory.getNameMatchedFeature([fighter], lookupFighter)).toBe(fighter);
  });
});

describe("CharacterFeatureFactory.mergeClassFeature", () => {
  const feat = (name: string, description: string, activities: Record<string, any> = {}, klass = "Warlock"): any => ({
    name,
    type: "feat",
    system: { description: { value: description }, activities },
    flags: { ddbimporter: { originalName: name, type: "class", dndbeyond: { class: klass } } },
  });
  const summon = (id: string, profiles: any[] = []): any => ({
    _id: id, type: "summon", name: "Summon", profiles,
    bonuses: { ac: "@abilities.cha.mod" }, match: { proficiency: true },
  });

  // DDB ships the Vestige Companion twice; the sheet-hidden copy carries the stat block, so its
  // text and its parsed-actor summon link both belong on the builder copy that survives
  it("overwrites a FORCE_DUPLICATE_OVERWRITE feature's text and carries its summon link across", () => {
    const survivor = feat("Vestige Companion", "<p>Builder text.</p>", { summonAAAAAAAAAAA: summon("summonAAAAAAAAAAA") });
    const sheetCopy = feat("Vestige Companion", "<p>Sheet text with stat block.</p>", {
      summonBBBBBBBBBBB: summon("summonBBBBBBBBBBB", [{ _id: "p1", name: "Vestige Companion (Celestial)", uuid: "Actor.c" }]),
    });
    const features = [survivor];
    CharacterFeatureFactory.mergeClassFeature(features, sheetCopy);
    expect(features).toEqual([survivor]);
    expect(survivor.system.description.value).toBe("<p>Sheet text with stat block.</p>");
    expect(survivor.system.activities.summonAAAAAAAAAAA.profiles).toEqual([{ _id: "p1", name: "Vestige Companion (Celestial)", uuid: "Actor.c" }]);
    expect(survivor.system.activities.summonAAAAAAAAAAA.bonuses).toEqual({ ac: "@abilities.cha.mod" });
  });

  it("overwriteDuplicateFeature is safe for documents without activities", () => {
    const survivor: any = { name: "X", system: { description: { value: "<p>A.</p>" } }, flags: {} };
    const other: any = { name: "X", system: { description: { value: "<p>B.</p>" } }, flags: {} };
    CharacterFeatureFactory.overwriteDuplicateFeature(survivor, other);
    expect(survivor.system.description.value).toBe("<p>B.</p>");
  });

  it("appends a second class's copy of a feature under a class heading and keeps its own summon", () => {
    const survivor = feat("Shared Feature", "<p>First.</p>", { summonAAAAAAAAAAA: summon("summonAAAAAAAAAAA") });
    const other = feat("Shared Feature", "<p>Second.</p>", { summonBBBBBBBBBBB: summon("summonBBBBBBBBBBB", [{ _id: "p1", uuid: "Actor.x" }]) }, "Sorcerer");
    const features = [survivor];
    CharacterFeatureFactory.mergeClassFeature(features, other);
    expect(features).toEqual([survivor]);
    expect(survivor.system.description.value).toBe("<p>First.</p><h3>Sorcerer</h3><p>Second.</p>");
    expect(survivor.system.activities.summonAAAAAAAAAAA.profiles).toEqual([]);
  });

  it("adds a feature nothing matches", () => {
    const features: any[] = [];
    const doc = feat("Lone Feature", "<p>Text.</p>");
    CharacterFeatureFactory.mergeClassFeature(features, doc);
    expect(features).toEqual([doc]);
  });
});

describe("CharacterFeatureFactory.includedFeatureNameCheck", () => {
  beforeEach(() => {
    // the allowed-path return value is the raw && chain, so pin a boolean
    // setting to get boolean results (see the leak-through test below)
    setMockSettings({ "character-update-policy-include-versatile-features": true });
  });

  it("allows a normal feature name", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Sneak Attack")).toBe(true);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Rage")).toBe(true);
  });

  it("skips legacy names such as Hit Points and Languages", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Hit Points")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Languages")).toBe(false);
  });

  it("skips exact SKIPPED_FEATURES entries", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Weapon Mastery")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Core Fighter Traits")).toBe(false);
  });

  it("skips names starting with SKIPPED_FEATURES_STARTS_WITH entries", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Metamagic Options: Careful Spell")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Expertise: Two Skills")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Weapon Mastery - Longsword")).toBe(false);
  });

  it("skips names ending with Subclass", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Martial Archetype Subclass")).toBe(false);
  });

  it("skips names containing Ability Score", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Ability Score Improvement")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Extra Ability Score Boost")).toBe(false);
  });

  it("skips numbered weapon mastery entries via regex", () => {
    expect(CharacterFeatureFactory.includedFeatureNameCheck("3: Weapon Mastery")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("12: Weapon Masteries")).toBe(false);
  });

  it("skips '<word> Weapon Mastery' / 'Masteries' names via regex", () => {
    // /(?:\w+) Weapon Master(?:y|ies)(?:$|:)/ matches a "<word> Weapon Mastery"
    // (or "Masteries") per-weapon sub-feature so it is dropped on import.
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Longsword Weapon Mastery")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Longsword Weapon Masteries")).toBe(false);
  });

  it("leaks the raw setting value through the && chain for allowed names", () => {
    // Oddity pinned deliberately: the allowed-path result is the final operand
    // of the && chain, so a non-boolean (but truthy) setting value is returned
    // as-is instead of true. The shared mock returns "OFF" for unset settings.
    resetMockSettings();
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Martial Versatility")).toBe("OFF");
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Sneak Attack")).toBe("OFF");
  });

  it("drops Tasha versatile features when the include setting is false", () => {
    setMockSettings({ "character-update-policy-include-versatile-features": false });
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Martial Versatility")).toBe(false);
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Cantrip Versatility")).toBe(false);
    // non-versatile names are unaffected
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Sneak Attack")).toBe(true);
  });

  it("keeps Tasha versatile features when the include setting is true", () => {
    setMockSettings({ "character-update-policy-include-versatile-features": true });
    expect(CharacterFeatureFactory.includedFeatureNameCheck("Martial Versatility")).toBe(true);
  });
});
