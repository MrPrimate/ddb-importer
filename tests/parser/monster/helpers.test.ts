vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import { getAbilityMods } from "../../../src/parser/monster/helpers";

describe("getAbilityMods", () => {
  it("calculates modifiers for all abilities (all 10s = all 0)", () => {
    const monster = {
      stats: [
        { statId: 1, value: 10 },
        { statId: 2, value: 10 },
        { statId: 3, value: 10 },
        { statId: 4, value: 10 },
        { statId: 5, value: 10 },
        { statId: 6, value: 10 },
      ],
    };
    const mods = getAbilityMods(monster);

    expect(mods.str).toBe(0);
    expect(mods.dex).toBe(0);
    expect(mods.con).toBe(0);
    expect(mods.int).toBe(0);
    expect(mods.wis).toBe(0);
    expect(mods.cha).toBe(0);
  });

  // Giant Wolf Spider: STR 12, DEX 16, CON 13, INT 3, WIS 12, CHA 4
  it("Giant Wolf Spider ability modifiers", () => {
    const monster = {
      stats: [
        { statId: 1, value: 12 },
        { statId: 2, value: 16 },
        { statId: 3, value: 13 },
        { statId: 4, value: 3 },
        { statId: 5, value: 12 },
        { statId: 6, value: 4 },
      ],
    };
    const mods = getAbilityMods(monster);

    expect(mods.str).toBe(1);
    expect(mods.dex).toBe(3);
    expect(mods.con).toBe(1);
    expect(mods.int).toBe(-4);
    expect(mods.wis).toBe(1);
    expect(mods.cha).toBe(-3);
  });

  // Clay Golem: STR 20, DEX 9, CON 18, INT 3, WIS 8, CHA 1
  it("Clay Golem ability modifiers", () => {
    const monster = {
      stats: [
        { statId: 1, value: 20 },
        { statId: 2, value: 9 },
        { statId: 3, value: 18 },
        { statId: 4, value: 3 },
        { statId: 5, value: 8 },
        { statId: 6, value: 1 },
      ],
    };
    const mods = getAbilityMods(monster);

    expect(mods.str).toBe(5);
    expect(mods.dex).toBe(-1);
    expect(mods.con).toBe(4);
    expect(mods.int).toBe(-4);
    expect(mods.wis).toBe(-1);
    expect(mods.cha).toBe(-5);
  });

  it("handles extreme values (1 and 30)", () => {
    const monster = {
      stats: [
        { statId: 1, value: 1 },
        { statId: 2, value: 30 },
        { statId: 3, value: 10 },
        { statId: 4, value: 10 },
        { statId: 5, value: 10 },
        { statId: 6, value: 10 },
      ],
    };
    const mods = getAbilityMods(monster);

    expect(mods.str).toBe(-5);
    expect(mods.dex).toBe(10);
  });
});
