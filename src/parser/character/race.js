import { DICTIONARY } from "../../config/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";
import { DDBModifiers } from "../lib/_module.mjs";
import DDBRace from "../race/DDBRace.js";

DDBCharacter.prototype._generateRace = async function _generateRace(addToCompendium = false) {
  const traits = this.source.ddb.character.race.racialTraits.map((r) => r.definition);
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traits, false);
  this._ddbRace = new DDBRace({
    ddbData: this.source.ddb,
    race: this.source.ddb.character.race,
    compendiumRacialTraits: compendiumRacialTraits,
    isMuncher: this.isMuncher,
  });
  await this._ddbRace.build();
  if (addToCompendium) {
    await this._ddbRace.addToCompendium();
  }
  this.raw.race = (this.updateItemIds([this._ddbRace.data]))[0];
  delete this.raw.race.sort;

  // update character race value with race type
  foundry.utils.setProperty(this.raw.character, "system.details.type.value", this.raw.race.type);

  // console.warn("Race Advancement", JSON.parse(JSON.stringify(this.raw.race.system.advancement)));
  this.raw.race.system.advancement.forEach((a) => {
    switch (a.type) {
      case "AbilityScoreImprovement": {
        a.value = {
          type: "asi",
          assignments: {},
        };
        DICTIONARY.actor.abilities.forEach((ability) => {
          const bonus = DDBModifiers
            .filterModifiersOld(this.source.ddb.character.modifiers.race, "bonus", `${ability.long}-score`, [null, ""])
            .filter((mod) => mod.entityId === ability.id)
            .reduce((prev, cur) => prev + cur.value, 0);
          a.value.assignments[ability.value] = bonus;
        });
        break;
      }
      case "Size": {
        const modSize = DDBModifiers.filterModifiersOld(this.source.ddb.character.modifiers.race, "size");
        const size = a.configuration.sizes.length === 1
          ? a.configuration.sizes[0]
          : modSize && modSize.length === 1
            ? DICTIONARY.sizes.find((s) => modSize.subType === s.name.toLowerCase())?.value ?? `${this.raw.character.system.traits.size}`
            : `${this.raw.character.system.traits.size}`;
        a.value = {
          size,
        };
        break;
      }
      // no default
    }
  });
};
