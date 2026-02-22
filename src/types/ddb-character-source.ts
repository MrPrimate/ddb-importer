// ---------------------------------------------------------------------------
// DDB Character Source Interfaces
// Models the JSON returned by the DDB proxy API for a character.
// Leaf objects that are not yet fully typed use `any`.
// ---------------------------------------------------------------------------

// ---- Top-level response ---------------------------------------------------

export interface DDBCharacterResponse {
  success: boolean;
  ddb: DDBData;
}

export interface DDBData {
  name: string;
  character: DDBCharacterData;
  decorations: DDBDecorations;
  backgroundEquipment: DDBEquipmentSlots;
  startingEquipment: DDBEquipmentSlots;
  infusions: DDBInfusions;
  classOptions: any[];
  originOptions: any[];
}

// ---- Decorations (top-level) ----------------------------------------------

export interface DDBDefaultBackdrop {
  backdropAvatarUrl: string;
  largeBackdropAvatarUrl: string;
  smallBackdropAvatarUrl: string;
  thumbnailBackdropAvatarUrl: string;
}

export interface DDBDecorations {
  avatarId: number;
  avatarUrl: string;
  backdropAvatarDecorationKey: string | null;
  backdropAvatarId: number | null;
  backdropAvatarUrl: string | null;
  defaultBackdrop: DDBDefaultBackdrop;
  frameAvatarDecorationKey: string | null;
  frameAvatarId: number | null;
  frameAvatarUrl: string | null;
  largeBackdropAvatarDecorationKey: string;
  largeBackdropAvatarId: number | null;
  largeBackdropAvatarUrl: string | null;
  portraitDecorationKey: string;
  smallBackdropAvatarDecorationKey: string;
  smallBackdropAvatarId: number | null;
  smallBackdropAvatarUrl: string | null;
  themeColor: string | null;
  thumbnailBackdropAvatarDecorationKey: string;
  thumbnailBackdropAvatarId: number | null;
  thumbnailBackdropAvatarUrl: string | null;
}

// ---- Equipment / Infusions ------------------------------------------------

export interface DDBEquipmentSlots {
  slots: any[];
}

export interface DDBInfusions {
  known: any[];
  items: any[];
  infusions: any[];
}

// ---- Source info (shared by classes, races, backgrounds) -------------------

export interface DDBSource {
  sourceId: number;
  pageNumber: number | null;
  sourceType: number;
}

// ---- Ability scores -------------------------------------------------------

export interface DDBAbilityStat {
  id: number;
  name: string | null;
  value: number | null;
}

// ---- Death saves ----------------------------------------------------------

export interface DDBDeathSaves {
  failCount: number;
  successCount: number;
  isStabilized: boolean;
}

// ---- Currencies -----------------------------------------------------------

export interface DDBCurrencies {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

// ---- Spell slots ----------------------------------------------------------

export interface DDBSpellSlot {
  level: number;
  used: number;
  available: number;
}

// ---- Notes & Traits -------------------------------------------------------

export interface DDBNotes {
  allies: string;
  personalPossessions: string;
  otherHoldings: string;
  organizations: string;
  enemies: string;
  backstory: string;
  otherNotes: string;
}

export interface DDBTraits {
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  appearance: string;
}

// ---- Preferences & Configuration ------------------------------------------

export interface DDBPreferences {
  useHomebrewContent: boolean;
  progressionType: number;
  encumbranceType: number;
  ignoreCoinWeight: boolean;
  enforceFeatRules: boolean;
  enforceMulticlassRules: boolean;
  enableOptionalClassFeatures: boolean;
  enableOptionalOrigins: boolean;
  enableDarkMode: boolean;
  enableContainerCurrency: boolean;
  showScaledSpells: boolean;
  showUnarmedStrike: boolean;
  primaryMovement: number;
  primarySense: number;
  privacyType: number;
  sharingType: number;
  abilityScoreDisplayType: number;
  hitPointType: number;
  longRestType: number;
  diceSetId: number | null;
}

export interface DDBConfiguration {
  startingEquipmentType: number;
  abilityScoreType: number;
  showHelpText: boolean;
}

// ---- Source-categorized pattern -------------------------------------------

export interface DDBSourceCategorized<T> {
  race: T;
  class: T;
  background: T;
  item: T;
  feat: T;
}

// ---- Modifiers ------------------------------------------------------------

export interface DDBModifier {
  id: string;
  entityId: number;
  entityTypeId: number;
  type: string;
  subType: string;
  dice: any | null;
  restriction: string;
  statId: number | null;
  requiresAttunement: boolean;
  duration: any | null;
  friendlyTypeName: string;
  friendlySubtypeName: string;
  isGranted: boolean;
  bonusTypes: any[];
  value: number | null;
  fixedValue: number | null;
  availableToMulticlass: boolean;
  modifierTypeId: number;
  modifierSubTypeId: number;
  componentId: number;
  componentTypeId: number;
  tagConstraints: any[];
}

export interface DDBModifiers extends DDBSourceCategorized<DDBModifier[]> {
  condition: DDBModifier[];
}

// ---- Actions --------------------------------------------------------------

export interface DDBActionActivation {
  activationTime: number;
  activationType: number;
}

export interface DDBActionRange {
  range: number | null;
  longRange: number | null;
  aoeType: number | null;
  aoeSize: number | null;
  hasAoeSpecialDescription: boolean;
  minimumRange: number | null;
}

export interface DDBActionLimitedUse {
  name: string | null;
  statModifierUsesId: number | null;
  resetType: number;
  numberUsed: number;
  minNumberConsumed: number;
  maxNumberConsumed: number;
  maxUses: number;
  operator: number;
  useProficiencyBonus: boolean;
  proficiencyBonusOperator: number;
  resetDice: any | null;
}

export interface DDBAction {
  id: number;
  entityTypeId: number;
  name: string;
  description: string;
  snippet: string | null;
  actionType: number;
  attackTypeRange: number | null;
  attackSubtype: number | null;
  dice: any | null;
  value: number | null;
  damageTypeId: number | null;
  isMartialArts: boolean;
  isProficient: boolean;
  displayAsAttack: boolean;
  abilityModifierStatId: number | null;
  saveStatId: number | null;
  fixedSaveDc: number | null;
  fixedToHit: number | null;
  saveFailDescription: string | null;
  saveSuccessDescription: string | null;
  onMissDescription: string | null;
  numberOfTargets: number | null;
  spellRangeType: number | null;
  ammunition: any | null;
  componentId: number;
  componentTypeId: number;
  activation: DDBActionActivation;
  range: DDBActionRange;
  limitedUse: DDBActionLimitedUse | null;
}

export interface DDBActions {
  race: DDBAction[];
  class: DDBAction[];
  feat: DDBAction[];
}

// ---- Classes --------------------------------------------------------------

export interface DDBWealthDice {
  diceCount: number;
  diceValue: number;
  diceMultiplier: number;
  fixedValue: number | null;
  diceString: string;
}

export interface DDBClassDefinition {
  id: number;
  definitionKey: string;
  name: string;
  description: string;
  equipmentDescription: string | null;
  parentClassId: number | null;
  slug: string;
  avatarUrl: string | null;
  largeAvatarUrl: string | null;
  portraitAvatarUrl: string | null;
  moreDetailsUrl: string;
  spellCastingAbilityId: number;
  sources: DDBSource[];
  classFeatures: any[];
  hitDice: number;
  wealthDice: DDBWealthDice | null;
  canCastSpells: boolean;
  knowsAllSpells: boolean;
  spellPrepareType: number | null;
  spellCastingLearningStyle: number | null;
  spellContainerName: string | null;
  sourcePageNumber: number;
  subclassDefinition: DDBClassDefinition | null;
  isHomebrew: boolean;
  primaryAbilities: any[] | null;
  // Card / UI fields
  cardDescription: string | null;
  cardEyebrow: string | null;
  cardHeading: string | null;
  tagline: string | null;
  subclassTagline: string | null;
  subclassFlavorText: string | null;
  classFantasy: string | null;
  color: any | null;
  complexity: number | null;
  highlights: string | null;
  iconicGear: string | null;
  // Image URLs
  desktopCardBackgroundAvatarUrl: string | null;
  desktopCardBannerAvatarUrl: string | null;
  desktopCardForegroundAvatarUrl: string | null;
  mobileCardBackgroundAvatarUrl: string | null;
  mobileCardBannerAvatarUrl: string | null;
  mobileCardForegroundAvatarUrl: string | null;
  detailsBackgroundAvatarUrl: string | null;
  detailsForegroundAvatarUrl: string | null;
  iconAvatarUrl: string | null;
  iconicGearAvatarUrl: string | null;
  // Spell rules
  spellRules: any | null;
  prerequisites: any[] | null;
}

export interface DDBClassFeature {
  definition: any;
  levelScale: any | null;
}

export interface DDBClass {
  id: number;
  entityTypeId: number;
  level: number;
  isStartingClass: boolean;
  hitDiceUsed: number;
  definitionId: number;
  subclassDefinitionId: number | null;
  definition: DDBClassDefinition;
  subclassDefinition: DDBClassDefinition | null;
  classFeatures: DDBClassFeature[];
}

// ---- Race -----------------------------------------------------------------

export interface DDBWeightSpeedSet {
  walk: number;
  fly: number;
  burrow: number;
  swim: number;
  climb: number;
}

export interface DDBWeightSpeeds {
  normal: DDBWeightSpeedSet;
  encumbered: DDBWeightSpeedSet | null;
  heavilyEncumbered: DDBWeightSpeedSet | null;
  override: DDBWeightSpeedSet | null;
  pushDragLift: DDBWeightSpeedSet | null;
}

export interface DDBRace {
  entityRaceId: number;
  entityRaceTypeId: number;
  baseRaceId: number;
  baseRaceTypeId: number;
  definitionKey: string;
  fullName: string;
  baseRaceName: string;
  baseName: string;
  subRaceShortName: string;
  description: string;
  cardDescription: string;
  avatarUrl: string;
  largeAvatarUrl: string;
  portraitAvatarUrl: string;
  desktopCardImageUrl: string;
  mobileCardImageUrl: string;
  moreDetailsUrl: string;
  slug: string;
  type: string;
  size: string;
  sizeId: number;
  isSubRace: boolean;
  isHomebrew: boolean;
  isLegacy: boolean;
  supportsSubrace: boolean;
  speciesGroupId: number;
  groupIds: any[];
  featIds: any[];
  racialTraits: any[];
  weightSpeeds: DDBWeightSpeeds;
  sources: DDBSource[];
}

// ---- Background -----------------------------------------------------------

export interface DDBBackgroundDefinition {
  id: number;
  entityTypeId: number;
  definitionKey: string;
  name: string;
  description: string;
  shortDescription: string;
  snippet: string;
  slug: string;
  avatarUrl: string;
  largeAvatarUrl: string;
  desktopCardBackgroundAvatarUrl: string;
  mobileCardBackgroundAvatarUrl: string;
  cardDescription: string;
  moreDetailsUrl: string;
  featureName: string;
  featureDescription: string;
  featureIsFeat: boolean;
  isHomebrew: boolean;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  skillProficienciesDescription: string;
  toolProficienciesDescription: string;
  languagesDescription: string;
  equipmentDescription: string;
  contractsDescription: string;
  suggestedCharacteristicsDescription: string;
  suggestedProficiencies: any[];
  suggestedLanguages: any[];
  featList: any[];
  grantedFeats: any[];
  spellListIds: any[];
  spellsPreDescription: string;
  spellsPostDescription: string;
  organization: any | null;
  sources: DDBSource[];
}

export interface DDBCustomBackground {
  id: number;
  entityTypeId: number;
  name: string;
  description: string;
  backgroundType: number | null;
  featuresBackground: any | null;
  featuresBackgroundDefinitionId: number | null;
  characteristicsBackground: any | null;
  characteristicsBackgroundDefinitionId: number | null;
}

export interface DDBBackground {
  hasCustomBackground: boolean;
  definitionId: number;
  definition: DDBBackgroundDefinition | null;
  customBackground: DDBCustomBackground;
}

// ---- Feats ----------------------------------------------------------------

export interface DDBFeat {
  componentTypeId: number;
  componentId: number;
  definitionId: number;
  definition: any;
}

// ---- Spells (source-categorized) ------------------------------------------

export interface DDBSpellEntry {
  overrideSaveDc: number | null;
  limitedUse: any | null;
  id: number | null;
  entityTypeId: number | null;
  definition: any | null;
  definitionId: number;
  prepared: boolean;
  countsAsKnownSpell: boolean | null;
  usesSpellSlot: boolean;
  castAtLevel: number | null;
  alwaysPrepared: boolean;
  restriction: string | null;
  spellCastingAbilityId: number | null;
  displayAsAttack: boolean | null;
  additionalDescription: string | null;
  castOnlyAsRitual: boolean;
  ritualCastingType: number | null;
  range: any | null;
  activation: any | null;
  baseLevelAtWill: boolean;
  atWillLimitedUseLevel: number | null;
  isSignatureSpell: boolean | null;
  componentId: number;
  componentTypeId: number;
  spellListId: number | null;
}

export interface DDBSpells extends DDBSourceCategorized<DDBSpellEntry[]> {}

// ---- Class spells ---------------------------------------------------------

export interface DDBClassSpell {
  entityTypeId: number;
  characterClassId: number;
  spells: any[];
}

// ---- Options (source-categorized) -----------------------------------------

export interface DDBOptions extends DDBSourceCategorized<any[]> {}

// ---- Choices --------------------------------------------------------------

export interface DDBChoiceOption {
  id: number;
  label: string;
  description: string;
  sourceId: number;
}

export interface DDBChoiceDefinition {
  id: string;
  options: DDBChoiceOption[];
}

export interface DDBChoices extends DDBSourceCategorized<any[]> {
  choiceDefinitions: DDBChoiceDefinition[];
  definitionKeyNameMap: Record<string, string>;
}

// ---- Campaign -------------------------------------------------------------

export interface DDBCampaign {
  id: number;
  name: string;
  description: string;
  link: string;
  publicNotes: string;
  dmUserId: number;
  dmUsername: string;
  characters: any[];
}

// ---- Character (main) -----------------------------------------------------

export interface DDBCharacterData {
  // Identity
  id: number;
  userId: number;
  username: string;
  name: string;
  socialName: string | null;
  gender: string | null;
  faith: string | null;
  age: string | null;
  hair: string | null;
  eyes: string | null;
  skin: string | null;
  height: string | null;
  weight: string | null;
  alignmentId: number | null;
  lifestyleId: number | null;
  lifestyle: any | null;
  dateModified: string;
  providedFrom: string;
  canEdit: boolean;
  status: number;
  statusSlug: string;
  readonlyUrl: string | null;
  isAssignedToPlayer: boolean;

  // Hit points
  inspiration: boolean;
  baseHitPoints: number;
  bonusHitPoints: number | null;
  overrideHitPoints: number | null;
  removedHitPoints: number;
  temporaryHitPoints: number;

  // Experience
  currentXp: number;
  adjustmentXp: number | null;

  // Ability scores
  stats: DDBAbilityStat[];
  bonusStats: DDBAbilityStat[];
  overrideStats: DDBAbilityStat[];

  // Race & background
  race: DDBRace;
  raceDefinitionId: number | null;
  raceDefinitionTypeId: number | null;
  background: DDBBackground;

  // Personal info
  notes: DDBNotes;
  traits: DDBTraits;
  preferences: DDBPreferences;
  configuration: DDBConfiguration;

  // Inventory
  inventory: any[];
  customItems: any[];
  currencies: DDBCurrencies;

  // Classes & features
  classes: DDBClass[];
  classSpells: DDBClassSpell[];
  updateClassSpells: any[];
  feats: DDBFeat[];
  features: any[];
  optionalClassFeatures: any[];
  optionalOrigins: any[];

  // Custom adjustments
  customDefenseAdjustments: any[];
  customSenses: any[];
  customSpeeds: any[];
  customProficiencies: any[];
  customActions: any[];

  // Character values & conditions
  characterValues: any[];
  conditions: any[];

  // Death saves
  deathSaves: DDBDeathSaves;

  // Spells & spell slots
  spellSlots: DDBSpellSlot[];
  pactMagic: DDBSpellSlot[];
  spells: DDBSpells;
  activeSourceCategories: any[];

  // Choices & options
  choices: DDBChoices;
  options: DDBOptions;

  // Actions & modifiers
  actions: DDBActions;
  modifiers: DDBModifiers;

  // Companions & campaign
  creatures: any[];
  campaign: DDBCampaign | null;
  campaignSetting: any | null;

  // Decorations (character-level, distinct from top-level decorations)
  decorations: DDBDecorations;
}
