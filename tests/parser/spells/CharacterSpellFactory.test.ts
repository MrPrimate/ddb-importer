// Mock the deep dependency chain pulled in by CharacterSpellFactory; the helpers under test need
// none of it.
// parseSpell hands back a bare spell item so the generate* passes can run without the spell parser
vi.mock("../../../src/parser/spells/DDBSpell", () => ({
  default: class {
    static async parseSpell(data: any) {
      return { name: data.definition.name, type: "spell", system: { ability: "", level: data.definition.level, source: { rules: "2024" } }, flags: {} };
    }
  },
}));
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({ default: class {} }));

import CharacterSpellFactory, { isCantripBoost } from "../../../src/parser/spells/CharacterSpellFactory";
import logger from "../../../src/lib/Logger";

// ids and entity type ids taken from real cleric payloads
const CLASS_FEATURE_TYPE_ID = 12168134;
const OPTION_TYPE_ID = 258900837;

function setAC5eInstalled(installed: boolean): void {
  (CONFIG as any).DDBI.EFFECT_CONFIG.MODULES.installedModules = {
    hasCore: false,
    hasMonster: false,
    midiQolInstalled: false,
    daeInstalled: false,
    atlInstalled: false,
    tokenMagicInstalled: false,
    activeAurasInstalled: false,
    auraeffectsInstalled: false,
    autoAnimationsInstalled: false,
    chrisInstalled: false,
    vision5eInstalled: false,
    ac5eInstalled: installed,
  };
}

function makeMod(
  { componentId, componentTypeId, subType = "cleric-cantrip-damage", restriction = "" }:
  { componentId: number; componentTypeId: number; subType?: string; restriction?: string | null },
): any {
  return {
    id: componentId,
    type: "bonus",
    subType,
    restriction,
    componentId,
    componentTypeId,
    isGranted: true,
    availableToMulticlass: true,
  };
}

/**
 * getChosenClassModifiers walks character.modifiers.class and filters on the character's chosen
 * class features and options, so the feature that owns each modifier has to exist on the class.
 */
function makeDDB({ className = "Cleric", classFeatures = [], options = [], modifiers = [] }: {
  className?: string;
  classFeatures?: any[];
  options?: any[];
  modifiers?: any[];
}): any {
  return {
    character: {
      classes: [
        {
          id: 1,
          definition: { id: 1, name: className, classFeatures: [] },
          classFeatures,
          level: 20,
          isStartingClass: true,
        },
      ],
      options: { class: options, race: [], feat: [] },
      choices: { class: [], race: [], feat: [] },
      modifiers: { class: modifiers, race: [], background: [], item: [], feat: [], condition: [] },
      optionalClassFeatures: [],
      characterValues: [],
    },
    classOptions: [],
  };
}

function classFeature(id: number, name: string): any {
  return { definition: { id, name, entityTypeId: CLASS_FEATURE_TYPE_ID, requiredLevel: 8 } };
}

// 2024: Potent Spellcasting is a chosen option of Blessed Strikes / Elemental Fury
function chosenOption(id: number, name: string, parentId: number): any {
  return {
    componentId: parentId,
    componentTypeId: CLASS_FEATURE_TYPE_ID,
    definition: { id, name, entityTypeId: OPTION_TYPE_ID },
  };
}

describe("CharacterSpellFactory.isCantripBoost", () => {
  beforeEach(() => {
    setAC5eInstalled(false);
  });

  it("is false when the class has no cantrip damage modifier", () => {
    const ddb = makeDDB({ classFeatures: [classFeature(140, "Divine Strike")] });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("is true for a 2014 Cleric Potent Spellcasting without AC5e", () => {
    const ddb = makeDDB({
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({ componentId: 140, componentTypeId: CLASS_FEATURE_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(true);
  });

  it("is false for a 2014 Cleric Potent Spellcasting with AC5e installed", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({ componentId: 140, componentTypeId: CLASS_FEATURE_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("is false for a 2024 Cleric Blessed Strikes option with AC5e installed", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(10292211, "Blessed Strikes")],
      options: [chosenOption(4496847, "Potent Spellcasting", 10292211)],
      modifiers: [makeMod({ componentId: 4496847, componentTypeId: OPTION_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("is false for a 2024 Druid Elemental Fury option with AC5e installed", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      className: "Druid",
      classFeatures: [classFeature(10292999, "Elemental Fury")],
      options: [chosenOption(4496900, "Potent Spellcasting", 10292999)],
      modifiers: [makeMod({
        componentId: 4496900,
        componentTypeId: OPTION_TYPE_ID,
        subType: "druid-cantrip-damage",
      })],
    });
    expect(isCantripBoost(ddb, "Druid")).toBe(false);
  });

  it("is true for a 2024 Druid Elemental Fury option without AC5e", () => {
    const ddb = makeDDB({
      className: "Druid",
      classFeatures: [classFeature(10292999, "Elemental Fury")],
      options: [chosenOption(4496900, "Potent Spellcasting", 10292999)],
      modifiers: [makeMod({
        componentId: 4496900,
        componentTypeId: OPTION_TYPE_ID,
        subType: "druid-cantrip-damage",
      })],
    });
    expect(isCantripBoost(ddb, "Druid")).toBe(true);
  });

  it("is true with AC5e for a cantrip boost from a feature AC5e does not handle", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(8470353, "Empowered Cantrips")],
      modifiers: [makeMod({ componentId: 8470353, componentTypeId: CLASS_FEATURE_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(true);
  });

  it("is true with AC5e when only some boosts come from an AC5e handled feature", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [
        classFeature(140, "Potent Spellcasting"),
        classFeature(8470353, "Empowered Cantrips"),
      ],
      modifiers: [
        makeMod({ componentId: 140, componentTypeId: CLASS_FEATURE_TYPE_ID }),
        makeMod({ componentId: 8470353, componentTypeId: CLASS_FEATURE_TYPE_ID }),
      ],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(true);
  });

  it("ignores a restricted modifier, such as Improved Blessed Strikes", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({
        componentId: 140,
        componentTypeId: CLASS_FEATURE_TYPE_ID,
        restriction: "Grant Wisdom × 2 Temporary HP to you or another creature within 60 ft. of you.",
      })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("does not suppress the boost for a class with no AC5e handled feature", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      className: "Warlock",
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({
        componentId: 140,
        componentTypeId: CLASS_FEATURE_TYPE_ID,
        subType: "warlock-cantrip-damage",
      })],
    });
    expect(isCantripBoost(ddb, "Warlock")).toBe(true);
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

describe("CharacterSpellFactory granted spell abilities", () => {
  // spellCastingAbilityId 6 is Charisma; a spell DDB sends without one keeps the class fallback
  function featSpell(name: string, spellCastingAbilityId: number | null, extra: any = {}): any {
    return {
      id: name.length,
      componentId: 900,
      spellCastingAbilityId,
      limitedUse: { maxUses: 1, resetType: 2 },
      usesSpellSlot: false,
      alwaysPrepared: false,
      definition: { name, level: 2, isHomebrew: false },
      ...extra,
    };
  }

  function factory(type: "feat" | "race" | "background", spells: any[]): any {
    const instance = Object.create(CharacterSpellFactory.prototype);
    instance.ddb = { character: { spells: { [type]: spells }, race: { fullName: "Example Species" }, background: null, feats: [] } };
    instance.characterAbilities = { cha: { value: 16 }, wis: { value: 12 } };
    instance.proficiencyModifier = 2;
    instance.spellCounts = {};
    instance._granted = { class: [], feat: [], race: [], background: [], item: [] };
    instance._generated = { class: [], feat: [], race: [], background: [], item: [] };
    instance.getLookup = () => ({ name: "Example Feat", id: 900, data: { definition: { name: "Example Feat", description: "" } } });
    return instance;
  }

  it("stamps DDB's ability on a feat spell", async () => {
    const instance = factory("feat", [featSpell("Example Step", 6), featSpell("Example Sight", null)]);
    await instance.generateFeatSpells();
    expect(instance._granted.feat.map((spell: any) => [spell.name, spell.system.ability]))
      .toEqual([["Example Step", "cha"], ["Example Sight", ""]]);
  });

  it("stamps DDB's ability on species and background spells", async () => {
    const species = factory("race", [featSpell("Example Rebuke", 6)]);
    await species.generateRaceSpells();
    expect(species._granted.race[0].system.ability).toBe("cha");

    const background = factory("background", [featSpell("Example Ward", 5, { limitedUse: null, usesSpellSlot: false })]);
    await background.generateBackgroundSpells();
    expect(background._generated.background[0].system.ability).toBe("wis");
  });

  it("stamps it on the slot-castable copy a feat's text asks for", async () => {
    const instance = factory("feat", [featSpell("Example Step", 6)]);
    instance.slots = { spell1: { max: 4 }, spell2: { max: 2 } };
    instance.getLookup = () => ({
      name: "Example Feat",
      id: 900,
      data: { definition: { name: "Example Feat", description: "<p>You can also cast it using spell slots you have of the appropriate level.</p>" } },
    });
    await instance.generateFeatSpells();
    expect(instance._generated.feat.map((spell: any) => spell.system.ability)).toEqual(["cha"]);
  });
});

describe("CharacterSpellFactory.generateSpecialClassSpells feature lookup", () => {
  // feature 299 is on the character; 3050148 is an optional feature that replaces it when taken
  function classSpell(name: string, componentId: number): any {
    return {
      id: name.length,
      componentId,
      componentTypeId: 12168134,
      spellCastingAbilityId: 5,
      limitedUse: { maxUses: 1, resetType: 2 },
      usesSpellSlot: false,
      alwaysPrepared: true,
      definition: { name, level: 2, isHomebrew: false },
    };
  }

  function factory(spells: any[], optionalClassFeatures: any[]): any {
    const instance = Object.create(CharacterSpellFactory.prototype);
    instance.ddb = {
      classOptions: [],
      character: {
        spells: { class: spells },
        optionalClassFeatures,
        options: { class: [] },
        choices: { class: [] },
        // isCantripBoost reads the class modifiers on this branch
        modifiers: { class: [] },
        classes: [{
          definition: { id: 5, name: "Ranger", classFeatures: [] },
          classFeatures: [{ definition: { id: 299, name: "Example Awareness", classId: 5 } }],
        }],
      },
    };
    instance.character = { flags: { ddbimporter: { dndbeyond: { totalLevels: 20 } } } };
    instance.characterAbilities = { wis: { value: 14 } };
    instance.proficiencyModifier = 2;
    instance.spellCounts = {};
    instance._granted = { class: [], feat: [], race: [], background: [], item: [] };
    instance._generated = { class: [], feat: [], race: [], background: [], item: [] };
    return instance;
  }

  it("skips a spell whose feature the character does not have, quietly", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const instance = factory([classSpell("Example Sense", 3050148)], []);
    await instance.generateSpecialClassSpells();
    expect(instance._granted.class).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("adds the spell of a taken optional feature through the feature it replaces", async () => {
    const instance = factory([classSpell("Example Sense", 3050148)], [{ classFeatureId: 3050148, affectedClassFeatureId: 299 }]);
    await instance.generateSpecialClassSpells();
    expect(instance._granted.class.map((spell: any) => spell.name)).toEqual(["Example Sense"]);
  });
});

describe("CharacterSpellFactory.filterSpellsByAllowedCategories", () => {
  const phb2024 = (globalThis as any).CONFIG.DDB.sources.find((s: any) => s.id === 145);

  function factory(activeSourceCategories: number[], useHomebrewContent: boolean): any {
    const instance = Object.create(CharacterSpellFactory.prototype);
    instance.ddb = { character: { activeSourceCategories, preferences: { useHomebrewContent } } };
    return instance;
  }

  function spell(name: string, sourceIds: number[], isHomebrew = false): any {
    return {
      prepared: false,
      definition: { name, isHomebrew, sources: sourceIds.map((sourceId) => ({ sourceId })) },
    };
  }

  it("keeps book spells in an active category and drops the rest", () => {
    const result = factory([phb2024.sourceCategoryId], true)
      .filterSpellsByAllowedCategories([spell("Book Spell", [145]), spell("Other Book", [999999])]);
    expect(result.map((s: any) => s.definition.name)).toEqual(["Book Spell"]);
  });

  it("keeps homebrew spells, which DDB sends with no sources, when the character uses homebrew", () => {
    const result = factory([phb2024.sourceCategoryId], true)
      .filterSpellsByAllowedCategories([spell("Homebrew Bolt", [], true)]);
    expect(result.map((s: any) => s.definition.name)).toEqual(["Homebrew Bolt"]);
  });

  it("drops homebrew spells when the character has homebrew content turned off", () => {
    const result = factory([phb2024.sourceCategoryId], false)
      .filterSpellsByAllowedCategories([spell("Homebrew Bolt", [], true)]);
    expect(result).toEqual([]);
  });
});
