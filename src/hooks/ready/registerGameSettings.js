import { DirectoryPicker } from "../../lib/DirectoryPicker.js";
import { DDBSetup, DDBCompendiumSetup, DDBDynamicUpdateSetup, DDBLocationSetup } from "../../lib/Settings.js";
import SETTINGS from "../../settings.js";

setProperty(CONFIG, "DDBI", {
  module: "DDB Importer",
  schemaVersion: 4.1,
  ADVENTURE: {},
  MACROS: {
    spell: {},
    gm: {},
    item: {},
    feat: {},
  },
  KNOWN: {
    CHECKED_DIRS: new Set(),
    FILES: new Set(),
    FORGE: {
      TARGET_URL_PREFIX: {},
      TARGETS: {},
    },
  },
  ICONS: {},
  TABLES: {},
  SRD_LOAD: {
    mapLoaded: false,
    iconMap: {},
    packsLoaded: {},
    packs: {},
  },
  DEV: {
    clippy: {},
    tableInUse: false,
  },
  EFFECT_CONFIG: {
    MONSTERS: {
      installedModules: null,
      configured: false,
    },
    FEATS: {
      installedModules: null,
      configured: false,
    },
    SPELLS: {
      installedModules: null,
      configured: false,
    },
  },
});

async function resetSettings() {
  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS())) {
    // eslint-disable-next-line no-await-in-loop
    await game.settings.set(SETTINGS.MODULE_ID, name, data.default);
  }
  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS(true))) {
    // eslint-disable-next-line no-await-in-loop
    await game.settings.set(SETTINGS.MODULE_ID, name, data.default);
  }
  window.location.reload();
}

class ResetSettingsDialog extends FormApplication {
  constructor(...args) {
    super(...args);
    // eslint-disable-next-line no-constructor-return
    return new Dialog({
      title: game.i18n.localize(`${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Title`),
      content: `<p class="${SETTINGS.MODULE_ID}-dialog-important">${game.i18n.localize(
        `${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Content`
      )}</p>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize(`${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Confirm`),
          callback: () => {
            resetSettings();
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize(`${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Cancel`),
        },
      },
      default: "cancel",
    });
  }
}

function createFolderPaths() {
  if (game.user.isGM) {
    const characterUploads = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
    const otherUploads = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory");
    if (characterUploads !== "[data] ddb-images/characters" && otherUploads === "[data] ddb-images/other") {
      game.settings.set(SETTINGS.MODULE_ID, "other-image-upload-directory", characterUploads);
    } else {
      DirectoryPicker.verifyPath(DirectoryPicker.parse(otherUploads));
    }
    DirectoryPicker.verifyPath(DirectoryPicker.parse(characterUploads));

    const frameUploads = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(frameUploads));

    const adventureUploads = game.settings.get(SETTINGS.MODULE_ID, "adventure-upload-path");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(adventureUploads));

    const iconUploads = game.settings.get(SETTINGS.MODULE_ID, "adventure-misc-path");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(iconUploads));
  }
}

export default function () {

  game.settings.registerMenu(SETTINGS.MODULE_ID, 'setupMenu', {
    name: `${SETTINGS.MODULE_ID}.settings.setup.name`,
    label: `${SETTINGS.MODULE_ID}.settings.setup.name`,
    hint: `${SETTINGS.MODULE_ID}.settings.setup.hint`,
    icon: 'fas fa-wrench',
    type: DDBSetup,
    restricted: true
  });

  game.settings.registerMenu(SETTINGS.MODULE_ID, 'compendiumMenu', {
    name: `${SETTINGS.MODULE_ID}.settings.compendium-setup.name`,
    label: `${SETTINGS.MODULE_ID}.settings.compendium-setup.name`,
    hint: `${SETTINGS.MODULE_ID}.settings.compendium-setup.hint`,
    icon: 'fas fa-wrench',
    type: DDBCompendiumSetup,
    restricted: true
  });

  game.settings.registerMenu(SETTINGS.MODULE_ID, 'folderMenu', {
    name: `${SETTINGS.MODULE_ID}.settings.folder-setup.name`,
    label: `${SETTINGS.MODULE_ID}.settings.folder-setup.name`,
    hint: `${SETTINGS.MODULE_ID}.settings.folder-setup.hint`,
    icon: 'fas fa-wrench',
    type: DDBLocationSetup,
    restricted: true
  });

  game.settings.registerMenu(SETTINGS.MODULE_ID, 'dynamicUpdateMenu', {
    name: `${SETTINGS.MODULE_ID}.settings.dynamic-update-setup.name`,
    label: `${SETTINGS.MODULE_ID}.settings.dynamic-update-setup.name`,
    hint: `${SETTINGS.MODULE_ID}.settings.dynamic-update-setup.hint`,
    icon: 'fas fa-wrench',
    type: DDBDynamicUpdateSetup,
    restricted: true,
  });

  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS())) {
    game.settings.register(SETTINGS.MODULE_ID, name, data);
  }

  // SETTING TWEAKS AND MIGRATIONS
  createFolderPaths();

  const ddbProxy = game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");
  if (ddbProxy === "https://ddb.mrprimate.co.uk") {
    game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", "https://proxy.ddb.mrprimate.co.uk");
  }

  const corsEndpoint = game.settings.get(SETTINGS.MODULE_ID, "cors-endpoint");
  if (corsEndpoint === "https://london.drop.mrprimate.co.uk/") {
    game.settings.set(SETTINGS.MODULE_ID, "cors-endpoint", "https://images.ddb.mrprimate.co.uk/");
  }

  if (game.user.isGM && game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local")
    && game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie") != "") {
    game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", false);
  }

  if (game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-user") === "" && game.user.isGM) {
    game.settings.set(SETTINGS.MODULE_ID, "dynamic-sync-user", game.user.id);
  }

  // reset settings
  game.settings.registerMenu(SETTINGS.MODULE_ID, "resetToDefaults", {
    name: `${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Title`,
    label: `${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Label`,
    hint: `${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Hint`,
    icon: "fas fa-refresh",
    type: ResetSettingsDialog,
    restricted: true,
  });
}
