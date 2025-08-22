import { DICTIONARY } from "../../config/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";
import { DDBModifiers } from "../lib/_module.mjs";

DDBCharacter.prototype._generateSize = function _generateSize() {
  const sizeMods = DDBModifiers.filterModifiersOld(this.source.ddb.character.modifiers.race, "size");
  const size = (sizeMods.length > 0)
    ? DICTIONARY.sizes.find((size) => sizeMods.some((mod) => mod.subType === size.name.toLowerCase()))
    : DICTIONARY.sizes.find((size) =>
      size.name === this.source.ddb.character.race.size
      || size.id === this.source.ddb.character.race.sizeId);

  const defaultSize = DICTIONARY.sizes.find((s) => s.value === "med");

  this.raw.character.system.traits.size = size?.value ?? defaultSize.value;
  this.raw.character.prototypeToken.width = size?.size ?? defaultSize.size;
  this.raw.character.prototypeToken.height = size?.size ?? defaultSize.size;
  this.raw.character.prototypeToken.texture.scaleX = size?.scale ?? defaultSize.scale;
  this.raw.character.prototypeToken.texture.scaleY = size?.scale ?? defaultSize.scale;
};
