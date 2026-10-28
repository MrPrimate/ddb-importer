import DDBClass from "./DDBClass";
import { logger, utils } from "../../lib/_module";
import DDBSubClass from "./DDBSubClass";
import DDBCharacter from "../DDBCharacter";

interface ICharacterClassFactoryOptions {
  addToCompendium?: boolean;
  compendiumImportTypes?: string[] | null;
  updateCompendiumItems?: boolean | null;
  isMuncher?: boolean;
  collectOnly?: boolean;
}

export default class CharacterClassFactory {

  addToCompendium = null;

  compendiumImportTypes = ["classes", "subclasses"];

  updateCompendiumItems = null;
  collectOnly = false;
  source: IDDBData;
  character: I5ePCData;
  ddbCharacter: DDBCharacter;
  ddbClasses: Record<string, DDBClass | DDBSubClass>;
  originalClass: string | null;

  constructor(ddbCharacter: DDBCharacter, { addToCompendium = false, compendiumImportTypes = null, updateCompendiumItems = null, collectOnly = false }: ICharacterClassFactoryOptions = {}) {
    this.ddbCharacter = ddbCharacter;
    this.character = this.ddbCharacter.raw.character;
    this.source = this.ddbCharacter.source.ddb;
    this.ddbClasses = {
    };
    this.originalClass = null;
    this.addToCompendium = addToCompendium;
    if (compendiumImportTypes) this.compendiumImportTypes = compendiumImportTypes;
    this.updateCompendiumItems = updateCompendiumItems ?? utils.getSetting<boolean>("character-update-policy-update-add-features-to-compendiums");
    this.collectOnly = collectOnly;
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
      if (ddbClass.isStartingClass) this.originalClass = ddbClass.data._id;
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
    const index = Array.from(ddbClass._compendiums.features?.index ?? []) as { uuid: string; name: string }[];
    const entry = index.find((e) => e.uuid === uuid);
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

  #itemGrantLink(ddbClass, klass, advancementIndex) {
    // "added": {
    //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
    //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
    // }
    const advancement = klass.system.advancement[advancementIndex];
    const aData = ddbClass._advancementMatches.features[advancement._id];
    const added = {};

    if (!aData || !advancement) {
      logger.warn(`Advancement for ${klass.name} (idx ${advancementIndex}) missing required data for linking`, {
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

      const characterFeature = this.#grantedDocument(ddbClass, advancementFeatureName, String(uuid), klass.name);
      if (characterFeature) {
        logger.debug(`Advancement ${advancement._id} found Feature ${advancementFeatureName} (${uuid})`);
        added[characterFeature._id] = uuid;
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.sourceId", uuid);
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.advancementOrigin", `${klass._id}.${advancement._id}`);
      }
    }

    if (Object.keys(added).length > 0) {
      advancement.value = {
        added,
      };
      klass.system.advancement[advancementIndex] = advancement;
    }
  }

  #abilityScoreFeatLink(ddbClass, klass, advancementIndex) {
    // "value": {
    //   "type": "feat",
    //   "feat": {
    //     "B09QLNujzaGh6zt7": "Compendium.world.ddb-test2-ddb-feats.Item.cHie2wNgxBG9m62F"
    //   }
    // }
    const advancement = klass.system.advancement[advancementIndex];
    const aData = ddbClass._advancementMatches.features[advancement._id];
    const feats = {};

    if (!aData || !advancement) {
      logger.debug(`Advancement for ${klass.name} (idx ${advancementIndex}) missing required data for linking ${advancement?.type}`, {
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
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.advancementOrigin", `${klass._id}.${advancement._id}`);
      }
    }

    if (Object.keys(feats).length > 0) {
      klass.system.advancement[advancementIndex].value = {
        type: "feat",
        feat: feats,
      };
    }
  }

  linkFeatures() {
    logger.debug("Linking Advancements to Features", {
      CharacterClassFactory: this,
    });
    for (const klass of this.ddbCharacter.data.classes) {
      const ddbClass = this.ddbClasses[klass.name];
      logger.debug("Linking Advancements to Features for Class", {
        klass,
        ddbClass,
      });

      for (let idx = 0; idx < klass.system.advancement.length; idx++) {
        const a = klass.system.advancement[idx];
        if (a.type === "ItemGrant" && a.level <= ddbClass.ddbClass.level) {
          this.#itemGrantLink(ddbClass, klass, idx);
        } else if (a.type === "AbilityScoreImprovement" && a.value.type === "feat") {
          this.#abilityScoreFeatLink(ddbClass, klass, idx);
        }
      }
      logger.debug(`Processed ${klass.name} class advancements`, klass.system.advancement);
    };
  }
}
