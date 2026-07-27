// Mock barrel re-exports to break circular dependency chains.
// The shared mockBarrels factories fail here with "Cannot access
// '__vi_import_0__' before initialization" (vi.mock hoisting), so this uses
// the inline triple from hp.test.ts.
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));
// Keep the template parser pure: parseTags normally does compendium/rule
// reference linking, identity is enough here.
vi.mock("../../../src/parser/lib/DDBReferenceLinker", () => ({
  parseTags: (t: string) => t,
}));

import { parse } from "../../../src/parser/lib/DDBTemplateStrings";

// =============================================================================
// Fixtures
// =============================================================================

function makeFeature(defOverrides: Record<string, any> = {}, extra: Record<string, any> = {}): any {
  return {
    definition: {
      id: 1,
      entityTypeId: 100,
      componentId: null,
      name: "Test Feature",
      ...defOverrides,
    },
    ...extra,
  };
}

const wizardClass: any = {
  level: 5,
  definition: { id: 42, name: "Wizard", classFeatures: [] },
  subclassDefinition: null,
  classFeatures: [
    { definition: { id: 77, entityTypeId: 12, name: "Arcane Recovery", requiredLevel: 1 } },
  ],
};

function makeDdb(overrides: Record<string, any> = {}): any {
  return {
    character: {
      options: { race: [], class: [], feat: [] },
      classes: [],
      optionalClassFeatures: [],
      ...overrides,
    },
    classOptions: [],
  };
}

function makeCharacter(withFlags = false): any {
  if (!withFlags) return {};
  return { flags: { ddbimporter: { dndbeyond: { templateStrings: [] } } } };
}

const ddb = makeDdb();
const ddbWithWizard = makeDdb({ classes: [wizardClass] });
const character = makeCharacter();

// =============================================================================
// Basics
// =============================================================================

describe("parse basics", () => {
  it("returns undefined for empty text", () => {
    expect(parse(ddb, character, "", makeFeature())).toBeUndefined();
  });

  it("passes through text with no templates", () => {
    const result = parse(ddb, character, "Just some words.", makeFeature());
    expect(result?.text).toBe("Just some words.");
    expect(result?.resultStrings).toEqual([]);
    expect(result?.definitions).toEqual([]);
  });

  it("copies feature definition metadata onto the result", () => {
    const feature = makeFeature({ id: 9, entityTypeId: 55, componentId: 7 });
    const result = parse(ddb, character, "text", feature);
    expect(result?.id).toBe(9);
    expect(result?.entityTypeId).toBe(55);
    expect(result?.componentId).toBe(7);
    expect(result?.componentTypeId).toBeNull();
    expect(result?.damageTypeId).toBeNull();
  });

  it("uses a bare definition when the feature has no definition wrapper", () => {
    const bareDef: any = { id: 3, entityTypeId: 66, componentId: null, name: "Bare" };
    const result = parse(ddb, character, "text", bareDef);
    expect(result?.id).toBe(3);
    expect(result?.entityTypeId).toBe(66);
  });

  it("converts carriage-return bullet points to paragraph breaks", () => {
    const result = parse(ddb, character, "a\r\n• b", makeFeature());
    expect(result?.text).toBe("a</p>\r\n<p>&bull; b");
  });

  it("pushes results into character template string flags when present", () => {
    const flaggedCharacter = makeCharacter(true);
    const result = parse(ddb, flaggedCharacter, "DC {{savedc:con}}", makeFeature());
    expect(flaggedCharacter.flags.ddbimporter.dndbeyond.templateStrings).toHaveLength(1);
    expect(flaggedCharacter.flags.ddbimporter.dndbeyond.templateStrings[0]).toBe(result);
  });
});

// =============================================================================
// savedc
// =============================================================================

describe("savedc templates", () => {
  it("replaces a single-ability save DC", () => {
    const result = parse(ddb, character, "DC {{savedc:con}}", makeFeature());
    expect(result?.text).toBe("DC [[8 + @abilities.con.mod + @prof]]");
  });

  it("replaces a two-ability save DC with a max()", () => {
    const result = parse(ddb, character, "DC {{savedc:str,dex}}", makeFeature());
    expect(result?.text).toBe("DC [[max(8 + @abilities.str.mod + @prof, 8 + @abilities.dex.mod + @prof)]]");
  });

  it("records type and subType on the definition entry", () => {
    const result = parse(ddb, character, "DC {{savedc:con}}", makeFeature());
    expect(result?.definitions).toHaveLength(1);
    expect(result?.definitions[0].type).toBe("savedc");
    expect(result?.definitions[0].subType).toBe("con");
  });

  it("captures a display string whose linktext matches the parsed formula", () => {
    // Characterization: parseMatch computes linktext by replacing the template
    // token in `result` AFTER result has already been substituted, so the
    // friendly "(Save DC)" label never survives; linktext === parsed instead.
    // Looks like a bug, pinned as current behavior.
    const result = parse(ddb, character, "DC {{savedc:wis}}", makeFeature());
    expect(result?.displayStrings[0].linktext).toBe("8 + @abilities.wis.mod + @prof");
    expect(result?.displayStrings[0].parsed).toBe("8 + @abilities.wis.mod + @prof");
  });
});

// =============================================================================
// modifier
// =============================================================================

describe("modifier templates", () => {
  it("replaces a single ability modifier as a signed inline roll", () => {
    const result = parse(ddb, character, "{{modifier:cha}}", makeFeature());
    expect(result?.text).toBe("+ [[@abilities.cha.mod]]");
  });

  it("replaces a two-ability modifier with max()", () => {
    const result = parse(ddb, character, "{{modifier:str,dex}}", makeFeature());
    expect(result?.text).toBe("+ [[max( + @abilities.str.mod,  + @abilities.dex.mod)]]");
  });
});

// =============================================================================
// proficiency / characterlevel / spellattack / abilityscore
// =============================================================================

describe("simple attribute templates", () => {
  it("replaces proficiency", () => {
    const result = parse(ddb, character, "gain {{proficiency}} bonus", makeFeature());
    expect(result?.text).toBe("gain + [[@prof]] bonus");
  });

  it("replaces characterlevel", () => {
    const result = parse(ddb, character, "{{characterlevel}}", makeFeature());
    expect(result?.text).toBe("+ [[@details.level]]");
  });

  it("replaces spellattack with attack bonus parts", () => {
    const result = parse(ddb, character, "{{spellattack:cha}}", makeFeature());
    expect(result?.text).toBe("+ [[@abilities.cha.mod + @prof + @bonus.rsak.attack]]");
  });

  it("replaces abilityscore with the ability value", () => {
    const result = parse(ddb, character, "{{abilityscore:int}}", makeFeature());
    expect(result?.text).toBe("+ [[@abilities.int.value]]");
  });
});

// =============================================================================
// classlevel
// =============================================================================

describe("classlevel templates", () => {
  it("resolves classlevel via a classId on the feature definition", () => {
    const feature = makeFeature({ classId: 42 });
    const result = parse(ddbWithWizard, character, "{{classlevel}}", feature);
    expect(result?.text).toBe("+ [[@classes.wizard.levels]]");
  });

  it("resolves classlevel via componentId feature lookup", () => {
    const feature = makeFeature({ componentId: 77 });
    const result = parse(ddbWithWizard, character, "{{classlevel}}", feature);
    expect(result?.text).toBe("+ [[@classes.wizard.levels]]");
  });

  it("falls back to artificer for Enhanced Defense (current output keeps a stray backtick)", () => {
    // Characterization: src appends a literal backtick to the artificer
    // class levels reference (looks like a bug in DDBTemplateStrings.ts line 167).
    const feature = makeFeature({ name: "Enhanced Defense", componentId: null });
    const result = parse(ddb, character, "{{classlevel}}", feature);
    expect(result?.text).toBe("[[@classes.artificer.levels`]]");
  });

  it("applies roundup to a divided classlevel", () => {
    const feature = makeFeature({ classId: 42 });
    const result = parse(ddbWithWizard, character, "{{(classlevel/2)@roundup}}", feature);
    expect(result?.text).toBe("[[ceil( + @classes.wizard.levels/2)]]");
  });

  it("applies rounddown with unsigned marker", () => {
    const feature = makeFeature({ classId: 42 });
    const result = parse(ddbWithWizard, character, "{{(classlevel/2)@rounddown#unsigned}}", feature);
    expect(result?.text).toBe("[[floor( + @classes.wizard.levels/2)]]");
  });

  it("applies a min constraint to a non-numeric parsed value using max()", () => {
    const feature = makeFeature({ classId: 42 });
    const result = parse(ddbWithWizard, character, "{{classlevel@min:1}}", feature);
    expect(result?.text).toBe("[[max( + @classes.wizard.levels, 1)]]");
  });
});

// =============================================================================
// limiteduse and fixedvalue
// =============================================================================

describe("limiteduse and fixedvalue templates", () => {
  const limitedFeature = () => makeFeature({ limitedUse: { maxUses: 3 } });

  it("replaces limiteduse with max uses", () => {
    const result = parse(ddb, character, "{{limiteduse}}", limitedFeature());
    expect(result?.text).toBe("[[3]]");
  });

  it("replaces limiteduse with empty string when feature has no limited use", () => {
    const result = parse(ddb, character, "{{limiteduse}}", makeFeature());
    expect(result?.text).toBe("[[]]");
  });

  it("applies a min constraint to a numeric value", () => {
    const result = parse(ddb, character, "{{limiteduse@min:5}}", limitedFeature());
    expect(result?.text).toBe("[[5]]");
  });

  it("applies a max constraint to a numeric value", () => {
    const result = parse(ddb, character, "{{limiteduse@max:2}}", limitedFeature());
    expect(result?.text).toBe("[[2]]");
  });

  it("prefixes signed numeric values with a plus", () => {
    const result = parse(ddb, character, "{{limiteduse#signed}}", limitedFeature());
    expect(result?.text).toBe("+ [[3]]");
  });

  it("keeps unsigned numeric values bare", () => {
    const result = parse(ddb, character, "{{limiteduse#unsigned}}", limitedFeature());
    expect(result?.text).toBe("[[3]]");
  });

  it("replaces fixedvalue with its number", () => {
    const result = parse(ddb, character, "{{fixedvalue:8}}", makeFeature());
    expect(result?.text).toBe("[[8]]");
  });
});

// =============================================================================
// scalevalue
// =============================================================================

describe("scalevalue templates", () => {
  it("resolves a fixed scale value", () => {
    const feature = makeFeature(
      { componentId: 55 },
      { componentId: 55, levelScale: { level: 1, fixedValue: 4, dice: null } },
    );
    const result = parse(ddb, character, "{{scalevalue}}", feature);
    expect(result?.text).toBe("[[4]]");
  });

  it("resolves a dice scale value to a roll", () => {
    const feature = makeFeature(
      { componentId: 55 },
      { componentId: 55, levelScale: { level: 1, fixedValue: null, dice: { diceString: "2d6" } } },
    );
    const result = parse(ddb, character, "{{scalevalue}}", feature);
    expect(result?.text).toBe("[[/roll 2d6]]");
    expect(result?.definitions[0].type).toBe("dice");
  });

  it("resolves a scale value link when the class has level scales", () => {
    const feature = makeFeature(
      {
        id: 55,
        componentId: 55,
        classId: 42,
        name: "Sneak Attack",
        levelScales: [{ level: 1, fixedValue: null, dice: { diceString: "1d6" } }],
      },
      { componentId: 55, levelScale: { level: 1, fixedValue: null, dice: { diceString: "1d6" } } },
    );
    const result = parse(ddbWithWizard, character, "{{scalevalue}}", feature);
    expect(result?.text).toBe("[[/roll @scale.wizard.sneak-attack]]");
  });
});

// =============================================================================
// Odd cases
// =============================================================================

describe("odd cases", () => {
  it("wraps unknown templates in an inline roll rather than passing them through", () => {
    // Characterization: {{gobbledygook}} is not recognized but nothing throws,
    // so the raw token is wrapped as [[gobbledygook]].
    const result = parse(ddb, character, "{{gobbledygook}}", makeFeature());
    expect(result?.text).toBe("[[gobbledygook]]");
  });

  it("dedups repeated identical templates in the same text", () => {
    const result = parse(ddb, character, "DC {{savedc:con}} and DC {{savedc:con}}", makeFeature());
    expect(result?.definitions).toHaveLength(1);
    expect(result?.text).toBe(
      "DC [[8 + @abilities.con.mod + @prof]] and DC [[8 + @abilities.con.mod + @prof]]",
    );
  });

  it("handles multiple different templates in one text", () => {
    const result = parse(ddb, character, "DC {{savedc:con}} takes {{fixedvalue:8}}", makeFeature());
    expect(result?.text).toBe("DC [[8 + @abilities.con.mod + @prof]] takes [[8]]");
    expect(result?.definitions).toHaveLength(2);
  });

  it("mangles a template preceded by a dice string (rollMatch quirk)", () => {
    // Characterization of a suspected bug: when a dice string precedes the
    // template ("1d8 {{limiteduse}}"), rollMatch() searches the text for
    // {{<parsed value>}} (here {{3}}), never finds it, and returns the whole
    // input text, which then replaces the template token wholesale.
    const feature = makeFeature({ limitedUse: { maxUses: 3 } });
    const result = parse(ddb, character, "deals 1d8 {{limiteduse}} damage", feature);
    expect(result?.text).toBe("deals 1d8 deals 1d8 {{limiteduse}} damage damage");
  });

  it("does not add NaN results to resultStrings", () => {
    const result = parse(ddb, character, "DC {{savedc:con}}", makeFeature());
    expect(result?.resultStrings).toHaveLength(1);
    expect(result?.resultStrings[0]).not.toContain("NaN");
  });
});
