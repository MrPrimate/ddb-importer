import { DICTIONARY } from "../../config/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";
import { DDBModifiers } from "../lib/_module.mjs";

DDBCharacter.prototype._generateSize = function _generateSize() {
  const sizeMods = DDBModifiers.filterModifiersOld(this.source.ddb.character.modifiers.race, "size");
  const size = (sizeMods.length > 0)
    ? DICTIONARY.actor.actorSizes.find((size) => sizeMods.some((mod) => mod.subType === size.name.toLowerCase()))
    : DICTIONARY.actor.actorSizes.find((size) =>
      size.name === this.source.ddb.character.race.size
      || size.id === this.source.ddb.character.race.sizeId);

  this.raw.character.system.traits.size = size ? size.value : "med";
};
