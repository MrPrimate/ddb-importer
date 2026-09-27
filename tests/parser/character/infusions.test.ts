import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRiderCopies, linkSelectedEnchantment, matchFields, removeAppliedCopies, stableCopyId } from "../../../src/parser/character/infusions";

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
    // a stable id kept through creation, and no dnd5e options: the linker collects riders itself
    expect(data._id).toBe("ddbPactWeapoCp00");
    expect(operation).toMatchObject({ parent: item, keepId: true, keepOrigin: true });
    expect(operation.dnd5e).toBeUndefined();
  });
});

/**
 * "Retain Active Effects" carries the previous import's applied copy onto the recreated item; the
 * import replaces it (and its riders) rather than stacking another copy beside it.
 */
describe("removeAppliedCopies", () => {
  const ITEM_UUID = "Actor.a.Item.sickle";

  function effectDoc(id: string, flags: Record<string, unknown> = {}) {
    return { id, uuid: `${ITEM_UUID}.ActiveEffect.${id}`, name: id, flags: { dnd5e: flags } };
  }

  function sickle() {
    const effects = [
      effectDoc("ddbPactWeapoCp00", { enchantmentProfile: "ddbPactWeaponEf1" }),
      effectDoc("ddbPactWeapoCp01", { enchantmentProfile: "ddbPactWeaponEf1" }),
      // another profile's copy whose id starts the same way stays
      effectDoc("ddbPactWeapoCp02", { enchantmentProfile: "ddbPactWeaponEf2" }),
      effectDoc("randomOldCopy001", { enchantmentProfile: "ddbPactWeaponEf1" }),
      effectDoc("riderEffectCp000", { dependentOn: "ddbPactWeapoCp01" }),
      effectDoc("riderByUuid00000", { dependentOn: `${ITEM_UUID}.ActiveEffect.randomOldCopy001` }),
      effectDoc("otherEnchantCp00", { enchantmentProfile: "ddbAgonBlastEf01" }),
      effectDoc("userCustomEffect"),
    ];
    const activities = [
      { id: "ddbPactSpellCp00", flags: { dnd5e: { dependentOn: "ddbPactWeapoCp01" } } },
      { id: "attackSickle0000", flags: {} },
    ];
    return {
      name: "Sickle",
      effects,
      system: { activities },
      update: vi.fn(async () => undefined),
      deleteEmbeddedDocuments: vi.fn(async () => []),
    } as any;
  }

  it("removes every applied copy of the profile, riders first", async () => {
    const item = sickle();
    await removeAppliedCopies(item, "ddbPactWeaponEf1");
    expect(item.update).toHaveBeenCalledWith({ "system.activities.ddbPactSpellCp00": _del });
    expect(item.deleteEmbeddedDocuments.mock.calls).toEqual([
      ["ActiveEffect", ["riderEffectCp000", "riderByUuid00000"]],
      ["ActiveEffect", ["ddbPactWeapoCp00", "ddbPactWeapoCp01", "randomOldCopy001"]],
    ]);
  });

  it("leaves an item without a copy of the profile untouched", async () => {
    const item = sickle();
    await removeAppliedCopies(item, "notOnThisItem000");
    expect(item.update).not.toHaveBeenCalled();
    expect(item.deleteEmbeddedDocuments).not.toHaveBeenCalled();
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
