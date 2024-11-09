import { logger } from "../../lib/_module.mjs";
import { DDBInfusion } from "./DDBInfusion.js";

export class DDBInfusionFactory {

  constructor(ddbCharacter) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbCharacter.source.ddb;
    this.rawCharacter = ddbCharacter.raw.character;

    this.processed = {
      actions: [],
      infusions: [],
    };

    this.infusionCount = {

    };
  }


  _getInfusionCount(name) {
    if (!this.infusionCount[name]) {
      this.infusionCount[name] = 0;
    }
    return ++this.infusionCount[name];
  }

  updateIds(type) {
    this.ddbCharacter.updateItemIds(this.processed[type]);
  }

  async processInfusions() {
    logger.debug("Parsing infusions");
    for (const infusion of (foundry.utils.getProperty(this.ddbData, "infusions.infusions.definitionData") ?? [])) {
      const infusionNum = Number.parseInt(this._getInfusionCount(infusion.name));
      const addToCompendium = infusionNum === 1;
      // console.warn(`Infusion ${infusionNum}: ${infusion.name}`, {
      //   addToCompendium,
      // });
      const ddbInfusion = new DDBInfusion({
        ddbData: this.ddbData,
        ddbInfusion: infusion,
        rawCharacter: this.rawCharacter,
        nameIdPostfix: infusionNum > 1 ? infusionNum : null,
        addToCompendium,
      });
      await ddbInfusion.build();
      logger.debug(`DDBInfusion: ${ddbInfusion.ddbInfusion.name}`, {
        ddbInfusion,
        infusion,
        this: this,
      });
      this.processed.infusions.push(ddbInfusion.data);
      this.processed.actions.push(...ddbInfusion.actions);
    }
    this.updateIds("infusions");
    this.updateIds("actions");
  }

}
