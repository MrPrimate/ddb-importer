import { DDBProxy, PatreonHelper, Secrets, utils } from "./_module.mjs";
import FileHelper from "./FileHelper.mjs";
import MuncherSettings from "./MuncherSettings.mjs";

export default class DDBDebug {

  static KNOWN_MODULES = [
    "ATL",
    "ActiveAuras",
    "auraeffects",
    "dae",
    "ddb-importer",
    "dnd-dungeon-masters-guide",
    "dnd-monster-manual",
    "dnd-players-handbook",
    "dnd-tashas-cauldron",
    "dnd-heroes-faerun",
    "dnd-forge-artificer",
    "lib-wrapper",
    "midi-qol",
    "socketlib",
    "stairways",
    "tidy5e-sheet",
    "times-up",
    "vision-5e",
    "vtta-tokenizer",
    "forge-vtt",
    "find-the-culprit",
    "dice-so-nice",
    "notelicker",
  ];

  static fixCircularReferences(obj) {

    const weirdTypes = [
      Int8Array,
      Uint8Array,
      Uint8ClampedArray,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      BigInt64Array,
      BigUint64Array,
      // Float16Array,
      Float32Array,
      Float64Array,
      ArrayBuffer,
      // SharedArrayBuffer,
      DataView,
    ];

    const defs = new Map();
    return (k, v) => {
      if (k && v == obj) return '[' + k + ' is the same as original object]';
      if (v === undefined) return undefined;
      if (v === null) return null;
      const weirdType = weirdTypes.find((t) => v instanceof t);
      if (weirdType) return weirdType.toString();
      if (typeof (v) == 'function') {
        return v.toString();
      }
      if (v && typeof (v) == 'object') {
        const def = defs.get(v);
        if (def) return '[' + k + ' is the same as ' + def + ']';
        defs.set(v, k);
      }
      return v;
    };
  }

  constructor({ actor, extra } = {}) {
    this.debug = true;
    this.sources = MuncherSettings.getSourcesLookups();
    this.monsterTypes = MuncherSettings.getMonsterTypeLookups();
    this.sources = {
      excluded: MuncherSettings.getExcludedCategoriesLookup(),
    };
    this.muncherSettings = {
      character: MuncherSettings.getCharacterImportSettings(),
      muncher: MuncherSettings.getMuncherSettings(),
      encounter: MuncherSettings.getEncounterSettings(),
    };
    this.ddbSettings = DDBImporter.SETTINGS.GET_ALL_SETTINGS();
    this.ddbChangedSettings = {};

    for (const [key, setting] of Object.entries(this.ddbSettings)) {
      const value = game.settings.get(DDBImporter.SETTINGS.MODULE_ID, key);
      if (value !== setting.default) {
        if (["beta-key", "cobalt-cookie", "patreon-key"].includes(key)) {
          this.ddbChangedSettings[key] = "REDACTED";
        } else {
          this.ddbChangedSettings[key] = value;
        }
      }
    }

    this.ddbSettings["beta-key"] = "REDACTED";
    this.ddbSettings["cobalt-cookie"] = "REDACTED";
    this.ddbSettings["patreon-key"] = "REDACTED";

    this.versions = {
      game: game.version,
      system: game.system.version,
      ddbimporter: game.modules.get("ddb-importer").version,
    };

    this.modules = {
      active: game.modules.filter((m) => m.active).map((m) => m.id),
      excludingKnown: game.modules.filter((m) => m.active && !DDBDebug.KNOWN_MODULES.includes(m.id)).map((m) => m.id),
      exclusionString: game.modules.filter((m) => m.active && !DDBDebug.KNOWN_MODULES.includes(m.id)).map((m) => m.title).join(", "),
    };

    this.actor = actor;

    delete this.muncherSettings.character.installedModulesText;

    const types = ["character", "muncher", "encounter"];

    for (const type of types) {
      for (const [key, setting] of Object.entries(this.muncherSettings[type])) {
        if (!utils.isArray(setting)) continue;
        this.muncherSettings[type][key] = setting.map((s) => {
          delete s.hint;
          return s;
        });
      }
    }

    this.secrets = null;

    this.extra = foundry.utils.duplicate(extra);
  }

  get data() {
    return {
      secrets: this.secrets,
      ddbChangedSettings: this.ddbChangedSettings,
      versions: this.versions,
      modules: this.modules,
      capturedErrors: foundry.utils.duplicate(CONFIG.DDBI.CAPTURED_ERRORS),
      actor: this.actor
        ? {
          id: `${this.actor.id}`,
          characterId: foundry.utils.getProperty(this.actor, "flags.ddbimporter.dndbeyond.characterId"),
        }
        : undefined,
      extra: this.extra,
    };
  }

  download() {
    FileHelper.download(JSON.stringify(this.data, DDBDebug.fixCircularReferences(), 2), `${game.world.id}.json`, "application/json");
  }

  async fetch() {
    this.secrets = foundry.utils.duplicate({
      cobalt: await Secrets.checkCobalt(this.actor?.id),
      isLocalCobalt: Secrets.isLocalCobalt(this.actor?.id),
      ddbUser: await Secrets.getUserData(this.actor?.id),
      proxy: {
        isCustom: await DDBProxy.isCustom(),
        proxy: await DDBProxy.getProxy(),
      },
      patreon: {
        tier: await PatreonHelper.checkPatreon(),
        tierLocal: await PatreonHelper.checkPatreon(true),
      },
    });
    if (this.secrets.ddbUser?.data) {
      delete this.secrets.ddbUser.data.firstName;
      delete this.secrets.ddbUser.data.lastName;
      delete this.secrets.ddbUser.data.email;
      delete this.secrets.ddbUser.data.twitchUserName;
    }
  }

  static async generateDebug({ actor, extra } = {}) {
    const debug = new DDBDebug({ actor, extra });
    await debug.fetch();
    return debug.data;
  }


}
