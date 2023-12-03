import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";


export default class DDBRaceTrait {

  static DUPPLICATES = [
    "Breath Weapon",
    "Natural Armor",
    "Darkvision",
    "Flight",
    "Hunter's Lore",
    "Claws",
    "Beak",
    "Spells of the Mark",
    "Shifting Feature",
    "Creature Type",
    "Aggressive",
    "Amphibious",
    "Ancestral Legacy",
    "Bite",
    "Cantrip",
    "Celestial Resistance",
    "Charge",
    "Child of the Sea",
    "Draconic Resistance",
    "Fey Ancestry",
    "Hold Breath",
    "Hooves",
    "Horns",
    "Magic Resistance",
    "Mental Discipline",
    "Natural Athlete",
    "Powerful Build",
    "Sunlight Sensitivity",
    "Superior Darkvision",
  ];

  _generateDataStub() {
    this.data = {
      name: "",
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

  constructor(trait, raceName, { isLegacy = false } = {}) {
    logger.debug(`Trait build for ${trait.fullName} started [${raceName}]`);
    this.trait = trait;
    this.raceName = raceName;
    this.isLegacy = isLegacy;
    this._generateDataStub();
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    const name = (this.trait.fullName) ? utils.nameString(this.trait.fullName) : utils.nameString(this.trait.name);
    this.data.name = name;
    this.data.system.description.value += `${this.trait.description}\n\n`;

    this.data.flags.ddbimporter = {
      type: "race",
      entityRaceId: this.trait.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.trait.sources.length > 0 ? [0].sourceId : -1, // is homebrew
      baseName: name,
      spellListIds: this.trait.spellListIds,
      definitionKey: this.trait.definitionKey,
      race: this.raceName,
    };

    if (this.trait.moreDetailsUrl) {
      this.data.flags.ddbimporter['moreDetailsUrl'] = this.trait.moreDetailsUrl;
    }

    this.data.system.source = DDBHelper.parseSource(this.trait);

    if (this.trait.isSubRace && this.trait.baseRaceName) this.data.system.requirements = this.trait.baseRaceName;
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    if (legacyName && this.isLegacy) {
      this.data.name += " (Legacy)";
      logger.debug(`Trait name ${this.data.name} is legacy`);
    }

    const duplicateFeature = DDBRaceTrait.DUPPLICATES.includes(name);
    if (duplicateFeature) {
      this.data.name = `${name} (${this.raceName})`;
    }

    this.data.system.requirements = this.raceName;
    this.data.system.type = {
      value: "race",
    };

    this.data.system.description.value = parseTags(this.data.system.description.value);
  }

}

