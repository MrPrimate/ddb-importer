import { logger } from "../../lib/_module.mjs";

async function linkSelectedEnchantment(item, effect, activity, featureName) {
  const effectData = effect.toObject();
  effectData.origin = activity.uuid;

  const applied = await ActiveEffect.create(effectData, {
    parent: item,
    keepOrigin: true,
    dnd5e: {
      enchantmentProfile: effectData._id,
      activityId: activity._id,
    },
  });
  logger.debug(`Applied enchantment effect from ${featureName.name} to ${item.name}`, {
    effect: effectData,
    applied,
  });
}

export async function linkSelectedEnchantments(actor) {
  const items = actor.getEmbeddedCollection("Item");

  for (const item of items) {
    const enchantmentFlag = foundry.utils.getProperty(item, "flags.ddbimporter.transferEnchantment");
    if (!enchantmentFlag) continue;

    const effect = item.getEmbeddedCollection("ActiveEffect")
      .find((e) => e._id === enchantmentFlag.effectId);

    if (!effect) continue;
    const activity = item.system.activities.getByType("enchant")
      .find((a) => a._id === enchantmentFlag.activityId);

    if (!activity) continue;

    const targetItem = enchantmentFlag.targetItemId === "self"
      ? item
      : items.get(enchantmentFlag.targetItemId) ?? items.find((i) =>
        i.flags?.ddbimporter?.enchantmentLinkId === enchantmentFlag.targetItemId);
    if (!targetItem) continue;

    await linkSelectedEnchantment(targetItem, effect, activity, item.name);
  }
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
      const artificerLevel = rollData.classes.artificer?.levels ?? 0;

      const infusionEffectIds = activity.effects.filter((e) => {
        if (infusionEffectCount === 1) return true;
        const appropriateLevel = artificerLevel >= e.level.min
          && (artificerLevel <= e.level.max || e.level.max === null);
        return appropriateLevel;
      }).map((e) => e._id);

      const infusionEffects = (infusionFeature.getEmbeddedCollection("ActiveEffect") ?? [])
        .filter((e) => infusionEffectIds.includes(e._id));

      if (infusionEffects.length === 0) continue;

      for (const infusionEffect of infusionEffects) {
        await linkSelectedEnchantment(item, infusionEffect, activity, infusionFeature.name);
      }
    }
  }

}
