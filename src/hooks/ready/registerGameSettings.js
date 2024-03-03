import DICTIONARY from "../../dictionary.js";
import { DDBProxySetup } from "../../apps/DDBProxySetup.js";
import { DirectoryPicker } from "../../lib/DirectoryPicker.js";
import DDBDynamicUpdateSetup from "../../apps/DDBDynamicUpdateSetup.js";
import DDBSetup from "../../apps/DDBSetup.js";
import DDBCompendiumSetup from "../../apps/DDBCompendiumSetup.js";
import DDBLocationSetup from "../../apps/DDBLocationSetup.js";
import SETTINGS from "../../settings.js";
import FileHelper from "../../lib/FileHelper.js";

setProperty(CONFIG, "DDBI", {
  module: "DDB Importer",
  schemaVersion: 5.0,
  DICTIONARY: DICTIONARY,
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
    DIRS: new Set(),
    LOOKUPS: new Map(),
    TOKEN_LOOKUPS: new Map(),
    AVATAR_LOOKUPS: new Map(),
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
    enabled: false,
    clippy: {},
    tableInUse: false,
  },
  EFFECT_CONFIG: {
    MODULES: {
      installedModules: null,
      configured: false,
    },
  },
  POPUPS: {
    json: null,
    web: null,
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

async function createFolderPaths() {
  if (game.user.isGM) {
    const characterUploads = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(characterUploads));

    const otherUploads = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory");
    if (!(await FileHelper.doesDirExist(otherUploads))) {
      await game.settings.set(SETTINGS.MODULE_ID, "use-deep-file-paths", true);
    }
    DirectoryPicker.verifyPath(DirectoryPicker.parse(otherUploads));


    const frameUploads = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(frameUploads));

    const adventureUploads = game.settings.get(SETTINGS.MODULE_ID, "adventure-upload-path");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(adventureUploads));

    const iconUploads = game.settings.get(SETTINGS.MODULE_ID, "adventure-misc-path");
    DirectoryPicker.verifyPath(DirectoryPicker.parse(iconUploads));
  }
}

export default async function () {

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
  await createFolderPaths();

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

  // reset settings
  game.settings.registerMenu(SETTINGS.MODULE_ID, "ddbProxy", {
    name: `${SETTINGS.MODULE_ID}.Dialogs.DDBProxy.Title`,
    label: `${SETTINGS.MODULE_ID}.Dialogs.DDBProxy.Label`,
    hint: `${SETTINGS.MODULE_ID}.Dialogs.DDBProxy.Hint`,
    icon: "fas fa-ethernet",
    type: DDBProxySetup,
    restricted: true,
  });


  if (game.settings.get(SETTINGS.MODULE_ID, "developer-mode")) {
    CONFIG.DDBI.DEV.enabled = true;
  }

}
