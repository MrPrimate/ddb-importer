import DDBEnricherData from "../../data/DDBEnricherData";

export default class CosmicOmen extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d6",
          name: "Weal or Woe Roll",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "@abilities.wis.mod",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
      retainOriginalConsumption: true,
    };
  }

}
