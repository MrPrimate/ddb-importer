import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateSize = function _generateSize() {
  const size = DICTIONARY.character.actorSizes.find(
    (size) => size.name === this.source.ddb.character.race.size || size.id === this.source.ddb.character.race.sizeId
  );
  this.raw.character.system.traits.size = size ? size.value : "med";
};
