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
  ddbCharacter: DDBCharacter;
  character: I5ePCData;
  ddbClasses: Record<string, DDBClass | DDBSubClass>;
  originalClass: string | null;

  constructor(ddbCharacter: DDBCharacter, options: ICharacterClassFactoryOptions = {}) {
    const { addToCompendium, compendiumImportTypes, updateCompendiumItems, collectOnly } = options;
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

  #itemGrantLink(ddbClass: DDBClass | DDBSubClass, klass: I5eClassItem, id: string) {
    // "added": {
    //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
    //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
    // }
    const advancement = klass.system.advancement[id];
    const aData = ddbClass._advancementMatches.features[id];
    const added = {};

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

      const characterFeature = this.ddbCharacter.getDataFeature(advancementFeatureName, { hints: [klass.name] });
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
      klass.system.advancement[id] = advancement;
    }
  }

  #abilityScoreFeatLink(ddbClass: DDBClass | DDBSubClass, klass: I5eClassItem, id: string) {
    // "value": {
    //   "type": "feat",
    //   "feat": {
    //     "B09QLNujzaGh6zt7": "Compendium.world.ddb-test2-ddb-feats.Item.cHie2wNgxBG9m62F"
    //   }
    // }
    const advancement = klass.system.advancement[id];
    const aData = ddbClass._advancementMatches.features[id];
    const feats = {};

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

      const characterFeature = this.ddbCharacter.getDataFeature(advancementFeatureName, { hints: [klass.name] });
      if (characterFeature) {
        logger.debug(`Ability Score Advancement ${advancement._id} found Feat ${advancementFeatureName} (${uuid})`);
        feats[characterFeature._id] = uuid;
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.sourceId", uuid);
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.advancementOrigin", `${klass._id}.${advancement._id}`);
      }
    }

    if (Object.keys(feats).length > 0) {
      klass.system.advancement[id].value = {
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

      for (const [id, a] of Object.entries(klass.system.advancement)) {
        if (a.type === "ItemGrant" && a.level <= ddbClass.ddbClass.level) {
          this.#itemGrantLink(ddbClass, klass, id);
        } else if (a.type === "AbilityScoreImprovement" && a.value.type === "feat") {
          this.#abilityScoreFeatLink(ddbClass, klass, id);
        }
      }
      logger.debug(`Processed ${klass.name} class advancements`, klass.system.advancement);
    };
  }
}
