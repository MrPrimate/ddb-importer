import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import FileHelper from "../../lib/FileHelper.js";
import SETTINGS from "../../settings.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";


export default class DDBRace {

  _generateDataStub() {
    this.data = {
      name: "",
      type: this.legacyMode ? "feat" : "race",
      system: utils.getTemplate(this.legacyMode ? "feat" : "race"),
      flags: {
        ddbimporter: {
          type: "race",
        },
        obsidian: {
          source: {
            type: "race"
          },
        },
      },
      img: null,
    };

    if (this.legacyMode) {
      setProperty(this.data, "system.type.value", "race");
    }
  }

  constructor(race, compendiumRacialTraits) {
    this.legacyMode = foundry.utils.isNewerVersion("2.4.0", game.system.version);
    this.race = race;
    this.compendiumRacialTraits = compendiumRacialTraits;
    this._generateDataStub();
    this.type = "humanoid";
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.data.name = (this.race.fullName) ? this.race.fullName.replace("’", "'") : this.race.name.replace("’", "'");
    this.data.system.description.value += `${this.race.description}\n\n`;

    this.data.flags.ddbimporter = {
      type: "race",
      entityRaceId: this.race.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.race.sources.length > 0 ? [0].sourceId : -1, // is homebrew
      baseName: this.race.baseName,
      baseRaceId: this.race.baseRaceId,
      baseRaceName: this.race.baseRaceName,
      fullName: this.race.fullName,
      subRaceShortName: this.race.subRaceShortName,
      isHomebrew: this.race.isHomebrew,
      isLegacy: this.race.isLegacy,
      isSubRace: this.race.isSubRace,
      moreDetailsUrl: this.race.moreDetailsUrl,
      featIds: this.race.featIds,
    };

    if (this.race.moreDetailsUrl) {
      this.data.flags.ddbimporter['moreDetailsUrl'] = this.race.moreDetailsUrl;
    }

    this.data.system.source = DDBHelper.parseSource(this.race);

    if (this.race.isSubRace && this.race.baseRaceName) this.data.system.requirements = this.race.baseRaceName;
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    if (legacyName && this.race.isLegacy) {
      this.data.name += " (Legacy)";
    }

    this.#addWeightSpeeds();

  }

  async _generateRaceImage() {
    let avatarUrl;
    let largeAvatarUrl;
    let portraitAvatarUrl;

    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    if (this.race.portraitAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-portrait";
      const pathPostfix = useDeepPaths ? `/race/portrait` : "";
      const downloadOptions = { type: "race-portrait", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
      portraitAvatarUrl = await FileHelper.getImagePath(this.race.portraitAvatarUrl, downloadOptions);
      this.data.img = portraitAvatarUrl;
      this.data.flags.ddbimporter['portraitAvatarUrl'] = this.race.portraitAvatarUrl;
    }

    if (this.race.avatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-avatar";
      const pathPostfix = useDeepPaths ? `/race/avatar` : "";
      const downloadOptions = { type: "race-avatar", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
      avatarUrl = await FileHelper.getImagePath(this.race.avatarUrl, downloadOptions);
      this.data.flags.ddbimporter['avatarUrl'] = this.race.avatarUrl;
      if (!this.data.img) {
        this.data.img = avatarUrl;
      }
    }

    if (this.race.largeAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-large";
      const pathPostfix = useDeepPaths ? `/race/large` : "";
      const downloadOptions = { type: "race-large", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
      largeAvatarUrl = await FileHelper.getImagePath(this.race.largeAvatarUrl, downloadOptions);
      // eslint-disable-next-line require-atomic-updates
      this.data.flags.ddbimporter['largeAvatarUrl'] = this.race.largeAvatarUrl;
      if (!this.data.img) {
        this.data.img = largeAvatarUrl;
      }
    }

    const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
    this.data.system.description.value += image;
    return image;
  }

  #typeCheck(trait) {
    if (trait.name.trim() === "Creature Type") {
      const typeRegex = /You are a (\S*)\./i;
      const typeMatch = trait.description.match(typeRegex);
      if (typeMatch) {
        logger.debug(`Explicit type detected: ${typeMatch[1]}`, typeMatch);
        this.type = typeMatch[1].toLowerCase();
      }
    }
  }

  #addFeatureDescription(trait) {
    const featureMatch = this.compendiumRacialTraits.find((match) =>
      hasProperty(match, "flags.ddbimporter.baseName") && hasProperty(match, "flags.ddbimporter.entityRaceId")
      && trait.name.replace("’", "'") === match.flags.ddbimporter.baseName
      && match.flags.ddbimporter.entityRaceId === trait.entityRaceId
    );
    const title = (featureMatch) ? `<p><b>@Compendium[${this._compendiumLabel}.${featureMatch._id}]{${trait.name}}</b></p>` : `<p><b>${trait.name}</b></p>`;
    this.data.system.description.value += `${title}\n${trait.description}\n\n`;
  }

  #addWeightSpeeds() {
    if (this.race.weightSpeeds?.normal) {
      this.data.system.movement = {
        burrow: this.race.weightSpeeds.normal.burrow ?? 0,
        climb: this.race.weightSpeeds.normal.climb ?? 0,
        fly: this.race.weightSpeeds.normal.fly ?? 0,
        swim: this.race.weightSpeeds.normal.swim ?? 0,
        walk: this.race.weightSpeeds.normal.walk ?? 0,
        units: "ft",
        hover: false,
      };
    }
  }

  #flightCheck(trait) {
    if (trait.name.trim() === "Flight" && getProperty(this.race, "weightSpeeds.normal.fly") === 0) {
      const typeRegex = /you have a flying speed equal to your walking speed/i;
      const flightMatch = trait.description.match(typeRegex);
      if (flightMatch) {
        logger.debug(`Missing flight detected: ${flightMatch[1]}`, flightMatch);
        this.data.system.movement.fly = this.data.system.movement.walk;
      }
    }
  }

  async build() {
    await this._generateRaceImage();

    this.race.racialTraits.forEach((t) => {
      const trait = t.definition;
      this.#addFeatureDescription(trait);
      this.#typeCheck(trait);
      this.#flightCheck(trait);
    });

    // set final type
    setProperty(this.data, "system.type.value", this.type);

    // finally a tag parse to update the description
    this.data.system.description.value = parseTags(this.data.system.description.value);

    logger.debug("Race generated", { DDBRace: this });
  }

  static async getRacialTraitsLookup(racialTraits, fail = true) {
    const compendium = CompendiumHelper.getCompendiumType("traits", fail);
    if (compendium) {
      const flags = ["name", "flags.ddbimporter.entityRaceId", "flags.ddbimporter.baseName"];
      const index = await compendium.getIndex({ fields: flags });
      const traitIndex = await index.filter((i) => racialTraits.some((orig) => i.name === orig.name));
      return traitIndex;
    } else {
      return [];
    }
  }

}

