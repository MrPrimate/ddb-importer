// "creatureSizes": [{
//   "id": 2,
//   "entityTypeId": 127108918,
//   "name": "Tiny",
//   "weightType": 1
// }, {


//   "traits": {
//     "size": "grg",


//     "sizeId": 7,

import logger from '../../logger.js';

const SIZES = [
  { name: "Tiny", value: "tiny", size: 0.5 },
  { name: "Small", value: "sm", size: 0.8 },
  { name: "Medium", value: "med", size: 1 },
  { name: "Large", value: "lg", size: 2 },
  { name: "Huge", value: "huge", size: 3 },
  { name: "Gargantuan", value: "grg", size: 4 },
];

export function getSizeFromId(sizeId, DDB_CONFIG) {
  const size = DDB_CONFIG.creatureSizes.find((s) => s.id == sizeId).name;
  const sizeData = SIZES.find((s) => size == s.name);

  if (!sizeData) {
    logger.warn(`No size found for, using medium`, size);
    return { name: "Medium", value: "med", size: 1 };
  }
  return sizeData;
}

export function getSize (monster, DDB_CONFIG) {
  const sizeData = getSizeFromId(monster.sizeId, DDB_CONFIG);
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
