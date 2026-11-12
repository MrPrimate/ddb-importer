import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";
import PlayStateReview from "../../src/muncher/PlayStateReview";

const NO_DEFAULTS = { useSpent: false, activityUseSpent: false, quantity: false };

function activity(id: string, name: string, max: string, spent: number) {
  return { _id: id, name, uses: { max, spent } };
}

/**
 * A live owned item: source data through toObject(), prepared uses on system (item max and
 * activity max resolved to numbers, activities in a Map).
 */
function liveItem({ id = "liveIdIIIIIIIIII", name = "Rage", type = "feat", spent = 2, max = 3, quantity, activities = {}, flags = {} }: {
  id?: string;
  name?: string;
  type?: string;
  spent?: number;
  max?: number;
  quantity?: number;
  activities?: Record<string, any>;
  flags?: Record<string, any>;
} = {}) {
  const source = {
    _id: id,
    name,
    type,
    flags: { ddbimporter: { id: 77, ...flags } },
    system: { ...(quantity === undefined ? {} : { quantity }), uses: { max: `${max}`, spent, recovery: [] }, activities },
  };
  const prepared = new Map(Object.entries(activities).map(([key, value]) => [key, {
    id: key,
    uses: { spent: value.uses.spent, max: Number.parseInt(value.uses.max) },
  }]));
  return {
    ...source,
    id,
    system: { ...source.system, uses: { ...source.system.uses, max }, activities: prepared },
    toObject: () => foundry.utils.deepClone(source),
  } as any;
}

function parsedItem({ name = "Rage", type = "feat", spent = 0, max = "4", quantity, activities = {}, flags = {} }: {
  name?: string;
  type?: string;
  spent?: number | null;
  max?: string;
  quantity?: number;
  activities?: Record<string, any>;
  flags?: Record<string, any>;
} = {}) {
  return {
    _id: "freshIdIIIIIIIII",
    name,
    type,
    flags: { ddbimporter: { id: 77, ...flags } },
    system: { ...(quantity === undefined ? {} : { quantity }), uses: { max, spent, recovery: [] }, activities },
  } as any;
}

describe("PlayStateReview", () => {

  describe("itemRows", () => {
    it("lists a spent-uses difference with uses left on both sides and the default side", () => {
      const rows = PlayStateReview.itemRows(
        [{ item: parsedItem({ spent: 0, max: "4" }), existing: liveItem({ spent: 2, max: 3 }) }],
        { ...NO_DEFAULTS, useSpent: true },
      );

      expect(rows).toEqual([expect.objectContaining({
        key: "item:liveIdIIIIIIIIII:uses",
        group: "features",
        label: "Rage",
        foundry: "1/3 left (2 spent)",
        ddb: "4/4 left (0 spent)",
        keepFoundry: true,
      })]);
    });

    it("shows spent only for a formula maximum, and treats a null DDB spent as 0", () => {
      const rows = PlayStateReview.itemRows(
        [{ item: parsedItem({ spent: null, max: "@scale.barbarian.rages" }), existing: liveItem({ spent: 1 }) }],
        NO_DEFAULTS,
      );

      expect(rows[0].ddb).toBe("0 spent");
      expect(rows[0].keepFoundry).toBe(false);
    });

    it("leaves out equal values, ignored items, and fields the item's own flags decide", () => {
      expect(PlayStateReview.itemRows(
        [{ item: parsedItem({ spent: 2 }), existing: liveItem({ spent: 2 }) }], NO_DEFAULTS,
      )).toEqual([]);
      expect(PlayStateReview.itemRows(
        [{ item: parsedItem(), existing: liveItem({ flags: { ignoreItemImport: true } }) }], NO_DEFAULTS,
      )).toEqual([]);
      expect(PlayStateReview.itemRows(
        [{ item: parsedItem(), existing: liveItem({ flags: { retainUseSpent: true } }) }], NO_DEFAULTS,
      )).toEqual([]);
      expect(PlayStateReview.itemRows(
        [{ item: parsedItem({ flags: { retainUseSpent: true } }), existing: liveItem() }], NO_DEFAULTS,
      )).toEqual([]);
    });

    it("leaves out a pooled child whose live item has no maximum", () => {
      expect(PlayStateReview.itemRows(
        [{ item: parsedItem({ spent: 0, max: "3" }), existing: liveItem({ spent: 2, max: 0 }) }], NO_DEFAULTS,
      )).toEqual([]);
    });

    it("lists activity differences matched by id or name, skipping activities an enricher keeps", () => {
      const existing = liveItem({
        spent: 0,
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 1),
          oldIdAAAAAAAAAAA: activity("oldIdAAAAAAAAAAA", "Trick Shot", "3", 2),
          guardAAAAAAAAAAA: activity("guardAAAAAAAAAAA", "Guard", "1", 1),
        },
      });
      const item = parsedItem({
        spent: 0,
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 0),
          trickAAAAAAAAAAA: activity("trickAAAAAAAAAAA", "Trick Shot", "3", 0),
          guardAAAAAAAAAAA: activity("guardAAAAAAAAAAA", "Guard", "1", 0),
        },
        flags: { retainActivityUseSpent: ["Guard"] },
      });

      const rows = PlayStateReview.itemRows([{ item, existing }], NO_DEFAULTS);

      expect(rows.map((row) => [row.key, row.foundry, row.ddb])).toEqual([
        ["item:liveIdIIIIIIIIII:activity:volleyAAAAAAAAAA", "1/2 left (1 spent)", "2/2 left (0 spent)"],
        ["item:liveIdIIIIIIIIII:activity:trickAAAAAAAAAAA", "1/3 left (2 spent)", "3/3 left (0 spent)"],
      ]);
    });

    it("lists a quantity difference under inventory", () => {
      const rows = PlayStateReview.itemRows([{
        item: parsedItem({ name: "Arrows", type: "consumable", quantity: 20, spent: 0, max: "" }),
        existing: liveItem({ name: "Arrows", type: "consumable", quantity: 7, spent: 0, max: 0 }),
      }], { ...NO_DEFAULTS, quantity: true });

      expect(rows).toEqual([expect.objectContaining({
        key: "item:liveIdIIIIIIIIII:quantity",
        group: "inventory",
        foundry: "7",
        ddb: "20",
        keepFoundry: true,
      })]);
    });
  });

  describe("actorRows", () => {
    const policies = { hp: true, keepHPDamage: false, keepHPTemp: false, inspiration: true, hitDie: true, spellUse: true };
    const parsed = {
      flags: { ddbimporter: { totalHP: 38, removedHitPoints: 0 } },
      system: {
        attributes: { hp: { temp: 0 }, inspiration: false, death: { success: 0, failure: 0 } },
        spells: { spell1: { value: 4 }, spell2: { value: 2 }, pact: { value: 0 } },
      },
    } as any;
    const original = {
      system: {
        attributes: { inspiration: true, death: { success: 1, failure: 2 } },
        spells: { spell1: { value: 1 }, spell2: { value: 2 } },
      },
      items: [{ name: "Barbarian", type: "class", system: { hd: { spent: 3 } } }],
    } as any;
    const classes = [{ name: "Barbarian", type: "class", system: { hd: { spent: 0 } } }] as any;

    it("lists hit points, inspiration, death saves, hit dice and differing spell slots", () => {
      const rows = PlayStateReview.actorRows({
        parsed, classes, original, liveHP: { value: 12, max: 31, temp: 5 }, policies,
      });

      expect(rows.map((row) => [row.key, row.foundry, row.ddb])).toEqual([
        ["actor:hp", "19 damage (12/31)", "0 damage (38/38)"],
        ["actor:hp-temp", "5", "0"],
        ["actor:inspiration", "Yes", "No"],
        ["actor:death", "1 successes, 2 failures", "0 successes, 0 failures"],
        ["actor:hd:Barbarian", "3 spent", "0 spent"],
        ["actor:spell:spell1", "1 left", "4 left"],
      ]);
    });

    it("leaves out fields whose update policy is off, and starts hit points from Keep damage taken", () => {
      const rows = PlayStateReview.actorRows({
        parsed,
        classes,
        original,
        liveHP: { value: 12, max: 31, temp: 5 },
        policies: { hp: true, keepHPDamage: true, keepHPTemp: false, inspiration: false, hitDie: false, spellUse: false },
      });

      expect(rows.map((row) => [row.key, row.keepFoundry])).toEqual([
        ["actor:hp", true],
        ["actor:hp-temp", false],
        ["actor:death", false],
      ]);
    });
  });

  describe("rememberChoices", () => {
    it("writes the item retain flags for rows kept from Foundry only", () => {
      const rage = parsedItem();
      const arrows = parsedItem({ name: "Arrows" });
      const bow = parsedItem({ name: "Bow", flags: { retainActivityUseSpent: ["Aim"] } });
      const rows = [
        { key: "a", remember: { item: rage, flag: "retainUseSpent" } },
        { key: "b", remember: { item: arrows, flag: "retainQuantity" } },
        { key: "c", remember: { item: bow, flag: "retainActivityUseSpent", activityName: "Volley" } },
      ] as any;

      PlayStateReview.rememberChoices(rows, { a: true, b: false, c: true });

      expect(rage.flags.ddbimporter.retainUseSpent).toBe(true);
      expect(arrows.flags.ddbimporter.retainQuantity).toBeUndefined();
      expect(bow.flags.ddbimporter.retainActivityUseSpent).toEqual(["Aim", "Volley"]);
    });
  });

  describe("restoreDDBMatchedFlags retain flag carry-over", () => {
    it("carries item config retain flags to the new copy, letting a user's retain-all outrank an enricher's list", () => {
      const item = parsedItem({ flags: { retainActivityUseSpent: ["Volley"] } });
      DDBCharacterImporter.restoreDDBMatchedFlags(
        liveItem({ flags: { retainUseSpent: true, retainQuantity: true, retainActivityUseSpent: true } }), item, NO_DEFAULTS,
      );

      expect(item.flags.ddbimporter.retainUseSpent).toBe(true);
      expect(item.flags.ddbimporter.retainQuantity).toBe(true);
      expect(item.flags.ddbimporter.retainActivityUseSpent).toBe(true);
    });

    it("keeps every activity's spent uses when the user ticked retain-all over an enricher's list", () => {
      const existing = liveItem({
        flags: { retainActivityUseSpent: true },
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 1),
          trickAAAAAAAAAAA: activity("trickAAAAAAAAAAA", "Trick Shot", "3", 2),
        },
      });
      const item = parsedItem({
        flags: { retainActivityUseSpent: ["Volley"] },
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 0),
          trickAAAAAAAAAAA: activity("trickAAAAAAAAAAA", "Trick Shot", "3", 0),
        },
      });
      DDBCharacterImporter.restoreDDBMatchedFlags(existing, item, NO_DEFAULTS);

      expect(item.system.activities.volleyAAAAAAAAAA.uses.spent).toBe(1);
      expect(item.system.activities.trickAAAAAAAAAAA.uses.spent).toBe(2);
    });

    it("adds the names carried on the item, which hold remembered review choices, to an enricher's list", () => {
      const existing = liveItem({
        flags: { retainActivityUseSpent: ["Volley", "Aim"] },
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 1),
          aimAAAAAAAAAAAAA: activity("aimAAAAAAAAAAAAA", "Aim", "3", 2),
        },
      });
      const item = parsedItem({
        flags: { retainActivityUseSpent: ["Volley"] },
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 0),
          aimAAAAAAAAAAAAA: activity("aimAAAAAAAAAAAAA", "Aim", "3", 0),
        },
      });
      DDBCharacterImporter.restoreDDBMatchedFlags(existing, item, NO_DEFAULTS);

      expect(item.flags.ddbimporter.retainActivityUseSpent).toEqual(["Volley", "Aim"]);
      expect(item.system.activities.volleyAAAAAAAAAA.uses.spent).toBe(1);
      expect(item.system.activities.aimAAAAAAAAAAAAA.uses.spent).toBe(2);
    });

    it("does not carry an unchecked (false) item config box", () => {
      const item = parsedItem();
      DDBCharacterImporter.restoreDDBMatchedFlags(liveItem({ flags: { retainUseSpent: false } }), item, NO_DEFAULTS);

      expect(item.flags.ddbimporter.retainUseSpent).toBeUndefined();
    });
  });

  describe("restoreDDBMatchedFlags with review decisions", () => {
    it("lets a decision override the defaults both ways", () => {
      const keep = parsedItem({ spent: 0, quantity: 20 });
      DDBCharacterImporter.restoreDDBMatchedFlags(
        liveItem({ spent: 2, quantity: 7 }), keep, NO_DEFAULTS, undefined,
        { "item:liveIdIIIIIIIIII:uses": true, "item:liveIdIIIIIIIIII:quantity": true },
      );
      expect(keep.system.uses.spent).toBe(2);
      expect(keep.system.quantity).toBe(7);

      const drop = parsedItem({ spent: 0, quantity: 20 });
      DDBCharacterImporter.restoreDDBMatchedFlags(
        liveItem({ spent: 2, quantity: 7 }), drop, { useSpent: true, activityUseSpent: false, quantity: true }, undefined,
        { "item:liveIdIIIIIIIIII:uses": false, "item:liveIdIIIIIIIIII:quantity": false },
      );
      expect(drop.system.uses.spent).toBe(0);
      expect(drop.system.quantity).toBe(20);
    });

    it("keeps the default for activities without a decision and follows the decided ones", () => {
      const existing = liveItem({
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 1),
          trickAAAAAAAAAAA: activity("trickAAAAAAAAAAA", "Trick Shot", "3", 2),
        },
      });
      const item = parsedItem({
        activities: {
          volleyAAAAAAAAAA: activity("volleyAAAAAAAAAA", "Volley", "2", 0),
          trickAAAAAAAAAAA: activity("trickAAAAAAAAAAA", "Trick Shot", "3", 0),
        },
      });

      DDBCharacterImporter.restoreDDBMatchedFlags(
        existing, item, { ...NO_DEFAULTS, activityUseSpent: true }, undefined,
        { "item:liveIdIIIIIIIIII:activity:volleyAAAAAAAAAA": false },
      );

      expect(item.system.activities.volleyAAAAAAAAAA.uses.spent).toBe(0);
      expect(item.system.activities.trickAAAAAAAAAAA.uses.spent).toBe(2);
    });

    it("applies an activity decision to that activity only, not to others sharing its name", () => {
      const existing = liveItem({
        activities: {
          firstAAAAAAAAAAA: activity("firstAAAAAAAAAAA", "", "2", 1),
          secondAAAAAAAAAA: activity("secondAAAAAAAAAA", "", "3", 2),
        },
      });
      const item = parsedItem({
        activities: {
          firstAAAAAAAAAAA: activity("firstAAAAAAAAAAA", "", "2", 0),
          secondAAAAAAAAAA: activity("secondAAAAAAAAAA", "", "3", 0),
        },
      });

      DDBCharacterImporter.restoreDDBMatchedFlags(
        existing, item, NO_DEFAULTS, undefined,
        { "item:liveIdIIIIIIIIII:activity:firstAAAAAAAAAAA": true },
      );

      expect(item.system.activities.firstAAAAAAAAAAA.uses.spent).toBe(1);
      expect(item.system.activities.secondAAAAAAAAAA.uses.spent).toBe(0);
    });
  });
});
