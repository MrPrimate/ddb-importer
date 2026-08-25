import BehaviorHelper from "../../../../src/parser/enrichers/effects/BehaviorHelper";

describe("BehaviorHelper", () => {
  it("applyEffect builds the native applyActiveEffect behavior keyed by effect names", () => {
    const behavior = BehaviorHelper.applyEffect({ effects: "Silenced", name: "Silence", level: { min: 3 } });
    expect(typeof behavior._id).toBe("string");
    expect(behavior).toMatchObject({
      type: "applyActiveEffect",
      name: "Silence",
      level: { min: 3, max: null },
      config: { effects: ["Silenced"], sizes: [], types: [] },
    });
  });

  it("applyEffect accepts multiple effects (names or uuids) and filters", () => {
    const behavior = BehaviorHelper.applyEffect({
      effects: ["Slowed", "Compendium.dnd5e.effects.ActiveEffect.phbeffSilenced00"],
      sizes: ["lg"],
      types: ["undead"],
    });
    expect(behavior.config).toEqual({
      effects: ["Slowed", "Compendium.dnd5e.effects.ActiveEffect.phbeffSilenced00"],
      sizes: ["lg"],
      types: ["undead"],
    });
    expect(behavior.level).toEqual({ min: null, max: null });
  });

  it("difficultTerrain builds the native dnd5e behavior with terrain types", () => {
    const behavior = BehaviorHelper.difficultTerrain({ types: ["plants"] });
    expect(behavior).toMatchObject({ type: "difficultTerrain", config: { types: ["plants"] } });
  });

  it("generates a unique id per behavior", () => {
    expect(BehaviorHelper.difficultTerrain()._id).not.toBe(BehaviorHelper.difficultTerrain()._id);
  });
});
