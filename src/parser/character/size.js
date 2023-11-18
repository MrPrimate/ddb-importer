import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateSize = function _generateSize() {
  const sizeMods = DDBHelper.filterModifiersOld(this.source.ddb.character.modifiers.race, "size");
  const size = (sizeMods.length > 0)
    ? DICTIONARY.character.actorSizes.find((size) => sizeMods.some((mod) => mod.subType === size.name.toLowerCase()))
    : DICTIONARY.character.actorSizes.find((size) =>
      size.name === this.source.ddb.character.race.size
      || size.id === this.source.ddb.character.race.sizeId);

  this.raw.character.system.traits.size = size ? size.value : "med";
};
