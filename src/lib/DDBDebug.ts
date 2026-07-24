import utils from "./Utils";
import DDBProxy from "./DDBProxy";
import PatreonHelper from "./PatreonHelper";
import * as Secrets from "./Secrets";
import FileHelper from "./FileHelper";
import MuncherSettings from "./MuncherSettings";

interface IDDBDebugSecrets {
  cobalt: { success: boolean; message: string };
  isLocalCobalt: boolean;
  ddbUser: Awaited<ReturnType<typeof Secrets.getUserData>>;
  proxy: {
    isCustom: boolean;
    proxy: string;
  };
  patreon: {
    tier: IPatreonAccessMatrix;
    tierLocal: IPatreonAccessMatrix;
  };
  dnd5e: {
    version: string;
  };
}

export default class DDBDebug {

  debug: boolean;

  sources: IIdLabelBoolAcronymLookup[] | { excluded: IIdLabelSelectedLookup[] };

  monsterTypes: IIdLabelSelectedLookup[];

  muncherSettings: {
    character: ICharacterImportSettings;
    muncher: IMuncherSettings;
    encounter: IEncounterSettings;
  };

  ddbSettings: Record<string, any>;

  ddbChangedSettings: Record<string, unknown>;

  versions: {
    game: string;
    system: string;
    ddbimporter: string;
  };

  modules: {
    active: string[];
    excludingKnown: string[];
    exclusionString: string;
  };

  actor: TImporterActor | null | undefined;

  secrets: IDDBDebugSecrets | null;

  extra: Record<string, unknown>;

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
    "tokenizer-2",
    "snip-snip-snip",
    "auto-grid",
    "forge-vtt",
    "find-the-culprit",
    "dice-so-nice",
    "notelicker",
    "snipsnipsnip",
    "tokenizer-2",
  ];

  static fixCircularReferences(obj?: unknown) {

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
    return (k: unknown, v: unknown) => {
      if (k && v == obj) return "[" + k + " is the same as original object]";
      if (v === undefined) return undefined;
      if (v === null) return null;
      const weirdType = weirdTypes.find((t) => v instanceof t);
      if (weirdType) return weirdType.toString();
      if (typeof (v) == "function") {
        return v.toString();
      }
      if (v && typeof (v) == "object") {
        const def = defs.get(v);
        if (def) return "[" + k + " is the same as " + def + "]";
        defs.set(v, k);
      }
      return v;
    };
  }

  constructor({ actor, extra = {} }: { actor?: TImporterActor | null; extra?: Record<string, unknown> } = {}) {
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
      const value = utils.getSetting<unknown>(key, DDBImporter.SETTINGS.MODULE_ID);
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
      ddbimporter: game.modules.get("ddb-importer")?.version ?? "unknown",
    };

    this.modules = {
      active: game.modules.filter((m) => m.active).map((m) => m.id),
      excludingKnown: game.modules.filter((m) => m.active && !DDBDebug.KNOWN_MODULES.includes(m.id)).map((m) => m.id),
      exclusionString: game.modules.filter((m) => m.active && !DDBDebug.KNOWN_MODULES.includes(m.id)).map((m) => m.title).join(", "),
    };

    this.actor = actor;

    delete (this.muncherSettings.character as Partial<ICharacterImportSettings>).installedModulesText;

    const types = ["character", "muncher", "encounter"];

    for (const type of types) {
      const typeSettings = foundry.utils.getProperty(this.muncherSettings, type) as Record<string, any>;
      for (const [key, setting] of Object.entries(typeSettings)) {
        if (!utils.isArray(setting)) continue;
        typeSettings[key] = setting.map((s: Record<string, any>) => {
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
      capturedErrors: JSON.parse(JSON.stringify(CONFIG.DDBI.CAPTURED_ERRORS ?? [], DDBDebug.fixCircularReferences())),
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
      cobalt: await Secrets.checkCobalt(this.actor?.id ?? undefined),
      isLocalCobalt: Secrets.isLocalCobalt(this.actor?.id ?? null),
      ddbUser: await Secrets.getUserData(this.actor?.id ?? undefined),
      proxy: {
        isCustom: await DDBProxy.isCustom(),
        proxy: await DDBProxy.getProxy(),
      },
      patreon: {
        tier: await PatreonHelper.checkPatreon(),
        tierLocal: await PatreonHelper.checkPatreon({ local: true }),
      },
      dnd5e: {
        version: utils.getSetting<string>("rulesVersion", "dnd5e"),
      },
    }) as IDDBDebugSecrets;
    const ddbUserData = this.secrets.ddbUser?.data;
    if (ddbUserData) {
      const redactable: Partial<typeof ddbUserData> = ddbUserData;
      delete redactable.firstName;
      delete redactable.lastName;
      delete redactable.email;
      delete redactable.twitchUserName;
    }
  }

  static async generateDebug({ actor, extra }: { actor?: TImporterActor | null; extra?: Record<string, unknown> } = {}) {
    const debug = new DDBDebug({ actor, extra });
    await debug.fetch();
    return debug.data;
  }


}
