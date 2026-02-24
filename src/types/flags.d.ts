export {}

global {

  interface IDDBImporterFlagsOverrideItem {
    name: string;
    type: string;
    ddbId: number;
  }

  interface IDDBImporterFlags {
    overrideId: string;
    overrideItem: IDDBImporterFlagsOverrideItem;
  }

  interface FlagConfig {
    ddbImporter: IDDBImporterFlags;
    ActiveEffect: {
      ActiveAuras?: {
        isAura?: boolean;
        ignoreSelf?: boolean;
      }
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
        }
        riders?: {
          effect?: string[];
          activity?: string[];
          statuses?: string[];
        }
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
    Actor: {
      dnd5e?: {
        // added by us
        DamageBonusMacro?: string;
        // added by us
        spellSniper?: boolean;
        // added by us
        sharpShooter?: string;
      };
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document for midi-qol dependent tracking
        actions?: {
          // This really should be structured but actions.reaction is used in other modules and macros
          reaction?: boolean,
          reactionsUsed?: number,
          reactionsMax?: number;
          reactionsReset?: "eachTurn"| "onTurnStart" | "rest" | "never"; // When reactions reset default: onTurnStart
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
            }
            success?: Record<string, string>;
          };
          bonus?: {
            damage?: Record<string, string>
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
          }
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
          }
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
        }
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
    };
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
    Item: {
      dnd5e?: {
        scaling?: number;
        spellLevel?: {
          base?: number;
          value?: number;
        };
        cachedFor?: Item;
        riders?: {
          activity?: string[];
        }
      };
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document for midi-qol dependent tracking
        onUseMacroParts?: OnUseMacros;
        onUseMacroName?: string;
        noProvokeReaction?: boolean;
        isConcentrationCheck?: boolean;
        trapWorkflow?: {
          ignoreSelf?: boolean;
        }
      };
      dae?: {
        macro?: Macro.CreateData;
      };
      itemacro?: {
        macro?: Macro.CreateData;
      };
    };
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
    }
    TokenDocument: {
      dnd5e?: {
        dependentOn?: string;
      };
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
      };
    }
    AmbientLightDocument: {
      "midi-qol"?: {
        dependentOn?: string; // UUID of parent document (Actor/Item) for midi-qol dependent tracking
      };
    }
  }
}
