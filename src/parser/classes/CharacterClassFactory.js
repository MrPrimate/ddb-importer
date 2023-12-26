/* eslint-disable no-await-in-loop */
import DDBClass from "./DDBClass.js";
import logger from '../../logger.js';
import DDBSubClass from "./DDBSubClass.js";
import utils from "../../lib/utils.js";

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
      documents.push(deepClone(ddbClass.data));

      if (characterClass.subclassDefinition && characterClass.subclassDefinition.name) {
        const ddbSubClass = new DDBSubClass(this.source, characterClass.definition.id);
        await ddbSubClass.generateFromCharacter(this.character);
        this.ddbClasses[ddbSubClass.data.name] = ddbSubClass;
        documents.push(deepClone(ddbSubClass.data));
      }
    }

    logger.debug(`Processed ${documents.length} classes`, { documents });

    return documents;
  }

  _getCharacterFeature(featureName) {
    for (const featureType of ["actions", "features"]) {
      const index = this.ddbCharacter.data[featureType].findIndex((f) => {
        const name = f.flags.ddbimporter?.originalName ?? f.name;
        const isCustomAction = f.flags.ddbimporter?.isCustomAction ?? false;
        return utils.nameString(name) === utils.nameString(featureName) && !isCustomAction;
      });
      if (index !== -1) {
        logger.debug(`Found ${featureType} : ${featureName}`);
        return this.ddbCharacter.data[featureType][index];
      }
    }
    return undefined;
  }

  linkFeatures() {
    logger.debug("Linking Advancements to Features", {
      CharacterClassFactory: this,
    });
    this.ddbCharacter.data.classes.forEach((klass) => {
      const ddbClass = this.ddbClasses[klass.name];
      logger.debug("Linking Advancements to Features for Class", {
        klass,
        ddbClass,
      });
      klass.system.advancement.forEach((a, idx, advancements) => {
        if (a.type === "ItemGrant" && a.level <= ddbClass.ddbClass.level) {
          // "added": {
          //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
          //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
          // }
          const aData = ddbClass._advancementMatches.features[a._id];
          const added = {};
          for (const [advancementFeatureName, uuid] of Object.entries(aData)) {
            logger.debug(`Advancement ${a._id} searching for Feature ${advancementFeatureName} (${uuid})`, {
              a,
              ddbClass,
              advancementFeatureName,
              uuid,
            });

            const characterFeature = this._getCharacterFeature(advancementFeatureName);
            if (characterFeature) {
              logger.debug(`Advancement ${a._id} found Feature ${advancementFeatureName} (${uuid})`);
              added[characterFeature._id] = uuid;
              setProperty(characterFeature, "flags.dnd5e.sourceId", uuid);
              setProperty(characterFeature, "flags.dnd5e.advancementOrigin", `${klass._id}.${a._id}`);
            }
          }

          if (Object.keys(added).length > 0) {
            a.value = {
              added,
            };
            advancements[idx] = a;
          }
        }
      });
      console.warn("Processed class advancements", klass.system.advancement);

      // TODO: choose ability score advancement data here for feats chosen
    });
  }

}
