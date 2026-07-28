import SystemHelpers from "../../src/lib/SystemHelpers";
import { setMockModules } from "../_setup/foundryMocks";

const globals: any = globalThis;

beforeAll(() => {
  // The shared CONFIG.DND5E stub has no dieSteps; parseBasicDamageFormula
  // requires it. Real dnd5e value.
  globals.CONFIG.DND5E.dieSteps = [4, 6, 8, 10, 12, 20, 100];
});

function makePart(): any {
  return { number: null, denomination: 0, bonus: "", types: [] };
}

// =============================================================================
// parseBasicDamageFormula
// =============================================================================

describe("parseBasicDamageFormula", () => {
  it("parses a bare dice formula", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "2d6");
    expect(data.number).toBe(2);
    expect(data.denomination).toBe(6);
    expect(data.bonus).toBe("");
    expect(data.custom).toBeUndefined();
  });

  it("parses dice with a positive bonus", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "2d6 + 4");
    expect(data.number).toBe(2);
    expect(data.denomination).toBe(6);
    expect(data.bonus).toBe("4");
  });

  it("parses dice with a negative bonus", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "2d6 - 1");
    expect(data.bonus).toBe("-1");
  });

  it("keeps an @mod bonus by default", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "1d8 + @mod");
    expect(data.bonus).toBe("@mod");
  });

  it("strips an @mod bonus when stripMod is set", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "1d8 + @mod", { stripMod: true });
    expect(data.bonus).toBe("");
  });

  it("treats a plain integer formula as a bonus", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "5");
    expect(data.bonus).toBe("5");
    expect(data.number).toBeNull();
  });

  it("accepts a numeric formula argument", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, 7);
    expect(data.bonus).toBe("7");
  });

  it("captures a trailing dice term of a multi-part expression as the bonus", () => {
    // Characterization: the bonus capture group ([\w\d.-]+) happily matches a
    // dice term, so "2d6 + 1d4" parses as 2d6 with bonus "1d4". Benign in
    // dnd5e (bonus accepts formulas) but worth pinning.
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "2d6 + 1d4");
    expect(data.custom).toBeUndefined();
    expect(data.number).toBe(2);
    expect(data.denomination).toBe(6);
    expect(data.bonus).toBe("1d4");
  });

  it("puts non-standard die denominations into bonus, not custom", () => {
    // Same parseInt characterization as above: parseInt("2d7") === 2.
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "2d7");
    expect(data.custom).toBeUndefined();
    expect(data.bonus).toBe("2d7");
  });

  it("falls back to a custom formula for non-numeric-leading expressions", () => {
    const data = makePart();
    SystemHelpers.parseBasicDamageFormula(data, "@scale.monk.martial-arts");
    expect(data.custom).toEqual({ enabled: true, formula: "@scale.monk.martial-arts" });
    expect(data.number).toBeNull();
  });

  it("trims trailing operators from a string bonus", () => {
    const data = makePart();
    data.bonus = "3 +";
    SystemHelpers.parseBasicDamageFormula(data, "not a formula at all!");
    // formula goes to custom; the pre-existing string bonus gets its trailing
    // operator removed
    expect(data.custom.enabled).toBe(true);
    expect(data.bonus).toBe("3");
  });
});

// =============================================================================
// buildDamagePart
// =============================================================================

describe("buildDamagePart", () => {
  it("builds from a DDB dice definition", () => {
    const result = SystemHelpers.buildDamagePart({
      dice: { diceCount: 2, diceValue: 6, fixedValue: null, multiplier: null },
      type: "Fire",
    });
    expect(result.number).toBe(2);
    expect(result.denomination).toBe(6);
    expect(result.bonus).toBe("");
    expect(result.types).toEqual(["fire"]);
    expect(result.custom).toEqual({ enabled: false, formula: "" });
  });

  it("uses fixedValue and value as the bonus", () => {
    // Characterization: with no diceCount/diceValue the number and
    // denomination end up undefined (?? undefined), not null/0.
    const result = SystemHelpers.buildDamagePart({ dice: { fixedValue: 5 } });
    expect(result.bonus).toBe("5");
    expect(result.number).toBeUndefined();
    expect(result.denomination).toBeUndefined();

    const valueWins = SystemHelpers.buildDamagePart({ dice: { fixedValue: 5, value: 9 } });
    expect(valueWins.bonus).toBe("9");
  });

  it("falls back to the damageString when the dice has a multiplier", () => {
    const result = SystemHelpers.buildDamagePart({
      dice: { multiplier: 2, diceCount: 1, diceValue: 6 },
      damageString: "2d8 + 3",
    });
    expect(result.number).toBe(2);
    expect(result.denomination).toBe(8);
    expect(result.bonus).toBe("3");
  });

  it("parses a damageString when no dice given", () => {
    const result = SystemHelpers.buildDamagePart({ damageString: "1d10", type: "cold" });
    expect(result.number).toBe(1);
    expect(result.denomination).toBe(10);
    expect(result.types).toEqual(["cold"]);
  });

  it("prefers an explicit types array over type", () => {
    const result = SystemHelpers.buildDamagePart({ damageString: "1d4", type: "fire", types: ["fire", "cold"] });
    expect(result.types).toEqual(["fire", "cold"]);
  });

  it("defaults to an enabled empty custom formula for an empty damageString", () => {
    // Characterization: "" is neither dice nor an integer, so the custom
    // branch triggers with an empty formula.
    const result = SystemHelpers.buildDamagePart();
    expect(result.custom).toEqual({ enabled: true, formula: "" });
    expect(result.types).toEqual([]);
  });

  it("passes stripMod through to the formula parser", () => {
    const result = SystemHelpers.buildDamagePart({ damageString: "2d6 + @mod", stripMod: true });
    expect(result.bonus).toBe("");
  });
});

// =============================================================================
// getTemplate
// =============================================================================

describe("getTemplate", () => {
  it("returns a system template for item types", () => {
    const template = SystemHelpers.getTemplate("feat");
    expect(template).toBeDefined();
    expect(template.description).toEqual({ value: "", chat: "" });
    expect(template.activities).toEqual({});
  });

  it("is case insensitive", () => {
    expect(SystemHelpers.getTemplate("FEAT")).toBeDefined();
    expect(SystemHelpers.getTemplate("Weapon")).toBeDefined();
  });

  it("handles actor types and aliases", () => {
    expect(SystemHelpers.getTemplate("character")).toBeDefined();
    expect(SystemHelpers.getTemplate("npc")).toBeDefined();
    expect(SystemHelpers.getTemplate("backpack")).toBeDefined();
    expect(SystemHelpers.getTemplate("container")).toBeDefined();
    expect(SystemHelpers.getTemplate("armor")).toBeDefined();
  });

  it("returns undefined for unknown types", () => {
    expect(SystemHelpers.getTemplate("nonsense")).toBeUndefined();
  });

  it("uses CONFIG.Item dataModels for tattoos", () => {
    globals.CONFIG.Item = {
      dataModels: {
        "dnd-tashas-cauldron.tattoo": { schema: { getInitialValue: () => ({ tattoo: true }) } },
      },
    };
    try {
      expect(SystemHelpers.getTemplate("tattoo")).toEqual({ tattoo: true });
      expect(SystemHelpers.getTemplate("dnd-tashas-cauldron.tattoo")).toEqual({ tattoo: true });
    } finally {
      delete globals.CONFIG.Item;
    }
  });
});

// =============================================================================
// effectModules
// =============================================================================

describe("effectModules", () => {
  beforeEach(() => {
    // effectModules caches into CONFIG.DDBI; reset so each test sees a
    // fresh module scan.
    globals.CONFIG.DDBI.EFFECT_CONFIG.MODULES = {};
  });

  afterAll(() => {
    globals.CONFIG.DDBI.EFFECT_CONFIG.MODULES = {};
  });

  it("reports everything uninstalled with no active modules", () => {
    const result = SystemHelpers.effectModules();
    expect(result.hasCore).toBe(false);
    expect(result.midiQolInstalled).toBe(false);
    expect(result.daeInstalled).toBe(false);
    expect(result.chrisInstalled).toBe(false);
    expect(result.vision5eInstalled).toBe(false);
  });

  it("sets hasCore when midi-qol and dae are both active", () => {
    setMockModules({ "midi-qol": { active: true }, dae: { active: true } });
    const result = SystemHelpers.effectModules();
    expect(result.hasCore).toBe(true);
    expect(result.hasMonster).toBe(true);
    expect(result.midiQolInstalled).toBe(true);
    expect(result.daeInstalled).toBe(true);
  });

  it("does not set hasCore with only one of the core modules", () => {
    setMockModules({ "midi-qol": { active: true } });
    const result = SystemHelpers.effectModules();
    expect(result.hasCore).toBe(false);
    expect(result.midiQolInstalled).toBe(true);
  });

  it("detects the other effect modules", () => {
    setMockModules({
      ATL: { active: true },
      tokenmagic: { active: true },
      ActiveAuras: { active: true },
      auraeffects: { active: true },
      autoanimations: { active: true },
      "vision-5e": { active: true },
    });
    const result = SystemHelpers.effectModules();
    expect(result.atlInstalled).toBe(true);
    expect(result.tokenMagicInstalled).toBe(true);
    expect(result.activeAurasInstalled).toBe(true);
    expect(result.auraeffectsInstalled).toBe(true);
    expect(result.autoAnimationsInstalled).toBe(true);
    expect(result.vision5eInstalled).toBe(true);
  });

  it("treats inactive modules as uninstalled", () => {
    setMockModules({ "midi-qol": { active: false }, dae: { active: false } });
    const result = SystemHelpers.effectModules();
    expect(result.midiQolInstalled).toBe(false);
    expect(result.daeInstalled).toBe(false);
  });

  it("chris-premades stays uninstalled under the stubbed isNewerVersion", () => {
    // The foundry mock isNewerVersion always returns false, so the version
    // gate never passes; this pins the active && version-check combination.
    setMockModules({ "chris-premades": { active: true, version: "2.0.0" } });
    const result = SystemHelpers.effectModules();
    expect(result.chrisInstalled).toBe(false);
  });

  it("caches the first result until the cache is cleared", () => {
    const first = SystemHelpers.effectModules();
    expect(first.midiQolInstalled).toBe(false);

    setMockModules({ "midi-qol": { active: true }, dae: { active: true } });
    const cached = SystemHelpers.effectModules();
    expect(cached).toBe(first);
    expect(cached.midiQolInstalled).toBe(false);

    globals.CONFIG.DDBI.EFFECT_CONFIG.MODULES = {};
    const fresh = SystemHelpers.effectModules();
    expect(fresh.midiQolInstalled).toBe(true);
    expect(fresh.hasCore).toBe(true);
  });
});
