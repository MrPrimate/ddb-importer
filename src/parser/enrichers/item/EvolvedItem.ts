import { CompendiumHelper, DDBCompendiumFolders, DDBItemImporter, logger, utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";
import EvolvedItemProperties, { type IEvolvedProperty } from "./_EvolvedItemProperties";

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

  /** Items compendium ids whose host feats were written this session; one munch pass is enough. */
  static hostItemsBuiltFor = new Set<string>();

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
    const definitionId = this.ddbParser?.ddbDefinition?.id;
    // only the item parser carries the character's item spells; the parser union has no `raw`
    const parser = this.ddbParser as { raw?: { itemSpells?: I5eSpellItem[] } } | undefined;
    const itemSpells = parser?.raw?.itemSpells ?? [];
    return itemSpells
      .filter((spell) => spell.flags?.ddbimporter?.dndbeyond?.lookup === "item"
        && spell.flags?.ddbimporter?.dndbeyond?.lookupId === definitionId)
      .map((spell) => spell.flags?.ddbimporter?.originalName ?? spell.name);
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
    const key = compendium.metadata.id;
    if (EvolvedItem.hostItemsBuiltFor.has(key)) return;
    EvolvedItem.hostItemsBuiltFor.add(key);
    await this.generateHostItems();
  }

}
