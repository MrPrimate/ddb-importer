/**
 * Token detection modes granted by effects must override both `enabled` and `range`. Token changes
 * apply after Foundry fills detection mode defaults, so an entry created by an effect with only a
 * range stays disabled, and an upgrade against a missing entry changes nothing.
 *
 * No vi.mock preamble: see ClassEnrichers.test.ts.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function detectionChanges(hint: Record<string, any> | undefined, modeId: string): any[] {
  return (hint?.tokenChanges ?? []).filter((c: any) => c.key.startsWith(`token.detectionModes.${modeId}.`));
}

describe("detection mode token changes", () => {
  it("See Invisibility enables seeInvisibility with a finite range", () => {
    const enricher = makeEnricherData(SpellEnrichers.SeeInvisibility, {});
    const changes = detectionChanges(enricher.effects[0], "seeInvisibility");

    expect(changes).toEqual([
      expect.objectContaining({ key: "token.detectionModes.seeInvisibility.enabled", type: "override", value: "true" }),
      expect.objectContaining({ key: "token.detectionModes.seeInvisibility.range", type: "override", value: "5280" }),
    ]);
  });

  it("Revelation in Flesh: See the Invisible enables seeInvisibility at 60 ft", () => {
    const enricher = makeEnricherData(ClassEnrichers.Sorcerer.RevelationInFlesh, {});
    const hint = enricher.effects.find((e: any) => e.name === "See the Invisible");
    const changes = detectionChanges(hint, "seeInvisibility");

    expect(changes.map((c: any) => [c.key, c.type, c.value])).toEqual([
      ["token.detectionModes.seeInvisibility.enabled", "override", "true"],
      ["token.detectionModes.seeInvisibility.range", "override", "60"],
    ]);
  });
});
