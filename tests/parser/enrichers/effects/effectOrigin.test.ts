import AutoEffects from "../../../../src/parser/enrichers/effects/AutoEffects";

describe("AutoEffects.setEffectOrigin", () => {
  it("stamps both the legacy origin and the structured system origin", () => {
    const effect: any = { name: "Test" };
    AutoEffects.setEffectOrigin(effect, "Actor.a.Item.b");
    expect(effect.origin).toBe("Actor.a.Item.b");
    expect(effect.system.origin.item).toBe("Actor.a.Item.b");

    const behaviorEffect: any = { name: "Other", system: { changes: [] } };
    AutoEffects.setEffectOrigin(behaviorEffect, "Scene.s.Region.r.RegionBehavior.b", "behavior");
    expect(behaviorEffect.system.origin.behavior).toBe("Scene.s.Region.r.RegionBehavior.b");
    expect(behaviorEffect.system.changes).toEqual([]);
  });
});
