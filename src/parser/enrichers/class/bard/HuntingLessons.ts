import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class HuntingLessons extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Mark a creature you can see within 90 ft as your quarry; while you concentrate (up to 1 hour), your weapon attacks against it deal extra damage equal to your Bardic Inspiration die.",
        },
        range: {
          value: 90,
          units: "ft",
        },
        duration: {
          units: "hour",
          value: "1",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: travelersTrickDie(this.ddbEnricher.isClass2014("Bard")),
          name: "Extra weapon damage vs quarry",
        },
      },
    };
  }

}
