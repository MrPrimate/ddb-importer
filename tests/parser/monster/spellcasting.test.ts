vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/spellcasting";
import { makeMockMonster } from "../../_fixtures/mockMonster";

// =============================================================================
// getSpellcasting - regex extraction of spellcasting ability
// =============================================================================
describe("DDBMonster.getSpellcasting", () => {
  const getSpellcasting = DDBMonster.prototype.getSpellcasting;

  it("detects 'spellcasting ability is Intelligence'", () => {
    const mock = makeMockMonster();
    const result = getSpellcasting.call(mock, "The oblex's innate spellcasting ability is Intelligence (spell save DC 15).");
    expect(result).toBe("int");
  });

  it("detects 'spellcasting ability is Charisma'", () => {
    const mock = makeMockMonster();
    const result = getSpellcasting.call(mock, "Its spellcasting ability is Charisma (spell save DC 13).");
    expect(result).toBe("cha");
  });

  it("detects 'spellcasting ability is Wisdom'", () => {
    const mock = makeMockMonster();
    const result = getSpellcasting.call(mock, "The druid's spellcasting ability is Wisdom.");
    expect(result).toBe("wis");
  });

  it("detects 'spellcasting ability uses Constitution'", () => {
    const mock = makeMockMonster();
    const result = getSpellcasting.call(mock, "Its spellcasting ability uses Constitution.");
    expect(result).toBe("con");
  });

  it("detects 'Wisdom as its spellcasting ability'", () => {
    const mock = makeMockMonster();
    const result = getSpellcasting.call(mock, "It uses Wisdom as its spellcasting ability.");
    expect(result).toBe("wis");
  });

  it("returns empty string when no ability found", () => {
    const mock = makeMockMonster();
    const result = getSpellcasting.call(mock, "The monster attacks with its claws.");
    expect(result).toBe("");
  });
});

// =============================================================================
// _generateSpelldc - regex extraction of spell save DC
// =============================================================================
describe("DDBMonster._generateSpelldc", () => {
  const generateSpelldc = DDBMonster.prototype._generateSpelldc;

  it("extracts DC from 'spell save DC 15'", () => {
    const mock = makeMockMonster();
    generateSpelldc.call(mock, "spell save DC 15, +7 to hit with spell attacks");
    expect(mock.spellcasting.spelldc).toBe(15);
  });

  it("extracts DC from 'spell save DC 20)'", () => {
    const mock = makeMockMonster();
    generateSpelldc.call(mock, "The lich's spellcasting ability is Intelligence (spell save DC 20).");
    expect(mock.spellcasting.spelldc).toBe(20);
  });

  it("extracts DC from 'spell save DC 13,'", () => {
    const mock = makeMockMonster();
    generateSpelldc.call(mock, "spell save DC 13, +5 to hit");
    expect(mock.spellcasting.spelldc).toBe(13);
  });

  it("defaults to 10 when no DC found", () => {
    const mock = makeMockMonster();
    generateSpelldc.call(mock, "The monster has no spellcasting.");
    expect(mock.spellcasting.spelldc).toBe(10);
  });
});

// =============================================================================
// _generateSpellLevel - regex extraction of caster level
// =============================================================================
describe("DDBMonster._generateSpellLevel", () => {
  const generateSpellLevel = DDBMonster.prototype._generateSpellLevel;

  it("extracts '9th-level spellcaster'", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "is a 9th-level spellcaster");
    expect(mock.spellcasting.spellLevel).toBe(9);
    expect(mock.npc.system.attributes.spell.level).toBe(9);
  });

  it("extracts '18th-level spellcaster'", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "is an 18th-level spellcaster");
    expect(mock.spellcasting.spellLevel).toBe(18);
  });

  it("extracts '1st-level spellcaster'", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "is a 1st-level spellcaster");
    expect(mock.spellcasting.spellLevel).toBe(1);
  });

  it("extracts '2nd-level spellcaster'", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "is a 2nd-level spellcaster");
    expect(mock.spellcasting.spellLevel).toBe(2);
  });

  it("extracts '3rd-level spellcaster'", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "is a 3rd-level spellcaster");
    expect(mock.spellcasting.spellLevel).toBe(3);
  });

  it("extracts '5th level spellcaster' (space instead of hyphen)", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "is a 5th level spellcaster");
    expect(mock.spellcasting.spellLevel).toBe(5);
  });

  it("defaults to 0 when no level found", () => {
    const mock = makeMockMonster();
    generateSpellLevel.call(mock, "The monster casts spells innately.");
    expect(mock.spellcasting.spellLevel).toBe(0);
  });
});

// =============================================================================
// _generateSpellAttackBonus - regex extraction and calculation
// =============================================================================
describe("DDBMonster._generateSpellAttackBonus", () => {
  const generateSpellAttackBonus = DDBMonster.prototype._generateSpellAttackBonus;

  it("calculates spell attack bonus correctly", () => {
    // Example: +7 to hit, CR 1/4 (prof +2), INT 16 (mod +3)
    // spellAttackBonus = 7 - 2 - 3 = 2
    const mock = makeMockMonster({
      source: {
        challengeRatingId: 3, // CR 1/4, prof +2
        stats: [
          { statId: 1, value: 10 },
          { statId: 2, value: 10 },
          { statId: 3, value: 10 },
          { statId: 4, value: 16 }, // INT 16
          { statId: 5, value: 10 },
          { statId: 6, value: 10 },
        ],
      },
    });
    mock.getSpellcasting = DDBMonster.prototype.getSpellcasting;

    generateSpellAttackBonus.call(mock,
      "spellcasting ability is Intelligence (spell save DC 13, +7 to hit with spell attacks)");

    expect(mock.spellcasting.spellAttackBonus).toBe(2);
  });

  it("defaults to 0 when no spell attack match", () => {
    const mock = makeMockMonster();
    mock.getSpellcasting = DDBMonster.prototype.getSpellcasting;

    generateSpellAttackBonus.call(mock, "The monster has innate spellcasting.");
    expect(mock.spellcasting.spellAttackBonus).toBe(0);
  });
});
