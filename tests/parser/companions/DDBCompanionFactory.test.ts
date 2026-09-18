// @vitest-environment jsdom
import DDBCompanionFactory from "../../../src/parser/companions/DDBCompanionFactory";

// Summon Plant has two printings with different forms; the table lists both and the block text
// decides which are built.
describe("DDBCompanionFactory.subTypesInBlock", () => {
  it("builds only the forms the Arcana Unleashed Plant Spirit block names", () => {
    const text = "Plant Spirit. When you cast the spell, choose Fungus, Tree, or Vine. Speed 30 ft. (Vine only) ...";
    expect(DDBCompanionFactory.subTypesInBlock("Plant Spirit", text)).toEqual(["Fungus", "Tree", "Vine"]);
  });

  it("builds only the GHPG forms when that printing comes back", () => {
    const text = "Plant Spirit. Blooming, Oaken, or Thorny. Armor Class 11 + the spell's level (Oaken)";
    expect(DDBCompanionFactory.subTypesInBlock("Plant Spirit", text)).toEqual(["Blooming", "Oaken", "Thorny"]);
  });

  it("matches whole words only and keeps the full list when the block names no form", () => {
    expect(DDBCompanionFactory.subTypesInBlock("Plant Spirit", "Treeline and vineyard scenery")).toEqual(
      ["Blooming", "Oaken", "Thorny", "Fungus", "Tree", "Vine"],
    );
    expect(DDBCompanionFactory.subTypesInBlock("Not A Multi Companion", "anything")).toEqual([]);
  });
});

/**
 * addCRSummoning merges table data onto the activity, and mergeObject replaces arrays: a creature
 * type restriction the enricher already stated (Wild Companion's fey-only familiar) has to win
 * over the table's generic options.
 */
describe("DDBCompanionFactory.addCRSummoning creature types", () => {
  const run = async (activity: Record<string, any>) => {
    const factory = { originName: "Conjure Woodland Beings", originDocument: { system: { activities: {} as Record<string, any> } }, options: {} };
    await (DDBCompanionFactory.prototype as any).addCRSummoning.call(factory, activity);
    return factory.originDocument.system.activities[activity._id];
  };

  it("keeps the creature types the activity already carries", async () => {
    const result = await run({ _id: "act0000000000001", type: "summon", creatureTypes: ["plant"] });
    expect(result.creatureTypes).toEqual(["plant"]);
    expect(result.summon.mode).toBe("cr");
    expect(result.profiles).toHaveLength(4);
  });

  it("takes the table's creature types when the activity states none", async () => {
    expect((await run({ _id: "act0000000000002", type: "summon", creatureTypes: [] })).creatureTypes).toEqual(["fey"]);
    expect((await run({ _id: "act0000000000003", type: "summon" })).creatureTypes).toEqual(["fey"]);
  });
});
