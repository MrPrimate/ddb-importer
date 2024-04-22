import logger from "../logger.js";
import utils from "../lib/utils.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import DICTIONARY from "../dictionary.js";
import SETTINGS from "../settings.js";
import { isEqual } from "../../vendor/lowdash/isequal.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import { getCobalt, checkCobalt } from "../lib/Secrets.js";
import { getActorConditionStates, getCondition } from "../parser/special/conditions.js";
import DDBProxy from "../lib/DDBProxy.js";
import DDBCharacter from "../parser/DDBCharacter.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import NameMatcher from "../lib/NameMatcher.js";

function getContainerItems(actor) {
  return actor.items
    .filter((item) =>
      foundry.utils.hasProperty(item, "flags.ddbimporter.id")
      && foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
      && item.flags.ddbimporter.containerEntityId === parseInt(actor.flags.ddbimporter.dndbeyond.characterId)
      && !item.flags.ddbimporter?.ignoreItemImport
      && !item.system.container
    );
}

function getItemRollData(actor, itemId) {
  const item = actor.items.get(itemId);
  const rollData = item.getRollData();
  return {
    item,
    rollData,
  };
}

function setContainerDetails(actor, item, containerItems = null) {
  const characterId = actor.flags.ddbimporter.dndbeyond.characterId;
  const ddbContainers = containerItems ?? getContainerItems(actor);

  const containerItem = item.system.container
    ? ddbContainers.find((container) => container._id === item.system.container)
    : null;

  if (containerItem) {
    const containerId = foundry.utils.getProperty(containerItem, "flags.ddbimporter.id");
    const containerEntityTypeId = foundry.utils.getProperty(containerItem, "flags.ddbimporter.entityTypeId");
    foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", containerId);
    foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityTypeId", containerEntityTypeId);
  } else {
    // set the container entity id to the id of the character, if the character is the "container"
    foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", parseInt(characterId));
  }

  return item;
}

function getFoundryItems(actor) {
  const ddbContainers = getContainerItems(actor);

  const actorItems = foundry.utils.duplicate(actor.items)
    .filter((item) => !(item.flags.ddbimporter?.ignoreItemUpdate ?? false))
    .map((rawItem) => {
      const item = getItemRollData(actor, rawItem._id).item;
      return setContainerDetails(actor, item, ddbContainers);
    });
  // don't return update ignored items
  return actorItems;
}

function getCustomItemDescription(text) {
  return utils.stripHtml(text).substring(0, 2055);
}

async function getUpdateItemIndex() {
  if (foundry.utils.hasProperty(CONFIG, "DDBI.update.itemIndex")) return foundry.utils.getProperty(CONFIG, "DDBI.update.itemIndex");
  const compendium = await CompendiumHelper.getCompendiumType("item", false);

  const indexFields = [
    "name",
    "type",
    "flags.ddbimporter.definitionId",
    "flags.ddbimporter.definitionEntityTypeId",
  ];
  // eslint-disable-next-line require-atomic-updates
  const itemIndex = await compendium.getIndex({ fields: indexFields });
  foundry.utils.setProperty(CONFIG, "DDBI.update.itemIndex", itemIndex);

  return itemIndex;
}

async function getCompendiumItemInfo(item) {
  const index = await getUpdateItemIndex();
  const match = NameMatcher.looseItemNameMatch(item, index, true, false, true);
  return match;
}

// flavor is just useful for debugging
async function updateCharacterCall(actor, path, bodyContent, flavor) {
  const characterId = actor.flags.ddbimporter.dndbeyond.characterId;
  const cobaltCookie = getCobalt(actor.id);
  const dynamicSync = SETTINGS.STATUS.activeUpdate();
  const parsingApi = dynamicSync
    ? DDBProxy.getDynamicProxy()
    : DDBProxy.getProxy();
  const useCharacterKey = foundry.utils.getProperty(actor, "flags.ddbimporter.useLocalPatreonKey") ?? false;
  const betaKey = PatreonHelper.getPatreonKey(useCharacterKey);
  const campaignId = DDBCampaigns.getCampaignId();
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

async function spellSlotsPact(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-slots")) resolve();
    if (
      actor.system.spells.pact.max > 0
      && ddbCharacter.data.character.system.spells.pact.value !== actor.system.spells.pact.value
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

async function spellSlots(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-slots")) resolve();

    let spellSlotData = { spellslots: {}, update: false };
    for (let i = 1; i <= 9; i++) {
      let spellData = actor.system.spells[`spell${i}`];
      if (spellData.max > 0 && ddbCharacter.data.character.system.spells[`spell${i}`].value !== spellData.value) {
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

async function currency(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-currency")) resolve();

    const value = {
      pp: Number.isInteger(actor.system.currency.pp) ? actor.system.currency.pp : 0,
      gp: Number.isInteger(actor.system.currency.gp) ? actor.system.currency.gp : 0,
      ep: Number.isInteger(actor.system.currency.ep) ? actor.system.currency.ep : 0,
      sp: Number.isInteger(actor.system.currency.sp) ? actor.system.currency.sp : 0,
      cp: Number.isInteger(actor.system.currency.cp) ? actor.system.currency.cp : 0,
    };

    const same = isEqual(ddbCharacter._currency, value);

    if (!same) {
      resolve(updateCharacterCall(actor, "currency", value));
    } else {
      resolve();
    }

  });
}

// async function itemCurrencyUpdate(actor, foundryItem, type, value) {
//   return new Promise((resolve) => {
//     const currency = {
//       amount: value,
//       characterId: actor.flags.ddbimporter.dndbeyond.characterId,
//       destinationEntityId: foundryItem.id,
//       destinationEntityTypeId: foundryItem.entityTypeId,
//     };
//     resolve(updateCharacterCall(actor, `currency/individual`, { type, currency }, `Currency - ${type}`));
//   });
// }

// async function itemCurrency(actor, ddbItem, foundryItem) {
//   if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-currency")) return [];
//   if (!game.modules.get("itemcollection")?.active) return [];
//   if (!foundry.utils.hasProperty(foundryItem, "system.currency")) return [];

//   const promises = [];

//   ["pp", "gp", "ep", "sp", "cp"].forEach((type) => {
//     const same = isEqual(foundryItem.system.currency[type], ddbItem.currency[type]);
//     if (!same) {
//       promises.push(itemCurrencyUpdate(actor, foundryItem, type, foundryItem.system.currency[type]));
//     }
//   });

//   return Promise.all(promises);
// }

async function updateDDBXP(actor) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "xp", { currentXp: actor.system.details.xp.value ?? 0 }, "XP"));
  });
}

async function xp(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-xp")) resolve();
    const same = ddbCharacter.data.character.system.details.xp.value === actor.system.details.xp.value;

    if (!same) {
      resolve(updateDDBXP(actor));
    } else {
      resolve();
    }
  });
}

async function updateDDBHitPoints(actor) {
  return new Promise((resolve) => {
    const temporaryHitPoints = actor.system.attributes.hp.temp ?? 0;
    const bonusHitPoints = actor.system.attributes.hp.tempmax ?? 0;
    const removedHitPoints = (actor.system.attributes.hp.max + bonusHitPoints) - (actor.system.attributes.hp.value ?? 0);
    const hitPointData = {
      removedHitPoints,
      temporaryHitPoints,
    };
    resolve(updateCharacterCall(actor, "hitpoints", hitPointData, "HP"));
  });
}

async function updateTempMaxDDBHitPoints(actor) {
  return new Promise((resolve) => {

    const bonusHitPoints = {
      bonusHitPoints: actor.system.attributes.hp.tempmax ?? 0,
    };
    resolve(updateCharacterCall(actor, "hpbonus", bonusHitPoints, "HPBonus"));
  });
}


async function hitPoints(actor, ddbCharacter) {
  if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-hitpoints")) return [];
  let promises = [];
  const same
    = ddbCharacter.data.character.system.attributes.hp.value === (actor.system.attributes.hp.value ?? 0)
    && (ddbCharacter.data.character.system.attributes.hp.temp ?? 0) === (actor.system.attributes.hp.temp ?? 0);

  if (!same) {
    promises.push(updateDDBHitPoints(actor));
  }

  const hpSame = ddbCharacter.data.character.system.attributes.hp.tempmax === (actor.system.attributes.hp.tempmax ?? 0);

  if (!hpSame) {
    promises.push(updateTempMaxDDBHitPoints(actor));
  }

  return Promise.all(promises);
}

async function updateDDBInspiration(actor) {
  return new Promise((resolve) => {
    const inspiration = updateCharacterCall(actor, "inspiration", {
      inspiration: actor.system.attributes.inspiration,
    }, "Inspiration");
    resolve(inspiration);
  });
}

async function inspiration(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-inspiration")) resolve();
    const same = ddbCharacter.data.character.system.attributes.inspiration === actor.system.attributes.inspiration;

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


async function exhaustion(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-condition")) resolve();
    const same = ddbCharacter.data.character.system.attributes.exhaustion === actor.system.attributes.exhaustion;

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

async function conditions(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-condition")) resolve([]);
    const conditions = getActorConditionStates(actor, ddbCharacter.source.ddb);
    let results = [];
    conditions.forEach((condition) => {
      // exhaustion handled separately
      if (condition.needsUpdate && condition.ddbId !== 4) {
        results.push(updateDDBCondition(actor, condition));
      }
    });
    resolve(results);
  });
}

async function updateDDBDeathSaves(actor) {
  return new Promise((resolve) => {
    const deathSaveData = {
      failCount: actor.system.attributes.death.failure ?? 0,
      successCount: actor.system.attributes.death.success ?? 0,
    };
    resolve(updateCharacterCall(actor, "deathsaves", deathSaveData, "Death Saves"));
  });
}

async function deathSaves(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-deathsaves")) resolve();
    const same = isEqual(ddbCharacter.data.character.system.attributes.death, actor.system.attributes.death);

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

async function hitDice(actor, ddbCharacter) {
  return new Promise((resolve) => {
    if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-hitdice")) resolve();

    const ddbClasses = ddbCharacter.data.classes;

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
    spell.type === "spell"
    && spell.system.preparation?.mode === "prepared"
    && spell.flags.ddbimporter?.dndbeyond?.characterClassId
    && !spell.flags.ddbimporter.dndbeyond.granted
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

async function spellsPrepared(actor, ddbCharacter) {
  if (!game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-prepared")) return [];
  const ddbSpells = ddbCharacter.data.spells;

  const preparedSpells = actor.items.filter((item) => {
    const spellMatch = ddbSpells.find((s) =>
      s.name === item.name
      && item.system.preparation?.mode === "prepared"
      && item.flags.ddbimporter?.dndbeyond?.characterClassId
      && item.flags.ddbimporter?.dndbeyond?.characterClassId === s.flags.ddbimporter?.dndbeyond?.characterClassId
    );
    if (!spellMatch) return false;
    const select = item.type === "spell"
      && item.system.preparation?.mode === "prepared"
      && item.system.preparation.prepared !== spellMatch.system.preparation?.prepared;
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
      if (ddbCompendiumMatch
        && ddbCompendiumMatch.flags?.ddbimporter?.definitionId
        && ddbCompendiumMatch.flags?.ddbimporter?.definitionEntityTypeId
      ) {
        logger.debug(`Adding ${item.name} from DDB compendium match:`, ddbCompendiumMatch);
        foundry.utils.setProperty(item, "flags.ddbimporter.definitionId", ddbCompendiumMatch.flags.ddbimporter.definitionId);
        foundry.utils.setProperty(item, "flags.ddbimporter.definitionEntityTypeId", ddbCompendiumMatch.flags.ddbimporter.definitionEntityTypeId);
        foundry.utils.setProperty(item, "name", ddbCompendiumMatch.name);
        foundry.utils.setProperty(item, "type", ddbCompendiumMatch.type);
      }
    }
    return item;
  }));
}

function getValidContainer(actor, containerEntityId) {
  if (!containerEntityId) return undefined;
  if (parseInt(containerEntityId) === parseInt(actor.flags.ddbimporter.dndbeyond.characterId)) return true;
  const containers = actor.items.filter((i) => foundry.utils.getProperty(i, "flags.ddbimporter.dndbeyond.isContainer") === true);
  return containers.find((c) => parseInt(foundry.utils.getProperty(c, "flags.ddbimporter.id")) === parseInt(containerEntityId));
}

function generateItemsToAdd(actor, itemsToAdd) {
  const results = {
    items: [],
    toAdd: [],
    custom: [],
  };

  const characterId = parseInt(actor.flags.ddbimporter.dndbeyond.characterId);

  for (let i = 0; i < itemsToAdd.length; i++) {
    let item = itemsToAdd[i];
    if (item.flags.ddbimporter?.definitionId && item.flags.ddbimporter?.definitionEntityTypeId) {
      const containerItem = getValidContainer(actor, foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId"));
      const containerEntityId = containerItem
        ? parseInt(foundry.utils.getProperty(containerItem, "flags.ddbimporter.id"))
        : characterId;
      const containerEntityTypeId = containerItem && containerEntityId !== characterId
        ? parseInt(foundry.utils.getProperty(containerItem, "flags.ddbimporter.entityTypeId"))
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
      if (foundry.utils.getProperty(customData, "customValues.id") !== undefined
        && foundry.utils.getProperty(customData, "customValues.mappingId") !== undefined
      ) {
        const result = updateCharacterCall(actor, "custom/item", customData, { name: item.name }).then((data) => {
          foundry.utils.setProperty(item, "flags.ddbimporter.delete", data);
          foundry.utils.setProperty(item, "flags.ddbimporter.custom", true);
          foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isCustomItem", true);
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
    const containerEntityId = foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
      ? parseInt(item.flags.ddbimporter.containerEntityId)
      : parseInt(actor.flags.ddbimporter.dndbeyond.characterId);
    const containerEntityTypeId = foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityTypeId")
      ? parseInt(item.flags.ddbimporter.containerEntityTypeId)
      : parseInt("1581111423");
    const customData = {
      itemState: "NEW",
      customValues: {
        characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
        containerEntityId,
        containerEntityTypeId,
        name: item.name,
        description: getCustomItemDescription(item.system.description.value),
        quantity: parseInt(item.system.quantity),
        cost: null,
        weight: Number.isInteger(item.system.weight) ? parseInt(item.system.weight) : 0,
      }
    };
    const result = updateCharacterCall(actor, "custom/item", customData, { name: item.name }).then((data) => {
      foundry.utils.setProperty(item, "flags.ddbimporter.id", data.data.addItems[0].id);
      foundry.utils.setProperty(item, "flags.ddbimporter.custom", true);
      foundry.utils.setProperty(item, "flags.ddbimporter.ddbCustomAdded", true);
      foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isCustomItem", true);
      foundry.utils.setProperty(item, "flags.ddbimporter.definitionId", data.data.addItems[0].definition.id);
      foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", data.data.addItems[0].definition.containerEntityId);
      foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityTypeId", data.data.addItems[0].definition.containerEntityTypeId);
      return item;
    });
    customItemResults.push(result);
  }

  return Promise.all(customItemResults);
}

async function addDDBEquipment(actor, itemsToAdd) {
  const ddbEnrichedItems = await updateItemsWithDDBInfo(itemsToAdd);
  const generatedItemsToAddData = generateItemsToAdd(actor, ddbEnrichedItems);

  const addDebugData = generatedItemsToAddData.items.map((i) => {
    return {
      name: i.name,
      definitionId: i.flags.ddbimporter.definitionId,
      definitionEntityTypeId: i.flags.ddbimporter.definitionEntityTypeId,
      containerEntityId: i.flags.ddbimporter.containerEntityId,
      containerEntityTypeId: i.flags.ddbimporter.containerEntityTypeId,
      entityTypeId: i.flags.ddbimporter.entityTypeId,
    };
  });

  logger.debug(`Generated items data`, generatedItemsToAddData);
  logger.debug(`Generated items data light`, addDebugData);

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
      const itemUpdates = itemResults.data.addItems
        .filter((addedItem) => ddbEnrichedItems.some((i) =>
          i.flags.ddbimporter
          && i.flags.ddbimporter.definitionId === addedItem.definition.id
          && i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId
        ))
        .map((addedItem) => {
          let updatedItem = ddbEnrichedItems.find((i) =>
            i.flags.ddbimporter
            && i.flags.ddbimporter.definitionId === addedItem.definition.id
            && i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId
          );
          foundry.utils.setProperty(updatedItem, "flags.ddbimporter.id", addedItem.id);
          foundry.utils.setProperty(updatedItem, "flags.ddbimporter.containerEntityId", addedItem.containerEntityId);
          foundry.utils.setProperty(updatedItem, "flags.ddbimporter.containerEntityTypeId", addedItem.containerEntityTypeId);
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
        logger.error("Update Item Information:", addDebugData);
      }

    } catch (err) {
      logger.error(`Unable to filter updated equipment, got the error:`, err);
      logger.error(`itemsToAdd`, itemsToAdd);
      logger.error(`ddbEnrichedItems`, ddbEnrichedItems);
      logger.error(`equipmentToAdd`, generatedItemsToAddData);
      logger.error(`itemResults`, itemResults);
      logger.error(`customItems`, customItems);
      logger.error("Update Item Information:", addDebugData);
    }

    return itemResults;
  } else {
    return [];
  }
}

async function addEquipment(actor, ddbCharacter) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get(SETTINGS.MODULE_ID, "sync-policy-equipment")) return [];
  const ddbItems = ddbCharacter.data.inventory;

  const items = getFoundryItems(actor);
  const itemsToAdd = items.filter((item) =>
    !(item.flags.ddbimporter?.action ?? false)
    && item.system.quantity !== 0
    && DICTIONARY.types.inventory.includes(item.type)
    && !item.flags.ddbimporter?.custom
    && (!item.flags.ddbimporter?.id
    || !ddbItems.some((s) => s.flags.ddbimporter?.id === item.flags.ddbimporter?.id && s.type === item.type))
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
        value: item.name.replaceAll("[Infusion]", "").trim(),
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
async function updateCustomNames(actor, ddbCharacter) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get(SETTINGS.MODULE_ID, "sync-policy-equipment")) return [];
  const ddbItems = ddbCharacter.data.inventory;

  const foundryItems = getFoundryItems(actor);

  const itemsToName = foundryItems.filter((item) =>
    item.system.quantity !== 0
    && (DICTIONARY.types.inventory.includes(item.type) || item.flags.ddbimporter?.action)
    && item.flags.ddbimporter?.id
    && ddbItems.some((ddbItem) =>
      ddbItem.flags.ddbimporter?.id === item.flags.ddbimporter.id
      && ddbItem.type === item.type
      && ddbItem.name.replaceAll("[Infusion]", "").trim() !== item.name.replaceAll("[Infusion]", "").trim()
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

async function removeEquipment(actor, ddbCharacter) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get(SETTINGS.MODULE_ID, "sync-policy-equipment")) return [];
  const ddbItems = ddbCharacter.data.inventory;

  const items = getFoundryItems(actor);
  const itemsToRemove = ddbItems.filter((item) =>
    (!items.some((s) => (item.flags.ddbimporter?.id === s.flags.ddbimporter?.id && s.type === item.type) && !s.flags.ddbimporter?.action)
    || items.some((s) => (item.flags.ddbimporter?.id === s.flags.ddbimporter?.id && s.type === item.type) && !s.flags.ddbimporter?.action && s.system.quantity == 0))
    && DICTIONARY.types.inventory.includes(item.type)
    && item.flags.ddbimporter?.id
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
  const currencyItems = updateItemDetails.itemsToCurrency || [];

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
  itemsToCharge.forEach((rawItem) => {
    const item = getItemRollData(actor, rawItem._id).item;
    const itemData = {
      itemId: item.flags.ddbimporter.id,
      charges: Math.max(0, parseInt(item.system.uses.max) - parseInt(item.system.uses.value)),
    };
    if (Number.isInteger(itemData.charges)) {
      promises.push(updateCharacterCall(actor, "equipment/charges", itemData, { name: item.name }));
    }
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
        value: item.name.replaceAll("[Infusion]", "").trim(),
        valueId: `${item.flags.ddbimporter.id}`,
        valueTypeId: `${entityTypeId}`,
      }
    };
    const flavor = { detail: "Updating Name", name: item.name, originalName: item.flags?.ddbimporter?.originalName };
    promises.push(updateCharacterCall(actor, "equipment/custom", customData, flavor));
  });

  for (const item of currencyItems) {
    // eslint-disable-next-line no-continue
    if (!foundry.utils.hasProperty(item, "system.currency.gp")) continue;
    const ddbItem = ddbItems.find((dItem) =>
      item.flags.ddbimporter.id === dItem.id
    );
    // eslint-disable-next-line no-continue
    if (ddbItem && !foundry.utils.hasProperty(ddbItem, "currency.gp")) continue;
    ["pp", "gp", "ep", "sp", "cp"].forEach((t) => {
      if (item.system.currency[t] !== ddbItem.currency[t]) {
        const currency = {
          amount: item.system.currency[t],
          characterId: parseInt(actor.flags.ddbimporter.dndbeyond.characterId),
          destinationEntityId: item.flags.ddbimporter.id,
          destinationEntityTypeId: item.flags.ddbimporter.entityTypeId,
        };
        const type = DICTIONARY.currency[t];
        promises.push(updateCharacterCall(actor, `currency/individual`, { type, currency }, `Currency - ${t}`));
      }
    });
  }

  customItems
    .filter((item) => {
      const isValid = foundry.utils.getProperty(item, "flags.ddbimporter.id") !== undefined
       && foundry.utils.getProperty(item, "flags.ddbimporter.definitionId") !== undefined;
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
          description: getCustomItemDescription(item.system.description.value),
          // revist these need to be ints
          // weight: `${item.data.weight}`,
          // cost: item.data.price.value,
          cost: null,
          weight: Number.isInteger(item.system.weight) ? parseInt(item.system.weight) : 0,
          quantity: parseInt(item.system.quantity),
        }
      };
      promises.push(updateCharacterCall(actor, "custom/item", customData, "Updating Custom Item"));
    });

  return Promise.all(promises);
}


async function equipmentStatus(actor, ddbCharacter, addEquipmentResults) {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !game.settings.get(SETTINGS.MODULE_ID, "sync-policy-equipment")) return [];
  // reload the actor following potential updates to equipment
  let ddbItems = ddbCharacter.source.ddb.character.inventory;
  let customDDBItems = ddbCharacter.source.ddb.character.customItems;
  if (addEquipmentResults?.system) {
    actor = game.actors.get(actor.id);
    ddbItems = ddbItems.concat(addEquipmentResults.system.addItems);
  }

  const foundryItems = getFoundryItems(actor);

  const itemsToEquip = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "system.equipped")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && item.system.equipped !== dItem.equipped
    )
  );
  const itemsToAttune = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "system.attunement")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && ((item.system.attunement === 2) !== dItem.isAttuned)
    )
  );
  const itemsToCharge = foundryItems.filter((rawItem) => {
    const item = getItemRollData(actor, rawItem._id).item;
    return foundry.utils.hasProperty(item, "system.uses")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && Number.isInteger(parseInt(item.system.uses?.max)) && Number.isInteger(parseInt(dItem.limitedUse?.numberUsed))
      && ((parseInt(item.system.uses.max) - parseInt(item.system.uses.value)) !== dItem.limitedUse.numberUsed)
    );
  });
  const itemsToQuantity = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "system.quantity")
    && item.system.quantity !== 0
    && !foundry.utils.getProperty(item, "system.armor.type")
    && ((item.type !== "weapon" && item.type !== "armor") || foundry.utils.getProperty(item, "flags.ddbimporter.dndbeyond.stackable"))
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && item.system.quantity !== dItem.quantity
    )
  );
  // this is for items that have been added and might have a different name
  const itemsToName = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && item.system?.quantity !== 0
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      item.flags.ddbimporter.originalName === dItem.definition.name
      && item.flags.ddbimporter.originalName !== item.name.replaceAll("[Infusion]", "").trim()
      && foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && item.name.replaceAll("[Infusion]", "").trim() !== dItem.definition.name
    )
  );

  // update.name || update.data?.description || update.data?.weight || update.data?.price || update.data?.quantity
  const customItems = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && item.system?.quantity !== 0
    && (foundry.utils.getProperty(item, "flags.ddbimporter.custom") === true || foundry.utils.getProperty(item, "flags.ddbimporter.isCustom") === true)
    && customDDBItems.some((dItem) => dItem.id === item.flags.ddbimporter.id
      && (
        item.name !== dItem.name
        || getCustomItemDescription(item.system.description.value) != dItem.description
        || (foundry.utils.hasProperty(item, "system.quantity") && item.system.quantity != dItem.quantity)
        || (foundry.utils.hasProperty(item, "system.weight") && item.system.weight != dItem.weight)
        //  ||
        // item.data.price != dItem.cost
      )
    )
  );

  const itemsToMove = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
    && ddbItems.some((dItem) =>
      item.flags.ddbimporter.id === dItem.id
      && parseInt(item.flags.ddbimporter.containerEntityId) !== parseInt(dItem.containerEntityId)
    ));

  const itemsToCurrency = game.settings.get(SETTINGS.MODULE_ID, "sync-policy-currency")
    ? foundryItems.filter((item) =>
      foundry.utils.hasProperty(item, "flags.ddbimporter.id")
      && foundry.utils.hasProperty(item, "flags.ddbimporter.entityTypeId")
      && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
      && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
      && foundry.utils.hasProperty(item, "system.currency.gp")
      && ddbItems.some((dItem) =>
        item.flags.ddbimporter.id === dItem.id
        && !isEqual(dItem.currency, item.system.currency)
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
    itemsToCurrency,
  };

  logger.debug("Calling DDB Item Update with", {
    actor,
    itemsToUpdate,
    ddbItems
  });

  return updateDDBEquipmentStatus(actor, itemsToUpdate, ddbItems);

}

async function updateActionUseStatus(actor, actionData, actionName) {
  return new Promise((resolve) => {
    resolve(updateCharacterCall(actor, "action/use", actionData, `Action Use for ${actionName}`));
  });
}

async function updateDDBActionUseStatus(actor, actions) {
  let promises = [];
  actions.forEach((rawAction) => {
    const action = getItemRollData(actor, rawAction._id).item;
    const actionData = {
      actionId: action.flags.ddbimporter.id,
      entityTypeId: action.flags.ddbimporter.entityTypeId,
      uses: Math.max(0, parseInt(action.system.uses.max) - parseInt(action.system.uses.value)),
    };
    promises.push(updateActionUseStatus(actor, actionData, action.name));
  });
  return Promise.all(promises);
}

async function actionUseStatus(actor, ddbCharacter) {
  const syncActionReady = actor.flags.ddbimporter?.syncActionReady;
  if (syncActionReady && !game.settings.get(SETTINGS.MODULE_ID, "sync-policy-action-use")) return [];

  let ddbActions = ddbCharacter.data.actions;

  const foundryItems = getFoundryItems(actor);

  const actionsToChange = foundryItems.filter((item) =>
    (item.flags.ddbimporter?.action || item.type === "feat")
    && item.flags.ddbimporter?.id && item.flags.ddbimporter?.entityTypeId
    && ddbActions.some((dItem) =>
      item.flags.ddbimporter.id === dItem.flags.ddbimporter.id
      && item.flags.ddbimporter.entityTypeId === dItem.flags.ddbimporter.entityTypeId
      && item.name === dItem.name && item.type === dItem.type
      && Number.isInteger(parseInt(item.system.uses?.value))
      && Number.parseInt(item.system.uses.value) !== Number.parseInt(dItem.system.uses.value)
    )
  );
  const actionChanges = updateDDBActionUseStatus(actor, actionsToChange);

  return actionChanges;
}

export async function updateDDBCharacter(actor) {
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

  const ddbCharacterOptions = {
    currentActor: actor,
    characterId,
    selectResources: false
  };
  const getOptions = {
    syncId,
    localCobaltPostFix: actor.id,
  };
  const ddbCharacter = new DDBCharacter(ddbCharacterOptions);
  const activeUpdateState = ddbCharacter.getCurrentDynamicUpdateState();
  await ddbCharacter.disableDynamicUpdates();
  await ddbCharacter.getCharacterData(getOptions);

  if (!ddbCharacter.source.ddb.character.canEdit) {
    logger.debug("Update DDB", { ddbCharacter, source: ddbCharacter.source });
    throw new Error("User is not allowed to edit character on D&D Beyond.");
  }

  logger.debug("Current actor:", foundry.utils.duplicate(actor));
  logger.debug("DDB Parsed data:", { data: ddbCharacter.data, source: ddbCharacter.source });

  let singlePromises = []
    .concat(
      currency(actor, ddbCharacter),
      hitDice(actor, ddbCharacter),
      spellSlots(actor, ddbCharacter),
      spellSlotsPact(actor, ddbCharacter),
      inspiration(actor, ddbCharacter),
      exhaustion(actor, ddbCharacter),
      deathSaves(actor, ddbCharacter),
      xp(actor, ddbCharacter),
    ).flat();

  const singleResults = await Promise.all(singlePromises);
  const hpResults = await hitPoints(actor, ddbCharacter);
  const spellsPreparedResults = await spellsPrepared(actor, ddbCharacter);
  const actionStatusResults = await actionUseStatus(actor, ddbCharacter);
  const nameUpdateResults = await updateCustomNames(actor, ddbCharacter);
  const addEquipmentResults = await addEquipment(actor, ddbCharacter);
  const removeEquipmentResults = await removeEquipment(actor, ddbCharacter);
  const equipmentStatusResults = await equipmentStatus(actor, ddbCharacter, addEquipmentResults);
  const conditionResults = await conditions(actor, ddbCharacter);
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
  await ddbCharacter.setActiveSyncSpellsFlag(true);

  // we can now process item attunements and uses (not yet done)

  const results = singleResults.concat(
    hpResults,
    nameUpdateResults,
    addEquipmentResults,
    spellsPreparedResults,
    removeEquipmentResults,
    equipmentStatusResults,
    actionStatusResults,
    conditionResults,
  ).filter((result) => result !== undefined);

  logger.debug("Update results", results);
  await ddbCharacter.updateDynamicUpdates(activeUpdateState);

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
      const syncHP = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-hitpoints");
      const syncCurrency = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-currency");
      const syncSpellSlots = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-spells-slots");
      const syncInspiration = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-inspiration");
      const syncConditions = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-condition");
      const syncDeathSaves = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-deathsaves");
      const syncXP = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-xp");


      if (syncHP && (update.system?.attributes?.hp?.value
        || update.system?.attributes?.hp?.temp)
      ) {
        logger.debug("Updating DDB Hitpoints...");
        promises.push(updateDDBHitPoints(actor));
      }
      if (syncHP && update.system?.attributes?.hp?.tempmax) {
        logger.debug("Updating DDB Bonus Hitpoints...");
        promises.push(updateTempMaxDDBHitPoints(actor));
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
      if (syncInspiration
        && (update.system?.attributes?.inspiration === true || update.system?.attributes?.inspiration === false)
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

// eslint-disable-next-line complexity
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

  if (foundry.utils.getProperty(document, "flags.ddbimporter.custom") === true || foundry.utils.getProperty(document, "flags.ddbimporter.isCustom") === true) {
    if (update.name || update.system?.description || update.system?.weight || update.system?.price || update.system?.quantity) {
      updateItemDetails.customItems.push(foundry.utils.duplicate(document));
    }
  } else {
    if (update.system?.uses) {
      updateItemDetails.itemsToCharge.push(foundry.utils.duplicate(document));
    }
    if (update.system?.attunement) {
      updateItemDetails.itemsToAttune.push(foundry.utils.duplicate(document));
    }
    if (update.system?.quantity) {
      // if its a weapon or armor we actually need to push a new one
      if (!document.flags.ddbimporter?.dndbeyond?.stackable && update.system.quantity > 1) {
        // Some items are not stackable on DDB

        await document.update({ system: { quantity: 1 } });
        let newDocument = foundry.utils.duplicate(document.toObject());
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
        updateItemDetails.itemsToQuantity.push(foundry.utils.duplicate(document));
      }
    }
    if (update.system?.equipped) {
      updateItemDetails.itemsToEquip.push(foundry.utils.duplicate(document));
    }
    if (update.name) {
      updateItemDetails.itemsToName.push(foundry.utils.duplicate(document));
    }
    if (update.system?.container) {
      const containerisedDocument = foundry.utils.duplicate(document);
      setContainerDetails(actor, containerisedDocument);
      updateItemDetails.itemsToMove.push(containerisedDocument);
    }
    if (update.system?.currency) {
      updateItemDetails.itemsToCurrency.push(foundry.utils.duplicate(document));
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
    const ignore = foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemUpdate") ?? false;

    if (!parentActor || !actorActiveUpdate || ignore) {
      resolve([]);
    } else {
      logger.debug("Preparing to sync item change to DDB...");
      const action = document.flags.ddbimporter?.action || document.type === "feat";
      const syncEquipment = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-equipment");
      const syncActionUse = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-action-use");
      const syncHD = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-hitdice");
      const syncSpellsPrepared = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-spells-prepared");
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
          updateDDBActionUseStatus(parentActor, [foundry.utils.duplicate(document)]);
        } else {
          resolve([]);
        }
      } else if (document.type === "class" && syncHD && update.system?.hitDiceUsed) {
        logger.debug("Updating hitdice on DDB");
        resolve(updateDDBHitDice(parentActor, document, update));
      } else if (document.type === "spell" && syncSpellsPrepared
        && update.system?.preparation && document.system.preparation.mode === "prepared"
      ) {
        logger.debug("Updating DDB SpellsPrepared...");
        updateSpellPrep(parentActor, document).then((results) => {
          logger.debug("Spell prep results", results);
          const failures = results.find((result) => result.success !== true);
          const ddbCharacterOptions = {
            currentActor: parentActor,
            characterId: undefined,
            selectResources: false
          };
          // when update is refactored to a class, change this
          const ddbCharacter = new DDBCharacter(ddbCharacterOptions);
          if (failures) ddbCharacter.setActiveSyncSpellsFlag(false);
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

    const syncEquipment = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-equipment");
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && foundry.utils.getProperty(parentActor, "flags.ddbimporter.activeUpdate");
    const ignore = foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemUpdate") ?? false;

    if (parentActor && actorActiveUpdate && syncEquipment && !ignore) {
      logger.debug(`Checking to see if ${state.toLowerCase()} can be added to DDB...`);
      const action = document.flags.ddbimporter?.action || ["feat", "class", "subclass", "spell", "background", "race"].includes(document.type);
      if (!action) {
        logger.debug(`Attempting to ${state.toLowerCase()} new Item`, document);

        switch (state) {
          case "CREATE": {
            // const characterId = parseInt(parentActor.flags.ddbimporter.dndbeyond.characterId);
            // const containerId = document.flags?.ddbimporter?.containerEntityId;
            // if (Number.isInteger(containerId) && characterId != parseInt(containerId)) {
            //   // update item container
            //   logger.debug(`Moving item from container`, document);
            //   document.update({
            //     "flags.ddbimporter.containerEntityId": characterId,
            //   });
            //   const itemData = {
            //     itemId: parseInt(document.flags.ddbimporter.id),
            //     containerEntityId: characterId,
            //     containerEntityTypeId: 1581111423,
            //   };
            //   const flavor = { summary: "Moving item to character", name: document.name, containerId: foundry.utils.duplicate(containerId) };
            //   promises.push(updateCharacterCall(parentActor, "equipment/move", itemData, flavor));
            // } else {
            logger.debug(`Creating item`, document);
            promises.push(addDDBEquipment(parentActor, [document.toObject()]));
            // }
            break;
          }
          case "DELETE": {
            // const collectionItems = getItemCollectionItems(parentActor);
            // const collectionItemDDBIds = collectionItems
            //   .filter((item) => foundry.utils.hasProperty(item, "flags.ddbimporter.id"))
            //   .map((item) => item.flags.ddbimporter.id);
            // if (foundry.utils.hasProperty(document, "flags.ddbimporter.id")
            //   && collectionItemDDBIds.includes(document.flags.ddbimporter.id)
            // ) {
            //   // we don't have to handle deletes as the item collection move is handled above
            //   logger.debug(`Moving item to container`, document);
            // } else {
            logger.debug(`Deleting item`, document);
            promises.push(removeDDBEquipment(parentActor, [document.toObject()]));
            // }
            // break;
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

    const syncConditions = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-condition");
    // we check to see if this is actually an embedded item
    const parentActor = document.parent;
    const actorActiveUpdate = parentActor && parentActor.flags.ddbimporter?.activeUpdate;

    if (parentActor && actorActiveUpdate && syncConditions) {
      logger.debug(`Preparing to ${state.toLowerCase()} condition on DDB...`);
      // is it a condition?
      // is it a suitable type?
      const isConvenient = document.system?.flags?.isConvenient;
      const condition = getCondition(document.system?.name ?? document.system?.label);
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
  if (SETTINGS.STATUS.activeUpdate()) {
    Hooks.on("updateActor", activeUpdateActor);
    Hooks.on("updateItem", activeUpdateUpdateItem);
    Hooks.on("createItem", (document) => activeUpdateAddOrDeleteItem(document, "CREATE"));
    Hooks.on("deleteItem", (document) => activeUpdateAddOrDeleteItem(document, "DELETE"));
    // conditions syncing relies of Conv Effects
    const dfConditionsOn = game.modules.get("dfreds-convenient-effects")?.active;
    const useCEConditions = dfConditionsOn ? game.settings.get(SETTINGS.MODULE_ID, "apply-conditions-with-ce") : false;
    const dfCEAdded = dfConditionsOn
      ? game.settings.get("dfreds-convenient-effects", "modifyStatusEffects")
      : "none";

    if ((dfConditionsOn && useCEConditions && dfCEAdded !== "none") || (dfConditionsOn && dfCEAdded === "replace")) {
      Hooks.on("createActiveEffect", (document) => activeUpdateEffectTrigger(document, "CREATE"));
      Hooks.on("updateActiveEffect", (document) => activeUpdateEffectTrigger(document, "UPDATE"));
      Hooks.on("deleteActiveEffect", (document) => activeUpdateEffectTrigger(document, "DELETE"));
    }
  }
}
