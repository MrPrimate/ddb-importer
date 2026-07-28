// Characterization tests for DDBEffectHelper.documentWithFilteredActivities.
//
// The method deep-copies a document via toObject() and then applies ~28
// options: activity filtering, effect stripping, id regeneration,
// duration/target overrides, uses clearing, property add/remove, etc.
// These tests pin the current behavior of each option (alone plus a few
// interactions) using hand-built plain documents, always with
// returnDataOnly: true unless the construction path itself is under test.
//
// DDBEffectHelper is the unit under test so it is imported un-mocked; the
// barrels its import chain drags in are stubbed exactly as in the pure test.

vi.mock("../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class {},
}));
import DDBEffectHelper from "../../src/effects/DDBEffectHelper";

const globalAny: any = globalThis;

// Wrap plain data in the minimal Item surface the method touches: toObject().
function makeItemDoc(data: any): any {
  return {
    ...data,
    toObject: () => foundry.utils.deepClone(data),
  };
}

function baseDocData(): any {
  return {
    _id: "originalId000000",
    name: "Test Feature",
    type: "feat",
    system: {
      description: { value: "<p>desc</p>" },
      method: "spell",
      level: 3,
      activities: {
        keyOne: {
          _id: "activityIdOne000",
          type: "attack",
          consumption: { targets: [{ type: "itemUses", value: 1 }], spellSlot: true },
          target: {
            override: false,
            affects: { count: "2", type: "enemy", choice: true, special: "x" },
            template: { count: "1", contiguous: true, type: "radius", size: "20", width: "5", height: "5", units: "m" },
          },
          duration: { override: false, units: "minute", value: "1" },
          damage: {
            parts: [
              { number: 1, denomination: 6, types: ["fire", "cold"] },
              { number: 2, denomination: 4, types: ["poison"] },
            ],
          },
          effects: [{ _id: "effectIdOne00000" }, { _id: "danglingEffect00" }],
        },
        keyTwo: {
          _id: "activityIdTwo000",
          type: "save",
          effects: [{ _id: "effectIdTwo00000" }],
        },
      },
      properties: ["concentration", "mgc"],
      uses: { spent: 2, max: "3", recovery: [{ period: "lr", type: "recoverAll" }] },
    },
    effects: [
      { _id: "effectIdOne00000", type: "base", flags: {} },
      { _id: "effectIdTwo00000", type: "enchantment", flags: {} },
      { _id: "auraEffectId0000", type: "base", flags: { ActiveAura: { isAura: true } } },
    ],
    flags: {
      itemacro: { macro: "code" },
      "midi-qol": { onUseMacroName: "x" },
      midiProperties: { magicdam: true },
      dae: { macro: "y" },
    },
  };
}

function run(options: any = {}, data: any = baseDocData()): any {
  return DDBEffectHelper.documentWithFilteredActivities({
    document: makeItemDoc(data),
    returnDataOnly: true,
    ...options,
  });
}

describe("DDBEffectHelper.documentWithFilteredActivities", () => {
  describe("input resolution", () => {
    it("throws when neither uuid nor document is given", () => {
      expect(() => DDBEffectHelper.documentWithFilteredActivities()).toThrow(
        "Must specify either uuid or document !",
      );
    });

    it("resolves the document from fromUuidSync when only a uuid is given", () => {
      const doc = makeItemDoc(baseDocData());
      globalAny.fromUuidSync = vi.fn().mockReturnValue(doc);
      try {
        const result: any = DDBEffectHelper.documentWithFilteredActivities({ uuid: "Item.abc", returnDataOnly: true });
        expect(globalAny.fromUuidSync).toHaveBeenCalledWith("Item.abc");
        expect(result.name).toBe("Test Feature");
      } finally {
        delete globalAny.fromUuidSync;
      }
    });

    it("returns null when the uuid does not resolve", () => {
      globalAny.fromUuidSync = vi.fn().mockReturnValue(null);
      try {
        expect(DDBEffectHelper.documentWithFilteredActivities({ uuid: "Item.missing", returnDataOnly: true }))
          .toBeNull();
      } finally {
        delete globalAny.fromUuidSync;
      }
    });

    it("does not mutate the source document data", () => {
      const data = baseDocData();
      const snapshot = foundry.utils.deepClone(data);
      run({ renameDocument: "Changed", newId: true, clearEffects: true }, data);
      expect(data).toEqual(snapshot);
    });
  });

  describe("id handling", () => {
    it("deletes _id by default (clearId)", () => {
      expect(run()._id).toBeUndefined();
    });

    it("keeps the original _id with clearId: false", () => {
      expect(run({ clearId: false })._id).toBe("originalId000000");
    });

    it("assigns a fresh random _id with newId: true", () => {
      const result = run({ newId: true });
      expect(typeof result._id).toBe("string");
      expect(result._id).not.toBe("originalId000000");
      expect(result._id.length).toBeGreaterThan(0);
    });
  });

  describe("activity filtering", () => {
    it("filters activities by id", () => {
      const result = run({ activityIds: ["activityIdTwo000"] });
      expect(Object.keys(result.system.activities)).toEqual(["keyTwo"]);
    });

    it("filters activities by type", () => {
      const result = run({ activityTypes: ["attack"] });
      expect(Object.keys(result.system.activities)).toEqual(["keyOne"]);
    });

    it("applies id and type filters cumulatively (intersection)", () => {
      const result = run({ activityIds: ["activityIdTwo000"], activityTypes: ["attack"] });
      expect(Object.keys(result.system.activities)).toEqual([]);
    });

    it("keeps all activities when no filters are given", () => {
      const result = run();
      expect(Object.keys(result.system.activities).sort()).toEqual(["keyOne", "keyTwo"]);
    });
  });

  describe("document effect stripping", () => {
    it("removes ActiveAura aura effects by default", () => {
      const result = run({ filterEffects: false });
      expect(result.effects.map((e: any) => e._id)).toEqual(["effectIdOne00000", "effectIdTwo00000"]);
    });

    it("keeps aura effects with clearActiveAuraEffects: false", () => {
      const result = run({ filterEffects: false, clearActiveAuraEffects: false });
      expect(result.effects).toHaveLength(3);
    });

    it("clears all effects with clearEffects: true, which also empties activity effect links", () => {
      const result = run({ clearEffects: true });
      expect(result.effects).toEqual([]);
      expect(result.system.activities.keyOne.effects).toEqual([]);
      expect(result.system.activities.keyTwo.effects).toEqual([]);
    });

    it("stashes enchantment effects into flags and clears effects with retainEnchantments", () => {
      const result = run({ retainEnchantments: true });
      expect(result.effects).toEqual([]);
      const stashed: any = foundry.utils.getProperty(result, "flags.ddbimporter.effect.enchantmentEffects");
      expect(stashed.map((e: any) => e._id)).toEqual(["effectIdTwo00000"]);
    });

    it("filterEffects (default) keeps only document effects referenced by surviving activities", () => {
      const result = run({ activityIds: ["activityIdTwo000"] });
      expect(result.effects.map((e: any) => e._id)).toEqual(["effectIdTwo00000"]);
    });

    it("drops activity effect links whose effect is missing from the document", () => {
      // keyOne links danglingEffect00 which has no matching document effect
      const result = run();
      expect(result.system.activities.keyOne.effects.map((e: any) => e._id)).toEqual(["effectIdOne00000"]);
    });

    it("clearEffectFlags empties itemacro, midi-qol, midiProperties and dae flags", () => {
      const result = run({ clearEffectFlags: true });
      expect(result.flags.itemacro).toEqual({});
      expect(result.flags["midi-qol"]).toEqual({});
      expect(result.flags.midiProperties).toEqual({});
      expect(result.flags.dae).toEqual({});
    });

    it("keeps effect flags by default", () => {
      const result = run();
      expect(result.flags.itemacro).toEqual({ macro: "code" });
    });
  });

  describe("per-activity mutations", () => {
    it("applies the default per-activity overrides in one pass", () => {
      const result = run();
      const a = result.system.activities.keyOne;
      expect(a.consumption.targets).toEqual([]);
      expect(a.consumption.spellSlot).toBe(false);
      expect(a.target.override).toBe(true);
      expect(a.target.affects.type).toEqual({ count: "1", type: "creature", choice: false, special: "" });
      expect(a.target.template).toEqual({
        count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft",
      });
      expect(a.duration.override).toBe(true);
      expect(a.duration.units).toBe("inst");
      // characterization: durationValue defaults to null and is stringified,
      // so the default duration value is the literal string "null"
      expect(a.duration.value).toBe("null");
    });

    it("uses the given setTargetTo type", () => {
      const result = run({ setTargetTo: "ally" });
      expect(result.system.activities.keyOne.target.affects.type.type).toBe("ally");
    });

    it("skips the affects override when setTargetTo is empty", () => {
      const result = run({ setTargetTo: "" });
      expect(result.system.activities.keyOne.target.affects).toEqual({
        count: "2", type: "enemy", choice: true, special: "x",
      });
    });

    it("keeps the target template with clearTargetTemplate: false", () => {
      const result = run({ clearTargetTemplate: false });
      expect(result.system.activities.keyOne.target.template.type).toBe("radius");
    });

    it("keeps target.override false with overrideTarget: false", () => {
      const result = run({ overrideTarget: false });
      expect(result.system.activities.keyOne.target.override).toBe(false);
    });

    it("sets custom duration units and value", () => {
      const result = run({ durationUnits: "round", durationValue: 2 });
      const duration = result.system.activities.keyOne.duration;
      expect(duration.units).toBe("round");
      expect(duration.value).toBe("2");
    });

    it("keeps duration.override false with overrideDuration: false while still setting units", () => {
      const result = run({ overrideDuration: false, durationUnits: "hour", durationValue: 1 });
      const duration = result.system.activities.keyOne.duration;
      expect(duration.override).toBe(false);
      expect(duration.units).toBe("hour");
    });

    it("leaves the duration untouched (except override) when durationUnits is falsy", () => {
      const result = run({ durationUnits: "" });
      const duration = result.system.activities.keyOne.duration;
      expect(duration.units).toBe("minute");
      expect(duration.value).toBe("1");
      expect(duration.override).toBe(true);
    });

    it("skips duration handling on activities without a duration", () => {
      const result = run();
      expect(result.system.activities.keyTwo.duration).toBeUndefined();
    });

    it("still clears consumption targets with clearTargets: false when consumption exists", () => {
      // characterization: the unconditional `a.consumption.targets = []` runs
      // before the clearTargets option is consulted, so clearTargets: false
      // cannot preserve targets on activities that have a consumption block
      const result = run({ clearTargets: false });
      expect(result.system.activities.keyOne.consumption.targets).toEqual([]);
    });

    it("creates consumption.targets on activities without consumption when clearTargets is set", () => {
      const result = run();
      expect(result.system.activities.keyTwo.consumption).toEqual({ targets: [], spellSlot: false });
    });

    it("keeps spellSlot with noSpellslot: false", () => {
      const result = run({ noSpellslot: false });
      expect(result.system.activities.keyOne.consumption.spellSlot).toBe(true);
    });

    it("filters activity damage parts by type and prunes the type lists", () => {
      const result = run({ filterActivityDamageTypes: ["fire"] });
      const parts = result.system.activities.keyOne.damage.parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].types).toEqual(["fire"]);
      expect(parts[0].number).toBe(1);
    });

    it("keeps all damage parts when filterActivityDamageTypes is empty", () => {
      const result = run();
      expect(result.system.activities.keyOne.damage.parts).toHaveLength(2);
    });
  });

  describe("system level mutations", () => {
    it("removes concentration from properties by default", () => {
      expect(run().system.properties).toEqual(["mgc"]);
    });

    it("supports custom removeProperties and addProperties", () => {
      const result = run({ removeProperties: ["mgc"], addProperties: ["ritual"] });
      expect(result.system.properties).toEqual(["concentration", "ritual"]);
    });

    it("does not add a properties key to systems without one", () => {
      const data = baseDocData();
      delete data.system.properties;
      const result = run({ addProperties: ["ritual"] }, data);
      expect(result.system.properties).toBeUndefined();
    });

    it("sets the spellcasting method to atwill with setToAtWill", () => {
      expect(run({ setToAtWill: true }).system.method).toBe("atwill");
      expect(run().system.method).toBe("spell");
    });

    it("renames the document with renameDocument", () => {
      expect(run({ renameDocument: "New Name" }).name).toBe("New Name");
      expect(run().name).toBe("Test Feature");
    });

    it("clears uses by default and keeps them with clearUses: false", () => {
      expect(run().system.uses).toEqual({ spent: null, max: null, recovery: [] });
      expect(run({ clearUses: false }).system.uses).toEqual({
        spent: 2, max: "3", recovery: [{ period: "lr", type: "recoverAll" }],
      });
    });

    it("overrides the level when the system has one", () => {
      expect(run({ level: 5 }).system.level).toBe(5);
    });

    it("ignores level for systems without a level key", () => {
      const data = baseDocData();
      delete data.system.level;
      expect(run({ level: 5 }, data).system.level).toBeUndefined();
    });

    it("sets the autoanimations kill flag with killAnimations", () => {
      const result = run({ killAnimations: true });
      expect(foundry.utils.getProperty(result, "flags.autoanimations.killAnim")).toBe(true);
    });
  });

  describe("document construction", () => {
    it("builds a CONFIG.Item.documentClass instance when returnDataOnly is false", () => {
      class FakeItem {
        data: any;

        context: any;

        constructor(data: any, context: any) {
          this.data = data;
          this.context = context;
        }
      }
      globalAny.CONFIG.Item = { documentClass: FakeItem };
      try {
        const parent = { id: "parentActor" };
        const result: any = DDBEffectHelper.documentWithFilteredActivities({
          document: makeItemDoc(baseDocData()),
          parent,
        });
        expect(result).toBeInstanceOf(FakeItem);
        expect(result.data.name).toBe("Test Feature");
        expect(result.context).toEqual({ parent });
      } finally {
        delete globalAny.CONFIG.Item;
      }
    });
  });
});
