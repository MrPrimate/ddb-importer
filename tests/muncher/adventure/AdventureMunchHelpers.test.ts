import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AdventureMunchHelpers from "../../../src/muncher/adventure/AdventureMunchHelpers";
import { CompendiumHelper } from "../../../src/lib/_module";

// index rows are shaped like a compendium index: monsters carry flags.ddbimporter.id,
// items and spells carry flags.ddbimporter.definitionId
function makeIndex() {
  return [
    { _id: "monsterA", name: "Goblin", flags: { ddbimporter: { id: 17 } } },
    { _id: "monsterB", name: "Orc", flags: { ddbimporter: { id: 42 } } },
    { _id: "docA", name: "Longsword", flags: { ddbimporter: { definitionId: 100 } } },
    { _id: "docB", name: "Fireball", flags: { ddbimporter: { definitionId: 200 } } },
  ];
}

let index: ReturnType<typeof makeIndex>;

beforeEach(() => {
  index = makeIndex();
  vi.spyOn(CompendiumHelper, "getCompendiumType").mockImplementation((() => ({
    getIndex: async () => index,
    // the temporary path clones the compendium document rather than importing it
    getDocument: async (id: string) => {
      const entry = index.find((i) => i._id === id);
      return entry ? { clone: () => ({ ...entry }) } : null;
    },
  })) as unknown as typeof CompendiumHelper.getCompendiumType);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdventureMunchHelpers.documentFamily", () => {
  it("collapses both spellings of each handled type", () => {
    expect(AdventureMunchHelpers.documentFamily("monster")).toBe("monster");
    expect(AdventureMunchHelpers.documentFamily("monsters")).toBe("monster");
    expect(AdventureMunchHelpers.documentFamily("npc")).toBe("monster");
    expect(AdventureMunchHelpers.documentFamily("item")).toBe("item");
    expect(AdventureMunchHelpers.documentFamily("items")).toBe("item");
    expect(AdventureMunchHelpers.documentFamily("spell")).toBe("spell");
    expect(AdventureMunchHelpers.documentFamily("spells")).toBe("spell");
  });

  it("returns null for types these helpers do not branch on", () => {
    expect(AdventureMunchHelpers.documentFamily("journal")).toBeNull();
    expect(AdventureMunchHelpers.documentFamily("background")).toBeNull();
  });
});

describe("AdventureMunchHelpers.getCompendiumIndex", () => {
  it("requests the monster id field for either spelling", async () => {
    const spy = vi.fn(async (_options: { fields: string[] }) => index);
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockImplementation((() => ({
      getIndex: spy,
    })) as unknown as typeof CompendiumHelper.getCompendiumType);

    await AdventureMunchHelpers.getCompendiumIndex("monster");
    await AdventureMunchHelpers.getCompendiumIndex("monsters");
    await AdventureMunchHelpers.getCompendiumIndex("items");
    expect(spy.mock.calls.map(([options]) => options.fields)).toEqual([
      ["flags.ddbimporter.id"],
      ["flags.ddbimporter.id"],
      ["flags.ddbimporter.definitionId"],
    ]);
  });
});

describe("AdventureMunchHelpers.getMissingIds", () => {
  it("matches on the monster id flag for the plural spelling", async () => {
    expect(await AdventureMunchHelpers.getMissingIds("monsters", [17, 99])).toEqual([99]);
  });

  it("matches on the definition id flag for the plural spelling", async () => {
    expect(await AdventureMunchHelpers.getMissingIds("items", [100, 999])).toEqual([999]);
  });
});

describe("AdventureMunchHelpers.getDocuments", () => {
  // regression pin: the plural spellings are what AdventureMunch._createAdventure historically
  // passed, and they silently matched nothing
  it.each([
    ["item", 100, "docA"],
    ["items", 100, "docA"],
    ["spell", 200, "docB"],
    ["spells", 200, "docB"],
  ] as const)("matches definition ids for type %s", async (type, id, expectedId) => {
    const docs = await AdventureMunchHelpers.getDocuments(type, [id], {}, true) as { _id: string }[];
    expect(docs.map((d) => d._id)).toEqual([expectedId]);
  });

  it.each(["monster", "monsters", "npc"] as const)("matches ddb ids for type %s", async (type) => {
    const docs = await AdventureMunchHelpers.getDocuments(type, [42], {}, true) as { _id: string }[];
    expect(docs.map((d) => d._id)).toEqual(["monsterB"]);
  });

  it("returns nothing for a type these helpers do not handle", async () => {
    expect(await AdventureMunchHelpers.getDocuments("journal", [100, 200, 42], {}, true)).toEqual([]);
  });

  it("returns nothing when no id matches", async () => {
    expect(await AdventureMunchHelpers.getDocuments("items", [999], {}, true)).toEqual([]);
  });
});
