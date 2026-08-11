/**
 * Factory helpers for DDB-shaped source data used by the instance-level
 * feature parser tests (DDBAction, DDBAttackAction, DDBChoiceFeature,
 * DDBClassFeatures).
 *
 * Shapes follow src/types/ddb-character-source.d.ts, but everything here is
 * duck-typed (plain objects with override spreads) in the same style as
 * tests/_fixtures/mockCharacter.ts. All ids and names are generic and
 * invented for the tests.
 */

/** IDDBDamageDice shape (ddbDefinition.dice / die / levelScale.dice). */
export function makeDdbDice(overrides: Record<string, any> = {}): any {
  return {
    diceCount: 1,
    diceValue: 6,
    diceMultiplier: null,
    fixedValue: null,
    diceString: "1d6",
    ...overrides,
  };
}

/** IDDBAction shape (character.actions.class/race/feat entries). */
export function makeDdbAction(overrides: Record<string, any> = {}): any {
  return {
    id: 90001,
    entityTypeId: 222216831,
    name: "Test Action",
    description: "<p>A test action.</p>",
    snippet: "",
    abilityModifierStatId: null,
    saveStatId: null,
    fixedSaveDc: null,
    fixedToHit: null,
    saveFailDescription: null,
    saveSuccessDescription: null,
    onMissDescription: null,
    attackTypeRange: null,
    actionType: 3,
    attackSubtype: null,
    dice: null,
    value: null,
    damageTypeId: null,
    isMartialArts: false,
    isProficient: true,
    displayAsAttack: false,
    numberOfTargets: null,
    spellRangeType: null,
    ammunition: null,
    range: {
      range: null,
      longRange: null,
      aoeType: null,
      aoeSize: null,
      hasAoeSpecialDescription: false,
      minimumRange: null,
    },
    activation: { activationType: 1, activationTime: 1 },
    limitedUse: null,
    componentId: 80001,
    componentTypeId: 12168134,
    ...overrides,
  };
}

/**
 * Class-feature/racial-trait style entry: `{ definition: { ... } }`.
 * `definitionOverrides` merges into the definition, `overrides` merges at
 * the top level (e.g. levelScale, componentId).
 */
export function makeDdbFeature(
  definitionOverrides: Record<string, any> = {},
  overrides: Record<string, any> = {},
): any {
  return {
    definition: {
      id: 70001,
      entityTypeId: 12168134,
      definitionKey: "12168134:70001",
      name: "Test Feature",
      description: "<p>A test feature.</p>",
      snippet: "",
      sources: [],
      requiredLevel: 1,
      displayOrder: 1,
      hideInSheet: false,
      componentId: null,
      componentTypeId: null,
      classId: null,
      ...definitionOverrides,
    },
    componentId: null,
    componentTypeId: null,
    levelScale: null,
    ...overrides,
  };
}

/** Minimal IDDBClass shape for character.classes entries. */
export function makeDdbClass(overrides: Record<string, any> = {}): any {
  return {
    id: 60001,
    level: 5,
    isStartingClass: true,
    definition: {
      id: 50001,
      name: "Testclass",
      sources: [],
      classFeatures: [],
      ...overrides.definition,
    },
    subclassDefinition: overrides.subclassDefinition ?? null,
    classFeatures: [],
    ...Object.fromEntries(
      Object.entries(overrides).filter(([k]) => !["definition", "subclassDefinition"].includes(k)),
    ),
  };
}

/** Minimal IDDBData shell (`{ character: {...}, classOptions: [] }`). */
export function makeDdbCharacterData(overrides: Record<string, any> = {}): any {
  const { character, ...rest } = overrides;
  return {
    character: {
      classes: [],
      feats: [],
      race: { fullName: "Testfolk", baseName: "Testfolk", racialTraits: [] },
      actions: { race: [], class: [], feat: [], item: [], background: [] },
      options: { class: [], race: [], feat: [] },
      choices: { class: [], race: [], feat: [], background: [], item: [], choiceDefinitions: [] },
      modifiers: { class: [], race: [], background: [], item: [], feat: [], condition: [] },
      optionalClassFeatures: [],
      characterValues: [],
      customActions: [],
      ...character,
    },
    classOptions: [],
    ...rest,
  };
}

/** IDDBChoiceResult shape as produced by DDBDataUtils.getChoices. */
export function makeDdbChoice(overrides: Record<string, any> = {}): any {
  return {
    id: 101,
    entityTypeId: 26,
    label: "Option A",
    description: "<p>Option A text.</p>",
    componentId: 70001,
    componentTypeId: 12168134,
    choiceId: "choice-1",
    optionId: 101,
    optionComponentId: null,
    parentChoiceId: null,
    sourceId: null,
    subType: 1,
    type: "class",
    wasOption: false,
    ...overrides,
  };
}

/**
 * Instantiates a DDBEnricherData subclass against a stub ddbEnricher, for tests
 * that exercise an enricher's getters directly rather than through the parsing
 * pipeline.
 *
 * The importing test file must still carry its own `vi.mock` preamble (see
 * tests/parser/enrichers/DDBEnricherData.uses.test.ts) — vi.mock is hoisted per
 * file, so it cannot be shared from here. Loading the real lib barrel while
 * DDBEnricherData is mid-evaluation crashes SpellListExtractorMixin's
 * `extends DDBEnricherData`, which is what those mocks are avoiding.
 *
 * Pass `actions: null` to model a parser with no ddbData at all (the
 * compendium/muncher context, where hasAction must not throw).
 */
export function makeEnricherData<T>(
  Enricher: new (options: any) => T,
  { name = "Test Feature", actions = {}, rawCharacter = null, is2014 = false }: {
    name?: string;
    actions?: Record<string, any[]> | null;
    rawCharacter?: any;
    is2014?: boolean;
  } = {},
): T {
  const ddbParser = actions === null
    ? { rawCharacter }
    : {
        ddbData: {
          character: {
            actions: { class: [], race: [], feat: [], item: [], background: [], ...actions },
          },
        },
        rawCharacter,
      };
  return new Enricher({
    ddbEnricher: {
      ddbParser,
      is2014,
      useLookupName: false,
      activityGenerator: null,
      effectType: "",
      document: {},
      name,
      isCustomAction: false,
      manager: null,
    },
  });
}

/** Minimal I5ePCData raw character with the flags feature parsing reads. */
export function makeRawCharacter(overrides: Record<string, any> = {}): any {
  const { effectAbilities, characterValues, resources, flags, ...rest } = overrides;
  const defaultEffectAbilities: Record<string, { value: number }> = {};
  for (const ability of ["str", "dex", "con", "int", "wis", "cha"]) {
    defaultEffectAbilities[ability] = { value: 10 };
  }
  return {
    system: { resources: resources ?? {} },
    flags: {
      ddbimporter: {
        compendium: false,
        dndbeyond: {
          characterValues: characterValues ?? [],
          effectAbilities: effectAbilities ?? defaultEffectAbilities,
          totalLevels: 5,
        },
        ...flags,
      },
    },
    effects: [],
    ...rest,
  };
}
