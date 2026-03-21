import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBInfusion, IDDBSupportedInfusionDocuments } from "./DDBInfusion";

export class DDBInfusionFactory {
  ddbCharacter: DDBCharacter;
  ddbData: IDDBData;
  rawCharacter: I5ePCData;
  infusionCount: Record<string, number>;
  processed: {
    activityActions: IDDBSupportedInfusionDocuments[];
    actions: IDDBSupportedInfusionDocuments[];
    infusions: IDDBSupportedInfusionDocuments[];
  };

  constructor(ddbCharacter: DDBCharacter) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbCharacter.source.ddb;
    this.rawCharacter = ddbCharacter.raw.character;

    this.processed = {
      activityActions: [],
      actions: [],
      infusions: [],
    };

    this.infusionCount = {};
  }


  _getInfusionCount(name: string): number {
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
    for (const infusion of (foundry.utils.getProperty(this.ddbData, "infusions.infusions.definitionData") as IDDBInfusionDefinition[] ?? [])) {
      const infusionNum = this._getInfusionCount(infusion.name);
      const addToCompendium = infusionNum === 1;
      // console.warn(`Infusion ${infusionNum}: ${infusion.name}`, {
      //   addToCompendium,
      // });
      const ddbInfusion = new DDBInfusion({
        ddbData: this.ddbData,
        ddbInfusion: infusion,
        rawCharacter: this.rawCharacter,
        nameIdPostfix: infusionNum > 1 ? String(infusionNum) : null,
        addToCompendium,
        isMuncher: this.ddbCharacter.isMuncher,
      });
      await ddbInfusion.build();
      logger.debug(`DDBInfusion: ${ddbInfusion.ddbInfusion.name}`, {
        ddbInfusion,
        infusion,
        this: this,
      });
      this.processed.infusions.push(ddbInfusion.data);
      this.processed.actions.push(...ddbInfusion.actionsToAddToCompendium);
      this.processed.activityActions.push(...ddbInfusion.actions);
    }
    this.updateIds("infusions");
    this.updateIds("actions");
  }

}
