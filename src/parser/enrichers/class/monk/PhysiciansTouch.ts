import DDBEnricherData from "../../data/DDBEnricherData";

export default class PhysiciansTouch extends DDBEnricherData {
  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        activitiesMatch: ["Hand of Harm"],
      },
    ];
  }
}
