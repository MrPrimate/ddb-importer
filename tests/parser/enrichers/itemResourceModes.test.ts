import AutomaticRifle from "../../../src/parser/enrichers/item/AutomaticRifle";
import HuntingRifle from "../../../src/parser/enrichers/item/HuntingRifle";
import KeyholesDagger from "../../../src/parser/enrichers/item/KeyholesDagger";
import WaveSweptWeapon from "../../../src/parser/enrichers/item/WaveSweptWeapon";

/** Synthetic definitions exercise guards and resources without licensed item text. */
function firearm<T extends AutomaticRifle | HuntingRifle>(
  prototype: T,
  sourceId: number,
  sourceType = 1,
  reload = true,
  spent = 0,
): T {
  return Object.assign(Object.create(prototype), {
    capacity: 30,
    ddbParser: {
      ddbDefinition: {
        sources: [{ sourceId, sourceType }],
        description: "",
        properties: reload ? [{ name: "Reload", description: "Reload" }] : [],
      },
      ddbItem: { chargesUsed: spent },
      data: { system: { uses: { spent } } },
    },
  });
}

describe("official firearm resource guards", () => {
  it.each([3, 146])("supports source %s and preserves imported expenditure", (sourceId) => {
    const enricher = firearm(AutomaticRifle.prototype, sourceId, 1, true, 17);
    expect(enricher.supported).toBe(true);
    expect(enricher.override).toMatchObject({ retainUseSpent: true, uses: { spent: 17 } });
    expect(enricher.additionalActivities.map((a) => a.init?.name)).toEqual([
      "Reload (Action)",
      "Reload (Bonus Action)",
    ]);
  });

  it.each([
    [999, 1, true],
    [146, 2, true],
    [146, 1, false],
  ])("ignores another publisher, incidental source or unrelated firearm (%s/%s/%s)", (sourceId, sourceType, reload) => {
    const enricher = firearm(HuntingRifle.prototype, Number(sourceId), Number(sourceType), Boolean(reload));
    expect(enricher.activity).toBeNull();
    expect(enricher.override).toBeNull();
    expect(enricher.additionalActivities).toEqual([]);
  });
});

describe("Arcana evolving weapon source guards", () => {
  it.each([
    "Many Keyholes Dagger",
    "Ascendant Wave-Swept Longsword",
  ])("requires the primary Arcana source for %s", (name) => {
    const prototype = name.startsWith("Many") ? KeyholesDagger.prototype : WaveSweptWeapon.prototype;
    for (const sources of [[], [{ sourceId: 999, sourceType: 1 }], [{ sourceId: 301, sourceType: 2 }]]) {
      const enricher = Object.assign(Object.create(prototype), {
        ddbParser: { ddbDefinition: { name, sources } },
      });
      expect(enricher.tier).toBe(0);
      expect(enricher.useDefaultAdditionalActivities).toBe(true);
      expect(enricher.override).toBeNull();
      expect(enricher.effects).toEqual([]);
      expect(enricher.additionalActivities).toEqual([]);
    }
  });
});
