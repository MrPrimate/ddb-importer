// Characterization tests for the pure sync-data helpers extracted from
// src/updater/character.ts. These pin the payload shapes the DDB sync sends,
// using hand-built actor/item stubs - no network, settings, or UI.
import { installDocumentStub } from "../_fixtures/ddb/stubs";
import {
  CHARACTER_CONTAINER_ENTITY_TYPE_ID,
  PARTY_CONTAINER_ENTITY_TYPE_ID,
  getCharacterId,
  getContainerItems,
  setContainerDetails,
  getFoundryItems,
  getCustomItemDescription,
  getCurrencyValue,
  getValidContainer,
  generateItemsToAdd,
} from "../../src/updater/characterSyncData";

const CHARACTER_ID = "1234567";

function makeItem(overrides: Record<string, any> = {}): any {
  return foundry.utils.mergeObject({
    _id: "item0000000000id",
    name: "Test Item",
    flags: { ddbimporter: {} },
    system: {},
  }, overrides);
}

// actor.items behaves like a Foundry collection: array methods plus get()
function makeItemCollection(items: any[]): any {
  const collection: any = [...items];
  collection.get = (id: string) => {
    const found = items.find((i) => i._id === id);
    if (!found) return undefined;
    return { toObject: () => foundry.utils.deepClone(found) };
  };
  return collection;
}

function makeActor({ items = [] as any[], currency = undefined as any, characterId = CHARACTER_ID as string | null } = {}): any {
  return {
    name: "Test Character",
    flags: { ddbimporter: { dndbeyond: { characterId } } },
    system: { currency },
    items: makeItemCollection(items),
  };
}

describe("getCharacterId", () => {
  it("returns the DDB character id from actor flags", () => {
    expect(getCharacterId(makeActor())).toBe(CHARACTER_ID);
  });

  it("throws a re-import error when the id is missing", () => {
    expect(() => getCharacterId(makeActor({ characterId: null })))
      .toThrow(/missing a D&D Beyond character id/);
  });
});

describe("getCurrencyValue", () => {
  it("passes through integer coin values", () => {
    const actor = makeActor({ currency: { pp: 1, gp: 2, ep: 3, sp: 4, cp: 5 } });
    expect(getCurrencyValue(actor)).toEqual({ pp: 1, gp: 2, ep: 3, sp: 4, cp: 5 });
  });

  it("zeroes non-integer and missing values", () => {
    const actor = makeActor({ currency: { gp: 2.5, sp: "4" } });
    expect(getCurrencyValue(actor)).toEqual({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  });

  it("handles an actor with no currency block", () => {
    expect(getCurrencyValue(makeActor())).toEqual({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  });
});

describe("getCustomItemDescription", () => {
  beforeAll(() => {
    installDocumentStub();
  });

  it("strips html tags", () => {
    expect(getCustomItemDescription("<p>A <em>fancy</em> sword</p>")).toBe("A fancy sword");
  });

  it("truncates to the DDB 2055 character limit", () => {
    const long = "x".repeat(3000);
    expect(getCustomItemDescription(long)).toHaveLength(2055);
  });
});

function makeContainerItem(ddbId: number, id: string): any {
  return makeItem({
    _id: id,
    flags: { ddbimporter: { id: ddbId, containerEntityId: parseInt(CHARACTER_ID), entityTypeId: 999 } },
  });
}

describe("getContainerItems", () => {
  it("returns items flagged as character-held DDB containers", () => {
    const container = makeContainerItem(42, "container000000a");
    const nested = makeItem({ flags: { ddbimporter: { id: 43, containerEntityId: parseInt(CHARACTER_ID) } }, system: { container: "container000000a" } });
    const ignored = makeItem({ flags: { ddbimporter: { id: 44, containerEntityId: parseInt(CHARACTER_ID), ignoreItemImport: true } } });
    const foreign = makeItem({ flags: { ddbimporter: { id: 45, containerEntityId: 777 } } });
    const unflagged = makeItem({ flags: { ddbimporter: {} } });
    const actor = makeActor({ items: [container, nested, ignored, foreign, unflagged] });

    expect(getContainerItems(actor)).toEqual([container]);
  });
});

describe("setContainerDetails", () => {
  it("defaults to the character container when the item has no container field", () => {
    const actor = makeActor();
    const item = makeItem();
    setContainerDetails(actor, item);
    expect(item.flags.ddbimporter.containerEntityId).toBe(parseInt(CHARACTER_ID));
    expect(item.flags.ddbimporter.containerEntityTypeId).toBe(CHARACTER_CONTAINER_ENTITY_TYPE_ID);
  });

  it("points at the matched container's DDB ids", () => {
    const container = makeContainerItem(42, "container000000a");
    const actor = makeActor({ items: [container] });
    const item = makeItem({ system: { container: "container000000a" } });
    setContainerDetails(actor, item);
    expect(item.flags.ddbimporter.containerEntityId).toBe(42);
    expect(item.flags.ddbimporter.containerEntityTypeId).toBe(999);
  });

  it("preserves a party container assignment when no container matches", () => {
    const actor = makeActor();
    const item = makeItem({
      system: { container: "gone" },
      flags: { ddbimporter: { containerEntityId: 555, containerEntityTypeId: PARTY_CONTAINER_ENTITY_TYPE_ID } },
    });
    setContainerDetails(actor, item);
    expect(item.flags.ddbimporter.containerEntityId).toBe(555);
    expect(item.flags.ddbimporter.containerEntityTypeId).toBe(PARTY_CONTAINER_ENTITY_TYPE_ID);
  });

  it("falls back to the character container for a stale non-party container", () => {
    const actor = makeActor();
    const item = makeItem({
      system: { container: "gone" },
      flags: { ddbimporter: { containerEntityId: 555, containerEntityTypeId: 12345 } },
    });
    setContainerDetails(actor, item);
    expect(item.flags.ddbimporter.containerEntityId).toBe(parseInt(CHARACTER_ID));
    expect(item.flags.ddbimporter.containerEntityTypeId).toBe(CHARACTER_CONTAINER_ENTITY_TYPE_ID);
  });
});

describe("getFoundryItems", () => {
  it("returns owned items with container details, skipping update-ignored items", () => {
    const keep = makeItem({ _id: "keep000000000000" });
    const skip = makeItem({ _id: "skip000000000000", flags: { ddbimporter: { ignoreItemUpdate: true } } });
    const actor = makeActor({ items: [keep, skip] });

    const result = getFoundryItems(actor);
    expect(result).toHaveLength(1);
    expect(result[0]?._id).toBe("keep000000000000");
    expect(result[0]?.flags.ddbimporter?.containerEntityTypeId).toBe(CHARACTER_CONTAINER_ENTITY_TYPE_ID);
  });
});

describe("getValidContainer", () => {
  const container = makeItem({
    _id: "container000000a",
    flags: { ddbimporter: { id: 42, dndbeyond: { isContainer: true } } },
  });

  it("returns true when the container is the character itself", () => {
    expect(getValidContainer(makeActor(), CHARACTER_ID)).toBe(true);
  });

  it("finds a flagged container item by DDB id", () => {
    const actor = makeActor({ items: [container] });
    expect(getValidContainer(actor, 42)).toBe(container);
    expect(getValidContainer(actor, "42")).toBe(container);
  });

  it("returns undefined for a falsy or unknown id", () => {
    const actor = makeActor({ items: [container] });
    expect(getValidContainer(actor, 0)).toBeUndefined();
    expect(getValidContainer(actor, 999)).toBeUndefined();
  });
});

describe("generateItemsToAdd", () => {
  it("splits DDB-known items into toAdd payloads and the rest into custom", () => {
    const known = makeItem({
      flags: { ddbimporter: { definitionId: 100, definitionEntityTypeId: 200 } },
      system: { quantity: 3 },
    });
    const custom = makeItem({ name: "Homebrew Thing", system: { quantity: 1 } });
    const actor = makeActor();

    const result = generateItemsToAdd(actor, [known, custom]);
    expect(result.items).toEqual([known, custom]);
    expect(result.custom).toEqual([custom]);
    expect(result.toAdd).toEqual([{
      containerEntityId: parseInt(CHARACTER_ID),
      containerEntityTypeId: CHARACTER_CONTAINER_ENTITY_TYPE_ID,
      entityId: 100,
      entityTypeId: 200,
      quantity: 3,
    }]);
  });

  it("resolves a valid container's ids for contained items", () => {
    const container = makeItem({
      _id: "container000000a",
      flags: { ddbimporter: { id: 42, entityTypeId: 999, dndbeyond: { isContainer: true } } },
    });
    const known = makeItem({
      flags: { ddbimporter: { definitionId: 100, definitionEntityTypeId: 200, containerEntityId: 42 } },
      system: { quantity: 1 },
    });
    const actor = makeActor({ items: [container] });

    const result = generateItemsToAdd(actor, [known]);
    expect(result.toAdd[0]?.containerEntityId).toBe(42);
    expect(result.toAdd[0]?.containerEntityTypeId).toBe(999);
  });
});
