import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dagger of Venom: Poisoned for 1 minute on the parser's poison-coated attack.
 */
export default class DaggerOfVenom extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        // the 2014 payload names the coated attack, the 2024 one builds a plain "Save"
        activitiesMatch: ["Restricted Attack: DC 15 Constitution Save Negates", "Save"],
        statuses: ["Poisoned"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
    ];
  }

}
