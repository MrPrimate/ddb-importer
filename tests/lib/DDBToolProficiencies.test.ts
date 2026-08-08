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

function indexEntry(id: string, baseItem: string, { fallback = false } = {}) {
  return {
    _id: id,
    uuid: `Compendium.world.ddb-items.Item.${id}`,
    system: { type: { baseItem } },
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
