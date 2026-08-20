import utils from "../lib/Utils";

/**
 * Pure data extraction and payload-shaping helpers for the DDB character sync
 * (src/updater/character.ts). Everything here computes values from actor/item
 * data without touching the network, settings, or notifications - keep it that
 * way, this module is the unit-testable half of the updater.
 */

// DDB container entity type ids. The character itself acts as the default
// container for inventory; party (group actor) inventories use their own id.
export const CHARACTER_CONTAINER_ENTITY_TYPE_ID = 1581111423;
export const PARTY_CONTAINER_ENTITY_TYPE_ID = 618115330;

export function getCharacterId(actor: TSyncCharacterActor): string {
  const characterId = actor.flags.ddbimporter?.dndbeyond?.characterId;
  if (!characterId) {
    throw new Error(`Actor ${actor.name} is missing a D&D Beyond character id, please re-import the character`);
  }
  return characterId;
}

export function getContainerItems(actor: TSyncCharacterActor): TImporterItem[] {
  const characterId = parseInt(getCharacterId(actor));
  return actor.items
    .filter((item: TImporterItem) =>
      foundry.utils.hasProperty(item, "flags.ddbimporter.id")
      && foundry.utils.getProperty(item, "flags.ddbimporter.containerEntityId") === characterId
      && !foundry.utils.getProperty(item, "flags.ddbimporter.ignoreItemImport")
      && !foundry.utils.getProperty(item, "system.container"),
    );
}

export function setDefaultActorContainerFlags(actor: TSyncCharacterActor, item: I5eItemData) {
  const characterId = getCharacterId(actor);
  foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", parseInt(characterId));
  foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityTypeId", CHARACTER_CONTAINER_ENTITY_TYPE_ID);
}

export function setContainerDetails(
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

export function getFoundryItems(actor: TSyncCharacterActor): I5eItemData[] {
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

export function getCustomItemDescription(text: string) {
  return utils.stripHtml(text).substring(0, 2055);
}

export function getCurrencyValue(actor: TSyncCharacterActor) {
  const coins = actor.system.currency ?? {};
  return {
    pp: Number.isInteger(coins.pp) ? coins.pp : 0,
    gp: Number.isInteger(coins.gp) ? coins.gp : 0,
    ep: Number.isInteger(coins.ep) ? coins.ep : 0,
    sp: Number.isInteger(coins.sp) ? coins.sp : 0,
    cp: Number.isInteger(coins.cp) ? coins.cp : 0,
  };
}

export function getValidContainer(actor: TSyncCharacterActor, containerEntityId: number | string) {
  if (!containerEntityId) return undefined;
  if (parseInt(String(containerEntityId)) === parseInt(getCharacterId(actor))) return true;
  const containers = actor.items.filter((i) =>
    foundry.utils.getProperty(i, "flags.ddbimporter.dndbeyond.isContainer") === true,
  );
  return containers.find((c) => parseInt(foundry.utils.getProperty(c, "flags.ddbimporter.id") as string) === parseInt(String(containerEntityId)));
}

export interface IGenerateItemsToAddResult {
  containerEntityId: number;
  containerEntityTypeId: number;
  entityId: number;
  entityTypeId: number;
  quantity: number;
}

export function generateItemsToAdd<T extends I5eInventoryItem>(actor: TSyncCharacterActor, itemsToAdd: T[]) {
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
        : CHARACTER_CONTAINER_ENTITY_TYPE_ID;
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
