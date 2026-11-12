/**
 * Pins for the D&D Beyond Drops November 2026 (Champions of Ysgard) enrichers. The Dread Linnorm's
 * Bite and the Bariaur's Ram share their names with other content, so the manifests cannot lock
 * them; the routing and output are pinned here instead. Wording here is synthetic.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import {
  ClassEnrichers,
  FeatEnrichers,
  MonsterEnrichers,
  SpeciesEnrichers,
} from "../../../src/parser/enrichers/_module";
import DICTIONARY from "../../../src/config/dictionary/dictionary";
import DDBDescriptions from "../../../src/parser/lib/DDBDescriptions";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => installActivityConfigStubs());

describe("routing", () => {
  it.each([
    [MonsterEnrichers, "DreadLinnorm", "Bite"],
    [MonsterEnrichers, "DreadLinnorm", "TwinBreath"],
    [MonsterEnrichers, "Valkyrie", "ValorousRebuke"],
    [SpeciesEnrichers, "Bariaur", "Ram"],
  ])("the barrel exposes %#: %s.%s", (barrel, group, name) => {
    const entries = (barrel as unknown as Record<string, Record<string, unknown>>)[group];
    expect(typeof entries[name]).toBe("function");
  });

  it("keeps the Bariaur's Ram out of the flat trait names, so Satyr's Ram is untouched", () => {
    expect((SpeciesEnrichers as unknown as Record<string, unknown>).Ram).toBeUndefined();
  });

  it("lists Stable Stance with the save advantage traits, and reads Prone from its text", () => {
    expect(DICTIONARY.parsing.speciesSaveAdvantageTraits).toContain("Stable Stance");
    const text = "<p>You have Advantage on saving throws to avoid the Prone condition.</p>";
    expect(DDBDescriptions.saveAdvantageConditions(text).statuses).toEqual(["prone"]);
  });
});

describe("Ysgardian Spirit", () => {
  const e: any = makeEnricherData(FeatEnrichers.YsgardianSpirit, { name: "Ysgardian Spirit", isAction: true });

  it("is a self utility triggered on becoming Bloodied", () => {
    expect(e.type).toBe("utility");
    expect(e.activity.activationType).toBe("special");
    expect(e.activity.data.range).toEqual({ override: true, value: null, units: "self" });
  });

  it("grants Advantage on one attack until the end of the next turn, with no damage on the effect", () => {
    expect(e.effects).toHaveLength(1);
    const [advantage] = e.effects;
    expect(advantage.options.expiry).toBe("sourceEnd");
    expect(advantage.daeSpecialDurations).toEqual(["1Attack"]);
    expect(advantage.ac5eChanges[0].key).toBe("flags.automated-conditions-5e.attack.advantage");
    expect(advantage.midiChanges.map((c: any) => c.key)).toEqual(["flags.midi-qol.advantage.attack.all"]);
    expect(advantage.changes ?? []).toEqual([]);
  });

  // DAE 1Attack and AC5e once end their effect at the attack roll, before damage is rolled
  it("rolls the Proficiency Bonus damage from its own free activity, any damage type", () => {
    const [damage] = e.additionalActivities;
    expect(damage.init.type).toBe("damage");
    expect(damage.overrides.noConsumeTargets).toBe(true);
    const [part] = damage.overrides.data.damage.parts;
    expect(part.custom).toEqual({ enabled: true, formula: "@prof" });
    expect(part.types.length).toBeGreaterThan(10);
  });
});

describe("Battle Master maneuvers (official shape)", () => {
  const options = { name: "Maneuver Options: Feinting Attack", klass: "Fighter", data: { name: "Maneuver Options: Feinting Attack" } };

  it("Feinting Attack's effect carries only the Advantage, the die stays on the Damage activity", () => {
    const e: any = makeEnricherData(ClassEnrichers.Fighter.ManeuverFeintingAttack, options);
    const [effect] = e.effects;
    expect(effect.changes ?? []).toEqual([]);
    expect(effect.midiChanges.map((c: any) => c.key)).toEqual(["flags.midi-qol.advantage.attack.all"]);
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Damage"]);
  });

  it("Lunging Attack has no effect, only the Damage activity", () => {
    const e: any = makeEnricherData(ClassEnrichers.Fighter.ManeuverLungingAttack, { ...options, name: "Maneuver Options: Lunging Attack", data: { name: "Maneuver Options: Lunging Attack" } });
    expect(e.effects).toEqual([]);
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Damage"]);
  });
});

describe("Quick Retreat", () => {
  const e: any = makeEnricherData(FeatEnrichers.QuickRetreat, { name: "Quick Retreat", isAction: true });

  it("is a self reaction with no stray range value", () => {
    expect(e.activity.activationType).toBe("reaction");
    expect(e.activity.data.range).toEqual({ override: true, value: null, units: "self" });
  });
});

describe("Bariaur Ram", () => {
  it("adds nothing to the trait itself, so the DDB action stays its one activity", () => {
    const e: any = makeEnricherData(SpeciesEnrichers.Bariaur.Ram, { name: "Ram" });
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
  });

  it("moves the action to a special activation", () => {
    const e: any = makeEnricherData(SpeciesEnrichers.Bariaur.Ram, { name: "Ram", isAction: true });
    expect(e.type).toBe("utility");
    expect(e.activity.activationType).toBe("special");
  });
});

describe("Dread Linnorm Bite", () => {
  const e: any = makeEnricherData(MonsterEnrichers.DreadLinnorm.Bite, { name: "Bite", actions: null });

  it("gives one Exhaustion level on the attack only", () => {
    const [effect] = e.effects;
    expect(effect.statuses).toEqual(["Exhaustion:1"]);
    expect(effect.activityTypesMatch).toEqual(["attack"]);
  });
});

describe("Dread Linnorm Twin Breath", () => {
  const e: any = makeEnricherData(MonsterEnrichers.DreadLinnorm.TwinBreath, { name: "Twin Breath", actions: null });

  it("fails an exhausted creature's save through a transferred AC5e grants flag, building no activity", () => {
    expect(e.type).toBeNull();
    const [effect] = e.effects;
    expect(effect.options.transfer).toBe(true);
    expect(effect.ac5eOnly).toBe(true);
    expect(effect.ac5eChanges[0].key).toBe("flags.automated-conditions-5e.grants.save.fail");
    expect(effect.ac5eChanges[0].value).toContain("rollingActor.statuses.exhaustion");
  });
});

describe("Valorous Rebuke", () => {
  const e: any = makeEnricherData(MonsterEnrichers.Valkyrie.ValorousRebuke, { name: "Valorous Rebuke", actions: null });

  it("is a Longsword attack reaction with the extra 4d6 Radiant", () => {
    expect(e.type).toBe("attack");
    expect(e.activity.activationType).toBe("reaction");
    expect(e.activity.addItemConsume).toBe(true);
    const parts = e.activity.data.damage.parts.map((p: any) => `${p.number}d${p.denomination}:${p.types.join()}`);
    expect(parts).toEqual(["2d8:piercing", "1d8:radiant", "4d6:radiant"]);
  });
});
