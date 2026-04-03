vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));
// Mock the enricher/activity chain to avoid pulling in the full dependency tree
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/activities/mixins/DDBActivityFactoryMixin", () => ({
  default: class {
    additionalActivities = [];
    documentType = null;
    useMidiAutomations = false;
    usesOnActivity = false;
    ignoreActivityGeneration = false;
    forceDefaultActionBuild = false;
    data = null;
    activityTypes = [];
    activities = [];
  },
}));
vi.mock("../../../src/parser/enrichers/DDBMonsterFeatureEnricher", () => ({
  default: class { init() {} load() {} },
}));
vi.mock("../../../src/parser/activities/_module", () => ({
  DDBMonsterFeatureActivity: class {},
}));

import DDBMonsterFeature from "../../../src/parser/monster/features/DDBMonsterFeature";

/**
 * Create a mock object with DDBMonsterFeature's prototype chain
 * so that methods calling other prototype methods (e.g. getRange → getReach) work.
 */
function makeFeatureMock(props: Record<string, any>) {
  const mock = Object.create(DDBMonsterFeature.prototype);
  Object.assign(mock, {
    actionData: {
      properties: {},
      range: { value: null, long: null, units: "", reach: null },
    },
    healingAction: false,
    meleeAttack: false,
    rangedAttack: false,
  }, props);
  return mock;
}

// =============================================================================
// getReach — regex extraction of weapon reach
// =============================================================================
describe("DDBMonsterFeature.prototype.getReach", () => {
  it("extracts 10 ft reach", () => {
    const mock = makeFeatureMock({ strippedHtml: "Melee Weapon Attack: +7 to hit, reach 10 ft., one target." });
    expect(mock.getReach()).toBe(10);
  });

  it("returns null for default 5 ft reach", () => {
    const mock = makeFeatureMock({ strippedHtml: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target." });
    expect(mock.getReach()).toBeNull();
  });

  it("returns null when no reach mentioned", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Weapon Attack: +4 to hit, range 80/320 ft." });
    expect(mock.getReach()).toBeNull();
  });

  it("extracts 15 ft reach", () => {
    const mock = makeFeatureMock({ strippedHtml: "Melee Weapon Attack: +11 to hit, reach 15 ft., one target." });
    expect(mock.getReach()).toBe(15);
  });

  it("handles extra spaces in reach notation", () => {
    const mock = makeFeatureMock({ strippedHtml: "reach  10  ft" });
    expect(mock.getReach()).toBe(10);
  });
});

// =============================================================================
// getRange — regex extraction of weapon range
// =============================================================================
describe("DDBMonsterFeature.prototype.getRange", () => {
  it("parses 'range 80/320 ft'", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target." });
    const range = mock.getRange();
    expect(range.value).toBe(80);
    expect(range.long).toBe(320);
    expect(range.units).toBe("ft");
  });

  it("parses 'range 30 ft./120 ft'", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Weapon Attack: +6 to hit, range 30 ft./120 ft., one target." });
    const range = mock.getRange();
    expect(range.value).toBe(30);
    expect(range.long).toBe(120);
    expect(range.units).toBe("ft");
  });

  it("parses 'range 60 ft' single range", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Spell Attack: +8 to hit, range 60 ft., one creature." });
    const range = mock.getRange();
    expect(range.value).toBe(60);
    expect(range.long).toBeNull();
    expect(range.units).toBe("ft");
  });

  it("parses 'reach 10 ft' weapon with rch property", () => {
    const mock = makeFeatureMock({
      strippedHtml: "Melee Weapon Attack: +7 to hit, reach 10 ft., one target.",
      templateType: "weapon",
    });
    const range = mock.getRange();
    expect(range.reach).toBe(10);
    expect(range.units).toBe("ft");
    expect(mock.actionData.properties.rch).toBe(true);
  });

  it("parses 'reach 5 ft' weapon without rch property", () => {
    const mock = makeFeatureMock({
      strippedHtml: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target.",
      templateType: "weapon",
    });
    const range = mock.getRange();
    expect(range.reach).toBe(5);
    expect(range.units).toBe("ft");
    expect(mock.actionData.properties.rch).toBeFalsy();
  });

  it("parses 'within 10 feet'", () => {
    const mock = makeFeatureMock({ strippedHtml: "each creature within 10 feet must succeed on a saving throw" });
    const range = mock.getRange();
    expect(range.value).toBe(10);
    expect(range.units).toBe("ft");
  });

  it("defaults to 5 ft for melee attack with no range text", () => {
    const mock = makeFeatureMock({ strippedHtml: "The creature slashes with its claws.", meleeAttack: true });
    const range = mock.getRange();
    expect(range.value).toBe(5);
    expect(range.units).toBe("ft");
  });

  it("returns empty range for non-melee with no range text", () => {
    const mock = makeFeatureMock({ strippedHtml: "The creature does something mysterious." });
    const range = mock.getRange();
    expect(range.value).toBeNull();
    expect(range.long).toBeNull();
    expect(range.units).toBe("");
  });
});

// =============================================================================
// getActionType — determines activation cost from type and text
// =============================================================================
describe("DDBMonsterFeature.prototype.getActionType", () => {
  it("detects 'as a bonus action'", () => {
    const mock = makeFeatureMock({ type: "action", strippedHtml: "The creature can use this as a bonus action." });
    expect(mock.getActionType()).toBe("bonus");
  });

  it("detects 'as a reaction'", () => {
    const mock = makeFeatureMock({ type: "action", strippedHtml: "The creature can use this as a reaction when hit." });
    expect(mock.getActionType()).toBe("reaction");
  });

  it("detects 'creature dies' as special", () => {
    const mock = makeFeatureMock({ type: "special", strippedHtml: "When the creature dies, it explodes in a burst of fire." });
    expect(mock.getActionType()).toBe("special");
  });

  it("detects 'as an action'", () => {
    const mock = makeFeatureMock({ type: "bonus", strippedHtml: "The creature can use this as an action." });
    expect(mock.getActionType()).toBe("action");
  });

  it("defaults to type when no text match", () => {
    const mock = makeFeatureMock({ type: "action", strippedHtml: "The creature makes two melee attacks." });
    expect(mock.getActionType()).toBe("action");
  });

  it("lair type overrides text match", () => {
    const mock = makeFeatureMock({ type: "lair", strippedHtml: "as a bonus action" });
    expect(mock.getActionType()).toBe("lair");
  });

  it("mythic type overrides", () => {
    const mock = makeFeatureMock({ type: "mythic", strippedHtml: "something happens" });
    expect(mock.getActionType()).toBe("mythic");
  });

  it("legendary type overrides", () => {
    const mock = makeFeatureMock({ type: "legendary", strippedHtml: "as a reaction" });
    expect(mock.getActionType()).toBe("legendary");
  });
});

// =============================================================================
// getTarget — template and creature targeting extraction
// =============================================================================
describe("DDBMonsterFeature.prototype.getTarget", () => {
  it("parses '60-foot cone'", () => {
    const mock = makeFeatureMock({ strippedHtml: "The dragon exhales fire in a 60-foot cone." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("cone");
    expect(target.template.size).toBe("60");
    expect(target.template.units).toBe("ft");
  });

  it("parses '90-foot line'", () => {
    const mock = makeFeatureMock({ strippedHtml: "The creature emits a 90-foot line that is 10 feet wide." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("line");
    expect(target.template.size).toBe("90");
  });

  it("parses '10-foot cube'", () => {
    const mock = makeFeatureMock({ strippedHtml: "A 10-foot cube of acid fills the area." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("cube");
    expect(target.template.size).toBe("10");
  });

  it("parses '20-foot-radius sphere'", () => {
    const mock = makeFeatureMock({ strippedHtml: "Each creature in a 20-foot-radius sphere centered on the point." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("sphere");
    expect(target.template.size).toBe("20");
  });

  it("parses 'one creature' target", () => {
    const mock = makeFeatureMock({ strippedHtml: "one creature within 60 feet must succeed on a saving throw." });
    const target = mock.getTarget();
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("1");
  });

  it("parses 'each creature' (no specific count)", () => {
    const mock = makeFeatureMock({ strippedHtml: "Each creature within 30 feet of the point must make a save." });
    const target = mock.getTarget();
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("");
  });

  it("melee attack defaults to 1 creature", () => {
    const mock = makeFeatureMock({
      strippedHtml: "Hit: 10 (2d6 + 3) slashing damage.",
      meleeAttack: true,
    });
    const target = mock.getTarget();
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("1");
  });
});
