import logger from "../logger.js";
import { getCharacterData } from "./import.js";
import { isEqual } from "../../vendor/isequal.js";

async function updateCharacterCall(characterId, path, bodyContent) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const coreBody = { cobalt: cobaltCookie, betaKey: betaKey, characterId: characterId };
  const body = { ...coreBody, ...bodyContent };

  logger.debug(body);

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

async function spellSlotsPact(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-spells-slots")) resolve();
    if (
      actor.data.data.spells.pact.max > 0 &&
      ddbData.character.character.data.spells.pact.value !== actor.data.data.spells.pact.value
    ) {
      const used = actor.data.data.spells.pact.max - actor.data.data.spells.pact.value;
      let spellSlotPackData = {
        spellslots: {},
        pact: true,
      };
      spellSlotPackData.spellslots[`level${actor.data.data.spells.pact.level}`] = used;
      const spellPactSlots = updateCharacterCall(characterId, "spell/slots", spellSlotPackData);
      resolve(spellPactSlots);
    }
    resolve();
  });
}

async function spellSlots(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-spells-slots")) resolve();

    let spellSlotData = { spellslots: {}, update: false };
    for (let i = 1; i <= 9; i++) {
      let spellData = actor.data.data.spells[`spell${i}`];
      if (spellData.max > 0 && ddbData.character.character.data.spells[`spell${i}`].value !== spellData.value) {
        const used = spellData.max - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(characterId, "spells/slots", spellSlotData));
    }

    resolve();
  });
}

async function currency(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-currency")) resolve();
    const same = isEqual(ddbData.character.character.data.currency, actor.data.data.currency);

    if (!same) {
      resolve(updateCharacterCall(characterId, "currency", actor.data.data.currency));
    }

    resolve();
  });
}

async function hitPoints(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-hitpoints")) resolve();
    const localTemp = actor.data.data.attributes.hp.temp ? actor.data.data.attributes.hp.temp : 0;
    const same =
      ddbData.character.character.data.attributes.hp.value === actor.data.data.attributes.hp.value &&
      ddbData.character.character.data.attributes.hp.temp === localTemp;

    if (!same) {
      const hitPointData = {
        removedHitPoints: actor.data.data.attributes.hp.max - actor.data.data.attributes.hp.value,
        temporaryHitPoints: localTemp,
      };
      resolve(updateCharacterCall(characterId, "hitpoints", hitPointData));
    }

    resolve();
  });
}

async function inspiration(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-inspiration")) resolve();
    const same = ddbData.character.character.data.attributes.inspiration === actor.data.data.attributes.inspiration;

    if (!same) {
      const inspiration = updateCharacterCall(characterId, "inspiration", {
        inspiration: actor.data.data.attributes.inspiration,
      });
      resolve(inspiration);
    }

    resolve();
  });
}

async function exhaustion(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-condition")) resolve();
    const same = ddbData.character.character.data.attributes.exhaustion === actor.data.data.attributes.exhaustion;

    if (!same) {
      let exhaustionData = {
        conditionId: 4,
        addCondition: false,
      };
      if (actor.data.data.attributes.exhaustion !== 0) {
        exhaustionData["level"] = actor.data.data.attributes.exhaustion;
        exhaustionData["totalHP"] = actor.data.data.attributes.hp.max;
        exhaustionData["addCondition"] = true;
      }
      resolve(updateCharacterCall(characterId, "condition", exhaustionData));
    }

    resolve();
  });
}

async function deathSaves(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-deathsaves")) resolve();
    const same = isEqual(ddbData.character.character.data.attributes.death, actor.data.data.attributes.death);

    if (!same) {
      const deathSaveData = {
        failCount: actor.data.data.attributes.death.failure,
        successCount: actor.data.data.attributes.death.success,
      };
      resolve(updateCharacterCall(characterId, "deathsaves", deathSaveData));
    }

    resolve();
  });
}

async function hitDice(actor, characterId, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-hitdice")) resolve();

    const ddbClasses = ddbData.character.classes;

    const klasses = actor.data.items.filter(
      (item) => item.type === "class" && item.flags.ddbimporter.id && item.flags.ddbimporter.definitionId
    );

    let hitDiceData = {
      classHitDiceUsed: {},
      resetMaxHpModifier: false,
    };

    klasses.forEach((klass) => {
      const classMatch = ddbClasses.find((ddbClass) => ddbClass.flags.ddbimporter.id === klass.flags.ddbimporter.id);
      if (classMatch && classMatch.data.hitDiceUsed !== klass.data.hitDiceUsed) {
        hitDiceData.classHitDiceUsed[klass.flags.ddbimporter.id] = klass.data.hitDiceUsed;
      }
    });

    const same = isEqual({}, hitDiceData.classHitDiceUsed);
    if (!same) {
      resolve(updateCharacterCall(characterId, "hitdice", { shortRest: hitDiceData }));
    }

    resolve();
  });
}

export async function updateDDBCharacter(actor) {
  const characterId = actor.data.flags.ddbimporter.dndbeyond.characterId;
  const syncId = actor.data.flags["ddb-importer"]?.syncId ? actor.data.flags["ddb-importer"].syncId + 1 : 0;
  const ddbData = await getCharacterData(characterId, syncId);

  // console.warn(actor.data);
  // console.warn(ddbData);

  let promises = []
    .concat(
      currency(actor, characterId, ddbData),
      hitPoints(actor, characterId, ddbData),
      hitDice(actor, characterId, ddbData),
      spellSlots(actor, characterId, ddbData),
      spellSlotsPact(actor, characterId, ddbData),
      inspiration(actor, characterId, ddbData),
      exhaustion(actor, characterId, ddbData),
      deathSaves(actor, characterId, ddbData)
    )
    .flat();

  // for each action, check to see if it has uses, if yes:
  // const actionData = { actionId: "", entityTypeId: "", uses: "" };
  // const action = updateCharacterCall(characterId, "action/use", actionData);
  // promises.push(action);

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

  actor.setFlag("ddb-importer", "syncId", syncId);

  let results = await Promise.all(promises);

  return results;
}
