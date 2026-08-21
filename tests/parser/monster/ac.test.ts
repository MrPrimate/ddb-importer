/**
 * Monster AC parsing tests (characterization pins for the dnd5e 6.0 AC rework).
 *
 * _generateAC regex-parses the English armorClassDescription prose and matches
 * armor items against the compendium; getCompendiumItems / getCompendiumLabel
 * are mocked so no live compendium is needed.
 */

// Partial mock: keep the real lib barrel, stub the compendium touchpoints
vi.mock("../../../src/lib/_module", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    DDBItemImporter: {
      getCompendiumItems: vi.fn().mockResolvedValue([]),
    },
    CompendiumHelper: {
      getCompendiumLabel: vi.fn(() => "ddb.monsters"),
    },
  };
});

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/ac";
import { DDBItemImporter } from "../../../src/lib/_module";
import { makeMockMonster } from "../../_fixtures/mockMonster";

const getCompendiumItems = vi.mocked((DDBItemImporter as any).getCompendiumItems);

function makeACMonster(sourceOverrides: any = {}, rest: any = {}) {
  const mock = makeMockMonster({ source: sourceOverrides });
  mock.npc._id = "testMonsterId000";
  mock.items = [];
  mock.useItemAC = false;
  mock.addMonsterEffects = false;
  mock.is2014 = true;
  mock.is2024 = false;
  mock.BAD_AC_MONSTERS = DDBMonster.prototype.BAD_AC_MONSTERS;
  Object.assign(mock, rest);
  return mock;
}

const generateAC = DDBMonster.prototype._generateAC;

beforeEach(() => {
  getCompendiumItems.mockClear();
  getCompendiumItems.mockResolvedValue([]);
});

describe("DDBMonster._generateAC", () => {
  it("natural armor: natural calc with flat AC", async () => {
    const mock = makeACMonster({ armorClass: 17, armorClassDescription: "(natural armor)" });
    await generateAC.call(mock);

    const ac = mock.npc.system.attributes.ac;
    expect(ac.calc).toBe("natural");
    expect(ac.flat).toBe(17);
    expect(ac.label).toBe("natural armor");
    expect(mock.npc.flags.ddbimporter.flatAC).toBe(false);
  });

  it("natural armor with shield: shield 2 subtracted from flat", async () => {
    const mock = makeACMonster({ armorClass: 17, armorClassDescription: "(natural armor, shield)" });
    await generateAC.call(mock);

    const ac = mock.npc.system.attributes.ac;
    expect(ac.calc).toBe("natural");
    expect(ac.flat).toBe(15);
  });

  it("natural armor with +2 bonus in description: bonus subtracted from flat", async () => {
    const mock = makeACMonster({ armorClass: 19, armorClassDescription: "(natural armor, +2 ring)" });
    await generateAC.call(mock);

    expect(mock.npc.system.attributes.ac.flat).toBe(17);
  });

  it("no description with AC above base: falls back to natural", async () => {
    // dex 10 gives base 10; flat 15 implies some bonus, so calc goes natural
    const mock = makeACMonster({ armorClass: 15, armorClassDescription: "" });
    await generateAC.call(mock);

    const ac = mock.npc.system.attributes.ac;
    expect(ac.calc).toBe("natural");
    expect(ac.flat).toBe(15);
    expect(mock.npc.flags.ddbimporter.flatAC).toBe(false);
  });

  it("armor item description with useItemAC: default calc, null flat, item added", async () => {
    const chainMail = {
      name: "Chain Mail",
      type: "equipment",
      system: { type: { value: "heavy" }, equipped: false, quantity: 1 },
      effects: [],
    };
    getCompendiumItems.mockResolvedValue([chainMail]);

    const mock = makeACMonster(
      { armorClass: 16, armorClassDescription: "(chain mail)" },
      { useItemAC: true },
    );
    await generateAC.call(mock);

    const ac = mock.npc.system.attributes.ac;
    expect(ac.calc).toBe("default");
    expect(ac.flat).toBe(null);
    expect(mock.npc.flags.ddbimporter.flatAC).toBe(false);
    // the matched armor is equipped and pushed onto the monster's items
    expect(mock.items).toHaveLength(1);
    expect(mock.items[0].system.equipped).toBe(true);
  });

  it("armor item description without useItemAC: natural calc, items not added", async () => {
    const chainMail = {
      name: "Chain Mail",
      type: "equipment",
      system: { type: { value: "heavy" }, equipped: false, quantity: 1 },
      effects: [],
    };
    getCompendiumItems.mockResolvedValue([chainMail]);

    const mock = makeACMonster({ armorClass: 16, armorClassDescription: "(chain mail)" });
    await generateAC.call(mock);

    expect(mock.npc.system.attributes.ac.calc).toBe("natural");
    expect(mock.items).toHaveLength(0);
  });

  it("weapon compendium matches are excluded from AC items", async () => {
    getCompendiumItems.mockResolvedValue([
      { name: "Spear", type: "weapon", system: { equipped: false, quantity: 1 }, effects: [] },
    ]);

    const mock = makeACMonster(
      { armorClass: 13, armorClassDescription: "(spear)" },
      { useItemAC: true },
    );
    await generateAC.call(mock);

    // weapon filtered out, nothing added, AC falls back through the branches
    expect(mock.items).toHaveLength(0);
  });

  it("spellcasting Mage Armor: emits mage calc override effect", async () => {
    const mock = makeACMonster({
      armorClass: 15,
      armorClassDescription: "",
      stats: [
        { statId: 1, name: null, value: 10 },
        { statId: 2, name: null, value: 14 },
        { statId: 3, name: null, value: 10 },
        { statId: 4, name: null, value: 10 },
        { statId: 5, name: null, value: 10 },
        { statId: 6, name: null, value: 10 },
      ],
    });
    mock.items = [{
      name: "Spellcasting",
      type: "feat",
      system: { description: { value: "<p>1st level: <em>mage armor</em> Mage Armor (included in AC)</p>" } },
      effects: [],
    }];
    await generateAC.call(mock);

    const mageEffect = mock.npc.effects.find((e: any) => e.name === "Mage Armor");
    expect(mageEffect).toBeDefined();
    expect(mageEffect.system.changes).toEqual([
      { key: "system.attributes.ac.calc", value: "mage", type: "override", priority: 5 },
    ]);
    expect(mageEffect.duration).toEqual({ value: 8, units: "hours" });
    expect(mageEffect.origin).toContain("Compendium.ddb.monsters.Actor.testMonsterId000");
  });

  it("spellcasting Mage Armor with AC above 13+dex: adds top-up ac.bonus effect", async () => {
    // dex 14 -> mage armor AC 15; flat 16 leaves a +1 remainder
    const mock = makeACMonster({
      armorClass: 16,
      armorClassDescription: "",
      stats: [
        { statId: 1, name: null, value: 10 },
        { statId: 2, name: null, value: 14 },
        { statId: 3, name: null, value: 10 },
        { statId: 4, name: null, value: 10 },
        { statId: 5, name: null, value: 10 },
        { statId: 6, name: null, value: 10 },
      ],
    });
    mock.items = [{
      name: "Spellcasting",
      type: "feat",
      system: { description: { value: "Mage Armor (included in AC)" } },
      effects: [],
    }];
    await generateAC.call(mock);

    const bonusEffect = mock.npc.effects.find((e: any) => e.name === "AC Bonus");
    expect(bonusEffect).toBeDefined();
    expect(bonusEffect.system.changes).toEqual([
      { key: "system.attributes.ac.bonus", value: "1", type: "add", priority: 30 },
    ]);
  });

  it("stores the full calculation bag on this.ac", async () => {
    const mock = makeACMonster({ armorClass: 12, armorClassDescription: "(natural armor)" });
    await generateAC.call(mock);

    expect(mock.ac.ac.calc).toBe("natural");
    expect(mock.ac.flatAC).toBe(false);
    expect(mock.ac.badACMonster).toBe(false);
    expect(mock.ac.dexBonus).toBe(0);
  });
});
