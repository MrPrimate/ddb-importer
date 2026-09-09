export {};

global {

  // the dictionary's damage/condition adjustment row, exposed globally for the shared parsers
  type IDDBDamageAdjustment = import("../config/dictionary/actor/actor").IDDBDamageAdjustment;

  // compendium type keys as used by the compendium helpers
  type TCompendiumTypes = string;

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

}
