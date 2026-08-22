import { describe, it, expect } from "vitest";
import DDBItemImporter from "../../src/lib/DDBItemImporter";
import CompendiumHelper from "../../src/lib/CompendiumHelper";
import utils from "../../src/lib/Utils";

/**
 * Mundane gear shared between the 2014 and 2024 rulesets (e.g. Plate) is a single DDB item and is
 * munched once, under whichever rules version DDBItem resolves it to. A monster of the *other*
 * rules version must still be able to find it for AC, so getCompendiumItems' strict
 * system.source.rules match needs a relaxed second pass - limited to the originals the strict
 * pass missed, so a preferred-version copy still wins and nothing is duplicated.
 */

interface IFakeDoc {
  _id: string;
  name: string;
  type: string;
  system: { source: { rules: string }; quantity?: number; equipped?: boolean };
  flags: Record<string, any>;
}

function makeImporter(docs: IFakeDoc[]) {
  const compendium = {
    metadata: { id: "test.inventory" },
    configure: () => undefined,
    getIndex: async () => docs.map((d) => ({
      _id: d._id,
      name: d.name,
      type: d.type,
      system: { source: { rules: d.system.source.rules } },
      flags: d.flags,
    })),
    getDocument: async (id: string) => {
      const doc = docs.find((d) => d._id === id);
      if (!doc) throw new Error(`no doc ${id}`);
      return { toObject: () => foundry.utils.duplicate(doc) };
    },
  };
  const originalGetCompendiumType = CompendiumHelper.getCompendiumType;
  const originalGetSetting = utils.getSetting;
  CompendiumHelper.getCompendiumType = (() => compendium) as unknown as typeof CompendiumHelper.getCompendiumType;
  utils.getSetting = (() => false) as unknown as typeof utils.getSetting;
  try {
    return new DDBItemImporter("inventory", [], {
      indexFilter: { fields: ["name", "flags.ddbimporter.dndbeyond.alternativeNames", "system.source.rules"] },
      matchFields: ["system.source.rules"],
    });
  } finally {
    CompendiumHelper.getCompendiumType = originalGetCompendiumType;
    utils.getSetting = originalGetSetting;
  }
}

function doc(id: string, name: string, rules: string): IFakeDoc {
  return {
    _id: id,
    name,
    type: "equipment",
    system: { source: { rules }, quantity: 1, equipped: false },
    flags: { ddbimporter: {} },
  };
}

function probe(name: string, rules: string) {
  return {
    name,
    type: "equipment",
    flags: { ddbimporter: {} },
    system: { quantity: 1, equipped: true, source: { rules } },
  } as unknown as TAll5eDocuments;
}

const rulesOf = (d: TAll5eDocuments) => foundry.utils.getProperty(d, "system.source.rules") as string;

describe("DDBItemImporter rules fallback", () => {
  const OPTS = { looseMatch: true, monsterMatch: true };

  it("strict match still misses a shared item munched under the other ruleset", async () => {
    const importer = makeImporter([doc("plate24", "Plate", "2024")]);
    const results = await importer.loadPassedItemsFromCompendium([probe("Plate", "2014")], OPTS);
    expect(results).toHaveLength(0);
  });

  it("rulesFallback finds the shared item when no preferred-version copy exists", async () => {
    const importer = makeImporter([doc("plate24", "Plate", "2024")]);
    const results = await importer.loadPassedItemsFromCompendium([probe("Plate", "2014")], { ...OPTS, rulesFallback: true });
    expect(results.map((r) => r.name)).toEqual(["Plate"]);
    expect(rulesOf(results[0])).toBe("2024");
  });

  it("prefers the matching ruleset copy and does not duplicate when both exist", async () => {
    const importer = makeImporter([doc("plate14", "Plate", "2014"), doc("plate24", "Plate", "2024")]);
    const results = await importer.loadPassedItemsFromCompendium([probe("Plate", "2014")], { ...OPTS, rulesFallback: true });
    expect(results).toHaveLength(1);
    expect(rulesOf(results[0])).toBe("2014");
  });

  it("only relaxes the originals the strict pass missed", async () => {
    const importer = makeImporter([
      doc("shield14", "Shield", "2014"),
      doc("shield24", "Shield", "2024"),
      doc("plate24", "Plate", "2024"),
    ]);
    const results = await importer.loadPassedItemsFromCompendium(
      [probe("Plate", "2014"), probe("Shield", "2014")],
      { ...OPTS, rulesFallback: true },
    );
    expect(results.map((r) => `${r.name}:${rulesOf(r)}`).sort()).toEqual(["Plate:2024", "Shield:2014"]);
  });

  it("strict match keeps working unchanged without the option", async () => {
    const importer = makeImporter([doc("plate14", "Plate", "2014"), doc("plate24", "Plate", "2024")]);
    const results = await importer.loadPassedItemsFromCompendium([probe("Plate", "2014")], OPTS);
    expect(results).toHaveLength(1);
    expect(rulesOf(results[0])).toBe("2014");
  });
});
