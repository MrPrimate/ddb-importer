import DDBEnricherData from "../../data/DDBEnricherData";

export default class CosmicOmen extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get override(): IDDBOverrideData {
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
