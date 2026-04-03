vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import { hasSpellCastingAbility, convertSpellCastingAbilityId, getSpellCastingAbility } from "../../../src/parser/spells/ability";

// =============================================================================
// hasSpellCastingAbility — checks if ability ID exists in DICTIONARY
// =============================================================================
describe("hasSpellCastingAbility", () => {
  it("returns true for valid ability ID (INT = 4)", () => {
    expect(hasSpellCastingAbility(4)).toBe(true);
  });

  it("returns false for invalid ability ID", () => {
    expect(hasSpellCastingAbility(99)).toBe(false);
  });
});

// =============================================================================
// convertSpellCastingAbilityId — converts ID to foundry ability string
// =============================================================================
describe("convertSpellCastingAbilityId", () => {
  it("converts CHA (6) to 'cha'", () => {
    expect(convertSpellCastingAbilityId(6)).toBe("cha");
  });

  it("converts WIS (5) to 'wis'", () => {
    expect(convertSpellCastingAbilityId(5)).toBe("wis");
  });

  it("converts INT (4) to 'int'", () => {
    expect(convertSpellCastingAbilityId(4)).toBe("int");
  });
});

// =============================================================================
// getSpellCastingAbility — determines spellcasting ability from class info
// =============================================================================
describe("getSpellCastingAbility", () => {
  it("returns class spellcasting ability when present", () => {
    const classInfo = {
      definition: { spellCastingAbilityId: 4 }, // INT
      subclassDefinition: null,
    };
    expect(getSpellCastingAbility(classInfo)).toBe("int");
  });

  it("falls back to subclass ability when class has none", () => {
    const classInfo = {
      definition: { spellCastingAbilityId: null },
      subclassDefinition: { spellCastingAbilityId: 6 }, // CHA
    };
    expect(getSpellCastingAbility(classInfo)).toBe("cha");
  });

  it("defaults to 'wis' when neither class nor subclass has ability", () => {
    const classInfo = {
      definition: { spellCastingAbilityId: null },
      subclassDefinition: null,
    };
    expect(getSpellCastingAbility(classInfo)).toBe("wis");
  });

  it("uses subclass when onlySubclass=true", () => {
    const classInfo = {
      definition: { spellCastingAbilityId: 4 }, // INT (ignored)
      subclassDefinition: { spellCastingAbilityId: 6 }, // CHA
    };
    expect(getSpellCastingAbility(classInfo, true, true)).toBe("cha");
  });
});
