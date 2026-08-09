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
          durationRounds: 1,
          description: "Paralyzed until the start of its next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
