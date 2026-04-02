/**
 * Factory for creating minimal DDBCharacter-shaped mock objects.
 *
 * Character parser prototype methods read from `this.source.ddb.character.*`
 * and write to `this.raw.character.*`.  This helper builds a valid default
 * that can be selectively overridden per-test.
 */

const ABILITIES = [
  { id: 1, value: "str", long: "strength" },
  { id: 2, value: "dex", long: "dexterity" },
  { id: 3, value: "con", long: "constitution" },
  { id: 4, value: "int", long: "intelligence" },
  { id: 5, value: "wis", long: "wisdom" },
  { id: 6, value: "cha", long: "charisma" },
];

export interface MockCharacterOverrides {
  ddbCharacter?: Record<string, any>;
  rawSystem?: Record<string, any>;
  rawFlags?: Record<string, any>;
  [key: string]: any;
}

export function makeMockCharacter(overrides: MockCharacterOverrides = {}): any {
  const defaultEffectAbilities: Record<string, { value: number }> = {};
  ABILITIES.forEach((a) => { defaultEffectAbilities[a.value] = { value: 10 }; });

  return {
    source: {
      ddb: {
        character: {
          stats: ABILITIES.map((a) => ({ id: a.id, value: 10 })),
          bonusStats: ABILITIES.map((a) => ({ id: a.id, value: 0 })),
          overrideStats: ABILITIES.map((a) => ({ id: a.id, value: 0 })),
          characterValues: [],
          baseHitPoints: 10,
          bonusHitPoints: 0,
          overrideHitPoints: 0,
          removedHitPoints: 0,
          temporaryHitPoints: 0,
          preferences: { hitPointType: 0 },
          modifiers: { class: [], race: [], background: [], item: [], feat: [], condition: [] },
          classes: [],
          inventory: [],
          feats: [],
          race: { fullName: "Human" },
          background: { definition: { grantedFeats: [] } },
          options: { class: [], race: [], feat: [] },
          choices: { class: [], race: [], feat: [] },
          optionalClassFeatures: [],
          customProficiencies: [],
          ...overrides.ddbCharacter,
        },
        unfilteredModifiers: { class: [], race: [], background: [], item: [], feat: [] },
        classOptions: [],
      },
    },
    raw: {
      character: {
        system: {
          abilities: {},
          attributes: { hp: {}, ac: {}, init: {} },
          skills: {},
          traits: { languages: "", weaponProf: {}, armorProf: {} },
          tools: {},
          bonuses: { rsak: {}, msak: {}, mwak: {}, rwak: {}, abilities: {}, spell: {} },
          ...overrides.rawSystem,
        },
        flags: {
          ddbimporter: {
            dndbeyond: {
              effectAbilities: { ...defaultEffectAbilities },
              totalLevels: 1,
              abilityOverrides: {},
              characterValues: [],
            },
            ...overrides.rawFlags,
          },
        },
        effects: [],
      },
    },
    abilities: { overrides: {}, core: {}, withEffects: {} },
    armor: {},
    proficiencies: [],
    proficienciesIncludingEffects: [],
    weaponMasteries: [],
    ...overrides,
  };
}
