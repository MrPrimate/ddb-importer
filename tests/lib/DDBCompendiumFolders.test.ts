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

/**
 * dnd5e 6.0 stores rarity as the `rarities` set and a compendium index is raw source, so the
 * rarity folder pass meets three entry shapes over a pack's life: legacy (`rarity` string only),
 * updated (`rarities` plus a stale `rarity`), fresh (`rarities` only). DDB's "Varies" survives only
 * on the dndbeyond flag (new imports) or as the old "varies" string (un-migrated packs).
 */
