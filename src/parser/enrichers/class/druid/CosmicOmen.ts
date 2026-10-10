import DDBEnricherData from "../../data/DDBEnricherData";

export default class CosmicOmen extends DDBEnricherData {

  // the options are modelled on this feature, so DDB's options are not built as documents
  override get noChoiceBuild(): boolean {
    return true;
  }

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
      retainUseSpent: true,
    };
  }

}
