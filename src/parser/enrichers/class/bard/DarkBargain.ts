import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class DarkBargain extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Gain the benefits of your chosen Eldritch Invocation for 10 minutes, taking Necrotic damage equal to the Bardic Inspiration die roll.",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: travelersTrickDie(this.ddbEnricher.isClass2014("Bard")),
          name: "Necrotic damage taken",
        },
      },
    };
  }

}
