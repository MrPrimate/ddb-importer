/* eslint-disable no-await-in-loop */
import DDBClass from "./DDBClass.js";
import logger from '../../logger.js';
import DDBSubClass from "./DDBSubClass.js";

export default class CharacterClassFactory {

  constructor(ddb) {
    this.ddb = ddb;
    this.character = this.ddb.raw.character;
    this.source = this.ddb.source.ddb;
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
        documents.push(deepClone(ddbSubClass.data));
      }
    }

    logger.debug(`Processed ${documents.length} classes`, { documents });

    return documents;
  }


  linkFeatures() {
    this.data.classes.forEach((klass) => {
      const ddbClass = this.this.ddbClasses[klass.name];
      klass.system.advancements.forEach((a) => {
        if (a.type === "ItemGrant" && a.level <= this.ddbClassDefinition.level) {
          // "added": {
          //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
          //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
          // }
          const aData = ddbClass._advancementMatches.features[a._id];
          const added = {};
          for (const [advancementFeatureName, uuid] of Object.entries(aData)) {
            const feature = this.ddb.data.actions.find((f) => {
              const name = f.flags.ddbimporter?.originalName ?? f.name;
              return name === advancementFeatureName;
            });
            if (feature) {
              added[feature._id] = uuid;
            }
          }
          a.value = {
            added,
          };
        }
      });
    });
  }

}
