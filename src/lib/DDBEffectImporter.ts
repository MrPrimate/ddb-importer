import { DICTIONARY } from "../config/_module";
import CompendiumHelper from "./CompendiumHelper";
import { DDBCompendiumFolders } from "./DDBCompendiumFolders";
import logger from "./Logger";
import utils from "./Utils";

/**
 * Standalone effects are ActiveEffect documents that live in the ddb-importer
 * effects compendium rather than embedded on an item, mirroring the dnd5e SRD
 * content (e.g. the "Silenced" effect referenced by Silence's region behavior).
 * Enrichers build them with `standalone: true`; the parsers stash them on
 * `flags.ddbimporter.standaloneEffects` and the importers upsert them into the
 * compendium here just before the owning documents are created.
 */
export default class DDBEffectImporter {

  static standaloneEffectId(documentName: string, effectName: string): string {
    return utils.namedIDStub(`${documentName} ${effectName}`, { prefix: "ddb" });
  }

  static INVENTORY_TYPES: readonly string[] = DICTIONARY.types.inventory;

  /** Classify the declaring document for the effects compendium folder tree (see DDBCompendiumFolders.EFFECT_PARENT_TYPE_FOLDERS). */
  static parentType(document: TAll5eItemDocuments): string {
    if (document.type === "spell") return "spell";
    if (document.type === "background") return "background";
    if ("monsterMunch" in (document.flags ?? {})) return "monsterFeature";
    if (DDBEffectImporter.INVENTORY_TYPES.includes(document.type)) return "item";
    if (document.type === "feat") {
      switch (document.flags?.ddbimporter?.type) {
        case "class":
        case "subclass":
          return "classFeature";
        case "race":
        case "trait":
          return "speciesTrait";
        case "feat":
          return "feat";
        default:
          return "other";
      }
    }
    return "other";
  }

  static parentInfo(document: TAll5eItemDocuments): IDDBStandaloneEffectParent {
    return {
      name: document.name,
      type: DDBEffectImporter.parentType(document),
      bookCode: document.system?.source?.book ?? null,
      isLegacy: document.flags?.ddbimporter?.legacy === true,
    };
  }

  /**
   * Carry standalone effects from one document to another when a parse step
   * replaces or merges documents (choice features into parents, actions over
   * features); ids are deterministic so duplicates are dropped.
   */
  static mergeStandaloneEffects(target: TAll5eItemDocuments, source: TAll5eItemDocuments): void {
    const sourceEffects = source.flags?.ddbimporter?.standaloneEffects ?? [];
    if (sourceEffects.length === 0) return;
    target.flags ??= {};
    target.flags.ddbimporter ??= {};
    const targetEffects = target.flags.ddbimporter.standaloneEffects ?? [];
    const existingIds = new Set(targetEffects.map((effect) => effect._id));
    targetEffects.push(...sourceEffects.filter((effect) => !existingIds.has(effect._id)));
    target.flags.ddbimporter.standaloneEffects = targetEffects;
  }

  static effectUuid(effectId: string): string {
    return `Compendium.${CompendiumHelper.getCompendiumLabel("effects")}.ActiveEffect.${effectId}`;
  }

  static enchantActivityUuid({ itemId, activityId }: { itemId: string; activityId: string }): string {
    return `Compendium.${CompendiumHelper.getCompendiumLabel("items")}.Item.${itemId}.Activity.${activityId}`;
  }

  /**
   * Point the origin at the compendium document now.
   */
  static resolveStandaloneOrigins(document: TAll5eItemDocuments): void {
    for (const effect of document.effects ?? []) {
      const flags = effect.flags;
      const ddbFlags = flags?.ddbimporter;
      if (!flags || !ddbFlags) continue;
      const standaloneId = ddbFlags.standaloneOrigin;
      if (standaloneId) {
        const uuid = DDBEffectImporter.effectUuid(standaloneId);
        effect.origin = uuid;
        // only base and enchantment effects are applied from a compendium copy; the condition
        // model has no origin field
        const system = (effect.system ??= {}) as I5eEffectSystem;
        system.origin = { ...system.origin, effect: uuid };
        delete ddbFlags.standaloneOrigin;
      }
      const enchantmentOrigin = ddbFlags.enchantmentOrigin;
      if (enchantmentOrigin) {
        const uuid = DDBEffectImporter.enchantActivityUuid(enchantmentOrigin);
        effect.origin = uuid;
        const system = (effect.system ??= {}) as I5eEnchantmentEffectSystem;
        system.origin = { ...system.origin, activity: uuid, profile: enchantmentOrigin.profileId };
        flags.dnd5e ??= {};
        flags.dnd5e.enchantmentProfile = enchantmentOrigin.profileId;
        delete ddbFlags.enchantmentOrigin;
      }
    }
  }

  /**
   * Remove the standalone effects from the documents and point the activities'
   * applyActiveEffect behaviors at the compendium copies. Behaviors may name an
   * effect (resolved here) or already carry a full UUID (left alone).
   */
  static extractStandaloneEffects(documents: TAll5eItemDocuments[]): I5eEffectData[] {
    const extracted = new Map<string, I5eEffectData>();
    for (const document of documents) {
      DDBEffectImporter.resolveStandaloneOrigins(document);
      const ddbFlags = document.flags?.ddbimporter;
      const effects = ddbFlags?.standaloneEffects ?? [];
      if (!ddbFlags || effects.length === 0) continue;
      const byName = new Map(effects.map((effect) => [effect.name, effect]));
      const parent = DDBEffectImporter.parentInfo(document);
      for (const effect of effects) {
        if (!effect._id) continue;
        effect.flags ??= {};
        effect.flags.ddbimporter ??= {};
        // an effect shared by several documents names its own folder parent up front
        effect.flags.ddbimporter.parent ??= parent;
        extracted.set(effect._id, effect);
      }

      // class, subclass, species and background system data carry no activities
      const activities = document.system && "activities" in document.system
        ? document.system.activities ?? {}
        : {};
      for (const activity of Object.values(activities)) {
        for (const behavior of activity.behaviors ?? []) {
          if (behavior.type !== "applyActiveEffect") continue;
          const config = behavior.config as I5eActivityBehaviorApplyEffectConfig;
          config.effects = (config.effects ?? []).map((entry) => {
            if (entry.startsWith("Compendium.")) return entry;
            const effect = byName.get(entry);
            if (!effect?._id) {
              logger.warn(`Behavior on ${document.name} references unknown standalone effect "${entry}"`);
              return entry;
            }
            return DDBEffectImporter.effectUuid(effect._id);
          });
        }
      }

      delete ddbFlags.standaloneEffects;
    }
    return [...extracted.values()];
  }

  static async importStandaloneEffects(documents: TAll5eItemDocuments[]): Promise<void> {
    const effects = DDBEffectImporter.extractStandaloneEffects(documents);
    if (effects.length === 0) return;
    const compendium = CompendiumHelper.getCompendiumType("effects", false);
    if (!compendium) {
      logger.warn("No effects compendium available, standalone effects not imported", { effects });
      return;
    }
    const pack = compendium.collection;
    const folders = new DDBCompendiumFolders("effects");
    await folders.loadCompendium("effects");
    for (const effect of effects) {
      const folder = await folders.createEffectFolder(effect);
      effect.folder = folder._id;
      // the effects compendium only holds ActiveEffects; narrowing here keeps `.update` from
      // resolving against the full compendium-document union (TS2590 in editor-order checks)
      const existing = effect._id
        ? (await compendium.getDocument(effect._id)) as ActiveEffect.Implementation | null
        : null;
      if (existing) {
        await existing.update(effect as ActiveEffect.UpdateData);
      } else {
        await ActiveEffect.create(effect as ActiveEffect.CreateData, { pack, keepId: true });
      }
    }
    logger.debug(`Imported ${effects.length} standalone effects into ${pack}`);
  }

}
