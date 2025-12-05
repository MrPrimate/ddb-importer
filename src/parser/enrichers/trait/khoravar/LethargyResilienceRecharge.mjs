/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class LethargyResilienceRecharge extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          name: "Days till Recharge",
          formula: "1d4",
        },
      },
    };
  }

  get override() {
    return {
      data: {
        system: {
          uses: {
            max: 1,
            spent: 0,
            recovery: [],
          },
        },
      },
    };
  }

}
