/**
 * Class enricher hints for the conditional paths the audit captures cannot reach on their own
 * (ruleset, class on the character, chosen option). These assert the hints a DDBFeature
 * consumes, not the built document.
 *
 * The full enricher barrel is the first src import, as in tests/smoke/enricherFirstLoad.test.ts:
 * loading a factory such as DDBClassFeatureEnricher before the barrel re-enters the enricher
 * tree mid-evaluation.
 */
import * as Enrichers from "../../../src/parser/enrichers/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const ClassEnrichers = Enrichers.ClassEnrichers;

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

describe("paladin AuraOfAlacrity", () => {
  const alacrity = (is2014: boolean) => build(ClassEnrichers.Paladin.AuraOfAlacrity, {
    name: "Aura of Alacrity",
    is2014,
    klass: "Paladin",
    ddbParser: { originalName: "Aura of Alacrity" },
    data: { name: "Aura of Alacrity", flags: {}, system: { description: { value: "" } } },
  });

  it("resolves its own enricher, not the generic paladin aura", () => {
    const factory = new Enrichers.DDBClassFeatureEnricher({ activityGenerator: null });
    expect(factory.ENRICHERS["Aura of Alacrity"]).toBe(ClassEnrichers.Paladin.AuraOfAlacrity);
  });

  it("reaches allies in the Aura of Protection in 2024, and 5 then 10 feet in 2014", () => {
    const [modern] = alacrity(false).effects;
    expect(modern.auraeffects.distanceFormula).toBe("@scale.paladin.aura-of-protection");
    const [legacy] = alacrity(true).effects;
    const legacySize = "min(10, 5 + (5 * floor(@classes.paladin.levels / 18)))";
    expect(legacy.auraeffects.distanceFormula).toBe(legacySize);
    expect(legacy.data.flags.ActiveAuras.radius).toBe(legacySize);
    // the paladin's own +10 comes from DDB's speed modifier, so the aura skips them
    expect(legacy.auraeffects.applyToSelf).toBe(false);
    expect(legacy.data.flags.ActiveAuras.ignoreSelf).toBe(true);
  });
});

describe("single save definitions", () => {
  it.each([
    ["TakeGhastlyForm"],
    ["WrathOfTheWild"],
  ])("%s builds its Unnerving Aura as one Wisdom save against the spell save DC", (name) => {
    const aura = build((ClassEnrichers.Ranger as any)[name]).additionalActivities.find((a: any) => a.init?.name === "Unnerving Aura");
    expect(aura.build.saveOverride).toEqual({ ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } });
    expect(aura.overrides.data.save).toBeUndefined();
  });
});

describe("warlock InvocationPactOfTheBlade", () => {
  it("leaves the weapon's attack ability alone; Charisma is the rider's option", () => {
    const [pactWeapon] = build(ClassEnrichers.Warlock.InvocationPactOfTheBlade).effects;
    expect(pactWeapon.changes.some((change: any) => change.key.includes("ability"))).toBe(false);
    expect(pactWeapon.data.flags.ddbimporter.activityRiders).toEqual([ClassEnrichers.Warlock.InvocationPactOfTheBlade.ATTACK_ID]);
  });
});
