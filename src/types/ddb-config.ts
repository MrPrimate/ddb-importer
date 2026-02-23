// DDB CONFIG interfaces

export interface DDBConfigStat {
  id: number;
  entityTypeId: number;
  key: string;
  name: string;
  compendiumText: string;
}

export interface DDBConfigCurrencyData {
  id: number;
  name: string;
  conversionFromGp: number;
  weight: number;
}

export interface DDBConfigSpellRules {
  multiClassSpellSlotDivisor: number;
  multiClassSpellSlotRounding: number;
  isRitualSpellCaster: boolean;
  levelCantripsKnownMaxes: number[];
  levelSpellKnownMaxes: number[] | null;
  levelSpellSlots: number[][];
}

export interface DDBConfigPrerequisiteMapping {
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

export interface DDBConfigClassConfiguration {
  id: number;
  name: string;
  primaryAbilities: number[];
  spellRules: DDBConfigSpellRules;
  prerequisites: {
    description: string;
    prerequisiteMappings: DDBConfigPrerequisiteMapping[];
  }[];
}

export interface DDBConfigAbilitySkill {
  id: number;
  entityTypeId: number;
  stat: number;
  name: string;
  description: string;
}

export interface DDBConfigSense {
  id: number;
  entityTypeId: number;
  name: string;
}

export interface DDBConfigCreatureSize {
  id: number;
  entityTypeId: number;
  name: string;
  weightType: number;
}

export interface DDBConfigSourceCategory {
  id: number;
  name: string;
  description: string | null;
  isHideable: boolean;
  isEnabledByDefault: boolean;
  isToggleable: boolean;
  avatarUrl: string;
}

export interface DDBConfigMovement {
  id: number;
  name: string;
  description: string;
}

export interface DDBConfigProficiencyGroup {
  label: string;
  customProficiencyGroup: number;
  customAdjustments: number[];
  entityTypeIds: number[];
}

export interface DDBConfigCreatureGroup {
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

export interface DDBConfigNaturalActionAttackCustomData {
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

export interface DDBConfigNaturalAction {
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
  attackCustomData: DDBConfigNaturalActionAttackCustomData;
  componentId: number;
  componentTypeId: number;
}

export interface DDBConfigAdjustmentTypeConstraint {
  id: number;
  name: string;
  value: number;
}

export interface DDBConfigAdjustmentType {
  id: number;
  name: string;
  dataType: number;
  constraints: DDBConfigAdjustmentTypeConstraint[];
}

export interface DDBConfigSpellComponent {
  id: number;
  name: string;
  shortName: string;
  description: string;
}

export interface DDBConfigActivationType {
  id: number;
  name: string;
  prerequisite: string | null;
  description: string;
  requiredLevel: number | null;
  displayOrder: number | null;
}

export interface DDBConfigBasicAction {
  id: number;
  name: string;
  description: string;
  activation: { activationTime: number | null; activationType: number };
}

export interface DDBConfigRule {
  id: number;
  name: string;
  description: string;
}

export interface DDBConfigLifestyle {
  id: number;
  name: string;
  description: string;
  cost: string;
}

export interface DDBConfigConditionLevel {
  definition: {
    id: number;
    entityTypeId: number;
    level: number;
    effect: string;
  };
}

export interface DDBConfigConditionDefinition {
  id: number;
  entityTypeId: number;
  name: string;
  type: number;
  description: string;
  slug: string;
  levels: DDBConfigConditionLevel[];
}

export interface DDBConfigCondition {
  definition: DDBConfigConditionDefinition;
}

export interface DDBConfigDamageAdjustment {
  id: number;
  name: string;
  type: number;
  slug: string;
  isMulti: boolean;
  displayOrder: number;
}

export interface DDBConfigWeaponProperty {
  id: number;
  name: string;
  prerequisite: string | null;
  description: string;
  requiredLevel: number | null;
  displayOrder: number | null;
}

export interface DDBConfigAoeType {
  id: number;
  name: string;
  prerequisite: string | null;
  description: string;
  requiredLevel: number | null;
  displayOrder: number | null;
}

export interface DDBConfigArmor {
  id: number;
  entityTypeId: number;
  name: string;
  categoryId: number;
}

export interface DDBConfigTool {
  id: number;
  name: string;
}

export interface DDBConfigWeapon {
  id: number;
  entityTypeId: number;
  name: string;
  categoryId: number;
}

export interface DDBConfigLanguage {
  id: number;
  name: string;
}

export interface DDBConfigRestoreType {
  id: number;
  name: string;
  description: string;
}

export interface DDBConfigRaceGroup {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface DDBConfigIdName {
  id: number;
  name: string;
}

export interface DDBConfigCoverType {
  type: string;
  name: string;
}

export interface DDBConfigCreatureGroupFlag {
  id: number;
  name: string;
  key: string;
  value: any;
  valueContextId: number | null;
}

export interface DDBConfigMonsterType {
  pluralizedName: string;
  avatarUrl: string;
  id: number;
  name: string;
  description: string;
}

export interface DDBConfigChallengeRating {
  id: number;
  value: number;
  proficiencyBonus: number;
  xp: number;
}

export interface DDBConfigWeaponCategory {
  id: number;
  entityTypeId: number;
  name: string;
}

export interface DDBConfigAdditionalLevelType {
  id: number;
  name: string;
  prerequisite: string | null;
  description: string;
  requiredLevel: number | null;
  displayOrder: number | null;
}

export interface DDBConfigStatModifier {
  value: number;
  modifier: number;
}

export interface DDBConfigAlignment {
  id: number;
  name: string;
  description: string;
  availableToCharacter: boolean;
}

export interface DDBConfigSource {
  id: number;
  name: string;
  description: string;
  sourceCategoryId: number;
  isReleased: boolean;
  avatarURL: string;
  sourceURL: string;
}

export interface DDBConfigLevelProficiencyBonus {
  level: number;
  bonus: number;
}

export interface DDBConfig {
  armor: DDBConfigArmor[];
  tools: DDBConfigTool[];
  weapons: DDBConfigWeapon[];
  languages: DDBConfigLanguage[];
  restoreTypes: DDBConfigRestoreType[];
  raceGroups: DDBConfigRaceGroup[];
  spellRangeTypes: DDBConfigIdName[];
  adjustmentDataTypes: DDBConfigIdName[];
  coverTypes: DDBConfigCoverType[];
  spellConditionTypes: DDBConfigIdName[];
  rangeTypes: DDBConfigIdName[];
  damageTypes: DDBConfigIdName[];
  privacyTypes: DDBConfigIdName[];
  sharingTypes: DDBConfigIdName[];
  abilityScoreDisplayTypes: DDBConfigIdName[];
  stealthCheckTypes: DDBConfigIdName[];
  conditionTypes: DDBConfigIdName[];
  operators: DDBConfigIdName[];
  monsterSubTypes: DDBConfigIdName[];
  creatureGroupFlags: DDBConfigCreatureGroupFlag[];
  monsterTypes: DDBConfigMonsterType[];
  challengeRatings: DDBConfigChallengeRating[];
  creatureGroups: DDBConfigCreatureGroup[];
  creatureGroupCategories: DDBConfigIdName[];
  environments: DDBConfigIdName[];
  armorTypes: DDBConfigIdName[];
  gearTypes: DDBConfigIdName[];
  naturalActions: DDBConfigNaturalAction[];
  adjustmentTypes: DDBConfigAdjustmentType[];
  weaponCategories: DDBConfigWeaponCategory[];
  spellComponents: DDBConfigSpellComponent[];
  activationTypes: DDBConfigActivationType[];
  basicActions: DDBConfigBasicAction[];
  rules: DDBConfigRule[];
  lifestyles: DDBConfigLifestyle[];
  conditions: DDBConfigCondition[];
  damageAdjustments: DDBConfigDamageAdjustment[];
  weaponProperties: DDBConfigWeaponProperty[];
  aoeTypes: DDBConfigAoeType[];
  additionalLevelTypes: DDBConfigAdditionalLevelType[];
  statModifiers: DDBConfigStatModifier[];
  alignments: DDBConfigAlignment[];
  sources: DDBConfigSource[];
  levelProficiencyBonuses: DDBConfigLevelProficiencyBonus[];
  levelExperiencePoints: number[];
  diceValues: number[];
  stats: DDBConfigStat[];
  currencyData: DDBConfigCurrencyData[];
  classConfigurations: DDBConfigClassConfiguration[];
  abilitySkills: DDBConfigAbilitySkill[];
  senses: DDBConfigSense[];
  creatureSizes: DDBConfigCreatureSize[];
  limitedUseResetTypes: DDBConfigIdName[];
  sourceCategories: DDBConfigSourceCategory[];
  movements: DDBConfigMovement[];
  multiClassSpellSlots: number[][];
  pactMagicMultiClassSpellSlots: number[][];
  proficiencyGroups: DDBConfigProficiencyGroup[];
  vehicleConfiguration: any | null;
}
