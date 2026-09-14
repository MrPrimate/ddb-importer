import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Assassin's Blood: Poisoned for 24 hours on a failed save.
 */
export default class AssassinsBlood extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 86400,
        },
      },
    ];
  }

}
