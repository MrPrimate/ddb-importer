import DDBEnricherData from "../../data/DDBEnricherData";

export default class PhysiciansTouch extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        activitiesMatch: ["Hand of Harm"],
      },
    ];
  }
}
