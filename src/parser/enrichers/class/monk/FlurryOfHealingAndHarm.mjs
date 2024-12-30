/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlurryOfHealingAndHarm extends DDBEnricherData {

  get additionalActivities() {
    if (this.isAction) return [];
    return [
      {
        action: {
          name: "Flurry of Healing and Harm",
          type: "class",
          rename: ["Spend resource"],
        },
        overrides: {
          activationType: "special",
          activationCondition: "When you use Flurry of Blows",
        },
      },
      {
        action: {
          name: "Hand of Healing",
          type: "class",
          rename: ["Hand of Healing (free use)"],
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
      {
        action: {
          name: "Hand of Harm",
          type: "class",
          rename: ["Hand of Harm (free use)"],
        },
        overrides: {
          noConsumeTargets: true,
          activationCondition: "1/turn",
        },
      },
    ];
  }

}
