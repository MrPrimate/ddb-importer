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
};
