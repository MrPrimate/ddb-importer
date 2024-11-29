/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FightingStyleInterception extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        target: {
          "affects.type": "creature",
          template: {},
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10 + @prof",
          name: "Reduce Damage Roll",
        },
      },
    };
  }
}
