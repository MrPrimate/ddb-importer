import { DICTIONARY, SETTINGS } from "../../config/_module";
import { FileHelper, utils } from "../../lib/_module";
import DDBSetup from "../../apps/DDBSetup";

interface IDDBIMacros {
  spell: Record<string, any>;
  gm: Record<string, any>;
  item: Record<string, any>;
  feat: Record<string, any>;
}

interface IDDBIKnownForge {
  TARGET_URL_PREFIX: Record<string, any>;
  TARGETS: Record<string, any>;
}

interface IDDBIKnown {
  CHECKED_DIRS: Set<string>;
  FILES: Set<string>;
  DIRS: Set<string>;
  LOOKUPS: Map<string, any>;
  TOKEN_LOOKUPS: Map<string, any>;
  AVATAR_LOOKUPS: Map<string, any>;
  FORGE: IDDBIKnownForge;
}

interface IDDBISRDLoad {
  mapLoaded: {
    "2014": boolean;
    "2024": boolean;
  };
  iconMap: Record<string, any>;
  packsLoaded: Record<string, any>;
  packs: Record<string, any>;
}

interface IDDBIDev {
  enabled: boolean;
  clippy: Record<string, any>;
  tableInUse: boolean;
  deleteAllBeforeUpdate: boolean;
  downloadJSONExamples: boolean;
  downloadRAWJSONExamples: boolean;
  downloadUpdateJSON: boolean;
  downloadFinalActorJSON: boolean;
  itemImportSingle: boolean;
  multiattackNotes: boolean;
}

interface IDDBIEffectConfigModules {
  installedModules: any;
  configured: boolean;
}

interface IDDBIEffectConfig {
  MODULES: IDDBIEffectConfigModules;
}

interface IDDBIPopups {
  json: Window | null;
  web: Window | null;
}

export interface IDDBIConfig {
  module: string;
  schemaVersion: number;
  DICTIONARY: any;
  ADVENTURE: Record<string, any>;
  MACROS: IDDBIMacros;
  CAPTURED_ERRORS: any[];
  KNOWN: IDDBIKnown;
  ICONS: Record<string, any>;
  TABLES: Record<string, any>;
  SRD_LOAD: IDDBISRDLoad;
  DEV: IDDBIDev;
  EFFECT_CONFIG: IDDBIEffectConfig;
  POPUPS: IDDBIPopups;
  ignoreEnrichedImages?: boolean;
  keyPostfix?: string;
  useLocal?: boolean;
  monsterURL?: string;
  version?: string;
  NO_MULTIATTACK?: string[];
  NO_MULTIATTACK_DETAILS?: Record<string, any>[];
  MULTIATTACK_MATCHES?: Set<string>[];
  MULTIATTACK_MATCHES_DETAILS?: Record<string, any>[];
}

if (!(CONFIG as any).DDBI) {
  (CONFIG as any).DDBI = {
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
      downloadJSONExamples: false,
      downloadRAWJSONExamples: false,
      downloadUpdateJSON: false,
      downloadFinalActorJSON: false,
      itemImportSingle: false,
      multiattackNotes: false,
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
  } as IDDBIConfig;
}

async function createFolderPaths() {
  const characterUploads = utils.getSetting<string>("image-upload-directory");
  const otherUploads = utils.getSetting<string>("other-image-upload-directory");
  const frameUploads = utils.getSetting<string>("frame-image-upload-directory");
  const adventureUploads = utils.getSetting<string>("adventure-upload-path");
  const iconUploads = utils.getSetting<string>("adventure-misc-path");
  const persistentUploads = utils.getSetting<string>("persistent-storage-location");

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

  game.settings.registerMenu(SETTINGS.MODULE_ID, "setupMenu", {
    name: `${SETTINGS.MODULE_ID}.settings.setup.name`,
    label: `${SETTINGS.MODULE_ID}.settings.setup.name`,
    hint: `${SETTINGS.MODULE_ID}.settings.setup.hint`,
    icon: "fas fa-wrench",
    type: DDBSetup as any,
    restricted: true,
  });

  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS())) {
    game.settings.register(SETTINGS.MODULE_ID, name as any, data as any);
  }

  // SETTING TWEAKS AND MIGRATIONS
  await createFolderPaths();

  if (game.user.isGM && game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local")
    && utils.getSetting<string>("cobalt-cookie") != "") {
    game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", false);
  }

  const currentDynamicSyncUser = utils.getSetting<string>("dynamic-sync-user");
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
