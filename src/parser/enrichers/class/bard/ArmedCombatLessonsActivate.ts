import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class ArmedCombatLessonsActivate extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You make a weapon attack",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Add your Bardic Inspiration die to the attack or damage roll, and gain the benefits of your chosen Fighting Style for 10 minutes.",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: travelersTrickDie(this.ddbEnricher.isClass2014("Bard")),
          name: "Bonus to attack or damage roll",
        },
      },
    };
  }

}
