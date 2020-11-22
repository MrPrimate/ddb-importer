export function getTextSenses(monster) {
  return monster.sensesHtml;
}

const SENSE_MAP = {
  Blindsight: "dimSight",
  Darkvision: "dimSight",
  Tremorsense: "brightSight",
  Truesight: "brightSight",
  Unknown: "dimsight",
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

export function getTokenSenses(token, monster, DDB_CONFIG) {
  const senseLookup = DDB_CONFIG.senses;

  monster.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes) {
      const senseType = SENSE_MAP[senseMatch.name];
      const rangeMatch = sense.notes.match(/^(\d+)/);
      if (rangeMatch) {
        token[senseType] = rangeMatch[1];
      }
    }
  });

  return token;
}


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

