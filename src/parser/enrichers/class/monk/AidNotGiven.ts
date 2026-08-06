import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class AidNotGiven extends DDBEnricherData<DDBClassFeatureEnricher> {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Help (Bonus Action)", type: "class" },
        overrides: {
          noConsumeTargets: true,
        },
      },
      {
        action: { name: "Aid Not Given: Heal", type: "class" },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
        },
      },
    ];
  }

}
