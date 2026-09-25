/**
 * Illrigger (MCDM) enricher branches the audit captures cannot reach on their own: the chosen
 * option paths (Master of Hell, Terrorizing Force), the muncher fallbacks with no choice, and the
 * cross-feature lookup Infernal Majesty makes for the Terrorizing Force damage type.
 *
 * These assert the enricher hints, not the built document.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const Illrigger = ClassEnrichers.Illrigger;

type TEnricher = new (options: any) => any;

/** The enricher hints under test; each case reads a different getter shape, so the result is untyped. */
function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, options);
}

describe("illrigger InterdictBoons", () => {
  it("builds nothing on the parent so each boon document supplies its own activities", () => {
    const e = build(Illrigger.InterdictBoons);
    expect(e.type).toBe("none");
    expect(e.useDefaultAdditionalActivities).toBe(false);
  });
});

describe("illrigger MasterOfHell", () => {
  it("builds every hellstorm when there is no choice (muncher)", () => {
    const e = build(Illrigger.MasterOfHell);
    expect(e.activity.name).toBe("Inferno");
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Pestilence", "Darkness"]);
    expect(e.effects.map((effect: any) => effect.activityMatch)).toEqual(["Inferno", "Pestilence", "Darkness"]);
  });

  it("builds only the chosen hellstorm on a character import", () => {
    const e = build(Illrigger.MasterOfHell, { ddbParser: { _chosen: [{ label: "Pestilence" }] } });
    expect(e.activity.name).toBe("Pestilence");
    expect(e.activity.data.save).toEqual({ ability: ["con"], dc: { calculation: "cha", formula: "" } });
    expect(e.activity.data.damage.parts.map((p: any) => p.types)).toEqual([["poison"], ["necrotic"]]);
    expect(e.activity.data.target.template).toMatchObject({ type: "sphere", size: "50" });
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0].statuses).toEqual(["Poisoned"]);
  });

  it("applies the Darkness blindness whether or not the target saves", () => {
    const e = build(Illrigger.MasterOfHell, { ddbParser: { _chosen: [{ label: "Darkness" }] } });
    expect(e.effects[0].onSave).toBe(true);
    expect(e.effects[0].statuses).toEqual(["Blinded"]);
  });
});

describe("illrigger TerrorizingForce", () => {
  it("enables only the chosen damage type", () => {
    const e = build(Illrigger.TerrorizingForce, { ddbParser: { _chosen: [{ label: "Fire" }] } });
    const enabled = e.effects.filter((effect: any) => !effect.options.disabled).map((effect: any) => effect.name);
    expect(enabled).toEqual(["Terrorizing Force: Fire"]);
    const fire = e.effects.find((effect: any) => effect.name === "Terrorizing Force: Fire");
    expect(fire.options.transfer).toBe(true);
    expect(fire.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.rolls.damage.mwak.bonus", "1d8[fire]"],
      ["system.rolls.damage.rwak.bonus", "1d8[fire]"],
    ]);
  });

  it("leaves every type disabled without a choice", () => {
    const e = build(Illrigger.TerrorizingForce);
    expect(e.effects).toHaveLength(4);
    expect(e.effects.every((effect: any) => effect.options.disabled)).toBe(true);
  });
});

describe("illrigger InfernalMajesty", () => {
  it("adds a second die of the Terrorizing Force type chosen on DDB", () => {
    const e = build(Illrigger.InfernalMajesty, {
      character: { options: { class: [{ definition: { name: "Necrotic" } }], race: [], feat: [] } },
    });
    const keys = e.effects[0].changes.map((c: any) => `${c.key}=${c.value}`);
    expect(keys).toContain("system.rolls.damage.mwak.bonus=1d8[necrotic]");
    expect(keys).toContain("system.attributes.movement.speeds.fly=60");
  });

  it("keeps the resistances and flight when no Terrorizing Force type is known", () => {
    const e = build(Illrigger.InfernalMajesty);
    const keys = e.effects[0].changes.map((c: any) => c.key);
    expect(keys).not.toContain("system.rolls.damage.mwak.bonus");
    expect(keys.filter((k: string) => k === "system.traits.dr.value")).toHaveLength(3);
  });
});

describe("illrigger caster-derived target effects", () => {
  it("resolves the proficiency penalty against the illrigger", () => {
    const e = build(Illrigger.Bedevil);
    expect(e.effects[0].changes[0]).toMatchObject({
      key: "system.rolls.ability.save.bonus",
      value: "-@prof",
      replacement: "origin",
    });
  });

  it("spends the Invoke Hell use and a seal for Enervating Spell", () => {
    const e = build(Illrigger.InvokeHellArchitectOfRuin);
    const enervating = e.additionalActivities.find((a: any) => a.action?.name === "Invoke Hell: Enervating Spell");
    expect(enervating.overrides.itemConsumeTargetName).toBe("Invoke Hell");
    expect(enervating.overrides.additionalConsumptionTargets).toEqual([
      { type: "itemUses", target: "Baleful Interdict", value: "1", scaling: { mode: "", formula: "" } },
    ]);
  });
});
