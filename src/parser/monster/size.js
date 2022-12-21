// "creatureSizes": [{
//   "id": 2,
//   "entityTypeId": 127108918,
//   "name": "Tiny",
//   "weightType": 1
// }, {


//   "traits": {
//     "size": "grg",


//     "sizeId": 7,

import DICTIONARY from '../../dictionary.js';
import logger from '../../logger.js';


export function getSizeFromId(sizeId) {
  const size = CONFIG.DDB.creatureSizes.find((s) => s.id == sizeId).name;
  const sizeData = DICTIONARY.sizes.find((s) => size == s.name);

  if (!sizeData) {
    logger.warn(`No size found for, using medium`, size);
    return { name: "Medium", value: "med", size: 1 };
  }
  return sizeData;
}

export function getSize (monster) {
  const sizeData = getSizeFromId(monster.sizeId);
  const token = {
    scale: sizeData.size >= 1 ? 1 : sizeData.size,
    value: sizeData.size >= 1 ? sizeData.size : 1,
  };

  const data = {
    value: sizeData.value,
    token: token,
  };

  return data;

}
