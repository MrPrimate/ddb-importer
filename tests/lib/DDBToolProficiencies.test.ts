import DDBToolProficiencies from "../../src/lib/DDBToolProficiencies";

const config: any = (globalThis as any).CONFIG;

function resetToolConfig() {
  config.DND5E.tools = {};
  config.DND5E.toolProficiencies = {
    art: "Artisan's Tools",
    game: "Gaming Set",
    music: "Musical Instrument",
    vehicle: "Vehicle",
  };
  DDBToolProficiencies.registered.clear();
}

beforeEach(() => {
  resetToolConfig();
});

// =============================================================================
// getToolKey
// =============================================================================

describe("DDBToolProficiencies.getToolKey", () => {
  it("uses the dnd5e id when the system has one", () => {
    expect(DDBToolProficiencies.getToolKey({ baseTool: "alchemist", name: "Alchemist's Supplies" }))
      .toBe("alchemist");
  });

  it("generates a key from the name when dnd5e has no id", () => {
    expect(DDBToolProficiencies.getToolKey({ baseTool: null, name: "Wargong" })).toBe("wargong");
    expect(DDBToolProficiencies.getToolKey({ name: "Monster Harvesting Tools" }))
      .toBe("monsterharvestingtools");
  });

  it("generates the same key for both apostrophe spellings", () => {
    // DDB writes Surgeon's Tools with a curly apostrophe
    expect(DDBToolProficiencies.getToolKey({ name: "Surgeon’s Tools" })).toBe("surgeonstools");
    expect(DDBToolProficiencies.getToolKey({ name: "Surgeon's Tools" })).toBe("surgeonstools");
  });
});

// =============================================================================
// register
// =============================================================================

describe("DDBToolProficiencies.register", () => {
  it("adds the tool to CONFIG.DND5E.tools with a non empty id", () => {
    // the id must never be empty: dnd5e calls String#startsWith on it every sheet render
    expect(DDBToolProficiencies.register({
      key: "wargong", name: "Wargong", ability: "dex", toolType: "music",
    })).toBe(true);

    expect(config.DND5E.tools.wargong.ability).toBe("dex");
    expect(typeof config.DND5E.tools.wargong.id).toBe("string");
    expect(config.DND5E.tools.wargong.id.length).toBeGreaterThan(0);
  });

  it("nests a grouped tool under its category, keeping the category label", () => {
    DDBToolProficiencies.register({ key: "wargong", name: "Wargong", ability: "dex", toolType: "music" });

    expect(config.DND5E.toolProficiencies.music).toEqual({
      label: "Musical Instrument",
      children: { wargong: { label: "Wargong" } },
    });
    // untouched categories stay as plain strings
    expect(config.DND5E.toolProficiencies.art).toBe("Artisan's Tools");
  });

  it("adds further tools to an already promoted category", () => {
    DDBToolProficiencies.register({ key: "wargong", name: "Wargong", ability: "dex", toolType: "music" });
    DDBToolProficiencies.register({ key: "glaur", name: "Glaur", ability: "dex", toolType: "music" });

    expect(config.DND5E.toolProficiencies.music.label).toBe("Musical Instrument");
    expect(Object.keys(config.DND5E.toolProficiencies.music.children)).toEqual(["wargong", "glaur"]);
  });

  it("registers an ungrouped tool at the top level", () => {
    DDBToolProficiencies.register({
      key: "surgeonstools", name: "Surgeon’s Tools", ability: "wis", toolType: "",
    });

    expect(config.DND5E.toolProficiencies.surgeonstools).toEqual({ label: "Surgeon’s Tools" });
  });

  it("never clobbers a tool the system already defines", () => {
    config.DND5E.tools.thief = { ability: "dex", id: "Compendium.dnd5e.equipment24.Item.phbtulThievesToo" };

    expect(DDBToolProficiencies.register({
      key: "thief", name: "Not Thieves' Tools", ability: "int", toolType: "",
    })).toBe(false);
    expect(config.DND5E.tools.thief.id).toBe("Compendium.dnd5e.equipment24.Item.phbtulThievesToo");
    expect(config.DND5E.toolProficiencies.thief).toBeUndefined();
  });

  it("ignores an empty key", () => {
    expect(DDBToolProficiencies.register({ key: "", name: "", ability: "int", toolType: "" })).toBe(false);
  });

  it("keeps the description on the registered tool", () => {
    // the stub items are built from this map, so a dropped field here would be lost on
    // the way to the compendium
    DDBToolProficiencies.register({
      key: "customtool1", name: "Custom Tool 1", ability: "int", toolType: "",
      description: "Some sploof about the tool",
    });

    expect(DDBToolProficiencies.registered.get("customtool1")?.description)
      .toBe("Some sploof about the tool");
  });

  it("tracks what it registered", () => {
    DDBToolProficiencies.register({ key: "wargong", name: "Wargong", ability: "dex", toolType: "music" });
    DDBToolProficiencies.registerAll([
      { key: "glaur", name: "Glaur", ability: "dex", toolType: "music" },
      { key: "wargong", name: "Wargong", ability: "dex", toolType: "music" },
    ]);

    expect([...DDBToolProficiencies.registered.keys()]).toEqual(["wargong", "glaur"]);
  });
});

// =============================================================================
// getDDBToolDescription
// =============================================================================

describe("DDBToolProficiencies.getDDBToolDescription", () => {
  let originalTools: any;

  beforeEach(() => {
    originalTools = config.DDB.tools;
  });

  afterEach(() => {
    config.DDB.tools = originalTools;
  });

  it("finds nothing in the shipped fallback config", () => {
    // the config transform strips description from every tool before the fallback is
    // committed, so descriptions only exist once the live config has been fetched
    expect(config.DDB.tools.every((t: any) => t.description === undefined)).toBe(true);
    expect(DDBToolProficiencies.getDDBToolDescription("bagpipes")).toBe("");
  });

  it("returns the description from the live config", () => {
    config.DDB.tools = [{ id: 1, name: "Wargong", description: "A large gong." }];
    expect(DDBToolProficiencies.getDDBToolDescription("wargong")).toBe("A large gong.");
  });

  it("matches regardless of which apostrophe DDB used", () => {
    // DDB writes this one with a curly apostrophe
    config.DDB.tools = [{ id: 1, name: "Surgeon’s Tools", description: "For surgery." }];
    expect(DDBToolProficiencies.getDDBToolDescription("surgeonstools")).toBe("For surgery.");
  });

  it("returns empty for an unknown key or a missing config", () => {
    config.DDB.tools = [{ id: 1, name: "Wargong", description: "A large gong." }];
    expect(DDBToolProficiencies.getDDBToolDescription("nosuchtool")).toBe("");
    config.DDB.tools = undefined;
    expect(DDBToolProficiencies.getDDBToolDescription("wargong")).toBe("");
  });
});

// =============================================================================
// buildFallbackItemData
// =============================================================================

describe("DDBToolProficiencies.buildFallbackItemData", () => {
  const wargong = { key: "wargong", name: "Wargong", ability: "dex" as const, toolType: "music" as const };

  it("builds a tool item linked back to the proficiency key", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData(wargong, "folder1");

    expect(data.name).toBe("Wargong");
    expect(data.type).toBe("tool");
    expect(data.folder).toBe("folder1");
    // baseItem is what links the item to the actor proficiency, and what the cleanup
    // pass matches on
    expect(data.system.type.baseItem).toBe("wargong");
    expect(data.system.type.value).toBe("music");
    expect(data.system.ability).toBe("dex");
  });

  it("seeds the generic tool icon for the Iconizer to replace", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData(wargong);

    expect(data.img).toBe("systems/dnd5e/icons/svg/items/tool.svg");
    // this must stay in step with CONFIG.DND5E.defaultArtwork.Item.tool, or the Iconizer
    // stages guarded by isDefaultOrPlaceholderImage will refuse to replace it
    expect(data.img).toBe((globalThis as any).CONFIG.DND5E.defaultArtwork.Item.tool);
  });

  it("flags the item so the cleanup pass can tell it from a munched one", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData(wargong);

    expect(data.flags.ddbimporter.toolFallback).toBe(true);
    expect(data.flags.ddbimporter.baseItem).toBe("wargong");
  });

  it("carries the ddb type so the generic tool image can be used as a fallback", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData(wargong);

    expect(data.flags.ddbimporter.dndbeyond.type).toBe("Tool");
  });

  it("takes the description from the DDB config when there is one", () => {
    const original = config.DDB.tools;
    config.DDB.tools = [{ id: 1, name: "Wargong", description: "A large gong." }];
    try {
      const data: any = DDBToolProficiencies.buildFallbackItemData(wargong);
      expect(data.system.description.value).toBe("A large gong.");
    } finally {
      config.DDB.tools = original;
    }
  });

  it("leaves the description empty when the config has none", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData(wargong);
    expect(data.system.description.value).toBe("");
  });

  it("prefers a carried description over the DDB catalogue", () => {
    const original = config.DDB.tools;
    config.DDB.tools = [{ id: 1, name: "Wargong", description: "The catalogue entry." }];
    try {
      const data: any = DDBToolProficiencies.buildFallbackItemData({
        ...wargong, description: "The character's own note.",
      });
      expect(data.system.description.value).toBe("The character's own note.");
    } finally {
      config.DDB.tools = original;
    }
  });

  it("uses a carried description for a tool the catalogue has never heard of", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData({
      key: "customtool1", name: "Custom Tool 1", ability: "int", toolType: "",
      description: "Some sploof about the tool",
    });
    expect(data.system.description.value).toBe("Some sploof about the tool");
  });

  it("tolerates having no folder", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData(wargong);
    expect(data.folder).toBeNull();
  });

  it("handles an ungrouped tool", () => {
    const data: any = DDBToolProficiencies.buildFallbackItemData({
      key: "surgeonstools", name: "Surgeon’s Tools", ability: "wis", toolType: "",
    });

    expect(data.system.type.value).toBe("");
    expect(data.system.type.baseItem).toBe("surgeonstools");
  });
});

// =============================================================================
// planCompendiumSync
// =============================================================================

function indexEntry(id: string, baseItem: string, { fallback = false, description = "" } = {}) {
  return {
    _id: id,
    uuid: `Compendium.world.ddb-items.Item.${id}`,
    system: { type: { baseItem }, description: { value: description } },
    flags: fallback ? { ddbimporter: { toolFallback: true } } : {},
  };
}

describe("DDBToolProficiencies.planCompendiumSync", () => {
  beforeEach(() => {
    DDBToolProficiencies.registerAll([
      { key: "wargong", name: "Wargong", ability: "dex", toolType: "music" },
      { key: "glaur", name: "Glaur", ability: "dex", toolType: "music" },
    ]);
  });

  it("asks for a stub when the compendium has nothing", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([]);

    expect(plan.missing.map((t) => t.key)).toEqual(["wargong", "glaur"]);
    expect(plan.links).toEqual([]);
    expect(plan.redundant).toEqual([]);
  });

  it("links to a stub and leaves it alone while it is the only item", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("stub1", "wargong", { fallback: true }),
      indexEntry("stub2", "glaur", { fallback: true }),
    ]);

    expect(plan.links).toEqual([
      { key: "wargong", uuid: "Compendium.world.ddb-items.Item.stub1" },
      { key: "glaur", uuid: "Compendium.world.ddb-items.Item.stub2" },
    ]);
    expect(plan.missing).toEqual([]);
    expect(plan.redundant).toEqual([]);
  });

  it("prefers a munched item and drops the stub it replaces", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("stub1", "wargong", { fallback: true }),
      indexEntry("real1", "wargong"),
      indexEntry("stub2", "glaur", { fallback: true }),
    ]);

    expect(plan.links).toContainEqual({ key: "wargong", uuid: "Compendium.world.ddb-items.Item.real1" });
    // the tool with no real item keeps its stub
    expect(plan.links).toContainEqual({ key: "glaur", uuid: "Compendium.world.ddb-items.Item.stub2" });
    expect(plan.redundant).toEqual(["stub1"]);
  });

  it("never marks a munched item as redundant", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("real1", "wargong"),
      indexEntry("real2", "wargong"),
    ]);

    expect(plan.redundant).toEqual([]);
    expect(plan.links).toEqual([{ key: "wargong", uuid: "Compendium.world.ddb-items.Item.real1" }]);
    expect(plan.missing.map((t) => t.key)).toEqual(["glaur"]);
  });

  it("dedupes duplicate stubs, keeping one", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("stub1", "wargong", { fallback: true }),
      indexEntry("stub2", "wargong", { fallback: true }),
      indexEntry("stub3", "wargong", { fallback: true }),
    ]);

    expect(plan.links).toEqual([{ key: "wargong", uuid: "Compendium.world.ddb-items.Item.stub1" }]);
    expect(plan.redundant).toEqual(["stub2", "stub3"]);
  });

  it("flags our own description-less stubs for a backfill", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("stub1", "wargong", { fallback: true }),
      indexEntry("stub2", "glaur", { fallback: true, description: "Already described." }),
    ]);

    // only the one with nothing to say
    expect(plan.needsDescription).toEqual([{ _id: "stub1", key: "wargong" }]);
  });

  it("never rewrites the description of a munched item", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("real1", "wargong"),
      indexEntry("real2", "glaur", { description: "The real thing." }),
    ]);

    expect(plan.needsDescription).toEqual([]);
  });

  it("ignores items belonging to tools it did not register", () => {
    const plan = DDBToolProficiencies.planCompendiumSync([
      indexEntry("stub9", "someoneelsestool", { fallback: true }),
      indexEntry("real9", "thief"),
    ]);

    expect(plan.redundant).toEqual([]);
    expect(plan.links).toEqual([]);
    expect(plan.missing.map((t) => t.key)).toEqual(["wargong", "glaur"]);
  });
});
