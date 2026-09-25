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
