vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));
// Mock deep dependency chain for DDBSpell
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/activities/mixins/DDBActivityFactoryMixin", () => ({
  default: class {
    additionalActivities = [];
    data = null;
    activities = [];
    activityTypes = [];
    documentType = null;
    useMidiAutomations = false;
  },
}));
vi.mock("../../../src/parser/enrichers/DDBSpellEnricher", () => ({
  default: class { init() {} load() {} },
}));
vi.mock("../../../src/parser/activities/_module", () => ({
  DDBSpellActivity: class {},
}));
vi.mock("../../../src/parser/companions/DDBCompanionFactory", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/companions/DDBSummonsManager", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/enrichers/effects/_module", () => ({
  AutoEffects: {},
  ChangeHelper: {},
}));

import DDBSpell from "../../../src/parser/spells/DDBSpell";

/** Create a minimal mock with DDBSpell's prototype chain */
function makeSpellMock(props: Record<string, any> = {}) {
  const mock = Object.create(DDBSpell.prototype);
  return Object.assign(mock, {
    ddbDefinition: {
      description: "",
      range: { origin: "Ranged", rangeValue: 60 },
      duration: null,
      components: [],
      activation: { activationType: 1, activationTime: 1 },
      concentration: false,
      ritual: false,
      componentsDescription: "",
      castingTimeDescription: "",
    },
    spellData: {},
    data: {
      system: {
        properties: [],
        range: {},
        duration: {},
        activation: {},
        materials: {},
      },
    },
    isGeneric: true, // bypasses #specialRange private method
    forceMaterial: false,
  }, props);
}

// =============================================================================
// getUses — static method for building limited use formulas
// =============================================================================
describe("DDBSpell.getUses", () => {
  it("returns empty uses for null limitedUse", () => {
    const uses = DDBSpell.getUses(null as any);
    expect(uses.max).toBe("");
    expect(uses.recovery).toEqual([]);
  });

  it("parses maxUses=3 with short rest reset", () => {
    const uses = DDBSpell.getUses({
      maxUses: 3,
      numberUsed: 1,
      resetType: 1, // SR
      statModifierUsesId: null,
      useProficiencyBonus: false,
    } as any);
    expect(uses.max).toBe("3");
    expect(uses.spent).toBe(1);
    expect(uses.recovery).toHaveLength(1);
    expect(uses.recovery[0].period).toBe("sr");
  });

  it("parses maxUses=1 with long rest reset", () => {
    const uses = DDBSpell.getUses({
      maxUses: 1,
      numberUsed: 0,
      resetType: 2, // LR
      statModifierUsesId: null,
      useProficiencyBonus: false,
    } as any);
    expect(uses.max).toBe("1");
    expect(uses.recovery[0].period).toBe("lr");
  });

  it("appends ability modifier formula with operator 1 (add)", () => {
    const uses = DDBSpell.getUses({
      maxUses: -1,
      numberUsed: 0,
      resetType: 2, // LR
      statModifierUsesId: 5, // WIS
      operator: 1,
      useProficiencyBonus: false,
    } as any);
    expect(uses.max).toContain("@abilities.wis.mod");
  });

  it("appends proficiency bonus formula with operator 1 (add)", () => {
    const uses = DDBSpell.getUses({
      maxUses: 1,
      numberUsed: 0,
      resetType: 2,
      statModifierUsesId: null,
      useProficiencyBonus: true,
      proficiencyBonusOperator: 1,
    } as any);
    expect(uses.max).toContain("@prof");
  });

  it("returns empty recovery for charges resetType", () => {
    const uses = DDBSpell.getUses({
      maxUses: 5,
      numberUsed: 0,
      resetType: 4, // charges
      statModifierUsesId: null,
      useProficiencyBonus: false,
    } as any);
    expect(uses.max).toBe("5");
    expect(uses.recovery).toEqual([]);
  });

  it("returns empty uses for unknown resetType", () => {
    const uses = DDBSpell.getUses({
      maxUses: 3,
      numberUsed: 0,
      resetType: 999,
      statModifierUsesId: null,
      useProficiencyBonus: false,
    } as any);
    expect(uses.max).toBe("");
    expect(uses.recovery).toEqual([]);
  });
});

// =============================================================================
// _generateProperties — sets spell component properties
// =============================================================================
describe("DDBSpell.prototype._generateProperties", () => {
  it("sets vocal, somatic, material for components [1,2,3]", () => {
    const mock = makeSpellMock({
      ddbDefinition: { components: [1, 2, 3], ritual: false, concentration: false },
    });
    mock._generateProperties();
    expect(mock.data.system.properties).toContain("vocal");
    expect(mock.data.system.properties).toContain("somatic");
    expect(mock.data.system.properties).toContain("material");
  });

  it("sets vocal and ritual for components [1] with ritual=true", () => {
    const mock = makeSpellMock({
      ddbDefinition: { components: [1], ritual: true, concentration: false },
    });
    mock._generateProperties();
    expect(mock.data.system.properties).toContain("vocal");
    expect(mock.data.system.properties).toContain("ritual");
    expect(mock.data.system.properties).not.toContain("somatic");
  });

  it("sets somatic and concentration for components [2] with concentration=true", () => {
    const mock = makeSpellMock({
      ddbDefinition: { components: [2], ritual: false, concentration: true },
    });
    mock._generateProperties();
    expect(mock.data.system.properties).toContain("somatic");
    expect(mock.data.system.properties).toContain("concentration");
  });

  it("includes material when forceMaterial=true even without component 3", () => {
    const mock = makeSpellMock({
      ddbDefinition: { components: [1], ritual: false, concentration: false },
      forceMaterial: true,
    });
    mock._generateProperties();
    expect(mock.data.system.properties).toContain("material");
  });
});

// =============================================================================
// _generateMaterials — extracts material costs from description
// =============================================================================
describe("DDBSpell.prototype._generateMaterials", () => {
  it("extracts GP cost and consumed flag", () => {
    const mock = makeSpellMock({
      ddbDefinition: { componentsDescription: "a diamond worth 500 gp, which the spell consumes" },
    });
    mock._generateMaterials();
    expect(mock.data.system.materials.cost).toBe(500);
    expect(mock.data.system.materials.consumed).toBe(true);
    expect(mock.data.system.materials.value).toContain("diamond");
  });

  it("sets cost=0 for non-costed material", () => {
    const mock = makeSpellMock({
      ddbDefinition: { componentsDescription: "a pinch of sulfur" },
    });
    mock._generateMaterials();
    expect(mock.data.system.materials.cost).toBe(0);
    expect(mock.data.system.materials.consumed).toBe(false);
  });

  it("strips comma from '1,000 gp'", () => {
    const mock = makeSpellMock({
      ddbDefinition: { componentsDescription: "a gem worth 1,000 gp" },
    });
    mock._generateMaterials();
    expect(mock.data.system.materials.cost).toBe(1000);
  });

  it("returns empty materials when no description", () => {
    const mock = makeSpellMock({
      ddbDefinition: { componentsDescription: "" },
    });
    mock._generateMaterials();
    expect(mock.data.system.materials.value).toBe("");
    expect(mock.data.system.materials.cost).toBe(0);
    expect(mock.data.system.materials.consumed).toBe(false);
  });
});

// =============================================================================
// _generateActivation — determines activation type from DICTIONARY
// =============================================================================
describe("DDBSpell.prototype._generateActivation", () => {
  it("maps activationType 1 to 'action'", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        activation: { activationType: 1, activationTime: 1 },
        castingTimeDescription: "",
      },
      spellData: {},
    });
    mock._generateActivation();
    expect(mock.data.system.activation.type).toBe("action");
    expect(mock.data.system.activation.value).toBe(1);
  });

  it("maps activationType 3 to 'bonus'", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        activation: { activationType: 3, activationTime: 1 },
        castingTimeDescription: "",
      },
      spellData: {},
    });
    mock._generateActivation();
    expect(mock.data.system.activation.type).toBe("bonus");
  });

  it("maps activationType 4 to 'reaction'", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        activation: { activationType: 4, activationTime: 1 },
        castingTimeDescription: "which you take when you see a creature within 60 feet casting a spell",
      },
      spellData: {},
    });
    mock._generateActivation();
    expect(mock.data.system.activation.type).toBe("reaction");
    expect(mock.data.system.activation.condition).toContain("creature within 60 feet");
  });

  it("defaults to 'action' for unknown activationType", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        activation: { activationType: 999, activationTime: null },
        castingTimeDescription: "",
      },
      spellData: {},
    });
    mock._generateActivation();
    expect(mock.data.system.activation.type).toBe("action");
    expect(mock.data.system.activation.value).toBe(1);
  });
});

// =============================================================================
// _generateDuration — maps duration fields to Foundry format
// =============================================================================
describe("DDBSpell.prototype._generateDuration", () => {
  it("maps Minute duration with concentration", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        duration: { durationUnit: "Minute", durationInterval: 10, durationType: "Concentration" },
        concentration: true,
      },
    });
    mock._generateDuration();
    expect(mock.data.system.duration.units).toBe("minute");
    expect(mock.data.system.duration.value).toBe("10");
    expect(mock.data.system.duration.concentration).toBe(true);
  });

  it("uses first 4 chars of durationType when durationUnit is null", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        duration: { durationUnit: null, durationInterval: null, durationType: "Instantaneous" },
        concentration: false,
      },
    });
    mock._generateDuration();
    expect(mock.data.system.duration.units).toBe("inst");
    expect(mock.data.system.duration.value).toBe("");
  });

  it("maps Hour duration", () => {
    const mock = makeSpellMock({
      ddbDefinition: {
        duration: { durationUnit: "Hour", durationInterval: 1, durationType: "Time" },
        concentration: false,
      },
    });
    mock._generateDuration();
    expect(mock.data.system.duration.units).toBe("hour");
    expect(mock.data.system.duration.value).toBe("1");
  });

  it("does not modify duration when ddbDefinition.duration is null", () => {
    const mock = makeSpellMock({
      ddbDefinition: { duration: null },
    });
    const originalDuration = mock.data.system.duration;
    mock._generateDuration();
    expect(mock.data.system.duration).toBe(originalDuration);
  });
});

// NOTE: _generateRange tests omitted — calls private #specialRange() which
// cannot be bypassed on Object.create() mocks (receiver check fails).

// =============================================================================
// targetsCreature — regex detection of creature targeting
// =============================================================================
describe("DDBSpell.prototype.targetsCreature", () => {
  it("matches 'You touch one willing creature'", () => {
    const mock = makeSpellMock({
      ddbDefinition: { description: "You touch one willing creature and bestow a blessing upon it." },
    });
    expect(mock.targetsCreature()).not.toBeNull();
  });

  it("matches 'creature you can see within range'", () => {
    const mock = makeSpellMock({
      ddbDefinition: { description: "Choose a creature you can see within range." },
    });
    expect(mock.targetsCreature()).not.toBeNull();
  });

  it("matches 'each creature within'", () => {
    const mock = makeSpellMock({
      ddbDefinition: { description: "Each creature within 20 feet must make a Dexterity saving throw." },
    });
    expect(mock.targetsCreature()).not.toBeNull();
  });

  it("returns null for non-creature targeting", () => {
    const mock = makeSpellMock({
      ddbDefinition: { description: "A bright streak flashes from your pointing finger to a point you choose." },
    });
    expect(mock.targetsCreature()).toBeNull();
  });
});
