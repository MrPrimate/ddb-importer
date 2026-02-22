/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// Type declarations for third-party module/system globals not covered by foundry-vtt-types.
// Core Foundry globals (game, CONFIG, CONST, Hooks, foundry, canvas, ui, Actor, Item, etc.)
// are provided by @league-of-foundry-developers/foundry-vtt-types via tsconfig.json "types".
//
// This file must be a module (has `export {}`) so that `declare global` properly
// merges into globalThis. Without it, SettingConfig augmentation is invisible to
// other modules and game.settings.get/set only recognizes "core" as a namespace.

import { DDBIConfig } from "../hooks/ready/registerGameSettings";

export {};

declare global {

  type IndexTypeForMetadata<Type extends CompendiumCollection.DocumentName> = foundry.utils.Collection<
    CompendiumCollection.IndexEntry<Type>
  >;

  declare namespace CompendiumCollection {
    interface ExtendedGetIndexOptions<T extends CompendiumCollection.DocumentName>
      extends GetIndexOptions<T> {
      fields?: string[];
    }
  }

  // D&D 5e system global
  const dnd5e: any;

  // ddb-importer module global
  interface Window {
    DDBImporter: {
      lib: Record<string, any>;
      [key: string]: any;
    };
  }
  let DDBImporter: {
    lib: Record<string, any>;
    [key: string]: any;
  };

  // Third-party Foundry module globals
  const MidiQOL: any;
  const DAE: any;
  const Sequencer: any;
  const Sequence: any;
  const chrisPremades: any;
  const AutomatedAnimations: any;
  const AdventureImporter: any;
  const ForgeVTT: any;
  const ForgeAPI: any;

  // Custom skills module
  const dnd5eCustomSkills: any;

  // JSZip library (loaded at runtime, not bundled)
  const JSZip: any;

  interface CONFIG extends CONFIG {
    DDBI: DDBIConfig;
    // Temp, until we use dnd5e-types
    DND5E: {
      abilities: Record<string, {
        label: string;
      }>;
      abilityActivationTypes: Record<string, string>;
      activityTypes: Record<string, {
        documentClass: Function | Activity
      }>;
      actorSizes: Record<string, {
        label: string;
      }>;
      areaTargetTypes: Record<string, {
        label: string;
        counted: string;
        template: string;
        standard?: boolean;
      }>;
      armorClasses: Record<string, {
        label: string
      }>;
      consumableTypes: Record<string, {
        label: string;
        subtypes?: Record<string, string>;
      }>;
      // This one's added by midi
      customDamageResistanceTypes: Record<string, string>;
      damageTypes: Record<string, {
        label: string;
        icon: string;
        isPhysical?: boolean;
        reference?: string;
        color?: Color;
      }>;
      equipmentTypes: Record<string, string>;
      healingTypes: Record<string, {
        label: string;
        icon: string;
        color?: Color;
      }>;
      itemActionTypes: Record<string, string>;
      skills: Record<string, {
        label: string;
        ability: string;
      }>;
      sourcePacks: {
        BACKGROUNDS: string;
        CLASSES: string;
        ITEMS: string;
        RACES: string;
      };
      spellSchools: Record<string, {
        label: string;
        icon: string;
        fullKey: string;
        reference?: string;
      }>;
      tools: Record<string, {
        ability: string;
        id: string;
      }>;
      toolTypes: Record<string, string>;
      traits: Record<string, {
        labels: {
          title: string;
          localization: string;
          all?: string;
        };
        icon: string;
        actorKeyPath?: string;
        configKey?: string;
        dataType?: number | boolean;
        labelKeyPath?: string;
        subTypes?: {
          keyPath?: string;
          ids?: string[];
        };
        children?: Record<string, string>;
        sortCategories?: boolean;
        expertise?: boolean;
        mastery?: boolean;
      }>
      weaponMasteries: Record<string, { label: string, reference?: string }>;
      weaponTypes: Record<string, string>;
    }
  }

  // Declaration merging for ddb-importer settings.
  // foundry-vtt-types extracts valid namespaces/keys from globalThis.SettingConfig
  // via template literal types: `${infer Scope}.${string}` on keyof SettingConfig.
  // See: src/foundry/client/helpers/client-settings.d.mts in foundry-vtt-types
  interface SettingConfig {
    // EARLY settings
    "ddb-importer.log-level": string;
    "ddb-importer.show-munch-top": boolean;
    "ddb-importer.patreon-tier": string;
    "ddb-importer.custom-proxy": boolean;
    "ddb-importer.encounter-muncher-enabled": boolean;
    "ddb-importer.developer-mode": boolean;
    "ddb-importer.add-ddb-languages": boolean;
    "ddb-importer.register-source-books": boolean;
    "ddb-importer.no-source-book-pages": boolean;
    "ddb-importer.use-basic-rules": boolean;
    "ddb-importer.ddb-compendium-banner": boolean;
    "ddb-importer.disable-tattoo-type": boolean;
    "ddb-importer.allowed-weapon-property-sources": any[];
    "ddb-importer.add-extra-base-weapons": boolean;

    // READY: SETTINGS
    "ddb-importer.auto-create-compendium": boolean;

    // READY: COMPENDIUMS (dynamic, from compendiums.ts)
    "ddb-importer.entity-background-compendium": string;
    "ddb-importer.entity-class-compendium": string;
    "ddb-importer.entity-feat-compendium": string;
    "ddb-importer.entity-item-compendium": string;
    "ddb-importer.entity-monster-compendium": string;
    "ddb-importer.entity-vehicle-compendium": string;
    "ddb-importer.entity-species-compendium": string;
    "ddb-importer.entity-spell-compendium": string;
    "ddb-importer.entity-table-compendium": string;
    "ddb-importer.entity-override-compendium": string;
    "ddb-importer.entity-adventure-compendium": string;
    "ddb-importer.entity-journal-compendium": string;
    "ddb-importer.entity-summons-compendium": string;

    // READY: DIRECTORIES
    "ddb-importer.image-upload-directory": string;
    "ddb-importer.other-image-upload-directory": string;
    "ddb-importer.frame-image-upload-directory": string;
    "ddb-importer.adventure-upload-path": string;
    "ddb-importer.adventure-misc-path": string;
    "ddb-importer.persistent-storage-location": string;

    // READY: UI
    "ddb-importer.monster-link-title": boolean;
    "ddb-importer.character-link-title": boolean;
    "ddb-importer.link-title-colour-white": boolean;
    "ddb-importer.show-image-to-players": boolean;
    "ddb-importer.show-read-alouds-button": boolean;
    "ddb-importer.show-read-alouds-all-content": boolean;

    // READY: PERMISSIONS
    "ddb-importer.restrict-to-trusted": boolean;
    "ddb-importer.allow-all-sync": boolean;

    // READY: PARSING
    "ddb-importer.show-resource-chooser-default": boolean;
    "ddb-importer.add-damage-restrictions-to-hints": boolean;
    "ddb-importer.embed-macros": boolean;
    "ddb-importer.no-item-macros": boolean;
    "ddb-importer.add-description-to-chat": boolean;
    "ddb-importer.use-loose-srd-reference-matching": boolean;
    "ddb-importer.use-super-loose-srd-reference-matching": boolean;
    "ddb-importer.spells-on-items-as-activities": boolean;
    "ddb-importer.separate-ac-effects": boolean;
    "ddb-importer.effects-uses-macro-status-effects": boolean;

    // READY: MISC
    "ddb-importer.use-webp": boolean;
    "ddb-importer.webp-quality": number;
    "ddb-importer.update-check": boolean;
    "ddb-importer.use-deep-file-paths": boolean;
    "ddb-importer.show-welcome-message": boolean;

    // READY: CHARACTER ENHANCERS
    "ddb-importer.allow-moon-druid-wildshape-enhancer": boolean;
    "ddb-importer.allow-arcane-ward-enhancer": boolean;
    "ddb-importer.allow-mighty-summoner-enhancer": boolean;
    "ddb-importer.allow-great-weapon-master-enhancer": boolean;
    "ddb-importer.allow-warding-bond-enhancer": boolean;

    // READY: CHARACTER IMPORT
    "ddb-importer.character-update-policy-use-hp-max-for-rolled-hp": boolean;
    "ddb-importer.character-update-policy-create-companions": boolean;
    "ddb-importer.pact-spells-prepared": boolean;
    "ddb-importer.character-update-policy-add-midi-effects": boolean;
    "ddb-importer.character-update-policy-use-existing": boolean;
    "ddb-importer.character-update-policy-ignore-non-ddb-items": boolean;
    "ddb-importer.character-update-policy-use-override": boolean;
    "ddb-importer.character-update-policy-name": boolean;
    "ddb-importer.character-update-policy-hp": boolean;
    "ddb-importer.character-update-policy-hit-die": boolean;
    "ddb-importer.character-update-policy-class": boolean;
    "ddb-importer.character-update-policy-feat": boolean;
    "ddb-importer.character-update-policy-weapon": boolean;
    "ddb-importer.character-update-policy-equipment": boolean;
    "ddb-importer.character-update-policy-bio": boolean;
    "ddb-importer.character-update-policy-xp": boolean;
    "ddb-importer.character-update-policy-spell-use": boolean;
    "ddb-importer.character-update-policy-languages": boolean;
    "ddb-importer.character-update-policy-import-extras": boolean;
    "ddb-importer.character-update-policy-inventory": boolean;
    "ddb-importer.character-update-policy-currency": boolean;
    "ddb-importer.character-update-policy-spell": boolean;
    "ddb-importer.character-update-policy-image": boolean;
    "ddb-importer.character-update-policy-use-ddb-spell-icons": boolean;
    "ddb-importer.character-update-policy-use-ddb-generic-item-icons": boolean;
    "ddb-importer.character-update-policy-use-ddb-item-icons": boolean;
    "ddb-importer.character-update-policy-use-inbuilt-icons": boolean;
    "ddb-importer.character-update-policy-use-srd-icons": boolean;
    "ddb-importer.character-update-policy-use-combined-description": boolean;
    "ddb-importer.character-update-policy-active-effect-copy": boolean;
    "ddb-importer.character-update-policy-use-chris-premades": boolean;
    "ddb-importer.character-update-policy-include-versatile-features": boolean;
    "ddb-importer.character-update-policy-remove-2024": boolean;
    "ddb-importer.character-update-policy-remove-legacy": boolean;
    "ddb-importer.character-update-policy-import-full-spell-list": boolean;
    "ddb-importer.character-update-policy-use-active-sources": boolean;
    "ddb-importer.character-update-policy-add-features-to-compendiums-dev": boolean;
    "ddb-importer.character-update-policy-update-add-features-to-compendiums": boolean;
    "ddb-importer.character-update-policy-import-all-cantrips": boolean;
    "ddb-importer.character-import-policy-ignore-items-with-non-existing-containers": boolean;

    // READY: CHARACTER SYNC
    "ddb-importer.sync-policy-currency": boolean;
    "ddb-importer.sync-policy-hitpoints": boolean;
    "ddb-importer.sync-policy-hitdice": boolean;
    "ddb-importer.sync-policy-action-use": boolean;
    "ddb-importer.sync-policy-inspiration": boolean;
    "ddb-importer.sync-policy-condition": boolean;
    "ddb-importer.sync-policy-deathsaves": boolean;
    "ddb-importer.sync-policy-spells-prepared": boolean;
    "ddb-importer.sync-policy-spells-slots": boolean;
    "ddb-importer.sync-policy-spells-sync": boolean;
    "ddb-importer.sync-policy-equipment": boolean;
    "ddb-importer.sync-policy-xp": boolean;

    // READY: CHARACTER DYNAMIC_SYNC
    "ddb-importer.dynamic-sync-policy-currency": boolean;
    "ddb-importer.dynamic-sync-policy-hitpoints": boolean;
    "ddb-importer.dynamic-sync-policy-hitdice": boolean;
    "ddb-importer.dynamic-sync-policy-action-use": boolean;
    "ddb-importer.dynamic-sync-policy-inspiration": boolean;
    "ddb-importer.dynamic-sync-policy-condition": boolean;
    "ddb-importer.dynamic-sync-policy-deathsaves": boolean;
    "ddb-importer.dynamic-sync-policy-spells-prepared": boolean;
    "ddb-importer.dynamic-sync-policy-spells-slots": boolean;
    "ddb-importer.dynamic-sync-policy-spells-sync": boolean;
    "ddb-importer.dynamic-sync-policy-equipment": boolean;
    "ddb-importer.dynamic-sync-policy-xp": boolean;

    // READY: MUNCHER COMPENDIUM_FOLDERS
    "ddb-importer.top-level-compendium-folder": boolean;
    "ddb-importer.munching-selection-compendium-folders-monster": string;
    "ddb-importer.munching-selection-compendium-folders-spell": string;
    "ddb-importer.munching-selection-compendium-folders-item": string;

    // READY: MUNCHER ADVENTURE
    "ddb-importer.adventure-policy-all-scenes": boolean;
    "ddb-importer.adventure-policy-all-actors-into-world": boolean;
    "ddb-importer.adventure-policy-journal-world-actors": boolean;
    "ddb-importer.adventure-policy-add-to-compendiums": boolean;
    "ddb-importer.adventure-policy-import-to-adventure-compendium": boolean;
    "ddb-importer.adventure-policy-use2024-monsters": boolean;

    // READY: MUNCHER MUNCH
    "ddb-importer.munching-policy-update-existing": boolean;
    "ddb-importer.munching-policy-delete-during-update": boolean;
    "ddb-importer.munching-policy-legacy-postfix": boolean;
    "ddb-importer.munching-policy-use-srd-icons": boolean;
    "ddb-importer.munching-policy-use-inbuilt-icons": boolean;
    "ddb-importer.munching-policy-use-ddb-item-icons": boolean;
    "ddb-importer.munching-policy-use-ddb-spell-icons": boolean;
    "ddb-importer.munching-policy-use-ddb-generic-item-icons": boolean;
    "ddb-importer.munching-policy-add-midi-effects": boolean;
    "ddb-importer.munching-policy-add-monster-midi-effects": boolean;
    "ddb-importer.munching-policy-use-chris-premades": boolean;
    "ddb-importer.munching-policy-force-spell-version": string;
    "ddb-importer.munching-policy-hide-description": boolean;
    "ddb-importer.munching-policy-hide-item-name": boolean;
    "ddb-importer.munching-policy-hide-description-choice": string;
    "ddb-importer.munching-policy-monster-items": boolean;
    "ddb-importer.munching-policy-monster-homebrew": boolean;
    "ddb-importer.munching-policy-monster-homebrew-only": boolean;
    "ddb-importer.munching-policy-monster-exact-match": boolean;
    "ddb-importer.munching-policy-item-exact-match": boolean;
    "ddb-importer.munching-policy-spell-exact-match": boolean;
    "ddb-importer.munching-policy-use-source-filter": boolean;
    "ddb-importer.munching-policy-muncher-sources": any[];
    "ddb-importer.munching-policy-muncher-excluded-source-categories": any[];
    "ddb-importer.munching-policy-muncher-monster-types": any[];
    "ddb-importer.munching-policy-monster-use-item-ac": boolean;
    "ddb-importer.munching-policy-monster-retain-biography": boolean;
    "ddb-importer.munching-policy-monster-set-legendary-resource-bar": boolean;
    "ddb-importer.munching-policy-update-world-monster-retain-biography": boolean;
    "ddb-importer.munching-policy-monster-strip-name": boolean;
    "ddb-importer.munching-policy-monster-strip-flag-data": boolean;
    "ddb-importer.munching-policy-item-homebrew": boolean;
    "ddb-importer.munching-policy-item-homebrew-only": boolean;
    "ddb-importer.munching-policy-spell-homebrew": boolean;
    "ddb-importer.munching-policy-spell-homebrew-only": boolean;
    "ddb-importer.munching-policy-use-generic-items": boolean;
    "ddb-importer.munching-policy-remove-weapon-mastery-description": boolean;
    "ddb-importer.munching-policy-character-fetch-homebrew": boolean;
    "ddb-importer.munching-policy-character-only-homebrew": boolean;
    "ddb-importer.munching-policy-character-use-class-filter": boolean;
    "ddb-importer.munching-policy-character-url": string;
    "ddb-importer.munching-policy-character-classes": any[];
    "ddb-importer.munching-policy-disable-monster-art": boolean;

    // READY: MUNCHER MUNCH_ART
    "ddb-importer.munching-policy-use-full-token-image": boolean;
    "ddb-importer.munching-policy-use-token-avatar-image": boolean;
    "ddb-importer.munching-policy-remote-images": boolean;
    "ddb-importer.munching-policy-download-images": boolean;
    "ddb-importer.munching-policy-monster-tokenize": boolean;
    "ddb-importer.munching-policy-monster-wildcard": boolean;
    "ddb-importer.munching-policy-use-srd-monster-images": boolean;
    "ddb-importer.munching-policy-update-images": boolean;
    "ddb-importer.munching-policy-update-world-monster-update-images": boolean;

    // READY: MUNCHER ENCOUNTER
    "ddb-importer.encounter-import-policy-create-scene": boolean;
    "ddb-importer.encounter-import-policy-existing-scene": boolean;
    "ddb-importer.encounter-import-policy-missing-characters": boolean;
    "ddb-importer.encounter-import-policy-missing-monsters": boolean;
    "ddb-importer.encounter-import-policy-create-journal": boolean;
    "ddb-importer.encounter-import-policy-roll-monster-initiative": boolean;
    "ddb-importer.encounter-import-policy-use-ddb-save": boolean;

    // READY: DYNAMIC_SYNC
    "ddb-importer.dynamic-sync": boolean;
    "ddb-importer.dynamic-sync-user": string;

    // READY: PROXY
    "ddb-importer.api-endpoint": string;
    "ddb-importer.cors-endpoint": string;
    "ddb-importer.dynamic-api-endpoint": string;
    "ddb-importer.cors-encode": boolean;
    "ddb-importer.cors-strip-protocol": boolean;
    "ddb-importer.cors-path-prefix": string;
    "ddb-importer.beta-key": string;
    "ddb-importer.patreon-user": string;
    "ddb-importer.cobalt-cookie": string;
    "ddb-importer.cobalt-cookie-local": boolean;
    "ddb-importer.campaign-id": string;

    // READY: DEV
    "ddb-importer.allow-scene-download": boolean;
    "ddb-importer.allow-third-party-scene-download": boolean;
    "ddb-importer.third-party-scenes-partial": boolean;
    "ddb-importer.third-party-scenes-notes-merged": boolean;
    "ddb-importer.allow-dev-generation": boolean;
    "ddb-importer.debug-json": boolean;

    // OTHER MODULES
    "dnd5e.disableConcentration": boolean;
    "dnd5e.metricLengthUnits": boolean;
    "dnd5e.attackRollVisibility": string;
    "dnd5e.challengeVisibility": string;
    "midi-qol.MidiSoundSettings": Record<string, any>;
    "midi-qol.playerControlsInvisibleTokens": boolean;
    "midi-qol.pruneChatLog"
    "midi-qol.RollStats": Record<string, Stats>;
    "midi-qol.ConfigSettings": typeof configSettings;
    "midi-qol.CriticalDamage": string;
    "midi-qol.CriticalDamageGM": string;
    "midi-qol.showGM": boolean;
    "midi-qol.ColoredBorders": string;
    "midi-qol.AutoFastForwardAbilityRolls": boolean;
    "midi-qol.AutoRemoveTargets": string;
    "midi-qol.ForceHideRoll": boolean;
    "midi-qol.EnableWorkflow": boolean;
    "midi-qol.DragDropTarget": boolean;
    "midi-qol.DebounceInterval": number;
    "midi-qol.TargetConfirmation": typeof targetConfirmation;
    "midi-qol.Debug": string;
    "midi-qol.ReplaceDefaultActivities": boolean;
    "midi-qol.UseWeakReferences": boolean;
    "midi-qol.SaveToChatCard": boolean;
    "midi-qol.PreferredGM": string;
    "midi-qol.MidiSoundSettings-backup": Record<string, any>;
    "midi-qol.notificationVersion": string;
    "midi-qol.splashWarnings": boolean;
    "midi-qol.last-run-version": string;
    "midi-qol.instanceId": string;
    "chris-premades.effectInterface": boolean;

  }

    namespace Hooks {
    interface HookConfig {
      "dae.addSpecialDurations": (daeSpecialDurations: Record<string, string>) => void;
      "dae.setFieldData": (fieldData: Record<string, string[]>) => void;
      "dae.addAutoFields": (addAutoFields: Function, fields: { BooleanFormulaField?: any }) => void;
      "dae.ready": (api: any) => void;
      "dae.setupComplete": (api: any) => void;
      "dnd5e.activityConsumption": (activity: Activity, usageConfig: ActivityUseConfiguration, messageConfig: RollMessageConfig, updates: unknown) => boolean | void;
      "dnd5e.applyDamage": (actor: Actor.Implementation, amount: number, options: DamageApplicationOptions) => void;
      "dnd5e.calculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => boolean | void;
      "dnd5e.postAbilityCheckRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postAttackRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postBuildSkillRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildAbilityCheckRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildSavingThrowRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildDeathSaveRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildToolRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postSavingThrowRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postSkillRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postToolRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      // According to dnd5e createdTokens is a Token[], but it is actually a TokenDocument[]
      "dnd5e.postSummon": (activity: Activity, profile: unknown, tokens: TokenDocument.Implementation[], options: unknown) => void;
      "dnd5e.postUseActivity": (activity: Activity, usageConfig: ActivityUseConfiguration, results: unknown) => boolean;
      "dnd5e.postUseLinkedSpell": (activity: Activity, usageConfig: ActivityUseConfiguration, results: unknown) => void;
      "dnd5e.preActivityConsumption": (activity: Activity, usageConfig: ActivityUseConfiguration, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preApplyDamage": (actor: Actor.Implementation, amount: number, updates: Actor.UpdateData, options: DamageApplicationOptions) => boolean | void;
      "dnd5e.preCalculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => boolean | void;
      "dnd5e.preConfigureInitiative": (actor: Actor.Implementation, rollConfig: { data: AnyMutableObject, parts: string[], options: D20RollOptions }) => void;
      "dnd5e.preCreateActivityTemplate": (activity: Activity, templateData: MeasuredTemplateDocument.CreateData) => boolean | void;
      "dnd5e.preRollAbilityCheck": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollAttack": (rollConfig: RollProcessConfig & { attackMode: string }, dialogConfig: RollDialogConfig, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preRollAttackV2": (rollConfig: RollProcessConfig & { attackMode: string }, dialogConfig: RollDialogConfig, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preRollConcentration": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDamage": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDeathSave": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollSavingThrow": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollSkill": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollTool": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preUseActivity": (activity: Activity, usageConfig: AnyMutableObject, dialogConfig: AnyMutableObject, messageConfig: AnyMutableObject) => boolean | void;
      "dnd5e.restCompleted": (actor: Actor.Implementation, result: { longRest: boolean; newDay: boolean }, config: unknown) => void;
      "dnd5e.rollAttack": (rolls: Roll[], data: { subject: Activity | null, ammoUpdate: { id: string, destroy: boolean; quantity: number } | null }) => void;
      "dnd5e.rollConcentration": (rolls: Roll[], data: { subject?: Actor.Implementation }) => void;
      "dnd5e.rollDamage": (rolls: Roll[], data?: { subject?: Activity }) => void;
      "dnd5e.rollDeathSave": (rolls: Roll[], data: { chatString: string; updates: Actor.UpdateData; subject: Actor.Implementation }) => boolean | void;
      "midi-qol.ConfigSettingsChanged": () => void;
      "midi-qol.RollComplete": (workflow: Workflow) => Promise<void>;
      "midi-qol.dnd5ePreCalculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => boolean | void;
      "midi-qol.dnd5eCalculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => void;
      "midi-qol.preItemRoll": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.preAttackRoll": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.preAttackRollConfig": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.AttackRollComplete": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.DamageRollComplete": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.StatsUpdated": () => void;
      "midi-qol.addUndoEntry": (data: UndoData) => void;
      "midi-qol.midiReady": () => void;
      "midi-qol.ready": () => void;
      "midi-qol.removeUndoEntry": (data?: UndoData) => void;
      "midi-qol.setup": (data: typeof globalThis.MidiQOL) => void;
      "midi-qol.targeted": (targets: Set<Token.Implementation> | undefined) => void;
      "midi-qol.dependentsRegistryChanged": (event: RegistryChangeEvent) => void;
      "midi-qol-setup-wizard.launch": () => void;
      "getHeaderControlsActivitySheet": (app: foundry.applications.api.Application /*dnd5e.applications.activity.activitySheet*/ , buttons: any[]) => void;
      "tidy5e-sheet.ready": (api: any) => void;
      "simplecover5eReady": () => void;
    }
  }


  interface FlagConfig {
    ActiveEffect: {
      ActiveAuras?: {
        isAura?: boolean;
        ignoreSelf?: boolean;
      }
      dnd5e?: {
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



// Temporary, so that I can at least type them to _something_
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActivitySave = {
  ability: Set<string>;
  dc: {
    calculation: string;
    formula: string;
    value: number
  };
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActivityCheck = {
  ability: string;
  associated: Set<string>;
  dc: {
    calculation: string;
    formula: string;
    value: number
  };
}

export interface ActivityEffectData {
  _id: string;
  get effect(): ActiveEffect.Implementation | undefined;
  onSave?: boolean;
}


export interface Activity extends AnyMutableObject {
  get applicableEffects(): ActiveEffect[] | null;
  actor?: Actor.Implementation;
  item: Item.Implementation;
  ammunitionItem?: Item.Implementation;
  name: string;
  uses: {
    spent: number;
    max: number;
    get value(): number;
    recovery: unknown[];
  }
  consumption: {
    scaling: {
      allowed: boolean;
      max: string;
    };
    spellSlot: boolean;
    targets: {
      type: string;
      target: string;
      value: string;
      scaling: {
        mode: string;
        formula: string;
      }
    }[];
  };
  effects: ActivityEffectData[];
  attack?: {
    ability: string;
    bonus: string;
    critical: {
      threshold: number;
    };
    flat: boolean;
    type: {
      value: string;
      classification: string;
    };
    damage: {};
  };
  damage?: {
    critical: {
      allow: boolean;
      bonus: string;
    };
    parts: {
      number: number;
      denomination: number;
      bonus: string;
      types: Set<string>;
      custom: {
        enabled: boolean;
        formula: string;
      };
      scaling: {
        mode: string;
        number: number;
        formula: string;
      };
    }[];
    // midi stuff
    onSave: string;
  };
  range?: {
    units?: string;
    reach?: number;
    value?: number;
    long?: number;
  }
  healing?: {
    number: number;
    denomination: number;
    bonus: string;
    types: Set<string>;
    custom: {
      enabled: boolean;
      formula: string;
    };
    scaling: {
      mode: string;
      number: number;
      formula: string;
    };
  };
  overTimeProperties?: {
    turnChoice?: string;
    saveRemoves?: boolean;
    rollAs?: string;
    preRemoveConditionText?: string;
    postRemoveConditionText?: string;
    removeConditionBeforeActivity?: boolean;
    removeConditionText?: string;
  }
  metadata: {
    title: string;
    img: string;
    label: string;
    name: string;
    type: string;
    usage: {
      actions: unknown;
      chatCard: string;
      dialog: unknown;
    };
  };
  refund: (consumed: unknown) => Promise<void>;
  getRollData: () => AnyMutableObject;
  rollAttack?(config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig): Promise<Roll[] | null>;
  rollDamage(config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig): Promise<Roll[] | void>;
  rollFormula?(config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig): Promise<Roll[] | void>;
  // Consumption and scaling methods/properties
  canScale?: boolean;
  _prepareUsageConfig: (config: object) => object;
  _prepareUsageUpdates: (config: object, options?: { returnErrors?: boolean }) => Promise<any>;
  // consume() method for consuming activity resources - returns consumed delta data or false if cancelled
  consume: (usageConfig: object, messageConfig: object) => Promise<object | false>;
  roll?: {
    formula?: string;
  };
  duration: {
    concentration?: boolean;
    override?: boolean;
    scalar?: boolean;
    special: string;
    units: string;
    value: number;
  }
  target: {
    template: {
      count: string;
      contiguous: boolean;
      type: string;
      size: string;
      width: string;
      height: string;
      units: string;
    };
    affects: {
      count: string;
      type: string;
      choice: boolean;
      special: string;
    }
  };
  activation: {
    type: string;
    value: number;
    condition: string;
    cost?: number;
  };
  save?: ActivitySave;
  check?: ActivityCheck;
  getAbility?: (associated: string) => string | null;
  hasDamage: boolean;
  hasHealing: boolean;
  actionType: string;
  uuid: string;
  otherActivity?: Activity | null;
  type: string;
  useCondition: string;
  effectCondition: string;
  setupCanSeeSense: (usage: { workflow?: Workflow }) => Promise<void>;
  getTriggeredActivity: () => Promise<Activity | undefined>;
  macro: Macro.Implementation;
  midiProperties?: {
    ignoreTraits: Set<string>;
    triggeredActivityId: string;
    triggeredActivityConditionText?: string;
    triggeredActivityTargets: string;
    triggeredActivityRollAs?: string;
    autoConsume: boolean;
    forceConsumeDialog?: string;
    forceRollDialog?: string;
    forceDamageDialog?: string;
    confirmTargets: string;
    autoTargetType: string;
    autoTargetAction?: string;
    automationOnly?: boolean;
    otherActivityCompatible?: boolean;
    identifier?: string;
    displayActivityName?: boolean;
    rollMode: keyof CONFIG.Dice.RollModes;
    chooseEffects?: boolean;
    toggleEffect?: boolean;
    ignoreFullCover?: boolean;
    removeChatButtons: string;
    magicEffect?: boolean;
    magicDamage?: boolean;
    noConcentrationCheck?: boolean;
    skipConcentrationCheck?: boolean;
    autoCEEffects: string;
  }
  // Midi mixin methods
  hasConsumption: () => boolean;
  shouldAutoConsume: (workflow?: Workflow) => boolean;
  deferOtherDamage: (config: RollProcessConfig, dialog: RollDialogConfig) => boolean;
  rollOtherDamage: (config: RollProcessConfig, dialog: RollDialogConfig) => Promise<Roll[] | undefined>;
}

// 5e definitions, with midi special sauce(?)
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DamageDescription = {
  value: number;
  type: string;
  properties: Set<string>;
  active?: {
    multiplier?: number;
    modifications?: boolean;
    resistance?: boolean;
    vulnerability?: boolean;
    immunity?: boolean;
    // midi additions
    absorption?: boolean;
    DR?: boolean;
    spell?: boolean;
    magic?: boolean;
    nonmagic?: boolean;
    superSaver?: boolean;
    semiSuperSaver?: boolean;
    saved?: boolean;
    uncannyDodge?: boolean;
  };
  damage?: number;
  formula?: string;
  allActives?: string[];
};

