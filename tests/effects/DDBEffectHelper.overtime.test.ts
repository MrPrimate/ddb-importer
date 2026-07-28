// Characterization tests for the over-time effect builders on DDBEffectHelper:
// overTimeDamage, overTimeSave, overTimeSaveEnd, damageOverTimeEffect,
// generateOverTimeEffect and generateConditionOnlyEffect.
//
// Unlike the pure test, the parser/enrichers/effects barrel is NOT mocked here:
// these methods delegate to the real MidiOverTimeEffect and ChangeHelper, and
// the DDBEffectHelper <-> MidiOverTimeEffect import cycle resolves at runtime
// because both sides only reference each other inside method bodies. Only the
// config barrel, the effects barrel and DDBMonsterFeature are stubbed.

vi.mock("../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class {},
}));

import DDBEffectHelper from "../../src/effects/DDBEffectHelper";

const globalAny: any = globalThis;

// The shared foundry mock has no CONFIG.DND5E.conditionTypes; the condition
// effect generator reads it (unguarded) for the status icon.
beforeAll(() => {
  globalAny.CONFIG.DND5E.conditionTypes = {
    poisoned: { name: "Poisoned", icon: "systems/dnd5e/icons/svg/statuses/poisoned.svg" },
  };
});

afterAll(() => {
  delete globalAny.CONFIG.DND5E.conditionTypes;
});

function makeFeatureDoc(overrides: any = {}): any {
  return {
    name: "Toxic Spores",
    img: "icons/spore.webp",
    type: "feat",
    system: {
      description: { value: "" },
      duration: { units: "inst" },
      activities: {},
    },
    effects: [],
    flags: {},
    ...overrides,
  };
}

function makeActor(): any {
  return { name: "Myconid", flags: {} };
}

const conditionText = "The target must succeed on a DC 13 Constitution saving throw or be poisoned for 1 minute. "
  + "The poisoned target can repeat the saving throw at the end of each of its turns, "
  + "ending the effect on itself on a success.";

describe("DDBEffectHelper.overTimeDamage", () => {
  it("builds a midi OverTime damage change string", () => {
    const change = DDBEffectHelper.overTimeDamage({
      document: { name: "Spike Growth" } as any,
      turn: "start",
      damage: "2d4",
      damageType: "piercing",
      saveAbility: "dex",
      saveRemove: false,
      saveDamage: "halfdamage",
      dc: 15,
    });
    expect(change).toEqual({
      key: "flags.midi-qol.OverTime",
      type: "override",
      value: "turn=start,label=Spike Growth (Start of Turn),damageRoll=2d4,damageType=piercing,"
        + "saveRemove=false,saveDC=15,saveAbility=dex,saveDamage=halfdamage,killAnim=true",
      priority: 20,
    });
  });

  it("uses the first ability when saveAbility is an array", () => {
    const change = DDBEffectHelper.overTimeDamage({
      document: { name: "Acid Pool" } as any,
      turn: "end",
      damage: "1d6",
      damageType: "acid",
      saveAbility: ["con", "dex"],
      saveRemove: true,
      saveDamage: "nodamage",
      dc: "@attributes.spell.dc",
    });
    expect(change.value).toContain("saveAbility=con");
    expect(change.value).toContain("saveDC=@attributes.spell.dc");
    expect(change.value).toContain("turn=end");
  });
});

describe("DDBEffectHelper.overTimeSave", () => {
  it("builds a midi OverTime save change string with saveRemove defaulting to true", () => {
    const change = DDBEffectHelper.overTimeSave({
      document: { name: "Hold Person" } as any,
      turn: "end",
      saveAbility: "wis",
      dc: 14,
    });
    expect(change).toEqual({
      key: "flags.midi-qol.OverTime",
      type: "override",
      value: "turn=end,label=Hold Person (End of Turn),saveRemove=true,saveDC=14,saveAbility=wis,killAnim=true",
      priority: 20,
    });
  });

  it("maps an action turn to turn=end plus actionSave=true", () => {
    const change = DDBEffectHelper.overTimeSave({
      document: { name: "Web" } as any,
      turn: "action",
      saveAbility: ["str"],
      dc: 12,
    });
    expect(change.value).toBe(
      "turn=end,label=Web (Action of Turn),saveRemove=true,saveDC=12,saveAbility=str,killAnim=true,actionSave=true",
    );
  });
});

describe("DDBEffectHelper.overTimeSaveEnd", () => {
  function makeEffect(): any {
    return { system: { changes: [] } };
  }

  it("pushes an end-of-turn save change when the text repeats the save at the end of each turn", () => {
    const effect = makeEffect();
    DDBEffectHelper.overTimeSaveEnd({
      document: { name: "Toxic Spores" },
      effect,
      save: { ability: ["con"], dc: { formula: "14", calculation: "" } },
      text: "The target can repeat the saving throw at the end of each of its turns.",
    });
    expect(effect.system.changes).toEqual([{
      key: "flags.midi-qol.OverTime",
      type: "override",
      value: "turn=end,label=Toxic Spores (End of Turn),saveRemove=true,saveDC=14,saveAbility=con,killAnim=true",
      priority: 20,
    }]);
  });

  it("pushes a start-of-turn save change for start-of-turn repeats", () => {
    const effect = makeEffect();
    DDBEffectHelper.overTimeSaveEnd({
      document: { name: "Toxic Spores" },
      effect,
      save: { ability: ["con"], dc: { formula: "14", calculation: "" } },
      text: "It can repeat the saving throw at the start of each of its turns.",
    });
    expect(effect.system.changes[0].value).toContain("turn=start");
  });

  it("pushes an action save change for action repeats, resolving a spellcasting DC", () => {
    const effect = makeEffect();
    DDBEffectHelper.overTimeSaveEnd({
      document: { name: "Entangling Roots" },
      effect,
      save: { ability: ["str"], dc: { formula: "", calculation: "spellcasting" } },
      text: "The target can use its action to repeat the saving throw.",
    });
    expect(effect.system.changes[0].value).toBe(
      "turn=end,label=Entangling Roots (Action of Turn),saveRemove=true,"
      + "saveDC=@attributes.spell.dc,saveAbility=str,killAnim=true,actionSave=true",
    );
  });

  it("does not push a change when the text has no repeat-save phrasing", () => {
    const effect = makeEffect();
    DDBEffectHelper.overTimeSaveEnd({
      document: { name: "Toxic Spores" },
      effect,
      save: { ability: ["con"], dc: { formula: "14", calculation: "" } },
      text: "The target is poisoned for 1 minute.",
    });
    expect(effect.system.changes).toEqual([]);
  });

  it("does not push a change when the DC cannot be resolved", () => {
    const effect = makeEffect();
    DDBEffectHelper.overTimeSaveEnd({
      document: { name: "Toxic Spores" },
      effect,
      save: { ability: ["con"], dc: { formula: "", calculation: "" } },
      text: "The target can repeat the saving throw at the end of each of its turns.",
    });
    expect(effect.system.changes).toEqual([]);
  });
});

describe("DDBEffectHelper.damageOverTimeEffect", () => {
  it("does nothing when neither startTurn nor endTurn is set", () => {
    const doc = makeFeatureDoc();
    DDBEffectHelper.damageOverTimeEffect({
      document: doc,
      damage: "2d4",
      damageType: "piercing",
      saveAbility: "con",
      dc: 15,
    });
    expect(doc.effects).toEqual([]);
  });

  it("adds a start-of-turn damage effect with a seconds duration", () => {
    const doc = makeFeatureDoc();
    DDBEffectHelper.damageOverTimeEffect({
      document: doc,
      startTurn: true,
      durationSeconds: 60,
      damage: "2d4",
      damageType: "piercing",
      saveAbility: "con",
      saveRemove: false,
      saveDamage: "halfdamage",
      dc: 15,
    });
    expect(doc.effects).toHaveLength(1);
    const effect = doc.effects[0];
    expect(effect.name).toBe("Toxic Spores");
    expect(effect.img).toBe("icons/spore.webp");
    expect(effect.duration.value).toBe(60);
    expect(effect.duration.units).toBe("seconds");
    expect(effect.system.changes).toEqual([{
      key: "flags.midi-qol.OverTime",
      type: "override",
      value: "turn=start,label=Toxic Spores (Start of Turn),damageRoll=2d4,damageType=piercing,"
        + "saveRemove=false,saveDC=15,saveAbility=con,saveDamage=halfdamage,killAnim=true",
      priority: 20,
    }]);
  });

  it("adds both start and end changes when both turns are requested", () => {
    const doc = makeFeatureDoc();
    DDBEffectHelper.damageOverTimeEffect({
      document: doc,
      startTurn: true,
      endTurn: true,
      durationSeconds: 18,
      damage: "1d6",
      damageType: "fire",
      saveAbility: ["dex"],
      dc: 13,
    });
    expect(doc.effects).toHaveLength(1);
    const values = doc.effects[0].system.changes.map((c: any) => c.value);
    expect(values[0]).toContain("turn=start");
    expect(values[1]).toContain("turn=end");
    // defaults: saveRemove=true, saveDamage=nodamage
    expect(values[0]).toContain("saveRemove=true");
    expect(values[0]).toContain("saveDamage=nodamage");
  });
});

describe("DDBEffectHelper.generateConditionOnlyEffect", () => {
  it("adds no effect when the description contains no status condition", () => {
    const doc = makeFeatureDoc({ system: {
      description: { value: "Nothing interesting happens." },
      duration: { units: "inst" },
      activities: {},
    } });
    const actor = makeActor();
    DDBEffectHelper.generateConditionOnlyEffect(actor, doc);
    expect(doc.effects).toEqual([]);
    expect(actor.flags).toEqual({});
  });

  it("adds a status effect for a parsed condition and converts an instant duration to rounds", () => {
    const doc = makeFeatureDoc({ system: {
      description: { value: conditionText },
      duration: { units: "inst" },
      activities: {},
    } });
    const actor = makeActor();
    DDBEffectHelper.generateConditionOnlyEffect(actor, doc);
    expect(doc.effects).toHaveLength(1);
    const effect = doc.effects[0];
    expect(typeof effect._id).toBe("string");
    expect(effect.name).toBe("Status: Poisoned");
    expect(effect.statuses).toEqual(["poisoned"]);
    // "for 1 minute" parses to units "minutes" and converts to 60 seconds
    expect(effect.duration.value).toBe(60);
    expect(effect.duration.units).toBe("seconds");
    // the monster is flagged as carrying an over time effect
    expect(actor.flags.monsterMunch.overTime).toEqual(["Toxic Spores"]);
    // the effect's 60s is translated to a valid dnd5e minute item duration
    expect(doc.system.duration).toEqual({ units: "minute", value: 1 });
  });
});

describe("DDBEffectHelper.generateOverTimeEffect", () => {
  it("adds no effect for a description without condition, turn or save", () => {
    const doc = makeFeatureDoc({ system: {
      description: { value: "It glows faintly." },
      duration: { units: "inst" },
      activities: {},
    } });
    const actor = makeActor();
    DDBEffectHelper.generateOverTimeEffect(actor, doc);
    expect(doc.effects).toEqual([]);
    expect(actor.flags).toEqual({});
  });

  it("builds condition, repeat-save and damage changes from a full stat block description", () => {
    const damageText = `${conditionText} On a failed save the target keeps taking 7 (2d6) fire damage on a failed save.`;
    const doc = makeFeatureDoc({
      system: {
        description: { value: damageText },
        duration: { units: "inst" },
        activities: {},
      },
      flags: {
        monsterMunch: { actionData: { damageParts: [{ damageString: "2d6", damageTypes: ["fire"] }] } },
      },
    });
    const actor = makeActor();
    DDBEffectHelper.generateOverTimeEffect(actor, doc);

    expect(doc.effects).toHaveLength(1);
    const effect = doc.effects[0];
    expect(effect.name).toBe("Status: Poisoned");
    expect(effect.statuses).toEqual(["poisoned"]);
    // the parsed "for 1 minute" (units "minutes") converts to 60 seconds
    expect(effect.duration.value).toBe(60);
    expect(effect.duration.units).toBe("seconds");

    // damage over time resets fulldam (set true by the condition branch first)
    expect(doc.flags.midiProperties.fulldam).toBe(false);

    const values = effect.system.changes.map((c: any) => c.value);
    expect(values).toHaveLength(2);
    // repeat-save change from the condition
    expect(values[0]).toBe(
      "turn=end,label=Toxic Spores (End of Turn),saveRemove=true,saveDC=13,saveAbility=con,killAnim=true",
    );
    // damage string is built per part as formula[type], joined with " + "
    expect(values[1]).toBe(
      "turn=end,label=Toxic Spores (End of Turn),damageRoll=2d6[fire],damageType=fire,"
      + "saveRemove=true,saveDC=13,saveAbility=con,saveDamage=nodamage,killAnim=true",
    );

    expect(actor.flags.monsterMunch.overTime).toEqual(["Toxic Spores"]);
    // the effect's 60s is translated to a valid dnd5e minute item duration
    expect(doc.system.duration).toEqual({ units: "minute", value: 1 });
  });
});
