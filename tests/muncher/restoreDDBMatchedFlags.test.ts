import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";

function makeActivityData({ id, name, max, spent }: {
  id: string;
  name: string;
  max: string;
  spent: number | null;
}) {
  return { _id: id, name, uses: { max, spent }, consumption: { targets: [{ type: "activityUses", value: "-2" }] } };
}

/**
 * A matched item comes out of the actor's embedded collection, so it is a live Item:
 * system.activities is an ActivityCollection (a Map subclass) and toObject() is the only
 * way to read it as data.
 */
function makeLiveItem({ activities, flags = {} }: { activities: Record<string, any>; flags?: Record<string, any> }) {
  const source = {
    _id: "figureIdIIIIIIII",
    name: "Hypnovulfen Figure",
    img: "icons/figure.webp",
    type: "equipment",
    flags: { ddbimporter: flags },
    system: { uses: { max: "", spent: null, recovery: [] }, activities },
  };
  return {
    ...source,
    id: source._id,
    system: { ...source.system, activities: new Map(Object.entries(activities)) },
    toObject: () => foundry.utils.deepClone(source),
  } as any;
}

function makeParsedItem(activities: Record<string, any>, flags: Record<string, any> = {}) {
  return {
    _id: "freshIdIIIIIIIII",
    name: "Hypnovulfen Figure",
    img: "icons/figure.webp",
    type: "equipment",
    flags: { ddbimporter: flags },
    system: { uses: { max: "", spent: null, recovery: [] }, activities },
  } as any;
}

describe("DDBCharacterImporter.restoreDDBMatchedFlags", () => {

  it("retains activity uses spent from a live matched document", () => {
    const existing = makeLiveItem({
      activities: { addCursedHunger1: makeActivityData({ id: "addCursedHunger1", name: "Cursed Hunger", max: "99", spent: 15 }) },
    });
    const item = makeParsedItem(
      { addCursedHunger1: makeActivityData({ id: "addCursedHunger1", name: "Cursed Hunger", max: "99", spent: 99 }) },
      { retainActivityUseSpent: ["Cursed Hunger"] },
    );

    DDBCharacterImporter.restoreDDBMatchedFlags(existing, item);

    expect(item.system.activities.addCursedHunger1.uses.spent).toBe(15);
    expect(item._id).toBe("figureIdIIIIIIII");
  });

  it("restores activity consumption from a live matched document under retainResourceConsumption", () => {
    const original = makeActivityData({ id: "addCursedHunger1", name: "Cursed Hunger", max: "99", spent: 15 });
    original.consumption = { targets: [{ type: "itemUses", value: "1" } as any] };
    const existing = makeLiveItem({
      activities: { addCursedHunger1: original },
      flags: { retainResourceConsumption: true },
    });
    const item = makeParsedItem(
      { addCursedHunger1: makeActivityData({ id: "addCursedHunger1", name: "Cursed Hunger", max: "99", spent: 99 }) },
    );

    DDBCharacterImporter.restoreDDBMatchedFlags(existing, item);

    expect(item.system.activities.addCursedHunger1.consumption.targets).toEqual([{ type: "itemUses", value: "1" }]);
  });

  it("leaves activities alone when neither flag is set", () => {
    const existing = makeLiveItem({
      activities: { addCursedHunger1: makeActivityData({ id: "addCursedHunger1", name: "Cursed Hunger", max: "99", spent: 15 }) },
    });
    const item = makeParsedItem(
      { addCursedHunger1: makeActivityData({ id: "addCursedHunger1", name: "Cursed Hunger", max: "99", spent: 99 }) },
    );

    DDBCharacterImporter.restoreDDBMatchedFlags(existing, item);

    expect(item.system.activities.addCursedHunger1.uses.spent).toBe(99);
  });

});
