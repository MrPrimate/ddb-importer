import DDBEnricherData from "../../data/DDBEnricherData";

export default class SoulBladesHomingStrikes extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Homing Strikes",
      // no action: added to an attack roll that missed
      activationType: "special",
      activationCondition: "You miss with a Psychic Blade attack",
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
