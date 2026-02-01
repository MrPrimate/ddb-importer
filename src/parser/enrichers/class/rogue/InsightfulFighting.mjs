/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InsightfulFighting extends DDBEnricherData {

  get type() {
    return "check";
  }

  get activity() {
    return {
      name: "Insight Check",
      targetType: "self",
      activationType: "bonus",
      data: {
        check: {
          associated: ["ins"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "vs Deception Check",
          activationType: "special",
          targetType: "creature",
          data: {
            check: {
              associated: ["dec"],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Insightful Fighting: Target",
        activityMatch: "No Match",
        options: {
          durationSeconds: 60,
          durationRounds: 10,
          description: "You can use sneak attack against the target even if you don’t have advantage on the attack roll.",
        },
      },
    ];
  }


}
