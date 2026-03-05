import DDBEnricherData from "../../data/DDBEnricherData";

export default class HillsTumble extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Prone"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: this.ddbParser.originalName,
        max: "@prof",
        period: "lr",
      }),
    };
  }
}
