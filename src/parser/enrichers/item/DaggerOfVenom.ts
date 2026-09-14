import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dagger of Venom: Poisoned for 1 minute on the parser's poison-coated attack.
 */
export default class DaggerOfVenom extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        activityMatch: "Restricted Attack: DC 15 Constitution Save Negates",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
