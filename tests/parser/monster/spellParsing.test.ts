vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/spells";

/** Create a minimal mock for spell parsing methods */
function makeSpellMock(overrides: Record<string, any> = {}): any {
  return {
    spellList: {
      class: [],
      pact: [],
      atwill: [],
      innate: [],
      edgeCases: [],
      material: true,
      concentration: true,
      innateMatch: false,
      ...overrides.spellList,
    },
    npc: {
      system: {
        spells: {
          spell1: {}, spell2: {}, spell3: {}, spell4: {}, spell5: {},
          spell6: {}, spell7: {}, spell8: {}, spell9: {}, pact: {},
        },
      },
    },
    // parseOutSpells falls back to parseOutInnateSpells when no standard match
    parseOutInnateSpells: DDBMonster.prototype.parseOutInnateSpells,
    ...overrides,
  };
}

// =============================================================================
// parseOutInnateSpells — regex extraction of innate spell lists
// =============================================================================
describe("DDBMonster.prototype.parseOutInnateSpells", () => {
  const parseOutInnateSpells = DDBMonster.prototype.parseOutInnateSpells;

  it("parses '3/day each: charm person, detect thoughts'", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], innateMatch: true, edgeCases: [] } });
    parseOutInnateSpells.call(mock, "3/day each: charm person, detect thoughts");

    expect(mock.spellList.innate).toHaveLength(2);
    expect(mock.spellList.innate[0]).toMatchObject({ name: "charm person", type: "day", value: "3" });
    expect(mock.spellList.innate[1]).toMatchObject({ name: "detect thoughts", type: "day", value: "3" });
  });

  it("parses '1/day: plane shift'", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], innateMatch: true, edgeCases: [] } });
    parseOutInnateSpells.call(mock, "1/day: plane shift");

    expect(mock.spellList.innate).toHaveLength(1);
    expect(mock.spellList.innate[0]).toMatchObject({ name: "plane shift", type: "day", value: "1" });
  });

  it("parses 'At will:' with innateMatch=false → pushes to atwill", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], innateMatch: false, edgeCases: [] } });
    parseOutInnateSpells.call(mock, "At will: detect magic, mage hand");

    expect(mock.spellList.atwill).toEqual(["detect magic", "mage hand"]);
    expect(mock.spellList.innate).toHaveLength(0);
  });

  it("parses 'At will:' with innateMatch=true → pushes to innate", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], innateMatch: true, edgeCases: [] } });
    parseOutInnateSpells.call(mock, "At will: dancing lights");

    expect(mock.spellList.innate).toHaveLength(1);
    expect(mock.spellList.innate[0]).toMatchObject({ name: "dancing lights", type: "atwill", value: null });
  });

  it("mephit fallback: '1/day it can innately cast fog cloud,'", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], innateMatch: false, edgeCases: [] } });
    parseOutInnateSpells.call(mock, "1/day it can innately cast fog cloud, requiring no material components");

    expect(mock.spellList.innate).toHaveLength(1);
    expect(mock.spellList.innate[0]).toMatchObject({ name: "fog cloud", type: "day", value: "1" });
  });

  it("no match leaves lists unchanged", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], innateMatch: false, edgeCases: [] } });
    parseOutInnateSpells.call(mock, "The creature has no spells.");

    expect(mock.spellList.innate).toHaveLength(0);
    expect(mock.spellList.atwill).toHaveLength(0);
  });
});

// =============================================================================
// parseAdditionalAtWillSpells — extracts "can cast X at will" spells
// =============================================================================
describe("DDBMonster.prototype.parseAdditionalAtWillSpells", () => {
  const parseAdditionalAtWillSpells = DDBMonster.prototype.parseAdditionalAtWillSpells;

  it("parses 'can cast disguise self and invisibility at will'", () => {
    const mock = makeSpellMock();
    parseAdditionalAtWillSpells.call(mock, "can cast disguise self and invisibility at will");

    expect(mock.spellList.atwill).toContain("disguise self");
    expect(mock.spellList.atwill).toContain("invisibility");
    expect(mock.spellList.atwill).toHaveLength(2);
  });

  it("parses single spell 'can cast mage armor at will'", () => {
    const mock = makeSpellMock();
    parseAdditionalAtWillSpells.call(mock, "can cast mage armor at will");

    expect(mock.spellList.atwill).toEqual(["mage armor"]);
  });

  it("no match leaves atwill unchanged", () => {
    const mock = makeSpellMock();
    parseAdditionalAtWillSpells.call(mock, "The archmage prepares spells from the wizard list.");

    expect(mock.spellList.atwill).toHaveLength(0);
  });
});

// =============================================================================
// parseOutSpells — main spell slot/level parsing
// =============================================================================
describe("DDBMonster.prototype.parseOutSpells", () => {
  const parseOutSpells = DDBMonster.prototype.parseOutSpells;

  it("parses 'Cantrip (at will): fire bolt, mage hand'", () => {
    const mock = makeSpellMock();
    parseOutSpells.call(mock, "Cantrip (at will): fire bolt, mage hand");

    expect(mock.spellList.atwill).toContain("fire bolt");
    expect(mock.spellList.atwill).toContain("mage hand");
  });

  it("parses 'Cantrip (at-will): prestidigitation' (hyphenated)", () => {
    const mock = makeSpellMock();
    parseOutSpells.call(mock, "Cantrip (at-will): prestidigitation");

    expect(mock.spellList.atwill).toContain("prestidigitation");
  });

  it("parses '1st level (4 slots): shield, magic missile'", () => {
    const mock = makeSpellMock();
    parseOutSpells.call(mock, "1st level (4 slots): shield, magic missile");

    expect(mock.spellList.class).toContain("shield");
    expect(mock.spellList.class).toContain("magic missile");
    expect(mock.npc.system.spells.spell1.value).toBe(4);
    expect(mock.npc.system.spells.spell1.max).toBe("4");
  });

  it("parses '3rd level (3 slots): counterspell, fireball'", () => {
    const mock = makeSpellMock();
    parseOutSpells.call(mock, "3rd level (3 slots): counterspell, fireball");

    expect(mock.spellList.class).toContain("counterspell");
    expect(mock.spellList.class).toContain("fireball");
    expect(mock.npc.system.spells.spell3.value).toBe(3);
  });

  it("parses '9th (1 slot): wish'", () => {
    const mock = makeSpellMock();
    parseOutSpells.call(mock, "9th (1 slot): wish");

    expect(mock.spellList.class).toContain("wish");
    expect(mock.npc.system.spells.spell9.value).toBe(1);
  });

  it("falls through to parseOutInnateSpells for innate format", () => {
    const mock = makeSpellMock({ spellList: { innate: [], atwill: [], class: [], pact: [], edgeCases: [], innateMatch: true } });
    parseOutSpells.call(mock, "3/day each: charm person");

    expect(mock.spellList.innate).toHaveLength(1);
    expect(mock.spellList.innate[0].name).toBe("charm person");
  });

  it("parses warlock format '1st\u20135th level (3 5th-level slots): hex, hold person'", () => {
    const mock = makeSpellMock();
    // \u2013 is en dash
    parseOutSpells.call(mock, "1st\u20135th level (3 5th-level slots): hex, hold person");

    expect(mock.spellList.pact).toContain("hex");
    expect(mock.spellList.pact).toContain("hold person");
    expect(mock.npc.system.spells.pact.value).toBe(3);
    expect(mock.npc.system.spells.pact.level).toBe("5");
  });
});

// =============================================================================
// _generateSpellEdgeCases — extracts parenthetical edge cases from spell names
// =============================================================================
describe("DDBMonster.prototype._generateSpellEdgeCases", () => {
  const generateSpellEdgeCases = DDBMonster.prototype._generateSpellEdgeCases;

  it("extracts edge case from innate spell 'charm person (as 5th-level spell)'", () => {
    const mock = makeSpellMock({
      spellList: {
        class: [], pact: [], atwill: [],
        innate: [{ name: "charm person (as 5th-level spell)", type: "day", value: "3" }],
        edgeCases: [], innateMatch: false,
      },
    });
    generateSpellEdgeCases.call(mock);

    expect(mock.spellList.edgeCases).toHaveLength(1);
    expect(mock.spellList.edgeCases[0]).toMatchObject({
      name: "charm person",
      type: "innate",
      edge: "as 5th-level spell",
    });
    // Innate spell name gets trimmed
    expect(mock.spellList.innate[0].name).toBe("charm person");
  });

  it("extracts edge case from class spell 'counterspell (self only)'", () => {
    const mock = makeSpellMock({
      spellList: {
        class: ["counterspell (self only)"], pact: [], atwill: [],
        innate: [], edgeCases: [], innateMatch: false,
      },
    });
    generateSpellEdgeCases.call(mock);

    expect(mock.spellList.edgeCases).toHaveLength(1);
    expect(mock.spellList.edgeCases[0]).toMatchObject({
      name: "counterspell",
      type: "class",
      edge: "self only",
    });
  });

  it("no edge case for simple spell name", () => {
    const mock = makeSpellMock({
      spellList: {
        class: [], pact: [], atwill: ["fire bolt"],
        innate: [], edgeCases: [], innateMatch: false,
      },
    });
    generateSpellEdgeCases.call(mock);

    expect(mock.spellList.edgeCases).toHaveLength(0);
  });

  it("handles multiple edge cases across types", () => {
    const mock = makeSpellMock({
      spellList: {
        class: ["shield"], pact: ["hex (3d6)"], atwill: [],
        innate: [{ name: "misty step (self only)", type: "day", value: "1" }],
        edgeCases: [], innateMatch: false,
      },
    });
    generateSpellEdgeCases.call(mock);

    expect(mock.spellList.edgeCases).toHaveLength(2);
    const names = mock.spellList.edgeCases.map((e: any) => e.name);
    expect(names).toContain("hex");
    expect(names).toContain("misty step");
  });
});
