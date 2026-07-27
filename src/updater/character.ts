import { logger, utils, CompendiumHelper, DDBCampaigns, Secrets, DDBProxy, PatreonHelper, NameMatcher, postJson, DDBRunContext } from "../lib/_module";
import { DICTIONARY, SETTINGS } from "../config/_module";
import { isEqual } from "../../vendor/lowdash/_module.mjs";
import { getActorConditionStates, getCondition } from "../parser/character/conditions";
import DDBCharacter, { type DDBCharacterImportOptions } from "../parser/DDBCharacter";
import DDBPartyInventory from "../muncher/DDBPartyInventory";
import { IDDBConditionMapping } from "../config/dictionary/actor/conditions";

const CHARACTER_CONTAINER_ENTITY_TYPE_ID = 1581111423;
const PARTY_CONTAINER_ENTITY_TYPE_ID = DDBPartyInventory.PARTY_CONTAINER_ENTITY_TYPE_ID;
const PARTY_CAMPAIGN_FLAG = "partyCampaignId";
const RECENT_EVENT_TTL_MS = 250;

interface IRecentCharacterDelete {
  actor: any;
  ts: number;
  document: any;
};

interface IRecentPartyDelete {
  actor: any;
  campaignId: string;
  ts: number;
};

/**
 * Shape of a single DDB sync call result. The proxy responses carry a
 * success/message pair plus endpoint specific payload fields.
 */
export interface ISyncResult {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

const recentCharacterDeletes = new Map<number, IRecentCharacterDelete>();
const recentPartyDeletes = new Map<number, IRecentPartyDelete>();

function getCharacterId(actor: TSyncCharacterActor): string {
  const characterId = actor.flags.ddbimporter?.dndbeyond?.characterId;
  if (!characterId) {
    throw new Error(`Actor ${actor.name} is missing a D&D Beyond character id, please re-import the character`);
  }
  return characterId;
}

function pruneRecentEvents(map: Map<number, { ts: number }>) {
  const cutoff = Date.now() - RECENT_EVENT_TTL_MS;
  for (const [k, v] of map.entries()) {
    if (v.ts < cutoff) map.delete(k);
  }
}

function findPartyActorContainingDDBItem(ddbItemId: number) {
  if (!ddbItemId) return null;
  for (const actor of (game as any).actors) {
    if (actor.type !== "group") continue;
    if (!foundry.utils.getProperty(actor, `flags.ddbimporter.${PARTY_CAMPAIGN_FLAG}`)) continue;
    const match = actor.items.find((i: any) => foundry.utils.getProperty(i, "flags.ddbimporter.id") === ddbItemId);
    if (match) return actor;
  }
  return null;
}

function findCharacterOwningDDBItem(ddbItemId: number) {
  if (!ddbItemId) return null;
  for (const actor of (game as any).actors) {
    if (actor.type !== "character") continue;
    const match = actor.items.find((i: any) => foundry.utils.getProperty(i, "flags.ddbimporter.id") === ddbItemId);
    if (match) return { actor, item: match };
  }
  return null;
}

function getContainerItems(actor: TSyncCharacterActor): TImporterItem[] {
  const characterId = parseInt(getCharacterId(actor));
  return actor.items
    .filter((item: TImporterItem) =>
      foundry.utils.hasProperty(item, "flags.ddbimporter.id")
      && foundry.utils.getProperty(item, "flags.ddbimporter.containerEntityId") === characterId
      && !foundry.utils.getProperty(item, "flags.ddbimporter.ignoreItemImport")
      && !foundry.utils.getProperty(item, "system.container"),
    );
}

function setDefaultActorContainerFlags(actor: TSyncCharacterActor, item: I5eItemData) {
  const characterId = getCharacterId(actor);
  foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", parseInt(characterId));
  foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityTypeId", CHARACTER_CONTAINER_ENTITY_TYPE_ID);
}

function setContainerDetails(
  actor: TSyncCharacterActor,
  item: I5eItemData,
  containerItems: TImporterItem[] | null = null,
): I5eItemData {
  if (!("container" in item.system)) {
    setDefaultActorContainerFlags(actor, item);
    return item;
  }

  const ddbContainers = containerItems ?? getContainerItems(actor);

  const containerId = item.system.container;
  const containerItem = containerId
    ? ddbContainers.find((container) => container._id === containerId)
    : null;

  if (containerItem) {
    const containerId = foundry.utils.getProperty(containerItem, "flags.ddbimporter.id");
    const containerEntityTypeId = foundry.utils.getProperty(containerItem, "flags.ddbimporter.entityTypeId");
    foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", containerId);
    foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityTypeId", containerEntityTypeId);
    return item;
  }

  const existingTypeId = parseInt(foundry.utils.getProperty(item, "flags.ddbimporter.containerEntityTypeId") as string);
  if (existingTypeId === PARTY_CONTAINER_ENTITY_TYPE_ID) {
    return item;
  }

  setDefaultActorContainerFlags(actor, item);
  return item;
}

function getFoundryItems(actor: TSyncCharacterActor): I5eItemData[] {
  const ddbContainers = getContainerItems(actor);

  const actorItems: I5eItemData[] = [];
  for (const rawItem of (foundry.utils.duplicate(actor.items) as unknown as I5eItemData[])) {
    if (rawItem.flags.ddbimporter?.ignoreItemUpdate ?? false) continue;
    // don't return update ignored items
    const ownedItem = rawItem._id ? actor.items.get(rawItem._id) : undefined;
    if (!ownedItem) continue;
    const item = ownedItem.toObject() as unknown as I5eItemData;
    actorItems.push(setContainerDetails(actor, item, ddbContainers));
  }
  return actorItems;
}

function getCustomItemDescription(text: string) {
  return utils.stripHtml(text).substring(0, 2055);
}

interface IUpdateItemIndex extends Collection<CompendiumCollection.IndexEntry<"Item">> {
  name?: string;
  type?: string;
  flags?: {
    ddbimporter?: {
      definitionId?: number;
      definitionEntityTypeId?: number;
    };
  };
}

async function getUpdateItemIndex(): Promise<IUpdateItemIndex> {
  if (foundry.utils.hasProperty(CONFIG, "DDBI.update.itemIndex")) {
    return foundry.utils.getProperty(CONFIG, "DDBI.update.itemIndex") as IUpdateItemIndex;
  }
  const compendium = await CompendiumHelper.getCompendiumType("item", false);
  if (!compendium) {
    // previously this fell over with a TypeError further down
    throw new Error("Unable to load the DDB item compendium to build the update item index");
  }

  const indexFields = [
    "name",
    "type",
    "flags.ddbimporter.definitionId",
    "flags.ddbimporter.definitionEntityTypeId",
  ];
  const itemIndex = await compendium.getIndex({ fields: indexFields }) as IUpdateItemIndex;
  foundry.utils.setProperty(CONFIG, "DDBI.update.itemIndex", itemIndex);

  return itemIndex;
}

async function getCompendiumItemInfo(item: TImporterItem | I5eItemData) {
  const index = await getUpdateItemIndex();
  const match = NameMatcher.looseItemNameMatch(item, index.contents, true, false, true);
  return match;
}

// flavor is just useful for debugging
async function updateCharacterCall(
  actor: TSyncCharacterActor,
  path: string,
  bodyContent: Record<string, any>,
  flavor?: string | Record<string, unknown>,
) {
  const characterId = getCharacterId(actor);
  const cobaltCookie = Secrets.getCobalt(actor.id ?? "");
  const dynamicSync = SETTINGS.STATUS.activeUpdate();
  const parsingApi = dynamicSync
    ? DDBProxy.getDynamicProxy()
    : DDBProxy.getProxy();
  const useCharacterKey = foundry.utils.getProperty(actor, "flags.ddbimporter.useLocalPatreonKey") as boolean ?? false;
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
  const body = { ...coreBody, ...(bodyContent as Record<string, any>) };

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

  try {
    const data = await postJson(url, body);
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
    }
    logger.debug(`${path} updated, response`, data);
    return data;
  } catch (error) {
    const errorData = {
      error,
      bodyContent,
      characterId,
      dynamicSync,
    };
    logger.error(`Setting ${path} failed`, errorData);
    if (error instanceof Error) logger.error(error.stack);
    throw error;
  }
}

async function updateDDBSpellSlotsPact(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const pact = actor.system.spells?.pact;
    if (!pact) {
      logger.warn(`Unable to sync pact spell slots for ${actor.name}, no pact spell data found`);
      resolve({});
      return;
    }
    const spellSlotPackData = {
      spellslots: {} as Record<string, number>,
      pact: true,
    };
    const num = foundry.utils.getProperty(actor, "system.spells.pact.level") as number;
    spellSlotPackData.spellslots[`level${num}`] = pact.value;
    const spellPactSlots = updateCharacterCall(actor, "spell/slots", spellSlotPackData, "Pact Spell Slots");
    resolve(spellPactSlots);
  });
}

async function spellSlotsPact(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult | undefined> {
  return new Promise<ISyncResult | undefined>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-spells-slots")) resolve(undefined);
    const pact = actor.system.spells?.pact;
    const ddbPact = ddbCharacter.data.character.system.spells?.pact;
    if (
      pact
      && Number(pact.max) > 0
      && ddbPact?.value !== pact.value
    ) {
      resolve(updateDDBSpellSlotsPact(actor));
    } else {
      resolve({});
    }
  });
}

async function updateDynamicDDBSpellSlots(actor: TSyncCharacterActor, update: Record<string, any>): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const spellSlotData = { spellslots: {} as Record<string, number>, update: false };
    for (let i = 1; i <= 9; i++) {
      const spellData = actor.system.spells?.[`spell${i}` as keyof I5eSpellSlots];
      if (!spellData) continue;
      if (Number(spellData.max) > 0 && update.system.spells[`spell${i}`]) {
        const used = Number(spellData.max) - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(actor, "spells/slots", spellSlotData, "Spell slots"));
    } else {
      resolve({});
    }
  });
}

async function spellSlots(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult | undefined> {
  return new Promise<ISyncResult | undefined>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-spells-slots")) resolve(undefined);

    const spellSlotData = { spellslots: {} as Record<string, number>, update: false };
    for (let i = 1; i <= 9; i++) {
      const spellKey = `spell${i}` as keyof I5eSpellSlots;
      const spellData = actor.system.spells?.[spellKey];
      const ddbSpellData = ddbCharacter.data.character.system.spells?.[spellKey];
      if (!spellData || !ddbSpellData) continue;
      if (Number(spellData.max) > 0
      && ddbSpellData.value !== spellData.value
      ) {
        const used = Number(spellData.max) - spellData.value;
        spellSlotData.spellslots[`level${i}`] = used;
        spellSlotData["update"] = true;
      }
    }
    if (spellSlotData["update"]) {
      resolve(updateCharacterCall(actor, "spells/slots", spellSlotData, "Spell slots"));
    } else {
      resolve({});
    }
  });
}

function getCurrencyValue(actor: TSyncCharacterActor) {
  const coins = actor.system.currency ?? {};
  return {
    pp: Number.isInteger(coins.pp) ? coins.pp : 0,
    gp: Number.isInteger(coins.gp) ? coins.gp : 0,
    ep: Number.isInteger(coins.ep) ? coins.ep : 0,
    sp: Number.isInteger(coins.sp) ? coins.sp : 0,
    cp: Number.isInteger(coins.cp) ? coins.cp : 0,
  };
}

async function updateDDBCurrency(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const value = getCurrencyValue(actor);

    resolve(updateCharacterCall(actor, "currency", value, "Currency"));

  });
}

async function currency(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-currency")) resolve({});

    const value = getCurrencyValue(actor);

    const same = isEqual(ddbCharacter._currency, value);

    if (!same) {
      resolve(updateCharacterCall(actor, "currency", value, "Currency"));
    } else {
      resolve({});
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

async function updateDDBXP(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    resolve(updateCharacterCall(actor, "xp", { currentXp: actor.system.details?.xp?.value ?? 0 }, "XP"));
  });
}

async function xp(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult | undefined> {
  return new Promise<ISyncResult | undefined>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-xp")) resolve(undefined);
    const same = ddbCharacter.data.character.system.details?.xp?.value === actor.system.details?.xp?.value;

    if (!same) {
      resolve(updateDDBXP(actor));
    } else {
      resolve({});
    }
  });
}

async function updateDDBHitPoints(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const hp = actor.system.attributes?.hp;
    if (!hp) {
      logger.warn(`Unable to sync hit points for ${actor.name}, no hp data found`);
      resolve({});
      return;
    }
    const temporaryHitPoints = hp.temp ?? 0;
    const bonusHitPoints = hp.tempmax ?? 0;
    const removedHitPoints = ((hp.max ?? 0) + bonusHitPoints) - (hp.value ?? 0);
    const hitPointData = {
      removedHitPoints,
      temporaryHitPoints,
    };
    resolve(updateCharacterCall(actor, "hitpoints", hitPointData, "HP"));
  });
}

async function updateTempMaxDDBHitPoints(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {

    const bonusHitPoints = {
      bonusHitPoints: actor.system.attributes?.hp?.tempmax ?? 0,
    };
    resolve(updateCharacterCall(actor, "hpbonus", bonusHitPoints, "HPBonus"));
  });
}


async function hitPoints(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult[]> {
  if (!utils.getSetting<boolean>("sync-policy-hitpoints")) return [];
  const hp = actor.system.attributes?.hp;
  const ddbHp = ddbCharacter.data.character.system.attributes?.hp;
  if (!hp || !ddbHp) {
    logger.warn(`Unable to sync hit points for ${actor.name}, missing hp data`);
    return [];
  }
  const promises: Promise<ISyncResult>[] = [];
  const hpValue = hp.value ?? 0;
  const tempHP = hp.temp ?? 0;
  const same = ddbHp.value === hpValue
    && (ddbHp.temp ?? 0) === tempHP;

  if (!same) {
    promises.push(updateDDBHitPoints(actor));
  }

  const tempMax = hp.tempmax ?? 0;
  const hpSame = ddbHp.tempmax === tempMax;

  if (!hpSame) {
    promises.push(updateTempMaxDDBHitPoints(actor));
  }

  return Promise.all(promises);
}

async function updateDDBInspiration(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const inspiration = updateCharacterCall(actor, "inspiration", {
      inspiration: actor.system.attributes?.inspiration,
    }, "Inspiration");
    resolve(inspiration);
  });
}

async function inspiration(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult | undefined> {
  return new Promise<ISyncResult | undefined>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-inspiration")) resolve(undefined);
    const same = ddbCharacter.data.character.system.attributes?.inspiration === actor.system.attributes?.inspiration;

    if (!same) {
      resolve(updateDDBInspiration(actor));
    } else {
      resolve({});
    }
  });
}

async function updateDDBExhaustion(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const exhaustionData: { conditionId: number; addCondition: boolean; level?: number; totalHP?: number | null } = {
      conditionId: 4,
      addCondition: false,
    };
    const exhaustionLevel = actor.system.attributes?.exhaustion ?? 0;
    if (exhaustionLevel !== 0) {
      exhaustionData.level = exhaustionLevel;
      exhaustionData.totalHP = actor.system.attributes?.hp?.max ?? null;
      exhaustionData.addCondition = true;
    }
    resolve(updateCharacterCall(actor, "condition", exhaustionData, "Exhaustion"));
  });
}


async function exhaustion(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-condition")) resolve({});
    const same = ddbCharacter.data.character.system.attributes?.exhaustion === actor.system.attributes?.exhaustion;

    if (!same) {
      resolve(updateDDBExhaustion(actor));
    } else {
      resolve({});
    }

  });
}

async function updateDDBCondition(actor: TSyncCharacterActor, condition: IDDBConditionState | IDDBConditionMapping): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const conditionData = {
      conditionId: condition.ddbId,
      addCondition: condition.applied,
      level: null as number | null,
      totalHP: actor.system.attributes?.hp?.max ?? null,
    };

    resolve(updateCharacterCall(actor, "condition", conditionData, { condition }));
  });
}

async function conditions(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult[]> {
  return new Promise<ISyncResult[]>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-condition")) resolve([]);
    if (!ddbCharacter.source) {
      // previously this fell over with a TypeError; the source is always set after getCharacterData
      throw new Error("No D&D Beyond character data available for condition sync");
    }
    const conditions = getActorConditionStates(actor, ddbCharacter.source.ddb);
    const results: Promise<ISyncResult>[] = [];
    conditions.forEach((condition) => {
      // exhaustion handled separately
      if (condition.needsUpdate && condition.ddbId !== 4) {
        results.push(updateDDBCondition(actor, condition));
      }
    });
    // aggregate the call results so failures surface in the sync payload
    resolve(Promise.all(results));
  });
}

async function updateDDBDeathSaves(actor: TSyncCharacterActor): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    const deathSaveData = {
      failCount: actor.system.attributes?.death?.failure ?? 0,
      successCount: actor.system.attributes?.death?.success ?? 0,
    };
    resolve(updateCharacterCall(actor, "deathsaves", deathSaveData, "Death Saves"));
  });
}

async function deathSaves(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult> {
  const death = actor.system.attributes?.death;
  return new Promise<ISyncResult>((resolve) => {
    if (utils.getSetting<boolean>("sync-policy-deathsaves")) {
      const same = isEqual(ddbCharacter.data.character.system.attributes?.death, death);
      if (!same) {
        resolve(updateDDBDeathSaves(actor));
      } else {
        resolve({});
      }
    } else {
      resolve({});
    }
  });
}

async function updateDDBHitDice(actor: TSyncCharacterActor, klass: TImporterItem, update: Record<string, any>): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    if (klass.flags?.ddbimporter?.id) {
      const hitDiceData = {
        classHitDiceUsed: {} as Record<string, number>,
        resetMaxHpModifier: false,
      };
      hitDiceData.classHitDiceUsed[klass.flags.ddbimporter.id] = update.system.hd.spent;
      resolve(updateCharacterCall(actor, "hitdice", { shortRest: hitDiceData }, "Hit Dice"));
    } else {
      resolve({});
    }
  });
}

async function hitDice(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult | undefined> {
  return new Promise<ISyncResult | undefined>((resolve) => {
    if (!utils.getSetting<boolean>("sync-policy-hitdice")) resolve(undefined);

    const ddbClasses = ddbCharacter.data.classes;

    const klasses = actor.items.filter((item) => item.type === "class"
        && !!foundry.utils.getProperty(item, "flags.ddbimporter.id")
        && !!foundry.utils.getProperty(item, "flags.ddbimporter.definitionId"),
    );

    const hitDiceData = {
      classHitDiceUsed: {} as Record<string, number>,
      resetMaxHpModifier: false,
    };

    klasses.forEach((klass) => {
      const klassId = klass.flags.ddbimporter?.id;
      if (!klassId) return;
      const classMatch = ddbClasses.find((ddbClass) => ddbClass.flags.ddbimporter?.id === klassId) as I5eClassItem | undefined;
      // hitDiceUsed no longer exists on either side; the parser stamps hd.spent
      if (classMatch && classMatch.system.hd?.spent !== klass.system.hd.spent) {
        hitDiceData.classHitDiceUsed[klassId] = klass.system.hd.spent;
      }
    });

    const same = isEqual({}, hitDiceData.classHitDiceUsed);
    if (!same) {
      resolve(updateCharacterCall(actor, "hitdice", { shortRest: hitDiceData }));
    }

    resolve({});
  });
}

async function updateSpellsPrepared(actor: TSyncCharacterActor, spellPreparedData: Record<string, any>): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    resolve(updateCharacterCall(actor, "spell/prepare", spellPreparedData, "Spells Prepared"));
  });
}

async function updateDDBSpellsPrepared(actor: TSyncCharacterActor, spells: TImporterItem[]): Promise<ISyncResult[]> {
  const promises: Promise<ISyncResult>[] = [];

  for (const spell of spells) {
    if (spell.type !== "spell") continue;
    if (spell.system.method !== "spell") continue;
    if (spell.system.prepared === CONFIG.DND5E.spellPreparationStates.always.value) continue;
    const ddbFlags = spell.flags.ddbimporter;
    if (!ddbFlags?.dndbeyond?.characterClassId) continue;
    if (ddbFlags.dndbeyond.granted) continue;
    const spellPreparedData = {
      spellInfo: {
        spellId: ddbFlags.definitionId,
        characterClassId: ddbFlags.dndbeyond.characterClassId,
        entityTypeId: ddbFlags.entityTypeId,
        id: ddbFlags.id,
        prepared: spell.system.prepared === CONFIG.DND5E.spellPreparationStates.prepared.value,
      },
    };
    logger.debug(`Updating spell prepared state for ${spell.name} to ${spellPreparedData.spellInfo.prepared}`);
    promises.push(updateSpellsPrepared(actor, spellPreparedData));
  }

  return Promise.all(promises);
}

async function spellsPrepared(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult[]> {
  if (!utils.getSetting<boolean>("sync-policy-spells-prepared")) return [];
  const ddbSpells = ddbCharacter.data.spells;

  const preparedSpells = actor.items.filter((item: TImporterItem) => {
    const spellMatch = ddbSpells.find((s) =>
      s.name === item.name
      && item.system.method === "spell"
      && item.system.prepared !== CONFIG.DND5E.spellPreparationStates.always.value
      && foundry.utils.hasProperty(item, "flags.ddbimporter.dndbeyond.characterClassId")
      && item.flags.ddbimporter?.dndbeyond?.characterClassId === s.flags.ddbimporter?.dndbeyond?.characterClassId,
    );
    if (!spellMatch) return false;
    const select = item.type === "spell"
      && (item as any).system.method === "spell"
      && (item as any).system.prepared !== spellMatch.system.prepared;
    return spellMatch && select;
  });

  const results = updateDDBSpellsPrepared(actor, preparedSpells);

  return results;
}

async function updateItemsWithDDBInfo<T extends I5eItemData>(itemsToAdd: T[]) {
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

function getValidContainer(actor: TSyncCharacterActor, containerEntityId: number | string) {
  if (!containerEntityId) return undefined;
  if (parseInt(String(containerEntityId)) === parseInt(getCharacterId(actor))) return true;
  const containers = actor.items.filter((i) =>
    foundry.utils.getProperty(i, "flags.ddbimporter.dndbeyond.isContainer") === true,
  );
  return containers.find((c) => parseInt(foundry.utils.getProperty(c, "flags.ddbimporter.id") as string) === parseInt(String(containerEntityId)));
}

interface IGenerateItemsToAddResult {
  containerEntityId: number;
  containerEntityTypeId: number;
  entityId: number;
  entityTypeId: number;
  quantity: number;
}

function generateItemsToAdd<T extends I5eInventoryItem>(actor: TSyncCharacterActor, itemsToAdd: T[]) {
  const results: {
    items: T[];
    toAdd: IGenerateItemsToAddResult[];
    custom: T[];
  } = {
    items: [],
    toAdd: [],
    custom: [],
  };

  const characterId = parseInt(getCharacterId(actor));

  for (let i = 0; i < itemsToAdd.length; i++) {
    const item = itemsToAdd[i];
    if (item.flags.ddbimporter?.definitionId && item.flags.ddbimporter?.definitionEntityTypeId) {
      // was hasProperty, which passed a boolean and made the lookup always miss
      const containerItem = getValidContainer(actor, foundry.utils.getProperty(item, "flags.ddbimporter.containerEntityId") as number | string);
      // getValidContainer returns true when the container is the character itself
      const containerEntityId = containerItem && containerItem !== true
        ? parseInt(foundry.utils.getProperty(containerItem, "flags.ddbimporter.id") as string)
        : characterId;
      const containerEntityTypeId = containerItem && containerItem !== true && containerEntityId !== characterId
        ? parseInt(foundry.utils.getProperty(containerItem, "flags.ddbimporter.entityTypeId") as string)
        : parseInt("1581111423");
      results.toAdd.push({
        containerEntityId,
        containerEntityTypeId,
        entityId: parseInt(String(item.flags.ddbimporter.definitionId)),
        entityTypeId: parseInt(String(item.flags.ddbimporter.definitionEntityTypeId)),
        quantity: parseInt(String(item.system.quantity)),
      });
    } else {
      results.custom.push(item);
    }
    results.items.push(item);
  }
  return results;
}

async function deleteDDBCustomItems(actor: TSyncCharacterActor, itemsToDelete: I5eInventoryItem[]) {
  return new Promise((resolve) => {
    const customItemResults = [];
    for (let i = 0; i < itemsToDelete.length; i++) {
      const item = itemsToDelete[i];
      const customData = {
        itemState: "DELETE",
        customValues: {
          characterId: parseInt(getCharacterId(actor)),
          id: item.flags.ddbimporter?.definitionId,
          mappingId: item.flags.ddbimporter?.id,
          partyId: null as string | number | null,
        },
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

/**
 * Adds custom items to a D&D Beyond character.
 *
 * This function processes an array of items, enriches them with DDB information,
 * and adds them as custom items to the specified actor. It sets various properties
 * on each item to mark it as a custom item and associates it with its container
 * entity and type. The function returns a promise that resolves to an array of
 * the processed custom items.
 *
 * @param {object} actor The actor to which the custom items are to be added.
 * @param {Array} itemsToAdd An array of items to be added as custom items.
 * @returns {Array} A n array of the added
 * custom items, each enriched with DDB information.
 */
async function addDDBCustomItems(actor: TSyncCharacterActor, itemsToAdd: I5eInventoryItem[] | TImporterItem[]): Promise<I5eInventoryItem[]> {
  // Mutated in place by setProperty below, then handed to updateEmbeddedDocuments.
  const customItemResults: I5eInventoryItem[] = [];
  for (let i = 0; i < itemsToAdd.length; i++) {
    const item = itemsToAdd[i];
    const containerEntityId = foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
      ? parseInt(String(item.flags.ddbimporter.containerEntityId))
      : parseInt(getCharacterId(actor));
    const containerEntityTypeId = foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityTypeId")
      ? parseInt(String(item.flags.ddbimporter.containerEntityTypeId))
      : parseInt("1581111423");
    const customData = {
      itemState: "NEW",
      customValues: {
        characterId: parseInt(getCharacterId(actor)),
        containerEntityId,
        containerEntityTypeId,
        name: item.name,
        description: getCustomItemDescription(item.system.description.value),
        quantity: item.system.quantity,
        cost: null as number | null,
        weight: Number.isInteger(item.system.weight) ? item.system.weight : 0,
      },
    };

    const itemData = ("toObject" in item && typeof item.toObject === "function")
      ? item.toObject() as unknown as I5eInventoryItem
      : foundry.utils.duplicate(item) as unknown as I5eInventoryItem;
    const data = await updateCharacterCall(actor, "custom/item", customData, { name: itemData.name });
    foundry.utils.setProperty(itemData, "flags.ddbimporter.id", data.data.addItems[0].id);
    foundry.utils.setProperty(itemData, "flags.ddbimporter.custom", true);
    foundry.utils.setProperty(itemData, "flags.ddbimporter.ddbCustomAdded", true);
    foundry.utils.setProperty(itemData, "flags.ddbimporter.dndbeyond.isCustomItem", true);
    foundry.utils.setProperty(itemData, "flags.ddbimporter.definitionId", data.data.addItems[0].definition.id);
    foundry.utils.setProperty(itemData, "flags.ddbimporter.containerEntityId", data.data.addItems[0].definition.containerEntityId);
    foundry.utils.setProperty(itemData, "flags.ddbimporter.containerEntityTypeId", data.data.addItems[0].definition.containerEntityTypeId);
    customItemResults.push(itemData);
  }

  return customItemResults;
}

async function addDDBEquipment(actor: TSyncCharacterActor, itemsToAdd: I5eInventoryItem[]) {
  const ddbEnrichedItems = await updateItemsWithDDBInfo(itemsToAdd);
  const generatedItemsToAddData = generateItemsToAdd(actor, ddbEnrichedItems);

  const addDebugData = generatedItemsToAddData.items.map((i) => {
    return {
      name: i.name,
      definitionId: i.flags.ddbimporter?.definitionId,
      definitionEntityTypeId: i.flags.ddbimporter?.definitionEntityTypeId,
      containerEntityId: i.flags.ddbimporter?.containerEntityId,
      containerEntityTypeId: i.flags.ddbimporter?.containerEntityTypeId,
      entityTypeId: i.flags.ddbimporter?.entityTypeId,
    };
  });

  logger.debug(`Generated items data`, generatedItemsToAddData);
  logger.debug(`Generated items data light`, addDebugData);

  const addItemData = {
    equipment: generatedItemsToAddData.toAdd,
  };

  const customItems = await addDDBCustomItems(actor, generatedItemsToAddData.custom);

  try {
    logger.debug("Adding custom items:", {
      ddbData: generatedItemsToAddData.custom,
      customItems,
    });
    const customItemResults = await actor.updateEmbeddedDocuments("Item", customItems as any);
    logger.debug("customItemResults", customItemResults);
  } catch (err) {
    logger.error(`Unable to update character with equipment, got the error:`, err);
    if (err instanceof Error) logger.error(err.stack);
    logger.error(`Update payload:`, customItems);
  }

  if (addItemData.equipment.length > 0) {
    const itemResults = await updateCharacterCall(actor, "equipment/add", addItemData, "Adding equipment");
    try {
      const itemUpdates: IDDBInventoryItem[] = itemResults.data.addItems
        .filter((addedItem: IDDBInventoryItem) => ddbEnrichedItems.some((i) =>
          i.flags.ddbimporter
          && i.flags.ddbimporter.definitionId === addedItem.definition.id
          && i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId,
        ))
        .map((addedItem: IDDBInventoryItem) => {
          const updatedItem = ddbEnrichedItems.find((i) =>
            i.flags.ddbimporter
            && i.flags.ddbimporter.definitionId === addedItem.definition.id
            && i.flags.ddbimporter.definitionEntityTypeId === addedItem.definition.entityTypeId,
          );
          if (!updatedItem) {
            // the filter above guarantees a match, a miss means DDB returned an item we never sent
            throw new Error(`Unable to match DDB added item ${addedItem.definition.id} to a local item`);
          }
          foundry.utils.setProperty(updatedItem, "flags.ddbimporter.id", addedItem.id);
          foundry.utils.setProperty(updatedItem, "flags.ddbimporter.containerEntityId", addedItem.containerEntityId);
          foundry.utils.setProperty(updatedItem, "flags.ddbimporter.containerEntityTypeId", addedItem.containerEntityTypeId);
          return updatedItem;
        });

      logger.debug("Character item updates:", itemUpdates);
      logger.debug("Character custom item updates:", customItems);

      try {
        if (itemUpdates.length > 0) await actor.updateEmbeddedDocuments("Item", itemUpdates as any);
        if (customItems.length > 0) await actor.updateEmbeddedDocuments("Item", customItems as any);
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

interface IItemsToMoveEntry {
  itemId: number;
  containerEntityId: number;
  containerEntityTypeId: number;
  name: string;
}

async function addEquipment(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter, partyContext: any = null): Promise<ISyncResult | ISyncResult[]> {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !utils.getSetting<boolean>("sync-policy-equipment")) return [];
  const ddbItems = ddbCharacter.data.inventory;

  const items = getFoundryItems(actor);
  const candidates = items.filter((item) =>
    !(item.flags.ddbimporter?.action ?? false)
    && (!("quantity" in item.system) || item.system.quantity !== 0)
    && DICTIONARY.types.inventory.includes(item.type)
    && !item.flags.ddbimporter?.custom
    && (!item.flags.ddbimporter?.id
    || !ddbItems.some((s) => s.flags.ddbimporter?.id === item.flags.ddbimporter?.id && s.type === item.type)),
  ) as I5eInventoryItem[];

  const partyDDBItemIds: Set<number> = partyContext?.partyDDBItemIds ?? new Set();
  const characterId = parseInt(getCharacterId(actor));
  const itemsToMoveFromParty: IItemsToMoveEntry[] = [];
  const itemsToAdd: I5eInventoryItem[] = [];

  for (const item of candidates) {
    const ddbItemId = foundry.utils.getProperty(item, "flags.ddbimporter.id") as number;
    if (ddbItemId && partyDDBItemIds.has(parseInt(`${ddbItemId}`))) {
      itemsToMoveFromParty.push({
        itemId: ddbItemId,
        containerEntityId: characterId,
        containerEntityTypeId: CHARACTER_CONTAINER_ENTITY_TYPE_ID,
        name: item.name,
      });
    } else {
      itemsToAdd.push(item);
    }
  }

  const movePromise = itemsToMoveFromParty.length > 0
    ? moveDDBEquipment(actor, itemsToMoveFromParty)
    : Promise.resolve([]);
  const addPromise = itemsToAdd.length > 0
    ? addDDBEquipment(actor, itemsToAdd)
    : Promise.resolve([]);

  const [moveResults, addResults] = await Promise.all([movePromise, addPromise]);
  return Array.isArray(addResults)
    ? [...(moveResults as any[]), ...addResults]
    : { ...(addResults as any), partyMoves: moveResults };
}


// updates custom names on regular items
async function updateDDBCustomNames(actor: TSyncCharacterActor, items: I5eInventoryItem[]): Promise<ISyncResult[]> {
  const promises: Promise<ISyncResult>[] = [];

  items.forEach((item) => {
    const ddbFlags = item.flags.ddbimporter;
    if (!ddbFlags?.id) {
      // e.g. a renamed item that was never imported from DDB, nothing to sync
      logger.warn(`Unable to sync custom name for ${item.name}, no DDB item id found`);
      return;
    }
    const customData = {
      customValues: {
        characterId: parseInt(getCharacterId(actor)),
        contextId: null as number | null,
        contextTypeId: null as number | null,
        notes: null as string | null,
        typeId: 8,
        value: item.name.replaceAll("[Infusion]", "").replace(/\(Legacy\)$/, "").trim(),
        valueId: `${ddbFlags.id}`,
        valueTypeId: `${ddbFlags.entityTypeId}`,
      },
    };
    // custom name on standard equipment
    promises.push(updateCharacterCall(actor, "equipment/custom", customData, "Updating custom names"));
  });

  return Promise.all(promises);

}

// updates names of items and actions
async function updateCustomNames(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter): Promise<ISyncResult[]> {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !utils.getSetting<boolean>("sync-policy-equipment")) return [];
  const ddbItems = ddbCharacter.data.inventory;

  const foundryItems = getFoundryItems(actor);

  const itemsToName = foundryItems.filter((item) =>
    (!("quantity" in item.system) || item.system.quantity !== 0)
    && (DICTIONARY.types.inventory.includes(item.type) || item.flags.ddbimporter?.action)
    && item.flags.ddbimporter?.id
    && ddbItems.some((ddbItem) =>
      ddbItem.flags.ddbimporter?.id === item.flags.ddbimporter?.id
      && ddbItem.type === item.type
      && ddbItem.name.replaceAll("[Infusion]", "").replace(/\(Legacy\)$/, "").trim() !== item.name.replaceAll("[Infusion]", "").replace(/\(Legacy\)$/, "").trim(),
    ),
  ) as I5eInventoryItem[];

  return updateDDBCustomNames(actor, itemsToName);
}

async function removeDDBEquipment(actor: TSyncCharacterActor, itemsToRemove: I5eInventoryItem[]) {
  const promises: Promise<any>[] = [];

  itemsToRemove.forEach((item) => {
    if (item.flags?.ddbimporter?.id) {
      logger.debug(`Removing item ${item.name}`);
      if (item.flags?.ddbimporter?.custom) {
        promises.push(deleteDDBCustomItems(actor, [item]));
      } else {
        promises.push(updateCharacterCall(actor, "equipment/remove", { itemId: parseInt(String(item.flags.ddbimporter.id)) }, "Removing equipment"));
      }
    }
  });

  return Promise.all(promises);
}

async function moveDDBEquipment(actor: TSyncCharacterActor, moves: IItemsToMoveEntry[]) {
  const promises: Promise<any>[] = [];
  for (const move of moves) {
    if (!move?.itemId) continue;
    const itemData = {
      itemId: parseInt(String(move.itemId)),
      containerEntityId: parseInt(String(move.containerEntityId)),
      containerEntityTypeId: parseInt(String(move.containerEntityTypeId)),
    };
    promises.push(updateCharacterCall(actor, "equipment/move", itemData, { name: move.name ?? "" }));
  }
  return Promise.all(promises);
}

async function removeEquipment(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter, partyContext: any = null): Promise<ISyncResult[]> {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !utils.getSetting<boolean>("sync-policy-equipment")) return [];
  const ddbItems = ddbCharacter.data.inventory;
  const actorItems = getFoundryItems(actor).filter((item) =>
    foundry.utils.getProperty(item, "flags.ddbimporter.action") !== true
    && DICTIONARY.types.inventory.includes(item.type),
  ) as I5eInventoryItem[];

  const partyDDBItemIds: Set<number> = partyContext?.partyDDBItemIds ?? new Set();
  const partyCampaignId = partyContext?.campaignId ?? null;
  const itemsToMoveToParty: IItemsToMoveEntry[] = [];

  const itemsToRemove = ddbItems.filter((item) => {
    const ddbItemId = foundry.utils.getProperty(item, "flags.ddbimporter.id") as number;
    if (!ddbItemId) return false;
    if (!DICTIONARY.types.inventory.includes(item.type)) return false;
    if (foundry.utils.getProperty(item, "flags.ddbimporter.action") === true) return false;

    const actorItemTypeMatch = actorItems.find((s) =>
      item.flags.ddbimporter?.id === s.flags.ddbimporter?.id && s.type === item.type,
    ) as I5eInventoryItem | undefined;
    if (actorItemTypeMatch) {
      // found an item but zero quantity, remove
      if (actorItemTypeMatch.system.quantity == 0) return true;
      else return false;
    }
    const customItemMatch = actorItems.find((s) =>
      item.flags.ddbimporter?.id === s.flags.ddbimporter?.id
      && s.type !== item.type
      && (
        (foundry.utils.hasProperty(s, "flags.ddbimporter.replacedId") && foundry.utils.hasProperty(s, "flags.ddbimporter.overrideId"))
        || foundry.utils.getProperty(s, "flags.ddbimporter.ddbCustomAdded") === true
      ),
    );
    if (customItemMatch) return false;

    // already on the DDB party server-side; nothing to do here
    if (partyDDBItemIds.has(ddbItemId)) return false;

    // present on a party Foundry actor; emit a move-to-party instead
    if (partyCampaignId) {
      const partyActor = findPartyActorContainingDDBItem(ddbItemId);
      if (partyActor && `${foundry.utils.getProperty(partyActor, `flags.ddbimporter.${PARTY_CAMPAIGN_FLAG}`)}` === `${partyCampaignId}`) {
        itemsToMoveToParty.push({
          itemId: ddbItemId,
          containerEntityId: parseInt(`${partyCampaignId}`),
          containerEntityTypeId: PARTY_CONTAINER_ENTITY_TYPE_ID,
          name: foundry.utils.getProperty(item, "definition.name") as string ?? item.name,
        });
        return false;
      }
    }

    // no match, remove
    return true;
  });

  const movePromise = itemsToMoveToParty.length > 0
    ? moveDDBEquipment(actor, itemsToMoveToParty)
    : Promise.resolve([]);

  if (itemsToRemove.length === 0) {
    return movePromise;
  }

  logger.debug(`Removing ${itemsToRemove.length} items, moving ${itemsToMoveToParty.length} to party`, {
    itemsToRemove,
    itemsToMoveToParty,
  });
  const [moveResults, removeResults] = await Promise.all([movePromise, removeDDBEquipment(actor, itemsToRemove)]);
  return [...(moveResults as any[]), ...(removeResults as any[])];
}

async function updateDDBEquipmentStatus(actor: TSyncCharacterActor, updateItemDetails: Record<string, I5eInventoryItem[]>, ddbItems: IDDBInventoryItem[]): Promise<ISyncResult[]> {
  logger.debug("Updating DDB Equipment Status", {
    updateItemDetails,
    actor,
    ddbItems,
  });
  const itemsToEquip = updateItemDetails.itemsToEquip || [];
  const itemsToAttune = updateItemDetails.itemsToAttune || [];
  const itemsToCharge = updateItemDetails.itemsToCharge || [];
  const itemsToQuantity = updateItemDetails.itemsToQuantity || [];
  const itemsToName = updateItemDetails.itemsToName || [];
  const customItems = updateItemDetails.customItems || [];
  const itemsToMove = updateItemDetails.itemsToMove || [];
  const currencyItems = updateItemDetails.itemsToCurrency || [];

  const promises: Promise<ISyncResult>[] = [];
  const characterId = parseInt(getCharacterId(actor));

  itemsToMove.forEach((item) => {
    const ddbFlags = item.flags.ddbimporter;
    if (!ddbFlags?.id) return;
    const containerEntityTypeId = foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
      && parseInt(String(ddbFlags.containerEntityId)) === characterId
      ? parseInt("1581111423") // default to character inventory
      : parseInt(String(ddbFlags.containerEntityTypeId));

    const itemData = {
      itemId: ddbFlags.id,
      containerEntityId: ddbFlags.containerEntityId,
      containerEntityTypeId: containerEntityTypeId,
    };
    promises.push(updateCharacterCall(actor, "equipment/move", itemData, { name: item.name }));
  });
  itemsToEquip.forEach((item) => {
    const ddbFlags = item.flags.ddbimporter;
    if (!ddbFlags?.id) return;
    if ("equipped" in item.system) {
      const itemData = { itemId: ddbFlags.id, value: item.system.equipped };
      promises.push(updateCharacterCall(actor, "equipment/equipped", itemData, { name: item.name }));
    }
  });
  itemsToAttune.forEach((item) => {
    // console.warn(item)
    const ddbFlags = item.flags.ddbimporter;
    if (!ddbFlags?.id) return;
    if ("attuned" in item.system) {
      const itemData = { itemId: ddbFlags.id, value: item.system.attuned };
      promises.push(updateCharacterCall(actor, "equipment/attuned", itemData, { name: item.name }));
    }
  });
  itemsToCharge.forEach((rawItem) => {
    const item = rawItem._id ? actor.items.get(rawItem._id) : undefined;
    const ddbFlags = item?.flags.ddbimporter;
    if (!item || !ddbFlags?.id) return;
    const itemData = {
      itemId: ddbFlags.id,
      charges: Math.max(0, parseInt(item.system.uses.max) - parseInt(item.system.uses.value)),
    };
    if (Number.isInteger(itemData.charges)) {
      promises.push(updateCharacterCall(actor, "equipment/charges", itemData, { name: item.name }));
    }
  });
  itemsToQuantity.forEach((item) => {
    const ddbFlags = item.flags.ddbimporter;
    if (!ddbFlags?.id) return;
    if ("quantity" in item.system) {
      const itemData = {
        itemId: ddbFlags.id,
        quantity: item.system.quantity,
      };
      promises.push(updateCharacterCall(actor, "equipment/quantity", itemData, { name: item.name }));
    }
  });
  itemsToName.forEach((item) => {
    const ddbFlags = item.flags?.ddbimporter;
    if (!ddbFlags?.id) return;
    // historically items may not have this metadata
    const entityTypeId = ddbFlags.entityTypeId
      ? ddbFlags.entityTypeId
      : ddbItems.find((dItem) => dItem.id === ddbFlags.id)?.entityTypeId;
    if (!entityTypeId) {
      logger.warn(`Unable to sync name for ${item.name}, no entity type id found`);
      return;
    }
    const customData = {
      customValues: {
        characterId,
        contextId: null as number | null,
        contextTypeId: null as number | null,
        notes: null as string | null,
        typeId: 8,
        value: item.name.replaceAll("[Infusion]", "").replace(/\(Legacy\)$/, "").trim(),
        valueId: `${ddbFlags.id}`,
        valueTypeId: `${entityTypeId}`,
      },
    };
    const flavor = { detail: "Updating Name", name: item.name, originalName: ddbFlags.originalName };
    promises.push(updateCharacterCall(actor, "equipment/custom", customData, flavor));
  });

  for (const item of currencyItems) {

    if (!foundry.utils.hasProperty(item, "system.currency.gp")) continue;
    const ddbItem = ddbItems.find((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id,
    );

    if (ddbItem && !foundry.utils.hasProperty(ddbItem, "currency.gp")) continue;
    ["pp", "gp", "ep", "sp", "cp"].forEach((t) => {
      const ddbValue = ddbItem ? foundry.utils.getProperty(ddbItem, `currency.${t}`) : undefined;
      if (foundry.utils.getProperty(item, `system.currency.${t}`) !== ddbValue) {
        const currency = {
          amount: foundry.utils.getProperty(item, `system.currency.${t}`),
          characterId,
          destinationEntityId: foundry.utils.getProperty(item, "flags.ddbimporter.id"),
          destinationEntityTypeId: foundry.utils.getProperty(item, "flags.ddbimporter.entityTypeId"),
        };
        const type = DICTIONARY.currency[t as TCurrencyUnit];
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
      const ddbFlags = item.flags.ddbimporter;
      if (!ddbFlags) return;
      const customData = {
        itemState: "UPDATE",
        customValues: {
          characterId,
          id: ddbFlags.definitionId,
          mappingId: ddbFlags.id,
          name: item.name,
          description: getCustomItemDescription(item.system.description.value),
          // revist these need to be ints
          // weight: `${item.data.weight}`,
          // cost: item.data.price.value,
          cost: null as number | null,
          weight: Number.isInteger(item.system.weight) ? item.system.weight : 0,
          quantity: item.system.quantity,
        },
      };
      promises.push(updateCharacterCall(actor, "custom/item", customData, "Updating Custom Item"));
    });

  return Promise.all(promises);
}


async function equipmentStatus(actor: TSyncCharacterActor, ddbCharacter: DDBCharacter, addEquipmentResults: Record<string, any>): Promise<ISyncResult[]> {
  const syncItemReady = actor.flags.ddbimporter?.syncItemReady;
  if (syncItemReady && !utils.getSetting<boolean>("sync-policy-equipment")) return [];
  if (!ddbCharacter.source) {
    // previously this fell over with a TypeError; the source is always set after getCharacterData
    throw new Error("No D&D Beyond character data available for equipment status sync");
  }
  // reload the actor following potential updates to equipment
  let ddbItems = ddbCharacter.source.ddb.character.inventory;
  const customDDBItems = ddbCharacter.source.ddb.character.customItems;
  if (addEquipmentResults?.system) {
    const reloadedActor = actor.id ? game.actors.get(actor.id) : undefined;
    if (reloadedActor) actor = reloadedActor as TSyncCharacterActor;
    ddbItems = ddbItems.concat(addEquipmentResults.system.addItems);
  }

  const foundryItems = getFoundryItems(actor);

  const itemsToEquip: I5eInventoryItem[] = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "system.equipped")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && item.system.equipped !== dItem.equipped,
    ),
  ) as I5eInventoryItem[];
  const itemsToAttune: I5eInventoryItem[] = foundryItems.filter((item) =>
    ["optional", "required"].includes(foundry.utils.getProperty(item, "system.attunement") as string)
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && foundry.utils.getProperty(item, "system.attuned") !== dItem.isAttuned,
    ),
  ) as I5eInventoryItem[];
  const itemsToCharge: I5eInventoryItem[] = foundryItems.filter((rawItem) => {
    const item = rawItem._id ? actor.items.get(rawItem._id) : undefined;
    if (!item) return false;
    return foundry.utils.hasProperty(item, "system.uses")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && Number.isInteger(parseInt(foundry.utils.getProperty(item, "system.uses.max") as string))
      && Number.isInteger(parseInt(String(dItem.limitedUse?.numberUsed)))
      && ((parseInt(foundry.utils.getProperty(item, "system.uses.max") as string) - parseInt(foundry.utils.getProperty(item, "system.uses.value") as string)) !== dItem.limitedUse?.numberUsed),
    );
  }) as I5eInventoryItem[];
  const itemsToQuantity: I5eInventoryItem[] = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "system.quantity")
    && foundry.utils.getProperty(item, "system.quantity") !== 0
    && !foundry.utils.getProperty(item, "system.armor.type")
    && ((foundry.utils.getProperty(item, "type") !== "weapon" && foundry.utils.getProperty(item, "type") !== "armor") || foundry.utils.getProperty(item, "flags.ddbimporter.dndbeyond.stackable"))
    && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && foundry.utils.getProperty(item, "system.quantity") !== dItem.quantity,
    ),
  ) as I5eInventoryItem[];
  // this is for items that have been added and might have a different name
  const itemsToName: I5eInventoryItem[] = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && foundry.utils.getProperty(item, "system.quantity") !== 0
    && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.originalName") === dItem.definition.name
      && foundry.utils.getProperty(item, "flags.ddbimporter.originalName") !== (foundry.utils.getProperty(item, "name") as string).replaceAll("[Infusion]", "").replace(/\(Legacy\)$/, "").trim()
      && foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && (foundry.utils.getProperty(item, "name") as string).replaceAll("[Infusion]", "").replace(/\(Legacy\)$/, "").trim() !== dItem.definition.name,
    ),
  ) as I5eInventoryItem[];

  // update.name || update.data?.description || update.data?.weight || update.data?.price || update.data?.quantity
  const customItems: I5eInventoryItem[] = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && foundry.utils.getProperty(item, "system.quantity") !== 0
    && (foundry.utils.getProperty(item, "flags.ddbimporter.custom") === true || foundry.utils.getProperty(item, "flags.ddbimporter.isCustom") === true)
    && customDDBItems.some((dItem) => dItem.id === foundry.utils.getProperty(item, "flags.ddbimporter.id")
      && (
        foundry.utils.getProperty(item, "name") !== dItem.name
        || getCustomItemDescription(foundry.utils.getProperty(item, "system.description.value") as string) != dItem.description
        || (foundry.utils.hasProperty(item, "system.quantity") && foundry.utils.getProperty(item, "system.quantity") != dItem.quantity)
        || (foundry.utils.hasProperty(item, "system.weight") && foundry.utils.getProperty(item, "system.weight") != dItem.weight)
        //  ||
        // item.data.price != dItem.cost
      ),
    ),
  ) as I5eInventoryItem[];

  const itemsToMove: I5eInventoryItem[] = foundryItems.filter((item) =>
    foundry.utils.hasProperty(item, "flags.ddbimporter.id")
    && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
    && foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
    && ddbItems.some((dItem) =>
      foundry.utils.getProperty(item, "flags.ddbimporter.id") === dItem.id
      && parseInt(foundry.utils.getProperty(item, "flags.ddbimporter.containerEntityId") as string) !== parseInt(String(dItem.containerEntityId)),
    )) as I5eInventoryItem[];

  const itemsToCurrency: I5eInventoryItem[] = utils.getSetting<boolean>("sync-policy-currency")
    ? foundryItems.filter((item) =>
      foundry.utils.hasProperty(item, "flags.ddbimporter.id")
      && foundry.utils.hasProperty(item, "flags.ddbimporter.entityTypeId")
      && !foundry.utils.getProperty(item, "flags.ddbimporter.action")
      && !foundry.utils.getProperty(item, "flags.ddbimporter.custom")
      && foundry.utils.hasProperty(item, "system.currency.gp")
      && ddbItems.some((dItem) =>
        item.flags.ddbimporter.id === dItem.id
        && !isEqual(dItem.currency, item.system.currency),
      )) as I5eInventoryItem[]
    : [];

  const itemsToUpdate: Record<string, I5eInventoryItem[]> = {
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
    ddbItems,
  });

  return updateDDBEquipmentStatus(actor, itemsToUpdate, ddbItems);

}

async function updateActionUseStatus(actor: TSyncCharacterActor, actionData: Record<string, any>, actionName: string): Promise<ISyncResult> {
  return new Promise<ISyncResult>((resolve) => {
    resolve(updateCharacterCall(actor, "action/use", actionData, `Action Use for ${actionName}`));
  });
}

async function updateDDBActionUseStatus(actor: TSyncCharacterActor, actions: (I5eInventoryItem | I5eFeatItem)[]): Promise<ISyncResult[]> {
  const promises: Promise<ISyncResult>[] = [];
  actions.forEach((rawAction) => {
    const action = rawAction._id ? actor.items.get(rawAction._id) : undefined;
    const ddbFlags = action?.flags.ddbimporter;
    if (!action || !ddbFlags?.id) return;
    const actionData = {
      actionId: ddbFlags.id,
      entityTypeId: ddbFlags.entityTypeId,
      uses: Math.max(0, parseInt(action.system.uses.max) - parseInt(action.system.uses.value)),
    };
    promises.push(updateActionUseStatus(actor, actionData, action.name));
  });
  return Promise.all(promises);
}

async function actionUseStatus(_actor: TSyncCharacterActor, _ddbCharacter: DDBCharacter): Promise<ISyncResult[]> {
  return [];
  // action use disabled until feature/action parser sync

  // const syncActionReady = actor.flags.ddbimporter?.syncActionReady;
  // if (syncActionReady && !utils.getSetting<boolean>("sync-policy-action-use")) return [];

  // const ddbActions = ddbCharacter.data.actions;

  // const foundryItems = getFoundryItems(actor);

  // const actionsToChange = foundryItems.filter((item) =>
  //   (item.flags.ddbimporter?.action || item.type === "feat")
  //   && item.flags.ddbimporter?.id && item.flags.ddbimporter?.entityTypeId
  //   && ddbActions.some((dItem) =>
  //     item.flags.ddbimporter.id === dItem.flags.ddbimporter.id
  //     && item.flags.ddbimporter.entityTypeId === dItem.flags.ddbimporter.entityTypeId
  //     && item.name === dItem.name && item.type === dItem.type
  //     && Number.isInteger(parseInt(foundry.utils.getProperty(item, "system.uses.value") as string))
  //     && Number.parseInt(foundry.utils.getProperty(item, "system.uses.value") as string) !== Number.parseInt(foundry.utils.getProperty(dItem, "system.uses.value") as string),
  //   ),
  // );
  // const actionChanges = updateDDBActionUseStatus(actor, actionsToChange);

  // return actionChanges;
}

async function _updateDDBCharacter(actor: TSyncCharacterActor): Promise<(ISyncResult | ISyncResult[])[]> {
  const cobaltCheck = await Secrets.checkCobalt(actor.id ?? "");

  if (cobaltCheck.success) {
    logger.debug(`Cobalt checked`);
  } else {
    logger.error(`Cobalt cookie expired, please reset`);
    logger.error(cobaltCheck.message);
    throw cobaltCheck.message;
  }

  const characterId = getCharacterId(actor);
  const syncId = actor.flags["ddb-importer"]?.syncId ? actor.flags["ddb-importer"].syncId + 1 : 0;

  const ddbCharacterOptions = {
    currentActor: actor,
    characterId,
    selectResources: false,
    enableCompanions: false,
    enableSummons: false,
    addToCompendiums: false,
  };
  const getOptions = {
    syncId,
    localCobaltPostFix: actor.id ?? "",
  };
  const ddbCharacter = new DDBCharacter(ddbCharacterOptions);
  const activeUpdateState = ddbCharacter.getCurrentDynamicUpdateState();
  await ddbCharacter.disableDynamicUpdates();
  await ddbCharacter.getCharacterData(getOptions);
  await ddbCharacter.process();

  if (!ddbCharacter.source) {
    throw new Error("Unable to fetch character data from D&D Beyond.");
  }
  if (!ddbCharacter.source.ddb.character.canEdit) {
    logger.debug("Update DDB", { ddbCharacter, source: ddbCharacter.source });
    throw new Error("User is not allowed to edit character on D&D Beyond.");
  }

  logger.debug("Current actor:", foundry.utils.duplicate(actor));
  logger.debug("DDB Parsed data:", { data: ddbCharacter.data, source: ddbCharacter.source });

  const partyCampaignIdRaw = DDBCampaigns.getCampaignId();
  const partyCampaignId = partyCampaignIdRaw && `${partyCampaignIdRaw}`.trim() !== "" ? `${partyCampaignIdRaw}` : null;
  let partyContext: any = null;
  if (partyCampaignId) {
    try {
      const partyData = await DDBPartyInventory.fetchPartyInventory({ campaignId: partyCampaignId });
      const partyDDBItemIds = new Set<number>(
        (partyData?.partyItems ?? []).map((i: any) => parseInt(i.id)).filter((n: number) => Number.isInteger(n)),
      );
      partyContext = { campaignId: partyCampaignId, partyDDBItemIds, partyData };
    } catch (err) {
      logger.warn(`Unable to fetch party inventory for campaign ${partyCampaignId}:`, err);
      partyContext = { campaignId: partyCampaignId, partyDDBItemIds: new Set<number>(), partyData: null };
    }
  }

  const singlePromises: Promise<ISyncResult | ISyncResult[] | undefined>[] = [
    currency(actor, ddbCharacter),
    hitDice(actor, ddbCharacter),
    spellSlots(actor, ddbCharacter),
    spellSlotsPact(actor, ddbCharacter),
    inspiration(actor, ddbCharacter),
    exhaustion(actor, ddbCharacter),
    deathSaves(actor, ddbCharacter),
    xp(actor, ddbCharacter),
  ];

  const singleResults = await Promise.all(singlePromises);
  const hpResults = await hitPoints(actor, ddbCharacter);
  const spellsPreparedResults = await spellsPrepared(actor, ddbCharacter);
  const actionStatusResults = await actionUseStatus(actor, ddbCharacter);
  const nameUpdateResults = await updateCustomNames(actor, ddbCharacter);
  const addEquipmentResults = await addEquipment(actor, ddbCharacter, partyContext);
  const removeEquipmentResults = await removeEquipment(actor, ddbCharacter, partyContext);
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

  // fvtt-types derives the setFlag scope union from FlagConfig, which does not
  // declare the runtime module scope "ddb-importer"; the call is valid at runtime.
  (actor.setFlag as unknown as (scope: string, key: string, value: number) => Promise<unknown>)("ddb-importer", "syncId", syncId);
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
  ).filter((result): result is ISyncResult | ISyncResult[] => result !== undefined);

  logger.debug("Update results", results);
  const failures = results.filter((r) => r && !Array.isArray(r) && r.success === false);
  if (failures.length > 0) {
    logger.warn(`${failures.length} of ${results.length} DDB update calls failed`, failures);
  }
  await ddbCharacter.updateDynamicUpdates(activeUpdateState);

  return results;
}

export async function updateDDBCharacter(actor: TSyncCharacterActor): Promise<(ISyncResult | ISyncResult[])[]> {
  try {
    return await DDBRunContext.runWith({
      ignoreEnrichedImages: true,
      keyPostfix: actor.id,
      useLocal: foundry.utils.getProperty(actor, "flags.ddbimporter.useLocalPatreonKey") as boolean ?? false,
    }, () => _updateDDBCharacter(actor));
  } catch (err) {
    logger.error("Unable to update DDB character:", err);
    throw err;
  }
}

// Called when characters are updated
// will dynamically sync status back to DDB
async function activeUpdateActor(actor: TSyncCharacterActor, update: Record<string, any>) {

  return new Promise((resolve) => {

    const promises: Promise<any>[] = [];

    const actorActiveUpdate = actor.flags.ddbimporter?.activeUpdate;

    if (actorActiveUpdate) {
      const syncHP = utils.getSetting<boolean>("dynamic-sync-policy-hitpoints");
      const syncCurrency = utils.getSetting<boolean>("dynamic-sync-policy-currency");
      const syncSpellSlots = utils.getSetting<boolean>("dynamic-sync-policy-spells-slots");
      const syncInspiration = utils.getSetting<boolean>("dynamic-sync-policy-inspiration");
      const syncConditions = utils.getSetting<boolean>("dynamic-sync-policy-condition");
      const syncDeathSaves = utils.getSetting<boolean>("dynamic-sync-policy-deathsaves");
      const syncXP = utils.getSetting<boolean>("dynamic-sync-policy-xp");


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


async function generateDynamicItemChange(actor: TSyncCharacterActor, document: TImporterItem, update: Record<string, any>) {
  const updateItemDetails: Record<string, I5eInventoryItem[]> = {
    itemsToEquip: [],
    itemsToAttune: [],
    itemsToCharge: [],
    itemsToQuantity: [],
    itemsToName: [],
    customItems: [],
    itemsToMove: [],
    itemsToCurrency: [],
  };

  // console.warn("Document", document);
  // console.warn("ItemUpdate", update);

  if (foundry.utils.getProperty(document, "flags.ddbimporter.custom") === true
    || foundry.utils.getProperty(document, "flags.ddbimporter.isCustom") === true
  ) {
    if (update.name || update.system?.description || update.system?.weight || update.system?.price || update.system?.quantity) {
      updateItemDetails.customItems.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
    }
  } else if (foundry.utils.hasProperty(document, "flags.ddbimporter.id")) {
    if (update.system?.uses) {
      updateItemDetails.itemsToCharge.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
    }
    if (update.system?.attuned) {
      updateItemDetails.itemsToAttune.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
    }
    if (update.system?.quantity) {
      // if its a weapon or armor we actually need to push a new one
      if (!foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.stackable") && update.system.quantity > 1) {
        // Some items are not stackable on DDB

        const itemDocument = document as unknown as TImporterItem;
        await itemDocument.update({ system: { quantity: 1 } } as Item.UpdateInput);
        const newDocument = foundry.utils.duplicate(itemDocument.toObject()) as unknown as I5eInventoryItem;
        delete newDocument._id;
        delete newDocument.flags.ddbimporter?.id;

        const results = [];
        for (let i = 1; i < update.system.quantity; i++) {
          logger.debug(`Adding item # ${i}`);
          const newDoc = await actor.createEmbeddedDocuments("Item", [newDocument as unknown as Item.CreateData], DISABLE_FOUNDRY_UPGRADE as any);
          results.push(newDoc);
          // new doc/item push to ddb handled by the add item hook
        }
        return results;
      } else {
        updateItemDetails.itemsToQuantity.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
      }
    }
    if (update.system?.equipped) {
      updateItemDetails.itemsToEquip.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
    }
    if (update.name) {
      updateItemDetails.itemsToName.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
    }
    if (update.system?.container) {
      const containerisedDocument = foundry.utils.duplicate(document) as unknown as I5eInventoryItem;
      setContainerDetails(actor, containerisedDocument);
      updateItemDetails.itemsToMove.push(containerisedDocument);
    }
    if (update.system?.currency) {
      updateItemDetails.itemsToCurrency.push(foundry.utils.duplicate(document) as unknown as I5eInventoryItem);
    }
  }

  logger.debug("UpdateItemDetails", updateItemDetails);

  return updateDDBEquipmentStatus(actor, updateItemDetails, []);

}

async function updateSpellPrep(actor: TSyncCharacterActor, document: TImporterItem): Promise<ISyncResult[]> {
  return new Promise<ISyncResult[]>((resolve) => {
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
async function activeUpdateUpdateItem(document: TImporterItem, update: Record<string, any>) {

  return new Promise((resolve) => {

    // we check to see if this is actually an embedded item
    const parentActor = document.parent as TSyncCharacterActor;
    const actorActiveUpdate = parentActor && parentActor.flags.ddbimporter?.activeUpdate;
    const ignore = foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemUpdate") ?? false;

    if (!parentActor || !actorActiveUpdate || ignore) {
      resolve([]);
    } else {
      logger.debug("Preparing to sync item change to DDB...");
      const action = document.flags.ddbimporter?.action || document.type === "feat";
      const syncEquipment = utils.getSetting<boolean>("dynamic-sync-policy-equipment");
      // dynamic actions sync disabled
      const syncActionUse = false; // game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-policy-action-use");
      const syncHD = utils.getSetting<boolean>("dynamic-sync-policy-hitdice");
      const syncSpellsPrepared = utils.getSetting<boolean>("dynamic-sync-policy-spells-prepared");
      const isDDBItem = document.flags.ddbimporter?.id;
      const customItem = document.flags.ddbimporter?.custom || false;

      const customNameAllowed = DICTIONARY.types.inventory.includes(document.type) || document.flags.ddbimporter?.action;
      if (!customItem && update.name && customNameAllowed) {
        updateDDBCustomNames(parentActor, [document.toObject() as unknown as I5eInventoryItem]);
      }

      logger.debug("active update item details", { action, syncActionUse, isDDBItem });
      // is this a DDB action, or do we treat this as an item?
      if (action && syncActionUse && isDDBItem) {
        if (update.system?.uses) {
          logger.debug("Updating action uses", update);
          updateDDBActionUseStatus(parentActor, [foundry.utils.duplicate(document) as unknown as (I5eInventoryItem | I5eFeatItem)]);
        } else {
          resolve([]);
        }
      } else if (document.type === "class" && syncHD && foundry.utils.hasProperty(update, "system.hd.spent")) {
        logger.debug("Updating hitdice on DDB");
        resolve(updateDDBHitDice(parentActor, document, update));
      } else if (document.type === "spell" && syncSpellsPrepared
        && document.system.prepared === CONFIG.DND5E.spellPreparationStates.prepared.value
      ) {
        logger.debug("Updating DDB SpellsPrepared...");
        updateSpellPrep(parentActor, document).then((results: ISyncResult[]) => {
          logger.debug("Spell prep results", results);
          const failures = results.find((result) => result.success !== true);
          const ddbCharacterOptions: DDBCharacterImportOptions = {
            currentActor: parentActor,
            characterId: null,
            selectResources: false,
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
async function activeUpdateAddOrDeleteItem(document: TImporterItem, state: string) {
  pruneRecentEvents(recentCharacterDeletes as Map<number, IRecentCharacterDelete>);
  pruneRecentEvents(recentPartyDeletes as Map<number, IRecentPartyDelete>);

  const parentActor = document.parent as TSyncCharacterActor;
  if (!parentActor) return [];

  const ignore = foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemUpdate") ?? false;
  if (ignore) return [];

  const syncEquipment = utils.getSetting<boolean>("dynamic-sync-policy-equipment");
  if (!syncEquipment) return [];

  const action = document.flags.ddbimporter?.action || ["feat", "class", "subclass", "spell", "background", "race"].includes(document.type);
  if (action) return [];

  const ddbItemId = foundry.utils.getProperty(document, "flags.ddbimporter.id") as number | undefined;

  // Item moved into a party group actor
  if (state === "CREATE" && parentActor.type === "group") {
    const campaignId = foundry.utils.getProperty(parentActor, `flags.ddbimporter.${PARTY_CAMPAIGN_FLAG}`) as string | undefined;
    if (!campaignId || !ddbItemId) return [];

    const ownerStill = findCharacterOwningDDBItem(ddbItemId);
    const cached = recentCharacterDeletes.get(ddbItemId);
    const ownerActor = ownerStill?.actor ?? cached?.actor ?? null;
    if (!ownerActor) {
      logger.warn(`Party CREATE for DDB item ${ddbItemId} but no originating character found`);
      return [];
    }
    recentCharacterDeletes.delete(ddbItemId);

    logger.debug(`Item ${document.name} moved to party ${campaignId}`);
    return moveDDBEquipment(ownerActor, [{
      itemId: ddbItemId,
      containerEntityId: parseInt(campaignId),
      containerEntityTypeId: PARTY_CONTAINER_ENTITY_TYPE_ID,
      name: document.name,
    }]);
  }

  // Item removed from a party group actor
  if (state === "DELETE" && parentActor.type === "group") {
    const campaignId = foundry.utils.getProperty(parentActor, `flags.ddbimporter.${PARTY_CAMPAIGN_FLAG}`) as string | undefined;
    if (!campaignId || !ddbItemId) return [];

    const charNow = findCharacterOwningDDBItem(ddbItemId);
    if (charNow) {
      const targetCharacterId = parseInt(charNow.actor.flags.ddbimporter.dndbeyond.characterId);
      logger.debug(`Item ${document.name} pulled from party to character ${charNow.actor.name}`);
      return moveDDBEquipment(charNow.actor, [{
        itemId: ddbItemId,
        containerEntityId: targetCharacterId,
        containerEntityTypeId: CHARACTER_CONTAINER_ENTITY_TYPE_ID,
        name: document.name,
      }]);
    }

    // Stash so a paired character-create can still claim it within the TTL
    recentPartyDeletes.set(ddbItemId, { actor: parentActor, campaignId, ts: Date.now() });
    return [];
  }

  // From here we only care about character actors with active update enabled
  if (parentActor.type !== "character") return [];
  const actorActiveUpdate = foundry.utils.getProperty(parentActor, "flags.ddbimporter.activeUpdate");
  if (!actorActiveUpdate) return [];

  // Item created on a character
  if (state === "CREATE") {
    if (ddbItemId) {
      // Maybe pulled from a party
      const partyActor = findPartyActorContainingDDBItem(ddbItemId);
      const cachedPartyDelete = recentPartyDeletes.get(ddbItemId);
      const sourceCampaignId = (partyActor
        ? foundry.utils.getProperty(partyActor, `flags.ddbimporter.${PARTY_CAMPAIGN_FLAG}`)
        : cachedPartyDelete?.campaignId) as string | undefined;
      if (sourceCampaignId) {
        recentPartyDeletes.delete(ddbItemId);
        const targetCharacterId = parseInt(getCharacterId(parentActor));
        logger.debug(`Item ${document.name} pulled to character ${parentActor.name} from party ${sourceCampaignId}`);
        return moveDDBEquipment(parentActor, [{
          itemId: ddbItemId,
          containerEntityId: targetCharacterId,
          containerEntityTypeId: CHARACTER_CONTAINER_ENTITY_TYPE_ID,
          name: document.name,
        }]);
      }
    }
    logger.debug(`Creating item`, document);
    return addDDBEquipment(parentActor, [document.toObject() as unknown as I5eInventoryItem]);
  }

  // Item deleted from a character
  if (state === "DELETE") {
    if (ddbItemId) {
      const partyActor = findPartyActorContainingDDBItem(ddbItemId);
      if (partyActor) {
        const campaignId = foundry.utils.getProperty(partyActor, `flags.ddbimporter.${PARTY_CAMPAIGN_FLAG}`) as string | undefined;
        if (campaignId) {
          logger.debug(`Item ${document.name} moved from character ${parentActor.name} to party ${campaignId}`);
          return moveDDBEquipment(parentActor, [{
            itemId: ddbItemId,
            containerEntityId: parseInt(campaignId),
            containerEntityTypeId: PARTY_CONTAINER_ENTITY_TYPE_ID,
            name: document.name,
          }]);
        }
      }

      // Defer: a paired party CREATE may still arrive within the TTL
      const documentSnapshot = document.toObject() as unknown as I5eInventoryItem;
      recentCharacterDeletes.set(ddbItemId, { actor: parentActor, document: documentSnapshot, ts: Date.now() });
      return new Promise((resolve) => {
        setTimeout(async () => {
          const stash = recentCharacterDeletes.get(ddbItemId);
          if (!stash) {
            resolve([]);
            return;
          }
          recentCharacterDeletes.delete(ddbItemId);
          logger.debug(`Deleting item (no party claim within ${RECENT_EVENT_TTL_MS}ms)`, documentSnapshot);
          const result = await removeDDBEquipment(stash.actor, [documentSnapshot]);
          resolve(result);
        }, RECENT_EVENT_TTL_MS);
      });
    }
    logger.debug(`Deleting item`, document);
    return removeDDBEquipment(parentActor, [document.toObject() as unknown as I5eInventoryItem]);
  }

  return [];
}

// called when effects are added/deleted/updated
async function activeUpdateEffectTrigger(document: ActiveEffect.Known, state: string) {
  return new Promise((resolve) => {
    const promises: Promise<any>[] = [];

    const syncConditions = utils.getSetting<boolean>("dynamic-sync-policy-condition");
    // we check to see if this is actually an embedded item
    const parentActor = document.parent as TSyncCharacterActor;
    const actorActiveUpdate = parentActor && parentActor.flags.ddbimporter?.activeUpdate;

    if (parentActor && actorActiveUpdate && syncConditions) {
      logger.debug(`Preparing to ${state.toLowerCase()} condition on DDB...`);
      // is it a condition?
      // is it a suitable type?
      const condition = getCondition(document?.name);
      // exhaustion is a special case, but also a condition effect, handled by character update
      const notExhaustion = condition ? condition.ddbId !== 4 : false;

      // to do - we should manage the statuses better here

      if (condition && notExhaustion) {
        logger.debug(`Attempting to ${state.toLowerCase()} Condition`, document);
        switch (state) {
          case "CREATE":
            condition.applied = true;
            promises.push(updateDDBCondition(parentActor, condition));
            break;
          case "UPDATE":
            condition.applied = !document.disabled;
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
    Hooks.on("updateActor", (document, update) => activeUpdateActor(document as unknown as TSyncCharacterActor, update));
    // the hook passes an Item.Implementation, TImporterItem is our flag-aware view of it
    Hooks.on("updateItem", (document, update) => activeUpdateUpdateItem(document as unknown as TImporterItem, update));
    Hooks.on("createItem", (document) => activeUpdateAddOrDeleteItem(document as unknown as TImporterItem, "CREATE"));
    Hooks.on("deleteItem", (document) => activeUpdateAddOrDeleteItem(document as unknown as TImporterItem, "DELETE"));
    Hooks.on("createActiveEffect", (document) => activeUpdateEffectTrigger(document as ActiveEffect.Known, "CREATE"));
    Hooks.on("updateActiveEffect", (document) => activeUpdateEffectTrigger(document as ActiveEffect.Known, "UPDATE"));
    Hooks.on("deleteActiveEffect", (document) => activeUpdateEffectTrigger(document as ActiveEffect.Known, "DELETE"));
  }
}
