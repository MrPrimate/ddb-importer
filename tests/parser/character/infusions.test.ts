import { afterEach, describe, expect, it, vi } from "vitest";
import { linkSelectedEnchantment, matchFields } from "../../../src/parser/character/infusions";

/**
 * `targetItemMatches` clauses on a transferEnchantment flag: scalar fields compare strictly,
 * array fields (the weapon's scraped classFeatures) match by membership.
 */
describe("matchFields", () => {
  const weapon = {
    type: "weapon",
    system: { type: { value: "martialM" } },
    flags: { ddbimporter: { dndbeyond: { classFeatures: ["pactWeapon", "OffHand"] } } },
  } as unknown as TAll5eDocuments;

  it("matches scalar fields with strict equality", () => {
    expect(matchFields(weapon, [{ field: "type", value: "weapon" }])).toBe(true);
    expect(matchFields(weapon, [{ field: "system.type.value", value: "simpleM" }])).toBe(false);
  });

  it("matches an array field when it contains the value", () => {
    expect(matchFields(weapon, [{ field: "flags.ddbimporter.dndbeyond.classFeatures", value: "pactWeapon" }])).toBe(true);
    expect(matchFields(weapon, [{ field: "flags.ddbimporter.dndbeyond.classFeatures", value: "hexWarrior" }])).toBe(false);
  });

  it("fails when the field is missing or any clause fails", () => {
    expect(matchFields(weapon, [{ field: "flags.ddbimporter.pactWeapon", value: true }])).toBe(false);
    expect(matchFields(weapon, [
      { field: "type", value: "weapon" },
      { field: "flags.ddbimporter.dndbeyond.classFeatures", value: "kenseiWeapon" },
    ])).toBe(false);
  });
});

/**
 * The import-time enchantment linker creates the copy dnd5e 5.3 treats as applied: an enchantment
 * counts as applied once its origin differs from the item it sits on, so the clone only needs the
 * activity origin. The shape mirrors 5.3's `applyEnchantment`.
 */
describe("linkSelectedEnchantment", () => {
  const originalActiveEffect = (globalThis as any).ActiveEffect;

  afterEach(() => {
    (globalThis as any).ActiveEffect = originalActiveEffect;
  });

  function install() {
    const create = vi.fn(async (data: any, _operation?: any) => data);
    (globalThis as any).ActiveEffect = { create };
    return create;
  }

  const profile = {
    _id: "ddbPactWeaponEf1",
    name: "Pact Weapon",
    type: "enchantment",
    transfer: false,
    disabled: false,
    origin: null,
    duration: { value: null, units: "seconds", expiry: null },
    flags: { dae: { transfer: false } },
    system: { changes: [{ key: "system.proficient", type: "override", value: "1" }] },
  };
  const effect = { id: profile._id, toObject: () => foundry.utils.deepClone(profile) } as any;
  const item = { name: "Longsword" } as any;

  it("creates a copy carrying the activity origin and profile id", async () => {
    const create = install();
    const activity = { _id: "ddbForgePactWpn1", uuid: "Actor.a.Item.b.Activity.ddbForgePactWpn1" };

    await linkSelectedEnchantment(item, effect, activity, "Pact of the Blade");

    expect(create).toHaveBeenCalledTimes(1);
    const [data, operation] = create.mock.calls[0];
    expect(data).toMatchObject({
      transfer: false,
      disabled: false,
      origin: activity.uuid,
      system: { changes: profile.system.changes },
    });
    expect(data.duration).toEqual(profile.duration);
    expect(operation).toMatchObject({
      parent: item,
      keepOrigin: true,
      dnd5e: { enchantmentProfile: "ddbPactWeaponEf1", activityId: "ddbForgePactWpn1" },
    });
  });
});
