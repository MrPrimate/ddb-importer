// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import { getClassFeatures, getAllClassFeatures } from "../../../src/parser/lib/FilterModifiers";

// =============================================================================
// Helper: mock class data
// =============================================================================
function makeClass({ name, level, subclassName = null, classFeatures = [], subclassFeatures = [], isStartingClass = true }) {
  const cls: any = {
    definition: { name },
    level,
    isStartingClass,
    classFeatures: classFeatures.map((f) => ({
      definition: { ...f, className: null, subclassName: null },
    })),
  };
  if (subclassName) {
    cls.subclassDefinition = {
      name: subclassName,
      classFeatures: subclassFeatures.map((f) => ({ ...f, className: null, subclassName: null })),
    };
  } else {
    cls.subclassDefinition = null;
  }
  return cls;
}

// =============================================================================
// getClassFeatures
// =============================================================================
describe("getClassFeatures", () => {
  const fighter = makeClass({
    name: "Fighter",
    level: 5,
    subclassName: "Champion",
    classFeatures: [
      { id: 1, name: "Fighting Style", requiredLevel: 1 },
      { id: 2, name: "Second Wind", requiredLevel: 1 },
      { id: 3, name: "Action Surge", requiredLevel: 2 },
      { id: 4, name: "Extra Attack", requiredLevel: 5 },
      { id: 5, name: "Indomitable", requiredLevel: 9 },
    ],
    subclassFeatures: [
      { id: 10, name: "Improved Critical", requiredLevel: 3 },
      { id: 11, name: "Remarkable Athlete", requiredLevel: 7 },
      { id: 12, name: "Superior Critical", requiredLevel: 15 },
    ],
  });

  it("returns features up to class level", () => {
    const features = getClassFeatures(fighter, 5);
    const names = features.map((f) => f.name);
    expect(names).toContain("Fighting Style");
    expect(names).toContain("Second Wind");
    expect(names).toContain("Action Surge");
    expect(names).toContain("Extra Attack");
    expect(names).toContain("Improved Critical");
  });

  it("excludes features above class level", () => {
    const features = getClassFeatures(fighter, 5);
    const names = features.map((f) => f.name);
    expect(names).not.toContain("Indomitable"); // level 9
    expect(names).not.toContain("Remarkable Athlete"); // level 7
    expect(names).not.toContain("Superior Critical"); // level 15
  });

  it("sorts by required level ascending", () => {
    const features = getClassFeatures(fighter, 5);
    const levels = features.map((f) => f.requiredLevel);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it("returns all features when level is 20", () => {
    const features = getClassFeatures(fighter, 20);
    expect(features).toHaveLength(8); // 5 class + 3 subclass
  });

  it("uses default level of 20 when not specified", () => {
    const features = getClassFeatures(fighter);
    expect(features).toHaveLength(8);
  });

  it("annotates features with className", () => {
    const features = getClassFeatures(fighter, 5);
    features.forEach((f) => {
      expect(f.className).toBe("Fighter");
    });
  });

  it("annotates subclass features with subclassName", () => {
    const features = getClassFeatures(fighter, 5);
    const subFeature = features.find((f) => f.name === "Improved Critical");
    expect(subFeature.subclassName).toBe("Champion");
  });

  it("annotates class features with null subclassName", () => {
    const features = getClassFeatures(fighter, 5);
    const classFeature = features.find((f) => f.name === "Fighting Style");
    expect(classFeature.subclassName).toBeNull();
  });

  it("handles class with no subclass", () => {
    const noSubclass = makeClass({
      name: "Rogue",
      level: 3,
      classFeatures: [
        { id: 20, name: "Sneak Attack", requiredLevel: 1 },
        { id: 21, name: "Cunning Action", requiredLevel: 2 },
      ],
    });
    const features = getClassFeatures(noSubclass, 3);
    expect(features).toHaveLength(2);
    const names = features.map((f) => f.name);
    expect(names).toContain("Sneak Attack");
    expect(names).toContain("Cunning Action");
  });

  it("returns empty for level 0", () => {
    const features = getClassFeatures(fighter, 0);
    expect(features).toHaveLength(0);
  });

  it("handles empty classFeatures array", () => {
    const empty = makeClass({ name: "Empty", level: 5, classFeatures: [] });
    const features = getClassFeatures(empty, 5);
    expect(features).toHaveLength(0);
  });
});

// =============================================================================
// getAllClassFeatures
// =============================================================================
describe("getAllClassFeatures", () => {
  it("returns features from all classes", () => {
    const data = {
      classes: [
        makeClass({
          name: "Fighter",
          level: 3,
          classFeatures: [
            { id: 1, name: "Fighting Style", requiredLevel: 1 },
            { id: 2, name: "Action Surge", requiredLevel: 2 },
          ],
        }),
        makeClass({
          name: "Rogue",
          level: 2,
          classFeatures: [
            { id: 10, name: "Sneak Attack", requiredLevel: 1 },
            { id: 11, name: "Cunning Action", requiredLevel: 2 },
          ],
          isStartingClass: false,
        }),
      ],
    };
    const features = getAllClassFeatures(data);
    expect(features).toHaveLength(4);
    const names = features.map((f) => f.name);
    expect(names).toContain("Fighting Style");
    expect(names).toContain("Action Surge");
    expect(names).toContain("Sneak Attack");
    expect(names).toContain("Cunning Action");
  });

  it("respects each class's level", () => {
    const data = {
      classes: [
        makeClass({
          name: "Fighter",
          level: 1,
          classFeatures: [
            { id: 1, name: "Fighting Style", requiredLevel: 1 },
            { id: 2, name: "Action Surge", requiredLevel: 2 },
          ],
        }),
      ],
    };
    const features = getAllClassFeatures(data);
    expect(features).toHaveLength(1);
    expect(features[0].name).toBe("Fighting Style");
  });

  it("returns empty for no classes", () => {
    const features = getAllClassFeatures({ classes: [] });
    expect(features).toHaveLength(0);
  });
});
