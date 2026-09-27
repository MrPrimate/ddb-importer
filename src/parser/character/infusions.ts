import { logger } from "../../lib/_module";

/** The ids an enchantment profile rides (SetFields at runtime). */
interface IProfileRiders {
  activity?: Iterable<string>;
  effect?: Iterable<string>;
  item?: Iterable<string>;
}

/** A rider source activity on the origin item, as far as the copy reads it. */
interface IRiderSourceActivity {
  toObject(): Record<string, unknown>;
  effects?: { _id: string; uuid?: string | null }[];
}

/** The item the enchant activity lives on: where rider sources are read from. */
interface IRiderOrigin {
  system?: { activities?: { get(id: string): IRiderSourceActivity | undefined } };
  effects?: { get(id: string): { toObject(): unknown } | undefined };
}

/** The enchanted item: its existing ids must not be reused by a copy. */
interface IRiderTarget {
  system?: { activities?: { keys(): Iterable<string> } };
  effects?: { keys(): Iterable<string> };
}

interface IRiderCopyOptions {
  riders: IProfileRiders;
  origin: IRiderOrigin;
  target: IRiderTarget;
  appliedId: string;
  /** The applied enchantment's own `origin`, which dnd5e 5.x gives every rider effect copy. */
  effectOrigin: string;
}

/**
 * A stable id for a copy of `sourceId` on an item: the first 12 characters of the source plus a
 * counter, skipping any id in `taken` (which it then joins). The same source on the same freshly
 * recreated item gets the same id on every import.
 */
export function stableCopyId(sourceId: string, taken: Set<string>): string {
  const stem = sourceId.slice(0, 12).padEnd(12, "0");
  for (let n = 0; n < 100; n++) {
    const id = `${stem}Cp${String(n).padStart(2, "0")}`;
    if (!taken.has(id)) {
      taken.add(id);
      return id;
    }
  }
  return foundry.utils.randomID();
}

/**
 * The rider documents an applied enchantment brings with it, built from the profile's stored
 * rider ids with the data dnd5e 5.x's `ActiveEffect5e#createRiderEnchantments` gives its copies:
 * rider activities copied onto the target, the effects those activities apply (kept under their
 * own ids when the target lacks them), and the profile's rider effects, all tied to the applied
 * enchantment through `flags.dnd5e.dependentOn` so dnd5e removes them with it. Unlike dnd5e's
 * random ids, each copy's id derives from its source, so a re-import reproduces it.
 */
export function buildRiderCopies({ riders, origin, target, appliedId, effectOrigin }: IRiderCopyOptions): {
  activities: Record<string, Record<string, unknown>>;
  effects: I5eEffectData[];
} {
  const takenActivities = new Set(target.system?.activities?.keys() ?? []);
  const takenEffects = new Set([...(target.effects?.keys() ?? []), appliedId]);
  const activities: Record<string, Record<string, unknown>> = {};
  const effects: I5eEffectData[] = [];

  for (const id of riders.activity ?? []) {
    const source = origin.system?.activities?.get(id);
    if (!source) continue;
    const copy = source.toObject();
    copy._id = stableCopyId(id, takenActivities);
    foundry.utils.setProperty(copy, "flags.dnd5e.dependentOn", appliedId);
    activities[copy._id as string] = copy;

    // effects the rider activity applies must exist on the item it now lives on
    for (const ref of source.effects ?? []) {
      if (ref.uuid || takenEffects.has(ref._id)) continue;
      const effect = origin.effects?.get(ref._id)?.toObject() as I5eEffectData | undefined;
      if (!effect) continue;
      takenEffects.add(ref._id);
      effects.push(effect);
    }
  }

  for (const id of riders.effect ?? []) {
    const effect = origin.effects?.get(id)?.toObject() as I5eEffectData | undefined;
    if (!effect) continue;
    effect._id = stableCopyId(id, takenEffects);
    const dnd5eFlags = (effect.flags as Record<string, unknown> | undefined)?.dnd5e as Record<string, unknown> | undefined;
    if (dnd5eFlags) delete dnd5eFlags.rider;
    effect.origin = effectOrigin;
    effects.push(effect);
  }

  effects.forEach((effect) => foundry.utils.setProperty(effect, "flags.dnd5e.dependentOn", appliedId));
  return { activities, effects };
}

/**
 * Remove the applied copies of an enchantment profile already on an item, with the rider
 * activities and effects that depend on them, so the import applies the profile exactly once.
 *
 * "Retain Active Effects" carries the previous import's applied copy over onto the recreated item,
 * and before this every re-import added another copy beside it. dnd5e 5.3 stamps no profile flag
 * on an applied copy, so the import stamps `flags.dnd5e.enchantmentProfile` itself; copies from
 * before that are found by their stable id stem. Riders go first: dnd5e also deletes an
 * enchantment's dependents when the enchantment is deleted, and removing them beforehand leaves
 * that cascade nothing to race.
 */
export async function removeAppliedCopies(item: TImporterItem, profileId: string): Promise<void> {
  const effects = Array.from((item.effects ?? []) as Iterable<ActiveEffect.Implementation>);
  const stem = `${profileId.slice(0, 12).padEnd(12, "0")}Cp`;
  const applied = effects.filter((e) => e.id !== profileId
    && (foundry.utils.getProperty(e, "flags.dnd5e.enchantmentProfile") === profileId
      || (e.type === "enchantment" && (e.id ?? "").startsWith(stem))));
  if (applied.length === 0) return;

  // dnd5e stamps a dependent with the bare id on the same item, or with the uuid
  const refs = new Set(applied.flatMap((e) => [e.id, e.uuid]).filter((ref): ref is string => !!ref));
  const dependsOnApplied = (doc: unknown) =>
    refs.has(foundry.utils.getProperty(doc as object, "flags.dnd5e.dependentOn") as string);

  const activities = Array.from(
    ((item.system as { activities?: Iterable<{ id?: string }> }).activities ?? []) as Iterable<{ id?: string }>,
  );
  const activityUpdate: Record<string, unknown> = {};
  for (const riderActivity of activities.filter(dependsOnApplied)) {
    if (riderActivity.id) activityUpdate[`system.activities.${riderActivity.id}`] = _del;
  }
  if (!foundry.utils.isEmpty(activityUpdate)) await item.update(activityUpdate as unknown as Item.UpdateData);

  const riderEffectIds = effects.filter((e) => !applied.includes(e) && dependsOnApplied(e)).map((e) => e.id);
  const ids = [...riderEffectIds, ...applied.map((e) => e.id)].filter((id): id is string => !!id);
  logger.debug(`Replacing ${applied.length} applied copies of enchantment ${profileId} on ${item.name}`, { ids });
  if (riderEffectIds.length > 0) await item.deleteEmbeddedDocuments("ActiveEffect", riderEffectIds as string[]);
  await item.deleteEmbeddedDocuments("ActiveEffect", applied.map((e) => e.id).filter((id): id is string => !!id));
}

/**
 * Create the applied copy of an enchantment profile on an item at import time. dnd5e 5.3 treats an
 * enchantment whose origin is another document as applied, so the profile's own `transfer: false`
 * is kept.
 *
 * The applied copy and its riders get ids that are stable across re-imports, so favorites and
 * other references to them survive. The create operation carries no `dnd5e` profile options,
 * which leaves dnd5e's own rider step (random ids) idle; the riders come from
 * `buildRiderCopies` instead.
 */
export async function linkSelectedEnchantment(item: TImporterItem, effect: ActiveEffect.Implementation, activity: any, featureName: string) {
  const effectData = effect.toObject() as unknown as I5eEffectData;
  const profileId = effectData._id;
  if (profileId) await removeAppliedCopies(item, profileId);
  const appliedId = stableCopyId(profileId ?? "enchantment", new Set(item.effects?.keys() ?? []));
  effectData._id = appliedId;
  effectData.origin = activity.uuid;
  // lets the next import find and replace this copy (removeAppliedCopies)
  foundry.utils.setProperty(effectData, "flags.dnd5e.enchantmentProfile", profileId);

  const profile = (activity.effects as { _id: string; riders?: IProfileRiders }[] | undefined)
    ?.find((e) => e._id === profileId);
  const riders = profile?.riders ?? {};
  // item riders are compendium documents dnd5e creates with contents; leave every rider of such
  // a profile to dnd5e (random ids)
  const dnd5eRiders = Array.from(riders.item ?? []).length > 0;

  const createOperation = {
    parent: item,
    keepId: true,
    keepOrigin: true,
    ...(dnd5eRiders ? { dnd5e: { enchantmentProfile: profileId, activityId: activity._id } } : {}),
  } as unknown as any;

  const applied = await ActiveEffect.create(effectData as any, createOperation) as unknown as { isAppliedEnchantment?: boolean } | undefined;
  logger.debug(`Applied enchantment effect from ${featureName} to ${item.name}`, {
    effect: effectData,
    applied,
  });

  // dnd5e only brings riders along with an applied enchantment (one whose origin is not the item)
  if (dnd5eRiders || !applied?.isAppliedEnchantment) return;

  const { activities, effects } = buildRiderCopies({
    riders,
    origin: activity.item,
    target: item as unknown as IRiderTarget,
    appliedId,
    effectOrigin: activity.uuid,
  });
  if (!foundry.utils.isEmpty(activities)) {
    await item.update({ "system.activities": activities } as unknown as Item.UpdateData);
  }
  if (effects.length > 0) {
    await item.createEmbeddedDocuments("ActiveEffect", effects as unknown as ActiveEffect.CreateData[], { keepId: true });
  }
}

/**
 * Does every `targetItemMatches` clause hold for the item? An array-valued field (the weapon's
 * scraped `classFeatures`, used to find the DDB-marked pact weapon) matches when it contains the
 * value; anything else must equal it.
 */
export function matchFields(item: TAll5eDocuments, flags: IDDBImporterTransferEnchantmentTargetItemMatches[]): boolean {
  for (const flag of flags) {
    const itemValue = foundry.utils.getProperty(item, flag.field);
    if (itemValue === undefined) return false;
    if (Array.isArray(itemValue)) {
      if (!itemValue.includes(flag.value)) return false;
    } else if (itemValue !== flag.value) {
      return false;
    }
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

    const enchantActivities = item.system.activities.getByType("enchant") as unknown as I5eEnchantActivity[];
    const activity = enchantActivities.find((a) => a._id === enchantmentFlag.activityId);

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
    const infusionActivities = infusionFeature.system.activities.getByType("enchant") as unknown as I5eEnchantActivity[];

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
