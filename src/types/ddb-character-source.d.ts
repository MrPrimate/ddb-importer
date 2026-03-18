// ---------------------------------------------------------------------------
// DDB Character Source Interfaces
// Models the JSON returned by the DDB proxy API for a character.
// Leaf objects that are not yet fully typed use `any`.
// ---------------------------------------------------------------------------

export {};

global {


  // ---- Top-level response ---------------------------------------------------

  export interface IDDBCharacterResponse {
    success: boolean;
    ddb: IDDBData;
  }

  export interface IDDBData {
    name: string;
    character: IDDBCharacterData;
    unfilteredModifiers: IDDBModifiers;
    decorations: IDDBDecorations;
    backgroundEquipment: IDDBEquipmentSlots;
    startingEquipment: IDDBEquipmentSlots;
    infusions: IDDBInfusions;
    classOptions: any[];
    originOptions: any[];
  }

  // ---- Decorations (top-level) ----------------------------------------------

  export interface IDDBDefaultBackdrop {
    backdropAvatarUrl: string;
    largeBackdropAvatarUrl: string;
    smallBackdropAvatarUrl: string;
    thumbnailBackdropAvatarUrl: string;
  }

  export interface IDDBDecorations {
    avatarId: number;
    avatarUrl: string;
    backdropAvatarDecorationKey: string | null;
    backdropAvatarId: number | null;
    backdropAvatarUrl: string | null;
    defaultBackdrop: IDDBDefaultBackdrop;
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

  export interface IDDBEquipmentSlots {
    slots: any[];
  }

  export interface IDDBInfusionKnown {
    id: number;
    characterId: number;
    definitionKey: string;
    itemId: string | null;
    itemName: string | null;
    itemTypeId: string;
    choiceKey: string;
    legacyItemTypeId: number;
  }

  export interface IDDBInfusionItem {
    definitionKey: string;
    characterId: number;
    inventoryMappingId: number;
    creatureMappingId: number | null;
    modifierGroupId: string | null;
    choiceKey: string;
    itemTypeId: number;
    itemId: number;
    monsterId: number | null;
  }

  export interface IDDBInfusionItemRuleEntry {
    type: string;
    entityTypeId: number;
    entityId: number;
    definitionKey: string | null;
    value: string | null;
    costMinimum: number | null;
  }

  export interface IDDBInfusionItemRule {
    name: string;
    rules: IDDBInfusionItemRuleEntry[];
  }

  export interface IDDBInfusionItemRuleData {
    text: string;
    itemRules: IDDBInfusionItemRule[];
  }

  export interface IDDBInfusionModifier extends Omit<IDDBBaseModifier, "restriction"> {
    dice: IDDBDamageDice | null;
    restriction: string | null;
    tagConstraints: any[];
  }

  export interface IDDBInfusionModifierData {
    id: string;
    name: string;
    value: number;
    modifiers: IDDBInfusionModifier[];
  }

  export interface IDDBInfusionCreatureData {
    monsterId: number;
    creatureGroupId: number;
    flags: string[];
  }

  export interface IDDBInfusionEntitlementGranter {
    entityType: string;
    entityID: string;
  }

  export interface IDDBInfusionDefinition {
    id: string;
    definitionKey: string;
    name: string;
    sources: IDDBSource[];
    sourceIds: number[];
    description: string;
    snippet: string;
    type: string;
    itemRuleData: IDDBInfusionItemRuleData | null;
    modifierDataType: string | null;
    modifierData: IDDBInfusionModifierData[];
    actions: any[];
    level: number;
    creatureData: IDDBInfusionCreatureData[];
    requiresAttunement: boolean;
    allowDuplicates: boolean;
    entitlementGranters: IDDBInfusionEntitlementGranter[];
    isHomebrew: boolean;
    featureFlagKey: string | null;
  }

  export interface IDDBInfusionData {
    definitionData: IDDBInfusionDefinition[];
    accessTypes: Record<string, number>;
  }

  export interface IDDBInfusions {
    known: IDDBInfusionKnown[];
    item: IDDBInfusionItem[];
    infusions: IDDBInfusionData;
  }

  // ---- Ability scores -------------------------------------------------------

  export interface IDDBAbilityStat {
    id: number;
    name: string | null;
    value: number | null;
  }

  // ---- Death saves ----------------------------------------------------------

  export interface IDDBDeathSaves {
    failCount: number;
    successCount: number;
    isStabilized: boolean;
  }

  // ---- Currencies -----------------------------------------------------------

  export interface IDDBCurrencies {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  }

  // ---- Spell slots ----------------------------------------------------------

  export interface IDDBSpellSlot {
    level: number;
    used: number;
    available: number;
  }

  // ---- Notes & Traits -------------------------------------------------------

  export interface IDDBNotes {
    allies: string;
    personalPossessions: string;
    otherHoldings: string;
    organizations: string;
    enemies: string;
    backstory: string;
    otherNotes: string;
  }

  export interface IDDBTraits {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    appearance: string;
  }

  // ---- Preferences & Configuration ------------------------------------------

  export interface IDDBPreferences {
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

  export interface IDDBConfiguration {
    startingEquipmentType: number;
    abilityScoreType: number;
    showHelpText: boolean;
  }

  // ---- Source-categorized pattern -------------------------------------------

  export interface IDDBSourceCategorized<T> {
    race: T;
    class: T;
    background: T;
    item: T;
    feat: T;
  }

  // ---- Actions --------------------------------------------------------------

  export interface IDDBActionActivation {
    activationTime: number;
    activationType: number;
  }

  export interface IDDBActionRange {
    range: number | null;
    longRange: number | null;
    aoeType: number | null;
    aoeSize: number | null;
    hasAoeSpecialDescription: boolean;
    minimumRange: number | null;
  }

  export interface IDDBActionLimitedUse {
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

  export interface IDDBAction extends IDDBCommonDefinition {
    entityTypeId: number;
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
    activation: IDDBActionActivation;
    range: IDDBActionRange;
    limitedUse: IDDBActionLimitedUse | null;
  }

  export interface IDDBActions {
    race: IDDBAction[];
    class: IDDBAction[];
    feat: IDDBAction[];
  }

  // ---- Classes --------------------------------------------------------------

  export interface IDDBWealthDice {
    diceCount: number;
    diceValue: number;
    diceMultiplier: number;
    fixedValue: number | null;
    diceString: string;
  }

  export interface IDDBClassDefinitionFeature {
    id: number;
    name: string;
    description: string;
    requiredLevel: number;
    displayOrder: number;
    moreDetailsUrl: string;
    prerequisite: string | null;
    summary: string | null;
    featuresSectionType: number | null;
  }

  export interface IDDBClassDefinition extends IDDBSourcesDefinition {
    id: number;
    definitionKey: string;
    name: string;
    description: string;
    slug: string;
    equipmentDescription: string | null;
    parentClassId: number | null;
    avatarUrl: string | null;
    largeAvatarUrl: string | null;
    portraitAvatarUrl: string | null;
    moreDetailsUrl: string;
    spellCastingAbilityId: number | null;
    classFeatures: IDDBClassDefinitionFeature[];
    hitDice: number;
    wealthDice: IDDBWealthDice | null;
    canCastSpells: boolean;
    knowsAllSpells: boolean | null;
    spellPrepareType: number | null;
    spellCastingLearningStyle: number | null;
    spellContainerName: string | null;
    subclassDefinition: IDDBClassDefinition | null;
    primaryAbilities: number[] | null;
    // Card / UI fields
    cardDescription: string | null;
    cardEyebrow: string | null;
    cardHeading: string | null;
    tagline: string | null;
    subclassTagline: string | null;
    subclassFlavorText: string | null;
    classFantasy: string | null;
    color: IDDBClassColor | null;
    complexity: number | null;
    highlights: string | null;
    iconicGear: string | null;
    // Image URLs
    iconAvatarUrl: string | null;
    iconicGearAvatarUrl: string | null;
    desktopCardBackgroundAvatarUrl: string | null;
    desktopCardBannerAvatarUrl: string | null;
    desktopCardForegroundAvatarUrl: string | null;
    mobileCardBackgroundAvatarUrl: string | null;
    mobileCardBannerAvatarUrl: string | null;
    mobileCardForegroundAvatarUrl: string | null;
    detailsBackgroundAvatarUrl: string | null;
    detailsForegroundAvatarUrl: string | null;
    // Spell rules
    spellRules: IDDBSpellRules | null;
    prerequisites: IDDBFeatPrerequisite[] | null;
  }

  export interface IDDBClassFeatureLimitedUse {
    level: number | null;
    uses: number;
  }

  export interface IDDBClassFeatureLevelScale {
    id: number;
    level: number;
    description: string;
    dice: IDDBDamageDice | null;
    die?: IDDBDamageDice | null;
    fixedValue: number | null;
  }

  export interface IDDBClassFeatureGrantedFeat {
    id: number;
    name: string;
    featIds: number[];
  }

  export interface IDDBClassFeatureDefinition extends IDDBCommonDefinition, IDDBSourcesDefinition {
    definitionKey: string;
    entityID: string;
    entityType: string;
    entityTypeId: number;
    snippet: string;
    classId: number;
    requiredLevel: number;
    displayOrder: number;
    featureType: number;
    isSubClassFeature: boolean;
    hideInBuilder: boolean;
    hideInSheet: boolean;
    hasItemMappings: boolean;
    multiClassDescription: string;
    activation: any | null;
    grantedFeats: IDDBClassFeatureGrantedFeat[];
    affectedFeatureDefinitionKeys: string[];
    levelScales: IDDBClassFeatureLevelScale[];
    limitedUse: IDDBClassFeatureLimitedUse[];
    infusionRules: any[];
    creatureRules: any[];
    spellListIds: number[];
  }

  export interface IDDBClassFeature {
    definition: IDDBClassFeatureDefinition;
    levelScale: IDDBClassFeatureLevelScale | null;
  }

  export interface IDDBClass {
    id: number;
    entityTypeId: number;
    level: number;
    isStartingClass: boolean;
    hitDiceUsed: number;
    definitionId: number;
    subclassDefinitionId: number | null;
    definition: IDDBClassDefinition;
    subclassDefinition: IDDBClassDefinition | null;
    classFeatures: IDDBClassFeature[];
  }

  // ---- Race -----------------------------------------------------------------

  export interface IDDBWeightSpeedSet {
    walk: number;
    fly: number;
    burrow: number;
    swim: number;
    climb: number;
  }

  export interface IDDBWeightSpeeds {
    normal: IDDBWeightSpeedSet;
    encumbered: IDDBWeightSpeedSet | null;
    heavilyEncumbered: IDDBWeightSpeedSet | null;
    override: IDDBWeightSpeedSet | null;
    pushDragLift: IDDBWeightSpeedSet | null;
  }

  export interface IDDBEntityCategory {
    id: number;
    entityTypeId: number;
    entityId: number;
    definitionKey: string;
    entityTagId: number;
    tagName: string;
  }

  export interface IDDBRacialTraitDisplayConfiguration {
    RACIALTRAIT: number;
    ABILITYSCORE: number;
    LANGUAGE: number;
    CLASSFEATURE: number;
  }

  export interface IDDBRacialTraitDefinition extends IDDBCommonDefinition, IDDBSourcesDefinition {
    definitionKey: string;
    entityTypeId: number;
    displayOrder: number | null;
    hideInBuilder: boolean;
    hideInSheet: boolean;
    activation: unknown;
    creatureRules: unknown[];
    spellListIds: number[];
    featureType: number;
    affectedFeatureDefinitionKeys: string[];
    isCalledOut: boolean;
    entityType: string;
    entityID: string;
    entityRaceId: number;
    entityRaceTypeId: number;
    displayConfiguration: IDDBRacialTraitDisplayConfiguration;
    requiredLevel: number | null;
    categories: IDDBEntityCategory[];
  }

  export interface IDDBRacialTrait {
    definition: IDDBRacialTraitDefinition;
  }

  export interface IDDBRace {
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
    groupIds: number[];
    featIds: number[];
    racialTraits: IDDBRacialTrait[];
    weightSpeeds: IDDBWeightSpeeds;
    sources: IDDBSource[];
  }

  // ---- Background -----------------------------------------------------------

  export interface IDDBBackgroundDefinition extends IDDBCommonDefinition {
    entityTypeId: number;
    definitionKey: string;
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
    sources: IDDBSource[];
  }

  export interface IDDBCustomBackground {
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

  export interface IDDBBackground {
    hasCustomBackground: boolean;
    definitionId: number;
    definition: IDDBBackgroundDefinition | null;
    customBackground: IDDBCustomBackground;
  }

  // ---- Feats ----------------------------------------------------------------

  export interface IDDBFeatActivation {
    activationTime: number | null;
    activationType: number | null;
  }

  export interface IDDBFeatPrerequisiteMapping {
    id: number;
    entityId: number | null;
    entityTypeId: number | null;
    type: string;
    subType: string;
    value: number | null;
    friendlyTypeName: string;
    friendlySubTypeName: string;
    shouldExclude: boolean;
  }

  export interface IDDBFeatPrerequisite {
    description: string;
    prerequisiteMappings: IDDBFeatPrerequisiteMapping[];
    hidePrerequisite: boolean;
  }

  export interface IDDBFeatDefinition extends IDDBCommonDefinition, IDDBSourcesDefinition {
    entityTypeId: number;
    definitionKey: string;
    snippet: string;
    activation: IDDBFeatActivation;
    creatureRules: unknown[];
    prerequisites: IDDBFeatPrerequisite[];
    spellListIds: number[];
    isRepeatable: boolean;
    repeatableParentId: number | null;
    categories: IDDBEntityCategory[];
  }

  export interface IDDBFeat {
    componentTypeId: number | null;
    componentId: number | null;
    definitionId: number;
    definition: IDDBFeatDefinition;
  }

  // ---- Class spells ---------------------------------------------------------

  export interface IDDBClassSpell {
    entityTypeId: number;
    characterClassId: number;
    spells: IDDBSpellEntry[];
    alwaysPreparedSpells: IDDBSpellEntry[];
    alwaysKnownSpells: IDDBSpellEntry[];
    cantrips: IDDBSpellEntry[];
  }

  // ---- Options (source-categorized) -----------------------------------------

  export interface IDDBOptionDefinition extends IDDBCommonDefinition, IDDBSourceIdAndPageDefinition {
    entityTypeId: number;
    activation: any | null;
    creatureRules: any[];
    spellListIds: any[];
  }

  export interface IDDBOptionEntry {
    componentId: number;
    componentTypeId: number;
    definition: IDDBOptionDefinition;
  }

  type IDDBOptions = IDDBSourceCategorized<IDDBOptionEntry[] | null>;

  // ---- Choices --------------------------------------------------------------

  export interface IDDBChoiceDefinitionOption {
    id: number;
    label: string;
    description: string | null;
    sourceId: number | null;
  }

  export interface IDDBChoiceDefinition {
    id: string;
    options: IDDBChoiceDefinitionOption[];
  }

  export interface IDDBChoiceEntry {
    id: string;
    componentId: number;
    componentTypeId: number;
    type: number;
    subType: number | null;
    optionValue: number;
    optionIds: number[];
    options: any[];
    label: string | null;
    isOptional: boolean;
    isInfinite: boolean;
    displayOrder: number | null;
    parentChoiceId: string | null;
    defaultSubtypes: string[];
    tagConstraints: any[];
    itemDefinitionKey: string | null;
  }

  export interface IDDBChoices extends IDDBSourceCategorized<IDDBChoiceEntry[] | null> {
    choiceDefinitions: IDDBChoiceDefinition[];
    definitionKeyNameMap: Record<string, string>;
  }

  /**
   * Represents a single choice result returned by DDBDataUtils.getChoices.
   * Merges properties from IDDBChoiceDefinitionOption with routing metadata
   * added during choice resolution.
   */
  export interface IDDBChoiceResult extends IDDBChoiceDefinitionOption {
    componentId: number;
    componentTypeId: number;
    choiceId: string | null;
    parentChoiceId: string | null;
    subType: number | string | null;
    type: string;
    wasOption: boolean;
    optionId: number;
    optionComponentId: number;
    /** Only present when the result originated from an options-match lookup. */
    entityTypeId?: number;
  }

  // ---- Campaign -------------------------------------------------------------

  export interface IDDBCampaign {
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

  export interface IDDBCharacterData {
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
    stats: IDDBAbilityStat[];
    bonusStats: IDDBAbilityStat[];
    overrideStats: IDDBAbilityStat[];

    // Race & background
    race: IDDBRace;
    raceDefinitionId: number | null;
    raceDefinitionTypeId: number | null;
    background: IDDBBackground;

    // Personal info
    notes: IDDBNotes;
    traits: IDDBTraits;
    preferences: IDDBPreferences;
    configuration: IDDBConfiguration;

    // Inventory
    inventory: IDDBInventoryItem[];
    customItems: any[];
    currencies: IDDBCurrencies;

    // Classes & features
    classes: IDDBClass[];
    classSpells: IDDBClassSpell[];
    updateClassSpells: any[];
    feats: IDDBFeat[];
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
    deathSaves: IDDBDeathSaves;

    // Spells & spell slots
    spellSlots: IDDBSpellSlot[];
    pactMagic: IDDBSpellSlot[];
    spells: IDDBSpells;
    activeSourceCategories: any[];

    // Choices & options
    choices: IDDBChoices;
    options: IDDBOptions;

    // Actions & modifiers
    actions: IDDBActions;
    modifiers: IDDBModifiers;

    // Companions & campaign
    creatures: any[];
    campaign: IDDBCampaign | null;
    campaignSetting: any | null;

    // Decorations (character-level, distinct from top-level decorations)
    decorations: IDDBDecorations;
  }

  export interface IDDBClassColor {
    id: number;
    entityId: number;
    entityTypeId: number;
    name: string;
    accent: string;
    theme: string;
  }

  export interface IDDBSpellRules {
    isRitualSpellCaster: boolean;
    levelCantripsKnownMaxes: number[];
    levelPreparedSpellMaxes: number[];
    levelSpellKnownMaxes: number[];
    levelSpellSlots: number[][];
    multiClassSpellSlotDivisor: number;
    multiClassSpellSlotRounding: number;
  }

  // ---- Mule: subClassData entry ---------------------------------------------

  export interface IDDBMuleSubClassAddData {
    characterId: number;
    classId: number;
    classMappingId: number;
    classFeatureId: number;
    choiceKey: string;
    choiceValue: number;
    type: number;
  }

  /** Partial character data returned for a subclass selection. */
  export interface IDDBMuleSubClassMergeData {
    actions: IDDBActions;
    choices: IDDBChoices;
    classSpells: IDDBClassSpell[];
    classes: IDDBClass[];
    feats: IDDBFeat[];
    modifiers: IDDBModifier[];
    options: IDDBOptions;
    spells: IDDBSpells;
    updateClassSpells: any[];
  }

  export interface IDDBMuleSubClassDebug {
    classId: number;
    className: string;
    subClassId: number;
    subclassName: string;
  }

  export interface IDDBMuleSubClassDataEntry {
    addData: IDDBMuleSubClassAddData;
    data: IDDBMuleSubClassMergeData;
    debug: IDDBMuleSubClassDebug;
  }

  // ---- Mule: subClassChoicesData entry --------------------------------------

  export interface IDDBMuleChoiceAddData {
    characterId: number;
    classId: number;
    classMappingId: number;
    classFeatureId: number;
    choiceKey: string;
    choiceValue: number;
    type: number;
    parentChoiceId: number | null;
    debug: Record<string, any>;
  }

  export interface IDDBMuleChoiceDebug {
    allOptions: unknown[];
    campaignId: number;
    classId: number;
    className: string;
    subClassId: number;
    subclassName: string;
    type: string;
  }

  export interface IDDBMuleOptionLoadData {
    actions: Record<string, any[]>;
    choices: Record<string, any>;
    modifiers: Record<string, any[]>;
    options: Record<string, any[]>;
    spells: Record<string, any[]>;
  }

  export interface IDDBMuleSubClassChoicesDataEntry {
    characterId: number;
    addData: IDDBMuleChoiceAddData[];
    choiceFailures: unknown[];
    data: IDDBCharacterData;
    debug: IDDBMuleChoiceDebug;
    optionLoadData: IDDBMuleOptionLoadData | null;
    infusions?: IDDBInfusions;
  }

  // ---- Mule: top-level source -----------------------------------------------

  /** Shape of `this.source` in DDBMuleHandler for `type === "class"`. */
  export interface IDDBMuleClassSource {
    baseCharacter: IDDBCharacterData;
    class: IDDBClassDefinition;
    subClasses: Record<string, IDDBClassDefinition[]>;
    options: IDDBClassFeatureDefinition[];
    subClassData: Record<string, IDDBMuleSubClassDataEntry>;
    subClassChoicesData: IDDBMuleSubClassChoicesDataEntry[];
    infusions?: IDDBInfusions;
  }
}
