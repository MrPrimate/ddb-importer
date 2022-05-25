import { DirectoryPicker } from "./lib/DirectoryPicker.js";

const SETTINGS = {
  MODULE_ID: "ddb-importer",
  FLAG_NAME: "ddbimporter",
  MODULE_NAME: "D&D Beyond Importer",
  DEFAULT_SETTINGS: {
    // these settigs are loaded during renderSidebarTab
    EARLY: {
      "log-level": {
        name: "ddb-importer.settings.log-level.name",
        hint: "ddb-importer.settings.log-level.hint",
        scope: "world",
        config: true,
        type: String,
        choices: {
          DEBUG: "DEBUG",
          INFO: "INFO",
          WARN: "WARN",
          ERR: "ERROR ",
          OFF: "OFF",
        },
        default: "INFO",
      },
      "show-munch-top": {
        name: "ddb-importer.settings.show-munch-top.name",
        hint: "ddb-importer.settings.show-munch-top.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      },
      "patreon-tier": {
        scope: "world",
        config: false,
        type: String,
        default: null,
      },
      "custom-proxy": {
        name: "ddb-importer.settings.custom-proxy.name",
        hint: "ddb-importer.settings.custom-proxy.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
      },
      "encounter-muncher-enabled": {
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
      },
    },
    // ready settings
    READY: {
      // settings for settings management
      SETTINGS: {
        "auto-create-compendium": {
          type: Boolean,
          default: true,
        },
      },
      COMPENDIUMS: {
        "entity-background-compendium": {
          type: String,
        },
        "entity-item-compendium": {
          type: String,
        },
        "entity-feature-compendium": {
          type: String,
        },
        "entity-class-compendium": {
          type: String,
        },
        "entity-race-compendium": {
          type: String,
        },
        "entity-trait-compendium": {
          type: String,
        },
        "entity-feat-compendium": {
          type: String,
        },
        "entity-spell-compendium": {
          type: String,
        },
        "entity-override-compendium": {
          type: String,
        },
        "entity-table-compendium": {
          type: String,
        },
        "entity-monster-compendium": {
          type: String,
        },
      },
      // dir locations
      DIRECTORIES: {
        "image-upload-directory": {
          name: "ddb-importer.settings.image-upload-directory.name",
          hint: "ddb-importer.settings.image-upload-directory.hint",
          type: DirectoryPicker.Directory,
          default: "[data] ddb-images/characters",
        },
        "other-image-upload-directory": {
          name: "ddb-importer.settings.image-upload-directory.name",
          hint: "ddb-importer.settings.image-upload-directory.hint",
          type: DirectoryPicker.Directory,
          default: "[data] ddb-images/other",
        },
        "frame-image-upload-directory": {
          type: DirectoryPicker.Directory,
          default: "[data] ddb-images/frames",
        },
        "adventure-import-path": {
          name: "ddb-importer.settings.adventure-import-path.name",
          hint: "ddb-importer.settings.adventure-import-path.hint",
          config: true,
          default: "[data] adventures/import",
          type: DirectoryPicker.Directory,
        },
        "adventure-upload-path": {
          name: "ddb-importer.settings.adventure-upload-path.name",
          hint: "ddb-importer.settings.adventure-upload-path.hint",
          config: true,
          default: "[data] ddb-images/adventures",
          type: DirectoryPicker.Directory,
        },
        "adventure-misc-path": {
          name: "ddb-importer.settings.adventure-misc-path.name",
          hint: "ddb-importer.settings.adventure-misc-path.hint",
          config: true,
          default: "[data] ddb-images/adventures/misc",
          type: DirectoryPicker.Directory,
        },
      },
      UI: {
        "monster-link-title": {
          name: "ddb-importer.settings.monster-link-title.name",
          hint: "ddb-importer.settings.monster-link-title.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "character-link-title": {
          name: "ddb-importer.settings.character-link-title.name",
          hint: "ddb-importer.settings.character-link-title.hint",
          config: true,
          type: Boolean,
          default: false,
        },
        "link-title-colour-white": {
          name: "ddb-importer.settings.link-title-colour-white.name",
          hint: "ddb-importer.settings.link-title-colour-white.hint",
          config: true,
          type: Boolean,
          default: false,
        },
        "show-munch-top": {
          name: "ddb-importer.settings.show-munch-top.name",
          hint: "ddb-importer.settings.show-munch-top.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "show-image-to-players": {
          name: "ddb-importer.settings.show-image-to-players.name",
          hint: "ddb-importer.settings.show-image-to-players.hint",
          config: true,
          type: Boolean,
          default: true,
        },
      },
      PERMISSIONS: {
        "restrict-to-trusted": {
          name: "ddb-importer.settings.restrict-to-trusted.name",
          hint: "ddb-importer.settings.restrict-to-trusted.hint",
          config: true,
          type: Boolean,
          default: false,
        },
        "allow-all-sync": {
          name: "ddb-importer.settings.allow-all-sync.name",
          hint: "ddb-importer.settings.allow-all-sync.hint",
          config: true,
          type: Boolean,
          default: false,
        },
      },
      PARSING: {
        "use-full-source": {
          name: "ddb-importer.settings.use-full-source.name",
          hint: "ddb-importer.settings.use-full-source.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "use-damage-hints": {
          name: "ddb-importer.settings.use-damage-hints.name",
          hint: "ddb-importer.settings.use-damage-hints.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "add-damage-restrictions-to-hints": {
          name: "ddb-importer.settings.add-damage-restrictions-to-hints.name",
          hint: "ddb-importer.settings.add-damage-restrictions-to-hints.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "embed-macros": {
          name: "ddb-importer.settings.embed-macros.name",
          hint: "ddb-importer.settings.embed-macros.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "add-description-to-chat": {
          name: "ddb-importer.settings.add-description-to-chat.name",
          hint: "ddb-importer.settings.add-description-to-chat.hint",
          type: Boolean,
          default: false,
        },
      },
      // ????
      MISC: {
        "use-webp": {
          name: "ddb-importer.settings.use-webp.name",
          hint: "ddb-importer.settings.use-webp.hint",
          type: Boolean,
          default: false,
        },
        "webp-quality": {
          name: "ddb-importer.settings.webp-quality.name",
          hint: "ddb-importer.settings.webp-quality.hint",
          type: Number,
          default: 0.9,
        },
        "settings-call-muncher": {
          type: Boolean,
          default: false,
        },
        "update-check": {
          type: Boolean,
          default: true,
        },
      },
      // character settings
      CHARACTER: {
        IMPORT: {
          "pact-spells-prepared": {
            type: Boolean,
            default: false,
          },
          "character-update-policy-add-character-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-race-damages": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-race-speed": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-race-senses": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-race-hp": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-race-spell-bonus": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-effect-class-damages": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-class-speed": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-class-senses": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-class-hp": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-class-spell-bonus": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-effect-feat-proficiencies": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-feat-languages": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-feat-damages": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-feat-speed": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-feat-senses": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-feat-hp": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-feat-spell-bonus": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-effect-feat-ability-bonus": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-proficiencies": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-languages": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-damages": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-speed": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-senses": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-hp": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-effect-background-spell-bonus": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-effect-background-ability-bonus": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-scalevalue": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-scalevalue-description": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-scalevalue-description-all": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-add-item-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-add-spell-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-generate-ac-feature-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-existing": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-ignore-non-ddb-items": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-override": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-srd": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-name": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-hp": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-hit-die": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-class": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-feat": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-weapon": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-equipment": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-bio": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-languages": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-import-extras": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-inventory": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-currency": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-spell": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-image": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-ddb-spell-icons": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-ddb-generic-item-icons": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-ddb-item-icons": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-inbuilt-icons": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-srd-icons": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-full-description": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-action-and-feature": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-actions-as-features": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-dae-copy": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-dae-effect-copy": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-active-effect-copy": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-active-effect-character-copy": {
            scope: "player",
            type: Boolean,
            default: false,
          },
        },
        SYNC: {
          "sync-policy-currency": {
            name: "ddb-importer.settings.sync-policy-currency.name",
            hint: "ddb-importer.settings.sync-policy-currency.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-hitpoints": {
            name: "ddb-importer.settings.sync-policy-hitpoints.name",
            hint: "ddb-importer.settings.sync-policy-hitpoints.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-hitdice": {
            name: "ddb-importer.settings.sync-policy-hitdice.name",
            hint: "ddb-importer.settings.sync-policy-hitdice.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-action-use": {
            name: "ddb-importer.settings.sync-policy-action-use.name",
            hint: "ddb-importer.settings.sync-policy-action-use.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-inspiration": {
            name: "ddb-importer.settings.sync-policy-inspiration.name",
            hint: "ddb-importer.settings.sync-policy-inspiration.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-condition": {
            name: "ddb-importer.settings.sync-policy-condition.name",
            hint: "ddb-importer.settings.sync-policy-condition.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-deathsaves": {
            name: "ddb-importer.settings.sync-policy-deathsaves.name",
            hint: "ddb-importer.settings.sync-policy-deathsaves.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-spells-prepared": {
            name: "ddb-importer.settings.sync-policy-spells-prepared.name",
            hint: "ddb-importer.settings.sync-policy-spells-prepared.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-spells-slots": {
            name: "ddb-importer.settings.sync-policy-spells-slots.name",
            hint: "ddb-importer.settings.sync-policy-spells-slots.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-spells-sync": {
            name: "ddb-importer.settings.sync-policy-spells-sync.name",
            hint: "ddb-importer.settings.sync-policy-spells-sync.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-equipment": {
            name: "ddb-importer.settings.sync-policy-equipment.name",
            hint: "ddb-importer.settings.sync-policy-equipment.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "sync-policy-xp": {
            name: "ddb-importer.settings.sync-policy-xp.name",
            hint: "ddb-importer.settings.sync-policy-xp.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
        },
        DYNAMIC_SYNC: {
          "dynamic-sync-policy-currency": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-hitpoints": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-hitdice": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-action-use": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-inspiration": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-condition": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-deathsaves": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-spells-prepared": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-spells-slots": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-spells-sync": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-equipment": {
            type: Boolean,
            default: true,
          },
          "dynamic-sync-policy-xp": {
            type: Boolean,
            default: true,
          },
        },
      },
      // muncher settings
      MUNCHER: {
        COMPENDIUM_FOLDERS: {
          "munching-selection-compendium-folders-monster": {
            name: "ddb-importer.settings.munching-selection-compendium-folders-monster.name",
            hint: "ddb-importer.settings.munching-selection-compendium-folders-monster.hint",
            config: true,
            type: String,
            choices: {
              TYPE: "Creature type, e.g. Undead",
              CR: "Challenge Rating",
              ALPHA: "Alphabetical",
            },
            default: "TYPE",
          },
          "munching-selection-compendium-folders-spell": {
            name: "ddb-importer.settings.munching-selection-compendium-folders-spell.name",
            hint: "ddb-importer.settings.munching-selection-compendium-folders-spell.hint",
            config: true,
            type: String,
            choices: {
              SCHOOL: "School of Magic",
              LEVEL: "Level",
            },
            default: "SCHOOL",
          },
          "munching-selection-compendium-folders-item": {
            name: "ddb-importer.settings.munching-selection-compendium-folders-item.name",
            hint: "ddb-importer.settings.munching-selection-compendium-folders-item.hint",
            config: true,
            type: String,
            choices: {
              TYPE: "Item Type",
              RARITY: "Rarity",
            },
            default: "TYPE",
          },
        },
        MUNCH: {
          "munching-policy-update-existing": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-srd": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-exclude-legacy": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-compendium-folders": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-srd-icons": {
            name: "ddb-importer.settings.munching-policy-use-srd-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-srd-icons.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-inbuilt-icons": {
            name: "ddb-importer.settings.munching-policy-use-inbuilt-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-inbuilt-icons.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-item-icons": {
            name: "ddb-importer.settings.munching-policy-use-ddb-item-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-ddb-item-icons.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-spell-icons": {
            name: "ddb-importer.settings.munching-policy-use-ddb-spell-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-ddb-spell-icons.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-generic-item-icons": {
            name: "ddb-importer.settings.munching-policy-use-ddb-generic-item-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-ddb-generic-item-icons.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-full-token-image": {
            name: "ddb-importer.settings.munching-policy-use-full-token-image.name",
            hint: "ddb-importer.settings.munching-policy-use-full-token-image.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-token-avatar-image": {
            name: "ddb-importer.settings.munching-policy-use-token-avatar-image.name",
            hint: "ddb-importer.settings.munching-policy-use-token-avatar-image.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-remote-images": {
            name: "ddb-importer.settings.munching-policy-remote-images.name",
            hint: "ddb-importer.settings.munching-policy-remote-images.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "munching-policy-add-effects": {
            name: "ddb-importer.settings.munching-policy-add-effects.name",
            hint: "ddb-importer.settings.munching-policy-add-effects.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-add-spell-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-add-monster-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-add-ac-armor-effects": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-download-images": {
            name: "ddb-importer.settings.munching-policy-download-images.name",
            hint: "ddb-importer.settings.munching-policy-download-images.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-dae-copy": {
            name: "ddb-importer.settings.munching-policy-dae-copy.name",
            hint: "ddb-importer.settings.munching-policy-dae-copy.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-dae-effects": {
            name: "ddb-importer.settings.munching-policy-use-dae-effects.name",
            hint: "ddb-importer.settings.munching-policy-use-dae-effects.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-hide-description": {
            name: "ddb-importer.settings.munching-policy-hide-description.name",
            hint: "ddb-importer.settings.munching-policy-hide-description.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-items": {
            name: "ddb-importer.settings.munching-policy-monster-items.name",
            hint: "ddb-importer.settings.munching-policy-monster-items.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-homebrew": {
            name: "ddb-importer.settings.munching-policy-monster-homebrew.name",
            hint: "ddb-importer.settings.munching-policy-monster-homebrew.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-homebrew-only": {
            name: "ddb-importer.settings.munching-policy-monster-homebrew-only.name",
            hint: "ddb-importer.settings.munching-policy-monster-homebrew-only.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-tokenize": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-update-images": {
            name: "ddb-importer.settings.munching-policy-update-images.name",
            hint: "ddb-importer.settings.munching-policy-update-images.hint",
            scope: "player",
            type: Boolean,
            default: true,
          },
          "munching-policy-monster-exact-match": {
            name: "ddb-importer.settings.munching-policy-monster-match.name",
            hint: "ddb-importer.settings.munching-policy-monster-match.hint",
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-source-filter": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-muncher-sources": {
            scope: "player",
            type: Array,
            default: [],
          },
          "munching-policy-monster-use-item-ac": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-retain-biography": {
            type: Boolean,
            default: false,
          },
          "munching-policy-update-world-monster-update-images": {
            type: Boolean,
            default: true,
          },
          "munching-policy-update-world-monster-retain-biography": {
            type: Boolean,
            default: true,
          },
        },
        ENCOUNTER: {
          "encounter-import-policy-create-scene": {
            type: Boolean,
            default: true,
          },
          "encounter-import-policy-existing-scene": {
            type: Boolean,
            default: false,
          },
          "encounter-import-policy-missing-characters": {
            type: Boolean,
            default: true,
          },
          "encounter-import-policy-missing-monsters": {
            type: Boolean,
            default: true,
          },
          "encounter-import-policy-create-journal": {
            type: Boolean,
            default: true,
          },
          "encounter-import-policy-roll-monster-initiative": {
            type: Boolean,
            default: false,
          },
          "encounter-import-policy-use-ddb-save": {
            type: Boolean,
            default: false,
          },
        },
      },
      DYNAMIC_SYNC: {
        "dynamic-sync": {
          type: Boolean,
          default: false,
        },
        "dynamic-sync-user": {
          type: String,
          default: "",
        },
      },
      PROXY: {
        "api-endpoint": {
          type: String,
          default: "https://proxy.ddb.mrprimate.co.uk",
        },
        "cors-endpoint": {
          type: String,
          default: "https://images.ddb.mrprimate.co.uk/",
        },
        "dynamic-api-endpoint": {
          type: String,
          default: "https://dynamic.ddb.mrprimate.co.uk",
        },
        "cors-encode": {
          type: Boolean,
          default: false,
        },
        "beta-key": {
          type: String,
          default: "",
        },
        "patreon-user": {
          type: String,
          default: null,
        },
        "cobalt-cookie": {
          name: "ddb-importer.settings.cobalt-cookie.name",
          hint: "ddb-importer.settings.cobalt-cookie.hint",
          type: String,
          default: "",
        },
        "cobalt-cookie-local": {
          name: "ddb-importer.settings.cobalt-cookie-local.name",
          hint: "ddb-importer.settings.cobalt-cookie-local.hint",
          type: Boolean,
          default: true,
        },
        "campaign-id": {
          name: "ddb-importer.settings.campaign-id.name",
          hint: "ddb-importer.settings.campaign-id.hint",
          type: String,
          default: "",
        },
      },
      // dev settings
      DEV: {
        "allow-scene-download": {
          type: Boolean,
          default: false,
        },
        "allow-third-party-scene-download": {
          type: Boolean,
          default: false,
        },
        "third-party-scenes-partial": {
          type: Boolean,
          default: false,
        },
        "allow-note-generation": {
          type: Boolean,
          default: false,
        },
        "debug-json": {
          scope: "player",
          type: Boolean,
          default: false,
        },
        "adventure-muncher-full-config": {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  GET_DEFAULT_SETTINGS(early = false) {
    const clone = foundry.utils.deepClone(SETTINGS.DEFAULT_SETTINGS);
    let defaultSettings = early
      ? clone.EARLY
      : {
        ...clone.READY.DEV,
        ...clone.READY.SETTINGS,
        ...clone.READY.PROXY,
        ...clone.READY.COMPENDIUMS,
        ...clone.READY.DIRECTORIES,
        ...clone.READY.UI,
        ...clone.READY.PERMISSIONS,
        ...clone.READY.PARSING,
        ...clone.READY.MISC,
        ...clone.READY.CHARACTER.IMPORT,
        ...clone.READY.CHARACTER.SYNC,
        ...clone.READY.DYNAMIC_SYNC,
        ...clone.READY.CHARACTER.DYNAMIC_SYNC,
        ...clone.READY.MUNCHER.COMPENDIUM_FOLDERS,
        ...clone.READY.MUNCHER.MUNCH,
        ...clone.READY.MUNCHER.ENCOUNTER,
      };

    for (const [name, data] of Object.entries(defaultSettings)) {
      defaultSettings[name] = mergeObject({ scope: "world", config: false }, data);
    }
    return defaultSettings;
  },
};

export default SETTINGS;
