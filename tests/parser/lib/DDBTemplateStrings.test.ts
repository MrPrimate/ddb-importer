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
    expect(result?.text).toBe("+ [[max(@abilities.str.mod, @abilities.dex.mod)]]");
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

  it("falls back to artificer for Enhanced Defense", () => {
    const feature = makeFeature({ name: "Enhanced Defense", componentId: null });
    const result = parse(ddb, character, "{{classlevel}}", feature);
    expect(result?.text).toBe("[[@classes.artificer.levels]]");
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
    expect(result?.text).toBe("[[max(@classes.wizard.levels, 1)]]");
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

  it("merges a dice string preceding a template into one roll", () => {
    // A literal dice string before the template ("1d8 {{limiteduse}}") is
    // wrapped as a plain roll box and merged into a single roll by fixRollables,
    // preserving the surrounding spacing.
    const feature = makeFeature({ limitedUse: { maxUses: 3 } });
    const result = parse(ddb, character, "deals 1d8 {{limiteduse}} damage", feature);
    expect(result?.text).toBe("deals [[/roll 1d8 + 3]] damage");
  });

  it("does not add NaN results to resultStrings", () => {
    const result = parse(ddb, character, "DC {{savedc:con}}", makeFeature());
    expect(result?.resultStrings).toHaveLength(1);
    expect(result?.resultStrings[0]).not.toContain("NaN");
  });
});

// =============================================================================
// Real DDB snippets
//
// Regression coverage using verbatim description/snippet text pulled from two
// live characters (diff/raw.json, diff/optional.json). Characterization style:
// each assertion pins the actual parse() output for a real-world input shape.
// =============================================================================

// A dice-backed scale value, matching the "resolves a dice scale value" fixture.
const scaleDiceFeature = () => makeFeature(
  { componentId: 55 },
  { componentId: 55, levelScale: { level: 1, fixedValue: null, dice: { diceString: "2d6" } } },
);

describe("real DDB snippets", () => {
  it("resolves a savedc token inside a full sentence and leaves the dice ladder untouched", () => {
    const result = parse(
      ddb,
      character,
      "Each creature in the area must make a DC {{savedc:con}} saving throw (type determined by your ancestry), taking 2d6 ([6th] 3d6, [11th] 4d6, [16th] 5d6) on a failed save, and half damage on a successful one",
      makeFeature(),
    );
    expect(result?.text).toBe(
      "Each creature in the area must make a DC [[8 + @abilities.con.mod + @prof]] saving throw (type determined by your ancestry), taking 2d6 ([6th] 3d6, [11th] 4d6, [16th] 5d6) on a failed save, and half damage on a successful one",
    );
  });

  it("resolves a savedc token trailed by an ability abbreviation", () => {
    const result = parse(ddb, character, "The target must succeed on a DC {{savedc:dex}} Dex", makeFeature());
    expect(result?.text).toBe("The target must succeed on a DC [[8 + @abilities.dex.mod + @prof]] Dex");
  });

  it("resolves a savedc token inside a parenthetical alongside literal dice", () => {
    const result = parse(
      ddb,
      character,
      "line (DEX DC {{savedc:con}}, half damage on success) for 2d6 Fire Damage [6th] 3d6, [11th] 4d6, [16th] 5d6",
      makeFeature(),
    );
    expect(result?.text).toBe(
      "line (DEX DC [[8 + @abilities.con.mod + @prof]], half damage on success) for 2d6 Fire Damage [6th] 3d6, [11th] 4d6, [16th] 5d6",
    );
  });

  it("resolves two different tokens on the same line", () => {
    const result = parse(
      ddb,
      character,
      "You can cast known ranger spells using WIS as your spellcasting modifier (Spell DC {{savedc:wis}}, Spell Attack {{spellattack:wis}})",
      makeFeature(),
    );
    expect(result?.definitions).toHaveLength(2);
    expect(result?.text).toBe(
      "You can cast known ranger spells using WIS as your spellcasting modifier (Spell DC [[8 + @abilities.wis.mod + @prof]], Spell Attack + [[@abilities.wis.mod + @prof + @bonus.rsak.attack]])",
    );
  });

  it("merges a dice string glued (no space) to a signed modifier into one roll", () => {
    // "1d4{{modifier:str#signed}}" has no space before the token, so rollMatchTest
    // stays false and the removed dup path is not exercised; fixRollables folds
    // the leading 1d4 into the roll box with a properly spaced sign.
    const result = parse(ddb, character, "1d4{{modifier:str#signed}}", makeFeature());
    expect(result?.text).toBe("[[/roll 1d4 + @abilities.str.mod]]");
  });

  it("resolves a signed modifier token in prose", () => {
    const result = parse(
      ddb,
      character,
      "Once on each of your turns, you can add {{modifier:wis}} to the attack roll or the damage roll of an attack you make against one of your favored enemies",
      makeFeature(),
    );
    expect(result?.text).toBe(
      "Once on each of your turns, you can add + [[@abilities.wis.mod]] to the attack roll or the damage roll of an attack you make against one of your favored enemies",
    );
  });

  it("applies a min constraint and unsigned marker to a modifier token", () => {
    const result = parse(
      ddb,
      character,
      "Up to {{modifier:dex@min:1#unsigned}} time(s) per Long Rest, immediately after you deal Sneak Attack damage to a creature on your turn, you can target a second creature that you can see within 30 ft",
      makeFeature(),
    );
    expect(result?.text).toBe(
      "Up to [[max(@abilities.dex.mod, 1)]] time(s) per Long Rest, immediately after you deal Sneak Attack damage to a creature on your turn, you can target a second creature that you can see within 30 ft",
    );
  });

  it("resolves a bare proficiency token", () => {
    const result = parse(ddb, character, "You have {{proficiency}} Luck Points that you can spend on the benefits below", makeFeature());
    expect(result?.text).toBe("You have + [[@prof]] Luck Points that you can spend on the benefits below");
  });

  it("resolves a signed proficiency token", () => {
    const result = parse(ddb, character, "When you roll Initiative, add {{proficiency#signed}} to the roll", makeFeature());
    expect(result?.text).toBe("When you roll Initiative, add + [[@prof]] to the roll");
  });

  it("resolves an unsigned proficiency token without a leading plus", () => {
    const result = parse(
      ddb,
      character,
      "You can use this feature {{proficiency#unsigned}} times, and you regain all expended uses when you finish a long rest",
      makeFeature(),
    );
    expect(result?.text).toBe(
      "You can use this feature [[@prof]] times, and you regain all expended uses when you finish a long rest",
    );
  });

  it("resolves a dice scalevalue token in prose to a roll", () => {
    const result = parse(ddb, character, "The attack's target takes {{scalevalue}} piercing damage from the swarm", scaleDiceFeature());
    expect(result?.text).toBe("The attack's target takes [[/roll 2d6]] piercing damage from the swarm");
  });

  it("resolves a dice scalevalue token at the head of a clause", () => {
    const result = parse(
      ddb,
      character,
      "Roll {{scalevalue}}, and the second creature takes Necrotic damage equal to the roll's total",
      scaleDiceFeature(),
    );
    expect(result?.text).toBe("Roll [[/roll 2d6]], and the second creature takes Necrotic damage equal to the roll's total");
  });

  it("resolves a rounded classlevel token immediately followed by a die size", () => {
    const result = parse(ddbWithWizard, character, "{{(classlevel/2)@roundup}}d6", makeFeature({ classId: 42 }));
    // suspicious: the trailing "d6" is left outside the roll box, so the "Nd6"
    // dice expression is never assembled ("[[ceil(...)]]d6"); pinned as-is.
    expect(result?.text).toBe("[[ceil( + @classes.wizard.levels/2)]]d6");
  });
});

describe("display string linktext (friendly labels lost)", () => {
  // Characterization of a systemic bug: parseMatch builds each
  // displayStrings[i].linktext with `result.replace(token, " (Label) ")` AFTER
  // `result` has already had that token substituted to the parsed formula. The
  // token is gone, so every replace is a no-op and linktext ends up identical to
  // parsed. For this input the friendly labels that SHOULD have appeared are:
  //   savedc:wis     -> " (Save DC) "
  //   modifier:str   -> " (... Modifier) "
  //   proficiency    -> " (Proficiency Bonus) "
  //   characterlevel -> " (Character Level) "
  // None survive. displayStrings/linktext is not consumed anywhere today, so the
  // defect is currently latent. Pinned as-is.
  it("loses the friendly label for every token, leaving linktext === parsed", () => {
    const result = parse(
      ddb,
      character,
      "On a failed DC {{savedc:wis}} save, add {{modifier:str}} to your {{proficiency}} at level {{characterlevel}}.",
      makeFeature(),
    );
    const displayStrings = result?.displayStrings ?? [];
    expect(displayStrings).toHaveLength(4);

    // Every entry lost its label: linktext is just the parsed formula, and no
    // entry contains a "(" that a real "(Label)" would have introduced.
    for (const ds of displayStrings) {
      expect(ds.linktext).toBe(ds.parsed);
      expect(ds.linktext).not.toContain("(");
    }

    // Concrete values, in text order.
    expect(displayStrings[0].parsed).toBe("8 + @abilities.wis.mod + @prof");
    expect(displayStrings[1].parsed).toBe(" + @abilities.str.mod");
    expect(displayStrings[2].parsed).toBe(" + @prof");
    expect(displayStrings[3].parsed).toBe(" + @details.level");
  });
});
