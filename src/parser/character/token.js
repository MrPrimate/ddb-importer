import { getSensesLookup } from "./senses.js";
import utils from "../../utils.js";
import logger from "../../logger.js";

function getTokenSensesNew(data) {
  // Default to the most basic token setup.
  // everything else can be handled by the user / Token Mold
  let tokenData = {
    actorLink: true,
    name: data.character.name,
  };

  const senses = getSensesLookup(data);
  // darkvision: 0,
  // blindsight: 0,
  // tremorsense: 0,
  // truesight: 0,

  // These values in senses grant bright sight
  const devilSight = senses.special.includes("You can see normally in darkness");
  let brightSights = [senses.truesight, senses.blindsight];
  if (devilSight) brightSights.push(senses.darkvision);
  tokenData['brightSight'] = Math.max(...brightSights);

  // Darkvision
  tokenData['dimSight'] = senses.darkvision;

  return tokenData;
}

function getTokenSensesOld(data) {
  // Default to the most basic token setup.
  // everything else can be handled by the user / Token Mold
  let tokenData = {
    actorLink: true,
    name: data.character.name,
  };

  const senses = getSensesLookup(data);

  // These values in senses grant bright sight
  const brightSightValues = ["Truesight", "Blindsight", "Devils Sight"];

  if (senses.some((sense) => brightSightValues.includes(sense.name))) {
    let value = senses
      .filter((sense) => brightSightValues.includes(sense.name))
      .reduce((prev, cur) => (prev > cur.value ? prev : cur.value), 0);
    if (value) tokenData.brightSight = value;
  }

  // Darkvision
  if (senses.some((sense) => sense.name === "Darkvision")) {
    tokenData.dimSight = senses.find((sense) => sense.name === "Darkvision").value;
  }

  // finally, if no dimsight set, set to 0 as default is 30
  if (!tokenData.dimSight) tokenData.dimSight = 0;

  return tokenData;
}


export function getToken(data) {
  try {
    const versionCompare = utils.versionCompare(game.system.data.version, "1.2.0");

    return (versionCompare >= 0)
      ? getTokenSensesNew(data)
      : getTokenSensesOld(data);
  } catch (err) {
    logger.error(err);
    logger.error(err.stack);
    throw new Error("Please update your D&D 5e system to a newer version");
  }
}
