import DICTIONARY from "../../dictionary.js";
import DDBMonster from "./DDBMonster.js";

DDBMonster.prototype.getTextSenses = function getTextSenses() {
  return this.source.sensesHtml;
};

//   "senses": [{
//   "id": 1,
//   "entityTypeId": 668550506,
//   "name": "Blindsight"
// }, {
//   "id": 2,
//   "entityTypeId": 668550506,
//   "name": "Darkvision"
// }, {
//   "id": 3,
//   "entityTypeId": 668550506,
//   "name": "Tremorsense"
// }, {
//   "id": 4,
//   "entityTypeId": 668550506,
//   "name": "Truesight"
// }, {
//   "id": 5,
//   "entityTypeId": 668550506,
//   "name": "Unknown"
// }],

DDBMonster.prototype._generateTokenSenses = function _generateTokenSenses() {
  const senseLookup = CONFIG.DDB.senses;

  this.source.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes) {
      const senseType = DICTIONARY.senseMap[senseMatch.name.toLowerCase()];
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        if (value > 0 && value > this.npc.prototypeToken.sight.range && hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          setProperty(this.npc.prototypeToken.sight, "visionMode", senseType);
          setProperty(this.npc.prototypeToken.sight, "range", value);
          this.npc.prototypeToken.sight = mergeObject(this.npc.prototypeToken.sight, CONFIG.Canvas.visionModes[senseType].vision.defaults);
        }
        if (value > 0 && hasProperty(DICTIONARY.detectionMap, senseMatch.name.toLowerCase())) {
          const detectionMode = {
            id: DICTIONARY.detectionMap[senseMatch.name.toLowerCase()],
            range: value,
            enabled: true,
          };

          // only add duplicate modes if they don't exist
          if (!this.npc.prototypeToken.detectionModes.some((mode) => mode.id === detectionMode.id)) {
            this.npc.prototypeToken.detectionModes.push(detectionMode);
          }
        }
      }
    }
  });
};


DDBMonster.prototype._generateSenses = function _generateSenses() {
  let senses = {
    darkvision: 0,
    blindsight: 0,
    tremorsense: 0,
    truesight: 0,
    units: "ft",
    special: ""
  };
  const senseLookup = CONFIG.DDB.senses;

  this.source.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes && senseMatch.name.toLowerCase() in senses) {
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      if (rangeMatch) {
        senses[senseMatch.name.toLowerCase()] = parseInt(rangeMatch[1]);
      } else {
        senses.special += `${senseMatch.name}: ${sense.notes}; `;
      }
    } else {
      senses.special += `${senseMatch.name}: ${sense.notes}; `;
    }
  });

  this.npc.system.attributes.senses = senses;

};

// "senses": [
//   {
//       "senseId": 1,
//       "notes": "60 ft."
//   },
//   {
//       "senseId": 2,
//       "notes": "120 ft."
//   }
// ],

// "senses": [{
//   "senseId": 1,
//   "notes": " 60 ft. (blind beyond this radius)"
// }],

