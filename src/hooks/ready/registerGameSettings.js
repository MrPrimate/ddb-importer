import DirectoryPicker from "../../lib/DirectoryPicker.js";

export default function () {
  const actorCompendiums = game.packs
    .filter((pack) => pack.entity === "Actor")
    .reduce((choices, pack) => {
      choices[pack.collection] = `[${pack.metadata.package}] ${pack.metadata.label}`;
      return choices;
    }, {});

  const itemCompendiums = game.packs
    .filter((pack) => pack.entity === "Item")
    .reduce((choices, pack) => {
      choices[pack.collection] = `[${pack.metadata.package}] ${pack.metadata.label}`;
      return choices;
    }, {});

  game.settings.register("ddb-importer", "image-upload-directory", {
    name: "ddb-importer.image-upload-directory.name",
    hint: "ddb-importer.image-upload-directory.hint",
    scope: "world",
    config: true,
    type: DirectoryPicker.Directory,
    default: "[data] ",
  });

  // game.settings.register("ddb-importer", "scene-upload-directory", {
  //   name: "ddb-importer.scene-upload-directory.name",
  //   hint: "ddb-importer.scene-upload-directory.hint",
  //   scope: "world",
  //   config: true,
  //   type: DirectoryPicker.Directory,
  //   default: "[data] ",
  // });

  // game.settings.register("ddb-importer", "scene-format", {
  //   name: "ddb-importer.scene-format.name",
  //   hint: "ddb-importer.scene-format.hint",
  //   scope: "world",
  //   config: true,
  //   type: String,
  //   choices: ["ddb-importer.scene-format.0", "ddb-importer.scene-format.1"],
  //   default: 0,
  // });

  game.settings.register("ddb-importer", "entity-import-policy", {
    name: "ddb-importer.entity-import-policy.name",
    hint: "ddb-importer.entity-import-policy.hint",
    scope: "world",
    config: false,
    type: Number,
    default: 1,
    choices: [
      "ddb-importer.entity-import-policy.0",
      "ddb-importer.entity-import-policy.1",
      "ddb-importer.entity-import-policy.2",
    ],
  });

  // game.settings.register("ddb-importer", "entity-cleanup-policy", {
  //   name: "ddb-importer.entity-cleanup-policy.name",
  //   hint: "ddb-importer.entity-cleanup-policy.hint",
  //   scope: "world",
  //   config: true,
  //   type: Number,
  //   default: 0,
  //   choices: [
  //     "ddb-importer.entity-cleanup-policy.0",
  //     "ddb-importer.entity-cleanup-policy.1",
  //     "ddb-importer.entity-cleanup-policy.2",
  //     "ddb-importer.entity-cleanup-policy.3",
  //   ],
  // });

  game.settings.register("ddb-importer", "entity-item-compendium", {
    name: "ddb-importer.entity-item-compendium.name",
    hint: "ddb-importer.entity-item-compendium.hint",
    scope: "world",
    config: true,
    type: String,
    isSelect: true,
    choices: itemCompendiums,
  });

  game.settings.register("ddb-importer", "entity-feature-compendium", {
    name: "ddb-importer.entity-feature-compendium.name",
    hint: "ddb-importer.entity-feature-compendium.hint",
    scope: "world",
    config: true,
    type: String,
    isSelect: true,
    choices: itemCompendiums,
  });

  game.settings.register("ddb-importer", "entity-spell-compendium", {
    name: "ddb-importer.entity-spell-compendium.name",
    hint: "ddb-importer.entity-spell-compendium.hint",
    scope: "world",
    config: true,
    type: String,
    isSelect: true,
    choices: itemCompendiums,
  });

  game.settings.register("ddb-importer", "entity-monster-compendium", {
    name: "ddb-importer.entity-monster-compendium.name",
    hint: "ddb-importer.entity-monster-compendium.hint",
    scope: "world",
    config: true,
    type: String,
    isSelect: true,
    choices: actorCompendiums,
  });

  // game.settings.register("ddb-importer", "entity-monster-feature-compendium", {
  //   name: "ddb-importer.entity-monster-feature-compendium.name",
  //   hint: "ddb-importer.entity-monster-feature-compendium.hint",
  //   scope: "world",
  //   config: true,
  //   type: String,
  //   isSelect: true,
  //   choices: itemCompendiums,
  // });

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
    default: "https://ddb.mrprimate.co.uk",
  });

  game.settings.register("ddb-importer", "beta-key", {
    name: "ddb-importer.beta-key.name",
    hint: "ddb-importer.beta-key.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
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
  game.settings.register("ddb-importer", "character-update-policy-new", {
    name: "ddb-importer.character-update-policy-new.name",
    hint: "ddb-importer.character-update-policy-new.hint",
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

  game.settings.register("ddb-importer", "character-update-policy-use-srd", {
    name: "ddb-importer.character-update-policy-use-srd.name",
    hint: "ddb-importer.character-update-policy-use-srd.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "character-update-policy-use-srd-icons", {
    name: "ddb-importer.character-update-policy-use-srd-icons.name",
    hint: "ddb-importer.character-update-policy-use-srd-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  // Character update policy

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

  game.settings.register("ddb-importer", "character-update-policy-dae-copy", {
    name: "ddb-importer.character-update-policy-dae-copy.name",
    hint: "ddb-importer.character-update-policy-dae-copy.hint",
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

  game.settings.register("ddb-importer", "munching-policy-use-srd-icons", {
    name: "ddb-importer.munching-policy-use-srd-icons.name",
    hint: "ddb-importer.munching-policy-use-srd-icons.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-use-iconizer", {
    name: "ddb-importer.munching-policy-use-iconizer.name",
    hint: "ddb-importer.munching-policy-use-iconizer.hint",
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

  game.settings.register("ddb-importer", "munching-policy-remote-images", {
    name: "ddb-importer.munching-policy-remote-images.name",
    hint: "ddb-importer.munching-policy-remote-images.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: true,
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
    default: true,
  });

  game.settings.register("ddb-importer", "munching-policy-hide-description", {
    name: "ddb-importer.munching-policy-hide-description.name",
    hint: "ddb-importer.munching-policy-hide-description.hint",
    scope: "player",
    config: false,
    type: Boolean,
    default: false,
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
    config: true,
    type: String,
    default: "",
  });
  game.settings.register("ddb-importer", "campaign-id", {
    name: "ddb-importer.campaign-id.name",
    hint: "ddb-importer.campaign-id.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });
}
