import { DirectoryPicker } from "./lib/DirectoryPicker.js";
import DICTIONARY from "./dictionary.js";
import logger from "./logger.js";

const COMPENDIUMS = [
  { title: "Backgrounds", setting: "entity-background-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/86797d176a398d9f2f05b75b2f54b6dd.jpg", auto: true },
  { title: "Classes", setting: "entity-class-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/b778ff3ca3f18e5f75ad4b348615cab5.jpg", auto: true },
  { title: "Subclasses", setting: "entity-subclass-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/b778ff3ca3f18e5f75ad4b348615cab5.jpg", auto: true },
  { title: "Class Features", setting: "entity-feature-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/b778ff3ca3f18e5f75ad4b348615cab5.jpg", auto: true },
  { title: "Feats", setting: "entity-feat-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/a69ab5bf67b03308893b582dbef700e9.jpg", auto: true },
  { title: "Items", setting: "entity-item-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/c06b79eae8ee234d1cea4688e117152b.jpg", auto: true },
  { title: "Monsters", setting: "entity-monster-compendium", type: "Actor", image: "https://media.dndbeyond.com/mega-menu/36ee49066331fc36e3b37147d123463a.jpg", auto: true },
  { title: "Vehicles", setting: "entity-vehicle-compendium", type: "Actor", image: "https://media.dndbeyond.com/mega-menu/e95485e82519aa807da5011d42b8c9d3.jpg", auto: true },
  { title: "Races", setting: "entity-race-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/bfe65858aaa13919ce3d86d938bcb05b.jpg", auto: true },
  { title: "Racial Traits", setting: "entity-trait-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/bfe65858aaa13919ce3d86d938bcb05b.jpg", auto: true },
  { title: "Spells", setting: "entity-spell-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/8894f93deeca83cdf0a6df3f36ffb52e.jpg", auto: true },
  { title: "Tables", setting: "entity-table-compendium", type: "RollTable", image: "https://media.dndbeyond.com/mega-menu/f1a2343aee786f21827daf763c60d30f.jpg", auto: true },
  { title: "Override", setting: "entity-override-compendium", type: "Item", image: "https://media.dndbeyond.com/mega-menu/e116466f43544117a34ed5f642c680f7.jpg", auto: true },
  { title: "Adventures", setting: "entity-adventure-compendium", type: "Adventure", image: "https://media.dndbeyond.com/mega-menu/4af3d4c196428ab0809cf71d332d540d.png", auto: false },
  { title: "Journals", setting: "entity-journal-compendium", type: "JournalEntry", image: "https://media.dndbeyond.com/mega-menu/4af3d4c196428ab0809cf71d332d540d.png", auto: false },
];

const SRD_COMPENDIUM_LOOKUPS = [
  { type: "inventory", name: "dnd5e.items" },
  { type: "spells", name: "dnd5e.spells" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "races", name: "dnd5e.races" },
  { type: "traits", name: "dnd5e.races" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "feat", name: "dnd5e.classfeatures" },
  { type: "feats", name: "dnd5e.classfeatures" },
  { type: "classes", name: "dnd5e.classes" },
  { type: "subclasses", name: "dnd5e.subclasses" },
  { type: "weapon", name: "dnd5e.items" },
  { type: "consumable", name: "dnd5e.items" },
  { type: "tool", name: "dnd5e.items" },
  { type: "loot", name: "dnd5e.items" },
  { type: "container", name: "dnd5e.items" },
  { type: "spell", name: "dnd5e.spells" },
  { type: "equipment", name: "dnd5e.items" },
  { type: "monsters", name: "dnd5e.monsters" },
  { type: "monsterfeatures", name: "dnd5e.monsterfeatures" },
  { type: "backgrounds", name: "dnd5e.backgrounds" },
];

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

const COMPENDIUM_REMOVE_FLAGS = [
  "flags.ddbimporter.overrideId",
  "flags.ddbimporter.ignoreItemImport",
  "flags.ddbimporter.retainResourceConsumption",
  "flags.ddbimporter.ignoreIcon",
];

const URLS = {
  BASE: "ddb.mrprimate.co.uk",
  PROXY: "https://proxy.ddb.mrprimate.co.uk",
  CORS: "https://images.ddb.mrprimate.co.uk/",
  DYNAMIC: "https://dynamic.ddb.mrprimate.co.uk",
};

const MUNCH_DEFAULTS = [
  { name: "munching-policy-update-existing", needed: true },
  { name: "munching-policy-use-srd", needed: false },
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

const COMPANION_SPELLS = [
  "Summon Aberration",
  "Summon Beast",
  "Summon Celestial",
  "Summon Construct",
  "Summon Elemental",
  "Summon Fey",
  "Summon Fiend",
  "Summon Shadowspawn",
  "Summon Undead",
  "Summon Draconic Spirit",
];
const COMPANION_FEATURES = [
  "Steel Defender",
  "Artificer Infusions",
  "Summon Wildfire Spirit",
  // "Primal Companion",
  "Drake Companion",
  "Drake Companion: Summon",
];
const COMPANION_OPTIONS = {
  "Primal Companion": [
    "Beast of the Land",
    "Beast of the Sea",
    "Beast of the Sky",
  ],
};

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
  EFFECTS_IGNORE_FLAG_GROUPS,
  SUPPORTED_FLAG_GROUPS,
  GAME_FOLDER_LOOKUPS,
  COMPENDIUM_REMOVE_FLAGS,
  ADVENTURE_FLAG: "isDDBAdventure",
  ADVENTURE_CSS: "ddbAdventure",
  COMPANIONS: {
    COMPANION_FEATURES,
    COMPANION_SPELLS,
    COMPANION_OPTIONS,
  },
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
        }])
      ),
      // dir locations
      DIRECTORIES: {
        "image-upload-directory": {
          name: "ddb-importer.settings.image-upload-directory.name",
          hint: "ddb-importer.settings.image-upload-directory.hint",
          type: DirectoryPicker.Directory,
          default: "[data] ddb-images/characters",
        },
        "other-image-upload-directory": {
          name: "ddb-importer.settings.other-image-upload-directory.name",
          hint: "ddb-importer.settings.other-image-upload-directory.hint",
          type: DirectoryPicker.Directory,
          default: "[data] ddb-images/other",
        },
        "frame-image-upload-directory": {
          name: "ddb-importer.settings.frame-image-upload-directory.name",
          hint: "ddb-importer.settings.frame-image-upload-directory.hint",
          type: DirectoryPicker.Directory,
          default: "[data] ddb-images/frames",
        },
        "adventure-import-path": {
          name: "ddb-importer.settings.adventure-import-path.name",
          hint: "ddb-importer.settings.adventure-import-path.hint",
          default: "[data] adventures/import",
          type: DirectoryPicker.Directory,
        },
        "adventure-upload-path": {
          name: "ddb-importer.settings.adventure-upload-path.name",
          hint: "ddb-importer.settings.adventure-upload-path.hint",
          default: "[data] ddb-images/adventures",
          type: DirectoryPicker.Directory,
        },
        "adventure-misc-path": {
          name: "ddb-importer.settings.adventure-misc-path.name",
          hint: "ddb-importer.settings.adventure-misc-path.hint",
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
        "show-read-alouds-button": {
          name: "ddb-importer.settings.show-read-alouds-button.name",
          hint: "ddb-importer.settings.show-read-alouds-button.hint",
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
        "show-resource-chooser-default": {
          name: "ddb-importer.settings.show-resource-chooser-default.name",
          hint: "ddb-importer.settings.show-resource-chooser-default.hint",
          config: true,
          type: Boolean,
          default: false,
        },
        "apply-conditions-with-ce": {
          name: "ddb-importer.settings.apply-conditions-with-ce.name",
          hint: "ddb-importer.settings.apply-conditions-with-ce.hint",
          config: true,
          type: Boolean,
          default: false,
          requiresReload: false,
          onChange: (value) => {
            if (!game.user.isGM) return;
            if (game.modules.get("dfreds-convenient-effects")?.active) {
              const convenientEffectStatusSettings = game.settings.get("dfreds-convenient-effects", "modifyStatusEffects");
              if (value === true && convenientEffectStatusSettings === "none") {
                const message = `Unable to use Convenient Effects for conditions. You must set the CE status effects to "add" or "replace" first!`;
                logger.error(message);
                ui.notifications.error(message, { permanent: true });
                game.settings.set("ddb-importer", "apply-conditions-with-ce", false);
              } else if (value === false && convenientEffectStatusSettings === "replace") {
                const message = `Unable to remove Convenient Effects for conditions. You must set the CE status effects to "none" or "replace" first!`;
                logger.error(message);
                ui.notifications.error(message, { permanent: true });
                game.settings.set("ddb-importer", "apply-conditions-with-ce", true);
              }
            } else if (value === true) {
              const message = `Unable to use Convenient Effects for conditions. You must install the Convenient Effects module first!`;
              logger.error(message);
              ui.notifications.error(message, { permanent: true });
              game.settings.set("ddb-importer", "apply-conditions-with-ce", false);
            }
          }
        },
        "use-ce-toggles": {
          name: "ddb-importer.settings.use-ce-toggles.name",
          hint: "ddb-importer.settings.use-ce-toggles.hint",
          config: true,
          type: Boolean,
          default: false,
        },
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
        "no-item-macros": {
          name: "ddb-importer.settings.no-item-macros.name",
          hint: "ddb-importer.settings.no-item-macros.hint",
          config: true,
          type: Boolean,
          default: false,
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
          name: "ddb-importer.settings.update-check.name",
          config: true,
          type: Boolean,
          default: true,
        },
        "use-deep-file-paths": {
          name: "ddb-importer.settings.use-deep-file-paths.name",
          hint: "ddb-importer.settings.use-deep-file-paths.hint",
          type: Boolean,
          default: false,
          // requiresReload: true,
        },
      },
      // character settings
      CHARACTER: {
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
          "character-update-policy-effect-feat-proficiencies": {
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
          // "character-update-policy-use-actions-as-features": {
          //   scope: "player",
          //   type: Boolean,
          //   default: true,
          // },
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
          "character-update-policy-use-chris-premades": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "character-update-include-versatile-features": {
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
        },
        MUNCH: {
          "munching-policy-update-existing": {
            type: Boolean,
            default: false,
          },
          "munching-policy-delete-during-update": {
            type: Boolean,
            default: false,
          },
          "munching-policy-use-srd": {
            scope: "player",
            type: Boolean,
            default: false,
          },
          "munching-policy-exclude-legacy": {
            type: Boolean,
            default: false,
          },
          "munching-policy-legacy-postfix": {
            type: Boolean,
            default: true,
          },
          "munching-policy-use-compendium-folders": {
            type: Boolean,
            default: true,
          },
          "munching-policy-use-srd-icons": {
            name: "ddb-importer.settings.munching-policy-use-srd-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-srd-icons.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-inbuilt-icons": {
            name: "ddb-importer.settings.munching-policy-use-inbuilt-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-inbuilt-icons.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-item-icons": {
            name: "ddb-importer.settings.munching-policy-use-ddb-item-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-ddb-item-icons.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-spell-icons": {
            name: "ddb-importer.settings.munching-policy-use-ddb-spell-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-ddb-spell-icons.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-ddb-generic-item-icons": {
            name: "ddb-importer.settings.munching-policy-use-ddb-generic-item-icons.name",
            hint: "ddb-importer.settings.munching-policy-use-ddb-generic-item-icons.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-use-full-token-image": {
            name: "ddb-importer.settings.munching-policy-use-full-token-image.name",
            hint: "ddb-importer.settings.munching-policy-use-full-token-image.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-token-avatar-image": {
            name: "ddb-importer.settings.munching-policy-use-token-avatar-image.name",
            hint: "ddb-importer.settings.munching-policy-use-token-avatar-image.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-remote-images": {
            name: "ddb-importer.settings.munching-policy-remote-images.name",
            hint: "ddb-importer.settings.munching-policy-remote-images.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-add-effects": {
            name: "ddb-importer.settings.munching-policy-add-effects.name",
            hint: "ddb-importer.settings.munching-policy-add-effects.hint",
            type: Boolean,
            default: true,
          },
          "munching-policy-add-spell-effects": {
            type: Boolean,
            default: false,
          },
          "munching-policy-add-monster-effects": {
            type: Boolean,
            default: false,
          },
          "munching-policy-download-images": {
            name: "ddb-importer.settings.munching-policy-download-images.name",
            hint: "ddb-importer.settings.munching-policy-download-images.hint",
            type: Boolean,
            default: false,
          },
          "munching-policy-use-chris-premades": {
            type: Boolean,
            default: false,
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
          "munching-policy-use-source-filter": {
            type: Boolean,
            default: false,
          },
          "munching-policy-muncher-sources": {
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
          }
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
  STATUS: {
    activeUpdate,
  },
};

export default SETTINGS;
