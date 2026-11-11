/**
 * The features and items that deal maximum damage instead of rolling. Each gets a macro activity
 * running macros/generics/maximumDamage.js, with parameters choosing which recent chat cards it
 * offers; the ones whose condition AC5e can see (or tick in the damage dialog) also get an AC5e
 * maximise rule. The audit harness runs without AC5e, so the rule strings are pinned here.
 *
 * No vi.mock preamble, as in ClassEnrichers.test.ts.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import ChangeHelper from "../../../src/parser/enrichers/effects/ChangeHelper";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

/** The enricher's maximum damage macro activity, with its parameters parsed. */
function macroOf(enricher: any): { activity: any; parameters: any } {
  const activity = enricher.additionalActivities.find((a: any) => a.build?.ddbMacroOverride?.function === "ddb.generic.maximumDamage");
  return { activity, parameters: activity ? JSON.parse(activity.build.ddbMacroOverride.parameters) : undefined };
}

const SELF = `item.identifier === '${ChangeHelper.SELF_IDENTIFIER}'`;

describe("maximum damage helpers", () => {
  it("builds a macro activity that runs the generic macro without consuming anything", () => {
    const activity = DDBEnricherData.maximumDamageActivity({ condition: "When it happens", parameters: { thisItem: true } });
    expect(activity.init).toEqual({ name: "Calculate Maximum Damage", type: "ddbmacro" });
    expect(activity.build).toMatchObject({
      generateConsumption: false,
      generateDDBMacro: true,
      activationOverride: { type: "special", condition: "When it happens" },
      ddbMacroOverride: { function: "ddb.generic.maximumDamage", parameters: "{\"thisItem\":true}" },
    });
    // the feature's own activity spends the pool use (Channel Divinity), not the macro
    expect(activity.overrides).toEqual({ noConsumeTargets: true });
  });

  it("spends item charges when asked", () => {
    const activity = DDBEnricherData.maximumDamageActivity({ condition: "On a hit", itemConsume: "2" });
    expect(activity.overrides).toEqual({ addItemConsume: true, itemConsumeValue: "2" });
  });

  it("builds a transfer AC5e maximise rule, with opt-in and once per turn keywords when asked", () => {
    const effect = DDBEnricherData.maximumDamageEffect({
      name: "Test",
      description: "Test description",
      condition: "isSpell",
      addTo: "fire",
      optin: true,
      oncePerTurn: true,
    });
    expect(effect).toMatchObject({ name: "Test", ac5eOnly: true, options: { transfer: true, description: "Test description" } });
    expect(effect.ac5eChanges).toEqual([expect.objectContaining({
      key: "flags.automated-conditions-5e.damage.modifier",
      value: "modifier=maximize; addTo=fire; optin; oncePerTurn; isSpell",
    })]);
  });
});

describe("class features that deal maximum damage", () => {
  it.each([
    ["ChannelDivinityDestructiveWrath", ClassEnrichers.Cleric.ChannelDivinityDestructiveWrath,
      { title: "Destructive Wrath", sources: [{ type: "any" }], damageTypes: ["lightning", "thunder"] }],
    ["ChannelDivinityHonedInstincts", ClassEnrichers.Cleric.ChannelDivinityHonedInstincts,
      { title: "Honed Instincts", sources: [{ type: "weapon" }], activityTypes: ["attack"] }],
    ["Haymaker", ClassEnrichers.Pugilist.Haymaker,
      { title: "Haymaker", sources: [{ type: "weapon" }], activityTypes: ["attack"] }],
  ])("%s adds the macro to the feature, keeping DDB's actions", (_name, Enricher, parameters) => {
    const feature = build(Enricher as TEnricher);
    expect(feature.addToDefaultAdditionalActivities).toBe(true);
    expect(feature.useDefaultAdditionalActivities).toBe(true);
    expect(macroOf(feature).parameters).toEqual(parameters);
    expect(build(Enricher as TEnricher, { isAction: true }).additionalActivities).toEqual([]);
  });

  it("adds the surge macro only when the Wild Magic Surge table has the maximise result", () => {
    const withResult = build(ClassEnrichers.Sorcerer.WildMagicSurge, {
      ddbParser: { ddbDefinition: { description: "<td>Maximize the damage of the next damaging spell you cast within the next minute.</td>" } },
    });
    expect(macroOf(withResult).parameters).toEqual({ title: "Maximized Surge", sources: [{ type: "spell" }] });
    const without = build(ClassEnrichers.Sorcerer.WildMagicSurge, {
      ddbParser: { ddbDefinition: { description: "<td>You teleport up to 30 feet.</td>" } },
    });
    expect(without.additionalActivities).toEqual([]);
  });
});

describe("items that use a recent roll", () => {
  it("Rod of Hellish Flames offers fire and necrotic spell damage", () => {
    expect(macroOf(build(ItemEnrichers.RodOfHellishFlames)).parameters)
      .toEqual({ title: "Surge of Brimstone", sources: [{ type: "spell" }], damageTypes: ["fire", "necrotic"] });
  });

  it("Potion of Maximum Power offers spells of 4th level or lower", () => {
    expect(macroOf(build(ItemEnrichers.PotionOfMaximumPower)).parameters)
      .toEqual({ title: "Potion of Maximum Power", sources: [{ type: "spell" }], maxSpellLevel: 4 });
  });

  it("Arm Ring of Self-Sacrifice spends 2 charges on any attack", () => {
    const { activity, parameters } = macroOf(build(ItemEnrichers.ArmRingOfSelfSacrifice));
    expect(activity.init.name).toBe("Aggressive Strike");
    expect(activity.overrides).toEqual({ addItemConsume: true, itemConsumeValue: "2" });
    expect(parameters).toEqual({ title: "Aggressive Strike", sources: [{ type: "any" }], activityTypes: ["attack"] });
  });
});

describe("items that maximise damage automatically with AC5e", () => {
  const plant = "opponentActor.creatureType.includes('plant')";

  it.each([
    ["SwordOfSharpness", ItemEnrichers.SwordOfSharpness, `modifier=maximize; addTo=base; optin; ${SELF}`, { title: "Maximum Damage Against an Object", thisItem: true }],
    ["SiegeStaff", ItemEnrichers.SiegeStaff, `modifier=maximize; addTo=base; optin; ${SELF}`, { title: "Maximum Damage Against an Object", thisItem: true }],
    ["ForesightWeapon", ItemEnrichers.ForesightWeapon, `modifier=maximize; addTo=base; optin; ${SELF}`, { title: "Foresight", thisItem: true }],
    ["Hew", ItemEnrichers.Hew, `modifier=maximize; addTo=all; ${SELF} && ${plant}`, { title: "Maximum Damage", thisItem: true }],
    ["SplitterQuarterstaff", ItemEnrichers.SplitterQuarterstaff, `modifier=maximize; addTo=all; ${SELF} && ${plant}`, { title: "Maximum Damage", thisItem: true }],
    ["GripOfDendallen", ItemEnrichers.GripOfDendallen, `modifier=maximize; addTo=all; item.identifier === 'unarmed-strike' && ${plant}`,
      { title: "Maximum Damage", sources: [{ type: "weapon" }], activityTypes: ["attack"] }],
    ["FesterwoodLogger", ItemEnrichers.FesterwoodLogger, `modifier=maximize; addTo=acid; ${SELF} && ${plant}`,
      { title: "Maximum Acid Damage", thisItem: true, damageTypes: ["acid"] }],
    ["OlStumpy", ItemEnrichers.OlStumpy, `modifier=maximize; addTo=poison; ${SELF} && opponentActor.creatureType.includes('fey')`,
      { title: "Maximum Poison Damage", thisItem: true, damageTypes: ["poison"] }],
    ["RadiantWarPick", ItemEnrichers.RadiantWarPick,
      `modifier=maximize; addTo=radiant; ${SELF} && (opponentActor.creatureType.includes('shapechanger') || opponentActor.creatureType.includes('undead'))`,
      { title: "Maximum Radiant Damage", thisItem: true, damageTypes: ["radiant"] }],
    ["CryptKeeperGlaive", ItemEnrichers.CryptKeeperGlaive, `modifier=maximize; addTo=all; oncePerTurn; ${SELF} && opponentActor.statuses.prone`,
      { title: "Six Feet Under", thisItem: true }],
    ["DemonomiconOfIggwilv", ItemEnrichers.DemonomiconOfIggwilv, "modifier=maximize; addTo=all; isSpell && opponentActor.creatureType.includes('fiend')",
      { title: "Fiendish Scourging", sources: [{ type: "spell" }] }],
  ])("%s pairs the AC5e rule with the macro", (_name, Enricher, rule, parameters) => {
    const item = build(Enricher as TEnricher);
    const effects = item.effects.filter((effect: any) => effect.ac5eOnly);
    expect(effects).toHaveLength(1);
    expect(effects[0].options.transfer).toBe(true);
    expect(effects[0].ac5eChanges.map((change: any) => change.value)).toEqual([rule]);
    expect(macroOf(item).parameters).toEqual(parameters);
  });

  it("Festerwood Claymore has only the macro, since the beetles' damage is not a roll AC5e sees", () => {
    const item = build(ItemEnrichers.FesterwoodClaymore);
    expect(item.effects).toEqual([]);
    expect(macroOf(item).parameters).toEqual({ title: "Beetles: Maximum Damage", thisItem: true, damageTypes: ["piercing"] });
  });

  it("keeps Siege Staff's own activities", () => {
    const names = build(ItemEnrichers.SiegeStaff).additionalActivities.map((a: any) => a.init.name);
    expect(names).toEqual(["Battering Strike Damage", "Fire Pot Damage", "Trebuchet", "Calculate Maximum Damage"]);
  });
});
