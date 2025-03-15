import FileHelper from "./FileHelper.mjs";
import MuncherSettings from "./MuncherSettings.mjs";

export default class DDBDebug {

  constructor() {
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
        if (["beta-key", "cobalt-cookie"].includes(key)) {
          this.ddbChangedSettings[key] = "REDACTED";
        } else {
          this.ddbChangedSettings[key] = value;
        }
      }
    }

    this.ddbSettings["beta-key"] = "REDACTED";
    this.ddbSettings["cobalt-cookie"] = "REDACTED";

    this.versions = {
      game: game.version,
      system: game.system.version,
      ddbimporter: game.modules.get("ddb-importer").version,
    };

    const knownModules = [
      "ATL",
      "ActiveAuras",
      "chris-premades",
      "dae",
      "ddb-importer",
      "dnd-dungeon-masters-guide",
      "dnd-monster-manual",
      "dnd-players-handbook",
      "dnd-tashas-cauldron",
      "lib-wrapper",
      "midi-qol",
      "socketlib",
      "stairways",
      "tidy5e-sheet",
      "times-up",
      "vision-5e",
      "vtta-tokenizer",
    ];

    this.modules = {
      active: game.modules.filter((m) => m.active),
      excludingKnown: game.modules.filter((m) => m.active && !knownModules.includes(m.id)),
    };

    this.DDBI = foundry.utils.getProperty(CONFIG, "DDBI");

  }


  get data() {
    return {
      sources: this.sources,
      monsterTypes: this.monsterTypes,
      muncherSettings: this.muncherSettings,
      ddbSettings: this.ddbSettings,
      ddbChangedSettings: this.ddbChangedSettings,
      versions: this.versions,
      modules: this.modules,
      DDBI: this.DDBI,
    };
  }

  download() {
    FileHelper.download(JSON.stringify(this.data), `${game.world.id}.json`, "application/json");
  }

  static async generateDebug() {
    const debug = new DDBDebug();

    return debug.data;
  }


}
