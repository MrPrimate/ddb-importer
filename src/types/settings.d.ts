export {};

declare global {

  interface PartialSettingConfig {
    name?: string;
    hint?: string;
    scope?: string;
    config?: boolean;
    type: any;
    choices?: Record<string, string>;
    default: any;
    onChange?: (value: any) => void;
    requiresReload?: boolean;
    filePicker?: string;
    [key: string]: any;
  }

  interface CompleteSettingConfig extends PartialSettingConfig {
    scope: string;
    config: boolean;
  }

  type SettingsRecord = Record<string, PartialSettingConfig>;
  type RegisteredSettingsRecord = Record<string, CompleteSettingConfig>;

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

}
