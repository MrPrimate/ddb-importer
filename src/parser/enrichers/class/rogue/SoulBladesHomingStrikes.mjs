/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SoulBladesHomingStrikes extends DDBEnricherData {

  get activity() {
    return {
      name: "Homing Strikes",
      data: {
        img: "systems/dnd5e/icons/svg/damage/force.svg",
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Attack Bonus",
        },
      },
    };
  }

}
