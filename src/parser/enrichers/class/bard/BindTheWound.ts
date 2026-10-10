import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class BindTheWound extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "You or an ally within 5 ft of you receives healing",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `${travelersTrickDie(this.ddbEnricher.isClass2014("Bard"))} + max(1, @abilities.wis.mod)`,
          types: ["healing"],
        }),
      },
    };
  }

}
