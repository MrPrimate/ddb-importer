// @vitest-environment jsdom
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBRace from "../../../src/parser/race/DDBRace";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";

// Lineage species and class choice pools find their option documents by the numeric DDB option id,
// but earlier 7.x releases wrote that id to compendium documents as a string.
describe("choice option id flag matching", () => {
  it("matches a numeric option id against its number or string form", () => {
    expect(DDBRace.flagValueMatches(3734085, 3734085)).toBe(true);
    expect(DDBRace.flagValueMatches("3734085", 3734085)).toBe(true);
  });

  it("does not match a different option or a loosened non-numeric value", () => {
    expect(DDBRace.flagValueMatches("3734083", 3734085)).toBe(false);
    expect(DDBRace.flagValueMatches(3734083, 3734085)).toBe(false);
    expect(DDBRace.flagValueMatches(undefined, 3734085)).toBe(false);
    expect(DDBRace.flagValueMatches("true", true)).toBe(false);
  });

  it("finds a class choice feature stored with a string option id", () => {
    const entry = {
      name: "Fighting Style: Archery",
      uuid: "Compendium.test.features.Item.archery",
      flags: { ddbimporter: { isChoice: true, classId: 1, dndbeyond: { choice: { optionId: "7" } } } },
    };
    const parser = Object.assign(Object.create(DDBBaseClass.prototype) as DDBBaseClass, {
      _compendiums: { features: { index: [entry] } },
    });
    const flags = { isChoice: true, classId: 1, "dndbeyond.choice.optionId": 7 };

    expect(parser.getCompendiumIxByFlags(["features"], flags)).toBe(entry);
    expect(parser.getCompendiumIxByFlags(["features"], { ...flags, "dndbeyond.choice.optionId": 8 })).toBeNull();
  });
});
