import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Gloves of Swimming and Climbing: +5 to Strength (Athletics) checks for climbing and swimming.
 */
export default class GlovesOfSwimmingAndClimbing extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("5", 20, "system.skills.ath.bonuses.check"),
        ],
        options: {
          transfer: true,
          description: "+5 bonus applies only to Athletics checks made to climb or swim.",
        },
      },
    ];
  }

}
