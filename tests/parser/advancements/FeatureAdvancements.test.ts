// @vitest-environment jsdom
/**
 * Advancements built from a class feature or racial trait live on that feature's own item, as the
 * dnd5e system content places them, and anything an advancement grants records the item at the top
 * of the grant chain (`advancementRoot`) so dnd5e runs nested advancements at the class's level.
 */
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";
import CharacterClassFactory from "../../../src/parser/classes/CharacterClassFactory";
import AdvancementOrigin from "../../../src/parser/advancements/AdvancementOrigin";
import FeatureAdvancements from "../../../src/parser/advancements/FeatureAdvancements";
import { utils } from "../../../src/lib/_module";
import { DDBDataUtils } from "../../../src/parser/lib/_module";

describe("utils.stableID", () => {
  it("gives the same 16 character id for the same seed", () => {
    const id = utils.stableID("2190881|10292152|Trait|1|mastery");
    expect(id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(utils.stableID("2190881|10292152|Trait|1|mastery")).toBe(id);
  });

  it("gives different ids for seeds that differ in one character", () => {
    expect(utils.stableID("a|1")).not.toBe(utils.stableID("a|2"));
  });
});

describe("FeatureAdvancements.hold", () => {
  // ids already written to characters and compendiums: the seeds must not change shape
  it("seeds class feature ids with the class restriction and species trait ids without it", () => {
    const held: I5eAdvancement[] = [];
    const first = { type: "Trait", level: 3, name: "Mastery", configuration: { mode: "mastery" } } as unknown as I5eAdvancement;
    const second = { type: "Trait", level: 3, name: "Mastery", configuration: { mode: "mastery" } } as unknown as I5eAdvancement;
    FeatureAdvancements.hold(held, first, [2190881, 10292152], { withClassRestriction: true });
    FeatureAdvancements.hold(held, second, [2190881, 10292152], { withClassRestriction: true });
    expect(first._id).toBe(utils.stableID("2190881|10292152|Trait|3|mastery||Mastery|0"));
    expect(second._id).toBe(utils.stableID("2190881|10292152|Trait|3|mastery||Mastery|1"));
    expect(held).toEqual([first, second]);

    const trait = { type: "Size", name: "", configuration: {} } as unknown as I5eAdvancement;
    FeatureAdvancements.hold([], trait, [1, 2]);
    expect(trait._id).toBe(utils.stableID("1|2|Size||||0"));
  });
});

describe("AdvancementOrigin.link", () => {
  it("roots an item granted by a class on that class advancement", () => {
    const feature: any = { flags: {} };
    AdvancementOrigin.link(feature, { _id: "paladin000000000", flags: {} }, "grant00000000001");
    expect(feature.flags.dnd5e).toEqual({
      advancementOrigin: "paladin000000000.grant00000000001",
      advancementRoot: "paladin000000000.grant00000000001",
    });
  });

  it("passes the granting item's root on to what that item grants", () => {
    const feature = { _id: "smite00000000000", flags: { dnd5e: { advancementRoot: "paladin000000000.grant00000000001" } } };
    const spell: any = {};
    AdvancementOrigin.link(spell, feature, "spellGrant000001");
    expect(spell.flags.dnd5e.advancementOrigin).toBe("smite00000000000.spellGrant000001");
    expect(spell.flags.dnd5e.advancementRoot).toBe("paladin000000000.grant00000000001");
  });

  it("uses the bare parent id when there is no advancement", () => {
    const trait: any = {};
    AdvancementOrigin.link(trait, { _id: "elf0000000000000" });
    expect(trait.flags.dnd5e).toEqual({ advancementOrigin: "elf0000000000000", advancementRoot: "elf0000000000000" });
  });
});

describe("FeatureAdvancements", () => {
  it("merges by id over an existing record, converting the array stub form", () => {
    const doc: any = { name: "Weapon Mastery", system: { advancement: [{ _id: "keep000000000000", type: "ItemGrant" }] } };
    FeatureAdvancements.merge(doc, [{ _id: "mastery000000000", type: "Trait" } as I5eAdvancement]);
    expect(Object.keys(doc.system.advancement)).toEqual(["keep000000000000", "mastery000000000"]);
  });

  it("strips values for compendium copies without touching the originals", () => {
    const original = { _id: "a", type: "Trait", value: { chosen: ["weapon:longsword"] } } as unknown as I5eAdvancement;
    const [copy] = FeatureAdvancements.withoutValues([original]);
    expect("value" in copy).toBe(false);
    expect(original.value).toEqual({ chosen: ["weapon:longsword"] });
  });
});

function classStub(classFeatures: Partial<IDDBClassDefinitionFeature>[]) {
  const advancements: I5eAdvancement[] = [];
  const parser = Object.assign(Object.create(DDBBaseClass.prototype) as DDBBaseClass, {
    classFeatures,
    ddbClassDefinition: { id: 2190881 },
    ownedFeatureAdvancements: new Map(),
    _addAdvancement: (advancement: I5eAdvancement) => advancements.push(advancement),
  });
  return { parser, advancements };
}

describe("DDBBaseClass._addFeatureAdvancement", () => {
  const mastery = { id: 10292152, name: "Weapon Mastery", requiredLevel: 1 } as IDDBClassDefinitionFeature;
  const expertise = { id: 20, name: "Expertise", requiredLevel: 1 } as IDDBClassDefinitionFeature;
  const repeat = { id: 21, name: "6: Expertise", requiredLevel: 6 } as IDDBClassDefinitionFeature;
  const core = { id: 1, name: "Core Paladin Traits", requiredLevel: 1 } as IDDBClassDefinitionFeature;

  it("keeps core trait advancements on the class", () => {
    const { parser, advancements } = classStub([core]);
    parser._addFeatureAdvancement(core, { type: "Trait", level: 1 } as I5eAdvancement);
    expect(advancements).toHaveLength(1);
    expect(parser.ownedFeatureAdvancements.size).toBe(0);
  });

  it("holds other advancements for the feature with an id that is stable across runs", () => {
    const first = classStub([mastery]);
    first.parser._addFeatureAdvancement(mastery, { type: "Trait", level: 1, configuration: { mode: "mastery" } } as I5eAdvancement);
    const second = classStub([mastery]);
    second.parser._addFeatureAdvancement(mastery, { type: "Trait", level: 1, configuration: { mode: "mastery" } } as I5eAdvancement);

    const held = first.parser.ownedFeatureAdvancements.get(mastery.id);
    expect(first.advancements).toHaveLength(0);
    expect(held?.advancements).toHaveLength(1);
    expect(held?.advancements[0]._id).toBe(second.parser.ownedFeatureAdvancements.get(mastery.id)?.advancements[0]._id);
  });

  it("folds a level-prefixed repeat into the first feature of that name", () => {
    const { parser } = classStub([expertise, repeat]);
    parser._addFeatureAdvancement(expertise, { type: "Trait", level: 1, configuration: { mode: "expertise" } } as I5eAdvancement);
    parser._addFeatureAdvancement(repeat, { type: "Trait", level: 6, configuration: { mode: "expertise" } } as I5eAdvancement);
    const held = parser.ownedFeatureAdvancements.get(expertise.id);
    expect(parser.ownedFeatureAdvancements.has(repeat.id)).toBe(false);
    expect(held?.advancements.map((a) => a.level)).toEqual([1, 6]);
    expect(new Set(held?.advancements.map((a) => a._id)).size).toBe(2);
  });
});

describe("DDBBaseClass._weaponMasteryIncreases", () => {
  const base = { id: 10292152, name: "Weapon Mastery", requiredLevel: 1,
    levelScales: [{ level: 1, fixedValue: 2 }, { level: 4, fixedValue: 3 }, { level: 10, fixedValue: 4 }] } as unknown as IDDBClassDefinitionFeature;
  const four = { id: 10292175, name: "4: Weapon Mastery", requiredLevel: 4 } as IDDBClassDefinitionFeature;
  const ten = { id: 10292176, name: "10: Weapon Mastery", requiredLevel: 10 } as IDDBClassDefinitionFeature;
  const baseTrait = () => ({
    type: "Trait", level: 1, name: "Weapon Mastery",
    configuration: { mode: "mastery", choices: [{ count: 2, pool: ["weapon:*"] }] },
    value: { chosen: ["weapon:mar:greataxe", "weapon:sim:handaxe", "weapon:mar:maul", "weapon:sim:javelin"] },
  }) as unknown as I5eAdvancement;

  const noPicks = () => undefined;

  it("adds one Trait per DDB level repeat, sized by the Weapons Mastered scale, as the dnd5e Barbarian does", () => {
    const { parser } = classStub([base, four, ten]);
    (parser as any)._generateWeaponMasteryAdvancement = noPicks;
    const trait = baseTrait();
    const increases = parser._weaponMasteryIncreases(base, trait);

    expect(increases.map((a) => a.level)).toEqual([4, 10]);
    expect(increases.map((a) => (a.configuration as any).choices[0])).toEqual([
      { count: 1, pool: ["weapon:*"] },
      { count: 1, pool: ["weapon:*"] },
    ]);
    expect(increases.every((a) => (a.configuration as any).allowReplacements === false)).toBe(true);
    // the character's four picks are dealt out in order: two at level 1, one at 4, one at 10
    expect((trait.value as any).chosen).toEqual(["weapon:mar:greataxe", "weapon:sim:handaxe"]);
    expect(increases.map((a) => (a.value as any).chosen)).toEqual([["weapon:mar:maul"], ["weapon:sim:javelin"]]);
  });

  it("gains one kind per repeat when the feature has no level scale (Fighter)", () => {
    const fighter = { ...base, levelScales: [] } as IDDBClassDefinitionFeature;
    const { parser } = classStub([fighter, four]);
    (parser as any)._generateWeaponMasteryAdvancement = noPicks;
    const increases = parser._weaponMasteryIncreases(fighter, baseTrait());
    expect((increases[0].configuration as any).choices[0].count).toBe(1);
  });

  it("takes the picks DDB attaches to each level's repeat as that level's picks", () => {
    const { parser } = classStub([base, four, ten]);
    (parser as any)._generateWeaponMasteryAdvancement = (feature: IDDBClassDefinitionFeature) => {
      const chosen = feature.id === four.id ? ["weapon:mar:warhammer"] : feature.id === ten.id ? ["weapon:sim:javelin"] : [];
      return { toObject: () => ({ type: "Trait", value: { chosen } }) };
    };
    const trait = { ...baseTrait(), value: { chosen: ["weapon:mar:battleaxe", "weapon:mar:greatsword"] } } as I5eAdvancement;
    const increases = parser._weaponMasteryIncreases(base, trait);
    expect(increases.map((a) => (a.value as any).chosen)).toEqual([["weapon:mar:warhammer"], ["weapon:sim:javelin"]]);
    expect((trait.value as any).chosen).toEqual(["weapon:mar:battleaxe", "weapon:mar:greatsword"]);
  });
});

describe("CharacterClassFactory.attachFeatureAdvancements", () => {
  it("puts held advancements on the matching class feature, not on its choice options", () => {
    const feature = { id: 10292152, name: "Weapon Mastery" } as IDDBClassDefinitionFeature;
    const advancement = { _id: "mastery000000000", type: "Trait", level: 1, value: { chosen: ["weapon:longsword"] } } as unknown as I5eAdvancement;
    const factory = Object.assign(Object.create(CharacterClassFactory.prototype) as CharacterClassFactory, {
      ddbClasses: { Paladin: { ownedFeatureAdvancements: new Map([[feature.id, { feature, advancements: [advancement] }]]) } },
    });
    const option: any = { name: "Weapon Mastery: Longsword", flags: { ddbimporter: { id: feature.id, type: "class", isChoice: true } }, system: { advancement: {} } };
    const item: any = { name: "Weapon Mastery", flags: { ddbimporter: { id: feature.id, type: "class" } }, system: { advancement: {} } };

    factory.attachFeatureAdvancements([option, item]);

    expect(option.system.advancement).toEqual({});
    expect(item.system.advancement.mastery000000000.value).toEqual({ chosen: ["weapon:longsword"] });
    // the item holds its own copy
    expect(item.system.advancement.mastery000000000).not.toBe(advancement);
  });
});

describe("CharacterClassFactory choice picks", () => {
  function setup(classLevel: number) {
    const feature = { id: 300, name: "Fighting Style", requiredLevel: 2 } as IDDBClassDefinitionFeature;
    const choice = {
      _id: "fightingStyle000", type: "ItemChoice", name: "Fighting Style",
      configuration: { choices: { 2: { count: 1 }, 7: { count: 1 } },
        pool: [{ uuid: "Compendium.world.feats.Item.defense000000000" }, { uuid: "Compendium.world.feats.Item.archery000000000" }] },
    } as unknown as I5eAdvancement;
    const paladin: any = { _id: "paladin000000000", name: "Paladin", type: "class", flags: {}, system: { advancement: {} } };
    const style: any = { _id: "styleItem0000000", name: "Fighting Style", type: "feat", flags: { ddbimporter: { id: 300, type: "class" } }, system: { advancement: {} } };
    const defense: any = { _id: "defenseItem00000", name: "Defense", type: "feat", flags: { ddbimporter: { id: 1789 } }, system: {} };
    // taken through an ASI, so another advancement already owns it
    const archery: any = { _id: "archeryItem00000", name: "Archery", type: "feat",
      flags: { ddbimporter: { id: 1790 }, dnd5e: { advancementOrigin: "paladin000000000.asi0000000000004" } }, system: {} };
    // a real instance: linkFeatures calls private (#) methods
    const ddbCharacter: any = { raw: { character: {} }, source: { ddb: {} },
      data: { features: [style, defense, archery], actions: [], classes: [paladin] } };
    const factory = Object.assign(new CharacterClassFactory(ddbCharacter, { updateCompendiumItems: false }), {
      ddbClasses: { Paladin: {
        data: { name: "Paladin" },
        ddbClass: { level: classLevel },
        _compendiums: {
          features: { index: [] },
          feats: { index: [
            { uuid: "Compendium.world.feats.Item.defense000000000", flags: { ddbimporter: { id: 1789 } } },
            { uuid: "Compendium.world.feats.Item.archery000000000", flags: { ddbimporter: { id: 1790 } } },
          ] },
        },
        ownedFeatureAdvancements: new Map([[feature.id, { feature, advancements: [choice] }]]),
      } },
    });
    factory.linkFeatures();
    return { style, defense, archery };
  }

  it("records the picked feat on the feature's choice and roots it on the class", () => {
    const { style, defense, archery } = setup(5);
    expect(style.system.advancement.fightingStyle000.value).toEqual({
      added: { 2: { defenseItem00000: "Compendium.world.feats.Item.defense000000000" } },
      replaced: {},
    });
    expect(defense.flags.dnd5e.advancementOrigin).toBe("styleItem0000000.fightingStyle000");
    expect(defense.flags.dnd5e.advancementRoot).toBe("paladin000000000");
    expect(archery.flags.dnd5e.advancementOrigin).toBe("paladin000000000.asi0000000000004");
  });

  it("matches a choice option document by its option id, not just the shared feature id", () => {
    const feature = { id: 400, name: "Metamagic", requiredLevel: 2 } as IDDBClassDefinitionFeature;
    const choice = { _id: "metamagicChoice0", type: "ItemChoice", name: "Metamagic",
      configuration: { choices: { 2: { count: 1 } }, pool: [
        { uuid: "Compendium.world.features.Item.quickened0000000" },
        { uuid: "Compendium.world.features.Item.twinned000000000" },
      ] } } as unknown as I5eAdvancement;
    const sorcerer: any = { _id: "sorcerer00000000", name: "Sorcerer", type: "class", flags: {}, system: { advancement: {} } };
    const parent: any = { _id: "metamagicItem000", name: "Metamagic", type: "feat", flags: { ddbimporter: { id: 400, type: "class" } }, system: { advancement: {} } };
    const twinned: any = { _id: "twinnedItem00000", name: "Metamagic: Twinned Spell", type: "feat",
      flags: { ddbimporter: { id: 400, isChoice: true, dndbeyond: { choice: { optionId: 22 } } } }, system: {} };
    const ddbCharacter: any = { raw: { character: {} }, source: { ddb: {} },
      data: { features: [parent, twinned], actions: [], classes: [sorcerer] } };
    const factory = Object.assign(new CharacterClassFactory(ddbCharacter, { updateCompendiumItems: false }), {
      ddbClasses: { Sorcerer: {
        data: { name: "Sorcerer" },
        ddbClass: { level: 3 },
        _compendiums: {
          feats: { index: [] },
          features: { index: [
            { uuid: "Compendium.world.features.Item.quickened0000000", flags: { ddbimporter: { id: 400, isChoice: true, dndbeyond: { choice: { optionId: 21 } } } } },
            { uuid: "Compendium.world.features.Item.twinned000000000", flags: { ddbimporter: { id: 400, isChoice: true, dndbeyond: { choice: { optionId: "22" } } } } },
          ] },
        },
        ownedFeatureAdvancements: new Map([[feature.id, { feature, advancements: [choice] }]]),
      } },
    });
    factory.linkFeatures();
    expect(parent.system.advancement.metamagicChoice0.value.added).toEqual({
      2: { twinnedItem00000: "Compendium.world.features.Item.twinned000000000" },
    });
  });

  it("does not fill a choice level the class has not reached", () => {
    const { style } = setup(1);
    expect(style.system.advancement.fightingStyle000.value).toBeUndefined();
  });
});

describe("DDBDataUtils.featureIdentifier", () => {
  it("adds the class to features several classes name alike, as the dnd5e content does", () => {
    expect(DDBDataUtils.featureIdentifier("Channel Divinity", "Cleric")).toBe("channel-divinity-cleric");
    expect(DDBDataUtils.featureIdentifier("Channel Divinity", "Paladin")).toBe("channel-divinity-paladin");
  });

  it("leaves other features, and features without a class, plain", () => {
    expect(DDBDataUtils.featureIdentifier("Weapon Mastery", "Paladin")).toBe("weapon-mastery");
    expect(DDBDataUtils.featureIdentifier("Channel Divinity", null)).toBe("channel-divinity");
  });
});

describe("DDBDataUtils.getScaleValueLink", () => {
  it("points a feature-held scale at the feature item", () => {
    const ddb = { character: { classes: [{ definition: { id: 2190875, name: "Barbarian" } }] } } as unknown as IDDBData;
    const brutalStrike = { name: "Brutal Strike", classId: 2190875, levelScales: [{ level: 9, dice: { diceString: "1d10" } }] } as any;
    expect(DDBDataUtils.getScaleValueLink(ddb, brutalStrike)).toBe("@scale.brutal-strike.damage");
  });
});
