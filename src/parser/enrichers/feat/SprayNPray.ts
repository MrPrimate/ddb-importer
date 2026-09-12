import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A single use activity; the extra attacks come at the cost of accuracy, so the
 * penalty is an effect that lapses at the end of the current turn.
 */
export default class SprayNPray extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spray 'n' Pray: 2 Attacks",
        options: {
          // the -5 penalty is on the shooter for their own turn
          expiry: "turnEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-5", 20, "system.rolls.attack.rwak.bonus"),
        ],
      },
    ];
  }

}
