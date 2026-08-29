vi.mock("../../src/lib/CompendiumHelper", () => ({
  default: {
    getCompendiumLabel: vi.fn(() => "world.ddb-items"),
    getCompendiumType: vi.fn(),
    getCompendium: vi.fn(),
  },
}));

import DDBItemImporter from "../../src/lib/DDBItemImporter";

function makeItem({ activities = {}, flags = {} }: {
  activities?: Record<string, any>;
  flags?: Record<string, any>;
} = {}) {
  return {
    name: "Experimental Elixir",
    type: "feat",
    flags: { ddbimporter: flags },
    system: { activities },
  } as any;
}

function makeActivity({ id, name, max = "3", spent = 0 }: {
  id: string;
  name: string;
  max?: string | null;
  spent?: number | null;
}) {
  return { _id: id, name, uses: { max, spent } };
}

describe("DDBItemImporter.retainFlagValue", () => {

  it("prefers the freshly parsed item flag over the existing document", () => {
    const item = makeItem({ flags: { retainUseSpent: true } });
    expect(DDBItemImporter.retainFlagValue<boolean>({ retainUseSpent: false } as any, item, "retainUseSpent"))
      .toBe(true);
  });

  it("falls back to the existing document flag when the parse did not set one", () => {
    const item = makeItem();
    expect(DDBItemImporter.retainFlagValue<boolean>({ retainUseSpent: true } as any, item, "retainUseSpent"))
      .toBe(true);
  });

  it("falls back when the parsed flag is falsy", () => {
    const item = makeItem({ flags: { retainUseSpent: false } });
    expect(DDBItemImporter.retainFlagValue<boolean>({ retainUseSpent: true } as any, item, "retainUseSpent"))
      .toBe(true);
  });

  it("returns undefined when neither side carries the flag", () => {
    expect(DDBItemImporter.retainFlagValue<boolean>(undefined, makeItem(), "retainUseSpent"))
      .toBeUndefined();
  });

  it("returns the array form untouched", () => {
    const item = makeItem({ flags: { retainActivityUseSpent: ["Concoct Elixir"] } });
    expect(DDBItemImporter.retainFlagValue<string[]>(undefined, item, "retainActivityUseSpent"))
      .toEqual(["Concoct Elixir"]);
  });

});

describe("DDBItemImporter.restoreActivityUseSpent", () => {

  it("copies spent onto the matching activity id", () => {
    const existing = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 2 }) } });
    const item = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 0 }) } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, true);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(2);
  });

  it("falls back to a name match when the activity id changed", () => {
    const existing = makeItem({ activities: { oldIdIIIIIIIIIII: makeActivity({ id: "oldIdIIIIIIIIIII", name: "Concoct Elixir", spent: 3 }) } });
    const item = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 0 }) } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, true);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(3);
  });

  it("leaves an activity that has no uses max of its own alone", () => {
    const existing = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 2 }) } });
    const item = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", max: "", spent: 0 }) } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, true);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(0);
  });

  it("clamps a retained value to a max that shrank between imports", () => {
    const existing = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", max: "5", spent: 5 }) } });
    const item = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", max: "2", spent: 0 }) } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, true);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(2);
  });

  it("does not clamp against a formula max", () => {
    const existing = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", max: "@prof", spent: 4 }) } });
    const item = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", max: "@prof", spent: 0 }) } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, true);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(4);
  });

  it("only restores the named activities when given a list", () => {
    const existing = makeItem({ activities: {
      ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 2 }),
      ddbDrinkElixirII: makeActivity({ id: "ddbDrinkElixirII", name: "Drink Elixir", spent: 1 }),
    } });
    const item = makeItem({ activities: {
      ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 0 }),
      ddbDrinkElixirII: makeActivity({ id: "ddbDrinkElixirII", name: "Drink Elixir", spent: 0 }),
    } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, ["Concoct Elixir"]);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(2);
    expect(item.system.activities.ddbDrinkElixirII.uses.spent).toBe(0);
  });

  it("skips an existing activity with no recorded spent value", () => {
    const existing = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: null }) } });
    const item = makeItem({ activities: { ddbConcoctElixir: makeActivity({ id: "ddbConcoctElixir", name: "Concoct Elixir", spent: 0 }) } });

    DDBItemImporter.restoreActivityUseSpent(existing, item, true);

    expect(item.system.activities.ddbConcoctElixir.uses.spent).toBe(0);
  });

  it("does nothing for documents without activities", () => {
    const existing = { name: "Potion", type: "consumable", flags: {}, system: { uses: { max: "1", spent: 1 } } } as any;
    const item = { name: "Potion", type: "consumable", flags: {}, system: { uses: { max: "1", spent: 0 } } } as any;

    expect(() => DDBItemImporter.restoreActivityUseSpent(existing, item, true)).not.toThrow();
    expect(item.system.uses.spent).toBe(0);
  });

});
