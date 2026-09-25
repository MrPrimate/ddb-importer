import DDBEnricherData from "../../data/DDBEnricherData";

export default class Neurotoxin extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Paralyzed",
        statuses: ["Paralyzed"],
        activityMatch: "Neurotoxin: Toxin Effects",
        options: {
          // "Paralyzed until the start of its next turn" - anchored on the poisoned creature
          expiry: "targetStart",
          description: "Paralyzed until the start of its next turn.",
        },
      },
    ];
  }

}
