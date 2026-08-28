import FeyStep from "../../../src/parser/enrichers/trait/eladrin/FeyStep";
import BlessingOfTheRavenQueen from "../../../src/parser/enrichers/trait/shadar-kai/BlessingOfTheRavenQueen";
import GhostlyFlesh from "../../../src/parser/enrichers/trait/stygian-shade/GhostlyFlesh";
import HornedRepose from "../../../src/parser/enrichers/trait/the-manyhorn/HornedRepose";
import HungryJaws from "../../../src/parser/enrichers/trait/lizardfolk/HungryJaws";
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
      "Spring (Teleport)",
      "Summer (Damage)",
    ]);
    // Spring teleports the touched creature, not the eladrin. Range and teleport distance are
    // different things here: the eladrin must touch a creature within 5 ft, and that creature
    // then travels 30 ft, so the distance needs teleport.override rather than the range the
    // system would otherwise derive it from.
    const spring = e.additionalActivities[2];
    expect(spring.init.type).toBe("teleport");
    expect(spring.overrides).toMatchObject({
      noConsumeTargets: true,
      activationType: "special",
      data: {
        teleport: { override: true, value: "30" },
        range: { override: true, value: "5", units: "ft" },
        target: { affects: { count: "1", type: "creature" } },
      },
    });
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

describe("action-specific trait snippets", () => {
  it("loads the deactivation action snippet onto Ghostly Flesh's synthesized helper", () => {
    const [deactivate] = build(GhostlyFlesh).additionalActivities;

    // `true` derives the lookup from the activity name and the parser's
    // "race" type.
    expect(deactivate.overrides.useActivitySnippet).toBe(true);
    expect(deactivate.init.name).toBe("Ghostly Flesh (Deactivate)");
  });

  it("selects the ability-specific action snippet for each Horned Repose attack", () => {
    const e = build(HornedRepose);

    expect(e.activity.useActivitySnippet).toBe(true);
    expect(e.activity.name).toBe("Horned Repose (Str.)");
    expect(e.additionalActivities[0].overrides.useActivitySnippet).toBe(true);
    expect(e.additionalActivities[0].overrides.name).toBe("Horned Repose (Dex.)");
  });

  it("keeps Hungry Jaws' complete parent snippet instead of the generic Bite action snippet", () => {
    expect(build(HungryJaws).activity.useActivitySnippet).toBeUndefined();
  });
});
