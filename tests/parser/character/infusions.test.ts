import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRiderCopies, linkSelectedEnchantment, matchFields, stableCopyId } from "../../../src/parser/character/infusions";

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
    // a stable id kept through creation, and no dnd5e options: the linker collects riders itself
    expect(data._id).toBe("ddbPactWeapoCp00");
    expect(operation).toMatchObject({ parent: item, keepId: true, keepOrigin: true });
    expect(operation.dnd5e).toBeUndefined();
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
 * Rider copies are built from the profile's stored rider ids with the data dnd5e's collectRiders
 * gives them, but under ids derived from their sources so a re-import reproduces them.
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

  const systemOrigin = { activity: "Actor.a.Item.b.Activity.shiftCore", profile: "choiceBeasthidef" };

  it("copies rider activities and effects onto the same item under ids that do not clash", () => {
    // the self-enchanting case: the origin is also the target, so copies must not reuse source ids
    const item = shifting();
    const { activities, effects } = buildRiderCopies({
      riders: { activity: new Set(["shiftBeasthideac"]), effect: new Set(["ddbBeasthideefII"]) },
      origin: item,
      target: item,
      appliedId: "choiceBeasthCp00",
      systemOrigin,
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
      system: { origin: systemOrigin },
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
      systemOrigin,
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
      systemOrigin,
    });
    expect(effects.map((effect) => effect._id)).toEqual(["activityOwnEff01"]);
    expect(effects[0].flags?.dnd5e).toMatchObject({ dependentOn: "ddbPactWeapoCp00" });

    const alreadyThere = buildRiderCopies({
      riders: { activity: new Set(["secondRiderActv1"]) },
      origin,
      target: { system: { activities: new Map() }, effects: new Map([["activityOwnEff01", {}]]) },
      appliedId: "ddbPactWeapoCp00",
      systemOrigin,
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
        systemOrigin,
      });
    };
    const first = run();
    const second = run();
    expect(Object.keys(second.activities)).toEqual(Object.keys(first.activities));
    expect(second.effects.map((effect) => effect._id)).toEqual(first.effects.map((effect) => effect._id));
  });
});
