import BehaviorHelper from "../../../../src/parser/enrichers/effects/BehaviorHelper";
import SRDEffects from "../../../../src/parser/enrichers/effects/SRDEffects";

describe("BehaviorHelper", () => {
  it("preserves owner-turn settings as structured fields and alternative activities as arguments", () => {
    expect(BehaviorHelper.activity({
      ownerTurn: true, ownerTurnTargets: "none", fireOnPlacement: true, deleteAfterUse: true,
      events: ["tokenTurnStart"], activityChoices: ["One", "Two"],
    }).config).toMatchObject({
      ownerTurn: true, ownerTurnTargets: "none", fireOnPlacement: true, deleteAfterUse: true,
      args: { activityChoices: ["One", "Two"] },
    });
    expect(BehaviorHelper.activity({ events: ["tokenTurnStart"] }).config).not.toHaveProperty("ownerTurn");
  });
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

  it("activity carries the 5e size/type filters and the excludeTypes extension in config", () => {
    const behavior = BehaviorHelper.activity({
      events: ["tokenTurnStart"],
      sizes: ["tiny", "sm"],
      types: ["beast", "humanoid"],
      excludeTypes: ["ooze"],
    });
    expect(behavior.config).toMatchObject({
      sizes: ["tiny", "sm"],
      types: ["beast", "humanoid"],
      excludeTypes: ["ooze"],
    });
    // unfiltered behaviors emit empty sets, matching the behavior schema defaults
    expect(BehaviorHelper.activity({ events: ["tokenTurnStart"] }).config).toMatchObject({
      sizes: [],
      types: [],
      excludeTypes: [],
    });
  });

  it("activity only writes the target grouping opt-out, as a structured config field", () => {
    // grouping is the behavior schema default, so existing enricher output does not change
    expect(BehaviorHelper.activity({ events: ["tokenEnter"] }).config).not.toHaveProperty("groupTargets");
    expect(BehaviorHelper.activity({ events: ["tokenEnter"], groupTargets: true }).config)
      .not.toHaveProperty("groupTargets");

    // the structured field, not the arguments JSON: createBehaviorData overwrites the
    // argument of the same name with the schema field's value
    const perToken = BehaviorHelper.activity({ events: ["tokenEnter"], groupTargets: false })
      .config as I5eActivityBehaviorMacroConfig;
    expect(perToken.groupTargets).toBe(false);
    expect(perToken.args).not.toHaveProperty("groupTargets");
  });

  it("activity writes autoRoll as a structured config field, and only when it is on", () => {
    expect(BehaviorHelper.activity({ events: ["tokenEnter"] }).config).not.toHaveProperty("autoRoll");
    expect(BehaviorHelper.activity({ events: ["tokenEnter"], autoRoll: false }).config).not.toHaveProperty("autoRoll");

    // left in the arguments JSON it would be overwritten by the behavior schema's default
    const rolled = BehaviorHelper.activity({ events: ["tokenEnter"], autoRoll: true })
      .config as I5eActivityBehaviorMacroConfig;
    expect(rolled.autoRoll).toBe(true);
    expect(rolled.args).not.toHaveProperty("autoRoll");
  });

  it("generates a unique id per behavior", () => {
    expect(BehaviorHelper.difficultTerrain()._id).not.toBe(BehaviorHelper.difficultTerrain()._id);
  });
});
