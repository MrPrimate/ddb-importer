import { logger } from "../../lib/_module";

async function linkSelectedEnchantment(item: Item.Implementation, effect: ActiveEffect.Implementation, activity: any, featureName: string) {
  const effectData = effect.toObject() as unknown as any;
  effectData.origin = activity.uuid;

  const createOperation = {
    parent: item,
    keepOrigin: true,
    dnd5e: {
      enchantmentProfile: effectData._id,
      activityId: activity._id,
    },
  } as unknown as any;

  const applied = await ActiveEffect.create(effectData, createOperation);
  logger.debug(`Applied enchantment effect from ${featureName} to ${item.name}`, {
    effect: effectData,
    applied,
  });
}

function matchFields(item: TAll5eDocuments, flags: IDDBImporterTransferEnchantmentTargetItemMatches[]): boolean {
  for (const flag of flags) {
    const itemValue = foundry.utils.getProperty(item, flag.field);
    if (itemValue === undefined) return false;
    if (itemValue !== flag.value) return false;
  }
  return true;
}


export async function linkSelectedEnchantments(actor: Actor.Implementation) {
  const items = actor.getEmbeddedCollection("Item");

  for (const item of items) {
    const enchantmentFlag = foundry.utils.getProperty(item, "flags.ddbimporter.transferEnchantment") as IDDBImporterTransferEnchantmentFlags;
    if (!enchantmentFlag) continue;

    logger.debug(`Found enchantment transfer flag on item ${item.name}`, {
      item,
      enchantmentFlag,
    });

    const effect = item.getEmbeddedCollection("ActiveEffect")
      .find((e) => e._id === enchantmentFlag.effectId);

    if (!effect) continue;
    // @ts-expect-error - flipping fvtt types
    const activity = item.system.activities.getByType("enchant")
      .find((a) => a._id === enchantmentFlag.activityId);

    if (!activity) continue;

    let targetItem: Item.Implementation | null = null;

    if (enchantmentFlag) {
      if ("equipped" in item.system && item.system.equipped === false) continue;
      if ("attuned" in item.system && item.system.attuned === false) {
        if (item.system.attunement === "required") continue;
      }
      if (enchantmentFlag.targetItemId === "self") {
        targetItem = item;
      } else if (enchantmentFlag.targetItemName) {
        targetItem = items.find((i) => (i.flags.ddbimporter?.originalName ?? i.name) === enchantmentFlag.targetItemName) ?? null;
      } else if (enchantmentFlag.targetItemMatches) {
        const matchedFields = enchantmentFlag.targetItemMatches;
        // @ts-expect-error - flipping fvtt types
        const targetItems = items.filter((i) => matchFields(i, matchedFields));
        if (targetItems.length === 0) {
          logger.warn(`No items matched for enchantment transfer on ${item.name}. Skipping enchantment transfer.`, {
            item,
            enchantmentFlag,
            items,
          });
        } else {
          for (const matchedItem of targetItems) {
            await linkSelectedEnchantment(matchedItem, effect, activity, item.name);
          }
          continue;
        }
      }
    } else {
      targetItem = (items.get(enchantmentFlag.targetItemId) ?? items.find((i) =>
        i.flags?.ddbimporter?.enchantmentLinkId === enchantmentFlag.targetItemId)) as Item.Implementation | null;
    }

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
