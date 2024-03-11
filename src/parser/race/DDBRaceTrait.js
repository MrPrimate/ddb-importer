import { parseTags } from "../../lib/DDBReferenceLinker.js";
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBRace from "./DDBRace.js";


export default class DDBRaceTrait {

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: "A Racial Trait",
      type: "feat",
      system: utils.getTemplate("feat"),
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
  }

  constructor(trait, ddbRaceData) {
    logger.debug(`Trait build for ${trait.fullName} started [${ddbRaceData.raceName}]`);
    this.trait = trait;
    this.race = ddbRaceData;
    this.fullName = this.race.fullName;
    this.isLegacy = this.race.isLegacy;
    this.baseRaceName = this.race.baseRaceName;
    this.groupName = DDBRace.getGroupName(this.race.groupIds, this.baseRaceName);
    this.isSubRace = this.race.isSubRace || this.groupName !== this.raceName;
    this._generateDataStub();
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.name = utils.nameString((this.trait.fullName ?? this.trait.name));
    this.data.name = `${this.name}`;
    this.data.system.description.value += `${this.trait.description}\n\n`;

    this.data.flags.ddbimporter = {
      type: "race",
      entityRaceId: this.trait.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.trait.sources.length > 0 ? [0].sourceId : -1, // is homebrew
      baseName: this.name,
      spellListIds: this.trait.spellListIds,
      definitionKey: this.trait.definitionKey,
      race: this.baseName,
      baseRaceName: this.baseRaceName,
      baseRaceId: this.race.baseRaceId,
      subRaceShortName: this.race.subRaceShortName,
      fullRaceName: this.race.fullName,
      isSubRace: this.isSubRace,
      groupIds: this.race.groupIds,
      groupName: this.groupName,
    };

    if (this.trait.moreDetailsUrl) {
      this.data.flags.ddbimporter['moreDetailsUrl'] = this.trait.moreDetailsUrl;
    }

    this.data.system.source = DDBHelper.parseSource(this.trait);

    if (this.baseRaceName) this.data.system.requirements = this.baseRaceName;
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    if (legacyName && this.isLegacy) {
      this.data.name += " (Legacy)";
      logger.debug(`Trait name ${this.data.name} is legacy`);
    }

    this.data.system.requirements = this.raceName;
    this.data.system.type = {
      value: "race",
    };

    this.data.system.description.value = parseTags(this.data.system.description.value);
  }

}

