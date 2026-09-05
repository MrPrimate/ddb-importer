import { DDBCompendiumFolders } from "../../src/lib/DDBCompendiumFolders";
import CompendiumHelper from "../../src/lib/CompendiumHelper";

/**
 * DDB serves a legacy subclass under the 2024 ruleset with its book appended
 * ("Rune Knight (TCoE)"), which is the name that reaches both the folder
 * builder (via classMeta) and the document's subClass flag. These cover the
 * specialist sub-folders that used to be gated on the bare subclass name, so
 * their documents landed in the compendium root.
 */

interface IFakeFolder {
  _id: string;
  name: string;
  folder: string | null;
  flags: { ddbimporter: { flagTag: string } };
}

function makeCompendiumFolders(type = "features" as TCompendiumTypes) {
  const folders: IFakeFolder[] = [];
  let nextId = 0;
  const compendiumFolders = new DDBCompendiumFolders(type);
  (compendiumFolders as any).compendium = { folders, metadata: { id: "test-pack" } };

  const original = CompendiumHelper.createFolder;
  CompendiumHelper.createFolder = (async (
    { name = "", parentId = null, flagTag = "" }: { name?: string; parentId?: string | null; flagTag?: string } = {},
  ) => {
    const existing = folders.find((f) => f.name === name && f.flags.ddbimporter.flagTag === flagTag);
    if (existing) return existing;
    const folder: IFakeFolder = {
      _id: `folder-${++nextId}`,
      name,
      folder: parentId,
      flags: { ddbimporter: { flagTag } },
    };
    folders.push(folder);
    return folder;
  }) as unknown as typeof CompendiumHelper.createFolder;

  function restore() {
    CompendiumHelper.createFolder = original;
  }

  return { compendiumFolders, folders, restore };
}

function makeFeature({ name, subClass, klass = "Fighter", rules = "2024", subtype = "" }: {
  name: string;
  subClass: string;
  klass?: string;
  rules?: string;
  subtype?: string;
}) {
  return {
    name,
    type: "feat",
    system: {
      type: { value: "class", subtype },
      source: { book: "TCoE", rules },
    },
    flags: { ddbimporter: { class: klass, subClass } },
  } as any;
}

describe("DDBCompendiumFolders.getBaseSubclassName", () => {
  it("strips a trailing source book suffix", () => {
    expect(DDBCompendiumFolders.getBaseSubclassName("Rune Knight (TCoE)")).toBe("Rune Knight");
    expect(DDBCompendiumFolders.getBaseSubclassName("Path of the Beast (TCoE)")).toBe("Path of the Beast");
  });

  it("leaves an unsuffixed name alone", () => {
    expect(DDBCompendiumFolders.getBaseSubclassName("Battle Master")).toBe("Battle Master");
  });
});

describe("DDBCompendiumFolders specialist subclass folders", () => {
  let harness: ReturnType<typeof makeCompendiumFolders>;

  beforeEach(() => {
    harness = makeCompendiumFolders();
  });

  afterEach(() => {
    harness.restore();
  });

  it("creates the Runes folder for a book suffixed Rune Knight", async () => {
    const { compendiumFolders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Rune Knight (TCoE)", "Fighter", "2024");

    const rune = makeFeature({ name: "Fire Rune", subClass: "Rune Knight (TCoE)", subtype: "rune" });
    expect(compendiumFolders.getCompendiumFolderData(rune)).toEqual({
      name: "Runes",
      flagTag: "2024/features/Rune Knight (TCoE)/Runes",
    });
    expect(compendiumFolders.getFolderId(rune)).toBeDefined();
  });

  it("still creates the Runes folder for the unsuffixed 2014 Rune Knight", async () => {
    const { compendiumFolders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Rune Knight", "Fighter", "2014");

    const rune = makeFeature({ name: "Fire Rune", subClass: "Rune Knight", rules: "2014", subtype: "rune" });
    expect(compendiumFolders.getFolderId(rune)).toBeDefined();
  });

  it("creates the Maneuver Options and Experimental Elixirs folders regardless of suffix", async () => {
    const { compendiumFolders, folders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Battle Master (PHB)", "Fighter", "2024");
    await compendiumFolders.createSubClassFeatureFolder("Alchemist (TCoE)", "Artificer", "2024");

    expect(folders.map((f) => f.flags.ddbimporter.flagTag)).toEqual(
      expect.arrayContaining([
        "2024/features/Battle Master (PHB)/Maneuver Options",
        "2024/features/Alchemist (TCoE)/Experimental Elixirs",
      ]),
    );
  });

  it("files a plain subclass feature in the subclass folder", async () => {
    const { compendiumFolders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Rune Knight (TCoE)", "Fighter", "2024");

    const feature = makeFeature({ name: "Master of Runes", subClass: "Rune Knight (TCoE)" });
    expect(compendiumFolders.getFolderId(feature)).toBeDefined();
  });
});

describe("DDBCompendiumFolders effect folders", () => {
  const originalDDB = (globalThis as any).CONFIG?.DDB;

  beforeAll(() => {
    (globalThis as any).CONFIG ??= {};
    (globalThis as any).CONFIG.DDB = {
      sources: [{ name: "PHB-2024", sourceCategoryId: 13 }],
      sourceCategories: [{ id: 13, name: "Core D&D" }],
    };
  });

  afterAll(() => {
    (globalThis as any).CONFIG.DDB = originalDDB;
  });

  function makeEffect(parent: Partial<IDDBStandaloneEffectParent>) {
    return {
      _id: "ddbEffect00000001",
      name: "Silenced",
      flags: { ddbimporter: { parent: { name: "Silence", type: "spell", bookCode: "PHB-2024", isLegacy: false, ...parent } } },
    } as unknown as I5eEffectData;
  }

  it("creates Source Category -> Type -> Parent name and reuses the tree", async () => {
    const { compendiumFolders, folders, restore } = makeCompendiumFolders("effects" as TCompendiumTypes);
    try {
      const leaf = await compendiumFolders.createEffectFolder(makeEffect({}));
      expect(folders.map((f) => f.name)).toEqual(["Core D&D", "Spells", "Silence"]);
      const [category, type] = folders;
      expect(type.folder).toBe(category._id);
      expect(leaf.folder).toBe(type._id);
      expect((leaf as unknown as IFakeFolder).flags.ddbimporter.flagTag).toBe("effects/13/spell/Silence");

      const again = await compendiumFolders.createEffectFolder(makeEffect({}));
      expect(again._id).toBe(leaf._id);
      expect(folders).toHaveLength(3);

      await compendiumFolders.createEffectFolder(makeEffect({ name: "Aura of Life" }));
      await compendiumFolders.createEffectFolder(makeEffect({ name: "Spirit Totem", type: "classFeature" }));
      expect(folders.map((f) => f.name)).toEqual(["Core D&D", "Spells", "Silence", "Aura of Life", "Class Features", "Spirit Totem"]);
      expect(compendiumFolders.getFolderId(makeEffect({ name: "Spirit Totem", type: "classFeature" }) as any)).toBe(folders[5]._id);
    } finally {
      restore();
    }
  });

  it("falls back to Unknown / Other for effects without a recognisable parent", async () => {
    const { compendiumFolders, folders, restore } = makeCompendiumFolders("effects" as TCompendiumTypes);
    try {
      await compendiumFolders.createEffectFolder({ _id: "x", name: "Loose" } as unknown as I5eEffectData);
      expect(folders.map((f) => f.name)).toEqual(["Unknown", "Other", "Unknown"]);
    } finally {
      restore();
    }
  });
});

/**
 * dnd5e 6.0 stores rarity as the `rarities` set and a compendium index is raw source, so the
 * rarity folder pass meets three entry shapes over a pack's life: legacy (`rarity` string only),
 * updated (`rarities` plus a stale `rarity`), fresh (`rarities` only). DDB's "Varies" survives only
 * on the dndbeyond flag (new imports) or as the old "varies" string (un-migrated packs).
 */
describe("DDBCompendiumFolders.getItemFolderNameForRarity", () => {
  const name = (document: any) => DDBCompendiumFolders.getItemFolderNameForRarity(document).name;

  it("buckets by the first key of a rarities array or Set", () => {
    expect(name({ system: { rarities: ["veryRare"] } })).toBe("Very Rare");
    expect(name({ system: { rarities: new Set(["uncommon", "rare"]) } })).toBe("Uncommon");
    expect(name({ system: { rarities: ["artifact"] } })).toBe("Artifact");
  });

  it("ignores a stale legacy string once rarities is present", () => {
    expect(name({ system: { rarities: ["common"], rarity: "rare" } })).toBe("Common");
    expect(name({ system: { rarities: [], rarity: "rare" } })).toBe("Unknown");
    expect(name({ system: { rarities: [], rarity: "rare" }, flags: { ddbimporter: { dndbeyond: { rarity: "Varies" } } } }))
      .toBe("Varies");
  });

  it("uses the DDB label on the flag for Varies and Unknown Rarity", () => {
    expect(name({ system: { rarities: [] }, flags: { ddbimporter: { dndbeyond: { rarity: "Varies" } } } })).toBe("Varies");
    expect(name({ system: { rarities: [] }, flags: { ddbimporter: { dndbeyond: { rarity: "Unknown Rarity" } } } }))
      .toBe("Unknown");
  });

  it("files mundane gear under Unknown even though DDB labels it Common", () => {
    expect(name({ system: { rarities: [] }, flags: { ddbimporter: { dndbeyond: { rarity: "Common" } } } })).toBe("Unknown");
    expect(name({ system: { rarities: [] } })).toBe("Unknown");
    expect(name({ system: {} })).toBe("Unknown");
  });

  it("still reads a pre-6.0 pack entry", () => {
    expect(name({ system: { rarity: "veryRare" } })).toBe("Very Rare");
    expect(name({ system: { rarity: "Very Rare" } })).toBe("Very Rare");
    expect(name({ system: { rarity: "varies" } })).toBe("Varies");
    expect(name({ system: { rarity: "" } })).toBe("Unknown");
  });
});
