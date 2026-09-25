import { describe, it, expect } from "vitest";
import CompendiumHelper from "../../src/lib/CompendiumHelper";

/**
 * Foundry's server builds the compendium index projection with setProperty(projection, field, 1)
 * per field, so a parent path followed by a child path throws. dnd5e 6.0 (#7232) added
 * "system.source" to the default Item index fields, which turned every "system.source.book" /
 * "system.source.rules" request on an Item pack into a world-load error.
 */
describe("CompendiumHelper.safeIndexFields", () => {
  it("drops fields beneath a pack default index field", () => {
    const pack = { indexFields: new Set(["name", "system.container", "system.identifier", "system.source"]) };
    const fields = ["name", "flags.ddbimporter", "system.source.book", "system.source.rules", "system.type.value"];
    expect(CompendiumHelper.safeIndexFields(pack, fields)).toEqual(["name", "flags.ddbimporter", "system.type.value"]);
  });

  it("drops fields beneath another requested field", () => {
    const fields = ["flags.ddbimporter", "flags.ddbimporter.id", "system.source.book"];
    expect(CompendiumHelper.safeIndexFields({ indexFields: new Set(["name"]) }, fields)).toEqual([
      "flags.ddbimporter",
      "system.source.book",
    ]);
  });

  it("keeps sub-fields when the pack does not index the parent", () => {
    const pack = { indexFields: new Set(["name", "system.details.type.value"]) };
    const fields = ["name", "flags.ddbimporter.id", "system.source.rules"];
    expect(CompendiumHelper.safeIndexFields(pack, fields)).toEqual(fields);
  });

  it("tolerates a missing pack or index field list", () => {
    const fields = ["name", "system.source.book"];
    expect(CompendiumHelper.safeIndexFields(undefined, fields)).toEqual(fields);
    expect(CompendiumHelper.safeIndexFields({}, fields)).toEqual(fields);
  });
});

describe("CompendiumHelper.queryCompendiumEntries", () => {
  it("does not request matchedProperties keys the pack already indexes at a parent path", async () => {
    let requestedFields: string[] | undefined;
    const pack = {
      indexFields: new Set(["name", "system.source"]),
      getIndex: async ({ fields }: { fields: string[] }) => {
        requestedFields = fields;
        return [
          { _id: "a", name: "Fireball", system: { source: { rules: "2014" } }, flags: {} },
          { _id: "b", name: "Fireball", system: { source: { rules: "2024" } }, flags: {} },
        ];
      },
    };
    const originalGet = (globalThis as any).game.packs.get;
    (globalThis as any).game.packs.get = () => pack;
    try {
      const results = await CompendiumHelper.queryCompendiumEntries({
        compendiumName: "world.spells",
        documentNames: ["Fireball"],
        matchedProperties: { "system.source.rules": "2024" },
      });
      expect(requestedFields).toEqual(["name", "flags.ddbimporter.originalName"]);
      expect(results?.[0]?._id).toBe("b");
    } finally {
      (globalThis as any).game.packs.get = originalGet;
    }
  });
});
