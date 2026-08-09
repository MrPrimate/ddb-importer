import DDBEnricherData from "../../data/DDBEnricherData";

export default class CreateMagnificentFeast extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get addToDefaultAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Eat Food",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateActivation: true,
          generateHealing: true,
          generateTarget: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "2d4 + @classes.cleric.levels",
            types: ["healing"],
          }),
        },
      },
    ];
  }

}
