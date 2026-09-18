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
 * The import-time enchantment linker must create the copy dnd5e 6.0 treats as APPLIED: since
 * #7319 `EnchantmentData#isApplied` is `transfer && item`, so a clone keeping the profile's
 * `transfer: false` never applies to the weapon. The shape mirrors `applyEnchantment`.
 */
describe("linkSelectedEnchantment", () => {
  const originalActiveEffect = (globalThis as any).ActiveEffect;

  afterEach(() => {
    (globalThis as any).ActiveEffect = originalActiveEffect;
  });

  function install(forApplication?: (changes: any[]) => Promise<any[]>) {
    const create = vi.fn(async (data: any, _operation?: any) => data);
    (globalThis as any).ActiveEffect = { create, implementation: { forApplication } };
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
    system: { changes: [{ key: "system.proficient", type: "override", value: "1", replacement: "" }] },
  };
  const effect = { id: profile._id, toObject: () => foundry.utils.deepClone(profile) } as any;
  const item = { name: "Longsword" } as any;

  it("creates a transfer copy carrying the profile and activity origin", async () => {
    const create = install();
    const activity = { _id: "ddbForgePactWpn1", uuid: "Actor.a.Item.b.Activity.ddbForgePactWpn1" };

    await linkSelectedEnchantment(item, effect, activity, "Pact of the Blade");

    expect(create).toHaveBeenCalledTimes(1);
    const [data, operation] = create.mock.calls[0];
    expect(data).toMatchObject({
      transfer: true,
      disabled: false,
      origin: activity.uuid,
      flags: { dae: { transfer: true }, dnd5e: { enchantmentProfile: "ddbPactWeaponEf1" } },
      system: { origin: { activity: activity.uuid, profile: "ddbPactWeaponEf1" } },
    });
    // no duration on the activity, none stamped: the bond stays open-ended
    expect(data.duration).toEqual(profile.duration);
    expect(operation).toMatchObject({
      parent: item,
      keepOrigin: true,
      dnd5e: { enchantmentProfile: "ddbPactWeaponEf1", activityId: "ddbForgePactWpn1" },
    });
  });

  it("inherits the activity duration and resolves change formulas like the chat tray", async () => {
    const forApplication = vi.fn(async (changes: any[]) => changes.map((c) => ({ ...c, value: "resolved" })));
    const create = install(forApplication);
    const activity = {
      _id: "act",
      uuid: "Actor.a.Item.b.Activity.act",
      getAppliedEffectChanges: vi.fn(() => ({ duration: { value: 1, units: "hours", expiry: "turnStart" } })),
    };

    await linkSelectedEnchantment(item, effect, activity, "Oil of Sharpness");

    expect(activity.getAppliedEffectChanges).toHaveBeenCalledWith(effect, { target: item });
    expect(forApplication).toHaveBeenCalledWith(profile.system.changes, activity, item);
    const [data] = create.mock.calls[0];
    expect(data.duration).toEqual({ value: 1, units: "hours", expiry: "turnStart" });
    expect(data.system.changes[0].value).toBe("resolved");
  });
});
