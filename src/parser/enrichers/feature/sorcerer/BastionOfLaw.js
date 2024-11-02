/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class BastionOfLaw extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      addItemConsume: true,
      itemConsumeTargetName: "Font of Magic: Sorcery Points",
      addScalingMode: "amount",
      addConsumptionScalingMax: "5",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d8",
          name: "Roll Law Dice",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Font of Magic", type: "class" } },
    ];

  }


  get override() {
    return {
      replaceActivityUses: true,
    };
  }

  get effect() {
    return {
      name: "Bastion of Law",
    };
  }

}
