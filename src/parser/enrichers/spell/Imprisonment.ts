import DDBEnricherData from "../data/DDBEnricherData";

/**
 * DDB tags the Chaining form Restrained and the Slumber form Incapacitated, but Slumber leaves the
 * target Unconscious. The effects are named for their forms so the GM picks the one chosen.
 */
export default class Imprisonment extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Imprisonment: Chaining",
        statuses: ["Restrained"],
        options: { durationSeconds: null },
      },
      {
        name: "Imprisonment: Slumber",
        statuses: ["Unconscious"],
        options: { durationSeconds: null },
      },
    ];
  }

}
