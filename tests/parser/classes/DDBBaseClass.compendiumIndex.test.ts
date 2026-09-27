// @vitest-environment jsdom
// The class parsers index their feature and feat compendiums with the flag fields the matchers
// read. Called without a filter, the index must keep those fields: Foundry merges fields across
// getIndex calls, so a name-only request only worked when an earlier import in the same session
// had indexed the flags, and 2024 Wizard features lost their compendium links in a fresh one.

// the class parsers sit in an import cycle with AdvancementHelper; loading the feature
// factory first resolves it the way the production entry point does
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";

function makeStub(): any {
  return {
    _indexFilter: {
      features: { fields: ["name", "flags.ddbimporter.id", "flags.ddbimporter.classId"] },
    },
    _compendiums: {
      features: { getIndex: vi.fn(async () => undefined) },
    },
  };
}

describe("DDBBaseClass._buildCompendiumIndex", () => {
  it("indexes with the class's own fields when called without a filter", async () => {
    const stub = makeStub();
    await DDBBaseClass.prototype._buildCompendiumIndex.call(stub, "features");
    expect(stub._compendiums.features.getIndex).toHaveBeenCalledWith({
      fields: ["name", "flags.ddbimporter.id", "flags.ddbimporter.classId"],
    });
    expect(stub._indexFilter.features.fields).toContain("flags.ddbimporter.classId");
  });

  it("replaces the fields when a filter is passed", async () => {
    const stub = makeStub();
    await DDBBaseClass.prototype._buildCompendiumIndex.call(stub, "features", { fields: ["name", "system.type"] });
    expect(stub._compendiums.features.getIndex).toHaveBeenCalledWith({ fields: ["name", "system.type"] });
  });

  it("does nothing when the compendium is missing", async () => {
    const stub = makeStub();
    stub._compendiums.features = null;
    await expect(DDBBaseClass.prototype._buildCompendiumIndex.call(stub, "features")).resolves.toBeUndefined();
  });
});
