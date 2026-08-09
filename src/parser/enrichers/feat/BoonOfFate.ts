import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfFate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Improve Fate",
      addItemConsume: true,
      targetType: "creature",
      activationType: "special",
      activationCondition: "Failed d20 test",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        roll: {
          prompt: false,
          visible: true,
          formula: "2d4",
          name: "Roll Fate Dice",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "lr", type: "recoverAll", formula: undefined },
        ],
      },
      retainUseSpent: true,
    };
  }

}
