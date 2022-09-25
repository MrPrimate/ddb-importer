import logger from "../logger.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import DICTIONARY from "../dictionary.js";
import { getCharacterData } from "./import.js";
import { isEqual } from "../../vendor/lowdash/isequal.js";
import { getCampaignId } from "../lib/Settings.js";
import { looseItemNameMatch } from "../muncher/import.js";
import { getCobalt, checkCobalt } from "../lib/Secrets.js";
import { getCurrentDynamicUpdateState, updateDynamicUpdates, disableDynamicUpdates, setActiveSyncSpellsFlag } from "./utils.js";
import { getActorConditionStates, getCondition } from "./conditions.js";
import { getItemCollectionItems } from "./itemCollections.js";

function activeUpdate() {
  const dynamicSync = game.settings.get("ddb-importer", "dynamic-sync");
  const updateUser = game.settings.get("ddb-importer", "dynamic-sync-user");
  const gmSyncUser = game.user.isGM && game.user.id == updateUser;
  return dynamicSync && gmSyncUser;
}

function getFoundryItems(actor) {
  const characterId = actor.flags.ddbimporter.dndbeyond.characterId;
  const itemCollections = getItemCollectionItems(actor);
  const actorItems = duplicate(actor.items).map((item) => {
    setProperty(item, "flags.ddbimporter.containerEntityId", parseInt(characterId));
    delete item.flags.ddbimporter.updateDocumentId;
    return item;
  });
  return actorItems.concat(itemCollections);
}

async function getUpdateItemIndex() {
  if (hasProperty(CONFIG, "DDBI.update.itemIndex")) return getProperty(CONFIG, "DDBI.update.itemIndex");
  const compendium = await CompendiumHelper.getCompendiumType("item", false);

  const indexFields = [
    "name",
    "type",
    "flags.ddbimporter.definitionId",
    "flags.ddbimporter.definitionEntityTypeId",
  ];
  // eslint-disable-next-line require-atomic-updates
  const itemIndex = await compendium.getIndex({ fields: indexFields });
  setProperty(CONFIG, "DDBI.update.itemIndex", itemIndex);

  return itemIndex;
}

async function getCompendiumItemInfo(item) {
  const index = await getUpdateItemIndex();
  const match = await looseItemNameMatch(item, index, true, false, true);
  return match;
}

// flavor is just useful for debugging
async function updateCharacterCall(actor, path, bodyContent, flavor) {
  const characterId = actor.flags.ddbimporter.dndbeyond.characterId;
  const cobaltCookie = getCobalt(actor.id);
  const dynamicSync = activeUpdate();
  const parsingApi = dynamicSync
    ? game.settings.get("ddb-importer", "dynamic-api-endpoint")
    : game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const campaignId = getCampaignId();
  const proxyCampaignId = campaignId === "" ? null : campaignId;
  const coreBody = {
    cobalt: cobaltCookie,
    betaKey,
    characterId,
    campaignId: proxyCampaignId,
    dynamicSync,
    customApiVersion: 5.1,
  };
  const body = { ...coreBody, ...bodyContent };

  const url = dynamicSync
    ? `${parsingApi}/dynamic/update/${path}`
    : `${parsingApi}/proxy/update/${path}`;

  logger.debug("Update info:", {
    url,
    path,
    characterId,
    bodyContent,
    dynamicSync,
    flavor,
  });

  return new Promise((resolve, reject) => {
    fetch(url, {
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
          const errorData = {
            url,
            path,
            errorData: data,
            bodyContent,
            characterId,
            dynamicSync,
            flavor,
          };
          logger.error(`Update failed for ${actor.name}:`, errorData);
          ui.notifications.error(`Update failed: (${actor.name}) ${data.message} (see console log (F12) for more details)`);
          resolve(data);
        }
        logger.debug(`${path} updated, response`, data);
        return data;
      })
      .then((data) => resolve(data))
      .catch((error) => {
        const errorData = {
          error,
          bodyContent,
          characterId,
          dynamicSync,
        };
        logger.error(`Setting ${path} failed`, errorData);
        logger.error(error.stack);
        reject(error);
      });
  });
}

async function updateDDBSpellSlotsPact(actor) {
  return new Promise((resolve) => {
    let spellSlotPackData = {
      spellslots: {},
      pact: true,
    };
    spellSlotPackData.spellslots[`level${actor.system.spells.pact.level}`] = actor.system.spells.pact.value;
    const spellPactSlots = updateCharacterCall(actor, "spell/slots", spellSlotPackData, "Pact Spell Slots");
    resolve(spellPactSlots);
  });
}

async function spellSlotsPact(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-spells-slots")) resolve();
    if (
      actor.system.spells.pact.max > 0 &&
      ddbData.character.character.system.spells.pact.value !== actor.system.spells.pact.value
    ) {
      resolve(updateDDBSpellSlotsPact(actor));
    } else {
      resolve();
    }
  });
}

async function updateDynamicDDBSpellSlots(actor, update) {
  return new Promise((resolve) => {
    let spellSlotData = { spellslots: {}, update: false };
    for (let i = 1; i <= 9; i++) {
      let spellData = actor.system.spells[`spell${i}`];
      if (spellData.max > 0 && update.system.spells[`spell${i}`]) {
        const used = spellData.max - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(actor, "spells/slots", spellSlotData, "Spell slots"));
    } else {
      resolve();
    }
  });
}

async function spellSlots(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-spells-slots")) resolve();

    let spellSlotData = { spellslots: {}, update: false };
    for (let i = 1; i <= 9; i++) {
      let spellData = actor.system.spells[`spell${i}`];
      if (spellData.max > 0 && ddbData.character.character.system.spells[`spell${i}`].value !== spellData.value) {
        const used = spellData.max - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(actor, "spells/slots", spellSlotData, "Spell slots"));
    } else {
      resolve();
    }
  });
}

async function updateDDBCurrency(actor) {
  return new Promise((resolve) => {
    const value = {
      pp: Number.isInteger(actor.system.currency.pp) ? actor.system.currency.pp : 0,
      gp: Number.isInteger(actor.system.currency.gp) ? actor.system.currency.gp : 0,
      ep: Number.isInteger(actor.system.currency.ep) ? actor.system.currency.ep : 0,
      sp: Number.isInteger(actor.system.currency.sp) ? actor.system.currency.sp : 0,
      cp: Number.isInteger(actor.system.currency.cp) ? actor.system.currency.cp : 0,
    };

    resolve(updateCharacterCall(actor, "currency", value, "Currency"));

  });
}

async function currency(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-currency")) resolve();

    const value = {
      pp: Number.isInteger(actor.system.currency.pp) ? actor.system.currency.pp : 0,
      gp: Number.isInteger(actor.system.currency.gp) ? actor.system.currency.gp : 0,
      ep: Number.isInteger(actor.system.currency.ep) ? actor.system.currency.ep : 0,
      sp: Number.isInteger(actor.system.currency.sp) ? actor.system.currency.sp : 0,
      cp: Number.isInteger(actor.system.currency.cp) ? actor.system.currency.cp : 0,
    };

    const same = isEqual(ddbData.character.character.system.currency, value);

    if (!same) {
      resolve(updateCharacterCall(actor, "currency", value));
    } else {
      resolve();
    }

  });
}

async function updateDDBXP(actor) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "xp", { currentXp: actor.system.details.xp.value }, "XP"));
  });
}

async function xp(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-xp")) resolve();
    const same = ddbData.character.character.system.details.xp.value === actor.system.details.xp.value;

    if (!same) {
      resolve(updateDDBXP(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBHitPoints(actor) {
  return new Promise((resolve) => {
    const temporaryHitPoints = actor.system.attributes.hp.temp ? actor.system.attributes.hp.temp : 0;
    const removedHitPoints = actor.system.attributes.hp.max - actor.system.attributes.hp.value;
    const hitPointData = {
      removedHitPoints,
      temporaryHitPoints,
    };
    resolve(updateCharacterCall(actor, "hitpoints", hitPointData, "HP"));
  });
}

async function hitPoints(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-hitpoints")) resolve();
    const temporaryHitPoints = actor.system.attributes.hp.temp ? actor.system.attributes.hp.temp : 0;
    const same =
      ddbData.character.character.system.attributes.hp.value === actor.system.attributes.hp.value &&
      ddbData.character.character.system.attributes.hp.temp === temporaryHitPoints;

    if (!same) {
      resolve(updateDDBHitPoints(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBInspiration(actor) {
  return new Promise((resolve) => {
    const inspiration = updateCharacterCall(actor, "inspiration", {
      inspiration: actor.system.attributes.inspiration,
    }, "Inspiration");
    resolve(inspiration);
  });
}

async function inspiration(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-inspiration")) resolve();
    const same = ddbData.character.character.system.attributes.inspiration === actor.system.attributes.inspiration;

    if (!same) {
      resolve(updateDDBInspiration(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBExhaustion(actor) {
  return new Promise((resolve) => {
    let exhaustionData = {
      conditionId: 4,
      addCondition: false,
    };
    if (actor.system.attributes.exhaustion !== 0) {
      exhaustionData["level"] = actor.system.attributes.exhaustion;
      exhaustionData["totalHP"] = actor.system.attributes.hp.max;
      exhaustionData["addCondition"] = true;
    }
    resolve(updateCharacterCall(actor, "condition", exhaustionData, "Exhaustion"));
  });
}


async function exhaustion(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-condition")) resolve();
    const same = ddbData.character.character.system.attributes.exhaustion === actor.system.attributes.exhaustion;

    if (!same) {
      resolve(updateDDBExhaustion(actor));
    } else {
      resolve();
    }

  });
}

async function updateDDBCondition(actor, condition) {
  return new Promise((resolve) => {
    const conditionData = {
      conditionId: condition.ddbId,
      addCondition: condition.applied,
      level: null,
      totalHP: actor.system.attributes.hp.max,
    };

    resolve(updateCharacterCall(actor, "condition", conditionData, { condition }));
  });
}

async function conditions(actor, ddbData) {
  return new Promise((resolve) => {
    const dfConditionsOn = game.modules.get("dfreds-convenient-effects")?.active;
    if (!game.settings.get("ddb-importer", "sync-policy-condition") || !dfConditionsOn) resolve([]);
    getActorConditionStates(actor, ddbData.ddb).then((conditions) => {
      let results = [];
      conditions.forEach((condition) => {
        // exhaustion handled separately
        if (condition.needsUpdate && condition.ddbId !== 4) {
          results.push(updateDDBCondition(actor, condition));
        }
      });
      resolve(results);
    });
  });
}

async function updateDDBDeathSaves(actor) {
  return new Promise((resolve) => {
    const deathSaveData = {
      failCount: actor.system.attributes.death.failure,
      successCount: actor.system.attributes.death.success,
    };
    resolve(updateCharacterCall(actor, "deathsaves", deathSaveData, "Death Saves"));
  });
}

async function deathSaves(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-deathsaves")) resolve();
    const same = isEqual(ddbData.character.character.system.attributes.death, actor.system.attributes.death);

    if (!same) {
      resolve(updateDDBDeathSaves(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBHitDice(actor, klass, update) {
  return new Promise((resolve) => {
    if (klass.flags?.ddbimporter?.id) {
      let hitDiceData = {
        classHitDiceUsed: {},
        resetMaxHpModifier: false,
      };
      hitDiceData.classHitDiceUsed[klass.flags.ddbimporter.id] = update.system.hitDiceUsed;
      resolve(updateCharacterCall(actor, "hitdice", { shortRest: hitDiceData }, "Hit Dice"));
    } else {
      resolve();
    }
  });
}

async function hitDice(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-hitdice")) resolve();

    const ddbClasses = ddbData.character.classes;

    const klasses = actor.items.filter(
      (item) => item.type === "class" && item.flags.ddbimporter.id && item.flags.ddbimporter.definitionId
    );

    let hitDiceData = {
      classHitDiceUsed: {},
      resetMaxHpModifier: false,
    };

    klasses.forEach((klass) => {
      const classMatch = ddbClasses.find((ddbClass) => ddbClass.flags.ddbimporter.id === klass.flags.ddbimporter.id);
      if (classMatch && classMatch.system.hitDiceUsed !== klass.system.hitDiceUsed) {
        hitDiceData.classHitDiceUsed[klass.flags.ddbimporter.id] = klass.system.hitDiceUsed;
      }
    });

    const same = isEqual({}, hitDiceData.classHitDiceUsed);
    if (!same) {
      resolve(updateCharacterCall(actor, "hitdice", { shortRest: hitDiceData }));
    }

    resolve();
  });
}

async function updateSpellsPrepared(actor, spellPreparedData) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "spell/prepare", spellPreparedData, "Spells Prepared"));
  });
}

async function updateDDBSpellsPrepared(actor, spells) {
  let promises = [];

  const preparedSpells = spells.filter((spell) =>
    spell.type === "spell" &&
    spell.system.preparation?.mode === "prepared" &&
    spell.flags.ddbimporter?.dndbeyond?.characterClassId &&
    !spell.flags.ddbimporter.dndbeyond.granted
  ).map((spell) => {
    let spellPreparedData = {
      spellInfo: {
        spellId: spell.flags.ddbimporter.definitionId,
        characterClassId: spell.flags.ddbimporter.dndbeyond.characterClassId,
        entityTypeId: spell.flags.ddbimporter.entityTypeId,
        id: spell.flags.ddbimporter.id,
        prepared: spell.system.preparation.prepared === true,
      }
    };
    logger.debug(`Updating spell prepared state for ${spell.name} to ${spellPreparedData.spellInfo.prepared}`);
    return spellPreparedData;
  });

  preparedSpells.forEach((spellPreparedData) => {
    promises.push(updateSpellsPrepared(actor, spellPreparedData));
  });

  return Promise.all(promises);
}

async function spellsPrepared(actor, ddbData) {
  if (!game.settings.get("ddb-importer", "sync-policy-spells-prepared")) return [];
  const ddbSpells = ddbData.character.spells;

  const preparedSpells = actor.items.filter((item) => {
    const spellMatch = ddbSpells.find((s) =>
      s.name === item.name &&
      item.system.preparation?.mode === "prepared" &&
      item.flags.ddbimporter?.dndbeyond?.characterClassId &&
      item.flags.ddbimporter?.dndbeyond?.characterClassId === s.flags.ddbimporter?.dndbeyond?.characterClassId
    );
    if (!spellMatch) return false;
    const select = item.type === "spell" &&
      item.system.preparation?.mode === "prepared" &&
      item.system.preparation.prepared !== spellMatch.system.preparation?.prepared;
    return spellMatch && select;
  });

  const results = updateDDBSpellsPrepared(actor, preparedSpells);

  return results;
}

async function updateItemsWithDDBInfo(itemsToAdd) {
  return Promise.all(itemsToAdd.map(async (item) => {
    if (!item.flags.ddbimporter?.definitionId && !item.flags.ddbimporter?.definitionEntityTypeId) {
      const ddbCompendiumMatch = await getCompendiumItemInfo(item);
      logger.debug(`Found item`, ddbCompendiumMatch);
      if (ddbCompendiumMatch &&
        ddbCompendiumMatch.flags?.ddbimporter?.definitionId &&
        ddbCompendiumMatch.flags?.ddbimporter?.definitionEntityTypeId
      ) {
        logger.debug(`Adding ${item.name} from DDB compendium match:`, ddbCompendiumMatch);
        setProperty(item, "flags.ddbimporter.definitionId", ddbCompendiumMatch.flags.ddbimporter.definitionId);
        setProperty(item, "flags.ddbimporter.definitionEntityTypeId", ddbCompendiumMatch.flags.ddbimporter.definitionEntityTypeId);
        setProperty(item, "name", ddbCompendiumMatch.name);
        setProperty(item, "type", ddbCompendiumMatch.type);
      }
    }
    return item;
  }));
}

function generateItemsToAdd(actor, itemsToAdd) {
  const results = {
    items: [],
    toAdd: [],
    custom: [],
  };

  for (let i = 0; i < itemsToAdd.length; i++) {
    let item = itemsToAdd[i];
    if (item.flags.ddbimporter?.definitionId && item.flags.ddbimporter?.definitionEntityTypeId) {
      const containerEntityId = hasProperty(item, "flags.ddbimporter.containerEntityId")
        ? parseInt(item.flags.ddbimporter.containerEntityId)
        : parseInt(actor.flags.ddbimporter.dndbeyond.characterId);
      const containerEntityTypeId = hasProperty(item, "flags.ddbimporter.containerEntityTypeId")
        ? parseInt(item.flags.ddbimporter.containerEntityTypeId)
        : parseInt("1581111423");
      results.toAdd.push({
        containerEntityId,
        containerEntityTypeId,
        entityId: parseInt(item.flags.ddbimporter.definitionId),
        entityTypeId: parseInt(item.flags.ddbimporter.definitionEntityTypeId),
        quantity: parseInt(item.system.quantity),
      });
    } else {
      results.custom.push(item);
    }
    results.items.push(item);
  }
  return results;
}

async function deleteDDBCustomItems(actor, itemsToDelete) {
  return new Promise((resolve) => {
    let customItemResults = [];
    for (let i = 0; i < itemsToDelete.length; i++) {
      const item = itemsToDelete[i];
      const customData = {
        itemState: "DELETE",
        customValues: {
          characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
          id: item.flags.ddbimporter.definitionId,
          mappingId: item.flags.ddbimporter.id,
          partyId: null,
        }
      };
      if (getProperty(customData, "customValues.id") !== undefined &&
        getProperty(customData, "customValues.mappingId") !== undefined
      ) {
        const result = updateCharacterCall(actor, "custom/item", customData, { name: item.name }).then((data) => {
          setProperty(item, "flags.ddbimporter.delete", data);
          setProperty(item, "flags.ddbimporter.custom", true);
          setProperty(item, "flags.ddbimporter.dndbeyond.isCustomItem", true);
          return item;
        });
        customItemResults.push(result);
      } else {
        logger.error(`Custom item ${item.name} is missing metadata, please manually update and re-import`);
        ui.notifications.error(`Custom item ${item.name} is missing metadata, please manually update and re-import`);
      }
    }

    resolve(customItemResults);
  });
}

async function addDDBCustomItems(actor, itemsToAdd) {
  let customItemResults = [];
  for (let i = 0; i < itemsToAdd.length; i++) {
    const item = itemsToAdd[i];
    const containerEntityId = hasProperty(item, "flags.ddbimporter.containerEntityId")
      ? parseInt(item.flags.ddbimporter.containerEntityId)
      : parseInt(actor.flags.ddbimporter.dndbeyond.characterId);
    const containerEntityTypeId = hasProperty(item, "flags.ddbimporter.containerEntityTypeId")
      ? parseInt(item.flags.ddbimporter.containerEntityTypeId)
      : parseInt("1581111423");
    const customData = {
      itemState: "NEW",
      customValues: {
        characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
        containerEntityId,
        containerEntityTypeId,
        name: item.name,
        description: item.system.description.value,
        quantity: parseInt(item.system.quantity),
        cost: null,
        weight: Number.isInteger(item.system.weight) ? parseInt(item.system.weight) : 0,
      }
    };
    const result = updateCharacterCall(actor, "custom/item", customData, { name: item.name }).then((data) => {
      setProperty(item, "flags.ddbimporter.id", data.data.addItems[0].id);
      setProperty(item, "flags.ddbimporter.custom", true);
      setProperty(item, "flags.ddbimporter.dndbeyond.isCustomItem", true);
      setProperty(item, "flags.ddbimporter.definitionId", data.data.addItems[0].definition.id);
      setProperty(item, "flags.ddbimporter.containerEntityId", data.data.addItems[0].definition.containerEntityId);
      setProperty(item, "flags.ddbimporter.containerEntityTypeId", data.data.addItems[0].definition.containerEntityTypeId);
      return item;
    });
    customItemResults.push(result);
  }

  return Promise.all(customItemResults);
}

async function addDDBEquipment(actor, itemsToAdd) {
  const ddbEnrichedItems = await updateItemsWithDDBInfo(itemsToAdd);
  const generatedItemsToAddData = generateItemsToAdd(actor, ddbEnrichedItems);

  logger.debug(`Generated items data`, generatedItemsToAddData);

  const addItemData = {
    equipment: generatedItemsToAddData.toAdd,
  };

  const customItems = await addDDBCustomItems(actor, generatedItemsToAddData.custom);
  logger.debug("Adding custom items:", customItems);

  try {
    const customItemResults = await actor.updateEmbeddedDocuments("Item", customItems);
    logger.debug("customItemResults", customItemResults);
  } catch (err) {
    logger.error(`Unable to update character with equipment, got the error:`, err);
    logger.error(err.stack);
    logger.error(`Update payload:`, customItems);
  }

  if (addItemData.equipment.length > 0) {
    const itemResults = await updateCharacterCall(actor, "equipment/add", addItemData, "Adding equipment");
    try {
      const itemUpdates = itemResults.system.addItems
        .filter((addedItem) => ddbEnrichedItems.some((i) =>
          i.flags.ddbimporter &&
          i.flags.ddbimporter.definitionId === addedItem.definition.id &&
          i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId
        ))
        .map((addedItem) => {
          let updatedItem = ddbEnrichedItems.find((i) =>
            i.flags.ddbimporter &&
            i.flags.ddbimporter.definitionId === addedItem.definition.id &&
            i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId
          );
          setProperty(updatedItem, "flags.ddbimporter.id", addedItem.id);
          setProperty(updatedItem, "flags.ddbimporter.containerEntityId", addedItem.containerEntityId);
          setProperty(updatedItem, "flags.ddbimporter.containerEntityTypeId", addedItem.containerEntityTypeId);
          return updatedItem;
        });

      const characterItems = itemUpdates.filter((i) => !hasProperty(i, "flags.ddbimporter.updateDocumentId"));
      const containerItems = itemUpdates.filter((i) => hasProperty(i, "flags.ddbimporter.updateDocumentId"));
      const containerIds = [...new Set(containerItems.map((i) => i.flags.ddbimporter.updateDocumentId))];

      logger.debug("Character item updates:", characterItems);
      logger.debug("Container item updates:", containerItems);
      logger.debug("Character custom item updates:", customItems);

      try {
        if (characterItems.length > 0) await actor.updateEmbeddedDocuments("Item", characterItems);
        if (customItems.length > 0) await actor.updateEmbeddedDocuments("Item", customItems);
        for (const containerId of containerIds) {
          const containerItemsToUpdate = containerItems
            .filter((i) => i.flags.ddbimporter.updateDocumentId === containerId)
            .map((i) => {
              delete i.flags.ddbimporter.updateDocumentId;
              return i;
            });
          const containerDocument = actor.getEmbeddedDocument("Item", containerId);
          // eslint-disable-next-line max-depth
          if (containerItemsToUpdate.length > 0) {
            logger.debug(`Updating container ${containerDocument.name} with items:`, containerItemsToUpdate);
            // eslint-disable-next-line no-await-in-loop
            await containerDocument.updateEmbeddedDocuments("Item", containerItemsToUpdate);
          }
        }
      } catch (err) {
        logger.error(`Unable to update character with equipment, got the error:`, err);
        logger.error(`Update payload:`, itemUpdates);
        logger.error(`Update custom payload:`, customItems);
        logger.error(`Update containerIds:`, containerIds);
      }

    } catch (err) {
      logger.error(`Unable to filter updated equipment, got the error:`, err);
      logger.error(`itemsToAdd`, itemsToAdd);
      logger.error(`ddbEnrichedItems`, ddbEnrichedItems);
      logger.error(`equipmentToAdd`, generatedItemsToAddData);
      logger.error(`itemResults`, itemResults);
      logger.error(`customItems`, customItems);
    }

    return itemResults;
  } else {
    return [];
  }
}

async function addEquipment(actor, ddbData) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  const ddbItems = ddbData.character.inventory;

  const items = getFoundryItems(actor);
  const itemsToAdd = items.filter((item) =>
    !item.flags.ddbimporter?.action &&
    item.system.quantity !== 0 &&
    DICTIONARY.types.inventory.includes(item.type) &&
    !item.flags.ddbimporter?.custom &&
    (!item.flags.ddbimporter?.id ||
    !ddbItems.some((s) => s.flags.ddbimporter?.id === item.flags.ddbimporter?.id && s.type === item.type))
  );

  return addDDBEquipment(actor, itemsToAdd);
}


// updates custom names on regular items
async function updateDDBCustomNames(actor, items) {
  let promises = [];

  items.forEach((item) => {
    const customData = {
      customValues: {
        characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
        contextId: null,
        contextTypeId: null,
        notes: null,
        typeId: 8,
        value: item.name,
        valueId: `${item.flags.ddbimporter.id}`,
        valueTypeId: `${item.flags.ddbimporter.entityTypeId}`,
      }
    };
    // custom name on standard equipment
    promises.push(updateCharacterCall(actor, "equipment/custom", customData, "Updating custom names"));
  });

  return Promise.all(promises);

}

// updates names of items and actions
async function updateCustomNames(actor, ddbData) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  const ddbItems = ddbData.character.inventory;

  const foundryItems = getFoundryItems(actor);

  const itemsToName = foundryItems.filter((item) =>
    item.system.quantity !== 0 &&
    (DICTIONARY.types.inventory.includes(item.type) || item.flags.ddbimporter?.action) &&
    item.flags.ddbimporter?.id &&
    ddbItems.some((ddbItem) =>
      ddbItem.flags.ddbimporter?.id === item.flags.ddbimporter.id &&
      ddbItem.type === item.type && ddbItem.name !== item.name
    )
  );

  return updateDDBCustomNames(actor, itemsToName);
}

async function removeDDBEquipment(actor, itemsToRemove) {
  let promises = [];

  itemsToRemove.forEach((item) => {
    if (item.flags?.ddbimporter?.id) {
      logger.debug(`Removing item ${item.name}`);
      if (item.flags?.ddbimporter?.custom) {
        promises.push(deleteDDBCustomItems(actor, [item]));
      } else {
        promises.push(updateCharacterCall(actor, "equipment/remove", { itemId: parseInt(item.flags.ddbimporter.id) }, "Removing equipment"));
      }
    }
  });

  return Promise.all(promises);
}

async function removeEquipment(actor, ddbData) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  const ddbItems = ddbData.character.inventory;

  const items = getFoundryItems(actor);
  const itemsToRemove = ddbItems.filter((item) =>
    (!items.some((s) => (item.flags.ddbimporter?.id === s.flags.ddbimporter?.id && s.type === item.type) && !s.flags.ddbimporter?.action) ||
    items.some((s) => (item.flags.ddbimporter?.id === s.flags.ddbimporter?.id && s.type === item.type) && !s.flags.ddbimporter?.action && s.system.quantity == 0)) &&
    DICTIONARY.types.inventory.includes(item.type) &&
    item.flags.ddbimporter?.id
  );

  return removeDDBEquipment(actor, itemsToRemove);
}

async function updateDDBEquipmentStatus(actor, updateItemDetails, ddbItems) {
  const itemsToEquip = updateItemDetails.itemsToEquip || [];
  const itemsToAttune = updateItemDetails.itemsToAttune || [];
  const itemsToCharge = updateItemDetails.itemsToCharge || [];
  const itemsToQuantity = updateItemDetails.itemsToQuantity || [];
  const itemsToName = updateItemDetails.itemsToName || [];
  const customItems = updateItemDetails.customItems || [];
  const itemsToMove = updateItemDetails.itemsToMove || [];

  let promises = [];

  itemsToMove.forEach((item) => {
    const itemData = {
      itemId: item.flags.ddbimporter.id,
      containerEntityId: item.flags.ddbimporter.containerEntityId,
      containerEntityTypeId: item.flags.ddbimporter.containerEntityTypeId,
    };
    promises.push(updateCharacterCall(actor, "equipment/move", itemData, { name: item.name }));
  });
  itemsToEquip.forEach((item) => {
    const itemData = { itemId: item.flags.ddbimporter.id, value: item.system.equipped };
    promises.push(updateCharacterCall(actor, "equipment/equipped", itemData, { name: item.name }));
  });
  itemsToAttune.forEach((item) => {
    const itemData = { itemId: item.flags.ddbimporter.id, value: (item.system.attunement === 2) };
    promises.push(updateCharacterCall(actor, "equipment/attuned", itemData, { name: item.name }));
  });
  itemsToCharge.forEach((item) => {
    const itemData = {
      itemId: item.flags.ddbimporter.id,
      charges: parseInt(item.system.uses.max) - parseInt(item.system.uses.value),
    };
    promises.push(updateCharacterCall(actor, "equipment/charges", itemData, { name: item.name }));
  });
  itemsToQuantity.forEach((item) => {
    const itemData = {
      itemId: item.flags.ddbimporter.id,
      quantity: parseInt(item.system.quantity),
    };
    promises.push(updateCharacterCall(actor, "equipment/quantity", itemData, { name: item.name }));
  });
  itemsToName.forEach((item) => {
    // historically items may not have this metadata
    const entityTypeId = item.flags?.ddbimporter?.entityTypeId
      ? item.flags.ddbimporter.entityTypeId
      : ddbItems.find((dItem) => dItem.id === item.flags.ddbimporter.id).entityTypeId;
    const customData = {
      customValues: {
        characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
        contextId: null,
        contextTypeId: null,
        notes: null,
        typeId: 8,
        value: item.name,
        valueId: `${item.flags.ddbimporter.id}`,
        valueTypeId: `${entityTypeId}`,
      }
    };
    const flavor = { detail: "Updating Name", name: item.name, originalName: item.flags?.ddbimporter?.originalName };
    promises.push(updateCharacterCall(actor, "equipment/custom", customData, flavor));
  });

  customItems
    .filter((item) => {
      const isValid = getProperty(item, "flags.ddbimporter.id") !== undefined &&
       getProperty(item, "flags.ddbimporter.definitionId") !== undefined;
      if (!isValid) {
        logger.error(`Custom item ${item.name} is missing metadata, please manually update and re-import`);
        ui.notifications.error(`Custom item ${item.name} is missing metadata, please manually update and re-import`);
      }
      return isValid;
    })
    .forEach((item) => {
      const customData = {
        itemState: "UPDATE",
        customValues: {
          characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
          id: item.flags.ddbimporter.definitionId,
          mappingId: item.flags.ddbimporter.id,
          name: item.name,
          description: item.system.description.value,
          // revist these need to be ints
          // weight: `${item.data.weight}`,
          // cost: ${item.data.price},
          cost: null,
          weight: Number.isInteger(item.system.weight) ? parseInt(item.system.weight) : 0,
          quantity: parseInt(item.system.quantity),
        }
      };
      promises.push(updateCharacterCall(actor, "custom/item", customData, "Updating Custom Item"));
    });

  return Promise.all(promises);
}


async function equipmentStatus(actor, ddbData, addEquipmentResults) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  // reload the actor following potential updates to equipment
  let ddbItems = ddbData.ddb.character.inventory;
  let customDDBItems = ddbData.ddb.character.customItems;
  if (addEquipmentResults?.system) {
    actor = game.actors.get(actor.id);
    ddbItems = ddbItems.concat(addEquipmentResults.system.addItems);
  }

  const foundryItems = getFoundryItems(actor);

  const itemsToEquip = foundryItems.filter((item) =>
    !item.flags.ddbimporter?.action && item.flags.ddbimporter?.id &&
    !item.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      item.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.flags.ddbimporter?.id &&
      item.system.equipped !== dItem.equipped
    )
  );
  const itemsToAttune = foundryItems.filter((item) =>
    !item.flags.ddbimporter?.action && item.flags.ddbimporter?.id &&
    !item.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      item.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.flags.ddbimporter?.id &&
      ((item.system.attunement === 2) !== dItem.isAttuned)
    )
  );
  const itemsToCharge = foundryItems.filter((item) =>
    !item.flags.ddbimporter?.action && item.flags.ddbimporter?.id &&
    !item.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      item.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.flags.ddbimporter?.id &&
      item.system.uses?.max && dItem.limitedUse?.numberUsed &&
      ((parseInt(item.system.uses.max) - parseInt(item.system.uses.value)) !== dItem.limitedUse.numberUsed)
    )
  );
  const itemsToQuantity = foundryItems.filter((item) =>
    !item.flags.ddbimporter?.action && item.flags.ddbimporter?.id &&
    !item.system.quantity == 0 &&
    !item.flags.ddbimporter?.custom &&
    ((item.type !== "weapon" && item.type !== "armor") || item.flags.ddbimporter?.dndbeyond?.stackable) &&
    !item.system?.armor?.type &&
    ddbItems.some((dItem) =>
      item.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.flags.ddbimporter?.id &&
      item.system.quantity !== dItem.quantity
    )
  );
  // this is for items that have been added and might have a different name
  const itemsToName = foundryItems.filter((item) =>
    item.flags.ddbimporter?.id &&
    item.system.quantity !== 0 &&
    !item.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      // item.flags.ddbimporter.id === dItem.id &&
      item.flags.ddbimporter.originalName === dItem.definition.name &&
      item.flags.ddbimporter.originalName !== item.name &&
      !item.system.quantity == 0 &&
      dItem.id === item.flags.ddbimporter?.id &&
      item.name !== dItem.definition.name
    )
  );

  // update.name || update.data?.description || update.data?.weight || update.data?.price || update.data?.quantity
  const customItems = foundryItems.filter((item) =>
    item.flags.ddbimporter?.id &&
    item.system.quantity !== 0 &&
    (getProperty(item, "flags.ddbimporter.custom") === true || getProperty(item, "flags.ddbimporter.isCustom") === true) &&
    customDDBItems.some((dItem) => dItem.id === item.flags.ddbimporter.id &&
      (
        item.name !== dItem.name ||
        item.system.description.value != dItem.description ||
        item.system.quantity != dItem.quantity ||
        item.system.weight != dItem.weight
        //  ||
        // item.data.price != dItem.cost
      )
    )
  );

  const itemsToMove = game.modules.get("itemcollection")?.active
    ? foundryItems.filter((item) =>
      !item.flags.ddbimporter?.action && item.flags.ddbimporter?.id &&
      hasProperty(item, "flags.ddbimporter.containerEntityId") &&
      ddbItems.some((dItem) =>
        item.flags.ddbimporter.id === dItem.id &&
        dItem.id === item.flags.ddbimporter?.id &&
        parseInt(item.flags.ddbimporter.containerEntityId) !== parseInt(dItem.containerEntityId)
      ))
    : [];

  const itemsToUpdate = {
    itemsToEquip,
    itemsToAttune,
    itemsToCharge,
    itemsToQuantity,
    itemsToName,
    customItems,
    itemsToMove,
  };

  return updateDDBEquipmentStatus(actor, itemsToUpdate, ddbItems);

}

async function updateActionUseStatus(actor, actionData, actionName) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "action/use", actionData, `Action Use for ${actionName}`));
  });
}

async function updateDDBActionUseStatus(actor, actions) {
  let promises = [];
  actions.forEach((action) => {
    const actionData = {
      actionId: action.flags.ddbimporter.id,
      entityTypeId: action.flags.ddbimporter.entityTypeId,
      uses: parseInt(action.system.uses.max) - parseInt(action.system.uses.value)
    };
    promises.push(updateActionUseStatus(actor, actionData, action.name));
  });
  return Promise.all(promises);
}

async function actionUseStatus(actor, ddbData) {
  const syncActionReady = actor.flags.ddbimporter?.syncActionReady;
  if (syncActionReady && !game.settings.get("ddb-importer", "sync-policy-action-use")) return [];

  let ddbActions = ddbData.character.actions;

  const foundryItems = getFoundryItems(actor);

  const actionsToCharge = foundryItems.filter((item) =>
    (item.flags.ddbimporter?.action || item.type === "feat") &&
    item.flags.ddbimporter?.id && item.flags.ddbimporter?.entityTypeId &&
    ddbActions.some((dItem) =>
      item.flags.ddbimporter.id === dItem.flags.ddbimporter.id &&
      item.flags.ddbimporter.entityTypeId === dItem.flags.ddbimporter.entityTypeId &&
      item.name === dItem.name && item.type === dItem.type &&
      item.system.uses?.value &&
      item.system.uses.value !== dItem.system.uses.value
    )
  );

  const actionChanges = updateDDBActionUseStatus(actor, actionsToCharge);

  return actionChanges;
}

export async function updateDDBCharacter(actor) {
  const activeUpdateState = getCurrentDynamicUpdateState(actor);
  await disableDynamicUpdates(actor);

  const cobaltCheck = await checkCobalt(actor.id);

  if (cobaltCheck.success) {
    logger.debug(`Cobalt checked`);
  } else {
    logger.error(`Cobalt cookie expired, please reset`);
    logger.error(cobaltCheck.message);
    throw cobaltCheck.message;
  }

  const characterId = actor.flags.ddbimporter.dndbeyond.characterId;
  const syncId = actor.flags["ddb-importer"]?.syncId ? actor.flags["ddb-importer"].syncId + 1 : 0;

  const characterDataOptions = {
    currentActorId: actor.id,
    characterId: characterId,
    syncId: syncId,
    localCobaltPostFix: actor.id,
    resourceSelection: false,
  };
  let ddbData = await getCharacterData(characterDataOptions);

  logger.debug("Current actor:", duplicate(actor));
  logger.debug("DDB Parsed data:", ddbData);

  let singlePromises = []
    .concat(
      currency(actor, ddbData),
      hitPoints(actor, ddbData),
      hitDice(actor, ddbData),
      spellSlots(actor, ddbData),
      spellSlotsPact(actor, ddbData),
      inspiration(actor, ddbData),
      exhaustion(actor, ddbData),
      deathSaves(actor, ddbData),
      xp(actor, ddbData),
    ).flat();

  const singleResults = await Promise.all(singlePromises);
  const spellsPreparedResults = await spellsPrepared(actor, ddbData);
  const actionStatusResults = await actionUseStatus(actor, ddbData);
  const nameUpdateResults = await updateCustomNames(actor, ddbData);
  const addEquipmentResults = await addEquipment(actor, ddbData);
  const removeEquipmentResults = await removeEquipment(actor, ddbData);
  const equipmentStatusResults = await equipmentStatus(actor, ddbData, addEquipmentResults);
  const conditionResults = await conditions(actor, ddbData);
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
  // const spellSlots = updateCharacterCall(actor, "spells", spellsData);
  // promises.push(spellSlots);

  actor.setFlag("ddb-importer", "syncId", syncId);
  await setActiveSyncSpellsFlag(actor, true);

  // we can now process item attunements and uses (not yet done)

  const results = singleResults.concat(
    nameUpdateResults,
    addEquipmentResults,
    spellsPreparedResults,
    removeEquipmentResults,
    equipmentStatusResults,
    actionStatusResults,
    conditionResults,
  ).filter((result) => result !== undefined);

  logger.debug("Update results", results);
  await updateDynamicUpdates(actor, activeUpdateState);

  return results;
}

// Called when characters are updated
// will dynamically sync status back to DDB
async function activeUpdateActor(actor, update) {
  // eslint-disable-next-line complexity
  return new Promise((resolve) => {

    const promises = [];

    const actorActiveUpdate = actor.flags.ddbimporter?.activeUpdate;

    if (actorActiveUpdate) {
      const syncHP = game.settings.get("ddb-importer", "dynamic-sync-policy-hitpoints");
      const syncCurrency = game.settings.get("ddb-importer", "dynamic-sync-policy-currency");
      const syncSpellSlots = game.settings.get("ddb-importer", "dynamic-sync-policy-spells-slots");
      const syncInspiration = game.settings.get("ddb-importer", "dynamic-sync-policy-inspiration");
      const syncConditions = game.settings.get("ddb-importer", "dynamic-sync-policy-condition");
      const syncDeathSaves = game.settings.get("ddb-importer", "dynamic-sync-policy-deathsaves");
      const syncXP = game.settings.get("ddb-importer", "dynamic-sync-policy-xp");


      if (syncHP && update.system?.attributes?.hp) {
        logger.debug("Updating DDB Hitpoints...");
        promises.push(updateDDBHitPoints(actor));
      }
      if (syncCurrency && update.system?.currency) {
        logger.debug("Updating DDB Currency...");
        promises.push(updateDDBCurrency(actor));
      }
      if (syncSpellSlots && update.system?.spells) {
        const spellKeys = Object.keys(update.system.spells);
        if (spellKeys.includes("pact")) {
          logger.debug("Updating DDB SpellSlots Pack...");
          promises.push(updateDDBSpellSlotsPact(actor));
        }
        const spellLevelKeys = ["spell1", "spell2", "spell3", "spell4", "spell5", "spell6", "spell7", "spell8", "spell9"];
        const foundSpells = spellKeys.some((spellKey) => spellLevelKeys.includes(spellKey));
        if (foundSpells) {
          logger.debug("Updating DDB SpellSlots...");
          promises.push(updateDynamicDDBSpellSlots(actor, update));
        }
      }
      if (syncInspiration &&
        (update.system?.attributes?.inspiration === true || update.system?.attributes?.inspiration === false)
      ) {
        logger.debug("Updating DDB Inspiration...");
        promises.push(updateDDBInspiration(actor));
      }
      if (syncConditions && update.system?.attributes?.exhaustion) {
        logger.debug("Updating DDB Exhaustion...");
        promises.push(updateDDBExhaustion(actor));
      }
      if (syncDeathSaves && update.system?.attributes?.death) {
        logger.debug("Updating DDB DeathSaves...");
        promises.push(updateDDBDeathSaves(actor));
      }
      if (syncXP && update.system?.attributes?.xp) {
        logger.debug("Updating DDB XP...");
        promises.push(updateDDBXP(actor));
      }
    }
    resolve(promises);

  });
}

const DISABLE_FOUNDRY_UPGRADE = {
  applyFeatures: false,
  addFeatures: false,
  promptAddFeatures: false,
};

async function generateDynamicItemChange(actor, document, update) {
  const updateItemDetails = {
    itemsToEquip: [],
    itemsToAttune: [],
    itemsToCharge: [],
    itemsToQuantity: [],
    itemsToName: [],
    customItems: [],
    itemsToMove: [],
  };

  // console.warn("Document", document);
  // console.warn("ItemUpdate", update);

  if (getProperty(document, "flags.ddbimporter.custom") === true || getProperty(document, "flags.ddbimporter.isCustom") === true) {
    if (update.name || update.system?.description || update.system?.weight || update.system?.price || update.system?.quantity) {
      updateItemDetails.customItems.push(duplicate(document));
    }
  } else {
    if (update.system?.uses) {
      updateItemDetails.itemsToCharge.push(duplicate(document));
    }
    if (update.system?.attunement) {
      updateItemDetails.itemsToAttune.push(duplicate(document));
    }
    if (update.system?.quantity) {
      // if its a weapon or armor we actually need to push a new one
      if (!document.flags.ddbimporter?.dndbeyond?.stackable && update.system.quantity > 1) {
        // Some items are not stackable on DDB

        await document.update({ system: { quantity: 1 } });
        let newDocument = duplicate(document.toObject());
        delete newDocument._id;
        delete newDocument.flags.ddbimporter.id;

        let results = [];
        for (let i = 1; i < update.system.quantity; i++) {
          logger.debug(`Adding item # ${i}`);
          // eslint-disable-next-line no-await-in-loop
          let newDoc = await actor.createEmbeddedDocuments("Item", [newDocument], DISABLE_FOUNDRY_UPGRADE);
          results.push(newDoc);
          // new doc/item push to ddb handled by the add item hook
        }
        return results;
      } else {
        updateItemDetails.itemsToQuantity.push(duplicate(document));
      }
    }
    if (update.system?.equipped) {
      updateItemDetails.itemsToEquip.push(duplicate(document));
    }
    if (update.name) {
      updateItemDetails.itemsToName.push(duplicate(document));
    }
    if (update.flags?.itemcollection?.contentsData && hasProperty(document, "flags.ddbimporter.id")) {
      const newItems = [];
      const moveItems = [];
      for (const item of update.flags.itemcollection.contentsData) {
        setProperty(item, "flags.ddbimporter.containerEntityId", document.flags.ddbimporter.id);
        setProperty(item, "flags.ddbimporter.containerEntityTypeId", document.flags.ddbimporter.entityTypeId);
        if (parseInt(item.flags.ddbimporter.id) === 0) {
          setProperty(item, "flags.ddbimporter.updateDocumentId", document.id);
          newItems.push(item);
        } else {
          moveItems.push(item);
        }
      }

      addDDBEquipment(actor, newItems);
      updateItemDetails.itemsToMove.push(...moveItems);
    }
  }

  logger.debug("UpdateItemDetails", updateItemDetails);

  return updateDDBEquipmentStatus(actor, updateItemDetails, []);

}

async function updateSpellPrep(actor, document) {
  return new Promise((resolve) => {
    const spellSyncFlag = actor.flags.ddbimporter?.activeSyncSpells;
    if (spellSyncFlag) {
      logger.debug("Updating DDB SpellsPrepared...");
      // get spells class
      const klassName = document.flags.ddbimporter?.dndbeyond?.class;
      const klass = actor.items.find((item) => item.name === klassName && item.type === "class");
      if (klass) {
        resolve(updateDDBSpellsPrepared(actor, [document]));
      } else {
        resolve([]);
      }
    } else {
      logger.warn("Unable to sync spell prep status until character is imported or updated to DDB");
      resolve([]);
    }
  });
}

// Called when characters items are updated
// will dynamically sync status back to DDB
async function activeUpdateUpdateItem(document, update) {
  // eslint-disable-next-line complexity
  return new Promise((resolve) => {

    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && parentActor.flags.ddbimporter?.activeUpdate;

    if (!parentActor || !actorActiveUpdate) {
      resolve([]);
    } else {
      logger.debug("Preparing to sync item change to DDB...");
      const action = document.flags.ddbimporter?.action || document.type === "feat";
      const syncEquipment = game.settings.get("ddb-importer", "dynamic-sync-policy-equipment");
      const syncActionUse = game.settings.get("ddb-importer", "dynamic-sync-policy-action-use");
      const syncHD = game.settings.get("ddb-importer", "dynamic-sync-policy-hitdice");
      const syncSpellsPrepared = game.settings.get("ddb-importer", "dynamic-sync-policy-spells-prepared");
      const isDDBItem = document.flags.ddbimporter?.id;
      const customItem = document.flags.ddbimporter?.custom || false;

      const customNameAllowed = DICTIONARY.types.inventory.includes(document.type) || document.flags.ddbimporter?.action;
      if (!customItem && update.name && customNameAllowed) {
        updateDDBCustomNames(parentActor, [document.toObject()]);
      }

      logger.debug("active update item details", { action, syncActionUse, isDDBItem });
      // is this a DDB action, or do we treat this as an item?
      if (action && syncActionUse && isDDBItem) {
        if (update.system?.uses) {
          logger.debug("Updating action uses", update);
          updateDDBActionUseStatus(parentActor, [duplicate(document)]);
        } else {
          resolve([]);
        }
      } else if (document.type === "class" && syncHD && update.system?.hitDiceUsed) {
        logger.debug("Updating hitdice on DDB");
        resolve(updateDDBHitDice(parentActor, document, update));
      } else if (document.type === "spell" && syncSpellsPrepared &&
        update.system?.preparation && document.system.preparation.mode === "prepared"
      ) {
        logger.debug("Updating DDB SpellsPrepared...");
        updateSpellPrep(parentActor, document).then((results) => {
          logger.debug("Spell prep results", results);
          const failures = results.find((result) => result.success !== true);
          if (failures) setActiveSyncSpellsFlag(parentActor, false);
          resolve(results);
        });
      } else if (syncEquipment && !action) {
        resolve(generateDynamicItemChange(parentActor, document, update));
      }
    }
  });
}


// Called when characters items are added/deleted
// will dynamically sync status back to DDB
async function activeUpdateAddOrDeleteItem(document, state) {
  return new Promise((resolve) => {
    let promises = [];

    const syncEquipment = game.settings.get("ddb-importer", "dynamic-sync-policy-equipment");
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && getProperty(parentActor, "flags.ddbimporter.activeUpdate");

    if (parentActor && actorActiveUpdate && syncEquipment) {
      logger.debug(`Preparing to ${state.toLowerCase()} item on DDB...`);
      const action = document.flags.ddbimporter?.action || document.type === "feat";
      if (!action) {
        logger.debug(`Attempting to ${state.toLowerCase()} new Item`, document);

        switch (state) {
          case "CREATE": {
            const characterId = parseInt(parentActor.flags.ddbimporter.dndbeyond.characterId);
            const containerId = document.flags?.ddbimporter?.containerEntityId;
            if (Number.isInteger(containerId) && characterId != parseInt(containerId)) {
              // update item container
              logger.debug(`Moving item from container`, document);
              document.update({
                "flags.ddbimporter.containerEntityId": characterId,
              });
              const itemData = {
                itemId: parseInt(document.flags.ddbimporter.id),
                containerEntityId: characterId,
                containerEntityTypeId: 1581111423,
              };
              const flavor = { summary: "Moving item to character", name: document.name, containerId: duplicate(containerId) };
              promises.push(updateCharacterCall(parentActor, "equipment/move", itemData, flavor));
            } else {
              logger.debug(`Creating item`, document);
              promises.push(addDDBEquipment(parentActor, [document.toObject()]));
            }
            break;
          }
          case "DELETE": {
            const collectionItems = getItemCollectionItems(parentActor);
            const collectionItemDDBIds = collectionItems
              .filter((item) => hasProperty(item, "flags.ddbimporter.id"))
              .map((item) => item.flags.ddbimporter.id);
            if (hasProperty(document, "flags.ddbimporter.id") &&
              collectionItemDDBIds.includes(document.flags.ddbimporter.id)
            ) {
              // we don't have to handle deletes as the item collection move is handled above
              logger.debug(`Moving item to container`, document);
            } else {
              promises.push(removeDDBEquipment(parentActor, [document.toObject()]));
            }
            break;
          }
          // no default
        }
      }
    }
    resolve(promises);
  });
}

// called when effects are added/deleted/updated
async function activeUpdateEffectTrigger(document, state) {
  return new Promise((resolve) => {
    let promises = [];

    const syncConditions = game.settings.get("ddb-importer", "dynamic-sync-policy-condition");
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && parentActor.flags.ddbimporter?.activeUpdate;

    if (parentActor && actorActiveUpdate && syncConditions) {
      logger.debug(`Preparing to ${state.toLowerCase()} condition on DDB...`);
      // is it a condition?
      // is it a suitable type?
      const isConvenient = document.system?.flags?.isConvenient;
      const condition = getCondition(document.system?.label);
      // exhaustion is a special case, but also a condition effect, handled by character update
      const notExhaustion = condition ? condition.ddbId !== 4 : false;

      if (isConvenient && condition && notExhaustion) {
        logger.debug(`Attempting to ${state.toLowerCase()} Condition`, document);
        switch (state) {
          case "CREATE":
            condition.applied = true;
            promises.push(updateDDBCondition(parentActor, condition));
            break;
          case "UPDATE":
            condition.applied = !document.system.disabled;
            promises.push(updateDDBCondition(parentActor, condition));
            break;
          case "DELETE":
            condition.applied = false;
            promises.push(updateDDBCondition(parentActor, condition));
            break;
          // no default
        }
      }
    }
    resolve(promises);
  });
}

export function activateUpdateHooks() {
  // check to make sure we can sync back, currently only works for 1 gm user
  if (activeUpdate()) {
    Hooks.on("updateActor", activeUpdateActor);
    Hooks.on("updateItem", activeUpdateUpdateItem);
    Hooks.on("createItem", (document) => activeUpdateAddOrDeleteItem(document, "CREATE"));
    Hooks.on("deleteItem", (document) => activeUpdateAddOrDeleteItem(document, "DELETE"));
    // conditions syncing relies of Conv Effects
    const dfConditionsOn = game.modules.get("dfreds-convenient-effects")?.active;
    if (dfConditionsOn) {
      Hooks.on("createActiveEffect", (document) => activeUpdateEffectTrigger(document, "CREATE"));
      Hooks.on("updateActiveEffect", (document) => activeUpdateEffectTrigger(document, "UPDATE"));
      Hooks.on("deleteActiveEffect", (document) => activeUpdateEffectTrigger(document, "DELETE"));
    }
  }
}
