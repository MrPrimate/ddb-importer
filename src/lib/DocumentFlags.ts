import { SETTINGS } from "../config/_module";

/**
 * Flag-copy helpers shared by DDBItemImporter and CompendiumHelper.
 *
 * A leaf module (config only): DDBItemImporter re-exposes them as statics for existing callers.
 */
export default class DocumentFlags {

  static copyFlagGroup(flagGroup: string, originalItem: Item.Implementation | Actor.Implementation | TImporterActor | TSyncCharacterActor, targetItem: TDDBItemImporterDocument) {
    if (targetItem.flags === undefined) targetItem.flags = {};
    // if we have generated effects we dont want to copy some flag groups. mostly for AE on spells
    const effectsProperty = foundry.utils.getProperty(targetItem, "flags.ddbimporter.effectsApplied") as boolean
      && SETTINGS.EFFECTS_IGNORE_FLAG_GROUPS.includes(flagGroup);
    const originalFlags = foundry.utils.getProperty(originalItem, `flags.${flagGroup}`);
    if (originalFlags && !effectsProperty) {
      foundry.utils.setProperty(targetItem, `flags.${flagGroup}`, originalFlags);
    }
  }

  static copySupportedItemFlags(originalItem: Item.Implementation | Actor.Implementation | TImporterActor | TSyncCharacterActor, targetItem: TDDBItemImporterDocument) {
    SETTINGS.SUPPORTED_FLAG_GROUPS.forEach((flagGroup) => {
      DocumentFlags.copyFlagGroup(flagGroup, originalItem, targetItem);
    });
  }

}
