/**
 * Behavioural pins for user-reported fixes to Fiendish Vigor and four spells: the values a
 * module-free audit worksheet summarises but does not show in full.
 */
import FiendishVigor from "../../../src/parser/enrichers/class/warlock/FiendishVigor";
import SongOfTheShieldWall from "../../../src/parser/enrichers/spell/SongOfTheShieldWall";
import BloodBolt from "../../../src/parser/enrichers/spell/BloodBolt";
import RideTheLightning from "../../../src/parser/enrichers/spell/RideTheLightning";
import SanctumOfTheShepherd from "../../../src/parser/enrichers/spell/SanctumOfTheShepherd";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { actions: null, ...options });
}

describe("Fiendish Vigor", () => {
  it("grants the 2024 invocation's maximum roll as flat Temporary Hit Points", () => {
    const enricher = build(FiendishVigor, { name: "Fiendish Vigor", is2014: false });
    expect(enricher.type).toBe("heal");
    expect(enricher.activity.data.healing).toMatchObject({ types: ["temphp"], custom: { enabled: true, formula: "12" } });
  });

  it("still casts the compendium spell for the 2014 invocation", () => {
    const enricher = build(FiendishVigor, { name: "Fiendish Vigor", is2014: true });
    expect(enricher.type).toBe("cast");
    expect(enricher.activity.addSpellUuid).toBe("False Life");
  });
});

describe("Song of the Shield Wall", () => {
  it("targets creatures in range rather than placing a wall", () => {
    const enricher = build(SongOfTheShieldWall, { name: "Song of the Shield Wall" });
    expect(enricher.activity.data.target).toMatchObject({ affects: { type: "creature", count: "@mod" }, template: {} });
    expect(enricher.override.data["system.target"].template.type).toBe("");
  });

  it("raises the AC bonus at 6th and 8th level", () => {
    const enricher = build(SongOfTheShieldWall, { name: "Song of the Shield Wall" });
    expect(enricher.effects.map((hint: any) => [
      hint.changes[0].value,
      hint.data.flags.ddbimporter.effectIdLevel,
      hint.options.durationSeconds,
    ])).toEqual([
      ["2", { min: null, max: 5 }, 60],
      ["3", { min: 6, max: 7 }, 60],
      ["4", { min: 8, max: null }, 60],
    ]);
  });
});

describe("4th level and cantrip additions", () => {
  it("Blood Bolt grants the caster Proficiency Bonus Temporary Hit Points that do not scale", () => {
    const [heal] = build(BloodBolt, { name: "Blood Bolt" }).additionalActivities;
    expect(heal.init).toMatchObject({ name: "Temporary Hit Points", type: "heal" });
    expect(heal.build.healingPart).toMatchObject({
      types: ["temphp"],
      custom: { enabled: true, formula: "@prof" },
      scaling: { mode: "none" },
    });
    expect(heal.build.targetOverride.affects.type).toBe("self");
  });

  it("Ride the Lightning teleports the caster 60 feet", () => {
    const [teleport] = build(RideTheLightning, { name: "Ride the Lightning" }).additionalActivities;
    expect(teleport.init).toMatchObject({ name: "Teleport", type: "teleport" });
    expect(teleport.build.rangeOverride).toMatchObject({ value: "60", units: "ft" });
    expect(teleport.build.targetOverride.affects.type).toBe("self");
  });

  it("Sanctum of the Shepherd grants +1 AC for a day", () => {
    const [hint] = build(SanctumOfTheShepherd, { name: "Sanctum of the Shepherd" }).effects;
    expect(hint.options.durationSeconds).toBe(86400);
    expect(hint.changes[0]).toMatchObject({ key: "system.attributes.ac.bonus", value: "1" });
  });
});
