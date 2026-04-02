import { DICTIONARY } from "../../config/_module";
import DDBMonster from "../DDBMonster";

DDBMonster.prototype.getTextSenses = function getTextSenses(this: DDBMonster) {
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

DDBMonster.prototype._generateTokenSenses = function _generateTokenSenses(this: DDBMonster) {
  const senseLookup = CONFIG.DDB.senses;

  this.source.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes) {
      const senseType = DICTIONARY.senseMap()[senseMatch.name.toLowerCase()];
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      const blindBeyondMatch = sense.notes.trim().match(/blind beyond this radius/i);
      const vision5eInstalled = game.modules.get("vision-5e")?.active ?? false;
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        if (value > 0 && value > this.npc.prototypeToken.sight.range && foundry.utils.hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          foundry.utils.setProperty(this.npc.prototypeToken.sight, "visionMode", senseType);
          foundry.utils.setProperty(this.npc.prototypeToken.sight, "range", value);
          this.npc.prototypeToken.sight = foundry.utils.mergeObject(this.npc.prototypeToken.sight, CONFIG.Canvas.visionModes[senseType].vision.defaults);
        }
        if (value > 0 && foundry.utils.hasProperty(DICTIONARY.detectionMap, senseMatch.name.toLowerCase())) {
          const detectionModeId = DICTIONARY.detectionMap[senseMatch.name.toLowerCase()];
          // don't add if vision 5e is installed, as it can handle these detection modes.
          if (!vision5eInstalled) {
            this.npc.prototypeToken.detectionModes[detectionModeId] = {
              range: value,
              enabled: true,
            };
          }
        }
        // add these modes if supported by vision 5e
        if (vision5eInstalled && blindBeyondMatch) {
          this.npc.prototypeToken.detectionModes["lightPerception"] = {
            range: value,
            enabled: true,
          };
        }
      }
    }
  });
};


DDBMonster.prototype._generateSenses = function _generateSenses(this: DDBMonster) {
  const senses: I5eSenses = {
    ranges: {
      darkvision: 0,
      blindsight: 0,
      tremorsense: 0,
      truesight: 0,
    },
    units: "ft",
    special: "",
  };
  const special = [];
  const senseLookup = CONFIG.DDB.senses;

  this.source.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes && senseMatch.name.toLowerCase() in senses.ranges) {
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      if (rangeMatch) {
        senses.ranges[senseMatch.name.toLowerCase()] = parseInt(rangeMatch[1]);
        if (sense.notes.includes("blind beyond this radius")) {
          special.push(`Blind beyond this radius`);
        }
      } else {
        special.push(`${senseMatch.name}: ${sense.notes}`);
      }
    } else {
      special.push(`${senseMatch.name}: ${sense.notes}`);
    }
  });

  senses.special = special.join("; ");
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

