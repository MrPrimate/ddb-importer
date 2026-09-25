// Tests for DDBEnricherData._getUsesWithSpent and its _getMaxValue/_getSpentValue
// lookups. The regression these pin: a DDB action with no limitedUse used to
// stringify a null max into the literal "null", an invalid dnd5e formula.
// getActionDescription runs found text through the template parser; that one
// module is stubbed so the tests assert the wiring (which text is passed
// through) rather than DDB's own {{scalevalue}} substitution, which has its
// own tests. Everything else is real: DDBEnricherData now imports leaf modules
// directly, so no barrel mocks are needed (see tests/smoke/enricherFirstLoad).
vi.mock("../../../src/parser/lib/DDBTemplateStrings", () => ({
  parse: vi.fn((_ddb: any, _raw: any, text: string) => ({ text: `parsed:${text}` })),
}));

import logger from "../../../src/lib/Logger";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

class TestEnricherData extends DDBEnricherData<any> {}

/**
 * Builds an enricher data instance whose ddbParser exposes the given class
 * actions. Pass `actions: null` to model a parser with no ddbData at all
 * (compendium/muncher context).
 */
function makeData(actions: any[] | null, rawCharacter: any = null): any {
  return makeEnricherData(TestEnricherData, {
    actions: actions === null ? null : { class: actions },
    rawCharacter,
  });
}

/** The shape DDB returns for Channel Spirit: a real action with no charge pool. */
const NO_LIMITED_USE = [{ name: "Channel Spirit", limitedUse: null }];

const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => undefined);

beforeEach(() => {
  warnSpy.mockClear();
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
    expect(warnSpy).toHaveBeenCalledWith(
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
    expect(warnSpy).toHaveBeenCalled();
  });

  it("omits max when there is no ddbData at all", () => {
    const data = makeData(null);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class" });
    expect(uses.max).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("keeps an explicitly passed max and skips the lookup", () => {
    const data = makeData([{ name: "Channel Spirit", limitedUse: { maxUses: 3 } }]);
    const uses = data._getUsesWithSpent({ name: "Channel Spirit", type: "class", max: "1" });
    expect(uses.max).toBe("1");
    expect(warnSpy).not.toHaveBeenCalled();
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
    expect(warnSpy).not.toHaveBeenCalled();
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

describe("DDBEnricherData._getSpellUsesWithSpent lookup misses", () => {
  it("keeps explicit max and long-rest recovery without emitting null spent", () => {
    const uses = makeData([])._getSpellUsesWithSpent({ type: "class", name: "Paladin's Smite", max: "1", period: "lr" });
    expect(uses).toEqual({ max: "1", recovery: [{ period: "lr", type: "recoverAll", formula: undefined }] });
  });

  it("omits unset uses when no spell pool or defaults are available", () => {
    const uses = makeData([])._getSpellUsesWithSpent({ type: "feat", name: "Spellfire Spark" });
    expect(uses).toEqual({});
  });

  it("preserves a feature's parsed charge pool when its spell has no limitedUse", () => {
    const existing = { spent: 1, max: "@prof", recovery: [{ period: "lr", type: "recoverAll" }] };
    const data = makeEnricherData(TestEnricherData, { data: { system: { uses: existing } } });
    const uses = data._getSpellUsesWithSpent({ type: "feat", name: "Spellfire Spark" });
    expect(uses).toEqual(existing);
    expect(uses).not.toBe(existing);
  });

  it("applies spent, formula recovery and override defaults in a compendium context", () => {
    const uses = makeData(null)._getSpellUsesWithSpent({
      type: "class", name: "Test", max: "3", defaultSpent: 0, period: "lr", formula: "1d3", override: true,
    });
    expect(uses).toEqual({ spent: 0, max: "3", recovery: [{ period: "lr", type: "formula", formula: "1d3" }], override: true });
  });
});

// The default action match folds a matched action's activities onto the parent
// feature but drops its description; this is how an enricher pulls that text back
// (Gunslinger RiskTaker). Absent/blank actions must degrade to null rather than
// emitting an empty description block.
describe("DDBEnricherData.getActionDescription", () => {
  const ACTION = { name: "Maneuver: Maverick Spirit (Risk Taker)", description: "<p>Add a d6.</p>" };

  it("returns the action description, template-parsed, for a real character", () => {
    const data = makeData([ACTION], { type: "character" });
    expect(data.getActionDescription({ name: ACTION.name, type: "class" })).toBe("parsed:<p>Add a d6.</p>");
  });

  it("defaults the action type to class", () => {
    const data = makeData([ACTION], { type: "character" });
    expect(data.getActionDescription({ name: ACTION.name })).toBe("parsed:<p>Add a d6.</p>");
  });

  it("returns the raw description when the parser has no real character", () => {
    // muncher/compendium context: rawCharacter is not a character actor
    const data = makeData([ACTION], null);
    expect(data.getActionDescription({ name: ACTION.name, type: "class" })).toBe("<p>Add a d6.</p>");
  });

  it("returns null when no action matches the name", () => {
    const data = makeData([ACTION], { type: "character" });
    expect(data.getActionDescription({ name: "Maneuver: Nope", type: "class" })).toBeNull();
  });

  it("returns null when the matched action has an empty description", () => {
    const data = makeData([{ name: "Blank", description: "" }], { type: "character" });
    expect(data.getActionDescription({ name: "Blank", type: "class" })).toBeNull();
  });

  it("returns null when the action bucket for that type is empty", () => {
    const data = makeData([ACTION], { type: "character" });
    expect(data.getActionDescription({ name: ACTION.name, type: "feat" })).toBeNull();
  });
});
