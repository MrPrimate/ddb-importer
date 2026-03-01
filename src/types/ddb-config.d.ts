// DDB CONFIG interfaces

export {};

global {

  export interface IDDBConfigStat {
    id: number;
    entityTypeId: number;
    key: string;
    name: string;
    compendiumText: string;
  }

  export interface IDDBConfigCurrencyData {
    id: number;
    name: string;
    conversionFromGp: number;
    weight: number;
  }

  export interface IDDBConfigSpellRules {
    multiClassSpellSlotDivisor: number;
    multiClassSpellSlotRounding: number;
    isRitualSpellCaster: boolean;
    levelCantripsKnownMaxes: number[];
    levelSpellKnownMaxes: number[] | null;
    levelSpellSlots: number[][];
  }

  export interface IDDBConfigPrerequisiteMapping {
    id: number;
    entityId: number;
    entityTypeId: number;
    type: string;
    subType: string;
    value: number;
    shouldExclude: boolean;
    friendlyTypeName: string;
    friendlySubTypeName: string;
  }

  export interface IDDBConfigClassConfiguration {
    id: number;
    name: string;
    primaryAbilities: number[];
    spellRules: IDDBConfigSpellRules;
    prerequisites: {
      description: string;
      prerequisiteMappings: IDDBConfigPrerequisiteMapping[];
    }[];
  }

  export interface IDDBConfigAbilitySkill {
    id: number;
    entityTypeId: number;
    stat: number;
    name: string;
    description: string;
  }

  export interface IDDBConfigSense {
    id: number;
    entityTypeId: number;
    name: string;
  }

  export interface IDDBConfigCreatureSize {
    id: number;
    entityTypeId: number;
    name: string;
    weightType: number;
  }

  export interface IDDBConfigSourceCategory {
    id: number;
    name: string;
    description: string | null;
    isHideable: boolean;
    isEnabledByDefault: boolean;
    isToggleable: boolean;
    avatarUrl: string;
  }

  export interface IDDBConfigMovement {
    id: number;
    name: string;
    description: string;
  }

  export interface IDDBConfigProficiencyGroup {
    label: string;
    customProficiencyGroup: number;
    customAdjustments: number[];
    entityTypeIds: number[];
  }

  export interface IDDBConfigCreatureGroup {
    id: number;
    name: string;
    categoryId: number;
    enabledByDefault: boolean;
    allowDuplicates: boolean;
    allowCombat: boolean;
    isPrimary: boolean;
    isMisc: boolean;
    specialQualityTitle: string | null;
    specialQualityText: string | null;
    flags: string[];
    monsterTypes: number[];
    ownerStats: number[];
    description: string;
    actionSnippet: string | null;
  }

  export interface IDDBConfigNaturalActionAttackCustomData {
    name: string | null;
    notes: string | null;
    damageBonus: number | null;
    toHitBonus: number | null;
    toHit: number | null;
    isOffhand: boolean | null;
    isSilver: boolean | null;
    isAdamantine: boolean | null;
    isProficient: boolean | null;
    saveDcBonus: number | null;
    saveDc: number | null;
    weight: number | null;
    displayAsAttack: boolean | null;
    cost: number | null;
  }

  export interface IDDBConfigNaturalAction {
    id: number;
    entityTypeId: number;
    limitedUse: any | null;
    name: string;
    description: string;
    snippet: string;
    abilityModifierStatId: number | null;
    onMissDescription: string | null;
    saveFailDescription: string | null;
    saveSuccessDescription: string | null;
    saveStatId: number | null;
    fixedSaveDc: number | null;
    attackTypeRange: number;
    actionType: number;
    attackSubtype: number;
    dice: any | null;
    value: number | null;
    damageTypeId: number | null;
    isMartialArts: boolean;
    isProficient: boolean;
    spellRangeType: number | null;
    displayAsAttack: boolean | null;
    range: any | null;
    activation: { activationTime: number; activationType: number };
    attackCustomData: IDDBConfigNaturalActionAttackCustomData;
    componentId: number;
    componentTypeId: number;
  }

  export interface IDDBConfigAdjustmentTypeConstraint {
    id: number;
    name: string;
    value: number;
  }

  export interface IDDBConfigAdjustmentType {
    id: number;
    name: string;
    dataType: number;
    constraints: IDDBConfigAdjustmentTypeConstraint[];
  }

  export interface IDDBConfigSpellComponent {
    id: number;
    name: string;
    shortName: string;
    description: string;
  }

  export interface IDDBConfigActivationType {
    id: number;
    name: string;
    prerequisite: string | null;
    description: string;
    requiredLevel: number | null;
    displayOrder: number | null;
  }

  export interface IDDBConfigBasicAction {
    id: number;
    name: string;
    description: string;
    activation: { activationTime: number | null; activationType: number };
  }

  export interface IDDBConfigRule {
    id: number;
    name: string;
    description: string;
  }

  export interface IDDBConfigLifestyle {
    id: number;
    name: string;
    description: string;
    cost: string;
  }

  export interface IDDBConfigConditionLevel {
    definition: {
      id: number;
      entityTypeId: number;
      level: number;
      effect: string;
    };
  }

  export interface IDDBConfigConditionDefinition {
    id: number;
    entityTypeId: number;
    name: string;
    type: number;
    description: string;
    slug: string;
    levels: IDDBConfigConditionLevel[];
  }

  export interface IDDBConfigCondition {
    definition: IDDBConfigConditionDefinition;
  }

  export interface IDDBConfigDamageAdjustment {
    id: number;
    name: string;
    type: number;
    slug: string;
    isMulti: boolean;
    displayOrder: number;
  }

  export interface IDDBConfigWeaponProperty {
    id: number;
    name: string;
    prerequisite: string | null;
    description: string;
    requiredLevel: number | null;
    displayOrder: number | null;
  }

  export interface IDDBConfigAoeType {
    id: number;
    name: string;
    prerequisite: string | null;
    description: string;
    requiredLevel: number | null;
    displayOrder: number | null;
  }

  export interface IDDBConfigArmor {
    id: number;
    entityTypeId: number;
    name: string;
    categoryId: number;
  }

  export interface IDDBConfigTool {
    id: number;
    name: string;
  }

  export interface IDDBConfigWeapon {
    id: number;
    entityTypeId: number;
    name: string;
    categoryId: number;
  }

  export interface IDDBConfigLanguage {
    id: number;
    name: string;
  }

  export interface IDDBConfigRestoreType {
    id: number;
    name: string;
    description: string;
  }

  export interface IDDBConfigRaceGroup {
    id: number;
    name: string;
    avatarUrl: string | null;
  }

  export interface IDDBConfigIdName {
    id: number;
    name: string;
  }

  export interface IDDBConfigCoverType {
    type: string;
    name: string;
  }

  export interface IDDBConfigCreatureGroupFlag {
    id: number;
    name: string;
    key: string;
    value: any;
    valueContextId: number | null;
  }

  export interface IDDBConfigMonsterType {
    pluralizedName: string;
    avatarUrl: string;
    id: number;
    name: string;
    description: string;
  }

  export interface IDDBConfigChallengeRating {
    id: number;
    value: number;
    proficiencyBonus: number;
    xp: number;
  }

  export interface IDDBConfigWeaponCategory {
    id: number;
    entityTypeId: number;
    name: string;
  }

  export interface IDDBConfigAdditionalLevelType {
    id: number;
    name: string;
    prerequisite: string | null;
    description: string;
    requiredLevel: number | null;
    displayOrder: number | null;
  }

  export interface IDDBConfigStatModifier {
    value: number;
    modifier: number;
  }

  export interface IDDBConfigAlignment {
    id: number;
    name: string;
    description: string;
    availableToCharacter: boolean;
  }

  export interface IDDBConfigSource {
    id: number;
    name: string;
    description: string;
    sourceCategoryId: number;
    isReleased: boolean;
    avatarURL: string;
    sourceURL: string;
  }

  export interface IDDBConfigLevelProficiencyBonus {
    level: number;
    bonus: number;
  }

  export interface IDDBConfig {
    armor: IDDBConfigArmor[];
    tools: IDDBConfigTool[];
    weapons: IDDBConfigWeapon[];
    languages: IDDBConfigLanguage[];
    restoreTypes: IDDBConfigRestoreType[];
    raceGroups: IDDBConfigRaceGroup[];
    spellRangeTypes: IDDBConfigIdName[];
    adjustmentDataTypes: IDDBConfigIdName[];
    coverTypes: IDDBConfigCoverType[];
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
    monsterTypes: IDDBConfigMonsterType[];
    challengeRatings: IDDBConfigChallengeRating[];
    creatureGroups: IDDBConfigCreatureGroup[];
    creatureGroupCategories: IDDBConfigIdName[];
    environments: IDDBConfigIdName[];
    armorTypes: IDDBConfigIdName[];
    gearTypes: IDDBConfigIdName[];
    naturalActions: IDDBConfigNaturalAction[];
    adjustmentTypes: IDDBConfigAdjustmentType[];
    weaponCategories: IDDBConfigWeaponCategory[];
    spellComponents: IDDBConfigSpellComponent[];
    activationTypes: IDDBConfigActivationType[];
    basicActions: IDDBConfigBasicAction[];
    rules: IDDBConfigRule[];
    lifestyles: IDDBConfigLifestyle[];
    conditions: IDDBConfigCondition[];
    damageAdjustments: IDDBConfigDamageAdjustment[];
    weaponProperties: IDDBConfigWeaponProperty[];
    aoeTypes: IDDBConfigAoeType[];
    additionalLevelTypes: IDDBConfigAdditionalLevelType[];
    statModifiers: IDDBConfigStatModifier[];
    alignments: IDDBConfigAlignment[];
    sources: IDDBConfigSource[];
    levelProficiencyBonuses: IDDBConfigLevelProficiencyBonus[];
    levelExperiencePoints: number[];
    diceValues: number[];
    stats: IDDBConfigStat[];
    currencyData: IDDBConfigCurrencyData[];
    classConfigurations: IDDBConfigClassConfiguration[];
    abilitySkills: IDDBConfigAbilitySkill[];
    senses: IDDBConfigSense[];
    creatureSizes: IDDBConfigCreatureSize[];
    limitedUseResetTypes: IDDBConfigIdName[];
    sourceCategories: IDDBConfigSourceCategory[];
    movements: IDDBConfigMovement[];
    multiClassSpellSlots: number[][];
    pactMagicMultiClassSpellSlots: number[][];
    proficiencyGroups: IDDBConfigProficiencyGroup[];
    vehicleConfiguration: any | null;
  }
}
