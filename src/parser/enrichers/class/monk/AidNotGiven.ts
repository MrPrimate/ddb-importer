import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class AidNotGiven extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
          itemConsumeTargetName: this.ddbEnricher.isClass2014("Monk") ? "Ki" : "Monk's Focus",
        },
      },
    ];
  }

}
