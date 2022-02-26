import { getSensesLookup } from "./senses.js";
import logger from "../../logger.js";

function getTokenSenses(ddb) {
  // Default to the most basic token setup.
  // everything else can be handled by the user / Token Mold
  let tokenData = {
    actorLink: true,
    name: ddb.character.name,
  };
  const senses = getSensesLookup(ddb);
  // darkvision: 0,
  // blindsight: 0,
  // tremorsense: 0,
  // truesight: 0,

  // These values in senses grant bright sight
  const devilSight = senses.special.includes("You can see normally in darkness");
  let brightSights = [senses.truesight, senses.blindsight];
  if (devilSight) brightSights.push(senses.darkvision);
  setProperty(tokenData, "brightSight", Math.max(...brightSights));

  // Darkvision
  setProperty(tokenData, "dimSight", senses.darkvision);

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
