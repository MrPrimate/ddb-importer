/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverPrecisionAttack extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.battle-master.combat-superiority-die",
          name: "Add to Attack Roll",
        },
      },
    };
  }

}
