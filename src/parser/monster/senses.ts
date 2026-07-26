import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
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
  const token = this.npc.prototypeToken;
  const sight = token?.sight;
  if (!token || !sight) {
    logger.warn(`_generateTokenSenses: missing prototype token sight data for ${this.source.name}`);
    return;
  }

  this.source.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes) {
      const senseType = DICTIONARY.senseMap()[senseMatch.name.toLowerCase()];
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      const blindBeyondMatch = sense.notes.trim().match(/blind beyond this radius/i);
      const vision5eInstalled = game.modules.get("vision-5e")?.active ?? false;
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        const sightRange = sight.range;
        if (value > 0 && sightRange !== undefined && value > sightRange && foundry.utils.hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          foundry.utils.setProperty(sight, "visionMode", senseType);
          foundry.utils.setProperty(sight, "range", value);
          const visionModeDefaults = foundry.utils.getProperty(CONFIG.Canvas.visionModes, `${senseType}.vision.defaults`) as object;
          token.sight = foundry.utils.mergeObject(sight, visionModeDefaults);
        }
        if (value > 0 && foundry.utils.hasProperty(DICTIONARY.detectionMap, senseMatch.name.toLowerCase())) {
          const detectionModeId = DICTIONARY.detectionMap[senseMatch.name.toLowerCase()];
          // don't add if vision 5e is installed, as it can handle these detection modes.
          if (!vision5eInstalled) {
            token.detectionModes ??= {};
            token.detectionModes[detectionModeId] = {
              range: value,
              enabled: true,
            };
          }
        }
        // add these modes if supported by vision 5e
        if (vision5eInstalled && blindBeyondMatch) {
          token.detectionModes ??= {};
          token.detectionModes["lightPerception"] = {
            range: value,
            enabled: true,
          };
        }
      }
    }
  });
};


DDBMonster.prototype._generateSenses = function _generateSenses(this: DDBMonster) {
  const attributes = this.npc.system.attributes;
  if (!attributes) {
    logger.warn(`_generateSenses: missing npc attributes for ${this.source.name}`);
    return;
  }
  const ranges: Record<TSenseType, number> = {
    darkvision: 0,
    blindsight: 0,
    tremorsense: 0,
    truesight: 0,
  };
  const senses: I5eSenses = {
    ranges,
    units: "ft",
    special: "",
  };
  const special: string[] = [];
  const senseLookup = CONFIG.DDB.senses;

  this.source.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes && senseMatch.name.toLowerCase() in ranges) {
      const senseKey = senseMatch.name.toLowerCase() as TSenseType;
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      if (rangeMatch) {
        ranges[senseKey] = parseInt(rangeMatch[1]);
        if (sense.notes.includes("blind beyond this radius")) {
          special.push(`Blind beyond this radius`);
        }
      } else {
        special.push(`${senseMatch.name}: ${sense.notes}`);
      }
    } else if (senseMatch) {
      special.push(`${senseMatch.name}: ${sense.notes}`);
    } else {
      logger.warn(`_generateSenses: unknown sense id ${sense.senseId} for ${this.source.name}`, { sense });
    }
  });

  senses.special = special.join("; ");
  attributes.senses = senses;

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

