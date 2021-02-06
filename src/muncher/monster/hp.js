

// "hp": {
//   "value": 0,
//   "min": 0,
//   "max": 0,
//   "temp": 0,
//   "tempmax": 0,
//   "formula": ""
// },

// "hp": {
//   "value": 367,
//   "min": 0,
//   "max": 367,
//   "temp": 0,
//   "tempmax": 0,
//   "formula": "21d20 + 147"
// },

// data.
// "hitPointDice": {
//   "diceCount": 21,
//   "diceValue": 20,
//   "diceMultiplier": 0,
//   "fixedValue": 147,
//   "diceString": "21d20 + 147"
// },


export function getHitPoints (monster, removedHitPoints, temporaryHitPoints) {
  const hitPointDice = monster.hitPointDice;
  // const maxHP = (hitPointDice.diceCount * hitPointDice.diceValue) + hitPointDice.fixedValue;

  const hp = {
    "value": monster.averageHitPoints - removedHitPoints,
    "min": 0,
    "max": monster.averageHitPoints,
    "temp": temporaryHitPoints,
    "tempmax": 0,
    "formula": hitPointDice.diceString,
  };

  return hp;
}
