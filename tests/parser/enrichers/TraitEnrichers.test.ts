import FeyStep from "../../../src/parser/enrichers/trait/eladrin/FeyStep";
import BlessingOfTheRavenQueen from "../../../src/parser/enrichers/trait/shadar-kai/BlessingOfTheRavenQueen";
import EerieToken from "../../../src/parser/enrichers/trait/hexblood/EerieToken";
import FelineAgility from "../../../src/parser/enrichers/trait/tabaxi/FelineAgility";
import BurstOfSpeed from "../../../src/parser/enrichers/trait/generic/BurstOfSpeed";
import HoldBreath from "../../../src/parser/enrichers/trait/generic/HoldBreath";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher): any {
  return makeEnricherData(Enricher);
}

describe("teleport trait activities as utilities", () => {
  it("keeps every Fey Step seasonal rider", () => {
    const e = build(FeyStep);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Fey Step (Teleport)", activationType: "bonus" });
    expect(e.effects.map((effect: any) => effect.activityMatch)).toEqual(["Autumn (Save)", "Winter (Save)"]);
  });

  it("deals Summer's fire damage with a floor of 1, or the proficiency bonus for the reprint", () => {
    const summerFormula = (enricher: any) => {
      const summer = enricher.additionalActivities.find((a: any) => a.init.name === "Summer (Damage)");
      return summer.overrides?.data?.damage?.parts[0].custom.formula
        ?? summer.build.damageParts[0].custom.formula;
    };

    // the original eladrin: Charisma modifier (minimum of 1 damage)
    expect(summerFormula(build(FeyStep))).toBe("max(1, @abilities.cha.mod)");

    const reprint = makeEnricherData(FeyStep, {
      ddbParser: {
        ddbDefinition: {
          name: "Fey Step",
          description: "<p><strong>Summer.</strong> Each creature takes fire damage equal to your proficiency bonus.</p>",
        },
      },
    });
    expect(summerFormula(reprint)).toBe("@prof");
  });

  it("uses Blessing of the Raven Queen's 30 ft range and keeps resistance on the teleport", () => {
    const e = build(BlessingOfTheRavenQueen);
    expect(e.type).toBe("utility");
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
      options: { expiry: "sourceStart" },
    });
  });
});

describe("hexblood Eerie Token uses", () => {
  it("reads the 2024 action from the race bucket", () => {
    const e: any = makeEnricherData(EerieToken, {
      actions: { race: [{ name: "Eerie Token", limitedUse: { maxUses: 1, numberUsed: 1, resetType: 2 } }] },
    });
    expect(e.override.uses).toMatchObject({ max: "1", spent: 1 });
  });

  it("states one use per long rest on 2014, where DDB ships no limited use", () => {
    const e: any = makeEnricherData(EerieToken, {
      is2014: true,
      actions: { race: [{ name: "Eerie Token - Create", limitedUse: null }] },
    });
    expect(e.override.uses).toEqual({ max: "1", recovery: [{ period: "lr", type: "recoverAll", formula: undefined }] });
  });
});

describe("seconds-canonical effect durations (dnd5e #7434)", () => {
  // "until the end of the turn" is core's turnEnd: the turn the effect was applied in, with
  // no counted duration (dnd5e's sourceEnd would skip the creation turn and last a turn longer)
  it("Feline Agility and Burst of Speed end with the turn they are used on", () => {
    for (const Enricher of [FelineAgility, BurstOfSpeed]) {
      const [effect] = build(Enricher).effects;
      expect(effect.options.expiry).toBe("turnEnd");
      expect(effect.options.durationSeconds).toBeUndefined();
    }
  });
});

/** Hold Breath is shared by species with different limits, so the span comes from the trait text. */
describe("HoldBreath", () => {
  const withText = (description: string): any => makeEnricherData(HoldBreath, { ddbParser: { ddbDefinition: { description } } } as any);

  it("reads a 15 minute limit", () => {
    const e = withText("<p>You can hold your breath for up to 15 minutes at a time.</p>");
    expect(e.activity.data.duration).toEqual({ value: "15", units: "minute" });
    expect(e.effects[0].options.durationSeconds).toBe(900);
  });

  it("reads a 1 hour limit", () => {
    const e = withText("<p>You can hold your breath for up to 1 hour.</p>");
    expect(e.activity.data.duration).toEqual({ value: "1", units: "hour" });
    expect(e.effects[0].options.durationSeconds).toBe(3600);
  });

  it("falls back to 15 minutes when the text names no span", () => {
    expect(withText("").effects[0].options.durationSeconds).toBe(900);
  });
});
