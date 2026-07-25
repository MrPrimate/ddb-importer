import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";

DDBCharacter.prototype._generateSize = function _generateSize(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const traits = this.raw.character.system.traits;
  const prototypeToken = this.raw.character.prototypeToken;
  const texture = prototypeToken?.texture;
  if (!ddb || !traits || !prototypeToken || !texture) {
    logger.warn("Unable to generate size, missing DDB source data or character skeleton data");
    return;
  }
  const sizeMods = DDBModifiers.filterModifiersOld(ddb.character.modifiers.race, "size");
  const size = (sizeMods.length > 0)
    ? DICTIONARY.sizes.find((size) => sizeMods.some((mod) => mod.subType === size.name.toLowerCase()))
    : DICTIONARY.sizes.find((size) =>
      size.name === ddb.character.race.size
      || size.id === ddb.character.race.sizeId);

  const defaultSize = DICTIONARY.sizes.find((s) => s.value === "med");
  if (!defaultSize) {
    logger.warn("Unable to generate size, no default size found in dictionary");
    return;
  }

  traits.size = size?.value ?? defaultSize.value;
  prototypeToken.width = size?.size ?? defaultSize.size;
  prototypeToken.height = size?.size ?? defaultSize.size;
  texture.scaleX = size?.scale ?? defaultSize.scale;
  texture.scaleY = size?.scale ?? defaultSize.scale;
};
