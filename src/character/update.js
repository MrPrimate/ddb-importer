import logger from "../logger.js";
import { getCharacterData } from "./import.js";
import { isEqual } from "../../vendor/lowdash/isequal.js";
import { getCampaignId, getCompendiumType } from "../muncher/utils.js";
import { looseItemNameMatch } from "../muncher/import.js";
import DICTIONARY from "../dictionary.js";
import { getCobalt, checkCobalt } from "../lib/Secrets.js";
import { getCurrentDynamicUpdateState, updateDynamicUpdates, disableDynamicUpdates, setActiveSyncSpellsFlag } from "./utils.js";

var itemIndex;

function activeUpdate() {
  const dynamicSync = game.settings.get("ddb-importer", "dynamic-sync");
  const updateUser = game.settings.get("ddb-importer", "dynamic-sync-user");
  const gmSyncUser = game.user.isGM && game.user.id == updateUser;
  // console.warn(`Dynamic sync: ${dynamicSync}`);
  // console.warn(`Dynamic sync user: ${updateUser}`);
  // console.warn(`gmSyncUser: ${gmSyncUser}`);
  return dynamicSync && gmSyncUser;
}

export async function getUpdateItemIndex() {
  if (itemIndex) return itemIndex;
  const compendium = await getCompendiumType("item", false);

  const indexFields = [
    "name",
    "type",
    "flags.ddbimporter.definitionId",
    "flags.ddbimporter.definitionEntityTypeId",
  ];
  // eslint-disable-next-line require-atomic-updates
  itemIndex = await compendium.getIndex({ fields: indexFields });

  return itemIndex;
}

async function getCompendiumItemInfo(item) {
  const index = await getUpdateItemIndex();
  const match = await looseItemNameMatch(item, index, true, false, true);
  return match;
}

async function updateCharacterCall(actor, path, bodyContent) {
  const characterId = actor.data.flags.ddbimporter.dndbeyond.characterId;
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
  };
  const body = { ...coreBody, ...bodyContent };

  const url = dynamicSync
    ? `${parsingApi}/dynamic/update/${path}`
    : `${parsingApi}/proxy/update/${path}`;

  logger.debug("Update body:", bodyContent);

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
          logger.warn("Update failed:", data.message);
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

async function updateDDBSpellSlotsPact(actor) {
  return new Promise((resolve) => {
    let spellSlotPackData = {
      spellslots: {},
      pact: true,
    };
    spellSlotPackData.spellslots[`level${actor.data.data.spells.pact.level}`] = actor.data.data.spells.pact.value;
    const spellPactSlots = updateCharacterCall(actor, "spell/slots", spellSlotPackData);
    resolve(spellPactSlots);
  });
}

async function spellSlotsPact(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-spells-slots")) resolve();
    if (
      actor.data.data.spells.pact.max > 0 &&
      ddbData.character.character.data.spells.pact.value !== actor.data.data.spells.pact.value
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
      let spellData = actor.data.data.spells[`spell${i}`];
      if (spellData.max > 0 && update.data.spells[`spell${i}`]) {
        const used = spellData.max - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(actor, "spells/slots", spellSlotData));
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
      let spellData = actor.data.data.spells[`spell${i}`];
      if (spellData.max > 0 && ddbData.character.character.data.spells[`spell${i}`].value !== spellData.value) {
        const used = spellData.max - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(actor, "spells/slots", spellSlotData));
    } else {
      resolve();
    }
  });
}

async function updateDDBCurrency(actor) {
  return new Promise((resolve) => {
    const value = {
      pp: Number.isInteger(actor.data.data.currency.pp) ? actor.data.data.currency.pp : 0,
      gp: Number.isInteger(actor.data.data.currency.gp) ? actor.data.data.currency.gp : 0,
      ep: Number.isInteger(actor.data.data.currency.ep) ? actor.data.data.currency.ep : 0,
      sp: Number.isInteger(actor.data.data.currency.sp) ? actor.data.data.currency.sp : 0,
      cp: Number.isInteger(actor.data.data.currency.cp) ? actor.data.data.currency.cp : 0,
    };

    resolve(updateCharacterCall(actor, "currency", value));

  });
}

async function currency(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-currency")) resolve();

    const value = {
      pp: Number.isInteger(actor.data.data.currency.pp) ? actor.data.data.currency.pp : 0,
      gp: Number.isInteger(actor.data.data.currency.gp) ? actor.data.data.currency.gp : 0,
      ep: Number.isInteger(actor.data.data.currency.ep) ? actor.data.data.currency.ep : 0,
      sp: Number.isInteger(actor.data.data.currency.sp) ? actor.data.data.currency.sp : 0,
      cp: Number.isInteger(actor.data.data.currency.cp) ? actor.data.data.currency.cp : 0,
    };

    const same = isEqual(ddbData.character.character.data.currency, value);

    if (!same) {
      resolve(updateCharacterCall(actor, "currency", value));
    } else {
      resolve();
    }

  });
}

async function updateDDBXP(actor) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "xp", { currentXp: actor.data.data.details.xp.value }));
  });
}

async function xp(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-xp")) resolve();
    const same = ddbData.character.character.data.details.xp.value === actor.data.data.details.xp.value;

    if (!same) {
      resolve(updateDDBXP(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBHitPoints(actor) {
  return new Promise((resolve) => {
    const temporaryHitPoints = actor.data.data.attributes.hp.temp ? actor.data.data.attributes.hp.temp : 0;
    const removedHitPoints = actor.data.data.attributes.hp.max - actor.data.data.attributes.hp.value;
    const hitPointData = {
      removedHitPoints,
      temporaryHitPoints,
    };
    resolve(updateCharacterCall(actor, "hitpoints", hitPointData));
  });
}

async function hitPoints(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-hitpoints")) resolve();
    const temporaryHitPoints = actor.data.data.attributes.hp.temp ? actor.data.data.attributes.hp.temp : 0;
    const same =
      ddbData.character.character.data.attributes.hp.value === actor.data.data.attributes.hp.value &&
      ddbData.character.character.data.attributes.hp.temp === temporaryHitPoints;

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
      inspiration: actor.data.data.attributes.inspiration,
    });
    resolve(inspiration);
  });
}

async function inspiration(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-inspiration")) resolve();
    const same = ddbData.character.character.data.attributes.inspiration === actor.data.data.attributes.inspiration;

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
    if (actor.data.data.attributes.exhaustion !== 0) {
      exhaustionData["level"] = actor.data.data.attributes.exhaustion;
      exhaustionData["totalHP"] = actor.data.data.attributes.hp.max;
      exhaustionData["addCondition"] = true;
    }
    resolve(updateCharacterCall(actor, "condition", exhaustionData));
  });
}


async function exhaustion(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-condition")) resolve();
    const same = ddbData.character.character.data.attributes.exhaustion === actor.data.data.attributes.exhaustion;

    if (!same) {
      resolve(updateDDBExhaustion(actor));
    } else {
      resolve();
    }

  });
}

async function updateDDBDeathSaves(actor) {
  return new Promise((resolve) => {
    const deathSaveData = {
      failCount: actor.data.data.attributes.death.failure,
      successCount: actor.data.data.attributes.death.success,
    };
    resolve(updateCharacterCall(actor, "deathsaves", deathSaveData));
  });
}

async function deathSaves(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-deathsaves")) resolve();
    const same = isEqual(ddbData.character.character.data.attributes.death, actor.data.data.attributes.death);

    if (!same) {
      resolve(updateDDBDeathSaves(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBHitDice(actor, klass, update) {
  return new Promise((resolve) => {
    if (klass.data.flags?.ddbimporter?.id) {
      let hitDiceData = {
        classHitDiceUsed: {},
        resetMaxHpModifier: false,
      };
      hitDiceData.classHitDiceUsed[klass.data.flags.ddbimporter.id] = update.data.hitDiceUsed;
      resolve(updateCharacterCall(actor, "hitdice", { shortRest: hitDiceData }));
    } else {
      resolve();
    }
  });
}

async function hitDice(actor, ddbData) {
  return new Promise((resolve) => {
    if (!game.settings.get("ddb-importer", "sync-policy-hitdice")) resolve();

    const ddbClasses = ddbData.character.classes;

    const klasses = actor.data.items.filter(
      (item) => item.type === "class" && item.data.flags.ddbimporter.id && item.data.flags.ddbimporter.definitionId
    );

    let hitDiceData = {
      classHitDiceUsed: {},
      resetMaxHpModifier: false,
    };

    klasses.forEach((klass) => {
      const classMatch = ddbClasses.find((ddbClass) => ddbClass.flags.ddbimporter.id === klass.data.flags.ddbimporter.id);
      if (classMatch && classMatch.data.hitDiceUsed !== klass.data.data.hitDiceUsed) {
        hitDiceData.classHitDiceUsed[klass.data.flags.ddbimporter.id] = klass.data.data.hitDiceUsed;
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
    resolve(updateCharacterCall(actor, "spell/prepare", spellPreparedData));
  });
}

async function updateDDBSpellsPrepared(actor, spells) {
  let promises = [];

  const preparedSpells = spells.filter((spell) =>
    spell.type === "spell" &&
    spell.data.data.preparation?.mode === "prepared" &&
    spell.data.flags.ddbimporter?.dndbeyond?.characterClassId
  ).map((spell) => {
    let spellPreparedData = {
        spellInfo: {
          spellId: spell.data.flags.ddbimporter.definitionId,
          characterClassId: spell.data.flags.ddbimporter.dndbeyond.characterClassId,
          entityTypeId: spell.data.flags.ddbimporter.entityTypeId,
          id: spell.data.flags.ddbimporter.id,
          prepared: spell.data.data.preparation.prepared === true,
        }
    };
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

  const preparedSpells = actor.data.items.filter((item) => {
    const spellMatch = ddbSpells.find((s) =>
      s.name === item.name &&
      item.data.data.preparation?.mode === "prepared" &&
      item.data.flags.ddbimporter?.dndbeyond?.characterClassId &&
      item.data.flags.ddbimporter?.dndbeyond?.characterClassId === s.flags.ddbimporter?.dndbeyond?.characterClassId
    );
    if (!spellMatch) return false;
    const select = item.type === "spell" &&
      item.data.data.preparation?.mode === "prepared" &&
      item.data.data.preparation.prepared !== spellMatch.data.preparation?.prepared;
    return spellMatch && select;
  });

  const results = updateDDBSpellsPrepared(actor, preparedSpells);

  return results;
}


async function generateItemsToAdd(actor, itemsToAdd) {
  const results = {
    items: [],
    toAdd: [],
    custom: [],
  };

  for (let i = 0; i < itemsToAdd.length; i++) {
    let item = itemsToAdd[i];
    if (item.flags.ddbimporter?.definitionId && item.flags.ddbimporter?.definitionEntityTypeId) {
      results.toAdd.push({
        containerEntityId: parseInt(actor.data.flags.ddbimporter?.dndbeyond?.characterId),
        containerEntityTypeId: parseInt("1581111423"),
        entityId: parseInt(item.flags.ddbimporter.definitionId),
        entityTypeId: parseInt(item.flags.ddbimporter.definitionEntityTypeId),
        quantity: parseInt(item.data.quantity),
      });
    } else {
      // eslint-disable-next-line no-await-in-loop
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
        results.toAdd.push({
          containerEntityId: parseInt(actor.data.flags.ddbimporter?.dndbeyond?.characterId),
          containerEntityTypeId: parseInt("1581111423"),
          entityId: parseInt(ddbCompendiumMatch.flags.ddbimporter.definitionId),
          entityTypeId: parseInt(ddbCompendiumMatch.flags.ddbimporter.definitionEntityTypeId),
          quantity: parseInt(item.data.quantity),
        });
      } else {
        results.custom.push(item);
      }
    }
    results.items.push(item);
  }
  return new Promise((resolve) => {
    resolve(results);
  });
}

async function deleteDDBCustomItems(actor, itemsToDelete) {
  return new Promise((resolve) => {
    let customItemResults = [];
    for (let i = 0; i < itemsToDelete.length; i++) {
      const item = itemsToDelete[i];
      const customData = {
        itemState: "DELETE",
        customValues: {
          characterId: parseInt(actor.data.flags.ddbimporter.dndbeyond.characterId),
          id: item.flags.ddbimporter.id,
        }
      };
      const result = updateCharacterCall(actor, "custom/item", customData).then((data) => {
        setProperty(item, "flags.ddbimporter.id", data.data.id);
        setProperty(item, "flags.ddbimporter.custom", true);
        return item;
      });
      customItemResults.push(result);
    }

    resolve(customItemResults);
  });
}


async function addDDBCustomItems(actor, itemsToAdd) {
  return new Promise((resolve) => {
    let customItemResults = [];
    for (let i = 0; i < itemsToAdd.length; i++) {
      const item = itemsToAdd[i];
      const customData = {
        itemState: "NEW",
        customValues: {
          characterId: parseInt(actor.data.flags.ddbimporter.dndbeyond.characterId),
          name: item.name,
          description: item.data.description.value,
        }
      };
      const result = updateCharacterCall(actor, "custom/item", customData).then((data) => {
        setProperty(item, "flags.ddbimporter.id", data.data.id);
        setProperty(item, "flags.ddbimporter.custom", true);
        return item;
      });
      customItemResults.push(result);
    }

    resolve(customItemResults);
  });
}

async function addDDBEquipment(actor, itemsToAdd) {
  const generatedItemsToAddData = await generateItemsToAdd(actor, itemsToAdd);

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
    logger.error(`Update payload:`, customItems);
  }

  if (addItemData.equipment.length > 0) {
    const itemResults = await updateCharacterCall(actor, "equipment/add", addItemData);
    try {
      const itemUpdates = itemResults.data.addItems
        .filter((addedItem) => itemsToAdd.some((i) =>
          i.flags.ddbimporter &&
          i.flags.ddbimporter.definitionId === addedItem.definition.id &&
          i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId
        ))
        .map((addedItem) => {
          let updatedItem = itemsToAdd.find((i) =>
            i.flags.ddbimporter &&
            i.flags.ddbimporter.definitionId === addedItem.definition.id &&
            i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId
          );
          setProperty(updatedItem, "flags.ddbimporter.id", addedItem.id);
          return updatedItem;
        });

      logger.debug("Character item updates:", itemUpdates);
      logger.debug("Character custom item updates:", customItems);

      try {
        if (itemUpdates.length > 0) await actor.updateEmbeddedDocuments("Item", itemUpdates);
        if (customItems.length > 0) await actor.updateEmbeddedDocuments("Item", customItems);
      } catch (err) {
        logger.error(`Unable to update character with equipment, got the error:`, err);
        logger.error(`Update payload:`, itemUpdates);
        logger.error(`Update custom payload:`, customItems);
      }

    } catch (err) {
      logger.error(`Unable to filter updated equipment, got the error:`, err);
      logger.error(`itemsToAdd`, itemsToAdd);
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
  const syncItemReady = actor.data.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  const ddbItems = ddbData.character.inventory;

  const itemsToAdd = actor.data.items.filter((item) =>
    !item.data.flags.ddbimporter?.action &&
    item.data.data.quantity !== 0 &&
    DICTIONARY.types.inventory.includes(item.type) &&
    !item.data.flags.ddbimporter?.custom &&
    (!item.data.flags.ddbimporter?.id ||
    !ddbItems.some((s) => s.flags.ddbimporter?.id === item.data.flags.ddbimporter?.id && s.type === item.type))
  ).map((item) => item.toObject());

  return addDDBEquipment(actor, itemsToAdd);
}


// updates custom names on regular items
async function updateDDBCustomNames(actor, items) {
  let promises = [];

  items.forEach((item) => {
    const customData = {
      customValues: {
        characterId: parseInt(actor.data.flags.ddbimporter.dndbeyond.characterId),
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
    promises.push(updateCharacterCall(actor, "equipment/custom", customData));
  });

  return Promise.all(promises);

}

// updates names of items and actions
async function updateCustomNames(actor, ddbData) {
  const syncItemReady = actor.data.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  const ddbItems = ddbData.character.inventory;

  const itemsToName = actor.data.items.filter((item) =>
    item.data.data.quantity !== 0 &&
    (DICTIONARY.types.inventory.includes(item.type) || item.data.flags.ddbimporter?.action) &&
    item.data.flags.ddbimporter?.id &&
    // item.data.flags.ddbimporter?.entityTypeId &&
    ddbItems.some((s) =>
      s.flags.ddbimporter?.id === item.data.flags.ddbimporter.id &&
      s.type === item.type && s.name !== item.name
    )
  ).map((item) => item.toObject());

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
        promises.push(updateCharacterCall(actor, "equipment/remove", { itemId: parseInt(item.flags.ddbimporter.id) }));
      }
    }
  });

  return Promise.all(promises);
}

async function removeEquipment(actor, ddbData) {
  const syncItemReady = actor.data.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  const ddbItems = ddbData.character.inventory;

  const itemsToRemove = ddbItems.filter((item) =>
    (!actor.data.items.some((s) => (item.flags.ddbimporter?.id === s.data.flags.ddbimporter?.id && s.type === item.type) && !s.data.flags.ddbimporter?.action) ||
    actor.data.items.some((s) => (item.flags.ddbimporter?.id === s.data.flags.ddbimporter?.id && s.type === item.type) && !s.data.flags.ddbimporter?.action && s.data.data.quantity == 0)) &&
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

  let promises = [];

  itemsToEquip.forEach((item) => {
    const itemData = { itemId: item.data.flags.ddbimporter.id, value: item.data.data.equipped };
    promises.push(updateCharacterCall(actor, "equipment/equipped", itemData));
  });
  itemsToAttune.forEach((item) => {
    const itemData = { itemId: item.data.flags.ddbimporter.id, value: (item.data.data.attunement === 2) };
    promises.push(updateCharacterCall(actor, "equipment/attuned", itemData));
  });
  itemsToCharge.forEach((item) => {
    const itemData = {
      itemId: item.data.flags.ddbimporter.id,
      charges: parseInt(item.data.data.uses.max) - parseInt(item.data.data.uses.value),
    };
    promises.push(updateCharacterCall(actor, "equipment/charges", itemData));
  });
  itemsToQuantity.forEach((item) => {
    const itemData = {
      itemId: item.data.flags.ddbimporter.id,
      quantity: parseInt(item.data.data.quantity),
    };
    promises.push(updateCharacterCall(actor, "equipment/quantity", itemData));
  });
  itemsToName.forEach((item) => {
    // historically items may not have this metadata
    const entityTypeId = item.data?.flags?.ddbimporter?.entityTypeId
      ? item.data.flags.ddbimporter.entityTypeId
      : ddbItems.find((dItem) => dItem.id === item.data.flags.ddbimporter.id).entityTypeId;
    const customData = {
      customValues: {
        characterId: parseInt(actor.data.flags.ddbimporter.dndbeyond.characterId),
        contextId: null,
        contextTypeId: null,
        notes: null,
        typeId: 8,
        value: item.name,
        valueId: `${item.data.flags.ddbimporter.id}`,
        valueTypeId: `${entityTypeId}`,
      }
    };
    promises.push(updateCharacterCall(actor, "equipment/custom", customData));
  });

  customItems.forEach((item) => {
    const customData = {
      itemState: "UPDATE",
      customValues: {
        characterId: parseInt(actor.data.flags.ddbimporter.dndbeyond.characterId),
        id: item.data.flags.ddbimporter.id,
        name: item.name,
        description: item.data.data.description.value,
        // revist these need to be ints
        // weight: `${item.data.data.weight}`,
        // cost: ${item.data.data.price,
        quantity: parseInt(item.data.data.quantity),
      }
    };
    promises.push(updateCharacterCall(actor, "custom/item", customData));
  });

  return Promise.all(promises);
}


async function equipmentStatus(actor, ddbData, addEquipmentResults) {
  const syncItemReady = actor.data.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get("ddb-importer", "sync-policy-equipment")) return [];
  // reload the actor following potential updates to equipment
  let ddbItems = ddbData.ddb.character.inventory;
  let customDDBItems = ddbData.ddb.character.customItems;
  if (addEquipmentResults?.data) {
    actor = game.actors.get(actor.id);
    ddbItems = ddbItems.concat(addEquipmentResults.data.addItems);
  }

  const itemsToEquip = actor.data.items.filter((item) =>
    !item.data.flags.ddbimporter?.action && item.data.flags.ddbimporter?.id &&
    !item.data.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      item.data.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.data.flags.ddbimporter?.id &&
      item.data.data.equipped !== dItem.equipped
    )
  );
  const itemsToAttune = actor.data.items.filter((item) =>
    !item.data.flags.ddbimporter?.action && item.data.flags.ddbimporter?.id &&
    !item.data.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      item.data.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.data.flags.ddbimporter?.id &&
      ((item.data.data.attunement === 2) !== dItem.isAttuned)
    )
  );
  const itemsToCharge = actor.data.items.filter((item) =>
    !item.data.flags.ddbimporter?.action && item.data.flags.ddbimporter?.id &&
    !item.data.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      item.data.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.data.flags.ddbimporter?.id &&
      item.data.data.uses?.max && dItem.limitedUse?.numberUsed &&
      ((parseInt(item.data.data.uses.max) - parseInt(item.data.data.uses.value)) !== dItem.limitedUse.numberUsed)
    )
  );
  const itemsToQuantity = actor.data.items.filter((item) =>
    !item.data.flags.ddbimporter?.action && item.data.flags.ddbimporter?.id &&
    !item.data.data.quantity == 0 &&
    !item.data.flags.ddbimporter?.custom &&
    ((item.type !== "weapon" && item.type !== "armor") || item.data.flags.ddbimporter?.dndbeyond?.stackable) &&
    !item.data.data?.armor?.type &&
    ddbItems.some((dItem) =>
      item.data.flags.ddbimporter.id === dItem.id &&
      dItem.id === item.data.flags.ddbimporter?.id &&
      item.data.data.quantity !== dItem.quantity
    )
  );
  // this is for items that have been added and might have a different name
  const itemsToName = actor.data.items.filter((item) =>
    item.data.flags.ddbimporter?.id &&
    item.data.data.quantity !== 0 &&
    !item.data.flags.ddbimporter?.custom &&
    ddbItems.some((dItem) =>
      // item.data.flags.ddbimporter.id === dItem.id &&
      item.data.flags.ddbimporter.originalName === dItem.definition.name &&
      item.data.flags.ddbimporter.originalName !== item.data.name &&
      !item.data.data.quantity == 0 &&
      dItem.id === item.data.flags.ddbimporter?.id &&
      item.data.name !== dItem.definition.name
    )
  );

  // update.name || update.data?.description || update.data?.weight || update.data?.price || update.data?.quantity
  const customItems = actor.data.items.filter((item) =>
    item.data.flags.ddbimporter?.id &&
    item.data.data.quantity !== 0 &&
    item.data.flags.ddbimporter?.custom &&
    customDDBItems.some((dItem) => dItem.id === item.data.flags.ddbimporter.id &&
      (
        item.data.name !== dItem.name ||
        item.data.data.description.value != dItem.description ||
        item.data.data.quantity != dItem.quantity ||
        item.data.data.weight != dItem.weight ||
        item.data.data.price != dItem.cost
      )
    )
  );

  const itemsToUpdate = {
    itemsToEquip,
    itemsToAttune,
    itemsToCharge,
    itemsToQuantity,
    itemsToName,
    customItems,
  };

  return updateDDBEquipmentStatus(actor, itemsToUpdate, ddbItems);

}

async function updateActionUseStatus(actor, actionData) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "action/use", actionData));
  });
}

async function updateDDBActionUseStatus(actor, actions) {
  let promises = [];
  actions.forEach((action) => {
    const actionData = {
      actionId: action.data.flags.ddbimporter.id,
      entityTypeId: action.data.flags.ddbimporter.entityTypeId,
      uses: parseInt(action.data.data.uses.max) - parseInt(action.data.data.uses.value)
    };
    promises.push(updateActionUseStatus(actor, actionData));
  });
  return Promise.all(promises);
}

async function actionUseStatus(actor, ddbData) {
  const syncActionReady = actor.data.flags.ddbimporter?.syncActionReady;
  if (syncActionReady && !game.settings.get("ddb-importer", "sync-policy-action-use")) return [];

  let ddbActions = ddbData.character.actions;

  const actionsToCharge = actor.data.items.filter((item) =>
    (item.data.flags.ddbimporter?.action || item.type === "feat") &&
    item.data.flags.ddbimporter?.id && item.data.flags.ddbimporter?.entityTypeId &&
    ddbActions.some((dItem) =>
      item.data.flags.ddbimporter.id === dItem.flags.ddbimporter.id &&
      item.data.flags.ddbimporter.entityTypeId === dItem.flags.ddbimporter.entityTypeId &&
      item.name === dItem.name && item.type === dItem.type &&
      item.data.data.uses?.value &&
      item.data.data.uses.value !== dItem.data.uses.value
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

  const characterId = actor.data.flags.ddbimporter.dndbeyond.characterId;
  const syncId = actor.data.flags["ddb-importer"]?.syncId ? actor.data.flags["ddb-importer"].syncId + 1 : 0;
  let ddbData = await getCharacterData(characterId, syncId, actor.id);

  logger.debug("Current actor:", actor.data);
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
    actionStatusResults
  ).filter((result) => result !== undefined);

  logger.debug("Update results", results);
  await updateDynamicUpdates(actor, activeUpdateState);

  return results;
}

// Called when characters are updated
// will dynamically sync status back to DDB
async function activeUpdateActor(actor, update) {
  return new Promise((resolve) => {

    const promises = [];

    const dynamicSync = activeUpdate();
    const actorActiveUpdate = actor.data.flags.ddbimporter?.activeUpdate;

    if (dynamicSync && actorActiveUpdate) {
      const syncHP = game.settings.get("ddb-importer", "dynamic-sync-policy-hitpoints");
      const syncCurrency = game.settings.get("ddb-importer", "dynamic-sync-policy-currency");
      const syncSpellSlots = game.settings.get("ddb-importer", "dynamic-sync-policy-spells-slots");
      const syncInspiration = game.settings.get("ddb-importer", "dynamic-sync-policy-inspiration");
      const syncExhaustion = game.settings.get("ddb-importer", "dynamic-sync-policy-condition");
      const syncDeathSaves = game.settings.get("ddb-importer", "dynamic-sync-policy-deathsaves");
      const syncXP = game.settings.get("ddb-importer", "dynamic-sync-policy-xp");


      if (syncHP && update.data?.attributes?.hp) {
        logger.debug("Updating DDB Hitpoints...");
        promises.push(updateDDBHitPoints(actor));
      }
      if (syncCurrency && update.data?.currency) {
        logger.debug("Updating DDB Currency...");
        promises.push(updateDDBCurrency(actor));
      }
      if (syncSpellSlots && update.data?.spells) {
        const spellKeys = Object.keys(update.data.spells);
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
        (update.data?.attributes?.inspiration === true || update.data?.attributes?.inspiration === false)
      ) {
        logger.debug("Updating DDB Inspiration...");
        promises.push(updateDDBInspiration(actor));
      }
      if (syncExhaustion && update.data?.attributes?.exhaustion) {
        logger.debug("Updating DDB Exhaustion...");
        promises.push(updateDDBExhaustion(actor));
      }
      if (syncDeathSaves && update.data?.attributes?.death) {
        logger.debug("Updating DDB DeathSaves...");
        promises.push(updateDDBDeathSaves(actor));
      }
      if (syncXP && update.data?.attributes?.xp) {
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
  };

  // console.warn("Document", document);
  // console.warn("ItemUpdate", update);

  if (document.data.flags.ddbimporter?.custom) {
    if (update.name || update.data?.description || update.data?.weight || update.data?.price || update.data?.quantity) {
      updateItemDetails.customItems.push(document);
    }
  } else {
    if (update.data?.uses) {
      updateItemDetails.itemsToCharge.push(document);
    }
    if (update.data?.attunement) {
      updateItemDetails.itemsToAttune.push(document);
    }
    if (update.data?.quantity) {
      // if its a weapon or armor we actually need to push a new one
      if (!document.data.flags.ddbimporter?.dndbeyond?.stackable && update.data.quantity > 1) {
        // Some items are not stackable on DDB

        await document.update({ data: { quantity: 1 } });
        let newDocument = JSON.parse(JSON.stringify(document.toObject()));
        delete newDocument._id;
        delete newDocument.flags.ddbimporter.id;

        let results = [];
        for (let i = 1; i < update.data.quantity; i++) {
          logger.debug(`Adding item # ${i}`);
          // eslint-disable-next-line no-await-in-loop
          let newDoc = await actor.createEmbeddedDocuments("Item", [newDocument], DISABLE_FOUNDRY_UPGRADE);
          results.push(newDoc);
          // new doc/item push to ddb handled by the add item hook
        }
        return results;
      } else {
        updateItemDetails.itemsToQuantity.push(document);
      }
    }
    if (update.data?.equipped) {
      updateItemDetails.itemsToEquip.push(document);
    }
    if (update.name) {
      updateItemDetails.itemsToName.push(document);
    }
  }

  return updateDDBEquipmentStatus(actor, updateItemDetails, []);

}

async function updateSpellPrep(actor, document) {
  return new Promise((resolve) => {
    const spellSyncFlag = actor.data.flags.ddbimporter?.activeSyncSpells;
    if (spellSyncFlag) {
      logger.debug("Updating DDB SpellsPrepared...");
      // get spells class
      const klassName = document.data.flags.ddbimporter?.dndbeyond?.class;
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

    const dynamicSync = activeUpdate();
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && parentActor.data.flags.ddbimporter?.activeUpdate;

    if (!dynamicSync || !parentActor || !actorActiveUpdate) {
      resolve([]);
    } else {
      logger.debug("Preparing to sync item change to DDB...");
      const action = document.data.flags.ddbimporter?.action || document.type === "feat";
      const syncEquipment = game.settings.get("ddb-importer", "dynamic-sync-policy-equipment");
      const syncActionUse = game.settings.get("ddb-importer", "dynamic-sync-policy-action-use");
      const syncHD = game.settings.get("ddb-importer", "dynamic-sync-policy-hitdice");
      const syncSpellsPrepared = game.settings.get("ddb-importer", "dynamic-sync-policy-spells-prepared");
      const isDDBItem = document.data.flags.ddbimporter?.id;
      const customItem = document.data.flags.ddbimporter?.custom || false;

      const customNameAllowed = DICTIONARY.types.inventory.includes(document.type) || document.data.flags.ddbimporter?.action;
      if (!customItem && update.name && customNameAllowed) {
        updateDDBCustomNames(parentActor, [document]);
      }

      // is this a DDB action, or do we treat this as an item?
      if (action && syncActionUse && isDDBItem) {
        if (update.data?.uses) {
          logger.debug("Updating action uses", update);
          updateDDBActionUseStatus(parentActor, [document]);
        } else {
          resolve([]);
        }
      } else if (document.type === "class" && syncHD && update.data?.hitDiceUsed) {
        logger.debug("Updating hitdice on DDB");
        resolve(updateDDBHitDice(parentActor, document, update));
      } else if (document.type === "spell" && syncSpellsPrepared &&
        update.data?.preparation && document.data.data.preparation.mode === "prepared"
      ) {
        logger.debug("Updating DDB SpellsPrepared...");
        updateSpellPrep(parentActor, document).then((results) => {
          logger.debug("Spell prep results", results);
          const failures = results.find((result) => result.success !== true);
          if (failures) setActiveSyncSpellsFlag(parentActor, false);
          resolve(results);
        });
      } else if (syncEquipment) {
        resolve(generateDynamicItemChange(parentActor, document, update));
      }
    }
  });
}


// Called when characters items are added
// will dynamically sync status back to DDB
async function activeUpdateAddItem(document) {
  return new Promise((resolve) => {
    let promises = [];

    const syncEquipment = game.settings.get("ddb-importer", "dynamic-sync-policy-equipment");
    const dynamicSync = activeUpdate();
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && parentActor.data.flags.ddbimporter?.activeUpdate;

    if (dynamicSync && parentActor && actorActiveUpdate && syncEquipment) {
      logger.debug("Preparing to add item to DDB...");
      const action = document.data.flags.ddbimporter?.action || document.type === "feat";
      if (!action) {
        logger.debug("Attempting to add new Item", document);
        promises.push(addDDBEquipment(parentActor, [document.toObject()]));
      }
    }
    resolve(promises);
  });
}

// Called when characters items are added
// will dynamically sync status back to DDB
async function activeUpdateDeleteItem(document) {
  return new Promise((resolve) => {
    let promises = [];

    const syncEquipment = game.settings.get("ddb-importer", "dynamic-sync-policy-equipment");
    const dynamicSync = activeUpdate();
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && parentActor.data.flags.ddbimporter?.activeUpdate;

    if (dynamicSync && parentActor && actorActiveUpdate && syncEquipment) {
      logger.debug("Preparing to delete item from DDB...");
      const action = document.data.flags.ddbimporter?.action || document.type === "feat";
      if (!action) {
        logger.debug("Attempting to remove new Item", document);
        promises.push(removeDDBEquipment(parentActor, [document.toObject()]));
      }
    }
    resolve(promises);
  });
}

export function activateUpdateHooks() {
  if (activeUpdate()) {
    Hooks.on("updateActor", activeUpdateActor);
    Hooks.on("updateItem", activeUpdateUpdateItem);
    Hooks.on("deleteItem", activeUpdateDeleteItem);
    Hooks.on("createItem", activeUpdateAddItem);
  }
}
