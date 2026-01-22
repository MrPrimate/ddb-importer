import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { FileHelper } from "../../lib/_module.mjs";
import DDBSetup from "../../apps/DDBSetup.js";

foundry.utils.setProperty(CONFIG, "DDBI", {
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
  CAPTURED_ERRORS: [],
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
    mapLoaded: {
      "2014": false,
      "2024": false,
    },
    iconMap: {},
    packsLoaded: {},
    packs: {},
  },
  DEV: {
    enabled: false,
    clippy: {},
    tableInUse: false,
    deleteAllBeforeUpdate: false,
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

async function createFolderPaths() {
  const characterUploads = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
  const otherUploads = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory");
  const frameUploads = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory");
  const adventureUploads = game.settings.get(SETTINGS.MODULE_ID, "adventure-upload-path");
  const iconUploads = game.settings.get(SETTINGS.MODULE_ID, "adventure-misc-path");
  const persistentUploads = game.settings.get(SETTINGS.MODULE_ID, "persistent-storage-location");

  for (const path of [
    characterUploads,
    otherUploads,
    frameUploads,
    adventureUploads,
    iconUploads,
    persistentUploads,
  ]) {
    if (!path || path === "") {
      throw new Error(`DDB Importer: Invalid folder path "${path}" in settings.`);
    } else {
      const parsedPath = FileHelper.parseDirectory(path);
      await FileHelper.generateCurrentFilesFromParsedDir(parsedPath, false);
    }
  }

  if (game.user.isGM) {
    FileHelper.verifyPath(FileHelper.parseDirectory(characterUploads));
    if (!(await FileHelper.doesDirExist(otherUploads))) {
      await game.settings.set(SETTINGS.MODULE_ID, "use-deep-file-paths", true);
    }
    FileHelper.verifyPath(FileHelper.parseDirectory(otherUploads));
    FileHelper.verifyPath(FileHelper.parseDirectory(frameUploads));
    FileHelper.verifyPath(FileHelper.parseDirectory(adventureUploads));
    FileHelper.verifyPath(FileHelper.parseDirectory(iconUploads));
    FileHelper.verifyPath(FileHelper.parseDirectory(persistentUploads));
  }
}

export default async function () {

  game.settings.registerMenu(SETTINGS.MODULE_ID, 'setupMenu', {
    name: `${SETTINGS.MODULE_ID}.settings.setup.name`,
    label: `${SETTINGS.MODULE_ID}.settings.setup.name`,
    hint: `${SETTINGS.MODULE_ID}.settings.setup.hint`,
    icon: 'fas fa-wrench',
    type: DDBSetup,
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

  const currentDynamicSyncUser = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-user");
  if (currentDynamicSyncUser !== "" && !game.users.some((i) => i.isGM && i.id === currentDynamicSyncUser)) {
    if (game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync")) {
      await game.settings.set(SETTINGS.MODULE_ID, "dynamic-sync-user", game.user.id);
    } else {
      await game.settings.set(SETTINGS.MODULE_ID, "dynamic-sync-user", "");
    }
  }

  if (game.settings.get(SETTINGS.MODULE_ID, "developer-mode")) {
    CONFIG.DDBI.DEV.enabled = true;
  }

}
