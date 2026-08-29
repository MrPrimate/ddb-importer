import Chef from "../../../src/parser/enrichers/feat/Chef";
import ForcefulPresenceAwe from "../../../src/parser/enrichers/feat/ForcefulPresenceAwe";
import GreaterDisciplineAuspex from "../../../src/parser/enrichers/feat/GreaterDisciplineAuspex";
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
    const changes = makeEnricherData(GreaterDisciplineAuspex).effects[0].changes ?? [];
    expect(changes.map((c) => c.key)).toEqual(["check", "save"]);
    for (const change of changes) {
      expect(change).toMatchObject({ value: "1", type: "dnd5e.advantage" });
      expect(JSON.parse(String(change.conditions))).toEqual({ k: "roll.ability", o: "in", v: ["int", "wis"] });
    }
  });
});
