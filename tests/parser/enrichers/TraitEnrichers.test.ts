import FeyStep from "../../../src/parser/enrichers/trait/eladrin/FeyStep";
import BlessingOfTheRavenQueen from "../../../src/parser/enrichers/trait/shadar-kai/BlessingOfTheRavenQueen";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher): any {
  return makeEnricherData(Enricher);
}

describe("native teleport trait activities", () => {
  it("converts Fey Step while preserving every seasonal rider", () => {
    const e = build(FeyStep);
    expect(e.type).toBe("teleport");
    expect(e.activity).toMatchObject({
      name: "Fey Step (Teleport)",
      activationType: "bonus",
      data: {
        range: { override: true, value: "30", units: "ft" },
        target: { override: true, prompt: false, affects: { count: "1", type: "self" } },
      },
    });
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Autumn (Save)",
      "Winter (Save)",
      "Summer (Damage)",
    ]);
    expect(e.effects.map((effect: any) => effect.activityMatch)).toEqual(["Autumn (Save)", "Winter (Save)"]);
  });

  it("uses Blessing of the Raven Queen's 30 ft range and keeps resistance on the teleport", () => {
    const e = build(BlessingOfTheRavenQueen);
    expect(e.type).toBe("teleport");
    expect(e.activity).toMatchObject({
      name: "Teleport",
      activationType: "bonus",
      data: {
        range: { override: true, value: "30", units: "ft" },
        target: { override: true, prompt: false, affects: { count: "1", type: "self" } },
      },
    });
    expect(e.effects[0]).toMatchObject({
      name: "Blessing of the Raven Queen: Resistance",
      activityMatch: "Teleport",
      options: { durationSeconds: 6 },
    });
  });
});
