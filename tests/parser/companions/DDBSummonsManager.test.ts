// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import DDBSummonsManager from "../../../src/parser/companions/DDBSummonsManager";
import { legacySummonKeys, srdCreatureKey } from "../../../src/parser/companions/types/SRDItemSummonTable";

/**
 * Find Steed and Giant Insect first shipped with their own summon keys and later moved to the
 * shared SRDCreature keys. The summons compendium ids an actor by name and ruleset, so a world
 * munched under the old key already holds the new key's document, and with "update existing" off
 * that document is never rewritten. Both halves of the fix are pinned: the lookup answers to the
 * old key, and generating summons re-keys the stored document.
 */
const indexEntry = (id: string, name: string, summonsKey: string, version = 1) => ({
  _id: id,
  name,
  uuid: `Compendium.world.ddb-summons.Actor.${id}`,
  flags: { ddbimporter: { summons: { summonsKey, version } } },
});

describe("legacySummonKeys", () => {
  it("names the keys a shared creature was stored under before", () => {
    expect(legacySummonKeys(srdCreatureKey("Mastiff", true))).toEqual(["FindSteedMastiff2014"]);
    expect(legacySummonKeys(srdCreatureKey("Giant Wasp", true))).toEqual(["GiantInsectGiantWasp2014"]);
    expect(legacySummonKeys(srdCreatureKey("Giant Fly", false))).toEqual(["SRDCreatureGiantFly2014", "SRDCreatureGiantFly2024"]);
  });

  it("is empty for a key that was never renamed", () => {
    expect(legacySummonKeys(srdCreatureKey("Mastiff", false))).toEqual([]);
    expect(legacySummonKeys("Clairvoyance")).toEqual([]);
  });
});

describe("DDBSummonsManager.addProfilesToActivity", () => {
  const resolve = (index: unknown[], keys: { name: string; count: string | number }[]) => {
    const manager = { itemHandler: { compendium: { index } } };
    return (DDBSummonsManager.prototype.addProfilesToActivity as any).call(manager, {}, keys, {}).profiles;
  };

  it("resolves a profile against an actor still stored under its old key", () => {
    const profiles = resolve(
      [indexEntry("ddbSumMastiff2014", "Mastiff", "FindSteedMastiff2014"), indexEntry("ddbSumOther00000", "Other", "Clairvoyance")],
      [{ name: "SRDCreatureMastiff2014", count: "3" }],
    );
    expect(profiles).toEqual([{
      _id: "ddbSumMastiff2014",
      name: "Mastiff",
      uuid: "Compendium.world.ddb-summons.Actor.ddbSumMastiff2014",
      count: "3",
      level: { min: null, max: null },
    }]);
  });

  it("still resolves the current key and ignores unrelated actors", () => {
    const profiles = resolve(
      [indexEntry("ddbSumMastiff2014", "Mastiff", "SRDCreatureMastiff2014"), indexEntry("ddbSumOther00000", "Other", "FindSteedPony2014")],
      [{ name: "SRDCreatureMastiff2014", count: 1 }],
    );
    expect(profiles.map((p: any) => p.name)).toEqual(["Mastiff"]);
  });
});

describe("DDBSummonsManager.addGeneratedSummons re-keying", () => {
  const original = {
    init: DDBSummonsManager.prototype.init,
    addToCompendium: DDBSummonsManager.prototype.addToCompendium,
    game: (globalThis as any).game,
  };
  let updates: Record<string, unknown>[];
  let written: string[];
  let index: unknown[];

  beforeEach(() => {
    updates = [];
    written = [];
    (globalThis as any).game = { user: { isGM: true }, modules: { get: () => undefined } };
    // prototypes are patched directly rather than spied on, as the audit suites require
    DDBSummonsManager.prototype.init = async function init(this: any) {
      this.itemHandler = {
        compendium: {
          index,
          getDocument: async () => ({ update: async (data: Record<string, unknown>) => {
            updates.push(data);
          } }),
        },
      };
    };
    DDBSummonsManager.prototype.addToCompendium = async function addToCompendium(companion: any) {
      written.push(companion.flags.ddbimporter.summons.summonsKey);
      return [];
    };
  });

  afterEach(() => {
    DDBSummonsManager.prototype.init = original.init;
    DDBSummonsManager.prototype.addToCompendium = original.addToCompendium;
    (globalThis as any).game = original.game;
  });

  const summon = (name: string, version = "1") => ({
    name, version, required: null, isJB2A: false, needsJB2A: false, needsJB2APatreon: false, folderName: "SRD Creatures",
    data: { name, system: { source: { rules: "2014" } }, flags: {} } as any,
  });

  it("re-keys an actor stored under the old key and does not rebuild it", async () => {
    index = [indexEntry("ddbSumMastiff2014", "Mastiff", "FindSteedMastiff2014")];
    await DDBSummonsManager.addGeneratedSummons({ SRDCreatureMastiff2014: summon("Mastiff") });
    expect(updates).toEqual([{ "flags.ddbimporter.summons.summonsKey": "SRDCreatureMastiff2014" }]);
    expect(written).toEqual([]);
  });

  it("re-keys and rebuilds when the generated version is newer", async () => {
    index = [indexEntry("ddbSumMastiff2014", "Mastiff", "FindSteedMastiff2014", 1)];
    await DDBSummonsManager.addGeneratedSummons({ SRDCreatureMastiff2014: summon("Mastiff", "2") });
    expect(updates).toHaveLength(1);
    expect(written).toEqual(["SRDCreatureMastiff2014"]);
  });

  it("writes a new actor when nothing is stored under either key", async () => {
    index = [];
    await DDBSummonsManager.addGeneratedSummons({ SRDCreatureMastiff2014: summon("Mastiff") });
    expect(updates).toEqual([]);
    expect(written).toEqual(["SRDCreatureMastiff2014"]);
  });

  it("leaves an actor already under the current key alone", async () => {
    index = [indexEntry("ddbSumMastiff2014", "Mastiff", "SRDCreatureMastiff2014")];
    await DDBSummonsManager.addGeneratedSummons({ SRDCreatureMastiff2014: summon("Mastiff") });
    expect(updates).toEqual([]);
    expect(written).toEqual([]);
  });
});
