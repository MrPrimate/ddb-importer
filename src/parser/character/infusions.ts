import { logger } from "../../lib/_module";

async function linkSelectedEnchantment(item: TImporterItem, effect: ActiveEffect.Implementation, activity: any, featureName: string) {
  const effectData = effect.toObject() as unknown as I5eEffectData;
  effectData.origin = activity.uuid;

  const createOperation = {
    parent: item,
    keepOrigin: true,
    dnd5e: {
      enchantmentProfile: effectData._id,
      activityId: activity._id,
    },
  } as unknown as any;

  const applied = await ActiveEffect.create(effectData as any, createOperation);
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


export async function linkSelectedEnchantments(actor: TImporterActor) {
  const items = actor.getEmbeddedCollection("Item");

  for (const item of items) {
    const enchantmentFlag = foundry.utils.getProperty(item, "flags.ddbimporter.transferEnchantment") as IDDBImporterTransferEnchantmentFlags;
    if (!enchantmentFlag) continue;

    logger.debug(`Found enchantment transfer flag on item ${item.name}`, {
      item,
      enchantmentFlag,
    });

    const effect = item.getEmbeddedCollection("ActiveEffect")
      .find((e: ActiveEffect.Implementation) => e._id === enchantmentFlag.effectId);

    if (!effect) continue;

    // loot items don't have activities, so we can't link the enchantment to them
    if (!item.system.activities) continue;

    const activity: I5eEnchantActivity = item.system.activities.getByType("enchant")
      .find((a: I5eEnchantActivity) => a._id === enchantmentFlag.activityId);

    if (!activity) continue;

    let targetItem: TImporterItem | null = null;

    if ("equipped" in item.system && item.system.equipped === false) continue;
    if ("attuned" in item.system && item.system.attuned === false) {
      if (item.system.attunement === "required") continue;
    }
    if (enchantmentFlag.targetItemId === "self") {
      targetItem = item as TImporterItem;
    } else if (enchantmentFlag.targetItemName) {
      targetItem = items.find((i) => ((foundry.utils.getProperty(i, "flags.ddbimporter.originalName") as string) ?? i.name) === enchantmentFlag.targetItemName) as TImporterItem ?? null;
    } else if (enchantmentFlag.targetItemMatches) {
      const matchedFields = enchantmentFlag.targetItemMatches;
      const targetItems = items.filter((i) => matchFields(i as unknown as TAll5eDocuments, matchedFields));
      if (targetItems.length === 0) {
        logger.warn(`No items matched for enchantment transfer on ${item.name}. Skipping enchantment transfer.`, {
          item,
          enchantmentFlag,
          items,
        });
      } else {
        for (const matchedItem of targetItems) {
          await linkSelectedEnchantment(matchedItem as TImporterItem, effect, activity, item.name);
        }
        continue;
      }
    }

    if (!targetItem) continue;

    await linkSelectedEnchantment(targetItem, effect, activity, item.name);
  }
}

export async function createInfusedItems(ddb: IDDBData, actor: TImporterActor) {
  if (!ddb.infusions?.item || !ddb.infusions?.infusions?.definitionData) return;

  const rollData = actor.getRollData();

  for (const i of actor.getEmbeddedCollection("Item")) {

    const item = i as TImporterItem;
    const infusedItem = ddb.infusions.item.find((mapping) =>
      mapping.itemId === item.flags?.ddbimporter?.definitionId
      && mapping.inventoryMappingId === item.flags?.ddbimporter?.id
      && mapping.itemTypeId === item.flags?.ddbimporter?.definitionEntityTypeId,
    );
    if (!infusedItem) continue;
    // add infused item effect
    const infusionFeature = actor.getEmbeddedCollection("Item").find((i) =>
      foundry.utils.getProperty(i, "flags.ddbimporter.dndbeyond.defintionKey") === infusedItem.definitionKey,
    );

    if (!infusionFeature?.system.activities) continue;
    const infusionActivities: I5eEnchantActivity[] = infusionFeature.system.activities.getByType("enchant");

    for (const activity of infusionActivities) {
      const activityEffects = activity.effects ?? [];
      const infusionEffectCount = activityEffects.length;
      const artificerLevel = (rollData.classes as Record<string, any>)?.artificer?.levels ?? 0;

      const infusionEffectIds = activityEffects.filter((e) => {
        if (infusionEffectCount === 1) return true;
        // a null minimum matches the original >= null coercion (treated as 0)
        const minLevel = e.level?.min ?? 0;
        const maxLevel = e.level?.max ?? null;
        const appropriateLevel = artificerLevel >= minLevel
          && (maxLevel === null || artificerLevel <= maxLevel);
        return appropriateLevel;
      }).map((e) => e._id);

      const infusionEffects = infusionFeature.getEmbeddedCollection("ActiveEffect")
        .filter((e: ActiveEffect.Implementation) => e._id !== null && infusionEffectIds.includes(e._id));

      if (infusionEffects.length === 0) continue;

      for (const infusionEffect of infusionEffects) {
        await linkSelectedEnchantment(item, infusionEffect, activity, infusionFeature.name);
      }
    }
  }

}
