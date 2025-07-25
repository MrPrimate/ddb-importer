import { logger } from "../../lib/_module.mjs";

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
        const effectData = infusionEffect.toObject();
        effectData.origin = activity.uuid;

        const applied = await ActiveEffect.create(effectData, {
          parent: item,
          keepOrigin: true,
          dnd5e: {
            enchantmentProfile: effectData._id,
            activityId: activity._id,
          },
        });
        logger.debug(`Applied infusion effect from ${infusionFeature.name} to ${item.name}`, {
          effect: effectData,
          applied,
        });
      }
    }
  }

}
