/**
 * Pins for the per-monster enrichers that add a zone to a feature whose options DDB sets as
 * bold-only paragraphs under it. Those options never become features of their own, so nothing
 * name-keyed can reach them; each parent gets a small enricher instead. The monsters audit shows
 * the documents; what it cannot show is which parsed activity an override lands on, or that the
 * parent keeps the activities the parser built. Wording here is synthetic.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import ConvocationOfBreath from "../../../src/parser/enrichers/monster/EssenceOfMist/ConvocationOfBreath";
import ConvocationOfIce from "../../../src/parser/enrichers/monster/CruxOfFrost/ConvocationOfIce";
import ConvocationOfAir from "../../../src/parser/enrichers/monster/EssenceOfStorms/ConvocationOfAir";
import RottingRitual from "../../../src/parser/enrichers/monster/KeeperOfTheBlight/RottingRitual";
import MatterManipulation from "../../../src/parser/enrichers/monster/GithzeraiTraveler/MatterManipulation";
import * as MonsterEnrichers from "../../../src/parser/enrichers/monster/_module";
import SRDEffects from "../../../src/parser/enrichers/effects/SRDEffects";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

/** `originalActivity` is the parsed activity the override is being applied to. */
function build(Enricher: TEnricher, name: string, originalActivity?: Record<string, any>): any {
  const e: any = makeEnricherData(Enricher, { name, actions: null, data: { name } });
  // the factory sets this on the enricher just before it reads the `activity` getter
  e.ddbEnricher.originalActivity = originalActivity;
  return e;
}

function placer(e: any, name: string): any {
  const found = (e.additionalActivities ?? []).find((a: any) => a.init?.name === name);
  if (!found) throw new Error(`no activity named "${name}"`);
  return found;
}

describe("the monster barrel exposes them under the names the loader derives", () => {
  it.each([
    ["EssenceOfMist", "ConvocationOfBreath"],
    ["CruxOfFrost", "ConvocationOfIce"],
    ["EssenceOfStorms", "ConvocationOfAir"],
    ["KeeperOfTheBlight", "RottingRitual"],
    ["GithzeraiTraveler", "MatterManipulation"],
  ])("%s.%s", (monster, feature) => {
    const group = (MonsterEnrichers as unknown as Record<string, Record<string, unknown>>)[monster];
    expect(typeof group[feature]).toBe("function");
  });
});

describe("Convocation of Breath: the override lands on the parsed activity it names", () => {
  it("gives Toxic Breath the aura, a use to spend and its own save at turn start", () => {
    const e = build(ConvocationOfBreath, "Convocation of Breath", { name: "Toxic Breath", type: "save" });
    expect(e.activity.addItemConsume).toBe(true);
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "10" });
    expect(e.activity.data.duration).toMatchObject({ value: "1", units: "minute" });
    const [behavior] = e.activity.data.behaviors;
    expect(behavior.config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
    // no sibling named: the region fires Toxic Breath itself
    expect(behavior.config.args.activityName).toBeUndefined();
  });

  it("keeps Poisoned off Hide in Breath and leaves anything else alone", () => {
    expect(build(ConvocationOfBreath, "Convocation of Breath", { name: "Hide in Breath", type: "save" }).activity).toEqual({ noeffect: true });
    expect(build(ConvocationOfBreath, "Convocation of Breath", { name: "", type: "save" }).activity).toEqual({});
  });

  it("poisons to the end of the creature's next turn, from Toxic Breath only", () => {
    const e = build(ConvocationOfBreath, "Convocation of Breath");
    expect(e.clearAutoEffects).toBe(true);
    expect(e.effects).toEqual([
      expect.objectContaining({ activityMatch: "Toxic Breath", statuses: ["Poisoned"], options: expect.objectContaining({ transfer: false, expiry: "targetEnd" }) }),
    ]);
    expect(e.additionalActivities ?? []).toEqual([]);
  });
});

describe("options that left no activity get a placer beside the parsed one", () => {
  it.each([
    ["ConvocationOfIce", ConvocationOfIce, "Frigid Sheen"],
    ["ConvocationOfAir", ConvocationOfAir, "Rising Whirlwind"],
    ["RottingRitual", RottingRitual, "Frenzying Spores"],
    ["MatterManipulation", MatterManipulation, "5-6: Retaliating Light"],
  ] as [string, TEnricher, string][])("%s names the parsed activity for the option it is, and keeps it", (_label, Enricher, primary) => {
    const e = build(Enricher, "Test Feature");
    expect(e.type).toBeNull();
    expect(e.activity.name).toBe(primary);
    expect(e.keepParsedActivities).toBe(true);
  });

  it("Frost Squall slows non-Elementals at turn start and offers the cold damage for when they move", () => {
    const e = build(ConvocationOfIce, "Convocation of Ice");
    // the parser folded Frost Squall's dice into Frigid Sheen's save
    expect(e.activity.removeDamageParts).toBe(true);
    const squall = placer(e, "Frost Squall");
    expect(squall.build.targetOverride.template).toMatchObject({ type: "radius", size: "15" });
    expect(squall.overrides.addItemConsume).toBe(true);
    expect(squall.overrides.data.behaviors[0].config).toMatchObject({
      events: ["tokenTurnStart"], excludeSelf: true, excludeTypes: ["elemental"], args: { activityName: "Frost Squall: Chill" },
    });
    const chill = placer(e, "Frost Squall: Chill");
    expect(chill.init.type).toBe("damage");
    expect(chill.build.damageParts[0]).toMatchObject({ number: 3, denomination: 6, types: ["cold"] });
    expect(e.effects[0]).toMatchObject({ activityMatch: "Frost Squall: Chill", options: { transfer: false, expiry: "turnEnd" } });
    expect(e.effects[0].changes[0]).toMatchObject({ key: "system.attributes.movement.walk", value: "15" });
  });

  it("Vortex Terrain is enemy terrain that follows the Elemental and spends the daily use", () => {
    const vortex = placer(build(ConvocationOfAir, "Convocation of Air"), "Vortex Terrain");
    expect(vortex.build.targetOverride).toMatchObject({ affects: { type: "enemy" }, template: { type: "radius", size: "20" } });
    expect(vortex.build.targetOverride.template.stationary).toBeUndefined();
    expect(vortex.overrides.addItemConsume).toBe(true);
    expect(vortex.overrides.data.behaviors.map((b: any) => b.type)).toEqual(["difficultTerrain"]);
  });

  it("Devouring Fungus stays where it sprouted and poisons while inside with the stock effect", () => {
    const fungus = placer(build(RottingRitual, "Rotting Ritual"), "Devouring Fungus");
    expect(fungus.build.targetOverride.template).toMatchObject({ type: "radius", size: "60", stationary: true });
    expect(fungus.build.activationOverride.type).toBe("special");
    expect(fungus.overrides.data.behaviors).toEqual([
      expect.objectContaining({ type: "difficultTerrain", config: { types: ["plants"] } }),
      expect.objectContaining({ type: "applyActiveEffect", config: expect.objectContaining({ effects: [SRDEffects.condition("poisoned")] }) }),
    ]);
    // the ritual has no uses of its own
    expect(fungus.overrides.addItemConsume).toBeUndefined();
  });

  it("Growth is a round of plant terrain around the githzerai that spends the Recharge", () => {
    const growth = placer(build(MatterManipulation, "Matter Manipulation"), "3-4: Growth");
    expect(growth.build.targetOverride.template).toMatchObject({ type: "radius", size: "15" });
    expect(growth.build.durationOverride).toMatchObject({ value: "1", units: "round" });
    expect(growth.overrides.addItemConsume).toBe(true);
  });
});
