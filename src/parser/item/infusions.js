import DDBHelper from "../../lib/DDBHelper.js";
import { logger } from "../../lib/_module.mjs";


function getInfusionItemMap(ddb, item) {
  if (!ddb.infusions?.item) return undefined;
  return ddb.infusions.item.find((mapping) =>
    mapping.itemId === item.flags.ddbimporter.definitionId
    && mapping.inventoryMappingId === item.flags.ddbimporter.id
    && mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId,
  );
}

function getInfusionDetail(ddb, definitionKey) {
  if (!ddb.infusions?.infusions?.definitionData) return undefined;
  return ddb.infusions.infusions.definitionData.find(
    (infusion) => infusion.definitionKey === definitionKey,
  );
}

export function parseInfusion(ddb, character, foundryItem, ddbItem) {
  // get item mapping
  const infusionItemMap = getInfusionItemMap(ddb, foundryItem);
  foundryItem.flags.infusions = { maps: [], applied: [], infused: false };

  const infusionDetail = infusionItemMap
    ? getInfusionDetail(ddb, infusionItemMap.definitionKey)
    : undefined;

  if (infusionItemMap && infusionDetail) {
    logger.debug(`Infusion detected for ${foundryItem.name}`);

    // add infusion flags
    foundryItem.flags.infusions.infused = true;

    // if item is loot, lets move it to equipment/trinket so effects will apply
    if (foundryItem.type === "loot") {
      foundryItem.type = "equipment";
      foundryItem.system.armor = {
        type: "trinket",
        value: 10,
        dex: null,
      };
      // infusions will over ride the can equip status, so just check for equipped
      foundryItem.system.equipped = ddbItem.equipped;
    }

    // check to see if we need to fiddle attack modifiers on infused weapons
    // this still needs to be moved to an enchantment effect
    if (foundryItem.type === "weapon") {
      const intSwap = DDBHelper.filterBaseModifiers(ddb, "bonus", { subType: "magic-item-attack-with-intelligence" }).length > 0;
      if (intSwap) {
        const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
        const mockAbility = foundry.utils.getProperty(foundryItem, "flags.ddbimporter.dndbeyond.ability");
        if (characterAbilities.int.value > characterAbilities[mockAbility].value) {
          foundryItem.system.ability = "int";
        }
      }
    }
  } else if (infusionItemMap && !infusionDetail) {
    logger.warn(`${foundryItem.name} marked as infused but no infusion info found`);
  }
  return foundryItem;

}


export async function createInfusedItems(ddb, actor) {
  if (!ddb.infusions?.item || !ddb.infusions?.infusions?.definitionData) return;

  const rollData = actor.getRollData();

  for (const item of actor.getEmbeddedCollection("Item")) {

    const infusedItem = ddb.infusions.item.find((mapping) =>
      mapping.itemId === item.flags?.ddbimporter?.definitionId
      && mapping.inventoryMappingId === item.flags?.ddbimporter?.id
      && mapping.itemTypeId === item.flags?.ddbimporter?.definitionEntityTypeId,
    );
    if (!infusedItem) continue;
    // add infused item effect
    const infusionFeature = actor.items.find((i) =>
      foundry.utils.getProperty(i, "flags.ddbimporter.dndbeyond.defintionKey") === infusedItem.definitionKey,
    );

    if (!infusionFeature) continue;
    const infusionActivities = infusionFeature.system.activities.getByType("enchant");

    for (const activity of infusionActivities) {
      const infusionEffectCount = activity.effects.size;

      const infusionEffectIds = activity.effects.filter((e) => {
        if (infusionEffectCount === 1) return true;
        const artificerLevel = rollData.classes.artificer?.levels ?? 0;
        const appropriateLevel = artificerLevel >= e.level.min
          && (artificerLevel <= e.level.max || e.level.max === null);
        return appropriateLevel;
      }).map((e) => e._id);

      const infusionEffects = (infusionFeature.getEmbeddedCollection("ActiveEffect") ?? [])
        .filter((e) => infusionEffectIds.includes(e._id));

      if (infusionEffects.length === 0) continue;

      for (const infusionEffect of infusionEffects) {
        const effectData = infusionEffect.toObject();
        effectData.origin = activity.uuid;

        const applied = await ActiveEffect.create(effectData, {
          parent: item,
          keepOrigin: true,
        });
        logger.debug(`Applied infusion effect from ${infusionFeature.name} to ${item.name}`, {
          effect: effectData,
          applied,
        });
      }
    }
  }

}
