// Characterization tests for the enricher activity-override engine:
// _applyActivityDataOverride (the contract enricher consolidation must
// preserve), applyActivityOverride, addDocumentOverride and
// addDocumentAdvancements. These pin CURRENT behavior, oddities included.

// Mutable module-state for the enricher effects barrel mock; the midi branches
// in _applyActivityDataOverride gate on AutoEffects.effectModules().
const effectModulesState = vi.hoisted(() => ({ midiQolInstalled: false }));

// Heavy companion/summons machinery is irrelevant to the override surface.
vi.mock("../../../src/parser/companions/DDBSummonsManager", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/companions/types/TransformProfiles", () => ({
  resolveTransformProfileUuids: vi.fn(),
}));
vi.mock("../../../src/parser/enrichers/effects/_module", () => ({
  AutoEffects: {
    effectModules: () => ({ midiQolInstalled: effectModulesState.midiQolInstalled }),
    forceDocumentEffect: (data: any) => data,
    addVision5eStub: (data: any) => data,
  },
  EnchantmentEffects: {},
  ChangeHelper: {},
  EffectGenerator: {},
}));
// Break the load cycle mixin -> parser/lib -> DDBClass -> AdvancementHelper ->
// DDBBasicActivity -> enrichers/_module -> DDBGenericEnricher -> mixin (TDZ).
vi.mock("../../../src/parser/advancements/AdvancementHelper", () => ({
  default: class {},
}));
// The enrichers barrel re-exports every concrete enricher, all of which extend
// the mixin under test; loading it mid-cycle hits the TDZ. Stub every name the
// codebase imports from the barrel with an inert class.
vi.mock("../../../src/parser/enrichers/_module", () => ({
  DDBBackgroundEnricher: class {},
  DDBClassFeatureEnricher: class {},
  DDBFeatEnricher: class {},
  DDBGenericEnricher: class {},
  DDBItemEnricher: class {},
  DDBMonsterFeatureEnricher: class {},
  DDBSpeciesTraitEnricher: class {},
  DDBSpellEnricher: class {},
  Effects: {},
  GenericEnrichers: {},
  mixins: {},
}));

import { resolveTransformProfileUuids } from "../../../src/parser/companions/types/TransformProfiles";
import DDBEnricherFactoryMixin from "../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin";

afterEach(() => {
  effectModulesState.midiQolInstalled = false;
  vi.mocked(resolveTransformProfileUuids).mockClear();
});

class TestEnricher extends DDBEnricherFactoryMixin<string> {

  ENRICHERS: Record<string, any> = {};

  FALLBACK_ENRICHERS: Record<string, any> = {};

}

function makeDocument(fields: Record<string, any> = {}): any {
  return {
    _id: "docid1234567890",
    name: "Test Feature",
    flags: { ddbimporter: {} },
    system: {
      description: { value: "Base description.", chat: "" },
    },
    ...fields,
  };
}

function makeEnricher(fields: Record<string, any> = {}): any {
  const enricher: any = new TestEnricher();
  Object.assign(enricher, {
    name: "Test Feature",
    is2014: false,
    is2024: true,
    isCustomAction: false,
    loadedEnricher: null,
    manager: null,
    ddbParser: {},
    document: makeDocument(),
  }, fields);
  return enricher;
}

// Plain object shaped like dnd5e activity data; only the paths the override
// engine touches need to exist.
function makeActivity(overrides: Record<string, any> = {}): any {
  const base: any = {
    _id: "activityAbc12345",
    type: "utility",
    activation: { type: "action", value: 1, condition: "" },
    consumption: { targets: [], scaling: { allowed: false, max: "" }, spellSlot: true },
    damage: { parts: [] },
    range: { value: null, units: "", special: "" },
    target: {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
    },
    uses: { spent: 0, max: "" },
  };
  return foundry.utils.mergeObject(base, overrides);
}

// =============================================================================
// _applyActivityDataOverride
// =============================================================================
describe("DDBEnricherFactoryMixin._applyActivityDataOverride", () => {
  it("passes an activity through untouched for an empty override", async () => {
    const e = makeEnricher();
    const activity = makeActivity();
    const before = foundry.utils.deepClone(activity);
    const result = await e._applyActivityDataOverride(activity, {});
    expect(result).toBe(activity);
    expect(result).toEqual(before);
  });

  it("applies name and id overrides", async () => {
    const e = makeEnricher();
    const activity = makeActivity();
    await e._applyActivityDataOverride(activity, { name: "Renamed", id: "newIdAbcdef12345" });
    expect(activity.name).toBe("Renamed");
    expect(activity._id).toBe("newIdAbcdef12345");
  });

  describe("parent overrides", () => {
    it("merges a parent whose lookupName matches the document", async () => {
      const e = makeEnricher();
      foundry.utils.setProperty(e.document, "flags.ddbimporter.dndbeyond.lookupName", "Eldritch Cannon");
      const activity = makeActivity({ activation: { type: "action", value: 3, condition: "old" } });
      await e._applyActivityDataOverride(activity, {
        name: "Base Name",
        parent: [
          { lookupName: "Eldritch Cannon", activationType: "bonus", name: "Parent Name" },
          { lookupName: "Other Thing", activationType: "reaction" },
        ],
      });
      expect(activity.activation).toEqual({ type: "bonus", value: 3, condition: "old" });
      // Oddity pinned: name/id are applied BEFORE the parent merge, so a
      // parent-supplied name never reaches the activity.
      expect(activity.name).toBe("Base Name");
    });

    it("ignores parents whose lookupName does not match", async () => {
      const e = makeEnricher();
      foundry.utils.setProperty(e.document, "flags.ddbimporter.dndbeyond.lookupName", "Something Else");
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, {
        parent: [{ lookupName: "Eldritch Cannon", activationType: "bonus" }],
      });
      expect(activity.activation).toEqual({ type: "action", value: 1, condition: "" });
    });
  });

  describe("consumption overrides", () => {
    it("clears consumption targets with noConsumeTargets", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ consumption: { targets: [{ type: "itemUses" }] } });
      await e._applyActivityDataOverride(activity, { noConsumeTargets: true });
      expect(activity.consumption.targets).toEqual([]);
    });

    it("addItemConsume REPLACES existing targets with a default itemUses target", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ consumption: { targets: [{ type: "spellSlots" }] } });
      await e._applyActivityDataOverride(activity, { addItemConsume: true });
      expect(activity.consumption.targets).toEqual([{
        type: "itemUses",
        target: "",
        value: "1",
        scaling: { mode: "", formula: "" },
      }]);
      expect(foundry.utils.getProperty(e.document, "flags.ddbimporter.replaceActivityUses")).toBeUndefined();
    });

    it("addItemConsume honours target/value/scaling hints and flags replaceActivityUses", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, {
        addItemConsume: true,
        itemConsumeTargetName: "Wand of Winter",
        itemConsumeValue: "2",
        addScalingMode: "amount",
        addScalingFormula: "1",
      });
      expect(activity.consumption.targets).toEqual([{
        type: "itemUses",
        target: "Wand of Winter",
        value: "2",
        scaling: { mode: "amount", formula: "1" },
      }]);
      expect(foundry.utils.getProperty(e.document, "flags.ddbimporter.replaceActivityUses")).toBe(true);
    });

    it("addActivityConsume APPENDS an activityUses target", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ consumption: { targets: [{ type: "itemUses", target: "x" }] } });
      await e._applyActivityDataOverride(activity, {
        addActivityConsume: true,
        activityConsumeValue: "3",
        addActivityScalingMode: "amount",
        addActivityScalingFormula: "2",
      });
      expect(activity.consumption.targets).toEqual([
        { type: "itemUses", target: "x" },
        { type: "activityUses", target: "", value: "3", scaling: { mode: "amount", formula: "2" } },
      ]);
    });

    it("addSpellSlotConsume APPENDS a spellSlots target with defaults", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { addSpellSlotConsume: true });
      expect(activity.consumption.targets).toEqual([
        { type: "spellSlots", target: "", value: "1", scaling: { mode: "", formula: "" } },
      ]);
    });

    it("appends additionalConsumptionTargets after generated ones", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      const extra = { type: "material", target: "ammo", value: "1", scaling: { mode: "", formula: "" } };
      await e._applyActivityDataOverride(activity, {
        addItemConsume: true,
        additionalConsumptionTargets: [extra],
      });
      expect(activity.consumption.targets).toHaveLength(2);
      expect(activity.consumption.targets[1]).toEqual(extra);
    });

    it("sets consumption scaling from addConsumptionScalingMax", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { addConsumptionScalingMax: "3" });
      expect(activity.consumption.scaling).toEqual({ allowed: true, max: "3" });
    });

    it("disables spell slot consumption for removeSpellSlotConsume and noSpellslot", async () => {
      const e = makeEnricher();
      const a1 = makeActivity();
      await e._applyActivityDataOverride(a1, { removeSpellSlotConsume: true });
      expect(a1.consumption.spellSlot).toBe(false);

      const a2 = makeActivity();
      await e._applyActivityDataOverride(a2, { noSpellslot: true });
      expect(a2.consumption.spellSlot).toBe(false);
    });
  });

  describe("target and range overrides", () => {
    it("targetSelf sets the affects type only", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { targetSelf: true });
      expect(activity.target.affects.type).toBe("self");
      expect(activity.target.prompt).toBe(true);
    });

    it("targetType updates existing affects in place and keeps a set range", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ range: { value: 30, units: "ft", special: "" } });
      await e._applyActivityDataOverride(activity, {
        targetType: "ally",
        targetCount: "2",
        targetChoice: true,
      });
      expect(activity.target.affects).toEqual({ count: "2", type: "ally", choice: true, special: "" });
      // template untouched
      expect(activity.target.template.units).toBe("ft");
      // range untouched because units were already set
      expect(activity.range).toEqual({ value: 30, units: "ft", special: "" });
    });

    it("targetType replaces the whole target when no affects exist and defaults empty range to self", async () => {
      const e = makeEnricher();
      const activity: any = {
        _id: "activityAbc12345",
        type: "utility",
        range: { value: null, units: "", special: "" },
      };
      await e._applyActivityDataOverride(activity, { targetType: "creature" });
      expect(activity.target).toEqual({
        template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
        affects: { count: "", type: "creature", choice: false, special: "" },
        prompt: true,
      });
      expect(activity.range).toEqual({ value: null, units: "self", special: "" });
    });

    it("rangeType replaces the whole range object", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ range: { value: 5, units: "spec", special: "existing" } });
      await e._applyActivityDataOverride(activity, { rangeType: "ft", rangeValue: 60 });
      expect(activity.range).toEqual({ value: 60, units: "ft", special: "" });
    });

    it("rangeSelf forces a self range", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ range: { value: 30, units: "ft", special: "" } });
      await e._applyActivityDataOverride(activity, { rangeSelf: true });
      expect(activity.range).toEqual({ value: null, units: "self", special: "" });
    });

    it("noTemplate resets the template and disables the prompt", async () => {
      const e = makeEnricher();
      const activity = makeActivity({
        target: { template: { count: "1", type: "radius", size: "20", units: "ft" } },
      });
      await e._applyActivityDataOverride(activity, { noTemplate: true });
      expect(activity.target.template).toEqual({
        count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft",
      });
      expect(activity.target.prompt).toBe(false);
    });

    it("sets the override booleans for template, target, range and activation", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, {
        overrideTemplate: true,
        overrideRange: true,
        overrideActivation: true,
      });
      expect(activity.target.override).toBe(true);
      expect(activity.range.override).toBe(true);
      expect(activity.activation.override).toBe(true);

      const viaTarget = makeActivity();
      await e._applyActivityDataOverride(viaTarget, { overrideTarget: true });
      expect(viaTarget.target.override).toBe(true);
    });
  });

  describe("activation overrides", () => {
    it("activationType rebuilds activation, preserving existing value and condition", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ activation: { type: "action", value: 3, condition: "old" } });
      await e._applyActivityDataOverride(activity, { activationType: "reaction" });
      expect(activity.activation).toEqual({ type: "reaction", value: 3, condition: "old" });
    });

    it("activationType uses supplied value and condition when given", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, {
        activationType: "bonus",
        activationValue: 2,
        activationCondition: "when raging",
      });
      expect(activity.activation).toEqual({ type: "bonus", value: 2, condition: "when raging" });
    });

    it("applies activationValue and activationCondition without a type change", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { activationValue: 4, activationCondition: "on hit" });
      expect(activity.activation).toEqual({ type: "action", value: 4, condition: "on hit" });
    });
  });

  describe("midi reaction overrides", () => {
    it("does nothing when midi-qol is not installed", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { midiManualReaction: true, midiUseCondition: "1 == 1" });
      expect(activity.useConditionText).toBeUndefined();
    });

    it("sets useConditionText per reaction hint when midi-qol is installed", async () => {
      effectModulesState.midiQolInstalled = true;
      const e = makeEnricher();
      const cases: [Record<string, any>, string][] = [
        [{ midiManualReaction: true }, "false"],
        [{ midiDamageReaction: true }, "reaction == 'isDamaged'"],
        [{ midiHealingReaction: true }, "reaction == 'isHealed'"],
        [{ midiSaveReaction: true }, "reaction == 'isSaveFail'"],
        [{ midiUseCondition: "workflow.foo" }, "workflow.foo"],
      ];
      for (const [override, expected] of cases) {
        const activity = makeActivity();
        await e._applyActivityDataOverride(activity, override);
        expect(activity.useConditionText, JSON.stringify(override)).toBe(expected);
      }
    });
  });

  describe("attack and damage overrides", () => {
    it("flatAttack sets a flat attack bonus, including falsy values", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { flatAttack: "0" });
      expect(activity.attack).toEqual({ bonus: "0", flat: true });
    });

    it("removeDamageParts clears then damageParts re-adds in the same pass", async () => {
      const e = makeEnricher();
      const activity = makeActivity({ damage: { parts: [{ number: 1, denomination: 6, types: ["fire"] }] } });
      const newPart = { number: 2, denomination: 8, types: ["cold"] };
      await e._applyActivityDataOverride(activity, { removeDamageParts: true, damageParts: [newPart] });
      expect(activity.damage.parts).toEqual([newPart]);
    });

    it("damageParts concatenates onto existing parts", async () => {
      const e = makeEnricher();
      const existing = { number: 1, denomination: 4, types: ["acid"] };
      const added = { number: 1, denomination: 10, types: ["radiant"] };
      const activity = makeActivity({ damage: { parts: [existing] } });
      await e._applyActivityDataOverride(activity, { damageParts: [added] });
      expect(activity.damage.parts).toEqual([existing, added]);
    });

    it("allowCritical enables damage.critical.allow", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { allowCritical: true });
      expect(activity.damage.critical.allow).toBe(true);
    });
  });

  describe("summon overrides", () => {
    it("sets midiProperties for a summon type override and forwards profileKeys to the manager", async () => {
      const addProfilesToActivity = vi.fn();
      const e = makeEnricher({ manager: { addProfilesToActivity } });
      const activity = makeActivity();
      const summons = { match: { proficiency: true } };
      await e._applyActivityDataOverride(activity, {
        type: "summon",
        profileKeys: ["ArtificerCannon"],
        summons,
      });
      expect(activity.midiProperties).toEqual({ autoTargetAction: "none", confirmTargets: "never" });
      expect(addProfilesToActivity).toHaveBeenCalledWith(activity, ["ArtificerCannon"], summons);
    });

    it("skips profileKeys when there is no manager but still sets summon midiProperties", async () => {
      const e = makeEnricher({ manager: null });
      const activity = makeActivity({ type: "summon" });
      await e._applyActivityDataOverride(activity, { profileKeys: ["ArtificerCannon"] });
      expect(activity.midiProperties).toEqual({ autoTargetAction: "none", confirmTargets: "never" });
    });
  });

  describe("data merge overrides", () => {
    it("deep merges data with dotted-key expansion and wholesale array replacement", async () => {
      const e = makeEnricher();
      const activity = makeActivity({
        damage: { parts: [{ number: 1, denomination: 6 }], critical: { allow: false } },
        uses: { spent: 0, max: "3" },
      });
      const result = await e._applyActivityDataOverride(activity, {
        data: {
          "damage.parts": [{ number: 2, denomination: 8 }],
          uses: { max: "5" },
          inserted: { a: 1 },
        },
      });
      // dotted key expanded and merged into the existing damage object
      expect(result.damage.parts).toEqual([{ number: 2, denomination: 8 }]);
      expect(result.damage.critical).toEqual({ allow: false });
      // nested objects merge key-wise
      expect(result.uses).toEqual({ spent: 0, max: "5" });
      // new top-level keys inserted
      expect(result.inserted).toEqual({ a: 1 });
      // merge is in place
      expect(result).toBe(activity);
    });

    it("accepts data as a function", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      const result = await e._applyActivityDataOverride(activity, {
        data: () => ({ name: "From Function" }),
      });
      expect(result.name).toBe("From Function");
    });
  });

  describe("misc overrides", () => {
    it("resolves transform profile uuids for empty-mode transform activities", async () => {
      const e = makeEnricher({ is2014: true });
      const profiles: any[] = [{ name: "Wolf" }];
      const activity = makeActivity({ type: "transform", transform: { mode: "" }, profiles });
      await e._applyActivityDataOverride(activity, {});
      expect(resolveTransformProfileUuids).toHaveBeenCalledWith({ profiles, is2014: true });

      vi.mocked(resolveTransformProfileUuids).mockClear();
      const modeSet = makeActivity({ type: "transform", transform: { mode: "cr" }, profiles });
      await e._applyActivityDataOverride(modeSet, {});
      expect(resolveTransformProfileUuids).not.toHaveBeenCalled();
    });

    it("routes addSpellUuid through the cast activity spell lookup with the 2024 flag", async () => {
      const e = makeEnricher({ is2024: true });
      e._addCompendiumSpellToCastActivity = vi.fn(async (_spell: string, activity: any) => activity);
      const activity = makeActivity({ type: "cast" });
      await e._applyActivityDataOverride(activity, { addSpellUuid: "Fireball" });
      expect(e._addCompendiumSpellToCastActivity).toHaveBeenCalledWith("Fireball", activity, { use2024Spells: true });
    });

    it("allowMagical sets restrictions.allowMagical", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { allowMagical: true });
      expect(activity.restrictions.allowMagical).toBe(true);
    });

    it("noeffect flags the activity and records the document id under noEffectIds", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { noeffect: true });
      expect(foundry.utils.getProperty(activity, "flags.ddbimporter.noeffect")).toBe(true);
      expect(foundry.utils.getProperty(e.document, "flags.ddbimporter.noEffectIds")).toEqual(["docid1234567890"]);
    });

    it("noeffect seeds ids from the (never-written) noeffect flag, not noEffectIds", async () => {
      // Oddity pinned: ids are READ from flags.ddbimporter.noeffect but WRITTEN
      // to flags.ddbimporter.noEffectIds, so repeated applications do not
      // accumulate ids. Same pattern exists in DDBBasicActivity. REPORTED.
      const e = makeEnricher();
      foundry.utils.setProperty(e.document, "flags.ddbimporter.noeffect", ["previousId"]);
      foundry.utils.setProperty(e.document, "flags.ddbimporter.noEffectIds", ["ignoredId"]);
      const activity = makeActivity();
      await e._applyActivityDataOverride(activity, { noeffect: true });
      expect(foundry.utils.getProperty(e.document, "flags.ddbimporter.noEffectIds"))
        .toEqual(["previousId", "docid1234567890"]);
    });

    it("invokes the override func hook with the activity after all other overrides", async () => {
      const e = makeEnricher();
      const activity = makeActivity();
      const func = vi.fn(async ({ activity: act }: { activity: any }) => {
        act.custom = act.name;
      });
      await e._applyActivityDataOverride(activity, { name: "Hooked", func });
      expect(func).toHaveBeenCalledTimes(1);
      expect(activity.custom).toBe("Hooked");
    });
  });
});

// =============================================================================
// applyActivityOverride
// =============================================================================
describe("DDBEnricherFactoryMixin.applyActivityOverride", () => {
  it("returns the activity untouched and records originalActivity when no hint is loaded", async () => {
    const e = makeEnricher({ loadedEnricher: null });
    const activity = makeActivity();
    const before = foundry.utils.deepClone(activity);
    const result = await e.applyActivityOverride(activity);
    expect(result).toBe(activity);
    expect(result).toEqual(before);
    expect(e.originalActivity).toBe(activity);
  });

  it("applies the loaded enricher's activity hint", async () => {
    const e = makeEnricher({
      loadedEnricher: { activity: { name: "Hinted", targetSelf: true } },
    });
    const activity = makeActivity();
    const result = await e.applyActivityOverride(activity);
    expect(result.name).toBe("Hinted");
    expect(result.target.affects.type).toBe("self");
    expect(e.originalActivity).toBe(activity);
  });
});

// =============================================================================
// addDocumentAdvancements
// =============================================================================
describe("DDBEnricherFactoryMixin.addDocumentAdvancements", () => {
  it("keys advancements by _id, flattening nested arrays and skipping id-less entries", async () => {
    const e = makeEnricher({
      document: makeDocument({ system: { advancement: null } }),
    });
    const advA = { _id: "advA", type: "ScaleValue" };
    const advB = { _id: "advB", type: "ItemGrant" };
    const noId = { type: "Broken" };
    const result = await e.addDocumentAdvancements([advA, [advB, noId]] as any);
    expect(result).toBe(e.document);
    expect(result.system.advancement).toEqual({ advA, advB });
  });

  it("returns the document unchanged when system has no advancement key", async () => {
    const e = makeEnricher({ document: makeDocument({ system: {} }) });
    const result = await e.addDocumentAdvancements([{ _id: "advA", type: "ScaleValue" }] as any);
    expect(result).toBe(e.document);
    expect("advancement" in result.system).toBe(false);
  });

  it("falls back to the loaded enricher's additionalAdvancements", async () => {
    const adv = { _id: "advC", type: "ScaleValue" };
    const e = makeEnricher({
      document: makeDocument({ system: { advancement: {} } }),
      loadedEnricher: { additionalAdvancements: [adv] },
    });
    const result = await e.addDocumentAdvancements();
    expect(result.system.advancement).toEqual({ advC: adv });
  });
});

// =============================================================================
// addDocumentOverride
// =============================================================================
describe("DDBEnricherFactoryMixin.addDocumentOverride", () => {
  function makeOverrideEnricher(override: Record<string, any>, docFields: Record<string, any> = {}): any {
    return makeEnricher({
      document: makeDocument(docFields),
      loadedEnricher: { override },
    });
  }

  it("returns the document untouched with no override hint", async () => {
    const e = makeEnricher({ loadedEnricher: null });
    const before = foundry.utils.deepClone(e.document);
    const result = await e.addDocumentOverride();
    expect(result).toBe(e.document);
    expect(result).toEqual(before);
  });

  it("removeDamage resets the base damage only when the system has damage", async () => {
    const e = makeOverrideEnricher({ removeDamage: true }, {
      system: { description: { value: "", chat: "" }, damage: { base: { number: 2, denomination: 6 } } },
    });
    const result = await e.addDocumentOverride();
    expect(result.system.damage.base).toEqual({
      number: null,
      denomination: null,
      bonus: "",
      types: [],
      custom: { enabled: false, formula: "" },
      scaling: { mode: "whole", number: null, formula: "" },
    });

    const noDamage = makeOverrideEnricher({ removeDamage: true });
    const untouched = await noDamage.addDocumentOverride();
    expect("damage" in untouched.system).toBe(false);
  });

  it("sets the ddbimporter flag family from the retain/replace hints", async () => {
    const e = makeOverrideEnricher({
      replaceActivityUses: true,
      forceSpellAdvancement: true,
      retainResourceConsumption: true,
      retainOriginalConsumption: true,
      retainChildUses: true,
      retainUseSpent: true,
      ignoredConsumptionActivities: ["Second Wind"],
    });
    const result = await e.addDocumentOverride();
    expect(result.flags.ddbimporter).toMatchObject({
      replaceActivityUses: true,
      forceSpellAdvancement: true,
      retainResourceConsumption: true,
      retainOriginalConsumption: true,
      retainChildUses: true,
      retainUseSpent: true,
      ignoredConsumptionActivities: ["Second Wind"],
    });
  });

  it("applies rangeSelf and noTemplate to the document system", async () => {
    const e = makeOverrideEnricher({ rangeSelf: true, noTemplate: true });
    const result = await e.addDocumentOverride();
    expect(result.system.range).toEqual({ value: null, units: "self", special: "" });
    expect(result.system.target.template).toEqual({
      count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft",
    });
  });

  it("sets uses wholesale and merges data over the document", async () => {
    const uses = { spent: 0, max: "2", recovery: [] };
    const e = makeOverrideEnricher({
      uses,
      data: { name: "Overridden Name", "system.requirements": "Level 5" },
    });
    const result = await e.addDocumentOverride();
    expect(result.system.uses).toEqual(uses);
    expect(result.name).toBe("Overridden Name");
    expect(result.system.requirements).toBe("Level 5");
    // the untouched description survives the merge
    expect(result.system.description.value).toBe("Base description.");
  });

  it("leaves parser generated uses alone when the uses override is empty", async () => {
    const parsed = { spent: 1, max: "4" };
    const e = makeOverrideEnricher({ uses: {} }, {
      system: { description: { value: "Base description.", chat: "" }, uses: parsed },
    });
    const result = await e.addDocumentOverride();
    expect(result.system.uses).toEqual(parsed);
  });

  it("appends descriptionSuffix to value, and to chat only when chat is non-empty", async () => {
    const emptyChat = makeOverrideEnricher({ descriptionSuffix: "<p>More.</p>" });
    const r1 = await emptyChat.addDocumentOverride();
    expect(r1.system.description.value).toBe("Base description.<p>More.</p>");
    expect(r1.system.description.chat).toBe("");

    const withChat = makeOverrideEnricher({ descriptionSuffix: "<p>More.</p>" }, {
      system: { description: { value: "V", chat: "C" } },
    });
    const r2 = await withChat.addDocumentOverride();
    expect(r2.system.description.value).toBe("V<p>More.</p>");
    expect(r2.system.description.chat).toBe("C<p>More.</p>");
  });

  it("appends the ddb macro description block", async () => {
    const e = makeEnricher({
      loadedEnricher: {
        override: { ddbMacroDescription: true },
        ddbMacroDescriptionData: { name: "fn", type: "feat" },
      },
    });
    const result = await e.addDocumentOverride();
    expect(result.system.description.value).toBe(
      "Base description.<hr><div class=\"ddb-macros-container\"><p>[[/ddbifunc functionName=\"fn\" functionType=\"feat\"]]</div></p></div>",
    );
  });

  it("invokes the override func hook with the enricher", async () => {
    const func = vi.fn(async ({ enricher }: { enricher: any }) => {
      enricher.data.name = "Renamed By Func";
    });
    const e = makeOverrideEnricher({ func });
    const result = await e.addDocumentOverride();
    expect(func).toHaveBeenCalledTimes(1);
    expect(result.name).toBe("Renamed By Func");
  });
});
