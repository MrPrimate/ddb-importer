import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dagger of Venom: Poisoned for 1 minute on the parser's poison-coated attack.
 */
export default class DaggerOfVenom extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        // both printings build a plain "Save"; the legacy payload's restricted poison modifier is
        // folded into it rather than kept as a second attack
        activityMatch: "Save",
        statuses: ["Poisoned"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
    ];
  }

}
