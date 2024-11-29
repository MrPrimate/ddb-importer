/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsiBolsteredKnack extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Additional Bonus",
        },
      },
    };
  }

}
