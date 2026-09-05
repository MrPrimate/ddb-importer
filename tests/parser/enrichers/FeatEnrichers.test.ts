import Chef from "../../../src/parser/enrichers/feat/Chef";
import ForcefulPresenceAwe from "../../../src/parser/enrichers/feat/ForcefulPresenceAwe";
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

describe("Chef activity snippets", () => {
  it("points Eat Treat at the section that describes it", () => {
    const enricher = makeEnricherData(Chef);
    const activities = enricher.additionalActivities;

    // "Create Bolstering Treats" contains the DDB label, so it resolves on its own name;
    // "Eat Treat" has no textual relation to it and has to be told.
    expect(activities.map((a: any) => a.init.name)).toEqual(["Create Bolstering Treats", "Eat Treat"]);
    expect(activities[0].overrides).toBeUndefined();
    expect(activities[1].overrides?.useActivitySnippet).toEqual({ section: "Bolstering Treats" });
  });
});

/**
 * These two used to emit nothing without midi-QOL or AC5e. dnd5e 6.0 rule changes carry the
 * scope in a condition evaluated against the roll being made, so the advantage now lands with
 * no modules installed. The audit worksheets cannot see change data, so pin it here.
 */
describe("advantage scoped by a change condition", () => {
  it("gates Awe on the three Charisma skills", () => {
    const effect = makeEnricherData(ForcefulPresenceAwe).effects[0];
    const changes = effect.changes ?? [];
    expect(effect.midiChanges).toBeUndefined();
    expect(effect.ac5eChanges).toBeUndefined();
    expect(changes).toEqual([
      expect.objectContaining({ key: "check", value: "1", type: "dnd5e.advantage" }),
    ]);
    expect(JSON.parse(String(changes[0].conditions))).toEqual({
      k: "roll.skill", o: "in", v: ["itm", "prf", "per"],
    });
  });

  it("gates Auspex on the two abilities, for checks and saves alike", () => {
    const changes = makeEnricherData(FeatEnrichers.GreaterDisciplineAuspex).effects[0].changes ?? [];
    expect(changes.map((c) => c.key)).toEqual(["check", "save"]);
    for (const change of changes) {
      expect(change).toMatchObject({ value: "1", type: "dnd5e.advantage" });
      expect(JSON.parse(String(change.conditions))).toEqual({ k: "roll.ability", o: "in", v: ["int", "wis"] });
    }
  });
});

describe("Kindred feat consumption targets", () => {
  const CONSUMERS = [
    ["AlacrityBurstOfSpeed", FeatEnrichers.AlacrityBurstOfSpeed],
    ["DaywalkerEndureRadiance", FeatEnrichers.DaywalkerEndureRadiance],
    ["FeralWhispersCallOfTheWild", FeatEnrichers.FeralWhispersCallOfTheWild],
    ["GreaterDisciplineAuspex", FeatEnrichers.GreaterDisciplineAuspex],
    ["GreaterDisciplineCelerity", FeatEnrichers.GreaterDisciplineCelerity],
    ["GreaterDisciplinePotence", FeatEnrichers.GreaterDisciplinePotence],
    ["GreaterDisciplineProtean", FeatEnrichers.GreaterDisciplineProtean],
    ["SuperiorDisciplineCelerity", FeatEnrichers.SuperiorDisciplineCelerity],
    ["SuperiorDisciplineObfuscate", FeatEnrichers.SuperiorDisciplineObfuscate],
    ["SuperiorDisciplinePotence", FeatEnrichers.SuperiorDisciplinePotence],
    ["SupremeDisciplineAuspex", FeatEnrichers.SupremeDisciplineAuspex],
    ["SupremeDisciplineCelerity", FeatEnrichers.SupremeDisciplineCelerity],
    ["SupremeDisciplineFortitude", FeatEnrichers.SupremeDisciplineFortitude],
    ["SupremeDisciplineOblivion", FeatEnrichers.SupremeDisciplineOblivion],
    ["SupremeDisciplinePotence", FeatEnrichers.SupremeDisciplinePotence],
  ] as const;

  it.each(CONSUMERS)("%s uses the portable Blood Potency identifier", (_name, Enricher) => {
    expect(makeEnricherData(Enricher).activity.itemConsumeTargetName).toBe("feat:blood-potency");
  });
});

describe("War Caster", () => {
  it("keeps the transferred concentration advantage and adds the opportunity-spell reaction", () => {
    const e = makeEnricherData(FeatEnrichers.WarCaster);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Opportunity Spell", activationType: "reaction" });
    expect(e.effects[0].options).toMatchObject({ transfer: true });
    expect(e.override).toMatchObject({ midiManualReaction: true });
  });
});
