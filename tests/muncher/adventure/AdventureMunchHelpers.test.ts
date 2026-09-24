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

describe("AdventureMunchHelpers.getDocuments failures", () => {
  it("skips an entry whose compendium read fails instead of hanging the import", async () => {
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockImplementation((() => ({
      getIndex: async () => index,
      getDocument: async (id: string) => {
        if (id === "docA") throw new Error("unreadable entry");
        const entry = index.find((i) => i._id === id);
        return entry ? { clone: () => ({ ...entry }) } : null;
      },
    })) as unknown as typeof CompendiumHelper.getCompendiumType);

    const docs = await AdventureMunchHelpers.getDocuments("item", [100, 200], {}, true) as { _id: string }[];
    expect(docs.map((d) => d._id)).toEqual(["docB"]);
  });

  it("leaves out an entry that resolved to no document", async () => {
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockImplementation((() => ({
      getIndex: async () => index,
      getDocument: async (id: string) => {
        const entry = index.find((i) => i._id === id);
        return id === "docA" ? null : { clone: () => ({ ...entry }) };
      },
    })) as unknown as typeof CompendiumHelper.getCompendiumType);

    const docs = await AdventureMunchHelpers.getDocuments("item", [100, 200], {}, true) as { _id: string }[];
    expect(docs.map((d) => d._id)).toEqual(["docB"]);
  });
});

describe("AdventureMunchHelpers.loadMissingDocuments", () => {
  it("settles with nothing to load", async () => {
    await expect(AdventureMunchHelpers.loadMissingDocuments("item", [])).resolves.toEqual([]);
  });

  it("settles for a type it cannot import rather than never resolving", async () => {
    await expect(AdventureMunchHelpers.loadMissingDocuments("journal", [1, 2])).resolves.toEqual([]);
  });
});

describe("AdventureMunchHelpers.checkForMissingDocuments", () => {
  it("waits for the missing documents to finish importing", async () => {
    let finish!: () => void;
    const importing = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const load = vi.spyOn(AdventureMunchHelpers, "loadMissingDocuments").mockImplementation(async () => {
      await importing;
      return [];
    });

    let done = false;
    const pending = AdventureMunchHelpers.checkForMissingDocuments("item", [100, 999]).then(() => {
      done = true;
    });
    await vi.waitFor(() => expect(load).toHaveBeenCalledWith("item", [999], null));
    expect(done).toBe(false);
    finish();
    await pending;
    expect(done).toBe(true);
  });

  it("surfaces a failed import to the caller", async () => {
    vi.spyOn(AdventureMunchHelpers, "loadMissingDocuments").mockRejectedValue(new Error("proxy down"));
    await expect(AdventureMunchHelpers.checkForMissingDocuments("item", [999])).rejects.toThrow("proxy down");
  });
});
