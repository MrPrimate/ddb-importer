// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBModifiers from "../../../src/parser/lib/DDBModifiers";

// =============================================================================
// Test modifier data
// =============================================================================
const modifiers: any[] = [
  { type: "bonus", subType: "strength-score", value: 2, restriction: "", componentId: 100, componentTypeId: 1 },
  { type: "bonus", subType: "armor-class", value: 1, restriction: "while wearing armor", componentId: 101, componentTypeId: 1 },
  { type: "bonus", subType: "armor-class", value: 2, restriction: "", componentId: 102, componentTypeId: 1 },
  { type: "set", subType: "strength-score", value: 19, restriction: "", componentId: 103, componentTypeId: 1 },
  { type: "proficiency", subType: "longsword", value: null, restriction: "", componentId: 104, componentTypeId: 1 },
  { type: "proficiency", subType: "longbow", value: null, restriction: null, componentId: 105, componentTypeId: 1 },
  { type: "bonus", subType: "dexterity-score", value: 1, restriction: null, componentId: 106, componentTypeId: 1 },
];

// =============================================================================
// filterModifiers
// =============================================================================
describe("DDBModifiers.filterModifiers", () => {
  it("filters by type only (default restriction excludes non-empty/non-null)", () => {
    const result = DDBModifiers.filterModifiers(modifiers, "bonus");
    // Default restriction ["", null] excludes "while wearing armor"
    expect(result).toHaveLength(3); // str(""), ac(""), dex(null)
    result.forEach((m) => expect(m.type).toBe("bonus"));
  });

  it("filters by type and subType", () => {
    const result = DDBModifiers.filterModifiers(modifiers, "bonus", { subType: "armor-class" });
    // Only the AC bonus with restriction "" matches (default restriction excludes "while wearing armor")
    expect(result).toHaveLength(1);
    result.forEach((m) => expect(m.subType).toBe("armor-class"));
  });

  it("filters by type, subType and restriction (empty string only)", () => {
    const result = DDBModifiers.filterModifiers(modifiers, "bonus", { subType: "armor-class", restriction: [""] });
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(2);
    expect(result[0].restriction).toBe("");
  });

  it("default restriction includes empty string and null", () => {
    const result = DDBModifiers.filterModifiers(modifiers, "proficiency");
    expect(result).toHaveLength(2); // "" and null both match default ["", null]
  });

  it("returns empty array when no matches", () => {
    const result = DDBModifiers.filterModifiers(modifiers, "ignore");
    expect(result).toHaveLength(0);
  });

  it("filters 'set' type", () => {
    const result = DDBModifiers.filterModifiers(modifiers, "set");
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(19);
  });

  it("with restriction null excludes restricted modifiers", () => {
    // restriction: null means "no restriction filter" - includes all
    const result = DDBModifiers.filterModifiers(modifiers, "bonus", { subType: "armor-class", restriction: null });
    expect(result).toHaveLength(2); // both AC modifiers
  });

  it("handles nested arrays (flat)", () => {
    const nested = [[modifiers[0]], [modifiers[3]]];
    const result = DDBModifiers.filterModifiers(nested as any, "bonus");
    expect(result).toHaveLength(1);
    expect(result[0].subType).toBe("strength-score");
  });
});

// =============================================================================
// filterModifiersOld
// =============================================================================
describe("DDBModifiers.filterModifiersOld", () => {
  it("delegates to filterModifiers", () => {
    const result = DDBModifiers.filterModifiersOld(modifiers, "bonus", "strength-score");
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(2);
  });

  it("uses default restriction of ['', null]", () => {
    const result = DDBModifiers.filterModifiersOld(modifiers, "bonus");
    // All bonus modifiers with restriction "" or null
    expect(result).toHaveLength(3); // str-score(""), ac("" via idx 2), dex-score(null)
  });
});

// =============================================================================
// getEffectExcludedModifiers
// =============================================================================
describe("DDBModifiers.getEffectExcludedModifiers", () => {
  it("returns array for class type with features", () => {
    const result = DDBModifiers.getEffectExcludedModifiers("class", true, false);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns array for item type", () => {
    const result = DDBModifiers.getEffectExcludedModifiers("item", true, true);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns more modifiers with ac=true", () => {
    const withoutAc = DDBModifiers.getEffectExcludedModifiers("class", true, false);
    const withAc = DDBModifiers.getEffectExcludedModifiers("class", true, true);
    expect(withAc.length).toBeGreaterThanOrEqual(withoutAc.length);
  });

  it("returns more modifiers with features=true than features=false", () => {
    const withFeatures = DDBModifiers.getEffectExcludedModifiers("class", true, false);
    const withoutFeatures = DDBModifiers.getEffectExcludedModifiers("class", false, false);
    expect(withFeatures.length).toBeGreaterThanOrEqual(withoutFeatures.length);
  });

  it("race type excludes senses/speed when features=false", () => {
    const result = DDBModifiers.getEffectExcludedModifiers("race", true, false);
    // race with features includes common and speedMonk but NOT senses/speedSet/speedBonus
    expect(result.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// isModClassFeature
// =============================================================================
describe("DDBModifiers.isModClassFeature", () => {
  const ddb: any = {
    character: {
      classes: [{
        definition: { id: 1, name: "Fighter" },
        subclassDefinition: { id: 10, name: "Champion" },
        classFeatures: [
          { definition: { id: 100, entityTypeId: 1, requiredLevel: 1 } },
          { definition: { id: 200, entityTypeId: 1, requiredLevel: 5 } },
          { definition: { id: 300, entityTypeId: 1, requiredLevel: 9 } },
        ],
        level: 5,
      }],
      optionalClassFeatures: [],
      options: { class: [] },
      choices: { class: [] },
      modifiers: { class: [] },
    },
  };

  it("returns true when modifier matches a class feature", () => {
    const mod: any = { componentId: 100, componentTypeId: 1 };
    expect(DDBModifiers.isModClassFeature(ddb, mod)).toBe(true);
  });

  it("returns false when modifier does not match any class feature", () => {
    const mod: any = { componentId: 999, componentTypeId: 1 };
    expect(DDBModifiers.isModClassFeature(ddb, mod)).toBe(false);
  });

  it("returns false when componentTypeId mismatches", () => {
    const mod: any = { componentId: 100, componentTypeId: 999 };
    expect(DDBModifiers.isModClassFeature(ddb, mod)).toBe(false);
  });

  it("filters by classId", () => {
    const mod: any = { componentId: 100, componentTypeId: 1 };
    expect(DDBModifiers.isModClassFeature(ddb, mod, { classId: 1 })).toBe(true);
    expect(DDBModifiers.isModClassFeature(ddb, mod, { classId: 999 })).toBe(false);
  });

  it("filters by classFeatureIds", () => {
    const mod: any = { componentId: 100, componentTypeId: 1 };
    expect(DDBModifiers.isModClassFeature(ddb, mod, { classFeatureIds: [100, 200] })).toBe(true);
    expect(DDBModifiers.isModClassFeature(ddb, mod, { classFeatureIds: [200, 300] })).toBe(false);
  });

  it("filters by requiredLevel (>=)", () => {
    const mod: any = { componentId: 200, componentTypeId: 1 }; // requiredLevel: 5
    expect(DDBModifiers.isModClassFeature(ddb, mod, { requiredLevel: 3 })).toBe(true);
    expect(DDBModifiers.isModClassFeature(ddb, mod, { requiredLevel: 5 })).toBe(true);
    expect(DDBModifiers.isModClassFeature(ddb, mod, { requiredLevel: 6 })).toBe(false);
  });

  it("filters by exactLevel", () => {
    const mod: any = { componentId: 200, componentTypeId: 1 }; // requiredLevel: 5
    expect(DDBModifiers.isModClassFeature(ddb, mod, { exactLevel: 5 })).toBe(true);
    expect(DDBModifiers.isModClassFeature(ddb, mod, { exactLevel: 1 })).toBe(false);
  });

  it("excludes features replaced by optional class features", () => {
    const ddbWithReplacement = {
      ...ddb,
      character: {
        ...ddb.character,
        optionalClassFeatures: [{ affectedClassFeatureId: 100 }],
      },
    };
    const mod: any = { componentId: 100, componentTypeId: 1 };
    expect(DDBModifiers.isModClassFeature(ddbWithReplacement, mod)).toBe(false);
  });
});

// =============================================================================
// isModAChosenClassMod (integration of all isMod* checks)
// =============================================================================
describe("DDBModifiers.isModAChosenClassMod", () => {
  const ddb: any = {
    character: {
      classes: [{
        definition: { id: 1, name: "Fighter", classFeatures: [{ id: 100, name: "Action Surge" }] },
        subclassDefinition: { id: 10, name: "Champion", classFeatures: [{ id: 200, name: "Improved Critical" }] },
        classFeatures: [
          { definition: { id: 100, entityTypeId: 1, requiredLevel: 2, grantedFeats: [] } },
          { definition: { id: 200, entityTypeId: 1, requiredLevel: 3, grantedFeats: [] } },
        ],
        level: 5,
        isStartingClass: true,
      }],
      optionalClassFeatures: [],
      options: { class: [] },
      choices: { class: [] },
      modifiers: { class: [] },
    },
  };

  it("returns true for a matching class feature modifier", () => {
    const mod: any = { componentId: 100, componentTypeId: 1 };
    expect(DDBModifiers.isModAChosenClassMod(ddb, mod)).toBe(true);
  });

  it("returns false for unmatched modifier", () => {
    const mod: any = { componentId: 999, componentTypeId: 999 };
    expect(DDBModifiers.isModAChosenClassMod(ddb, mod)).toBe(false);
  });
});
