import BehaviorHelper from "../../../../src/parser/enrichers/effects/BehaviorHelper";
import SRDEffects from "../../../../src/parser/enrichers/effects/SRDEffects";

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

  it("names an applyEffect behavior after the effects it applies", () => {
    expect(BehaviorHelper.applyEffect({ effects: "Aura of Life" }).name).toBe("Apply Aura of Life");
    expect(BehaviorHelper.applyEffect({
      effects: [SRDEffects.condition("deafened"), SRDEffects.condition("silenced")],
    }).name).toBe("Apply Deafened, Silenced");
  });

  it("names a difficultTerrain behavior after its terrain types", () => {
    expect(BehaviorHelper.difficultTerrain({ types: ["plants"] }).name).toBe("Difficult Terrain (Plants)");
    expect(BehaviorHelper.difficultTerrain().name).toBe("Difficult Terrain");
  });

  it("names an activity behavior after the activity it triggers, when given by name", () => {
    expect(BehaviorHelper.activity({ events: ["tokenEnter"], activityName: "Ongoing Save" }).name)
      .toBe("Ongoing Save");
    // by id the name is deferred to DDBActivityFactoryMixin._activityBehaviorNaming
    expect(BehaviorHelper.activity({ events: ["tokenEnter"], activityId: "ddbMoonbeamZone1" }).name).toBe("");
  });

  it("an explicit name always wins over the derived default", () => {
    expect(BehaviorHelper.difficultTerrain({ types: ["plants"], name: "Entangling Vines" }).name)
      .toBe("Entangling Vines");
    expect(BehaviorHelper.activity({ events: ["tokenEnter"], activityName: "Ongoing Save", name: "Sear" }).name)
      .toBe("Sear");
  });

  it("generates a unique id per behavior", () => {
    expect(BehaviorHelper.difficultTerrain()._id).not.toBe(BehaviorHelper.difficultTerrain()._id);
  });
});
