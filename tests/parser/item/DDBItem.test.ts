vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));
// Mock deep dependency chain for DDBItem
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
vi.mock("../../../src/parser/enrichers/DDBItemEnricher", () => ({
  default: class { init() {} load() {} },
}));
vi.mock("../../../src/parser/activities/_module", () => ({
  DDBItemActivity: class {},
}));
vi.mock("../../../src/parser/item/MagicItemMaker", () => ({
  default: {},
}));
vi.mock("../../../src/effects/restrictions", () => ({
  addRestrictionFlags: vi.fn(),
}));

import DDBItem from "../../../src/parser/item/DDBItem";

// =============================================================================
// getRechargeFormula — static method for parsing charge recharge formulas
// =============================================================================
describe("DDBItem.getRechargeFormula", () => {
  it("returns maxCharges for empty description", () => {
    expect(DDBItem.getRechargeFormula("", 7)).toBe("7");
  });

  it("returns maxCharges for null description", () => {
    expect(DDBItem.getRechargeFormula(null as any, 5)).toBe("5");
  });

  it("extracts dice formula from 'regains 1d6 + 1 expended charges'", () => {
    expect(DDBItem.getRechargeFormula("The staff regains 1d6 + 1 expended charges daily at dawn.", 10)).toBe("1d6 + 1");
  });

  it("extracts fixed number from 'regains 3 expended charges'", () => {
    expect(DDBItem.getRechargeFormula("It regains 3 expended charges at dawn.", 7)).toBe("3");
  });

  it("extracts last-ditch dice formula", () => {
    expect(DDBItem.getRechargeFormula("Roll 1d4 + 1 to determine recovery.", 5)).toBe("1d4 + 1");
  });

  it("returns maxCharges for next-dawn restriction with no formula", () => {
    expect(DDBItem.getRechargeFormula("This property can't be used this way again until the next dawn.", 1)).toBe("1");
  });

  it("returns maxCharges when no patterns match", () => {
    expect(DDBItem.getRechargeFormula("A magical sword of great power.", 3)).toBe("3");
  });
});

// =============================================================================
// getMagicItemResetType — static method for determining reset period
// =============================================================================
describe("DDBItem.getMagicItemResetType", () => {
  it("detects dawn reset from 'expended charges daily at dawn'", () => {
    expect(DDBItem.getMagicItemResetType("The staff regains expended charges daily at dawn.")).toBe("dawn");
  });

  it("detects dusk reset from 'expended charges each day at dusk'", () => {
    expect(DDBItem.getMagicItemResetType("It regains expended charges each day at dusk.")).toBe("dusk");
  });

  it("maps sunset to dusk", () => {
    expect(DDBItem.getMagicItemResetType("The item regains expended charges each day at sunset.")).toBe("dusk");
  });

  it("detects next dawn from can't-be-used formula", () => {
    expect(DDBItem.getMagicItemResetType("This property can't be used this way again until the next dawn.")).toBe("Dawn");
  });

  it("detects long rest", () => {
    expect(DDBItem.getMagicItemResetType("You can't use this feature again until you finish a long rest.")).toBe("LongRest");
  });

  it("detects short or long rest as 'sr'", () => {
    expect(DDBItem.getMagicItemResetType("You can't use it again until you finish a short or long rest.")).toBe("sr");
  });

  it("returns null when no reset pattern found", () => {
    expect(DDBItem.getMagicItemResetType("A simple magical trinket.")).toBeNull();
  });
});

// =============================================================================
// parsePerSpellMagicItem — per-spell charge detection
// =============================================================================
describe("DDBItem.prototype.parsePerSpellMagicItem", () => {
  function makeItemMock(description: string) {
    const mock = Object.create(DDBItem.prototype);
    mock.ddbDefinition = { description };
    return mock;
  }

  it("detects 'each once per' as per-spell with 1 charge", () => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem("each once per day");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });

  it("detects 'each twice per' as per-spell with 2 charges", () => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem("each twice per day");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(2);
  });

  it("falls back to description when useDescription is empty", () => {
    const mock = makeItemMock("This property can\u2019t be used this way again until the next dawn.");
    const result = mock.parsePerSpellMagicItem("");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });

  it("returns not per-spell when no pattern matches", () => {
    const mock = makeItemMock("A wand that shoots fire.");
    const result = mock.parsePerSpellMagicItem("");
    expect(result.isPerSpell).toBe(false);
    expect(result.charges).toBeNull();
  });

  it("detects 'can't be used to cast that spell again' in useDescription", () => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem("This property can\u2019t be used to cast that spell again until the next dawn.");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });
});
