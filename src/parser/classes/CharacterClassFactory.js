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


  // "flags": {
  //   "dnd5e": {
  //     "sourceId": "Compendium.dnd5e.classfeatures.Item.jTXHaK0vvT5DV3uO",
  //     "advancementOrigin": "hRWd6muKtSmlop3n.SikU7aSV7VqT2FPB"
  //   }
  // },

  linkFeatures() {
    console.warn("this", {
      this: this
    })
    this.ddbCharacter.data.classes.forEach((klass) => {
      console.warn("klass", klass)
      const ddbClass = this.ddbClasses[klass.name];
      console.warn("ddbclass", ddbClass)
      klass.system.advancement.forEach((a) => {
        if (a.type === "ItemGrant" && a.level <= ddbClass.ddbClass.level) {
          // "added": {
          //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
          //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
          // }
          const aData = ddbClass._advancementMatches.features[a._id];
          const added = {};
          for (const [advancementFeatureName, uuid] of Object.entries(aData)) {
            const feature = this.ddbCharacter.data.actions.find((f) => {
              const name = f.flags.ddbimporter?.originalName ?? f.name;
              return name === advancementFeatureName;
            }) ?? this.ddbCharacter.data.features.find((f) => {
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
