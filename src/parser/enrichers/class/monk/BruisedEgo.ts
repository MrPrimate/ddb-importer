import DDBEnricherData from "../../data/DDBEnricherData";

export default class BruisedEgo extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You expend a Focus Point",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "max(@abilities.wis.mod, 1)",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          data: {
            name: "Bruised Ego (Bloodied)",
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "max(2 * @abilities.wis.mod, 2)",
              types: ["temphp"],
            }),
          },
        },
      },
    ];
  }

}
