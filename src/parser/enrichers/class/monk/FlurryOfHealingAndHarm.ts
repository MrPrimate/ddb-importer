import DDBEnricherData from "../../data/DDBEnricherData";

export default class FlurryOfHealingAndHarm extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      // {
      //   action: {
      //     name: "Flurry of Healing and Harm",
      //     type: "class",
      //     rename: ["Spend resource"],
      //   },
      //   overrides: {
      //     activationType: "special",
      //     activationCondition: "When you use Flurry of Blows",
      //   },
      // },
      {
        action: {
          name: "Hand of Healing",
          type: "class",
          rename: ["Hand of Healing (free use)"],
        },
        overrides: {
          noConsumeTargets: true,
          // DDB's Hand of Healing action is a Magic action; this use replaces an Unarmed Strike of Flurry of Blows
          activationType: "special",
          activationCondition: "Replaces an Unarmed Strike of Flurry of Blows",
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
