import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { linkSelectedEnchantments } from "../../../src/parser/character/infusions";

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
  const collection = Object.assign(items, { get: (id: string) => items.find(item => item.id === id) });
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
    expect(createEffect).toHaveBeenCalledWith(
      { _id: effect._id, type: "enchantment", origin: activity.uuid },
      { parent: unarmed, keepOrigin: true, dnd5e: { enchantmentProfile: effect._id, activityId: activity._id } },
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
