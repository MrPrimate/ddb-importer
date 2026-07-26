// Interface for the local RULE_DATA fallback object (data/fallback-rules.json).
//
// RULE_DATA is a superset of the remote DDB config (IDDBConfig in ddb-config.d.ts):
// it carries the same reference tables plus local-only rule constants, image URLs
// and a few element shapes that have drifted from the remote API. Shared element
// shapes are reused from IDDBConfig*; the keys that genuinely differ get their own
// IDDBRuleData* interfaces below.

export {};

global {

  // ---- Elements that differ from the remote IDDBConfig* shapes ---------------

  // Remote IDDBConfigMonsterType requires `description`; RULE_DATA has none.
  interface IDDBRuleDataMonsterType {
    pluralizedName: string;
    avatarUrl: string;
    id: number;
    name: string;
  }

  // Remote IDDBConfigNaturalAction uses numeric ids and an attackCustomData block;
  // the local fallback uses string ids and carries ammunition / target fields.
  interface IDDBRuleDataNaturalAction {
    componentId: number;
    componentTypeId: number;
    id: string;
    entityTypeId: string;
    limitedUse: Record<string, any> | null;
    name: string;
    description: string;
    snippet: string;
    abilityModifierStatId: number;
    onMissDescription: string | null;
    saveFailDescription: string | null;
    saveSuccessDescription: string | null;
    saveStatId: number | null;
    fixedSaveDc: number | null;
    attackTypeRange: number;
    actionType: number;
    attackSubtype: number;
    dice: IDDBDamageDice | null;
    value: number;
    damageTypeId: number;
    isMartialArts: boolean;
    isProficient: boolean;
    spellRangeType: number | null;
    displayAsAttack: boolean | null;
    range: Record<string, any> | null;
    activation: IDDBActionActivation;
    numberOfTargets: number | null;
    fixedToHit: number | null;
    ammunition: Record<string, any> | null;
  }

  // Remote IDDBConfigLanguage is just id/name; the fallback adds rpgSourceId.
  interface IDDBRuleDataLanguage {
    id: number;
    name: string;
    rpgSourceId: number | null;
  }

  // Remote IDDBConfigWeaponProperty requires `description`; RULE_DATA has none.
  interface IDDBRuleDataWeaponProperty {
    id: number;
    name: string;
    prerequisite: string | null;
    requiredLevel: number | null;
    displayOrder: number | null;
  }

  // Remote IDDBConfigAlignment requires `description`; RULE_DATA has none.
  interface IDDBRuleDataAlignment {
    id: number;
    name: string;
    availableToCharacter: boolean;
  }

  // Remote IDDBConfigSource requires avatarURL/sourceURL; the fallback omits them.
  interface IDDBRuleDataSource {
    id: number;
    name: string;
    description: string;
    sourceCategoryId: number;
    isReleased: boolean;
  }

  // Remote IDDBConfigSourceCategory marks the flags optional and avatarUrl as
  // `string | undefined`; RULE_DATA always sets them and allows a null avatarUrl.
  interface IDDBRuleDataSourceCategory {
    id: number;
    name: string;
    description: string | null;
    isHideable: boolean;
    isEnabledByDefault: boolean;
    isToggleable: boolean;
    avatarUrl: string | null;
    isPartneredContent: boolean;
    sortOrder: number;
  }

  // Local-only: builder help text shown against 2024 species options.
  interface IDDBRuleDataBuilderHelperText {
    id: number;
    label: string;
    description: string;
    definitionKeys: string[];
    isInclusive: boolean;
    displayConfiguration: {
      RACIALTRAIT: number;
      ABILITYSCORE: number;
      LANGUAGE: number;
      CLASSFEATURE: number;
    };
    displayOrder: number;
  }

  // Local-only: default initiative bonus / (dis)advantage amounts.
  interface IDDBRuleDataInitiativeScore {
    amount: number;
    advantage: number;
    disadvantage: number;
  }

  // ---- The RULE_DATA object --------------------------------------------------

  interface IDDBRuleData {
    // Numeric rule constants
    minExhaustionLevel: number;
    maxExhaustionLevel: number;
    maxDeathsavesFail: number;
    maxDeathsavesSuccess: number;
    maxSpellLevel: number;
    maxAttunedItemCount: number;
    maxCharacterLevel: number;
    noArmorAcAmount: number;
    maxStatScore: number;
    minStatScore: number;
    basicMaxStatScore: number;
    minimumHpTotal: number;
    minimumLimitedUseMaxUse: number;
    longRestMinimumHitDiceUsedRecovered: number;
    baseWeaponReach: number;
    weaponPropertyReachDistance: number;

    // Default image URLs
    defaultWeaponImageUrl: string;
    defaultGearImageUrl: string;
    defaultArmorImageUrl: string;
    defaultRacePortraitUrl: string;

    // String constants
    stringSpellCasting: string;
    stringPactMagic: string;
    stringMartialArts: string;
    stringSpellEldritchBlast: string;

    // Entity type ids
    baseGearTypeIds: number[] | null;
    languageTypeId: number;
    toolTypeId: number;
    backgroundSpellTypeId: number;
    classSpellTypeId: number;
    ritualCastingTimeMinuteAddition: number;

    // Reference tables
    restoreTypes: IDDBConfigRestoreType[];
    raceGroups: IDDBConfigRaceGroup[];
    spellRangeTypes: IDDBConfigIdName[];
    adjustmentDataTypes: IDDBConfigIdName[];
    spellConditionTypes: IDDBConfigIdName[];
    rangeTypes: IDDBConfigIdName[];
    damageTypes: IDDBConfigIdName[];
    privacyTypes: IDDBConfigIdName[];
    sharingTypes: IDDBConfigIdName[];
    abilityScoreDisplayTypes: IDDBConfigIdName[];
    stealthCheckTypes: IDDBConfigIdName[];
    conditionTypes: IDDBConfigIdName[];
    operators: IDDBConfigIdName[];
    monsterSubTypes: IDDBConfigIdName[];
    creatureGroupFlags: IDDBConfigCreatureGroupFlag[];
    monsterTypes: IDDBRuleDataMonsterType[];
    challengeRatings: IDDBConfigChallengeRating[];
    creatureGroups: IDDBConfigCreatureGroup[];
    creatureGroupCategories: IDDBConfigIdName[];
    environments: IDDBConfigIdName[];
    naturalActions: IDDBRuleDataNaturalAction[];
    languages: IDDBRuleDataLanguage[];
    adjustmentTypes: IDDBConfigAdjustmentType[];
    weaponCategories: IDDBConfigWeaponCategory[];
    spellComponents: IDDBConfigSpellComponent[];
    activationTypes: IDDBConfigActivationType[];
    basicActions: IDDBConfigBasicAction[];
    rules: IDDBConfigIdName[];
    armor: IDDBConfigArmor[];
    tools: IDDBConfigTool[];
    additionalLevelTypes: IDDBConfigAdditionalLevelType[];
    weapons: IDDBConfigWeapon[];
    weaponProperties: IDDBRuleDataWeaponProperty[];
    aoeTypes: IDDBConfigAoeType[];
    lifestyles: IDDBConfigLifestyle[];
    conditions: IDDBConfigCondition[];
    damageAdjustments: IDDBConfigDamageAdjustment[];
    statModifiers: IDDBConfigStatModifier[];
    alignments: IDDBRuleDataAlignment[];
    sources: IDDBRuleDataSource[];
    levelProficiencyBonuses: IDDBConfigLevelProficiencyBonus[];
    levelExperiencePoints: number[];
    diceValues: number[];
    stats: IDDBConfigStat[];
    currencyData: IDDBConfigCurrencyData[];
    classConfigurations: Record<string, any>[] | null;
    abilitySkills: IDDBConfigAbilitySkill[];
    senses: IDDBConfigSense[];
    creatureSizes: IDDBConfigCreatureSize[];
    limitedUseResetTypes: IDDBConfigIdName[];
    sourceCategories: IDDBRuleDataSourceCategory[];
    movements: IDDBConfigMovement[];
    multiClassSpellSlots: number[][];
    pactMagicMultiClassSpellSlots: number[][];
    proficiencyGroups: IDDBConfigProficiencyGroup[];

    // Attunement limits
    defaultAttunedItemCountMax: number;
    maxAttunedItemCountMax: number;
    minAttunedItemCountMax: number;

    coverTypes: IDDBConfigCoverType[];
    gearTypes: IDDBConfigIdName[];
    armorTypes: IDDBConfigIdName[];

    // Base type ids
    baseTypeArmorId: number;
    baseTypeWeaponId: number;
    baseTypeGearId: number;

    builderHelperText: IDDBRuleDataBuilderHelperText[];
    initiativeScore: IDDBRuleDataInitiativeScore;
  }
}
