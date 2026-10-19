/**
 * Pins for the Ravenloft Dark Gift feats (Horrors Within, and the feat pick of every Project_Lamordia
 * background). Most of their automation sits on the DDB actions the feat carries, which the feats
 * audit shows only as activities of the feat, so the manifest cannot lock those enrichers.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => installActivityConfigStubs());

describe("Dark Gift flaws", () => {
  it.each([
    [FeatEnrichers.AberrantAnatomyWarpingFlesh, "con", "Warping Flesh", ["Stunned"]],
    [FeatEnrichers.EchoingSoulIntrusiveEchoes, "con", "Intrusive Echoes", ["Incapacitated"]],
    [FeatEnrichers.GatheredWhispersVoicesFromBeyond, "wis", "Voices from Beyond", ["Deafened"]],
    [FeatEnrichers.LivingShadowOminousWill, "wis", "Ominous Will", ["Incapacitated"]],
    [FeatEnrichers.SymbioticBeingSymbioticAgenda, "cha", "Symbiotic Agenda", ["Charmed"]],
    [FeatEnrichers.WatchersIncessantWatchers, "wis", "Paranoia", undefined],
  ])("%o is a self save at DC 13 + PB", (Enricher, ability, effectName, statuses) => {
    const e: any = makeEnricherData(Enricher as any);
    expect(e.type).toBe("save");
    expect(e.activity).toMatchObject({
      activationType: "special",
      targetSelf: true,
      rangeSelf: true,
      noConsumeTargets: true,
      data: { save: { ability: [ability], dc: { calculation: "", formula: "13 + @prof" } } },
    });
    const [effect] = e.effects;
    expect(effect).toMatchObject({ name: effectName, activityTypesMatch: ["save"] });
    expect(effect.statuses).toEqual(statuses);
  });

  it("leaves Symbiotic Agenda's 1d12 hours to the description", () => {
    const [effect] = makeEnricherData(FeatEnrichers.SymbioticBeingSymbioticAgenda).effects;
    expect(effect.options).toMatchObject({ durationSeconds: null });
    expect(effect.options?.description).toContain("1d12 hours");
  });

  it("builds Poisoned Roots with no effect", () => {
    expect(makeEnricherData(FeatEnrichers.MistWalkerPoisonedRoots).effects).toEqual([]);
  });
});

describe("Dark Gift benefits", () => {
  it("Unearthly Scream adds the Proficiency Bonus to AC for the triggering attack", () => {
    const e: any = makeEnricherData(FeatEnrichers.GatheredWhispersUnearthlyScream);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ targetSelf: true });
    expect(e.effects).toEqual([expect.objectContaining({
      name: "Unearthly Scream",
      activityTypesMatch: ["utility"],
      options: expect.objectContaining({ expiry: "turnEnd" }),
      daeSpecialDurations: ["isAttacked"],
      changes: [expect.objectContaining({ key: "system.attributes.ac.bonus", value: "@prof" })],
    })]);
  });

  it("Mist Walk is a 15-foot utility (dnd5e 5.x has no teleport activity)", () => {
    const e: any = makeEnricherData(FeatEnrichers.MistWalkerMistWalk);
    expect(e.type).toBe("utility");
    expect(e.activity.data.range).toMatchObject({ override: true, value: "15", units: "ft" });
    expect(e.activity.data.target.affects).toMatchObject({ type: "self" });
  });

  it("Touch of Death gives Disadvantage on death saves", () => {
    const e: any = makeEnricherData(FeatEnrichers.TouchOfDeath, { name: "Touch of Death" });
    expect(e.effects).toEqual([expect.objectContaining({
      name: "Pull of the Grave",
      options: expect.objectContaining({ transfer: true, durationSeconds: null, expiry: null }),
      changes: [expect.objectContaining({ key: "system.attributes.death.roll.mode", value: "-1" })],
    })]);
  });

  it("Second Skin's involuntary change save has a self range", () => {
    const change = makeEnricherData(FeatEnrichers.SecondSkin).additionalActivities
      .find((activity: any) => activity.init?.name === "Involuntary Change");
    expect(change?.overrides).toMatchObject({ targetType: "self", rangeSelf: true });
  });
});
