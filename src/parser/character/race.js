import DDBCharacter from "../DDBCharacter.js";
import DDBRace from "../race/DDBRace.js";

DDBCharacter.prototype._generateRace = async function _generateRace() {
  const traits = this.source.ddb.character.race.racialTraits.map((r) => r.definition);
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traits, false);
  const race = new DDBRace(this.source.ddb.character.race, compendiumRacialTraits);
  const builtRace = await race.buildRace();
  delete builtRace.sort;
  this.raw.race = builtRace;

  setProperty(this.raw.character, "system.details.type.value", this.raw.race.type);
};
