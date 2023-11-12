import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";
import DDBRace from "../race/DDBRace.js";

DDBCharacter.prototype._generateRace = async function _generateRace() {
  const traits = this.source.ddb.character.race.racialTraits.map((r) => r.definition);
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traits, false);
  const ddbRace = new DDBRace(this.source.ddb.character.race, compendiumRacialTraits);
  await ddbRace.build();
  this.raw.race = ddbRace.data;
  delete this.raw.race.sort;

  // update character race value with race type
  setProperty(this.raw.character, "system.details.type.value", this.raw.race.type);

  if (!ddbRace.legacyMode) {
    this.raw.race.system.advancement.forEach((a) => {
      switch (a.type) {
        case "AbilityScoreImprovement": {
          a.value = {
            type: "asi",
            assignments: {},
          };
          DICTIONARY.character.abilities.forEach((ability) => {
            const bonus = DDBHelper
              .filterModifiers(this.source.ddb.character.modifiers.race, "bonus", `${ability.long}-score`, [null, ""])
              .filter((mod) => mod.entityId === ability.id)
              .reduce((prev, cur) => prev + cur.value, 0);
            a.value.assignments[ability.value] = bonus;
          });
          break;
        }
        case "Size": {
          const modSize = DDBHelper.filterModifiers(this.source.ddb.character.modifiers.race, "size");
          const size = a.configuration.sizes.length === 1
            ? a.configuration.sizes[0]
            : modSize && modSize.length === 1 
              ? DICTIONARY.character.actorSizes.find((s) => modSize.subType === s.name.toLowerCase())?.value ?? `${this.raw.character.system.traits.size}`
              : `${this.raw.character.system.traits.size}`;
          a.value = {
            size,
          };
          break;
        }
        // no default
      }
    });
  }
};
