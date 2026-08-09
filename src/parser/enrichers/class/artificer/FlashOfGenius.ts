import DDBEnricherData from "../../data/DDBEnricherData";

export default class FlashOfGenius extends DDBEnricherData {

  override get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
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

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get override(): IDDBOverrideData {
    if (this.is2014) return {};
    if (!this.ddbParser.isMuncher) return {};
    return {
      uses: {
        recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
      },
    };
  }

}
