import DDBMonster from "../DDBMonster.js";

// "hp": {
//   "value": 367,
//   "min": 0,
//   "max": 367,
//   "temp": 0,
//   "tempmax": 0,
//   "formula": "21d20 + 147"
// },

// "hitPointDice": {
//   "diceCount": 21,
//   "diceValue": 20,
//   "diceMultiplier": 0,
//   "fixedValue": 147,
//   "diceString": "21d20 + 147"
// },

DDBMonster.prototype._generateHitPoints = function _generateHitPoints () {
  this.npc.system.attributes.hp = {
    value: this.source.averageHitPoints - (this.removedHitPoints ?? 0),
    min: 0,
    max: this.source.averageHitPoints,
    temp: this.temporaryHitPoints ?? 0,
    tempmax: 0,
    formula: this.source.hitPointDice.diceString,
  };
};
