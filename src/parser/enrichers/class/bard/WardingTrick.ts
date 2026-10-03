import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class WardingTrick extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "The ward lasts for as long as you maintain Concentration, up to 10 minutes.",
        },
        range: {
          value: 60,
          units: "ft",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `${travelersTrickDie(this.ddbEnricher.isClass2014("Bard"))} + max(1, @abilities.wis.mod)`,
          types: ["temphp"],
        }),
      },
    };
  }

}
