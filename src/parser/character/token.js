import { getSensesMap } from "./senses.js";
import logger from "../../logger.js";

const SENSE_MAP = {
  blindsight: "detectInvisibility",
  darkvision: "darkvision",
  tremorsense: "tremorsense",
  truesight: "detectInvisibility",
};

function getTokenSenses(ddb) {
  // Default to the most basic token setup.
  // everything else can be handled by the user / Token Mold
  let tokenData = {
    actorLink: true,
    name: ddb.character.name,
    sight: {
      enabled: true,
      range: 0,
      angle: 360,
      color: null,
      attenuation: 0,
      brightness: 0,
      saturation: 0,
      contrast: 0,
      visionMode: "basic",
    },
  };
  const senses = getSensesMap(ddb);
  // darkvision: 0,
  // blindsight: 0,
  // tremorsense: 0,
  // truesight: 0,

  for (const [key, value] of Object.entries(senses)) {
    if (value > 0 && value > tokenData.sight.range && hasProperty(SENSE_MAP, key)) {
      const visionMode = SENSE_MAP[key];
      setProperty(tokenData, "sight.visionMode", visionMode);
      setProperty(tokenData, "sight.range", value);
      tokenData.sight = mergeObject(tokenData.sight, CONFIG.Canvas.visionModes[visionMode].vision.defaults);
    }
  }

  const devilSight = senses.special.includes("You can see normally in darkness");
  if (devilSight) {
    setProperty(tokenData, "sight.visionMode", "basic");
    tokenData.sight = mergeObject(tokenData.sight, CONFIG.Canvas.visionModes.basic.vision.defaults);
  }

  return tokenData;
}

export function getToken(ddb) {
  try {
    return getTokenSenses(ddb);
  } catch (err) {
    logger.error(err);
    logger.error(err.stack);
    throw new Error("Please update your D&D 5e system to a newer version");
  }
}
