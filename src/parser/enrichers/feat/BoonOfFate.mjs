/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BoonOfFate extends DDBEnricherData {

  get type() {
    return "utility";
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
      data: {
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
        "system.uses": {
          spent: null,
          max: "1",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
