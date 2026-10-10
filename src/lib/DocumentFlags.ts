import { SETTINGS } from "../config/_module";

/**
 * Flag-copy helpers shared by DDBItemImporter and CompendiumHelper.
 *
 * A leaf module (config only): DDBItemImporter re-exposes them as statics for existing callers.
 */
export default class DocumentFlags {

  /**
   * Keys in a copied flag group that the importer writes itself. A re-import keeps the rest of the
   * group from the existing document (the user's sheet customisations) but the freshly parsed value
   * of these wins, or a value from an older import would stick forever.
   */
  static GENERATED_FLAG_KEYS: Record<string, string[]> = {
    "tidy5e-sheet": ["parentClass"],
    "spell-class-filter-for-5e": ["parentClass"],
  };

  static copyFlagGroup(flagGroup: string, originalItem: Item.Implementation | Actor.Implementation | TImporterActor | TSyncCharacterActor, targetItem: TDDBItemImporterDocument) {
    if (targetItem.flags === undefined) targetItem.flags = {};
    // if we have generated effects we dont want to copy some flag groups. mostly for AE on spells
    const effectsProperty = foundry.utils.getProperty(targetItem, "flags.ddbimporter.effectsApplied") as boolean
      && SETTINGS.EFFECTS_IGNORE_FLAG_GROUPS.includes(flagGroup);
    const originalFlags = foundry.utils.getProperty(originalItem, `flags.${flagGroup}`);
    if (originalFlags && !effectsProperty) {
      const generated = (DocumentFlags.GENERATED_FLAG_KEYS[flagGroup] ?? [])
        .map((key) => [key, foundry.utils.getProperty(targetItem, `flags.${flagGroup}.${key}`)] as const)
        .filter(([, value]) => value !== undefined);
      foundry.utils.setProperty(targetItem, `flags.${flagGroup}`, foundry.utils.deepClone(originalFlags));
      for (const [key, value] of generated) {
        foundry.utils.setProperty(targetItem, `flags.${flagGroup}.${key}`, value);
      }
    }
  }

  static copySupportedItemFlags(originalItem: Item.Implementation | Actor.Implementation | TImporterActor | TSyncCharacterActor, targetItem: TDDBItemImporterDocument) {
    SETTINGS.SUPPORTED_FLAG_GROUPS.forEach((flagGroup) => {
      DocumentFlags.copyFlagGroup(flagGroup, originalItem, targetItem);
    });
  }

}
