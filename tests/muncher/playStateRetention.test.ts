import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";

const NO_DEFAULTS = { useSpent: false, activityUseSpent: false, quantity: false };

function makeActivityData({ id, name, max, spent }: { id: string; name: string; max: string; spent: number | null }) {
  return { _id: id, name, uses: { max, spent } };
}

/** A live owned item: activities only readable through toObject(), like the actor's collection. */
function makeLiveItem({ spent = 0, quantity = 14, activities = {}, flags = {} }: {
  spent?: number | null;
  quantity?: number;
  activities?: Record<string, any>;
  flags?: Record<string, any>;
} = {}) {
  const source = {
    _id: "liveIdIIIIIIIIII",
    name: "Arrows",
    img: "icons/arrows.webp",
    type: "consumable",
    flags: { ddbimporter: flags },
    system: { quantity, uses: { max: "3", spent, recovery: [] }, activities },
  };
  return {
    ...source,
    id: source._id,
    system: { ...source.system, activities: new Map(Object.entries(activities)) },
    toObject: () => foundry.utils.deepClone(source),
  } as any;
}

function makeParsedItem({ spent = 0, quantity = 20, max = "4", activities = {}, flags = {} }: {
  spent?: number | null;
  quantity?: number;
  max?: string;
  activities?: Record<string, any>;
  flags?: Record<string, any>;
} = {}) {
  return {
    _id: "freshIdIIIIIIIII",
    name: "Arrows",
    img: "icons/arrows.webp",
    type: "consumable",
    flags: { ddbimporter: flags },
    system: { quantity, uses: { max, spent, recovery: [] }, activities },
  } as any;
}

describe("play-state retention on re-import", () => {

  describe("restoreDDBMatchedFlags defaults", () => {
    it("takes the DDB values when nothing asks to keep Foundry's", () => {
      const item = makeParsedItem({ spent: 0, quantity: 20 });
      DDBCharacterImporter.restoreDDBMatchedFlags(makeLiveItem({ spent: 2, quantity: 14 }), item, NO_DEFAULTS);

      expect(item.system.uses.spent).toBe(0);
      expect(item.system.quantity).toBe(20);
    });

    it("keeps Foundry's spent uses under the default, so uses left rise with the max", () => {
      const retained = new Set<string>();
      // Rage 1/3 left in Foundry, DDB now says max 4 with none spent
      const item = makeParsedItem({ spent: 0, max: "4" });
      DDBCharacterImporter.restoreDDBMatchedFlags(
        makeLiveItem({ spent: 2 }), item, { ...NO_DEFAULTS, useSpent: true }, retained,
      );

      expect(item.system.uses.spent).toBe(2);
      expect(retained.has("liveIdIIIIIIIIII")).toBe(true);
      // the default is not written onto the item, so switching it off later behaves
      expect(item.flags.ddbimporter.retainUseSpent).toBeUndefined();
    });

    it("keeps spent uses from the per-item flag on the existing item", () => {
      const item = makeParsedItem({ spent: 0 });
      DDBCharacterImporter.restoreDDBMatchedFlags(makeLiveItem({ spent: 1, flags: { retainUseSpent: true } }), item, NO_DEFAULTS);

      expect(item.system.uses.spent).toBe(1);
    });

    it("does not let a per-item false opt out of the default", () => {
      const item = makeParsedItem({ spent: 0 });
      DDBCharacterImporter.restoreDDBMatchedFlags(
        makeLiveItem({ spent: 1, flags: { retainUseSpent: false } }), item, { ...NO_DEFAULTS, useSpent: true },
      );

      expect(item.system.uses.spent).toBe(1);
    });

    it("keeps Foundry's quantity from the default or the per-item flag", () => {
      const byDefault = makeParsedItem({ quantity: 20 });
      DDBCharacterImporter.restoreDDBMatchedFlags(makeLiveItem({ quantity: 14 }), byDefault, { ...NO_DEFAULTS, quantity: true });
      expect(byDefault.system.quantity).toBe(14);

      const byFlag = makeParsedItem({ quantity: 20 });
      DDBCharacterImporter.restoreDDBMatchedFlags(makeLiveItem({ quantity: 9, flags: { retainQuantity: true } }), byFlag, NO_DEFAULTS);
      expect(byFlag.system.quantity).toBe(9);
    });

    it("keeps every activity's spent uses under the default, widening an enricher's named list", () => {
      const existing = makeLiveItem({
        activities: {
          volleyAAAAAAAAAA: makeActivityData({ id: "volleyAAAAAAAAAA", name: "Volley", max: "2", spent: 1 }),
          trickAAAAAAAAAAA: makeActivityData({ id: "trickAAAAAAAAAAA", name: "Trick Shot", max: "3", spent: 2 }),
        },
      });
      const item = makeParsedItem({
        activities: {
          volleyAAAAAAAAAA: makeActivityData({ id: "volleyAAAAAAAAAA", name: "Volley", max: "2", spent: 0 }),
          trickAAAAAAAAAAA: makeActivityData({ id: "trickAAAAAAAAAAA", name: "Trick Shot", max: "3", spent: 0 }),
        },
        flags: { retainActivityUseSpent: ["Volley"] },
      });
      DDBCharacterImporter.restoreDDBMatchedFlags(existing, item, { ...NO_DEFAULTS, activityUseSpent: true });

      expect(item.system.activities.volleyAAAAAAAAAA.uses.spent).toBe(1);
      expect(item.system.activities.trickAAAAAAAAAAA.uses.spent).toBe(2);
    });

    it("keeps nothing for an item ignored on import", () => {
      const retained = new Set<string>();
      const item = makeParsedItem({ spent: 0, quantity: 20 });
      DDBCharacterImporter.restoreDDBMatchedFlags(
        makeLiveItem({ spent: 2, quantity: 14, flags: { ignoreItemImport: true } }),
        item,
        { useSpent: true, activityUseSpent: true, quantity: true },
        retained,
      );

      expect(item.system.uses.spent).toBe(0);
      expect(item.system.quantity).toBe(20);
      expect(retained.size).toBe(0);
    });
  });

  describe("hpKeepingDamage", () => {
    it("carries the damage taken over to a higher maximum", () => {
      expect(DDBCharacterImporter.hpKeepingDamage({ value: 12, max: 31, temp: 5 }, 38)).toEqual({ value: 19, temp: 5 });
    });

    it("carries the damage taken over to a lower maximum", () => {
      expect(DDBCharacterImporter.hpKeepingDamage({ value: 20, max: 31, temp: 0 }, 25)).toEqual({ value: 14, temp: 0 });
    });

    it("never goes below 0", () => {
      expect(DDBCharacterImporter.hpKeepingDamage({ value: 2, max: 40, temp: 0 }, 30)).toEqual({ value: 0, temp: 0 });
    });

    it("treats a value above the maximum as no damage", () => {
      expect(DDBCharacterImporter.hpKeepingDamage({ value: 35, max: 31, temp: 0 }, 38)).toEqual({ value: 38, temp: 0 });
    });
  });

  describe("overMaxSpentUpdate", () => {
    const activities = (entries: { id: string; spent: number; max: number }[]) =>
      new Map(entries.map((entry) => [entry.id, { id: entry.id, uses: { spent: entry.spent, max: entry.max } }]));

    it("clamps item and activity spent uses that went over their prepared maximum", () => {
      const update = DDBCharacterImporter.overMaxSpentUpdate({
        uses: { spent: 5, max: 3 },
        activities: activities([{ id: "volleyAAAAAAAAAA", spent: 4, max: 2 }, { id: "trickAAAAAAAAAAA", spent: 1, max: 3 }]),
      });

      expect(update).toEqual({
        "system.uses.spent": 3,
        "system.activities.volleyAAAAAAAAAA.uses.spent": 2,
      });
    });

    it("returns null when nothing is over, and never clamps to a maximum of 0 (no uses)", () => {
      expect(DDBCharacterImporter.overMaxSpentUpdate({ uses: { spent: 2, max: 3 } })).toBeNull();
      expect(DDBCharacterImporter.overMaxSpentUpdate({ uses: { spent: 2, max: 0 } })).toBeNull();
    });
  });

});
