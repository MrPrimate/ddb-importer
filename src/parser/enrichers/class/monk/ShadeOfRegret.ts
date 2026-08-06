import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class ShadeOfRegret extends DDBEnricherData<DDBClassFeatureEnricher> {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Create Shade of Regret", type: "class" },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
        },
      },
      {
        action: { name: "Dismiss Shade of Regret", type: "class" },
        overrides: {
          noConsumeTargets: true,
        },
      },
      {
        action: { name: "Move Shade", type: "class" },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shade of Regret",
        options: {
          durationRounds: 1,
          durationSeconds: 6,
          description: "The shade is intangible and doesn't occupy its space. It lasts until the end of your next turn, but ends early if you dismiss it (no action required) or have the Incapacitated condition. Flurry of Blows attacks can originate from the shade, dealing Necrotic or Force damage (your choice).",
        },
        activitiesMatch: ["Create Shade of Regret"],
      },
    ];
  }

}
