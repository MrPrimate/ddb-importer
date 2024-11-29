/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PhysiciansTouch extends DDBEnricherData {
  get additionalActivities() {
    return [
      {
        action: {
          name: "Hand of Healing",
          type: "class",
          rename: ["Hand of Healing"],
        },
      },
      {
        action: {
          name: "Hand of Harm",
          type: "class",
          rename: ["Hand of Harm"],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        data: {
          "flags.ddbimporter.activitiesMatch": ["Hand of Harm"],
        },
      },
    ];
  }
}
