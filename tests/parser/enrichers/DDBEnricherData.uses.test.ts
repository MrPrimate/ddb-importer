// Tests for DDBEnricherData._getUsesWithSpent and its _getMaxValue/_getSpentValue
// lookups. The regression these pin: a DDB action with no limitedUse used to
// stringify a null max into the literal "null", an invalid dnd5e formula.
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

// Whole-barrel stub, not importOriginal: loading the real lib barrel here would
// pull the apps/muncher tree (and through it enrichers/_module) while
// DDBEnricherData is still mid-evaluation, crashing SpellListExtractorMixin's
// `extends DDBEnricherData`. Everything this test's import graph touches in lib
// is just `logger`.
vi.mock("../../../src/lib/_module", () => ({ logger: loggerMock }));
// The spell machinery is only reachable via _getSpellsForFeature, not the uses surface.
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => ({
  DDBDataUtils: {
    findSubClassByFeatureId: vi.fn(),
    classIdentifierName: (n: string) => n,
    getLimitedUses: vi.fn(),
  },
}));
vi.mock("../../../src/parser/enrichers/effects/_module", () => ({
  AutoEffects: {},
  EnchantmentEffects: {},
  ChangeHelper: {},
  EffectGenerator: {},
}));

import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";

class TestEnricherData extends DDBEnricherData<any> {}

/**
 * Builds an enricher data instance whose ddbParser exposes the given class
 * actions. Pass `actions: null` to model a parser with no ddbData at all
 * (compendium/muncher context).
 */
function makeData(actions: any[] | null): any {
  const ddbEnricher: any = {
    ddbParser: actions === null
      ? {}
      : { ddbData: { character: { actions: { class: actions, race: [], feat: [], item: [], background: [] } } } },
    is2014: false,
    useLookupName: false,
    activityGenerator: null,
    effectType: "",
    document: {},
    name: "Test Feature",
    isCustomAction: false,
    manager: null,
  };
  return new TestEnricherData({ ddbEnricher });
}

/** The shape DDB returns for Channel Spirit: a real action with no charge pool. */
const NO_LIMITED_USE = [{ name: "Channel Spirit", limitedUse: null }];

beforeEach(() => {
  loggerMock.warn.mockClear();
});

describe("DDBEnricherData._getUsesWithSpent max handling", () => {
  it("stringifies a found maxUses", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 3, numberUsed: 0 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).toBe("3");
  });

  it("omits max and warns when the action has no limitedUse", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).toBeUndefined();
    expect("max" in uses).toBe(false);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      "No max uses found for \"Channel Spirit\" (class)",
      expect.anything(),
    );
  });

  it("never emits the literal string null", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).not.toBe("null");
  });

  it("omits max when no action matches the name", () => {
    const data = makeData([{ name: "Bardic Inspiration", limitedUse: { maxUses: 5 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).toBeUndefined();
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it("omits max when there is no ddbData at all", () => {
    const data = makeData(null);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).toBeUndefined();
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it("keeps an explicitly passed max and skips the lookup", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 3 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class", max: "1" });
    expect(uses.max).toBe("1");
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("matches on substring when includesName is set", () => {
    const data = makeData([{ name: "Spirits from Beyond: Brute Spirit", limitedUse: { maxUses: 2 } }]);
    const uses = data._getUsesWithSpent({ name: "Spirits from Beyond", type: "class", includesName: true });
    expect(uses.max).toBe("2");
  });

  it("treats maxUses 0 as a real value", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 0 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).toBe("0");
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });
});

describe("DDBEnricherData._getUsesWithSpent spent handling", () => {
  it("uses the DDB numberUsed", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 3, numberUsed: 2 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.spent).toBe(2);
  });

  it("omits spent entirely on a lookup miss with no default", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect("spent" in uses).toBe(false);
  });

  it("falls back to defaultSpent on a miss", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class", defaultSpent: 0 });
    expect(uses.spent).toBe(0);
  });

  it("returns an empty object when nothing at all resolves", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses).toEqual({});
  });
});

describe("DDBEnricherData._getUsesWithSpent recovery handling", () => {
  it("builds a recoverAll entry from a period", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class", period: "sr" });
    expect(uses.recovery).toEqual([{ period: "sr", type: "recoverAll", formula: undefined }]);
  });

  it("prefers a formula recovery over the period recovery", () => {
    const data = makeData(NO_LIMITED_USE);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class", period: "lr", formula: "1d4" });
    expect(uses.recovery).toEqual([{ period: "lr", type: "formula", formula: "1d4" }]);
  });

  it("sets no recovery when no period is given", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 3 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.recovery).toBeUndefined();
  });

  it("sets the override flag when asked", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 3 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class", override: true });
    expect(uses.override).toBe(true);
  });
});
