import { getSensesLookup } from "./senses.js";

export function getToken(data) {
  // Default to the most basic token setup.
  // everything else can be handled by the user / Token Mold
  let tokenData = {
    actorLink: true,
    name: data.character.name,
  };

  let senses = getSensesLookup(data);

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
