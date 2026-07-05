import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class MasteryOfDeath extends DDBEnricherData<DDBClassFeatureEnricher> {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "1",
          types: ["healing"],
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
