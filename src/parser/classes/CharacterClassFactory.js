/* eslint-disable no-await-in-loop */
import DDBClass from "./DDBClass.js";
import logger from '../../logger.js';
import DDBSubClass from "./DDBSubClass.js";

export default class DDBClassFactory {

  static async processCharacter(ddb, character) {
    const documents = [];
    for (const characterClass of ddb.character.classes) {
      const ddbClass = new DDBClass(ddb, characterClass.definition.id);
      await ddbClass.generateFromCharacter(character);
      documents.push(deepClone(ddbClass.data));

      if (characterClass.subclassDefinition && characterClass.subclassDefinition.name) {
        const ddbSubClass = new DDBSubClass(ddb, characterClass.definition.id);
        await ddbSubClass.generateFromCharacter(character);
        documents.push(deepClone(ddbSubClass.data));
      }
    }

    logger.debug(`Processed ${documents.length} classes`, { documents });

    return documents;
  }

}
