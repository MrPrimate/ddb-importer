/**
 * Class features that grant a spell cast without a spell slot. Each enricher turns the feature
 * into a cast activity on the compendium spell, consuming the feature's own uses, and the
 * slot-less spell copy DDB attaches is dropped by FEATURE_SPELLS_IGNORE. These pin the hint
 * shapes (spell, consumption, uses formula, the ruleset branches) that the audit worksheet only
 * shows for the configuration each capture was taken from.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import { DICTIONARY } from "../../../src/config/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

/** DDB's two copies of a feature-granted spell: the free cast (limited use) and, for always-prepared spells, the slot copy. */
function grantedSpell(featureId: number, name: string, limitedUse: Record<string, any> | null, usesSpellSlot: boolean): any {
  return {
    componentId: featureId,
    usesSpellSlot,
    alwaysPrepared: usesSpellSlot,
    limitedUse,
    definition: { name, level: 2 },
  };
}

function build(Enricher: TEnricher, featureName: string, spells: any[], { is2014 = false, klass = "Wizard" } = {}): any {
  const featureId = 5001;
  return makeEnricherData(Enricher, {
    name: featureName,
    is2014,
    klass,
    ddbParser: { originalName: featureName },
    character: {
      classes: [{
        level: 10,
        definition: { name: klass, classFeatures: [] },
        classFeatures: [{ definition: { id: featureId, name: featureName } }],
      }],
      spells: { class: spells.map((s) => ({ ...s, componentId: featureId })) },
    },
  });
}

const oncePerLongRest = { maxUses: 1, resetType: 2, numberUsed: 1, operator: 1 };
const oncePerShortRest = { maxUses: 1, resetType: 1, numberUsed: 0, operator: 1 };

/** A single-spell once-per-rest cast: the shape shared by most of the enrichers under test. */
function expectFreeCast(enricher: any, spell: string, { period, spent = 1 }: { period: string; spent?: number }) {
  expect(enricher.type).toBe("cast");
  expect(enricher.activity).toMatchObject({
    addSpellUuid: spell,
    addItemConsume: true,
    noSpellslot: true,
    data: { spell: { spellbook: true } },
  });
  expect(enricher.override.uses).toMatchObject({
    spent,
    max: "1",
    recovery: [{ period, type: "recoverAll" }],
  });
}

describe("FEATURE_SPELLS_IGNORE", () => {
  it("lists every feature whose enricher carries the free cast", () => {
    for (const name of [
      "Wondrous Alteration", "Undead Thralls", "Phantasmal Creatures", "Shapechanger", "Faithful Steed",
      "Paladin's Smite", "Contact Patron", "Steps of the Fey", "Fey Reinforcements", "Misty Wanderer",
      "Ethereal Step", "Dragon Companion", "Star Map", "Consult the Spirits", "Restorative Reagents",
      "Chemical Mastery", "Mapping Magic", "Superior Atlas", "Shape-Shifter",
      "Mystic Arcanum (6th level)", "Mystic Arcanum (7th level)", "Mystic Arcanum (8th level)", "Mystic Arcanum (9th level)",
      "Mystic Arcanum (Level 6 Spell)", "Mystic Arcanum (Level 7 Spell)", "Mystic Arcanum (Level 8 Spell)", "Mystic Arcanum (Level 9 Spell)",
    ]) {
      expect(DICTIONARY.parsing.featureSpellsIgnore).toContain(name);
    }
  });
});

describe("once per Long Rest casts of an always-prepared spell", () => {
  it.each([
    ["Paladin", ClassEnrichers.Paladin.FaithfulSteed, "Faithful Steed", "Find Steed"],
    ["Paladin", ClassEnrichers.Paladin.PaladinsSmite, "Paladin's Smite", "Divine Smite"],
    ["Warlock", ClassEnrichers.Warlock.ContactPatron, "Contact Patron", "Contact Other Plane"],
    ["Wizard", ClassEnrichers.Wizard.WondrousAlteration, "Wondrous Alteration", "Alter Self"],
  ])("%s %s casts %s", (klass, Enricher, feature, spell) => {
    const e = build(Enricher, feature, [
      grantedSpell(0, spell, oncePerLongRest, false),
      grantedSpell(0, spell, null, true),
    ], { klass });
    expectFreeCast(e, spell, { period: "lr" });
  });

  it("falls back to one use per Long Rest when the character payload carries no spell", () => {
    const e = build(ClassEnrichers.Paladin.FaithfulSteed, "Faithful Steed", [], { klass: "Paladin" });
    expect(e.override.uses).toMatchObject({ max: "1", recovery: [{ period: "lr", type: "recoverAll" }] });
  });
});

describe("Warlock MysticArcanum", () => {
  it("casts the chosen 2024 arcanum spell once per Long Rest from the feature", () => {
    const e = build(ClassEnrichers.Warlock.MysticArcanum, "Mystic Arcanum (Level 6 Spell)", [
      grantedSpell(0, "Circle of Death", oncePerLongRest, false),
    ], { klass: "Warlock" });
    expectFreeCast(e, "Circle of Death", { period: "lr" });
    expect(e.activity.name).toBe("Circle of Death");
  });

  it("reads the 2014 feature name for the chosen spell", () => {
    const e = build(ClassEnrichers.Warlock.MysticArcanum, "Mystic Arcanum (9th level)", [
      grantedSpell(0, "Foresight", { ...oncePerLongRest, numberUsed: 0 }, false),
    ], { is2014: true, klass: "Warlock" });
    expectFreeCast(e, "Foresight", { period: "lr", spent: 0 });
  });

  it("keeps only the once per Long Rest use when no arcanum spell is chosen", () => {
    const e = build(ClassEnrichers.Warlock.MysticArcanum, "Mystic Arcanum (Level 7 Spell)", [], { klass: "Warlock" });
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.override.uses).toMatchObject({ max: "1", recovery: [{ period: "lr", type: "recoverAll" }] });
  });
});

describe("Wizard UndeadThralls", () => {
  it("is the AU free Animate Dead in 2024", () => {
    const e = build(ClassEnrichers.Wizard.UndeadThralls, "Undead Thralls", [grantedSpell(0, "Animate Dead", oncePerLongRest, false)]);
    expectFreeCast(e, "Animate Dead", { period: "lr" });
  });

  it("keeps the 2014 spellbook grant at its defaults", () => {
    const e = build(ClassEnrichers.Wizard.UndeadThralls, "Undead Thralls", [], { is2014: true });
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.override).toEqual({});
  });
});

describe("Wizard Shapechanger (2014)", () => {
  it("casts Polymorph on itself once per Short Rest", () => {
    const e = build(ClassEnrichers.Wizard.Shapechanger, "Shapechanger", [grantedSpell(0, "Polymorph", oncePerShortRest, false)], { is2014: true });
    expectFreeCast(e, "Polymorph", { period: "sr", spent: 0 });
    expect(e.activity).toMatchObject({ targetType: "self", overrideTarget: true });
  });
});

describe("Wizard PhantasmalCreatures", () => {
  it("gives Summon Beast and Summon Fey their own once per Long Rest activity uses", () => {
    const e = build(ClassEnrichers.Wizard.PhantasmalCreatures, "Phantasmal Creatures", [
      grantedSpell(0, "Summon Beast", { ...oncePerLongRest, numberUsed: 1 }, false),
      grantedSpell(0, "Summon Beast", null, true),
      grantedSpell(0, "Summon Fey", { ...oncePerLongRest, numberUsed: 0 }, false),
      grantedSpell(0, "Summon Fey", null, true),
    ]);
    expect(e.type).toBe("cast");
    expect(e.activity).toMatchObject({
      name: "Summon Beast",
      addSpellUuid: "Summon Beast",
      addActivityConsume: true,
      noSpellslot: true,
      data: { uses: { spent: 1, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] } },
    });
    expect(e.activity.addItemConsume).toBeUndefined();
    expect(e.additionalActivities).toHaveLength(1);
    const fey = e.additionalActivities[0];
    expect(fey.init).toEqual({ name: "Summon Fey", type: "cast" });
    expect(fey.overrides).toMatchObject({
      addSpellUuid: "Summon Fey",
      addActivityConsume: true,
      data: { uses: { spent: 0, max: "1" } },
    });
    // the uses live on the activities, not the feature
    expect(e.override.uses).toBeUndefined();
  });
});

describe("Ranger FeyReinforcements and Sorcerer DragonCompanion", () => {
  it.each([
    ["Ranger", ClassEnrichers.Ranger.FeyReinforcements, "Fey Reinforcements", "Summon Fey"],
    ["Sorcerer", ClassEnrichers.Sorcerer.DragonCompanion, "Dragon Companion", "Summon Dragon"],
  ])("%s %s casts %s once per Long Rest without a Material component", (klass, Enricher, feature, spell) => {
    const e = build(Enricher, feature, [grantedSpell(0, spell, oncePerLongRest, false)], { klass });
    expectFreeCast(e, spell, { period: "lr" });
    expect(e.activity.data.spell.properties).toEqual(["material"]);
  });
});

describe("ability-modifier scaled casts", () => {
  it.each([
    ["Ranger", ClassEnrichers.Ranger.MistyWanderer, "Misty Wanderer", "Misty Step", "max(1, @abilities.wis.mod)"],
    ["Artificer", ClassEnrichers.Artificer.RestorativeReagents, "Restorative Reagents", "Lesser Restoration", "max(1, @abilities.int.mod)"],
  ])("%s %s casts %s with a minimum of one use", (klass, Enricher, feature, spell, max) => {
    const scaled = { maxUses: 0, resetType: 2, numberUsed: 2, operator: 1, statModifierUsesId: 5 };
    const e = build(Enricher, feature, [grantedSpell(0, spell, scaled, false)], { klass });
    expect(e.type).toBe("cast");
    expect(e.activity).toMatchObject({ addSpellUuid: spell, addItemConsume: true, noSpellslot: true });
    expect(e.override.uses).toMatchObject({ spent: 2, max, recovery: [{ period: "lr", type: "recoverAll" }] });
  });
});

describe("Warlock StepsOfTheFey", () => {
  it("casts Misty Step Charisma-modifier times per Long Rest with the two riders as additional activities", () => {
    const scaled = { maxUses: 0, resetType: 2, numberUsed: 0, operator: 1, statModifierUsesId: 6 };
    const e = build(ClassEnrichers.Warlock.StepsOfTheFey, "Steps of the Fey", [grantedSpell(0, "Misty Step", scaled, false)], { klass: "Warlock" });
    expect(e.type).toBe("cast");
    expect(e.activity).toMatchObject({ addSpellUuid: "Misty Step", addItemConsume: true, noSpellslot: true });
    expect(e.override.uses).toMatchObject({ max: "max(1, @abilities.cha.mod)", recovery: [{ period: "lr", type: "recoverAll" }] });
    expect(e.additionalActivities.map((a: any) => a.init)).toEqual([
      { name: "Refreshing Step", type: "heal" },
      { name: "Taunting Step", type: "save" },
    ]);
    expect(e.additionalActivities[0].build.healingPart).toMatchObject({ number: 1, denomination: 10, types: ["temphp"] });
    // neither rider spends the Misty Step uses
    expect(e.additionalActivities.every((a: any) => a.build.generateConsumption === false)).toBe(true);
    expect(e.effects[0]).toMatchObject({ name: "Taunted", activityMatch: "Taunting Step" });
  });
});

describe("Ranger EtherealStep (XGtE)", () => {
  it("casts Etherealness as a Bonus Action for one turn, once per Short Rest", () => {
    const e = build(ClassEnrichers.Ranger.EtherealStep, "Ethereal Step", [grantedSpell(0, "Etherealness", oncePerShortRest, false)], { is2014: true, klass: "Ranger" });
    expectFreeCast(e, "Etherealness", { period: "sr", spent: 0 });
    expect(e.activity).toMatchObject({
      activationType: "bonus",
      overrideActivation: true,
      data: { duration: { value: "1", units: "turn", override: true } },
    });
  });
});

describe("Druid StarMap", () => {
  const spells = [
    grantedSpell(0, "Guidance", null, false),
    grantedSpell(0, "Guiding Bolt", { maxUses: 0, resetType: 2, numberUsed: 1, operator: 1, statModifierUsesId: 5 }, false),
    grantedSpell(0, "Guiding Bolt", null, true),
  ];

  it("casts Guiding Bolt Wisdom-modifier times per Long Rest and Guidance at will in 2024", () => {
    const e = build(ClassEnrichers.Druid.StarMap, "Star Map", spells, { klass: "Druid" });
    expect(e.type).toBe("cast");
    expect(e.activity).toMatchObject({ name: "Guiding Bolt", addSpellUuid: "Guiding Bolt", addItemConsume: true });
    expect(e.override.uses).toMatchObject({ spent: 1, max: "max(1, @abilities.wis.mod)" });
    const guidance = e.additionalActivities[0];
    expect(guidance.init).toEqual({ name: "Guidance", type: "cast" });
    expect(guidance.overrides).toMatchObject({ addSpellUuid: "Guidance", noConsumeTargets: true });
    expect(guidance.overrides.addItemConsume).toBeUndefined();
  });

  it("uses the Proficiency Bonus for the 2014 Circle of Stars", () => {
    const e = build(ClassEnrichers.Druid.StarMap, "Star Map", spells, { klass: "Druid", is2014: true });
    expect(e.override.uses.max).toBe("@prof");
  });
});

describe("Barbarian ConsultTheSpirits (XGtE)", () => {
  it("offers Augury and Clairvoyance with Wisdom, sharing one use per Short Rest", () => {
    const e = build(ClassEnrichers.Barbarian.ConsultTheSpirits, "Consult the Spirits", [
      grantedSpell(0, "Augury", oncePerShortRest, false),
      grantedSpell(0, "Clairvoyance", oncePerShortRest, false),
    ], { klass: "Barbarian", is2014: true });
    expect(e.type).toBe("cast");
    expect(e.activity).toMatchObject({
      name: "Augury",
      addSpellUuid: "Augury",
      addItemConsume: true,
      data: { spell: { ability: "wis", properties: ["material"] } },
    });
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].overrides).toMatchObject({ name: "Clairvoyance", addSpellUuid: "Clairvoyance", addItemConsume: true });
    expect(e.override.uses).toMatchObject({ max: "1", recovery: [{ period: "sr", type: "recoverAll" }] });
  });
});

describe("Artificer additional-activity casts", () => {
  it("Chemical Mastery keeps its default activity and adds Conjured Cauldron once per Long Rest", () => {
    const e = build(ClassEnrichers.Artificer.ChemicalMastery, "Chemical Mastery", [grantedSpell(0, "Tasha's Bubbling Cauldron", oncePerLongRest, false)], { klass: "Artificer" });
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities[0].init).toEqual({ name: "Conjured Cauldron", type: "cast" });
    expect(e.additionalActivities[0].overrides).toMatchObject({
      addSpellUuid: "Tasha's Bubbling Cauldron",
      addItemConsume: true,
      noSpellslot: true,
      data: { spell: { spellbook: true, properties: ["material"] } },
    });
    expect(e.override.uses).toMatchObject({ spent: 1, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] });
  });

  it("Mapping Magic keeps Portal Jump and adds Faerie Fire Intelligence-modifier times per Long Rest", () => {
    const scaled = { maxUses: 1, resetType: 2, numberUsed: 0, operator: 2, statModifierUsesId: 4 };
    const e = build(ClassEnrichers.Artificer.MappingMagic, "Mapping Magic", [grantedSpell(0, "Faerie Fire", scaled, false)], { klass: "Artificer" });
    expect(e.type).toBeNull();
    expect(e.additionalActivities[0].init).toEqual({ name: "Illuminated Cartography", type: "cast" });
    expect(e.additionalActivities[0].overrides).toMatchObject({ addSpellUuid: "Faerie Fire", addItemConsume: true });
    expect(e.override.uses).toMatchObject({ max: "max(1, @abilities.int.mod)", recovery: [{ period: "lr", type: "recoverAll" }] });
  });

  it("Superior Atlas casts Find the Path without components once per Long Rest", () => {
    const e = build(ClassEnrichers.Artificer.SuperiorAtlas, "Superior Atlas", [grantedSpell(0, "Find the Path", oncePerLongRest, false)], { klass: "Artificer" });
    expectFreeCast(e, "Find the Path", { period: "lr" });
    expect(e.activity.data.spell.properties).toEqual(["vocal", "somatic", "material"]);
  });
});
