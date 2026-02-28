import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfFate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Improve Fate",
      addItemConsume: true,
      targetType: "creature",
      activationType: "special",
      activationCondition: "Failed d20 test",
      data: {
        range: {
          units: "feet",
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

  get override() {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "lr", type: 'recoverAll', formula: undefined },
        ],
      },
      retainUseSpent: true,
    };
  }

}
