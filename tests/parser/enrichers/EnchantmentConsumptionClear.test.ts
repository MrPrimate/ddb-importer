import EnchantmentEffects from "../../../src/parser/enrichers/effects/EnchantmentEffects";

function document(activities: Record<string, unknown>, changes: IActiveEffectChangeData[]): any {
  return {
    system: { activities },
    effects: [{ name: "Active", type: "enchantment", system: { changes } }],
  };
}

const clear = (key: string, value: unknown = "[]"): IActiveEffectChangeData =>
  ({ key, type: "override", value, priority: 10 }) as IActiveEffectChangeData;

describe("EnchantmentEffects.zeroConsumptionClears", () => {
  it("zeroes each target of every activity a type selector matches, keyed by id", () => {
    const doc = document({
      one: { type: "enchant", consumption: { targets: [{ type: "itemUses" }] } },
      two: { type: "enchant", consumption: { targets: [{ type: "attribute" }, { type: "itemUses" }] } },
      three: { type: "utility", consumption: { targets: [{ type: "itemUses" }] } },
    }, [
      clear("name", "{} (Active)"),
      clear("activities[enchant].consumption.targets"),
    ]);
    EnchantmentEffects.zeroConsumptionClears(doc);
    expect(doc.effects[0].system.changes.map((c: IActiveEffectChangeData) => `${c.key}=${c.value}@${c.priority}`)).toEqual([
      "name={} (Active)@10",
      "system.activities.one.consumption.targets.0.value=0@10",
      "system.activities.two.consumption.targets.0.value=0@10",
      "system.activities.two.consumption.targets.1.value=0@10",
    ]);
  });

  it("handles an id key and an already-parsed empty array", () => {
    const doc = document(
      { stone: { type: "enchant", consumption: { targets: [{ type: "itemUses" }] } } },
      [clear("system.activities.stone.consumption.targets", [])],
    );
    EnchantmentEffects.zeroConsumptionClears(doc);
    expect(doc.effects[0].system.changes).toEqual([
      expect.objectContaining({ key: "system.activities.stone.consumption.targets.0.value", value: "0", type: "override" }),
    ]);
  });

  it("drops the clear for an activity with no targets, which would otherwise gain a blank one", () => {
    const doc = document({ a: { type: "enchant", consumption: { targets: [] } } }, [clear("activities[enchant].consumption.targets")]);
    EnchantmentEffects.zeroConsumptionClears(doc);
    expect(doc.effects[0].system.changes).toEqual([]);
  });

  it("leaves other array overrides and non-empty values alone", () => {
    const changes = [
      clear("activities[enchant].consumption.targets", "[{\"type\":\"itemUses\"}]"),
      clear("activities[enchant].damage.parts"),
    ];
    const doc = document({ a: { type: "enchant", consumption: { targets: [{}] } } }, changes);
    EnchantmentEffects.zeroConsumptionClears(doc);
    expect(doc.effects[0].system.changes).toEqual(changes);
  });
});
