/**
 * Feat enricher hints for ruleset branches the audit captures cannot pin on their own. These
 * assert the hints a DDBFeature consumes, not the built document.
 */
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

describe("InspiringLeader", () => {
  it("builds the 2014 ten-minute speech: level plus Charisma temp HP for six allies", () => {
    const [speech]: any[] = makeEnricherData(FeatEnrichers.InspiringLeader, { is2014: true }).additionalActivities;
    expect(speech.init).toEqual({ name: "Inspiring Speech", type: "heal" });
    expect(speech.build.activationOverride).toMatchObject({ type: "minute", value: 10 });
    expect(speech.build.healingPart.custom.formula).toBe("@details.level + @abilities.cha.mod");
    expect(speech.build.targetOverride.affects).toMatchObject({ count: "6", type: "ally" });
  });
});
