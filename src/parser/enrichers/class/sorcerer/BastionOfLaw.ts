import DDBEnricherData from "../../data/DDBEnricherData";

export default class BastionOfLaw extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Font of Magic", type: "class" } },
    ];

  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Bastion of Law",
    }];
  }

}
