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

  /**
   * The compendium id of a standalone effect, the single source for every producer so
   * re-imports upsert in place. Derived from "<document name> <effect name>" plus the
   * declaring document's ruleset, because the 2014 and 2024 printings of a spell or feature
   * share a name but not their effect text or changes; with a shared id each import would
   * overwrite the other ruleset's copy. Compendium entries written under the older
   * ruleset-free ids are left in place so links on previously imported items keep resolving.
   *
   * The ruleset goes in the `postfix` rather than the name so namedIDStub's per-word
   * truncation can never drop it. An explicit `key` names an effect several documents share
   * (the evolved item property enchantments) and is ruleset-free: the key owns the identity,
   * so fold a ruleset into the key if the shared effect differs between rulesets.
   */
  static standaloneEffectId({ documentName = "", effectName = "", rules = null, key = null }: {
    documentName?: string;
    effectName?: string;
    rules?: string | null;
    key?: string | null;
  }): string {
    if (key) return utils.namedIDStub(key, { prefix: "ddb" });
    const postfix = DDBEffectImporter.rulesetPostfix(rules);
    return utils.namedIDStub(`${documentName} ${effectName}`, { prefix: "ddb", postfix });
  }

  /** "2014" -> "14", "2024" -> "24"; any other non-empty ruleset keeps its last two id-safe characters. */
  static rulesetPostfix(rules: string | null | undefined): string | null {
    const cleaned = utils.idString(`${rules ?? ""}`);
    if (cleaned === "") return null;
    return cleaned.slice(-2);
  }

  /**
   * The ruleset a standalone effect's id is keyed on: the document's `system.source.rules`,
   * else `fallbackIs2014` (the enricher's own ruleset, always known after load) for documents
   * whose source carries no rules yet, such as monster features mid-parse and homebrew.
   */
  static documentRules(document: { system?: { source?: I5eSourceInfo | null } | null }, fallbackIs2014: boolean): T5eRulesVersion {
    const rules = document.system?.source?.rules;
    if (rules === "2014" || rules === "2024") return rules;
    return fallbackIs2014 ? "2014" : "2024";
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
