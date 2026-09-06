import "../../../src/parser/character/proficiencies";
import DDBCharacter from "../../../src/parser/DDBCharacter";
import ProficiencyFinder from "../../../src/parser/lib/ProficiencyFinder";
import DDBToolProficiencies from "../../../src/lib/DDBToolProficiencies";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";

function profMock(ddbCharacter: Record<string, any>): any {
  const mock = makeMockCharacter({ ddbCharacter });
  mock.proficiencyFinder = new ProficiencyFinder({ ddb: mock.source.ddb });
  // _generateProficiencies calls sibling prototype methods, so the mock adopts
  // the real prototype like the fixture loader does
  Object.setPrototypeOf(mock, DDBCharacter.prototype);
  return mock;
}

function mod(overrides: Record<string, any>): any {
  return { isGranted: true, restriction: "", ...overrides };
}

function raceMods(mods: any[]): Record<string, any> {
  return {
    modifiers: {
      race: mods,
      class: [], background: [], item: [], feat: [], condition: [],
    },
  };
}

// =============================================================================
// _getCoreProficiencies
// =============================================================================
describe("DDBCharacter._getCoreProficiencies (synthetic)", () => {
  it("maps proficiency modifiers to name flags", () => {
    const mock = profMock(raceMods([
      mod({ type: "proficiency", subType: "light-armor", friendlySubtypeName: "Light Armor" }),
      mod({ type: "proficiency", subType: "simple-weapons", friendlySubtypeName: "Simple Weapons" }),
      mod({ type: "language", subType: "common", friendlySubtypeName: "Common" }),
    ]));
    expect(mock._getCoreProficiencies(false)).toEqual([
      { name: "Light Armor", custom: false },
      { name: "Simple Weapons", custom: false },
    ]);
  });

  it("includes restricted proficiency modifiers (restriction filtering disabled)", () => {
    const mock = profMock(raceMods([
      mod({ type: "proficiency", subType: "longsword", friendlySubtypeName: "Longsword", restriction: "While Raging" }),
    ]));
    expect(mock._getCoreProficiencies(false)).toEqual([{ name: "Longsword", custom: false }]);
  });
});

// =============================================================================
// _getCoreMasteries
// =============================================================================
describe("DDBCharacter._getCoreMasteries (synthetic)", () => {
  it("parses a single-word weapon mastery", () => {
    const mock = profMock(raceMods([
      mod({ type: "weapon-mastery", subType: "topple-greataxe", friendlySubtypeName: "Topple (Greataxe)" }),
    ]));
    expect(mock._getCoreMasteries(false)).toEqual([
      { weapon: "Greataxe", mastery: "Topple", dnd5eName: "greataxe" },
    ]);
  });

  it("reorders a comma weapon name into the dnd5e key", () => {
    const mock = profMock(raceMods([
      mod({ type: "weapon-mastery", subType: "vex-crossbow-hand", friendlySubtypeName: "Vex (Crossbow, Hand)" }),
    ]));
    expect(mock._getCoreMasteries(false)).toEqual([
      { weapon: "Crossbow, Hand", mastery: "Vex", dnd5eName: "handcrossbow" },
    ]);
  });

  it("drops a mastery it cannot parse", () => {
    const mock = profMock(raceMods([
      mod({ type: "weapon-mastery", subType: "broken", friendlySubtypeName: "NoParens" }),
      mod({ type: "weapon-mastery", subType: "sap-longsword", friendlySubtypeName: "Sap (Longsword)" }),
    ]));
    expect(mock._getCoreMasteries(false)).toEqual([
      { weapon: "Longsword", mastery: "Sap", dnd5eName: "longsword" },
    ]);
  });
});

// =============================================================================
// _generateLanguages
// =============================================================================
describe("DDBCharacter._generateLanguages (synthetic)", () => {
  it("maps known languages, collects unknown ones as custom, drops unmade choices", () => {
    const mock = profMock(raceMods([
      mod({ type: "language", subType: "common", friendlySubtypeName: "Common" }),
      mod({ type: "language", subType: "undercommon", friendlySubtypeName: "Undercommon" }),
      mod({ type: "language", subType: "grung", friendlySubtypeName: "Grung" }),
      mod({ type: "language", subType: "choose-a-language", friendlySubtypeName: "Choose a Language" }),
    ]));
    mock._generateLanguages();
    const languages = mock.raw.character.system.traits.languages;
    expect(languages.value).toEqual(["common", "undercommon"]);
    expect(languages.custom).toBe("Grung");
  });

  it("includes free-text custom language proficiencies (type 3 only)", () => {
    const mock = profMock({
      customProficiencies: [
        { type: 3, name: "Elvish" },
        { type: 3, name: "Blorp Speech" },
        { type: 2, name: "Chess Set" }, // a tool, not a language
      ],
    });
    mock._generateLanguages();
    const languages = mock.raw.character.system.traits.languages;
    expect(languages.value).toEqual(["elvish"]);
    expect(languages.custom).toBe("Blorp Speech");
  });
});

// =============================================================================
// _generateProficiencies
// =============================================================================
describe("DDBCharacter._generateProficiencies (synthetic)", () => {
  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling
  it.skip("populates flags, weapon, armor, tool and language traits", () => {
    const mock = profMock({
      ...raceMods([
        mod({ type: "proficiency", subType: "light-armor", friendlySubtypeName: "Light Armor" }),
        mod({ type: "proficiency", subType: "simple-weapons", friendlySubtypeName: "Simple Weapons" }),
        mod({ type: "proficiency", subType: "thieves-tools", friendlySubtypeName: "Thieves' Tools" }),
        mod({ type: "proficiency", subType: "longsword", friendlySubtypeName: "Longsword" }),
        mod({ type: "weapon-mastery", subType: "topple-greataxe", friendlySubtypeName: "Topple (Greataxe)" }),
        mod({ type: "language", subType: "common", friendlySubtypeName: "Common" }),
      ]),
    });
    mock._generateProficiencies();

    const flags = mock.raw.character.flags.ddbimporter.dndbeyond;
    expect(flags.proficiencies).toEqual([
      { name: "Light Armor", custom: false },
      { name: "Simple Weapons", custom: false },
      { name: "Thieves' Tools", custom: false },
      { name: "Longsword", custom: false },
    ]);
    expect(flags.weaponMasteries).toEqual([{ weapon: "Greataxe", mastery: "Topple", dnd5eName: "greataxe" }]);

    const traits = mock.raw.character.system.traits;
    expect(traits.armorProf.value).toEqual(["lgt"]);
    expect(traits.weaponProf.value).toEqual(["sim"]);
    // the test mocks ship an empty CONFIG.DND5E.weaponIds, so named weapons
    // fall back to the custom string rather than a system key
    expect(traits.weaponProf.custom).toBe("Longsword");
    expect(traits.weaponProf.mastery.value).toEqual(["greataxe"]);
    expect(traits.languages.value).toEqual(["common"]);
    expect(mock.raw.character.system.tools.thief).toEqual({
      value: 1,
      ability: "dex",
      roll: { bonus: "" },
    });
  });

  it("adds Advanced Weapons for the Advanced Weapon Proficiency feat", () => {
    const mock = profMock({
      feats: [{ definition: { name: "Advanced Weapon Proficiency" } }],
    });
    mock._generateProficiencies();
    expect(mock.proficiencies).toContainEqual({ name: "Advanced Weapons", custom: false });
    expect(mock.proficienciesIncludingEffects).toContainEqual({ name: "Advanced Weapons", custom: false });
    expect(mock.raw.character.system.traits.weaponProf.value).toEqual(["adv"]);
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("keys and registers a free-text tool proficiency", () => {
    const mock = profMock({
      customProficiencies: [
        { type: 2, name: "Chess Set", statId: 4, proficiencyLevel: 3, miscBonus: null, magicBonus: null },
      ],
    });
    try {
      mock._generateProficiencies();
      // statId 4 = int; proficiencyLevel 3 = proficient
      expect(mock.raw.character.system.tools.chessset).toEqual({
        value: 1,
        ability: "int",
        roll: { bonus: "" },
      });
      const customTools = mock.raw.character.flags.ddbimporter.dndbeyond.customTools;
      expect(customTools).toHaveLength(1);
      expect(customTools[0]).toMatchObject({ key: "chessset", name: "Chess Set", ability: "int" });
      // registered into the (mocked) system config so the sheet can render it
      expect((CONFIG.DND5E.tools as any).chessset).toBeDefined();
    } finally {
      // registration mutates shared config/static state; clean it up
      delete (CONFIG.DND5E.tools as any).chessset;
      delete (CONFIG.DND5E.toolProficiencies as any).chessset;
      DDBToolProficiencies.registered.delete("chessset");
    }
  });
});

// =============================================================================
// audit fixtures
// =============================================================================
describe.skipIf(!auditFixturesPresent())("DDBCharacter proficiencies (audit fixtures)", () => {
  it("parses rogue class proficiencies from a real capture", async () => {
    const mock = await loadFixtureCharacter("classes/rogue", "Arachnoid-Stalker");
    mock._generateProficiencies();

    const flags = mock.raw.character.flags.ddbimporter.dndbeyond;
    expect(flags.proficiencies).toContainEqual({ name: "Thieves' Tools", custom: false });
    expect(flags.proficiencies).toContainEqual({ name: "Light Armor", custom: false });
    expect(flags.proficiencies).toContainEqual({ name: "Simple Weapons", custom: false });

    const traits = mock.raw.character.system.traits;
    expect(traits.armorProf.value).toEqual(["lgt"]);
    expect(traits.weaponProf.value).toEqual(["sim"]);
    // 2014 rogue named weapons; empty mock weaponIds routes them to custom
    expect(traits.weaponProf.custom).toContain("Rapier");
    expect(traits.weaponProf.custom).toContain("Crossbow, Hand");
    expect(mock.raw.character.system.tools.thief.value).toBe(1);
    // Thieves' Cant (curly apostrophe spelling) maps to the "cant" key
    expect(traits.languages.value).toEqual(expect.arrayContaining(["cant", "common"]));
  });

  it("parses Deep Gnome languages from a real capture", async () => {
    const mock = await loadFixtureCharacter("species", "-Deep Gnome-");
    mock._generateLanguages();
    const languages = mock.raw.character.system.traits.languages;
    expect([...languages.value].sort()).toEqual(["common", "gnomish", "undercommon"]);
    expect(languages.custom).toBe("");
  });

  it("keeps a non-5e species language as custom (Grung)", async () => {
    const mock = await loadFixtureCharacter("species", "-Grung-");
    mock._generateLanguages();
    const languages = mock.raw.character.system.traits.languages;
    expect(languages.value).toEqual([]);
    expect(languages.custom).toBe("Grung");
  });

  it("parses a 2024 barbarian weapon mastery from a real capture", async () => {
    const mock = await loadFixtureCharacter("classes/barbarian", "Path-of-Wild-Magic");
    expect(mock._getCoreMasteries(false)).toEqual([
      { weapon: "Greataxe", mastery: "Cleave", dnd5eName: "greataxe" },
    ]);
    mock._generateProficiencies();
    expect(mock.raw.character.system.traits.weaponProf.mastery.value).toEqual(["greataxe"]);
  });
});
