/**
 * Behavioural pins for the Floral Dragons enrichers.
 *
 * The audit harness runs module-free, so the AC5e change values these emit are
 * invisible in the worksheets and a typo in a sandbox identifier fails silently
 * in Foundry. The species and druid enrichers additionally read the chosen
 * option label rather than the document name, because their effects are built
 * during the parent feature's build, before the document is renamed for the
 * option; that indirection is pinned here too.
 */
import FloralFortitude from "../../../src/parser/enrichers/trait/floralDragonborn/FloralFortitude";
import FloralBreathWeapon from "../../../src/parser/enrichers/trait/floralDragonborn/FloralBreathWeapon";
import DraconicBlossoming from "../../../src/parser/enrichers/trait/floralDragonborn/DraconicBlossoming";
import FloralForm from "../../../src/parser/enrichers/class/druid/FloralForm";
import ResearchSkills from "../../../src/parser/enrichers/class/ranger/ResearchSkills";
import ClematisTaintedWeapon from "../../../src/parser/enrichers/item/ClematisTaintedWeapon";
import ClematisPoison from "../../../src/parser/enrichers/item/ClematisPoison";
import VampireLilyDragonArmor from "../../../src/parser/enrichers/item/VampireLilyDragonArmor";
import WisteriaDragonPerfume from "../../../src/parser/enrichers/item/WisteriaDragonPerfume";
import SucculentWaterOfLife from "../../../src/parser/enrichers/item/SucculentWaterOfLife";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const SAVE_ADVANTAGE = "flags.automated-conditions-5e.save.advantage";

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { name: "Test Feature", ...options });
}

/** Build an enricher as if the named option had been chosen in the DDB builder. */
function chosen(Enricher: TEnricher, label: string, name = "Test Feature"): any {
  return build(Enricher, { name, ddbParser: { _chosen: [{ label }] } });
}

describe("Floral Dragonborn traits", () => {
  it.each([
    ["Guardian Floral Fortitude", "frightened"],
    ["Healer Floral Fortitude", "exhaustion"],
    ["Poisoner Floral Fortitude", "poisoned"],
    ["Waterplant Floral Fortitude", "restrained"],
    ["Wildflower Floral Fortitude", "charmed"],
  ])("Floral Fortitude maps %s to a save-advantage change on %s", (label, condition) => {
    const effects = chosen(FloralFortitude, label).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].ac5eChanges).toEqual([
      expect.objectContaining({ key: SAVE_ADVANTAGE, value: `riderStatuses.${condition}`, type: "ac5e" }),
    ]);
    expect(effects[0].options.transfer).toBe(true);
  });

  it("leaves the Beauty legacy as a description, magical sleep having no condition to key on", () => {
    const effects = chosen(FloralFortitude, "Beauty Floral Fortitude").effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].ac5eChanges).toBeUndefined();
    expect(effects[0].options.description).toContain("magical sleep");
  });

  it.each([
    ["Beauty Floral Breath Weapon", "Charmed (Floral Breath Weapon)", "Charmed", "Floral Breath Weapon: Beauty"],
    ["Poisoner Floral Breath Weapon", "Poisoned (Floral Breath Weapon)", "Poisoned", "Floral Breath Weapon: Poisoner"],
    ["Waterplant Floral Breath Weapon", "Prone (Floral Breath Weapon)", "Prone", "Floral Breath Weapon: Waterplant"],
  ])("Floral Breath Weapon riders %s with the legacy's own save activity", (label, effectName, status, activity) => {
    const effects = chosen(FloralBreathWeapon, label).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ name: effectName, statuses: [status], activityMatch: activity });
  });

  it("gives the Guardian legacy an attack-disadvantage change against anyone but the breather", () => {
    const effects = chosen(FloralBreathWeapon, "Guardian Floral Breath Weapon").effects;
    expect(effects[0].ac5eChanges).toEqual([
      expect.objectContaining({
        key: "flags.automated-conditions-5e.attack.disadvantage",
        value: "effectOriginTokenId !== opponentId",
      }),
    ]);
    expect(effects[0].daeSpecialDurations).toEqual(["turnEnd"]);
  });

  it.each([
    ["Healer Floral Breath Weapon"],
    ["Wildflower Floral Breath Weapon"],
  ])("emits no rider for %s, whose effect lands on the breather", (label) => {
    expect(chosen(FloralBreathWeapon, label).effects).toEqual([]);
  });

  it("reshapes Draconic Blossoming into a self buff plus a separate attacker's save", () => {
    const e = build(DraconicBlossoming, { name: "Draconic Blossoming" });
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Draconic Blossoming", targetType: "self", activationType: "bonus" });
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].init).toMatchObject({ name: "Attacker's Save", type: "save" });
    expect(e.additionalActivities[0].build.saveOverride.ability).toEqual(["cha"]);
    expect(e.effects[0].midiChanges[0].value).toBe(
      "label=Draconic Blossoming (Start of Turn Regeneration),turn=start,savingThrow=false,"
      + "damageRoll=1d4,damageType=healing,condition=@attributes.hp.value > 0,killAnim=true",
    );
  });
});

describe("Circle of Flowers", () => {
  it("adds a healing rule change for the Amaranth group", () => {
    const effects = chosen(FloralForm, "Apple Tree").effects;
    expect(effects[0]).toMatchObject({ name: "Floral Form: Apple Tree" });
    expect(effects[0].changes).toEqual([
      expect.objectContaining({ key: "healing", value: "1d4", type: "dnd5e.bonus" }),
    ]);
  });

  it("adds the poison save advantage for the Azalea group", () => {
    const effects = chosen(FloralForm, "Hydrangea").effects;
    expect(effects[0].ac5eChanges).toEqual([
      expect.objectContaining({ key: SAVE_ADVANTAGE, value: "riderStatuses.poisoned" }),
    ]);
  });

  it("fills DDB's empty swim modifier in place rather than adding a second effect", () => {
    const effects = chosen(FloralForm, "Water Lily").effects;
    expect(effects[0]).toMatchObject({ noCreate: true, name: "Floral Form: Water Lily" });
    expect(effects[0].changes).toEqual([
      expect.objectContaining({
        key: "system.attributes.movement.speeds.swim",
        value: "@attributes.movement.speeds.walk",
        type: "upgrade",
      }),
    ]);
  });

  it("leaves the Cherry Blossom group as a reminder, magical sleep having no immunity to set", () => {
    const effects = chosen(FloralForm, "Dandelion").effects;
    expect(effects[0].changes).toBeUndefined();
    expect(effects[0].options.description).toContain("sleep");
  });

  it("emits nothing for the Bane group, whose Dash activity DDB already parses", () => {
    expect(chosen(FloralForm, "Vampire Lily").effects).toEqual([]);
  });
});

describe("Field Researcher", () => {
  it("adds the Wisdom-modifier Intelligence check bonus to DDB's own effect", () => {
    const effects = build(ResearchSkills, { name: "Research Skills" }).effects;
    expect(effects[0]).toMatchObject({ noCreate: true, name: "Research Skills" });
    expect(effects[0].changes).toEqual([
      expect.objectContaining({
        key: "system.abilities.int.check.roll.bonus",
        value: "max(@abilities.wis.mod, 1)",
        type: "add",
      }),
    ]);
  });
});

describe("Floral Dragons items", () => {
  it("puts the poison damage on the save for ammunition, which has no restricted-damage rider", () => {
    const e = build(ClematisTaintedWeapon, { name: "Clematis-tainted Arrow", data: { type: "consumable" } });
    expect(e.activity.name).toBe("Poison Save");
    expect(e.activity.data.damage.onSave).toBe("half");
    expect(e.additionalActivities).toEqual([]);
  });

  it("keeps the save damage-free on weapons, whose Restricted Attack already rolls the 1d8", () => {
    const e = build(ClematisTaintedWeapon, { name: "Clematis-tainted Longsword", data: { type: "weapon" } });
    expect(e.activity).toEqual({});
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].build.generateDamage).toBe(false);
    expect(e.additionalActivities[0].build.saveOverride).toMatchObject({ ability: ["con"] });
  });

  it("paralyses on a failed clematis save until the end of the target's next turn", () => {
    const effects = build(ClematisTaintedWeapon, { name: "Clematis-tainted Dart", data: { type: "weapon" } }).effects;
    expect(effects[0]).toMatchObject({
      name: "Paralyzed (Clematis Toxin)",
      statuses: ["Paralyzed"],
      activityMatch: "Poison Save",
      daeSpecialDurations: ["turnEnd"],
    });
  });

  it("paralyses for an hour on the injury poison rather than a turn", () => {
    const effects = build(ClematisPoison, { name: "Clematis Poison" }).effects;
    expect(effects[0]).toMatchObject({ statuses: ["Paralyzed"], options: { durationSeconds: 3600 } });
  });

  it("rebuilds the vampire lily armour retaliation as a Dexterity reaction", () => {
    const e = build(VampireLilyDragonArmor, { name: "Plate Armor of the Vampire Lily Dragon" });
    expect(e.activity).toMatchObject({ name: "Poison Spines", activationType: "reaction" });
    expect(e.activity.data.save.ability).toEqual(["dex"]);
    expect(e.activity.data.save.dc.formula).toBe("15");
    expect(e.activity.data.damage.onSave).toBe("none");
    expect(e.effects[0]).toMatchObject({ statuses: ["Poisoned"], activityMatch: "Poison Spines" });
  });

  it("fixes the perfume save and ends the sleep on damage", () => {
    const e = build(WisteriaDragonPerfume, { name: "Wisteria Dragon Perfume" });
    expect(e.activity.data.save.ability).toEqual(["con"]);
    expect(e.activity.data.save.dc.formula).toBe("19");
    expect(e.effects[0]).toMatchObject({
      statuses: ["Unconscious"],
      daeSpecialDurations: ["isDamaged"],
      options: { durationSeconds: 60 },
    });
  });

  it("adds the minute of regeneration the potion's text describes", () => {
    const effects = build(SucculentWaterOfLife, { name: "Succulent Water of Life" }).effects;
    expect(effects[0].options.durationSeconds).toBe(60);
    expect(effects[0].midiChanges[0].value).toContain("damageRoll=1d10,damageType=healing");
  });
});
