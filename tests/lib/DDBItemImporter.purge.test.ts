import { describe, it, expect, vi } from "vitest";
import DDBItemImporter from "../../src/lib/DDBItemImporter";
import CompendiumHelper from "../../src/lib/CompendiumHelper";
import utils from "../../src/lib/Utils";

/**
 * Before an existing compendium document is updated its embedded effects (and table results)
 * are purged. That purge must be a non-recursive replacement of the branch, not a deleteAll:
 * deleteAll sends the ids from this client's cached copy of the document, and the server rejects
 * the whole request when any of them is already gone ("ActiveEffect X does not exist!"), which is
 * what a second munch writing the same document at the same time produces.
 */

const PACK_ID = "test.features";

function makeImporter() {
  const compendium = {
    metadata: { id: PACK_ID },
    configure: () => undefined,
  };
  const originalGetCompendiumType = CompendiumHelper.getCompendiumType;
  const originalGetSetting = utils.getSetting;
  CompendiumHelper.getCompendiumType = (() => compendium) as unknown as typeof CompendiumHelper.getCompendiumType;
  utils.getSetting = (() => false) as unknown as typeof utils.getSetting;
  try {
    return new DDBItemImporter<I5eFeatItem>("features", [], { recursive: false });
  } finally {
    CompendiumHelper.getCompendiumType = originalGetCompendiumType;
    utils.getSetting = originalGetSetting;
  }
}

function makeExisting({ effects = 0, results }: { effects?: number; results?: number } = {}) {
  const existing = {
    _id: "zxTt1Hs3mQvIqlaQ",
    name: "Tactical Master",
    type: "feat",
    flags: {},
    effects: { size: effects },
    update: vi.fn(async () => existing),
    deleteEmbeddedDocuments: vi.fn(async () => []),
  } as Record<string, any>;
  if (results !== undefined) existing.results = { size: results };
  return existing;
}

describe("DDBItemImporter.purgeEmbeddedDocuments", () => {

  it("replaces the effects branch with a non-recursive update", async () => {
    const importer = makeImporter();
    const existing = makeExisting({ effects: 1 });

    await importer.purgeEmbeddedDocuments(existing as any);

    expect(existing.deleteEmbeddedDocuments).not.toHaveBeenCalled();
    expect(existing.update).toHaveBeenCalledTimes(1);
    expect(existing.update).toHaveBeenCalledWith(
      { effects: [] },
      { pack: PACK_ID, render: false, recursive: false },
    );
  });

  it("purges table results alongside effects", async () => {
    const importer = makeImporter();
    const existing = makeExisting({ effects: 2, results: 3 });

    await importer.purgeEmbeddedDocuments(existing as any);

    expect(existing.update).toHaveBeenCalledWith(
      { results: [], effects: [] },
      { pack: PACK_ID, render: false, recursive: false },
    );
  });

  it("does nothing when there is nothing embedded to purge", async () => {
    const importer = makeImporter();
    const existing = makeExisting({ effects: 0, results: 0 });

    await importer.purgeEmbeddedDocuments(existing as any);

    expect(existing.update).not.toHaveBeenCalled();
    expect(existing.deleteEmbeddedDocuments).not.toHaveBeenCalled();
  });

});

describe("DDBItemImporter.updateCompendiumItem", () => {

  it("never deletes embedded documents by id", async () => {
    const importer = makeImporter();
    const existing = makeExisting({ effects: 1 });
    const updateItem = {
      _id: existing._id,
      name: "Tactical Master",
      type: "feat",
      flags: { ddbimporter: {} },
      system: {},
      effects: [{ _id: "tALIj43Nt4oBx2cY", name: "Tactical Master" }],
    };

    await importer.updateCompendiumItem(updateItem as unknown as I5eFeatItem, existing as any);

    expect(existing.deleteEmbeddedDocuments).not.toHaveBeenCalled();
    expect(existing.update).toHaveBeenCalledTimes(2);
    expect(existing.update.mock.calls[0][0]).toEqual({ effects: [] });
    expect(existing.update.mock.calls[1][0]).toBe(updateItem);
  });

});
