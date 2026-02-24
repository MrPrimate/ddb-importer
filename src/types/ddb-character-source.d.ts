// ---------------------------------------------------------------------------
// DDB Character Source Interfaces
// Models the JSON returned by the DDB proxy API for a character.
// Leaf objects that are not yet fully typed use `any`.
// ---------------------------------------------------------------------------

export {}

global {
  // ---- Top-level response ---------------------------------------------------

  export interface IDDBCharacterResponse {
    success: boolean;
    ddb: IDDBData;
  }

  export interface IDDBData {
    name: string;
    character: IDDBCharacterData;
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

  export interface IDDBInfusions {
    known: any[];
    items: any[];
    infusions: any[];
  }

  // ---- Inventory ------------------------------------------------------------

  export interface IDDBDamageDice {
    diceCount: number;
    diceValue: number;
    diceMultiplier: number | null;
    fixedValue: number | null;
    diceString: string;
  }

  export interface IDDBItemProperty {
    id: number;
    name: string;
    description: string;
    notes: string | null;
  }

  export interface IDDBWeaponBehavior {
    baseItemId: number;
    baseTypeId: number;
    type: string;
    attackType: number;
    categoryId: number;
    properties: IDDBItemProperty[];
    damage: IDDBDamageDice;
    damageType: string;
    range: number;
    longRange: number;
    isMonkWeapon: boolean;
  }

  export interface IDDBItemDefinition {
    id: number;
    entityTypeId: number;
    definitionKey: string;
    name: string;
    description: string;
    snippet: string;
    type: string;
    filterType: string;
    subType: string | null;
    rarity: string;
    magic: boolean;
    isHomebrew: boolean;
    isLegacy: boolean;
    isCustomItem: boolean;
    isConsumable: boolean;
    isContainer: boolean;
    isPack: boolean;
    isMonkWeapon: boolean;
    stackable: boolean;
    bundleSize: number;
    canAttune: boolean;
    attunementDescription: string;
    canEquip: boolean;
    canBeAddedToInventory: boolean;
    // Armor
    armorClass: number | null;
    armorTypeId: number | null;
    baseArmorName: string | null;
    stealthCheck: number | null;
    strengthRequirement: number | null;
    // Weapon / damage
    damage: IDDBDamageDice | null;
    damageType: string | null;
    attackType: number | null;
    range: number | null;
    longRange: number | null;
    fixedDamage: number | null;
    properties: IDDBItemProperty[] | null;
    weaponBehaviors: IDDBWeaponBehavior[];
    // Weight / cost
    weight: number;
    weightMultiplier: number;
    cost: number | null;
    // Container
    capacity: string;
    capacityWeight: number;
    // Category / grouping
    categoryId: number | null;
    gearTypeId: number | null;
    baseItemId: number | null;
    baseTypeId: number;
    groupedId: number | null;
    // Images
    avatarUrl: string | null;
    largeAvatarUrl: string | null;
    // Modifiers & sources
    grantedModifiers: IDDBModifier[];
    sources: IDDBSource[];
    tags: string[];
    // Infusion
    levelInfusionGranted: number | null;
    version: string | null;
    sourceId: number | null;
    sourcePageNumber: number | null;
  }

  export interface IDDBInventoryLimitedUse {
    maxUses: number;
    numberUsed: number;
    resetType: string;
    resetTypeDescription: string;
  }

  export interface IDDBInventoryItem {
    id: number;
    entityTypeId: number;
    definitionId: number;
    definitionTypeId: number;
    definition: IDDBItemDefinition;
    quantity: number;
    equipped: boolean;
    isAttuned: boolean;
    chargesUsed: number;
    limitedUse: IDDBInventoryLimitedUse | null;
    displayAsAttack: boolean | null;
    currency: IDDBCurrencies | null;
    containerEntityId: number;
    containerEntityTypeId: number;
    containerDefinitionKey: string;
    equippedEntityId: number;
    equippedEntityTypeId: number;
    originDefinitionKey: string | null;
    originEntityId: number | null;
    originEntityTypeId: number | null;
  }

  // ---- Source info (shared by classes, races, backgrounds) -------------------

  export interface IDDBSource {
    sourceId: number;
    pageNumber: number | null;
    sourceType: number;
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

  // ---- Modifiers ------------------------------------------------------------

  export interface IDDBModifier {
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

  export interface IDDBModifiers extends IDDBSourceCategorized<IDDBModifier[]> {
    condition: IDDBModifier[];
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

  export interface IDDBAction {
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
    prerequisite: any | null;
    summary: string | null;
    featuresSectionType: number | null;
  }

  export interface IDDBClassDefinition {
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
    sources: IDDBSource[];
    classFeatures: IDDBClassDefinitionFeature[];
    hitDice: number;
    wealthDice: IDDBWealthDice | null;
    canCastSpells: boolean;
    knowsAllSpells: boolean;
    spellPrepareType: number | null;
    spellCastingLearningStyle: number | null;
    spellContainerName: string | null;
    sourcePageNumber: number;
    subclassDefinition: IDDBClassDefinition | null;
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

  export interface IDDBClassFeatureDefinition {
    id: number;
    definitionKey: string;
    entityID: string;
    entityType: string;
    entityTypeId: number;
    name: string;
    description: string;
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
    sourceId: number | null;
    sourcePageNumber: number | null;
    sources: IDDBSource[];
    grantedFeats: IDDBClassFeatureGrantedFeat[];
    affectedFeatureDefinitionKeys: string[];
    levelScales: IDDBClassFeatureLevelScale[];
    limitedUse: IDDBClassFeatureLimitedUse[];
    infusionRules: any[];
    creatureRules: any[];
    spellListIds: any[];
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

  export interface IDDBRacialTraitDefinition {
    id: number;
    definitionKey: string;
    entityTypeId: number;
    displayOrder: number | null;
    name: string;
    description: string;
    snippet: string | null;
    hideInBuilder: boolean;
    hideInSheet: boolean;
    activation: unknown;
    sourceId: number;
    sourcePageNumber: number | null;
    creatureRules: unknown[];
    spellListIds: number[];
    featureType: number;
    sources: IDDBSource[];
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

  export interface IDDBBackgroundDefinition {
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

  export interface IDDBFeatDefinition {
    id: number;
    entityTypeId: number;
    definitionKey: string;
    name: string;
    description: string;
    snippet: string;
    activation: IDDBFeatActivation;
    sourceId: number | null;
    sourcePageNumber: number | null;
    creatureRules: unknown[];
    prerequisites: IDDBFeatPrerequisite[];
    isHomebrew: boolean;
    sources: IDDBSource[];
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

  // ---- Spells (source-categorized) ------------------------------------------

  export interface IDDBSpellActivation {
    activationTime: number;
    activationType: number;
  }

  export interface IDDBSpellRange {
    origin: string;
    rangeValue: number | null;
    aoeType: number | null;
    aoeValue: number | null;
  }

  export interface IDDBSpellDuration {
    durationInterval: number | null;
    durationUnit: string | null;
    durationType: string;
  }

  export interface IDDBSpellCondition {
    type: number;
    conditionId: number;
    conditionDuration: number;
    durationUnit: string;
    exception: string;
  }

  export interface IDDBHigherLevelDefinition {
    level: number | null;
    typeId: number;
    dice: IDDBDamageDice | null;
    value: number | null;
    details: string;
  }

  export interface IDDBAtHigherLevels {
    higherLevelDefinitions: IDDBHigherLevelDefinition[];
    additionalAttacks: any[];
    additionalTargets: any[];
    areaOfEffect: any[];
    duration: any[];
    creatures: any[];
    special: any[];
    points: any[];
    range: any[];
  }

  export interface IDDBSpellModifier {
    id: string;
    entityId: number | null;
    entityTypeId: number | null;
    type: string;
    subType: string;
    dice: IDDBDamageDice | null;
    die: IDDBDamageDice | null;
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
    availableToMulticlass: boolean | null;
    modifierTypeId: number;
    modifierSubTypeId: number;
    componentId: number;
    componentTypeId: number;
    count: number;
    durationUnit: string | null;
    usePrimaryStat: boolean;
    atHigherLevels: IDDBAtHigherLevels;
  }

  export interface IDDBSpellDefinition {
    id: number;
    definitionKey: string;
    name: string;
    description: string;
    snippet: string;
    level: number;
    school: string;
    ritual: boolean;
    concentration: boolean;
    isHomebrew: boolean;
    isLegacy: boolean;
    // Casting
    activation: IDDBSpellActivation;
    castingTimeDescription: string;
    duration: IDDBSpellDuration;
    range: IDDBSpellRange;
    rangeArea: any | null;
    asPartOfWeaponAttack: boolean;
    canCastAtHigherLevel: boolean;
    // Attack / save
    attackType: number | null;
    requiresAttackRoll: boolean;
    requiresSavingThrow: boolean;
    saveDcAbilityId: number | null;
    // Components
    components: number[];
    componentsDescription: string;
    // Damage / healing
    damageEffect: any | null;
    healing: any | null;
    healingDice: any[];
    tempHpDice: any[];
    // Scaling
    scaleType: string | null;
    atHigherLevels: IDDBAtHigherLevels;
    // Modifiers & conditions
    modifiers: IDDBSpellModifier[];
    conditions: IDDBSpellCondition[];
    // Tags & sources
    tags: string[];
    sources: IDDBSource[];
    spellGroups: any[];
    // Misc
    sourceId: number | null;
    sourcePageNumber: number | null;
    version: string | null;
  }

  export interface IDDBSpellLimitedUse {
    name: string | null;
    statModifierUsesId: number | null;
    resetType: number;
    numberUsed: number;
    minNumberConsumed: number | null;
    maxNumberConsumed: number;
    maxUses: number;
    operator: number;
    useProficiencyBonus: boolean;
    proficiencyBonusOperator: number;
    resetDice: any | null;
  }

  export interface IDDBSpellEntry {
    overrideSaveDc: number | null;
    limitedUse: IDDBSpellLimitedUse | null;
    id: number | null;
    entityTypeId: number | null;
    definition: IDDBSpellDefinition;
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
    range: IDDBSpellRange;
    activation: IDDBSpellActivation;
    baseLevelAtWill: boolean;
    atWillLimitedUseLevel: number | null;
    isSignatureSpell: boolean | null;
    componentId: number;
    componentTypeId: number;
    spellListId: number | null;
  }

  type IDDBSpells = IDDBSourceCategorized<IDDBSpellEntry[] | null>;

  // ---- Class spells ---------------------------------------------------------

  export interface IDDBClassSpell {
    entityTypeId: number;
    characterClassId: number;
    spells: IDDBSpellEntry[];
  }

  // ---- Options (source-categorized) -----------------------------------------

  export interface IDDBOptionDefinition {
    id: number;
    entityTypeId: number;
    name: string;
    description: string;
    snippet: string;
    activation: any | null;
    sourceId: number | null;
    sourcePageNumber: number | null;
    creatureRules: any[];
    spellListIds: any[];
  }

  export interface IDDBOptionEntry {
    componentId: number;
    componentTypeId: number;
    definition: IDDBOptionDefinition;
  }

  type DDBOptions = IDDBSourceCategorized<IDDBOptionEntry[] | null>;

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
    options: DDBOptions;

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
}
