import { logger } from "../../lib/_module";

interface IAdvancementHolder {
  name?: string | null;
  system: object;
}

/**
 * Moves advancements that a class or species builds from one of its features onto that feature's
 * own document, the way the dnd5e system content places them (a feature granted by a class runs its
 * own advancements at that class's level).
 */
export default class FeatureAdvancements {

  /**
   * Add `advancements` to the document's advancement record, replacing any with the same id. An
   * item stub can carry the array form, which dnd5e migrates to an id-keyed object, so an array is
   * converted first.
   */
  static merge(doc: IAdvancementHolder, advancements: I5eAdvancement[]) {
    if (!("advancement" in doc.system)) return;
    const system = doc.system as { advancement?: unknown };
    const existing = system.advancement;
    const record: Record<string, I5eAdvancement> = Array.isArray(existing)
      ? Object.fromEntries((existing as I5eAdvancement[]).filter((a) => a?._id).map((a) => [a._id, a]))
      : (existing as Record<string, I5eAdvancement> | null | undefined) ?? {};
    for (const advancement of advancements) {
      if (advancement._id) record[advancement._id] = foundry.utils.deepClone(advancement);
    }
    system.advancement = record;
  }

  /** Copies of the advancements without the per-character `value`, for compendium documents. */
  static withoutValues(advancements: I5eAdvancement[]): I5eAdvancement[] {
    return advancements.map((advancement) => {
      const data = foundry.utils.deepClone(advancement);
      delete (data as { value?: unknown }).value;
      return data;
    });
  }

  /**
   * Write advancements onto compendium feature documents, replacing any advancement with the same
   * id and leaving the document's other advancements alone. Patches for the same document merge.
   */
  static async write(patches: IDDBFeatureAdvancementPatch[]) {
    const byUuid = new Map<string, Record<string, I5eAdvancement>>();
    for (const patch of patches) {
      const record = byUuid.get(patch.uuid) ?? {};
      for (const advancement of patch.advancements) {
        if (advancement._id) record[advancement._id] = advancement;
      }
      byUuid.set(patch.uuid, record);
    }
    for (const [uuid, record] of byUuid) {
      if (Object.keys(record).length === 0) continue;
      try {
        const doc = await fromUuid(uuid) as Item.Implementation | null;
        if (!doc) {
          logger.warn(`Unable to find compendium feature ${uuid} to add its advancements`);
          continue;
        }
        const update: Record<string, unknown> = {};
        for (const [id, advancement] of Object.entries(record)) {
          update[`system.advancement.${id}`] = advancement;
        }
        logger.debug(`Writing ${Object.keys(record).length} advancements to ${doc.name}`, { uuid, record });
        await doc.update(update as Parameters<typeof doc.update>[0], { render: false } as Parameters<typeof doc.update>[1]);
      } catch (error) {
        logger.error(`Error writing feature advancements to ${uuid}`, { error, record });
      }
    }
  }

}
