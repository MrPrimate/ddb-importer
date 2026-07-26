// "creatureSizes": [{
//   "id": 2,
//   "entityTypeId": 127108918,
//   "name": "Tiny",
//   "weightType": 1
// }, {

//   "traits": {
//     "size": "grg",
//     "sizeId": 7,

import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

DDBMonster.prototype.getSizeFromId = function getSizeFromId(this: DDBMonster, sizeId: number): IDDBActorSizeData {
  const size = CONFIG.DDB.creatureSizes.find((s) => s.id === sizeId)?.name;
  const sizeData = DICTIONARY.sizes.find((s) => size === s.name);

  if (!sizeData) {
    logger.warn(`No foundry size found for "${size}" (${this.name}), using medium`);
    return { name: "Medium", value: "med", size: 1, id: sizeId, scale: 1 };
  }
  return sizeData;
};

DDBMonster.prototype._generateSize = function _generateSize (this: DDBMonster) {
  const sizeData = this.getSizeFromId(this.source.sizeId);

  const traits = this.npc.system.traits;
  const prototypeToken = this.npc.prototypeToken;
  const texture = prototypeToken?.texture;
  if (!traits || !prototypeToken || !texture) {
    logger.warn(`_generateSize: missing npc traits or prototype token data for ${this.source.name}`);
    return;
  }

  traits.size = sizeData.value;
  prototypeToken.width = sizeData.size;
  prototypeToken.height = sizeData.size;
  texture.scaleX = sizeData.scale;
  texture.scaleY = sizeData.scale;

};
