/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlashOfGenius extends DDBEnricherData {

  get type() {
    return this.isAction ? "utility" : "none";
  }

  get activity() {
    if (!this.isAction) return {};
    return {
      activationType: "reaction",
      data: {
        roll: {
          name: "Bonus Roll",
          formula: "max(@abilities.int.mod,1)",
        },
      },
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override() {
    if (this.is2014) return {};
    if (!this.ddbParser.isMuncher) return {};
    return {
      data: {
        "system.uses.recovery": [{ period: "lr", type: 'recoverAll', formula: undefined }],
      },
    };
  }

}
