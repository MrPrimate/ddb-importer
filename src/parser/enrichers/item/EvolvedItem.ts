import { CompendiumHelper, DDBCompendiumFolders, DDBItemImporter, logger, utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";
import EvolvedItemProperties from "./_EvolvedItemProperties";
import { HOST_ITEMS_BUILDING, HOST_ITEMS_BUILT } from "./_EvolvedItemHosts";
import { shippedItemSpellNames } from "./_ItemActivities";

/**
 * The Arcana Unleashed evolving-item example families (Blade of the Guardian, Breastplate of
 * the Tyrant, Rod of the Honed Mind, Wand of Celestial Prowess). Munching any member builds
 * the full property table as standalone enchantment and rider effects for the effects
 * compendium and as host feats (one enchant activity per property, with riders) under the
 * "Effect Items" folder of the items compendium, and an item named "<Property> <Base>"
 * additionally receives that property as an applied enchantment whose origin is the host
 * feat's activity. The family root ("Varies") only seeds the compendiums.
 */
export default class EvolvedItem extends DDBEnricherData {

  static handlerOptions = {
    chrisPremades: false,
    filterDuplicates: false,
    deleteBeforeUpdate: false,
    matchFlags: ["evolvedProperty"],
    useCompendiumFolders: true,
    indexFilter: {
      fields: ["name", "flags.ddbimporter"],
    },
  };

  get property(): IEvolvedProperty | undefined {
    return EvolvedItemProperties.find(this.name);
  }

  /** DDB's modifiers for the evolved variants are partial and untargeted (Studious ships a global 1d6 check bonus); the riders replace them. */
  override get clearAutoEffects(): boolean {
    return this.property !== undefined;
  }

  override get effects(): IDDBEffectHint[] {
    const hints = EvolvedItemProperties.standaloneHints();
    const property = this.property;
    if (property) hints.push(...EvolvedItemProperties.appliedHints(property));
    return hints;
  }

  /** Spells DDB attached to this item; the item-spell path already builds their cast activities. */
  get shippedSpellNames(): string[] {
    return shippedItemSpellNames(this);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const property = this.property;
    return property ? EvolvedItemProperties.activities(property, { skipSpells: this.shippedSpellNames }) : [];
  }

  /** Compendium spell uuids for every property spell, keyed by lower-cased name; missing spells stay unlinked. */
  static async lookupSpellUuids(): Promise<Record<string, string>> {
    const names = EvolvedItemProperties.spellNames();
    const found = await CompendiumHelper.retrieveCompendiumSpellReferences(names, { use2024Spells: true });
    const uuids: Record<string, string> = {};
    for (const entry of found) {
      if (entry?.name && entry.uuid) uuids[entry.name.toLowerCase()] = entry.uuid;
    }
    const missing = names.filter((name) => !uuids[name.toLowerCase()]);
    if (missing.length > 0) {
      logger.warn(`Evolved item property casts have no compendium spell yet, munch spells and re-munch items: ${missing.join(", ")}`);
    }
    return uuids;
  }

  /** Write the host feats to the items compendium under "Effect Items". */
  async generateHostItems(): Promise<void> {
    const modules = DDBEnricherData.AutoEffects.effectModules();
    const spellUuids = await EvolvedItem.lookupSpellUuids();
    const hosts = EvolvedItemProperties.hostItems({
      spellUuids,
      modules: { ac5e: modules.ac5eInstalled, midi: modules.midiQolInstalled },
    });

    const folders = new DDBCompendiumFolders("items");
    await folders.loadCompendium("items");
    await folders.createEffectFoldersForItemDocuments(hosts);
    await folders.addCompendiumFolderIds(hosts);

    const updateBool = foundry.utils.getProperty(this.ddbParser?.ddbCharacter ?? {}, "updateCompendiumItems") as boolean | undefined
      ?? this.ddbParser?.ddbCharacter?.forceCompendiumUpdate
      ?? utils.getSetting<boolean>("character-update-policy-update-add-features-to-compendiums");
    await DDBItemImporter.buildHandler("items", hosts, updateBool, EvolvedItem.handlerOptions);
  }

  override async cleanup() {
    // without a configured items compendium (e.g. the test environment) there is nowhere to
    // put the host feats; the standalone effects still flow through the effects importer
    const compendium = CompendiumHelper.getCompendiumType("items", false);
    if (!compendium || !game.user?.isGM) return;
    // one write per compendium and munch: the key is recorded only once the write succeeds, so
    // a failed one is retried, and the items muncher clears it so a re-munch rebuilds them
    const key = compendium.metadata.id;
    if (HOST_ITEMS_BUILT.has(key)) return;
    const pending = HOST_ITEMS_BUILDING.get(key);
    if (pending) {
      await pending;
      return;
    }
    const build = this.generateHostItems()
      .then(() => {
        HOST_ITEMS_BUILT.add(key);
      })
      .finally(() => {
        HOST_ITEMS_BUILDING.delete(key);
      });
    HOST_ITEMS_BUILDING.set(key, build);
    await build;
  }

}
