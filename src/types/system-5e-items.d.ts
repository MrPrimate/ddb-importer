// ---------------------------------------------------------------------------
// Foundry VTT dnd5e system – Actor document interfaces
// ---------------------------------------------------------------------------


export {};

global {

  type TFeatureType = "background" | "class" | "feat" | "race" | "supernaturalGift" | "vehicle" | "enchantment";

  type TFeatureClassSubtype = "arcaneShot" | "artificerInfusion" | "channelDivinity" | "constellation" | "defensiveTactic" | "eldritchInvocation" | "elementalDiscipline" | "fightingStyle" | "huntersPrey" | "ki" | "maneuver" | "metamagic" | "multiattack" | "pact" | "psionicPower" | "rune" | "superiorHuntersDefense";

  type TFeatureEnchantmentSubtype = "artificerInfusion" | "rune";

  type TFeatureFeatSubtype = "kindred" | "dragonmark" | "epicBoon" | "fightingStyle" | "general" | "origin" | "darkGift";

  type TFeatureSupernaturalGiftSubtype = "blessing" | "charm" | "epicBoon";

  type TArmorType = "light" | "medium" | "heavy" | "shield" | "natural";

  type TItemRarity = "" | "common" | "uncommon" | "rare" | "veryRare" | "legendary" | "artifact";

  type TWeaponMastery = "cleave" | "graze" | "nick" | "push" | "sap" | "slow" | "topple" | "vex";

  type TLootTypes = "art" | "gear" | "gem" | "junk" | "material" | "resource" | "trade" | "treasure" | "mistTalisman";

  type TWeightUnits = "lb" | "kg" | "tn" | "Mg";

  type TVolumeUnits = "cubicFoot" | "litre";

  // empty string = unset in dnd5e data
  type TTemplateUnits = "ft" | "mi" | "";

  type TEquipmentTypes = TArmorType | "clothing" | "ring" | "rod" | "trinket" | "vehicle" | "wand" | "wondrous";

  type TWeaponType = "simpleM"
    | "simpleR"
    | "martialM"
    | "martialR"
    | "natural"
    | "improv"
    | "siege"
    | "advancedM"
    | "advancedR";

  type baseWeapon = ""
     | "club"
     | "lightcrossbow"
     | "dagger"
     | "dart"
     | "greatclub"
     | "handaxe"
     | "javelin"
     | "lighthammer"
     | "mace"
     | "quarterstaff"
     | "shortbow"
     | "sickle"
     | "sling"
     | "spear"
     | "battleaxe"
     | "blowgun"
     | "handcrossbow"
     | "heavycrossbow"
     | "flail"
     | "glaive"
     | "greataxe"
     | "greatsword"
     | "halberd"
     | "lance"
     | "longbow"
     | "longsword"
     | "maul"
     | "morningstar"
     | "musket"
     | "net"
     | "pike"
     | "pistol"
     | "rapier"
     | "scimitar"
     | "shortsword"
     | "trident"
     | "warpick"
     | "warhammer"
     | "whip";

  type T5eInventoryTypes = "weapon" | "equipment" | "container" | "consumable" | "tool" | "loot";

  // ---- Item flag sub-types --------------------------------------------------

  interface I5eMonsterMunchItemFlags {
    titleHTML: string;
    fullName: string;
    actionCopy: boolean;
    type: TDDBMonsterActionType;
    // set after the stub is built; optionally stripped in flagCleanup
    actionData?: Record<string, any>;
    // transient: read by the enricher, deleted again in flagCleanup
    description?: string;
  }

  interface I5eMidiItemProperties {
    saveDamage?: string;
    otherSaveDamage?: string;
    autoFailFriendly?: boolean;
    confirmTargets?: string;
    magicdam?: boolean;
    magiceffect?: boolean;
  }

  interface I5eSystemLimitedUsesRecovery {
    // null is written for at-will style uses and accepted by the dnd5e schema
    period: TLimitedUsePeriod | null;
    type: string;
    formula?: string | undefined;
  }

  interface I5eSystemLimitedUses {
    spent?: number | null;
    max?: string | null;
    recovery?: I5eSystemLimitedUsesRecovery[];
    override?: boolean;
  }

  // ---- Item shared sub-types ------------------------------------------------

  interface I5eItemDescription {
    value: string;
    chat: string;
  }

  // Uses I5eSystemLimitedUsesRecovery from system-5e.d.ts (identical shape)
  // Uses I5eSystemLimitedUses from system-5e.d.ts (identical shape)

  interface I5eItemWeight {
    value: number;
    units: TWeightUnits;
  }

  // ---- Damage parts ---------------------------------------------------------

  interface I5eDamageBase {
    base?: I5eDamagePart;
    onSave?: string | null;
  }

  // -- Consumption Targets ----------------------------------------------------

  interface I5eConsumptionTargetScaling {
    allowed?: boolean;
    mode?: "" | "amount" | "level" | string;
    max?: string;
    formula?: string;
  }

  interface I5eConsumptionTarget {
    type: "itemUses" | "activityUses" | "spellSlots" | "attribute" | string;
    target?: string;
    value: string | number;
    scaling?: I5eConsumptionTargetScaling;
  }

  // ---- Weapon item ----------------------------------------------------------

  interface I5eWeaponRange {
    long?: number | null;
    reach?: number | null;
    value?: number | null;
    units: TDistanceUnit;
  }

  interface I5eWeaponDamageBase extends I5eDamageBase {
    versatile?: I5eDamagePart;
  }

  interface I5eWeaponSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: Record<string, I5eAdvancement>;
    ammunition?: Record<string, any>;
    armor?: Record<string, any>;
    attuned: boolean;
    attunement: string;
    container?: string | null;
    crew?: { value: any[] };
    damage: I5eWeaponDamageBase;
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    mastery?: TWeaponMastery | null;
    price: I5ePrice;
    proficient: boolean | null;
    properties: TWeaponProperties[];
    quantity: number;
    range: I5eWeaponRange;
    rarity: TItemRarity;
    requirements: string;
    container?: string;
    source: I5eSourceInfo;
    type: {
      value: TWeaponType;
      baseItem: baseWeapon;
    };
    unidentified: { description: string };
    uses: I5eSystemLimitedUses;
    weight: I5eItemWeight;
  }

  interface I5eWeaponItem extends I5eSystemBaseDocumentData {
    type: "weapon";
    system: I5eWeaponSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
      infusions?: { infused: boolean };
    };
  }

  // ---- Feat item ------------------------------------------------------------

  interface I5eFeatSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: Record<string, I5eAdvancement>;
    crewed?: boolean;
    description: I5eItemDescription;
    enchant?: Record<string, any>;
    identifier: string;
    prerequisites: { items?: any[]; repeatable?: boolean; level?: number };
    proficient?: boolean;
    properties: TFeatProperties[];
    requirements: string;
    source: I5eSourceInfo;
    type: {
      value: TFeatureType;
      subtype: TFeatureClassSubtype | TFeatureEnchantmentSubtype | TFeatureFeatSubtype | TFeatureSupernaturalGiftSubtype;
    };
    uses: I5eSystemLimitedUses;
  }

  interface I5eFeatItem extends I5eSystemBaseDocumentData {
    type: "feat";
    system: I5eFeatSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
      infusions?: { infused: boolean };
    };
  }

  // ---- Spell item -----------------------------------------------------------

  interface I5eSpellMaterials {
    value: string;
    consumed: boolean;
    cost: number;
    supply: number;
  }

  interface I5eSystemActivationData {
    type?: string;
    value?: number;
    condition?: string;
  }

  interface I5eSystemDurationData {
    concentration?: boolean;
    special?: string;
    units?: TDurationUnit;
    value?: string | null;
  }

  interface I5eSystemTargetData {
    prompt?: boolean;
    template?: {
      stationary?: boolean;
      count?: string;
      contiguous?: boolean;
      type?: TTemplate;
      size?: string;
      width?: string;
      height?: string;
      units?: TTemplateUnits;
    };
    affects?: {
      count?: string;
      type?: TTarget;
      choice?: boolean;
      special?: string;
    };
  }

  interface I5eSystemBaseRangeData {
    value?: string | number | null;
    units?: TDistanceUnit;
    special?: string;
  }


  interface I5eSpellSystemData {
    activation: I5eSystemActivationData;
    activities: Record<string, I5eActivity>;
    description: I5eItemDescription;
    duration: I5eSystemDurationData;
    identifier: string;
    level: number;
    materials: I5eSpellMaterials;
    method: "atwill" | "innate" | "spell" | string;
    prepared: number;
    properties: TSpellProperties[];
    range: I5eSystemBaseRangeData;
    school: string;
    source: I5eSourceInfo;
    target: I5eSystemTargetData;
    uses: I5eSystemLimitedUses;
    sourceClass?: string;
  }

  interface I5eSpellItem extends I5eSystemBaseDocumentData {
    type: "spell";
    system: I5eSpellSystemData;
    flags: IItemFlagConfig & {
      ddbimporter?: { dndbeyond: IParseSpellFlagDataDnDBeyond };
      "midi-qol"?: { removeAttackDamageButtons?: string };
      midiProperties?: I5eMidiItemProperties;
      "spell-class-filter-for-5e"?: Record<string, any>;
      "tidy5e-sheet"?: Record<string, any>;
    };
  }


  // ---- Equipment item -------------------------------------------------------

  interface I5eEquipmentSystemData {
    activities: Record<string, I5eActivity>;
    armor: { value: number | null; dex: number | null };
    attuned: boolean;
    attunement: string;
    container: string | null;
    cover?: number | null;
    crew: { value: any[] };
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    price: I5ePrice;
    proficient: boolean | null;
    properties: TEquipmentProperties[];
    quantity: number;
    rarity: TItemRarity;
    source: I5eSourceInfo;
    strength: number;
    container?: string;
    type: {
      value: TEquipmentTypes;
      baseItem: string;
    };
    unidentified: { description: string };
    uses: I5eSystemLimitedUses;
    weight: I5eItemWeight;
  }

  interface I5eEquipmentItem extends I5eSystemBaseDocumentData {
    type: "equipment";
    system: I5eEquipmentSystemData;
    flags: IItemFlagConfig & {
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Container item -------------------------------------------------------

  interface I5eContainerCapacityWeight {
    value?: number;
    units?: TWeightUnits;
  }

  interface I5eContainerCapacityVolume {
    units?: TVolumeUnits;
    value?: number;
  }

  interface I5eContainerCapacity {
    count?: number;
    weight?: I5eContainerCapacityWeight;
    volume?: I5eContainerCapacityVolume;
  }

  interface I5eContainerSystemData {
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    attunement: string;
    currency: I5eCurrency;
    capacity: I5eContainerCapacity;
    properties: TContainerProperties[];
    container?: string;
    attuned: boolean;
    equipped: boolean;
    // not sure this is right
    uses?: I5eSystemLimitedUses;
  }

  interface I5eContainerItem extends I5eSystemBaseDocumentData {
    type: "container";
    system: I5eContainerSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Tool item ------------------------------------------------------------

  interface I5eToolSystemData {
    activities: Record<string, I5eActivity>;
    uses: I5eSystemLimitedUses;
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    attunement: string;
    ability: string;
    bonus: string;
    chatFlavor: string;
    proficient: number;
    properties: TToolProperties[];
    type: { value: string; baseItem: string };
    container?: string;
    attuned: boolean;
    equipped: boolean;
  }

  interface I5eToolItem  extends I5eSystemBaseDocumentData {
    type: "tool";
    system: I5eToolSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Consumable item --------------------------------------------------

  interface I5eConsumableDamage {
    base: I5eDamagePart;
    replace: boolean;
  }

  interface I5eConsumableUses extends I5eSystemLimitedUses {
    autoDestroy: boolean;
  }

  interface I5eConsumableSystemData {
    activities: Record<string, I5eActivity>;
    uses: I5eConsumableUses;
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    attunement: string;
    attuned: boolean;
    equipped: boolean;
    damage: I5eConsumableDamage;
    properties: TConsumableProperties[];
    type: { value: string; subtype: string };
    container?: string;
  }

  interface I5eConsumableItem extends I5eSystemBaseDocumentData {
    type: "consumable";
    system: I5eConsumableSystemData;
    flags: IItemFlagConfig & {
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Loot item ------------------------------------------------------------

  interface I5eLootSystemData {
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    properties: string[];
    type: {
      value: TLootTypes;
      subtype: string;
    };
    container?: string;
  }

  interface I5eLootItem extends I5eSystemBaseDocumentData {
    type: "loot";
    system: I5eLootSystemData;
    flags: IItemFlagConfig;
  }


  // ---- Flag details -------------------------------------------------------

  interface IParseSpellFlagDataDnDBeyond extends IDDBImporterItemDnDBeyondFlags {
    /** The type of spell lookup source */
    lookup?: TParseSpellLookup;
    /** Name of the lookup source (e.g. class feature name, feat name, item name) */
    lookupName?: string;
    /** ID of the lookup source */
    lookupId?: number;
    /** Class name associated with the spell */
    class?: string;
    /** Whether the class is a 2014 version */
    is2014Class?: boolean;
    /** Character level or spell cast-at level */
    level?: number;
    /** Character class ID */
    characterClassId?: number;
    /** The spell's innate level */
    spellLevel?: number;
    /** Spellcasting ability abbreviation (e.g. "int", "wis", "cha") */
    ability?: string;
    /** Ability modifier for the spellcasting ability */
    mod?: number;
    /** Spell save DC */
    dc?: number | null;
    /** Whether the cantrip damage is boosted */
    cantripBoost?: boolean;
    /** Whether to override the default DC calculation */
    overrideDC?: boolean;
    /** DDB spell ID */
    id?: number;
    /** DDB entity type ID */
    entityTypeId?: number;
    /** Healing bonus modifier */
    healingBoost?: number;
    /** Whether the spell uses a spell slot */
    usesSpellSlot?: boolean;
    /** Whether material components are forced (e.g. Artificer) */
    forceMaterial?: boolean;
    /** Whether to force pact magic slot usage (e.g. Warlock) */
    forcePact?: boolean;
    /** Race full name (for race spells) */
    race?: string;
    /** Whether this is a granted (slot-using copy) of a limited-use spell */
    granted?: boolean;
    /** Override display name for the spell (e.g. item spells) */
    nameOverride?: string;
    /** The level the spell is cast at */
    castAtLevel?: number;
    /** Whether the spell is an unprepared cantrip replacement */
    unPreparedCantrip?: boolean | null;
    /** Whether the spell is homebrew */
    homebrew?: boolean;
    /** Limited use data from an item source */
    limitedUse?: { maxUses?: number; numberUsed?: number; resetType?: string; resetTypeDescription?: string };
    /** Limited use data from the spell itself (item spells) */
    spellLimitedUse?: IDDBSpellLimitedUse | null;
    /** Whether the item granting this spell is active/equipped/attuned */
    active?: boolean;
    /** Marked as always prepared on ddb */
    alwaysPrepared?: boolean;
  }

  interface IParseSpellFlagData {
    ddbimporter: {
      /** Whether this is a generic (non-character) spell */
      generic?: boolean;
      dndbeyond: IParseSpellFlagDataDnDBeyond;
    };
    /** Integration flag for the spell-class-filter-for-5e module */
    "spell-class-filter-for-5e"?: {
      parentClass?: string;
    };
    /** Integration flag for the tidy5e-sheet module */
    "tidy5e-sheet"?: {
      parentClass?: string;
    };
  }

  interface IDDBImporterFlagsOverrideItem {
    name?: string;
    type?: string;
    ddbId?: number;
  }

  /** dndbeyond flags stamped on items (spells, features, gear, classes, races). */
  interface IDDBImporterItemDnDBeyondFlags extends IDDBImporterDnDBeyondBaseFlags {
    // Spell flags are handled in IParseSpellFlagDataDnDBeyond

    // Item flags
    // spells synced back to DDB carry the owning class mapping
    characterClassId?: number;
    granted?: boolean;
    tags?: string[];
    sources?: { sourceId?: number; pageNumber?: number | null; sourceType?: number }[];
    restrictions?: string[];
    stackable?: boolean;
    isContainer?: boolean;
    isConsumable?: boolean;
    isCustomItem?: boolean;
    isMonkWeapon?: boolean;
    isPack?: boolean;
    levelInfusionGranted?: number;
    avatarUrl?: string;
    largeAvatarUrl?: string;
    pictureUrl?: string;
    filterType?: string;
    ability2?: string;
    damage?: { parts?: string[][] };
    classFeatures?: number[];
    alternativeNames?: string[];
    sourceId?: string;
    sourceCategoryId?: number;

    // Feature flags
    requiredLevel?: number;
    displayOrder?: number;
    featureType?: number;
    class?: string;
    classId?: number;
    entityId?: number;
    entityRaceId?: number;
    entityType?: string;

    // Choice flags
    choice?: {
      componentId?: number;
      componentTypeId?: number;
      choiceId?: string;
      optionId?: string;
      optionComponentId?: number;
      parentChoiceId?: string | null;
      parentName?: string;
      label?: string;
      subType?: string | number | null;
      type?: string | number | null;
      wasOption?: boolean;
      entityTypeId?: number | string | null;
    };

    // Infusion flags
    defintionKey?: string;
    modifierType?: string;
    requiresAttunement?: boolean;
    allowDuplicates?: boolean;

    // Limit use
    limitedUse?: { maxUses?: number; numberUsed?: number; resetType?: string; resetTypeDescription?: string };

  }


  interface I5eItemRiderFlags {
    activity?: string[];
    effect?: string[];
    status?: string[];
  }

  interface I5eItemFlags {
    scaling?: number;
    spellLevel?: {
      base?: number;
      value?: number;
    };
    cachedFor?: Item;
    riders?: I5eItemRiderFlags;
  };

  interface IDDBImporterTransferEnchantmentTargetItemMatches {
    field: string;
    value: string;
  }

  interface IDDBImporterTransferEnchantmentFlags {
    effectId: string;
    activityId: string;
    targetItemId?: string;
    targetItemName?: string;
    targetItemMatches?: IDDBImporterTransferEnchantmentTargetItemMatches[];
  }


  interface IDDBImporterFlagsSummons {
    summonsKey?: string;
    version?: number;
    folder?: string;
    name?: string;
    changes?: { key: string; value: string; mode?: number }[];
  }

  interface IDDBImporterFlagsEffect {
    // Aura behavior flags
    applyStart?: boolean;
    applyEntry?: boolean;
    applyImmediate?: boolean;
    everyEntry?: boolean;
    allowVsRemoveCondition?: boolean;
    removalCheck?: string | boolean;
    removalSave?: string | boolean;
    saveRemoves?: boolean;
    saveOnEntry?: boolean;
    condition?: string;
    save?: string;
    sequencerFile?: string;
    sequencerScale?: number;
    activityIds?: string[];
    isCantrip?: boolean;
    nameSuffix?: string;
    removeOnOff?: boolean;
    enchantmentEffects?: string[];

    // magicStone-style effect data
    dice?: string;
    damageType?: string;
  }

  interface IDDBImporterFlagsDisposition {
    match?: boolean;
  }

  /** ddbimporter flags stamped on items (spells, features, gear, classes,
   * subclasses, races, backgrounds) and their effects. */
  interface IDDBImporterItemFlags extends IDDBImporterFlagsBase {
    // Core identifiers
    definitionId?: number;
    definitionEntityTypeId?: number;
    componentId?: number;
    componentTypeId?: number;

    // Class spellcasting hints
    spellSlotDivisor?: number;
    spellCastingAbility?: string;

    // Naming
    originalName?: string;
    name?: string;

    // Type/classification
    subType?: string;
    action?: boolean;
    isCustomAction?: boolean;

    // Class/subclass
    class?: string;
    classId?: number;
    classDefinitionId?: number;
    subclass?: string;
    subClass?: string;
    subClassId?: number;
    subclassDefinitionId?: number;
    parentClassId?: number;
    isStartingClass?: boolean;

    // Feature classification
    isChoice?: boolean;
    isChoiceFeature?: boolean;
    optionalFeature?: boolean;
    infusionFeature?: boolean;
    infusionId?: number;
    experimentalElixir?: boolean;
    featureName?: string;
    featureMeta?: Record<string, unknown>;
    initialFeature?: boolean;

    // Race/species
    baseName?: string;
    baseRaceId?: number;
    baseRaceName?: string;
    subRaceShortName?: string;
    isSubRace?: boolean;
    fullName?: string;
    fullRaceName?: string;
    groupName?: string;
    groupIds?: number[];
    featIds?: number[];
    isLineage?: boolean;
    lineageName?: string;
    isHomebrew?: boolean;
    entityRaceId?: number;
    species?: string;
    trait?: string;
    moreDetailsUrl?: string;

    // Image handling
    ddbImg?: string;
    image?: string;
    keepIcon?: boolean;
    matchedImg?: string;
    avatarUrl?: string;
    largeAvatarUrl?: string;
    portraitAvatarUrl?: string;

    // Item flags
    containerEntityId?: number;
    containerEntityTypeId?: number;
    custom?: boolean;
    isCustom?: boolean;
    ddbCustomAdded?: boolean;
    isItemCharge?: boolean;
    removeSpell?: boolean;

    // Custom enrichers
    arcanePrototype?: { spellUuid: string; imbuedLevel: number; ddbSpellId: number; source: string };
    isSpellItem?: boolean;
    spellName?: string;
    shadowBlade?: boolean;
    shadowBladeTier?: string;

    // Compendium/import
    overrideId?: string;
    overrideItem?: IDDBImporterFlagsOverrideItem;
    replacedId?: string;
    replaced?: boolean;
    originalItemName?: string;
    delete?: Record<string, unknown>;

    // Effect flags
    effectsApplied?: boolean;
    chrisEffectsApplied?: boolean;
    chrisPreEffectName?: string;
    addSpellEffects?: boolean;
    generic?: boolean;
    effectLabelOverride?: string;

    // Effect matching (on effects)
    activityMatch?: string;
    activitiesMatch?: string[];
    ignoreTransfer?: boolean;
    effectIdLevel?: { min?: number | null; max?: number | null };
    activityRiders?: string[];
    effectRiders?: string[];
    itemRiders?: string[];
    noeffect?: boolean | number[];
    noEffectIds?: number[];

    // AC effects
    disabled?: boolean;
    itemId?: number | null;
    characterEffect?: boolean;
    originName?: string;

    // Activity/enricher flags
    replaceActivityUses?: boolean;
    forceSpellAdvancement?: boolean;
    spellHintName?: string;
    defaultAdditionalActivities?: { data?: Record<string, unknown> };

    // Import control
    ignoreItemImport?: boolean;
    ignoreItemUpdate?: boolean;
    ignoreItemForChrisPremades?: boolean;
    ignoreIcon?: boolean;
    retainResourceConsumption?: boolean;
    parentId?: string;

    // Monster feature flags (stamped on monster feature items)
    spellSave?: boolean;
    spellAttack?: boolean;
    levelBonus?: boolean;
    profBonus?: boolean;

    // Adventure
    adventure?: IDDBImporterFlagsAdventure;

    // Pricing
    price?: IDDBImporterFlagsPrice;

    // Nested objects
    dndbeyond?: IDDBImporterItemDnDBeyondFlags;
    summons?: IDDBImporterFlagsSummons;
    effect?: IDDBImporterFlagsEffect;
    disposition?: IDDBImporterFlagsDisposition;

    // enchantment transfer
    transferEnchantment?: IDDBImporterTransferEnchantmentFlags;

  }

  interface IItemFlagConfig {
    infusions?: { maps?: any[]; applied?: any[]; infused: boolean };
    ddbimporter?: IDDBImporterItemFlags;
    dnd5e?: I5eItemFlags;
    "midi-qol"?: {
      dependentOn?: string; // UUID of parent document for midi-qol dependent tracking
      onUseMacroParts?: OnUseMacros;
      onUseMacroName?: string;
      noProvokeReaction?: boolean;
      isConcentrationCheck?: boolean;
      trapWorkflow?: {
        ignoreSelf?: boolean;
      };
      reactionCondition?: string;
    };
  };

  // ---- Item union ---------------------------------------------------

  export type I5eInventoryItem =
    | I5eWeaponItem
    | I5eEquipmentItem
    | I5eContainerItem
    | I5eConsumableItem
    | I5eToolItem
    | I5eLootItem;

  export type I5eItemData =
    | I5eInventoryItem
    | I5eSpellItem
    | I5eFeatItem
    | I5eBackgroundItem
    | I5eClassItem
    | I5eSubclassItem
    | I5eRaceItem;


  // Live Item with the flag shapes; Item.Implementation's
  type TImporterItem = Omit<Item.Implementation, "flags"> & {
    flags: IItemFlagConfig;
  };
}
