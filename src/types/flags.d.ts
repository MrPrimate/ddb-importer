export {};

global {

  type TParseSpellLookup = "classSpell" | "classFeature" | "race" | "feat" | "background" | "generic" | "item";

  /** dndbeyond flag fields shared by every document type. */
  interface IDDBImporterDnDBeyondBaseFlags {
    // core identifiers
    id?: number;
    entityTypeId?: number;
    type?: string;
  }

  /** dndbeyond flags stamped on encounter documents (tokens/actor deltas). */
  interface IDDBImporterEncounterDnDBeyondFlags extends IDDBImporterDnDBeyondBaseFlags {
    initiative?: number;
    uniqueId?: string;
  }

  /** Kitchen-sink dndbeyond flags for code paths that handle documents of
   * unknown type (getProperty casts, generic muncher paths). Prefer the
   * targeted PC/Item/Encounter interfaces where the document type is known. */
  interface IDDBImporterFlagsDnDBeyond extends
    IDDBImporterPCDnDBeyondFlags,
    IDDBImporterItemDnDBeyondFlags,
    IDDBImporterEncounterDnDBeyondFlags {
  }

  /** ddbimporter flag fields shared by every document type (actors, items,
   * scenes, tables). */
  interface IDDBImporterFlagsBase {
    // Core identifiers
    id?: number;
    // custom actions carry a string entityTypeId; all other kinds send a number
    entityTypeId?: number | string;
    compendiumId?: string;

    // Type/classification
    type?: string;

    // Version flags
    is2014?: boolean;
    is2024?: boolean;
    legacy?: boolean;
    isLegacy?: boolean;
    version?: string;

    // Compendium/import
    compendium?: boolean;
    pack?: string;
    importId?: string;

    // Source metadata
    sources?: { sourceId: number; pageNumber?: number | null; sourceType?: number }[];
    tags?: string[];
    // number for parsed documents; DDBMap stamps the string map-source id on scenes
    sourceId?: number | string | null;
    sourceCategory?: number;
    sourceCode?: string;
    sourceName?: string;

    // Encounter/adventure
    encounterId?: number | string;
    encounters?: boolean;
    isDDBAdventure?: boolean;

    // adventure muncher retention (read on any document type by DDBAdventureFlags)
    keepItems?: boolean;
    keepToken?: boolean;
    keepAvatar?: boolean;
    customItem?: boolean;
  }

  /** Kitchen-sink ddbimporter flags for code paths that handle documents of
   * unknown type (getProperty casts, scene/table flag extension, generic
   * muncher paths). Prefer the targeted PC/Monster/Item interfaces where the
   * document type is known. */
  interface IDDBImporterFlags extends
    IDDBImporterFlagsBase,
    IDDBImporterPCFlags,
    IDDBImporterMonsterFlags,
    IDDBImporterItemFlags {
    dndbeyond?: IDDBImporterFlagsDnDBeyond;
  }

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
        itemData?: Record<string, any>;
        itemMacro?: string;
        itemUuid?: string;
        itemsToDelete?: string[];
        selfTarget?: boolean;
        selfTargetAlways?: boolean;
        specialDuration?: string | TDAESpecialDuration[];
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
    Scene: I5eSceneDataFlags;
    JournalEntry: I5eJournalEntryFlags;
    JournalEntryPage: I5eJournalPageFlags;
    RollTable: I5eRollTableFlags;
    Note: I5eNoteFlags;
    ChatMessage: {
      dnd5e?: {
        item?: {
          id: string;
          type: string;
          uuid: string;
          data?: Record<string, any>;
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
    Token: {
      ddbActorFlags?: IDDBSceneFlagTokenDDBActorFlags;
      ddbItems?: IDDBSceneFlagTokenDDBItemFlags[];
      ddbActorEffects?: I5eEffectData[];
      actorFolderId?: string;
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
