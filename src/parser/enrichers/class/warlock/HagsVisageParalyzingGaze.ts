import DDBEnricherData from "../../data/DDBEnricherData";

export default class HagsVisageParalyzingGaze extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hag's Visage: Paralyzed",
        activityMatch: "Hag's Visage: Paralyzing Gaze",
        statuses: ["Paralyzed"],
        options: {
          description: "Paralyzed by the Hag's Visage Paralyzing Gaze (on a failed save only; on a success the creature takes Necrotic damage equal to the warlock's level instead).",
        },
      },
    ];
  }

}
