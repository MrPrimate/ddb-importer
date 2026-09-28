/**
 * Item enricher hints for ruleset branches the audit captures cannot pin on their own. These
 * assert the hints a DDBItem consumes, not the built document.
 */
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import { retributiveStrike } from "../../../src/parser/enrichers/item/_ItemActivities";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

describe("StaffOfThunderAndLightning", () => {
  it("gives the 2014 Thunderclap half its own daily use, as one activity cannot spend another's", () => {
    const legacy = build(ItemEnrichers.StaffOfThunderAndLightning, { name: "Staff of Thunder and Lightning", is2014: true });
    const thunderclap = legacy.additionalActivities.find((a: any) => a.init?.name === "Thunder and Lightning (Thunderclap)");
    expect(thunderclap.build.generateUses).toBe(true);
    expect(thunderclap.build.usesOverride).toMatchObject({ max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] });
    expect(thunderclap.overrides.addActivityConsume).toBe(true);
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
