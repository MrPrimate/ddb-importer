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
import { retributiveStrike } from "../../../src/parser/enrichers/item/_ItemActivities";

type TEnricher = new (options: any) => any;

beforeAll(async () => {
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
    expect(build(Enricher).override.uses.autoDestroy).toBe(false);
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

  it("gates Tordalfr's Rebuttal by the level in the record name, the parent carrying every level", () => {
    expect(names(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 9)"))).toEqual([]);
    expect(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 9)").override.uses.max).toBe("");
    expect(names(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 13)"))).toEqual(["Charged Strike"]);
    expect(names(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal"))).toEqual(["Charged Strike", "Lightning Bolt"]);
    expect(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal").override).toEqual({});
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

  it("splits the Unstable Crumbler forms and keeps both on the parent", () => {
    expect(names(named(ItemEnrichers.UnstableCrumbler, "Unstable Crumbler (Cannon)"))).toEqual(["Overheated Cannonball"]);
    expect(names(named(ItemEnrichers.UnstableCrumbler, "Unstable Crumbler (Maul)"))).toEqual(["Detonation"]);
    expect(names(named(ItemEnrichers.UnstableCrumbler, "Unstable Crumbler"))).toEqual(["Overheated Cannonball", "Detonation"]);
    expect(named(ItemEnrichers.UnstableCrumbler, "Unstable Crumbler").effects[0].changes[0]).toMatchObject({
      key: "system.traits.dm.amount.fire", value: "-max(@abilities.con.mod, 1)",
    });
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

  it("stops the stray primary on a parent record that does not parse as a weapon", () => {
    expect(record(ItemEnrichers.Moonblade, "Moonblade", "", { parsingType: "wondrous" }).stopDefaultActivity).toBe(true);
    expect(record(ItemEnrichers.Moonblade, "Moonblade Longsword").stopDefaultActivity).toBe(false);
  });
});
