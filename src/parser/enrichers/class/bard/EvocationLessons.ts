import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class EvocationLessons extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You cast your chosen damage-dealing spell",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Change the spell's damage type to Acid, Cold, Fire, Lightning, or Thunder and add the rolled bonus to its damage.",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: `${travelersTrickDie(this.ddbEnricher.isClass2014("Bard"))} + max(1, @abilities.wis.mod)`,
          name: "Bonus spell damage",
        },
      },
    };
  }

}
