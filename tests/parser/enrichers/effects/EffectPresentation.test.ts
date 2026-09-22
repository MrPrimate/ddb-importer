import EffectPresentation from "../../../../src/parser/enrichers/effects/EffectPresentation";
import EnchantmentEffects from "../../../../src/parser/enrichers/effects/EnchantmentEffects";

function document(activities: Record<string, unknown> = {}, standalone: I5eEffectData[] = []) {
  return {
    name: "Area probe", type: "feat", img: "icons/svg/aura.svg",
    system: { activities, description: { value: "Area description." } },
    effects: [
      { _id: "first", name: "First", showIcon: 1, transfer: false, description: "Keep this description." },
      { _id: "second", name: "Second", showIcon: 1 },
      { _id: "passive", name: "Unrelated passive", showIcon: 1, transfer: true },
    ],
    flags: { ddbimporter: { standaloneEffects: standalone } },
  } as unknown as I5eFeatItem;
}

function behavior(config: I5eActivityBehaviorMacroConfig) {
  return { type: "ddbMacro", config: { function: "useActivity", ...config } };
}

describe("area effect icons", () => {
  it.each(["Area buff", "standalone", "Compendium.ddb.effects.ActiveEffect.standalone"])("shows a region effect referenced by %s", (reference) => {
    const buff: I5eEffectData = { _id: "standalone", name: "Area buff", showIcon: 1 };
    const doc = document({ place: { behaviors: [{ type: "applyActiveEffect", config: { effects: [reference] } }] } }, [buff]);
    EffectPresentation.applyIconVisibility(doc);
    expect(buff.showIcon).toBe(2);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([1, 1, 1]);
  });

  it("shows effects linked directly to a template without altering their mechanics or descriptions", () => {
    const doc = document({ cast: { target: { template: { type: "radius" } }, effects: [{ _id: "first" }] } });
    const before = foundry.utils.deepClone(doc.effects!);
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects).toEqual([{ ...before[0], showIcon: 2 }, ...before.slice(1)]);
  });

  it.each([
    { activity: "save" }, { args: { activityId: "save" } }, { args: { activityName: "Area Save" } },
  ])("shows a template-free region follow-up selected by %j", (config) => {
    const doc = document({
      place: { behaviors: [behavior(config)] },
      save: { _id: "save", name: "Area Save (Constitution)", effects: [{ _id: "first" }] },
      other: { _id: "other", name: "Unrelated Save", effects: [{ _id: "second" }] },
    });
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([2, 1, 1]);
  });

  it("shows every named variant and owner-turn choice, including alternatives to an explicit activity id", () => {
    const doc = document({
      place: { behaviors: [behavior({ ownerTurn: true, activity: "base", args: { activityChoices: ["Alternative"] } })] },
      base: { _id: "base", name: "Base", effects: [{ _id: "first" }] },
      choice: { _id: "choice", name: "Alternative", effects: [{ _id: "second" }] },
      variant: { _id: "variant", name: "Alternative (Variant)", effects: [{ _id: "passive" }] },
    });
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([2, 2, 2]);
  });

  it("handles a region reusing its placing activity", () => {
    const doc = document({ place: { behaviors: [behavior({})], effects: [{ _id: "first" }] } });
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([2, 1, 1]);
  });

  it("includes a transferring rider applied alongside a template's enchantment", () => {
    const doc = document({
      cast: { target: { template: { type: "circle" } }, effects: [{ _id: "first", riders: { effect: ["second"] } }] },
    });
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([2, 2, 1]);
  });

  it("does not infer recipients from arbitrary macros or unrelated manual activities", () => {
    const doc = document({
      place: { behaviors: [behavior({ function: "executeMacro", args: { activityName: "Manual" } })] },
      manual: { name: "Manual", effects: [{ _id: "first" }] },
    });
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([1, 1, 1]);
  });

  it("includes Aura Effects and AC5e aura arms without a native region", () => {
    const doc = document();
    Object.assign(doc.effects![0], { type: "auraeffects.aura" });
    doc.effects![1].system = { changes: [{ type: "ac5e", key: "flags.automated-conditions-5e.aura.save.bonus", value: "bonus=3" }] };
    EffectPresentation.applyIconVisibility(doc);
    expect(doc.effects?.map((effect) => effect.showIcon)).toEqual([2, 2, 1]);
  });

  it("keeps an explicitly requested enchantment icon", () => {
    expect(EnchantmentEffects.EnchantmentEffect(document(), "Ablaze", { showIcon: 2 }).showIcon).toBe(2);
  });
});

describe("paladin aura icons", () => {
  it("includes self and standalone effects without a placing activity", () => {
    const doc = document({}, [{ _id: "area", name: "Area buff", showIcon: 1 }]);
    EffectPresentation.applyIconVisibility(doc, { paladinAura: true });
    expect(doc.effects?.every((effect) => effect.showIcon === 2)).toBe(true);
    expect(doc.flags?.ddbimporter?.standaloneEffects?.[0].showIcon).toBe(2);
  });
});
