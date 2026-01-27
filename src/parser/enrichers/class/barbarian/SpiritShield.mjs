/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlashOfGenius extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
      data: {
        roll: {
          name: "Reduce Damage",
          formula: "@scale.ancestral-guardian.spirit-shield",
        },
      },
    };
  }

}
