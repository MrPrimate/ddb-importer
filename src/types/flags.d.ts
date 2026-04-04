export {};

global {

  type ParseSpellLookup = "classSpell" | "classFeature" | "race" | "feat" | "background" | "generic" | "item";

  interface IParseSpellFlagDataDnDBeyond extends IDDBImporterFlagsDnDBeyond {
    /** The type of spell lookup source */
    lookup?: ParseSpellLookup;
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
    unPreparedCantrip?: string | null;
    /** Whether the spell is homebrew */
    homebrew?: boolean;
    /** Limited use data from an item source */
    limitedUse?: { maxUses?: number; numberUsed?: number; resetType?: string; resetTypeDescription?: string };
    /** Limited use data from the spell itself (item spells) */
    spellLimitedUse?: { maxUses?: number; numberUsed?: number; resetType?: string; resetTypeDescription?: string } | null;
    /** Whether the item granting this spell is active/equipped/attuned */
    active?: boolean;
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

  interface IDDBImporterFlagsDnDBeyond {
    // Character identity
    characterId?: string;
    url?: string;
    json?: string;
    roUrl?: string;

    // Character stats
    totalLevels?: number;
    profBonus?: number;
    proficiencies?: string[];
    proficienciesIncludingEffects?: string[];
    effectAbilities?: I5eAbilities;
    characterValues?: { valueId?: number; valueTypeId?: number; typeId?: number; value?: string }[];
    templateStrings?: IDDBTemplateStringResult[];
    campaign?: { id?: number; name?: string };

    // Spell flags
    lookup?: string;
    lookupName?: string;
    lookupId?: number;
    level?: number;
    characterClassId?: number;
    spellLevel?: number;
    ability?: string;
    mod?: number;
    dc?: number;
    cantripBoost?: boolean;
    overrideDC?: boolean;
    id?: number;
    entityTypeId?: number;
    healingBoost?: number;
    usesSpellSlot?: boolean;
    forceMaterial?: boolean;
    forcePact?: boolean;
    is2014Class?: boolean;
    race?: string;
    granted?: boolean;
    nameOverride?: string;
    castAtLevel?: number;
    unPreparedCantrip?: string | null;
    homebrew?: boolean;

    // Item flags
    type?: string;
    tags?: string[];
    sources?: { sourceId?: number; pageNumber?: number; sourceType?: number }[];
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

    // Encounter flags
    initiative?: number;
    uniqueId?: string;

    // Choice flags
    choice?: {
      componentId?: number;
      choiceId?: string;
      optionId?: string;
    };

    // Infusion flags
    defintionKey?: string;
    modifierType?: string;
    requiresAttunement?: boolean;
    allowDuplicates?: boolean;

    // Limit use
    limitedUse?: { maxUses?: number; numberUsed?: number; resetType?: string; resetTypeDescription?: string };

    [key: string]: unknown;
  }

  interface IDDBImporterFlagsSummons {
    summonsKey?: string;
    version?: number;
    folder?: string;
    name?: string;
    changes?: { key: string; value: string; mode: number }[];
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

  interface IDDBImporterFlagsPrice {
    xgte?: boolean;
    value?: number;
  }

  interface IDDBImporterFlagsResources {
    type?: string;
    ask?: boolean;
  }

  interface IDDBImporterFlagsAdventure {
    required?: Record<string, unknown>;
    revisitUuids?: string[];
  }

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

  interface IDDBImporterFlags {
    // Core identifiers
    id?: number;
    definitionId?: number;
    entityTypeId?: number;
    definitionEntityTypeId?: number;
    componentId?: number;
    componentTypeId?: number;
    compendiumId?: string;

    // Naming
    originalName?: string;
    name?: string;

    // Type/classification
    type?: string;
    subType?: string;
    action?: boolean;
    isCustomAction?: boolean;

    // Version flags
    is2014?: boolean;
    is2024?: boolean;
    legacy?: boolean;
    isLegacy?: boolean;
    version?: string;

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
    baseRaceName?: string;
    subRaceShortName?: string;
    isSubRace?: boolean;
    fullRaceName?: string;
    groupName?: string;
    isLineage?: boolean;
    entityRaceId?: number;

    // Image handling
    ddbImg?: string;
    image?: string;
    keepIcon?: boolean;
    matchedImg?: string;

    // Item flags
    containerEntityId?: number;
    containerEntityTypeId?: number;
    custom?: boolean;
    isCustom?: boolean;
    ddbCustomAdded?: boolean;
    isItemCharge?: boolean;
    removeSpell?: boolean;

    // Compendium/import
    compendium?: boolean;
    pack?: string;
    overrideId?: string;
    overrideItem?: IDDBImporterFlagsOverrideItem;
    replacedId?: string;
    replaced?: boolean;
    originalItemName?: string;
    importId?: string;
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

    // Character flags (on actor)
    rolledHP?: boolean;
    baseHitPoints?: number;
    baseAC?: number;
    acEffects?: string[];
    activeUpdate?: boolean;
    activeSyncSpells?: boolean;
    useLocalPatreonKey?: boolean;

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

    // Monster feature flags
    spellSave?: boolean;
    spellAttack?: boolean;
    levelBonus?: boolean;
    profBonus?: boolean;

    // Source metadata
    sources?: { sourceId: number; pageNumber?: number; sourceType?: number }[];
    tags?: string[];
    sourceId?: number;
    sourceCategory?: number;
    sourceCode?: string;
    sourceName?: string;

    // Encounter/adventure
    encounterId?: number | string;
    encounters?: boolean;
    isDDBAdventure?: boolean;
    adventure?: IDDBImporterFlagsAdventure;

    // Pricing
    price?: IDDBImporterFlagsPrice;

    // Resources (on actor)
    resources?: IDDBImporterFlagsResources;

    // Nested objects
    dndbeyond?: IDDBImporterFlagsDnDBeyond;
    summons?: IDDBImporterFlagsSummons;
    effect?: IDDBImporterFlagsEffect;
    disposition?: IDDBImporterFlagsDisposition;

    // enchantment transfer
    transferEnchantment?: IDDBImporterTransferEnchantmentFlags;

    [key: string]: unknown;
  }

  interface I5eActorFlags {
    // added by us
    DamageBonusMacro?: string;
    // added by us
    spellSniper?: boolean;
    // added by us
    sharpShooter?: string;
  };

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

  interface IMidiQoLActorFlags {
    dependentOn?: string; // UUID of parent document for midi-qol dependent tracking
    actions?: {
      // This really should be structured but actions.reaction is used in other modules and macros
      reaction?: boolean;
      reactionsUsed?: number;
      reactionsMax?: number;
      reactionsReset?: "eachTurn" | "onTurnStart" | "rest" | "never"; // When reactions reset default: onTurnStart
      action?: boolean;
      bonus?: boolean;
      bonusActionsUsed?: number;
      bonusActionsMax?: number;
      bonusActionsReset?: "eachTurn" | "onTurnStart" | "rest" | "never"; // When bonus actions reset default: onTurnStart
      reactionCombatRound?: number;
      bonusActionCombatRound?: number;
    };
    acBonus?: number;
    advantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      skill?: Record<string, string>;
    };
    canFlank: string;
    carefulSpells?: boolean;
    concentrationSaveBonus?: number;
    critical?: Record<string, string>;
    damage?: {
      advantage?: boolean;
      "reroll-kh"?: boolean;
      "reroll-kl"?: boolean;
    };
    deathSaveBonus?: number;
    disadvantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      skill?: Record<string, string>;
    };
    fail?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      critical?: Record<string, string>;
      deathSave?: string;
      disadvantage?: {
        heavy?: boolean;
      };
      skill?: Record<string, string>;
      spell?: {
        all?: string;
        verbal?: string;
        vocal?: string;
        somatic?: string;
        material?: string;
      };
      tool?: Record<string, string>;
    };
    grants?: {
      advantage?: {
        all?: string;
        attack?: Record<string, string>;
        check?: Record<string, string>;
        save?: Record<string, string>;
        skill?: Record<string, string>;
      };
      attack?: {
        bonus?: Record<string, string>;
        fail?: {
          all?: string;
        };
        success?: Record<string, string>;
      };
      bonus?: {
        damage?: Record<string, string>;
      };
      critical?: Record<string, string>;
      criticalThreshold?: string;
      disadvantage?: {
        all?: string;
        attack?: Record<string, string>;
        check?: Record<string, string>;
        save?: Record<string, string>;
        skill?: Record<string, string>;
      };
      fail?: {
        advantage?: {
          attack?: Record<string, string>;
        };
        disadvantage?: {
          attack?: Record<string, string>;
        };
      };
      max?: {
        damage?: Record<string, string>;
      };
      min?: {
        damage?: Record<string, string>;
      };
      noAdvantage?: {
        attack?: Record<string, string>;
      };
      noCritical?: Record<string, string>;
      fumble?: Record<string, string>;
      noFumble?: Record<string, string>;
      noDisadvantage?: {
        attack?: Record<string, string>;
      };
    };
    ignoreCover?: boolean;
    ignoreNearbyFoes?: boolean;
    ignoreWalls?: boolean;
    initiativeAdv?: string;
    initiativeDisadv?: string;
    inMotion?: boolean;
    long?: Record<string, string>;
    magicResistance?: {
      check?: { all?: string };
      save?: { all?: string };
      skill?: { all?: string };
    } & Record<string, string>;
    magicVulnerability?: Record<string, string>;
    max?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      damage?: Record<string, string>;
      deathSave?: string;
      skill?: {
        all?: string;
      };
      tool?: Record<string, string>;
    };
    min?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      damage?: Record<string, string>;
      deathSave?: string;
      skill?: {
        all?: string;
      };
      tool?: Record<string, string>;
    };
    neverTarget?: boolean;
    noAdvantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      initiative?: string;
      skill?: Record<string, string>;
      tool?: Record<string, string>;
    };
    noDisadvantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      initiative?: string;
      skill?: Record<string, string>;
      tool?: Record<string, string>;
    };
    noCritical?: Record<string, string>;
    noFumble?: Record<string, string>;
    fumble?: Record<string, string>;
    onUseMacroName?: string;
    onUseMacroParts?: OnUseMacros;
    optional?: Record<string, any>;
    OverTime?: string;
    potentCantrip?: boolean;
    range?: Record<string, string>;
    rangeOverride?: {
      attack?: Record<string, string>;
    };
    rollModifiers?: {
      attack?: Record<string, string>;
      damage?: Record<string, Record<string, string>>;
    };
    save?: {
      fail?: Record<string, string>;
    };
    sculptSpells?: boolean;
    semiSuperSaver?: Record<string, string>;
    sharpShooter?: string;
    success?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: boolean;
      attack?: Record<string, string>;
      deathSave?: string;
      skill?: Record<string, string>;
      tool?: Record<string, string>;
    };
    superSaver?: Record<string, string>;
    uncannyDodge?: boolean;
  };

  interface IItemFlagConfig {
    infusions?: { infused: boolean };
    ddbimporter?: IDDBImporterFlags;
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
    dae?: {
      macro?: Macro.CreateData;
    };
    itemacro?: {
      macro?: Macro.CreateData;
    };
  };

  interface IActorFlagConfig {
    ddbimporter?: IDDBImporterFlags;
    dnd5e?: I5eActorFlags;
    "midi-qol"?: IMidiQoLActorFlags;
  };

  interface FlagConfig {
    ActiveEffect: {
      ActiveAuras?: {
        isAura?: boolean;
        ignoreSelf?: boolean;
      };
      dnd5e?: {
        exhaustionLevel?: number;
        dependents?: {
          uuid: string;
        }[];
        itemUuid?: string;
        item?: {
          type: string;
          id: string;
          uuid: string;
        };
        riders?: {
          effect?: string[];
          activity?: string[];
          statuses?: string[];
        };
      };
      // Copied from DAE's `globals.ts` for now
      dae?: {
        activity?: string;
        activityMacro?: string;
        autoCreated?: boolean;
        disableIncapacitated?: boolean;
        dontApply?: boolean;
        durationExpression?: string;
        enableCondition?: string;
        itemData?: Item.InitializedData;
        itemMacro?: string;
        itemUuid?: string;
        itemsToDelete?: string[];
        selfTarget?: boolean;
        selfTargetAlways?: boolean;
        showIcon?: boolean;
        specialDuration?: string | string[];
        stackable?: "noneName" | "noneNameOnly" | "none" | "multi" | "count" | "countDeleteDecrement";
        stacks?: number;
        transfer?: boolean;
      };
      "midi-qol"?: {
        actionSaveSuccess?: boolean;
        castData?: {
          castLevel?: number;
          baseLevel?: number;
        };
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
        overtime?: {
          permanent?: boolean;      // Effect marked permanent by saveCount/failCount
          savesRemaining?: number;  // Remaining saves needed for saveCount
          failsRemaining?: number;  // Remaining fails needed for failCount
        };
        overtimeChatCardUuids?: string[];
        transformedActorUuids?: string[];
      };
    };
    Actor: IActorFlagConfig;
    ChatMessage: {
      dnd5e?: {
        item?: {
          id: string;
          type: string;
          uuid: string;
          data?: Item.CreateData;
        };
        scaling?: number;
        "use.concentrationId"?: string;
        "use.spellLevel"?: number;
        "use.consumed"?: unknown;
        "transform.uuid"?: string;
        "transform.profile"?: string;
        targets?: unknown;
        messageType?: string;
        roll?: {
          type?: string;
          itemId?: string;
        };
      };
      "midi-qol"?: {
        activityUuid?: string;
        actorUuid?: string;
        sourceActorUuid?: string;
        advantageSaveUuids?: string[];
        ammunitionOnUseMacros?: OnUseMacros;
        AoO?: boolean;
        attackTotal?: number;
        attackRoll?: Roll.Data | Roll;
        attackRollCount?: number;
        bonusDamageDetail?: DamageDescriptionObject[];
        bonusDamageRolls?: Roll.Data[] | Roll[];
        bonusDamageTotal?: number;
        concentrationRolled?: boolean;
        criticalSaveUuids?: string[];
        currentAction?: [string, string];
        d20AttackRoll?: number;
        damageDetail?: DamageDescriptionObject[];
        damageList?: DamageListEntry[];
        damageRollCount?: number;
        damageRolls?: Roll.Data[] | Roll[];
        damageTotal?: number;
        defaultDamageType?: string;
        diceRoll?: number;
        effectsAlreadyExpired?: string[];
        failedSaveUuids?: string[];
        fumbleSaveUuids?: string[];
        hitTargetUuids?: string[];
        hitECTargetUuids?: string[];
        inCombat?: boolean;
        isCritical?: boolean;
        isFumble?: boolean;
        itemUseComplete?: boolean;
        expectedTemplateCount?: number;
        noOptionalRules?: boolean;
        OnUseMacros?: OnUseMacros;
        otherDamageDetail: DamageDescriptionObject[];
        otherDamageRolls?: Roll.Data[] | Roll[];
        otherDamageTotal?: number;
        rawBonusDamageDetail?: DamageDescriptionObject[];
        rawDamageDetail?: DamageDescriptionObject[];
        rawOtherDamageDetail?: DamageDescriptionObject[];
        saveDisplayData?: unknown;
        saveUuids?: string[];
        /** Structured save attribution map: targetUuid -> type -> source -> displayName */
        saveAttribution?: Record<string, AttributionMap>;
        semiSuperSaverUuids?: string[];
        superSaverUuids?: string[];
        suspended?: boolean;
        targets?: { uuid: string; name: string }[];
        targetsCanSeeUuids?: string[];
        targetsCanSenseUuids?: string[];
        transformedActors: string[];
        tokenCanSeeUuids?: string[];
        tokenCanSenseUuids?: string[];
        attackingTokenUuid?: string;
        templateUuid?: string;
        templateUuids?: string[];
        workflowOptions?: WorkflowOptions;
        undoDamage?: SerializedDamageListEntry[];
        utilityRolls?: Roll.Data[] | Roll[];
        "use.consumed"?: any;
        "use.otherScaling"?: number | false;
        aborted?: boolean;
        type?: number;
        overtimeActorUuid?: string;
        messageType?: string;
        roll?: unknown[];
        syntheticItem?: boolean;
        isHit?: boolean;
        otherActivityConsumed?: object;
        playerDamageCard?: boolean;
      };
    };
    Item: IItemFlagConfig;
    MeasuredTemplate: {
      dnd5e?: {
        origin?: string;
        dependentOn?: string;
      };
      "midi-qol"?: {
        itemUuid?: string;
        actorUuid?: string;
        activityUuid?: string;
        workflowId?: string;
        itemCardUuid?: string;
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
        anchorToToken?: boolean; // Whether cone/ray template origin is anchored to caster's token border
      };
    };
    MeasuredTemplateDocument: {
      dnd5e?: {
        origin?: string;
        dependentOn?: ActiveEffect.Implementation | null;
      };
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
        anchorToToken?: boolean; // Whether cone/ray template origin is anchored to caster's token border
      };
    };
    TokenDocument: {
      dnd5e?: {
        dependentOn?: string;
      };
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
      };
    };
    AmbientLightDocument: {
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
      };
    };
  }
}
