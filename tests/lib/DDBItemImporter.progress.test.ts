import { describe, it, expect, afterEach } from "vitest";
import DDBItemImporter from "../../src/lib/DDBItemImporter";
import CompendiumHelper from "../../src/lib/CompendiumHelper";
import DDBEffectImporter from "../../src/lib/DDBEffectImporter";
import utils from "../../src/lib/Utils";

/**
 * The munch progress bar reads currentDocumentCount / totalDocuments. The total must be the
 * documents actually written (after duplicate filtering), and the count must start from zero on
 * every updateCompendium call even when a handler is reused (buildHandler's overrideHandler).
 */

const originals = {
  getCompendiumType: CompendiumHelper.getCompendiumType,
  getSetting: utils.getSetting,
  importStandaloneEffects: DDBEffectImporter.importStandaloneEffects,
  game: (globalThis as any).game,
  Hooks: (globalThis as any).Hooks,
};

afterEach(() => {
  CompendiumHelper.getCompendiumType = originals.getCompendiumType;
  utils.getSetting = originals.getSetting;
  DDBEffectImporter.importStandaloneEffects = originals.importStandaloneEffects;
  (globalThis as any).game = originals.game;
  (globalThis as any).Hooks = originals.Hooks;
});

function makeImporter(documents: any[], options: Record<string, unknown> = {}) {
  const compendium = { metadata: { id: "test.items" }, configure: () => undefined };
  CompendiumHelper.getCompendiumType = (() => compendium) as unknown as typeof CompendiumHelper.getCompendiumType;
  utils.getSetting = (() => false) as unknown as typeof utils.getSetting;
  DDBEffectImporter.importStandaloneEffects = async () => undefined;
  (globalThis as any).game = { ...(originals.game ?? {}), user: { isGM: true } };
  (globalThis as any).Hooks = { callAll: () => true };

  const importer = new DDBItemImporter<any>("items", documents, { useCompendiumFolders: false, ...options });
  const seen: { current: number; total: number }[] = [];
  // every input is a new document: count it the way createCompendiumItem does
  importer.createCompendiumItems = async function (items: any[]) {
    for (const _item of items) {
      this.currentDocumentCount++;
      seen.push({ current: this.currentDocumentCount, total: this.totalDocuments });
    }
    return items;
  };
  return { importer, seen };
}

const doc = (name: string) => ({ name, type: "loot", flags: { ddbimporter: { is2014: true, is2024: false } } });

describe("DDBItemImporter.updateCompendium progress", () => {

  it("totals the documents left after duplicate filtering", async () => {
    const { importer, seen } = makeImporter([doc("Tinderbox"), doc("Tinderbox"), doc("Rope")]);

    await importer.updateCompendium(false);

    expect(seen).toEqual([{ current: 1, total: 2 }, { current: 2, total: 2 }]);
  });

  it("restarts the count when a handler is reused", async () => {
    const { importer, seen } = makeImporter([doc("Tinderbox"), doc("Rope")]);

    await importer.updateCompendium(false);
    importer.documents = [doc("Torch")];
    await importer.updateCompendium(false);

    expect(seen.at(-1)).toEqual({ current: 1, total: 1 });
  });

  it("does not create again an item the update pass wrote after the index lost its match flags", async () => {
    // the items munch matches on these flags
    const { importer } = makeImporter([doc("Tinderbox"), doc("Rope")], { matchFlags: ["is2014", "is2024"] });
    // restore the real create pass; count creates at the single document write instead
    delete (importer as any).createCompendiumItems;
    const created: string[] = [];
    importer.createCompendiumItem = async function (item: any) {
      this.currentDocumentCount++;
      created.push(item.name);
      return item;
    };

    // the pack's live index: another getIndex call with a narrower field set means entries rewritten
    // afterwards are indexed without flags.ddbimporter
    const index = new Map<string, any>([
      ["tinderbox00000000", { _id: "tinderbox00000000", name: "Tinderbox", flags: { ddbimporter: { is2014: true, is2024: false } } }],
    ]);
    importer.compendiumIndex = { filter: (fn: (i: any) => boolean) => [...index.values()].filter(fn) } as any;
    importer.getFilteredItemDocuments = async function (item: any) {
      return (await this.getFilteredItemIndexes(item)).map((idx: any) => ({
        _id: idx._id,
        name: idx.name,
        type: "loot",
        flags: {},
        update: async () => {
          index.set(idx._id, { _id: idx._id, name: idx.name });
          return idx;
        },
      })) as any;
    };

    await importer.updateCompendium(true);

    expect(created).toEqual(["Rope"]);
    expect(importer.currentDocumentCount).toBe(2);
  });
});
