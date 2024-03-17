/* eslint-disable no-await-in-loop */
import DDBClass from "./DDBClass.js";
import logger from '../../logger.js';
import DDBSubClass from "./DDBSubClass.js";

export default class CharacterClassFactory {

  constructor(ddbCharacter) {
    this.ddbCharacter = ddbCharacter;
    this.character = this.ddbCharacter.raw.character;
    this.source = this.ddbCharacter.source.ddb;
    this.ddbClasses = {
    };
  }

  async processCharacter() {
    const documents = [];
    for (const characterClass of this.source.character.classes) {
      const ddbClass = new DDBClass(this.source, characterClass.definition.id);
      await ddbClass.generateFromCharacter(this.character);
      this.ddbClasses[ddbClass.data.name] = ddbClass;
      documents.push(foundry.utils.deepClone(ddbClass.data));

      if (characterClass.subclassDefinition && characterClass.subclassDefinition.name) {
        const ddbSubClass = new DDBSubClass(this.source, characterClass.definition.id);
        await ddbSubClass.generateFromCharacter(this.character);
        this.ddbClasses[ddbSubClass.data.name] = ddbSubClass;
        documents.push(foundry.utils.deepClone(ddbSubClass.data));
      }
    }

    logger.debug(`Processed ${documents.length} classes`, { documents });
    this.ddbCharacter.updateItemIds(documents);

    return documents;
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
      logger.warn(`Advancement for ${klass.name} (idx ${advancementIndex}) missing required data for linking`, {
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
      // eslint-disable-next-line require-atomic-updates
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
