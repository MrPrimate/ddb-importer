import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildRiderCopies, linkSelectedEnchantments, stableCopyId } from "../../../src/parser/character/infusions";

vi.mock("../../../src/lib/_module", () => ({ logger: { debug: vi.fn() } }));

const createEffect = vi.fn();
const activity = { _id: "enchantActivity", uuid: "Actor.actor.Item.source.Activity.enchantActivity" };
const effect = { _id: "enchantEffect", toObject: () => ({ _id: "enchantEffect", type: "enchantment" }) };
const naturalWeaponMatches = [
  { field: "type", value: "weapon" },
  { field: "system.type.value", value: "natural" },
];

function makeItem(id: string, type = "weapon", subtype?: string) {
  return {
    id,
    name: id,
    type,
    flags: { ddbimporter: {} },
    system: subtype ? { type: { value: subtype } } : {},
  };
}

function makeSource(selector: Partial<IDDBImporterTransferEnchantmentFlags>) {
  return {
    ...makeItem("source", "equipment"),
    flags: { ddbimporter: { transferEnchantment: {
      effectId: effect._id, activityId: activity._id, ...selector,
    } } },
    system: { activities: { getByType: () => [activity] } },
    getEmbeddedCollection: () => [effect],
  };
}

async function link(items: any[]) {
  const collection = Object.assign(items, { get: (id: string) => items.find((item) => item.id === id) });
  await linkSelectedEnchantments({ getEmbeddedCollection: () => collection } as unknown as Actor.Implementation);
}

describe("selected enchantment targets", () => {
  beforeEach(() => {
    createEffect.mockReset();
    vi.stubGlobal("ActiveEffect", { create: createEffect });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("enchants every matching natural weapon without targeting a leading subclass or other weapons", async () => {
    const unarmed = makeItem("Unarmed Strike", "weapon", "natural");
    const claws = makeItem("Claws", "weapon", "natural");
    await link([
      makeItem("Subclass", "subclass"),
      makeItem("Sword", "weapon", "martialM"),
      makeItem("Missing subtype"),
      makeItem("Non-weapon with subtype", "feat", "natural"),
      unarmed, claws,
      makeSource({ targetItemMatches: naturalWeaponMatches }),
    ]);

    expect(createEffect.mock.calls.map(([, operation]) => operation.parent)).toEqual([unarmed, claws]);
    // a stable id kept through creation, and no dnd5e options: the linker collects riders itself
    expect(createEffect).toHaveBeenCalledWith(
      { _id: "enchantEffecCp00", type: "enchantment", origin: activity.uuid },
      { parent: unarmed, keepId: true, keepOrigin: true },
    );
  });

  it.each([
    {},
    { targetItemMatches: [] },
    { targetItemMatches: naturalWeaponMatches },
    { targetItemId: "missing" },
    { targetItemName: "missing" },
  ])("does not fall back to an unrelated item for selector %j", async (selector) => {
    await link([makeItem("Subclass", "subclass"), makeSource(selector)]);
    expect(createEffect).not.toHaveBeenCalled();
  });

  it("preserves self enchantments used by Shifting", async () => {
    const source = makeSource({ targetItemId: "self" });
    await link([makeItem("Subclass", "subclass"), source]);
    expect(createEffect.mock.calls.map(([, operation]) => operation.parent)).toEqual([source]);
  });

  it("preserves explicit item ID targets", async () => {
    const target = makeItem("target");
    await link([makeItem("Subclass", "subclass"), target, makeSource({ targetItemId: target.id })]);
    expect(createEffect.mock.calls.map(([, operation]) => operation.parent)).toEqual([target]);
  });

  it("preserves legacy enchantment link IDs", async () => {
    const target = { ...makeItem("target"), flags: { ddbimporter: { enchantmentLinkId: "legacy" } } };
    await link([makeItem("Subclass", "subclass"), target, makeSource({ targetItemId: "legacy" })]);
    expect(createEffect.mock.calls.map(([, operation]) => operation.parent)).toEqual([target]);
  });

  it.each([{}, { originalName: "Unarmed Strike" }])("supports name targets and renamed items: %j", async (flags) => {
    const target = { ...makeItem(flags.originalName ? "Renamed attack" : "Unarmed Strike"), flags: { ddbimporter: flags } };
    await link([makeItem("Subclass", "subclass"), target, makeSource({ targetItemName: "Unarmed Strike" })]);
    expect(createEffect.mock.calls.map(([, operation]) => operation.parent)).toEqual([target]);
  });
});

/** Copies of a source on one item get the same id on every import, clear of the item's own ids. */
describe("stableCopyId", () => {
  it("derives a 16 character id from the source and skips taken ids", () => {
    const taken = new Set(["ddbPactSpellCp00"]);
    expect(stableCopyId("ddbPactSpellAtk1", taken)).toBe("ddbPactSpellCp01");
    expect(stableCopyId("ddbPactSpellAtk1", taken)).toBe("ddbPactSpellCp02");
    expect(stableCopyId("short", new Set())).toBe("short0000000Cp00");
  });
});

/**
 * Rider copies are built from the profile's stored rider ids with the data dnd5e 5.x's
 * createRiderEnchantments gives them, but under ids derived from their sources so a re-import
 * reproduces them.
 */
describe("buildRiderCopies", () => {
  /** A document stub whose toObject() hands out a fresh copy, as a live document does. */
  function doc(data: Record<string, any>, extra: Record<string, any> = {}) {
    return { ...extra, toObject: () => foundry.utils.deepClone(data) };
  }

  function shifting() {
    return {
      system: {
        activities: new Map<string, any>([
          ["shiftBeasthideac", doc({ _id: "shiftBeasthideac", name: "Shift Beasthide", type: "heal" }, { effects: [{ _id: "ddbBeasthideefII" }] })],
          ["ddblongtoothatta", doc({ _id: "ddblongtoothatta", name: "Longtooth Attack", type: "attack" })],
        ]),
      },
      effects: new Map<string, any>([
        ["ddbBeasthideefII", doc({ _id: "ddbBeasthideefII", name: "Shifted: Beasthide", flags: { dnd5e: { rider: { statuses: [] } } } })],
        ["activityOwnEff01", doc({ _id: "activityOwnEff01", name: "Longtooth Bite" })],
      ]),
    };
  }

  const effectOrigin = "Actor.a.Item.b.Activity.shiftCore";

  it("copies rider activities and effects onto the same item under ids that do not clash", () => {
    // the self-enchanting case: the origin is also the target, so copies must not reuse source ids
    const item = shifting();
    const { activities, effects } = buildRiderCopies({
      riders: { activity: new Set(["shiftBeasthideac"]), effect: new Set(["ddbBeasthideefII"]) },
      origin: item,
      target: item,
      appliedId: "choiceBeasthCp00",
      effectOrigin,
    });

    expect(Object.keys(activities)).toEqual(["shiftBeasthiCp00"]);
    expect(activities.shiftBeasthiCp00).toMatchObject({
      _id: "shiftBeasthiCp00",
      name: "Shift Beasthide",
      flags: { dnd5e: { dependentOn: "choiceBeasthCp00" } },
    });
    // the activity's own effect is already on the item, so only the profile rider is copied
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      _id: "ddbBeasthideCp00",
      name: "Shifted: Beasthide",
      origin: effectOrigin,
      flags: { dnd5e: { dependentOn: "choiceBeasthCp00" } },
    });
    expect(effects[0].flags?.dnd5e).not.toHaveProperty("rider");
  });

  it("skips rider ids the origin does not have", () => {
    const origin = shifting();
    const { activities, effects } = buildRiderCopies({
      riders: { activity: new Set(["missingActivity1", "ddblongtoothatta"]), effect: new Set(["missingEffect001"]) },
      origin,
      target: { system: { activities: new Map() }, effects: new Map() },
      appliedId: "choiceLongtCp00",
      effectOrigin,
    });
    expect(Object.keys(activities)).toEqual(["ddblongtoothCp00"]);
    expect(effects).toEqual([]);
  });

  it("carries a rider activity's own effects to another item once, under their own ids", () => {
    const origin = shifting();
    origin.system.activities.set("secondRiderActv1", doc(
      { _id: "secondRiderActv1", name: "Second" },
      { effects: [{ _id: "activityOwnEff01" }, { _id: "compendiumEffect", uuid: "Compendium.x.y.ActiveEffect.z" }] },
    ));
    origin.system.activities.set("thirdRiderActiv1", doc({ _id: "thirdRiderActiv1", name: "Third" }, { effects: [{ _id: "activityOwnEff01" }] }));

    const { effects } = buildRiderCopies({
      riders: { activity: new Set(["secondRiderActv1", "thirdRiderActiv1"]) },
      origin,
      target: { system: { activities: new Map() }, effects: new Map() },
      appliedId: "ddbPactWeapoCp00",
      effectOrigin,
    });
    expect(effects.map((effect) => effect._id)).toEqual(["activityOwnEff01"]);
    expect(effects[0].flags?.dnd5e).toMatchObject({ dependentOn: "ddbPactWeapoCp00" });

    const alreadyThere = buildRiderCopies({
      riders: { activity: new Set(["secondRiderActv1"]) },
      origin,
      target: { system: { activities: new Map() }, effects: new Map([["activityOwnEff01", {}]]) },
      appliedId: "ddbPactWeapoCp00",
      effectOrigin,
    });
    expect(alreadyThere.effects).toEqual([]);
  });

  it("gives the same ids on every run", () => {
    const run = () => {
      const item = shifting();
      return buildRiderCopies({
        riders: { activity: new Set(["shiftBeasthideac", "ddblongtoothatta"]), effect: new Set(["ddbBeasthideefII"]) },
        origin: item,
        target: item,
        appliedId: "choiceBeasthCp00",
        effectOrigin,
      });
    };
    const first = run();
    const second = run();
    expect(Object.keys(second.activities)).toEqual(Object.keys(first.activities));
    expect(second.effects.map((effect) => effect._id)).toEqual(first.effects.map((effect) => effect._id));
  });
});
