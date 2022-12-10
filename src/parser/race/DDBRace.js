import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import FileHelper from "../../lib/FileHelper.js";


export default class DDBRace {

  constructor(race, compendiumRacialTraits) {
    this.race = race;
    this.compendiumRacialTraits = compendiumRacialTraits;
    this.data = {
      "name": "",
      "type": "feat",
      "system": {
        "description": {
          "value": "",
          "chat": "",
          "unidentified": ""
        },
        "source": "",
      },
      "sort": 2600000,
      "flags": {
        "ddbimporter": {
          "type": "race",
        },
        "obsidian": {
          "source": {
            "type": "race"
          }
        },
      },
      "img": null
    };
  }

  buildBase() {
    this.data.name = (this.race.fullName) ? this.race.fullName.replace("’", "'") : this.race.name.replace("’", "'");
    this.data.system.description.value += `${this.race.description}\n\n`;

    this.data.flags.ddbimporter = {
      entityRaceId: this.race.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.race.sources.length > 0 ? [0].sourceId : -1, // is homebrew
      baseName: (this.race.fullName) ? this.race.fullName.replace("’", "'") : this.race.name.replace("’", "'")
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
    return this.data;
  }

  async buildRace() {
    this.buildBase();

    let avatarUrl;
    let largeAvatarUrl;
    let portraitAvatarUrl;

    this.data.flags.ddbimporter.baseRaceId = this.race.baseRaceId;
    this.data.flags.ddbimporter.baseName = this.race.baseName;
    this.data.flags.ddbimporter.baseRaceName = this.race.baseRaceName;
    this.data.flags.ddbimporter.fullName = this.race.fullName;
    this.data.flags.ddbimporter.subRaceShortName = this.race.subRaceShortName;
    this.data.flags.ddbimporter.isHomebrew = this.race.isHomebrew;
    this.data.flags.ddbimporter.isLegacy = this.race.isLegacy;
    this.data.flags.ddbimporter.isSubRace = this.race.isSubRace;
    this.data.flags.ddbimporter.moreDetailsUrl = this.race.moreDetailsUrl;
    this.data.flags.ddbimporter.featIds = this.race.featIds;

    if (this.race.portraitAvatarUrl) {
      portraitAvatarUrl = await FileHelper.getImagePath(this.race.portraitAvatarUrl, "race-portrait", this.race.fullName);
      this.data.img = portraitAvatarUrl;
      this.data.flags.ddbimporter['portraitAvatarUrl'] = this.race.portraitAvatarUrl;
    }

    if (this.race.avatarUrl) {
      avatarUrl = await FileHelper.getImagePath(this.race.avatarUrl, "race-avatar", this.race.fullName);
      this.data.flags.ddbimporter['avatarUrl'] = this.race.avatarUrl;
      if (!this.data.img) {
        this.data.img = avatarUrl;
      }
    }

    if (this.race.largeAvatarUrl) {
      largeAvatarUrl = await FileHelper.getImagePath(this.race.largeAvatarUrl, "race-large", this.race.fullName);
      // eslint-disable-next-line require-atomic-updates
      this.data.flags.ddbimporter['largeAvatarUrl'] = this.race.largeAvatarUrl;
      if (!this.data.img) {
        this.data.img = largeAvatarUrl;
      }
    }

    const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
    this.data.system.description.value += image;

    const compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.race.racialTraits.forEach((f) => {
      const feature = f.definition;
      const featureMatch = this.compendiumRacialTraits.find((match) =>
        hasProperty(match, "flags.ddbimporter.baseName") && hasProperty(match, "flags.ddbimporter.entityRaceId")
        && feature.name.replace("’", "'") === match.flags.ddbimporter.baseName
        && match.flags.ddbimporter.entityRaceId === feature.entityRaceId
      );
      const title = (featureMatch) ? `<p><b>@Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</b></p>` : `<p><b>${feature.name}</b></p>`;
      this.data.system.description.value += `${title}\n${feature.description}\n\n`;
    });

    this.data.system.description.value = parseTags(this.data.system.description.value);

    return this.data;
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

