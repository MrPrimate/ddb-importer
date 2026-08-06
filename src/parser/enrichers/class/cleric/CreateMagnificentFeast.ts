import DDBEnricherData from "../../data/DDBEnricherData";

export default class CreateMagnificentFeast extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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
