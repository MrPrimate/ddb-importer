import { DirectoryPicker } from "../../lib/DirectoryPicker.js";
import { DDBSetup, DDBCompendiumSetup, DDBDynamicUpdateSetup } from "../../lib/Settings.js";
import logger from "../../logger.js";

CONFIG.DDBI = {
  module: "DDB Muncher",
  schemaVersion: "1.1",
  ADVENTURE: {},
};

export default function () {

  game.settings.registerMenu("ddb-importer", 'setupMenu', {
    name: "ddb-importer.setup.name",
    label: "ddb-importer.setup.name",
    hint: "ddb-importer.setup.hint",
    icon: 'fas fa-wrench',
    type: DDBSetup,
    restricted: true
  });

  game.settings.registerMenu("ddb-importer", 'compendiumMenu', {
    name: "ddb-importer.compendium-setup.name",
    label: "ddb-importer.compendium-setup.name",
    hint: "ddb-importer.compendium-setup.hint",
    icon: 'fas fa-wrench',
    type: DDBCompendiumSetup,
    restricted: true
  });

  game.settings.registerMenu("ddb-importer", 'dynamicUpdateMenu', {
    name: "ddb-importer.dynamic-update-setup.name",
    label: "ddb-importer.dynamic-update-setup.name",
    hint: "ddb-importer.dynamic-update-setup.hint",
    icon: 'fas fa-wrench',
    type: DDBDynamicUpdateSetup,
    restricted: true,
  });

  game.settings.register("ddb-importer", "image-upload-directory", {
    name: "ddb-importer.image-upload-directory.name",
    hint: "ddb-importer.image-upload-directory.hint",
    scope: "world",
    config: false,
    type: DirectoryPicker.Directory,
    default: "[data] ddb-images/characters",
  });

  game.settings.register("ddb-importer", "other-image-upload-directory", {
    name: "ddb-importer.image-upload-directory.name",
    hint: "ddb-importer.image-upload-directory.hint",
    scope: "world",
    config: false,
    type: DirectoryPicker.Directory,
    default: "[data] ddb-images/other",
  });

  if (game.user.isGM) {
    const characterUploads = game.settings.get("ddb-importer", "image-upload-directory");
    const otherUploads = game.settings.get("ddb-importer", "other-image-upload-directory");
    if (characterUploads !== "[data] ddb-images/characters" && otherUploads === "[data] ddb-images/other") {
      game.settings.set("ddb-importer", "other-image-upload-directory", characterUploads);
    } else {
      DirectoryPicker.verifyPath(DirectoryPicker.parse(otherUploads));
    }
    DirectoryPicker.verifyPath(DirectoryPicker.parse(characterUploads));
  }

  game.settings.register("ddb-importer", "frame-image-upload-directory", {
    name: "ddb-importer.frame-upload-directory.name",
    hint: "ddb-importer.frame-upload-directory.hint",
    scope: "world",
    config: false,
    type: DirectoryPicker.Directory,
    default: "[data] ddb-images/frames",
  });

  if (game.user.isGM) {
    const frameUploads = game.settings.get("ddb-importer", "frame-image-upload-directory");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(frameUploads));
  }

  game.settings.register("ddb-importer", "settings-call-muncher", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "update-check", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "allow-scene-download", {
    name: "ddb-importer.allow-scene-download.name",
    hint: "ddb-importer.allow-scene-download.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "allow-third-party-scene-download", {
    name: "ddb-importer.allow-third-party-scene-download.name",
    hint: "ddb-importer.allow-third-party-scene-download.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "allow-note-generation", {
    name: "ddb-importer.allow-note-generation.name",
    hint: "ddb-importer.allow-note-generation.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "auto-create-compendium", {
    name: "ddb-importer.auto-create-compendium.name",
    hint: "ddb-importer.auto-create-compendium.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "use-full-source", {
    name: "ddb-importer.use-full-source.name",
    hint: "ddb-importer.use-full-source.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "use-damage-hints", {
    name: "ddb-importer.use-damage-hints.name",
    hint: "ddb-importer.use-damage-hints.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "add-damage-restrictions-to-hints", {
    name: "ddb-importer.add-damage-restrictions-to-hints.name",
    hint: "ddb-importer.add-damage-restrictions-to-hints.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "monster-has-vision", {
    name: "ddb-importer.monster-has-vision.name",
    hint: "ddb-importer.monster-has-vision.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "restrict-to-trusted", {
    name: "ddb-importer.restrict-to-trusted.name",
    hint: "ddb-importer.restrict-to-trusted.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "allow-all-sync", {
    name: "ddb-importer.allow-all-sync.name",
    hint: "ddb-importer.allow-all-sync.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "monster-link-title", {
    name: "ddb-importer.monster-link-title.name",
    hint: "ddb-importer.monster-link-title.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-link-title", {
    name: "ddb-importer.character-link-title.name",
    hint: "ddb-importer.character-link-title.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "link-title-colour-white", {
    name: "ddb-importer.link-title-colour-white.name",
    hint: "ddb-importer.link-title-colour-white.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "show-munch-top", {
    name: "ddb-importer.show-munch-top.name",
    hint: "ddb-importer.show-munch-top.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "entity-item-compendium", {
    name: "ddb-importer.entity-item-compendium.name",
    hint: "ddb-importer.entity-item-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-feature-compendium", {
    name: "ddb-importer.entity-feature-compendium.name",
    hint: "ddb-importer.entity-feature-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-class-compendium", {
    name: "ddb-importer.entity-class-compendium.name",
    hint: "ddb-importer.entity-class-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-race-compendium", {
    name: "ddb-importer.entity-race-compendium.name",
    hint: "ddb-importer.entity-race-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-trait-compendium", {
    name: "ddb-importer.entity-trait-compendium.name",
    hint: "ddb-importer.entity-trait-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-feat-compendium", {
    name: "ddb-importer.entity-feat-compendium.name",
    hint: "ddb-importer.entity-feat-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-spell-compendium", {
    name: "ddb-importer.entity-spell-compendium.name",
    hint: "ddb-importer.entity-spell-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-override-compendium", {
    name: "ddb-importer.entity-custom-compendium.name",
    hint: "ddb-importer.entity-custom-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-table-compendium", {
    name: "ddb-importer.entity-table-compendium.name",
    hint: "ddb-importer.entity-table-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "entity-monster-compendium", {
    name: "ddb-importer.entity-monster-compendium.name",
    hint: "ddb-importer.entity-monster-compendium.hint",
    scope: "world",
    config: false,
    type: String,
  });

  game.settings.register("ddb-importer", "adventure-import-path", {
    name: "ddb-importer.adventure-import-path.name",
    hint: "ddb-importer.adventure-import-path.hint",
    scope: "world",
    config: true,
    default: "[data] adventures/import",
    type: DirectoryPicker.Directory
  });

  game.settings.register("ddb-importer", "adventure-upload-path", {
    name: "ddb-importer.adventure-upload-path.name",
    hint: "ddb-importer.adventure-upload-path.hint",
    scope: "world",
    config: true,
    default: "[data] ddb-images/adventures",
    type: DirectoryPicker.Directory
  });

  const adventureUploads = game.settings.get("ddb-importer", "adventure-upload-path");

  if (game.user.isGM) {
    const oldDirPath = `[data] worlds/${game.world.id}/adventures`;
    const oldDir = DirectoryPicker.parse(oldDirPath);

    if (adventureUploads === "[data] ddb-images/adventures") {
      DirectoryPicker.browse(oldDir.activeSource, oldDir.current, { bucket: oldDir.bucket }).then((uploadFileList) => {
        if (uploadFileList.dirs.length !== 0 || uploadFileList.files.length !== 0) {
          logger.warn("Updating adventure uploads to historic default");
          game.settings.set("ddb-importer", "adventure-upload-path", oldDirPath);
        }
      }).catch((e) => {
        if (
          e.startsWith("The requested file storage undefined does not exist!") ||
          e.includes("does not exist or is not accessible in this storage location")
        ) {
          logger.debug("Adventure directory check successful");
        }
      });
    }

    DirectoryPicker.verifyPath(DirectoryPicker.parse(adventureUploads));
  }

  const baseAdventureMiscPath = adventureUploads.startsWith("[data]")
    ? `${adventureUploads}/misc`
    : "[data] ddb-images/adventures/misc";

  game.settings.register("ddb-importer", "adventure-misc-path", {
    name: "ddb-importer.adventure-misc-path.name",
    hint: "ddb-importer.adventure-misc-path.hint",
    scope: "world",
    config: true,
    default: baseAdventureMiscPath,
    type: DirectoryPicker.Directory
  });

  if (game.user.isGM) {
    const iconUploads = game.settings.get("ddb-importer", "adventure-misc-path");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(iconUploads));
  }

  game.settings.register("ddb-importer", "log-level", {
    name: "ddb-importer.log-level.name",
    hint: "ddb-importer.log-level.hint",
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
  });

  game.settings.register("ddb-importer", "api-endpoint", {
    name: "ddb-importer.api-endpoint.name",
    hint: "ddb-importer.api-endpoint.hint",
    scope: "world",
    config: false,
    type: String,
    default: "https://proxy.ddb.mrprimate.co.uk",
  });

  const ddbProxy = game.settings.get("ddb-importer", "api-endpoint");
  if (ddbProxy === "https://ddb.mrprimate.co.uk") {
    game.settings.set("ddb-importer", "api-endpoint", "https://proxy.ddb.mrprimate.co.uk");
  }

  game.settings.register("ddb-importer", "cors-endpoint", {
    name: "ddb-importer.cors-endpoint.name",
    hint: "ddb-importer.cors-endpoint.hint",
    scope: "world",
    config: false,
    type: String,
    default: "https://images.ddb.mrprimate.co.uk/",
  });

  const corsEndpoint = game.settings.get("ddb-importer", "cors-endpoint");
  if (corsEndpoint === "https://london.drop.mrprimate.co.uk/") {
    game.settings.set("ddb-importer", "cors-endpoint", "https://images.ddb.mrprimate.co.uk/");
  }

  game.settings.register("ddb-importer", "dynamic-api-endpoint", {
    name: "ddb-importer.api-endpoint.name",
    hint: "ddb-importer.api-endpoint.hint",
    scope: "world",
    config: false,
    type: String,
    default: "https://dynamic.ddb.mrprimate.co.uk",
  });

  game.settings.register("ddb-importer", "cors-encode", {
    name: "ddb-importer.cors-encode.name",
    hint: "ddb-importer.cors-encode.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "beta-key", {
    name: "ddb-importer.beta-key.name",
    hint: "ddb-importer.beta-key.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("ddb-importer", "patreon-user", {
    scope: "world",
    config: false,
    type: String,
    default: null,
  });

  game.settings.register("ddb-importer", "debug-json", {
    name: "ddb-importer.debug-json.name",
    hint: "ddb-importer.debug-json.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  /** Character update settings, stored per user and non-configurable in the settings screen */
  game.settings.register("ddb-importer", "character-update-policy-add-character-effects", {
    name: "ddb-importer.character-update-policy-add-character-effects.name",
    hint: "ddb-importer.character-update-policy-add-character-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  //
  // Character effect generation options
  //
  // ITEM
  // N/A
  // RACE
  game.settings.register("ddb-importer", "character-update-policy-effect-race-damages", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-race-speed", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-race-senses", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-race-hp", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-race-spell-bonus", {
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });


  // CLASS
  game.settings.register("ddb-importer", "character-update-policy-effect-class-damages", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-class-speed", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-class-senses", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-class-hp", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-class-spell-bonus", {
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });


  // FEAT
  game.settings.register("ddb-importer", "character-update-policy-effect-feat-proficiencies", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-languages", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-damages", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-speed", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-senses", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-hp", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-spell-bonus", {
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-feat-ability-bonus", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  // BACKGROUND
  game.settings.register("ddb-importer", "character-update-policy-effect-background-proficiencies", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-languages", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-damages", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-speed", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-senses", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-hp", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-spell-bonus", {
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-effect-background-ability-bonus", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  //
  //
  game.settings.register("ddb-importer", "character-update-policy-add-item-effects", {
    name: "ddb-importer.character-update-policy-add-item-effects.name",
    hint: "ddb-importer.character-update-policy-add-item-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-generate-ac-armor-effects", {
    name: "ddb-importer.character-update-policy-generate-ac-armor-effects.name",
    hint: "ddb-importer.character-update-policy-generate-ac-armor-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-generate-ac-feature-effects", {
    name: "ddb-importer.character-update-policy-generate-ac-feature-effects.name",
    hint: "ddb-importer.character-update-policy-generate-ac-feature-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-generate-ac-override-effects", {
    name: "ddb-importer.character-update-policy-generate-ac-override-effects.name",
    hint: "ddb-importer.character-update-policy-generate-ac-override-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-generate-base-ac", {
    name: "ddb-importer.character-update-policy-generate-base-ac.name",
    hint: "ddb-importer.character-update-policy-generate-base-ac.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-existing", {
    name: "ddb-importer.character-update-policy-use-existing.name",
    hint: "ddb-importer.character-update-policy-use-existing.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-override", {
    name: "ddb-importer.character-update-policy-use-custom.name",
    hint: "ddb-importer.character-update-policy-use-custom.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-srd", {
    name: "ddb-importer.character-update-policy-use-srd.name",
    hint: "ddb-importer.character-update-policy-use-srd.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  // Character update policy

  game.settings.register("ddb-importer", "character-update-policy-name", {
    name: "ddb-importer.character-update-policy-name.name",
    hint: "ddb-importer.character-update-policy-name.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-hp", {
    name: "ddb-importer.character-update-policy-name.hp",
    hint: "ddb-importer.character-update-policy-name.hp",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-hit-die", {
    name: "ddb-importer.character-update-policy-name.hit-die",
    hint: "ddb-importer.character-update-policy-name.hit-die",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-class", {
    name: "ddb-importer.character-update-policy-class.name",
    hint: "ddb-importer.character-update-policy-class.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });


  game.settings.register("ddb-importer", "character-update-policy-feat", {
    name: "ddb-importer.character-update-policy-feat.name",
    hint: "ddb-importer.character-update-policy-feat.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-weapon", {
    name: "ddb-importer.character-update-policy-weapon.name",
    hint: "ddb-importer.character-update-policy-weapon.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-equipment", {
    name: "ddb-importer.character-update-policy-equipment.name",
    hint: "ddb-importer.character-update-policy-equipment.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-bio", {
    name: "ddb-importer.character-update-policy-bio.name",
    hint: "ddb-importer.character-update-policy-bio.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-import-extras", {
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register(
    "ddb-importer",
    "character-update-policy-inventory", // = consumable, tool & loot
    {
      name: "ddb-importer.character-update-policy-inventory.name",
      hint: "ddb-importer.character-update-policy-inventory.hint",
      scope: "player",
      config: false,
      type: Boolean,
      default: true,
    }
  );

  game.settings.register("ddb-importer", "character-update-policy-currency", {
    name: "ddb-importer.character-update-policy-currency.name",
    hint: "ddb-importer.character-update-policy-currency.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-spell", {
    name: "ddb-importer.character-update-policy-spell.name",
    hint: "ddb-importer.character-update-policy-spell.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-image", {
    name: "ddb-importer.character-update-policy-image.name",
    hint: "ddb-importer.character-update-policy-image.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-ddb-spell-icons", {
    name: "ddb-importer.character-update-policy-use-ddb-spell-icons.name",
    hint: "ddb-importer.character-update-policy-use-ddb-spell-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-ddb-generic-item-icons", {
    name: "ddb-importer.character-update-policy-use-ddb-generic-item-icons.name",
    hint: "ddb-importer.character-update-policy-use-ddb-generic-item-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-ddb-item-icons", {
    name: "ddb-importer.character-update-policy-use-ddb-item-icons.name",
    hint: "ddb-importer.character-update-policy-use-ddb-item-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-inbuilt-icons", {
    name: "ddb-importer.character-update-policy-use-inbuilt-icons.name",
    hint: "ddb-importer.character-update-policy-use-inbuilt-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-srd-icons", {
    name: "ddb-importer.character-update-policy-use-srd-icons.name",
    hint: "ddb-importer.character-update-policy-use-srd-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-full-description", {
    name: "ddb-importer.character-update-policy-full-description.name",
    hint: "ddb-importer.character-update-policy-full-description.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-action-and-feature", {
    name: "ddb-importer.character-update-policy-use-action-and-feature.name",
    hint: "ddb-importer.character-update-policy-use-action-and-feature.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-actions-as-features", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-dae-copy", {
    name: "ddb-importer.character-update-policy-dae-copy.name",
    hint: "ddb-importer.character-update-policy-dae-copy.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-dae-effect-copy", {
    name: "ddb-importer.character-update-policy-dae-effect-copy.name",
    hint: "ddb-importer.character-update-policy-dae-effect-copy.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-active-effect-copy", {
    name: "ddb-importer.character-update-policy-active-effect-copy.name",
    hint: "ddb-importer.character-update-policy-active-effect-copy.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-active-effect-character-copy", {
    name: "ddb-importer.character-update-policy-active-effect-character-copy.name",
    hint: "ddb-importer.character-update-policy-active-effect-character-copy.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  /** Munching update settings, stored per user and non-configurable in the settings screen */
  game.settings.register("ddb-importer", "munching-policy-update-existing", {
    name: "ddb-importer.munching-policy-update-existing.name",
    hint: "ddb-importer.munching-policy-update-existing.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-use-srd", {
    name: "ddb-importer.munching-policy-use-srd.name",
    hint: "ddb-importer.munching-policy-use-srd.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  // build compendium folders?
  game.settings.register("ddb-importer", "munching-policy-use-compendium-folders", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-selection-compendium-folders-monster", {
    name: "ddb-importer.munching-selection-compendium-folders-monster.name",
    hint: "ddb-importer.munching-selection-compendium-folders-monster.hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      TYPE: "Creature type, e.g. Undead",
      CR: "Challenge Rating",
      ALPHA: "Alphabetical",
    },
    default: "TYPE",
  });

  game.settings.register("ddb-importer", "munching-selection-compendium-folders-spell", {
    name: "ddb-importer.munching-selection-compendium-folders-spell.name",
    hint: "ddb-importer.munching-selection-compendium-folders-spell.hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      SCHOOL: "School of Magic",
      LEVEL: "Level",
    },
    default: "SCHOOL",
  });

  game.settings.register("ddb-importer", "munching-selection-compendium-folders-item", {
    name: "ddb-importer.munching-selection-compendium-folders-item.name",
    hint: "ddb-importer.munching-selection-compendium-folders-item.hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      TYPE: "Item Type",
      RARITY: "Rarity",
    },
    default: "TYPE",
  });

  game.settings.register("ddb-importer", "munching-policy-use-srd-icons", {
    name: "ddb-importer.munching-policy-use-srd-icons.name",
    hint: "ddb-importer.munching-policy-use-srd-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-use-inbuilt-icons", {
    name: "ddb-importer.munching-policy-use-inbuilt-icons.name",
    hint: "ddb-importer.munching-policy-use-inbuilt-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-use-ddb-item-icons", {
    name: "ddb-importer.munching-policy-use-ddb-item-icons.name",
    hint: "ddb-importer.munching-policy-use-ddb-item-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-use-ddb-spell-icons", {
    name: "ddb-importer.munching-policy-use-ddb-spell-icons.name",
    hint: "ddb-importer.munching-policy-use-ddb-spell-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-use-ddb-generic-item-icons", {
    name: "ddb-importer.munching-policy-use-ddb-generic-item-icons.name",
    hint: "ddb-importer.munching-policy-use-ddb-generic-item-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-use-full-token-image", {
    name: "ddb-importer.munching-policy-use-full-token-image.name",
    hint: "ddb-importer.munching-policy-use-full-token-image.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-use-token-avatar-image", {
    name: "ddb-importer.munching-policy-use-token-avatar-image.name",
    hint: "ddb-importer.munching-policy-use-token-avatar-image.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-remote-images", {
    name: "ddb-importer.munching-policy-remote-images.name",
    hint: "ddb-importer.munching-policy-remote-images.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-add-effects", {
    name: "ddb-importer.munching-policy-add-effects.name",
    hint: "ddb-importer.munching-policy-add-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-add-ac-armor-effects", {
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-download-images", {
    name: "ddb-importer.munching-policy-download-images.name",
    hint: "ddb-importer.munching-policy-download-images.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-dae-copy", {
    name: "ddb-importer.munching-policy-dae-copy.name",
    hint: "ddb-importer.munching-policy-dae-copy.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-use-dae-effects", {
    name: "ddb-importer.munching-policy-use-dae-effects.name",
    hint: "ddb-importer.munching-policy-use-dae-effects.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-hide-description", {
    name: "ddb-importer.munching-policy-hide-description.name",
    hint: "ddb-importer.munching-policy-hide-description.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-monster-items", {
    name: "ddb-importer.munching-policy-monster-items.name",
    hint: "ddb-importer.munching-policy-monster-items.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-monster-homebrew", {
    name: "ddb-importer.munching-policy-monster-homebrew.name",
    hint: "ddb-importer.munching-policy-monster-homebrew.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-monster-homebrew-only", {
    name: "ddb-importer.munching-policy-monster-homebrew-only.name",
    hint: "ddb-importer.munching-policy-monster-homebrew-only.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-update-images", {
    name: "ddb-importer.munching-policy-update-images.name",
    hint: "ddb-importer.munching-policy-update-images.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-monster-exact-match", {
    name: "ddb-importer.munching-policy-monster-match.name",
    hint: "ddb-importer.munching-policy-monster-match.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "munching-policy-monster-sources", {
    name: "ddb-importer.munching-policy-monster-sources.name",
    hint: "ddb-importer.munching-policy-monster-sources.hint",
    scope: "player",
    config: false,
    type: Array,
    default: [],
  });

  // sets the current tutorial step the user has completed
  // game.settings.register("ddb-importer", "tutorial-step", {
  //   scope: "world",
  //   config: false,
  //   type: Number,
  //   default: 0,
  // });
  // sets the current tutorial step the user has completed
  // game.settings.register("ddb-importer", "tutorial-user", {
  //   scope: "world",
  //   config: false,
  //   type: String,
  //   default: "",
  // });
  // sets the current tutorial step the user has completed
  // game.settings.register("ddb-importer", "popup-version", {
  //   scope: "world",
  //   config: false,
  //   type: String,
  //   default: "1.0.0",
  // });
  // sets the user submission name for scene adjustments
  // game.settings.register("ddb-importer", "scene-submission-username", {
  //   scope: "user",
  //   config: false,
  //   type: String,
  //   default: "",
  // });
  game.settings.register("ddb-importer", "cobalt-cookie", {
    name: "ddb-importer.cobalt-cookie.name",
    hint: "ddb-importer.cobalt-cookie.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("ddb-importer", "cobalt-cookie-local", {
    name: "ddb-importer.cobalt-cookie-local.name",
    hint: "ddb-importer.cobalt-cookie-local.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  if (game.user.isGM && game.settings.get("ddb-importer", "cobalt-cookie-local") &&
    game.settings.get("ddb-importer", "cobalt-cookie") != "") {
    game.settings.set("ddb-importer", "cobalt-cookie-local", false);
  }

  game.settings.register("ddb-importer", "campaign-id", {
    name: "ddb-importer.campaign-id.name",
    hint: "ddb-importer.campaign-id.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("ddb-importer", "sync-policy-currency", {
    name: "ddb-importer.sync-policy-currency.name",
    hint: "ddb-importer.sync-policy-currency.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-hitpoints", {
    name: "ddb-importer.sync-policy-hitpoints.name",
    hint: "ddb-importer.sync-policy-hitpoints.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-hitdice", {
    name: "ddb-importer.sync-policy-hitdice.name",
    hint: "ddb-importer.sync-policy-hitdice.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-action-use", {
    name: "ddb-importer.sync-policy-action-use.name",
    hint: "ddb-importer.sync-policy-action-use.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-inspiration", {
    name: "ddb-importer.sync-policy-inspiration.name",
    hint: "ddb-importer.sync-policy-inspiration.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-condition", {
    name: "ddb-importer.sync-policy-condition.name",
    hint: "ddb-importer.sync-policy-condition.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-deathsaves", {
    name: "ddb-importer.sync-policy-deathsaves.name",
    hint: "ddb-importer.sync-policy-deathsaves.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-spells-prepared", {
    name: "ddb-importer.sync-policy-spells-prepared.name",
    hint: "ddb-importer.sync-policy-spells-prepared.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-spells-slots", {
    name: "ddb-importer.sync-policy-spells-slots.name",
    hint: "ddb-importer.sync-policy-spells-slots.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-spells-sync", {
    name: "ddb-importer.sync-policy-spells-sync.name",
    hint: "ddb-importer.sync-policy-spells-sync.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-equipment", {
    name: "ddb-importer.sync-policy-equipment.name",
    hint: "ddb-importer.sync-policy-equipment.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "sync-policy-xp", {
    name: "ddb-importer.sync-policy-xp.name",
    hint: "ddb-importer.sync-policy-xp.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "encounter-import-policy-create-scene", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "encounter-import-policy-missing-characters", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "encounter-import-policy-missing-monsters", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "encounter-import-policy-create-journal", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "encounter-import-policy-roll-monster-initiative", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "encounter-import-policy-use-ddb-save", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "adventure-muncher-full-config", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "dynamic-sync", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "dynamic-sync-user", {
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  if (game.settings.get("ddb-importer", "dynamic-sync-user") === "" && game.user.isGM) {
    game.settings.set("ddb-importer", "dynamic-sync-user", game.user.id);
  }


  game.settings.register("ddb-importer", "dynamic-sync-policy-currency", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-hitpoints", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-hitdice", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-action-use", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-inspiration", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-condition", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-deathsaves", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-spells-prepared", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-spells-slots", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-spells-sync", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-equipment", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "dynamic-sync-policy-xp", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });
}
