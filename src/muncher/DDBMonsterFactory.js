import logger from "../logger.js";
import DDBMonster from "../parser/DDBMonster.js";


export default class DDBMonsterFactory {

  constructor (ddbData, extra = false) {
    this.monsterData = ddbData;
    this.extra = extra;
    this.npcs = [];
  }

  async parse() {
    let foundryActors = [];
    let failedMonsterNames = [];

    const useItemAC = game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    const addMonsterEffects = game.settings.get("ddb-importer", "munching-policy-add-monster-effects");

    logger.time("Monster Parsing");
    for (const monster of this.monsterData) {
      try {
        logger.debug(`Attempting to parse ${monster.name}`);
        logger.time(`Monster Parse ${monster.name}`);
        const ddbMonster = new DDBMonster(monster, { extra: this.extra, useItemAC, legacyName, addMonsterEffects });
        // eslint-disable-next-line no-await-in-loop
        await ddbMonster.parse();
        foundryActors.push(duplicate(ddbMonster.npc));
        logger.timeEnd(`Monster Parse ${monster.name}`);
        // logger.timeLog("Monster Parsing", monster.name);
      } catch (err) {
        logger.error(`Failed parsing ${monster.name}`);
        logger.error(err);
        logger.error(err.stack);
        failedMonsterNames.push(monster.name);
      }
    }

    const result = {
      actors: await Promise.all(foundryActors),
      failedMonsterNames: failedMonsterNames,
    };

    logger.timeEnd("Monster Parsing");

    this.npcs = result;
    return result;
  }
}
