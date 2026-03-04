import DDBEnricherData from "../../data/DDBEnricherData";

export default class FlashOfGenius extends DDBEnricherData {

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
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

  get override(): IDDBOverrideData {
    if (this.is2014) return {};
    if (!this.ddbParser.isMuncher) return {};
    return {
      uses: {
        recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
      },
    };
  }

}
