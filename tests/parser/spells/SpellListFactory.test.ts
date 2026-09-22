/**
 * SpellListFactory.addSpellsByDefinitionId tops up an existing spell list from DDB spell
 * definition ids (the Mystic Arcanum choice options). These pin the id to uuid resolution and the
 * source book each spell is filed under; the journal writes themselves need a live compendium.
 */
// the lib barrel first: entering through SpellListFactory walks lib -> muncher -> DDBSpellListFactory
// while SpellListFactory is still mid-evaluation, and the subclass extends undefined
import { CompendiumHelper } from "../../../src/lib/_module";
import SpellListFactory from "../../../src/parser/spells/SpellListFactory";

const SPELL_INDEX = [
  { uuid: "Compendium.world.ddb-spells.Item.circle", flags: { ddbimporter: { definitionId: 101 } } },
  { uuid: "Compendium.world.ddb-spells.Item.eyebite", flags: { ddbimporter: { definitionId: 102 } } },
  { uuid: "Compendium.world.ddb-spells.Item.homebrew", flags: { ddbimporter: { definitionId: 103 } } },
];

function makeFactory({ useBasicRules = false } = {}) {
  vi.spyOn(CompendiumHelper, "getCompendiumType").mockImplementation(((type: string) => {
    return type === "spells" ? { index: SPELL_INDEX } : { index: [] };
  }) as any);
  (globalThis as any).game.settings.get = (_module: string, key: string) => (key === "use-basic-rules" ? useBasicRules : false);

  const factory = new SpellListFactory({ type: "class" });
  const built: { acronym: string; uuids: string[] }[] = [];
  factory.init = vi.fn(async () => undefined);
  factory.buildSpellList = vi.fn(async (source: ISpellListSource, name: string) => {
    built.push({ acronym: source.acronym, uuids: [...factory.uuidsBySourceAndSpellListName[source.acronym][name]] });
  });
  factory.registerSpellLists = vi.fn(async () => undefined);
  return { factory, built };
}

describe("SpellListFactory.addSpellsByDefinitionId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("files each resolved spell under its source book", async () => {
    const { factory, built } = makeFactory();
    const phb2024 = factory.sources?.find((s) => s.id === 145);
    const resolved = await factory.addSpellsByDefinitionId("Warlock", [
      { id: 101, sourceId: 145 },
      { id: 102, sourceId: 145 },
    ]);
    expect(resolved).toEqual([101, 102]);
    expect(built).toEqual([{
      acronym: phb2024?.acronym,
      uuids: ["Compendium.world.ddb-spells.Item.circle", "Compendium.world.ddb-spells.Item.eyebite"],
    }]);
    expect(factory.registerSpellLists).toHaveBeenCalledTimes(1);
  });

  it("moves Basic Rules spells to the Player's Handbook when Basic Rules journals are off", async () => {
    const { factory, built } = makeFactory();
    const phb2014 = factory.sources?.find((s) => s.id === 2);
    await factory.addSpellsByDefinitionId("Warlock", [{ id: 101, sourceId: 1 }]);
    expect(built.map((b) => b.acronym)).toEqual([phb2014?.acronym]);
  });

  it("falls back to the Homebrew journal for an unknown or missing source", async () => {
    const { factory, built } = makeFactory();
    await factory.addSpellsByDefinitionId("Warlock", [{ id: 103, sourceId: null }, { id: 101, sourceId: 87654321 }]);
    expect(built).toEqual([{
      acronym: "Homebrew",
      uuids: ["Compendium.world.ddb-spells.Item.homebrew", "Compendium.world.ddb-spells.Item.circle"],
    }]);
  });

  it("reports only the ids it resolved, so the caller can retry the rest", async () => {
    const { factory } = makeFactory();
    const resolved = await factory.addSpellsByDefinitionId("Warlock", [
      { id: 101, sourceId: 145 },
      { id: 999, sourceId: 145 },
    ]);
    expect(resolved).toEqual([101]);
  });

  it("writes and registers nothing when no definition id is in the compendium", async () => {
    const { factory } = makeFactory();
    const resolved = await factory.addSpellsByDefinitionId("Warlock", [{ id: 999, sourceId: 145 }]);
    expect(resolved).toEqual([]);
    expect(factory.buildSpellList).not.toHaveBeenCalled();
    expect(factory.registerSpellLists).not.toHaveBeenCalled();
  });

  it("returns only resolved definition IDs from a partially available list", async () => {
    const { factory, built } = makeFactory();
    const resolvedIds = await factory.addSpellsByDefinitionId("Warlock", [
      { id: 999, sourceId: 145 },
      { id: 102, sourceId: 145 },
      { id: 101, sourceId: 145 },
      { id: 102, sourceId: 145 },
    ]);
    expect(resolvedIds).toEqual([102, 101]);
    expect(new Set(built[0].uuids)).toEqual(new Set([
      "Compendium.world.ddb-spells.Item.eyebite", "Compendium.world.ddb-spells.Item.circle",
    ]));
    expect(factory.registerSpellLists).toHaveBeenCalledTimes(1);
  });

  it.each(["available", "sources", "spellCompendium"] as const)("returns no IDs without %s", async (key) => {
    const { factory } = makeFactory();
    if (key === "available") factory.available = false;
    else factory[key] = null;
    expect(await factory.addSpellsByDefinitionId("Warlock", [{ id: 101, sourceId: 145 }])).toEqual([]);
    expect(factory.buildSpellList).not.toHaveBeenCalled();
    expect(factory.registerSpellLists).not.toHaveBeenCalled();
  });

  it.each(["buildSpellList", "registerSpellLists"] as const)("does not report success when %s rejects", async (method) => {
    const { factory } = makeFactory();
    vi.mocked(factory[method]).mockRejectedValueOnce(new Error("List unavailable"));
    await expect(factory.addSpellsByDefinitionId("Warlock", [{ id: 101, sourceId: 145 }]))
      .rejects.toThrow("List unavailable");
    expect(await factory.addSpellsByDefinitionId("Warlock", [{ id: 101, sourceId: 145 }])).toEqual([101]);
  });
});
