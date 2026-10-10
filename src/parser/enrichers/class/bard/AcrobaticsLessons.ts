import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class AcrobaticsLessons extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You or an ally within 60 ft makes a Dexterity saving throw",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          value: 60,
          units: "ft",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: travelersTrickDie(this.ddbEnricher.isClass2014("Bard")),
          name: "Bonus to saving throw",
        },
      },
    };
  }

}
