import { PatreonHelper } from "../../lib/_module.mjs";
import { COMPENDIUM_REMOVE_FLAGS, COMPENDIUMS, FOUNDRY_COMPENDIUM_LOOKUPS, FOUNDRY_COMPENDIUM_MAP, SRD_COMPENDIUM_LOOKUPS } from "./compendiums/compendiums.mjs";
import DICTIONARY from "../dictionary/dictionary.mjs";

const SUPPORTED_FLAG_GROUPS = [
  "advancedspelleffects",
  "arbron-summoner",
  "autoanimations",
  "automated-evocations",
  "automated-polymorpher",
  "boomingBladeChoice",
  "cf",
  "dae",
  "enhancedcombathud",
  "favtab",
  "forien-unidentified-items",
  "gm-notes",
  "gng",
  "greenFlameBladeChoice",
  "GritNGlory",
  "inventory-plus",
  "itemacro",
  "itemmacro",
  "levels-3d-preview",
  "maestro",
  "mess",
  "midi-qol",
  "obsidian",
  "siftoolkit",
  "spell-class-filter-for-5e",
  "tidy5e-sheet-kgar",
  "spellbook-assistant-manager",
  "tagger",
  "tidy5e-sheet",
];

const EFFECTS_IGNORE_FLAG_GROUPS = [
  "dae",
  "midi-qol",
  "itemacro",
  "itemmacro",
];

const GAME_FOLDER_LOOKUPS = [
  {
    type: "itemSpells",
    folder: "magic-item-spells",
    itemType: "spell",
  },
  {
    type: "magicItems",
    folder: "magic-items",
    itemType: "item",
  },
  {
    type: "spells",
    folder: "spell",
    itemType: "spell",
  },
  {
    type: "monsters",
    folder: "npc",
    itemType: "actor",
  },
];

const URLS = {
  BASE: "ddb.mrprimate.co.uk",
  PROXY: "https://proxy.ddb.mrprimate.co.uk",
  CORS: "https://images.ddb.mrprimate.co.uk/",
  DYNAMIC: "https://dynamic.ddb.mrprimate.co.uk",
};

const MUNCH_DEFAULTS = [
  { name: "munching-policy-update-existing", needed: true },
  { name: "munching-policy-use-inbuilt-icons", needed: true },
  { name: "munching-policy-use-srd-icons", needed: false },
  { name: "munching-policy-use-srd-monster-images", needed: false },
  { name: "munching-policy-download-images", needed: true },
  { name: "munching-policy-remote-images", needed: false },
  { name: "munching-policy-hide-description", needed: false },
  { name: "munching-policy-monster-items", needed: false },
  { name: "munching-policy-update-images", needed: false },
];

const FILTER_SECTIONS = ["classes", "race", "features", "actions", "inventory", "spells"];

const DISABLE_FOUNDRY_UPGRADE = {
  applyFeatures: false,
  addFeatures: false,
  promptAddFeatures: false,
};

// reference to the D&D Beyond popup
const POPUPS = {
  json: null,
  web: null,
};

const MODULE_ID = "ddb-importer";

function activeUpdate() {
  const tiers = PatreonHelper.calculateAccessMatrix(PatreonHelper.getPatreonTier());
  const available = tiers.god || tiers.undying || tiers.experimentalMid;
  if (!available) return false;
  const dynamicSync = game.settings.get(MODULE_ID, "dynamic-sync");
  const updateUser = game.settings.get(MODULE_ID, "dynamic-sync-user");
  const gmSyncUser = game.user.isGM && game.user.id == updateUser;
  return dynamicSync && gmSyncUser;
}

const SETTINGS = {
  MODULE_ID: "ddb-importer",
  FLAG_NAME: "ddbimporter",
  MODULE_NAME: "D&D Beyond Importer",
  DICTIONARY,
  COMPENDIUMS: COMPENDIUMS,
  SRD_COMPENDIUMS: SRD_COMPENDIUM_LOOKUPS,
  FOUNDRY_COMPENDIUM_MAP: FOUNDRY_COMPENDIUM_MAP,
  FOUNDRY_COMPENDIUMS: FOUNDRY_COMPENDIUM_LOOKUPS,
  EFFECTS_IGNORE_FLAG_GROUPS,
  SUPPORTED_FLAG_GROUPS,
  GAME_FOLDER_LOOKUPS,
  COMPENDIUM_REMOVE_FLAGS: COMPENDIUM_REMOVE_FLAGS,
  ADVENTURE_FLAG: "isDDBAdventure",
  ADVENTURE_CSS: "ddbAdventure",
  URLS,
  POPUPS,
  DISABLE_FOUNDRY_UPGRADE,
  FILTER_SECTIONS,
  MUNCH_DEFAULTS,
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
          VERBOSE: "VERBOSE",
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
        requiresReload: true,
      },
      "encounter-muncher-enabled": {
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
        requiresReload: true,
      },
      "developer-mode": {
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
      },
      "add-ddb-languages": {
        name: "ddb-importer.settings.add-ddb-languages.name",
        hint: "ddb-importer.settings.add-ddb-languages.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      },
      "register-source-books": {
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
      },
      "no-source-book-pages": {
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
      },
      "use-basic-rules": {
        name: "ddb-importer.settings.use-basic-rules.name",
        hint: "ddb-importer.settings.use-basic-rules.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
      },
      "ddb-compendium-banner": {
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
      },
      "disable-tattoo-type": {
        name: "ddb-importer.settings.disable-tattoo-type.name",
        hint: "ddb-importer.settings.disable-tattoo-type.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        requiresReload: true,
      },
      "allowed-weapon-property-sources": {
        config: false,
        scope: "world",
        type: Array,
        default: [],
      },
      "add-extra-base-weapons": {
        name: "ddb-importer.settings.add-extra-base-weapons.name",
        hint: "ddb-importer.settings.add-extra-base-weapons.hint",
        scope: "world",
        config: true,
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
      COMPENDIUMS: Object.fromEntries(
        COMPENDIUMS.map((comp) => [comp.setting, {
          name: comp.title,
          type: String,
          default: `DDB ${comp.title}`,
        }]),
      ),
      // dir locations
      DIRECTORIES: {
        "image-upload-directory": {
          name: "ddb-importer.settings.image-upload-directory.name",
          hint: "ddb-importer.settings.image-upload-directory.hint",
          type: String,
          filePicker: "folder",
          default: "[data] ddb-images/characters",
        },
        "other-image-upload-directory": {
          name: "ddb-importer.settings.other-image-upload-directory.name",
          hint: "ddb-importer.settings.other-image-upload-directory.hint",
          type: String,
          filePicker: "folder",
          default: "[data] ddb-images/other",
        },
        "frame-image-upload-directory": {
          name: "ddb-importer.settings.frame-image-upload-directory.name",
          hint: "ddb-importer.settings.frame-image-upload-directory.hint",
          type: String,
          filePicker: "folder",
          default: "[data] ddb-images/frames",
        },
        "adventure-upload-path": {
          name: "ddb-importer.settings.adventure-upload-path.name",
          hint: "ddb-importer.settings.adventure-upload-path.hint",
          default: "[data] ddb-images/adventures",
          type: String,
          filePicker: "folder",
        },
        "adventure-misc-path": {
          name: "ddb-importer.settings.adventure-misc-path.name",
          hint: "ddb-importer.settings.adventure-misc-path.hint",
          default: "[data] ddb-images/adventures/misc",
          type: String,
          filePicker: "folder",
        },
        "persistent-storage-location": {
          name: "ddb-importer.settings.persistent-storage-location.name",
          hint: "ddb-importer.settings.persistent-storage-location.hint",
          scope: "world",
          config: false,
          type: String,
          filePicker: "folder",
          default: `[data] modules/ddb-importer/storage`,
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
        "show-read-alouds-button": {
          name: "ddb-importer.settings.show-read-alouds-button.name",
          hint: "ddb-importer.settings.show-read-alouds-button.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "show-read-alouds-all-content": {
          name: "ddb-importer.settings.show-read-alouds-all-content.name",
          hint: "ddb-importer.settings.show-read-alouds-all-content.hint",
          config: true,
          type: Boolean,
          default: false,
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
        "show-resource-chooser-default": {
          name: "ddb-importer.settings.show-resource-chooser-default.name",
          hint: "ddb-importer.settings.show-resource-chooser-default.hint",
          config: true,
          type: Boolean,
          default: false,
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
        "no-item-macros": {
          name: "ddb-importer.settings.no-item-macros.name",
          hint: "ddb-importer.settings.no-item-macros.hint",
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
        "use-loose-srd-reference-matching": {
          name: "ddb-importer.settings.use-loose-srd-reference-matching.name",
          hint: "ddb-importer.settings.use-loose-srd-reference-matching.hint",
          config: true,
          type: Boolean,
          default: true,
        },
        "use-super-loose-srd-reference-matching": {
          // name: "ddb-importer.settings.use-super-loose-srd-reference-matching.name",
          // hint: "ddb-importer.settings.use-super-loose-srd-reference-matching.hint",
          config: false,
          type: Boolean,
          default: false,
        },
        "spells-on-items-as-activities": {
          name: "ddb-importer.settings.spells-on-items-as-activities.name",
          hint: "ddb-importer.settings.spells-on-items-as-activities.hint",
          config: false,
          type: Boolean,
          default: false,
        },
        "separate-ac-effects": {
          name: "ddb-importer.settings.separate-ac-effects.name",
          hint: "ddb-importer.settings.separate-ac-effects.hint",
          config: false,
          type: Boolean,
          default: true,
        },
        "effects-uses-macro-status-effects": {
          name: "ddb-importer.settings.effects-uses-macro-status-effects.name",
          hint: "ddb-importer.settings.effects-uses-macro-status-effects.hint",
          config: false,
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
        "update-check": {
          name: "ddb-importer.settings.update-check.name",
          config: true,
          type: Boolean,
          default: false,
        },
        "use-deep-file-paths": {
          name: "ddb-importer.settings.use-deep-file-paths.name",
          hint: "ddb-importer.settings.use-deep-file-paths.hint",
          type: Boolean,
          default: true,
          // requiresReload: true,
        },
        "show-welcome-message": {
          name: "ddb-importer.settings.show-welcome-message.name",
          hint: "ddb-importer.settings.show-welcome-message.hint",
          scope: "world",
          type: Boolean,
          default: true,
          config: true,
        },
      },
      // character settings
      CHARACTER: {
        ENHANCERS: {
          "allow-moon-druid-wildshape-enhancer": {
            type: Boolean,
            scope: "world",
            default: true,
            config: false,
            requiresReload: true,
          },
          "allow-arcane-ward-enhancer": {
            type: Boolean,
            scope: "world",
            default: true,
            config: false,
            requiresReload: true,
          },
          "allow-great-weapon-master-enhancer": {
            type: Boolean,
            scope: "world",
            default: false,
            config: false,
            requiresReload: true,
          },
          "allow-warding-bond-enhancer": {
            type: Boolean,
            scope: "world",
            default: true,
            config: false,
            requiresReload: true,
          },
        },
        IMPORT: {
          "character-update-policy-use-hp-max-for-rolled-hp": {
            type: Boolean,
            default: false,
          },
          "character-update-policy-create-companions": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "pact-spells-prepared": {
            type: Boolean,
            default: false,
          },
          "character-update-policy-add-midi-effects": {
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
          "character-update-policy-xp": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-spell-use": {
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
          "character-update-policy-use-combined-description": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-active-effect-copy": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-use-chris-premades": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-include-versatile-features": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-remove-2024": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-remove-legacy": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-policy-import-full-spell-list": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-use-active-sources": {
            scope: "player",
            type: Boolean,
            default: true,
          },
          "character-update-policy-add-features-to-compendiums-dev": {
            type: Boolean,
            default: false,
          },
          "character-update-policy-update-add-features-to-compendiums": {
            type: Boolean,
            default: true,
          },
          "character-update-policy-import-all-cantrips": {
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
          "top-level-compendium-folder": {
            name: "ddb-importer.settings.top-level-compendium-folder.name",
            hint: "ddb-importer.settings.top-level-compendium-folder.hint",
            config: true,
            type: Boolean,
            default: true,
          },
          "munching-selection-compendium-folders-monster": {
            name: "ddb-importer.settings.munching-selection-compendium-folders-monster.name",
            hint: "ddb-importer.settings.munching-selection-compendium-folders-monster.hint",
            config: true,
            type: String,
            choices: {
              SOURCE_CATEGORY_TYPE: "Source Category -> Creature type, e.g. Undead",
              SOURCE_CATEGORY_CR: "Source Category -> Challenge Rating",
              TYPE: "Creature type, e.g. Undead",
              CR: "Challenge Rating",
              ALPHA: "Alphabetical",
            },
            default: "SOURCE_CATEGORY_TYPE",
          },
          "munching-selection-compendium-folders-spell": {
            name: "ddb-importer.settings.munching-selection-compendium-folders-spell.name",
            hint: "ddb-importer.settings.munching-selection-compendium-folders-spell.hint",
            config: true,
            type: String,
            choices: {
              SCHOOL: "School of Magic",
              SOURCE_CATEGORY_LEVEL: "Source Category -> Level",
              LEVEL: "Level",
            },
            default: "SOURCE_CATEGORY_LEVEL",
          },
          "munching-selection-compendium-folders-item": {
            name: "ddb-importer.settings.munching-selection-compendium-folders-item.name",
            hint: "ddb-importer.settings.munching-selection-compendium-folders-item.hint",
            config: true,
            type: String,
            choices: {
              SOURCE_CATEGORY_TYPE: "Source Category -> Item Type",
              TYPE: "Item Type",
              RARITY: "Rarity",
            },
            default: "SOURCE_CATEGORY_TYPE",
          },
        },
        ADVENTURE: {
          "adventure-policy-all-scenes": {
            type: Boolean,
            default: true,
          },
          "adventure-policy-all-actors-into-world": {
            type: Boolean,
            default: false,
          },
          "adventure-policy-journal-world-actors": {
            type: Boolean,
            default: false,
          },
          "adventure-policy-add-to-compendiums": {
            type: Boolean,
            default: false,
          },
          "adventure-policy-import-to-adventure-compendium": {
            type: Boolean,
            default: false,
          },
          "adventure-policy-use2024-monsters": {
            type: Boolean,
            default: false,
          },
        },
        MUNCH: {
          "munching-policy-update-existing": {
            type: Boolean,
            default: false,
          },
          "munching-policy-delete-during-update": {
            type: Boolean,
            default: true,
          },
          // "munching-policy-use-srd": {
          //   scope: "player",
          //   type: Boolean,
          //   default: false,
          // },
          "munching-policy-legacy-postfix": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-srd-icons": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-inbuilt-icons": {
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-item-icons": {
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-spell-icons": {
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-generic-item-icons": {
            type: Boolean,
            default: true,
          },
          "munching-policy-use-full-token-image": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-token-avatar-image": {
            type: Boolean,
            default: false,
          },
          "munching-policy-remote-images": {
            type: Boolean,
            default: true,
          },
          "munching-policy-add-midi-effects": {
            type: Boolean,
            default: true,
          },
          "munching-policy-add-monster-midi-effects": {
            type: Boolean,
            default: false,
          },
          "munching-policy-download-images": {
            name: "ddb-importer.settings.munching-policy-download-images.name",
            hint: "ddb-importer.settings.munching-policy-download-images.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-chris-premades": {
            type: Boolean,
            default: false,
          },
          "munching-policy-force-spell-version": {
            name: "ddb-importer.settings.munching-policy-force-spell-version.name",
            hint: "ddb-importer.settings.munching-policy-force-spell-version.hint",
            config: true,
            type: String,
            choices: {
              DEFAULT: "Choose spells based on monster rules",
              FORCE_2024: "Force 2024 spells",
            },
            default: "DEFAULT",
          },
          "munching-policy-hide-description": {
            name: "ddb-importer.settings.munching-policy-hide-description.name",
            hint: "ddb-importer.settings.munching-policy-hide-description.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-hide-item-name": {
            name: "ddb-importer.settings.munching-policy-hide-item-name.name",
            hint: "ddb-importer.settings.munching-policy-hide-item-name.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-hide-description-choice": {
            name: "ddb-importer.settings.munching-policy-hide-description-choice.name",
            hint: "ddb-importer.settings.munching-policy-hide-description-choice.hint",
            type: String,
            choices: {
              NAME: "Monster's name e.g. Goblin",
              TYPE: "Monster's type e.g. Abomination",
              MONSTER: `The word "Monster"`,
              NPC: `The word "NPC"`,
            },
            default: "NAME",
          },
          "munching-policy-monster-items": {
            name: "ddb-importer.settings.munching-policy-monster-items.name",
            hint: "ddb-importer.settings.munching-policy-monster-items.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-homebrew": {
            name: "ddb-importer.settings.munching-policy-monster-homebrew.name",
            hint: "ddb-importer.settings.munching-policy-monster-homebrew.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-homebrew-only": {
            name: "ddb-importer.settings.munching-policy-monster-homebrew-only.name",
            hint: "ddb-importer.settings.munching-policy-monster-homebrew-only.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-tokenize": {
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-wildcard": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-srd-monster-images": {
            type: Boolean,
            default: false,
          },
          "munching-policy-update-images": {
            name: "ddb-importer.settings.munching-policy-update-images.name",
            hint: "ddb-importer.settings.munching-policy-update-images.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-monster-exact-match": {
            name: "ddb-importer.settings.munching-policy-monster-match.name",
            hint: "ddb-importer.settings.munching-policy-monster-match.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-item-exact-match": {
            type: Boolean,
            default: false,
          },
          "munching-policy-spell-exact-match": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-source-filter": {
            type: Boolean,
            default: false,
          },
          "munching-policy-muncher-sources": {
            type: Array,
            default: [],
          },
          "munching-policy-muncher-excluded-source-categories": {
            type: Array,
            // 2014 core/expanded and 2024 core/expanded only enabled by default
            default: [2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39],
          },
          "munching-policy-muncher-monster-types": {
            type: Array,
            default: [],
          },
          "munching-policy-monster-use-item-ac": {
            type: Boolean,
            default: true,
          },
          "munching-policy-monster-retain-biography": {
            type: Boolean,
            default: false,
          },
          "munching-policy-monster-set-legendary-resource-bar": {
            type: Boolean,
            default: true,
          },
          "munching-policy-update-world-monster-update-images": {
            type: Boolean,
            default: true,
          },
          "munching-policy-update-world-monster-retain-biography": {
            type: Boolean,
            default: true,
          },
          "munching-policy-monster-strip-name": {
            type: Boolean,
            default: true,
          },
          "munching-policy-monster-strip-flag-data": {
            type: Boolean,
            default: false,
          },
          "munching-policy-item-homebrew": {
            type: Boolean,
            default: false,
          },
          "munching-policy-item-homebrew-only": {
            type: Boolean,
            default: false,
          },
          "munching-policy-spell-homebrew": {
            type: Boolean,
            default: false,
          },
          "munching-policy-spell-homebrew-only": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-generic-items": {
            type: Boolean,
            default: false,
          },
          "munching-policy-remove-weapon-mastery-description": {
            type: Boolean,
            default: false,
          },
          "munching-policy-character-fetch-homebrew": {
            type: Boolean,
            default: false,
          },
          "munching-policy-character-use-class-filter": {
            type: Boolean,
            default: true,
          },
          "munching-policy-character-url": {
            type: String,
            default: "",
          },
          "munching-policy-character-classes": {
            type: Array,
            default: [],
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
          requiresReload: true,
        },
        "dynamic-sync-user": {
          type: String,
          default: "",
          requiresReload: true,
        },
      },
      PROXY: {
        "api-endpoint": {
          type: String,
          default: "http://localhost:3000",
          requiresReload: true,
        },
        "cors-endpoint": {
          type: String,
          default: URLS.CORS,
          requiresReload: true,
        },
        "dynamic-api-endpoint": {
          type: String,
          default: URLS.DYNAMIC,
          requiresReload: true,
        },
        "cors-encode": {
          type: Boolean,
          default: false,
        },
        "cors-strip-protocol": {
          type: Boolean,
          default: true,
        },
        "cors-path-prefix": {
          type: String,
          default: "ddb/",
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
        "third-party-scenes-notes-merged": {
          type: Boolean,
          default: true,
        },
        "allow-dev-generation": {
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
  APPLY_GLOBAL_DEFAULTS(settings) {
    for (const [name, data] of Object.entries(settings)) {
      settings[name] = foundry.utils.mergeObject({ scope: "world", config: false }, data);
    }
    return settings;
  },
  GET_DEFAULT_SETTINGS(early = false) {
    const clone = foundry.utils.deepClone(SETTINGS.DEFAULT_SETTINGS);
    const defaultLocationSource = !early && typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge
      ? "[forgevtt]"
      : "[data]";

    for (const [name, data] of Object.entries(clone.READY.DIRECTORIES)) {
      clone.READY.DIRECTORIES[name].default = data.default.replace("[data]", defaultLocationSource);
    }
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
        ...clone.READY.CHARACTER.ENHANCERS,
        ...clone.READY.CHARACTER.SYNC,
        ...clone.READY.DYNAMIC_SYNC,
        ...clone.READY.CHARACTER.DYNAMIC_SYNC,
        ...clone.READY.MUNCHER.COMPENDIUM_FOLDERS,
        ...clone.READY.MUNCHER.ADVENTURE,
        ...clone.READY.MUNCHER.MUNCH,
        ...clone.READY.MUNCHER.ENCOUNTER,
      };

    return SETTINGS.APPLY_GLOBAL_DEFAULTS(defaultSettings);
  },
  GET_ALL_SETTINGS() {
    return foundry.utils.mergeObject(SETTINGS.GET_DEFAULT_SETTINGS(), SETTINGS.GET_DEFAULT_SETTINGS(true));
  },
  STATUS: {
    activeUpdate,
  },
};

export default SETTINGS;
