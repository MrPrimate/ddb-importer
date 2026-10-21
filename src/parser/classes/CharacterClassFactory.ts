import DDBClass from "./DDBClass";
import { logger, utils } from "../../lib/_module";
import DDBSubClass from "./DDBSubClass";
import AdvancementOrigin from "../advancements/AdvancementOrigin";
import FeatureAdvancements from "../advancements/FeatureAdvancements";
import type DDBCharacter from "../DDBCharacter";

interface ICharacterClassFactoryOptions {
  addToCompendium?: boolean;
  compendiumImportTypes?: string[] | null;
  updateCompendiumItems?: boolean | null;
  isMuncher?: boolean;
  collectOnly?: boolean;
}

export default class CharacterClassFactory {

  addToCompendium: boolean | null = null;
  compendiumImportTypes = ["classes", "subclasses"];
  updateCompendiumItems: boolean | null = null;
  collectOnly = false;
  source: IDDBData;
  ddbCharacter: DDBCharacter;
  character: I5ePCData;
  ddbClasses: Record<string, DDBClass | DDBSubClass>;
  originalClass: string | null;

  constructor(ddbCharacter: DDBCharacter, options: ICharacterClassFactoryOptions = {}) {
    const { addToCompendium, compendiumImportTypes, updateCompendiumItems, collectOnly } = options;
    this.ddbCharacter = ddbCharacter;
    this.character = this.ddbCharacter.raw.character;
    const source = this.ddbCharacter.source;
    if (!source) {
      throw new Error("CharacterClassFactory requires a parsed DDB character source");
    }
    this.source = source.ddb;
    this.ddbClasses = {
    };
    this.originalClass = null;
    this.addToCompendium = addToCompendium ?? null;
    if (compendiumImportTypes) this.compendiumImportTypes = compendiumImportTypes;
    this.updateCompendiumItems = updateCompendiumItems ?? utils.getSetting<boolean>("character-update-policy-update-add-features-to-compendiums");
    this.collectOnly = collectOnly ?? false;
  }

  async processCharacter() {
    const documents = [];
    for (const characterClass of this.source.character.classes) {
      const ddbClass = new DDBClass(this.source, characterClass.definition.id, {
        addToCompendium: this.addToCompendium,
        compendiumImportTypes: this.compendiumImportTypes,
        updateCompendiumItems: this.updateCompendiumItems,
        isMuncher: this.ddbCharacter.isMuncher,
        collectOnly: this.collectOnly,
      });
      await ddbClass.generateFromCharacter(this.character);
      this.ddbClasses[ddbClass.data.name] = ddbClass;
      documents.push(foundry.utils.deepClone(ddbClass.data));

      if (characterClass.subclassDefinition && characterClass.subclassDefinition.name) {
        const ddbSubClass = new DDBSubClass(this.source, characterClass.definition.id, {
          addToCompendium: this.addToCompendium,
          compendiumImportTypes: this.compendiumImportTypes,
          updateCompendiumItems: this.updateCompendiumItems,
          isMuncher: this.ddbCharacter.isMuncher,
          collectOnly: this.collectOnly,
        });
        await ddbSubClass.generateFromCharacter(this.character);
        this.ddbClasses[ddbSubClass.data.name] = ddbSubClass;
        documents.push(foundry.utils.deepClone(ddbSubClass.data));
      }
      if (ddbClass.isStartingClass) this.originalClass = ddbClass.data._id ?? null;
    }

    logger.debug(`Processed ${documents.length} classes`, { documents });
    this.ddbCharacter.updateItemIds(documents);

    // if (this.originalClass) this.character.system.details.originalClass = this.originalClass;

    return documents;
  }

  /**
   * The character document a class ItemGrant's compendium entry stands for. An attack action can
   * keep its feature's name (Soulknife's Psychic Blades weapon), so a feature entry looks among the
   * features first, and a weapon entry built from a renamed action (Psychic Blade) is matched on its
   * document name and type.
   */
  #grantedDocument(ddbClass: DDBClass | DDBSubClass, name: string, uuid: string, hint: string) {
    const entry = ((ddbClass._compendiums.features?.index ?? []) as TIndexEntry[]).find((e) => e.uuid === uuid);
    const entryType = entry ? foundry.utils.getProperty(entry, "type") as string | undefined : undefined;
    const featureTypes: ("actions" | "features")[] = entryType === "feat" ? ["features", "actions"] : ["actions", "features"];
    const match = this.ddbCharacter.getDataFeature(name, { featureTypes, hints: [hint], ddbTypes: ["class"] });
    if (match || !entryType || entryType === "feat") return match;
    return [...this.ddbCharacter.data.actions, ...this.ddbCharacter.data.features].find((doc) =>
      doc.type === entryType
      && doc.flags?.ddbimporter?.type === "class"
      && utils.nameString(doc.name) === utils.nameString(name),
    );
  }

  #itemGrantLink(ddbClass: DDBClass | DDBSubClass, klass: I5eClassItem | I5eSubclassItem, id: string) {
    // "added": {
    //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
    //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
    // }
    const advancementData = klass.system.advancement ?? {};
    const advancement: I5eAdvancement | undefined = advancementData[id];
    const aData = ddbClass._advancementMatches.features[id];
    const added: Record<string, string> = {};

    if (!aData || !advancement) {
      logger.warn(`Advancement for ${klass.name} (id ${id}) missing required data for linking`, {
        advancement,
        aData,
        klass,
        ddbClass,
      });
      return;
    }
    for (const [advancementFeatureName, uuid] of Object.entries(aData)) {
      logger.debug(`Advancement ${advancement._id} searching for Feature ${advancementFeatureName} (${uuid})`, {
        a: advancement,
        ddbClass,
        advancementFeatureName,
        uuid,
      });

      const characterFeature = this.#grantedDocument(ddbClass, advancementFeatureName, uuid, klass.name);
      if (characterFeature) {
        logger.debug(`Advancement ${advancement._id} found Feature ${advancementFeatureName} (${uuid})`);
        added[characterFeature._id] = uuid;
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.sourceId", uuid);
        AdvancementOrigin.link(characterFeature, klass, advancement._id);
      }
    }

    if (Object.keys(added).length > 0) {
      advancement.value = {
        added,
      };
      advancementData[id] = advancement;
    }
  }

  #abilityScoreFeatLink(ddbClass: DDBClass | DDBSubClass, klass: I5eClassItem | I5eSubclassItem, id: string) {
    // "value": {
    //   "type": "feat",
    //   "feat": {
    //     "B09QLNujzaGh6zt7": "Compendium.world.ddb-test2-ddb-feats.Item.cHie2wNgxBG9m62F"
    //   }
    // }
    const advancementData = klass.system.advancement ?? {};
    const advancement: I5eAdvancement | undefined = advancementData[id];
    const aData = ddbClass._advancementMatches.features[id];
    const feats: Record<string, string> = {};

    if (!aData || !advancement) {
      logger.debug(`Advancement for ${klass.name} (id ${id}) missing required data for linking ${advancement?.type}`, {
        advancement,
        aData,
        klass,
        ddbClass,
      });
      return;
    }

    for (const [advancementFeatureName, uuid] of Object.entries(aData)) {
      logger.debug(`Ability Score Advancement ${advancement._id} searching for Feat ${advancementFeatureName} (${uuid})`, {
        a: advancement,
        ddbClass,
        advancementFeatureName,
        uuid,
      });

      const characterFeature = this.ddbCharacter.getDataFeature(advancementFeatureName, { hints: [klass.name], ddbTypes: ["feat"] });
      if (characterFeature) {
        logger.debug(`Ability Score Advancement ${advancement._id} found Feat ${advancementFeatureName} (${uuid})`);
        feats[characterFeature._id] = uuid;
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.sourceId", uuid);
        AdvancementOrigin.link(characterFeature, klass, advancement._id);
      }
    }

    if (Object.keys(feats).length > 0) {
      advancement.value = {
        type: "feat",
        feat: feats,
      };
    }
  }

  /**
   * Put the advancements each class built from its features onto the matching feature documents,
   * replacing earlier copies by id. A feature the character does not have (above its class level,
   * or skipped) gets nothing here; it brings its advancements with it when Foundry grants the
   * compendium copy on a level up.
   */
  attachFeatureAdvancements(documents: TAdvancementHolderDocument[]) {
    for (const ddbClass of Object.values(this.ddbClasses)) {
      for (const entry of ddbClass.ownedFeatureAdvancements.values()) {
        const doc = documents.find((d) =>
          d.flags?.ddbimporter?.id === entry.feature.id
          && d.flags.ddbimporter?.type === "class"
          && !foundry.utils.getProperty(d, "flags.ddbimporter.isChoice")
          && "advancement" in d.system,
        );
        if (!doc) {
          logger.debug(`No ${entry.feature.name} feature for its ${entry.advancements.length} class advancements`, { entry });
          continue;
        }
        FeatureAdvancements.merge(doc, entry.advancements);
      }
    }
  }

  /** Whether a character document is the compendium document a choice pool offers. */
  static #isPoolDocument(doc: TAdvancementHolderDocument, entry: TIndexEntry): boolean {
    const entryFlags = foundry.utils.getProperty(entry, "flags.ddbimporter") as IDDBImporterFlags | undefined;
    const docFlags = doc.flags?.ddbimporter as IDDBImporterFlags | undefined;
    if (!entryFlags?.id || entryFlags.id !== docFlags?.id || doc.type !== "feat") return false;
    const entryOption = foundry.utils.getProperty(entryFlags, "dndbeyond.choice.optionId");
    if (!entryFlags.isChoice) return !docFlags.isChoice;
    return Boolean(docFlags.isChoice)
      && String(foundry.utils.getProperty(docFlags, "dndbeyond.choice.optionId")) === String(entryOption);
  }

  /**
   * Record the character's picks on the ItemChoice advancements a class feature holds (Fighting
   * Style's feat, Metamagic options): each pool entry is a compendium document, and the picked item
   * is the character document with the same DDB id (and option, for choice options). Picks fill the
   * choice levels in order, up to each level's count, at levels the class has reached. An item an
   * advancement elsewhere already claims (an ASI feat) is left alone.
   */
  #linkFeatureChoices(ddbClass: DDBClass | DDBSubClass, documents: TAdvancementHolderDocument[]) {
    const index = new Map<string, TIndexEntry>();
    for (const type of ["features", "feats"] as const) {
      for (const entry of (ddbClass._compendiums[type]?.index ?? []) as TIndexEntry[]) index.set(entry.uuid, entry);
    }
    const classLevel = ddbClass.ddbClass.level;

    for (const owned of ddbClass.ownedFeatureAdvancements.values()) {
      const feature = documents.find((d) =>
        d.flags?.ddbimporter?.id === owned.feature.id
        && d.flags.ddbimporter?.type === "class"
        && !foundry.utils.getProperty(d, "flags.ddbimporter.isChoice"),
      );
      if (!feature?._id || !("advancement" in feature.system)) continue;
      // a feature no class grant matched would only get its generic origin later
      const classItem = this.ddbCharacter.data.classes.find((k) => k.name === ddbClass.data.name);
      if (classItem && !foundry.utils.hasProperty(feature, "flags.dnd5e.advancementOrigin")) {
        AdvancementOrigin.link(feature, classItem);
      }
      const record = feature.system.advancement as Record<string, I5eAdvancement> | undefined;

      for (const held of owned.advancements.filter((a) => a.type === "ItemChoice")) {
        const advancement = held._id ? record?.[held._id] : undefined;
        if (!advancement?._id) continue;
        const configuration = advancement.configuration as I5eAdvItemChoiceConfig;
        const picks: { doc: TAdvancementHolderDocument; uuid: string }[] = [];
        for (const { uuid } of configuration.pool ?? []) {
          const entry = index.get(uuid);
          if (!entry) continue;
          const doc = documents.find((d) => d !== feature
            && CharacterClassFactory.#isPoolDocument(d, entry)
            && !picks.some((pick) => pick.doc === d));
          if (!doc?._id) continue;
          const origin = foundry.utils.getProperty(doc, "flags.dnd5e.advancementOrigin") as string | undefined;
          if (origin?.includes(".") && !origin.startsWith(`${feature._id}.`)) continue;
          picks.push({ doc, uuid });
        }
        if (picks.length === 0) continue;

        const added: Record<string, Record<string, string>> = {};
        const levels = Object.entries(configuration.choices ?? {})
          .map(([level, choice]) => ({ level: Number(level), count: Number((choice as { count?: number }).count ?? 1) }))
          .filter((choice) => choice.level <= classLevel)
          .sort((a, b) => a.level - b.level);
        for (const { level, count } of levels) {
          for (const pick of picks.splice(0, count)) {
            (added[level] ??= {})[pick.doc._id as string] = pick.uuid;
            foundry.utils.setProperty(pick.doc, "flags.dnd5e.sourceId", pick.uuid);
            AdvancementOrigin.link(pick.doc, feature, advancement._id);
          }
        }
        if (Object.keys(added).length === 0) continue;
        advancement.value = { added, replaced: {} } as unknown as I5eAdvancement["value"];
        logger.debug(`Linked ${feature.name} choice picks`, { added });
      }
    }
  }

  linkFeatures() {
    logger.debug("Linking Advancements to Features", {
      CharacterClassFactory: this,
    });
    const documents = [...this.ddbCharacter.data.features, ...this.ddbCharacter.data.actions];
    this.attachFeatureAdvancements(documents);
    for (const klass of this.ddbCharacter.data.classes) {
      const ddbClass = this.ddbClasses[klass.name];
      logger.debug("Linking Advancements to Features for Class", {
        klass,
        ddbClass,
      });

      for (const [id, a] of Object.entries(klass.system.advancement ?? {})) {
        if (a.type === "ItemGrant" && a.level !== undefined && a.level <= ddbClass.ddbClass.level) {
          this.#itemGrantLink(ddbClass, klass, id);
        } else if (a.type === "AbilityScoreImprovement" && a.value?.type === "feat") {
          this.#abilityScoreFeatLink(ddbClass, klass, id);
        }
      }
      logger.debug(`Processed ${klass.name} class advancements`, klass.system.advancement);
    };
    // after the class grants, so the picks inherit the feature's class root
    for (const ddbClass of Object.values(this.ddbClasses)) this.#linkFeatureChoices(ddbClass, documents);
  }
}
