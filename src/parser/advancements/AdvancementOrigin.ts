interface IAdvancementOriginTarget {
  _id?: string | null;
  flags?: Record<string, any>;
}

/**
 * The `flags.dnd5e.advancementOrigin` / `advancementRoot` pair that dnd5e writes on an item an
 * advancement adds (`Advancement#createItemData`). The origin names the granting item and
 * advancement; the root is the item at the top of the grant chain, inherited from the granting
 * item. dnd5e reads the root to decide which level a granted item's own advancements run at: a
 * non-"feat" feature rooted on a class or subclass follows that class's level, anything else
 * follows the character level (`advancementLevel`, `AdvancementManager#createLevelChangeSteps`).
 */
export default class AdvancementOrigin {

  /** The root an item granted by `parent` inherits: the parent's own root, else the new origin. */
  static rootFor(parent: IAdvancementOriginTarget, origin: string): string {
    return (parent.flags?.dnd5e?.advancementRoot as string | undefined) ?? origin;
  }

  /**
   * Mark `doc` as granted by `parent`, through the advancement `advancementId` when known. Without
   * an advancement id the origin is the bare parent id, which dnd5e reads the same way for the
   * root (only the part before the first dot is used).
   */
  static link(doc: IAdvancementOriginTarget, parent: IAdvancementOriginTarget, advancementId?: string | null) {
    if (!parent._id) return;
    const origin = advancementId ? `${parent._id}.${advancementId}` : `${parent._id}`;
    foundry.utils.setProperty(doc, "flags.dnd5e.advancementOrigin", origin);
    foundry.utils.setProperty(doc, "flags.dnd5e.advancementRoot", AdvancementOrigin.rootFor(parent, origin));
  }

}
