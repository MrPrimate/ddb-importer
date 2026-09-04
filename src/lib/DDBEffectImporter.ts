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

  static FLAG_PATH = "flags.ddbimporter.standaloneEffects";

  static standaloneEffectId(documentName: string, effectName: string): string {
    return utils.namedIDStub(`${documentName} ${effectName}`, { prefix: "ddb" });
  }

  static INVENTORY_TYPES = DICTIONARY.types.inventory;

  /** Classify the declaring document for the effects compendium folder tree (see DDBCompendiumFolders.EFFECT_PARENT_TYPE_FOLDERS). */
  static parentType(document: Record<string, any>): string {
    if (document.type === "spell") return "spell";
    if (document.type === "background") return "background";
    if (foundry.utils.hasProperty(document, "flags.monsterMunch")) return "monsterFeature";
    if (DDBEffectImporter.INVENTORY_TYPES.includes(document.type)) return "item";
    if (document.type === "feat") {
      switch (foundry.utils.getProperty(document, "flags.ddbimporter.type")) {
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

  static parentInfo(document: Record<string, any>): IDDBStandaloneEffectParent {
    return {
      name: document.name,
      type: DDBEffectImporter.parentType(document),
      bookCode: (foundry.utils.getProperty(document, "system.source.book") as string | undefined) ?? null,
      isLegacy: foundry.utils.getProperty(document, "flags.ddbimporter.legacy") === true,
    };
  }

  /**
   * Carry standalone effects from one document to another when a parse step
   * replaces or merges documents (choice features into parents, actions over
   * features); ids are deterministic so duplicates are dropped.
   */
  static mergeStandaloneEffects(target: Record<string, any>, source: Record<string, any>): void {
    const sourceEffects = (foundry.utils.getProperty(source, DDBEffectImporter.FLAG_PATH) ?? []) as I5eEffectData[];
    if (sourceEffects.length === 0) return;
    const targetEffects = (foundry.utils.getProperty(target, DDBEffectImporter.FLAG_PATH) ?? []) as I5eEffectData[];
    const existingIds = new Set(targetEffects.map((effect) => effect._id));
    targetEffects.push(...sourceEffects.filter((effect) => !existingIds.has(effect._id)));
    foundry.utils.setProperty(target, DDBEffectImporter.FLAG_PATH, targetEffects);
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
  static resolveStandaloneOrigins(document: Record<string, any>): void {
    for (const effect of (document.effects ?? []) as I5eEffectData[]) {
      const standaloneId = effect.flags?.ddbimporter?.standaloneOrigin;
      if (standaloneId) {
        const uuid = DDBEffectImporter.effectUuid(standaloneId);
        effect.origin = uuid;
        effect.system ??= {};
        foundry.utils.setProperty(effect.system, "origin.effect", uuid);
        delete effect.flags!.ddbimporter!.standaloneOrigin;
      }
      const enchantmentOrigin = effect.flags?.ddbimporter?.enchantmentOrigin;
      if (enchantmentOrigin) {
        const uuid = DDBEffectImporter.enchantActivityUuid(enchantmentOrigin);
        effect.origin = uuid;
        effect.system ??= {};
        foundry.utils.setProperty(effect.system, "origin.activity", uuid);
        foundry.utils.setProperty(effect.system, "origin.profile", enchantmentOrigin.profileId);
        foundry.utils.setProperty(effect, "flags.dnd5e.enchantmentProfile", enchantmentOrigin.profileId);
        delete effect.flags!.ddbimporter!.enchantmentOrigin;
      }
    }
  }

  /**
   * Remove the standalone effects from the documents and point the activities'
   * applyActiveEffect behaviors at the compendium copies. Behaviors may name an
   * effect (resolved here) or already carry a full UUID (left alone).
   */
  static extractStandaloneEffects(documents: Record<string, any>[]): I5eEffectData[] {
    const extracted = new Map<string, I5eEffectData>();
    for (const document of documents) {
      DDBEffectImporter.resolveStandaloneOrigins(document);
      const effects = (foundry.utils.getProperty(document, DDBEffectImporter.FLAG_PATH) ?? []) as I5eEffectData[];
      if (effects.length === 0) continue;
      const byName = new Map(effects.map((effect) => [effect.name, effect]));
      const parent = DDBEffectImporter.parentInfo(document);
      for (const effect of effects) {
        if (!effect._id) continue;
        // an effect shared by several documents names its own folder parent up front
        if (!foundry.utils.hasProperty(effect, "flags.ddbimporter.parent")) {
          foundry.utils.setProperty(effect, "flags.ddbimporter.parent", parent);
        }
        extracted.set(effect._id, effect);
      }

      const activities = document.system?.activities ?? {};
      for (const activity of Object.values(activities) as I5eActivityBase[]) {
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

      delete document.flags.ddbimporter.standaloneEffects;
    }
    return [...extracted.values()];
  }

  static async importStandaloneEffects(documents: Record<string, any>[]): Promise<void> {
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
      (effect as I5eEffectData & { folder?: string }).folder = folder._id;
      // the effects compendium only holds ActiveEffects; narrowing here keeps `.update` from
      // resolving against the full compendium-document union (TS2590 in editor-order checks)
      const existing = effect._id
        ? (await compendium.getDocument(effect._id)) as ActiveEffect.Implementation | null
        : null;
      if (existing) {
        await existing.update(effect as any);
      } else {
        await ActiveEffect.create(effect as any, { pack, keepId: true });
      }
    }
    logger.debug(`Imported ${effects.length} standalone effects into ${pack}`);
  }

}
