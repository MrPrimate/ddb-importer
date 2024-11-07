/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BoonOfFate extends DDBEnricherMixin {

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
          spent: 0,
          max: 1,
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
