// @vitest-environment jsdom
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBClass from "../../../src/parser/classes/DDBClass";
import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";

function stub(isStartingClass: boolean, is2024 = true): DDBClass {
  return Object.assign(Object.create(DDBClass.prototype) as DDBClass, {
    data: { name: "Pugilist", type: "class", system: {}, effects: [] },
    classFeatures: [{ name: "Core Pugilist Traits", description: "Simple and improvised weapons" }],
    isStartingClass, is2024,
    _addAdvancement: () => undefined,
  });
}

describe("Pugilist improvised weapon proficiency", () => {
  it("grants the core flag once on a starting 2024 class", () => {
    const parser = stub(true);
    parser._pugilistFixes();
    parser._pugilistFixes();
    expect(parser.data.effects).toHaveLength(1);
    expect(parser.data.effects![0]._id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(parser.data.effects![0]).toMatchObject({ transfer: true, system: { changes: [
      { key: "flags.dnd5e.tavernBrawlerFeat", type: "override", value: "true" },
    ] } });
  });

  it("does not infer grants for multiclass or legacy builds", () => {
    for (const parser of [stub(false), stub(true, false)]) {
      parser._pugilistFixes();
      expect(parser.data.effects).toEqual([]);
    }
  });

  it("keeps Simple Weapons without inventing a weapon:improv advancement", () => {
    const parsed = AdvancementHelper.parseHTMLWeaponProficiencies("<table><tr><th>Weapon Proficiencies</th><td>Simple and improvised weapons</td></tr></table>");
    expect(parsed.grants).toEqual(["sim"]);
  });
});
