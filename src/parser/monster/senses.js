export function getTextSenses(monster) {
  return monster.sensesHtml;
}

// CONFIG.Canvas.visionModes
const SENSE_MAP = {
  blindsight: "basic",
  darkvision: "darkvision",
  // tremorsense: "tremorsense",
  truesight: "basic",
  unknown: "basic",
};

// CONFIG.Canvas.detectionModes
const DETECTION_MAP = {
  blindsight: "senseAll",
  truesight: "seeAll",
  tremorsense: "feelTremor",
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

export function getTokenSenses(token, monster) {
  const senseLookup = CONFIG.DDB.senses;

  monster.senses.forEach((sense) => {
    const senseMatch = senseLookup.find((l) => l.id == sense.senseId);
    if (senseMatch && sense.notes) {
      const senseType = SENSE_MAP[senseMatch.name.toLowerCase()];
      const rangeMatch = sense.notes.trim().match(/^(\d+)/);
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        if (value > 0 && value > token.sight.range && hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          setProperty(token.sight, "visionMode", senseType);
          setProperty(token.sight, "range", value);
          token.sight = mergeObject(token.sight, CONFIG.Canvas.visionModes[senseType].vision.defaults);
        }
        if (value > 0 && hasProperty(DETECTION_MAP, senseMatch.name.toLowerCase())) {
          const detectionMode = {
            id: DETECTION_MAP[senseMatch.name.toLowerCase()],
            range: value,
            enabled: true,
          };

          // only add duplicate modes if they don't exist
          if (!token.detectionModes.some((mode) => mode.id === detectionMode.id)) {
            token.detectionModes.push(detectionMode);
          }
        }
      }
    }
  });

  return token;
}


export function getSenses(monster) {
  let senses = {
    darkvision: 0,
    blindsight: 0,
    tremorsense: 0,
    truesight: 0,
    units: "ft",
    special: ""
  };
  const senseLookup = CONFIG.DDB.senses;

  monster.senses.forEach((sense) => {
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

  return senses;

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

