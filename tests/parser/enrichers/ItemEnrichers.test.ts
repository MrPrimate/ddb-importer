/**
 * Item enricher hints for ruleset branches the audit captures cannot pin on their own. These
 * assert the hints a DDBItem consumes, not the built document.
 */
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

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
