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
  console.warn(monster);
  const sizeData = getSizeFromId(monster.sizeId, DDB_CONFIG);
  console.warn(sizeData);
  let token = {
    scale: 1,
    value: sizeData.size,
  };
  if (token.value < 1) {
    token.scale = token.value;
    token.value = 1;
  }

  const data = {
    value: sizeData.value,
    token: token,
  };

  return data;

}
