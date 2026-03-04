import DDBEnricherData from "../../data/DDBEnricherData";

export default class BastionOfLaw extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "creature",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Font of Magic", type: "class" } },
    ];

  }

  get effects() {
    return [{
      name: "Bastion of Law",
    }];
  }

}
