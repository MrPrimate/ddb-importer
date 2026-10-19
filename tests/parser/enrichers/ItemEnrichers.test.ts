/**
 * A cross-section of the branchier equipment enrichers.
 *
 * Item enrichers are the least covered corner of the audit: the items suite
 * replays RAW muncher payloads, so `is2014` is fixed by whichever payload was
 * captured, and `documentStub` (which retypes an item entirely before parsing)
 * never shows up in the worksheet at all. As with the other audit suites, none
 * of it runs in CI.
 *
 * See ClassEnrichers.test.ts for why the barrel mocks below are needed and why
 * DDBDataUtils is filled in beforeAll rather than in the mock factory.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

const parserLib = vi.hoisted(() => ({ DDBDataUtils: {} as any, DDBTemplateStrings: {} as any }));
const modules = vi.hoisted(() => ({ midiQolInstalled: true }));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
  // Cannon resolves publisher book ids through it; its own imports are light
  // enough (config, Logger, Utils) not to re-enter the enricher tree.
  DDBSources: (await vi.importActual<any>("../../../src/lib/DDBSources")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => parserLib);
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => modules },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import { retributiveStrike } from "../../../src/parser/enrichers/item/_ItemActivities";

type TEnricher = new (options: any) => any;

beforeAll(async () => {
  // ChangeHelper's advantage/disadvantage getters read CONFIG.Dice.D20Roll.ADV_MODE
  installActivityConfigStubs();
  const { default: DDBDataUtils } = await import("../../../src/parser/lib/DDBDataUtils");
  for (const key of Object.getOwnPropertyNames(DDBDataUtils)) {
    if (typeof (DDBDataUtils as any)[key] === "function") {
      parserLib.DDBDataUtils[key] = (DDBDataUtils as any)[key].bind(DDBDataUtils);
    }
  }
  Object.assign(parserLib.DDBTemplateStrings, await import("../../../src/parser/lib/DDBTemplateStrings"));
});

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { name: "Test Item", ...options } as any);
}

describe("AlchemistsFire", () => {
  const Enricher = ItemEnrichers.AlchemistsFire;

  it("is a dex attack in 2014 and a dex save in 2024", () => {
    const legacy = build(Enricher, { is2014: true });
    expect(legacy.type).toBe("attack");
    expect(legacy.activity.data.attack).toMatchObject({ ability: "dex", type: { value: "ranged" } });
    expect(legacy.activity.data.save).toBeUndefined();

    const modern = build(Enricher);
    expect(modern.type).toBe("save");
    expect(modern.activity.data.save).toMatchObject({ ability: ["dex"], dc: { calculation: "dex" } });
    expect(modern.activity.data.attack).toBeUndefined();
  });

  it("consumes the flask in both rulesets but only 2024 survives being emptied", () => {
    expect(build(Enricher, { is2014: true }).activity.addItemConsume).toBe(true);
    expect(build(Enricher).activity.addItemConsume).toBe(true);
    expect(build(Enricher, { is2014: true }).override).toBeNull();
    // only autoDestroy: a whole uses override would drop the parsed max
    expect(build(Enricher).override).toEqual({ data: { system: { uses: { autoDestroy: false } } } });
  });

  it("adds the extinguish check only in 2014, where Burning does not exist", () => {
    expect(build(Enricher, { is2014: true }).additionalActivities[0].init.name).toBe("Extinguish Flames Check");
    expect(build(Enricher).additionalActivities).toBeNull();

    expect(build(Enricher, { is2014: true }).effects[0].statuses).toBeUndefined();
    expect(build(Enricher).effects[0].statuses).toEqual(["Burning"]);
  });
});

describe("PotionOfHealing", () => {
  const Enricher = ItemEnrichers.PotionOfHealing;

  it("is an action in 2014 and a bonus action in 2024", () => {
    expect(build(Enricher, { is2014: true }).activity.activationType).toBe("action");
    expect(build(Enricher).activity.activationType).toBe("bonus");
    expect(build(Enricher).type).toBe("heal");
  });

  it("forces the 2014 ruleset for a Player's Handbook (2014) printing", () => {
    // sourceId 1 is the 2014 PHB; DDB ships both printings under one name
    const phb2014 = build(Enricher, { ddbParser: { ddbDefinition: { sources: [{ sourceId: 1 }] } } });
    expect(phb2014.override.data["flags.ddbimporter"]).toEqual({ is2014: true, is2024: false });
    expect(phb2014.override.data.system.source.rules).toBe("2014");

    const other = build(Enricher, { ddbParser: { ddbDefinition: { sources: [{ sourceId: 145 }] } } });
    expect(other.override).toEqual({});
    // and no sources at all must not throw
    expect(build(Enricher, { ddbParser: { ddbDefinition: {} } }).override).toEqual({});
  });
});

describe("Cannon", () => {
  const Enricher = ItemEnrichers.Cannon;
  const withSources = (...sourceIds: number[]) =>
    build(Enricher, { ddbParser: { ddbDefinition: { sources: sourceIds.map((sourceId) => ({ sourceId })) } } });

  // "Cannon" is a name other publishers use too, so the enricher gates on the
  // DDB source. 164/197/281 are the Mage Hand Press books in category 32.
  it.each([164, 197, 281])("sets cannonballs for a Mage Hand Press cannon (source %i)", (sourceId) => {
    expect(withSources(sourceId).isMageHandPress).toBe(true);
    expect(withSources(sourceId).override).toEqual({ data: { "system.ammunition.type": "cannonballs" } });
  });

  it.each([2, 249])("leaves another publisher's cannon alone (source %i)", (sourceId) => {
    expect(withSources(sourceId).isMageHandPress).toBe(false);
    expect(withSources(sourceId).override).toEqual({});
  });

  it("matches when the publisher is one of several sources", () => {
    expect(withSources(2, 197).isMageHandPress).toBe(true);
  });

  it("does not throw when the item lists no sources", () => {
    expect(withSources().isMageHandPress).toBe(false);
    expect(build(Enricher, { ddbParser: { ddbDefinition: {} } }).override).toEqual({});
  });

  // foundry's mergeObject only expands dotted keys at depth 0, so nesting this
  // under a `system` object would write a literal "ammunition.type" key
  it("keeps the dotted path at the top level of data", () => {
    expect(Object.keys(withSources(197).override.data)).toEqual(["system.ammunition.type"]);
  });
});

describe("AirRender", () => {
  const Enricher = ItemEnrichers.AirRender;

  // Air Render is a shortbow that fires no ammunition, so the override clears
  // the type the weapon parser assigns.
  it("clears the ammunition type and the magical bonus", () => {
    expect(build(Enricher).override.data).toEqual({
      "system.magicalBonus": null,
      "system.ammunition.type": "",
    });
  });

  // Regression: both were nested under a `system` object, where mergeObject
  // does not expand them. The item kept its parser assigned ammunition type
  // (arrow) and gained a literal "ammunition.type" property instead.
  it("keeps dotted paths at the top level of data", () => {
    const data = build(Enricher).override.data;
    expect(data.system).toBeUndefined();
    for (const key of Object.keys(data)) expect(key.startsWith("system.")).toBe(true);
  });
});

describe("JavelinOfLightning", () => {
  const Enricher = ItemEnrichers.JavelinOfLightning;

  it("clears the DDB uses and keeps the item from self-destructing", () => {
    for (const is2014 of [true, false]) {
      const override = build(Enricher, { is2014 }).override;
      expect(override.retainUseSpent).toBe(true);
      expect(override.data.system.uses).toMatchObject({ max: "", recovery: [], autoDestroy: false });
    }
  });

  it("only 2024 restates the base damage as piercing plus lightning", () => {
    expect(build(Enricher, { is2014: true }).override.data.system.damage).toBeUndefined();
    expect(build(Enricher).override.data.system.damage.base).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["piercing", "lightning"],
    });
  });

  it("adds the lightning bolt without the auto-generated activities", () => {
    const e = build(Enricher);
    expect(e.additionalActivities.map((a: any) => a.init?.name ?? a.action?.name)).toContain("Lightning Bolt");
    expect(e.addAutoAdditionalActivities).toBe(false);
    expect(e.activity.noConsumeTargets).toBe(true);
  });
});

describe("WandOfOrcus", () => {
  const Enricher = ItemEnrichers.WandOfOrcus;

  it("retypes the wand into a mace before parsing", () => {
    // documentStub runs ahead of the normal item pipeline and never appears in
    // the audit worksheet, so nothing else asserts this retype
    const stub = build(Enricher).documentStub;
    expect(stub).toMatchObject({
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: true,
      systemType: { value: "simpleM", baseItem: "mace" },
    });
    expect(stub.copySRD.uuid).toBe("Compendium.dnd5e.items.Item.Ajyq6nGwF7FtLhDQ");
  });

  it("adds the attunement save and suppresses the auto activities", () => {
    const e = build(Enricher);
    expect(e.additionalActivities.map((a: any) => a.init.name)).toContain("Save vs Attunement");
    expect(e.addAutoAdditionalActivities).toBe(false);
  });
});

describe("MistypedCrossbow", () => {
  const Enricher = ItemEnrichers.MistypedCrossbow;

  // DDB source 225 ships these with type "Ammunition" and no damage, range,
  // properties or category, so they import as consumable ammo without the stub
  it.each([
    ["Silent Hand Crossbow", "martialR", "handcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepHandCrossb"],
    ["Silent Heavy Crossbow", "martialR", "heavycrossbow", "Compendium.dnd5e.equipment24.Item.phbwepHeavyCross"],
    ["Silent Light Crossbow", "simpleR", "lightcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepLightCross"],
    ["Ghaal'Shaarat Hand Crossbow +3", "martialR", "handcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepHandCrossb"],
    ["Ghaal'Shaarat Light Crossbow +1", "simpleR", "lightcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepLightCross"],
  ])("retypes %s into a weapon with the right base", (name, systemType, baseItem, uuid) => {
    const stub = build(Enricher, { name, ddbParser: { originalName: name } }).documentStub;
    expect(stub).toMatchObject({
      documentType: "weapon",
      parsingType: "weapon",
      systemType: { value: systemType, baseItem },
    });
    expect(stub.copySRD.uuid).toBe(uuid);
  });

  it("copies the 2014 crossbow for legacy content", () => {
    const name = "Ghaal'Shaarat Heavy Crossbow +2";
    const stub = build(Enricher, { name, is2014: true, ddbParser: { originalName: name } }).documentStub;
    expect(stub.copySRD.uuid).toBe("Compendium.dnd5e.items.Item.RmP0mYRn2J7K26rX");
  });

  it("leaves a weapon that is not a crossbow alone", () => {
    const name = "Ghaal'Shaarat Longsword +1";
    expect(build(Enricher, { name, ddbParser: { originalName: name } }).documentStub).toBeNull();
  });
});

describe("GhaalShaaratWeapon", () => {
  const Enricher = ItemEnrichers.GhaalShaaratWeapon;

  function applyOverride(name: string, doc: any): any {
    const e = build(Enricher, { name, ddbParser: { originalName: name } });
    e.override.func({ enricher: { data: doc } });
    return doc;
  }

  function weaponDoc(value: string, properties: string[], range: any): any {
    return { type: "weapon", system: { type: { value, baseItem: "" }, properties, range } };
  }

  // every ghaal'shaarat has the Returning Weapon trait, none of the DDB
  // definitions carry the Thrown property
  it("adds thrown and returning to a melee weapon, with the 30/120 thrown range", () => {
    const doc = applyOverride(
      "Ghaal'Shaarat Longsword +1",
      weaponDoc("martialM", ["ver", "mgc"], { value: 5, long: null, units: "ft", reach: null }),
    );
    expect(doc.system.properties).toEqual(["ver", "mgc", "thr", "ret"]);
    expect(doc.system.range).toEqual({ value: 30, long: 120, units: "ft", reach: null });
  });

  it("keeps the longer range of a ranged weapon", () => {
    const doc = applyOverride(
      "Ghaal'Shaarat Longbow +2",
      weaponDoc("martialR", ["amm", "hvy", "two"], { value: 150, long: 600, units: "ft", reach: null }),
    );
    expect(doc.system.properties).toEqual(["amm", "hvy", "two", "thr", "ret"]);
    expect(doc.system.range).toEqual({ value: 150, long: 600, units: "ft", reach: null });
  });

  it("still retypes the crossbow variants DDB entered as ammunition", () => {
    const name = "Ghaal'Shaarat Hand Crossbow +1";
    const stub = build(Enricher, { name, ddbParser: { originalName: name } }).documentStub;
    expect(stub).toMatchObject({ documentType: "weapon", systemType: { baseItem: "handcrossbow" } });
  });
});

describe("EldritchClawTattoo", () => {
  it("pairs the Eldritch Maul activity with an effect of the same name", () => {
    // the effect is matched to the activity by name, so a rename in one place
    // orphans the other
    const e = build(ItemEnrichers.EldritchClawTattoo);
    const activityNames = e.additionalActivities.map((a: any) => a.init?.name ?? a.action?.name);
    expect(activityNames).toContain("Eldritch Maul");
    expect(e.effects.map((effect: any) => effect.name)).toContain("Eldritch Maul");
  });
});

describe("StaffOfThunderAndLightning", () => {
  it("splits the staff into separately recovering properties", () => {
    const legacy = build(ItemEnrichers.StaffOfThunderAndLightning, { name: "Staff of Thunder and Lightning", is2014: true });
    const modern = build(ItemEnrichers.StaffOfThunderAndLightning, { name: "Staff of Thunder and Lightning", is2014: false });

    expect(modern.clearAutoEffects).toBe(true);
    expect(modern.override.uses).toMatchObject({ max: "", recovery: [] });

    expect(legacy.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Thunder",
      "Lightning",
      "Thunder and Lightning (Lightning Strike)",
      "Thunder and Lightning (Thunderclap)",
      "Lightning Strike",
      "Thunderclap",
    ]);
    expect(modern.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Thunder",
      "Lightning",
      "Thunder and Lightning",
      "Lightning Strike",
      "Thunderclap",
    ]);

    // Thunder rides on a hit and needs no action of its own
    expect(modern.additionalActivities[0].build.activationOverride.type).toBe("special");
    // 2024 Thunder and Lightning is a Bonus Action after a hit
    expect(modern.additionalActivities[2].build.activationOverride.type).toBe("bonus");

    // one activity cannot spend another's use, so the 2014 Thunderclap half has its own daily use
    const legacyThunderclap = legacy.additionalActivities[3];
    expect(legacyThunderclap.init.name).toBe("Thunder and Lightning (Thunderclap)");
    expect(legacyThunderclap.build.generateUses).toBe(true);
    expect(legacyThunderclap.build.usesOverride).toMatchObject({ max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] });
    expect(legacyThunderclap.overrides.addActivityConsume).toBe(true);

    const stunned = modern.effects.find((e: any) => e.name === "Stunned");
    expect(stunned.options.expiry).toBe("sourceEnd");
    expect(stunned.activitiesMatch).toEqual(["Thunder", "Thunder and Lightning"]);
    expect(legacy.effects.find((e: any) => e.name === "Deafened").activitiesMatch)
      .toEqual(["Thunderclap", "Thunder and Lightning (Thunderclap)"]);
  });
});

describe("AxeOfTheGallopingHeadsman", () => {
  const Enricher = ItemEnrichers.AxeOfTheGallopingHeadsman;
  const axe = (name: string, ...bonuses: number[]) => build(Enricher, {
    name,
    ddbParser: {
      originalName: name,
      ddbDefinition: { grantedModifiers: bonuses.map((value) => ({ type: "bonus", subType: "magic", value })) },
    },
  });
  const names = (e: any) => e.additionalActivities.map((a: any) => a.init.name);

  it("unlocks the properties by tier", () => {
    expect(names(axe("Axe of the Galloping Headsman, +1", 1))).toEqual(["Fiery Smite (1d10)"]);
    expect(names(axe("Axe of the Galloping Headsman, +2", 2))).toEqual(["Fiery Smite (1d10)", "Mark of Guilt", "Sense Guilt"]);
    expect(names(axe("Axe of the Galloping Headsman, +3", 3))).toEqual([
      "Fiery Smite (1d10)", "Mark of Guilt", "Sense Guilt", "Dark Binding", "Executioner's Blade Damage", "Executioner's Blade Save",
    ]);
  });

  it("adds the Fiery Smite die to the weapon attack and bakes the Sense Guilt DC", () => {
    const plusTwo = axe("Axe of the Galloping Headsman, +2", 2);
    expect(plusTwo.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 6, types: ["fire"] });
    const sense = plusTwo.additionalActivities.find((a: any) => a.init.name === "Sense Guilt");
    expect(sense.build.saveOverride.dc.formula).toBe("18");
  });

  it("builds the Varies record at the Rare tier and says so", () => {
    const varies = axe("Axe of the Galloping Headsman", 1, 2, 3);
    expect(names(varies)).toEqual(["Fiery Smite (1d10)"]);
    expect(varies.override.descriptionSuffix).toContain("Rare tier");
    expect(axe("Axe of the Galloping Headsman, +3", 3).override).toEqual({});
  });

  it("scopes the prone critical range to this axe for AC5e", () => {
    const executioner = axe("Axe of the Galloping Headsman, +3", 3).effects.find((e: any) => e.name === "Executioner's Blade");
    expect(executioner.ac5eOnly).toBe(true);
    expect(executioner.ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.attack.criticalThreshold",
      value: "set=19; opponentActor.statuses.prone && item.identifier === 'axe-of-the-galloping-headsman-3'",
    });
  });
});

describe("levelled and variant weapon properties", () => {
  const named = (Enricher: TEnricher, name: string) => build(Enricher, { name, ddbParser: { originalName: name } });
  const names = (e: any) => e.additionalActivities.map((a: any) => a.init.name);

  it("builds every Tordalfr's Rebuttal record as one weapon gated by character level", () => {
    for (const name of ["Tordalfr's Rebuttal (Lv. 9)", "Tordalfr's Rebuttal (Lv. 13)", "Tordalfr's Rebuttal"]) {
      const javelin = named(ItemEnrichers.TordalfrsRebuttal, name);
      expect(names(javelin)).toEqual(["Wreathed in Lightning", "Charged Strike", "Lightning Bolt"]);
      // the same attack id on every record, and no item uses: each activity spends its own
      expect(javelin.activity.id).toBe(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal").activity.id);
      expect(javelin.override.uses.max).toBe("");
    }
    const javelin = named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 13)");
    const [lightning, charged, bolt] = javelin.additionalActivities;
    // dnd5e 5.x has no rule conditions: the thrown lightning is its own damage activity from 9th
    expect(lightning.build.damageParts[0]).toMatchObject({ number: 1, denomination: 6, types: ["lightning"] });
    expect(lightning.overrides.data.visibility.level.min).toBe(9);
    expect(charged.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1", recovery: [{ period: "sr" }] }, visibility: { level: { min: 13 } } } });
    expect(bolt.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1", recovery: [{ period: "dawn" }] }, visibility: { level: { min: 17 } } } });
    expect(bolt.overrides.addItemConsume).toBeFalsy();
    // the level bonus is the record's own magical bonus, so no bonus effect
    expect(javelin.effects.map((e: any) => e.name)).toEqual(["Charged Strike: Stunned"]);
  });

  it("builds the Pneuma misfire from the text's save, not DDB's modifier label", () => {
    const veryRare = named(ItemEnrichers.PneumaBlade, "Pneuma Greatsword (Very Rare)");
    expect(names(veryRare)).toEqual(["Pneumatic Strike", "Burnout"]);
    expect(veryRare.additionalActivities[1].build.saveOverride).toMatchObject({ ability: ["dex"], dc: { formula: "16" } });
    expect(veryRare.additionalActivities[0].overrides.data.attack.bonus).toBe("5");
    const rare = named(ItemEnrichers.PneumaBlade, "Pneuma Longsword (Rare)");
    expect(rare.additionalActivities[1].build.saveOverride).toMatchObject({ ability: ["con"], dc: { formula: "15" } });
    expect(rare.stopDefaultActivity).toBe(false);
    expect(named(ItemEnrichers.PneumaBlade, "Pneuma Blade").stopDefaultActivity).toBe(true);
  });

  it("gives every Unstable Crumbler copy the Transform and both forms' properties", () => {
    // a trick weapon (item/_TrickWeapon.ts): every DDB copy imports as the one Cannon/Maul weapon
    for (const name of ["Unstable Crumbler (Cannon)", "Unstable Crumbler (Maul)", "Unstable Crumbler"]) {
      expect(names(named(ItemEnrichers.UnstableCrumbler, name))).toEqual(["Transform", "Overheated Cannonball", "Detonation"]);
    }
    const fire = named(ItemEnrichers.UnstableCrumbler, "Unstable Crumbler").effects
      .find((effect: any) => effect.name === "Unstable Crumbler: Fire Reduction");
    expect(fire.changes[0]).toMatchObject({ key: "system.traits.dm.amount.fire", value: "-max(@abilities.con.mod, 1)" });
  });

  it("spends Scorching Cleaver charges by consumption scaling", () => {
    const [slash] = named(ItemEnrichers.ScorchingCleaver, "Scorching Cleaver").additionalActivities;
    expect(slash.build.saveOverride.dc.formula).toBe("10 + @prof + @scaling");
    expect(slash.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "3", addScalingMode: "amount", addConsumptionScalingMax: "@item.uses.value - 2" });
  });
});

describe("GrassWhistleBlade", () => {
  const e = build(ItemEnrichers.GrassWhistleBlade, { name: "Grass Whistle Blade" });

  it("rolls the psychic damage apart from the saves, since it lands on a success", () => {
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Lullaby", "Lullaby: Second Save", "Lullaby: Psychic Damage"]);
    expect(e.additionalActivities[0].overrides.addItemConsume).toBe(true);
    expect(e.additionalActivities[1].build.generateDamage).toBe(false);
    expect(e.effects.map((effect: any) => [effect.activityMatch, effect.statuses])).toEqual([
      ["Lullaby", ["Incapacitated"]],
      ["Lullaby: Second Save", ["Unconscious"]],
    ]);
  });
});

describe("Requiem", () => {
  const Enricher = ItemEnrichers.Requiem;

  it("keys the addiction DC and the question pool on the drug", () => {
    const bliss = build(Enricher, { name: "Requiem Bliss" });
    // @scaling is the question count (increase + 1), so it carries the "+ 1 per question" itself
    expect(bliss.activity.data.save.dc.formula).toBe("12 + @scaling");
    expect(bliss.activity.data.uses.max).toBe("10");
    // dnd5e's scaling max is the highest scaling value offered, which is questions asked
    expect(bliss.activity.addConsumptionScalingMax).toBe("10");
    expect(bliss.additionalActivities[0].build.saveOverride.dc.formula).toBe("15");

    const clay = build(Enricher, { name: "Requiem Clay" });
    expect(clay.activity.data.save.dc.formula).toBe("10 + @scaling");
    expect(clay.activity.data.uses.max).toBe("5");
    expect(clay.activity.addConsumptionScalingMax).toBe("5");
    expect(clay.additionalActivities[0].build.saveOverride.dc.formula).toBe("13");
  });

  it("rolls the poison per question regardless of the save", () => {
    const smoke = build(Enricher, { name: "Requiem Bliss" }).activity;
    expect(smoke.removeDamageParts).toBe(true);
    expect(smoke.damageParts[0]).toMatchObject({ number: 1, denomination: 6, types: ["poison"], scaling: { mode: "whole", number: 1 } });
    expect(smoke.data.damage.onSave).toBe("full");
    expect(smoke.addActivityScalingMode).toBe("amount");
  });
});

// =============================================================================
// Weapon property enrichers built from the 2026-09-28 rider review. Text here is synthetic.
// =============================================================================
describe("weapon property enrichers", () => {
  const record = (Enricher: TEnricher, name: string, description = "", extra: Record<string, any> = {}) => build(Enricher, {
    name,
    ddbParser: { originalName: name, parsingType: "weapon", ddbDefinition: { description, properties: [] }, data: { system: { uses: {} } }, ...extra },
  });
  const names = (e: any) => e.additionalActivities.map((a: any) => a.init.name);

  it("reads Retributive Strike's DC and multipliers from either printing", () => {
    const banded: any = retributiveStrike("Retributive Strike. Break it. You take force damage equal to 16 x the number of charges. Every other creature must make a DC 17 Dexterity saving throw. On a failed save, 8 x the number of charges within 10 ft, 6 x the number of charges farther, 4 x the number of charges at the edge.");
    expect(banded.build.saveOverride.dc.formula).toBe("17");
    expect(banded.build.damageParts[0].custom.formula).toBe("8 * @item.uses.value");
    expect(banded.build.activationOverride.condition).toContain("6x at 11-20 ft");
    const flat: any = retributiveStrike("Retributive Strike. You take Force damage equal to 16 times the number of charges. Each other creature makes a DC 18 Dexterity saving throw. On a failed save, a creature takes Force damage equal to 4 times the number of charges.");
    expect(flat.build.saveOverride.dc.formula).toBe("18");
    expect(flat.build.damageParts[0].custom.formula).toBe("4 * @item.uses.value");
  });

  it("scales Will of the Talon and Lash of Shadows by stage", () => {
    const dormant = record(ItemEnrichers.WillOfTheTalon, "Will of the Talon (Dormant)");
    const exalted = record(ItemEnrichers.WillOfTheTalon, "Will of the Talon");
    expect(dormant.additionalActivities[1].build.saveOverride.dc.formula).toBe("13");
    expect(dormant.additionalActivities[1].build.damageParts[0].number).toBe(3);
    expect(exalted.additionalActivities[1].build.damageParts[0].number).toBe(5);
    expect(dormant.effects.map((e: any) => e.name)).toEqual(["Frightful Presence"]);
    expect(exalted.effects.map((e: any) => e.name)).toContain("Will of the Talon: Resistances");
    expect(names(record(ItemEnrichers.LashOfShadows, "Lash of Shadows (Dormant)"))).toEqual(["Serpent Venom", "Dead Eyes"]);
    expect(names(record(ItemEnrichers.LashOfShadows, "Lash of Shadows (Exalted)"))).toContain("Cockatrice Tears: Second Save");
  });

  it("builds Dragon's Wrath Weapon by tier with a choice of breath types", () => {
    expect(names(record(ItemEnrichers.DragonsWrathWeapon, "Dragon's Wrath Weapon (Stirring)"))).toEqual(["Wrathful Burst"]);
    const ascendant = record(ItemEnrichers.DragonsWrathWeapon, "Dragon's Wrath Weapon (Ascendant)");
    const cone = ascendant.additionalActivities[1];
    expect(cone.build.saveOverride.dc.formula).toBe("18");
    expect(cone.build.damageParts[0].number).toBe(12);
    expect(cone.build.damageParts[0].types).toContain("radiant");
    expect(ascendant.activity.data.damage.parts[0].number).toBe(3);
    // the unsuffixed record carries the Ascendant text and modifiers
    const unsuffixed = record(ItemEnrichers.DragonsWrathWeapon, "Dragon's Wrath Weapon");
    expect(unsuffixed.tier).toBe(3);
    expect(names(unsuffixed)).toEqual(["Wrathful Burst", "Cone of Destructive Energy"]);
    expect(unsuffixed.additionalActivities[1].overrides.data.uses.max).toBe("1");
    expect(unsuffixed.override.uses.max).toBe("");
  });

  describe("Fizban's hoard items and the Stormgirdle by stage", () => {
    const wondrous = (Enricher: TEnricher, name: string) => record(Enricher, name, "", {
      parsingType: "wonderous",
      raw: { itemSpells: [] },
    });
    const uses = (activity: any) => activity.overrides.data?.uses?.max;

    it("reads the unsuffixed record as the top stage", () => {
      expect(wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Slumbering)").stage).toBe(0);
      expect(wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Wakened)").stage).toBe(2);
      expect(wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel").stage).toBe(3);
      expect(wondrous(ItemEnrichers.Stormgirdle, "Stormgirdle").stage).toBe(2);
    });

    it("fills a Dragon Vessel once per dawn from the stage's growing list", () => {
      const slumbering = wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Slumbering)").additionalActivities[0];
      expect(slumbering.build.activationOverride.type).toBe("bonus");
      expect(slumbering.build.activationOverride.condition).toContain("a potion of climbing");
      expect(slumbering.build.activationOverride.condition).not.toContain("mead");
      expect(uses(slumbering)).toBe("1");
      const ascendant = wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Ascendant)").additionalActivities[0];
      expect(ascendant.build.activationOverride.condition).toContain("a potion of dragon's majesty");
    });

    it("adds the Dragon-Touched Focus family options, casts and Ascendant casting by stage", () => {
      expect(names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus (Slumbering)"))).toEqual([]);
      expect(names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus (Stirring)")))
        .toEqual(["Chromatic: Draconic Damage", "Gem: Teleport", "Metallic: Advantage on a Save"]);
      const wakened = names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus (Wakened)"));
      expect(wakened).toContain("Hold Monster (Chromatic)");
      expect(wakened).toContain("Legend Lore (Metallic)");
      expect(wakened).not.toContain("Ascendant Casting");
      expect(names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus"))).toContain("Ascendant Casting");
    });

    it("gives the Scaled Ornament its breath reaction from Wakened and hover from Ascendant", () => {
      expect(names(wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Stirring)"))).toEqual([]);
      expect(wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Stirring)").effects).toEqual([]);
      const wakened = wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Wakened)");
      expect(names(wakened)).toEqual(["Absorb Breath"]);
      expect(uses(wakened.additionalActivities[0])).toBe("1");
      // the parser's stage effect (AC, immunities, fly speed) stays; the enricher only adds the hover
      const ascendant = wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Ascendant)");
      expect(ascendant.clearAutoEffects).toBe(false);
      expect(ascendant.effects[0].changes.map((c: any) => c.key)).toEqual(["system.attributes.movement.hover"]);
    });

    it("gives the Stormgirdle resistance worn and immunity only as a Storm Avatar", () => {
      const dormant = wondrous(ItemEnrichers.Stormgirdle, "Stormgirdle (Dormant)");
      const [worn, avatar, profile] = dormant.effects;
      expect(worn.changes.map((c: any) => c.key)).toEqual(["system.traits.dr.value", "system.traits.dr.value", "system.abilities.str.value"]);
      expect(worn.changes[2].value).toBe("21");
      // the avatar is a self-enchantment: its effect and Lightning Strike only exist while it lasts
      expect(avatar.options.transfer).toBe(true);
      expect(avatar.changes.map((c: any) => c.key)).toEqual(["system.traits.di.value", "system.traits.di.value"]);
      expect(profile).toMatchObject({ type: "enchant", activityMatch: "Storm Avatar" });
      expect(profile.data.flags.ddbimporter).toEqual({
        activityRiders: [dormant.additionalActivities[1].init.id],
        effectRiders: [avatar.data._id],
      });
      expect(dormant.additionalActivities[0].init.type).toBe("enchant");
      expect(names(dormant)).toEqual(["Storm Avatar", "Lightning Strike"]);
      expect(dormant.additionalActivities[1].build.damageParts[0].number).toBe(3);
      const exalted = wondrous(ItemEnrichers.Stormgirdle, "Stormgirdle (Exalted)");
      expect(exalted.effects[0].changes[2].value).toBe("25");
      expect(exalted.effects[1].changes.map((c: any) => c.key)).toContain("system.attributes.movement.hover");
      expect(exalted.additionalActivities[1].build.damageParts[0].number).toBe(5);
      expect(names(exalted)).toContain("Control Weather");
    });
  });

  describe("fabled items by level", () => {
    const fabled = (Enricher: TEnricher, name: string, parsingType = "weapon") => record(Enricher, name, "", {
      parsingType,
      raw: { itemSpells: [] },
      ddbItem: { chargesUsed: 0 },
    });

    it("reads Lv., ordinal and Base suffixes, the unsuffixed record as level 20", async () => {
      const { fabledLevel } = await import("../../../src/parser/enrichers/item/_FabledItem");
      expect(fabledLevel("Storrbani (Lv. 13)")).toBe(13);
      expect(fabledLevel("Shadow Grimoire (9th Level)")).toBe(9);
      expect(fabledLevel("Shadow Grimoire (Base)")).toBe(1);
      expect(fabledLevel("The Grave Blade")).toBe(20);
    });

    it("builds The Grave Blade's properties by level and +3 on the unsuffixed record", () => {
      expect(names(fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade (Lv. 1)"))).toEqual([]);
      expect(fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade (Lv. 5)").activity.data.damage.parts).toEqual([]);
      const nine = fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade (Lv. 9)");
      expect(nine.activity.data.damage.parts[0].types).toEqual(["necrotic"]);
      expect(nine.effects).toEqual([]);
      expect(nine.override).toEqual({});
      const top = fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade");
      expect(names(top)).toEqual(["Refuse to Fall", "Grave Song", "Compel Death"]);
      expect(top.effects[0].activityMatch).toBe("Grave Song");
      expect(top.override.data.system.magicalBonus).toBe(3);
    });

    it("gives Storrbani one fire die and the runes by level, immunity only from Ansuz", () => {
      const five = fabled(ItemEnrichers.Storrbani, "Storrbani (Lv. 5)");
      expect(five.activity.data.damage.parts.map((p: any) => `${p.number}d${p.denomination}`)).toEqual(["1d4"]);
      expect(names(five)).toEqual(["Shield of Faith"]);
      expect(five.additionalActivities[0].build.spellOverride.properties).toContain("concentration");
      const top = fabled(ItemEnrichers.Storrbani, "Storrbani");
      expect(top.activity.data.damage.parts.map((p: any) => `${p.number}d${p.denomination}`)).toEqual(["2d6"]);
      expect(names(top)).toEqual(["Shield of Faith", "Tiwaz Rune", "Thurisaz Rune", "Extra Crit Damage vs Giants", "Ansuz Rune"]);
      expect(top.effects[0].changes[0]).toMatchObject({ key: "system.traits.di.value", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "ALL" });
      expect(fabled(ItemEnrichers.Storrbani, "Storrbani (Lv. 13)").effects).toEqual([]);
    });

    it("gives the Skinchanger Arm Ring its wings, endurance and charges by level", () => {
      const one = fabled(ItemEnrichers.SkinchangerArmRing, "Skinchanger Arm Ring (Lv. 1)", "wonderous");
      expect(names(one)).toEqual([]);
      expect(one.effects).toEqual([]);
      expect(one.override.uses.max).toBe("");
      const thirteen = fabled(ItemEnrichers.SkinchangerArmRing, "Skinchanger Arm Ring (Lv. 13)", "wonderous");
      expect(names(thirteen)).toEqual(["Raven Wings", "Bear's Endurance"]);
      expect(thirteen.effects.map((e: any) => e.activityMatch)).toEqual(["Raven Wings", "Bear's Endurance"]);
      const top = fabled(ItemEnrichers.SkinchangerArmRing, "Skinchanger Arm Ring (Lv. 17)", "wonderous");
      expect(names(top)).toContain("Polymorph");
      expect(top.override.uses.max).toBe("3");
    });

    it("scales the Shadow Grimoire's glyph and adds its owner's properties by level", () => {
      const base = fabled(ItemEnrichers.ShadowGrimoire, "Shadow Grimoire (Base)", "wonderous");
      expect(names(base)).toEqual(["Glyph of Warding"]);
      expect(base.additionalActivities[0].build.saveOverride.dc.formula).toBe("13");
      const nine = fabled(ItemEnrichers.ShadowGrimoire, "Shadow Grimoire (9th Level)", "wonderous");
      expect(nine.additionalActivities[0].build.damageParts[0].number).toBe(6);
      const top = fabled(ItemEnrichers.ShadowGrimoire, "Shadow Grimoire", "wonderous");
      expect(names(top)).toEqual(["Glyph of Warding", "Scroll Page", "Shadow Step", "Journey to the Shadow Realm"]);
      expect(top.additionalActivities[0].build.saveOverride.dc.formula).toBe("15");
      expect(top.additionalActivities.every((a: any) => a.build.durationOverride.units === "inst")).toBe(true);
    });
  });

  it("builds only the songs a Headbanger Lute record describes", () => {
    const both = "Panic! at the Tavern. Each creature must make a DC 14 Wisdom saving throw, taking 4d6 psychic damage. Mithrallica. Each creature in a 20-foot cone must make a DC 14 Strength saving throw, taking 4d6 thunder damage.";
    const lute = record(ItemEnrichers.HeadbangerLute, "Headbanger Lute (Rare Club)", both);
    expect(names(lute)).toEqual(["Corrosive Strike", "Panic! at the Tavern", "Mithrallica"]);
    expect(lute.additionalActivities[2].build.targetOverride.template.size).toBe("20");
    expect(names(record(ItemEnrichers.HeadbangerLute, "Headbanger Lute (Uncommon Club)", "A lute that deals an additional 1d8 acid damage."))).toEqual(["Corrosive Strike"]);
  });

  it("gives Gunnspier Backfire or Chomp by rarity and keeps Sword of Kas's save on its wielder", () => {
    expect(names(record(ItemEnrichers.Gunnspier, "Gunnspier (Rare Pike)"))).toEqual(["Point Blank Shot", "Backfire"]);
    expect(names(record(ItemEnrichers.Gunnspier, "Gunnspier (Very Rare Pike)"))).toEqual(["Point Blank Shot", "Chomp"]);
    const kas = record(ItemEnrichers.SwordOfKas, "Sword of Kas");
    expect(kas.additionalActivities[1].build.targetOverride.affects.type).toBe("self");
  });

  it("puts charges the text states onto items DDB leaves without uses", () => {
    const teeth = record(ItemEnrichers.TrappersTeeth, "Trapper's Teeth", "The teeth have 4 charges and regain all expended charges at dawn.", { ddbItem: { chargesUsed: 0 } });
    expect(teeth.override.uses).toMatchObject({ max: "4", recovery: [{ period: "dawn", type: "recoverAll" }] });
  });

  it("drops only the auto status effect, keeping the effects DDB's modifiers grant the wielder", () => {
    const staff = record(ItemEnrichers.StaffOfPower, "Staff of Power");
    expect(staff.clearAutoEffects).toBe(false);
    expect(staff.clearAutoStatusEffect).toBe(true);
    expect(staff.addAutoAdditionalActivities).toBe(false);
    // the beams' fixed +7 spell attack bonus would import as a bonus to all ranged spell attacks
    const bident = record(ItemEnrichers.EldritchBident, "Eldritch Bident");
    expect(bident.clearAutoEffects).toBe(true);
    // and DDB's 1d8 force is the beams' damage, which must not land on the bident's own hits
    expect(bident.activity.data.damage.parts).toEqual([]);
    const beams = bident.additionalActivities.find((a: any) => a.init.name === "Eldritch Beams");
    expect(beams.overrides).toMatchObject({ flatAttack: "7", data: { attack: { type: { value: "ranged", classification: "spell" } } } });
    expect(beams.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, types: ["force"] });
    expect(beams.build.targetOverride.affects.count).toBe("2");
    const warlockBeams = bident.additionalActivities.find((a: any) => a.init.name === "Eldritch Beams (Warlock)");
    expect(warlockBeams.overrides.flatAttack).toBeUndefined();
    expect(warlockBeams.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 12, bonus: "@abilities.cha.mod" });
    // DDB grants these immunities permanently; the enrichers rebuild them as resistance or a rune
    expect(record(ItemEnrichers.Stormgirdle, "Stormgirdle (Dormant)").clearAutoEffects).toBe(true);
    expect(record(ItemEnrichers.Storrbani, "Storrbani (Lv. 17)").clearAutoEffects).toBe(true);
  });

  it("leaves Will of the Talon's resistances to DDB's modifiers where the record carries them", () => {
    const resistances = ["fire", "acid", "cold", "lightning", "poison"].map((subType) => ({ type: "resistance", subType }));
    const awakened = record(ItemEnrichers.WillOfTheTalon, "Will of the Talon (Awakened)", "", {
      ddbDefinition: { description: "", properties: [], grantedModifiers: resistances },
    });
    expect(awakened.effects.map((e: any) => e.name)).toEqual(["Frightful Presence"]);
  });

  it("rebuilds the on-hit damage DDB carries only as Restriction attacks", () => {
    const fife = record(ItemEnrichers.FifeOfDragonsong, "Fife of Dragonsong");
    expect(fife.activity.data.damage).toMatchObject({ includeBase: true, parts: [{ number: 1, denomination: 6, types: ["thunder"] }] });
    // the one cone pushes enemies and bolsters allies
    const [song, allies] = fife.additionalActivities;
    expect(song.overrides.data.target.affects.type).toBe("enemy");
    expect(song.overrides.additionalConsumptionTargets).toEqual([
      { type: "itemUses", target: "feat:bardic-inspiration", value: "1", scaling: { mode: "", formula: "" } },
    ]);
    expect(allies.overrides.data.target.affects.type).toBe("ally");
    expect(fife.effects[0]).toMatchObject({ activityMatch: "Dragonsong: Allies", options: { expiry: "turnEnd" } });
    // Hazirawn's attuned die is its own activity, so the unattuned 1d6 is set on the attack
    const hazirawn = record(ItemEnrichers.Hazirawn, "Hazirawn");
    expect(hazirawn.activity.data.damage.parts).toMatchObject([{ number: 1, denomination: 6, types: ["necrotic"] }]);
    const abbot = record(ItemEnrichers.SwordOfTheCrimsonAbbot, "Sword of the Crimson Abbot, +1");
    expect(abbot.activity.data.damage).toMatchObject({ includeBase: true, parts: [{ number: 1, denomination: 6, types: ["necrotic"] }] });

    const flooze = (name: string, description: string, dice: number, restriction: string) => record(ItemEnrichers.Flooze, name, description, {
      ddbDefinition: {
        description,
        properties: [],
        grantedModifiers: [{ type: "damage", subType: "acid", restriction, dice: { diceCount: 1, diceValue: dice } }],
      },
    });
    const uncommon = flooze("Flooze (Uncommon)", "This magic flail deals an extra 1d6 acid damage to the first target it hits on each of your turns.", 6, "1st target hit on your turn");
    expect(uncommon.activity.data).toBeUndefined();
    expect(names(uncommon)).toEqual(["Acid Damage", "Reachier"]);
    expect(uncommon.additionalActivities[0].build.damageParts[0]).toMatchObject({ number: 1, denomination: 6, types: ["acid"] });
    const veryRare = flooze("Flooze (Very Rare)", "This magic flail deals an extra 1d8 acid damage to any target it hits.", 8, "");
    expect(names(veryRare)).toEqual(["Reachier"]);
    expect(veryRare.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, types: ["acid"] });

    const sword = record(ItemEnrichers.Spellsword, "Spellsword", "", { data: { system: { uses: {}, magicalBonus: 1 } } });
    const [low, high] = sword.additionalActivities;
    expect([low.init.name, high.init.name]).toEqual(["Activated: 3rd-4th Level Slot", "Activated: 5th+ Level Slot"]);
    expect(low.overrides.data.attack.bonus).toBe("");
    expect(low.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, bonus: "@mod + 1", types: ["force"] });
    expect(high.overrides.data.attack.bonus).toBe("1");
    expect(high.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 10, bonus: "@mod + 2", types: ["force"] });
  });

  describe("conditional extra weapon damage", () => {
    // a record whose DDB damage modifiers are these (type, dice, restriction) triples
    const armed = (Enricher: TEnricher, name: string, mods: [string, number, number, string][]) => record(Enricher, name, "", {
      ddbDefinition: {
        description: "",
        properties: [],
        grantedModifiers: mods.map(([subType, diceCount, diceValue, restriction]) => ({ type: "damage", subType, restriction, dice: { diceCount, diceValue } })),
      },
    });
    const extra = (e: any, name: string) => e.additionalActivities.find((a: any) => a.init.name === name);

    // dnd5e 5.x has no rule conditions, so each die is its own damage activity
    it("moves each condition-bound die off the attack into its own damage activity", () => {
      const cases: [TEnricher, string, [string, number, number, string][], string, any][] = [
        [ItemEnrichers.FuriousFlail, "Furious Flail", [["fire", 1, 8, ""]], "Raging Fire", { number: 1, denomination: 8, types: ["fire"] }],
        [ItemEnrichers.Whelm, "Whelm", [["force", 1, 8, ""], ["force", 4, 8, "if the target is a Construct"]], "Ranged Strike", { number: 1, denomination: 8, types: ["force"] }],
        [ItemEnrichers.MindLash, "Mind Lash", [["psychic", 2, 4, ""]], "Illithid Wielder", { number: 2, denomination: 4, types: ["psychic"] }],
        [ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 9)", [["lightning", 1, 6, ""]], "Wreathed in Lightning", { number: 1, denomination: 6, types: ["lightning"] }],
      ];
      for (const [Enricher, name, mods, activity, part] of cases) {
        const e = armed(Enricher, name, mods);
        expect(e.activity.data.damage.parts).toEqual([]);
        expect(extra(e, activity).build.damageParts).toMatchObject([part]);
      }
    });

    it("makes the Warhammer's smolder a damage activity riding the Smoldering enchantment", () => {
      const hammer = record(ItemEnrichers.WarhammerOfEruptions, "Warhammer of Eruptions");
      expect(hammer.activity.data.damage.parts).toEqual([]);
      expect(names(hammer)).toEqual(["Smoldering", "Smoldering Fire", "Eruption"]);
      const fire = extra(hammer, "Smoldering Fire");
      expect(hammer.effects[0].data.flags.ddbimporter.activityRiders).toEqual([fire.init.id]);
    });
  });

  describe("conditional weapon dice off the attack", () => {
    const parts = (e: any) => e.activity.data.damage.parts;
    const extra = (e: any, name: string) => e.additionalActivities.find((x: any) => x.init.name === name);

    it("fixes the Thunderous Greatclub's limits, Prone and Strength, and Sword of Kas's critical range", () => {
      const club = record(ItemEnrichers.ThunderousGreatclub, "Thunderous Greatclub");
      expect(club.clearAutoStatusEffect).toBe(true);
      expect(names(club)).toEqual(["Clap of Thunder", "Earthquake", "Earthquake: Concentration Save", "Earthquake: Fissure"]);
      expect(club.additionalActivities.map((a: any) => a.overrides.addItemConsume ?? false)).toEqual([false, true, false, false]);
      expect(club.effects).toEqual([expect.objectContaining({ activitiesMatch: ["Clap of Thunder", "Earthquake"], statuses: ["Prone"] })]);
      expect(record(ItemEnrichers.SwordOfKas, "Sword of Kas").activity.data.attack.critical.threshold).toBe(19);
    });

    it("moves charge, mote and choice dice into their own activities", () => {
      for (const [Enricher, name, activity] of [
        [ItemEnrichers.EldritchStaff, "Eldritch Staff", "Eldritch Attack"],
        [ItemEnrichers.Shaedenstaff, "Shaedenstaff", "Annihilating Strike"],
        [ItemEnrichers.CrosierOfDivinePower, "Crosier of Divine Power", "Radiant Mote: Damage"],
        [ItemEnrichers.StaffOfTheReverentWarrior, "Staff of the Reverent Warrior", "True Strike: Radiant"],
        [ItemEnrichers.BladeOfForlornHope, "Blade of Forlorn Hope", "Burning Corona: Radiant"],
        [ItemEnrichers.MagentanSunSaw, "Magentan Sun-Saw (Uncommon)", "Sun-Saw Trigger"],
      ] as [TEnricher, string, string][]) {
        const weapon = record(Enricher, name);
        expect(parts(weapon)).toEqual([]);
        expect(names(weapon)).toContain(activity);
      }
      expect(extra(record(ItemEnrichers.EldritchStaff, "Eldritch Staff"), "Eldritch Attack").overrides).toMatchObject({ addItemConsume: true, addConsumptionScalingMax: "min(3, @item.uses.value)" });
      expect(extra(record(ItemEnrichers.EldritchStaff, "Eldritch Staff"), "Eldritch Escape").init.type).toBe("utility");
      expect(extra(record(ItemEnrichers.MagentanSunSaw, "Magentan Sun-Saw (Very Rare)"), "Sun-Saw Trigger").build.damageParts[0]).toMatchObject({ number: 2, denomination: 6 });
      const striking = record(ItemEnrichers.StaffOfStriking, "Staff of Striking");
      expect(parts(striking)).toEqual([]);
      expect(striking.additionalActivities[0].build.includeBaseDamage).toBe(false);
    });

    it("lights the Mace of the Black Crown and Witchlight Scimitar through a self enchantment with a light rider", () => {
      const mace = record(ItemEnrichers.MaceOfTheBlackCrown, "Mace of the Black Crown (Awakened)", "", {
        ddbDefinition: { description: "", properties: [], grantedModifiers: [{ type: "damage", subType: "fire", restriction: "", dice: { diceCount: 2, diceValue: 6 } }] },
      });
      expect(parts(mace)).toEqual([]);
      const [ablaze, light] = mace.effects;
      expect(ablaze).toMatchObject({ type: "enchant", activityMatch: "Ignite" });
      // dnd5e 5.x has no rule conditions: the fire is a damage activity riding the enchantment
      expect(ablaze.changes.map((c: any) => c.value)).toEqual(["Extinguish"]);
      expect(ablaze.data.flags.ddbimporter.effectRiders).toEqual([light.data._id]);
      expect(ablaze.data.flags.ddbimporter.activityRiders).toEqual([extra(mace, "Black Crown Flames").init.id]);
      expect(extra(mace, "Black Crown Flames").build.damageParts[0]).toMatchObject({ number: 2, denomination: 6, types: ["fire"] });
      expect(light.options.transfer).toBe(true);
      // Foundry 13 lights the token through ATL
      expect(light.atlChanges.slice(0, 2).map((c: any) => String(c.value))).toEqual(["40", "80"]);
      // the unsuffixed record carries the exalted 3d6
      expect(extra(record(ItemEnrichers.MaceOfTheBlackCrown, "Mace of the Black Crown"), "Black Crown Flames").build.damageParts[0]).toMatchObject({ number: 3, denomination: 6 });
      const scimitar = record(ItemEnrichers.WitchlightScimitar, "Witchlight Scimitar");
      expect(scimitar.effects[0].changes.map((c: any) => c.value)).toEqual(["Douse Witchlight"]);
      expect(extra(scimitar, "Golden Radiance").build.damageParts[0]).toMatchObject({ number: 2, denomination: 6, types: ["radiant"] });
    });

    it("splits crits against some creatures into their own activities instead of Restriction attacks", () => {
      const dagger = record(ItemEnrichers.PurgingDagger, "Purging Dagger");
      expect(names(dagger)).toEqual(["Extra Damage vs Undead", "Crit vs Undead", "Lodged Blade", "Remove Lodged Dagger"]);
      expect(extra(dagger, "Lodged Blade").build.damageParts[0]).toMatchObject({ number: 3, denomination: 4, types: ["radiant"] });
      expect(dagger.effects[0]).toMatchObject({ activityMatch: "Crit vs Undead", options: { expiry: null } });
      const scythe = record(ItemEnrichers.SoulSearingScythe, "Soul-Searing Scythe");
      expect(parts(scythe)).toEqual([]);
      expect(names(scythe)).toEqual(["Ignite", "Soul-Rending Flames", "Crit vs Living Creatures"]);
      expect(extra(scythe, "Crit vs Living Creatures").build.saveOverride).toMatchObject({ ability: ["con"], dc: { formula: "17" } });
      expect(scythe.effects[0].changes.map((c: any) => c.value)).toEqual(["Extinguish"]);
      expect(scythe.effects[0].data.flags.ddbimporter.activityRiders).toEqual([extra(scythe, "Soul-Rending Flames").init.id]);
      expect(scythe.effects.find((e: any) => e.activityMatch === "Crit vs Living Creatures")).toMatchObject({ statuses: ["Stunned"] });
      const sword = record(ItemEnrichers.KinestheticProjection, "Kinesthetic Projection");
      expect(parts(sword)[0]).toMatchObject({ number: 1, denomination: 6, types: ["psychic"] });
      expect(names(sword)).toEqual(["Curse: Violent Nightmares", "Visceral Reach", "Visceral Pull"]);
      expect(extra(sword, "Curse: Violent Nightmares").build.targetOverride.affects.type).toBe("self");
      expect(extra(sword, "Visceral Reach").overrides.additionalConsumptionTargets[0]).toMatchObject({ type: "hitDice", value: "2" });
      expect(sword.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
        ["system.range.reach", "15"],
        ["activities[enchant].name", "End Visceral Reach"],
        ["activities[enchant].consumption.targets", "[]"],
      ]);
    });

    it("empowers the Bloodthirster by profile and gives the Dream Shepherd its sheep save", () => {
      const sword = record(ItemEnrichers.BloodthirsterScimitar, "Bloodthirster Scimitar");
      expect(parts(sword)).toEqual([]);
      const profiles = sword.effects.filter((e: any) => e.type === "enchant");
      expect(profiles.map((e: any) => e.name)).toEqual(["Bloodthirster: Empowered +1", "Bloodthirster: Empowered +2", "Bloodthirster: Empowered +3"]);
      // dnd5e 5.x has no rule conditions: the step is the magical bonus, the necrotic a riding activity
      expect(profiles[2].changes.map((c: any) => [c.key, c.value])).toEqual([["system.magicalBonus", "3"], ["activities[enchant].name", "Change or End Empowerment"]]);
      expect(profiles[2].data.flags.ddbimporter.activityRiders).toEqual([extra(sword, "Empowered Necrotic").init.id]);
      const shepherd = record(ItemEnrichers.StaffOfTheDreamShepherd, "Staff of the Dream Shepherd");
      expect(parts(shepherd)).toEqual([]);
      const sheep = extra(shepherd, "Spectral Sheep");
      expect(sheep.build.saveOverride).toMatchObject({ ability: ["wis"], dc: { calculation: "spellcasting" } });
      expect(sheep.build.targetOverride.template).toMatchObject({ type: "line", size: "20", width: "10" });
      expect(shepherd.effects[0]).toMatchObject({ statuses: ["Unconscious"], options: { durationSeconds: 60 } });
      expect(names(record(ItemEnrichers.LightningKhopesh, "Lightning Khopesh"))).toEqual(["Stray Sparks"]);
      expect(record(ItemEnrichers.WitchlightVane, "Witchlight Vane").activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, types: ["radiant"] });
    });
  });

  it("stops the stray primary on a parent record that does not parse as a weapon", () => {
    expect(record(ItemEnrichers.Moonblade, "Moonblade", "", { parsingType: "wondrous" }).stopDefaultActivity).toBe(true);
    expect(record(ItemEnrichers.Moonblade, "Moonblade Longsword").stopDefaultActivity).toBe(false);
  });
});

// magic-bonus wave: wondrous items, potions and rings whose DDB "magic" bonus the parser has
// nowhere to put, so each enricher has to carry it (an item without enricher effects logs an error)
describe("magic bonus items", () => {
  const rules = (effect: any) => effect.changes.map((c: any) => [c.key, c.value]);

  it("Hero's Blade enchants a weapon with +3 for a minute", () => {
    const e = build(ItemEnrichers.HerosBlade);
    expect(e.type).toBe("enchant");
    expect(e.activity.data.duration).toEqual({ value: "1", units: "minute" });
    expect(e.effects[0]).toMatchObject({ type: "enchant", magicalBonus: { bonus: "3" } });
  });

  it("Poundwise Porter's Drink applies a non-transfer +3 unarmed effect for a minute", () => {
    const e = build(ItemEnrichers.PoundwisePorter);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Drink", targetType: "self", addItemConsume: true });
    // only AC5e can scope the bonus to Unarmed Strikes; a melee weapon fallback would reach every weapon
    expect(e.effects).toHaveLength(1);
    const [ac5e] = e.effects;
    expect(ac5e).toMatchObject({ activityMatch: "Drink", ac5eOnly: true, options: { transfer: false, durationSeconds: 60 } });
    expect(ac5e.ac5eChanges).toHaveLength(2);
  });

  it("Battlechef's Splendid Saucepan is the SRD mace with thunder damage and a helmet AC toggle", () => {
    const e = build(ItemEnrichers.BattlechefsSplendidSaucepan);
    expect(e.documentStub).toMatchObject({ documentType: "weapon", systemType: { baseItem: "mace" } });
    expect(e.addAutoAdditionalActivities).toBe(false);
    expect(e.additionalActivities[0].build.damageParts[0]).toMatchObject({ number: 1, denomination: 4, types: ["thunder"] });
    expect(e.effects[0]).toMatchObject({ name: "Worn as a Helmet", options: { transfer: true, disabled: true } });
    expect(rules(e.effects[0])).toEqual([["system.attributes.ac.bonus", "1"]]);
  });

  it("Crimson Fulcrum Lens and Ring of Eldritch Ire carry their bonus as item effects", () => {
    expect(build(ItemEnrichers.CrimsonFulcrumLens).effects[0].options).toMatchObject({ transfer: true });
    const ring = build(ItemEnrichers.RingOfEldritchIre).effects[0];
    expect(ring.options).toMatchObject({ transfer: true, disabled: true });
    expect(ring.changes).toHaveLength(8);
  });

  it("The Thorn of Kren keeps the parsed saves beside its Bite", () => {
    const e = build(ItemEnrichers.TheThornOfKren);
    expect(e.keepParsedActivities).toBe(true);
    expect(e.additionalActivities[0].init).toEqual({ name: "Bite", type: "attack" });
    const attack = e.additionalActivities[0].overrides.data.attack;
    expect(attack.type).toEqual({ value: "melee", classification: "unarmed" });
    // not flat, so actor attack bonuses apply; the natural weapon +2 rides on the Bite itself
    expect(attack.flat).toBeUndefined();
    expect(attack).toMatchObject({ ability: "none", bonus: "max(@abilities.str.mod, @abilities.dex.mod) + 2" });
    expect(e.override.data["system.proficient"]).toBe(1);
    // the unarmed/natural bonus is AC5e only, scoped away from this item
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0]).toMatchObject({ ac5eOnly: true, options: { transfer: true } });
  });

  it("Galvanized Claw transforms the Unarmed Strike into a +1 1d8 slashing finesse claw", () => {
    const e = build(ItemEnrichers.GalvanizedClaw);
    const [transform] = e.additionalActivities;
    expect(transform.init.type).toBe("enchant");
    expect(transform.overrides.data.restrictions).toMatchObject({ type: "weapon", categories: ["natural"] });
    const [enchant] = e.effects;
    expect(enchant).toMatchObject({ type: "enchant", activityMatch: transform.init.name, magicalBonus: { bonus: "1" } });
    expect(rules(enchant)).toEqual(expect.arrayContaining([
      ["system.damage.base.denomination", "8"],
      ["system.damage.base.types", "slashing"],
      ["system.properties", "fin"],
    ]));
    // the extra lightning is a damage activity the enchantment adds to the Unarmed Strike
    const lightning = e.additionalActivities.find((a: any) => a.init.name === "Galvanized Lightning");
    expect(lightning.build.damageParts[0]).toMatchObject({ number: 1, denomination: 8, types: ["lightning"] });
    expect(enchant.data.flags.ddbimporter.activityRiders).toEqual([lightning.init.id]);
  });

  it("imports DDB's Galvanized Claw state copies as weapons, named Galvanized Claw on a character", () => {
    const base = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw" });
    expect(base.documentStub).toBeNull();
    expect(base.override).toBeNull();

    for (const name of ["Galvanized Claw (Transformed)", "Galvanized Claw (Untransformed)"]) {
      const copy = build(ItemEnrichers.GalvanizedClaw, { name });
      expect(copy.documentStub).toMatchObject({ documentType: "weapon", parsingType: "wondrous", systemType: { value: "simpleM" } });
      expect(copy.override.data.name).toBe("Galvanized Claw");
    }
  });

  it("only the Transformed copy enchants the Unarmed Strike on a character import", () => {
    const transformed = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw (Transformed)" });
    const transfer = transformed.override.data.flags.ddbimporter.transferEnchantment;
    expect(transfer).toMatchObject({
      activityId: transformed.additionalActivities[0].overrides.id,
      effectId: transformed.effects[0].data._id,
    });
    // a natural weapon target: the claw itself is a simple weapon, so it never enchants itself
    expect(transfer.targetItemMatches).toEqual([
      { field: "type", value: "weapon" },
      { field: "system.type.value", value: "natural" },
    ]);

    const untransformed = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw (Untransformed)" });
    expect(untransformed.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    // munched copies keep DDB's names (the compendium would merge two same-named weapons) and no flag
    const munched = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw (Transformed)", ddbParser: { isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    expect(munched.documentStub).toMatchObject({ documentType: "weapon" });
    // DDB types the copies as ammunition; the base item must not survive the weapon retype
    expect(munched.override.data.system.type).toEqual({ value: "simpleM", baseItem: "" });
    expect(transformed.override.data.system.type.baseItem).toBe("");
  });
});

// DDB ships each hoopak twice (melee and "(Ranged)"); both import as the melee weapon with a Sling
describe("Hoopak", () => {
  const magic = (value: number) => ({ ddbDefinition: { grantedModifiers: [{ type: "bonus", subType: "magic", value }] } });

  it("adds a Sling ranged attack carrying the DDB magic bonus in its damage", () => {
    const sling = (options: Record<string, any>) => build(ItemEnrichers.Hoopak, { name: "Hoopak", ...options }).additionalActivities[0];
    const plain = sling({});
    expect(plain.init).toEqual({ name: "Sling", type: "attack" });
    expect(plain.overrides.data.range).toEqual({ override: true, value: "40", units: "ft" });
    expect(plain.overrides.data.attack.type).toEqual({ value: "ranged", classification: "weapon" });
    expect(plain.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 4, bonus: "@mod", types: ["bludgeoning"] });
    expect(sling({ name: "Forcebreaker Hoopak", ddbParser: magic(2) }).overrides.data.damage.parts[0].bonus).toBe("@mod + 2");
  });

  it("leaves the melee copy's own weapon alone", () => {
    const e = build(ItemEnrichers.Hoopak, { name: "Hoopak of Throne's Command", ddbParser: magic(1) });
    expect(e.override).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.keepParsedActivities).toBe(true);
  });

  it("reshapes the (Ranged) copy into the melee hoopak, renamed only on a character import", () => {
    const data = { system: { properties: ["amm", "fin", "spc", "two", "mgc"] } };
    const character = build(ItemEnrichers.Hoopak, { name: "Forcebreaker Hoopak (Ranged)", ddbParser: { data } });
    expect(character.activity.data.attack.type).toEqual({ value: "melee", classification: "weapon" });
    expect(character.override.data).toMatchObject({
      name: "Forcebreaker Hoopak",
      system: {
        type: { value: "martialM", baseItem: "hoopak" },
        damage: { base: { number: 1, denomination: 6, types: ["piercing"] } },
        range: { value: 5, long: null },
        ammunition: { type: "" },
        properties: ["fin", "spc", "two", "mgc"],
      },
    });
    const munched = build(ItemEnrichers.Hoopak, { name: "Hoopak (Ranged)", ddbParser: { data, isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.system.type.value).toBe("martialM");
  });
});

// trick weapons (item/_TrickWeapon.ts): every DDB copy is one weapon with a Transform self-enchant
describe("trick weapons", () => {
  // Foundry 13 change values are cast to strings on creation
  const changes = (effect: any) => Object.fromEntries(effect.changes.map((c: any) => [c.key, String(c.value)]));

  it("imports every copy as the Untransformed weapon, named and pre-transformed only on a character", () => {
    const base = build(ItemEnrichers.DreamExecutioner, { name: "Dream Executioner" });
    expect(base.documentStub).toMatchObject({ documentType: "weapon", parsingType: "weapon", systemType: { value: "martialM", baseItem: "" } });
    expect(base.override.data).toMatchObject({
      name: "Dream Executioner",
      system: {
        damage: { base: { number: 1, denomination: 10, types: ["slashing"] } },
        properties: ["fin", "rch", "two", "mgc"],
        mastery: "cleave",
        range: { value: 10 },
        magicalBonus: 1,
      },
    });
    expect(base.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();

    const maul = build(ItemEnrichers.DreamExecutioner, { name: "Dream Executioner (Maul)" });
    expect(maul.override.data.flags.ddbimporter.transferEnchantment).toEqual({
      targetItemId: "self",
      effectId: maul.effects[0].data._id,
      activityId: "ddbItemTransform",
    });

    const munched = build(ItemEnrichers.DreamExecutioner, { name: "Dream Executioner (Maul)", ddbParser: { isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    // a munched copy keeps DDB's suffixed name, so the form takes the weapon's name, not "{} (Maul)"
    expect(munched.effects[0].changes.find((c: any) => c.key === "name").value).toBe("Dream Executioner (Maul)");
    expect(maul.effects[0].changes.find((c: any) => c.key === "name").value).toBe("{} (Maul)");
  });

  it("switches to the Transformed form with a self-enchant that renames itself to revert", () => {
    const e = build(ItemEnrichers.Revelations, { name: "Revelations" });
    const transform = e.additionalActivities[0];
    expect(transform.init).toMatchObject({ name: "Transform", type: "enchant" });
    expect(transform.overrides).toMatchObject({ activationType: "bonus", data: { enchant: { self: true } } });
    const enchant = e.effects[0];
    expect(enchant).toMatchObject({ type: "enchant", activityMatch: "Transform" });
    expect(changes(enchant)).toMatchObject({
      "name": "{} (Whip)",
      "system.type.baseItem": "whip",
      "system.damage.base.denomination": "6",
      "system.mastery": "slow",
      "activities[enchant].name": "Revert to Cleaver",
    });
    // properties change one by one (Cleaver hvy/ver to Whip rch/ver); mgc is never touched
    const props = enchant.changes.filter((c: any) => c.key === "system.properties").map((c: any) => c.value);
    expect(props).toEqual(["rch", "-hvy"]);
    expect(JSON.parse(changes(enchant)["system.damage.versatile"])).toMatchObject({ number: 1, denomination: 8 });
  });

  it("adds form-only hit damage as a damage activity riding the Transform enchantment", () => {
    // dnd5e 5.x has no rule conditions to limit it to the weapon's attacks
    const cradle = build(ItemEnrichers.OrphansCradle, { name: "Orphan's Cradle" });
    const fire = cradle.additionalActivities.find((a: any) => a.init.name === "Transformed Fire");
    expect(fire.build.damageParts[0]).toMatchObject({ number: 2, denomination: 6, types: ["fire"] });
    expect(cradle.effects[0].data.flags.ddbimporter.activityRiders).toContain(fire.init.id);
  });

  it("switches the attack type when the forms differ (Unstable Crumbler's Cannon to Maul)", () => {
    const e = build(ItemEnrichers.UnstableCrumbler, { name: "Unstable Crumbler (Cannon)" });
    expect(e.activity.data.attack.type.value).toBe("ranged");
    expect(changes(e.effects[0])["activities[attack].attack.type.value"]).toBe("melee");
    expect(e.effects[0].changes.filter((c: any) => c.key === "system.properties").map((c: any) => c.value))
      .toEqual(["hvy", "-amm"]);
  });

  it("gives Ravenous Gazer's Transformed bonuses as a rider of the enchantment", () => {
    const e = build(ItemEnrichers.RavenousGazer, { name: "Ravenous Gazer" });
    const rider = e.effects.find((x: any) => x.name === "Ravenous Gazer: Transformed Bonuses");
    expect(rider.options.transfer).toBe(true);
    expect(e.effects[0].data.flags.ddbimporter.effectRiders).toEqual([rider.data._id]);
    expect(e.override.data.system.proficient).toBe(1);
  });

  it("gives the Meat Hookshot a Blunderbuss attack and a Transformed-only Hookshot", () => {
    const e = build(ItemEnrichers.MeatHookshot, { name: "Meat Hookshot (Blunderbuss)" });
    expect(e.override.data).toMatchObject({
      name: "Meat Hookshot",
      system: { type: { value: "simpleM", baseItem: "sickle" }, properties: ["lgt", "fin"], mastery: "nick" },
    });
    expect(e.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    const names = e.additionalActivities.map((a: any) => a.init.name);
    expect(names).toEqual(["Transform", "Blunderbuss", "Hookshot", "Hookshot: Pull"]);
    const blunderbuss = e.additionalActivities[1];
    expect(blunderbuss.overrides).toMatchObject({ noConsumeTargets: true, data: { range: { value: "20" }, attack: { type: { value: "ranged" } } } });
    // the hookshot and its pull save only exist while Transformed
    const riders = e.effects[0].data.flags.ddbimporter.activityRiders;
    expect(riders).toEqual([e.additionalActivities[2].init.id, e.additionalActivities[3].init.id]);
    expect(changes(e.effects[0])).toMatchObject({ "system.type.baseItem": "battleaxe", "system.damage.base.denomination": "10" });
    expect(e.effects[0].changes.filter((c: any) => c.key === "system.properties").map((c: any) => c.value))
      .toEqual(["two", "-lgt", "-fin"]);

    const battleaxe = build(ItemEnrichers.MeatHookshot, { name: "Meat Hookshot (Battleaxe)" });
    expect(battleaxe.override.data.flags.ddbimporter.transferEnchantment.effectId).toBe(battleaxe.effects[0].data._id);
  });

  it.each([
    ["RavenousGazer", "Ravenous Gazer", ["Feed the Gazer"]],
    ["DreamExecutioner", "Dream Executioner", ["Soul Explosion"]],
    ["Revelations", "Revelations", ["Crush"]],
    ["ShardOfMoonlight", "Shard of Moonlight", ["Transformed Radiant", "Revealing Glow", "Transient Moonlight", "Lunar Explosion"]],
    ["OrphansCradle", "Orphan's Cradle", ["Transformed Fire", "Fanned Flames", "Withering Flames"]],
  ])("hides %s's Transformed-only activities until it transforms", (key, name, transformedOnly) => {
    const e = build((ItemEnrichers as Record<string, any>)[key], { name });
    const ids = transformedOnly.map((n) => e.additionalActivities.find((a: any) => a.init.name === n)?.init.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(e.effects[0].data.flags.ddbimporter.activityRiders).toEqual(ids);
  });

  it.each([
    ["StaffOfTheAdder", "Staff of the Adder", "Awaken Snake Head", ["Attack with Snake"]],
    ["SpellSlingersPuppet", "Spell Slinger's Puppet", "Levitate Doll", ["Move Doll"]],
  ])("%s hides its follow-ups until it is activated", (key, name, activation, followUps) => {
    const e = build((ItemEnrichers as Record<string, any>)[key], { name });
    const activities = [e.activity, ...e.additionalActivities];
    const ids = followUps.map((n) => {
      const activity = e.additionalActivities.find((a: any) => a.init?.name === n);
      return activity?.init?.id ?? activity?.overrides?.id;
    });
    expect(ids.every(Boolean)).toBe(true);
    const profile = e.effects.find((f: any) => f.type === "enchant" && f.activityMatch === activation);
    expect(profile.options.transfer).toBe(false);
    expect(profile.data.flags.ddbimporter.activityRiders).toEqual(ids);
    expect(activities.filter((a: any) => (a?.init?.type ?? e.type) === "enchant")).toHaveLength(1);
  });

  it("swaps Dawn and Dusk's Radiant for Necrotic in its Sickle form", () => {
    const e = build(ItemEnrichers.DawnAndDusk, { name: "Dawn and Dusk" });
    expect(e.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 4, types: ["radiant"] });
    expect(changes(e.effects[0])["system.damage.parts"]).toBe(`[["1d6", "necrotic"]]`);
    expect(e.additionalActivities[0].overrides.activationType).toBe("special");
  });
});

// Precipit, the Formless: one State Change self-enchant whose profiles carry each state's riders
describe("PrecipitTheFormless", () => {
  const Enricher = ItemEnrichers.PrecipitTheFormless;
  const byName = (list: any[], name: string) => list.find((x: any) => (x.init?.name ?? x.name) === name);

  it("offers one profile per state, each with its own effect and activity riders", () => {
    const e = build(Enricher, { name: "Precipit, the Formless" });
    const profiles = e.effects.filter((x: any) => x.type === "enchant");
    expect(profiles.map((p: any) => p.name)).toEqual([
      "Precipit, the Formless: Gas", "Precipit, the Formless: Liquid", "Precipit, the Formless: Solid",
    ]);
    expect(profiles.every((p: any) => p.activityMatch === "State Change")).toBe(true);
    // a state's activity name says that choosing it again ends it
    expect(profiles[0].changes).toContainEqual(expect.objectContaining({ key: "activities[enchant].name", value: "Change or End Gas State" }));

    const solid = profiles[2].data.flags.ddbimporter;
    const solidEffect = e.effects.find((x: any) => x.data?._id === solid.effectRiders[0]);
    expect(solidEffect.name).toBe("Precipit, the Formless: Solid State");
    expect(solidEffect.options.transfer).toBe(true);
    expect(solidEffect.changes.find((c: any) => c.key === "system.attributes.ac.bonus").value).toBe("3");

    const riderNames = solid.activityRiders.map((id: string) => e.additionalActivities.find((a: any) => a.init.id === id).init.name);
    expect(riderNames).toEqual(["Cone of Cold", "Ice Storm", "Ray of Frost", "Wall of Ice", "Deep Freeze", "Ray of Frost (Level 5)", "Frozen Shell"]);
    // the level 5 ray is an attack for 1 charge: dnd5e scales a cantrip cast by character level only
    const ray = e.additionalActivities.find((a: any) => a.init.name === "Ray of Frost (Level 5)");
    expect(ray.init.type).toBe("attack");
    expect(ray.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "1" });
    expect(ray.overrides.data.attack).toMatchObject({ bonus: "10", flat: true });
    expect(ray.overrides.data.damage.parts[0]).toMatchObject({ number: 2, denomination: 8, types: ["cold"] });
    expect(e.effects.find((x: any) => x.activityMatch === "Ray of Frost (Level 5)").changes[0].value).toBe("-10");

    // every activity id is distinct, so no rider replaces another
    const ids = e.additionalActivities.map((a: any) => a.init.id);
    expect(new Set(ids).size).toBe(ids.length);
    // the State Change and its Reaction form are never riders
    const allRiders = profiles.flatMap((p: any) => p.data.flags.ddbimporter.activityRiders);
    expect(allRiders).not.toContain(e.additionalActivities[0].init.id);
    expect(allRiders).not.toContain(e.additionalActivities[1].init.id);
  });

  it("casts each state's spells for their charges at the printed DC", () => {
    const e = build(Enricher, { name: "Precipit, the Formless" });
    const cloudkill = byName(e.additionalActivities, "Cloudkill");
    expect(cloudkill.init.type).toBe("cast");
    expect(cloudkill.overrides).toMatchObject({ addSpellUuid: "Cloudkill", addItemConsume: true, itemConsumeValue: "5" });
    // dnd5e 5.x stores the cast's save DC as a number
    expect(cloudkill.build.spellOverride.challenge).toMatchObject({ save: 18, override: true });
    expect(byName(e.additionalActivities, "Ray of Frost").build.spellOverride.challenge).toMatchObject({ save: 18, attack: 10 });
    expect(byName(e.additionalActivities, "Ray of Frost").overrides).toMatchObject({ addItemConsume: false, noConsumeTargets: true });
    const reaction = byName(e.additionalActivities, "State Change (Reaction)");
    expect(reaction.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "1", data: { activity: { id: e.additionalActivities[0].init.id } } });
  });

  it("imports a state copy already in its state on a character only", () => {
    const gas = build(Enricher, { name: "Precipit, the Formless (Gas)" });
    expect(gas.override.data.name).toBe("Precipit, the Formless");
    const gasProfile = gas.effects.find((x: any) => x.name === "Precipit, the Formless: Gas");
    expect(gas.override.data.flags.ddbimporter.transferEnchantment).toEqual({
      targetItemId: "self",
      effectId: gasProfile.data._id,
      activityId: gas.additionalActivities[0].init.id,
    });
    expect(build(Enricher, { name: "Precipit, the Formless" }).override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    const munched = build(Enricher, { name: "Precipit, the Formless (Gas)", ddbParser: { isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    const munchedSolid = munched.effects.find((x: any) => x.name === "Precipit, the Formless: Solid");
    expect(munchedSolid.changes[0]).toMatchObject({ key: "name", value: "Precipit, the Formless (Solid)" });
  });
});

// The wands' hand-built activities copy spells the item also casts. cleanup() runs after the item
// spells became cast activities and drops the copy only when the cast is really there.
describe("hand-built activities copied by an item cast", () => {
  const withActivities = (activities: Record<string, any>) => ({ system: { activities } });

  it("drops Wand of Fireballs' save once the Fireball cast exists, and keeps it without one", async () => {
    const data = withActivities({
      saveWandOfFire: { type: "save" },
      castFireWand: { type: "cast", name: "Fireball (Wand of Fireballs)" },
    });
    await build(ItemEnrichers.WandOfFireballs, { data }).cleanup();
    expect(Object.keys(data.system.activities)).toEqual(["castFireWand"]);

    const noCast = withActivities({ saveWandOfFire: { type: "save" } });
    await build(ItemEnrichers.WandOfFireballs, { data: noCast }).cleanup();
    expect(Object.keys(noCast.system.activities)).toEqual(["saveWandOfFire"]);
  });

  it("matches the 2014 cast name with its (Legacy) suffix", async () => {
    const data = withActivities({
      damageWandMagic: { type: "damage" },
      castMagicMiss: { type: "cast", name: "Magic Missile (Wand of Magic Missiles) (Legacy)" },
    });
    await build(ItemEnrichers.WandOfMagicMissiles, { data, is2014: true }).cleanup();
    expect(Object.keys(data.system.activities)).toEqual(["castMagicMiss"]);
  });

  it("keeps the 2014 Cone of Fear, which no cast replaces, and drops both copies in 2024", async () => {
    const legacy = withActivities({
      command: { type: "save", name: "Command" },
      cone: { type: "save", name: "Cone of Fear" },
      castCommand: { type: "cast", name: "Command (Wand of Fear) (Legacy)" },
    });
    await build(ItemEnrichers.WandOfFear, { data: legacy, is2014: true }).cleanup();
    expect(Object.keys(legacy.system.activities)).toEqual(["cone", "castCommand"]);

    const modern = withActivities({
      command: { type: "save", name: "Command" },
      cone: { type: "save", name: "Cone of Fear" },
      castCommand: { type: "cast", name: "Command (Wand of Fear)" },
      castFear: { type: "cast", name: "Fear (Wand of Fear)" },
    });
    await build(ItemEnrichers.WandOfFear, { data: modern }).cleanup();
    expect(Object.keys(modern.system.activities)).toEqual(["castCommand", "castFear"]);
  });
});

describe("BrambleheartQuiver", () => {
  const quiver = () => build(ItemEnrichers.BrambleheartQuiver, {
    name: "Brambleheart Quiver",
    ddbParser: { originalName: "Brambleheart Quiver", ddbDefinition: { description: "", properties: [] }, ddbItem: { chargesUsed: 0 }, data: { system: { uses: {} } } },
  });

  it("imports as a plain wondrous item, not a container", async () => {
    const { EQUIPMENT } = await import("../../../src/config/dictionary/items/equipment");
    expect(EQUIPMENT.NON_CONTAINERS).toContain("Brambleheart Quiver");
  });

  it("tracks the grown arrows as uses and enchants a picked arrow with +2", () => {
    const enricher = quiver();
    expect(enricher.override.uses.max).toBe("4");
    expect(enricher.override.uses.recovery[0].formula).toBe("1d3 + 1");
    const pick = enricher.additionalActivities[0];
    expect(pick.overrides.data.restrictions).toMatchObject({ type: "consumable", categories: ["ammo"] });
    expect(pick.overrides.itemConsumeValue).toBe("1");
    expect(enricher.effects[0]).toMatchObject({ type: "enchant", activityMatch: "Pick a Magic Arrow", magicalBonus: { bonus: "2" } });
  });

  it("grows a Spike Growth field from the command word until the start of your next turn", () => {
    const activities = quiver().additionalActivities;
    expect(activities.map((a: any) => a.init.name)).toEqual(["Pick a Magic Arrow", "Thorn Command", "Thorn Field", "Thorn Field: Movement Damage"]);
    const field = activities[2];
    expect(field.build.targetOverride.template).toMatchObject({ type: "radius", size: "20" });
    expect(field.build.durationOverride).toMatchObject({ units: "round", value: "1" });
    // no region behaviors before dnd5e 6.0: the movement damage is rolled by hand
    expect(field.overrides.data?.behaviors).toBeUndefined();
  });
});
