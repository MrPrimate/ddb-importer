import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspirationalDance extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "The target can immediately take a Reaction to move up to its Speed without provoking Opportunity Attacks, or take the Dodge action.",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "max(2, @scale.bard.inspiration + @abilities.cha.mod)",
          types: ["temphp"],
        }),
      },
    };
  }

}
