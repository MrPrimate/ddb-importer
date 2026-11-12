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

  it("files a 2014 subclass DDB names \"X (2014)\" in one folder under the bare name", async () => {
    const { compendiumFolders, folders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Barrow Guard (2014)", "Fighter", "2014");

    const feature = makeFeature({ name: "Tomb Castellan", subClass: "Barrow Guard (2014)", rules: "2014" });
    expect(compendiumFolders.getFolderId(feature)).toBeDefined();
    expect(folders.map((f) => f.name)).not.toContain("Barrow Guard (2014)");
    expect(folders.filter((f) => f.name === "Barrow Guard")).toHaveLength(1);
  });
});

describe("DDBCompendiumFolders World of Warcraft class folders", () => {
  let harness: ReturnType<typeof makeCompendiumFolders>;
  const WOW_ROGUE = 2921851;
  const WOW_PALADIN = 2921843;
  const WOW_PRIEST = 2921845;
  const WOW_WARLOCK = 2921853;

  beforeEach(() => {
    harness = makeCompendiumFolders();
  });

  afterEach(() => {
    harness.restore();
  });

  function wowFeature({ name, klass, classId, subClass = "", subtype = "" }: {
    name: string; klass: string; classId: number; subClass?: string; subtype?: string;
  }) {
    const feature = makeFeature({ name, subClass, klass, subtype });
    feature.flags.ddbimporter.classId = classId;
    feature.system.source.book = "WoW";
    return feature;
  }

  it("suffixes the class name by class id, trimming DDB's trailing space", () => {
    expect(DDBCompendiumFolders.folderClassName("Rogue ", WOW_ROGUE)).toBe("Rogue (WoW)");
    expect(DDBCompendiumFolders.folderClassName("Rogue", 2)).toBe("Rogue");
    expect(DDBCompendiumFolders.folderClassName("Rogue")).toBe("Rogue");
    expect(DDBCompendiumFolders.unsuffixedClassName("Warlock (WoW)")).toBe("Warlock");
    expect(DDBCompendiumFolders.unsuffixedClassName("Rune Knight (TCoE)")).toBe("Rune Knight (TCoE)");
  });

  it("files a WoW Rogue's features under Rogue (WoW), apart from the core Rogue", async () => {
    const { compendiumFolders, folders } = harness;
    await compendiumFolders.createClassFeatureFolder("Rogue", "2024");
    await compendiumFolders.createClassFeatureFolder("Rogue ", "2024", WOW_ROGUE);

    expect(folders.filter((f) => f.folder === null).map((f) => f.name)).toEqual(["Rogue", "Rogue (WoW)"]);
    const sneak = wowFeature({ name: "Sneak Attack", klass: "Rogue ", classId: WOW_ROGUE });
    expect(compendiumFolders.getCompendiumFolderData(sneak)).toEqual({
      name: "Class Features",
      flagTag: "2024/features/Rogue (WoW)",
    });
    const wowFolder = folders.find((f) => f.flags.ddbimporter.flagTag === "2024/features/Rogue (WoW)");
    expect(compendiumFolders.getFolderId(sneak)).toBe(wowFolder?._id);
  });

  it("keeps same-named specializations of different WoW classes apart", async () => {
    const { compendiumFolders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Holy Specialization", "Paladin", "2024", WOW_PALADIN);
    await compendiumFolders.createSubClassFeatureFolder("Holy Specialization", "Priest", "2024", WOW_PRIEST);

    const paladin = wowFeature({ name: "Beacon of Light", klass: "Paladin", classId: WOW_PALADIN, subClass: "Holy Specialization" });
    const priest = wowFeature({ name: "Divine Hymn", klass: "Priest", classId: WOW_PRIEST, subClass: "Holy Specialization" });
    expect(compendiumFolders.getCompendiumFolderData(paladin)?.flagTag).toBe("2024/features/Paladin (WoW)/Holy Specialization");
    expect(compendiumFolders.getCompendiumFolderData(priest)?.flagTag).toBe("2024/features/Priest (WoW)/Holy Specialization");
    expect(compendiumFolders.getFolderId(paladin)).toBeDefined();
    expect(compendiumFolders.getFolderId(paladin)).not.toBe(compendiumFolders.getFolderId(priest));
  });

  it("still gives a WoW Warlock's invocations the Invocations folder", async () => {
    const { compendiumFolders } = harness;
    await compendiumFolders.createClassFeatureFolder("Warlock", "2024", WOW_WARLOCK);

    const invocation = wowFeature({ name: "Eldritch Invocations: Health Funnel", klass: "Warlock", classId: WOW_WARLOCK, subtype: "eldritchInvocation" });
    expect(compendiumFolders.getCompendiumFolderData(invocation)).toEqual({
      name: "Invocations",
      flagTag: "2024/features/Warlock (WoW)/Invocations",
    });
    expect(compendiumFolders.getFolderId(invocation)).toBeDefined();
  });

  it("leaves core class features and their subclass folders where they were", async () => {
    const { compendiumFolders } = harness;
    await compendiumFolders.createSubClassFeatureFolder("Thief", "Rogue", "2024", 2);

    const feature = makeFeature({ name: "Fast Hands", subClass: "Thief", klass: "Rogue" });
    expect(compendiumFolders.getCompendiumFolderData(feature)?.flagTag).toBe("2024/features/Thief");
    expect(compendiumFolders.getFolderId(feature)).toBeDefined();
  });
});

/**
 * dnd5e 6.0 stores rarity as the `rarities` set and a compendium index is raw source, so the
 * rarity folder pass meets three entry shapes over a pack's life: legacy (`rarity` string only),
 * updated (`rarities` plus a stale `rarity`), fresh (`rarities` only). DDB's "Varies" survives only
 * on the dndbeyond flag (new imports) or as the old "varies" string (un-migrated packs).
 */
