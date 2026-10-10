export {};

global {

  // the dictionary's damage/condition adjustment row, exposed globally for the shared parsers
  type IDDBDamageAdjustment = import("../config/dictionary/actor/actor").IDDBDamageAdjustment;

  // compendium type keys as used by the compendium helpers
  type TCompendiumTypes = string;

  type TDDBCompendiumSetting = typeof import("../config/settings/compendiums/compendiums").COMPENDIUMS[number];

  interface ICompendiumLookup {
    _id: string;
    name: string;
    uuid: string;
    img: string;
    /** The name the caller asked for, when the entry was found under another ("Tasha's Hideous Laughter" for "Hideous Laughter"). */
    requestedName?: string;
    [key: string]: any;
  }

  // A tool proficiency D&D Beyond knows about but the dnd5e system has no key for.
  interface ICustomToolDefinition {
    key: string;
    name: string;
    ability: T5eAbility;
    toolType: TToolType;
    // the character's own blurb, from a free text proficiency's notes.
    description?: string;
  }

  // The slice of a compendium index entry the tool sync cares about.
  interface IToolIndexEntry {
    _id: string;
    uuid: string;
    name?: string;
    type?: string;
    system?: { type?: { baseItem?: string }; description?: { value?: string } };
    flags?: { ddbimporter?: { toolFallback?: boolean } };
  }

  interface IToolSyncPlan {
    // tools to point at an existing compendium item
    links: { key: string; uuid: string }[];
    // tools with no item at all, which need a stub creating
    missing: ICustomToolDefinition[];
    // ids of stub items that are no longer needed
    redundant: string[];
    needsDescription: { _id: string; key: string }[];
    // munched items matched by name because their system.type.baseItem is empty. Without
    // it dnd5e cannot tie the item to the actor's proficiency, so it is repaired/corrected.
    needsBaseItem: { _id: string; key: string }[];
  }

  interface ICompendiumDuplicateGroup {
    packId: string;
    settings: string[];
  }

  interface ICompendiumMappingEntry {
    setting: string;
    title: string;
    value: string;
    /** id of the setting's own default DDB compendium, null when it does not exist */
    defaultPackId: string | null;
  }

  interface ICompendiumMappingChange {
    setting: string;
    title: string;
    from: string;
    to: string;
  }

  type TCompendiumMappingUnresolvedReason = "no-default" | "default-in-use" | "non-ddb-pack";

  interface ICompendiumMappingUnresolved {
    setting: string;
    title: string;
    packId: string;
    reason: TCompendiumMappingUnresolvedReason;
    sharedWith: string[];
  }

  interface ICompendiumMappingPlan {
    changes: ICompendiumMappingChange[];
    unresolved: ICompendiumMappingUnresolved[];
  }

  type TDDBImageSnipShape = "rectangle" | "square" | "circle";

  /**
   * Instructions for cutting a piece out of a remote image, served by the proxy's enriched image
   * data. Positions are in the unrotated source image's pixels; `width`/`height` are the size of the
   * cut, which is axis-aligned in the view rotated clockwise by `rotation` degrees. `square` and
   * `circle` cuts always have equal sides.
   */
  interface IDDBImageSnip {
    url: string;
    // the natural image size the snip was authored against, so a differently sized copy still cuts true
    sourceWidth: number;
    sourceHeight: number;
    rotation: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    shape: TDDBImageSnipShape;
    // scale the cut down so its longest side is at most this many pixels
    maxSize?: number;
  }

  interface IDDBImageSnipEntry {
    actor?: IDDBImageSnip;
    token?: IDDBImageSnip;
  }

}
