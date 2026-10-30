import { logger, utils } from "../../lib/_module";

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

  /**
   * Add an advancement to the list a feature holds, with an id derived from its owner (`owner`, e.g.
   * class and feature ids), its shape and how many of its type the feature already holds, so a
   * re-import writes the same ids over the previous ones. `withClassRestriction` adds the class
   * restriction to the seed; species ids are seeded without it, and changing a seed changes the ids
   * already written to documents and compendiums.
   */
  static hold(
    held: I5eAdvancement[],
    advancement: I5eAdvancement,
    owner: (string | number)[],
    { withClassRestriction = false }: { withClassRestriction?: boolean } = {},
  ) {
    const configuration = (advancement.configuration ?? {}) as Record<string, unknown>;
    const seed = [
      ...owner,
      advancement.type,
      advancement.level ?? "",
      configuration.mode ?? "",
      ...(withClassRestriction ? [advancement.classRestriction ?? ""] : []),
      advancement.name ?? "",
      held.filter((a) => a.type === advancement.type).length,
    ].join("|");
    advancement._id = utils.stableID(seed);
    held.push(advancement);
  }

  /** Copies of the advancements without the per-character `value`, for compendium documents. */
  static withoutValues(advancements: I5eAdvancement[]): I5eAdvancement[] {
    return advancements.map((advancement) => {
      const data = foundry.utils.deepClone(advancement);
      delete (data as { value?: unknown }).value;
      return data;
    });
  }

  static OWNER_FLAG = "flags.ddbimporter.advancementOwner";

  /**
   * Write advancements onto compendium feature documents, replacing any advancement with the same
   * id and leaving the document's other advancements alone. Patches for the same document merge.
   *
   * A patch with an `owner` tags its advancements with it and deletes that owner's advancements
   * the patch no longer carries, so one whose id changed, or that is no longer built, does not
   * linger beside its replacement. A patch's `remove` ids are deleted outright.
   */
  static async write(patches: IDDBFeatureAdvancementPatch[]) {
    const byUuid = new Map<string, { record: Record<string, I5eAdvancement>; owners: Set<string>; remove: Set<string> }>();
    for (const patch of patches) {
      const entry = byUuid.get(patch.uuid) ?? { record: {}, owners: new Set(), remove: new Set() };
      for (const advancement of patch.advancements) {
        if (!advancement._id) continue;
        const data = patch.owner
          ? foundry.utils.mergeObject(foundry.utils.deepClone(advancement), { [FeatureAdvancements.OWNER_FLAG]: patch.owner }) as I5eAdvancement
          : advancement;
        entry.record[advancement._id] = data;
      }
      if (patch.owner) entry.owners.add(patch.owner);
      for (const id of patch.remove ?? []) entry.remove.add(id);
      byUuid.set(patch.uuid, entry);
    }
    for (const [uuid, { record, owners, remove }] of byUuid) {
      try {
        const doc = await fromUuid(uuid) as Item.Implementation | null;
        if (!doc) {
          if (Object.keys(record).length > 0) logger.warn(`Unable to find compendium feature ${uuid} to add its advancements`);
          continue;
        }
        const update: Record<string, unknown> = {};
        // the live system.advancement is an AdvancementCollection, the source is the id-keyed record
        const existing = (foundry.utils.getProperty(doc.toObject(), "system.advancement") ?? {}) as Record<string, I5eAdvancement>;
        const stale = Object.entries(existing)
          .filter(([id, advancement]) => !(id in record)
            && (remove.has(id) || owners.has(foundry.utils.getProperty(advancement, FeatureAdvancements.OWNER_FLAG) as string)))
          .map(([id]) => id);
        for (const id of stale) update[`system.advancement.${id}`] = _del;
        for (const [id, advancement] of Object.entries(record)) {
          update[`system.advancement.${id}`] = advancement;
        }
        if (Object.keys(update).length === 0) continue;
        logger.debug(`Writing ${Object.keys(record).length} advancements to ${doc.name}, removing ${stale.length}`, { uuid, record, stale });
        await doc.update(update as Parameters<typeof doc.update>[0], { render: false } as Parameters<typeof doc.update>[1]);
      } catch (error) {
        logger.error(`Error writing feature advancements to ${uuid}`, { error, record });
      }
    }
  }

}
