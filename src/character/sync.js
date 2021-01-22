import utils from "../utils.js";
import logger from "../logger.js";

async function updateCharacterCall(characterId, path, bodyContent) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const coreBody = { cobalt: cobaltCookie, betaKey: betaKey, characterId: characterId };
  const body = { ...coreBody, ...bodyContent };
  console.warn(body);

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/update/${path}`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          resolve(data);
        }
        logger.debug(`${path} updated`);
        return data;
      })
      .then((data) => resolve(data))
      .catch((error) => {
        logger.error(`Setting ${path} failed`);
        logger.error(error);
        logger.error(error.stack);
        reject(error);
      });
  });
}

export async function updateDDBCharacter(actor) {
  const characterId = actor.data.flags.ddbimporter.dndbeyond.characterId;

  let promises = [];

  console.warn(actor.data);

  // Fetch current character data and determine what needs to be updated

  const currency = updateCharacterCall(characterId, "currency", actor.data.data.currency);
  promises.push(currency);

  const hitPointData = {
    removedHitPoints: actor.data.data.attributes.hp.max - actor.data.data.attributes.hp.value,
    temporaryHitPoints: actor.data.data.attributes.hp.temp,
  };
  const hitPoints = updateCharacterCall(characterId, "hitpoints", hitPointData);
  promises.push(hitPoints);

  // for each action, check to see if it has uses, if yes:
  // const actionData = { actionId: "", entityTypeId: "", uses: "" };
  // const action = updateCharacterCall(characterId, "action/use", actionData);
  // promises.push(action);

  const inspiration = updateCharacterCall(characterId, "inspiration", {
    inspiration: actor.data.data.attributes.inspiration,
  });
  promises.push(inspiration);

  let exhaustionData = {
    conditionId: 4,
    addCondition: false,
  };
  if (actor.data.data.attributes.exhaustion !== 0) {
    exhaustionData["level"] = actor.data.data.attributes.exhaustion;
    exhaustionData["totalHP"] = actor.data.data.attributes.hp.max;
    exhaustionData["addCondition"] = true;
  }

  const exhaustion = updateCharacterCall(characterId, "condition", exhaustionData);
  promises.push(exhaustion);

  const deathSaveData = {
    failCount: actor.data.data.attributes.death.failure,
    successCount: actor.data.data.attributes.death.success,
  };
  const deathSaves = updateCharacterCall(characterId, "deathsaves", deathSaveData);
  promises.push(deathSaves);

  // if a prepared spell caster
  // for each prepared spell that was added or removed
  // const spellPreparedData = {
  //   spellInfo: {
  //     spellId: 2242,
  //     characterClassId: 40045547,
  //     entityTypeId: 435869154,
  //     id: 2641037,
  //     prepared: false,
  //   },
  // };
  // const spellsPrepared = updateCharacterCall(characterId, "spells/prepare", spellPreparedData);
  // promises.push(spellsPrepared);


  //   spells:
  // pact: {value: 0, override: null, max: 0, level: 0}
  // spell0: {value: 0, max: 0}
  // spell1: {value: 4, override: null, max: 4}
  // spell2: {value: 3, override: null, max: 3}
  // spell3: {value: 0, override: null, max: 0}
  // spell4: {value: 0, override: null, max: 0}
  // spell5: {value: 0, override: null, max: 0}
  // spell6: {value: 0, override: null, max: 0}
  // spell7: {value: 0, override: null, max: 0}
  // spell8: {value: 0, override: null, max: 0}
  // spell9: {value: 0, override: null, max: 0}
  let spellSlotData = {
  };
  const spellSlots = updateCharacterCall(characterId, "spells/slots", spellSlotData);
  promises.push(spellSlots);

  // if a known/choice spellcaster
  // and new spell/ spells removed
  // for each spell add or remove, e.g.
  // const spellsData = {
  //   characterClassId: 52134801,
  //   spellId: 2019,
  //   id: 136157,
  //   entityTypeId: 435869154,
  //   remove: true,
  // };
  // const spellSlots = updateCharacterCall(characterId, "spells", spellsData);
  // promises.push(spellSlots);

  // for each equipment piece added or removed:

  // const removeItemData = {
  //   itemId: 0
  // };
  // const removeItem = updateCharacterCall(characterId, "equipment/remove", removeItemData);
  // promises.push(removeItem);

  // add equipment can be all items
  // const addItemData = {
  //   equipment: [{ entityId: 52, entityTypeId: 2103445194, quantity: 1 }],
  // };
  // const addItem = updateCharacterCall(characterId, "equipment/add", addItemData);
  // promises.push(addItem);

  return Promise.all(promises);
}
